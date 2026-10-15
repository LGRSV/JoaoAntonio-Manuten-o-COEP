const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const URL='http://localhost:8765/teste/';
(async()=>{
 const b=await chromium.launch();
 for (const [w,h,n] of [[1440,900,'d'],[390,844,'m']]) {
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:n==='m',isMobile:n==='m'});
  const p=await ctx.newPage();
  await p.goto(URL,{waitUntil:'networkidle'});
  const shot=async s=>p.screenshot({path:`explor/${n}-${s}.jpg`,type:'jpeg',quality:80});
  await shot('0-estado');
  await p.click('.mt-regcards button[data-reg="Centro"]'); await p.waitForTimeout(1200); await shot('1-regional');
  await p.click('.mt-pchip[data-polo="Palmas"]'); await p.waitForTimeout(1200); await shot('2-polo');
  const cods=await p.$$eval('.mun.tem',a=>a.map(x=>x.dataset.cod+':'+x.getAttribute('aria-label')));
  await p.evaluate(()=>{});
  await p.click('.mun.tem[aria-label="Palmas"]',{force:true}); await p.waitForTimeout(1500); await shot('3-mun');
  if(n==='m'){await p.click('.mt-puxa');await p.waitForTimeout(400);await shot('3b-mun-aberta');} await p.click('.mt-al'); await p.waitForTimeout(1500); await shot('4-al');
  console.log(await p.evaluate(()=>document.querySelector('.mt-barra').innerText));
  await ctx.close();
 }
 await b.close();
})();
