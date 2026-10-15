// Convivência do cartão do alimentador em foco com o "1 clique abre o painel" da base atual. Uso: node convive.js antes|depois
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { liga, arquivosModo } = require('./rede.js');
const modo = process.argv[2] || 'depois';
const BASE = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/';
const TAMS = { desk: { width: 1440, height: 900 }, cel: { width: 390, height: 844 } };
(async () => {
  const b = await chromium.launch();
  for (const [tn, vp] of Object.entries(TAMS)) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: tn === 'cel', hasTouch: tn === 'cel' });
    await liga(ctx, arquivosModo(modo));
    const p = await ctx.newPage(), erros = [];
    p.on('pageerror', e => erros.push(e.message));
    const res = {};
    const prepara = async () => {
      await p.goto(BASE, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
      return p.evaluate(() => { const m = window.MUN.muns.find(x => x.nome === 'Araguaína' && x.polo === 'Araguaína'); return { cod: m.cod, als: m.als.slice().sort((a, c) => c.m - a.m).map(a => a.cod) }; });
    };
    let m = await prepara();
    // A: município aberto, 1 clique na rede abre o painel
    await p.evaluate(c => window.ARGOS_MAPA.vai({ cod: c }), m.cod); await p.waitForTimeout(2400);
    const r1 = await p.evaluate(() => { const e = document.querySelector('.mt-redes path[data-al]'); const q = e.getBoundingClientRect(); return { al: e.dataset.al }; });
    await p.evaluate(a => { document.querySelector(`.mt-redes path[data-al="${a}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })); }, r1.al);
    await p.waitForTimeout(1500); res.A_rede_abre_painel = p.url().includes('/alimentadores/' + r1.al);
    // B: foco (busca) mostra o cartão; 1 clique na rede em foco abre o painel
    m = await prepara();
    await p.evaluate(c => window.ARGOS_MAPA.vai({ cod: c }), m.cod); await p.waitForTimeout(2200);
    await p.evaluate(a => window.ARGOS_MAPA.vai({ al: a }), m.als[0]); await p.waitForTimeout(2200);
    res.B_cartao_visivel = await p.evaluate(() => { const c = document.querySelector('.mt-ac'); return !!c && !c.hidden && c.getBoundingClientRect().height > 0; });
    res.B_cartao_texto = await p.evaluate(() => (document.querySelector('.mt-ac') || {}).innerText);
    res.B_dica = await p.evaluate(() => { const e = document.querySelector('.mt-redes-a path'); const q = e.getBoundingClientRect(); return null; });
    // sobreposição do cartão com seta, tela cheia, resultados da busca e com as formas de município em foco
    res.B_sobre = await p.evaluate(() => {
      const c = document.querySelector('.mt-ac'); if (!c || c.hidden) return 'sem cartão'; const a = c.getBoundingClientRect(); const out = [];
      for (const s of ['.mt-volta', '.mt-tc', '#ativo-res', '.mt-leg', '#ativo-q']) { const e = document.querySelector(s); if (!e || !e.offsetParent) continue; const q = e.getBoundingClientRect();
        if (a.left < q.right && a.right > q.left && a.top < q.bottom && a.bottom > q.top) out.push(s); }
      const R = document.querySelector('.mt-mapa').getBoundingClientRect();
      return { sobre: out, dentroDaTela: a.left >= 0 && a.right <= innerWidth && a.bottom <= innerHeight, cartao: [a.left, a.top, a.right, a.bottom].map(Math.round), mapa: [R.left, R.top, R.right, R.bottom].map(Math.round) };
    });
    // troca de alimentador em foco atualiza o cartão
    if (m.als[1]) { await p.evaluate(a => window.ARGOS_MAPA.vai({ al: a }), m.als[1]); await p.waitForTimeout(1800);
      res.B_troca_atualiza = await p.evaluate(a => (document.querySelector('.mt-ac b') || {}).textContent === a, m.als[1]); }
    await p.evaluate(a => window.ARGOS_MAPA.vai({ al: a }), m.als[0]); await p.waitForTimeout(1800);
    // C: clicar no cartão abre o painel (mesma aba no site)
    const href = await p.evaluate(() => document.querySelector('.mt-ac') && document.querySelector('.mt-ac').getAttribute('href'));
    res.C_href = href;
    await p.evaluate(() => document.querySelector('.mt-ac').click()); await p.waitForTimeout(1500);
    res.C_cartao_abre_painel = p.url().includes('/alimentadores/' + m.als[0]);
    // D: seta voltar sai do foco e esconde o cartão
    m = await prepara();
    await p.evaluate(c => window.ARGOS_MAPA.vai({ cod: c }), m.cod); await p.waitForTimeout(2200);
    await p.evaluate(a => window.ARGOS_MAPA.vai({ al: a }), m.als[0]); await p.waitForTimeout(2200);
    await p.click('.mt-volta'); await p.waitForTimeout(1500);
    res.D_volta_esconde = await p.evaluate(() => { const c = document.querySelector('.mt-ac'); return !c || c.hidden || c.getBoundingClientRect().height === 0; });
    res.D_nivel = await p.evaluate(() => JSON.stringify(window.ARGOS_MAPA.nivel()));
    // E: dica do mouse na rede (computador)
    if (tn === 'desk') {
      await p.evaluate(c => window.ARGOS_MAPA.vai({ cod: c }), m.cod); await p.waitForTimeout(1500);
      const pt = await p.evaluate(() => { const e = document.querySelector('.mt-redes path[data-al]'); const L = e.getTotalLength(); const q = e.getPointAtLength(L / 2), mt = e.getScreenCTM(); return { x: q.x * mt.a + mt.e, y: q.y * mt.d + mt.f }; });
      await p.mouse.move(pt.x, pt.y); await p.waitForTimeout(400);
      res.E_dica = await p.evaluate(() => { const d = document.querySelector('.mt-dica'); return d && d.style.display !== 'none' ? d.innerText.replace(/\n/g, ' | ') : null; });
    }
    console.log(modo, tn, JSON.stringify(res, null, 1), 'erros:', erros.length ? erros : 0);
    await ctx.close();
  }
  await b.close();
})();
