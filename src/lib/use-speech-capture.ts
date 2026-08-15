import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string; message?: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported() {
  return getSpeechRecognitionConstructor() !== null;
}

type UseSpeechCaptureOptions = {
  lang?: string;
  onFinalTranscript?: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  onError?: (message: string) => void;
};

export function useSpeechCapture({
  lang = "en-US",
  onFinalTranscript,
  onInterimTranscript,
  onError,
}: UseSpeechCaptureOptions = {}) {
  const supported = isSpeechRecognitionSupported();
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const holdActiveRef = useRef(false);
  const finalPartsRef = useRef<string[]>([]);

  const stopRecognition = useCallback(() => {
    holdActiveRef.current = false;
    recognitionRef.current?.stop();
  }, []);

  const startRecognition = useCallback(() => {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor || holdActiveRef.current) return;

    holdActiveRef.current = true;
    finalPartsRef.current = [];
    setInterimTranscript("");

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const chunk = result?.[0]?.transcript?.trim();
        if (!chunk) continue;
        if (result.isFinal) {
          finalPartsRef.current.push(chunk);
        } else {
          interim = interim ? `${interim} ${chunk}` : chunk;
        }
      }
      setInterimTranscript(interim);
      onInterimTranscript?.(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      onError?.(event.message || event.error);
    };

    recognition.onend = () => {
      setListening(false);
      setInterimTranscript("");
      recognitionRef.current = null;
      holdActiveRef.current = false;

      const transcript = finalPartsRef.current.join(" ").replace(/\s+/g, " ").trim();
      finalPartsRef.current = [];
      if (transcript) onFinalTranscript?.(transcript);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      holdActiveRef.current = false;
      setListening(false);
      onError?.("Could not start microphone");
    }
  }, [lang, onError, onFinalTranscript, onInterimTranscript]);

  useEffect(() => {
    return () => {
      holdActiveRef.current = false;
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  return {
    supported,
    listening,
    interimTranscript,
    startRecognition,
    stopRecognition,
  };
}
