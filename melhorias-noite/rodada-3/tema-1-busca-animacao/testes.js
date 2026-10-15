// Testes de verdade (clique, teclado, Voltar, celular) do protótipo da rodada 3 / tema 1, sobre a base atual (/teste/ = alimentador/site/).
// Uso: node testes.js [historico-d|historico-m|cheia-d|cheia-m|extras|repeticoes|defeitos|estresse]   (CLARO=1 para o tema claro)  | tee testes.log
// Tela cheia: nativa (Chromium) e só CSS (Fullscreen API removida, como no iPhone). Histórico: Voltar/Avançar, Esc, ←, trilha, busca, link com endereço.
const L = require('./lib.js');
const { chromium, nivel, esperaVoo, nivelAtual } = L;
const CLARO = process.env.CLARO === '1', SUF = CLARO ? '-claro' : '';
const abre = (b, tl, o = {}) => L.abre(b, tl, { claro: CLARO, ...o });
const foto = (p, n, o) => L.foto(p, n + SUF, o);
let ok = 0, falhas = [];
const t = (nome, cond, det = '') => { if (cond) { ok++; console.log('  ok   ' + nome); } else { falhas.push(nome); console.log('  FALHOU ' + nome + (det ? '  → ' + JSON.stringify(det) : '')); } };
const T = titulo => console.log('\n## ' + titulo);
const tela = async p => p.evaluate(() => ({ fs: !!(document.fullscreenElement || document.webkitFullscreenElement), css: document.getElementById('mapa-to').classList.contains('mt-cheia'), hash: location.hash, len: history.length, idx: navigation.currentEntry.index, y: scrollY,
  svg: (r => [Math.round(r.width), Math.round(r.height)])(document.querySelector('.mt-mapa svg').getBoundingClientRect()), on: !!(document.fullscreenElement || document.webkitFullscreenElement) || document.getElementById('mapa-to').classList.contains('mt-cheia'), pressed: String(/Sair/.test(document.querySelector('.mt-tc').getAttribute('aria-label'))), rolaX: document.documentElement.scrollWidth > innerWidth }));
const abreBusca = async p => { if (await p.$eval('#ativo-q', e => e.hidden)) await p.click('#lupa'); else await p.click('#ativo-q'); await p.waitForTimeout(150); };
const nv = async p => (n => `${n.reg || ''}/${n.pol || ''}/${n.mun || ''}/${n.al || ''}`)(await nivelAtual(p));
const volta = async (p, ms = 1100) => { await p.goBack(); await esperaVoo(p); await p.waitForTimeout(ms - 700 > 0 ? ms - 700 : 0); };
const frente = async p => { await p.goForward(); await esperaVoo(p); };
const SEM_FS = () => { for (const k of ['requestFullscreen', 'webkitRequestFullscreen']) { try { Element.prototype[k] = undefined; } catch (e) {} } };
const MUN = '1721000', AL = 'LD02059122';

