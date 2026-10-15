// Custo do afastamento adaptativo + rótulos: CPU 4x mais lenta; abre 3 polos (os mais densos), 4 vezes cada, ALTERNANDO antes/depois a cada
// abertura (a carga da máquina varia ao longo do tempo; alternar divide o ruído entre os dois). Mede (a) a parte síncrona ao abrir o polo
// (entraPolo: afastamento base + ajuste) e (b) as tarefas longas (>50 ms) da animação inteira, incluindo o poeNomes do fim.
// Uso: node perf.js
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { liga, arquivosModo } = require('./rede.js');
const BASE = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/';
(async () => {
  const b = await chromium.launch();
  for (const [tn, vp] of [['desk', { width: 1440, height: 900 }], ['cel', { width: 390, height: 844 }]]) {
    const pg = {};
    for (const modo of ['antes', 'depois']) {
      const ctx = await b.newContext({ viewport: vp, isMobile: tn === 'cel', hasTouch: tn === 'cel' }); await liga(ctx, arquivosModo(modo));
      const p = await ctx.newPage(); await p.goto(BASE, { waitUntil: 'load' }); await p.waitForTimeout(800);
      const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      pg[modo] = p;
    }
    const res = { antes: [], depois: [] };
    for (let i = 0; i < 4; i++) for (const polo of ['Augustinópolis', 'Paraíso', 'Guaraí']) for (const modo of ['antes', 'depois']) {
      const p = pg[modo];
      const r = await p.evaluate(async polo => {
        window.__lt = []; const po = new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push(e.duration))); po.observe({ type: 'longtask', buffered: false });
        const t0 = performance.now(); window.ARGOS_MAPA.vai({ polo }); const sync = performance.now() - t0;
        await new Promise(r => setTimeout(r, 2200)); po.disconnect();
        return { sync, lt: window.__lt.length, ltMax: Math.max(0, ...window.__lt), ltSoma: window.__lt.reduce((a, c) => a + c, 0), nomes: document.querySelectorAll('.mt-nomes2 .mt-mn').length };
      }, polo);
      res[modo].push(r); await p.evaluate(() => window.ARGOS_MAPA.vai({})); await p.waitForTimeout(1300);
    }
    const med = (modo, k) => { const v = res[modo].map(r => r[k]).sort((a, c) => a - c); return +v[Math.floor(v.length / 2)].toFixed(1); };
    for (const modo of ['antes', 'depois'])
      console.log(modo.padEnd(6), tn, 'sync(ms, mediana)', med(modo, 'sync'), '| tarefas longas por abertura', med(modo, 'lt'), '| maior', med(modo, 'ltMax'), '| soma', med(modo, 'ltSoma'), '| n=' + res[modo].length);
    for (const p of Object.values(pg)) await p.context().close();
  }
  await b.close();
})();
