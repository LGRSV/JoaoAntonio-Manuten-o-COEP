// Carregamento das fontes: com as fontes (woff2 do Google) demorando 1,5 s, mede o deslocamento de layout (CLS) e tira um print
// com a fonte reserva e outro com a fonte final. Uso: node fontes-cls.js antes|depois
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), fs = require('fs');
const { liga } = require('./rede.js');
const modo = process.argv[2] || 'antes';
const BASE = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/';
const over = {};
if (modo === 'depois') for (const f of ['site.css', 'mapa-municipios.js', 'busca-ativo.js', 'ranking-polos.js']) { const p = path.join(__dirname, 'proto', f); if (fs.existsSync(p)) over['/assets/' + f] = p; }
(async () => {
  const b = await chromium.launch();
  for (const [tn, vp] of [['desk', { width: 1440, height: 900 }], ['cel', { width: 390, height: 844 }]]) for (const pag of ['', 'polos/']) {
    const ctx = await b.newContext({ viewport: vp, isMobile: tn === 'cel', hasTouch: tn === 'cel' }); await liga(ctx, over, [], 1500);
    const p = await ctx.newPage();
    await p.addInitScript(() => { window.__cls = 0; window.__sh = []; new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) { window.__cls += e.value; window.__sh.push([Math.round(e.startTime), +e.value.toFixed(4)]); } })).observe({ type: 'layout-shift', buffered: true }); });
    await p.goto(BASE + pag, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(900);
    const id = (pag ? 'ranking' : 'home') + '-' + tn;
    await p.screenshot({ path: `prints/fonte-${modo}-${id}-reserva.jpg`, type: 'jpeg', quality: 80 });
    await p.waitForTimeout(2600);
    await p.screenshot({ path: `prints/fonte-${modo}-${id}-final.jpg`, type: 'jpeg', quality: 80 });
    const r = await p.evaluate(() => ({ cls: +window.__cls.toFixed(4), sh: window.__sh }));
    console.log(modo, id, 'CLS', r.cls, JSON.stringify(r.sh));
    await ctx.close();
  }
  await b.close();
})();
