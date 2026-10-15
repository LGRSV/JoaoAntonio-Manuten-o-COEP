// Convivência com o painel: (1) com o zoom ligado, 1 clique num alimentador da lista do município abre o painel; (2) 1 clique na rede
// (sem arrastar) abre o painel; (3) arrastar a partir da rede NÃO abre; (4) no painel a lupa do ARGOS (.lp-lupa) continua montada.
const { lanca, abre } = require('./lib.js');
const esp = (p, ms) => p.waitForTimeout(ms);
const assenta = async p => { try { await p.waitForFunction(() => { const c = document.querySelector('.mt-mapa').classList; return !c.contains('mexe') && !c.contains('voando'); }, null, { timeout: 8000 }); } catch (e) {} await p.waitForTimeout(900); };
let ok = 0, ruim = 0; const T = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? ok++ : ruim++; };
(async () => {
  const b = await lanca();
  for (const view of ['desk', 'mob']) {
    for (const modo of ['lista', 'rede']) {
      const { ctx, page } = await abre(b, view, true, {});
      const tap = (s) => view === 'mob' ? page.tap(s) : page.click(s);
      await tap('.mt-regcards button[data-reg="Centro"]'); await esp(page, 1800); await assenta(page);
      await tap('.mt-barra .mt-pchip >> text=Palmas'); await esp(page, 1800); await assenta(page);
      // abre um município com alimentadores
      const pt = await page.evaluate(() => { let r = null; document.querySelectorAll('.mun.tem').forEach(p => { if (r) return; const s = p.ownerSVGElement, bb = p.getBBox(); for (let i = 1; i < 10 && !r; i++) for (let j = 1; j < 10 && !r; j++) { const q = s.createSVGPoint(); q.x = bb.x + bb.width * i / 10; q.y = bb.y + bb.height * j / 10; if (!p.isPointInFill(q)) continue; const w = q.matrixTransform(p.getScreenCTM()); if (document.elementFromPoint(w.x, w.y) === p) r = [w.x, w.y]; } }); return r; });
      if (view === 'mob') await page.touchscreen.tap(pt[0], pt[1]); else await page.mouse.click(pt[0], pt[1]);
      await esp(page, 2200); await assenta(page);
      // zoom ligado ANTES do clique (botão +)
      await page.evaluate(() => { const z = document.querySelector('.mt-zoom [data-z=mais]'); if (z) z.click(); }); await esp(page, 700);
      const zoomOn = await page.evaluate(() => !!(window.ARGOS_MAPA && ARGOS_MAPA.zoom && ARGOS_MAPA.zoom.ativo()));
      T(zoomOn, `${view}/${modo}: zoom ligado antes do clique`);
      if (modo === 'lista') {
        const n = await page.evaluate(() => document.querySelectorAll('.mt-al').length); T(n > 0, `${view}/lista: ${n} alimentadores na lista`);
        const al = await page.evaluate(() => document.querySelector('.mt-al').dataset.al);
        await Promise.all([page.waitForURL(u => u.pathname.includes('/alimentadores/'), { timeout: 15000 }).then(() => true).catch(() => false).then(v => T(v, `${view}/lista: clique em ${al} abre o painel`)), tap('.mt-al')]);
      } else {
        // rede: arrastar a partir da rede não abre; clique parado abre
        const p = await page.evaluate(() => { const e = [...document.querySelectorAll('.mt-mapa svg [data-al]')].find(x => x.getBoundingClientRect().width > 4); if (!e) return null; const L = e.getTotalLength ? e.getTotalLength() : 0; for (let k = 1; k < 20; k++) { const q = e.getPointAtLength(L * k / 20), w = q.matrixTransform(e.getScreenCTM()); if (document.elementFromPoint(w.x, w.y) === e) return [w.x, w.y, e.dataset.al]; } return null; });
        T(!!p, `${view}/rede: achou ponto clicável na rede`);
        if (p && view === 'desk') {
          await page.mouse.move(p[0], p[1]); await page.mouse.down(); await page.mouse.move(p[0] - 60, p[1] + 30, { steps: 8 }); await page.mouse.up(); await esp(page, 500);
          T(!page.url().includes('/alimentadores/'), `${view}/rede: arrastar a partir da rede NÃO abre o painel`);
          const p2 = await page.evaluate(() => { const e = [...document.querySelectorAll('.mt-mapa svg [data-al]')].find(x => x.getBoundingClientRect().width > 4); const L = e.getTotalLength(); for (let k = 1; k < 20; k++) { const q = e.getPointAtLength(L * k / 20), w = q.matrixTransform(e.getScreenCTM()); if (document.elementFromPoint(w.x, w.y) === e) return [w.x, w.y]; } return null; });
          await Promise.all([page.waitForURL(u => u.pathname.includes('/alimentadores/'), { timeout: 15000 }).then(() => true).catch(() => false).then(v => T(v, `${view}/rede: clique parado abre o painel`)), page.mouse.click(p2[0], p2[1])]);
        } else if (p) {
          await Promise.all([page.waitForURL(u => u.pathname.includes('/alimentadores/'), { timeout: 15000 }).then(() => true).catch(() => false).then(v => T(v, `${view}/rede: toque abre o painel`)), page.touchscreen.tap(p[0], p[1])]);
        }
      }
      if (page.url().includes('/alimentadores/')) {
        await page.waitForSelector('.lp-lupa', { timeout: 20000 }).then(() => T(true, `${view}/${modo}: lupa do painel (.lp-lupa) montada`)).catch(() => T(false, `${view}/${modo}: lupa do painel (.lp-lupa) NÃO montou`));
      }
      await ctx.close();
    }
  }
  await b.close(); console.log(`\n${ok} ok, ${ruim} falhas`); process.exit(ruim ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
