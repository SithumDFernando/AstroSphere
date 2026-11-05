# AstroSphere Studio — phased implementation plan

This plan turns the six delivery phases in [the MVP PRD](AstroSphere_PRD.md) (§17) into buildable increments. The first end-to-end milestone is a student entering latitude, declination and local hour angle, then inspecting the resulting star on the sphere. The pilot milestone adds independent construction, guided solving, printable diagrams and a reproducible coach demonstration.

## Scope and sequencing

Use the PRD’s proposed React, TypeScript, Three.js and SVG architecture as the planning baseline. P0 uses idealized fixed-star geometry. Keep UTC/RA simulation, catalogues, ephemerides, accounts and cloud sharing in the post-MVP backlog. Leave calendar estimates open until the geometry spike and target-device survey establish the cost of rendering and verification.

| Phase | Depends on | Demonstrable outcome |
|---|---|---|
| A · Geometry foundation | PRD §§9–10, 15 | A tested calculation and a static sphere agree on the star’s position. |
| B · Builder and interactive workbench | A’s coordinate and state contracts | A student builds EX-01 from a blank form and explores it with the answer hidden. |
| C · Triangle and linked diagrams | B’s scene, selection and camera controls | A student constructs and labels the same triangle in three linked views. |
| D · Guided exercises and review | C’s construction and label validation | A student solves, checks and independently redraws a problem. |
| E · Persistence and export | C’s diagram model and D’s reveal semantics | A coach reopens a prepared demonstration and prints its diagrams. |
| F · Pilot readiness | Passing A–E checkpoints | The student and coach journeys pass on supported educational laptops. |

Use EX-01 throughout so each phase builds on the same known scene. Exercise authoring can start after A. JSON schema design can start in B and export layout trials in C, with round-trip and print acceptance in E.

## A · Geometry foundation

1. Bootstrap a minimal TypeScript app and unit-test runner. Separate problem inputs, derived geometry, student construction, learning progress and view settings. Assign stable IDs to points, circles and arcs for use by every view.
2. Document a right-handed east/north/up basis, units at API boundaries, west-positive H and north-clockwise azimuth. Define P as the north celestial pole for the PRD’s PZ and PS identities, including southern latitudes. Normalize H for computation and preserve its east/west meaning for display.
3. Implement horizon-vector conversion, altitude and quadrant-aware azimuth, great-circle separation, minor-arc sampling and tangent-plane angles. Return explicit statuses for undefined bearings, nonunique arcs and collapsed triangles. Let a valid altitude survive an undefined triangle. Implement T2 culmination and T3 horizon-crossing classification, including tangencies, constant-altitude polar cases and below-horizon upper culmination.
4. Draw a static reference sphere from those outputs. Build regression fixtures for all eight cases in PRD §15.1 and add nadir, antipodal endpoints, southern latitudes, wraparound and tangency boundaries. Record the source and conventions for an independent reference table or implementation before using it to verify the numerical results.

**Exit check.** EX-01 (φ = +30°, δ = +20°, H = +45°) gives h = 48.28396° and A = 266.89593° within 0.01°. Both east/west horizon fixtures pass. Arc samples have unit length and the requested endpoints. The polar fixture yields a valid altitude and a degeneracy explanation. Review the static scene and the recorded independent comparison before building interactive tools.

