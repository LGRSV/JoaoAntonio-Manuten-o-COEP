// Gera os prints da rodada 2 / tema 1.  Uso: node prints.js antes | depois | todos
//   antes  = site como está (arquivos de live/, iguais aos de alimentador/site/ e ao /teste/ ao vivo)
//   depois = protótipo (proto/): tela cheia, histórico (Voltar) e remoção dos dados repetidos
const L = require('./lib.js');
const fs = require('fs'), path = require('path');
const { chromium, abre, nivel, esperaVoo, foto, anota, semNotas, nivelAtual } = L;
const modo = process.argv[2] || 'todos';
const tela0 = async p => { await p.mouse.move(2, 2); };
const fechaBusca = async p => { await p.keyboard.press('Escape').catch(() => {}); await p.evaluate(() => document.activeElement && document.activeElement.blur()); await p.mouse.click(3, 3).catch(() => {}); await p.waitForTimeout(200); };
const abreBusca = async (p, nome) => { await p.click('#ativo-q'); await p.waitForTimeout(550); await foto(p, nome); await fechaBusca(p); };
const dicaEm = async (p, sel, nome) => { await p.hover(sel, { force: true }); await p.waitForTimeout(350); await foto(p, nome); await p.mouse.move(2, 2); await p.waitForTimeout(150); };

// folha de contato: quadros lado a lado com legenda (sequência do botão Voltar)
async function folha(b, itens, saida, mobile) {
  const w = mobile ? 238 : 470;
  const p = await b.newPage({ viewport: { width: 1500, height: 900 } });
  const im = itens.map(([f, leg]) => [`data:image/jpeg;base64,` + fs.readFileSync(path.join(L.RAIZ, 'prints', f + '.jpg')).toString('base64'), leg]);
  await p.setContent(`<body style="margin:0;background:#1c1c1c;width:1500px;display:flex;flex-wrap:wrap;gap:8px;padding:8px;box-sizing:border-box;align-items:flex-start">${im.map(([s, leg]) =>
    `<figure style="margin:0;color:#fff;font:600 13px/1.3 sans-serif;width:${w}px"><img src="${s}" style="width:${w}px;display:block;border:1px solid #555"><figcaption style="padding:5px 2px">${leg}</figcaption></figure>`).join('')}</body>`);
  const h = await p.evaluate(() => document.body.scrollHeight);
  await p.setViewportSize({ width: 1500, height: h });
  await p.screenshot({ path: path.join(L.RAIZ, 'prints', saida + '.jpg'), type: 'jpeg', quality: 80 });
  await p.close();
}

async function antes(b) {
  for (const t of ['d', 'm']) {
    const p = await abre(b, t);
    await foto(p, `antes-${t}-estado`);
    await abreBusca(p, `antes-${t}-busca-estado`);
    await nivel(p, 'regional'); await foto(p, `antes-${t}-regional`);
    await anota(p, [['.mt-pchip:not(.mt-atual)', 1], ['.mt-selos .mt-pm', 1]]); await foto(p, `antes-${t}-regional-notas`); await semNotas(p);
    await nivel(p, 'polo'); await foto(p, `antes-${t}-polo`);
    if (t === 'd') {
      await p.hover('.mun.tem[aria-label="Rio Sono"]', { force: true }); await p.waitForTimeout(350);
      await anota(p, [['.mt-dica', 2], ['.mt-mn:has(b)', 2]]); await foto(p, `antes-d-polo-dica-notas`); await semNotas(p); await foto(p, `antes-d-polo-dica`); await p.mouse.move(2, 2);
    }
    await p.click('#ativo-q'); await p.waitForTimeout(550); await foto(p, `antes-${t}-busca-polo`);
    if (t === 'd') { await anota(p, [['#ativo-res .so-mun small', 3], ['#ativo-res .so-mun .so-n', 4], ['.mt-mn i', 4]]); await foto(p, `antes-d-busca-polo-notas`); await semNotas(p); }
    await fechaBusca(p);
    await nivel(p, 'mun'); await foto(p, `antes-${t}-mun`);
    await anota(p, [['.mt-passo[data-ir="polo"]', 5], ['b.mt-atual', 5], ['.mt-volta', 6]]); await foto(p, `antes-${t}-mun-notas`); await semNotas(p);
    await nivel(p, 'alimentador'); await foto(p, `antes-${t}-alimentador`);
    await p.close();
  }
  // endereço (hash) no site atual: ignorado, abre no estado inteiro
  const q = await abre(b, 'd', { hash: '#centro/palmas/palmas' }); await esperaVoo(q); await foto(q, 'antes-d-link-ignorado'); await q.close();
}