async function historico(b, tl) {
  T(`Histórico · ${tl === 'd' ? 'computador 1440x900' : 'celular 390x844 (toque)'}`);
  const p = await abre(b, tl, { proto: true });
  t('sem erros de JavaScript ao carregar', p.erros.length === 0, p.erros);
  let s = await tela(p); t('estado inteiro: sem hash', s.hash === '' && await nv(p) === '///', s.hash);
  const len0 = s.len;
  await nivel(p, 'regional'); s = await tela(p); t('regional → #centro', s.hash === '#centro', s.hash);
  await nivel(p, 'polo'); s = await tela(p); t('polo → #centro/palmas', s.hash === '#centro/palmas', s.hash);
  await nivel(p, 'mun'); s = await tela(p); t('município → #centro/palmas/palmas', s.hash === '#centro/palmas/palmas', s.hash);
  await nivel(p, 'alimentador'); s = await tela(p); t(`alimentador → #centro/palmas/palmas/${AL}`, s.hash === `#centro/palmas/palmas/${AL}`, s.hash);
  t('cada descida empilhou uma entrada (4 níveis = +4)', s.len === len0 + 4, [len0, s.len]);
  t('título da aba acompanha o nível', (await p.title()).startsWith(AL), await p.title());
  // Voltar sobe um nível por vez
  await volta(p); t('Voltar 1: alimentador → município (mapa e endereço)', await nv(p) === `Centro/Palmas/${MUN}/` && (await tela(p)).hash === '#centro/palmas/palmas', [await nv(p), (await tela(p)).hash]);
  await volta(p); t('Voltar 2: município → polo', await nv(p) === 'Centro/Palmas//' && (await tela(p)).hash === '#centro/palmas', await nv(p));
  await volta(p); t('Voltar 3: polo → regional', await nv(p) === 'Centro///' , await nv(p));
  await volta(p); t('Voltar 4: regional → estado inteiro', await nv(p) === '///' && (await tela(p)).hash === '', await nv(p));
  t('depois de tudo isso o mapa voltou ao enquadramento do estado (cartões de regionais visíveis)', await p.$eval('.mt-regcards button', e => getComputedStyle(e).opacity) === '1');
  await frente(p); t('Avançar desce de novo (regional)', await nv(p) === 'Centro///', await nv(p));
  await frente(p); await frente(p); await frente(p);
  t('Avançar ×4 chega ao alimentador', await nv(p) === `Centro/Palmas/${MUN}/${AL}`, await nv(p));
  t('sem erros de JavaScript durante Voltar/Avançar', p.erros.length === 0, p.erros);

  // Esc e ← sobem reaproveitando o Voltar: não empilham, e Voltar depois NÃO desce de novo
  await volta(p); await volta(p); await volta(p); await volta(p);      // estado
  await nivel(p, 'polo'); const L1 = (await tela(p)).len;
  await p.keyboard.press('Escape'); await esperaVoo(p);
  s = await tela(p); t('Esc no polo → regional, endereço #centro', await nv(p) === 'Centro///' && s.hash === '#centro', [await nv(p), s.hash]);
  await p.waitForTimeout(300); s = await tela(p); t('Esc não empilhou entrada', s.len === L1, [L1, s.len]);
  await volta(p); t('Voltar depois do Esc vai ao estado (não desce de novo ao polo)', await nv(p) === '///', await nv(p));
  await nivel(p, 'mun'); await p.mouse.click(3, 3); await p.waitForTimeout(300);      // (no celular a lista dos alimentadores cobre a trilha: toque fora fecha)
  await p.click('.mt-volta'); await esperaVoo(p); await p.waitForTimeout(300);
  t('← (na trilha) sobe município → polo e o Voltar seguinte vai a regional', await nv(p) === 'Centro/Palmas//', await nv(p));
  await volta(p); t('Voltar depois da ← → regional', await nv(p) === 'Centro///', await nv(p));
  // trilha: saltar vários níveis empilha (Voltar devolve ao nível fundo)
  await nivel(p, 'alimentador');
  await p.mouse.click(3, 3); await p.waitForTimeout(300);
  const salto = tl === 'm' ? 'polo' : 'estado';      // no celular a trilha começa no polo (Tocantins e a regional saem: a seta ← e o Voltar levam até lá)
  await p.click(`.mt-passo[data-ir="${salto}"]`); await esperaVoo(p); await p.waitForTimeout(300);
  s = await tela(p); t(`trilha: salto de vários níveis até "${salto}" ${salto === 'estado' ? 'limpa' : 'corrige'} o endereço`, await nv(p) === (salto === 'estado' ? '///' : 'Centro/Palmas//') && s.hash === (salto === 'estado' ? '' : '#centro/palmas'), [await nv(p), s.hash]);
  await volta(p, 1400); t('Voltar depois do salto devolve ao alimentador de onde saiu', await nv(p) === `Centro/Palmas/${MUN}/${AL}`, await nv(p));
  // busca: voo por vários níveis = uma só entrada
  await p.goto(L.BASE, { waitUntil: 'networkidle' }); await p.waitForTimeout(400);
  const I2 = (await tela(p)).idx;
  await abreBusca(p); await p.keyboard.type('Lagoa da Confusão'); await p.waitForSelector('#ativo-res .so-mun', { timeout: 15000 });
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await esperaVoo(p, 3500); await p.waitForTimeout(500);
  s = await tela(p); const n1 = await nivelAtual(p);
  t('busca "Lagoa da Confusão" leva o mapa ao município', !!n1.mun && s.hash.startsWith('#centro/paraiso/lagoa-da-confusao'), [n1, s.hash]);
  t('o voo da busca (estado → município) empilhou UMA entrada', s.idx === I2 + 1, [I2, s.idx]);
  await volta(p, 1400); t('Voltar depois da busca volta ao estado inteiro', await nv(p) === '///', await nv(p));
  // busca de alimentador: um só passo no histórico também
  const I3 = (await tela(p)).idx;
  await abreBusca(p); await p.keyboard.type('LD01072001'); await p.waitForFunction(() => /LD01072001/.test((document.querySelector('#ativo-res .sug-op') || {}).innerText || ''), null, { timeout: 15000 });
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await esperaVoo(p, 4000); await p.waitForTimeout(1200);
  s = await tela(p); const n2 = await nivelAtual(p);
  t('busca de alimentador abre já com o alimentador em foco e endereço completo', n2.al === 'LD01072001' && s.hash.endsWith('/LD01072001'), [n2, s.hash]);
  t('...com uma só entrada nova', s.idx === I3 + 1, [I3, s.idx]);
  // mexer no endereço à mão
  await p.evaluate(() => { location.hash = '#sul'; }); await esperaVoo(p, 3000);
  t('trocar o hash à mão (#sul) leva o mapa à regional Sul', await nv(p) === 'Sul///', await nv(p));
  await p.close();

  // abrir o link já no nível certo
  T(`Link com endereço · ${tl}`);
  const casos = [['#norte', 'Norte///'], ['#centro/palmas', 'Centro/Palmas//'], ['#centro/palmas/palmas', `Centro/Palmas/${MUN}/`], [`#centro/palmas/palmas/${AL}`, `Centro/Palmas/${MUN}/${AL}`],
    [`#centro/palmas/palmas/${AL.toLowerCase()}`, `Centro/Palmas/${MUN}/${AL}`], ['#centro/PALMAS/Palmas', `Centro/Palmas/${MUN}/`]];
  for (const [h, esperado] of casos) {
    const q = await abre(b, tl, { proto: true, hash: h });
    await esperaVoo(q, 4000); await q.waitForTimeout(800);
    t(`abrir ${h} cai em ${esperado}`, await nv(q) === esperado, await nv(q));
    t(`  ${h}: sem erros, sem rolagem lateral`, q.erros.length === 0 && !(await tela(q)).rolaX, q.erros);
    await q.context().close();
  }
  // links inválidos: cai no nível válido mais fundo e a barra é corrigida
  const inv = [['#centro/xyz', 'Centro///', '#centro'], ['#centro/palmas/xyz', 'Centro/Palmas//', '#centro/palmas'], [`#centro/palmas/palmas/ZZ999`, `Centro/Palmas/${MUN}/`, '#centro/palmas/palmas'], ['#sul/palmas', 'Sul///', '#sul'], ['#zzz', '///', '#zzz']];
  for (const [h, esperado, corrigido] of inv) {
    const q = await abre(b, tl, { proto: true, hash: h });
    await esperaVoo(q, 4000); await q.waitForTimeout(500);
    const s2 = await tela(q);
    t(`link inválido ${h} → ${esperado}, barra ${corrigido}`, await nv(q) === esperado && s2.hash === corrigido && q.erros.length === 0, [await nv(q), s2.hash, q.erros]);
    await q.context().close();
  }
  // Voltar num link aberto direto: sai do site (entrada anterior) em vez de ficar preso
  {
    const ctx = await b.newContext({ viewport: L.TELAS[tl], hasTouch: tl === 'm', isMobile: tl === 'm' });
    const q0 = await ctx.newPage(); await q0.goto('about:blank');
    const q = await abre(b, tl, { proto: true, hash: '#centro/palmas', ctx });
    await esperaVoo(q, 4000);
    t('link #centro/palmas aberto direto: histórico não ganhou entradas extras', (await tela(q)).len === 2, (await tela(q)).len);
    await q.goBack(); await q.waitForTimeout(500);
    t('Voltar num link aberto direto sai do site (comportamento normal do navegador)', q.url() === 'about:blank', q.url());
    await ctx.close();
  }
}

