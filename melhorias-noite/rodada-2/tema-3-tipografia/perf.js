// Custo do afastamento adaptativo + rótulos: CPU 4x mais lenta, 5 repetições por polo; mede (a) a parte síncrona ao abrir o polo
// (entraPolo: afastamento base + ajuste) e (b) as tarefas longas (>50 ms) da animação inteira. Uso: node perf.js
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), fs = require('fs');
const { liga } = require('./rede.js');
const BASE = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/';
(async () => {
  const b = await chromium.launch();
  for (const modo of ['antes', 'depois']) {
    const over = {}; if (modo === 'depois') for (const f of ['site.css', 'mapa-municipios.js', 'busca-ativo.js']) over['/assets/' + f] = path.join(__dirname, 'proto', f);
    for (const [tn, vp] of [['desk', { width: 1440, height: 900 }], ['cel', { width: 390, height: 844 }]]) {
      const ctx = await b.newContext({ viewport: vp, isMobile: tn === 'cel', hasTouch: tn === 'cel' }); await liga(ctx, over);
      const p = await ctx.newPage(); await p.goto(BASE, { waitUntil: 'load' }); await p.waitForTimeout(800);
      const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      const res = [];
      for (const polo of ['Augustinópolis', 'Paraíso', 'Palmas']) for (let i = 0; i < 3; i++) {
        const r = await p.evaluate(async polo => {
          window.__lt = []; const po = new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push(e.duration))); po.observe({ type: 'longtask', buffered: false });
          const t0 = performance.now(); window.ARGOS_MAPA.vai({ polo }); const sync = performance.now() - t0;
          await new Promise(r => setTimeout(r, 1800)); po.disconnect();
          return { sync, lt: window.__lt.length, ltMax: Math.max(0, ...window.__lt), ltSoma: window.__lt.reduce((a, c) => a + c, 0), nomes: document.querySelectorAll('.mt-nomes2 .mt-mn').length };
        }, polo);
        res.push({ polo, ...r }); await p.evaluate(() => window.ARGOS_MAPA.vai({})); await p.waitForTimeout(1300);
      }
      const med = k => { const v = res.map(r => r[k]).sort((a, b) => a - b); return +v[Math.floor(v.length / 2)].toFixed(1); };
      console.log(modo, tn, 'sync(ms, mediana)', med('sync'), '| tarefas longas por abertura', med('lt'), 'maior', med('ltMax'), 'soma', med('ltSoma'));
      await ctx.close();
    }
  }
  await b.close();
})();
