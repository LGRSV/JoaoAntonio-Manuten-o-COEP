const L=require('../lib.js');
(async()=>{
 const b=await L.chromium.launch();
 for (const t of ['d','m']) {
  const p=await L.abre(b,t,'s1 s2 s4 s5');
  await p.click('#lupa'); await p.fill('#ativo-q','palmas'); await p.waitForTimeout(900);
  const t0=Date.now();
  await p.click('.sug-op'); 
  const tempos=[];
  for (let i=0;i<8;i++){ tempos.push(Date.now()-t0); await L.foto(p,`x-${t}-v${i}`); }
  console.log(t,tempos, await p.evaluate(()=>document.querySelector('.mt-barra').innerText.replace(/\n/g,' ')));
  await p.waitForTimeout(1200); await L.foto(p,`x-${t}-vfim`);
  console.log(p.erros, await p.evaluate(()=>[scrollY, document.querySelector('.mt-mapa').className]));
 }
 await b.close();
})();
