import { combine, cross, dot, unit } from "./geometry.ts";
import type { Vector } from "./geometry.ts";
import type { deriveScene } from "./scene.ts";
import { isSide, isVertex, measurement } from "./triangle.ts";
import type { Construction, Side, Target } from "./triangle.ts";

export type Scene = ReturnType<typeof deriveScene>;
export const objectNames = {
  PZ: "Side PZ", PS: "Side PS", ZS: "Side ZS",
  horizon: "Horizon",
  equator: "Celestial equator",
  meridian: "Local meridian",
  hourCircle: "Star’s hour circle",
  P: "North celestial pole",
  SCP: "South celestial pole",
  Z: "Zenith",
  nadir: "Nadir",
  S: "Star",
  north: "North",
  east: "East",
  south: "South",
  west: "West",
};
export type ObjectId = keyof typeof objectNames;
export const defaultLayers = {
  horizon: true,
  equator: true,
  meridian: true,
  hourCircle: false,
  poles: true,
  vertical: true,
  cardinals: true,
  labels: true,
  planes: true,
  opaque: false,
};
export type Layers = typeof defaultLayers;
export function layerFor(id: ObjectId) {
  if (isSide(id)) return null;
  if (id === "P" || id === "SCP") return "poles";
  if (id === "Z" || id === "nadir") return "vertical";
  if (id === "S") return null;
  if (id === "north" || id === "south" || id === "east" || id === "west")
    return "cardinals";
  return id;
}

const eye = unit([-0.65, 0.8, 0.4]);
const right = unit(cross([0, 0, 1], eye));
export const referenceFrame = {
  eye,
  right,
  up: cross(eye, right),
  x: 320,
  y: 228,
  radius: 202,
};
export type Frame = typeof referenceFrame;
type Options = {
  construction?: Construction;
  preview?: Side;
  isolated?: boolean;
  prefix?: string;
  frame?: Frame;
  layers?: Layers;
  selected?: ObjectId | "";
  practice?: boolean;
};

// Sample world-space circles once. Camera and visibility edits only reproject them.
const curvesCache = new WeakMap<Scene, Partial<Record<ObjectId, Vector[]>>>();
function circleSamples(scene: Scene) {
  const cached = curvesCache.get(scene);
  if (cached) return cached;
  const curves: Partial<Record<ObjectId, Vector[]>> = {};
  const { P, S } = scene.points;
  const normal = cross(P, S);
  const bases: Record<string, readonly [Vector, Vector]> = { ...scene.circles };
  if (Math.hypot(...normal) > 1e-12)
    bases.hourCircle = [P, cross(unit(normal), P)];
  for (const [id, [a, b]] of Object.entries(bases)) {
    curves[id as ObjectId] = Array.from({ length: 121 }, (_, i) => {
      const angle = (i * Math.PI) / 60;
      return combine(a, Math.cos(angle), b, Math.sin(angle));
    });
  }
  curvesCache.set(scene, curves);
  return curves;
}

