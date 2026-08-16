import type { DailyLogWeather } from "@/data/types";

export type ParsedDailyLogVoice = {
  workDone: string;
  blockers?: string;
  crewCount?: number;
  hours?: number;
  weather?: DailyLogWeather;
};

const BLOCKER_PATTERN =
  /\b(waiting|wait(?:ing)?\s+(?:on|for)|blocked|blocker|hold(?:ing)?|delayed|delay|inspection|delivery|deliveries|rfi|back[\s-]?order|shortage|no[\s-]?show)\b/i;

const CREW_PATTERN =
  /\b(?:(\d{1,3})|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:guys?|men|crew(?:s)?|people|workers?|laborers?|hands?|on[\s-]?site)\b/i;

const HOURS_PATTERN = /\b(\d{1,2}(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i;

const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

const WEATHER_RULES: { weather: DailyLogWeather; pattern: RegExp }[] = [
  { weather: "rain", pattern: /\b(rain(?:ed|ing)?|rained|drizzle|storm(?:y|ing)?|wet\s+out)\b/i },
  { weather: "snow", pattern: /\b(snow(?:ed|ing|y)?|flurries|blizzard)\b/i },
  { weather: "wind", pattern: /\b(wind(?:y|s)?|gust(?:y|s)?|breezy)\b/i },
  { weather: "overcast", pattern: /\b(overcast|cloud(?:y|s|ed)|gray\s+sky|grey\s+sky)\b/i },
  { weather: "clear", pattern: /\b(clear|sunny|sun(?:shine)?|blue\s+sky)\b/i },
];

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+|(?:\s*;\s*)|(?:\s+—\s+)|(?:\s+-\s+)/)
    .map((s) => normalizeWhitespace(s))
    .filter(Boolean);
}

function parseCrewCount(text: string): number | undefined {
  const match = text.match(CREW_PATTERN);
  if (!match) return undefined;
  if (match[1]) return Number(match[1]);
  const word = match[0].split(/\s+/)[0]?.toLowerCase();
  if (word && word in WORD_NUMBERS) return WORD_NUMBERS[word];
  return undefined;
}

function parseHours(text: string): number | undefined {
  const match = text.match(HOURS_PATTERN);
  if (!match?.[1]) return undefined;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : undefined;
}

function parseWeather(text: string): DailyLogWeather | undefined {
  for (const rule of WEATHER_RULES) {
    if (rule.pattern.test(text)) return rule.weather;
  }
  return undefined;
}

function isBlockerSentence(sentence: string) {
  return BLOCKER_PATTERN.test(sentence);
}

/** Map a spoken daily-log dump into composer fields. Only sets values explicitly mentioned. */
export function parseDailyLogVoiceTranscript(raw: string): ParsedDailyLogVoice {
  const transcript = normalizeWhitespace(raw);
  if (!transcript) return { workDone: "" };

  const sentences = splitSentences(transcript);
  const blockerSentences = sentences.filter(isBlockerSentence);
  const narrativeSentences = sentences.filter((s) => !isBlockerSentence(s));

  const workDone =
    narrativeSentences.length > 0 ? narrativeSentences.join(" ") : transcript;
  const blockers =
    blockerSentences.length > 0 ? blockerSentences.join(" ") : undefined;

  return {
    workDone,
    blockers,
    crewCount: parseCrewCount(transcript),
    hours: parseHours(transcript),
    weather: parseWeather(transcript),
  };
}

export function mergeVoiceIntoComposer<T extends ParsedDailyLogVoice>(
  current: T,
  parsed: ParsedDailyLogVoice,
): T {
  const next = { ...current };

  if (parsed.workDone) {
    next.workDone = current.workDone
      ? `${current.workDone} ${parsed.workDone}`.trim()
      : parsed.workDone;
  }

  if (parsed.blockers) {
    next.blockers = current.blockers
      ? `${current.blockers} ${parsed.blockers}`.trim()
      : parsed.blockers;
  }

  if (parsed.crewCount !== undefined) next.crewCount = parsed.crewCount;
  if (parsed.hours !== undefined) next.hours = parsed.hours;
  if (parsed.weather) next.weather = parsed.weather;

  return next;
}

export function applyParsedVoiceToForm(
  current: {
    workDone: string;
    blockers: string;
    crewCount: string;
    hours: string;
    weather: DailyLogWeather;
  },
  parsed: ParsedDailyLogVoice,
) {
  return {
    workDone: parsed.workDone
      ? current.workDone
        ? `${current.workDone} ${parsed.workDone}`.trim()
        : parsed.workDone
      : current.workDone,
    blockers: parsed.blockers
      ? current.blockers
        ? `${current.blockers} ${parsed.blockers}`.trim()
        : parsed.blockers
      : current.blockers,
    crewCount: parsed.crewCount !== undefined ? String(parsed.crewCount) : current.crewCount,
    hours: parsed.hours !== undefined ? String(parsed.hours) : current.hours,
    weather: parsed.weather ?? current.weather,
  };
}
