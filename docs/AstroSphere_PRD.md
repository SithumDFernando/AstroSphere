# AstroSphere Studio
## MVP Product Requirements Document (PRD)

**Version:** 0.1 (proposed baseline)  
**Date:** 5 November 2026  
**Status:** Draft for product discovery and technical validation  
**Target audience:** Astronomy Olympiad students and coaches  
**Entry experience:** Structured manual question builder  
**Platform:** Desktop-first browser app; responsive tablet support later  
**Product principle:** Geometry first; explanations second; answers last.

> **Product vision.** Help an Olympiad student translate a spherical astronomy word problem into a mathematically correct celestial-sphere scene, independently identify the relevant geometry, construct and label a spherical triangle, solve it, and produce a reproducible 2D exam diagram. Enable coaches to demonstrate the same process without redrawing every figure.

## 1. Executive summary

AstroSphere Studio is a focused visual problem-solving environment, not a general-purpose planetarium. Its primary interface combines (1) a structured astronomical scenario, (2) a manipulable 3D celestial sphere, (3) synchronized 2D diagrams, and (4) a progressively revealed reasoning panel. The central learning outcome is **transfer**: after using the studio, students should be better able to reconstruct correct geometry on paper for an unseen problem.

**MVP release hypothesis:** A reliable, interactive pole–zenith–star (P–Z–S) geometry workbench with graduated hints and exportable diagrams will reduce the time needed to understand and teach classic coordinate and spherical-trigonometry problems.

**Release boundary:** The MVP models idealized fixed-direction celestial objects on an observer-centered celestial sphere. It permits a *geometry-only* question defined by latitude, declination and hour angle; it does not require real dates, time zones, star catalogues, planetary ephemerides, or accounts. An hour-angle animation may demonstrate diurnal motion but must not be mislabeled as a real-time ephemeris.

## 2. Problem and opportunity

Students struggle with tasks that precede substitution into a formula: selecting a coordinate system, orienting a 3D sphere, identifying poles/zenith/meridian/horizon, drawing the correct great circles, recognizing the angular data, and deriving a 2D exam-ready sketch. Coaches face similar friction when preparing live demonstrations and correcting students' spatial misconceptions.

Existing sky simulators can show where objects appear; the unmet need addressed here is a **construction-to-reasoning workflow**. The platform must preserve a visible connection between the physical-looking scene, its mathematical spherical geometry, and the resulting written solution.

**Jobs to be done**

1. When I read an Olympiad problem, help me translate its given quantities into a spatial model without silently assuming missing information.
2. When I cannot identify a triangle, let me explore and select its components; reveal only enough guidance to continue.
3. When I draw a diagram, help me understand which arcs, planes and projected features are mathematically meaningful.
4. When I teach juniors, let me reuse a precise demonstration, progressively reveal geometry, and share a diagram that matches my explanation.

## 3. Users, contexts, and goals

| Persona | Primary situation | Success means |
|---|---|---|
| Developing Olympiad student | Knows basic coordinates but struggles to visualize 3D relationships | Constructs the P–Z–S triangle correctly and explains each side/angle |
| Advanced Olympiad student | Practices unfamiliar variants under time pressure | Solves without hints; can test limiting cases and export clean sketches |
| Olympiad coach | Teaches in a classroom or online | Creates a scenario quickly, isolates key geometry, and exports diagrams |
| Problem author / coach | Prepares structured exercises | Saves a deterministic scenario plus task prompts and expected results |

**Primary context:** laptop/desktop, mouse or trackpad, typical 1366 × 768 or larger screen. A touchscreen or mobile-only interface is not an initial acceptance target. No user account should be required to try the MVP.

### 3.1 Product goals

- G1. A new student can build a standard latitude–declination–hour-angle scenario and view it in 3D without external setup.
- G2. Students can construct and validate a spherical P–Z–S triangle, including great-circle arcs and meaningful labels.
- G3. Students can obtain hints in stages and verify a numerical solution without making the full solution the default.
- G4. Users can generate a correct, legible 2D celestial-sphere drawing and isolated triangle diagram.
- G5. Coaches can prepare, save, reopen, and exchange self-contained problem scenarios.

### 3.2 Explicit non-goals for MVP

