// Teste do gesto de pinça no celular (390x844) com toques reais via CDP (Input.dispatchTouchEvent), no mapa-municipios.js ATUAL:
// um dedo rola a página, dois dedos fazem pinça + arrastar, com zoom um dedo arrasta o mapa, os cartões nome+NAE dos municípios
// são recalculados (sem sobreposição) ao fim de cada gesto, e o toque num município depois do zoom ainda abre a regional / o polo.
const { lanca, abre, checaCartoes } = require('./lib.js');
let falhas = 0;
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) falhas++; };
(async () => {
  const b = await lanca();
  const { ctx, page } = await abre(b, 'mob', true);
  const erros = []; page.on('pageerror', e => erros.push(e.message));
  const cdp = await ctx.newCDPSession(page);
  const toque = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ x: p[0], y: p[1], id: i + 1 })) });
  const S = () => page.evaluate(() => { const c = document.querySelector('.mt-mapa'), s = c.querySelector('svg'); return { cls: c.className, vb: s.getAttribute('viewBox').split(' ').map(Number), zn: c.querySelector('.mt-zn').textContent, cart: c.querySelectorAll('.mt-nomes2 .mt-mn').length, y: scrollY, vv: visualViewport.scale, dica: document.querySelector('.mt-zdica').className }; });
  const esp = ms => page.waitForTimeout(ms);
  const rect = () => page.evaluate(() => { const b = document.querySelector('.mt-mapa svg').getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; });
  const pinca = async (cx, cy, d0, d1, n = 12) => { await toque('touchStart', [[cx - d0 / 2, cy], [cx + d0 / 2, cy]]); for (let i = 1; i <= n; i++) { const d = d0 + (d1 - d0) * i / n; await toque('touchMove', [[cx - d / 2, cy], [cx + d / 2, cy]]); await esp(20); } await toque('touchEnd', []); await esp(800); };
  const arrasta = async (x0, y0, x1, y1, n = 8) => { await toque('touchStart', [[x0, y0]]); for (let i = 1; i <= n; i++) { await toque('touchMove', [[x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]]); await esp(16); } await toque('touchEnd', []); await esp(500); };
  const limpo = async (rot, minimo = 1) => { const c = await checaCartoes(page); ok(c.n >= minimo && !c.sobrepoe.length && !c.comFixo.length && !c.fora.length && !c.foraDoMun.length && !c.semNae, `${rot}: ${c.n} cartões nome+NAE, sem sobreposição, dentro do município${c.sobrepoe.length || c.comFixo.length || c.fora.length || c.foraDoMun.length ? ' ' + JSON.stringify(c) : ''}`); };
  const pontoToque = cod => page.evaluate(cod => { const p = document.querySelector(`.mun[data-cod="${cod}"]`), s = p.ownerSVGElement, bb = p.getBBox(); for (let i = 1; i < 14; i++) for (let j = 1; j < 14; j++) { const pt = s.createSVGPoint(); pt.x = bb.x + bb.width * i / 14; pt.y = bb.y + bb.height * j / 14; if (!p.isPointInFill(pt)) continue; const q = pt.matrixTransform(p.getScreenCTM()); if (document.elementFromPoint(q.x, q.y) === p && q.x > 20 && q.x < 370 && q.y > 230 && q.y < 740) return [q.x, q.y]; } return null; }, cod);
  const maior = () => page.evaluate(() => [...document.querySelectorAll('.mun.tem')].map(p => { const q = p.getBoundingClientRect(), w = Math.min(q.right, 380) - Math.max(q.left, 10), h = Math.min(q.bottom, 740) - Math.max(q.top, 230); return { c: p.dataset.cod, a: Math.max(0, w) * Math.max(0, h) }; }).sort((a, b) => b.a - a.a)[0].c);

  const r = await rect(), vb0 = (await S()).vb;
  // 1) um dedo arrastando na vertical rola a página (e mostra a dica)
  const cx = 195, cy = r[1] + 300;
  await toque('touchStart', [[cx, cy]]);
  for (let i = 1; i <= 8; i++) { await toque('touchMove', [[cx, cy - i * 12]]); await esp(16); }
  await toque('touchEnd', []); await esp(400);
  let s = await S(); const rolavel = await page.evaluate(() => document.documentElement.scrollHeight > innerHeight + 20);   // a página inicial nova cabe na tela do celular: só rola se sobrar altura
  ok(!rolavel || s.y > 20, rolavel ? 'um dedo rola a página (scrollY=' + s.y + ')' : 'a página cabe na tela (sem rolagem): o gesto de um dedo não vira zoom'); ok(!/zoomando/.test(s.cls), 'um dedo não liga o zoom'); ok(/on/.test(s.dica), 'dica "dois dedos" aparece');
  await page.evaluate(() => scrollTo(0, 0)); await esp(300);
  const r2 = await rect(), my = r2[1] + r2[3] * .45;
  // 2) pinça: dois dedos se afastando; o zoom semântico mostra nome + NAE
  await pinca(195, my, 60, 200);
  s = await S(); ok(/zoomando/.test(s.cls), 'pinça liga o zoom (' + s.zn + ')'); ok(s.y === 0 && s.vv === 1, 'pinça não rolou a página nem deu zoom na página inteira (visualViewport.scale=' + s.vv + ')');
  const z1 = parseFloat(s.zn.replace('×', '').replace(',', '.')); ok(z1 > 2.5, 'fator ' + z1);
  await limpo('estado ' + s.zn, 8);
  // 3) um dedo arrasta o mapa aproximado; cartões recalculados
  const v0 = s.vb;
  await arrasta(250, my, 130, my + 90);
  s = await S(); ok(Math.abs(s.vb[0] - v0[0]) > 3, 'um dedo arrasta o mapa com zoom'); ok(s.y === 0, 'e não rola a página'); await limpo('depois de arrastar', 5);
  // 4) mais pinça e pinça para fora volta ao 1x
  await pinca(195, my, 60, 160); s = await S(); ok(parseFloat(s.zn.replace('×', '').replace(',', '.')) > z1, 'segunda pinça aproxima mais (' + s.zn + ')'); await limpo('estado ' + s.zn, 4);
  await pinca(195, my, 300, 40, 16); await pinca(195, my, 300, 40, 16); s = await S();
  console.log('depois da pinça para fora', s.zn, s.cls);
  // 5) botão enquadrar
  if (/zoomando/.test(s.cls)) { await page.tap('.mt-zoom [data-z=fit]'); await esp(1200); }
  s = await S(); ok(!/zoomando/.test(s.cls) && s.vb.every((v, i) => Math.abs(v - vb0[i]) < 0.05), 'enquadrar devolve o mapa ao enquadramento original do estado');
  // 6) botão + e toque num município: abre a regional
  await page.tap('.mt-zoom [data-z=mais]'); await esp(900); await page.tap('.mt-zoom [data-z=mais]'); await esp(1200);
  s = await S(); ok(/zoomando/.test(s.cls), 'botão + no celular (' + s.zn + ')'); await limpo('botão +', 3);
  const cod = await maior(), pt = await pontoToque(cod); ok(!!pt, 'ponto de toque no município ' + cod);
  await page.touchscreen.tap(pt[0], pt[1]); await esp(1700);
  s = await S(); ok(/aberta/.test(s.cls) && !/zoomando/.test(s.cls), 'toque depois do zoom abre a regional');
  // 7) regional: pinça, cartões, arrastar; depois polo
  const r3 = await rect(), my3 = r3[1] + r3[3] * .5;
  await pinca(195, my3, 60, 150); s = await S(); ok(/zoomando/.test(s.cls) && /aberta/.test(s.cls), 'pinça na regional (' + s.zn + ')'); await limpo('regional ' + s.zn, 3);
  await arrasta(250, my3, 150, my3 + 60); await limpo('regional depois de arrastar', 2);
  await page.tap('.mt-zoom [data-z=fit]'); await esp(1300);
  s = await S(); ok(!/zoomando/.test(s.cls) && /aberta/.test(s.cls), 'enquadrar na regional continua na regional');
  await page.tap('.mt-barra .mt-pchip'); await esp(1700);
  s = await S(); ok(/polo/.test(s.cls), 'polo aberto no celular'); const r4 = await rect();
  await pinca(195, r4[1] + r4[3] * .5, 60, 140); s = await S(); ok(/zoomando/.test(s.cls), 'pinça no polo (' + s.zn + ')'); await limpo('polo ' + s.zn, 1);
  const cod2 = await maior(), pt2 = await pontoToque(cod2); ok(!!pt2, 'ponto de toque no polo ' + cod2);
  await page.touchscreen.tap(pt2[0], pt2[1]); await esp(1900);
  s = await S(); ok(/nivel-mun/.test(s.cls) && !/zoomando/.test(s.cls), 'toque depois do zoom abre o município');
  ok(erros.length === 0, 'sem erros de JavaScript' + (erros.length ? ': ' + erros.join(' | ') : ''));
  // ---- legenda recolhida, tela cheia e busca com o mapa aproximado (contexto novo, estado inteiro)
  const c2 = await abre(b, 'mob', true), p2 = c2.page, cdp2 = await c2.ctx.newCDPSession(p2);
  const t2 = (type, pts) => cdp2.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ x: p[0], y: p[1], id: i + 1 })) });
  const pinca2 = async (cx, cy, d0, d1, n = 12) => { await t2('touchStart', [[cx - d0 / 2, cy], [cx + d0 / 2, cy]]); for (let i = 1; i <= n; i++) { const d = d0 + (d1 - d0) * i / n; await t2('touchMove', [[cx - d / 2, cy], [cx + d / 2, cy]]); await esp(20); } await t2('touchEnd', []); await esp(900); };
  const rr = await p2.evaluate(() => { const b = document.querySelector('.mt-mapa svg').getBoundingClientRect(); return [b.top, b.height]; }), yy = rr[0] + rr[1] * .45;
  await p2.tap('.mt-zoom [data-z=mais]'); await esp(1000);
  let bd = await p2.evaluate(() => ({ n: [...document.querySelectorAll('.mt-regcards button')].filter(b => b.offsetParent && b.style.display !== 'none').length, fios: document.querySelectorAll('.mt-bandeiras .mt-fio').length, z: document.querySelector('.mt-zn').textContent }));
  ok(bd.n >= 1 && bd.fios === bd.n, `bandeirinhas com pouco zoom no celular (${bd.z}): ${bd.n} cartões e ${bd.fios} fios`);
  { const c = await checaCartoes(p2); ok(!c.sobrepoe.length && !c.comFixo.length && !c.fora.length && !c.foraDoMun.length, `×1,6 no celular: ${c.n} cartões, sem sobreposição com as bandeirinhas, fios e botões`); }
  await pinca2(195, yy, 60, 190);
  const antes = await p2.evaluate(() => document.querySelectorAll('.mt-nomes2 .mt-mn').length);
  await p2.tap('.mt-regs'); await esp(900);
  const dep = await p2.evaluate(() => ({ n: document.querySelectorAll('.mt-nomes2 .mt-mn').length, nae: [...document.querySelectorAll('.mt-nomes2 .mt-mn i')].filter(i => i.offsetParent).length, sem: document.querySelector('#mapa-to').classList.contains('sem-nae') }));
  ok(dep.sem && dep.nae === 0 && dep.n >= antes, `legenda recolhida no celular: ${dep.n} cartões só com o nome (antes ${antes}), nenhum número`);
  { const c = await checaCartoes(p2); ok(!c.sobrepoe.length && !c.comFixo.length && !c.fora.length && !c.foraDoMun.length, 'legenda recolhida: sem sobreposição'); }
  await p2.tap('.mt-regs'); await esp(700);
  await p2.tap('.mt-tc'); await esp(1500);
  let tcs = await p2.evaluate(() => ({ cls: document.querySelector('.mt-mapa').className, cheia: !!(document.fullscreenElement || document.querySelector('#mapa-to.mt-cheia')) }));
  ok(tcs.cheia && !/zoomando/.test(tcs.cls), 'tela cheia no celular solta o zoom (a caixa mudou de tamanho)');
  const rt = await p2.evaluate(() => { const b = document.querySelector('.mt-mapa svg').getBoundingClientRect(); return [b.top, b.height]; });
  await pinca2(195, rt[0] + rt[1] * .5, 60, 190); await esp(300);
  tcs = await p2.evaluate(() => ({ cls: document.querySelector('.mt-mapa').className, zn: document.querySelector('.mt-zn').textContent }));
  ok(/zoomando/.test(tcs.cls), 'pinça funciona dentro da tela cheia (' + tcs.zn + ')');
  { const c = await checaCartoes(p2); ok(c.n >= 3 && !c.sobrepoe.length && !c.comFixo.length && !c.fora.length && !c.foraDoMun.length, `tela cheia + zoom: ${c.n} cartões, sem sobreposição`); }
  await p2.tap('.mt-tc'); await esp(1500);
  ok(!/zoomando/.test(await p2.evaluate(() => document.querySelector('.mt-mapa').className)), 'sair da tela cheia solta o zoom');
  await pinca2(195, yy, 60, 190);
  await p2.tap('#lupa'); await p2.fill('#ativo-q', 'araguaina'); await esp(500); await p2.keyboard.press('Enter'); await esp(2200);
  const nvm = await p2.evaluate(() => ({ cls: document.querySelector('.mt-mapa').className, nv: window.ARGOS_MAPA.nivel() }));
  ok(!/zoomando/.test(nvm.cls) && (nvm.nv.reg || nvm.nv.pol || nvm.nv.mun), 'busca com o mapa aproximado leva ao resultado e solta o zoom (' + JSON.stringify(nvm.nv) + ')');
  await c2.ctx.close(); await ctx.close();
  await b.close();
  console.log(falhas ? `${falhas} FALHA(S)` : 'TODOS OS TESTES PASSARAM');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
