const L = require('./lib.js');
(async () => {
  const b = await L.chromium.launch();
  for (const tela of ['d','m']) {
    let p = await L.abre(b, tela, { proto: true });
    await L.nivel(p, 'regional'); await L.foto(p, `sonda3-${tela}-regional`);
    await L.nivel(p, 'polo'); 
    const pm = await p.$eval('.mun.tem[aria-label="Rio Sono"]', e => { const r = e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height*0.35}; });
    await p.mouse.move(pm.x, pm.y, {steps:4}); await p.waitForTimeout(300);
    await L.foto(p, `sonda3-${tela}-polo-dica`);
    await L.solta(p);
    await L.nivel(p, 'mun'); await L.foto(p, `sonda3-${tela}-mun`);
    console.log(tela, p.erros);
    await p.close();
  }
  await b.close();
})();