async function telaCheia(b, tl, modo) {
  const nat = modo === 'nativa';
  T(`Tela cheia ${nat ? 'nativa' : 'só CSS (sem Fullscreen API, como no iPhone)'} · ${tl === 'd' ? 'computador' : 'celular'}`);
  const ctx = await b.newContext({ viewport: L.TELAS[tl], hasTouch: tl === 'm', isMobile: tl === 'm' });
  if (!nat) await ctx.addInitScript(SEM_FS);
  const p = await abre(b, tl, { proto: true, ctx });
  const W = L.TELAS[tl].width, H = L.TELAS[tl].height;
  t('botão existe, fora da tela cheia: rótulo "Mapa em tela cheia"', await p.$eval('.mt-tc', e => /Mapa em tela cheia/i.test(e.getAttribute('aria-label'))));
  const caixaBtn = await p.$eval('.mt-tc', e => { const r = e.getBoundingClientRect(); return [r.width, r.height]; });
  t('alvo de toque ≥ 40x40', caixaBtn[0] >= 40 && caixaBtn[1] >= 40, caixaBtn);
  await p.evaluate(() => window.scrollTo(0, 120)); await p.waitForTimeout(100);
  const y0 = await p.evaluate(() => scrollY);
  const tap = () => tl === 'm' ? p.tap('.mt-tc') : p.click('.mt-tc');
  await tap(); await p.waitForTimeout(700);
  let s = await tela(p);
  await tap(); await p.waitForTimeout(900);            // sai logo: a rolagem de antes tem de voltar (no estado inteiro a página tem altura para isso)
  const s1 = await tela(p); t('rolagem da página volta ao lugar de antes ao sair (y=' + y0 + ')', !s1.on && Math.abs(s1.y - y0) <= 2, [y0, s1.y]);
  await tap(); await p.waitForTimeout(700); s = await tela(p);
  t(`entrou: layout em tela cheia (${nat ? 'nativa' : 'CSS'})`, s.on && (nat ? s.fs : !s.fs), s);
  t('mapa ocupa quase a janela inteira', s.svg[0] >= W - 40 && s.svg[1] >= H - 130, s.svg);
  t('rótulo vira "Sair da tela cheia" e a página não rola por baixo', s.pressed === 'true' && (nat || await p.evaluate(() => getComputedStyle(document.body).overflow === 'hidden')));
  t('sem rolagem lateral', !s.rolaX);
  await foto(p, `t-${tl}-${modo}-cheia`);
  // navegar dentro da tela cheia
  await nivel(p, 'mun'); await foto(p, `t-${tl}-${modo}-cheia-mun`);
  s = await tela(p); t('navegar até o município dentro da tela cheia (clique) mantém a tela cheia', s.on && (nat ? s.fs : true) && await nv(p) === `Centro/Palmas/${MUN}/`);
  // dica (hover) e busca dentro da tela cheia
  await abreBusca(p); await p.waitForTimeout(400);
  const lista = await p.$eval('#ativo-res', e => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom), e.innerHTML.length > 0]; });
  t('a lista da busca abre dentro da tela cheia, sem cortar', lista[4] && lista[0] >= 0 && lista[2] <= W && lista[3] <= H, lista);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  t('Esc fecha a lista da busca primeiro, sem sair da tela cheia nem subir nível', (await tela(p)).on && await nv(p) === `Centro/Palmas/${MUN}/`);
  // Shift+K (Night shift) dentro da tela cheia
  const tema0 = await p.evaluate(() => document.documentElement.dataset.theme);
  await p.evaluate(() => document.activeElement && document.activeElement.blur()); await p.keyboard.press('Shift+K'); await p.waitForTimeout(300);
  const tema1 = await p.evaluate(() => document.documentElement.dataset.theme);
  t('Shift+K troca o tema (Night shift) dentro da tela cheia', tema0 !== tema1, [tema0, tema1]);
  await foto(p, `t-${tl}-${modo}-cheia-claro`);
  await p.keyboard.press('Shift+K'); await p.waitForTimeout(300);
  // F fora e dentro de campo
  await abreBusca(p); await p.keyboard.type('f'); s = await tela(p);
  t('digitar "f" no campo da busca NÃO alterna a tela cheia', s.on && await p.$eval('#ativo-q', e => e.value) === 'f');
  await p.fill('#ativo-q', ''); await p.waitForTimeout(400); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  // sair pelo botão
  await p.evaluate(() => document.activeElement && document.activeElement.blur());
  await tap(); await p.waitForTimeout(900);
  s = await tela(p);
  t('saiu pelo botão: layout normal, rótulo "Mapa em tela cheia"', !s.on && !s.fs && s.pressed === 'false', s);
  t('nível do mapa preservado ao sair (município)', await nv(p) === `Centro/Palmas/${MUN}/`, await nv(p));
  await foto(p, `t-${tl}-${modo}-saiu`);
  // entrar de novo e sair com F
  await p.keyboard.press('f'); await p.waitForTimeout(600); s = await tela(p); t('F entra na tela cheia', s.on);
  await p.keyboard.press('f'); await p.waitForTimeout(700); s = await tela(p); t('F sai da tela cheia', !s.on && !s.fs, s);
  // Esc
  await tap(); await p.waitForTimeout(600);
  if (nat) {
    await p.evaluate(() => document.exitFullscreen()); await p.waitForTimeout(700);      // o Esc do navegador chama isto
    s = await tela(p); t('Esc / saída nativa (exitFullscreen) desfaz o layout e mantém o nível', !s.on && !s.fs && await nv(p) === `Centro/Palmas/${MUN}/`, [s, await nv(p)]);
    await p.keyboard.press('Escape'); await esperaVoo(p); await p.waitForTimeout(300);
    t('o Esc seguinte (fora da tela cheia) sobe um nível: município → polo', await nv(p) === 'Centro/Palmas//', await nv(p));
  } else {
    await p.keyboard.press('Escape'); await p.waitForTimeout(500);
    s = await tela(p); t('só CSS: Esc sai da tela cheia primeiro (igual ao nativo), sem subir nível', !s.on && await nv(p) === `Centro/Palmas/${MUN}/`, [s, await nv(p)]);
    await tap(); await p.waitForTimeout(500);
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);   // sai
    await p.keyboard.press('Escape'); await esperaVoo(p); await p.waitForTimeout(400);
    t('só CSS: o Esc seguinte sobe um nível', await nv(p) === 'Centro/Palmas//', await nv(p));
  }
  // Voltar do navegador dentro da tela cheia
  if (nat) {
    await nivel(p, 'polo'); await tap(); await p.waitForTimeout(600); await nivel(p, 'mun');
    await p.goBack(); await esperaVoo(p); s = await tela(p);
    t('nativa: Voltar dentro da tela cheia sobe um nível (município → polo) e continua em tela cheia', await nv(p) === 'Centro/Palmas//' && s.on && s.fs, [await nv(p), s]);
  }
  await ctx.close();
  if (!nat) {   // fluxo completo do gesto Voltar no modo só CSS
    const c2 = await b.newContext({ viewport: L.TELAS[tl], hasTouch: tl === 'm', isMobile: tl === 'm' }); await c2.addInitScript(SEM_FS);
    const q = await abre(b, tl, { proto: true, ctx: c2 });
    await nivel(q, 'regional');
    const hl = (await tela(q)).len;
    await (tl === 'm' ? q.tap('.mt-tc') : q.click('.mt-tc')); await q.waitForTimeout(500);
    s = await tela(q); t('só CSS: entrar na tela cheia empilha 1 entrada sentinela', s.len === hl + 1 && s.on, [hl, s.len]);
    await q.goBack(); await q.waitForTimeout(600); s = await tela(q);
    t('só CSS: gesto Voltar SAI da tela cheia (não sobe nível nem sai da página)', !s.on && await nv(q) === 'Centro///' && s.hash === '#centro', [s, await nv(q)]);
    await (tl === 'm' ? q.tap('.mt-tc') : q.click('.mt-tc')); await q.waitForTimeout(500);
    await (tl === 'm' ? q.tap('.mt-tc') : q.click('.mt-tc')); await q.waitForTimeout(700); s = await tela(q);
    t('só CSS: entrar e sair pelo botão não deixa entrada sobrando', !s.on && s.len === hl + 1 || s.len === hl, [hl, s.len]);
    await q.goBack(); await esperaVoo(q); await q.waitForTimeout(300);
    t('só CSS: Voltar depois disso vai ao estado inteiro (nenhum Voltar "morto")', await nv(q) === '///', [await nv(q), (await tela(q)).len]);
    // níveis percorridos DENTRO da tela cheia: cada Voltar sobe um nível; só ao chegar antes da tela cheia ela fecha
    await nivel(q, 'polo');
    await (tl === 'm' ? q.tap('.mt-tc') : q.click('.mt-tc')); await q.waitForTimeout(500);
    await nivel(q, 'mun');
    await q.goBack(); await esperaVoo(q); s = await tela(q);
    t('só CSS: Voltar na tela cheia sobe município → polo e CONTINUA em tela cheia', s.on && await nv(q) === 'Centro/Palmas//', [s, await nv(q)]);
    await q.goBack(); await q.waitForTimeout(500); s = await tela(q);
    t('só CSS: Voltar seguinte (chegou antes da tela cheia): SAI da tela cheia, nível preservado (polo)', !s.on && await nv(q) === 'Centro/Palmas//', [s, await nv(q)]);
    t('sem erros de JavaScript', q.erros.length === 0, q.erros);
    await c2.close();
  }
}

