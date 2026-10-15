// Teste de comportamento do zoom livre (rodada 3, consolidado sobre o mapa-municipios.js ATUAL: bandeirinhas, legenda que esconde a NAE, tela cheia): Ctrl+roda, arrastar, botões, teclas,
// cartões dos municípios recalculados sem sobreposição ao fim de cada gesto, clique depois do zoom, Esc, "←", busca (ARGOS_MAPA.vai) e tema claro.
// Uso: node teste-zoom.js   (site ao vivo via curl + proto/mapa-municipios.js e proto/site.css injetados com page.route)
const { lanca, abre, checaCartoes } = require('./lib.js');
let falhas = 0;
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) falhas++; };
const esp = (p, ms) => p.waitForTimeout(ms);
// a máquina é compartilhada com outras sessões (load alto): condições visuais esperam até 6 s em vez de dormir um tempo fixo
const ate = async (p, fn, arg) => { try { await p.waitForFunction(fn, arg, { timeout: 6000 }); return true; } catch (e) { return false; } };
(async () => {
  const b = await lanca();
  const { ctx, page } = await abre(b, 'desk', true, { calmo: false });
  const erros = []; page.on('pageerror', e => erros.push(e.message));
  const S = () => page.evaluate(() => {
    const c = document.querySelector('.mt-mapa'), s = c.querySelector('svg');
    return { cls: c.className, vb: s.getAttribute('viewBox').split(' ').map(Number), zn: c.querySelector('.mt-zn').textContent,
      cart: c.querySelectorAll('.mt-nomes2 .mt-mn').length, sw: s.style.cssText, dica: document.querySelector('.mt-zdica').className };
  });
  const ponto = cod => page.evaluate(cod => {          // ponto da tela em que o clique cai no município (e não em cartão, botão ou legenda)
    const p = document.querySelector(`.mun[data-cod="${cod}"]`), s = p.ownerSVGElement, b = p.getBBox();
    for (let i = 1; i < 14; i++) for (let j = 1; j < 14; j++) {
      const pt = s.createSVGPoint(); pt.x = b.x + b.width * i / 14; pt.y = b.y + b.height * j / 14;
      if (!p.isPointInFill(pt)) continue;
      const q = pt.matrixTransform(p.getScreenCTM()), r = document.elementFromPoint(q.x, q.y);
      if (r === p && q.x > 330 && q.x < 1300 && q.y > 260 && q.y < 840) return [q.x, q.y];
    }
    return null;
  }, cod);
  const maiorNaTela = (xmin, xmax, ymin, ymax) => page.evaluate(([xmin, xmax, ymin, ymax]) => [...document.querySelectorAll('.mun.tem')].map(p => {
    const r = p.getBoundingClientRect(), w = Math.min(r.right, xmax) - Math.max(r.left, xmin), h = Math.min(r.bottom, ymax) - Math.max(r.top, ymin);
    return { c: p.dataset.cod, a: Math.max(0, w) * Math.max(0, h) };
  }).sort((a, b) => b.a - a.a)[0].c, [xmin, xmax, ymin, ymax]);
  const ctrlRoda = async (n, dy, x = 720, y = 560) => { await page.mouse.move(x, y); await page.keyboard.down('Control'); for (let i = 0; i < n; i++) { await page.mouse.wheel(0, dy); await esp(page, 50); } await page.keyboard.up('Control'); await page.mouse.move(1420, 520); await esp(page, 1100); };
  const limpo = async (rot, minimo = 1) => { await ate(page, () => { const c = document.querySelector('.mt-mapa').classList; return !c.contains('mexe') && !c.contains('voando'); }); await esp(page, 250); const c = await checaCartoes(page); ok(c.n >= minimo && !c.sobrepoe.length && !c.comFixo.length && !c.fora.length && !c.foraDoMun.length && !c.semNae, `${rot}: ${c.n} cartões nome+NAE, sem sobreposição, dentro do município${c.sobrepoe.length || c.comFixo.length || c.fora.length || c.foraDoMun.length ? ' ' + JSON.stringify(c) : ''}`); return c; };

  let s = await S();
  ok(!/zoomando/.test(s.cls), 'estado inicial sem zoom'); ok(s.cart === 0, 'sem zoom, no estado inteiro não há cartões de município (só os das regionais)');
  const vb0 = s.vb;
  // ---- roda sem Ctrl rola a página; aviso aparece
  await page.mouse.move(720, 560); await page.mouse.wheel(0, 150); await esp(page, 250);
  ok(await page.evaluate(() => scrollY) > 0, 'roda sem Ctrl rola a página'); s = await S();
  ok(!/zoomando/.test(s.cls) && s.vb[2] === vb0[2], 'roda sem Ctrl não dá zoom'); ok(/on/.test(s.dica), 'aviso "Use Ctrl + rolagem" aparece');
  await page.evaluate(() => scrollTo(0, 0)); await esp(page, 1900);

  // ---- ZOOM SEMÂNTICO no estado: poucos cartões em ~1,7x, mais em ~3x, e os cartões das regionais somem acima de 1,8x
  await ctrlRoda(2, -120);
  s = await S(); const z1 = parseFloat(s.zn.replace('×', '').replace(',', '.'));
  ok(/zoomando/.test(s.cls) && z1 > 1.3 && z1 < 1.8 && !/zoom-longe/.test(s.cls), `Ctrl+roda ×2 aproxima (${s.zn}); cartões das regionais ainda à vista`);
  await limpo('estado ' + s.zn, 5);
  const cartoesRegionais = async () => { await ate(page, () => !document.querySelector('.mt-mapa').classList.contains('mexe') && !document.querySelector('.mt-mapa').classList.contains('voando')); await esp(page, 450); return cartoesRegionais0(); };
  const cartoesRegionais0 = () => page.evaluate(() => [...document.querySelectorAll('.mt-regcards button')].map(b => +getComputedStyle(b).opacity));
  { const o = await cartoesRegionais(); ok(o.every(x => x === 1), 'cartões Norte/Centro/Sul visíveis com pouco zoom ' + JSON.stringify(o)); }
  // bandeirinhas: com pouco zoom voltam recalculadas, dentro da caixa, sem cobrir botões nem cartões; cada fio nasce no contorno
  const bandeirinhas = rot => page.evaluate(() => {
    const cx = document.querySelector('.mt-mapa').getBoundingClientRect(), v = [...document.querySelectorAll('.mt-regcards button')].filter(b => b.offsetParent && b.style.display !== 'none');
    const r = v.map(b => b.getBoundingClientRect()), ctl = [document.querySelector('.mt-tc'), document.querySelector('.mt-zoom')].map(e => e.getBoundingClientRect());
    const cruza = (a, b) => a.left < b.right - .5 && a.right > b.left + .5 && a.top < b.bottom - .5 && a.bottom > b.top + .5;
    return { n: v.length, fora: r.filter(a => a.left < cx.left - 1 || a.right > cx.right + 1 || a.top < cx.top - 1 || a.bottom > cx.bottom + 1).length,
      comBotao: r.filter(a => ctl.some(c => cruza(a, c))).length, opac: v.map(b => +getComputedStyle(b).opacity), fios: document.querySelectorAll('.mt-bandeiras .mt-fio').length };
  });
  { const bd = await bandeirinhas(); ok(bd.n >= 1 && bd.fora === 0 && bd.comBotao === 0 && bd.fios === bd.n && bd.opac.every(o => o === 1), `bandeirinhas com pouco zoom ${JSON.stringify(bd)}: ${bd.n} cartões e ${bd.fios} fios, dentro da caixa e fora dos botões`); }
  // legenda recolhida (orelhinha): os números de NAE saem dos cartões dos municípios e cabem mais nomes; reabrir devolve a NAE
  const nCart = () => page.evaluate(() => ({ n: document.querySelectorAll('.mt-nomes2 .mt-mn').length, nae: [...document.querySelectorAll('.mt-nomes2 .mt-mn i')].filter(i => i.offsetParent).length, sem: document.querySelector('#mapa-to').classList.contains('sem-nae') }));
  const cheia0 = await nCart();
  await page.click('.mt-regs'); await esp(page, 700);
  const fechada = await nCart();
  ok(fechada.sem && fechada.nae === 0 && fechada.n >= cheia0.n, `legenda recolhida com zoom: cartões só com o nome (${fechada.n} contra ${cheia0.n}), nenhum número de NAE`);
  { const c = await checaCartoes(page); ok(!c.sobrepoe.length && !c.comFixo.length && !c.fora.length && !c.foraDoMun.length, 'legenda recolhida: cartões sem sobreposição e dentro do município'); }
  await page.click('.mt-regs'); await esp(page, 700);
  const reaberta = await nCart();
  ok(!reaberta.sem && reaberta.nae === reaberta.n && reaberta.n >= 1, `legenda reaberta: os ${reaberta.n} cartões voltam com a NAE`);
  await ctrlRoda(3, -120);
  s = await S();
  ok(/zoom-longe/.test(s.cls) && (await cartoesRegionais()).every(o => o === 0), `acima de 1,8x (${s.zn}) os cartões das regionais saem de cena`);
  const c3 = await limpo('estado ' + s.zn, 8);
  // ---- arrastar: move o mapa, não clica, e os cartões são recalculados ao fim do gesto
  const antes = s.vb, cartAntes = await page.evaluate(() => [...document.querySelectorAll('.mt-nomes2 .mt-mn b')].map(e => e.textContent).join('|'));
  await page.mouse.move(700, 500); await page.mouse.down(); await page.mouse.move(540, 430, { steps: 8 });
  ok(await page.evaluate(() => getComputedStyle(document.querySelector('.mt-nomes2')).opacity === '0' || document.querySelector('.mt-mapa').classList.contains('mexe')), 'durante o arrasto os cartões ficam escondidos (sem piscar por quadro)');
  await page.mouse.up(); await esp(page, 500);
  s = await S(); ok(Math.abs(s.vb[0] - antes[0]) > 5, 'arrastar move o mapa'); ok(!/aberta/.test(s.cls), 'arrastar não dispara clique (continua no estado)');
  const cartDepois = await page.evaluate(() => [...document.querySelectorAll('.mt-nomes2 .mt-mn b')].map(e => e.textContent).join('|'));
  ok(cartDepois !== cartAntes, 'ao fim do arrasto os cartões foram recalculados para a nova vista');
  await limpo('depois de arrastar', 8);
  // ---- botões + / −
  await page.click('.mt-zoom [data-z=mais]'); await esp(page, 1000);
  const s2 = await S(); ok(s2.vb[2] < s.vb[2], 'botão + aproxima'); await limpo('depois do botão +', 3);
  await page.click('.mt-zoom [data-z=menos]'); await esp(page, 1000);
  const s3 = await S(); ok(s3.vb[2] > s2.vb[2], 'botão − afasta'); await limpo('depois do botão −', 3);
  // ---- Esc enquadra
  await page.keyboard.press('Escape'); await esp(page, 1300);
  s = await S(); ok(!/zoomando/.test(s.cls) && s.vb.every((v, i) => Math.abs(v - vb0[i]) < 0.05), '1º Esc enquadra: volta ao viewBox original do estado');
  ok(!s.sw, 'estilos inline do zoom removidos'); ok(s.cart === 0, 'e os cartões de município somem junto');
  ok((await cartoesRegionais()).every(o => o === 1), 'cartões das regionais voltam');

  // ---- zoom + clique num município: abre a regional (drill-down intacto)
  await ctrlRoda(4, -120, 700, 450);
  s = await S(); ok(/zoomando/.test(s.cls), 'zoom antes do clique');
  const cod = await maiorNaTela(400, 1100, 330, 800), pt = await ponto(cod); ok(!!pt, 'achou ponto clicável no município ' + cod + ' (por baixo do cartão)');
  await page.mouse.click(pt[0], pt[1]); await esp(page, 1600);
  s = await S(); ok(/aberta/.test(s.cls) && !/zoomando/.test(s.cls), 'clique depois do zoom abre a regional e solta o zoom');
  ok(await page.evaluate(() => !document.querySelector('.mt-mapa').classList.contains('voando')), 'voo terminou');
  // ---- regional: zoom semântico com cartões dos polos, Esc em duas etapas
  await ctrlRoda(2, -120, 720, 560);
  s = await S(); ok(/zoomando/.test(s.cls) && /aberta/.test(s.cls), 'zoom dentro da regional (' + s.zn + ')');
  await limpo('regional ' + s.zn, 5);
  const selosVis = async () => { await ate(page, () => !document.querySelector('.mt-mapa').classList.contains('mexe') && !document.querySelector('.mt-mapa').classList.contains('voando')); await esp(page, 450); return page.evaluate(() => getComputedStyle(document.querySelector('.mt-selos')).opacity); };
  ok(await selosVis() === '1', 'cartões dos polos acompanham o mapa com pouco zoom');
  const vbA = s.vb;
  await page.mouse.move(700, 520); await page.mouse.down(); await page.mouse.move(520, 470, { steps: 8 }); await page.mouse.up(); await esp(page, 500);
  await limpo('regional depois de arrastar', 3);
  s = await S(); ok(s.vb[0] !== vbA[0], 'arrastar na regional move o mapa');
  await ctrlRoda(3, -120, 720, 560); s = await S();
  ok(await selosVis() === '0' && /zoom-longe/.test(s.cls), 'com mais zoom os cartões dos polos saem de cena (' + s.zn + ')');
  await limpo('regional ' + s.zn, 2);
  await page.keyboard.press('Escape'); await esp(page, 1300);
  s = await S(); ok(!/zoomando/.test(s.cls) && /aberta/.test(s.cls), '1º Esc só enquadra (continua na regional)');
  ok(await selosVis() === '1', 'cartões dos polos de volta');
  // ---- polo → município
  await page.click('.mt-barra .mt-pchip'); await esp(page, 1600);
  s = await S(); ok(/polo/.test(s.cls), 'polo aberto'); const cartPolo = s.cart;
  await ctrlRoda(2, -120, 720, 560);
  s = await S(); ok(/zoomando/.test(s.cls), 'zoom dentro do polo (' + s.zn + ')');
  await limpo('polo ' + s.zn, 1);
  await page.mouse.move(700, 520); await page.mouse.down(); await page.mouse.move(560, 440, { steps: 8 }); await page.mouse.up(); await esp(page, 500);
  await limpo('polo depois de arrastar', 1);
  const cod2 = await maiorNaTela(400, 1100, 300, 800), pt2 = await ponto(cod2); ok(!!pt2, 'ponto clicável no polo ' + cod2);
  await page.mouse.click(pt2[0], pt2[1]); await esp(page, 1800);
  s = await S(); ok(/nivel-mun/.test(s.cls) && !/zoomando/.test(s.cls), 'clique depois do zoom abre o município (rede dos alimentadores)');
  ok(s.cart === 0, 'no município não há cartões de município'); ok(await page.evaluate(() => !!document.querySelector('.mt-redes path[data-al]')), 'a rede dos alimentadores desenhou');
  // zoom no município e foco num alimentador (drill-down) com zoom ligado
  await ctrlRoda(2, -120, 720, 560); s = await S(); ok(/zoomando/.test(s.cls) && /nivel-mun/.test(s.cls), 'zoom dentro do município');
  // arrastar começando em cima da rede de um alimentador NÃO abre o painel dele (1 clique na rede abre a página): o clique depois do arrasto é engolido
  const urlAntes = page.url();
  const pr = await page.evaluate(() => {
    for (const p of document.querySelectorAll('.mt-redes-d path[data-al]')) {
      const L = p.getTotalLength(), s = p.ownerSVGElement;
      for (let k = 1; k < 80; k++) { const q = p.getPointAtLength(L * k / 80), pt = s.createSVGPoint(); pt.x = q.x; pt.y = q.y; const t = pt.matrixTransform(p.getScreenCTM());
        if (t.x > 450 && t.x < 1250 && t.y > 300 && t.y < 800 && document.elementFromPoint(t.x, t.y) === p) return [t.x, t.y]; }
    }
    return null;
  });
  ok(!!pr, 'achou um ponto da rede de um alimentador para arrastar');
  if (pr) { await page.mouse.move(pr[0], pr[1]); await page.mouse.down(); await page.mouse.move(pr[0] - 90, pr[1] + 40, { steps: 8 }); await page.mouse.up(); await esp(page, 800);
    ok(page.url() === urlAntes && /zoomando/.test((await S()).cls), 'arrastar a partir da rede de um alimentador move o mapa e não abre o painel dele'); }
  await page.evaluate(() => document.querySelector('.mt-barra #ativo-res') && 0);
  const al = await page.evaluate(() => (document.querySelector('.mt-redes-d path[data-al]') || {}).dataset.al);
  await page.evaluate(al => window.ARGOS_MAPA.vai({ al }), al); await esp(page, 1800);
  s = await S(); ok(!/zoomando/.test(s.cls) && (await page.evaluate(() => window.ARGOS_MAPA.nivel().al)) === al, 'vai({al}) com zoom ligado: solta o zoom e foca o alimentador ' + al);
  // ← e Esc sobem um nível
  await page.click('.mt-volta'); await esp(page, 1500);
  s = await S(); ok(/nivel-mun/.test(s.cls) && !/zoomando/.test(s.cls), '← do alimentador volta ao município (sem zoom)');
  await page.click('.mt-volta'); await esp(page, 1500); s = await S();
  ok(!/nivel-mun/.test(s.cls) && /polo/.test(s.cls), '← volta do município ao polo'); await esp(page, 300);
  ok((await S()).cart >= 1, 'cartões do polo voltam depois do voo');
  await page.keyboard.press('Escape'); await esp(page, 1500); s = await S();
  ok(!/polo/.test(s.cls) && /aberta/.test(s.cls), 'Esc volta do polo à regional');
  await page.keyboard.press('Escape'); await esp(page, 1500); s = await S();
  ok(!/aberta/.test(s.cls) && s.vb.every((v, i) => Math.abs(v - vb0[i]) < 0.05), 'Esc volta ao estado inteiro, enquadramento original');

  // ---- busca (ARGOS_MAPA.vai e o campo da barra) com o mapa aproximado
  await ctrlRoda(3, -120, 720, 560); s = await S(); ok(/zoomando/.test(s.cls), 'zoom antes da busca');
  await page.click('#lupa'); await page.fill('#ativo-q', 'palmas'); await esp(page, 700);
  ok(/zoomando/.test((await S()).cls), 'digitar na busca não derruba o zoom');
  await page.keyboard.press('Enter'); await esp(page, 2200); s = await S();
  const nv = await page.evaluate(() => window.ARGOS_MAPA.nivel());
  ok(!/zoomando/.test(s.cls) && (nv.reg || nv.pol || nv.mun), 'Enter na busca leva o mapa ao resultado e solta o zoom (' + JSON.stringify(nv) + ')');
  // busca do que já está aberto: com zoom, só enquadra
  await ctrlRoda(2, -120, 720, 560); s = await S(); ok(/zoomando/.test(s.cls), 'zoom dentro do que está aberto');
  await page.evaluate(nv => window.ARGOS_MAPA.vai(nv.pol ? { polo: nv.pol } : nv.reg ? { reg: nv.reg } : {}), nv); await esp(page, 1500); s = await S();
  ok(!/zoomando/.test(s.cls), 'vai() para o mesmo nível já aberto enquadra de volta (não fica preso no zoom)');
  await page.keyboard.press('Escape'); await esp(page, 600);
  while ((await page.evaluate(() => window.ARGOS_MAPA.nivel())).reg) { await page.keyboard.press('Escape'); await esp(page, 1400); }

  // ---- afastar até 1x desliga sozinho
  await ctrlRoda(3, -120, 720, 560); await ctrlRoda(8, 120, 720, 560);
  s = await S(); ok(!/zoomando/.test(s.cls) && s.vb.every((v, i) => Math.abs(v - vb0[i]) < 0.05), 'Ctrl+roda para fora até 1x desliga o zoom');

  // ---- redimensionar a janela com zoom ligado: solta o zoom e o mapa continua inteiro
  await ctrlRoda(3, -120, 720, 560); await page.setViewportSize({ width: 1100, height: 800 }); await esp(page, 900);
  s = await S(); ok(!/zoomando/.test(s.cls) && !s.sw, 'mudar a largura da janela solta o zoom (mapa não fica com tamanho preso)');
  await page.setViewportSize({ width: 1440, height: 900 }); await esp(page, 500);
  ok(erros.length === 0, 'sem erros de JavaScript na página' + (erros.length ? ': ' + erros.join(' | ') : ''));
  await ctx.close();

  // ---- teclado (+ − 0) e movimento reduzido (zoom instantâneo)
  const c2 = await abre(b, 'desk', true, { calmo: true }), p2 = c2.page;
  await p2.focus('.mun[tabindex="0"]');
  await p2.keyboard.press('+'); await p2.keyboard.press('+'); await esp(p2, 300);
  let z = await p2.evaluate(() => document.querySelector('.mt-mapa').className + ' ' + document.querySelector('.mt-zn').textContent);
  ok(/zoomando/.test(z) && /×2,6/.test(z), 'tecla + aproxima (' + z.split(' ').pop() + ') sem animação (movimento reduzido)');
  await p2.keyboard.press('-'); await esp(p2, 300);
  z = await p2.evaluate(() => document.querySelector('.mt-zn').textContent); ok(/×1,6/.test(z), 'tecla - afasta (' + z + ')');
  await p2.keyboard.press('0'); await esp(p2, 500);
  z = await p2.evaluate(() => document.querySelector('.mt-mapa').className); ok(!/zoomando/.test(z), 'tecla 0 enquadra');
  await c2.ctx.close();

  // ---- tela cheia (botão .mt-tc do mapa) com o mapa aproximado: solta o zoom (a largura da caixa muda) e os botões não se sobrepõem
  const c4 = await abre(b, 'desk', true, { calmo: false }), p4 = c4.page;
  const sobrep = () => p4.evaluate(() => { const a = document.querySelector('.mt-tc').getBoundingClientRect(), z = document.querySelector('.mt-zoom').getBoundingClientRect(); return !(a.right <= z.left || z.right <= a.left || a.bottom <= z.top || z.bottom <= a.top); });
  ok(!(await sobrep()), 'botão de tela cheia e botões de zoom não se sobrepõem');
  await p4.mouse.move(720, 560); await p4.keyboard.down('Control'); for (let i = 0; i < 4; i++) { await p4.mouse.wheel(0, -120); await esp(p4, 50); } await p4.keyboard.up('Control'); await esp(p4, 1000);
  ok(/zoomando/.test(await p4.evaluate(() => document.querySelector('.mt-mapa').className)), 'zoom ligado antes da tela cheia');
  await p4.click('.mt-tc'); await esp(p4, 1500);
  const cheio = await p4.evaluate(() => ({ cls: document.querySelector('.mt-mapa').className, cheia: !!(document.fullscreenElement || document.querySelector('#mapa-to.mt-cheia')), sw: document.querySelector('.mt-mapa svg').style.cssText }));
  ok(cheio.cheia, 'tela cheia ligou (' + (cheio.cheia ? 'ok' : 'não') + ')');
  ok(!/zoomando/.test(cheio.cls) && !cheio.sw, 'entrar na tela cheia solta o zoom (o mapa é reenquadrado para a largura nova)');
  await p4.mouse.move(720, 500); await p4.keyboard.down('Control'); for (let i = 0; i < 3; i++) { await p4.mouse.wheel(0, -120); await esp(p4, 50); } await p4.keyboard.up('Control'); await esp(p4, 1000);
  ok(/zoomando/.test(await p4.evaluate(() => document.querySelector('.mt-mapa').className)), 'zoom também funciona dentro da tela cheia');
  await p4.click('.mt-tc'); await esp(p4, 1500);
  ok(!/zoomando/.test(await p4.evaluate(() => document.querySelector('.mt-mapa').className)), 'sair da tela cheia solta o zoom de novo');
  await c4.ctx.close();

  // ---- tema claro: mesmos cartões, sem sobreposição
  const c3b = await abre(b, 'desk', true, { calmo: false, claro: true }), p3 = c3b.page;
  await p3.mouse.move(720, 560); await p3.keyboard.down('Control'); for (let i = 0; i < 5; i++) { await p3.mouse.wheel(0, -120); await esp(p3, 50); } await p3.keyboard.up('Control'); await p3.mouse.move(1420, 520); await esp(p3, 1200);
  const cc = await checaCartoes(p3); ok(cc.n >= 8 && !cc.sobrepoe.length && !cc.comFixo.length && !cc.foraDoMun.length, `tema claro: ${cc.n} cartões sem sobreposição`);
  await c3b.ctx.close(); await b.close();
  console.log(falhas ? `${falhas} FALHA(S)` : 'TODOS OS TESTES PASSARAM');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
