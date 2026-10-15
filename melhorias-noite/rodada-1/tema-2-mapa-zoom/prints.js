// Gera todos os prints do README (JPEG 80%, 1440x900 e 390x844, tema escuro; claro onde faz diferença).
// Uso: node prints.js [s1 s2 s3 s4 s5]   (sem argumento roda tudo). O "antes" usa o site ao vivo; o "depois" injeta proto/*.
const { lanca, abre, shot } = require('./lib.js');
const quais = process.argv.slice(2);
const roda = n => !quais.length || quais.includes(n);
const esp = (p, ms) => p.waitForTimeout(ms);
const EXTRA_ZOOM = { calmo: false };

// Ctrl + roda do mouse simulado: tecla Control pressionada + page.mouse.wheel (n "cliques" de dy)
async function ctrlRoda(page, n, dy, x, y) {
  await page.mouse.move(x, y);
  await page.keyboard.down('Control');
  for (let i = 0; i < n; i++) { await page.mouse.wheel(0, dy); await esp(page, 50); }
  await page.keyboard.up('Control');
  await page.mouse.move(1420, 500);          // tira o mouse de cima do mapa (senão o destaque de hover da regional escurece o resto)
  await esp(page, 1500);
}
const pinca = async (cdp, cx, cy, d0, d1, passos = 12) => {            // dois dedos de d0 a d1 px de distância, centro (cx,cy)
  const pts = d => [[cx - d / 2, cy], [cx + d / 2, cy]];
  const t = (type, d) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : pts(d).map((p, i) => ({ x: p[0], y: p[1], id: i + 1 })) });
  await t('touchStart', d0);
  for (let i = 1; i <= passos; i++) { await t('touchMove', d0 + (d1 - d0) * i / passos); await new Promise(r => setTimeout(r, 20)); }
  await t('touchEnd', d1);
};
const codDe = (page, nome) => page.evaluate(n => window.MUN.muns.find(m => m.nome === n).cod, nome);

