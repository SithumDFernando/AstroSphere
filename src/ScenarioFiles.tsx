import { useState } from "react";
import {
  download,
  readLibrary,
  storageKey,
  storeScene,
  validateScene,
} from "./storage.ts";
import type { SavedScene } from "./storage.ts";
import { diagramSvg, pngBlob } from "./diagramExport.ts";
export function ScenarioLibrary({
  onOpen,
}: {
  onOpen: (scene: SavedScene) => void;
}) {
  const [opened, open] = useState(false),
    [items, list] = useState<SavedScene[]>([]),
    [pending, preview] = useState<SavedScene | null>(null),
    [message, say] = useState("");
  function refresh() {
    try {
      list(readLibrary());
      say("");
    } catch (e) {
      say(String(e));
    }
  }
  return (
    <section className="library">
      <button
        onClick={() => {
          open(!opened);
          refresh();
        }}
      >
        Saved scenarios and import
      </button>
      {opened && (
        <div className="library-body">
          <h2>Scenario library</h2>
          <p>
            Saved in this browser. Download JSON files for backup or sharing.
          </p>
          <label className="field">
            Import scenario JSON
            <input
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                preview(null);
                if (!file) return;
                try {
                  if (file.size > 1000000)
                    throw new Error(
                      "Scenario files must be smaller than 1 MB.",
                    );
                  preview(validateScene(JSON.parse(await file.text())));
                  say("");
                } catch (error) {
                  say(String(error));
                }
              }}
            />
          </label>
          {pending && (
            <div className="notice">
              <h3>{pending.name}</h3>
              <p>
                φ {pending.problem.latitudeDeg}° · δ{" "}
                {pending.problem.declinationDeg}° · H{" "}
                {pending.problem.hourAngleDeg}° · {pending.mode}
              </p>
              <button
                onClick={() => {
                  onOpen(pending);
                  preview(null);
                  open(false);
                }}
              >
                Open imported scenario
              </button>
              <button onClick={() => preview(null)}>Cancel import</button>
            </div>
          )}
          {items.map((item) => (
            <div className="saved-item" key={item.name}>
              <strong>{item.name}</strong>
              <button
                onClick={() => {
                  onOpen(item);
                  open(false);
                }}
              >
                Open {item.name}
              </button>
              <button
                onClick={() => {
                  if (!confirm("Delete saved scenario " + item.name + "?"))
                    return;
                  try {
                    localStorage.setItem(
                      storageKey,
                      JSON.stringify(items.filter((s) => s.name !== item.name)),
                    );
                    refresh();
                  } catch (e) {
                    say(String(e));
                  }
                }}
              >
                Delete {item.name}
              </button>
            </div>
          ))}
          {!items.length && (
            <p>No saved scenarios yet. Save one from the workbench.</p>
          )}
          <p role="status">{message}</p>
        </div>
      )}
    </section>
  );
}
export function SaveAndExport({
  snapshot,
  onReset,
}: {
  snapshot: SavedScene;
  onReset: () => void;
}) {
  const [name, setName] = useState(snapshot.name),
    [message, say] = useState(""),
    [visible, show] = useState(false);
  const [triangle, setTriangle] = useState(false),
    [gray, setGray] = useState(false),
    [transparent, setTransparent] = useState(false),
    [note, setNote] = useState(true),
    [labels, setLabels] = useState(true),
    [size, setSize] = useState(1600);
  const saved = { ...snapshot, name: name.trim() };
  let svg = "",
    error = "";
  try {
    svg = diagramSvg(saved, {
      triangle,
      grayscale: gray,
      transparent,
      note,
      labels,
    });
  } catch (e) {
    error = String(e);
  }
  async function exportFile(png: boolean) {
    try {
      if (!svg) throw new Error(error);
      const filename = (name.trim() || "AstroSphere").replace(
        /[^a-z0-9_-]/gi,
        "_",
      );
      download(
        png
          ? await pngBlob(svg, size, transparent)
          : new Blob([svg], { type: "image/svg+xml" }),
        filename + (png ? ".png" : ".svg"),
      );
      say("Diagram downloaded.");
    } catch (e) {
      say(String(e));
    }
  }
  return (
    <section className="save-panel">
      <div className="actions">
        <label>
          Scenario name{" "}
          <input
            aria-label="Scenario name"
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button
          onClick={() => {
            try {
              const entry = validateScene(saved);
              const existing = readLibrary().some((s) => s.name === entry.name);
              if (
                existing &&
                !confirm("Replace saved scenario " + entry.name + "?")
              )
                return;
              storeScene(entry);
              say("Saved in this browser.");
            } catch (e) {
              say(String(e));
            }
          }}
        >
          Save locally
        </button>
        <button
          onClick={() => {
            try {
              download(
                new Blob([JSON.stringify(validateScene(saved), null, 2)], {
                  type: "application/json",
                }),
                "AstroSphere-scenario.json",
              );
              say("Scenario downloaded.");
            } catch (e) {
              say(String(e));
            }
          }}
        >
          Export scenario JSON
        </button>
        <button
          onClick={() => {
            if (confirm("Reset inputs to the saved question?")) onReset();
          }}
        >
          Reset to question
        </button>
        <button onClick={() => show(!visible)}>Export diagrams</button>
      </div>
      <p role="status">{message}</p>
      {visible && (
        <div className="export-grid">
          <div>
            <h2>Diagram export</h2>
            <label className="field">
              Diagram
              <select
                aria-label="Diagram"
                value={triangle ? "triangle" : "sphere"}
                onChange={(e) => setTriangle(e.target.value === "triangle")}
              >
                <option value="sphere">Full celestial sphere</option>
                <option value="triangle">Isolated triangle</option>
              </select>
            </label>
            {[
              ["Grayscale print", gray, setGray],
              ["Transparent background", transparent, setTransparent],
              ["Conventions note", note, setNote],
              ["Diagram labels", labels, setLabels],
            ].map(([title, value, set]) => (
              <label className="export-option" key={String(title)}>
                <input
                  type="checkbox"
                  checked={value as boolean}
                  onChange={(e) =>
                    (set as (v: boolean) => void)(e.target.checked)
                  }
                />
                {title as string}
              </label>
            ))}
            <label className="field">
              PNG resolution
              <select
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              >
                {[800, 1600, 2400, 3200].map((n) => (
                  <option key={n} value={n}>
                    {n} × {n} pixels
                  </option>
                ))}
              </select>
            </label>
            <p>
              Exports fit the geometry into the page using the current camera
              orientation. Construction and revealed labels follow your current
              learning mode.
            </p>
            <button disabled={!svg} onClick={() => exportFile(false)}>
              Download SVG
            </button>
            <button disabled={!svg} onClick={() => exportFile(true)}>
              Download PNG
            </button>
            <p className="error">{error}</p>
          </div>
          {svg && (
            <img
              className="export-preview"
              alt="Diagram export preview"
              src={
                "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)
              }
            />
          )}
        </div>
      )}
    </section>
  );
}
