// tempo de cada chamada de poeNomes (cópia instrumentada em PROTO_DIR) por polo, celular e computador
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { liga, arquivosModo } = require('./rede.js');
(async () => {
  const b = await chromium.launch();
  for (const [tn, vp] of [['cel', { width: 390, height: 844 }], ['desk', { width: 1440, height: 900 }]]) {
    const ctx = await b.newContext({ viewport: vp, isMobile: tn === 'cel', hasTouch: tn === 'cel' }); await liga(ctx, arquivosModo('depois'));
    const p = await ctx.newPage(); await p.goto('https://lgrsv.github.io/vera-vegeta-o-back/teste/', { waitUntil: 'load' }); await p.waitForTimeout(800);
    for (const polo of ['Augustinópolis', 'Guaraí', 'Araguaína', 'Paraíso', 'Palmas']) {
      await p.evaluate(() => { window.__pn = []; });
      await p.evaluate(po => window.ARGOS_MAPA.vai({ polo: po }), polo); await p.waitForTimeout(2500);
      console.log(tn, polo.padEnd(15), 'chamadas (ms):', JSON.stringify(await p.evaluate(() => window.__pn)));
      await p.evaluate(() => window.ARGOS_MAPA.vai({})); await p.waitForTimeout(1200);
    }
    await ctx.close();
  }
  await b.close();
})();
