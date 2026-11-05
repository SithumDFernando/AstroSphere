import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { deriveScene, referenceProblem } from "./scene.ts";
import { spherePlate } from "./plate.ts";
import {
  blankDraft,
  examples,
  initialHistory,
  revise,
  templates,
  toDraft,
} from "./problem.ts";
import type { Draft, History, Scenario } from "./problem.ts";
import { Builder } from "./Builder.tsx";
import { Workbench } from "./Workbench.tsx";
import { exercises, exerciseScenario } from "./learning.ts";
import { ScenarioLibrary } from "./ScenarioFiles.tsx";
import type { SavedScene } from "./storage.ts";

const frontPlate = spherePlate(deriveScene(referenceProblem));
const summaries = [
  "Relate a star’s equatorial coordinates to the observer’s horizon.",
  "Inspect a star as it crosses the observer’s upper meridian.",
  "Follow a star through a full turn of local hour angle.",
];
const givens = [
  "φ +30°   δ +20°   H 45° W",
  "φ +40°   δ −10°   H 0°",
  "φ +60°   δ +60°",
];
function TemplateMark({ index }: { index: number }) {
  return (
    <svg
      viewBox="0 0 42 42"
      width="42"
      height="42"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="21" cy="21" r="16" stroke="currentColor" />
      <ellipse cx="21" cy="24" rx="16" ry="5" stroke="currentColor" />
      {index === 0 ? (
        <>
          <path
            d="M11 17 Q17 7 24 7 Q30 12 31 20 Q21 17 11 17Z"
            stroke="currentColor"
          />
          <circle cx="31" cy="20" r="2" fill="currentColor" />
        </>
      ) : index === 1 ? (
        <>
          <ellipse cx="21" cy="21" rx="7" ry="16" stroke="currentColor" />
          <circle cx="22" cy="5" r="2.5" fill="currentColor" />
        </>
      ) : (
        <>
          <ellipse cx="21" cy="14" rx="12" ry="4" stroke="currentColor" />
          <circle cx="29" cy="11" r="2" fill="currentColor" />
        </>
      )}
    </svg>
  );
}
function App() {
  const [appearance, setAppearance] = useState("Standard");
  const [offlineReady, setOfflineReady] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.appearance = appearance;
  }, [appearance]);
  useEffect(() => {
    if (location.protocol === "file:" || !("serviceWorker" in navigator))
      return;
    let active = true;
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(() => navigator.serviceWorker.ready)
      .then(() => {
        if (active) setOfflineReady(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const [screen, screenTo] = useState<"home" | "builder" | "workbench">("home");
  const [history, setHistory] = useState<History | null>(null),
    [generation, newSession] = useState(0);
  const [initial, setInitial] = useState<Draft>(blankDraft),
    [editing, setEditing] = useState(false);
  const [restored, restore] = useState<SavedScene | undefined>();
  useEffect(() => {
    document.title =
      { home: "Studio", builder: "Problem builder", workbench: "Workbench" }[
        screen
      ] + " · AstroSphere";
    window.scrollTo(0, 0);
    const visible = Array.from(
      document.querySelectorAll<HTMLElement>("h1"),
    ).find((el) => el.getClientRects().length > 0);
    visible?.setAttribute("tabindex", "-1");
    visible?.focus({ preventScroll: true });
  }, [screen]);
  function build(draft: Draft, edit = false) {
    setInitial(draft);
    setEditing(edit);
    screenTo("builder");
  }
  function open(s: Scenario) {
    if (editing && history) {
      const value =
        s.template === "T3" && history.current.template === "T3"
          ? { ...s, hourAngleDeg: history.current.hourAngleDeg }
          : s;
      setHistory(revise(history, { kind: "set", value }));
    } else {
      restore(undefined);
      setHistory(initialHistory(s));
      newSession((v) => v + 1);
    }
    screenTo("workbench");
  }
  return (
    <>
      <header className="mast">
        <div className="mast-inner">
          <button
            className="brand"
            onClick={() => screenTo("home")}
            aria-label="AstroSphere Studio home"
          >
            <span className="brand-orb" />
            AstroSphere <i>Studio</i>
          </button>
          <nav aria-label="Studio navigation">
            <button
              aria-current={screen === "home" ? "page" : undefined}
              onClick={() => screenTo("home")}
            >
              Studio
            </button>
            <button
              aria-current={screen === "builder" ? "page" : undefined}
              onClick={() => {
                if (screen !== "builder") build({ ...blankDraft });
              }}
            >
              Problem builder
            </button>
            {history && (
              <button
                aria-current={screen === "workbench" ? "page" : undefined}
                onClick={() => screenTo("workbench")}
              >
                Workbench
              </button>
            )}
          </nav>
        </div>
      </header>
      <div className="access-bar">
        <a href="./user-manual.html" target="_blank" rel="noopener">User manual</a>
        <a href="#main-content">Skip to content</a>
        <label>
          Display{" "}
          <select
            aria-label="Display appearance"
            value={appearance}
            onChange={(e) => setAppearance(e.target.value)}
          >
            {["Standard", "High contrast", "Grayscale"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <small>
          {offlineReady
            ? "Ready for offline use in this browser"
            : "Download the built app folder for portable offline use"}
        </small>
      </div>
      <div id="main-content" tabIndex={-1} />
      <ScenarioLibrary
        onOpen={(snapshot) => {
          restore(snapshot);
          setHistory(initialHistory(snapshot.problem));
          newSession((v) => v + 1);
          setEditing(false);
          screenTo("workbench");
        }}
      />
      {screen === "home" && (
        <main className="page home">
          <div className="hero">
            <div className="intro">
              <div className="eyebrow">
                <span className="short-rule" />
                Spherical astronomy
              </div>
              <h1>
                Explore the
                <br />
                <em>celestial sphere.</em>
              </h1>
              <p>
                Set an observer’s latitude, place a star, and study how its
                position changes across the local sky.
              </p>
              <button
                className="primary"
                onClick={() => build({ ...blankDraft })}
              >
                Build a problem <span>↗</span>
              </button>
            </div>
            <figure className="hero-plate">
              <div
                className="hero-diagram"
                dangerouslySetInnerHTML={{ __html: frontPlate }}
              />
              <figcaption>
                <span>EX–01</span> Pole–zenith–star triangle
              </figcaption>
            </figure>
          </div>
          <div className="section-head">
            <h2>Start from an example</h2>
            <span>Geometry-only exercises</span>
          </div>
          <div className="examples">
            {examples.map((d, i) => (
              <button
                key={d.template}
                className="example"
                onClick={() => build({ ...d })}
              >
                <div className="example-mark">
                  <TemplateMark index={i} />
                  <span>↗</span>
                </div>
                <h3>{templates[d.template]}</h3>
                <p>{summaries[i]}</p>
                <div className="givens">{givens[i]}</div>
              </button>
            ))}
          </div>
          <div className="section-head">
            <h2>Practice library</h2>
            <span>Five guided exercises</span>
          </div>
          <div className="exercise-library">
            {exercises.map((ex) => (
              <button
                aria-label={"Start " + ex.id}
                key={ex.id}
                onClick={() => {
                  setEditing(false);
                  restore(undefined);
                  setHistory(initialHistory(exerciseScenario(ex)));
                  newSession((v) => v + 1);
                  screenTo("workbench");
                }}
              >
                <small>{ex.id}</small>
                <h3>{ex.title}</h3>
                <p>{ex.goal}</p>
              </button>
            ))}
          </div>
        </main>
      )}
      {screen === "builder" && (
        <Builder
          initial={initial}
          editing={editing}
          onSubmit={open}
          onCancel={() => screenTo(editing ? "workbench" : "home")}
        />
      )}
      {history && (
        <div hidden={screen !== "workbench"}>
          <Workbench
            key={generation}
            history={history}
            restored={restored}
            dispatch={(edit) => setHistory((h) => h && revise(h, edit))}
            onEdit={() => build(toDraft(history.current), true)}
          />
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("app")!).render(<App />);
