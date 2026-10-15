// Prints do ranking, relatório e fluxo dos dados (slides 18 a 21). Uso: node ranking.js
const { chromium, abre, esp, foto, SITE, OUT } = require('./common');
const path = require('path');
const log = [];
const txt = (p, sel) => p.evaluate(s => [...document.querySelectorAll(s)].map(e => e.innerText.replace(/\s+/g, ' ').trim()), sel);
async function run(vp) {
  const b = await chromium.launch();
  const { ctx, page: p } = await abre(b, vp);
  const L = (k, v) => log.push([vp, k, v]);
  const vai = async url => { await p.goto('about:blank'); await p.goto(url, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts && document.fonts.ready); await esp(p, 1200); };
  await vai(SITE + 'polos/#eto');
  L('eto-topo', (await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 1800))));
  await foto(p, 's18-ranking-eto', vp);
  await vai(SITE + 'polos/#araguaina');
  L('araguaina', (await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 1500))));
  await foto(p, 's19-polo-araguaina', vp);
  await vai(SITE + 'polos/#araguaina');
  if (vp === 'd') await p.click('th button[data-o="n100"]'); else await p.selectOption('#pl-ord', 'n100');
  await esp(p, 400);
  await p.evaluate(() => { const n = document.querySelector('.pl-nota'); if (n) n.open = true; });
  await esp(p, 300);
  if (vp === 'd') await p.evaluate(() => window.scrollTo(0, document.querySelector('.pl-lista').getBoundingClientRect().top + scrollY - 20));
  else await p.evaluate(() => window.scrollTo(0, document.querySelector('.pl-ferr').getBoundingClientRect().top + scrollY - 12));
  await esp(p, 400);
  L('n100', (await p.evaluate(() => document.querySelector('.pl-lista') ? document.querySelector('.pl-lista').innerText.replace(/\s+/g, ' ').slice(0, 900) : '')));
  L('nota', (await p.evaluate(() => document.querySelector('.pl-nota') ? document.querySelector('.pl-nota').innerText.replace(/\s+/g, ' ') : '')));
  await foto(p, 's20-nae-por-100km', vp);
  await vai(SITE + 'polos/#eto/trechos/T3'); await foto(p, 's19b-trechos-t3', vp);
  L('trechos-t3', (await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 900))));
  // um polo da Centro para conferir a numeração por polo
  for (const h of ['paraiso', 'porto-nacional', 'guarai', 'gurupi', 'palmas', 'dianopolis', 'augustinopolis']) {
    await vai(SITE + 'polos/#' + h);
    L('polo-' + h, (await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 420))));
  }
  await vai(SITE + 'relatorio.html'); await foto(p, 's21-relatorio-topo', vp);
  await p.evaluate(() => {
    const pre = document.querySelector('pre.relatorio') || document.querySelector('pre');
    const w = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT); let n, y = 0;
    while ((n = w.nextNode())) { const i = n.data.indexOf('## Total geral'); if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 14); y = r.getBoundingClientRect().top + scrollY - 20; break; } }
    window.scrollTo(0, y); document.scrollingElement.scrollLeft = 0; pre.scrollLeft = 0;
  });
  await esp(p, 400); await foto(p, 's21b-relatorio-total', vp);
  L('relatorio-total', (await p.evaluate(() => { const t = document.body.innerText; const i = t.indexOf('Total geral'); return t.slice(i, i + 1500).replace(/\s+/g, ' '); })));
  await p.goto('file://' + path.join(__dirname, 'fluxo.html'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts && document.fonts.ready); await esp(p, 500);
  await foto(p, 's22-fluxo-dados', vp);
  await b.close();
}
(async () => { await run('d'); await run('m'); console.log(JSON.stringify(log.filter(x => x[0] === 'd'), null, 1)); })();