async function negada(b, tl) {                                   // a API existe mas é recusada (iframe sem allow=fullscreen, p.ex.): cai no CSS
  T(`Tela cheia negada pelo navegador · ${tl}`);
  const ctx = await b.newContext({ viewport: L.TELAS[tl], hasTouch: tl === 'm', isMobile: tl === 'm' });
  await ctx.addInitScript(() => { Element.prototype.requestFullscreen = () => Promise.reject(new TypeError('negado')); Element.prototype.webkitRequestFullscreen = undefined; });
  const p = await abre(b, tl, { proto: true, ctx });
  await p.click('.mt-tc'); await p.waitForTimeout(600);
  const s = await tela(p);
  t('API recusada → continua em tela cheia por CSS', s.on && !s.fs, s);
  await p.click('.mt-tc'); await p.waitForTimeout(500); t('e o botão sai normalmente', !(await tela(p)).on);
  t('sem erros de JavaScript', p.erros.length === 0, p.erros);
  await ctx.close();
}

async function extras(b) {
  T('Paisagem no celular (844x390) em tela cheia');
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const p = await abre(b, 'm', { proto: true, ctx });
  await p.tap('.mt-tc'); await p.waitForTimeout(600);
  const s = await tela(p);
  t('mapa ocupa a janela em paisagem', s.on && s.svg[1] >= 390 - 130 && !s.rolaX, s);
  await foto(p, 't-paisagem-cheia-estado');
  await nivel(p, 'polo'); await foto(p, 't-paisagem-cheia-polo');
  await ctx.close();

  T('Movimento reduzido');
  const c2 = await b.newContext({ viewport: L.TELAS.d, reducedMotion: 'reduce' });
  const q = await abre(b, 'd', { proto: true, ctx: c2 });
  await nivel(q, 'polo'); await q.goBack(); await q.waitForTimeout(300);
  t('com movimento reduzido o Voltar sobe sem esperar animação', await nv(q) === 'Centro///', await nv(q));
  t('sem erros', q.erros.length === 0, q.erros);
  await c2.close();

  T('Regressão: o site SEM o protótipo (base atual) — o que já existe e o que falta');
  const r = await abre(b, 'd', { proto: false });
  await nivel(r, 'mun');
  t('base atual: botão de tela cheia já existe; o endereço NÃO muda ao navegar (sem histórico)', !!(await r.$('.mt-tc')) && await r.evaluate(() => location.hash === '' && history.length <= 2), await r.evaluate(() => [location.hash, history.length]));
  t('base atual: sem erros', r.erros.length === 0, r.erros);
  await r.close();
  // sem o mapa-extras.js, só com os diffs de mapa-municipios/busca/css: nada quebra e não há histórico
  const r2 = await abre(b, 'd', { proto: true });
  await r2.evaluate(() => {});
  t('proto: window.ARGOS_EXTRAS definido (mapa-extras.js carregou)', await r2.evaluate(() => window.ARGOS_EXTRAS === true));
  await r2.close();
}

