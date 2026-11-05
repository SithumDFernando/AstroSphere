import assert from "node:assert/strict";
import { chromium } from "playwright-core";
const browser = await chromium.launch({ channel: process.env.ASTRO_BROWSER || "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1366, height: 768 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(new URL("../dist/index.html", import.meta.url).href);
  const b = (name) => page.getByRole("button", { name, exact: true });
  await b("Start EX-01").click();
  await b("Get hint").click();
  await b("Get hint").click();
  await b("Get hint").click();
  assert.equal(await b("Get hint").isDisabled(), true);
  assert.equal(await page.locator(".viewport .side").count(), 0);
  await page.getByLabel("Your altitude", { exact: true }).fill("48.28");
  await page.getByLabel("Your azimuth", { exact: true }).fill("86.9");
  await b("Check answer").click();
  assert.match(await page.locator(".lesson").innerText(), /Check the quadrant/);
  await page.getByLabel("Your azimuth", { exact: true }).fill("266.90");
  await b("Check answer").click();
  assert.match(await page.locator(".lesson").innerText(), /Azimuth: Correct/);
  await b("Show full solution").click();
  assert.ok((await page.locator(".viewport .side").count()) >= 3);
  await b("Hide solution and return to practice").click();
  assert.equal(await page.locator(".viewport .side").count(), 0);
  await b("Independent redraw").click();
  assert.equal(await page.locator(".viewport .measure").count(), 0);
  assert.equal(await b("Reveal results").count(), 0);
  await b("Return to practice").click();
  await b("Edit problem").click();
  await page.locator("[name=hour]").fill("46");
  await page.getByRole("button", { name: /Apply changes/ }).click();
  await page
    .getByText(
      "Inputs changed. Check these answers against the current givens.",
    )
    .waitFor();
  for (const id of ["EX-02", "EX-03", "EX-04", "EX-05"]) {
    await b("Studio").click();
    await b("Start " + id).click();
    await b("Show full solution").click();
    assert.match(
      await page.locator(".lesson").innerText(),
      id === "EX-02"
        ? /40.00000/
        : id === "EX-03"
          ? /270.00000/
          : id === "EX-04"
            ? /never-sets/
            : /coincident/,
    );
  }
  await page.screenshot({ path: "dist/qa/learning.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    "Passed five exercise solutions, three hint stages, quadrant feedback, stale guesses, demonstration restoration and redraw.",
  );
} finally {
  await browser.close();
}

