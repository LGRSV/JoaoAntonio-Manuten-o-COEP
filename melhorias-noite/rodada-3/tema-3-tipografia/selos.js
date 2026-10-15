// Compara o selo da NAE: Mono 700 (hoje, "negrito sintético" do 600), Mono 600 verdadeiro e Mono 700 verdadeiro (link do Google Fonts com 700).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { liga } = require('./rede.js');
const BASE = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/';
(async () => {
  const b = await chromium.launch();
  for (const [nome, trocas, css] of [['sintetico700', [], ''], ['verdadeiro600', [], '.mt-mn i,.mt-regcards i,.mt-pchip i,.mt-ac i,.so-n,.pl-nae{font-weight:600!important}'],
    ['verdadeiro700', [['IBM+Plex+Mono:wght@400;600', 'IBM+Plex+Mono:wght@400;600;700']], '']]) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 }); await liga(ctx, {}, trocas);
    const p = await ctx.newPage(); await p.goto(BASE, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    if (css) await p.addStyleTag({ content: css });
    await p.evaluate(() => window.ARGOS_MAPA.vai({ polo: 'Palmas' })); await p.waitForTimeout(2200); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
    const r = await p.evaluate(() => { const t = [...document.querySelectorAll('.mt-mn')].find(x => /Palmas/.test(x.textContent)).getBoundingClientRect(); return { x: t.left - 6, y: t.top - 6, width: t.width + 12, height: t.height + 12 }; });
    await p.screenshot({ path: `prints/selo-${nome}.png`, clip: r });
    console.log(nome, JSON.stringify(r), await p.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded' && /Mono/.test(f.family)).map(f => f.weight).join('/')));
    await ctx.close();
  }
  await b.close();
})();
