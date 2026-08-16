import { describe, expect, it } from "vitest";
import {
  applyParsedVoiceToForm,
  mergeVoiceIntoComposer,
  parseDailyLogVoiceTranscript,
} from "./daily-log-voice";

describe("parseDailyLogVoiceTranscript", () => {
  it("puts narrative in workDone", () => {
    const parsed = parseDailyLogVoiceTranscript(
      "Finished second-floor electrical rough. Plumber set tub valves.",
    );
    expect(parsed.workDone).toBe(
      "Finished second-floor electrical rough. Plumber set tub valves.",
    );
    expect(parsed.blockers).toBeUndefined();
  });

  it("extracts blocker sentences", () => {
    const parsed = parseDailyLogVoiceTranscript(
      "Framed north wall and set windows. Waiting on inspection for footings. Delivery of trusses delayed.",
    );
    expect(parsed.workDone).toBe("Framed north wall and set windows.");
    expect(parsed.blockers).toMatch(/Waiting on inspection/i);
    expect(parsed.blockers).toMatch(/Delivery of trusses delayed/i);
  });

  it("parses crew count and hours when spoken", () => {
    const parsed = parseDailyLogVoiceTranscript(
      "Four guys on site for 8 hours. Drywall hung in garage.",
    );
    expect(parsed.crewCount).toBe(4);
    expect(parsed.hours).toBe(8);
    expect(parsed.workDone).toMatch(/Drywall hung/i);
  });

  it("does not invent crew, hours, or weather", () => {
    const parsed = parseDailyLogVoiceTranscript("Taped and mudded bedrooms.");
    expect(parsed.crewCount).toBeUndefined();
    expect(parsed.hours).toBeUndefined();
    expect(parsed.weather).toBeUndefined();
  });

  it("maps spoken weather", () => {
    expect(parseDailyLogVoiceTranscript("It rained all morning. Inside work only.").weather).toBe(
      "rain",
    );
    expect(parseDailyLogVoiceTranscript("Windy afternoon but we kept roofing.").weather).toBe(
      "wind",
    );
    expect(parseDailyLogVoiceTranscript("Clear and sunny, poured flatwork.").weather).toBe(
      "clear",
    );
  });

  it("handles numeric crew shorthand", () => {
    const parsed = parseDailyLogVoiceTranscript("6 crew on site. Installed cabinets.");
    expect(parsed.crewCount).toBe(6);
  });
});

describe("mergeVoiceIntoComposer", () => {
  it("appends narrative and blockers without overwriting unspecified fields", () => {
    const merged = mergeVoiceIntoComposer(
      {
        workDone: "Morning punch.",
        blockers: "",
        crewCount: 4,
        hours: 8,
        weather: "clear" as const,
      },
      parseDailyLogVoiceTranscript(
        "Afternoon trim install. Waiting on window delivery.",
      ),
    );
    expect(merged.workDone).toBe("Morning punch. Afternoon trim install.");
    expect(merged.blockers).toBe("Waiting on window delivery.");
    expect(merged.crewCount).toBe(4);
    expect(merged.hours).toBe(8);
    expect(merged.weather).toBe("clear");
  });

  it("overwrites crew, hours, and weather when spoken", () => {
    const merged = mergeVoiceIntoComposer(
      {
        workDone: "",
        blockers: "",
        crewCount: 4,
        hours: 8,
        weather: "clear" as const,
      },
      parseDailyLogVoiceTranscript("5 guys, 10 hours, overcast. Framed east wall."),
    );
    expect(merged.crewCount).toBe(5);
    expect(merged.hours).toBe(10);
    expect(merged.weather).toBe("overcast");
  });
});

describe("applyParsedVoiceToForm", () => {
  it("keeps existing crew and hours when not spoken", () => {
    const next = applyParsedVoiceToForm(
      {
        workDone: "",
        blockers: "",
        crewCount: "4",
        hours: "8",
        weather: "clear",
      },
      parseDailyLogVoiceTranscript("Hung drywall in the garage."),
    );
    expect(next.crewCount).toBe("4");
    expect(next.hours).toBe("8");
    expect(next.weather).toBe("clear");
  });
});