No natural-language or OCR problem parser; no photo upload; no live cloud collaboration; no account system, grades or leaderboard; no realistic horizon landscape; no star catalogue; no high-precision solar-system ephemeris; no multi-location synchronized observer comparison; no full time-zone/time-of-date simulation; no symbolic solver for arbitrary spherical triangles; no guarantee of automatic diagram aesthetics for every pathological configuration.

## 4. Learning and design principles

**One mathematical truth, multiple views.** All drawings and outputs derive from the same canonical spherical vectors and observer settings. Camera rotation may change appearance, never numerical coordinates.

**Construct before reveal.** The app should initially offer interaction and questions; hints reveal concepts progressively, with a separate explicit action to show the complete construction.

**Explain what an object represents.** A line segment in a 3D projection is not automatically a spherical arc. All angle labels refer to spherical geometry unless explicitly called projected screen angles.

**Make conventions visible.** North/east/up reference, azimuth zero, sign of hour angle, unit conversions and correction assumptions are always available in the interface and included with exports.

**Handle ambiguity visibly.** Missing or contradictory inputs should produce an understandable message; the software must not invent a date, observer longitude or star position.

**Design for independent reconstruction.** Provide a 'hide solution / redraw' stage and keep printable diagrams uncluttered.

## 5. MVP feature scope and release slices

| Slice | Contents | Release priority |
|---|---|---|
| Foundation | Spherical-vector engine; reference planes, poles, zenith and coordinate transforms; test harness | P0, cannot be skipped |
| Interactive sphere | Mouse/touchpad camera; select points; toggles; linked inspector; consistent geometry | P0 |
| Problem builder | Structured geometry-only form; knowns/unknowns; scenario validation; presets | P0 |
| Triangle studio | Pick P, Z, S; trace great-circle arcs; annotate sides/angles; degenerate-case explanation | P0 |
| Guided solving | Independent / guided / demonstrated paths; progressive hints; direct formula evaluation; self-check | P0 |
| Diagram export | 2D celestial-sphere snapshot, isolated triangle and SVG/PNG output | P0 |
| Persistence | Local save/reopen, versioned JSON import/export, reset-to-question | P0 |
| Educational content | 3–5 curated exercises covering altitude/azimuth, meridian transit and rising/circumpolarity | P0 |
| True UTC time/date and RA-driven simulation | Sidereal time, geographic longitude and shared instant | P1 |
| Multiple observers, Sun/Moon/planets, teacher playlists, cloud sharing | Extended simulations and classroom features | P1/P2 |

**P0 scope clarification:** longitude may be stored as optional metadata or shown disabled in geometry-only mode, but it does not affect a problem expressed entirely through local hour angle H. This is deliberate, not a bug.

## 6. End-to-end workflows

### 6.1 Student journey A: Create and solve a problem

1. Choose **New problem → Geometry-only**.
2. Select **Find altitude and azimuth**; enter observer latitude φ, star declination δ and local hour angle H with explicit east/west convention.
3. Review a structured problem summary with knowns, target unknowns, and assumptions; choose **Create scene**.
4. Inspect the 3D sphere; toggle horizon/equator/meridian and orbit the camera; optionally lock the scene to a canonical view.
5. Select vertices P, Z and S in **Construct triangle** mode. The app previews and commits minor great-circle arcs on the sphere.
6. Label PZ, PS, ZS and angle ZPS, either from choices or manually; receive correctness feedback without revealing all answers.
7. Select the cosine rule for sides, solve for ZS, convert to h, and determine azimuth with the correct quadrant.
8. Review steps, reset the scene to the question, or switch to **Independent redraw** mode.
9. Export the full 2D diagram and/or isolated mathematical triangle as SVG/PNG; optionally save scenario JSON.

### 6.2 Student journey B: Recover from confusion

In any construction step, **Hint 1** describes a geometric relationship, **Hint 2** points toward a relevant object/arc, and **Hint 3** reveals the next construction or formula. **Show full solution** remains a distinct, conspicuous action. Hints should not automatically advance the exercise or overwrite user work. The student can undo a misplaced vertex or reset an individual step.

### 6.3 Coach journey: Prepare and demonstrate

A coach opens a preset, adjusts φ/δ/H, selects which geometry layers to display, configures a canonical camera, and saves a JSON scenario. In presentation use, controls can be hidden and labels revealed stepwise. The coach exports a diagram and shares the scenario file with students. Custom scripted lesson sequences and classroom accounts are outside MVP.

