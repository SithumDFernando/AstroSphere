# AstroSphere pilot readiness record

Engineering validation completed on 5 November 2026. The app is available for a supervised trial on the tested browsers. Limited-pilot acceptance remains open until students and coaches complete the unassisted workflows and target devices are surveyed.

## Browser and performance evidence

Tests used Windows 11 build 26200, AMD Ryzen 9 270 with Radeon 780M, headless browsers and a 1366 × 768 viewport. This machine supplies a development benchmark. Intended educational laptops still require measurement.

| Browser | Version observed | Camera median | Frame time p95 | Input-to-render p95 |
|---|---|---|---|---|
| Chrome | 156.0.8078.80 | 59.88 fps | 17.0 ms | 4.4 ms |
| Edge | 156.0.4314.58 | 59.88 fps | 17.0 ms | 3.9 ms |

Each final camera run sampled 100 animation-frame intervals during continuous orbit. Input tests sampled 24 keyboard changes to H and measured from keydown to the frame after the sphere DOM update. Both observed runs passed the proposed median camera ≥30 fps and input p95 ≤150 ms checks. Measurements include browser automation and headless rendering. Physical trackpad response, GPU variability and sustained classroom sessions require device trials.

Firefox was unavailable on this machine. Set the final browser support baseline after testing Firefox and surveying user devices.

## Launch checklist

| PRD §16 condition | Evidence and status |
|---|---|
| 1. Student completes EX-01 from blank form to linked solution | Automated builder and construction journey passes. Unassisted student observation remains open. |
| 2. Core requires no login or API key | Browser journeys run with no credentials. Pilot checks observe no external requests. |
| 3. All P0 stories have passing acceptance evidence | Engineering mapping below. Actual student and coach usability evidence remains open. |
| 4. Mathematics and undefined values pass | 26 unit tests cover numerical fixtures, ERFA comparison, limiting cases and validation. |
| 5. P–Z–S uses great-circle arcs | Arc unit tests check unit length, endpoint alignment and plane membership. Browser construction passes. |
| 6. Hints preserve construction | Learning and construction journeys pass reveal, return, undo/redo and redraw concealment. |
| 7. Scenario round-trip is equivalent | Persistence journey passes local save, camera/layer restore and fresh-context import preview/open. |
| 8. SVG/PNG are legible in print presets | Full-sphere grayscale and triangle export previews inspected. PNG dimensions verified. Coach print review remains open. |
| 9. Coach runs a local-file demonstration | Fresh browser import restores demonstration mode. Unassisted coach observation remains open. |
| 10. Conventions and idealized geometry are explicit | Workbench conventions, builder assumptions and optional export notes identify the adopted model. |

## P0 story mapping

| Stories | Repeatable evidence |
|---|---|
| US-01 | Blank builder, invalid ranges, normalized H and all three templates in workbench journey |
| US-02, US-03 | Camera invariance, deterministic reset, canonical views and layer toggles |
| US-04, US-05 | Three vertices, side preview/commit, relation checking, wrong-path feedback, polar/meridian recovery |
| US-06 | Three hints, rule feedback, unit/circular tolerance checks, quadrant feedback |
| US-07 | Same-side selection across sphere, fixed sketch and isolated triangle |
| US-08 | Answer concealment, demonstration restoration, independent redraw and hidden worked steps |
| US-09 | Local reopen and fresh-session versioned JSON import |
| US-10 | SVG/PNG download, dimensions, escaped user text, grayscale/transparent previews |
| US-11 | Scenario undo/redo, construction undo/redo and separate question baseline |
| US-12 | H edits, linked star updates and one-drag undo |

## Accessibility and offline behavior

A keyboard-only Tab/Enter journey completes the blank form and opens the numerical result. Controls retain visible focus and object selection has a list fallback. The viewport explains its keyboard controls. Standard, high-contrast and grayscale displays are selectable. The high-contrast workbench was visually inspected. Screen-reader behavior, contrast conformance across every state, and keyboard-only completion of the complete learning exercise still need a user accessibility review.

On localhost or HTTPS, a service worker caches the core page, JavaScript and CSS. Cache versions derive from the built assets. Online requests refresh those cached assets, and offline requests fall back to the cache. Chrome and Edge passed document reload and saved-scenario reopen with the browser offline after the initial load. The page indicates when its core is cached. Browser eviction or private-storage restrictions can remove cached assets and local saves.

For portable offline use, distribute the entire built dist folder and open index.html. Keep JSON backups for scenarios. Browser-local saves follow the browser origin, so switching between file, localhost and a hosted site creates separate libraries.

## Repeating checks

Use Node.js 24 or later and an installed Chrome browser.

- Run npm ci, npm run typecheck and npm test.
- Run npm run test:browser for builder, construction, learning and storage/export journeys.
- Run npm run test:pilot for the keyboard, appearance, offline and local performance checks.
- In PowerShell set $env:ASTRO_BROWSER='msedge' before browser commands to repeat them in Edge.
- Generated benchmark JSON and screenshots appear under dist/qa and can be regenerated.

## Student and coach pilot

Recruit the PRD's proposed 6–10 Olympiad students and 2–3 coaches, with varied skill levels and device specifications. Record browser, laptop, input device and accessibility needs.

Give each student a baseline paper diagram task, EX-01 in the studio, and an unseen paper transfer task. Record time to correct diagram, vertex/angle errors, hints requested, and the student's explanation of each arc. Observe whether students can recover from a mistaken label and distinguish projected angles from spherical angles.

Ask coaches to prepare, save, export, reopen and demonstrate a scenario using their own files. Have them print the sphere and triangle diagrams and identify any annotations they would need to adjust.

Before broader release, close Firefox compatibility, low-spec laptop performance, physical trackpad operation, screen-reader review and the unassisted journeys. Use the observed redraw outcomes to settle free versus prescribed exercise viewpoints and the novice labeling interaction.