const cobertoPor = (p, sel) => p.$eval(sel, e => { const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, t = document.elementFromPoint(x, y); return !!t && (t === e || e.contains(t)); });
async function repeticoes(b) {
  T('Dados repetidos e defeitos (protótipo)');
  for (const tl of ['d', 'm']) {
    const p = await abre(b, tl, { proto: true });
    await nivel(p, 'regional');
    t(`${tl}: regional — sem botões/chips de polo na barra (nome do polo só no cartão do mapa)`, !(await p.$('.mt-pchip')) && (await p.$$('.mt-selos button.mt-pm')).length === 3);
    t(`${tl}: regional — a barra diz só "Tocantins › Centro"`, /^←?\s*Tocantins\s*›\s*Centro$/.test((await p.$eval('.mt-polos', e => e.innerText)).replace(/\s+/g, ' ').trim()), await p.$eval('.mt-polos', e => e.innerText));
    t(`${tl}: regional — ← é o 1º item do grupo da trilha, dentro da barra`, await p.$eval('.mt-polos', e => e.firstElementChild.classList.contains('mt-volta') && !!e.closest('.mt-barra')));
    t(`${tl}: regional — o cartão do polo recebe o clique (elementFromPoint é o próprio botão)`, await cobertoPor(p, '.mt-selos .mt-pm[data-polo="Palmas"]'));
    await p.click('.mt-selos .mt-pm[data-polo="Palmas"]'); await esperaVoo(p);
    t(`${tl}: DEFEITO 2 corrigido: clicar no cartão do polo abre o polo`, await nv(p) === 'Centro/Palmas//', await nv(p));
    t(`${tl}: trilha do polo: "Polo Palmas"`, /Polo Palmas/.test(await p.$eval('.mt-polos', e => e.innerText)));
    await p.keyboard.press('Escape'); await esperaVoo(p);
    await p.focus('.mt-selos .mt-pm[data-polo="Paraíso"]'); await p.keyboard.press('Enter'); await esperaVoo(p);
    t(`${tl}: cartão do polo abre por teclado (Enter)`, await nv(p) === 'Centro/Paraíso//', await nv(p));
    await p.keyboard.press('Escape'); await esperaVoo(p);
    await p.focus('.mt-selos .mt-pm[data-polo="Porto Nacional"]'); await p.keyboard.press('Space'); await esperaVoo(p);
    t(`${tl}: cartão do polo abre por teclado (Espaço)`, await nv(p) === 'Centro/Porto Nacional//', await nv(p));
    // lista da busca (campo vazio): sem o contexto que o título/trilha já dizem
    await p.keyboard.press('Escape'); await esperaVoo(p);
    await p.click('#lupa'); await p.waitForTimeout(400);
    const lp = await p.$$eval('#ativo-res .so-polo', ls => ls.map(l => ({ x: l.innerText.replace(/\n/g, ' | '), nae: !!l.querySelector('.so-n') })));
    t(`${tl}: lista do campo vazio na regional — polos sem "Regional Centro" repetido na linha, NAE mantida`, lp.length === 3 && lp.every(l => !/Regional|Centro/.test(l.x) && l.nae), lp);
    await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
    await nivel(p, 'polo');
    await p.click('#lupa'); await p.waitForTimeout(400);
    const linhas = await p.$$eval('#ativo-res .so-mun', ls => ls.map(l => ({ x: l.innerText.replace(/\n/g, ' | '), nae: !!l.querySelector('.so-n') })));
    t(`${tl}: lista do campo vazio no polo — municípios sem "Polo Palmas · Centro" em cada linha, NAE mantida`, linhas.length > 5 && linhas.every(l => !/Polo|Centro/.test(l.x) && l.nae), linhas.slice(0, 2));
    t(`${tl}: busca digitada AINDA traz o contexto (sem trilha para dizer onde fica)`, await (async () => { await p.fill('#ativo-q', 'palmas'); await p.waitForSelector('#ativo-res .so-polo, #ativo-res .so-mun', { timeout: 5000 }); await p.waitForTimeout(300); return /Regional Centro|Polo Palmas/.test(await p.$eval('#ativo-res', e => e.innerText)); })());
    await p.fill('#ativo-q', ''); await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.mouse.click(3, 3);
    await nivel(p, 'mun'); if (!await p.$eval('#ativo-res', e => e.innerHTML.length > 0)) { await p.click('#lupa'); await p.waitForTimeout(400); }
    t(`${tl}: município — trilha "Polo Palmas › Palmas" (não "Palmas › Palmas")`, /Polo Palmas\s*›\s*Palmas/.test((await p.$eval('.mt-polos', e => e.innerText)).replace(/\s+/g, ' ')), await p.$eval('.mt-polos', e => e.innerText));
    { const ab = await p.$eval('#ativo-res', e => e.innerHTML.length > 0), vis = await cobertoPor(p, '.mt-volta'); t(`${tl}: DEFEITO 1 corrigido: com a lista dos alimentadores aberta a seta ← continua visível e clicável`, ab && vis, { listaAberta: ab, setaVisivel: vis }); }
    const mesma = await p.evaluate(() => { const e = document.querySelector('.mt-polos').getBoundingClientRect(), l = document.querySelector('#lupa').getBoundingClientRect(); return [Math.round(e.top), Math.round(e.bottom), Math.round(l.top), Math.round(l.bottom)]; });
    t(`${tl}: município — a trilha cabe na linha do olho (a lista embaixo não a cobre)`, mesma[1] <= mesma[3] + 8 && mesma[0] >= mesma[2] - 8, mesma);
    await p.click('.mt-volta'); await esperaVoo(p);
    t(`${tl}: clicar na ← da barra sobe município → polo`, await nv(p) === 'Centro/Palmas//', await nv(p));
    await nivel(p, 'alimentador'); await p.mouse.click(3, 3);
    const m2 = await p.evaluate(() => { const e = document.querySelector('.mt-polos').getBoundingClientRect(), l = document.querySelector('#lupa').getBoundingClientRect(); return [Math.round(e.top), Math.round(e.bottom), Math.round(l.top), Math.round(l.bottom), Math.round(e.right), innerWidth]; });
    t(`${tl}: alimentador em foco — trilha na linha do olho e dentro da janela`, m2[4] <= m2[5] && (tl === 'd' || m2[1] <= m2[3] + 8), m2);
    t(`${tl}: alimentador em foco — a ← está visível`, await cobertoPor(p, '.mt-volta'));
    await p.close();
  }
  // balão do município (computador: passa o mouse; o celular emulado também recebe mousemove)
  for (const tl of ['d', 'm']) {
    const p = await abre(b, tl, { proto: true });
    const sobre = async nome => {
      const pt = await p.$eval(`.mun.tem[aria-label="${nome}"]`, e => { const r = e.getBoundingClientRect(); for (const [fx, fy] of [[.5, .35], [.5, .5], [.4, .6], [.6, .4], [.3, .5]]) { const q = new DOMPoint(0, 0); const x = r.left + r.width * fx, y = r.top + r.height * fy; if (document.elementFromPoint(x, y) === e) return { x, y }; } const r2 = e.getBoundingClientRect(); return { x: r2.left + r2.width / 2, y: r2.top + r2.height / 2 }; });
      await p.mouse.move(pt.x, pt.y, { steps: 3 }); await p.waitForTimeout(250);
      return p.$eval('.mt-dica', e => ({ txt: e.innerText.replace(/\n/g, ' | '), on: getComputedStyle(e).display !== 'none' }));
    };
    let d = await sobre('Rio Sono');
    t(`${tl}: estado — balão diz regional, polo e o convite (sem repetir o nome da regional)`, d.on && /Rio Sono/.test(d.txt) && /Regional Centro/.test(d.txt) && /Polo Palmas/.test(d.txt) && !/regional Centro|Regional Centro\W*$/.test(d.txt.split('|').slice(-1)[0]), d);
    await nivel(p, 'regional'); d = await sobre('Rio Sono');
    t(`${tl}: regional aberta — balão sem "Regional Centro" (a trilha já diz) e com o nome + NAE (não há cartão de município)`, d.on && !/Regional Centro/.test(d.txt) && /Rio Sono/.test(d.txt) && /NAE/.test(d.txt) && /alimentadores/.test(d.txt), d);
    await nivel(p, 'polo'); d = await sobre('Rio Sono');
    t(`${tl}: polo aberto — balão SEM nome, NAE e regional (o cartão do município e a trilha já dizem)`, d.on && !/Rio Sono|NAE|Regional|Palmas/.test(d.txt.replace(/Clique.*/, '')) && /2 alimentadores/.test(d.txt), d);
    // DEFEITO 3: o balão não cobre o cartão do município
    let cobre = 0, n = 0;
    for (const nome of ['Rio Sono', 'Palmas', 'Lizarda', 'Tocantínia', 'Novo Acordo', 'São Félix do Tocantins']) {
      const bb = await p.$eval(`.mun.tem[aria-label="${nome}"]`, e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }).catch(() => null);
      if (!bb) continue;
      for (const [fx, fy] of [[.5, .2], [.5, .5], [.5, .8], [.3, .5], [.7, .5]]) {
        const x = bb[0] + bb[2] * fx, y = bb[1] + bb[3] * fy;
        if (!(await p.evaluate(([x, y, nome]) => { const e = document.elementFromPoint(x, y); return e && e.getAttribute && e.getAttribute('aria-label') === nome; }, [x, y, nome]))) continue;
        await p.mouse.move(x, y, { steps: 2 }); await p.waitForTimeout(120);
        const r = await p.evaluate(nome => {
          const cod = (window.MUN.muns.find(m => m.nome === nome) || {}).cod, card = document.querySelector(`.mt-nomes2 .mt-mn[data-cod="${cod}"]`), d = document.querySelector('.mt-dica');
          if (!card || getComputedStyle(d).display === 'none') return null;
          const a = card.getBoundingClientRect(), c = d.getBoundingClientRect();
          return a.left < c.right && a.right > c.left && a.top < c.bottom && a.bottom > c.top;
        }, nome);
        if (r === null) continue; n++; if (r) cobre++;
      }
    }
    t(`${tl}: DEFEITO 3 corrigido: o balão não cobre o cartão do próprio município (${n} pontos testados em 6 municípios)`, n >= 10 && cobre === 0, [n, cobre]);
    await foto(p, `t-${tl}-polo-balao`);
    await p.mouse.move(2, 2);
    await nivel(p, 'mun');
    const rd = await p.$eval('.mt-redes-d path', e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }).catch(() => null);
    t(`${tl}: município — a rede dos alimentadores continua respondendo (nada quebrou)`, !!rd);
    t(`${tl}: sem erros de JavaScript`, p.erros.length === 0, p.erros);
    await p.close();
  }
}