## 7. Information architecture and screens

| Screen ID | Screen | Required areas | Primary action |
|---|---|---|---|
| S01 | Home / exercise launch | New problem, examples, open saved scenario, recent local scenarios | Start or resume |
| S02 | Structured Problem Builder | Template, observer, object, coordinates, unknowns, conventions, validation/preview | Create scene |
| S03 | Problem Workbench | Header, left scenario inspector, central 3D sphere, right guidance, lower linked 2D panel | Investigate and construct |
| S04 | Geometry and Diagram Studio | 3D source, 2D projection, isolated triangle, diagram settings and export preview | Refine / export diagram |
| S05 | Solution and Review | Student inputs, formula steps, calculated results, hint history, independent redraw | Check and consolidate |
| S06 | Scenario library and import/export | Curated presets, saved local scenes, import JSON, scenario metadata | Reuse / share |

### 7.1 S02 — Structured Problem Builder specification

**Mode selector.** Only **Geometry-only (φ, δ, H)** is editable in P0; a future **Time-anchored (φ, λ, UTC, RA, Dec)** mode may appear as 'coming later' or remain hidden. The two input modes must never be blended into an overdetermined scenario.

**Field groups.** Observer: signed latitude φ in [-90°, +90°] (N positive); object: user-defined name and declination δ in [-90°, +90°] (N positive); hour angle H in a documented range, west-positive; question type; unknowns (altitude and/or azimuth); optional original question text; optional notes.

**Validation.** Reject nonnumeric values, |φ| > 90°, |δ| > 90°, and unsupported question templates. Normalize H modulo 360° while retaining a west/east label. Show a precise warning when zenith/nadir positions make azimuth undefined, or when a chosen triangle degenerates. A saved scenario is reproducible using only its stored values and version.

**Preview.** Before scene creation show a human-readable summary, for example: 'Observer at 30° N; star S at δ = +20°; H = 45° W; find altitude and azimuth; idealized geometric horizon, no refraction.'

### 7.2 S03 — Workbench layout and controls

**Top bar:** problem name; mode (Explore / Solve / Demo); Save; Undo / Redo; Reset to problem; Settings; Export. **Left panel (approximately 22–26%):** given values, coordinate inspector, layers. **Center (approximately 45–55%):** interactive 3D celestial sphere. **Right panel (approximately 23–30%):** current task, geometric prompts, hints and validation. **Bottom drawer:** linked 2D horizon diagram and isolated triangle; resizable or maximizable.

**Camera controls:** drag = orbit; scroll/pinch = zoom; right-drag or modifier-drag = pan where useful; **Reset camera** returns to a deterministic orientation; dedicated **Horizon-level**, **Equatorial**, **Pole-centered**, and **Triangle-normal** views. Input manipulation must be disabled while dragging a geometry handle, preventing camera and object movement at once.

**Layers:** horizon plane, celestial equator, NCP/SCP, zenith/nadir, meridian, N/E/S/W horizon markers, star label, hour circle, spherical triangle, angle labels, transparent/opaque sphere. Toggling a layer does not delete it or change the underlying geometry.

### 7.3 S04 — Geometry and Diagram Studio

Displays three linked representations: **full 3D**, **projected celestial-sphere sketch**, and **isolated spherical triangle**. Selection is synchronized by persistent geometric IDs. Diagram settings include label visibility, dashed hidden arcs, projected plane shading, color-blind-safe palette, grayscale print mode, and white/transparent background. Export supports SVG (vector) and PNG with adjustable pixel resolution. Exports include conventional angle names and a small assumptions/conventions note, optionally removable.

**Critical rule:** spherical angles are computed on the sphere, never from the apparent angle of lines after 2D projection. Back-side arcs in the 2D projection should be dashed or clipped, subject to the selected diagram style.

### 7.4 S05 — Solution and Review

The right panel contains sequenced tasks: identify vertices, choose arcs, label angles, choose rule, calculate, verify units/quadrant, and redraw independently. The student may expand the derivation or hide it. An intermediate answer is checked against a tolerance appropriate to displayed precision. A 'Why?' affordance explains the geometric source of each quantity. Hint and reveal state are separate from underlying scene geometry.

