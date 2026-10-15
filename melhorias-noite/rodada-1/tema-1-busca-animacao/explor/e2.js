const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const URL='http://localhost:8765/teste/';
(async()=>{
 const b=await chromium.launch();
 for (const [w,h,n] of [[1440,900,'d'],[390,844,'m']]) {
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:n==='m',isMobile:n==='m'});
  const p=await ctx.newPage();
  await p.goto(URL,{waitUntil:'networkidle'});
  const shot=async s=>p.screenshot({path:`explor/${n}-s${s}.jpg`,type:'jpeg',quality:80});
  await p.click('#lupa'); await p.waitForTimeout(400); await shot('0-aberta');
  await p.fill('#ativo-q','palm'); await p.waitForTimeout(900); await shot('1-palm');
  await p.fill('#ativo-q','790000'); await p.waitForTimeout(1200); await shot('2-ativo');
  await p.fill('#ativo-q','ETO-RD-GU 000353/2026'); await p.waitForTimeout(600); await shot('3-os-sug');
  await p.keyboard.press('Enter'); await p.waitForTimeout(1500); await shot('4-os-res');
  await p.fill('#ativo-q','7900001071'); await p.keyboard.press('Enter'); await p.waitForTimeout(1500); await shot('5-ativo-res');
  await ctx.close();
 }
 await b.close();
})();
