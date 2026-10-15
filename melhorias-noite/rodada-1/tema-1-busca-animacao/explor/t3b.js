const L=require('../lib.js');
(async()=>{
 const b=await L.chromium.launch();
 const p=await L.abre(b,'m','s1');
 await p.evaluate(()=>{const e=document.querySelector('.mt-regs'); e.style.outline='1px solid red'; });
 const r=await p.evaluate(()=>{const e=document.querySelector('.mt-regs');const arr=[];e.querySelectorAll('*').forEach(c=>{const r=c.getBoundingClientRect();arr.push([c.tagName,c.className,Math.round(r.y),Math.round(r.height)])});return arr});
 console.log(JSON.stringify(r));
 await b.close();
})();
