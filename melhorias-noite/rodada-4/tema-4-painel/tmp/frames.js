const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { abre } = require('../prints.js');
(async () => {
  const b = await chromium.launch(); const [cod, vp] = [process.argv[2] || 'LD01072001', process.argv[3] || 'd'];
  const ctx = await b.newContext({ viewport: vp === 'd' ? { width: 1440, height: 900 } : { width: 390, height: 844 }, isMobile: vp === 'm', hasTouch: vp === 'm' });
  const p = await ctx.newPage();
  await p.addInitScript(() => { window.__f = []; const t0 = performance.now(); const q = () => { const g = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)].join(','); }; const k = [Math.round(performance.now() - t0), g('.mapbox'), g('h1'), g('.al-res'), g('.migalhas'), document.documentElement.className].join(' | '); const l = window.__f[window.__f.length - 1]; if (!l || l.slice(l.indexOf('|')) !== k.slice(k.indexOf('|'))) window.__f.push(k); if (performance.now() - t0 < 3000) requestAnimationFrame(q); }; requestAnimationFrame(q); });
  const C = require('../prints.js');
  await p.route('**/*', async r => { r.continue(); });
  await ctx.close(); await b.close();
})();
