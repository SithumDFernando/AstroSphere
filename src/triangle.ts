import { combine, cross, dot, unit } from "./geometry.ts";
import type { Scene, Frame } from "./plate.ts";

export const relations = { PZ: "90° − φ", PS: "90° − δ", ZS: "90° − h", P: "|H| (principal angle)" } as const;
export type Vertex = "P" | "Z" | "S";
export type Side = keyof Scene["arcs"];
export type Target = keyof typeof relations;
export type Construction = { vertices: Vertex[]; sides: Side[]; labels: Target[] };
export const emptyConstruction: Construction = { vertices: [], sides: [], labels: [] };
export function isVertex(id: string): id is Vertex { return id === "P" || id === "Z" || id === "S"; }
export function isSide(id: string): id is Side { return id === "PZ" || id === "PS" || id === "ZS"; }
export function sideBetween(a: Vertex, b: Vertex) {
  return (["PZ","PS","ZS"] as const).find(side => a !== b && side.includes(a) && side.includes(b));
}
export function measurement(scene: Scene, id: Target) {
  if (id === "P") return scene.poleAngleDeg;
  const arc = scene.arcs[id];
  return arc.kind === "minor" ? arc.lengthDeg : null;
}

// Look perpendicular to the plane of the three endpoints, toward the visible face.
export function triangleFrame(scene: Scene): Frame | null {
  if (scene.degeneracy) return null;
  const {P,Z,S} = scene.points;
  const pz = combine(Z,1,P,-1), ps = combine(S,1,P,-1);
  let eye = unit(cross(pz,ps));
  if (dot(eye,P)<0) eye = combine(eye,-1,eye,0);
  const up = unit(pz), right = unit(cross(up,eye));
  const points = Object.values(scene.arcs).flatMap(arc=>arc.kind === "minor" ? arc.points : []);
  const xs = points.map(v=>dot(v,right)), ys = points.map(v=>dot(v,up));
  const left=Math.min(...xs), bottom=Math.min(...ys), width=Math.max(...xs)-left, height=Math.max(...ys)-bottom;
  const radius=Math.min(360/width,325/height);
  return {eye,right,up,radius,x:320-radius*(left+width/2),y:229+radius*(bottom+height/2)};
}
