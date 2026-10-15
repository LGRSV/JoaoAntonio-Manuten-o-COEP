// Gera os prints da rodada 4 / tema 1 (JPEG 1440x900 e 390x844; escuro e claro).  Uso: node prints.js antes|depois|todos
// "antes" = base atual (/teste/ ao vivo = alimentador/site/, arquivos em live/); "depois" = protótipo (proto/).
const L = require('./lib.js');
const { chromium, abre, nivel, solta, esperaVoo, foto, anota, semNotas } = L;
const path = require('path'), fs = require('fs');
const modo = process.argv[2] || 'todos';

const abreBusca = async p => { if (await p.$eval('#ativo-q', e => e.hidden)) await p.click('#lupa'); await p.waitForTimeout(450); };
const fechaBusca = async p => { await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.mouse.click(2, 2); await p.waitForTimeout(300); };
const sobre = async (p, nome) => {
  const pt = await p.$eval(`.mun.tem[aria-label="${nome}"]`, e => { const r = e.getBoundingClientRect(); for (const [fx, fy] of [[.5, .3], [.5, .5], [.4, .6]]) { const x = r.left + r.width * fx, y = r.top + r.height * fy; if (document.elementFromPoint(x, y) === e) return { x, y }; } return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.move(pt.x, pt.y, { steps: 4 }); await p.waitForTimeout(300);
};

async function cenas(b, quando) {
  const proto = quando === 'depois';
  for (const claro of [false, true]) for (const tl of ['d', 'm']) {
    const sf = claro ? '-claro' : '', N = n => `${quando}-${tl}-${n}${sf}`;
    const p = await abre(b, tl, { proto, claro });
    await solta(p); await foto(p, N('estado'));
    await nivel(p, 'regional'); await foto(p, N('regional'));
    if (!claro && !proto) { await anota(p, [['.mt-pchip:not(.mt-atual)', 1], ['.mt-selos .mt-pm', 1]]); await foto(p, N('regional-notas')); await semNotas(p); }
    await nivel(p, 'polo'); await foto(p, N('polo'));
    await sobre(p, 'Rio Sono'); await foto(p, N('polo-balao')); await solta(p);
    if (!claro) {                                              // lista da busca com o campo vazio, no polo e na regional
      await abreBusca(p); await foto(p, N('busca-polo')); await fechaBusca(p);
    }
    await nivel(p, 'mun'); await foto(p, N('mun'));
    if (!claro && !proto) { await anota(p, [['.mt-volta', 2], ['.mt-polos', 3]]); await foto(p, N('mun-notas')); await semNotas(p); }
    await nivel(p, 'alimentador'); await foto(p, N('alimentador'));
    // tela cheia (nativa) no município
    if (!claro) {
      await p.click('.mt-tc'); await p.waitForTimeout(700);
      await foto(p, N('cheia-alimentador'));
      await p.click('.mt-tc'); await p.waitForTimeout(500);
    }
    await p.context().close();
  }
  // estado + regional abertos pelo cartão (clique no cartão do polo): só depois
}

async function voltar(b, tl) {                                 // folha de contato do Voltar: alimentador → município → polo → regional → estado, com o endereço de cada quadro
  const p = await abre(b, tl, { proto: true });
  await nivel(p, 'alimentador'); await p.mouse.click(2, 2); await p.waitForTimeout(300);
  const quadros = [];
  const tira = async () => { const h = await p.evaluate(() => location.hash || '(sem endereço)'); const f = path.join(L.RAIZ, 'prints', `_q${quadros.length}.jpg`); await p.screenshot({ path: f, type: 'jpeg', quality: 70 }); quadros.push([h, f]); };
  await tira();
  for (let i = 0; i < 4; i++) { await p.goBack(); await esperaVoo(p, 3000); await p.waitForTimeout(500); await tira(); }
  const html = `<body style="margin:0;background:#111;color:#eee;font:14px IBM Plex Mono,monospace"><div style="display:flex;gap:10px;padding:10px">${quadros.map(([h, f], i) => `<figure style="margin:0;flex:1"><img style="width:100%;display:block;border:1px solid #333" src="data:image/jpeg;base64,${fs.readFileSync(f).toString('base64')}"><figcaption style="padding:6px 0">${i === 0 ? 'ponto de partida' : 'Voltar ×' + i}<br><b>${h}</b></figcaption></figure>`).join('')}</div></body>`;
  const q = await b.newPage({ viewport: { width: tl === 'd' ? 2400 : 1300, height: tl === 'd' ? 560 : 800 } });
  await q.setContent(html); await q.waitForTimeout(500);
  await q.screenshot({ path: path.join(L.RAIZ, 'prints', `depois-${tl}-voltar-folha.jpg`), type: 'jpeg', quality: 80 });
  await q.close(); quadros.forEach(([, f]) => fs.unlinkSync(f));
  await p.context().close();
}

async function links(b) {
  for (const tl of ['d', 'm']) {
    let p = await abre(b, tl, { proto: false, hash: '#sul/gurupi' }); await p.waitForTimeout(800); await foto(p, `antes-${tl}-link-ignorado`); await p.context().close();
    p = await abre(b, tl, { proto: true, hash: '#sul/gurupi' }); await esperaVoo(p, 4000); await p.waitForTimeout(700); await solta(p); await foto(p, `depois-${tl}-link-polo`); await p.context().close();
    p = await abre(b, tl, { proto: true, hash: '#centro/palmas/palmas/LD02059122' }); await esperaVoo(p, 5000); await p.waitForTimeout(1200); await foto(p, `depois-${tl}-link-alimentador`); await p.context().close();
  }
}

async function cheiaCss(b) {                                   // tela cheia só por CSS (sem a API, como no iPhone): a barra com a ← aparece dentro dela
  for (const tl of ['d', 'm']) {
    const ctx = await b.newContext({ viewport: L.TELAS[tl], hasTouch: tl === 'm', isMobile: tl === 'm' });
    await ctx.addInitScript(() => { Element.prototype.requestFullscreen = undefined; Element.prototype.webkitRequestFullscreen = undefined; });
    const p = await abre(b, tl, { proto: true, ctx });
    await nivel(p, 'mun'); await p.mouse.click(2, 2); await p.waitForTimeout(300); await p.click('.mt-tc'); await p.waitForTimeout(600); await foto(p, `depois-${tl}-cheia-css-mun`);
    await ctx.close();
  }
}

(async () => {
  const b = await chromium.launch();
  try {
    if (modo === 'antes' || modo === 'todos') await cenas(b, 'antes');
    if (modo === 'depois' || modo === 'todos') { await cenas(b, 'depois'); await voltar(b, 'd'); await voltar(b, 'm'); await cheiaCss(b); }
    if (modo === 'links' || modo === 'todos') await links(b);
    if (modo === 'css') await cheiaCss(b);
  } finally { await b.close(); }
  console.log('prints prontos');
})();
