import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { OrthographicCamera, Vector3 } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Vector } from "./geometry.ts";
import { referenceFrame, spherePlate } from "./plate.ts";
import type { Frame, Layers, ObjectId, Scene } from "./plate.ts";
import { triangleFrame } from "./triangle.ts";
import type { Construction, Side } from "./triangle.ts";

type View =
  | "Triangle-normal"
  | "Oblique"
  | "Horizon-level"
  | "Equatorial"
  | "Pole-centered"
  | "Free orbit";
const views: View[] = [
  "Oblique",
  "Horizon-level",
  "Equatorial",
  "Pole-centered",
];
type Rig = { camera: OrthographicCamera; controls: OrbitControls };
function aim(rig: Rig, view: View, scene: Scene) {
  const { camera, controls } = rig;
  camera.up.set(0, 0, 1);
  const direction =
    view === "Triangle-normal"
      ? (triangleFrame(scene)?.eye ?? referenceFrame.eye)
      : view === "Horizon-level"
        ? [-0.9, 0.4, 0]
        : view === "Pole-centered"
          ? scene.points.P
          : view === "Equatorial"
            ? scene.circles.equator[1]
            : referenceFrame.eye;
  controls.target.set(0, 0, 0);
  camera.position
    .set(direction[0], direction[1], direction[2])
    .normalize()
    .multiplyScalar(4);
  camera.zoom = 1;
  camera.updateProjectionMatrix();
  controls.update();
}
function readFrame({ camera }: Rig): Frame {
  camera.updateMatrixWorld();
  const basis = (i: number) =>
    new Vector3()
      .setFromMatrixColumn(camera.matrixWorld, i)
      .toArray() as Vector;
  const origin = new Vector3().project(camera);
  return {
    right: basis(0),
    up: basis(1),
    eye: basis(2),
    x: 320 + 255 * origin.x,
    y: 228 - 229 * origin.y,
    radius: 202 * camera.zoom,
  };
}

export function Viewport({
  scene,
  layers,
  selected,
  onPick,
  construction,
  preview,
  constructing,
  initialFrame,
  onFrame,
}: {
  scene: Scene;
  initialFrame?: Frame;
  onFrame: (frame: Frame) => void;
  construction: Construction;
  preview?: Side;
  constructing: boolean;
  layers: Layers;
  selected: ObjectId | "";
  onPick: (id: ObjectId) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    rig = useRef<Rig | null>(null);
  const [frame, setFrame] = useState(referenceFrame),
    [view, setView] = useState<View>("Oblique");
  const latest = useRef(scene);
  const report = useRef(onFrame);
  report.current = onFrame;
  latest.current = scene;
  const start = useRef<{ x: number; y: number; id?: ObjectId } | null>(null);
  useLayoutEffect(() => {
    const element = host.current!;
    const camera = new OrthographicCamera(
      -255 / 202,
      255 / 202,
      229 / 202,
      -229 / 202,
      0.01,
      30,
    );
    camera.up.set(0, 0, 1);
    camera.position.fromArray(referenceFrame.eye).multiplyScalar(4);
    const controls = new OrbitControls(camera, element);
    controls.minZoom = 0.55;
    controls.maxZoom = 3;
    controls.enableDamping = false;
    controls.listenToKeyEvents(element);
    rig.current = { camera, controls };
    let interacting = false;
    const update = () => {
      setFrame(readFrame({ camera, controls }));
      report.current(readFrame({ camera, controls }));
      if (interacting) setView("Free orbit");
    };
    const startInteraction = () => {
      interacting = true;
    };
    const endInteraction = () => {
      interacting = false;
    };
    controls.addEventListener("change", update);
    controls.addEventListener("start", startInteraction);
    controls.addEventListener("end", endInteraction);
    aim(rig.current, "Oblique", latest.current);
    if (initialFrame) {
      const f = initialFrame,
        zoom = f.radius / 202;
      const target = new Vector3()
        .fromArray(f.right)
        .multiplyScalar(-(f.x - 320) / (202 * zoom))
        .add(
          new Vector3()
            .fromArray(f.up)
            .multiplyScalar((f.y - 228) / (202 * zoom)),
        );
      controls.target.copy(target);
      camera.up.fromArray(f.up);
      camera.position.fromArray(f.eye).multiplyScalar(4).add(target);
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
      controls.update();
      setView("Free orbit");
    }
    update();
    return () => {
      controls.dispose();
      rig.current = null;
    };
  }, []);
  useEffect(() => {
    if (rig.current && view === "Triangle-normal") {
      if (scene.degeneracy) preset("Oblique");
      else aim(rig.current, view, scene);
      return;
    }
    if (rig.current && (view === "Pole-centered" || view === "Equatorial"))
      aim(rig.current, view, scene);
  }, [scene, view]);
  function preset(v: View) {
    setView(v);
    if (rig.current) {
      aim(rig.current, v, scene);
      setFrame(readFrame(rig.current));
    }
  }
  function zoom(factor: number) {
    if (!rig.current) return;
    const { camera, controls } = rig.current;
    camera.zoom = Math.min(
      controls.maxZoom,
      Math.max(controls.minZoom, camera.zoom * factor),
    );
    camera.updateProjectionMatrix();
    controls.update();
    setFrame(readFrame(rig.current));
  }
  return (
    <div className="viewport-panel">
      <div className="view-bar">
        <label>
          View{" "}
          <select
            aria-label="Camera view"
            value={view}
            onChange={(e) => preset(e.target.value as View)}
          >
            {view === "Free orbit" && <option>Free orbit</option>}
            {!scene.degeneracy && <option>Triangle-normal</option>}
            {views.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <button onClick={() => preset("Oblique")}>Reset camera</button>
      </div>
      <div
        className="viewport"
        ref={host}
        tabIndex={0}
        role="group"
        aria-label="Interactive celestial sphere"
        onPointerDownCapture={(e) => {
          if (start.current || e.button !== 0) {
            start.current = null;
            return;
          }
          const id = (e.target as Element).closest<SVGGElement>("[data-object]")
            ?.dataset.object as ObjectId | undefined;
          start.current = { x: e.clientX, y: e.clientY, id };
          if (constructing && id) {
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
          }
        }}
        onPointerUpCapture={(e) => {
          const p = start.current;
          start.current = null;
          if (p?.id && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 4)
            onPick(p.id);
        }}
        onPointerCancel={() => {
          start.current = null;
        }}
        dangerouslySetInnerHTML={{
          __html: spherePlate(scene, {
            frame,
            layers,
            selected,
            practice: true,
            construction,
            preview,
          }),
        }}
      />
      <div className="view-foot">
        <small>Drag to orbit · Scroll to zoom · Shift-drag to pan. Keyboard: arrows pan, Shift + arrows orbit. Use the object list to select.</small>
        <div className="zoom">
          <button aria-label="Zoom out" onClick={() => zoom(1 / 1.2)}>
            −
          </button>
          <button aria-label="Zoom in" onClick={() => zoom(1.2)}>
            +
          </button>
        </div>
      </div>
    </div>
  );
}
