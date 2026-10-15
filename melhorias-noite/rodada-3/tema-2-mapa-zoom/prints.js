// Gera todos os prints do README (JPEG 80%, 1440x900 e 390x844, tema escuro; claro onde faz diferença).
// Uso: node prints.js        O "antes" é o site ao vivo (mapa-municipios.js atual); o "depois" injeta proto/mapa-municipios.js e proto/site.css.
// (o Chromium do sandbox não confia na CA do proxy: lib.js busca tudo por curl e entrega com page.route)
const { lanca, abre, shot } = require('./lib.js');
const esp = (p, ms) => p.waitForTimeout(ms);

async function ctrlRoda(page, n, dy, x, y) {            // Ctrl + roda simulada: tecla Control pressionada + page.mouse.wheel
  await page.mouse.move(x, y);
  await page.keyboard.down('Control');
  for (let i = 0; i < n; i++) { await page.mouse.wheel(0, dy); await esp(page, 50); }
  await page.keyboard.up('Control');
  await page.mouse.move(1420, 520);                     // tira o mouse de cima do mapa (sem balão de hover)
  await esp(page, 1500);
}
const toqueFn = cdp => (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ x: p[0], y: p[1], id: i + 1 })) });
async function pinca(cdp, cx, cy, d0, d1, n = 12) {      // pinça de dois dedos (toques reais via CDP)
  const t = toqueFn(cdp), pts = d => [[cx - d / 2, cy], [cx + d / 2, cy]];
  await t('touchStart', pts(d0));
  for (let i = 1; i <= n; i++) { await t('touchMove', pts(d0 + (d1 - d0) * i / n)); await new Promise(r => setTimeout(r, 20)); }
  await t('touchEnd', []);
}
async function arrasta(cdp, x0, y0, x1, y1, n = 8) {
  const t = toqueFn(cdp);
  await t('touchStart', [[x0, y0]]);
  for (let i = 1; i <= n; i++) { await t('touchMove', [[x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]]); await new Promise(r => setTimeout(r, 16)); }
  await t('touchEnd', []);
}
const rectSvg = page => page.evaluate(() => { const q = document.querySelector('.mt-mapa svg').getBoundingClientRect(); return [q.left, q.top, q.width, q.height]; });
const info = page => page.evaluate(() => `${document.querySelector('.mt-zn').textContent} · ${document.querySelectorAll('.mt-nomes2 .mt-mn').length} cartões`);
const maisPerto = (page, x, y) => page.evaluate(([x, y]) => { // município com ponto clicável mais perto de (x,y)
  let melhor = null, d = 1e9;
  document.querySelectorAll('.mun.tem').forEach(p => { const s = p.ownerSVGElement, bb = p.getBBox(); for (let i = 1; i < 10; i++) for (let j = 1; j < 10; j++) { const pt = s.createSVGPoint(); pt.x = bb.x + bb.width * i / 10; pt.y = bb.y + bb.height * j / 10; if (!p.isPointInFill(pt)) continue; const q = pt.matrixTransform(p.getScreenCTM()); if (document.elementFromPoint(q.x, q.y) !== p) continue; const dd = Math.hypot(q.x - x, q.y - y); if (dd < d) { d = dd; melhor = [q.x, q.y]; } } });
  return melhor;
}, [x, y]);

