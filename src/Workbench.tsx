import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch } from "react";
import { dailyVisibility } from "./geometry.ts";
import { deriveScene } from "./scene.ts";
import { defaultLayers, layerFor, objectNames } from "./plate.ts";
import type { Layers, ObjectId } from "./plate.ts";
import { hourLabel, latitudeLabel, templates } from "./problem.ts";
import type { Edit, History } from "./problem.ts";
import { Viewport } from "./Viewport.tsx";
import { warning } from "./Builder.tsx";
import { TriangleStudio, useTriangle } from "./TriangleStudio.tsx";
import { isSide } from "./triangle.ts";
import { emptyConstruction } from "./triangle.ts";
import { Lesson } from "./Lesson.tsx";
import type { LearningMode } from "./Lesson.tsx";
import { referenceFrame } from "./plate.ts";
import type { SavedScene } from "./storage.ts";
import { SaveAndExport } from "./ScenarioFiles.tsx";

const layerNames: Record<keyof Layers, string> = {
  horizon: "Horizon",
  equator: "Celestial equator",
  meridian: "Local meridian",
  hourCircle: "Star’s hour circle",
  poles: "Celestial poles",
  vertical: "Zenith and nadir",
  cardinals: "Cardinal points",
  labels: "Point labels",
  planes: "Plane shading",
  opaque: "Opaque sphere",
};
const descriptions: Record<ObjectId, string> = {
  PZ: "Arc from the north celestial pole to the zenith.",
  PS: "Arc from the north celestial pole to the star.",
  ZS: "Arc from the zenith to the star.",
  P: "The north end of Earth’s rotation axis projected onto the sphere.",
  SCP: "The south end of Earth’s rotation axis projected onto the sphere.",
  Z: "The point directly overhead at the observer.",
  nadir: "The point directly below the observer.",
  S: "The fixed star specified by the problem.",
  north: "North on the local horizon.",
  east: "East on the local horizon.",
  south: "South on the local horizon.",
  west: "West on the local horizon.",
  horizon: "The great circle perpendicular to the observer’s vertical.",
  equator: "The great circle perpendicular to the celestial poles.",
  meridian: "The north–south great circle through zenith and nadir.",
  hourCircle: "The great circle through the star and the celestial poles.",
};
const visibilityText = {
  "never-sets": "Never sets",
  "never-rises": "Never rises",
  "rises-and-sets": "Rises and sets",
  "touches-at-lower-transit": "Touches the horizon at lower transit",
  "touches-at-upper-transit": "Touches the horizon at upper transit",
  "on-horizon": "Remains on the horizon",
};