### 7.5 S06 — Scenario storage

Local persistence stores named scenarios and last-opened metadata in browser storage. **Export Scenario** writes a structured, versioned JSON file; **Import Scenario** validates schema and displays a preview before opening. No personal data is necessary. The release must clearly explain that local browser storage is not a cloud backup.

## 8. User stories and testable acceptance criteria

| Story ID / priority | User story | Acceptance criteria |
|---|---|---|
| US-01 P0 | As a student, I can enter φ, δ and H so that the correct scene appears. | Valid values construct a scene; invalid ranges produce field-specific errors; a summary displays conventions and assumptions. |
| US-02 P0 | As a student, I can inspect the sphere from any useful direction. | Orbit/zoom work smoothly; reset camera returns deterministically; coordinates never change when camera moves. |
| US-03 P0 | As a student, I can display or hide reference geometry. | Horizon, equator, poles, zenith, meridian and labels toggle independently without recalculation. |
| US-04 P0 | As a student, I can select P, Z and S and draw correct spherical arcs. | Three distinct points are selectable; arcs follow great circles; invalid/degenerate selections have explanations. |
| US-05 P0 | As a student, I can label the astronomical triangle myself. | App validates PZ, PS, ZS and included angle against the canonical geometry; wrong choices receive targeted feedback. |
| US-06 P0 | As a student, I can derive altitude and azimuth with hints. | Progressive hints do not expose all steps; solution checks use stable numerics and correct azimuth quadrant. |
| US-07 P0 | As a student, I can connect the 3D sphere to a 2D sketch. | Selection highlights the same entity in both; arc visibility is consistent with the projection; numeric angles match. |
| US-08 P0 | As a student, I can practice without the final answer visible. | Independent mode suppresses derived values and labels; a separate reveal action is required. |
| US-09 P0 | As a coach, I can prepare and share a scenario. | Save/open locally and JSON export/import preserve inputs, scene configuration and selected view. |
| US-10 P0 | As a coach, I can export a printable diagram. | SVG/PNG export has legible labels, correct geometry, and a monochrome option. |
| US-11 P0 | As a student, I can reset accidental changes. | Undo/redo covers geometry operations; Reset to problem restores input state without deleting the saved exercise. |
| US-12 P0 | As a student, I can experiment with changing hour angle. | H slider updates object position and all linked coordinates without suggesting that a real UTC epoch is being simulated. |

## 9. Detailed functional requirements

**FR-01 — Canonical scene model.** Store observer latitude, object declination, local hour angle, semantic point IDs, construction layers, current learning step and view configuration separately. All rendering and mathematical checks read from this canonical state. Acceptance: a series of camera rotations leaves altitude/azimuth invariant; updating H produces identical values in inspector, triangle and export.

**FR-02 — Coordinate and convention inspector.** Display signed φ, δ and H, derived altitude h and azimuth A where revealed, north/east positive conventions and angle units. Acceptance: H = +45° appears as 45° W; azimuth uses north = 0°, east = 90°, south = 180°, west = 270°.

**FR-03 — Geometry layer construction.** Draw horizon as the plane perpendicular to zenith, celestial equator perpendicular to the pole direction, and meridian through pole and zenith. Acceptance: equations and rendered arcs agree in all tested latitudes including ±90°; geometrically coincident features can be selected via an object picker.

**FR-04 — Point selection and interaction.** Support pointer selection via enlarged hit targets and list-based selection fallback. Acceptance: selected objects are highlighted and named; dense/overlapping cases remain operable via list picker; Escape cancels an incomplete construction.

**FR-05 — Great-circle segments.** Given unit vectors u and v, produce the minor great-circle arc unless they are coincident or antipodal. Acceptance: sampled arc points lie on the unit sphere; endpoints agree with chosen vertices; ambiguous antipodal cases produce an explanatory prompt rather than an arbitrary path.

**FR-06 — Triangle interpretation.** For the standard nondegenerate P–Z–S triangle, recognize PZ = 90° − φ, PS = 90° − δ, ZS = 90° − h and angle at P equal to |H| (with spherical-convention handling of 0°–180° geometry). Acceptance: assignments match computed great-circle separations; edge cases are handled without NaN values.

