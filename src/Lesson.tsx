import { useEffect, useState } from "react";
import type { Scenario } from "./problem.ts";
import { dailyVisibility, horizon } from "./geometry.ts";
import { checkAngle, hints, solution } from "./learning.ts";
export type LearningMode = "Independent" | "Guided" | "Demonstrate" | "Redraw";
export function Lesson({
  scenario: s,
  mode,
  setMode,
  openConstruction,
}: {
  scenario: Scenario;
  mode: LearningMode;
  setMode: (mode: LearningMode) => void;
  openConstruction: () => void;
}) {
  const [level, help] = useState(0),
    [shown, show] = useState(true),
    [steps, step] = useState(0);
  const [alt, setAlt] = useState(""),
    [az, setAz] = useState(""),
    [units, unit] = useState("degrees");
  const [visibility, setVisibility] = useState(""),
    [feedback, say] = useState(""),
    [stale, markStale] = useState(false);
  const [rule, setRule] = useState(""),
    [ruleFeedback, checkRule] = useState("");
  const [controls, hideControls] = useState(false);
  const signature = [
    s.latitudeDeg,
    s.declinationDeg,
    s.hourAngleDeg,
    s.template,
  ].join("/");
  useEffect(() => {
    markStale(true);
    say("");
    help(0);
    step(0);
  }, [signature]);
  const result = horizon(s),
    day = dailyVisibility(s.latitudeDeg, s.declinationDeg);
  const texts = hints(s),
    worked = solution(s);
  function evaluate() {
    markStale(false);
    say(
      s.template === "T3"
        ? visibility === day.kind
          ? "Correct daily visibility."
          : "Compare the daily minimum and maximum with the horizon."
        : "Altitude: " +
            checkAngle(alt, result.altitudeDeg, units) +
            " Azimuth: " +
            checkAngle(az, result.azimuthDeg, units, true),
    );
  }
  return (
    <section className="lesson" aria-label="Solve and review">
      <div className="bench-heading">
        <h2>Solve and review</h2>
        <label>
          Learning mode{" "}
          <select
            aria-label="Learning mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as LearningMode)}
          >
            {["Independent", "Guided", "Demonstrate", "Redraw"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>
      {mode === "Redraw" ? (
        <>
          <p>
            Reconstruct the geometry on paper using the givens. Mark the
            horizon, equator, pole, zenith, star and relevant great-circle arcs.
            Explain the side labels and azimuth quadrant.
          </p>
          <button onClick={() => setMode("Independent")}>
            Return to practice
          </button>
        </>
      ) : (
        <div className="lesson-grid">
          <div>
            <h3>Construct and reason</h3>
            <p>
              Identify vertices → connect great circles → label the angles →
              choose a rule → calculate → check units and quadrant.
            </p>
            <button onClick={openConstruction}>Open construction</button>
            <label className="field">
              Spherical rule
              <select
                aria-label="Spherical rule"
                value={rule}
                onChange={(e) => setRule(e.target.value)}
              >
                <option value="">Choose…</option>
                <option value="cosine">Cosine rule for sides</option>
                <option value="plane">Plane triangle cosine rule</option>
                <option value="sine">Spherical sine rule alone</option>
              </select>
            </label>
            <button
              onClick={() =>
                checkRule(
                  rule === "cosine"
                    ? "Correct. Two polar distances and their included angle determine ZS."
                    : "Use a rule relating two known spherical sides and their included angle to the third side.",
                )
              }
            >
              Check rule
            </button>
            <p role="status">{ruleFeedback}</p>
            <button
              disabled={level === 3}
              onClick={() => {
                help(level + 1);
                show(true);
                setMode("Guided");
              }}
            >
              Get hint
            </button>
            {level > 0 && (
              <>
                <button onClick={() => show(!shown)}>
                  {shown ? "Hide hints" : "Show hints"}
                </button>
                <small> Help requested · {level} of 3 hints</small>
                {shown &&
                  texts.slice(0, level).map((t, i) => (
                    <p key={i}>
                      Hint {i + 1} · {t}
                    </p>
                  ))}
              </>
            )}
          </div>
          <div>
            <h3>Check your answer</h3>
            {s.template === "T3" ? (
              <label className="field">
                Daily visibility
                <select
                  aria-label="Daily visibility"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                >
                  <option value="">Choose…</option>
                  {[
                    "never-sets",
                    "never-rises",
                    "rises-and-sets",
                    "on-horizon",
                    "touches-at-lower-transit",
                    "touches-at-upper-transit",
                  ].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                <label className="field">
                  Angle units
                  <select
                    value={units}
                    onChange={(e) => {
                      unit(e.target.value);
                      say("");
                    }}
                  >
                    <option>degrees</option>
                    <option>radians</option>
                  </select>
                </label>
                <label className="field">
                  Your altitude
                  <input
                    aria-label="Your altitude"
                    value={alt}
                    onChange={(e) => {
                      setAlt(e.target.value);
                      say("");
                    }}
                  />
                </label>
                <label className="field">
                  Your azimuth
                  <input
                    aria-label="Your azimuth"
                    value={az}
                    onChange={(e) => {
                      setAz(e.target.value);
                      say("");
                    }}
                  />
                  <small>
                    Enter undefined where a bearing has no unique value.
                  </small>
                </label>
              </>
            )}
            {stale && (alt || az || visibility) && (
              <p className="notice">
                Inputs changed. Check these answers against the current givens.
              </p>
            )}
            <button onClick={evaluate}>Check answer</button>
            <p role="status">{feedback}</p>
            <button
              onClick={() => {
                step(Math.min(worked.length, steps + 1));
                setMode("Guided");
              }}
            >
              Show next solution step
            </button>
            <button onClick={() => setMode("Demonstrate")}>
              Show full solution
            </button>
            {mode === "Demonstrate" && (
              <button onClick={() => hideControls(!controls)}>
                {controls
                  ? "Show demonstration notes"
                  : "Hide demonstration notes"}
              </button>
            )}
            {!controls && (mode === "Guided" || mode === "Demonstrate") && (
              <ol>
                {worked
                  .slice(0, mode === "Demonstrate" ? worked.length : steps)
                  .map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
              </ol>
            )}
            {mode === "Demonstrate" && (
              <button
                onClick={() => {
                  step(0);
                  setMode("Independent");
                }}
              >
                Hide solution and return to practice
              </button>
            )}
            <button onClick={() => setMode("Redraw")}>
              Independent redraw
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
