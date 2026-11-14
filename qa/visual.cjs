const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require("playwright");
const sizes = {desktop:{width:1440,height:1000},tablet:{width:834,height:1194},mobile:{width:390,height:844}};
const root = path.resolve(__dirname,"../site");
const target = process.argv[2];
const folder = process.argv[3] || path.join(__dirname,"redesign");
const compare = process.argv.includes("--baseline");
const record = process.argv.includes("--record");
const mime = {".html":"text/html; charset=utf-8",".css":"text/css",".js":"text/javascript",".webp":"image/webp",".woff2":"font/woff2",".png":"image/png"};
const server = http.createServer((req,res)=>{
  const url = new URL(req.url,"http://localhost");
  const sub = url.pathname.replace(/^\/design-portfolio\//,"");
  const file = path.resolve(root, sub + (sub.endsWith("/") || !sub ? "index.html" : ""));
  if(!file.startsWith(root + path.sep) || !fs.existsSync(file)){res.writeHead(404).end();return;}
  res.writeHead(200,{"Content-Type":mime[path.extname(file)] || "text/plain"});
  fs.createReadStream(file).pipe(res);
});
async function settle(page) {
  await page.evaluate(async()=>{
    await document.fonts.ready;
    await Promise.all([...document.images].map(img=>img.decode()));
  });
}
async function move(page, selector, shift=18) {
  await page.locator(selector).first().evaluate((el,pad)=>window.scrollTo({top:el.getBoundingClientRect().top+scrollY-pad,behavior:"instant"}),shift);
  await page.waitForTimeout(160);
}
async function capture(page,name) {
  await page.screenshot({path:path.join(folder,name+".png"),animations:"disabled"});
}
async function inspectSequence(page, save) {
  async function sample(progress) {
    await page.locator("#proof-title").evaluate((el,fraction)=>{
      const y = el.getBoundingClientRect().top + scrollY - innerHeight * (.87 - .50 * fraction);
      window.scrollTo({top:y,behavior:"instant"});
    },progress);
    await page.waitForTimeout(80);
    return page.locator(".traveling-bracket").evaluate(el=>{
      const r=el.getBoundingClientRect();
      return {active:getComputedStyle(el).display!=="none",x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};
    });
  }
  const a=await sample(.28);
  if (save) await capture(page,"sequence-01");
  const b=await sample(.64);
  if (save) await capture(page,"sequence-02");
  const end=await sample(1.08);
  if (save) await capture(page,"sequence-03");
  const reverse=await sample(.28);
  assert.ok(a.active&&b.active&&a.width>b.width&&!end.active);
  assert.deepEqual(reverse,a);
  console.log("Sequence reverses exactly",JSON.stringify({a,b,end,reverse}));
  await page.emulateMedia({reducedMotion:"reduce"});
  const reduced=await sample(.50);
  assert.ok(!reduced.active);
  assert.equal(await page.locator(".opening-bracket").evaluate(el=>getComputedStyle(el).visibility),"visible");
  assert.equal(await page.locator(".proof-bracket").evaluate(el=>getComputedStyle(el).visibility),"visible");
  console.log("Reduced motion displays both static marks.");
}
(async()=>{
  fs.mkdirSync(folder,{recursive:true});
  if(target==="local") await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const isLocal=target==="local";
  const base=isLocal?"http://127.0.0.1:"+server.address().port+"/design-portfolio/":target;
  const browser=await chromium.launch({channel:"chrome"});
  try {
    for(const [device,viewport] of Object.entries(sizes)){
      const ctx=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:device==="mobile",hasTouch:device!=="desktop"});
      const page=await ctx.newPage();
      assert.equal((await page.goto(base)).status(),200);
      await settle(page);
      await capture(page,device+"-opening");
      await move(page,compare?"#work":"#proof-title",24);
      await capture(page,device+"-proof");
      await move(page,"#contact",0);
      await capture(page,device+"-closing");
      if(!compare){
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
        assert.equal(overflow,false);
        if(device==="desktop") await inspectSequence(page,true);
        else{
          await move(page,"#proof-title",400);
          assert.equal(await page.locator(".traveling-bracket").isVisible(),false);
        }
      }
      for(const route of ["counterform","night-ferry"]){
        assert.equal((await page.goto(base+route+"/")).status(),200);
        await settle(page);
        await capture(page,device+"-"+route);
      }
      await ctx.close();
    }
    if(record && !compare){
      const ctx=await browser.newContext({viewport:sizes.desktop,deviceScaleFactor:1,recordVideo:{dir:folder,size:{width:1152,height:800}}});
      const page=await ctx.newPage();
      const clip=page.video();
      await page.goto(base);
      await settle(page);
      await page.waitForTimeout(650);
      const y=await page.locator("#proof-title").evaluate(el=>el.getBoundingClientRect().top+scrollY);
      for(const [to,duration] of [[y-40,2500],[y*.42,1250],[y-28,1100]]){
        await page.evaluate(({to,duration})=>new Promise(resolve=>{
          const start=performance.now(), initial=scrollY;
          function render(now){
            const p=Math.min(1,(now-start)/duration);
            scrollTo({top:initial+(to-initial)*p,behavior:"instant"});
            if(p<1)requestAnimationFrame(render);else resolve();
          }
          requestAnimationFrame(render);
        }),{to,duration});
        await page.waitForTimeout(440);
      }
      await ctx.close();
      const raw=await clip.path();
      await clip.saveAs(path.join(folder,"inspection-sequence.webm"));
      fs.unlinkSync(raw);
    }
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error=>{server.close();console.error(error);process.exitCode=1;});
