import { Mic, Square } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import {
  applyParsedVoiceToForm,
  type ParsedDailyLogVoice,
  parseDailyLogVoiceTranscript,
} from "@/lib/daily-log-voice";
import { useSpeechCapture } from "@/lib/use-speech-capture";
import type { DailyLogWeather } from "@/data/types";
import { cn } from "@/lib/utils";

export type DailyLogVoiceFormState = {
  workDone: string;
  blockers: string;
  crewCount: string;
  hours: string;
  weather: DailyLogWeather;
};

type VoiceLogCaptureProps = {
  form: DailyLogVoiceFormState;
  onFormChange: (next: DailyLogVoiceFormState) => void;
  className?: string;
};

export function VoiceLogCapture({ form, onFormChange, className }: VoiceLogCaptureProps) {
  const handleFinalTranscript = useCallback(
    (transcript: string) => {
      const parsed = parseDailyLogVoiceTranscript(transcript);
      if (!parsed.workDone && !parsed.blockers) {
        toast.message("No speech captured", {
          description: "Hold the mic and speak your field update.",
        });
        return;
      }
      onFormChange(applyParsedVoiceToForm(form, parsed));
      toast.success("Voice captured", {
        description: "Review the fields below before posting.",
      });
    },
    [form, onFormChange],
  );

  const {
    supported,
    mounted,
    listening,
    interimTranscript,
    startRecognition,
    stopRecognition,
  } = useSpeechCapture({
    onFinalTranscript: handleFinalTranscript,
    onError: (message) => {
      toast.error("Voice capture failed", { description: message });
    },
  });

  const showMic = mounted && supported;

  return (
    <div
      className={cn("space-y-2", className)}
      data-testid="voice-log-capture-shell"
      data-voice-ready={showMic ? "true" : "false"}
    >
      {showMic ? (
        <button
          type="button"
          data-testid="voice-log-capture"
          aria-pressed={listening}
          aria-label={listening ? "Release to finish voice capture" : "Hold to talk"}
          className={cn(
            "flex min-h-12 w-full select-none items-center justify-center gap-2 border px-4 text-[14px] font-medium transition-colors touch-none",
            listening
              ? "border-danger bg-danger text-white"
              : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 active:bg-primary/20",
          )}
          onPointerDown={(event) => {
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            startRecognition();
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
            stopRecognition();
          }}
          onPointerLeave={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
            stopRecognition();
          }}
          onPointerCancel={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
            stopRecognition();
          }}
          onContextMenu={(event) => event.preventDefault()}
        >
          {listening ? (
            <>
              <Square className="h-4 w-4 fill-current" strokeWidth={1.75} />
              Release to finish
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" strokeWidth={1.75} />
              Hold to talk
            </>
          )}
        </button>
      ) : (
        <div
          className="min-h-12 w-full"
          aria-hidden={!mounted || !supported}
          data-testid="voice-log-capture-placeholder"
        />
      )}
      {showMic ? (
        listening ? (
          <p className="text-[12px] leading-relaxed text-fg-muted">
            Listening…{" "}
            {interimTranscript ? (
              <span className="text-fg">{interimTranscript}</span>
            ) : (
              "Walk the job and narrate what got done."
            )}
          </p>
        ) : (
          <p className="text-[11px] text-fg-subtle">
            Hold the mic with a gloved thumb — fills What got done and picks up blockers, crew,
            hours, or weather when you say them.
          </p>
        )
      ) : null}
    </div>
  );
}

export type { ParsedDailyLogVoice };