// "antes": o que a base atual faz de errado (confirma os 3 defeitos e as repetições com o site sem o protótipo)
async function defeitos(b) {
  T('Base atual (sem protótipo): confirma os 3 defeitos e as repetições que sobraram');
  for (const tl of ['d', 'm']) {
    const p = await abre(b, tl, { proto: false });
    await nivel(p, 'regional');
    t(`${tl}: ANTES · regional — a barra repete o nome dos polos (chips) que o cartão do mapa já tem`, (await p.$$('.mt-pchip:not(.mt-atual)')).length === 3 && (await p.$$('.mt-selos .mt-pm')).length === 3);
    const alvo = await p.$eval('.mt-selos .mt-pm[data-polo="Palmas"]', e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, e.tagName]; });
    await p.mouse.click(alvo[0], alvo[1]); await esperaVoo(p, 1500);
    t(`${tl}: ANTES · DEFEITO 2 confirmado: o cartão do polo (${alvo[2]}) não responde ao clique`, await nv(p) === 'Centro///', await nv(p));
    await nivel(p, 'polo');
    const m = await p.$eval('.mun.tem[aria-label="Rio Sono"]', e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * .35]; });
    await p.mouse.move(m[0], m[1], { steps: 3 }); await p.waitForTimeout(250);
    const d = await p.$eval('.mt-dica', e => e.innerText.replace(/\n/g, ' | '));
    t(`${tl}: ANTES · DEFEITO 3/repetição: o balão repete "Rio Sono" e a NAE do cartão e a regional da trilha`, /Rio Sono/.test(d) && /NAE/.test(d) && /Regional Centro/.test(d), d);
    await p.mouse.move(2, 2);
    await nivel(p, 'mun');
    t(`${tl}: ANTES · DEFEITO 1 confirmado: a seta ← fica COBERTA pela lista dos alimentadores no município`, !(await cobertoPor(p, '.mt-volta')));
    t(`${tl}: ANTES · trilha "Palmas › Palmas" (polo e município com o mesmo nome)`, /Palmas\s*›\s*Palmas/.test((await p.$eval('.mt-polos', e => e.innerText)).replace(/\s+/g, ' ')));
    await p.keyboard.press('Escape'); await p.waitForTimeout(100);
    await p.close();
  }
}

