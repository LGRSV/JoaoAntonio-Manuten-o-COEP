// Percorre o Tab em cada nível e registra onde o foco para, se o elemento está visível e se o foco tem contorno visível
const L = require('./lib.js'), fs = require('fs'), inj = require('./injeta.js');
const rotulo = process.argv[2] || 'antes';
const espera = async (page, cond, ms = 6000) => { try { await page.waitForFunction(cond, null, { timeout: ms, polling: 30 }); } catch (e) {} };
const FIM = `!document.querySelector('.mt-mapa').classList.contains('voando')`;
const info = page => page.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return { n: 'BODY' }; const r = a.getBoundingClientRect(), cs = getComputedStyle(a);
  let op = 1; for (let n = a; n && n.nodeType === 1; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity);
  const contorno = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0, sombra = cs.boxShadow !== 'none', traco = a instanceof SVGElement && cs.stroke !== 'none';
  return { n: a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') + (typeof a.className === 'string' && a.className ? '.' + a.className.split(' ')[0] : '') + ' "' + (a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 24) + '"', invisivel: op < 0.05, foraDaTela: r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth, contorno, sombra, traco }; });
(async () => {
  const R = {};
  for (const [vp, cfg] of Object.entries({ desktop: { w: 1440, h: 900 }, celular: { w: 390, h: 844, mobile: true } })) {
    const s = await L.abre(cfg); await inj.aplica(s.ctx, s.page); const p = s.page;
    await p.goto(L.BASE, { waitUntil: 'load' }); await espera(p, `document.querySelectorAll('.mun').length>100`); await p.waitForTimeout(400);
    for (const [nivel, ir] of [['estado', async () => {}], ['regional', async () => { await p.click('.mt-regcards button[data-reg="Centro"]'); await espera(p, FIM); await p.waitForTimeout(500); }], ['polo', async () => { await (await p.$('.mt-pchip[data-polo]')).click(); await espera(p, FIM); await p.waitForTimeout(500); }]]) {
      await ir(); await p.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
      await p.evaluate(() => { const e = document.createElement('i'); e.id = '__ini'; e.tabIndex = 0; document.body.prepend(e); e.focus(); e.remove(); });
      const paradas = []; for (let i = 0; i < 16; i++) { await p.keyboard.press('Tab'); paradas.push(await info(p)); }
      R[`${vp}|${nivel}`] = paradas;
      console.log(vp, nivel); paradas.forEach((x, i) => console.log('  ', i + 1, x.n, x.invisivel ? 'INVISIVEL' : '', x.foraDaTela ? 'fora da tela' : '', (x.contorno || x.sombra || x.traco) ? '' : 'sem-indicador'));
    }
    await s.browser.close();
  }
  fs.writeFileSync(`medicoes/tab-${rotulo}.json`, JSON.stringify(R, null, 1));
})();
