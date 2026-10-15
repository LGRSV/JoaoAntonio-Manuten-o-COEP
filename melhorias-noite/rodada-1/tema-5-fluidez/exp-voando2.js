// Experimento 2: variantes do protótipo (flags em window.__PX + CSS extra) medidas em rodadas intercaladas (CPU 4x, desktop 1440x900)
const L = require('./lib.js'), fs = require('fs'), path = require('path');
const U_CSS = `.mt-redes path{vector-effect:none}.mt-redes-f path{stroke-width:calc(1 * var(--u,1))}.mt-redes-d path{stroke-width:calc(1.7 * var(--u,1))}
.mt-redes.realce .mt-redes-d path.on{stroke-width:calc(2.8 * var(--u,1))}.mt-redes-a path{stroke-width:calc(2.6 * var(--u,1))}`;
const V = {
  'V0 original (sem proto)': { proto: false },
  'V1 esconde redes no voo': { px: {}, css: '.voando .mt-redes{visibility:hidden}' },
  'V14 esconde so -f/-d (mantem foco)': { px: {}, css: '.voando .mt-redes-f,.voando .mt-redes-d{visibility:hidden}' },
  'V15 V14 + tracos simples no foco': { px: {}, css: '.voando .mt-redes-f,.voando .mt-redes-d{visibility:hidden}.voando .mt-redes-a path{stroke-linecap:butt;stroke-linejoin:miter}' },
  'V16 opacity 0 + fade 250ms': { px: {}, css: '.mt-redes{transition:opacity .25s .05s}.voando .mt-redes{opacity:0;transition:none}' },
  'V17 display none no voo': { px: {}, css: '.voando .mt-redes{display:none}' },
};
const RODADAS = +(process.env.RODADAS || 4);
const espera = async (page, cond, ms = 8000) => { try { await page.waitForFunction(cond, null, { timeout: ms, polling: 30 }); } catch (e) {} };
async function roda(cfg) {
  const s = await L.abre({ perfil: 'cpu4', extraInit: L.instrumenta }); const { page } = s;
  if (cfg.proto !== false) { await s.ctx.route('**/assets/mapa-municipios.js', r => r.fulfill({ path: path.join(__dirname, 'proto/mapa-municipios.js'), contentType: 'text/javascript' })); await s.ctx.addInitScript(`window.__PX=${JSON.stringify(cfg.px || {})}`); }
  await page.goto(L.BASE, { waitUntil: 'load' }); await espera(page, `document.querySelectorAll('.mun').length>100`);
  if (cfg.css) await page.addStyleTag({ content: cfg.css });
  const FIM = `!document.querySelector('.mt-mapa').classList.contains('voando')`;
  await page.click('.mt-regcards button[data-reg="Centro"]'); await espera(page, FIM); await page.waitForTimeout(300);
  await (await page.$('.mt-pchip[data-polo]')).click(); await espera(page, FIM); await page.waitForTimeout(300);
  const r = {};
  for (const k of ['mun', 'aliment', 'esc']) {
    if (k === 'aliment') { await espera(page, `document.querySelectorAll('.mt-redes-d path').length>0`, 15000); await page.waitForTimeout(500); }
    await page.evaluate(() => { window.__lt.length = 0; window.__fpsIni(); });
    if (k === 'mun') await page.evaluate(() => [...document.querySelectorAll('.mun')].find(x => x.getAttribute('tabindex') === '0').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    if (k === 'aliment') await (await page.$('.mt-al')).click();
    if (k === 'esc') await page.keyboard.press('Escape');
    await page.waitForTimeout(40); await espera(page, FIM); await page.waitForTimeout(100);
    r[k] = await page.evaluate(() => ({ ...window.__fpsFim(), ltMax: Math.max(0, ...window.__lt.map(x => x.d)) }));
  }
  await s.browser.close(); return r;
}
const med = a => { a = a.slice().sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
(async () => {
  const res = {}; Object.keys(V).forEach(k => res[k] = []);
  for (let i = 0; i < RODADAS; i++) for (const [k, cfg] of Object.entries(V)) res[k].push(await roda(cfg));
  const out = {};
  for (const [k, rs] of Object.entries(res)) {
    out[k] = Object.fromEntries(['mun', 'aliment', 'esc'].map(m => [m, { fps: med(rs.map(r => r[m].fps)), pior: med(rs.map(r => r[m].pior)), ltMax: Math.round(med(rs.map(r => r[m].ltMax))), todos: rs.map(r => r[m].fps) }]));
    console.log(k.padEnd(40), ['mun', 'aliment', 'esc'].map(m => `${m}: ${out[k][m].fps}fps pior ${out[k][m].pior}ms lt ${out[k][m].ltMax}`).join('  |  '));
  }
  fs.writeFileSync('medicoes/'+(process.env.SAIDA||'exp-voando2')+'.json', JSON.stringify(out, null, 1));
})();