**FR-07 — Guided solving.** Provide at least three graduated hints per flagship exercise plus 'show step' and 'show full solution' actions. Acceptance: hints never mutate the student's manually constructed geometry or silently mark a step complete; the UI records which help was requested for the active session.

**FR-08 — Numeric answer validation.** Accept entered numeric values with degrees/radians clearly separated; compare with a testable tolerance. Acceptance: example φ=+30°, δ=+20°, H=+45° gives h≈48.284° and A≈266.896°; A wraps correctly across 0°/360°; undefined azimuth is explicitly reported.

**FR-09 — Linked 2D rendering.** Produce 2D projection from the same 3D spherical entities. Acceptance: selecting P/Z/S in any viewport highlights the same IDs elsewhere; camera-only changes do not change measured quantities.

**FR-10 — Export.** Generate current diagram as downloadable PNG and SVG. Acceptance: vector strokes/text survive scaling in SVG; raster dimensions are user selectable; no clipped labels in designated export presets.

**FR-11 — Persistence.** Save local scene and versioned `.json` import/export. Acceptance: import/export round-trip retains values within stored precision, visibility state, active problem and view; malformed files fail safely with understandable error messages.

**FR-12 — Accessibility.** Provide keyboard navigation for essential UI and a textual representation of all geometric quantities. Acceptance: a user can complete the form and access the numerical solution without a pointer; diagrams use more than color alone to communicate meaning.

## 10. Geometry, astronomy and calculation specification

### 10.1 Coordinate frames and assumptions

Use an idealized **observer-centered celestial sphere** of unit radius with apparent directions toward infinitely distant fixed stars. For P0, use geometric horizon and no refraction, parallax, proper motion, aberration, precession or nutation. The app may introduce such effects later as explicitly labeled optional models.

- Geographic latitude φ: +north / −south, degrees, −90 to +90.
- Declination δ: +north / −south, degrees, −90 to +90.
- Local hour angle H: west-positive, H = local sidereal angle − RA if time-anchored mode is later enabled; normalized modulo a full turn.
- Altitude h: degrees above geometric horizon, −90 to +90.
- Azimuth A: 0° true north, increases through east, in [0°, 360°), undefined when the object is exactly at zenith or nadir.
- Geometric north/east/up frame: right-handed, with explicit internal vector-axis documentation.

**Important:** In geometry-only mode, H is the controlled local angular coordinate; changing H can illustrate diurnal motion but is not equivalent to choosing UTC without RA, date and longitude.

### 10.2 Mathematical identities

For the standard nondegenerate astronomical triangle, define pole P, zenith Z and star S. Then PZ = 90° − φ, PS = 90° − δ and ZS = 90° − h, with the spherical angle at P tied to local hour angle. Use the spherical cosine rule for sides; the standard altitude relationship is:

**sin h = sin φ sin δ + cos φ cos δ cos H.**

For stable quadrant handling, define east and north horizon-vector components:

**E = −cos δ sin H**  
**N = cos φ sin δ − sin φ cos δ cos H**  
**U = sin φ sin δ + cos φ cos δ cos H**

Then **h = asin(clamp(U, −1, 1))**, and **A = mod(atan2(E, N), 360°)** using an atan2 convention of `(y, x)`. At exact zenith/nadir (E≈0 and N≈0), A must be 'undefined', not an arbitrary numeric bearing.

This vector-first approach is preferable to inverse-tangent formulas that can lose quadrant information. It must be cross-checked against an independent authoritative implementation or reference table.

### 10.3 Problem types supported in the MVP

**T1: Altitude and azimuth from φ, δ, H.** Full worked procedure and P–Z–S triangle construction.

**T2: Meridian altitude / culmination.** Set H = 0° (upper meridian passage); relate altitude to φ and δ. Handle the fact that a meridian 'upper culmination' can occur below the horizon.

**T3: Rising, setting and circumpolarity.** In the point-source, level-horizon model, set h = 0; when the relevant denominators are nonzero, cos H0 = −tan φ tan δ. Handle stars that never rise or never set and boundary tangency cases without dividing by zero. Explain why a visibility condition is not the same as a rising-time calculation.

Optional curated exploration: show the behavior as φ and δ cross polar and circumpolar boundaries.

### 10.4 Degenerate and limiting cases

