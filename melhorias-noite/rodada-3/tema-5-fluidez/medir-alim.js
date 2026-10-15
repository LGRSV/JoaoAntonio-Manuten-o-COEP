// Página do alimentador (e polos/): carga (FCP, LCP, long tasks, TBT, CLS, bytes, "mapa e lista prontos") e interação do Leaflet
// (arrastar, zoom por roda/pinça): FPS, pior quadro e long tasks. Mediana de N execuções.
// uso: node medir-alim.js <rotulo> [pagina]   pagina = alimentador (padrão) | polos | ld01 ; PERFIS=base,cpu4,lenta ; N=3 ; INTERACAO=0 desliga a parte de arrastar/zoom
const L = require('./lib.js'), fs = require('fs'), inj = require('./injeta.js');
const rotulo = process.argv[2] || 'antes', pagina = process.argv[3] || 'alimentador', N = +(process.env.N || 3);
const URLS = { alimentador: 'alimentadores/LD02022033/', ld01: 'alimentadores/LD01072001/', polos: 'polos/' };
const mediana = a => { const v = a.filter(x => x != null && !isNaN(x)).sort((x, y) => x - y); return v.length ? v[Math.floor(v.length / 2)] : null; };
const HOOK = () => {
  window.__ls = 0; window.__lcp = 0; window.__t0 = performance.now();
  try { new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__ls += e.value; })).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
  try { new PerformanceObserver(l => l.getEntries().forEach(e => { window.__lcp = Math.round(e.startTime); })).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
  // "pronto": mapa do Leaflet criado + lista de trechos desenhada (alimentador) ou lista de polos (polos)
  window.__pronto = 0; const ch = setInterval(() => { const ok = (window.__map && document.querySelector('#lista > *')) || document.querySelector('#polos .card, #polos a, #polos li'); if (ok && !window.__pronto) { window.__pronto = Math.round(performance.now()); clearInterval(ch); } }, 10);
};
const dragMouse = async (p, ms = 1500) => { const b = await p.locator('#map').boundingBox(); const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  await p.mouse.move(cx, cy); await p.mouse.down(); const passos = Math.round(ms / 16); for (let i = 1; i <= passos; i++) { await p.mouse.move(cx - i * 5, cy - i * 2); await p.waitForTimeout(8); } await p.mouse.up(); };
const zoomRoda = async (p) => { const b = await p.locator('#map').boundingBox(); await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, -100); await p.waitForTimeout(160); } await p.waitForTimeout(900); for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, 100); await p.waitForTimeout(160); } };   // 8 cliques de roda de 100 px, dentro e fora
const arrastaToque = async (p, cdp) => { const b = await p.locator('#map').boundingBox(); await cdp.send('Input.synthesizeScrollGesture', { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2), xDistance: -220, yDistance: -90, speed: 500, gestureSourceType: 'touch' }); };
const pinca = async (p, cdp) => { const b = await p.locator('#map').boundingBox(); const x = Math.round(b.x + b.width / 2), y = Math.round(b.y + b.height / 2);
  await cdp.send('Input.synthesizePinchGesture', { x, y, scaleFactor: 2.2, relativeSpeed: 400, gestureSourceType: 'touch' }); await p.waitForTimeout(800); await cdp.send('Input.synthesizePinchGesture', { x, y, scaleFactor: .45, relativeSpeed: 400, gestureSourceType: 'touch' }); };
