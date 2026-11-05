import { signedHourAngle } from "./geometry.ts";
import type { Problem } from "./geometry.ts";

export const templates = {
  T1: "Altitude and azimuth",
  T2: "Meridian culmination",
  T3: "Rising and setting",
};
export type Template = keyof typeof templates;
export type Scenario = Problem & {
  template: Template;
  starName: string;
  target: string;
  question: string;
  notes: string;
};
export const targets = ["Altitude and azimuth", "Altitude", "Azimuth"];
export const blankDraft = {
  template: "T1" as Template,
  starName: "S",
  latitude: "",
  declination: "",
  hour: "",
  target: targets[0],
  question: "",
  notes: "",
};
export type Draft = typeof blankDraft;
export const examples: Draft[] = [
  { ...blankDraft, latitude: "30", declination: "20", hour: "45" },
  { ...blankDraft, template: "T2", latitude: "40", declination: "-10" },
  { ...blankDraft, template: "T3", latitude: "60", declination: "60" },
];

export function parseDraft(draft: Draft) {
  const errors: Partial<Record<keyof Draft, string>> = {};
  function angle(field: "latitude" | "declination" | "hour") {
    const raw = draft[field].trim();
    const value = Number(raw);
    if (
      !raw ||
      !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw) ||
      !Number.isFinite(value)
    )
      errors[field] = "Enter a finite angle in degrees.";
    else if (field !== "hour" && Math.abs(value) > 90)
      errors[field] = "Enter an angle from −90° to +90°.";
    return value;
  }
  if (!Object.hasOwn(templates, draft.template))
    errors.template = "Choose a supported problem type.";
  if (!draft.starName.trim())
    errors.starName = "Enter a name or symbol for the star.";
  if (draft.template === "T1" && !targets.includes(draft.target))
    errors.target = "Choose an unknown.";
  const latitudeDeg = angle("latitude"),
    declinationDeg = angle("declination");
  const hour = draft.template === "T1" ? angle("hour") : 0;
  const scenario: Scenario | null = Object.keys(errors).length
    ? null
    : {
        latitudeDeg,
        declinationDeg,
        hourAngleDeg: signedHourAngle(hour),
        starName: draft.starName.trim(),
        template: draft.template,
        question: draft.question.trim(),
        notes: draft.notes.trim(),
        target:
          draft.template === "T1"
            ? draft.target
            : draft.template === "T2"
              ? "Upper meridian altitude"
              : "Daily visibility",
      };
  return { errors, scenario };
}

export function toDraft(s: Scenario): Draft {
  return {
    template: s.template,
    starName: s.starName,
    latitude: String(s.latitudeDeg),
    declination: String(s.declinationDeg),
    hour: String(s.hourAngleDeg),
    target: s.template === "T1" ? s.target : targets[0],
    question: s.question,
    notes: s.notes,
  };
}
export function hourLabel(h: number) {
  return h === 0 ? "0°" : Math.abs(h) + "° " + (h > 0 ? "W" : "E");
}
export function latitudeLabel(lat: number) {
  return lat === 0 ? "0°" : Math.abs(lat) + "° " + (lat > 0 ? "N" : "S");
}

export type History = {
  past: Scenario[];
  current: Scenario;
  future: Scenario[];
};
export function initialHistory(current: Scenario): History {
  return { past: [], current, future: [] };
}
export type Edit =
  | { kind: "set"; value: Scenario; coalesce?: boolean }
  | { kind: "undo" | "redo" };
export function revise(state: History, edit: Edit): History {
  const { past, current, future } = state;
  if (edit.kind === "undo")
    return past.length
      ? {
          past: past.slice(0, -1),
          current: past.at(-1)!,
          future: [current, ...future],
        }
      : state;
  if (edit.kind === "redo")
    return future.length
      ? {
          past: [...past, current],
          current: future[0],
          future: future.slice(1),
        }
      : state;
  if (
    edit.kind !== "set" ||
    Object.entries(current).every(
      ([k, v]) => edit.value[k as keyof Scenario] === v,
    )
  )
    return state;
  return {
    past: edit.coalesce ? past : [...past, current],
    current: edit.value,
    future: [],
  };
}