The calculation engine must correctly classify: object at zenith/nadir (azimuth undefined); observer at geographic pole (P and Z may coincide); object at celestial pole (P and S coincide); meridian and horizon tangencies; collinear or coincident triangle vertices; antipodal arc endpoints (nonunique shortest great circle); star exactly on the horizon; azimuth wraparound; values numerically close to 0°, 90° or 180°.

The UI must separate **mathematically undefined** from **geometrically valid but below the horizon**. Hidden objects should remain inspectable in a mathematical scene, with an 'above/below horizon' indicator.

## 11. Interaction specifications

| Interaction | Trigger | Expected feedback | Undo/reset behavior |
|---|---|---|---|
| Camera orbit | Primary drag on empty sphere | Camera changes; sphere and labels remain coherent | Reset camera only |
| Zoom | Wheel / trackpad / buttons | Smooth bounded scale | Reset camera only |
| Pick vertex | Click / list selection in triangle tool | Candidate point glow and semantic label | Undo selection |
| Add great-circle side | Choose two distinct vertices, commit | Correct minor arc and tooltip | Undo construction |
| Label side/angle | Choose label and target | Provisional label; validate on submit | Undo label |
| Change φ / δ / H | Form control or slider | All linked views and derived geometry update | Undo edit; reset scenario |
| Reveal hint | Hint button | One new hint only; original task remains visible | Hide hint; no mutation |
| Reveal solution | Explicit confirm/reveal button | Answer, formula mapping and completed geometry displayed | Return to practice state |
| Export diagram | Select format/preset and export | File with geometry and labels reflecting current snapshot | No scene change |
| Import scenario | Choose `.json` | Schema validation and preview | Cancel leaves scene intact |

**Modes:** `inspect`, `construct-vertex`, `construct-arc`, `annotate`, `solve`, `review`. The UI must show the active tool and a clear way to exit. Orbit is available except while manipulating a selected geometry handle. Cursor and hover descriptions reinforce the difference between camera operations and object edits.

**Reactivity:** parameter changes should update sphere, side labels, 2D projection and solution state in a single UI update; previously entered numerical guesses are flagged as potentially stale after a material change. No silent grading of an answer computed under a previous scenario.

**Persistence semantics:** 'Reset camera' differs from 'Reset scene to question' and from 'Delete saved scenario'. Destructive actions should ask for confirmation.

## 12. Instructional design and feedback

The guided pathway is structured as: read givens → identify reference points → connect great-circle sides → map mathematical quantities → select a spherical rule → calculate → check quadrant/units → redraw independently.

**Help hierarchy:**

- **Independent:** no construction overlays and no intermediate answer; student chooses objects and formula.
- **Hint 1 (conceptual):** asks which geometric object connects the unknown to the given coordinates.
- **Hint 2 (structural):** identifies a relevant vertex, circle or angle.
- **Hint 3 (procedural):** reveals the next mathematical relation but not the entire answer.
- **Demonstrate:** completes the geometric construction and shows the line-by-line worked answer.

Feedback should say why a choice is useful or unsuitable, rather than simply 'wrong'. A student's error selecting a small-circle path instead of a great circle should be explained visually. The product must explicitly distinguish a **2D projected angle**, which may be distorted, from an **angle between spherical great-circle arcs**.

## 13. Minimal content library

| Exercise | Initial values or scenario | Learning target |
|---|---|---|
| EX-01 Star altitude and azimuth | φ = +30°, δ = +20°, H = +45° | P–Z–S triangle, cosine rule, quadrant |
| EX-02 Meridian culmination | φ = +40°, δ = −10°, H = 0° | Zenith distance and upper meridian altitude |
| EX-03 Equatorial observer | φ = 0°, δ = 0°, H = ±90° | East vs west horizon; angle sign |
| EX-04 Circumpolar star | φ = +60°, δ = +60° | Never-setting condition and daily altitude range |
| EX-05 Degenerate polar setup | φ = +90° with nonpolar star | What breaks in P–Z–S geometry and why |

Each exercise stores a structured prompt, learning objective, canonical inputs, expected numeric/qualitative results, hint texts, target geometry, and permitted assumptions. Exercises must not be merely screenshots of a solved question.

## 14. Nonfunctional requirements

