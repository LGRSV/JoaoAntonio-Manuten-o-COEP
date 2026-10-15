// Tempo de estilo + layout + pintura na carga da página do alimentador (trace do Chromium), mediana de 3. uso: node layout-carga.js <rotulo> [4]
const L = require('./lib.js'), inj = require('./injeta.js'), fs = require('fs');
const rot = process.argv[2] || 'antes', cpu = process.argv[3] === '4' ? 'cpu4' : 'base';
const mediana = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
(async () => {
  const acc = {};
  for (let i = 0; i < 3; i++) {
    const s = await L.abre({ perfil: cpu }); await inj.aplica(s.ctx, s.page); const { page, browser } = s;
    await browser.startTracing(page, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline'] });
    await page.goto(L.BASE + 'alimentadores/LD02022033/', { waitUntil: 'load' }); await page.waitForTimeout(3500);
    const ev = JSON.parse((await browser.stopTracing()).toString()).traceEvents, sm = {};
    ev.filter(e => e.ph === 'X' && /^(Layout|UpdateLayoutTree|Paint|PrePaint|Commit|EvaluateScript)$/.test(e.name)).forEach(e => { sm[e.name] = (sm[e.name] || 0) + e.dur / 1000; });
    sm['estilo+layout'] = (sm.Layout || 0) + (sm.UpdateLayoutTree || 0);
    Object.entries(sm).forEach(([k, v]) => (acc[k] = acc[k] || []).push(v)); await browser.close();
  }
  const R = Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, Math.round(mediana(v))])); console.log(cpu, rot, JSON.stringify(R));
  fs.writeFileSync(`medicoes/layout-carga-${rot}-${cpu}.json`, JSON.stringify(R));
})();
