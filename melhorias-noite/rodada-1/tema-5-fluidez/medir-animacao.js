// FPS e long tasks durante a navegação (regional → polo → município → alimentador → Esc) e varredura do mouse.
// Uso: node medir-animacao.js [rotulo] ; PROTO=1 injeta proto/ (ver injeta.js)
const L = require('./lib.js'), fs = require('fs'), inj = require('./injeta.js');
const rotulo = process.argv[2] || 'antes', N = +(process.env.N || 3);
const mediana = a => { const s = a.filter(x => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const espera = async (page, cond, ms = 6000) => { try { await page.waitForFunction(cond, null, { timeout: ms, polling: 30 }); return true; } catch (e) { return false; } };
const FIM_ANIMA = `!document.querySelector('.mt-mapa').classList.contains('voando')`;
async function passo(page, nome, acao, resultados) {
  await page.evaluate(() => { window.__lt.length = 0; window.__fpsIni(); });
  const t0 = Date.now();
  await acao();
  await page.waitForTimeout(30);
  await espera(page, FIM_ANIMA, 8000);
  const dur = Date.now() - t0;
  await page.waitForTimeout(120);                       // nomes/selos entram depois da animação
  const f = await page.evaluate(() => ({ ...window.__fpsFim(), lt: window.__lt.slice() }));
  resultados[nome] = { dur_ms: dur, fps: f.fps, p95_ms: f.p95, pior_ms: f.pior, quadros_lentos: f.travados, lt_n: f.lt.length, lt_max: Math.max(0, ...f.lt.map(x => x.d)), lt_total: f.lt.reduce((a, x) => a + x.d, 0) };
}
async function uma(cfg, perfil) {
  const s = await L.abre({ ...cfg, perfil, extraInit: L.instrumenta });
  await inj.aplica(s.ctx, s.page);
  const { page } = s, R = {};
  await page.goto(L.BASE, { waitUntil: 'load' });
  await espera(page, `document.querySelectorAll('.mun').length>100`, 30000); await page.waitForTimeout(800);
  const vazio = () => page.waitForTimeout(0);
  // varredura do mouse pelo estado inteiro (só desktop)
  if (!cfg.mobile) {
    await passo(page, '0 mouse varrendo o estado', async () => {
      const r = await page.evaluate(() => { const b = document.querySelector('.mt-mapa svg').getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
      for (let i = 0; i < 160; i++) { await page.mouse.move(r.x + r.w * (.3 + .4 * Math.abs(Math.sin(i / 11))), r.y + r.h * (.15 + .7 * (i / 160)), { steps: 1 }); await page.waitForTimeout(8); }
    }, R);
  }
  await passo(page, '1 abrir regional (Centro)', () => page.click('.mt-regcards button[data-reg="Centro"]'), R);
  await passo(page, '2 abrir polo', async () => { const b = await page.$('.mt-pchip[data-polo]'); await b.click(); }, R);
  await passo(page, '3 abrir município', async () => { await page.evaluate(() => { const p = [...document.querySelectorAll('.mun')].find(x => x.getAttribute('tabindex') === '0'); p.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); }, R);
  await espera(page, `document.querySelectorAll('.mt-redes-d path').length>0`, 15000);
  if (cfg.mobile) { const px = await page.$('.mt-puxa'); if (px) { await px.click(); await page.waitForTimeout(400); } }   // celular: a lista de alimentadores começa recolhida
  await passo(page, '4 zoom no alimentador', async () => { const b = await page.$('.mt-al'); await b.click(); }, R);
  await passo(page, '5 Esc (volta ao município)', () => page.keyboard.press('Escape'), R);
  await passo(page, '6 Esc (volta ao polo)', () => page.keyboard.press('Escape'), R);
  await passo(page, '7 Esc (volta à regional)', () => page.keyboard.press('Escape'), R);
  await passo(page, '8 Esc (volta ao Tocantins)', () => page.keyboard.press('Escape'), R);
  R.erros = s.log.erros.length; R.errosTxt = s.log.erros.slice(0, 4);
  await s.browser.close(); return R;
}
(async () => {
  const saida = {};
  for (const [vp, cfg] of Object.entries({ desktop: { w: 1440, h: 900 }, celular: { w: 390, h: 844, mobile: true } })) {
    for (const perfil of ['base', 'cpu4']) {
      const runs = []; for (let i = 0; i < N; i++) runs.push(await uma(cfg, perfil));
      const agg = {};
      Object.keys(runs[0]).filter(k => typeof runs[0][k] === 'object' && !Array.isArray(runs[0][k])).forEach(k => {
        agg[k] = {}; Object.keys(runs[0][k]).forEach(m => agg[k][m] = mediana(runs.map(r => r[k] && r[k][m])));
      });
      agg.errosTxt = runs[0].errosTxt;
      saida[`${vp}|${perfil}`] = agg;
      console.log(vp, perfil); Object.entries(agg).forEach(([k, v]) => { if (v && v.fps !== undefined) console.log('  ', k.padEnd(30), 'fps', v.fps, 'p95', v.p95_ms, 'pior', v.pior_ms, 'lentos', v.quadros_lentos, 'lt', v.lt_n, v.lt_max && Math.round(v.lt_max), 'dur', v.dur_ms); });
    }
  }
  fs.writeFileSync(`medicoes/animacao-${rotulo}.json`, JSON.stringify(saida, null, 1));
})();
