import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const browser = await chromium.launch({ channel: process.env.ASTRO_BROWSER || "chrome", headless: true });
const entry = new URL("../dist/index.html", import.meta.url).href;
const dir = fileURLToPath(new URL("../dist/qa/", import.meta.url));
await mkdir(dir, { recursive: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1366, height: 768 },
    acceptDownloads: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  const b = (name) => page.getByRole("button", { name, exact: true });
  await page.goto(entry);
  await b("Start EX-01").click();
  await page
    .getByLabel("Camera view", { exact: true })
    .selectOption("Equatorial");
  await page
    .getByRole("checkbox", { name: "Cardinal points", exact: true })
    .uncheck();
  await page.getByLabel("Scenario name", { exact: true }).fill("Coach example");
  await b("Show full solution").click();
  const pos = await page
    .locator(".viewport #point-S .dot")
    .evaluate((el) => [el.getAttribute("cx"), el.getAttribute("cy")]);
  await b("Save locally").click();
  assert.match(
    await page.locator(".save-panel").innerText(),
    /Saved in this browser/,
  );
  let wait = page.waitForEvent("download");
  await b("Export scenario JSON").click();
  const jsonDownload = await wait;
  const json = await readFile(await jsonDownload.path(), "utf8");
  await page.reload();
  await b("Saved scenarios and import").click();
  await b("Open Coach example").click();
  assert.equal(
    await page.getByLabel("Learning mode", { exact: true }).inputValue(),
    "Demonstrate",
  );
  assert.equal(
    await page
      .getByRole("checkbox", { name: "Cardinal points", exact: true })
      .isChecked(),
    false,
  );
  const reopened = await page
    .locator(".viewport #point-S .dot")
    .evaluate((el) => [el.getAttribute("cx"), el.getAttribute("cy")]);
  reopened.forEach((v, i) =>
    assert.ok(Math.abs(Number(v) - Number(pos[i])) < 0.00001),
  );
  const fresh = await browser.newContext({ acceptDownloads: true });
  const p = await fresh.newPage({ viewport: { width: 1366, height: 768 } });
  const fb = (n) => p.getByRole("button", { name: n, exact: true });
  await p.goto(entry);
  await fb("Saved scenarios and import").click();
  const upload = p.getByLabel("Import scenario JSON", { exact: true });
  await upload.setInputFiles({
    name: "scene.json",
    mimeType: "application/json",
    buffer: Buffer.from(json),
  });
  await fb("Cancel import").click();
  assert.equal(await p.locator(".bench").count(), 0);
  await upload.setInputFiles({
    name: "scene.json",
    mimeType: "application/json",
    buffer: Buffer.from(json),
  });
  await fb("Open imported scenario").click();
  assert.equal(
    await p.getByLabel("Learning mode", { exact: true }).inputValue(),
    "Demonstrate",
  );
  await fb("Saved scenarios and import").click();
  await upload.setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"format":"astrosphere","version":99}'),
  });
  assert.equal(await p.locator(".bench").count(), 1);
  await p.getByText(/Unsupported scenario format/).waitFor();
  await fb("Export diagrams").click();
  await p.getByLabel("Grayscale print", { exact: true }).check();
  for (const type of ["SVG", "PNG"]) {
    const download = p.waitForEvent("download");
    await fb("Download " + type).click();
    const file = await download;
    await file.saveAs(dir + "/export." + type.toLowerCase());
  }
  const svg = await readFile(dir + "/export.svg", "utf8");
  assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(!svg.includes("<script"));
  const png = await readFile(dir + "/export.png");
  assert.equal(png.readUInt32BE(16), 1600);
  assert.equal(png.readUInt32BE(20), 1600);
  await p.getByLabel("Diagram", { exact: true }).selectOption("triangle");
  await p.getByLabel("Transparent background", { exact: true }).check();
  const dl = p.waitForEvent("download");
  await fb("Download SVG").click();
  await (await dl).saveAs(dir + "/triangle.svg");
  await p
    .locator(".export-grid")
    .screenshot({ path: dir + "/export-preview.png" });
  await page.close();
  await fresh.close();
  assert.deepEqual(errors, []);
  console.log(
    "Passed local save/reopen with camera and layers, fresh-session JSON preview/import, invalid import recovery, and SVG/PNG downloads.",
  );
} finally {
  await browser.close();
}