(async () => {
  const b = await lanca();
  let ctx, page, cdp, r;

  // =============================== ANTES (site atual) ===============================
  ({ ctx, page } = await abre(b, 'desk', false));
  await shot(page, 'z-antes-desk-1-estado');                                   // estado inteiro (1×): só os cartões das regionais
  await ctrlRoda(page, 5, -120, 720, 560);
  await shot(page, 'z-antes-desk-2-ctrl-roda');                                // Ctrl + roda ×5: o mapa não muda
  await page.click('.mt-regcards button[data-reg="Centro"]'); await esp(page, 1500);
  await shot(page, 'z-antes-desk-3-regional');
  await page.click('.mt-barra .mt-pchip >> text=Palmas'); await esp(page, 1500);
  await shot(page, 'z-antes-desk-4-polo');
  await ctx.close();
  ({ ctx, page } = await abre(b, 'mob', false));
  cdp = await ctx.newCDPSession(page); r = await rectSvg(page);
  await shot(page, 'z-antes-mob-1-estado');
  await pinca(cdp, 195, r[1] + r[3] * .45, 60, 200); await esp(page, 600);
  await shot(page, 'z-antes-mob-2-pinca');                                     // pinça = zoom da PÁGINA inteira (visualViewport)
  console.log('antes mob: escala visual da página', await page.evaluate(() => visualViewport.scale));
  await ctx.close();
  ({ ctx, page } = await abre(b, 'mob', false));
  await page.tap('.mt-regcards button[data-reg="Centro"]'); await esp(page, 1500);
  await shot(page, 'z-antes-mob-3-regional');
  await page.tap('.mt-barra .mt-pchip >> text=Palmas'); await esp(page, 1500);
  await shot(page, 'z-antes-mob-4-polo');
  await ctx.close();

  // =============================== DEPOIS (protótipo) — desktop ===============================
  ({ ctx, page } = await abre(b, 'desk', true, { calmo: false }));
  await page.mouse.move(720, 560); await page.mouse.wheel(0, 120); await esp(page, 250);
  await page.evaluate(() => scrollTo(0, 0)); await esp(page, 150);
  await shot(page, 'z-depois-desk-1-aviso');                                   // rolar sem Ctrl: a página rola e o aviso ensina o atalho
  await esp(page, 1900);
  await ctrlRoda(page, 2, -120, 720, 560);
  await shot(page, 'z-depois-desk-2-estado-1x7'); console.log('desk estado', await info(page));
  await ctrlRoda(page, 3, -120, 720, 540);
  await shot(page, 'z-depois-desk-3-estado-3x7'); console.log('desk estado', await info(page));
  await page.mouse.move(720, 560); await page.mouse.down(); await page.mouse.move(520, 440, { steps: 10 }); await page.mouse.up(); await esp(page, 1300);
  await shot(page, 'z-depois-desk-4-arrastar'); console.log('desk arrastar', await info(page));
  await page.keyboard.press('Escape'); await esp(page, 1300);
  await shot(page, 'z-depois-desk-5-esc-enquadra');
  await page.click('.mt-regcards button[data-reg="Centro"]'); await esp(page, 1500);
  await ctrlRoda(page, 2, -120, 720, 560);
  await shot(page, 'z-depois-desk-6-regional-1x7'); console.log('desk regional', await info(page));
  await ctrlRoda(page, 3, -120, 720, 560);
  await shot(page, 'z-depois-desk-7-regional-3x7'); console.log('desk regional', await info(page));
  await page.keyboard.press('Escape'); await esp(page, 1300);
  await page.click('.mt-barra .mt-pchip >> text=Palmas'); await esp(page, 1500);
  await ctrlRoda(page, 2, -120, 720, 520);
  await shot(page, 'z-depois-desk-8-polo-zoom'); console.log('desk polo', await info(page));
  // clique num município depois do zoom: abre a rede dos alimentadores (drill-down intacto)
  const pt = await maisPerto(page, 700, 460);
  await page.mouse.click(pt[0], pt[1]); await esp(page, 2000);
  await shot(page, 'z-depois-desk-9-clique-abre-municipio');
  await ctx.close();
  // busca com o mapa aproximado: leva ao resultado e solta o zoom
  ({ ctx, page } = await abre(b, 'desk', true, { calmo: false }));
  await ctrlRoda(page, 4, -120, 720, 560);
  await page.fill('#ativo-q', 'palmas'); await esp(page, 700);
  await shot(page, 'z-depois-desk-10-busca-com-zoom');
  await page.keyboard.press('Enter'); await esp(page, 2300);
  await shot(page, 'z-depois-desk-11-busca-resultado');
  await ctx.close();
  // tema claro
  ({ ctx, page } = await abre(b, 'desk', true, { calmo: false, claro: true }));
  await ctrlRoda(page, 5, -120, 720, 560);
  await shot(page, 'z-depois-desk-12-claro');
  await ctx.close();

  // =============================== DEPOIS (protótipo) — celular ===============================
  ({ ctx, page } = await abre(b, 'mob', true, { calmo: false }));
  cdp = await ctx.newCDPSession(page); r = await rectSvg(page);
  const toque = toqueFn(cdp);
  await toque('touchStart', [[195, r[1] + 300]]); for (let i = 1; i <= 8; i++) { await toque('touchMove', [[195, r[1] + 300 - i * 12]]); await esp(page, 16); } await toque('touchEnd', []); await esp(page, 150);
  await shot(page, 'z-depois-mob-1-aviso');                                    // um dedo rola a página; o aviso diz "use dois dedos"
  await page.evaluate(() => scrollTo(0, 0)); await esp(page, 2000);
  r = await rectSvg(page); const my = r[1] + r[3] * .45;
  await pinca(cdp, 195, my, 60, 130); await esp(page, 1300);
  await shot(page, 'z-depois-mob-2-pinca-1'); console.log('mob pinça 1', await info(page));
  await pinca(cdp, 195, my, 60, 200); await esp(page, 1300);
  await shot(page, 'z-depois-mob-3-pinca-2'); console.log('mob pinça 2', await info(page));
  await arrasta(cdp, 250, my, 130, my + 90); await esp(page, 700);
  await shot(page, 'z-depois-mob-4-arrastar'); console.log('mob arrastar', await info(page));
  await page.tap('.mt-zoom [data-z=fit]'); await esp(page, 1300);
  await page.tap('.mt-regcards button[data-reg="Centro"]'); await esp(page, 1600);
  r = await rectSvg(page);
  await pinca(cdp, 195, r[1] + r[3] * .5, 60, 150); await esp(page, 1300);
  await shot(page, 'z-depois-mob-5-regional-pinca'); console.log('mob regional', await info(page));
  await page.tap('.mt-zoom [data-z=fit]'); await esp(page, 1300);
  await page.tap('.mt-barra .mt-pchip >> text=Palmas'); await esp(page, 1600);
  r = await rectSvg(page);
  await pinca(cdp, 195, r[1] + r[3] * .5, 60, 140); await esp(page, 1300);
  await shot(page, 'z-depois-mob-6-polo-pinca'); console.log('mob polo', await info(page));
  await ctx.close();
  ({ ctx, page } = await abre(b, 'mob', true, { calmo: false, claro: true }));
  cdp = await ctx.newCDPSession(page); r = await rectSvg(page);
  await pinca(cdp, 195, r[1] + r[3] * .45, 60, 200); await esp(page, 1300);
  await shot(page, 'z-depois-mob-7-claro');
  await ctx.close();
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