async function estresse(b) {
  T('Tentando quebrar: Voltar rápido, recarregar, girar, teclado');
  for (const tl of ['d', 'm']) {
    let p = await abre(b, tl, { proto: true });
    await nivel(p, 'alimentador');
    await p.evaluate(() => { history.back(); history.back(); history.back(); history.back(); });     // 4 Voltar sem esperar a animação
    await p.waitForTimeout(2500); await esperaVoo(p);
    let s = await tela(p);
    t(`${tl}: 4 Voltar seguidos, sem esperar: termina no estado inteiro, endereço vazio, sem erro`, await nv(p) === '///' && s.hash === '' && p.erros.length === 0, [await nv(p), s.hash, p.erros]);
    await p.evaluate(() => { history.forward(); history.forward(); }); await p.waitForTimeout(2500); await esperaVoo(p);
    t(`${tl}: 2 Avançar seguidos chegam ao polo`, await nv(p) === 'Centro/Palmas//', await nv(p));
    await nivel(p, 'mun');
    await abreBusca(p); await p.waitForTimeout(300);                                  // lista aberta
    await p.goBack(); await esperaVoo(p); await p.waitForTimeout(400);
    t(`${tl}: Voltar com a lista da busca aberta sobe um nível e a lista do município fecha`, await nv(p) === 'Centro/Palmas//' && !(await p.$('#ativo-res.lista-mun')), [await nv(p), await p.$eval('#ativo-res', e => e.className)]);
    await nivel(p, 'mun'); await p.mouse.click(3, 3);
    const antes = [await nv(p), (await tela(p)).hash];
    await p.reload({ waitUntil: 'networkidle' }); await esperaVoo(p, 4000); await p.waitForTimeout(800);
    s = await tela(p);
    t(`${tl}: recarregar (F5) no município reabre no mesmo município e endereço`, await nv(p) === antes[0] && s.hash === antes[1] && /^#centro\/palmas\/[a-z-]+$/.test(s.hash), [antes, await nv(p), s.hash]);
    await p.goBack(); await esperaVoo(p); await p.waitForTimeout(400);
    t(`${tl}: depois do F5 o Voltar continua subindo (polo)`, await nv(p) === 'Centro/Palmas//', await nv(p));
    // teclado no botão
    await p.focus('.mt-tc'); await p.keyboard.press('Enter'); await p.waitForTimeout(700);
    t(`${tl}: Enter no botão (foco por Tab) entra na tela cheia`, (await tela(p)).on);
    await p.keyboard.press('Space'); await p.waitForTimeout(700);
    t(`${tl}: Espaço no botão sai da tela cheia`, !(await tela(p)).on);
    // hash trocado à mão com a tela cheia ligada
    await p.keyboard.press('Enter'); await p.waitForTimeout(600);
    await p.evaluate(() => { location.hash = '#sul/gurupi'; }); await esperaVoo(p, 4000);
    s = await tela(p);
    t(`${tl}: trocar o endereço com a tela cheia ligada leva o mapa e mantém a tela cheia`, s.on && await nv(p) === 'Sul/Gurupi//', [s, await nv(p)]);
    // girar o aparelho com a tela cheia no polo
    const W = L.TELAS[tl].width, H = L.TELAS[tl].height;
    await p.setViewportSize({ width: H, height: W }); await p.waitForTimeout(900);
    s = await tela(p);
    const caixa = await p.evaluate(() => { const r = document.querySelector('.mt-mapa>svg').getBoundingClientRect(), m = document.querySelector('.mt-mapa').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), Math.round(m.width), Math.round(m.height)]; });
    t(`${tl}: girar a tela (${W}x${H} → ${H}x${W}) em tela cheia: mapa reencaixa no tamanho novo, sem rolagem lateral`, s.on && !s.rolaX && caixa[0] <= H && caixa[1] <= W, caixa);
    await foto(p, `t-${tl}-girou-cheia-polo`);
    await p.setViewportSize({ width: W, height: H }); await p.waitForTimeout(600);
    await p.click('.mt-tc'); await p.waitForTimeout(600);
    t(`${tl}: sem erros de JavaScript em todo o teste`, p.erros.length === 0, p.erros);
    await p.context().close();
  }
}