const fase = async (p, nome, f) => {
  await p.evaluate(() => { window.__lt0 = window.__lt.length; window.__fpsIni(); });
  await f(); await p.waitForTimeout(500);
  return p.evaluate(nome => { const r = window.__fpsFim(); const lt = window.__lt.slice(window.__lt0); return { fase: nome, ...r, longtasks: lt.length, ltMax: Math.max(0, ...lt.map(x => x.d)), ltSoma: lt.reduce((a, x) => a + x.d, 0) }; }, nome);
};
(async () => {
  const R = {}, perfis = (process.env.PERFIS || 'base,cpu4,lenta').split(',');
  for (const [vp, cfg] of Object.entries({ desktop: { w: 1440, h: 900 }, celular: { w: 390, h: 844, mobile: true } })) {
    for (const perfil of perfis) {
      const acc = { pronto: [], fcp: [], lcp: [], tbt: [], lt: [], ltMax: [], cls: [], kb: [], req: [], dcl: [], load: [], nos: [], mem: [] }, fases = {};
      for (let i = 0; i < N; i++) {
        const s = await L.abre({ ...cfg, perfil, tema: process.env.TEMA || 'escuro' }); await inj.aplica(s.ctx, s.page); const p = s.page;
        await s.ctx.addInitScript(L.instrumenta); await s.ctx.addInitScript(HOOK);
        await p.goto(L.BASE + URLS[pagina], { waitUntil: 'load' });
        await p.waitForFunction('window.__pronto>0', null, { timeout: 40000 }).catch(() => {});
        await p.waitForTimeout(perfil === 'lenta' ? 3000 : 1500);
        const m = await p.evaluate(() => { const nav = performance.getEntriesByType('navigation')[0], fcp = performance.getEntriesByName('first-contentful-paint')[0]; const f = fcp ? fcp.startTime : 0;
          const lt = window.__lt.filter(x => x.t + x.d > f); const tbt = lt.reduce((a, x) => a + Math.max(0, x.d - 50), 0);
          return { pronto: window.__pronto, fcp: Math.round(f), lcp: window.__lcp, tbt: Math.round(tbt), lt: window.__lt.length, ltMax: Math.max(0, ...window.__lt.map(x => x.d)), cls: +window.__ls.toFixed(4), dcl: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd), nos: document.getElementsByTagName('*').length, mem: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null }; });
        const kb = Object.values(s.rec).filter(r => !/^https?:\/\/(?!localhost)/.test(r.url)).reduce((a, r) => a + (r.bytes || 0), 0) / 1024;
        Object.keys(m).forEach(k => acc[k].push(m[k])); acc.kb.push(Math.round(kb)); acc.req.push(Object.values(s.rec).filter(r => /localhost/.test(r.url)).length);
        if (pagina !== 'polos' && process.env.INTERACAO !== '0' && perfil !== 'lenta') {
          const cdp = s.cdp; await p.evaluate(() => { window.__t = performance.now(); });
          const out = [];
          if (vp === 'desktop') { out.push(await fase(p, 'arrastar', () => dragMouse(p))); out.push(await fase(p, 'zoom-roda', () => zoomRoda(p))); }
          else { out.push(await fase(p, 'arrastar', () => arrastaToque(p, cdp))); out.push(await fase(p, 'pinca', () => pinca(p, cdp))); }
          out.push(await fase(p, 'hover-linhas', async () => { if (vp !== 'desktop') return; const b = await p.locator('#map').boundingBox(); for (let k = 0; k < 40; k++) { await p.mouse.move(b.x + 100 + k * 18, b.y + 150 + (k % 7) * 40); await p.waitForTimeout(16); } }));
          out.forEach(o => { (fases[o.fase] = fases[o.fase] || []).push(o); });
        }
        await s.browser.close();
      }
      const res = Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, mediana(v)]));
      const fs_ = Object.fromEntries(Object.entries(fases).map(([k, v]) => [k, { fps: mediana(v.map(x => x.fps)), pior: mediana(v.map(x => x.pior)), p95: mediana(v.map(x => x.p95)), travados: mediana(v.map(x => x.travados)), longtasks: mediana(v.map(x => x.longtasks)), ltMax: mediana(v.map(x => x.ltMax)) }]));
      R[`${vp}|${perfil}`] = { ...res, brutos: acc, interacao: fs_ };
      console.log(`${vp}|${perfil}`.padEnd(16), 'pronto', res.pronto, 'FCP', res.fcp, 'LCP', res.lcp, 'TBT', res.tbt, 'LT', res.lt, '(max', res.ltMax + ')', 'CLS', res.cls, 'KB', res.kb, 'req', res.req, 'nós', res.nos, 'heap', res.mem + 'MB', 'DCL', res.dcl, 'load', res.load);
      Object.entries(fs_).forEach(([k, v]) => console.log('    ', k.padEnd(14), JSON.stringify(v)));
    }
  }
  fs.writeFileSync(`medicoes/${pagina}-${rotulo}${process.env.TEMA === 'claro' ? '-claro' : ''}.json`, JSON.stringify(R, null, 1));
})();
