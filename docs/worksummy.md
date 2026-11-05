# AstroSphere Studio work summary

Updated 5 November 2026.

AstroSphere Studio has progressed from the MVP PRD through the geometry, interactive workbench, triangle construction, guided learning, persistence and diagram export phases. Engineering checks for pilot readiness have been completed on the development machine. Student usability and classroom validation remain open.

## Implementation completed

| Phase | Delivered work |
|---|---|
| A · Geometry foundation | Pure TypeScript coordinate calculations, great-circle arcs, spherical angles, culmination, daily visibility classification and explicit degeneracy handling. A static EX-01 reference scene validates the drawing against calculated values. |
| B · Interactive workbench | Structured problem builder, three problem templates, camera controls and canonical views, geometry layers, object inspector, hour-angle exploration and reversible coordinate edits. |
| C · Triangle studio | Manual P/Z/S vertex selection, side preview and commit, angular relation checks, construction undo/redo, linked sphere and triangle diagrams, and triangle-normal view. |
| D · Guided learning | Five curated exercises, progressive hints, rule feedback, numerical and qualitative answer checks, worked steps, demonstration overlays and independent paper redraw. |
| E · Persistence and export | Named browser-local saves, validated version 1 JSON import/export, scenario restoration, question baseline reset, and SVG/PNG diagram export with print and transparency options. |
| F · Engineering hardening | Keyboard form-to-results checks, display modes, cached offline access, Chrome/Edge browser journeys, performance measurements and a pilot readiness record. Human pilot acceptance remains pending. |

## Documentation and help

- The [PRD](AstroSphere_PRD.md) defines the product scope and acceptance criteria.
- The [implementation plan](AstroSphere_Implementation_Plan.md) records delivery phases and their verification.
- The [illustrated user manual](AstroSphere_User_Manual.html) explains the complete EX-01 workflow, construction controls, hints, saving, exports and troubleshooting. It is accessible from the app and supports browser printing.
- The [pilot readiness record](AstroSphere_Pilot_Readiness.md) maps acceptance criteria to evidence and lists remaining validation work.

The manual was added after the user reported difficulty navigating the interface. The workflow still needs usability review and simplification based on actual student and coach observations.

## Technical foundation

The interface uses React 19 and TypeScript. Three.js supplies the orthographic camera and orbit controls. SVG drawings project the canonical spherical vectors into the interactive view, fixed sphere sketch and isolated triangle. The geometry core owns the calculated quantities independently of camera movement.

Node.js 24.x and esbuild provide building and local serving. Node’s test runner covers the calculation and data logic, while Playwright Core runs browser journeys. Browser localStorage holds named scenarios. A service worker caches the core app and manual on localhost or HTTPS.

The current model uses fixed-star directions, a geometric horizon, west-positive hour angle and azimuth measured from north through east. Time-anchored simulations, ephemerides, catalogues, accounts and cloud sharing remain outside the current MVP scope.

## Verification recorded

- All 26 unit tests passed, including mathematical regression cases, an independent ERFA fixture, limiting cases, scenario validation and export concealment.
- Strict TypeScript checks and the production build passed.
- Chrome and Edge passed construction, learning, persistence and diagram download journeys.
- Keyboard entry from a blank form to numerical results and offline reload/local reopen passed.
- On the development machine, both browsers measured approximately 60 fps at the median during orbit and under 5 ms input-to-render at the 95th percentile.
- Exported grayscale sphere and transparent triangle diagrams were visually inspected. Full-sphere measurements use a legend to reduce label overlap.
- The user manual’s links, screenshots, reading layout and print layout were checked. It also loaded from the offline cache.

These results describe the recorded development checks. Target student laptops and physical input devices still require validation.

## Running and checking the project

From the project root, install dependencies and start the local studio.

```sh
npm ci
npm run dev
```

Open the address printed in the terminal, usually `http://127.0.0.1:5173/`. Source changes trigger rebuilding; refresh the page to view them.

```sh
npm run typecheck
npm test
npm run build
npm run test:browser
npm run test:pilot
```

Browser checks require an installed Chrome browser. Set `ASTRO_BROWSER=msedge` in the shell to repeat the browser checks with Edge. Generated test artifacts appear under `dist/qa`.

The build produces `dist/index.html`, `dist/reference.html` and `dist/user-manual.html` with their assets. Keep the entire built folder together for portable offline use.

## Remaining work

1. Review and simplify the interface using the manual walkthrough as a usability task.
2. Test Firefox, screen-reader operation, student laptops and physical trackpads.
3. Observe unassisted EX-01 completion and coach preparation, sharing and demonstration workflows.
4. Run the proposed pilot with 6–10 students and 2–3 coaches. Evaluate paper redraw transfer, angle errors, hint use and printed diagram usefulness.
5. Use pilot findings to settle exercise viewpoint restrictions, novice labeling controls and the supported device/browser baseline.

Local saves depend on the browser and app address. Export scenario JSON for backup and sharing. Hint history, guesses and undo history belong to the active session.
