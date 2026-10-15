// Testes de verdade do protótipo (clique, Esc, voltar, celular). Saída: PASSOU/FALHOU por item + testes.log.
// Uso: node testes.js
const L = require('./lib.js');
const fs = require('fs');
const { abre, nivel, esperaVoo } = L;
const log = [];
let falhas = 0;
const ok = (c, msg) => { const l = (c ? 'PASSOU  ' : 'FALHOU  ') + msg; if (!c) falhas++; console.log(l); log.push(l); };
const nota = msg => { console.log('--- ' + msg); log.push('--- ' + msg); };
const cls = (p, c) => p.$eval('.mt-mapa', (e, c) => e.classList.contains(c), c);
const trilha = p => p.$eval('.mt-barra .mt-polos', e => e.innerText.replace(/\s*\n\s*/g, ' '));
const visivel = async (p, s) => { const e = await p.$(s); return !!e && await e.isVisible(); };
const esc = async p => { await p.keyboard.press('Escape'); await esperaVoo(p); };

(async () => {
  const b = await L.chromium.launch();

  nota('S1 · painel esquerdo · computador 1440x900');
  {
    const p = await abre(b, 'd', 's1 s2 s5');
    const r = await p.evaluate(() => { const l = document.querySelector('.mt-regs').getBoundingClientRect(), m = document.querySelector('.mt-mapa').getBoundingClientRect(); return { dentro: !!document.querySelector('.mt-lado .mt-regs'), topo: l.top - m.top, esq: l.left - m.left }; });
    ok(r.dentro && r.topo < 5 && r.esq < 5, `legenda está na coluna esquerda, no topo do mapa (top ${r.topo.toFixed(0)}px, left ${r.esq.toFixed(0)}px do mapa)`);
    ok(await p.evaluate(() => document.querySelector('.mt-regs').getBoundingClientRect().bottom < innerHeight), 'legenda aparece inteira na primeira tela, sem rolar (antes ficava no pé do mapa, abaixo da dobra)');
    await nivel(p, 'regional'); ok(await visivel(p, '.mt-regs'), 'regional: legenda continua visível, sob a seta ←');
    await nivel(p, 'polo'); ok(await visivel(p, '.mt-regs'), 'polo: legenda visível');
    await nivel(p, 'mun');
    ok(!await visivel(p, '.mt-regs'), 'município: legenda some (as cores de NAE não aparecem mais), a lista fica sozinha');
    const sob = await p.evaluate(() => { const a = document.querySelector('.mt-lado').getBoundingClientRect(), r = document.querySelector('.mt-regs').getBoundingClientRect(); return r.width === 0 || a.bottom <= r.top || r.bottom <= a.top; });
    ok(sob, 'lista e legenda não se sobrepõem');
    ok(await p.$$eval('.mt-al', a => a.length) === 46, 'lista com os 46 alimentadores de Palmas');
    await p.click('.mt-al'); await esperaVoo(p);
    ok(await p.$eval('.mt-redes', e => e.classList.contains('foco')) && /LD02059122/.test(await trilha(p)), 'clicar no alimentador dá zoom nele e a trilha mostra o código');
    ok(await p.$eval('.mt-amun', e => e.getAttribute('href').includes('alimentadores/LD02059122')), 'link "Página do alimentador →" aponta para a página dele');
    await esc(p); ok(!await p.$eval('.mt-redes', e => e.classList.contains('foco')) && await cls(p, 'nivel-mun'), 'Esc: sai do foco do alimentador e volta ao município');
    await esc(p); ok(await cls(p, 'polo') && !await cls(p, 'nivel-mun') && await visivel(p, '.mt-regs'), 'Esc: volta ao polo e a legenda reaparece');
    await esc(p); ok(!await cls(p, 'polo') && await cls(p, 'aberta'), 'Esc: volta à regional');
    await p.click('.mt-volta'); await esperaVoo(p); ok(!await cls(p, 'aberta') && await visivel(p, '.mt-regs'), 'botão ←: volta ao estado, legenda no lugar');
    ok(p.erros.length === 0, 'sem erros de JavaScript ' + JSON.stringify(p.erros));
    await p.context().close();
  }

  nota('S1 · gaveta da esquerda · celular 390x844');
  {
    const p = await abre(b, 'm', 's1 s2 s5');
    ok(await p.evaluate(() => { const r = document.querySelector('.mt-regs').getBoundingClientRect(), m = document.querySelector('.mt-mapa').getBoundingClientRect(); return r.left - m.left < 4 && r.width < 40; }), 'legenda: régua de cores colada na esquerda (fechada)');
    await p.tap('.mt-regs summary'); await p.waitForTimeout(300);
    ok(await visivel(p, '.mt-regs-c'), 'tocar na régua abre os rótulos ao lado');
    await p.tap('.mt-regs summary'); await p.waitForTimeout(200);
    await nivel(p, 'mun');
    ok(await visivel(p, '.mt-puxa') && !await visivel(p, '.mt-regs'), 'município: aba "46 alimentadores" na beira esquerda; legenda some');
    const x = await p.$eval('.mt-als', e => e.getBoundingClientRect().right - document.querySelector('.mt-mapa').getBoundingClientRect().left);
    ok(x <= 1, `gaveta fechada fica fora da tela (right ${x.toFixed(0)}px)`);
    ok(await p.$eval('.mt-polos-c', e => getComputedStyle(e).visibility) === 'hidden', 'itens da gaveta fechada não recebem foco do teclado (visibility hidden)');
    await p.tap('.mt-puxa'); await p.waitForTimeout(500);
    const w = await p.$eval('.mt-als', e => e.getBoundingClientRect().width);
    ok(await cls(p, 'nivel-mun') && w > 250 && await visivel(p, '.mt-al'), `tocar na aba abre a gaveta (largura ${w.toFixed(0)}px) com a lista`);
    await esc(p); ok(!await p.$eval('.mt-als', e => e.classList.contains('aberta')) && await cls(p, 'nivel-mun'), 'Esc fecha só a gaveta (continua no município)');
    await p.tap('.mt-puxa'); await p.waitForTimeout(400); await p.tap('.mt-al'); await esperaVoo(p);
    ok(!await p.$eval('.mt-als', e => e.classList.contains('aberta')) && await p.$eval('.mt-redes', e => e.classList.contains('foco')), 'tocar num alimentador: gaveta recolhe e o mapa dá zoom nele');
    ok(/…/.test(await trilha(p)) && /LD02059122/.test(await trilha(p)) && await p.$eval('.mt-barra .mt-polos', e => e.getBoundingClientRect().height) < 60, 'trilha no celular cabe em uma linha: "… › Palmas › LD02059122"');
    await p.tap('.mt-volta'); await esperaVoo(p); ok(!await p.$eval('.mt-redes', e => e.classList.contains('foco')), 'botão ←: sai do foco do alimentador');
    await p.tap('.mt-passo[data-ir="estado"]'); await esperaVoo(p); ok(!await cls(p, 'aberta') && !await visivel(p, '.mt-puxa'), 'toque no "…" da trilha volta direto ao Tocantins');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sem rolagem horizontal');
    ok(p.erros.length === 0, 'sem erros de JavaScript ' + JSON.stringify(p.erros));
    await p.context().close();
  }

  nota('S2 · nada repetido');
  {
    const p = await abre(b, 'd', 's2');
    await nivel(p, 'regional');
    ok(await p.$$eval('.mt-pchip i', a => a.length) === 0 && await p.$$eval('.mt-selos span', a => a.length) === 3, 'regional: NAE de cada polo aparece uma vez (selo no mapa); chips só com o nome');
    ok((await p.$$eval('.mt-pchip', a => a.map(e => e.getAttribute('aria-label')))).every(t => /NAE/.test(t)), 'leitor de tela ainda ouve a NAE no chip (aria-label)');
    await nivel(p, 'polo'); ok(/Palmas\s*434/.test(await trilha(p)), 'polo aberto: a NAE do polo (434) fica só no chip atual (os selos saem)');
    await nivel(p, 'mun');
    const t = await trilha(p); ok(/Polo Palmas › Palmas/.test(t), 'trilha: "Polo Palmas › Palmas" (antes "Palmas › Palmas")');
    ok(await p.$eval('.mt-polos-t', e => e.textContent) === '46 alimentadores', 'título da lista: "46 alimentadores" (sem repetir o nome da trilha)');
    ok(await p.$eval('.mt-amun', e => e.textContent) === 'Página do município →', 'botão: "Página do município →"');
    await p.click('.mt-al'); await esperaVoo(p);
    ok(await p.$eval('.mt-amun', e => e.textContent) === 'Página do alimentador →', 'com o alimentador em foco: "Página do alimentador →" (antes "Abrir LD02059122 →", código 3x na tela)');
    await esc(p); ok(await p.$eval('.mt-amun', e => e.textContent) === 'Página do município →', 'Esc devolve o texto do botão');
    await p.hover('.mt-al'); await p.waitForTimeout(200);
    await p.mouse.move(700, 400); await p.waitForTimeout(300);
    const dica = await p.$eval('.mt-dica', e => e.innerText);
    ok(!/ em Palmas/.test(dica), 'dica ao passar o mouse na rede não repete "em Palmas": ' + JSON.stringify(dica.replace(/\n/g, ' | ')));
    ok(p.erros.length === 0, 'sem erros de JavaScript ' + JSON.stringify(p.erros));
    await p.context().close();
  }

  nota('S3 · tela cheia · tela cheia nativa');
  for (const tela of ['d', 'm']) {
    const p = await abre(b, tela, 's1 s2 s3 s5');
    const W = L.TELAS[tela].width, H = L.TELAS[tela].height;
    await p.evaluate(() => window.scrollTo(0, 220));
    const y0 = await p.evaluate(() => scrollY);
    ok(await visivel(p, '.mt-tc') && await p.$eval('.mt-tc', e => e.getAttribute('aria-pressed')) === 'false', `[${tela}] botão de tela cheia visível no canto do mapa`);
    await (tela === 'm' ? p.tap('.mt-tc') : p.click('.mt-tc')); await p.waitForTimeout(900);
    const d = await p.evaluate(() => ({ fs: !!document.fullscreenElement, cl: document.body.classList.contains('tc-mapa'), r: document.getElementById('mapa-to').getBoundingClientRect().toJSON(), t: document.querySelector('.mt-tc').title, ov: getComputedStyle(document.body).overflow }));
    ok(d.fs && d.cl && d.r.width === W && d.r.height === H, `[${tela}] entra em tela cheia nativa e o mapa ocupa ${W}x${H} (${d.r.width}x${d.r.height})`);
    ok(d.t.includes('Sair') && d.ov === 'hidden', `[${tela}] título do botão vira "${d.t}" e a página não rola por baixo`);
    await nivel(p, 'mun');
    ok(await cls(p, 'nivel-mun') && await visivel(p, tela === 'd' ? '.mt-al' : '.mt-puxa'), `[${tela}] navegar estado → regional → polo → município funciona em tela cheia`);
    await p.click('.mt-volta'); await esperaVoo(p); ok(await cls(p, 'polo') && !await cls(p, 'nivel-mun'), `[${tela}] botão ← sobe um nível dentro da tela cheia`);
    await p.click('.mt-tc'); await p.waitForTimeout(700);
    const e2 = await p.evaluate(() => ({ fs: !!document.fullscreenElement, cl: document.body.classList.contains('tc-mapa'), y: scrollY, max: document.documentElement.scrollHeight - innerHeight, nivel: document.querySelector('.mt-mapa').className }));
    ok(!e2.fs && !e2.cl && Math.abs(e2.y - Math.min(y0, e2.max)) < 4 && /polo/.test(e2.nivel), `[${tela}] sair: volta ao layout normal, rolagem restaurada (${y0} → ${e2.y}; máximo possível agora ${Math.max(0, e2.max)}) e o mapa continua no polo`);
    // saída do sistema (o Esc do navegador em tela cheia nativa chama exitFullscreen)
    await p.click('.mt-tc'); await p.waitForTimeout(700);
    await p.evaluate(() => document.exitFullscreen()); await p.waitForTimeout(700);
    ok(await p.evaluate(() => !document.body.classList.contains('tc-mapa')), `[${tela}] Esc/saída do sistema (exitFullscreen) também desfaz o layout`);
    ok(p.erros.length === 0, `[${tela}] sem erros de JavaScript ` + JSON.stringify(p.erros));
    await p.context().close();
  }
  nota('S3 · tela cheia · sem API nativa (iPhone): só CSS');
  {
    const p = await abre(b, 'm', 's1 s2 s3 s5');
    await p.evaluate(() => { Element.prototype.requestFullscreen = undefined; Element.prototype.webkitRequestFullscreen = undefined; });          // simula o iPhone depois de carregar
    await p.tap('.mt-tc'); await p.waitForTimeout(500);
    ok(await p.evaluate(() => !document.fullscreenElement && document.body.classList.contains('tc-mapa') && document.getElementById('mapa-to').getBoundingClientRect().height === innerHeight), 'sem Fullscreen API: o mapa ocupa a janela por CSS');
    await nivel(p, 'polo');
    await esc(p); ok(await cls(p, 'aberta') && !await cls(p, 'polo') && await p.evaluate(() => document.body.classList.contains('tc-mapa')), 'Esc (CSS): primeiro sobe um nível do mapa (continua em tela cheia)');
    await esc(p); ok(!await cls(p, 'aberta') && await p.evaluate(() => document.body.classList.contains('tc-mapa')), 'Esc: sobe de novo até o estado inteiro');
    await esc(p); ok(await p.evaluate(() => !document.body.classList.contains('tc-mapa')), 'Esc no estado inteiro: sai da tela cheia');
    await p.context().close();
  }

  nota('S4 · busca renovada');
  for (const tela of ['d', 'm']) {
    const p = await abre(b, tela, 's2 s4 s5');
    ok(await p.$eval('#lupa', e => e.innerText.includes('Buscar')), `[${tela}] botão com o olho tem o rótulo "Buscar"`);
    await p.keyboard.press('/'); await p.waitForTimeout(300);
    ok(await p.$eval('#ativo-q', e => !e.hidden && document.activeElement === e), `[${tela}] atalho "/" abre o campo e foca`);
    ok(await p.$$eval('.sug-ex', a => a.length) === 4, `[${tela}] campo vazio mostra 4 exemplos (município, alimentador, ativo, OS)`);
    await p.click('.sug-ex >> nth=1'); await p.waitForTimeout(900);
    ok(await p.$eval('#ativo-q', e => e.value) === 'LD01072001' && await p.$$eval('.sug-op', a => a.length) >= 1, `[${tela}] tocar no exemplo preenche e já busca`);
    await p.fill('#ativo-q', 'a/b'); ok(await p.$eval('#ativo-q', e => e.value) === 'a/b', `[${tela}] "/" dentro do campo continua digitando normal`);
    await p.fill('#ativo-q', ''); await p.waitForTimeout(400); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    ok(await p.$eval('#ativo-q', e => e.hidden), `[${tela}] Esc com o campo vazio (só exemplos) fecha tudo`);
    await p.keyboard.press('/'); await p.fill('#ativo-q', '790000'); await p.waitForTimeout(1200);
    await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown');
    ok(await p.$eval('.sug-op.marcado', e => e.dataset.i) === '1', `[${tela}] setas navegam na lista`);
    await p.keyboard.press('Enter'); await p.waitForTimeout(1500);
    ok(/resultado/i.test(await p.$eval('#ativo-res .res-n', e => e.textContent)) && !/7900001096/.test(await p.$eval('#ativo-res .res-n', e => e.textContent)), `[${tela}] resultado do ativo: cabeçalho sem repetir o código digitado`);
    await p.fill('#ativo-q', 'ETO-RD-GU 000353/2026'); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
    await p.waitForSelector('#ativo-res li a', { timeout: 4000 });
    ok(/^1 OS$/.test(await p.$eval('#ativo-res .res-n', e => e.textContent)), `[${tela}] OS: "1 OS" (antes: "1 OS com o número 353/2026:")`);
    await p.fill('#ativo-q', 'zzzz'); await p.waitForTimeout(700);
    ok(await p.$$eval('.sug-ex', a => a.length) === 4, `[${tela}] "nada encontrado" traz os exemplos`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    ok(await p.$eval('#ativo-res', e => e.innerHTML === ''), `[${tela}] Esc fecha a lista`);
    ok(p.erros.length === 0, `[${tela}] sem erros de JavaScript ` + JSON.stringify(p.erros));
    await p.context().close();
  }

  nota('S5 · a busca voa no mapa');
  {
    const p = await abre(b, 'd', 's1 s2 s4 s5');
    const busca = async txt => { await p.keyboard.press('/'); await p.fill('#ativo-q', txt); await p.waitForTimeout(1000); await p.keyboard.press('Enter'); await esperaVoo(p, 3500); };
    await busca('palmas');
    ok(await cls(p, 'nivel-mun') && /Polo Palmas › Palmas/.test(await trilha(p)), 'município "Palmas": o mapa voa direto estado → município (sem recarregar a página)');
    ok(await p.$eval('#ativo-q', e => e.hidden), 'campo de busca fecha depois de escolher');
    await busca('gurupi');
    ok(await cls(p, 'nivel-mun') && /Sul › Polo Gurupi › Gurupi|Sul.*Gurupi.*Gurupi/.test(await trilha(p)), 'de um município para outro de outra regional (Palmas → Gurupi): troca tudo e termina em Gurupi: ' + await trilha(p));
    await busca('LD01072001');
    ok(await cls(p, 'nivel-mun') && /LD01072001/.test(await trilha(p)) && await p.$eval('.mt-redes', e => e.classList.contains('foco')), 'alimentador LD01072001: vai ao município principal e já dá zoom na rede: ' + await trilha(p));
    await esc(p); await esc(p); await esc(p); await esc(p);
    ok(!await cls(p, 'aberta'), 'Esc ×4 volta ao Tocantins inteiro');
    await busca('palmeirante');
    ok(await cls(p, 'nivel-mun'), 'busca estando no estado inteiro, outro município (Palmeirante)');
    await p.click('.mt-volta'); await esperaVoo(p); await p.click('.mt-volta'); await esperaVoo(p);
    ok(await cls(p, 'aberta') && !await cls(p, 'polo'), 'depois do voo, ← ← volta passo a passo (município → polo → regional)');
    ok(p.erros.length === 0, 'sem erros de JavaScript ' + JSON.stringify(p.erros));
    await p.context().close();

    nota('S5 · duração dos voos (antes 650 ms fixos) e jank');
    for (const [rot, flags] of [['antes', ''], ['depois', 's5']]) {
      const q = await abre(b, 'd', flags);
      await q.evaluate(() => { window.__t = []; const f = t => { const v = document.querySelector('.mt-mapa svg').getAttribute('viewBox'); window.__t.push([t, v]); requestAnimationFrame(f); }; requestAnimationFrame(f); });
      const medir = async (acao, nome) => {
        await q.evaluate(() => { window.__t = []; });
        await acao(); await esperaVoo(q, 3000); await q.waitForTimeout(300);
        const r = await q.evaluate(() => { const a = window.__t; let ini = -1, fim = -1; for (let i = 1; i < a.length; i++) if (a[i][1] !== a[i - 1][1]) { if (ini < 0) ini = i; fim = i; } if (ini < 0) return null; let mx = 0; for (let i = ini; i <= fim; i++) mx = Math.max(mx, a[i][0] - a[i - 1][0]); return { dur: Math.round(a[fim][0] - a[ini][0]), quadros: fim - ini + 1, maxGap: Math.round(mx) }; });
        const l = `${rot.padEnd(6)} ${nome.padEnd(22)} duração ${r && r.dur} ms · ${r && r.quadros} quadros · maior intervalo entre quadros ${r && r.maxGap} ms`;
        console.log('  ' + l); log.push('  ' + l);
      };
      await medir(() => q.click('.mt-regcards button[data-reg="Centro"]'), 'estado → regional');
      await medir(() => q.click('.mt-pchip[data-polo="Palmas"]'), 'regional → polo');
      await medir(() => q.click('.mun.tem[aria-label="Palmas"]', { force: true }), 'polo → município');
      await medir(() => q.click('.mt-al'), 'município → alimentador');
      await medir(() => q.click('.mt-volta'), 'alimentador → município');
      await q.context().close();
    }
    nota('S5 · movimento reduzido');
    const r = await abre(b, 'd', 's1 s2 s5', { reducedMotion: 'reduce' });
    await nivel(r, 'mun'); ok(await cls(r, 'nivel-mun'), 'prefers-reduced-motion: navegação funciona (sem animação)');
    await r.context().close();
  }

  nota('Regressão: com o atributo data-proto ausente o site continua igual (protótipo injetado sem flags)');
  {
    const p = await abre(b, 'd', 'x');
    await nivel(p, 'mun');
    ok(await p.$eval('.mt-polos-t', e => e.textContent) === 'Palmas · 46 alimentadores' && await visivel(p, '.mt-regs'), 'sem flags: título e legenda como no site ao vivo');
    ok(p.erros.length === 0, 'sem erros de JavaScript ' + JSON.stringify(p.erros));
    await p.context().close();
  }
  await b.close();
  fs.writeFileSync(require('path').join(L.RAIZ, 'testes.log'), log.join('\n') + `\n\n${falhas ? falhas + ' FALHA(S)' : 'TUDO PASSOU'}\n`);
  console.log(falhas ? falhas + ' FALHA(S)' : 'TUDO PASSOU');
})();
