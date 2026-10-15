const L=require('../lib.js');
(async()=>{
 const b=await L.chromium.launch();
 for (const t of ['d','m']) {
  const p=await L.abre(b,t,'s1 s2 s3 s5');
  await p.evaluate(()=>window.scrollTo(0,200));
  await p.click('.mt-tc'); await p.waitForTimeout(900);
  console.log(t,'fs?',await p.evaluate(()=>[!!document.fullscreenElement, document.body.className, innerWidth, innerHeight, document.querySelector('.mt-mapa').getBoundingClientRect().height]));
  await L.foto(p,'x-'+t+'-fs-estado');
  await L.nivel(p,'mun'); await L.foto(p,'x-'+t+'-fs-mun');
  await p.keyboard.press('Escape'); await p.waitForTimeout(700);
  console.log(t,'após Esc', await p.evaluate(()=>[!!document.fullscreenElement, document.body.className, scrollY, document.querySelector('#mapa-to').className]));
  console.log(p.erros);
 }
 await b.close();
})();
