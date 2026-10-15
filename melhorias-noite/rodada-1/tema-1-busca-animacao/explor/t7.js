const L=require('../lib.js');
(async()=>{
 const b=await L.chromium.launch();
 const p=await L.abre(b,'d','s1 s2 s4 s5');
 await p.clock.install();
 await p.click('#lupa'); await p.fill('#ativo-q','palmas'); await p.clock.runFor(900);
 await p.click('.sug-op');
 for (let i=0;i<6;i++){ await p.clock.runFor(150); await L.foto(p,`x-d-c${i}`); console.log(await p.evaluate(()=>document.querySelector('.mt-mapa svg').getAttribute('viewBox')));}
 await b.close();
})();
