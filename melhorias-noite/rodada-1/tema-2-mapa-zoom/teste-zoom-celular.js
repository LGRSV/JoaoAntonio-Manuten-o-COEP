// Teste do gesto de pinça no celular (390x844) com toques reais via CDP (Input.dispatchTouchEvent):
// um dedo rola a página, dois dedos fazem pinça + arrastar, com zoom um dedo arrasta o mapa e o toque num município ainda abre a regional.
const { lanca, abre } = require('./lib.js');
let falhas = 0;
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) falhas++; };
(async () => {
  const b = await lanca();
  const { ctx, page } = await abre(b, 'mob', true);
  const cdp = await ctx.newCDPSession(page);
  const toque = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ x: p[0], y: p[1], id: i + 1 })) });
  const S = () => page.evaluate(() => { const c = document.querySelector('.mt-mapa'), s = c.querySelector('svg'); return { cls: c.className, vb: s.getAttribute('viewBox').split(' ').map(Number), zn: c.querySelector('.mt-zn').textContent, rot: c.querySelectorAll('.mt-nomesz text').length, prev: c.querySelectorAll('.mt-previa g').length, y: scrollY, dica: document.querySelector('.mt-zdica').className }; });
  const esp = ms => page.waitForTimeout(ms);
  const r = await page.evaluate(() => { const b = document.querySelector('.mt-mapa svg').getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; });
  console.log('svg', r);
  // 1) um dedo arrastando na vertical rola a página (e mostra a dica)
  const cx = 195, cy = r[1] + 300;
  await toque('touchStart', [[cx, cy]]);
  for (let i = 1; i <= 8; i++) { await toque('touchMove', [[cx, cy - i * 12]]); await esp(16); }
  await toque('touchEnd', []); await esp(400);
  let s = await S(); ok(s.y > 20, 'um dedo rola a página (scrollY=' + s.y + ')'); ok(!/zoomando/.test(s.cls), 'um dedo não liga o zoom'); ok(/on/.test(s.dica), 'dica "dois dedos" aparece');
  await page.evaluate(() => scrollTo(0, 0)); await esp(300);
  const r2 = await page.evaluate(() => { const b = document.querySelector('.mt-mapa svg').getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; });
  const my = r2[1] + r2[3] * .55;
  // 2) pinça: dois dedos se afastando
  await toque('touchStart', [[165, my], [225, my]]);
  for (let i = 1; i <= 12; i++) { await toque('touchMove', [[165 - i * 6, my], [225 + i * 6, my]]); await esp(20); }
  await toque('touchEnd', []); await esp(1200);
  s = await S(); ok(/zoomando/.test(s.cls), 'pinça liga o zoom (' + s.zn + ')'); ok(s.y === 0, 'pinça não rolou a página');
  const z1 = parseFloat(s.zn.replace('×', '').replace(',', '.')); ok(z1 > 2.5, 'fator ' + z1);
  console.log(s.rot + ' nomes, ' + s.prev + ' prévias');
  // 3) um dedo arrasta o mapa aproximado
  const v0 = s.vb;
  await toque('touchStart', [[250, my]]);
  for (let i = 1; i <= 8; i++) { await toque('touchMove', [[250 - i * 15, my + i * 8]]); await esp(16); }
  await toque('touchEnd', []); await esp(300);
  s = await S(); ok(Math.abs(s.vb[0] - v0[0]) > 3, 'um dedo arrasta o mapa com zoom'); ok(s.y === 0, 'e não rola a página');
  // 4) pinça para fora volta ao 1x
  await toque('touchStart', [[120, my], [270, my]]);
  for (let i = 1; i <= 14; i++) { await toque('touchMove', [[120 + i * 5, my], [270 - i * 5, my]]); await esp(20); }
  await toque('touchEnd', []); await esp(800);
  s = await S(); console.log('depois da pinça para fora', s.zn, s.cls);
  // 5) botão enquadrar
  if (/zoomando/.test(s.cls)) { await page.tap('.mt-zoom [data-z=fit]'); await esp(1200); }
  s = await S(); ok(!/zoomando/.test(s.cls), 'enquadrar devolve o mapa ao tamanho do nível');
  // 6) zoom pelo botão + e toque num município
  await page.tap('.mt-zoom [data-z=mais]'); await esp(900); await page.tap('.mt-zoom [data-z=mais]'); await esp(900);
  s = await S(); ok(/zoomando/.test(s.cls), 'botão + no celular (' + s.zn + ')');
  const cod = await page.evaluate(() => { const ms = [...document.querySelectorAll('.mun.tem')].map(p => { const q = p.getBoundingClientRect(), w = Math.min(q.right, 380) - Math.max(q.left, 10), h = Math.min(q.bottom, 800) - Math.max(q.top, 200); return { c: p.dataset.cod, a: Math.max(0, w) * Math.max(0, h) }; }).sort((a, b) => b.a - a.a); return ms[0].c; });
  const pt = await page.evaluate(cod => { const p = document.querySelector(`.mun[data-cod="${cod}"]`), s = p.ownerSVGElement, bb = p.getBBox(); for (let i = 1; i < 14; i++) for (let j = 1; j < 14; j++) { const pt = s.createSVGPoint(); pt.x = bb.x + bb.width * i / 14; pt.y = bb.y + bb.height * j / 14; if (!p.isPointInFill(pt)) continue; const q = pt.matrixTransform(p.getScreenCTM()); if (document.elementFromPoint(q.x, q.y) === p && q.x > 20 && q.x < 370 && q.y > 100 && q.y < 800) return [q.x, q.y]; } return null; }, cod);
  ok(!!pt, 'ponto de toque no município ' + cod);
  await page.touchscreen.tap(pt[0], pt[1]); await esp(1500);
  s = await S(); ok(/aberta/.test(s.cls) && !/zoomando/.test(s.cls), 'toque depois do zoom abre a regional');
  await ctx.close(); await b.close();
  console.log(falhas ? `${falhas} FALHA(S)` : 'TODOS OS TESTES PASSARAM');
})().catch(e => { console.error(e); process.exit(2); });
