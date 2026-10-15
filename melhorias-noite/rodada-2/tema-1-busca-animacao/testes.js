// Testes de verdade (clique, teclado, Voltar, celular) do protótipo da rodada 2 / tema 1.  Uso: node testes.js | tee testes.log
// Tela cheia: nativa (Chromium) e só CSS (Fullscreen API removida, como no iPhone). Histórico: Voltar/Avançar, Esc, ←, trilha, busca, link com endereço.
const L = require('./lib.js');
const { chromium, abre, nivel, esperaVoo, nivelAtual, foto } = L;
let ok = 0, falhas = [];
const t = (nome, cond, det = '') => { if (cond) { ok++; console.log('  ok   ' + nome); } else { falhas.push(nome); console.log('  FALHOU ' + nome + (det ? '  → ' + JSON.stringify(det) : '')); } };
const T = titulo => console.log('\n## ' + titulo);
const tela = async p => p.evaluate(() => ({ fs: !!(document.fullscreenElement || document.webkitFullscreenElement), css: document.getElementById('mapa-to').classList.contains('tc-mapa'), hash: location.hash, len: history.length, idx: navigation.currentEntry.index, y: scrollY,
  svg: (r => [Math.round(r.width), Math.round(r.height)])(document.querySelector('.mt-mapa svg').getBoundingClientRect()), pressed: document.querySelector('.mt-tc').getAttribute('aria-pressed'), rolaX: document.documentElement.scrollWidth > innerWidth }));
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
  const salto = tl === 'm' ? 'regional' : 'estado';      // no celular a trilha esconde "Tocantins" no município (a seta ← e o Voltar levam até lá)
  await p.click(`.mt-passo[data-ir="${salto}"]`); await esperaVoo(p); await p.waitForTimeout(300);
  s = await tela(p); t(`trilha: salto de vários níveis até "${salto}" ${salto === 'estado' ? 'limpa' : 'corrige'} o endereço`, await nv(p) === (salto === 'estado' ? '///' : 'Centro///') && s.hash === (salto === 'estado' ? '' : '#centro'), [await nv(p), s.hash]);
  await volta(p, 1400); t('Voltar depois do salto devolve ao alimentador de onde saiu', await nv(p) === `Centro/Palmas/${MUN}/${AL}`, await nv(p));
  // busca: voo por vários níveis = uma só entrada
  await p.goto(L.BASE, { waitUntil: 'networkidle' }); await p.waitForTimeout(400);
  const I2 = (await tela(p)).idx;
  await p.click('#ativo-q'); await p.keyboard.type('Lagoa da Confusão'); await p.waitForSelector('#ativo-res .so-mun', { timeout: 15000 });
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await esperaVoo(p, 3500); await p.waitForTimeout(500);
  s = await tela(p); const n1 = await nivelAtual(p);
  t('busca "Lagoa da Confusão" leva o mapa ao município', !!n1.mun && s.hash.startsWith('#centro/paraiso/lagoa-da-confusao'), [n1, s.hash]);
  t('o voo da busca (estado → município) empilhou UMA entrada', s.idx === I2 + 1, [I2, s.idx]);
  await volta(p, 1400); t('Voltar depois da busca volta ao estado inteiro', await nv(p) === '///', await nv(p));
  // busca de alimentador: um só passo no histórico também
  const I3 = (await tela(p)).idx;
  await p.click('#ativo-q'); await p.keyboard.type('LD01072001'); await p.waitForFunction(() => /LD01072001/.test((document.querySelector('#ativo-res .sug-op') || {}).innerText || ''), null, { timeout: 15000 });
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
  t('botão existe, fora da tela cheia: aria-pressed=false e rótulo "Mapa em tela cheia"', await p.$eval('.mt-tc', e => e.getAttribute('aria-pressed') === 'false' && /tela cheia/i.test(e.getAttribute('aria-label'))));
  const caixaBtn = await p.$eval('.mt-tc', e => { const r = e.getBoundingClientRect(); return [r.width, r.height]; });
  t('alvo de toque ≥ 40x40', caixaBtn[0] >= 40 && caixaBtn[1] >= 40, caixaBtn);
  await p.evaluate(() => window.scrollTo(0, 120)); await p.waitForTimeout(100);
  const y0 = await p.evaluate(() => scrollY);
  const tap = () => tl === 'm' ? p.tap('.mt-tc') : p.click('.mt-tc');
  await tap(); await p.waitForTimeout(700);
  let s = await tela(p);
  await tap(); await p.waitForTimeout(900);            // sai logo: a rolagem de antes tem de voltar (no estado inteiro a página tem altura para isso)
  const s1 = await tela(p); t('rolagem da página volta ao lugar de antes ao sair (y=' + y0 + ')', !s1.css && Math.abs(s1.y - y0) <= 2, [y0, s1.y]);
  await tap(); await p.waitForTimeout(700); s = await tela(p);
  t(`entrou: layout em tela cheia (${nat ? 'nativa' : 'CSS'})`, s.css && (nat ? s.fs : !s.fs), s);
  t('mapa ocupa quase a janela inteira', s.svg[0] >= W - 40 && s.svg[1] >= H - 130, s.svg);
  t('aria-pressed=true e a página não rola por baixo', s.pressed === 'true' && await p.evaluate(() => getComputedStyle(document.body).overflow === 'hidden'));
  t('sem rolagem lateral', !s.rolaX);
  await foto(p, `t-${tl}-${modo}-cheia`);
  // navegar dentro da tela cheia
  await nivel(p, 'mun'); await foto(p, `t-${tl}-${modo}-cheia-mun`);
  s = await tela(p); t('navegar até o município dentro da tela cheia (clique) mantém a tela cheia', s.css && (nat ? s.fs : true) && await nv(p) === `Centro/Palmas/${MUN}/`);
  // dica (hover) e busca dentro da tela cheia
  await p.click('#ativo-q'); await p.waitForTimeout(400);
  const lista = await p.$eval('#ativo-res', e => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom), e.innerHTML.length > 0]; });
  t('a lista da busca abre dentro da tela cheia, sem cortar', lista[4] && lista[0] >= 0 && lista[2] <= W && lista[3] <= H, lista);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  t('Esc fecha a lista da busca primeiro, sem sair da tela cheia nem subir nível', (await tela(p)).css && await nv(p) === `Centro/Palmas/${MUN}/`);
  // Shift+K (Night shift) dentro da tela cheia
  const tema0 = await p.evaluate(() => document.documentElement.dataset.theme);
  await p.evaluate(() => document.activeElement && document.activeElement.blur()); await p.keyboard.press('Shift+K'); await p.waitForTimeout(300);
  const tema1 = await p.evaluate(() => document.documentElement.dataset.theme);
  t('Shift+K troca o tema (Night shift) dentro da tela cheia', tema0 !== tema1, [tema0, tema1]);
  await foto(p, `t-${tl}-${modo}-cheia-claro`);
  await p.keyboard.press('Shift+K'); await p.waitForTimeout(300);
  // F fora e dentro de campo
  await p.click('#ativo-q'); await p.keyboard.type('f'); s = await tela(p);
  t('digitar "f" no campo da busca NÃO alterna a tela cheia', s.css && await p.$eval('#ativo-q', e => e.value) === 'f');
  await p.fill('#ativo-q', ''); await p.waitForTimeout(400); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  // sair pelo botão
  await p.evaluate(() => document.activeElement && document.activeElement.blur());
  await tap(); await p.waitForTimeout(900);
  s = await tela(p);
  t('saiu pelo botão: layout normal, aria-pressed=false', !s.css && !s.fs && s.pressed === 'false', s);
  t('nível do mapa preservado ao sair (município)', await nv(p) === `Centro/Palmas/${MUN}/`, await nv(p));
  await foto(p, `t-${tl}-${modo}-saiu`);
  // entrar de novo e sair com F
  await p.keyboard.press('f'); await p.waitForTimeout(600); s = await tela(p); t('F entra na tela cheia', s.css);
  await p.keyboard.press('f'); await p.waitForTimeout(700); s = await tela(p); t('F sai da tela cheia', !s.css && !s.fs, s);
  // Esc
  await tap(); await p.waitForTimeout(600);
  if (nat) {
    await p.evaluate(() => document.exitFullscreen()); await p.waitForTimeout(700);      // o Esc do navegador chama isto
    s = await tela(p); t('Esc / saída nativa (exitFullscreen) desfaz o layout e mantém o nível', !s.css && !s.fs && await nv(p) === `Centro/Palmas/${MUN}/`, [s, await nv(p)]);
    await p.keyboard.press('Escape'); await esperaVoo(p); await p.waitForTimeout(300);
    t('o Esc seguinte (fora da tela cheia) sobe um nível: município → polo', await nv(p) === 'Centro/Palmas//', await nv(p));
  } else {
    await p.keyboard.press('Escape'); await p.waitForTimeout(500);
    s = await tela(p); t('só CSS: Esc sai da tela cheia primeiro (igual ao nativo), sem subir nível', !s.css && await nv(p) === `Centro/Palmas/${MUN}/`, [s, await nv(p)]);
    await tap(); await p.waitForTimeout(500);
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);   // sai
    await p.keyboard.press('Escape'); await esperaVoo(p); await p.waitForTimeout(400);
    t('só CSS: o Esc seguinte sobe um nível', await nv(p) === 'Centro/Palmas//', await nv(p));
  }
  // Voltar do navegador dentro da tela cheia
  if (nat) {
    await nivel(p, 'polo'); await tap(); await p.waitForTimeout(600); await nivel(p, 'mun');
    await p.goBack(); await esperaVoo(p); s = await tela(p);
    t('nativa: Voltar dentro da tela cheia sobe um nível (município → polo) e continua em tela cheia', await nv(p) === 'Centro/Palmas//' && s.css && s.fs, [await nv(p), s]);
  }
  await ctx.close();
  if (!nat) {   // fluxo completo do gesto Voltar no modo só CSS
    const c2 = await b.newContext({ viewport: L.TELAS[tl], hasTouch: tl === 'm', isMobile: tl === 'm' }); await c2.addInitScript(SEM_FS);
    const q = await abre(b, tl, { proto: true, ctx: c2 });
    await nivel(q, 'regional');
    const hl = (await tela(q)).len;
    await (tl === 'm' ? q.tap('.mt-tc') : q.click('.mt-tc')); await q.waitForTimeout(500);
    s = await tela(q); t('só CSS: entrar na tela cheia empilha 1 entrada sentinela', s.len === hl + 1 && s.css, [hl, s.len]);
    await q.goBack(); await q.waitForTimeout(600); s = await tela(q);
    t('só CSS: gesto Voltar SAI da tela cheia (não sobe nível nem sai da página)', !s.css && await nv(q) === 'Centro///' && s.hash === '#centro', [s, await nv(q)]);
    await (tl === 'm' ? q.tap('.mt-tc') : q.click('.mt-tc')); await q.waitForTimeout(500);
    await (tl === 'm' ? q.tap('.mt-tc') : q.click('.mt-tc')); await q.waitForTimeout(700); s = await tela(q);
    t('só CSS: entrar e sair pelo botão não deixa entrada sobrando', !s.css && s.len === hl + 1 || s.len === hl, [hl, s.len]);
    await q.goBack(); await esperaVoo(q); await q.waitForTimeout(300);
    t('só CSS: Voltar depois disso vai ao estado inteiro (nenhum Voltar "morto")', await nv(q) === '///', [await nv(q), (await tela(q)).len]);
    // níveis percorridos DENTRO da tela cheia: cada Voltar sobe um nível; só ao chegar antes da tela cheia ela fecha
    await nivel(q, 'polo');
    await (tl === 'm' ? q.tap('.mt-tc') : q.click('.mt-tc')); await q.waitForTimeout(500);
    await nivel(q, 'mun');
    await q.goBack(); await esperaVoo(q); s = await tela(q);
    t('só CSS: Voltar na tela cheia sobe município → polo e CONTINUA em tela cheia', s.css && await nv(q) === 'Centro/Palmas//', [s, await nv(q)]);
    await q.goBack(); await q.waitForTimeout(500); s = await tela(q);
    t('só CSS: Voltar seguinte (chegou antes da tela cheia): SAI da tela cheia, nível preservado (polo)', !s.css && await nv(q) === 'Centro/Palmas//', [s, await nv(q)]);
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
  t('API recusada → continua em tela cheia por CSS', s.css && !s.fs, s);
  await p.click('.mt-tc'); await p.waitForTimeout(500); t('e o botão sai normalmente', !(await tela(p)).css);
  t('sem erros de JavaScript', p.erros.length === 0, p.erros);
  await ctx.close();
}