| Category | Proposed release target |
|---|---|
| Availability | Works without a login; instructional core functions without a server after first load where browser caching permits |
| Performance | Camera feels responsive on ordinary educational laptops; target ≥ 30 fps in standard scenes and input-to-render feedback within 150 ms in supported environments |
| Precision | Display angular results to 0.01° by default; internal float calculations substantially more precise; reference cases pass ≤ 0.01° where well-defined |
| Reproducibility | Saved JSON is deterministic and versioned; unknown keys ignored safely or reported; schema migrations documented |
| Accessibility | Keyboard-reachable controls, visible focus, labeled inputs, high-contrast and grayscale modes; text equivalents for numeric geometric information |
| Security | Never evaluate imported JSON as code; apply schema/range validation; no arbitrary embedded scripts in exported SVG |
| Privacy | No account, no remote problem uploads and no analytics containing full user-authored problems by default |
| Compatibility | Current desktop Chrome, Firefox and Edge; exact minimum versions set and tested before release |
| Error handling | No uncaught fatal error on invalid geometry; actionable messages and recovery path |

Targets are **proposed acceptance thresholds**, not claimed current performance.

## 15. Validation and testing strategy

### 15.1 Mathematical regression cases

| Case | Inputs | Expected result |
|---|---|---|
| Reference calculation | φ=+30°, δ=+20°, H=+45° | h ≈ +48.28396°, A ≈ 266.89593° |
| Zenith, undefined azimuth | φ=0°, δ=0°, H=0° | h=+90°; azimuth undefined |
| West horizon | φ=0°, δ=0°, H=+90° | h=0°; A=270° |
| East horizon | φ=0°, δ=0°, H=−90° | h=0°; A=90° |
| North celestial pole | φ=+30°, δ=+90°, arbitrary H | h=+30°; azimuth 0° (unless at zenith) |
| Southern pole below horizon | φ=+30°, δ=−90°, arbitrary H | h=−30°; A=180° |
| Geographic north pole | φ=+90°, δ=+20°, arbitrary H | h=+20°; P/Z triangle degenerates |
| Circumpolar example | φ=+60°, δ=+60° | h ranges from +30° to +90° across daily rotation; never sets |

At the north geographic pole, azimuth relative to geographic north is not globally well-defined without an adopted orientation convention; the geometry-only UI must avoid claiming a physically unique azimuth there. Thus the north-pole test asserts altitude and a degeneracy warning, not a unique azimuth.

### 15.2 Visual and interaction QA

Automated tests should check that every exported diagram uses the same geometric model as the 3D scene, that view rotations preserve angles, and that input undo/redo restores state correctly. Include screenshot regression on representative camera angles, overlapping points, clipped circles, high zoom and label-dense scenes.

### 15.3 Learning usability pilot

Suggested discovery study: 6–10 Olympiad students at different levels and 2–3 coaches. Assign one baseline diagram-construction problem, one guided studio problem and one unseen transfer problem. Observe time-to-correct-diagram, incorrect angle assignments, hint usage and ability to explain the geometry in words. Interview coaches about time spent preparing explanations and whether the exported diagrams are genuinely exam-useful. These are pilot targets, not proof of efficacy.

## 16. Launch acceptance: definition of done

The MVP may be considered ready for a limited pilot only when all conditions below are true.

1. A student can complete EX-01 from an empty structured form to a valid 3D and 2D solution without engineering assistance.
2. No core feature requires a user account or a third-party API key.
3. All P0 user stories have documented passing acceptance tests.
4. All mathematical regression cases pass within stated tolerances; undefined values are identified instead of displayed as numbers.
5. A student can select the P–Z–S vertices and see true great-circle arcs, not merely straight 3D chords.
6. Hint stages can be entered and exited without corrupting or overwriting user construction.
7. Save → export JSON → import → reopen produces equivalent geometry and scenario.
8. Exported SVG and PNG diagrams remain legible in print mode and have no cut-off critical annotations in standard presets.
9. A coach can run a prepared demonstration using only the app and a local scenario file.
10. The UI explicitly displays coordinate conventions and notes that the P0 simulator uses idealized geometry, not real-time positional astronomy.

## 17. Delivery plan and dependencies

