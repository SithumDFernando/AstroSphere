import { readFile, mkdir, writeFile, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { build } from "esbuild";
import { deriveScene, referenceProblem } from "../src/scene.ts";
import { spherePlate } from "../src/plate.ts";

const scene = deriveScene(referenceProblem);
const root = new URL("../", import.meta.url);
const template = await readFile(new URL("src/reference.html", root), "utf8");
const fields = {
  diagram: spherePlate(scene),
  latitude: referenceProblem.latitudeDeg,
  declination: referenceProblem.declinationDeg,
  hourAngle: referenceProblem.hourAngleDeg,
  altitude: scene.star.altitudeDeg.toFixed(5),
  azimuth: scene.star.azimuthDeg.toFixed(5),
};
const html = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
  if (!Object.hasOwn(fields, key))
    throw new Error("Unknown reference field: " + key);
  return String(fields[key]);
});
await mkdir(new URL("dist/", root), { recursive: true });
await writeFile(new URL("dist/reference.html", root), html);
await build({
  entryPoints: [fileURLToPath(new URL("src/app.tsx", root))],
  outfile: fileURLToPath(new URL("dist/studio.js", root)),
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2022",
  define: { "process.env.NODE_ENV": '"production"' },
});
await copyFile(
  new URL("src/studio.css", root),
  new URL("dist/studio.css", root),
);
await copyFile(new URL("src/app.html", root), new URL("dist/index.html", root));
const manual = await readFile(new URL("docs/AstroSphere_User_Manual.html", root),"utf8");
await writeFile(new URL("dist/user-manual.html",root),manual.replace('href="../dist/index.html"','href="index.html"'));
await mkdir(new URL("dist/manual-images/",root),{recursive:true});
for(const name of ["builder.png","workbench.png","triangle.png"]) {
  await copyFile(new URL("docs/manual-images/"+name,root),new URL("dist/manual-images/"+name,root));
}
const buildFiles = await Promise.all(
  ["studio.js", "studio.css", "index.html","user-manual.html","manual-images/builder.png","manual-images/workbench.png","manual-images/triangle.png"].map((name) =>
    readFile(new URL("dist/" + name, root)),
  ),
);
const buildId = createHash("sha256")
  .update(Buffer.concat(buildFiles))
  .digest("hex")
  .slice(0, 16);
const worker = await readFile(new URL("src/service-worker.js", root), "utf8");
await writeFile(
  new URL("dist/service-worker.js", root),
  worker.replace("__BUILD_ID__", buildId),
);
console.log(
  "Open dist/index.html for the studio or dist/reference.html for the static EX-01 reference.",
);
