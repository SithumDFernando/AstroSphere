import { defaultLayers, referenceFrame } from "./plate.ts";
import type { Frame, Layers } from "./plate.ts";
import type { Scenario } from "./problem.ts";
import { parseDraft, toDraft } from "./problem.ts";
import { emptyConstruction } from "./triangle.ts";
import type { Construction } from "./triangle.ts";
import { dot, cross } from "./geometry.ts";
import type { LearningMode } from "./Lesson.tsx";

export type SavedScene = {
  format: "astrosphere";
  version: 1;
  name: string;
  problem: Scenario;
  baseline: Scenario;
  layers: Layers;
  frame: Frame;
  construction: Construction;
  mode: LearningMode;
  revealed: boolean;
};
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected an object.");
  return value as Record<string, unknown>;
}
function scenario(value: unknown): Scenario {
  const v = record(value);
  for (const key of ["latitudeDeg", "declinationDeg", "hourAngleDeg"]) {
    if (typeof v[key] !== "number" || !Number.isFinite(v[key]))
      throw new Error("Invalid coordinate " + key + ".");
  }
  for (const key of ["starName", "target", "question", "notes", "template"])
    if (typeof v[key] !== "string" || (v[key] as string).length > 20000)
      throw new Error("Invalid problem field " + key + ".");
  const raw = v as Scenario;
  const parsed = parseDraft(toDraft(raw)).scenario;
  if (!parsed || (raw.template === "T2" && raw.hourAngleDeg !== 0))
    throw new Error("Invalid problem coordinates or template.");
  return { ...parsed, hourAngleDeg: raw.hourAngleDeg };
}
export function validateScene(value: unknown): SavedScene {
  const v = record(value);
  if (v.format !== "astrosphere" || v.version !== 1)
    throw new Error(
      "Unsupported scenario format or version. Expected AstroSphere version 1.",
    );
  if (typeof v.name !== "string" || !v.name.trim() || v.name.length > 120)
    throw new Error("Give the scenario a name of 1–120 characters.");
  const problem = scenario(v.problem),
    baseline = scenario(v.baseline);
  const layers = { ...defaultLayers },
    rawLayers = record(v.layers);
  for (const key of Object.keys(layers) as (keyof Layers)[]) {
    if (typeof rawLayers[key] !== "boolean")
      throw new Error("Invalid layer " + key + ".");
    layers[key] = rawLayers[key] as boolean;
  }
  const rawFrame = record(v.frame);
  const frame = { ...referenceFrame };
  for (const key of ["eye", "right", "up"] as const) {
    const vector = rawFrame[key];
    if (
      !Array.isArray(vector) ||
      vector.length !== 3 ||
      !vector.every((n) => typeof n === "number" && Number.isFinite(n)) ||
      Math.abs(Math.hypot(...vector) - 1) > 1e-6
    )
      throw new Error("Invalid camera direction.");
    frame[key] = [vector[0], vector[1], vector[2]];
  }
  if (
    Math.abs(dot(frame.eye, frame.right)) > 1e-6 ||
    Math.abs(dot(frame.eye, frame.up)) > 1e-6 ||
    dot(cross(frame.right, frame.up), frame.eye) < 0.999999
  )
    throw new Error("Camera axes must form an orthonormal frame.");
  for (const key of ["x", "y", "radius"] as const) {
    if (
      typeof rawFrame[key] !== "number" ||
      !Number.isFinite(rawFrame[key]) ||
      Math.abs(rawFrame[key] as number) > 1000000
    )
      throw new Error("Invalid camera position.");
    frame[key] = rawFrame[key] as number;
  }
  if (frame.radius < 202 * 0.55 - 1e-6 || frame.radius > 606 + 1e-6)
    throw new Error("Camera zoom is outside supported bounds.");
  const rawWork = record(v.construction),
    construction = { ...emptyConstruction };
  for (const [key, allowed] of Object.entries({
    vertices: ["P", "Z", "S"],
    sides: ["PZ", "PS", "ZS"],
    labels: ["P", "PZ", "PS", "ZS"],
  })) {
    const list = rawWork[key];
    if (
      !Array.isArray(list) ||
      list.some((x) => !allowed.includes(x)) ||
      new Set(list).size !== list.length
    )
      throw new Error("Invalid construction " + key + ".");
    Object.assign(construction, { [key]: [...list] });
  }
  if (
    construction.sides.some(
      (side) =>
        ![...side].every((p) =>
          construction.vertices.includes(p as "P" | "Z" | "S"),
        ),
    ) ||
    construction.labels.some((id) =>
      id === "P"
        ? !construction.sides.includes("PZ") ||
          !construction.sides.includes("PS")
        : !construction.sides.includes(id),
    )
  )
    throw new Error("Construction labels and sides require their endpoints.");
  if (
    !["Independent", "Guided", "Demonstrate", "Redraw"].includes(
      v.mode as string,
    ) ||
    typeof v.revealed !== "boolean"
  )
    throw new Error("Invalid starting reveal state.");
  return {
    format: "astrosphere",
    version: 1,
    name: v.name.trim(),
    problem,
    baseline,
    layers,
    frame,
    construction,
    mode: v.mode as LearningMode,
    revealed: v.revealed,
  };
}
export const storageKey = "astrosphere.scenarios.v1";
export function readLibrary(): SavedScene[] {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return [];
  const values = JSON.parse(raw);
  if (!Array.isArray(values))
    throw new Error("Saved library could not be read.");
  return values.map(validateScene);
}
export function storeScene(scene: SavedScene) {
  const valid = validateScene(scene),
    entries = readLibrary();
  localStorage.setItem(
    storageKey,
    JSON.stringify([
      valid,
      ...entries.filter((item) => item.name !== valid.name),
    ]),
  );
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
