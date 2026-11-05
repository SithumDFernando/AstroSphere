import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";
import { cpus, platform, release } from "node:os";
const channel = process.env.ASTRO_BROWSER || "chrome";
const root = new URL("../dist/", import.meta.url);
const server = createServer(async (req, res) => {
  const path = (req.url || "/").split("?")[0];
  const name = path === "/" ? "index.html" : path.slice(1);
  if (
    !["index.html", "studio.js", "studio.css", "service-worker.js","user-manual.html","manual-images/builder.png","manual-images/workbench.png","manual-images/triangle.png"].includes(
      name,
    )
  ) {
    res.writeHead(404);
    res.end();
    return;
  }
  try {
    res.setHeader(
      "Content-Type",
      name.endsWith(".js")
        ? "text/javascript"
        : name.endsWith(".css")
          ? "text/css"
          : name.endsWith(".png") ? "image/png" : "text/html",
    );
    res.end(await readFile(new URL(name, root)));
  } catch {
    res.writeHead(500);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch({ channel, headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });
  const page = await context.newPage(),
    errors = [],
    remote = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  const base = "http://127.0.0.1:" + server.address().port;
  page.on("request", (req) => {
    if (
      !req.url().startsWith(base) &&
      !req.url().startsWith("data:") &&
      !req.url().startsWith("blob:")
    )
      remote.push(req.url());
  });
  await mkdir(new URL("qa/", root), { recursive: true });
  await page.goto(base);
  await page
    .getByText("Ready for offline use in this browser", { exact: true })
    .waitFor();
  async function tabTo(selector) {
    for (let i = 0; i < 150; i++) {
      if (
        await page.evaluate((s) => document.activeElement?.matches(s), selector)
      )
        return;
      await page.keyboard.press("Tab");
    }
    throw new Error("Keyboard could not reach " + selector);
  }
  await tabTo("button.primary");
  await page.keyboard.press("Enter");
  await tabTo("[name=latitude]");
  await page.keyboard.type("30");
  await tabTo("[name=declination]");
  await page.keyboard.type("20");
  await tabTo("[name=hour]");
  await page.keyboard.type("45");
  await tabTo("button[type=submit]");
  await page.keyboard.press("Enter");
  await tabTo(".inspector button");
  await page.keyboard.press("Enter");
  assert.match(await page.locator(".inspector .results").innerText(), /48.28/);
  await page
    .getByLabel("Display appearance", { exact: true })
    .selectOption("High contrast");
  await page.screenshot({
    path: fileURLToPath(new URL("qa/contrast-" + channel + ".png", root)),
  });
  await page
    .getByLabel("Display appearance", { exact: true })
    .selectOption("Grayscale");
  assert.equal(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).filter,
    ),
    "grayscale(1)",
  );
  await page
    .getByLabel("Display appearance", { exact: true })
    .selectOption("Standard");
  // Input-to-render measurement ends at the animation frame after a sphere DOM update.
  await page.evaluate(() => {
    window.latencies = [];
    let started = 0,
      pending = false;
    document.querySelector("#hour-range").addEventListener("keydown", () => {
      started = performance.now();
      pending = true;
    });
    new MutationObserver(() => {
      if (pending) {
        pending = false;
        requestAnimationFrame(() =>
          window.latencies.push(performance.now() - started),
        );
      }
    }).observe(document.querySelector(".viewport"), {
      subtree: true,
      childList: true,
    });
  });
  await page.locator("#hour-range").focus();
  for (let i = 0; i < 25; i++) await page.keyboard.press("ArrowRight");
  const latency = await page.evaluate(() => window.latencies);
  await page.evaluate(() => {
    window.frames = [];
    window.tracking = true;
    let last = performance.now();
    function tick(now) {
      window.frames.push(now - last);
      last = now;
      if (window.tracking) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
  const bounds = await page.locator(".viewport").boundingBox();
  await page.mouse.move(bounds.x + 40, bounds.y + 50);
  await page.mouse.down();
  for (let i = 0; i < 100; i++)
    await page.mouse.move(
      bounds.x + 40 + i * 2,
      bounds.y + 50 + Math.sin(i / 8) * 35,
    );
  await page.mouse.up();
  const frames = await page.evaluate(() => {
    window.tracking = false;
    return window.frames.slice(2);
  });
  const percentile = (xs, p) =>
    [...xs].sort((a, b) => a - b)[
      Math.min(xs.length - 1, Math.floor(xs.length * p))
    ];
  const report = {
    browser: channel,
    version: browser.version(),
    host: platform() + " " + release(),
    cpu: cpus()[0]?.model,
    viewport: "1366 × 768",
    headless: true,
    frameSamples: frames.length,
    medianFrameMs: percentile(frames, 0.5),
    p95FrameMs: percentile(frames, 0.95),
    medianFps: 1000 / percentile(frames, 0.5),
    inputSamples: latency.length,
    p95InputMs: percentile(latency, 0.95),
  };
  assert.ok(
    frames.length > 20 && latency.length > 5,
    "Performance sample too small",
  );
  assert.ok(
    report.medianFps >= 30 && report.p95InputMs <= 150,
    "Local performance target missed",
  );
  // Cache and persistence must also survive a full document reload offline.
  await page
    .getByLabel("Scenario name", { exact: true })
    .fill("Offline exercise");
  await page.getByRole("button", { name: "Save locally", exact: true }).click();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  const guide = await context.newPage();
  await guide.goto(base+"/user-manual.html");
  await guide.getByRole("heading",{name:"Your first exercise",exact:true}).waitFor();
  assert.equal(await guide.locator("img").evaluateAll(images=>images.every(img=>img.complete && img.naturalWidth>0)),true);
  assert.deepEqual(await guide.locator('a[href^="#"]').evaluateAll(links=>links.map(a=>a.hash.slice(1)).filter(id=>!document.getElementById(id))),[]);
  await guide.close();
  await page
    .getByRole("button", { name: "Saved scenarios and import", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open Offline exercise", exact: true })
    .click();
  assert.match(await page.locator(".bench-left").innerText(), /30° N/);
  await page
    .getByRole("button", { name: "Reveal results", exact: true })
    .click()
    .catch(() => {});
  assert.equal(await page.locator(".viewport #point-S").count(), 1);
  assert.deepEqual(errors, []);
  assert.deepEqual(remote, []);
  await writeFile(
    new URL("qa/pilot-" + channel + ".json", root),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
  console.log(
    "Passed keyboard form-to-results, display modes, offline reload and local reopen, with no external requests or page errors.",
  );
} finally {
  await browser?.close();
  server.close();
}
