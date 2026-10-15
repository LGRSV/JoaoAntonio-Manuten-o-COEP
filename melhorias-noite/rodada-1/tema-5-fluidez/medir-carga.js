// Carga: tempo até o mapa aparecer, bytes, requisições, long tasks, CLS. Uso: node medir-carga.js [rotulo] (BASE=... para outra origem)
const L = require('./lib.js'), fs = require('fs'), inj = require('./injeta.js');
const SO = (process.env.PAGINAS || 'inicial,alimentador,polos').split(',');
const rotulo = process.argv[2] || 'antes', N = +(process.env.N || 3);
const PAGINAS = {
  inicial: { url: '', pronto: `document.querySelectorAll('.mun').length>100`, marca: `document.querySelector('.mt-mapa svg .mun')` },
  alimentador: { url: 'alimentadores/LD01072001/', pronto: `document.querySelectorAll('#lista > *').length>0 && document.querySelectorAll('.leaflet-tile-loaded').length>3`, marca: `document.querySelector('#lista > *') && document.querySelector('.leaflet-tile-loaded') && document.querySelector('canvas')` },
  polos: { url: 'polos/', pronto: `document.querySelectorAll('table tbody tr, .rank tr, [class*=polo]').length>3`, marca: `document.querySelector('table tbody tr')` },
};
const mediana = a => { const s = a.filter(x => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const ini = ({ marca }) => `(() => {
  window.__t = {}; window.__lt = []; window.__cls = 0; window.__lcp = 0;
  try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push({ t: e.startTime, d: e.duration }))).observe({ type: 'longtask', buffered: true }); } catch (e) {}
  try { new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
  try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__lcp = e.startTime)).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
  const mo = new MutationObserver(() => { if (!window.__t.mapa && (${marca})) { window.__t.mapa = performance.now(); } });
  const go = () => mo.observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] }); go();
})()`;
(async () => {
  const saida = {};
  for (const [vp, cfg] of Object.entries({ desktop: { w: 1440, h: 900 }, celular: { w: 390, h: 844, mobile: true } })) {
    for (const perfil of ['base', 'cpu4', 'lenta']) {
      for (const [pg, P] of Object.entries(PAGINAS).filter(([k]) => SO.includes(k))) {
        const runs = [];
        for (let i = 0; i < N; i++) {
          const s = await L.abre({ ...cfg, perfil }); await inj.aplica(s.ctx, s.page);
          await s.ctx.addInitScript(ini(P));
          const t0 = Date.now();
          await s.page.goto(L.BASE + P.url, { waitUntil: 'commit' });
          try { await s.page.waitForFunction(P.pronto, null, { timeout: 90000, polling: 50 }); } catch (e) {}
          const tPronto = Date.now() - t0;
          await s.page.waitForLoadState('load', { timeout: 90000 }).catch(() => {});
          const tLoad = Date.now() - t0;
          await s.page.waitForTimeout(1500);
          const m = await s.page.evaluate(() => {
            const nav = performance.getEntriesByType('navigation')[0], fcp = (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime;
            const lt = window.__lt, tbt = lt.reduce((a, x) => a + Math.max(0, x.d - 50), 0);
            return { dcl: nav.domContentLoadedEventEnd, load: nav.loadEventEnd, fcp, lcp: window.__lcp, mapa: window.__t.mapa, cls: +window.__cls.toFixed(4), lt_n: lt.length, lt_total: Math.round(lt.reduce((a, x) => a + x.d, 0)), lt_max: Math.round(Math.max(0, ...lt.map(x => x.d))), tbt: Math.round(tbt),
              heap_mb: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null, dom: document.getElementsByTagName('*').length };
          });
          const recs = Object.values(s.rec).filter(r => r.bytes != null);
          const local = recs.filter(r => r.url.startsWith(L.BASE));
          m.bytes_local = local.reduce((a, r) => a + r.bytes, 0); m.reqs_local = local.length;
          m.bytes_ext = s.ext.bytes; m.reqs_ext = s.ext.n;
          m.top = local.sort((a, b) => b.bytes - a.bytes).slice(0, 6).map(r => r.url.replace(L.BASE, '') + ' ' + Math.round(r.bytes / 1024) + 'KB');
          m.erros = s.log.erros.length; m.errosTxt = s.log.erros.slice(0, 5); m.falhas = s.log.falhas.slice(0, 5);
          m.pronto_wall = tPronto; m.load_wall = tLoad;
          runs.push(m); await s.browser.close();
        }
        const key = `${vp}|${perfil}|${pg}`;
        const agg = {}; Object.keys(runs[0]).forEach(k => { if (typeof runs[0][k] === 'number' || runs[0][k] == null) agg[k] = mediana(runs.map(r => r[k])); });
        agg.top = runs[0].top; agg.errosTxt = runs[0].errosTxt; agg.falhas = runs[0].falhas;
        saida[key] = agg; fs.writeFileSync(`medicoes/carga-${rotulo}.json`, JSON.stringify(saida, null, 1)); console.log(key, JSON.stringify({ mapa: agg.mapa && Math.round(agg.mapa), fcp: agg.fcp && Math.round(agg.fcp), lcp: Math.round(agg.lcp), load: Math.round(agg.load), kb: Math.round(agg.bytes_local / 1024), reqs: agg.reqs_local, lt: agg.lt_n, tbt: agg.tbt, cls: agg.cls, ext: Math.round(agg.bytes_ext / 1024) }));
      }
    }
  }
  fs.writeFileSync(`medicoes/carga-${rotulo}.json`, JSON.stringify(saida, null, 1));
})();
