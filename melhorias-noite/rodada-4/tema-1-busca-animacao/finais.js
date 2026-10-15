// Gera prints-finais/ (rodada 4, tema 1): 4 pares antes/depois, 1440x900 (d) e 390x844 (m), JPEG 80, tema escuro.
// "antes" = base atual (live/ = alimentador/site/); "depois" = base + proto/final.diff (arquivos de proto/).  Uso: node finais.js
const L = require('./lib.js');
const { chromium, abre, nivel, solta, esperaVoo } = L;
const path = require('path');
const OUT = path.join(L.RAIZ, 'prints-finais');
const shot = (p, nome) => p.screenshot({ path: path.join(OUT, nome + '.jpg'), type: 'jpeg', quality: 80 });
const sobre = async (p, nome) => {
  const pt = await p.$eval(`.mun.tem[aria-label="${nome}"]`, e => { const r = e.getBoundingClientRect(); for (const [fx, fy] of [[.5, .3], [.5, .5], [.4, .6]]) { const x = r.left + r.width * fx, y = r.top + r.height * fy; if (document.elementFromPoint(x, y) === e) return { x, y }; } return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.move(pt.x, pt.y, { steps: 4 }); await p.waitForTimeout(300);
};
(async () => {
  const b = await chromium.launch();
  try {
    for (const tl of ['d', 'm']) {
      const px = tl === 'd' ? '1440' : '390';
      for (const q of ['antes', 'depois']) {
        const proto = q === 'depois';
        // 01 · link com endereço (#sul/gurupi): a base ignora o endereço, o protótipo abre no polo
        let p = await abre(b, tl, { proto, hash: '#sul/gurupi' }); await esperaVoo(p, 4000); await p.waitForTimeout(800); await solta(p);
        await shot(p, `01-link-polo-${q}-${px}`); await p.context().close();
        // 02 · município: a ← fica coberta pela lista na base; no protótipo mora na barra
        p = await abre(b, tl, { proto }); await nivel(p, 'mun'); await solta(p); await shot(p, `02-municipio-seta-${q}-${px}`); await p.context().close();
        // 03 · regional: chips de polo repetidos na barra × cartão do polo como botão
        p = await abre(b, tl, { proto }); await nivel(p, 'regional'); await solta(p); await shot(p, `03-regional-polos-${q}-${px}`); await p.context().close();
        // 04 · balão do município no polo: cobre o cartão e repete × enxuto
        p = await abre(b, tl, { proto }); await nivel(p, 'polo'); await sobre(p, 'Rio Sono'); await shot(p, `04-balao-${q}-${px}`); await p.context().close();
      }
    }
  } finally { await b.close(); }
  console.log('prints-finais prontos');
})();
