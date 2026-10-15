// Menu ☰, diálogo de dados, Shift+K e tela cheia do alimentador: Esc, foco, rolagem. Uso: node travas-menu.js
const L = require('./lib.js'), fs = require('fs');
const esp = async (p, c, ms = 4000) => { try { await p.waitForFunction(c, null, { timeout: ms, polling: 30 }); return true; } catch (e) { return false; } };
(async () => {
  const R = {};
  for (const [vp, cfg] of Object.entries({ desktop: { w: 1440, h: 900 }, celular: { w: 390, h: 844, mobile: true } })) {
    const s = await L.abre(cfg); const p = s.page; const T = R[vp] = {};
    await p.goto(L.BASE, { waitUntil: 'load' }); await esp(p, `document.querySelectorAll('.mun').length>100`); await p.waitForTimeout(600);
    const foco = () => p.evaluate(() => { const a = document.activeElement; return a ? (a.tagName + '.' + (a.className && a.className.baseVal === undefined ? a.className : '')).slice(0, 40) : null; });
    await p.click('.mnu-btn'); await p.waitForTimeout(200);
    T.menuAberto = await p.evaluate(() => !document.querySelector('.mnu-lista').hidden);
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    T.menuEscFechou = await p.evaluate(() => document.querySelector('.mnu-lista').hidden); T.focoAposEsc = await foco();
    await p.click('.mnu-btn'); await p.click('.mnu-lista button[aria-haspopup="dialog"]'); await p.waitForTimeout(300);
    T.dialogoAberto = await p.evaluate(() => document.querySelector('dialog').open);
    const dentro = []; for (let i = 0; i < 14; i++) { await p.keyboard.press('Tab'); dentro.push(await p.evaluate(() => !!document.activeElement.closest('dialog'))); }
    T.tabFicaNoDialogo = dentro.every(Boolean);
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    T.dialogoFechouComEsc = await p.evaluate(() => !document.querySelector('dialog').open); T.focoAposDialogo = await foco();
    const y0 = await p.evaluate(() => scrollY); await p.mouse.wheel(0, 300); await p.waitForTimeout(300); T.rolaDepoisDoDialogo = (await p.evaluate(() => scrollY)) > y0;
    const t0 = await p.evaluate(() => document.documentElement.dataset.theme); await p.keyboard.press('Shift+K'); await p.waitForTimeout(150); const t1 = await p.evaluate(() => document.documentElement.dataset.theme);
    T.shiftK = t0 + ' → ' + t1; await p.keyboard.press('Shift+K');
    await p.click('#lupa'); await p.keyboard.type('K'); await p.waitForTimeout(100); T.shiftKnaBuscaNaoTroca = (await p.evaluate(() => document.documentElement.dataset.theme)) === t0; await p.keyboard.press('Shift+K');
    await s.browser.close();
    // alimentador: tela cheia
    const s2 = await L.abre(cfg); const q = s2.page;
    await q.goto(L.BASE + 'alimentadores/LD01072001/', { waitUntil: 'load' }); await q.waitForTimeout(2500);
    const bt = await q.$('.tc-btn'); T.alim_botaoTelaCheia = !!bt;
    if (bt) { await bt.click(); await q.waitForTimeout(500); T.alim_entrou = await q.evaluate(() => document.body.classList.contains('tela-cheia'));
      await q.keyboard.press('Escape'); await q.waitForTimeout(500); T.alim_saiuComEsc = await q.evaluate(() => !document.body.classList.contains('tela-cheia'));
      T.alim_bodyOverflow = await q.evaluate(() => getComputedStyle(document.body).overflow);
      const y = await q.evaluate(() => scrollY); await q.mouse.wheel(0, 400); await q.waitForTimeout(300); T.alim_rolaDepois = (await q.evaluate(() => scrollY)) > y || !(await q.evaluate(() => document.documentElement.scrollHeight > innerHeight + 5)); }
    T.alim_erros = s2.log.erros; await s2.browser.close();
    console.log(vp, JSON.stringify(T, null, 1));
  }
  fs.writeFileSync('medicoes/travas-menu.json', JSON.stringify(R, null, 1));
})();