**Phase A verification · 5 November 2026.** The EX-01 page was inspected in Chrome at 1366 × 768. Its highlighted arcs, cardinal markers and coordinate readout fit on screen. All 18 regression tests and the strict TypeScript check passed. The independent comparison used ERFA’s published `t_hd2ae` fixture, converting its hour angle, declination, latitude, north-clockwise azimuth and elevation from radians to degrees. Both output differences fell below 0.000000001°. [ERFA test suite](https://github.com/liberfa/erfa/blob/master/src/t_erfa_c.c)

| Limiting case checked | Observed behavior |
|---|---|
| Zenith, nadir and geographic poles | Altitude remains available. An undefined azimuth carries a reason. |
| Coincident, antipodal or collinear P–Z–S geometry | The result identifies the affected endpoints or the shared great circle. Valid minor arcs retain their endpoints and measured lengths. |
| Daily visibility | The engine distinguishes two crossings, upper/lower tangency, never rising, never setting and a direction fixed on the horizon. |
| East/west wrap and southern observers | Equivalent turns give the same position, azimuth wraps across north, and P remains the north celestial pole. |

**Run locally.** With Node.js 24 or later, run `npm ci`, `npm run typecheck`, `npm test` and `npm run build` from the project root. Open `dist/index.html` for the studio or `dist/reference.html` for the static Phase A reference.

## B · Builder and interactive workbench

1. Build the launch screen, manual builder and workbench shell (S01–S03). Validate required inputs, finite numbers, ranges and template-specific fields. T1 accepts φ, δ and H, T2 fixes H at 0°, and T3 accepts φ and δ for visibility classification. Preview givens, unknowns and assumptions before creating the scene.
2. Render reference planes and circles, poles, zenith/nadir, cardinal markers and the star. Add layer toggles, pointer and keyboard-accessible list selection, a convention inspector and an above/below-horizon indicator. Keep derived answers hidden by default in practice.
3. Add orbit, zoom, pan, deterministic reset and horizon-level, equatorial and pole-centered views. Add the triangle-normal view in C when a valid triangle exists. Implement reversible input edits and an H slider labeled as local hour angle. Update the workbench from one state change.

**Exit check.** Starting from a blank form, enter EX-01 and identify the star, horizon and meridian. Invalid fields explain how to correct them. Orbit, toggle a layer and reset the camera while asserting identical derived coordinates. Move H across the meridian and undo it. The star and inspector return to their original state. Verify the form and picker at 1366 × 768 with keyboard and trackpad.

**Phase B verification · 5 November 2026.** The launch screen, manual builder and interactive workbench are implemented. The Three.js orthographic camera projects the Phase A vectors into the SVG drawing. T2 locks H at upper transit. T3 takes only latitude and declination as givens and labels its adjustable H as an exploration setting. Practice begins with calculated answers and triangle overlays hidden.

The strict type check, production build and all 22 unit tests passed. The Chrome browser journey at 1366 × 768 exercised a blank EX-01 form, invalid latitude, hour-angle normalization, all three templates, pointer/list selection, camera presets and reset, layer toggles, answer reveal, a slider drag across the meridian, and undo/redo. The automation checked that camera changes preserve the displayed numerical results and that a single undo restores the original H and projected star position. Screens were inspected at that resolution. The browser check uses simulated pointer, wheel and keyboard input; a physical trackpad usability check is still open for device QA.

To repeat the browser journey, run `npm run test:browser` with Chrome installed, or set `CHROME_PATH` to a Chromium executable.

## C · Triangle and linked diagrams

1. Add explicit vertex, arc and annotation tools to S03. Allow preview, commit, Escape, undo and redo. Suspend camera drag during geometry manipulation. Use the list picker when targets overlap and explain coincident, antipodal and collinear selections.
2. Validate PZ, PS and ZS against great-circle separations and the angle at P against the unsigned interior angle derived from H. Preserve signed H separately for quadrant reasoning. Give feedback specific to the selected side, angle or small-circle error.
3. Build the linked 2D workbench drawer and diagram studio (S04). Project the same geometry into a full sphere sketch and an isolated triangle. Split arcs at visibility boundaries for dashed or clipped hidden portions. Synchronize highlights by ID and use the geometry core for angle labels.

**Exit check.** Construct EX-01 manually and verify PZ = 60°, PS = 70°, ZS ≈ 41.71604° and ∠ZPS = 45°. Select one side in each view and confirm the matching highlights. Rotate the camera and confirm the labels retain their values. Repeat with a meridian and a polar example to verify recovery from a collapsed triangle. Capture representative views for visual regression and later print comparisons.

**Phase C implementation.** Open an exercise, create its scene and select **Construct triangle**. Vertex, side and label tools use the same geometric IDs in the interactive sphere, fixed sphere sketch and isolated triangle. The triangle-normal view looks perpendicular to the plane through the three endpoints. Label choices use a keyboard-accessible list, pending novice usability testing (D-06). Construction undo/redo is separate from scenario edits.

## D · Guided exercises and review

1. Author EX-01 through EX-05 as data fixtures with prompts, assumptions, givens, expected results, target geometry and graduated hints. Use T1 for quadrant practice, T2 for meridian reasoning and T3 for rising, setting and circumpolarity. Accept a correct explanation of degeneracy where construction is impossible.
2. Implement independent, guided and demonstration paths through S03 and review screen S05. Sequence vertex selection, side labels, rule choice, calculation, quadrant check and redraw. Give the flagship exercise three hint levels, separate show-step and full-solution actions, and a record of help used. Keep revealed geometry separate from student work.
3. Check answers against display precision, explicit degree/radian units, circular distance for azimuth and qualitative results for undefined quantities. Flag prior guesses as stale after input changes. Provide independent redraw and a coach presentation view with hideable controls and stepwise labels.

**Exit check.** Complete EX-01 unaided, then repeat with hints. A wrong quadrant gets specific feedback. Revealing and hiding a solution restores the student’s construction; redraw hides derived labels across the inspector and diagrams. Complete each remaining exercise, including the never-setting and polar cases, against its authored expected result.

**Phase D delivery.** The practice library launches EX-01–EX-05. Solve and review provides three graduated hints, rule feedback, incremental worked steps, an explicit demonstration overlay, numerical checks with degree/radian units and circular azimuth tolerance, qualitative daily visibility checks, and independent paper redraw. Construction survives demonstration and redraw transitions. Changed inputs flag previous answer entries for review.

**Verification.** All 24 unit tests, strict TypeScript checking and the production build pass. Chrome walkthroughs at 1366 × 768 passed five exercise solutions, progressive hint use, quadrant feedback, stale guesses, restoration after demonstration, redraw concealment and the existing triangle construction journey. Run `node test/learning.browser.mjs` after a build to repeat the learning walkthrough. Classroom/student usability and physical device testing remain part of the pilot.

## E · Persistence and export

1. Add named local saves, recent items and the library (S01, S06). Define and version the scenario JSON contract for inputs, exercise, layers, construction, view and intended starting reveal state. Specify which learning history is session-only. Preserve the saved question as the baseline for reset.
2. Validate JSON version, schema, ranges and supported templates before showing an import preview. Define unknown-field and migration behavior. Cancel or reject an import atomically. Distinguish camera reset, reset to question and confirmed deletion. Explain the browser-local storage limit in the library.
3. Export the full sketch and isolated triangle from the S04 preview as SVG and adjustable-resolution PNG. Honor visible labels and reveal state. Include optional conventions/assumptions, grayscale, hidden arcs and white/transparent backgrounds. Escape user text in SVG and treat imported content as data.

**Exit check.** Save a coach scenario, export it, import into fresh browser storage and reopen it. Compare canonical inputs, geometry, selected view and visibility, then run the demonstration from that file. Try malformed and unsupported files while another scenario is open and verify it survives. Inspect both diagram types in SVG and PNG at the requested dimensions and in grayscale print. Critical labels must fit the standard presets.

**Phase E delivery.** The workbench saves named scenes locally, exports version 1 scenario JSON, and downloads full-sphere or isolated-triangle diagrams as SVG and adjustable-resolution PNG. The library previews validated imports before opening them. Scenario files retain current inputs, the original question baseline, layers, camera orientation/pan/zoom, student construction and starting learning/reveal state. Hint history, guesses and undo history are session-only. Reset to question restores the baseline inputs; camera reset and confirmed library deletion have distinct controls.

**File contract.** Format `astrosphere`, version `1`. There are no earlier released JSON versions to migrate. Unsupported versions are rejected. Unknown keys are discarded during validation. Coordinates, camera axes, layers, construction dependencies and reveal state are validated before opening. No imported script is executed. Local saves depend on the browser origin and storage availability.

**Export decisions.** Exports retain camera orientation and fit the sphere into the page. Full-sphere measurements use a legend below the drawing to avoid overlapping labels. Isolated triangles use a fitted triangle-normal projection with arc labels. Background, grayscale, labels and the conventions note are configurable. Collapsed triangles direct the user to the full-sphere export.

**Verification.** All 26 unit tests, strict TypeScript checking and the production build pass. Chrome checks passed local save/reopen, camera restoration, fresh-session JSON import, cancellation, invalid-version recovery, diagram downloads and PNG dimensions. Learning and construction regression journeys also passed. The full-sphere grayscale PNG and isolated-triangle transparent SVG preview were visually inspected. Run `node test/storage.browser.mjs` after building to repeat the persistence/export journey.

## F · Pilot readiness

1. Run the PRD §16 launch checklist and record pass/fail evidence for every P0 story. Test keyboard-only form-to-solution, visible focus, textual equivalents, contrast and grayscale. Exercise undo/redo, dense selections, high zoom, hidden arcs and label clipping across the agreed desktop Chrome, Firefox and Edge versions.
2. Measure a standard scene on a surveyed educational laptop against the proposed ≥30 fps camera and ≤150 ms input-to-render targets. Record device, browser, scene and results. Verify the agreed cached/offline journey after first load, including local reopen. Check that the core journey works without login, API keys or remote problem uploads.
3. Have a student complete blank form → EX-01 → linked solution and a coach run a local-file demonstration without engineering help. Use these checks to decide readiness for the limited pilot. For the pilot itself, recruit the PRD’s suggested 6–10 students and 2–3 coaches. Compare baseline, guided and unseen paper-redraw tasks using time to a correct diagram, angle errors, hint use and the student’s explanation. Ask coaches to judge the printed output.

**Exit check.** All ten launch criteria in PRD §16 have passing evidence, including the mathematical fixtures and both unassisted journeys. Record pilot observations separately and use them to prioritize revisions before a broader release.

**Phase F engineering status.** Chrome and Edge passed the construction, learning and persistence journeys, keyboard form-to-result access, display modes and offline reload/local reopen. Both measured approximately 60 fps at the median and under 5 ms input-to-render p95 on this development machine. All 26 unit tests and the strict TypeScript check pass. Student-laptop measurements, Firefox compatibility, screen-reader review and unassisted student/coach pilot sessions remain open. See [the pilot readiness record](AstroSphere_Pilot_Readiness.md) for the launch checklist, commands, evidence and study procedure.

## Acceptance coverage

| P0 stories | Primary acceptance evidence | Phase |
|---|---|---|
| US-01, US-02, US-03, US-12 | Validated builder, deterministic camera, independent layers, reversible H exploration | B |
| US-04, US-05, US-07 | Great-circle construction, label validation and linked selections | C |
| US-06, US-08 | Staged hints, quadrant checks, independent practice and redraw | D |
| US-09, US-10 | Scenario round-trip and printable SVG/PNG for both diagram types | E |
| US-11 | Input undo in B, construction undo in C, saved-question reset in E | B, C, E |

## Decisions to close

| PRD item | Working assumption | Decision point |
|---|---|---|
| D-01–D-04 | Start in independent mode; expose west-positive H and north-clockwise azimuth; keep the geometry-only builder and both export formats in P0. | Use as the baseline from A onward. |
| D-05 · Exercise viewpoints | Prototype free orbit with canonical reset views. | During C, compare free and prescribed views on the same redraw task before freezing exercise settings. |
| D-06 · Novice labeling | Prototype a keyboard-accessible choice list. | During C, observe students labeling PZ, PS and ZS and settle the interaction before authoring D’s guidance around it. |
| D-07 · Devices and offline support | Survey intended users during A/B. | Agree on specific browser/GPU baselines and cached actions before E, then verify them in F. |
