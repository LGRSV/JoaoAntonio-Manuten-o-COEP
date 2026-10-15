const L=require('../lib.js');
(async()=>{
 const b=await L.chromium.launch();
 for (const t of ['d','m']) {
  const p=await L.abre(b,t,'s1 s2 s3 s5');
  await L.mapaNoTopo(p); await L.foto(p,'x-'+t+'-estado');
  await L.nivel(p,'regional'); await L.foto(p,'x-'+t+'-reg');
  console.log(t,p.erros);
 }
 await b.close();
})();
