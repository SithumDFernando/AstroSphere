import test from "node:test";
import assert from "node:assert/strict";
import { validateScene } from "../src/storage.ts";
import { diagramSvg } from "../src/diagramExport.ts";
import { exerciseScenario, exercises } from "../src/learning.ts";
import { defaultLayers, referenceFrame } from "../src/plate.ts";
const saved = {
  format: "astrosphere",
  version: 1,
  name: "Example",
  problem: exerciseScenario(exercises[0]),
  baseline: exerciseScenario(exercises[0]),
  layers: defaultLayers,
  frame: referenceFrame,
  construction: {
    vertices: ["P", "Z", "S"],
    sides: ["PZ", "PS", "ZS"],
    labels: ["PZ", "PS", "ZS", "P"],
  },
  mode: "Independent",
  revealed: false,
};
test("scenario contract round-trips and rejects invalid data", () => {
  assert.deepEqual(validateScene(JSON.parse(JSON.stringify(saved))), saved);
  for (const patch of [
    { version: 2 },
    { problem: { ...saved.problem, latitudeDeg: 91 } },
    { layers: {} },
    { frame: { ...referenceFrame, up: referenceFrame.eye } },
    { construction: { vertices: [], sides: ["PZ"], labels: [] } },
  ])
    assert.throws(() => validateScene({ ...saved, ...patch }));
  assert.deepEqual(validateScene({ ...saved, unknownKey: "ignored" }), saved);
});
test("exports escape user text and honor redraw concealment", () => {
  const opts = {
    triangle: false,
    grayscale: true,
    transparent: true,
    note: true,
    labels: true,
  };
  const svg = diagramSvg(
    { ...saved, name: '<script>alert("test")</script>' },
    opts,
  );
  assert.ok(svg.includes("&lt;script&gt;"));
  assert.ok(!svg.includes("<script>"));
  assert.ok(svg.includes("PZ = 60.00°"));
  assert.ok(
    !diagramSvg({ ...saved, mode: "Redraw" }, opts).includes("PZ = 60.00°"),
  );
  assert.throws(() =>
    diagramSvg(
      { ...saved, problem: exerciseScenario(exercises[4]) },
      { ...opts, triangle: true },
    ),
  );
});
