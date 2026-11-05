// Run after building, with a local Chrome installation (or CHROME_PATH).
import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
const browser = await chromium.launch(
  process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH, headless: true }
    : { channel: process.env.ASTRO_BROWSER || "chrome", headless: true },
);
try {
  const page = await browser.newPage({
    viewport: { width: 1366, height: 768 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  async function snapshot(name) {
    if (!process.env.ASTRO_QA_DIR) return;
    await mkdir(process.env.ASTRO_QA_DIR, { recursive: true });
    await page.screenshot({
      path: join(process.env.ASTRO_QA_DIR, name + ".png"),
    });
  }
  await page.goto(new URL("../dist/index.html", import.meta.url).href);
  const button = (name) => page.getByRole("button", { name, exact: true });
  const select = (name) => page.getByRole("combobox", { name, exact: true });
  const star = page.locator(".viewport #point-S .dot");
  const position = () =>
    star.evaluate((el) => [el.getAttribute("cx"), el.getAttribute("cy")]);
  await page.getByRole("button", { name: /Build a problem/ }).waitFor();
  await snapshot("studio");
  await page.getByRole("button", { name: /Build a problem/ }).press("Enter");
  await page.getByRole("button", { name: /Create scene/ }).press("Enter");
  assert.equal(
    await page
      .locator("[name=latitude]")
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page.locator("[name=latitude]").fill("91");
  assert.match(await page.locator("#latitude-hint").innerText(), /−90/);
  await page.locator("[name=latitude]").fill("30");
  await page.locator("[name=declination]").fill("20");
  await page.locator("[name=hour]").fill("405");
  assert.match(await page.locator(".preview").innerText(), /45° W/);
  await snapshot("builder");
  await page.getByRole("button", { name: /Create scene/ }).press("Enter");
  await star.waitFor();
  assert.equal(await page.getByText("48.28°", { exact: true }).count(), 0);
  assert.equal(await page.locator(".viewport #PZ").count(), 0);
  const original = await position();
  const picker = select("Select an object");
  await picker.focus();
  await picker.press("s");
  await picker.selectOption("meridian");
  assert.equal(await page.locator(".viewport #meridian.selected").count(), 1);
  await star.click();
  assert.equal(await picker.inputValue(), "S");
  await button("Reveal results").click();
  const results = page.locator(".inspector .results");
  const values = await results.innerText();
  assert.match(values, /48.28°/);
  assert.match(values, /266.90°/);
  const bounds = await page.locator(".viewport").boundingBox();
  const x = bounds.x + 25,
    y = bounds.y + 48;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 75, y + 45, { steps: 6 });
  await page.mouse.up();
  assert.notDeepEqual(await position(), original);
  assert.equal(await results.innerText(), values);
  await page.mouse.wheel(0, -130);
  await page.keyboard.down("Shift");
  await page.mouse.down();
  await page.mouse.move(x + 95, y + 80, { steps: 4 });
  await page.mouse.up();
  await page.keyboard.up("Shift");
  for (const name of ["Pole-centered", "Equatorial", "Horizon-level"]) {
    await select("Camera view").selectOption(name);
    assert.equal(await results.innerText(), values);
  }
  await page.getByRole("checkbox", { name: "Horizon", exact: true }).uncheck();
  assert.equal(await page.locator(".viewport #horizon").count(), 0);
  await picker.selectOption("horizon");
  assert.equal(
    await page
      .getByRole("checkbox", { name: "Horizon", exact: true })
      .isChecked(),
    true,
  );
  await button("Reset camera").click();
  assert.deepEqual(await position(), original);
  const slider = page.getByRole("slider"),
    sb = await slider.boundingBox();
  await page.mouse.move(sb.x + sb.width * 0.62, sb.y + sb.height / 2);
  await page.mouse.down();
  await page.mouse.move(sb.x + sb.width * 0.25, sb.y + sb.height / 2, {
    steps: 7,
  });
  await page.mouse.up();
  assert.ok(Number(await slider.inputValue()) < 0);
  assert.notDeepEqual(await position(), original);
  await page.getByRole("button", { name: /Undo/ }).click();
  assert.equal(await slider.inputValue(), "45");
  assert.deepEqual(await position(), original);
  assert.equal(
    await page.getByRole("button", { name: /Undo/ }).isDisabled(),
    true,
  );
  await page.getByRole("button", { name: /Redo/ }).click();
  assert.ok(Number(await slider.inputValue()) < 0);
  await page.getByRole("button", { name: /Undo/ }).click();
  await picker.selectOption("S");
  await snapshot("workbench");
  await button("Edit problem").click();
  await page.locator("[name=latitude]").fill("-30");
  await page.getByRole("button", { name: /Apply changes/ }).click();
  assert.match(await page.locator(".bench-left").innerText(), /30° S/);
  await page.getByRole("button", { name: /Undo/ }).click();
  assert.match(await page.locator(".bench-left").innerText(), /30° N/);
  await button("Construct triangle").click();
  const tool = page.getByLabel("Construction tool");
  const pickPart = async id => button("Pick "+id).click();
  for (const id of ["P","Z","S"]) {
    await pickPart(id); await button("Add vertex").click();
  }
  await tool.selectOption("Sides");
  await pickPart("P"); await page.keyboard.press("Escape");
  assert.equal(await tool.inputValue(),"Inspect");
  await tool.selectOption("Sides");
  for (const side of ["PZ","PS","ZS"]) {
    await pickPart(side[0]); await pickPart(side[1]);
    if (side==="PZ") {
      await page.getByLabel("Path",{exact:true}).selectOption("parallel");
      await button("Commit side PZ").click();
      assert.match(await page.getByRole("status").filter({hasText:"small circles"}).innerText(),/small circles/);
      await page.getByLabel("Path",{exact:true}).selectOption("minor");
    }
    await button("Commit side "+side).click();
  }
  await tool.selectOption("Labels");
  for (const [id,relation,value] of [["PZ","90° − φ","60.00000"],["PS","90° − δ","70.00000"],["ZS","90° − h","41.71604"],["P","|H| (principal angle)","45.00000"]]) {
    await pickPart(id);
    if (id==="PZ") {
      await page.getByLabel("Angular relation").selectOption("90° − h");
      await button("Check label").click();
      assert.match(await page.locator(".construction-tools").innerText(),/observer coordinate/);
    }
    await page.getByLabel("Angular relation").selectOption(relation);
    await button("Check label").click();
    assert.ok((await page.locator(".checked-label").allTextContents()).some(text=>text.includes(value)));
  }
  await button("Undo construction").click();
  assert.equal(await page.locator(".checked-label").count(),3);
  await button("Redo construction").click();
  await tool.selectOption("Inspect");
  await select("Camera view").selectOption("Triangle-normal");
  for (const [prefix,side] of [["","PZ"],["sketch-","PS"],["triangle-","ZS"]]) {
    const path=page.locator("#"+prefix+side+" .side").first();
    await path.scrollIntoViewIfNeeded();
    const point=await path.evaluate(p=>{
      const q=p.getPointAtLength(p.getTotalLength()/2).matrixTransform(p.getScreenCTM());
      return {x:q.x,y:q.y};
    });
    await page.mouse.click(point.x,point.y);
    assert.equal(await picker.inputValue(),side);
    assert.equal(await page.locator('[data-object="'+side+'"].selected').count(),3);
  }
  await snapshot("triangle");
  await button("Edit problem").click();
  await page.locator('[name=latitude]').fill("90");
  await page.getByRole("button",{name:/Apply changes/}).click();
  assert.match(await page.locator(".triangle-studio").innerText(),/coincident/);
  await snapshot("polar-triangle");
  await button("Close studio").click();
  for (const [title, locked] of [
    ["Meridian culmination", true],
    ["Rising and setting", false],
  ]) {
    await button("Studio").click();
    await page.getByRole("button", { name: new RegExp(title) }).click();
    assert.equal(await page.locator("[name=hour]").count(), 0);
    await page.getByRole("button", { name: /Create scene/ }).click();
    assert.equal(await slider.isDisabled(), locked);
    await button("Reveal results").click();
    assert.match(await results.innerText(), locked ? /40.00°/ : /Never sets/);
    if (locked) {
      await button("Construct triangle").click();
      assert.match(await page.locator(".triangle-studio").innerText(), /one great circle/);
      await snapshot("meridian-triangle");
      await button("Close studio").click();
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    "Passed builder and workbench journeys, EX-01 construction and labels, three-view selection, and polar and meridian degeneracies at 1366 × 768.",
  );
} finally {
  await browser.close();
}


