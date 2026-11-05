/** Right-handed (east, north, up) frame. Public angles are in degrees. */
export type Vector = readonly [number, number, number];
export type Problem = Readonly<{
  latitudeDeg: number;
  declinationDeg: number;
  hourAngleDeg: number; // Positive west, negative east.
}>;

const RAD = Math.PI / 180;
const EPS = 1e-12; // Unit-vector length or sine of an angle.

export function dot(a: Vector, b: Vector): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross(a: Vector, b: Vector): Vector {
  return [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
}

export function unit(v: Vector): Vector {
  const length = Math.hypot(...v);
  if (!Number.isFinite(length) || length === 0) throw new RangeError("Expected a finite direction with nonzero length.");
  return [v[0] / length, v[1] / length, v[2] / length];
}

function checkLatitudeLike(value: number, name: string) {
  if (!Number.isFinite(value) || Math.abs(value) > 90) {
    throw new RangeError(name + " must be between −90° and +90°.");
  }
}

export function signedHourAngle(degrees: number): number {
  if (!Number.isFinite(degrees)) throw new RangeError("Hour angle must be finite.");
  const turn = degrees % 360;
  if (turn > 180) return turn - 360;
  if (turn < -180) return turn + 360;
  return turn || 0;
}

export function horizon(problem: Problem) {
  checkLatitudeLike(problem.latitudeDeg, "Latitude");
  checkLatitudeLike(problem.declinationDeg, "Declination");
  const phi = problem.latitudeDeg * RAD;
  const dec = problem.declinationDeg * RAD;
  const hour = signedHourAngle(problem.hourAngleDeg) * RAD;
  const meridian = Math.cos(dec) * Math.cos(hour);
  const east = -Math.cos(dec) * Math.sin(hour);
  const north = Math.cos(phi) * Math.sin(dec) - Math.sin(phi) * meridian;
  const up = Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * meridian;
  const vector: Vector = [east, north, up];
  const horizontal = Math.hypot(east, north);
  const altitudeDeg = Math.atan2(up, horizontal) / RAD;
  const undefinedBearing = horizontal <= EPS ? (up > 0 ? "zenith" : "nadir")
    : Math.abs(problem.latitudeDeg) === 90 ? "geographic-pole" : null;
  const bearing = Math.atan2(east, north) / RAD;
  const azimuthDeg = undefinedBearing ? null : (bearing + 360) % 360;
  return { vector, altitudeDeg, azimuthDeg, undefinedBearing };
}

/** Upper culmination occurs on the meridian at H = 0. */
export function culmination(latitudeDeg: number, declinationDeg: number) {
  return horizon({ latitudeDeg, declinationDeg, hourAngleDeg: 0 });
}

export function dailyVisibility(latitudeDeg: number, declinationDeg: number) {
  checkLatitudeLike(latitudeDeg, "Latitude");
  checkLatitudeLike(declinationDeg, "Declination");
  const maxAltitudeDeg = 90 - Math.abs(latitudeDeg - declinationDeg);
  const minAltitudeDeg = Math.abs(latitudeDeg + declinationDeg) - 90;
  const range = { minAltitudeDeg, maxAltitudeDeg };
  // Allow roundoff from adding/subtracting decimal latitude and declination.
  const toleranceDeg = 4 * Number.EPSILON * 180;
  const atMax = Math.abs(maxAltitudeDeg) <= toleranceDeg;
  const atMin = Math.abs(minAltitudeDeg) <= toleranceDeg;
  if (atMax && atMin) return { ...range, kind: "on-horizon" } as const;
  if (minAltitudeDeg > toleranceDeg) return { ...range, kind: "never-sets" } as const;
  if (maxAltitudeDeg < -toleranceDeg) return { ...range, kind: "never-rises" } as const;
  if (atMin) return { ...range, kind: "touches-at-lower-transit", hourAngleDeg: 180 } as const;
  if (atMax) return { ...range, kind: "touches-at-upper-transit", hourAngleDeg: 0 } as const;
  // U(H) = Umax cos²(H/2) + Umin sin²(H/2). Solve U = 0.
  const halfAngle = Math.atan2(Math.sqrt(Math.sin(maxAltitudeDeg * RAD)),
    Math.sqrt(-Math.sin(minAltitudeDeg * RAD)));
  const hourAngleDeg = 2 * halfAngle / RAD;
  return { ...range, kind: "rises-and-sets", risingHourAngleDeg: -hourAngleDeg, settingHourAngleDeg: hourAngleDeg } as const;
}

export function separationDeg(a: Vector, b: Vector): number {
  const u = unit(a), v = unit(b);
  return Math.atan2(Math.hypot(...cross(u, v)), dot(u, v)) / RAD;
}

/** Rotate in the endpoint plane. Its normal also detects nonunique endpoints. */
export function minorArc(a: Vector, b: Vector, segments = 48) {
  if (!Number.isSafeInteger(segments) || segments < 1) throw new RangeError("An arc needs at least one segment.");
  const u = unit(a), v = unit(b);
  const normal = cross(u, v);
  const sine = Math.hypot(...normal);
  const cosine = dot(u, v);
  if (sine <= EPS) {
    return { kind: cosine > 0 ? "coincident" : "antipodal" } as const;
  }
  const angle = Math.atan2(sine, cosine);
  const tangent = cross(unit(normal), u);
  const points: Vector[] = [u];
  for (let i = 1; i < segments; i++) {
    const t = angle * i / segments;
    points.push(combine(u, Math.cos(t), tangent, Math.sin(t)));
  }
  points.push(v);
  return { kind: "minor", lengthDeg: angle / RAD, points } as const;
}

export function combine(a: Vector, scaleA: number, b: Vector, scaleB: number): Vector {
  return [a[0]*scaleA + b[0]*scaleB, a[1]*scaleA + b[1]*scaleB, a[2]*scaleA + b[2]*scaleB];
}

export function interiorAngleDeg(vertex: Vector, a: Vector, b: Vector): number | null {
  const v = unit(vertex);
  // Rotating both outgoing tangents by 90° in their plane preserves the angle.
  const first = cross(v, unit(a)), second = cross(v, unit(b));
  if (Math.min(Math.hypot(...first), Math.hypot(...second)) <= EPS) return null;
  return separationDeg(first, second);
}
