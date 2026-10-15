const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { liga, arquivosModo } = require('./rede.js');
const modo = process.argv[2] || 'depois', polo = process.argv[3] || 'Guaraí';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await liga(ctx, arquivosModo(modo));
  const p = await ctx.newPage();
  await p.goto('https://lgrsv.github.io/vera-vegeta-o-back/teste/', { waitUntil: 'load' }); await p.waitForTimeout(800);
  await p.evaluate(() => { window.__t = []; const n = document.querySelector('.mt-nomes2'); new MutationObserver(() => window.__t.push(Math.round(performance.now()))).observe(n, { childList: true }); window.__t0 = performance.now(); });
  await p.evaluate(po => window.ARGOS_MAPA.vai({ polo: po }), polo);
  await p.waitForTimeout(4000);
  console.log(modo, polo, 'mutações no nomes2 (ms desde o início):', JSON.stringify(await p.evaluate(() => window.__t.map(x => Math.round(x - window.__t0)))));
  console.log('opacidade dos municípios:', await p.evaluate(() => [...new Set([...document.querySelectorAll('.mun')].map(e => getComputedStyle(e).opacity))].join(',')));
  await p.screenshot({ path: '/tmp/claude-0/diag.jpg', type: 'jpeg', quality: 70 });
  await b.close();
})();
