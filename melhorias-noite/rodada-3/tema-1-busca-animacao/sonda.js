const L = require('./lib.js');
(async () => {
  const b = await L.chromium.launch();
  for (const tela of ['d','m']) {
    const p = await L.abre(b, tela);
    await L.foto(p, `sonda-${tela}-estado`);
    await L.nivel(p, 'regional'); await L.foto(p, `sonda-${tela}-regional`);
    await L.nivel(p, 'polo'); await L.foto(p, `sonda-${tela}-polo`);
    await L.nivel(p, 'mun'); await L.foto(p, `sonda-${tela}-mun`);
    await L.nivel(p, 'al'); await L.foto(p, `sonda-${tela}-al`);
    console.log(tela, p.erros);
    await p.context().close();
  }
  await b.close();
})();
