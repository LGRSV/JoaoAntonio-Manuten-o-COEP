// Tela cheia no celular com o polo aberto. Uso: [PROTO_DIR=...] node cheia.js antes|depois  -> prints/cheia-<modo>-<polo>-cel.jpg
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { liga, arquivosModo } = require('./rede.js');
const modo = process.argv[2] || 'depois', tag = process.argv[3] || modo;
(async () => {
  const b = await chromium.launch();
  for (const polo of ['Guaraí', 'Porto Nacional']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => { try { localStorage.setItem('tema', 'escuro'); } catch (e) {} });
    await liga(ctx, arquivosModo(modo));
    const p = await ctx.newPage(); await p.goto('https://lgrsv.github.io/vera-vegeta-o-back/teste/', { waitUntil: 'load' }); await p.waitForTimeout(800);
    await p.evaluate(po => window.ARGOS_MAPA.vai({ polo: po }), polo); await p.waitForTimeout(2200);
    await p.evaluate(() => { const tc = document.querySelector('.mt-tc'); tc.click(); }); await p.waitForTimeout(2200);
    const m = await p.evaluate(() => { const s = document.querySelector('.mt-mapa svg').getBoundingClientRect(), c = document.querySelector('.mt-mapa').getBoundingClientRect(); return { svgH: Math.round(s.height), caixaH: Math.round(c.height), nomes: document.querySelectorAll('.mt-nomes2 .mt-mn').length, soNum: [...document.querySelectorAll('.mt-nomes2 .mt-mn')].filter(t => t.dataset.nv === '2').length }; });
    console.log(tag, polo, JSON.stringify(m));
    await p.screenshot({ path: `prints/cheia-${tag}-${polo.split(' ')[0].toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')}-cel.jpg`, type: 'jpeg', quality: 80 });
    await ctx.close();
  }
  await b.close();
})();
