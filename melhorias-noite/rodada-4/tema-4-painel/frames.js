/* Diagnóstico de leiaute na carga: anota (a cada frame em que muda) o retângulo do mapa, do h1, do resumo e do caminho, e a classe do <html>.
 *   node frames.js <antes|depois> [AL] [d|m] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
global.__INIT = () => { window.__f = []; const t0 = performance.now(); const q = () => { const g = s => { const e = document.querySelector(s); if (!e) return '-'; const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)].join(','); }; const k = [g('.mapbox'), g('h1'), g('.al-res'), g('.migalhas'), document.documentElement.className, g('.mnu'), (document.querySelector('.wrap') || {style:{}}) && getComputedStyle(document.querySelector('.wrap') || document.body).gridTemplateColumns].join(' | '); const l = window.__f[window.__f.length - 1]; if (!l || l.slice(l.indexOf(':') + 1) !== k) window.__f.push(Math.round(performance.now() - t0) + ':' + k); if (performance.now() - t0 < 3000) requestAnimationFrame(q); }; requestAnimationFrame(q); };
const { abre } = require('./prints.js');
(async () => {
  const b = await chromium.launch(); const [conj, cod, vp] = [process.argv[2] || 'depois', process.argv[3] || 'LD01072001', process.argv[4] || 'd'];
  const { ctx, p } = await abre(b, cod, vp, conj);
  console.log((await p.evaluate(() => window.__f)).join('\n'));
  await ctx.close(); await b.close();
})();
