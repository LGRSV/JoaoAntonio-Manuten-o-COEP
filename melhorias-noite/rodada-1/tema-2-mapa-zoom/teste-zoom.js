// Teste de comportamento do zoom livre (protótipo): Ctrl+roda, arrastar, botões, clique depois do zoom, Esc e ←.
// Uso: node teste-zoom.js   (usa o site ao vivo + proto/mapa-municipios.js e proto/site.css injetados)
const { lanca, abre, shot } = require('./lib.js');
let falhas = 0;
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) falhas++; };
(async () => {
  const b = await lanca();
  const { ctx, page } = await abre(b, 'desk', true, { calmo: false });
  const S = () => page.evaluate(() => {
    const c = document.querySelector('.mt-mapa'), s = c.querySelector('svg');
    return { cls: c.className, vb: s.getAttribute('viewBox').split(' ').map(Number), zn: c.querySelector('.mt-zn').textContent,
      rot: c.querySelectorAll('.mt-nomesz text').length, prev: c.querySelectorAll('.mt-previa g').length,
      sw: s.style.width, trilha: (document.querySelector('.mt-barra .mt-polos') || {}).textContent || '', url: location.pathname };
  });
  const ponto = cod => page.evaluate(cod => {
    const p = document.querySelector(`.mun[data-cod="${cod}"]`), s = p.ownerSVGElement, m = s.getScreenCTM(), b = p.getBBox();
    for (let i = 1; i < 12; i++) for (let j = 1; j < 12; j++) {
      const x = b.x + b.width * i / 12, y = b.y + b.height * j / 12, pt = s.createSVGPoint(); pt.x = x; pt.y = y;
      if (!p.isPointInFill(pt)) continue;
      const q = pt.matrixTransform(p.getScreenCTM()), r = document.elementFromPoint(q.x, q.y);
      if (r === p) return [q.x, q.y];
    }
    return null;
  }, cod);
  const espera = ms => page.waitForTimeout(ms);
  const ctrlRoda = async (n, dy, x = 720, y = 560) => { await page.mouse.move(x, y); await page.keyboard.down('Control'); for (let i = 0; i < n; i++) { await page.mouse.wheel(0, dy); await espera(50); } await page.keyboard.up('Control'); await espera(1000); };

  let s = await S();
  ok(!/zoomando/.test(s.cls), 'estado inicial sem zoom');
  const vb0 = s.vb;
  // sem Ctrl: a página rola e o mapa não muda
  await page.mouse.move(720, 560); await page.mouse.wheel(0, 150); await espera(300);
  ok(await page.evaluate(() => scrollY) > 0, 'roda sem Ctrl rola a página');
  s = await S(); ok(!/zoomando/.test(s.cls) && s.vb[2] === vb0[2], 'roda sem Ctrl não dá zoom');
  await page.evaluate(() => scrollTo(0, 0));
  // Ctrl+roda aproxima
  await ctrlRoda(5, -120);
  s = await S(); ok(/zoomando/.test(s.cls) && parseFloat(s.zn.replace('×', '').replace(',', '.')) > 2, `Ctrl+roda aproxima (${s.zn}, ${s.rot} nomes, ${s.prev} prévias)`);
  ok(s.rot > 10, 'nomes dos municípios aparecem com o zoom'); ok(s.prev > 0, 'prévia das redes aparece com zoom alto');
  await shot(page, 't-zoom5');
  // arrastar
  const antes = s.vb;
  await page.mouse.move(700, 500); await page.mouse.down(); await page.mouse.move(600, 460, { steps: 8 }); await page.mouse.up(); await espera(300);
  s = await S(); ok(Math.abs(s.vb[0] - antes[0]) > 5, 'arrastar move o mapa'); ok(!/aberta/.test(s.cls), 'arrastar não dispara clique (continua no estado)');
  // botões
  await page.click('.mt-zoom [data-z=mais]'); await espera(900);
  const s2 = await S(); ok(s2.vb[2] < s.vb[2], 'botão + aproxima');
  await page.click('.mt-zoom [data-z=menos]'); await espera(900);
  const s3 = await S(); ok(s3.vb[2] > s2.vb[2], 'botão − afasta');
  // Esc enquadra (1º Esc) sem subir de nível
  await page.keyboard.press('Escape'); await espera(1200);
  s = await S(); ok(!/zoomando/.test(s.cls) && s.vb.every((v, i) => Math.abs(v - vb0[i]) < 0.05), 'Esc enquadra de volta ao estado inteiro (viewBox original)');
  ok(!(await page.evaluate(() => document.querySelector('.mt-mapa svg').style.cssText)), 'estilos inline do zoom removidos');
  // zoom + clique num município: entra na regional como antes
  await ctrlRoda(4, -120, 700, 450);
  s = await S(); ok(/zoomando/.test(s.cls), 'zoom antes do clique');
  const cod = await page.evaluate(() => [...document.querySelectorAll('.mun.tem')].find(p => { const r = p.getBoundingClientRect(); return r.width > 40 && r.height > 40 && r.left > 300 && r.right < 1100 && r.top > 320 && r.bottom < 850 && p.dataset.cod; }).dataset.cod);
  const pt = await ponto(cod); ok(!!pt, 'achou ponto clicável no município ' + cod);
  await page.mouse.click(pt[0], pt[1]); await espera(1500);
  s = await S(); ok(/aberta/.test(s.cls) && !/zoomando/.test(s.cls), 'clique depois do zoom abre a regional e solta o zoom');
  await shot(page, 't-regional');
  // regional: zoom e Esc em duas etapas
  await ctrlRoda(3, -120, 720, 560);
  s = await S(); ok(/zoomando/.test(s.cls) && /aberta/.test(s.cls), 'zoom dentro da regional');
  await page.keyboard.press('Escape'); await espera(1200);
  s = await S(); ok(!/zoomando/.test(s.cls) && /aberta/.test(s.cls), '1º Esc só enquadra (continua na regional)');
  // polo -> município
  await page.click('.mt-barra .mt-pchip'); await espera(1500);
  s = await S(); ok(/polo/.test(s.cls), 'polo aberto');
  await ctrlRoda(3, -120, 720, 560);
  s = await S(); ok(/zoomando/.test(s.cls), 'zoom dentro do polo'); ok(s.rot > 0, 'nomes no polo com zoom (' + s.rot + ')');
  await shot(page, 't-polo-zoom');
  const cod2 = await page.evaluate(() => [...document.querySelectorAll('.mt-polo:not(.fora) .mun.tem')].map(p => { const r = p.getBoundingClientRect(), w = Math.min(r.right, 1100) - Math.max(r.left, 300), h = Math.min(r.bottom, 850) - Math.max(r.top, 300); return { c: p.dataset.cod, a: Math.max(0, w) * Math.max(0, h) }; }).sort((a, b) => b.a - a.a)[0].c);
  const pt2 = await ponto(cod2); ok(!!pt2, 'ponto clicável no polo ' + cod2);
  await page.mouse.click(pt2[0], pt2[1]); await espera(1800);
  s = await S(); ok(/nivel-mun/.test(s.cls) && !/zoomando/.test(s.cls), 'clique depois do zoom abre o município (rede dos alimentadores)');
  await shot(page, 't-municipio');
  // ← sobe um nível; Esc também
  await page.click('.mt-volta'); await espera(1500);
  s = await S(); ok(!/nivel-mun/.test(s.cls) && /polo/.test(s.cls), '← volta do município ao polo');
  await page.keyboard.press('Escape'); await espera(1500);
  s = await S(); ok(!/polo/.test(s.cls) && /aberta/.test(s.cls), 'Esc volta do polo à regional');
  await page.keyboard.press('Escape'); await espera(1500);
  s = await S(); ok(!/aberta/.test(s.cls) && s.vb.every((v, i) => Math.abs(v - vb0[i]) < 0.05), 'Esc volta ao estado inteiro, enquadramento original');
  // afastar até 1× sai do zoom sozinho
  await ctrlRoda(3, -120, 720, 560); await ctrlRoda(8, 120, 720, 560);
  s = await S(); ok(!/zoomando/.test(s.cls) && s.vb.every((v, i) => Math.abs(v - vb0[i]) < 0.05), 'Ctrl+roda para fora até 1× desliga o zoom');
  await ctx.close(); await b.close();
  console.log(falhas ? `${falhas} FALHA(S)` : 'TODOS OS TESTES PASSARAM');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
