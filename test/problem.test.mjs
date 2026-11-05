import test from "node:test";
import assert from "node:assert/strict";
import {
  blankDraft,
  examples,
  parseDraft,
  toDraft,
  initialHistory,
  revise,
} from "../src/problem.ts";
import { deriveScene } from "../src/scene.ts";
import { spherePlate, defaultLayers } from "../src/plate.ts";

test("builder checks required fields and rejects unsupported inputs without inventing coordinates", () => {
  assert.deepEqual(Object.keys(parseDraft(blankDraft).errors), [
    "latitude",
    "declination",
    "hour",
  ]);
  for (const patch of [
    { latitude: "-91" },
    { declination: "Infinity" },
    { hour: "0x45" },
    { hour: "1e999" },
    { template: "UTC" },
    { starName: " " },
    { target: "RA" },
  ]) {
    const { errors, scenario } = parseDraft({ ...examples[0], ...patch });
    assert.equal(scenario, null);
    assert.ok(errors[Object.keys(patch)[0]]);
  }
});
test("template switches ignore irrelevant givens, while manual T1 inputs round-trip", () => {
  for (const template of ["T2", "T3"]) {
    const { scenario } = parseDraft({
      ...examples[0],
      template,
      hour: "invalid",
    });
    assert.equal(scenario.hourAngleDeg, 0);
    assert.equal(scenario.template, template);
  }
  const { scenario } = parseDraft({
    ...examples[0],
    hour: "315",
    question: "Find h",
    notes: "hint",
    target: "Altitude",
  });
  assert.equal(scenario.hourAngleDeg, -45);
  assert.deepEqual(parseDraft(toDraft(scenario)).scenario, scenario);
});
test("dragging H makes one reversible edit and a new edit clears redo", () => {
  const { scenario: s } = parseDraft(examples[0]);
  let state = initialHistory(s);
  state = revise(state, { kind: "set", value: { ...s, hourAngleDeg: 12 } });
  state = revise(state, {
    kind: "set",
    value: { ...s, hourAngleDeg: -30 },
    coalesce: true,
  });
  state = revise(state, { kind: "undo" });
  assert.deepEqual(state.current, s);
  assert.equal(state.past.length, 0);
  assert.equal(revise(state, { kind: "redo" }).current.hourAngleDeg, -30);
  state = revise(state, { kind: "set", value: { ...s, latitudeDeg: 90 } });
  assert.equal(state.future.length, 0);
});
test("polar practice retains separate coincident entities and omits the nonunique hour circle", () => {
  const scene = deriveScene({
    latitudeDeg: 90,
    declinationDeg: 90,
    hourAngleDeg: 74,
  });
  const svg = spherePlate(scene, {
    practice: true,
    layers: { ...defaultLayers, hourCircle: true },
  });
  for (const id of ["P", "Z", "S"])
    assert.ok(svg.includes('data-object="' + id + '"'));
  assert.doesNotMatch(svg, /data-object="hourCircle"|id="PZ"|NaN|undefined/);
});