| Phase | Deliverable | Exit checkpoint |
|---|---|---|
| A. Geometry spike | Tested coordinate/vector engine; static canonical sphere; edge-case report | Reference calculations and limiting cases pass |
| B. Interactive foundation | Camera controls, object inspector, layer toggles, manual builder | A student can build and inspect a scene |
| C. Triangle and diagram studio | Great-circle selection, correct arc annotations, linked 2D rendering | Constructed triangle matches numerical identities |
| D. Guided exercises | EX-01–EX-05, staged hints, answer checks, redraw mode | Guided and independent tasks can be completed |
| E. Persistence and export | Browser saves, JSON import/export, SVG/PNG, print presets | Coach scenario round-trip and diagram QA pass |
| F. Pilot hardening | Accessibility, performance, edge cases and learning tests | Limited student/coach pilot is supportable |

No calendar durations are committed at this stage. Sequencing depends on validated geometry and diagram fidelity; visual polish should not precede mathematical correctness.

## 18. Risks, mitigations, and unresolved decisions

| Risk | Impact | Mitigation |
|---|---|---|
| Perspective diagrams mislead angle measurement | High | Separate spherical-angle engine from screen-space projection; label geometric vs projected angles |
| Mixing H-driven and UTC/RA-driven modes | High | Distinct scenario modes and validation; geometry-only first |
| Polar or coincident points crash construction | High | Explicit degeneracy classification and fallback explanation |
| Overly automatic hints prevent learning | High | Independent default, progressive reveal, redraw transfer test |
| Canvas clutter on educational laptops | Medium | Collapsible sidebars, presets and dedicated triangle focus |
| MVP grows into full planetarium | High | Keep no-catalogue/no-ephemeris P0 boundary |
| Exported diagrams need manual cleanup | Medium | Standard layouts, text-collision checks and print QA |
| Coach lesson creation too complex | Medium | Saveable scenarios and progressive layer visibility before a scripted lesson builder |

**Decision D-01 (recommended):** default to independent exploration with an obvious 'Get hint' button; do not automatically reveal the triangle.

**Decision D-02 (recommended):** use explicit *west-positive* hour-angle controls and *north-clockwise* azimuth, with a permanent convention inspector.

**Decision D-03 (recommended):** start with geometry-only inputs; add an accurately time-anchored mode later when sidereal-time and epoch handling are validated.

**Decision D-04 (recommended):** require SVG/PNG from the first release; postpone PDF solution packets and cloud sharing.

**Decision D-05 (open):** choose whether each exercise includes only instructor-defined permitted diagram viewpoints or allows any camera orientation, then evaluate actual student performance.

**Decision D-06 (open):** choose the default way a novice labels triangle components (select from a list, drag labels, or type values); test with students before implementation freeze.

**Decision D-07 (open):** define exact offline behavior and supported browser/GPU baseline after a device survey of intended users.

## 19. Suggested implementation architecture

- **Interface:** React + TypeScript, with controlled app state and explicit interaction modes.
- **3D renderer:** Three.js; camera interaction is presentation logic only.
- **Geometry core:** pure TypeScript spherical-vector functions, great-circle segmentation, tangent-plane angles and coordinate transforms, all with unit tests.
- **2D renderer:** SVG generated from the canonical 3D geometry using a documented projection transform; PNG exported from this view.
- **Persistence:** versioned JSON schema plus optional local browser storage.
- **Learning logic:** deterministic tasks, hint state machine and canonical exercise fixtures; no generative model dependency.
- **Later extension:** a tested ephemeris/sidereal-time library for date-dependent RA/Dec and multi-observer simulation; not necessary to ship the P0 model.

**Trust boundary:** the geometry core owns truth; the renderer displays it; the solver explains it; the exercise engine evaluates student actions against it.

## 20. Reference conventions and technical reading

- U.S. Naval Observatory, **Computing Altitude and Azimuth from Greenwich Apparent Sidereal Time**: https://aa.usno.navy.mil/faq/alt_az (conventions and relationships for hour angle, altitude, azimuth).
- U.S. Naval Observatory, **The Equation of Time**: https://aa.usno.navy.mil/faq/eqtime (local hour-angle conventions).
- Three.js, **OrbitControls**: https://threejs.org/docs/pages/OrbitControls (desktop camera operation for the proposed renderer).
- Astronomy Engine documentation: https://github.com/cosinekitty/astronomy (candidate for a future time-anchored astronomical calculation layer).

