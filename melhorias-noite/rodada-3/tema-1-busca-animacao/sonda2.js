const L = require('./lib.js');
(async () => {
  const b = await L.chromium.launch();
  for (const tela of ['d','m']) {
    let p = await L.abre(b, tela);
    await L.nivel(p, 'regional');
    // defeito 2: clique no cartão do polo
    const r = await p.$eval('.mt-selos .mt-pm[data-polo="Palmas"]', e => { const r = e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2, tag:e.tagName}; });
    const topo = await p.evaluate(({x,y}) => { const e = document.elementFromPoint(x,y); return e.className + '/' + e.tagName; }, r);
    await p.mouse.click(r.x, r.y); await L.esperaVoo(p);
    console.log(tela, 'cartão polo', r.tag, 'topo=', topo, 'nivel após clique=', JSON.stringify(await L.nivelAtual(p)));
    // busca vazia em cada nível
    await p.close();
    p = await L.abre(b, tela);
    await p.click('#lupa'); await p.waitForTimeout(400); await L.foto(p, `sonda2-${tela}-busca-estado`);
    await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
    await L.nivel(p, 'regional'); await p.click('#lupa'); await p.waitForTimeout(400); await L.foto(p, `sonda2-${tela}-busca-regional`);
    await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
    await L.nivel(p, 'polo'); await p.click('#lupa'); await p.waitForTimeout(400); await L.foto(p, `sonda2-${tela}-busca-polo`);
    await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
    await L.nivel(p, 'mun');
    // defeito 1: seta
    const v = await p.$eval('.mt-volta', e => { const r = e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2, hidden:e.hidden, w:r.width}; });
    const t1 = await p.evaluate(({x,y}) => { const e = document.elementFromPoint(x,y); return e.className + '/' + e.tagName; }, v);
    console.log(tela, 'seta no município', JSON.stringify(v), 'topo=', t1, 'lista aberta=', await p.$eval('#ativo-res', e => !!e.innerHTML));
    await p.close();
    // defeito 3: balão no polo
    p = await L.abre(b, tela);
    await L.nivel(p, 'polo');
    const c = await p.$eval('.mt-nomes2 .mt-mn:not(.fora)', e => { const r = e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; });
    // passa o mouse em um ponto do município pelo path do Rio Sono
    const pm = await p.$eval('.mun.tem[aria-label="Rio Sono"]', e => { const r = e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height*0.35}; });
    await p.mouse.move(pm.x, pm.y, {steps:4}); await p.waitForTimeout(300);
    const dica = await p.$eval('.mt-dica', e => { const r = e.getBoundingClientRect(); return {display:getComputedStyle(e).display, x:r.x,y:r.y,w:r.width,h:r.height, txt:e.innerText}; });
    const cards = await p.$$eval('.mt-nomes2 .mt-mn', es => es.map(e => { const r = e.getBoundingClientRect(); return {t:e.innerText.replace(/\n/g,' '),x:r.x,y:r.y,w:r.width,h:r.height}; }));
    const cob = cards.filter(k => k.x < dica.x+dica.w && k.x+k.w > dica.x && k.y < dica.y+dica.h && k.y+k.h > dica.y).map(k=>k.t);
    console.log(tela, 'balão', JSON.stringify(dica), 'cobre cartões:', cob);
    await L.foto(p, `sonda2-${tela}-polo-dica`);
    await p.close();
  }
  await b.close();
})();