async function extras(b) {
  T('Paisagem no celular (844x390) em tela cheia');
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const p = await abre(b, 'm', { proto: true, ctx });
  await p.tap('.mt-tc'); await p.waitForTimeout(600);
  const s = await tela(p);
  t('mapa ocupa a janela em paisagem', s.css && s.svg[1] >= 390 - 130 && !s.rolaX, s);
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

  T('Regressão: o site SEM o protótipo não muda');
  const r = await abre(b, 'd', { proto: false });
  await nivel(r, 'mun');
  t('site atual: não há botão de tela cheia e o endereço não muda ao navegar (sem histórico)', !(await r.$('.mt-tc')) && await r.evaluate(() => location.hash === '' && history.length <= 2), await r.evaluate(() => [location.hash, history.length]));
  t('site atual: sem erros', r.erros.length === 0, r.erros);
  await r.close();
}

async function repeticoes(b) {
  T('Dados repetidos (protótipo)');
  for (const tl of ['d', 'm']) {
    const p = await abre(b, tl, { proto: true });
    await nivel(p, 'regional');
    t(`${tl}: regional — sem chips de polo na barra; 3 cartões são botões`, !(await p.$('.mt-pchip:not(.mt-atual)')) && (await p.$$('.mt-selos button.mt-pm')).length === 3);
    t(`${tl}: regional — ← é o 1º item da trilha`, await p.$eval('.mt-polos', e => e.firstElementChild.classList.contains('mt-volta')));
    await p.click('.mt-selos .mt-pm[data-polo="Palmas"]'); await esperaVoo(p);
    t(`${tl}: clicar no cartão do polo abre o polo`, await nv(p) === 'Centro/Palmas//', await nv(p));
    t(`${tl}: trilha do polo: "Polo Palmas"`, /Polo Palmas/.test(await p.$eval('.mt-polos', e => e.innerText)));
    // teclado nos cartões
    await p.keyboard.press('Escape'); await esperaVoo(p);
    await p.focus('.mt-selos .mt-pm[data-polo="Paraíso"]'); await p.keyboard.press('Enter'); await esperaVoo(p);
    t(`${tl}: cartão do polo abre por teclado (Enter)`, await nv(p) === 'Centro/Paraíso//', await nv(p));
    await p.keyboard.press('Escape'); await esperaVoo(p);
    await nivel(p, 'polo');
    await p.click('#ativo-q'); await p.waitForTimeout(400);
    const linhas = await p.$$eval('#ativo-res .so-mun', ls => ls.map(l => ({ x: l.innerText, nae: !!l.querySelector('.so-n') })));
    t(`${tl}: lista do campo vazio no polo — ${tl === 'd' ? 'sem NAE e sem "Polo Palmas · Centro" nas linhas' : 'no celular mantém NAE (a lista cobre o mapa)'}`,
      tl === 'd' ? linhas.every(l => !l.nae && !/Polo|Centro/.test(l.x)) : linhas.every(l => l.nae), linhas.slice(0, 2));
    await p.keyboard.press('Escape'); await p.mouse.click(3, 3);
    await nivel(p, 'mun');
    const visf = () => p.$eval('.mt-volta', e => { const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; const t = document.elementFromPoint(x, y); return !!t && (t === e || e.contains(t)); });
    const vis = await visf();
    if (tl === 'd') t('d: município aberto (lista dos alimentadores aberta) — a seta ← continua visível e clicável (antes ficava sob a lista)', vis);
    else t('m: município aberto — a lista dos alimentadores (tela toda) ainda cobre a seta ← [limite conhecido: toque fora fecha a lista e a seta aparece; o Voltar do celular também sobe]', vis === false);
    await p.mouse.click(3, 3); await p.waitForTimeout(300);
    t(`${tl}: com a lista fechada a seta ← é clicável`, await visf());
    await p.close();
  }
  const q = await abre(b, 'd', { proto: false });
  await nivel(q, 'mun');
  const visAntes = await q.$eval('.mt-volta', e => { const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; const t = document.elementFromPoint(x, y); return !!t && (t === e || e.contains(t)); });
  t('site atual (antes): a seta ← fica COBERTA pela lista no município aberto [confirma o defeito]', visAntes === false, visAntes);
  await q.close();
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
    await p.click('#ativo-q'); await p.waitForTimeout(300);                                  // lista aberta
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
    t(`${tl}: Enter no botão (foco por Tab) entra na tela cheia`, (await tela(p)).css);
    await p.keyboard.press('Space'); await p.waitForTimeout(700);
    t(`${tl}: Espaço no botão sai da tela cheia`, !(await tela(p)).css);
    // hash trocado à mão com a tela cheia ligada
    await p.keyboard.press('Enter'); await p.waitForTimeout(600);
    await p.evaluate(() => { location.hash = '#sul/gurupi'; }); await esperaVoo(p, 4000);
    s = await tela(p);
    t(`${tl}: trocar o endereço com a tela cheia ligada leva o mapa e mantém a tela cheia`, s.css && await nv(p) === 'Sul/Gurupi//', [s, await nv(p)]);
    // girar o aparelho com a tela cheia no polo
    const W = L.TELAS[tl].width, H = L.TELAS[tl].height;
    await p.setViewportSize({ width: H, height: W }); await p.waitForTimeout(900);
    s = await tela(p);
    const caixa = await p.evaluate(() => { const r = document.querySelector('.mt-mapa>svg').getBoundingClientRect(), m = document.querySelector('.mt-mapa').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), Math.round(m.width), Math.round(m.height)]; });
    t(`${tl}: girar a tela (${W}x${H} → ${H}x${W}) em tela cheia: mapa reencaixa no tamanho novo, sem rolagem lateral`, s.css && !s.rolaX && caixa[0] <= H && caixa[1] <= W, caixa);
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
    if (alvo === 'tudo' || alvo === 'estresse') await estresse(b);
  } finally { await b.close(); }
  console.log(`\n${ok} verificações ok, ${falhas.length} falharam${falhas.length ? ':\n - ' + falhas.join('\n - ') : ''}`);
  process.exit(falhas.length ? 1 : 0);
})();
