import { cross, horizon, interiorAngleDeg, minorArc } from "./geometry.ts";
import type { Problem, Vector } from "./geometry.ts";

export const referenceProblem: Problem = { latitudeDeg: 30, declinationDeg: 20, hourAngleDeg: 45 };

/** Semantic keys persist across projections. Derived geometry excludes camera and practice state. */
export function deriveScene(problem: Problem) {
  const star = horizon(problem);
  const pole = horizon({ ...problem, declinationDeg: 90, hourAngleDeg: 0 }).vector;
  const east: Vector = [1, 0, 0], north: Vector = [0, 1, 0], zenith: Vector = [0, 0, 1];
  const points = {
    P: pole, SCP: [0, -pole[1], -pole[2]], Z: zenith, nadir: [0, 0, -1],
    S: star.vector, east, north, south: [0, -1, 0], west: [-1, 0, 0],
  } satisfies Record<string, Vector>;
  const circles = {
    horizon: [east, north], equator: [east, cross(pole, east)], meridian: [north, zenith],
  } satisfies Record<string, readonly [Vector, Vector]>;
  const arcs = { PZ: minorArc(pole, zenith), PS: minorArc(pole, star.vector), ZS: minorArc(zenith, star.vector) };
  const poleAngleDeg = interiorAngleDeg(pole, zenith, star.vector);
  let degeneracy: string | null = null;
  for (const [side, arc] of Object.entries(arcs)) {
    if (arc.kind === "minor") continue;
    degeneracy = arc.kind === "coincident" ? side + " has coincident endpoints."
      : side + " has antipodal endpoints and no unique shortest arc.";
    break;
  }
  if (!degeneracy && poleAngleDeg !== null && Math.min(poleAngleDeg, 180 - poleAngleDeg) <= 1e-10) {
    degeneracy = "The three vertices lie on one great circle.";
  }
  return { star, points, circles, arcs, poleAngleDeg, degeneracy };
}
