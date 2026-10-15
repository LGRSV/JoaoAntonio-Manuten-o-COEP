// Confere números citados no roteiro (só leitura, imprime textos). Uso: node fatos.js
const { chromium, abre, esp, SITE } = require('./common');
const BASE = SITE + 'alimentadores/';
const digita = async (p, t) => { const q = p.locator('#ativo-q'); await q.fill(''); await q.pressSequentially(t, { delay: 30 }); await esp(p, 1100); };
(async () => {
  const b = await chromium.launch();
  const { ctx, page: p } = await abre(b, 'd');
  await p.goto(SITE, { waitUntil: 'networkidle' }); await esp(p, 2000);
  await p.click('#lupa'); await esp(p, 400);
  for (const t of ['Araguaína', 'Porto Nacional', 'ETO310211A', 'Norte', 'LD03010004']) {
    await digita(p, t); console.log('BUSCA', t, '=>', await p.evaluate(() => document.querySelector('#ativo-res').innerText.replace(/\s+/g, ' ').slice(0, 500)));
  }
  const painel = async (al, q) => {
    await p.goto(BASE + al + '/' + (q || ''), { waitUntil: 'load' });
    await p.waitForFunction(() => window.__map && window.D && document.documentElement.classList.contains('al-pronto'), null, { timeout: 60000 }); await esp(p, 3000);
    const txt = await p.evaluate(() => document.querySelector('main, .wrap, body').innerText.replace(/\s+/g, ' '));
    console.log('PAINEL', al, q || '', '=>', txt.slice(0, 1800));
  };
  await painel('LD01072001', '?t=T1');
  await painel('LD03010004');
  await painel('AL03037009');
  await b.close();
})();