(async () => {
  const b = await chromium.launch();
  const alvo = process.argv[2] || 'tudo';
  try {
    if (alvo === 'tudo' || alvo === 'historico' || alvo === 'historico-d') await historico(b, 'd');
    if (alvo === 'tudo' || alvo === 'historico' || alvo === 'historico-m') await historico(b, 'm');
    if (alvo === 'tudo' || alvo === 'cheia' || alvo === 'cheia-d' || alvo === 'cheia-m') { for (const tl of ['d', 'm']) { if (alvo === 'cheia-d' && tl === 'm' || alvo === 'cheia-m' && tl === 'd') continue; await telaCheia(b, tl, 'nativa'); await telaCheia(b, tl, 'css'); await negada(b, tl); } }
    if (alvo === 'tudo' || alvo === 'extras') await extras(b);
    if (alvo === 'tudo' || alvo === 'repeticoes') await repeticoes(b);
    if (alvo === 'tudo' || alvo === 'defeitos') await defeitos(b);
    if (alvo === 'tudo' || alvo === 'estresse') await estresse(b);
  } finally { await b.close(); }
  console.log(`\n${ok} verificações ok, ${falhas.length} falharam${falhas.length ? ':\n - ' + falhas.join('\n - ') : ''}`);
  process.exit(falhas.length ? 1 : 0);
})();
