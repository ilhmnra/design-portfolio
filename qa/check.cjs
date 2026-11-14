const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require("playwright");

const sizes = {
  desktop: {width:1440, height:1000},
  tablet: {width:834, height:1194},
  mobile: {width:390, height:844},
};
const pages = {"home":"", "counterform":"counterform/", "night-ferry":"night-ferry/"};
const capture = process.argv.includes("--capture");
const remote = process.argv.find(arg => /^https:\/\//.test(arg));
const mime = {".html":"text/html; charset=utf-8", ".css":"text/css", ".js":"text/javascript", ".webp":"image/webp", ".woff2":"font/woff2", ".png":"image/png"};
const directory = path.resolve(__dirname, "../site");
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  const prefix = "/design-portfolio/";
  const target = path.resolve(directory, pathname.slice(prefix.length) + (pathname.endsWith("/") ? "index.html" : ""));
  if (!pathname.startsWith(prefix) || !target.startsWith(directory + path.sep) || !fs.existsSync(target)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, {"Content-Type": mime[path.extname(target)] || "text/plain"});
  fs.createReadStream(target).pipe(res);
});

async function run() {
  if (!remote) await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = remote || "http://127.0.0.1:" + server.address().port + "/design-portfolio/";
  const browser = await chromium.launch({channel:"chrome"});
  console.log("Chrome " + browser.version() + " · " + base);
  try {
    for (const [device, viewport] of Object.entries(sizes)) {
      const touch = device !== "desktop";
      const ctx = await browser.newContext({viewport, deviceScaleFactor:1, hasTouch:touch, isMobile:device === "mobile"});
      const page = await ctx.newPage();
      const failures = [];
      page.on("pageerror", error => failures.push(error.message));
      page.on("response", response => {if (response.status() >= 400) failures.push(response.status() + " " + response.url());});
      for (const [name, part] of Object.entries(pages)) {
        const response = await page.goto(base + part, {waitUntil:"networkidle"});
        assert.equal(response.status(), 200);
        await page.evaluate(async () => {
          await document.fonts.load("400 20px Newsreader");
          await document.fonts.ready;
          await Promise.all([...document.images].filter(image => image.loading !== "lazy").map(image => image.decode()));
        });
        const layout = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
          font: document.fonts.check("400 20px Newsreader") && document.fonts.check("800 20px Manrope"),
          title: document.querySelector("h1").textContent,
          buttonSizes: [...document.querySelectorAll("main button:not([hidden]), .choice-row label")].filter(el => el.getClientRects().length).map(el => el.getBoundingClientRect().height),
        }));
        assert.equal(layout.scroll, layout.client, name + " overflow at " + device);
        assert.ok(layout.font);
        assert.ok(layout.buttonSizes.every(height => height >= 44));
        if (capture) {
          await page.screenshot({path:path.join(__dirname,"screenshots",name + "-" + device + ".png"), animations:"disabled"});
        }
        console.log(device, name, layout.title.trim().replace(/\s+/g," "), "fonts, assets and overflow OK");
      }
      await page.goto(base);
      if (await page.locator(".inspection").count()) {
        const homeEdge = page.getByRole("button", {name:"Edge",exact:true});
        if (touch) await homeEdge.tap();
        else await homeEdge.click();
        assert.equal(await homeEdge.getAttribute("aria-pressed"), "true");
        assert.match(await page.locator("#view-caption").textContent(), /18–22 mm/);
        await page.locator("#lot-image img").evaluate(img => img.decode());
        assert.match(await page.locator(".inspection-facts").textContent(), /28.4 m²/);
        await page.goto(base);
      }
      if (touch) await page.getByRole("link", {name:"Open Counterform case study",exact:false}).tap();
      else {
        await page.keyboard.press("Tab");
        assert.equal(await page.locator(":focus").textContent(), "Skip to content");
        const card = page.getByRole("link", {name:"Open Counterform case study",exact:false});
        await card.focus();
        await page.keyboard.press("Enter");
      }
      await page.waitForURL(base + "counterform/");
      const inspection = page.getByRole("button", {name:"Edge",exact:true});
      if (touch) await inspection.tap();
      else {
        await inspection.focus();
        assert.equal(await inspection.evaluate(node => getComputedStyle(node).outlineWidth), "2px");
        await page.keyboard.press("Space");
      }
      assert.equal(await inspection.getAttribute("aria-pressed"), "true");
      await page.locator("#lot-image img").evaluate(img => img.decode());
      assert.match(await page.locator("#view-caption").textContent(), /18–22 mm/);
      if (!touch) {
        const fade = await page.evaluate(() => {
          document.querySelector('button[data-view="scale"]').click();
          return document.querySelector("#lot-image img").getAnimations().map(anim => anim.effect.getTiming().duration);
        });
        assert.deepEqual(fade, [220]);
      }
      await page.getByRole("button",{name:"Installed scale"}).click();
      await page.locator("#lot-image img").evaluate(img => img.decode());
      assert.match(await page.locator("#view-caption").textContent(), /200 × 200 mm/);
      const reserve = page.getByRole("button",{name:/Try reserving/});
      if (touch) await reserve.tap();
      else await reserve.click();
      const amount = page.getByLabel("Area in square metres");
      assert.equal(await amount.evaluate(node => node === document.activeElement), true);
      await amount.fill("29");
      assert.equal(await amount.evaluate(node => node.validity.rangeOverflow), true);
      if (touch) await page.getByRole("button",{name:"Close reservation"}).tap();
      else await page.keyboard.press("Escape");
      await page.waitForFunction(() => document.activeElement.id === "open-hold");
      await reserve.click();
      await amount.fill("12.5");
      await page.getByRole("button",{name:"Preview reservation"}).click();
      assert.match(await page.locator("#hold-status").textContent(), /12\.5 m²/);
      await page.getByRole("link",{name:/Next case.*Night Ferry/}).click();
      await page.waitForURL(base + "night-ferry/");
      assert.equal(await page.locator("#transfer-value").textContent(), "16");
      const later = page.getByRole("radio",{name:"23:21"});
      if (touch) await later.tap();
      else {
        await page.getByRole("radio",{name:"23:10"}).focus();
        await page.keyboard.press("ArrowRight");
      }
      assert.equal(await page.locator("#transfer-value").textContent(), "5");
      assert.equal(await page.locator("#transfer-label").textContent(), "Too tight");
      assert.equal(await page.locator("#arrive-time").textContent(), "23:35");
      const save = page.getByRole("button",{name:"Save trip",exact:true});
      if (touch) await save.tap();
      else await save.click();
      await page.reload();
      assert.ok(await later.isChecked());
      await page.getByRole("button",{name:"Remove saved trip"}).click();
      await page.reload();
      assert.equal(await page.locator("#transfer-value").textContent(), "16");
      if (capture && device === "desktop") {
        await later.check();
        await page.screenshot({path:path.join(__dirname,"screenshots","night-ferry-tight.png"), animations:"disabled"});
      }
      await page.emulateMedia({reducedMotion:"reduce"});
      assert.equal(await page.locator("#transfer").evaluate(node => getComputedStyle(node).transitionDuration), "0s");
      await page.goto(base + "counterform/");
      assert.equal(await page.evaluate(() => {
        document.querySelector('button[data-view="edge"]').click();
        return document.querySelector("#lot-image img").getAnimations().length;
      }), 0);
      if (capture && device === "desktop") {
        await page.locator("#lot-image img").evaluate(img => img.decode());
        await page.screenshot({path:path.join(__dirname,"screenshots","counterform-edge.png"), animations:"disabled"});
      }
      await page.goto(base + "#contact");
      assert.equal(await page.getByRole("link",{name:/Start a project inquiry/}).getAttribute("href"), "https://github.com/ilhmnra/design-portfolio/issues/new");
      await page.getByRole("button",{name:"Copy a project brief"}).click();
      await page.getByRole("button",{name:"Copy brief",exact:true}).click();
      await page.waitForFunction(() => /Brief (copied|selected)/.test(document.querySelector("#brief-status").textContent));
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => document.activeElement.id === "open-brief");
      assert.deepEqual(failures, []);
      console.log(device, "navigation, input, focus, reservation, transfer, persistence, brief and reduced motion passed");
      await ctx.close();
    }
    const fallback = await browser.newPage({viewport:sizes.mobile});
    await fallback.route("**/*.webp", route => route.abort());
    await fallback.goto(base);
    await fallback.waitForSelector(".waterfront img[data-failed]", {state:"attached"});
    assert.ok(await fallback.getByRole("heading", {name:"Make the next step clear."}).isVisible());
    await fallback.getByRole("button", {name:"Edge",exact:true}).click();
    assert.match(await fallback.locator("#view-caption").textContent(), /18–22 mm/);
    await fallback.goto(base + "counterform/");
    await fallback.waitForSelector("#lot-image img[data-failed]",{state:"attached"});
    await fallback.getByRole("button",{name:"Edge",exact:true}).click();
    await fallback.waitForSelector("#lot-image img[data-failed]",{state:"attached"});
    assert.match(await fallback.locator("#view-caption").textContent(), /18–22 mm/);
    await fallback.getByRole("button",{name:/Try reserving/}).click();
    assert.ok(await fallback.locator("#hold-dialog").isVisible());
    console.log("Blocked images · reserved frame, caption and reservation action remained available.");
    await fallback.close();
  } finally {
    await browser.close();
    server.close();
  }
}
if (capture) fs.mkdirSync(path.join(__dirname,"screenshots"),{recursive:true});
run().catch(error => {server.close(); console.error(error); process.exitCode = 1;});
