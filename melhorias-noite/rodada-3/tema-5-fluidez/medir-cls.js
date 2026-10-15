// CLS (layout-shift) por página, dispositivo e perfil; mediana de N cargas a frio. Mostra também quem se mexeu (sources).
// uso: node medir-cls.js <rotulo> [PROTO=1]   (PROTO=1 injeta proto/ via injeta.js)
const L = require('./lib.js'), fs = require('fs'), inj = require('./injeta.js');
const rotulo = process.argv[2] || 'antes', N = +(process.env.N || 3);
const PAGINAS = { inicio: '', polos: 'polos/', alimentador: 'alimentadores/LD02022033/' };
const sel = n => { if (!n || n.nodeType !== 1) return '?'; return n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + (typeof n.className === 'string' && n.className ? '.' + n.className.trim().split(/\s+/)[0] : ''); };
const mediana = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
(async () => {
  const R = {};
  const perfis = (process.env.PERFIS || 'base,cpu4,lenta').split(',');
  for (const [vp, cfg] of Object.entries({ desktop: { w: 1440, h: 900 }, celular: { w: 390, h: 844, mobile: true } })) {
    for (const [pg, url] of Object.entries(PAGINAS)) for (const perfil of perfis) {
      const cls = [], quem = {}, fcp = [], lcp = [];
      for (let i = 0; i < N; i++) {
        const s = await L.abre({ ...cfg, perfil, tema: process.env.TEMA || 'escuro' });
        await inj.aplica(s.ctx, s.page);
        await s.ctx.addInitScript(() => {
          window.__ls = []; window.__lcp = 0;
          const sel = n => { if (!n || n.nodeType !== 1) return '?'; return n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + (typeof n.className === 'string' && n.className ? '.' + n.className.trim().split(/\s+/)[0] : ''); };
          new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__ls.push({ t: Math.round(e.startTime), v: e.value, src: (e.sources || []).map(x => ({ n: sel(x.node), de: [Math.round(x.previousRect.x), Math.round(x.previousRect.y)], para: [Math.round(x.currentRect.x), Math.round(x.currentRect.y)] })) }); })).observe({ type: 'layout-shift', buffered: true });
          new PerformanceObserver(l => l.getEntries().forEach(e => { window.__lcp = Math.round(e.startTime); })).observe({ type: 'largest-contentful-paint', buffered: true });
        });
        await s.page.goto(L.BASE + url, { waitUntil: 'load' });
        await s.page.waitForTimeout(perfil === 'lenta' ? 3500 : 1800);
        const r = await s.page.evaluate(() => ({ ls: window.__ls, lcp: window.__lcp, fcp: (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime }));
        cls.push(+r.ls.reduce((a, x) => a + x.v, 0).toFixed(4)); fcp.push(Math.round(r.fcp || 0)); lcp.push(r.lcp);
        r.ls.forEach(x => x.src.forEach(y => { const k = y.n; (quem[k] = quem[k] || { n: 0, v: 0, ex: `${y.de}→${y.para}` }).n++; quem[k].v += x.v / Math.max(1, x.src.length); }));
        await s.browser.close();
      }
      const k = `${vp}|${pg}|${perfil}`; R[k] = { cls: mediana(cls), todos: cls, fcp: mediana(fcp), lcp: mediana(lcp), quem };
      console.log(k.padEnd(30), 'CLS', R[k].cls, cls.join('/'), 'FCP', R[k].fcp, 'LCP', R[k].lcp, Object.entries(quem).slice(0, 4).map(([a, b]) => `${a}(${b.ex})`).join(' '));
    }
  }
  fs.writeFileSync(`medicoes/cls-${rotulo}${process.env.TEMA === 'claro' ? '-claro' : ''}.json`, JSON.stringify(R, null, 1));
})();
