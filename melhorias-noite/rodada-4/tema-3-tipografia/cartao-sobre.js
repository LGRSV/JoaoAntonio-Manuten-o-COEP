// O cartão do alimentador em foco (.mt-ac) cobre a rede? Para o alimentador de mais km do município de maior NAE de cada polo,
// em 4 telas: sobreposição do retângulo do cartão com a caixa da rede (aprox.) e com os rastros reais (amostra de pontos do traçado). Uso: node cartao-sobre.js
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { liga, arquivosModo } = require('./rede.js');
const BASE = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/';
const TAMS = { desk: { width: 1440, height: 900 }, notebook: { width: 1280, height: 720 }, tablet: { width: 820, height: 1100 }, cel: { width: 390, height: 844 } };
(async () => {
  const b = await chromium.launch();
  for (const [tn, vp] of Object.entries(TAMS)) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: tn === 'cel', hasTouch: tn === 'cel' });
    await liga(ctx, arquivosModo('depois'));
    const p = await ctx.newPage();
    await p.goto(BASE, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
    const polos = await p.evaluate(() => [...new Set(window.MUN.muns.map(m => m.polo).filter(Boolean))]);
    const lin = [];
    for (const polo of polos) {
      const al = await p.evaluate(po => { const m = window.MUN.muns.filter(x => x.polo === po && x.als && x.als.length).sort((a, c) => (c.nae || 0) - (a.nae || 0))[0];
        return m ? { cod: m.cod, al: m.als.slice().sort((a, c) => c.m - a.m)[0].cod } : null; }, polo);
      await p.evaluate(a => window.ARGOS_MAPA.vai({ cod: a.cod }), al); await p.waitForTimeout(2300);
      await p.evaluate(a => window.ARGOS_MAPA.vai({ al: a.al }), al); await p.waitForTimeout(2000);
      const r = await p.evaluate(() => {
        const c = document.querySelector('.mt-ac'), pa = document.querySelector('.mt-redes-a path'); if (!c || c.hidden || !pa) return null;
        const a = c.getBoundingClientRect(), L = pa.getTotalLength(), m = pa.getScreenCTM(); let n = 0, sob = 0;
        for (let i = 0; i <= 3000; i++) { const q = pa.getPointAtLength(L * i / 3000), x = q.x * m.a + m.e, y = q.y * m.d + m.f; n++;
          if (x > a.left && x < a.right && y > a.top && y < a.bottom) sob++; }
        const R = pa.getBoundingClientRect();
        return { pontosSob: sob, de: n, caixaSobre: a.left < R.right && a.right > R.left && a.top < R.bottom && a.bottom > R.top };
      });
      lin.push(r ? `${polo.slice(0, 6)}:${r.pontosSob}${r.caixaSobre ? '*' : ''}` : `${polo.slice(0, 6)}:sem`);
      await p.evaluate(() => window.ARGOS_MAPA.vai({})); await p.waitForTimeout(1300);
    }
    console.log(tn, '(pontos do traçado sob o cartão de 3001; * = caixa da rede encosta no cartão)', lin.join(' '));
    await ctx.close();
  }
  await b.close();
})();
