// Confere o patch de scripts/gera_trechos.py: injeta no HTML do ranking a mesma marca que o gerador passaria a escrever (o JS então não cria a sua)
// e tira o print; compare com prints/depois-ranking-*.jpg (feito com a marca criada por JS). Uso: node ranking-html.js
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { liga, arquivosModo } = require('./rede.js');
const BASE = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/polos/';
const marca = '<a class="cab-marca" href="../" aria-label="ARGOS Manutenção, página inicial"><b>ARGOS</b><span>MANUTENÇÃO</span></a>\n';
(async () => {
  const b = await chromium.launch();
  for (const [tn, vp] of [['desk', { width: 1440, height: 900 }], ['cel', { width: 390, height: 844 }]]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: tn === 'cel', hasTouch: tn === 'cel' });
    await ctx.addInitScript(() => { try { localStorage.setItem('tema', 'escuro'); } catch (e) {} });
    await liga(ctx, arquivosModo('depois'), [['<nav class="migalhas"', marca + '<nav class="migalhas"']]);
    const p = await ctx.newPage(); await p.goto(BASE, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1000);
    await p.mouse.move(vp.width - 5, 5);
    console.log(tn, 'marcas no DOM:', await p.evaluate(() => document.querySelectorAll('.cab-marca').length));
    await p.screenshot({ path: `prints/ranking-html-${tn}.jpg`, type: 'jpeg', quality: 80 });
    await ctx.close();
  }
  await b.close();
})();
