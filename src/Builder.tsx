import { useState } from "react";
import type { FormEvent } from "react";
import { deriveScene } from "./scene.ts";
import {
  hourLabel,
  latitudeLabel,
  parseDraft,
  targets,
  templates,
} from "./problem.ts";
import type { Draft, Scenario } from "./problem.ts";

export function warning(scene: ReturnType<typeof deriveScene>) {
  const cause = scene.star.undefinedBearing;
  const az = cause
    ? "Azimuth is undefined " +
      (cause === "geographic-pole"
        ? "at a geographic pole."
        : "at the " + cause + ".")
    : "";
  return [az, scene.degeneracy].filter(Boolean).join(" ");
}

export function Builder({
  initial,
  editing,
  onSubmit,
  onCancel,
}: {
  initial: Draft;
  editing: boolean;
  onSubmit: (s: Scenario) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial),
    [attempted, setAttempted] = useState(false);
  const { errors, scenario } = parseDraft(draft);
  const update = (key: keyof Draft, value: string) =>
    setDraft((v) => ({ ...v, [key]: value }));
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAttempted(true);
    if (scenario) onSubmit(scenario);
    else
      e.currentTarget
        .querySelector<HTMLInputElement>(
          '[name="' + Object.keys(errors)[0] + '"]',
        )
        ?.focus();
  }
  function field(
    key: "latitude" | "declination" | "hour" | "starName",
    label: string,
    hint: string,
  ) {
    const error = attempted && errors[key];
    return (
      <label className="field">
        {label}
        <input
          name={key}
          value={draft[key]}
          maxLength={key === "starName" ? 64 : 48}
          inputMode={key === "starName" ? "text" : "decimal"}
          onChange={(e) => update(key, e.target.value)}
          aria-invalid={!!error}
          aria-describedby={key + "-hint"}
          autoComplete="off"
        />
        <small id={key + "-hint"} className={error ? "error" : ""}>
          {error || hint}
        </small>
      </label>
    );
  }
  const issue = scenario ? warning(deriveScene(scenario)) : "";
  return (
    <main className="page">
      <div className="page-heading">
        <div className="eyebrow">Geometry-only problem</div>
        <h1>{editing ? "Edit problem" : "Problem builder"}</h1>
      </div>
      <form noValidate onSubmit={submit} className="builder-grid">
        <div className="form-card">
          <label className="field">
            Problem type
            <select
              value={draft.template}
              onChange={(e) => update("template", e.target.value)}
            >
              {Object.entries(templates).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <div className="field-row">
            {field(
              "latitude",
              "Observer latitude φ",
              "−90° to +90° · North positive",
            )}
            {field("starName", "Star name", "Name or symbol")}
          </div>
          <div className="field-row">
            {field(
              "declination",
              "Declination δ",
              "−90° to +90° · North positive",
            )}
            {draft.template === "T1" ? (
              field(
                "hour",
                "Local hour angle H",
                "Degrees · West positive, east negative",
              )
            ) : (
              <div className="field">
                <span>Local hour angle H</span>
                <p className="fixed">
                  {draft.template === "T2"
                    ? "Fixed at 0° for upper transit"
                    : "Varies over one full turn"}
                </p>
              </div>
            )}
          </div>
          {draft.template === "T1" && (
            <label className="field">
              Find
              <select
                value={draft.target}
                onChange={(e) => update("target", e.target.value)}
              >
                {targets.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          )}
          <details>
            <summary>Question text and notes</summary>
            <label className="field">
              Original question
              <textarea
                value={draft.question}
                onChange={(e) => update("question", e.target.value)}
              />
            </label>
            <label className="field">
              Notes
              <textarea
                value={draft.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </label>
          </details>
        </div>
        <aside className="preview">
          <div className="eyebrow">Problem preview</div>
          <h2>{templates[draft.template]}</h2>
          {scenario ? (
            <>
              <p>
                Observer at{" "}
                <strong>{latitudeLabel(scenario.latitudeDeg)}</strong>, star{" "}
                <strong>{scenario.starName}</strong> at declination{" "}
                <strong>{scenario.declinationDeg}°</strong>
                {scenario.template !== "T3" && (
                  <>
                    , local hour angle{" "}
                    <strong>{hourLabel(scenario.hourAngleDeg)}</strong>
                  </>
                )}
                .
              </p>
              <p>
                Find <strong>{scenario.target.toLowerCase()}</strong>.
              </p>
            </>
          ) : (
            <p>Enter the given coordinates to preview your problem.</p>
          )}
          {draft.template === "T3" && (
            <p>
              The exploration starts at upper transit (H = 0°). Move H to
              inspect the daily path.
            </p>
          )}
          {issue && <p className="notice">{issue}</p>}
          <div className="assumptions">
            Fixed star · Geometric horizon · No refraction
          </div>
          <button className="primary" type="submit">
            {editing ? "Apply changes" : "Create scene"} <span>→</span>
          </button>
          <button className="plain" type="button" onClick={onCancel}>
            Cancel
          </button>
        </aside>
      </form>
    </main>
  );
}
