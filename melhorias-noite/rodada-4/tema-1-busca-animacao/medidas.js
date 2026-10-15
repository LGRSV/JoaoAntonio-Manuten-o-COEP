// Medições antes/depois (Chromium, sem throttling de CPU e com 4x de lentidão): duração de cada transição do mapa, quadros durante ela,
// maior intervalo entre quadros e tarefas longas (>50 ms). Cada cenário repete 3 vezes; vale a mediana.  Uso: node medidas.js > medidas.log
const L = require('./lib.js');
const { chromium, abre, esperaVoo } = L;
const mediana = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
async function mede(b, tl, proto, lento) {
  const p = await abre(b, tl, { proto });
  const cdp = await p.context().newCDPSession(p);
  if (lento) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.evaluate(() => {
    window.__m = { frames: [], longs: [] };
    new PerformanceObserver(l => l.getEntries().forEach(e => window.__m.longs.push(e.duration))).observe({ entryTypes: ['longtask'] });
    const f = t => { window.__m.frames.push(t); requestAnimationFrame(f); }; requestAnimationFrame(f);
  });
  const passos = [
    ['estado → regional (clique no cartão da regional)', () => p.click('.mt-regcards button[data-reg="Centro"]')],
    ['regional → polo (clique no cartão/botão do polo)', async () => { await p.click(await p.$('.mt-selos button.mt-pm[data-polo="Palmas"]') ? '.mt-selos button.mt-pm[data-polo="Palmas"]' : '.mt-pchip[data-polo="Palmas"]'); }],
    ['polo → município (clique no município)', () => p.click('.mun.tem[aria-label="Palmas"]', { force: true })],
    ['município → alimentador (clique na lista)', async () => { if (!await p.$('#ativo-res .sug-op')) { await p.click('#lupa'); await p.waitForTimeout(300); } await p.click('#ativo-res .sug-op'); }],
  ];
  const out = [];
  for (const [nome, acao] of passos) {
    await p.evaluate(() => { window.__m.frames = []; window.__m.longs = []; });
    const t0 = await p.evaluate(() => performance.now());
    await acao();
    await esperaVoo(p, 6000); await p.waitForTimeout(500);
    const r = await p.evaluate(t0 => { const fr = window.__m.frames.filter(t => t >= t0), gaps = fr.slice(1).map((t, i) => t - fr[i]); return { quadros: fr.length, maiorIntervalo: Math.round(Math.max(0, ...gaps)), longas: window.__m.longs.length, longaMax: Math.round(Math.max(0, ...window.__m.longs)) }; }, t0);
    out.push({ nome, ...r });
    await L.solta(p); await p.waitForTimeout(300);
  }
  await p.context().close();
  return out;
}
(async () => {
  const b = await chromium.launch();
  const res = {};
  for (const tl of ['d', 'm']) for (const lento of [false, true]) for (const proto of [false, true]) {
    const reps = []; for (let i = 0; i < 3; i++) reps.push(await mede(b, tl, proto, lento));
    const k = `${tl}${lento ? '-cpu4x' : ''}-${proto ? 'depois' : 'antes'}`;
    res[k] = reps[0].map((_, j) => ({ nome: reps[0][j].nome, quadros: mediana(reps.map(r => r[j].quadros)), maiorIntervaloMs: mediana(reps.map(r => r[j].maiorIntervalo)), tarefasLongas: mediana(reps.map(r => r[j].longas)), longaMaxMs: mediana(reps.map(r => r[j].longaMax)) }));
    console.log(k, JSON.stringify(res[k]));
  }
  require('fs').writeFileSync(require('path').join(L.RAIZ, 'medidas.json'), JSON.stringify(res, null, 1));
  await b.close();
})();
