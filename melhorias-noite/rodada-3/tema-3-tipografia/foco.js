// Corte da rede com o alimentador em foco: razão largura do SVG / largura da caixa do mapa (1,00 = sem corte; menor = SVG encolhido, rede cortada
// numa borda reta). 8 polos (o alimentador com mais km do município de maior NAE de cada polo). Uso: node foco.js antes|depois
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const { liga, arquivosModo } = require('./rede.js');
const modo = process.argv[2] || 'antes';
const BASE = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/';
const over = arquivosModo(modo);
const TAMS = { desk: { width: 1440, height: 900 }, notebook: { width: 1280, height: 720 }, tablet: { width: 820, height: 1100 }, cel: { width: 390, height: 844 } };
(async () => {
  const b = await chromium.launch(), out = [];
  for (const [tn, vp] of Object.entries(TAMS)) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: tn === 'cel', hasTouch: tn === 'cel' });
    await liga(ctx, over);
    const p = await ctx.newPage();
    await p.goto(BASE, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
    const polos = await p.evaluate(() => [...new Set(window.MUN.muns.map(m => m.polo).filter(Boolean))]);
    const rs = [];
    for (const polo of polos) {
      const al = await p.evaluate(po => { const m = window.MUN.muns.filter(x => x.polo === po && x.als && x.als.length).sort((a, c) => (c.nae || 0) - (a.nae || 0))[0];
        return m ? { cod: m.cod, al: m.als.slice().sort((a, c) => c.m - a.m)[0].cod } : null; }, polo);
      if (!al) continue;
      await p.evaluate(a => window.ARGOS_MAPA.vai({ cod: a.cod }), al); await p.waitForTimeout(2400);
      await p.evaluate(a => window.ARGOS_MAPA.vai({ al: a.al }), al); await p.waitForTimeout(2000);
      const r = await p.evaluate(() => { const c = document.querySelector('.mt-mapa'), s = c.querySelector('svg'); return { w: s.getBoundingClientRect().width / c.clientWidth }; });
      rs.push({ polo, razao: +r.w.toFixed(2) });
      await p.evaluate(() => window.ARGOS_MAPA.vai({})); await p.waitForTimeout(1500);
    }
    const cortados = rs.filter(r => r.razao < .98).length;
    console.log(modo, tn, 'razão SVG/caixa por polo:', rs.map(r => r.razao).join(' '), '| cortados:', cortados, 'de', rs.length);
    out.push({ tela: tn, cortados, de: rs.length, polos: rs });
    await ctx.close();
  }
  fs.writeFileSync(`foco-${modo}.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
