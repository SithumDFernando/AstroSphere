import test from "node:test";
import assert from "node:assert/strict";
import {
  cross, culmination, dailyVisibility, dot, horizon, interiorAngleDeg,
  minorArc, separationDeg, signedHourAngle,
} from "../src/geometry.ts";
import { deriveScene, referenceProblem } from "../src/scene.ts";
import { spherePlate } from "../src/plate.ts";

function close(actual, expected, tolerance = 1e-9) {
  assert.ok(typeof actual === "number" && Math.abs(actual - expected) <= tolerance,
    `expected ${expected} ± ${tolerance}, got ${actual}`);
}

const coordinates = (latitudeDeg, declinationDeg, hourAngleDeg) =>
  horizon({ latitudeDeg, declinationDeg, hourAngleDeg });

// PRD §15.1, plus southern, nadir and meridian limits.
for (const [name, lat, dec, hour, altitude, azimuth, reason] of [
  ["EX-01", 30, 20, 45, 48.28396, 266.89593, null],
  ["zenith", 0, 0, 0, 90, null, "zenith"],
  ["west horizon", 0, 0, 90, 0, 270, null],
  ["east horizon", 0, 0, -90, 0, 90, null],
  ["north celestial pole", 30, 90, 113, 30, 0, null],
  ["south celestial pole", 30, -90, -79, -30, 180, null],
  ["north geographic pole", 90, 20, 82, 20, null, "geographic-pole"],
  ["south geographic pole", -90, 20, 82, -20, null, "geographic-pole"],
  ["southern zenith", -35, -35, 0, 90, null, "zenith"],
  ["nadir", 30, -30, 180, -90, null, "nadir"],
]) {
  test(name, () => {
    const result = coordinates(lat, dec, hour);
    close(result.altitudeDeg, altitude, 0.00001);
    if (azimuth === null) assert.equal(result.azimuthDeg, null);
    else close(result.azimuthDeg, azimuth, 0.00001);
    assert.equal(result.undefinedBearing, reason);
  });
}

test("independent ERFA t_hd2ae fixture, converted from radians", () => {
  // Source: https://github.com/liberfa/erfa/blob/master/src/t_erfa_c.c (t_hd2ae).
  // Inputs are hour angle, declination, latitude; outputs are azimuth, elevation.
  const degrees = 180 / Math.PI;
  const result = coordinates(0.3 * degrees, 1.2 * degrees, 1.1 * degrees);
  close(result.azimuthDeg, 5.916889243730066194 * degrees);
  close(result.altitudeDeg, 0.4472186304990486228 * degrees);
});

test("normalize turns and preserve east/west across the north azimuth boundary", () => {
  assert.equal(signedHourAngle(315), -45);
  assert.equal(signedHourAngle(-315), 45);
  assert.deepEqual(coordinates(20, 40, 405), coordinates(20, 40, 45));
  assert.ok(coordinates(20, 40, -0.01).azimuthDeg < 1);
  assert.ok(coordinates(20, 40, 0.01).azimuthDeg > 359);
});

test("finite values and latitude/declination ranges are required", () => {
  for (const values of [[-91,0,0], [0,91,0], [NaN,0,0], [0,0,Infinity], [0,"",0]]) {
    assert.throws(() => coordinates(...values), RangeError);
  }
  assert.throws(() => dailyVisibility(0, Infinity), RangeError);
});

test("upper culmination may be below the horizon", () => {
  close(culmination(40,-10).altitudeDeg, 40);
  close(culmination(70,-50).altitudeDeg, -30);
});

test("daily altitude ranges and horizon contacts", () => {
  assert.deepEqual(dailyVisibility(60, 60), { kind: "never-sets", minAltitudeDeg: 30, maxAltitudeDeg: 90 });
  for (const [lat, dec, kind] of [
    [60,-60,"never-rises"], [60,30,"touches-at-lower-transit"], [-60,30,"touches-at-upper-transit"],
    [90,0,"on-horizon"], [0,-90,"on-horizon"], [-90,-12,"never-sets"], [90,-12,"never-rises"],
    [60,29.999,"rises-and-sets"], [60,30.001,"never-sets"],
  ]) assert.equal(dailyVisibility(lat, dec).kind, kind);
  for (const [lat, dec] of [[0,0], [30,20], [-30,20], [60,29.999]]) {
    const day = dailyVisibility(lat, dec);
    assert.equal(day.kind, "rises-and-sets");
    assert.ok(day.risingHourAngleDeg < 0 && day.settingHourAngleDeg > 0);
    close(coordinates(lat, dec, day.risingHourAngleDeg).altitudeDeg, 0);
    close(coordinates(lat, dec, day.settingHourAngleDeg).altitudeDeg, 0);
  }
});

test("P–Z–S sides, angle and great-circle interpolation agree in both hemispheres", () => {
  for (const lat of [-80, -30, 0, 30, 87]) {
    for (const hour of [-135, -45, 45, 135, 310]) {
      const scene = deriveScene({ ...referenceProblem, latitudeDeg: lat, hourAngleDeg: hour });
      assert.equal(scene.degeneracy, null);
      close(scene.poleAngleDeg, Math.abs(signedHourAngle(hour)));
      close(scene.arcs.PZ.lengthDeg, 90 - lat);
      close(scene.arcs.PS.lengthDeg, 70);
      close(scene.arcs.ZS.lengthDeg, 90 - scene.star.altitudeDeg);
      for (const [id, arc] of Object.entries(scene.arcs)) {
        const [start, end] = [...id].map(key => scene.points[key]);
        const normal = cross(start, end);
        close(separationDeg(arc.points[0], start), 0);
        close(separationDeg(arc.points.at(-1), end), 0);
        arc.points.forEach((vector, i) => {
          close(Math.hypot(...vector), 1);
          close(dot(vector, normal), 0);
          close(separationDeg(start, vector), arc.lengthDeg * i / (arc.points.length - 1));
        });
      }
    }
  }
});

test("degenerate constructions keep meaningful altitude and explain the failure", () => {
  for (const [lat, dec, hour, explanation] of [
    [90,20,30,/PZ.*coincident/], [-90,20,30,/PZ.*antipodal/],
    [30,90,19,/PS.*coincident/], [30,-90,19,/PS.*antipodal/],
    [30,30,0,/ZS.*coincident/], [30,-30,180,/ZS.*antipodal/],
    [30,20,0,/one great circle/], [30,20,180,/one great circle/],
  ]) {
    const scene = deriveScene({ latitudeDeg: lat, declinationDeg: dec, hourAngleDeg: hour });
    assert.match(scene.degeneracy, explanation);
    assert.ok(Number.isFinite(scene.star.altitudeDeg));
  }
  assert.equal(interiorAngleDeg([1,0,0], [-1,0,0], [0,1,0]), null);
  assert.throws(() => minorArc([0,0,0], [1,0,0]), RangeError);
  assert.throws(() => minorArc([1,0,0], [0,1,0], 0), RangeError);
  close(minorArc([1,0,0], [-1,1e-8,0]).lengthDeg, 180 - 1e-8 * 180 / Math.PI);
});

test("the static projection uses canonical IDs and preserves the scene", () => {
  const scene = deriveScene(referenceProblem);
  const before = structuredClone(scene);
  const svg = spherePlate(scene);
  for (const id of ["horizon", "equator", "meridian", "point-P", "point-Z", "point-S", "PZ", "PS", "ZS"]) {
    assert.ok(svg.includes('id="' + id + '"'));
  }
  assert.doesNotMatch(svg, /NaN|Infinity|undefined/);
  assert.deepEqual(scene, before);
});
