const L=require('../lib.js');
(async()=>{
 const b=await L.chromium.launch();
 const p=await L.abre(b,'m','s1');
 console.log(await p.evaluate(()=>{const e=document.querySelector('.mt-regs');const cs=getComputedStyle(e);return JSON.stringify({h:cs.height,ph:cs.paddingBottom,pos:cs.position,open:e.open,kids:[...e.children].map(c=>c.tagName+c.className),minH:cs.minHeight,disp:cs.display,pa:cs.paddingTop})}));
 await b.close();
})();
