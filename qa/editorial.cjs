const {chromium} = require("playwright");
const fs = require("node:fs"), path = require("node:path"), http = require("node:http"), assert = require("node:assert/strict");
const root = path.resolve(__dirname,"../site");
const out = process.argv[3] || path.join(__dirname,"editorial");
const remote = /^https:\/\//.test(process.argv[2]||"") ? process.argv[2]:null;
const records = process.argv.includes("--record");
const contentTypes={".html":"text/html; charset=utf-8",".js":"text/javascript",".css":"text/css",".woff2":"font/woff2",".png":"image/png",".webp":"image/webp"};
const serve=http.createServer((req,res)=>{
 const relative=new URL(req.url,"http://localhost").pathname.replace(/^\/design-portfolio\//,"");
 const target=path.resolve(root,relative+(relative.endsWith("/")||!relative?"index.html":""));
 if(!target.startsWith(root+path.sep)||!fs.existsSync(target)){res.writeHead(404).end();return;}
 res.writeHead(200,{"Content-Type":contentTypes[path.extname(target)]||"text/plain"});
 fs.createReadStream(target).pipe(res);
});
const sizes={desktop:{width:1440,height:1000},wide:{width:1920,height:1080},tablet:{width:834,height:1194},mobile:{width:390,height:844}};
const take=(page,id)=>page.screenshot({path:path.join(out,id+".png")});
async function move(page,selector,top=28){
 await page.locator(selector).first().evaluate((el,y)=>scrollTo({top:el.getBoundingClientRect().top+scrollY-y,behavior:"instant"}),top);
 await page.waitForTimeout(110);
}
async function state(page,selector,top){
 await move(page,selector,top);
 return page.locator(".waterfront-frame").evaluate(e=>Math.round(e.getBoundingClientRect().width));
}
async function glide(page,y,ms){
 await page.evaluate(({y,ms})=>new Promise(resolve=>{
  const from=scrollY, start=performance.now();
  function step(t){const p=Math.min(1,(t-start)/ms);scrollTo({top:from+(y-from)*p,behavior:"instant"});if(p<1)requestAnimationFrame(step);else resolve();}
  requestAnimationFrame(step);
 }),{y,ms});
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 if(!remote) await new Promise(ok=>serve.listen(0,"127.0.0.1",ok));
 const base=remote||"http://127.0.0.1:"+serve.address().port+"/design-portfolio/";
 const browser=await chromium.launch({channel:"chrome"});
 const data={url:base,contexts:{}};
 try{
 for(const [name,viewport] of Object.entries(sizes)){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:"no-preference",hasTouch:["tablet","mobile"].includes(name)});
  const page=await context.newPage();
  assert.equal((await page.goto(base,{waitUntil:"load"})).status(),200);
  await page.evaluate(async()=>{await document.fonts.ready;await document.querySelector(".waterfront img").decode()});
  await page.waitForTimeout(1060);
  await take(page,name+"-opening");
  const initial=await page.locator(".waterfront-frame").evaluate(el=>Math.round(el.getBoundingClientRect().width));
  const mid=await state(page,".waterfront",Math.round(viewport.height*.48));
  await take(page,name+"-expansion");
  const end=await state(page,".waterfront",Math.round(viewport.height*.1));
  const rev=await state(page,".waterfront",Math.round(viewport.height*.48));
  assert.equal(rev,mid);
  if(name!=="mobile"){assert.ok(end>mid && mid>=initial);}
  else assert.equal(initial,end);
  await move(page,".transfer-chapter");
  await take(page,name+"-time-proof");
  await move(page,".materials");
  await take(page,name+"-materials");
  const options=page.locator(".view-options button");
  const metrics=async()=>options.evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect();return [r.width,r.height,getComputedStyle(e).paddingInlineStart,getComputedStyle(e).paddingInlineEnd];}));
  const normal=await metrics();
  assert.ok(normal.every(([w,h,a,b])=>w>=44&&h>=44&&a===b&&Math.abs(w-normal[0][0])<=1));
  await options.nth(2).click();
  assert.deepEqual(await metrics(),normal);
  await page.locator(".view-options").screenshot({path:path.join(out,name+"-segments-selected.png")});
  await options.nth(2).evaluate(btn=>btn.blur());
  await page.keyboard.press("Tab");
  await options.first().focus();
  await page.locator(".view-options").screenshot({path:path.join(out,name+"-segments-focus.png")});
  for (const route of ["counterform/","night-ferry/"]){
   const pane=await context.newPage();
   assert.equal((await pane.goto(base+route)).status(),200);
   await pane.evaluate(()=>document.fonts.ready);
   await take(pane,name+"-"+route.replace("/",""));
   await pane.close();
  }
  await move(page,"#contact");
  await take(page,name+"-contact");
  await page.emulateMedia({reducedMotion:"reduce"});
  const still=await state(page,".waterfront",Math.round(viewport.height*.48));
  assert.equal(still,viewport.width);
  assert.equal(await page.locator(".track-fill").first().evaluate(el=>getComputedStyle(el).transform),"none");
  data.contexts[name]={viewport,initial,mid,end,reverse:rev,reducedWidth:still,segments:normal};
  await context.close();
 }
 if(records){
  const context=await browser.newContext({viewport:sizes.desktop,recordVideo:{dir:out,size:{width:1152,height:800}}});
  const page=await context.newPage();
  const clip=page.video();
  await page.goto(base);
  await page.waitForTimeout(1300);
  for(const selector of [".waterfront",".transfer-chapter",".materials","#contact"]){
   const y=await page.locator(selector).evaluate(el=>el.getBoundingClientRect().top+scrollY);
   await glide(page,y-50,selector===".waterfront"?2050:1550);
   await page.waitForTimeout(450);
  }
  const mediaY=await page.locator(".waterfront").evaluate(el=>el.getBoundingClientRect().top+scrollY);
  await glide(page,mediaY-480,1750);
  await page.waitForTimeout(350);
  await context.close();
  const raw=await clip.path();
  await clip.saveAs(path.join(out,"selected-work.webm"));
  fs.unlinkSync(raw);
 }
 } finally {
  await browser.close();serve.close();
  fs.writeFileSync(path.join(out,"metrics.json"),JSON.stringify(data,null,2));
  console.log(JSON.stringify(data.contexts));
 }
})().catch(e=>{serve.close();console.error(e);process.exitCode=1;});