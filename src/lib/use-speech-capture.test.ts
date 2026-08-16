import { describe, expect, it, vi, afterEach } from "vitest";
import {
  getSpeechRecognitionConstructor,
  isSpeechRecognitionSupported,
} from "./use-speech-capture";

describe("speech recognition support detection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null without a browser window (SSR)", () => {
    expect(getSpeechRecognitionConstructor()).toBeNull();
    expect(isSpeechRecognitionSupported()).toBe(false);
  });

  it("detects webkitSpeechRecognition after mount in Chromium", () => {
    class MockRecognition {}
    vi.stubGlobal("window", {
      webkitSpeechRecognition: MockRecognition,
    });

    expect(getSpeechRecognitionConstructor()).toBe(MockRecognition);
    expect(isSpeechRecognitionSupported()).toBe(true);
  });

  it("prefers SpeechRecognition when both constructors exist", () => {
    class MockSpeechRecognition {}
    class MockWebkit {}
    vi.stubGlobal("window", {
      SpeechRecognition: MockSpeechRecognition,
      webkitSpeechRecognition: MockWebkit,
    });

    expect(getSpeechRecognitionConstructor()).toBe(MockSpeechRecognition);
  });
});

describe("hydration safety", () => {
  it("SSR must not assume speech APIs exist before client mount", () => {
    // useSpeechCapture initializes supported=false and only probes in useEffect.
    // Server HTML must match the first client paint (placeholder shell, not null vs button).
    expect(isSpeechRecognitionSupported()).toBe(false);
  });
});