export function Workbench({
  history,
  dispatch,
  onEdit,
  restored,
}: {
  history: History;
  dispatch: Dispatch<Edit>;
  onEdit: () => void;
  restored?: SavedScene;
}) {
  const s = history.current;
  const scene = useMemo(
    () => deriveScene(s),
    [s.latitudeDeg, s.declinationDeg, s.hourAngleDeg],
  );
  const [layers, setLayers] = useState(restored?.layers ?? defaultLayers),
    [selected, select] = useState<ObjectId | "">("");
  const studio = useTriangle(scene, restored?.construction);
  const [frame, setFrame] = useState(restored?.frame ?? referenceFrame);
  const baseline = useRef(restored?.baseline ?? s);
  const firstScene = useRef(true);
  const [learningMode, setLearningMode] = useState<LearningMode>(
    restored?.mode ?? "Independent",
  );
  useEffect(() => {
    if (firstScene.current) {
      firstScene.current = false;
      return;
    }
    setLearningMode("Independent");
  }, [scene]);
  function changeLearningMode(mode: LearningMode) {
    studio.cancel();
    reveal(null);
    setLearningMode(mode);
  }
  const displayWork =
    learningMode === "Redraw"
      ? emptyConstruction
      : learningMode === "Demonstrate" && !scene.degeneracy
        ? {
            vertices: ["P", "Z", "S"] as const,
            sides: ["PZ", "PS", "ZS"] as const,
            labels: ["PZ", "PS", "ZS", "P"] as const,
          }
        : studio.work;
  const activeSelection =
    isSide(selected) &&
    (!studio.work.sides.includes(selected) || scene.degeneracy)
      ? ""
      : selected;
  const [revealedFor, reveal] = useState<typeof s | null>(
    restored?.revealed ? s : null,
  );
  const revealed = revealedFor === s,
    drag = useRef<"idle" | "first" | "more">("idle");
  const issue = warning(scene),
    hourDefined = Math.abs(s.declinationDeg) !== 90;
  function pick(id: ObjectId | "") {
    select(id);
    if (!id) return;
    studio.pick(id);
    const layer = layerFor(id);
    if (layer && !layers[layer]) setLayers({ ...layers, [layer]: true });
  }
  const starStatus =
    Math.abs(scene.star.altitudeDeg) < 1e-10
      ? "On the horizon"
      : scene.star.altitudeDeg > 0
        ? "Above the horizon"
        : "Below the horizon";
  return (
    <main className="bench">
      <div className="bench-heading">
        <div>
          <div className="eyebrow">Geometry workbench</div>
          <h1>{templates[s.template]}</h1>
        </div>
        <div className="actions">
          <button
            onClick={() => {
              changeLearningMode("Independent");
              studio.changeMode("Vertices");
              studio.open(true);
              requestAnimationFrame(() =>
                document
                  .getElementById("triangle-studio")
                  ?.scrollIntoView({ block: "start" }),
              );
            }}
          >
            Construct triangle
          </button>
          <button
            onClick={() => dispatch({ kind: "undo" })}
            disabled={!history.past.length}
          >
            ↶ Undo
          </button>
          <button
            onClick={() => dispatch({ kind: "redo" })}
            disabled={!history.future.length}
          >
            ↷ Redo
          </button>
          <button onClick={onEdit}>Edit problem</button>
        </div>
      </div>
      <div className="bench-grid">
        <aside className="bench-left">
          <h2>Given coordinates</h2>
          <dl className="values">
            <div>
              <dt>Latitude φ</dt>
              <dd>{latitudeLabel(s.latitudeDeg)}</dd>
            </div>
            <div>
              <dt>Declination δ</dt>
              <dd>{s.declinationDeg}°</dd>
            </div>
            {s.template !== "T3" && (
              <div>
                <dt>Hour angle H</dt>
                <dd>{hourLabel(s.hourAngleDeg)}</dd>
              </div>
            )}
          </dl>
          <h2>Visible layers</h2>
          <div className="layers">
            {Object.entries(layerNames).map(([k, name]) => {
              const key = k as keyof Layers;
              return (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={layers[key]}
                    onChange={(e) => {
                      setLayers({ ...layers, [key]: e.target.checked });
                      if (
                        !e.target.checked &&
                        selected &&
                        layerFor(selected) === key
                      )
                        select("");
                    }}
                  />
                  {name}
                </label>
              );
            })}
          </div>
        </aside>
        <div className="stage">
          <Viewport
            scene={scene}
            initialFrame={restored?.frame}
            onFrame={setFrame}
            layers={layers}
            selected={activeSelection}
            construction={{
              vertices: [...displayWork.vertices],
              sides: [...displayWork.sides],
              labels: [...displayWork.labels],
            }}
            preview={learningMode === "Redraw" ? undefined : studio.preview}
            constructing={
              studio.opened &&
              studio.mode !== "Inspect" &&
              learningMode !== "Redraw"
            }
            onPick={pick}
          />
          <div className="hour-control">
            <label htmlFor="hour-range">
              {s.template === "T3"
                ? "Exploration hour angle"
                : "Local hour angle"}{" "}
              <i>H</i>
            </label>
            <output htmlFor="hour-range">{hourLabel(s.hourAngleDeg)}</output>
            <input
              id="hour-range"
              type="range"
              min="-180"
              max="180"
              step="any"
              value={s.hourAngleDeg}
              disabled={s.template === "T2"}
              onPointerDown={() => {
                drag.current = "first";
              }}
              onPointerUp={() => {
                drag.current = "idle";
              }}
              onPointerCancel={() => {
                drag.current = "idle";
              }}
              onBlur={() => {
                drag.current = "idle";
              }}
              onChange={(e) => {
                const value = Number(Number(e.target.value).toFixed(2));
                if (value === s.hourAngleDeg) return;
                dispatch({
                  kind: "set",
                  value: { ...s, hourAngleDeg: value },
                  coalesce: drag.current === "more",
                });
                if (drag.current !== "idle") drag.current = "more";
              }}
            />
            <small>
              {s.template === "T2" ? "Fixed at upper transit" : "−180° East"}
            </small>
            <small>{s.template === "T2" ? "H = 0°" : "+180° West"}</small>
          </div>
        </div>
        <aside className="inspector">
          <h2>Object inspector</h2>
          <label className="field">
            Select an object
            <select
              value={activeSelection}
              onChange={(e) => pick(e.target.value as ObjectId | "")}
            >
              <option value="">Choose an object…</option>
              {Object.entries(objectNames)
                .filter(
                  ([id]) =>
                    !isSide(id) ||
                    (!scene.degeneracy && studio.work.sides.includes(id)),
                )
                .filter(([k]) => k !== "hourCircle" || hourDefined)
                .map(([id, name]) => (
                  <option key={id} value={id}>
                    {id === "S" ? "Star · " + s.starName : name}
                  </option>
                ))}
            </select>
          </label>
          {activeSelection ? (
            <p>
              {selected === "hourCircle" && !hourDefined
                ? "At a celestial pole the star has no unique hour circle."
                : descriptions[activeSelection]}
            </p>
          ) : (
            <p>
              Pick a point or circle on the sphere, or choose it from the list.
            </p>
          )}
          <div className="sub">
            <h2>Practice</h2>
            <p>
              {s.question ||
                "Find " +
                  s.target.toLowerCase() +
                  " for star " +
                  s.starName +
                  "."}
            </p>
            <div className="star-status">{starStatus}</div>
            {learningMode !== "Redraw" && (
              <button
                aria-expanded={revealed}
                onClick={() => reveal(revealed ? null : s)}
              >
                {revealed ? "Hide results" : "Reveal results"}
              </button>
            )}
            {revealed && learningMode !== "Redraw" && (
              <div className="results" aria-live="polite">
                {s.template === "T3" && (
                  <p>
                    {
                      visibilityText[
                        dailyVisibility(s.latitudeDeg, s.declinationDeg).kind
                      ]
                    }
                  </p>
                )}
                <dl className="values">
                  <div>
                    <dt>Altitude h</dt>
                    <dd>{scene.star.altitudeDeg.toFixed(2)}°</dd>
                  </div>
                  <div>
                    <dt>Azimuth A</dt>
                    <dd>
                      {scene.star.azimuthDeg === null
                        ? "Undefined"
                        : (
                            Number(scene.star.azimuthDeg.toFixed(2)) % 360
                          ).toFixed(2) + "°"}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
          {issue && <p className="notice">{issue}</p>}
          <details open className="conventions">
            <summary>Conventions</summary>
            <p>
              H increases westward. Azimuth runs from north (0°) through east
              (90°). Angles are in degrees.
            </p>
            <p>Geometric horizon · No refraction</p>
          </details>
          {s.notes && (
            <details>
              <summary>Problem notes</summary>
              <p>{s.notes}</p>
            </details>
          )}
        </aside>
      </div>
      <SaveAndExport
        snapshot={{
          format: "astrosphere",
          version: 1,
          name: restored?.name ?? s.starName + " — " + templates[s.template],
          problem: s,
          baseline: baseline.current,
          layers,
          frame,
          construction: studio.work,
          mode: learningMode,
          revealed,
        }}
        onReset={() => {
          dispatch({ kind: "set", value: baseline.current });
          changeLearningMode("Independent");
        }}
      />
      <Lesson
        scenario={s}
        mode={learningMode}
        setMode={changeLearningMode}
        openConstruction={() => {
          studio.open(true);
          studio.changeMode("Vertices");
          document.getElementById("triangle-studio")?.scrollIntoView();
        }}
      />
      {learningMode !== "Redraw" && learningMode !== "Demonstrate" && (
        <TriangleStudio
          studio={studio}
          scene={scene}
          selected={activeSelection}
          pick={pick}
        />
      )}
    </main>
  );
}