export function spherePlate(scene: Scene, options: Options = {}): string {
  const {
    frame = referenceFrame,
    layers = defaultLayers,
    practice = false,
    selected = "",
  } = options;
  const project = (v: Vector) => [
    frame.x + frame.radius * dot(v, frame.right),
    frame.y - frame.radius * dot(v, frame.up),
  ];
  function commands(points: Vector[]) {
    return points
      .map((p, i) => {
        const [x, y] = project(p);
        return (i ? "L" : "M") + x.toFixed(2) + "," + y.toFixed(2);
      })
      .join(" ");
  }
  function visiblePaths(points: Vector[], style: string) {
    const paths: string[] = [];
    let run = [points[0]],
      front = dot(points[0], frame.eye) >= 0;
    function flush() {
      if (!front && layers.opaque) return;
      const d = commands(run);
      if (practice) paths.push('<path class="hit-line" d="' + d + '"/>');
      paths.push(
        '<path class="' + style + (front ? "" : " back") + '" d="' + d + '"/>',
      );
    }
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        b = points[i],
        da = dot(a, frame.eye),
        db = dot(b, frame.eye);
      if (db >= 0 !== front) {
        const t = da / (da - db),
          limb = unit(combine(a, 1 - t, b, t));
        run.push(limb);
        flush();
        run = [limb];
        front = db >= 0;
      }
      run.push(b);
    }
    flush();
    return paths.join("");
  }
  const planes: string[] = [],
    curves: string[] = [];
  const prefix = options.prefix ?? "";
  const work = options.construction;
  function annotation(id: Target, x: number, y: number) {
    if (!layers.labels || !work?.labels.includes(id) || scene.degeneracy) return "";
    return `<text class="measure" x="${x}" y="${y}">${id==="P"?"∠P":id} ${measurement(scene,id)?.toFixed(2)}°</text>`;
  }
  function group(id: ObjectId, content: string, point = false) {
    return (
      '<g id="' +
      prefix +
      (point ? "point-" : "") +
      id +
      '" data-object="' +
      id +
      '" class="' +
      (selected === id ? "selected" : "") +
      '">' +
      content +
      "</g>"
    );
  }
  for (const [key, points] of Object.entries(circleSamples(scene))) {
    const id = key as keyof Scene["circles"] | "hourCircle";
    if (!layers[id] || options.isolated) continue;
    if (
      practice &&
      layers.planes &&
      !layers.opaque &&
      (id === "horizon" || id === "equator")
    )
      planes.push(
        '<path class="plane ' + id + '" d="' + commands(points) + 'Z"/>',
      );
    curves.push(group(id, visiblePaths(points, "reference " + id)));
  }
  const sides = Object.entries(scene.arcs).map(([key,arc]) => {
    const id = key as Side;
    const preview = options.preview === id;
    if (arc.kind !== "minor" || (practice && (scene.degeneracy || (!work?.sides.includes(id) && !preview)))) return "";
    const [x,y] = project(arc.points[Math.floor(arc.points.length/2)]);
    return group(id, visiblePaths(arc.points, preview ? "side preview-arc" : "side") + annotation(id,x+3,y-5));
  });
  const names = {
    P: "P",
    SCP: "P′",
    Z: "Z",
    nadir: "Z′",
    S: "S",
    east: "E",
    north: "N",
    south: "S",
    west: "W",
  };
  const labels = Object.entries(scene.points).map(([key, v]) => {
    const id = key as keyof typeof names;
    if (options.isolated && (!isVertex(id) || !work?.vertices.includes(id))) return "";
    const layer = layerFor(id);
    if (
      (layer && !layers[layer]) ||
      (!practice && (id === "SCP" || id === "nadir"))
    )
      return "";
    const back = dot(v, frame.eye) < -1e-10;
    if (back && layers.opaque) return "";
    const [x, y] = project(v),
      offset = x < frame.x ? -11 : 11;
    const cardinal = layer === "cardinals";
    const point =
      '<circle class="hit-point" cx="' +
      x +
      '" cy="' +
      y +
      '" r="11" fill="transparent"/>' +
      '<circle class="dot" cx="' +
      x +
      '" cy="' +
      y +
      '" r="' +
      (cardinal ? 2.7 : 4.5) +
      '"/>';
    const label = layers.labels
      ? '<text x="' +
        (x + offset) +
        '" y="' +
        (y - 7) +
        '" text-anchor="' +
        (offset < 0 ? "end" : "start") +
        '">' +
        names[id] +
        "</text>"
      : "";
    return group(
      id,
      '<g class="' +
        (cardinal ? "cardinal" : "vertex") +
        (back ? " far" : "") +
        '">' +
        point +
        label + (id==="P" ? annotation("P",x+8,y+18) : "") +
        "</g>",
      true,
    );
  });
  return (
    '<svg viewBox="65 0 510 458" role="img" aria-label="Celestial sphere">' +
    '<defs><radialGradient id="sphere" cx="36%" cy="25%" r="85%"><stop stop-color="var(--globe-light,#fffffa)"/><stop offset=".78" stop-color="var(--globe-mid,#f2f1e5)"/><stop offset="1" stop-color="var(--globe-edge,#dfdfce)"/></radialGradient></defs>' +
    (options.isolated ? "" : '<circle class="limb" cx="' +
    frame.x +
    '" cy="' +
    frame.y +
    '" r="' +
    frame.radius +
    '" fill="url(#sphere)" stroke="#82897a"/>') +
    [...planes, ...curves, ...sides, ...labels].join("") +
    "</svg>"
  ).replaceAll('id="sphere"', 'id="'+prefix+'sphere"').replaceAll('url(#sphere)', 'url(#'+prefix+'sphere)');
}
