// Gera os 2 prints da capa (página inicial do ARGOS Manutenção) em JPEG: desktop 1440x900 e celular 390x844, tema escuro.
// Uso: node prints.js   (grava 01-capa-1440x900.jpg e 02-capa-390x844.jpg nesta pasta)
// Obs.: neste ambiente o Chromium não confia na CA do proxy de saída; as requisições https são atendidas pelo Node
// (que confia em NODE_EXTRA_CA_CERTS), sem desligar a verificação de certificado.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const URL = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/';
async function abre(ctxOpts) {
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY || 'http://127.0.0.1:43789' } });
  const ctx = await b.newContext(ctxOpts);
  await ctx.route(/^https:\/\//, async route => {
    try { await route.fulfill({ response: await ctx.request.fetch(route.request(), { maxRedirects: 5 }) }); }
    catch (e) { await route.abort(); }
  });
  await ctx.addInitScript(() => { try { localStorage.setItem('tema', 'escuro'); } catch (e) {} });
  return { b, ctx };
}
(async () => {
  const alvos = [
    ['01-capa-1440x900.jpg', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }],
    ['02-capa-390x844.jpg', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }],
  ];
  for (const [arq, opts] of alvos) {
    const { b, ctx } = await abre(opts);
    const p = await ctx.newPage();
    await p.goto(URL, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForSelector('.mt-regcards button');
    await p.waitForTimeout(1500);
    await p.screenshot({ path: arq, type: 'jpeg', quality: 80 });
    await b.close();
    console.log('ok', arq);
  }
})();
