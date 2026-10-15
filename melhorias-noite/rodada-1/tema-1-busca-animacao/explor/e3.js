const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const URL='http://localhost:8765/teste/';
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1440,height:900}});
 const p=await ctx.newPage();
 await p.goto(URL,{waitUntil:'networkidle'});
 await p.click('.mt-regcards button[data-reg="Centro"]'); await p.waitForTimeout(1200);
 await p.mouse.move(1000,560); await p.waitForTimeout(300);
 console.log('REG hover', await p.evaluate(()=>document.querySelector('.mt-dica').innerText));
 await p.click('.mt-pchip[data-polo="Palmas"]'); await p.waitForTimeout(1200);
 await p.click('.mun.tem[aria-label="Palmas"]',{force:true}); await p.waitForTimeout(1500);
 const bx=await p.$eval('.mt-redes-d path',e=>{const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]});
 // find a point on a path: hover over the list first
 await p.hover('.mt-al'); await p.waitForTimeout(300);
 console.log('texts', await p.evaluate(()=>[...document.querySelectorAll('.mt-barra,.mt-als,.mt-regs')].map(e=>e.innerText.replace(/\n+/g,' | ').slice(0,200))));
 console.log('scrollH', await p.evaluate(()=>[document.documentElement.scrollHeight, document.querySelector('.mt-mapa').getBoundingClientRect().top+scrollY, document.querySelector('.mt-mapa').offsetHeight]));
 await ctx.close(); await b.close();
})();
