// Caça a telas presas: cliques rápidos, Esc, foco, rolagem, botão Voltar. Uso: node travas.js [rotulo]; PROTO=1 liga o protótipo
const L = require('./lib.js'), fs = require('fs'), inj = require('./injeta.js');
const rotulo = process.argv[2] || 'antes';
const espera = async (page, cond, ms = 6000) => { try { await page.waitForFunction(cond, null, { timeout: ms, polling: 30 }); return true; } catch (e) { return false; } };
const estado = page => page.evaluate(() => {
  const c = document.querySelector('.mt-mapa'), a = document.activeElement;
  return { classes: c.className, voando: c.classList.contains('voando'), viewBox: document.querySelector('.mt-mapa svg').getAttribute('viewBox'),
    foco: a ? (a.tagName + (a.id ? '#' + a.id : '') + (a.className && a.className.baseVal === undefined ? '.' + String(a.className).split(' ')[0] : '')) : null, focoNoCorpo: a === document.body,
    bodyOverflow: getComputedStyle(document.body).overflow + '/' + getComputedStyle(document.documentElement).overflow, scrollY: scrollY, histLen: history.length };
});
async function rolagem(page) { const y0 = await page.evaluate(() => scrollY); await page.mouse.wheel(0, 400); await page.waitForTimeout(250); const y1 = await page.evaluate(() => scrollY); const pode = await page.evaluate(() => document.documentElement.scrollHeight > innerHeight + 5); await page.evaluate(() => scrollTo(0, 0)); return { podeRolar: pode, rolou: y1 > y0 }; }
(async () => {
  const R = {};
  for (const [vp, cfg] of Object.entries({ desktop: { w: 1440, h: 900 }, celular: { w: 390, h: 844, mobile: true } })) {
    const T = R[vp] = {};
    const novo = async (perfil = 'base') => { const s = await L.abre({ ...cfg, perfil }); await inj.aplica(s.ctx, s.page); await s.page.goto(L.BASE, { waitUntil: 'load' }); await espera(s.page, `document.querySelectorAll('.mun').length>100`); await s.page.waitForTimeout(500); return s; };
    const FIM = `!document.querySelector('.mt-mapa').classList.contains('voando')`;
    // 1. duplo clique rápido no cartão da regional
    { const s = await novo(); const p = s.page; const b = await p.$('.mt-regcards button[data-reg="Centro"]');
      await p.evaluate(() => { const b = document.querySelector('.mt-regcards button[data-reg="Centro"]'); b.click(); setTimeout(() => b.click(), 30); });
      const ok = await espera(p, FIM, 5000); T['1 duplo clique na regional'] = { terminou: ok, ...(await estado(p)), erros: s.log.erros }; await s.browser.close(); }
    // 2. ciclo rápido abre/Esc/abre (10x, 80 ms entre eles)
    { const s = await novo(); const p = s.page;
      for (let i = 0; i < 10; i++) { await p.evaluate(() => { const b = document.querySelector('.mt-regcards button[data-reg="Sul"]'); if (b && b.offsetParent) b.click(); }); await p.waitForTimeout(80); await p.keyboard.press('Escape'); await p.waitForTimeout(80); }
      const ok = await espera(p, FIM, 5000); T['2 abre/Esc 10x rápido'] = { terminou: ok, ...(await estado(p)), erros: s.log.erros, regAberta: await p.evaluate(() => document.querySelector('.mt-mapa').classList.contains('aberta')) }; await s.browser.close(); }
    // 3. trocar de polo/regional no meio da animação
    { const s = await novo(); const p = s.page;
      await p.click('.mt-regcards button[data-reg="Norte"]'); await p.waitForTimeout(200);
      await p.evaluate(() => { const c = document.querySelectorAll('.mt-pchip[data-polo]'); c[0] && c[0].click(); setTimeout(() => { const d = document.querySelector('.mt-passo[data-ir="regional"]'); d && d.click(); }, 60); });
      const ok = await espera(p, FIM, 5000); T['3 polo → voltar durante a animação'] = { terminou: ok, ...(await estado(p)), erros: s.log.erros }; await s.browser.close(); }
    // 4. quantos Esc para sair de cada nível + foco depois de cada um (teclado: Enter nos cartões)
    { const s = await novo(); const p = s.page; const trilha = [];
      await p.focus('.mt-regcards button[data-reg="Centro"]'); await p.keyboard.press('Enter'); await espera(p, FIM); trilha.push(['Enter na regional', await estado(p)]);
      await p.focus('.mt-pchip[data-polo]'); await p.keyboard.press('Enter'); await espera(p, FIM); trilha.push(['Enter no polo', await estado(p)]);
      await p.evaluate(() => [...document.querySelectorAll('.mun')].find(x => x.getAttribute('tabindex') === '0').focus()); await p.keyboard.press('Enter'); await espera(p, FIM); await p.waitForTimeout(500); trilha.push(['Enter no município', await estado(p)]);
      for (let i = 1; i <= 5; i++) { await p.keyboard.press('Escape'); await espera(p, FIM); await p.waitForTimeout(100); trilha.push(['Esc ' + i, await estado(p)]); }
      T['4 teclado e Esc'] = trilha.map(([n, e]) => ({ passo: n, nivel: e.classes.replace('mt-mapa', '').trim(), foco: e.foco, focoNoCorpo: e.focoNoCorpo })); await s.browser.close(); }
    // 5. Esc com a busca aberta durante regional aberta
    { const s = await novo(); const p = s.page;
      await p.click('.mt-regcards button[data-reg="Centro"]'); await espera(p, FIM);
      await p.click('#lupa'); await p.waitForTimeout(200); await p.keyboard.type('pal'); await p.waitForTimeout(500);
      const antes = await p.evaluate(() => ({ campo: !document.getElementById('ativo-q').hidden, res: document.getElementById('ativo-res').children.length }));
      const seq = [];
      for (let i = 1; i <= 3; i++) { await p.keyboard.press('Escape'); await p.waitForTimeout(250); seq.push({ esc: i, campoAberto: await p.evaluate(() => !document.getElementById('ativo-q').hidden), res: await p.evaluate(() => document.getElementById('ativo-res').children.length), nivel: (await estado(p)).classes }); }
      T['5 Esc com a busca aberta'] = { antes, seq }; await s.browser.close(); }
    // 6. rolagem em cada nível (a página rola? o mapa prende a roda?)
    { const s = await novo(); const p = s.page; const r = [];
      r.push(['estado', await rolagem(p)]);
      await p.click('.mt-regcards button[data-reg="Centro"]'); await espera(p, FIM); r.push(['regional', await rolagem(p)]);
      await (await p.$('.mt-pchip[data-polo]')).click(); await espera(p, FIM); r.push(['polo', await rolagem(p)]);
      await p.evaluate(() => [...document.querySelectorAll('.mun')].find(x => x.getAttribute('tabindex') === '0').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await espera(p, FIM); r.push(['município', await rolagem(p)]);
      T['6 rolagem'] = r.map(([n, x]) => ({ nivel: n, ...x })); await s.browser.close(); }
    // 7. Voltar do navegador (histórico) depois de abrir níveis
    { const s = await novo(); const p = s.page; const h0 = await p.evaluate(() => history.length);
      await p.click('.mt-regcards button[data-reg="Centro"]'); await espera(p, FIM);
      await (await p.$('.mt-pchip[data-polo]')).click(); await espera(p, FIM);
      const h1 = await p.evaluate(() => history.length);
      await p.goBack({ waitUntil: 'commit' }).catch(() => {}); await p.waitForTimeout(600);
      T['7 botão Voltar do navegador'] = { historicoAntes: h0, historicoDepois: h1, urlDepoisDoVoltar: p.url().replace(L.BASE, '(raiz)/'), saiuDoSite: !p.url().startsWith(L.BASE) || (await p.evaluate(() => document.querySelector('.mt-mapa') ? 'mapa' : 'sem mapa')) === 'sem mapa' }; await s.browser.close(); }
    // 8. rede lenta: clicar no município e dar Esc antes dos dados chegarem; clicar em alimentador 2x
    { const s = await novo('lenta'); const p = s.page;
      await p.click('.mt-regcards button[data-reg="Centro"]'); await espera(p, FIM, 10000); await (await p.$('.mt-pchip[data-polo]')).click(); await espera(p, FIM, 10000);
      await p.evaluate(() => [...document.querySelectorAll('.mun')].find(x => x.getAttribute('tabindex') === '0').dispatchEvent(new MouseEvent('click', { bubbles: true })));
      await p.waitForTimeout(150); await p.keyboard.press('Escape'); await espera(p, FIM, 10000); await p.waitForTimeout(1500);
      const e = await estado(p);
      T['8 Esc antes da rede chegar (4G lenta)'] = { nivel: e.classes, caminhosDeRedeOrfaos: await p.evaluate(() => document.querySelectorAll('.mt-redes path').length), legendaAlimentadorVisivel: await p.evaluate(() => { const l = document.querySelector('.mt-als'); return l && !l.hidden; }), erros: s.log.erros }; await s.browser.close(); }
    console.log(vp, JSON.stringify(T, null, 1));
  }
  fs.writeFileSync(`medicoes/travas-${rotulo}.json`, JSON.stringify(R, null, 1));
})();