async function depois(b) {
  for (const t of ['d', 'm']) {
    const p = await abre(b, t, { proto: true });
    await foto(p, `depois-${t}-estado`);
    await abreBusca(p, `depois-${t}-busca-estado`);
    await nivel(p, 'regional'); await foto(p, `depois-${t}-regional`);
    await nivel(p, 'polo'); await foto(p, `depois-${t}-polo`);
    if (t === 'd') await dicaEm(p, '.mun.tem[aria-label="Rio Sono"]', 'depois-d-polo-dica');
    await abreBusca(p, `depois-${t}-busca-polo`);
    await nivel(p, 'mun'); await foto(p, `depois-${t}-mun`);
    await nivel(p, 'alimentador'); await foto(p, `depois-${t}-alimentador`);
    console.log(t, 'erros', p.erros);
    await p.close();

    // tela cheia (nativa) em cada nível
    const q = await abre(b, t, { proto: true });
    await q.evaluate(() => window.scrollTo(0, 0));
    await (t === 'm' ? q.tap('.mt-tc') : q.click('.mt-tc')); await q.waitForTimeout(800);
    await foto(q, `depois-${t}-cheia-estado`);
    await nivel(q, 'regional'); await foto(q, `depois-${t}-cheia-regional`);
    await nivel(q, 'polo'); await foto(q, `depois-${t}-cheia-polo`);
    await nivel(q, 'mun'); await foto(q, `depois-${t}-cheia-mun`);
    await nivel(q, 'alimentador'); await foto(q, `depois-${t}-cheia-alimentador`);
    await q.evaluate(() => { document.documentElement.dataset.theme = 'light'; }); await q.waitForTimeout(300); await foto(q, `depois-${t}-cheia-claro-alimentador`);
    await q.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
    await q.click('.mt-tc'); await q.waitForTimeout(800); await foto(q, `depois-${t}-saiu-alimentador`);
    await q.close();

    // botão Voltar: do alimentador ao estado, um nível por vez
    const r = await abre(b, t, { proto: true });
    await nivel(r, 'alimentador'); await r.evaluate(() => window.scrollTo(0, 0)); await r.waitForTimeout(300);
    const quadros = [];
    const reg = async (arq, leg) => { await foto(r, arq); quadros.push([arq, leg]); };
    await reg(`voltar-${t}-0`, `0 · alimentador<br><code>${await r.evaluate(() => location.hash)}</code>`);
    for (let i = 1; i <= 4; i++) {
      await r.goBack(); await esperaVoo(r); await r.waitForTimeout(500);
      await reg(`voltar-${t}-${i}`, `Voltar ${i}<br><code>${await r.evaluate(() => location.hash) || '(sem hash: estado inteiro)'}</code>`);
    }
    await folha(b, quadros, `depois-${t}-voltar-folha`, t === 'm');
    await r.close();

    // abrir o link já no nível certo
    const l = await abre(b, t, { proto: true, hash: '#centro/palmas/palmas/LD02059122' }); await esperaVoo(l, 4000); await l.waitForTimeout(800);
    await foto(l, `depois-${t}-link-alimentador`);
    await l.close();
    const l2 = await abre(b, t, { proto: true, hash: '#sul/gurupi' }); await esperaVoo(l2, 4000); await l2.waitForTimeout(800);
    await foto(l2, `depois-${t}-link-polo`);
    await l2.close();
  }
  // celular em paisagem, tela cheia
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const p = await abre(b, 'm', { proto: true, ctx });
  await p.tap('.mt-tc'); await p.waitForTimeout(700); await foto(p, 'depois-m-paisagem-cheia-estado');
  await nivel(p, 'polo'); await foto(p, 'depois-m-paisagem-cheia-polo');
  await ctx.close();
  // tema claro, página normal e tela cheia
  const c = await abre(b, 'd', { proto: true, claro: true });
  await nivel(c, 'regional'); await foto(c, 'depois-d-claro-regional');
  await c.click('.mt-tc'); await c.waitForTimeout(800); await foto(c, 'depois-d-claro-cheia-regional');
  await c.close();
}
async function main() {
  const b = await chromium.launch();
  if (modo === 'antes' || modo === 'todos') await antes(b);
  if (modo === 'depois' || modo === 'todos') await depois(b);
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