(async () => {
  const b = await lanca();

  // ============== Sugestão 1 — zoom livre ==============
  if (roda('s1')) {
    // ANTES (site atual): Ctrl + roda não faz nada no mapa; o mesmo no celular com a pinça
    let { ctx, page } = await abre(b, 'desk', false);
    await ctrlRoda(page, 5, -120, 720, 560);
    await shot(page, 's1-antes-desk');
    console.log('antes desk: viewBox', await page.evaluate(() => document.querySelector('.mt-mapa svg').getAttribute('viewBox')));
    await ctx.close();
    ({ ctx, page } = await abre(b, 'mob', false));
    let cdp = await ctx.newCDPSession(page);
    const r = await page.evaluate(() => { const q = document.querySelector('.mt-mapa svg').getBoundingClientRect(); return [q.left, q.top, q.width, q.height]; });
    await pinca(cdp, 195, r[1] + 330, 60, 200);
    await esp(page, 600);
    await shot(page, 's1-antes-mob');
    console.log('antes mob: viewBox', await page.evaluate(() => document.querySelector('.mt-mapa svg').getAttribute('viewBox') + ' · escala visual ' + visualViewport.scale));
    await ctx.close();

    // DEPOIS desktop: sequência
    ({ ctx, page } = await abre(b, 'desk', true, EXTRA_ZOOM));
    await page.mouse.move(720, 560); await page.mouse.wheel(0, 120); await esp(page, 250);        // rolar sem Ctrl: página rola e a dica aparece
    await page.evaluate(() => scrollTo(0, 0)); await esp(page, 150);
    await shot(page, 's1-depois-desk-1-dica');
    await esp(page, 1800);
    await ctrlRoda(page, 3, -120, 720, 560);
    await shot(page, 's1-depois-desk-2-zoom2');
    await ctrlRoda(page, 3, -120, 740, 540);
    await shot(page, 's1-depois-desk-3-zoom5');
    await page.mouse.move(720, 560); await page.mouse.down(); await page.mouse.move(520, 470, { steps: 10 }); await page.mouse.up(); await esp(page, 1300);
    await shot(page, 's1-depois-desk-4-arrastar');
    // clicar num município depois do zoom: abre a regional dele
    const alvo = await page.evaluate(() => { const ms = [...document.querySelectorAll('.mun.tem')].map(p => { const q = p.getBoundingClientRect(), w = Math.min(q.right, 1100) - Math.max(q.left, 300), h = Math.min(q.bottom, 850) - Math.max(q.top, 320); return { p, a: Math.max(0, w) * Math.max(0, h) }; }).sort((a, c) => c.a - a.a); const p = ms[0].p, s = p.ownerSVGElement, bb = p.getBBox(); for (let i = 1; i < 12; i++) for (let j = 1; j < 12; j++) { const pt = s.createSVGPoint(); pt.x = bb.x + bb.width * i / 12; pt.y = bb.y + bb.height * j / 12; if (!p.isPointInFill(pt)) continue; const q = pt.matrixTransform(p.getScreenCTM()); if (document.elementFromPoint(q.x, q.y) === p && q.x > 320 && q.x < 1080 && q.y > 330 && q.y < 840) return [q.x, q.y, p.getAttribute('aria-label')]; } });
    console.log('clique em', alvo[2]);
    await page.mouse.click(alvo[0], alvo[1]); await esp(page, 1800);
    await shot(page, 's1-depois-desk-5-clique-regional');
    await ctrlRoda(page, 3, -120, 720, 560);
    await shot(page, 's1-depois-desk-6-zoom-na-regional');
    await page.keyboard.press('Escape'); await esp(page, 1300);
    await shot(page, 's1-depois-desk-7-esc-enquadra');
    await ctx.close();
    // claro
    ({ ctx, page } = await abre(b, 'desk', true, { ...EXTRA_ZOOM, claro: true }));
    await ctrlRoda(page, 6, -120, 730, 520);
    await shot(page, 's1-depois-desk-claro');
    await ctx.close();

    // DEPOIS celular: pinça
    ({ ctx, page } = await abre(b, 'mob', true, EXTRA_ZOOM));
    cdp = await ctx.newCDPSession(page);
    const r2 = await page.evaluate(() => { const q = document.querySelector('.mt-mapa svg').getBoundingClientRect(); return [q.left, q.top, q.width, q.height]; });
    const my = r2[1] + r2[3] * .55;
    await shot(page, 's1-depois-mob-1-estado');
    await pinca(cdp, 195, my, 60, 130, 6);          // pinça aberta pela metade (o dedo ainda está na tela se o print for no meio; aqui termina)
    await esp(page, 1200);
    await shot(page, 's1-depois-mob-2-pinca');
    await pinca(cdp, 195, my, 80, 210);
    await esp(page, 1500);
    await shot(page, 's1-depois-mob-3-pinca-mais');
    const t = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ x: p[0], y: p[1], id: i + 1 })) });
    await t('touchStart', [[280, my]]);
    for (let i = 1; i <= 10; i++) { await t('touchMove', [[280 - i * 18, my + i * 10]]); await esp(page, 16); }
    await t('touchEnd', []); await esp(page, 1300);
    await shot(page, 's1-depois-mob-4-arrastar');
    const pt = await page.evaluate(() => { const ms = [...document.querySelectorAll('.mun.tem')].map(p => { const q = p.getBoundingClientRect(), w = Math.min(q.right, 380) - Math.max(q.left, 10), h = Math.min(q.bottom, 800) - Math.max(q.top, 260); return { p, a: Math.max(0, w) * Math.max(0, h) }; }).sort((a, c) => c.a - a.a); const p = ms[0].p, s = p.ownerSVGElement, bb = p.getBBox(); for (let i = 1; i < 14; i++) for (let j = 1; j < 14; j++) { const pt = s.createSVGPoint(); pt.x = bb.x + bb.width * i / 14; pt.y = bb.y + bb.height * j / 14; if (!p.isPointInFill(pt)) continue; const q = pt.matrixTransform(p.getScreenCTM()); if (document.elementFromPoint(q.x, q.y) === p && q.x > 20 && q.x < 370 && q.y > 270 && q.y < 800) return [q.x, q.y]; } });
    await page.touchscreen.tap(pt[0], pt[1]); await esp(page, 1800);
    await shot(page, 's1-depois-mob-5-toque-regional');
    await ctx.close();
  }

  // ============== Sugestão 2 — zoom semântico: nomes + NAE e prévia das redes ==============
  if (roda('s2')) {
    let { ctx, page } = await abre(b, 'desk', false);                // antes: para ver nome e NAE de um município só passando o mouse
    const p = await page.evaluate(() => { const m = window.MUN.muns.find(x => x.nome === 'Araguaína'), el = document.querySelector(`.mun[data-cod="${m.cod}"]`), s = el.ownerSVGElement, pt = s.createSVGPoint(); [pt.x, pt.y] = m.c; const q = pt.matrixTransform(s.getScreenCTM()); return [q.x, q.y]; });
    await page.mouse.move(p[0], p[1]); await esp(page, 300);
    await shot(page, 's2-antes-desk');
    await ctx.close();
    ({ ctx, page } = await abre(b, 'mob', false));
    await shot(page, 's2-antes-mob');
    await ctx.close();

    ({ ctx, page } = await abre(b, 'desk', true, EXTRA_ZOOM));
    const palmas = await codDe(page, 'Palmas');
    await ctrlRoda(page, 2, -120, 720, 700);
    await shot(page, 's2-depois-desk-1-zoom1_7');
    await ctrlRoda(page, 3, -120, 720, 700);
    await shot(page, 's2-depois-desk-2-nomes-e-nae');
    await page.evaluate(() => scrollTo(0, 0));
    await page.click('.mt-zoom [data-z=fit]'); await esp(page, 1200);
    await page.evaluate(c => window.ARGOSMapa.voaPara(c, .5), palmas); await esp(page, 2600);
    await shot(page, 's2-depois-desk-3-previa-palmas');
    await ctx.close();
    ({ ctx, page } = await abre(b, 'desk', true, { ...EXTRA_ZOOM, claro: true }));
    await page.evaluate(c => window.ARGOSMapa.voaPara(c, .5), await codDe(page, 'Palmas')); await esp(page, 2600);
    await shot(page, 's2-depois-desk-4-previa-palmas-claro');
    await ctx.close();
    ({ ctx, page } = await abre(b, 'mob', true, EXTRA_ZOOM));
    const cod = await codDe(page, 'Palmas');
    await page.evaluate(c => window.ARGOSMapa.voaPara(c, .8), cod); await esp(page, 1500);
    await shot(page, 's2-depois-mob-1-nomes-e-nae');
    await page.evaluate(c => window.ARGOSMapa.voaPara(c, .6), cod); await esp(page, 2600);
    await shot(page, 's2-depois-mob-2-previa');
    await ctx.close();
  }

  // ============== Sugestão 3 — mapa cabe na primeira tela ==============
  if (roda('s3')) {
    for (const [css, tag] of [[[], 'antes'], [['proto/layout-cabe.css'], 'depois']]) {
      let { ctx, page } = await abre(b, 'desk', false, { css });
      await shot(page, `s3-${tag}-desk-1-estado`);
      console.log(tag, await page.evaluate(() => { const q = document.querySelector('.mt-mapa svg').getBoundingClientRect(); return `mapa top ${Math.round(q.top)} base ${Math.round(q.bottom)} (tela ${innerHeight}) altura ${Math.round(q.height)}`; }));
      await page.click('.mt-regcards button[data-reg="Centro"]'); await esp(page, 1500);
      await shot(page, `s3-${tag}-desk-2-regional`);
      await ctx.close();
    }
    for (const [css, tag] of [[[], 'antes'], [['proto/layout-cabe.css'], 'depois']]) {
      const { ctx, page } = await abre(b, 'mob', false, { css });
      await shot(page, `s3-${tag}-mob`);
      await ctx.close();
    }
  }

  // ============== Sugestão 4 — voar até (lista Maiores NAE + busca) ==============
  if (roda('s4')) {
    let { ctx, page } = await abre(b, 'desk', false);
    await page.click('#lupa'); await page.fill('#ativo-q', 'palm'); await esp(page, 700);
    await shot(page, 's4-antes-desk');
    await ctx.close();
    ({ ctx, page } = await abre(b, 'desk', true, { ...EXTRA_ZOOM, js: ['proto/voar-ate.js'] }));
    await shot(page, 's4-depois-desk-1-lista');
    await page.hover('.mt-top button:nth-of-type(2)'); await esp(page, 250);
    await shot(page, 's4-depois-desk-2-hover');
    await page.click('.mt-top button:nth-of-type(1)'); await esp(page, 2800);
    await shot(page, 's4-depois-desk-3-voou');
    await page.click('.mt-zoom [data-z=fit]'); await esp(page, 1300);
    await page.click('#lupa'); await page.fill('#ativo-q', 'palm'); await esp(page, 3000);
    await shot(page, 's4-depois-desk-4-busca');
    await ctx.close();
  }

  // ============== Sugestão 5 — mini-mapa ==============
  if (roda('s5')) {
    for (const v of ['desk', 'mob']) {
      const { ctx, page } = await abre(b, v, true, { ...EXTRA_ZOOM, js: ['proto/minimapa.js'] });
      const r = await page.evaluate(() => { const q = document.querySelector('.mt-mapa svg').getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height * .5]; });
      await ctrlRoda(page, 5, -120, r[0], r[1]);
      await shot(page, `s5-depois-${v}-1-zoom`);
      const m = await page.evaluate(() => { const q = document.querySelector('.mt-mini svg').getBoundingClientRect(); return [q.left, q.top, q.width, q.height]; });
      await page.mouse.click(m[0] + m[2] * .55, m[1] + m[3] * .85); await esp(page, 1800);          // clicar no mini-mapa leva o mapa para a parte de baixo (Sul)
      await shot(page, `s5-depois-${v}-2-clique-no-mini`);
      await ctx.close();
    }
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
