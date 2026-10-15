// Carga da página do alimentador (LD02022033, com a lupa): ANTES e DEPOIS ALTERNADOS carga a carga (a máquina é compartilhada: o ruído pega os dois igualmente).
// uso: N=5 CPU=4 node ab-carga.js   -> medicoes/ab-carga.json  (mediana, mínimo e máximo de cada variante)
const L = require('./lib.js'), fs = require('fs');
const N = +(process.env.N || 5), CPU = process.env.CPU === '1' ? 'base' : 'cpu4';
const med = a => { const v = a.slice().sort((x, y) => x - y); return v[Math.floor(v.length / 2)]; };
async function uma(vp, proto) {
  process.env.PROTO = proto ? '1' : ''; delete require.cache[require.resolve('./injeta.js')]; const inj = require('./injeta.js');
  const s = await L.abre({ ...(vp === 'celular' ? { w: 390, h: 844, mobile: true } : {}), perfil: CPU }); await inj.aplica(s.ctx, s.page);
  await s.ctx.addInitScript(() => { window.__lt = []; window.__ls = 0; window.__pronto = 0;
    try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push([e.startTime, e.duration]))).observe({ type: 'longtask', buffered: true }); } catch (e) {}
    try { new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__ls += e.value; })).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
    const t = setInterval(() => { if (window.__map && document.querySelector('#lista > *') && document.documentElement.classList.contains('al-pronto')) { window.__pronto = Math.round(performance.now()); clearInterval(t); } }, 20); });
  await s.page.goto(L.BASE + 'alimentadores/LD02022033/', { waitUntil: 'load' }); await s.page.waitForFunction('window.__pronto > 0', null, { timeout: 90000 }); await s.page.waitForTimeout(2500);
  const r = await s.page.evaluate(() => { const f = (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0; const lt = window.__lt.filter(x => x[0] >= f);
    return { pronto: window.__pronto, tbt: Math.round(lt.reduce((a, x) => a + Math.max(0, x[1] - 50), 0)), ltMax: Math.round(Math.max(0, ...lt.map(x => x[1]))), cls: +window.__ls.toFixed(4) }; });
  await s.browser.close(); return r;
}
(async () => {
  const R = {};
  for (const vp of ['desktop', 'celular']) { const acc = { antes: [], depois: [] };
    for (let i = 0; i < N; i++) for (const v of (i % 2 ? ['depois', 'antes'] : ['antes', 'depois'])) { acc[v].push(await uma(vp, v === 'depois')); }
    R[vp] = {}; for (const v of ['antes', 'depois']) R[vp][v] = Object.fromEntries(['pronto', 'tbt', 'ltMax', 'cls'].map(k => [k, { med: med(acc[v].map(x => x[k])), min: Math.min(...acc[v].map(x => x[k])), max: Math.max(...acc[v].map(x => x[k])) }]));
    console.log(vp, CPU, JSON.stringify(R[vp])); }
  fs.writeFileSync(`medicoes/ab-carga${CPU === 'base' ? '-base' : ''}.json`, JSON.stringify(R, null, 1));
})();
