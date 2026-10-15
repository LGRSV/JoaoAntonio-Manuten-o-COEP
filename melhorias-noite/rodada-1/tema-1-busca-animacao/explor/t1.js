const L=require('../lib.js');
(async()=>{
 const b=await L.chromium.launch();
 for (const t of ['d','m']) {
  const p=await L.abre(b,t,'s1 s2 s5');
  await L.nivel(p,'mun'); await L.mapaNoTopo(p); await L.foto(p,'x-'+t+'-mun');
  if (t==='m'){ await p.click('.mt-puxa'); await p.waitForTimeout(600); await L.foto(p,'x-m-mun-aberta'); await p.click('.mt-al'); await p.waitForTimeout(1500); await L.foto(p,'x-m-al'); }
  else { await p.click('.mt-al'); await p.waitForTimeout(1500); await L.foto(p,'x-d-al'); }
  console.log(t,p.erros);
 }
 await b.close();
})();
