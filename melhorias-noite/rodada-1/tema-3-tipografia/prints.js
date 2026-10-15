// Gera os prints antes/depois do tema 3 (tipografia do mapa).
// Uso: node prints.js antes|depois [filtro-regex]   (prints em ./prints/<modo>-<nivel>-<tema>-<tam>.jpg)
// "antes" = site ao vivo; "depois" = site ao vivo com proto/site.css + proto/mapa-municipios.js injetados.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), fs = require('fs');
const { liga } = require('./rede.js');
const modo = process.argv[2] || 'antes', filtro = new RegExp(process.argv[3] || '.');
const URL = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/';
const over = modo === 'depois' ? {
  '/assets/site.css': path.join(__dirname, 'proto/site.css'),
  '/assets/mapa-municipios.js': path.join(__dirname, 'proto/mapa-municipios.js'),
} : {};
const TAMS = { desk: { width: 1440, height: 900 }, cel: { width: 390, height: 844 } };
// níveis: [nome, polo, município]
const NIVEIS = [
  ['1-estado'], ['2-regional', 'Norte'], ['3-polo', 'Norte', 'Araguaína'], ['3b-polo-denso', 'Norte', 'Augustinópolis'],
  ['4-municipio', 'Norte', 'Araguaína', 'Araguaína'], ['3c-polo-pequeno', 'Centro', 'Palmas'], ['4b-municipio-lista', 'Norte', 'Araguaína', 'Araguaína', 'puxa'],
];
async function vai(p, [, reg, polo, mun, extra]) {
  if (reg) { await p.click(`.mt-regcards button[data-reg="${reg}"]`); await p.waitForTimeout(1500); }
  if (polo) { await p.click(`.mt-pchip[data-polo="${polo}"]`); await p.waitForTimeout(1500); }
  if (mun) {
    await p.evaluate(nome => {
      const m = window.MUN.muns.find(x => x.nome === nome);
      document.querySelector(`.mun[data-cod="${m.cod}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    }, mun);
    await p.waitForTimeout(1800);
  }
  if (extra === 'puxa') { await p.click('.mt-puxa').catch(() => {}); await p.waitForTimeout(500); }
}
(async () => {
  const b = await chromium.launch();
  for (const tema of ['dark', 'light']) for (const [tn, vp] of Object.entries(TAMS)) for (const niv of NIVEIS) {
    const nome = `${modo}-${niv[0]}-${tema}-${tn}`;
    if (!filtro.test(nome)) continue;
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: tn === 'cel', hasTouch: tn === 'cel' });
    await ctx.addInitScript(t => { try { localStorage.setItem('tema', t === 'light' ? 'claro' : 'escuro'); } catch (e) {} }, tema);
    await liga(ctx, over);
    const p = await ctx.newPage();
    await p.goto(URL, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(1200);
    try { await vai(p, niv); } catch (e) { console.log('ERRO nav', nome, e.message.split('\n')[0]); }
    await p.mouse.move(vp.width - 5, 5);
    await p.screenshot({ path: path.join(__dirname, 'prints', nome + '.jpg'), type: 'jpeg', quality: 80 });
    console.log('ok', nome);
    await ctx.close();
  }
  await b.close();
})();
