// Gera os prints do material P4 (ranking por polo, relatório, fluxo dos dados, atualização de bases).
// Uso: node prints.js   (JPEG, qualidade 80, 1440x900 e 390x844, tema escuro padrão do site)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const ponte = require('./ponte');
const B = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/';
const OUT = __dirname;
const TAM = { d: { width: 1440, height: 900 }, m: { width: 390, height: 844 } };
const shot = (p, nome, v, extra = {}) => p.screenshot({ path: path.join(OUT, `${nome}-${v === 'd' ? '1440' : '390'}.jpg`), type: 'jpeg', quality: 80, ...extra });
const espera = (p, ms = 500) => p.waitForTimeout(ms);

(async () => {
  const b = await chromium.launch();
  for (const v of ['d', 'm']) {
    const ctx = await b.newContext({ viewport: TAM[v], deviceScaleFactor: 1, hasTouch: v === 'm', isMobile: v === 'm' });
    await ponte(ctx);
    const p = await ctx.newPage();
    p.setDefaultTimeout(30000);
    const abre = async url => { await p.goto('about:blank'); await p.goto(url, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts && document.fonts.ready); await espera(p, 400); };

    // 1 · ranking: ETO, regionais e polos com a NAE de cada um
    await abre(B + 'polos/#eto');
    await shot(p, '01-ranking-eto', v);

    // 2 · um polo: alimentadores por NAE (Araguaína)
    await abre(B + 'polos/#araguaina');
    await shot(p, '02-polo-araguaina', v);

    // 3 · NAE/100 km e como contamos: ordenar pelo NAE/100 km e abrir "Como contamos"
    await abre(B + 'polos/#araguaina');
    if (v === 'd') await p.click('th button[data-o="n100"]'); else await p.selectOption('#pl-ord', 'n100');
    await espera(p, 400);
    await p.evaluate(() => document.querySelector('.pl-nota').open = true);
    await espera(p, 300);
    if (v === 'd') { await p.evaluate(() => window.scrollTo(0, document.querySelector('.pl-lista').getBoundingClientRect().top + scrollY - 20)); }
    else { await p.evaluate(() => window.scrollTo(0, document.querySelector('.pl-ferr').getBoundingClientRect().top + scrollY - 12)); }
    await espera(p, 300);
    await shot(p, '03-nae-por-100km', v);

    // 3b · trechos T3 da ETO inteira (ranking de trechos)
    await abre(B + 'polos/#eto/trechos/T3');
    await shot(p, '03b-trechos-t3', v);

    // 4 · relatório de validação
    await abre(B + 'relatorio.html');
    await shot(p, '04-relatorio-topo', v);
    // 4b · total geral e avisos
    await p.evaluate(() => {
      const pre = document.querySelector('pre.relatorio');
      const w = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT); let n, y = 0;
      while ((n = w.nextNode())) { const i = n.data.indexOf('## Total geral'); if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 14); y = r.getBoundingClientRect().top + scrollY - 20; break; } }
      window.scrollTo(0, y); document.scrollingElement.scrollLeft = 0; pre.scrollLeft = 0;
    });
    await espera(p, 300);
    await shot(p, '04b-relatorio-total', v);

    // 5 · fluxo dos dados (diagrama local)
    await p.goto('file://' + path.join(OUT, 'fluxo.html'), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts && document.fonts.ready); await espera(p, 400);
    await shot(p, '05-fluxo-dados', v);

    // 6 · menu ☰ e Atualização de dados
    await abre(B);
    await p.click('.mnu-btn'); await espera(p, 350);
    await shot(p, '06a-menu', v);
    await p.click('.mnu-lista li:first-child button'); await espera(p, 600);
    await p.waitForFunction(() => [...document.querySelectorAll('.mnu-bases li span')].some(s => s.textContent.trim() !== '—'), null, { timeout: 15000 }).catch(() => {});
    await espera(p, 400);
    await shot(p, '06-atualizacao-bases', v);
    await ctx.close();
  }
  await b.close();
})();
