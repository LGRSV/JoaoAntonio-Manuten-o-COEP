const { chromium, abre, esp, foto, SITE } = require('./common');
(async () => {
  const b = await chromium.launch();
  const { ctx, page: p } = await abre(b, 'd');
  await p.goto(SITE, { waitUntil: 'networkidle' }); await esp(p, 2000);
  await p.click('.mt-regcards button[data-reg="Norte"]'); await esp(p, 2500);
  await p.click('.mt-polos button[data-polo*="ugust"]'); await esp(p, 2500);
  const cod = await p.evaluate(() => [...document.querySelectorAll('.mt-nomes text, .mt-mn')].find(x => /Araguatins/.test(x.textContent)).dataset.cod);
  await p.evaluate(c => document.querySelector(`.mun[data-cod="${c}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })), cod);
  await esp(p, 3000);
  p.on('framenavigated', f => console.log('NAV', f.url()));
  ctx.on('page', q => console.log('POPUP', q.url()));
  await p.locator('#ativo-res .so-al').first().click();
  for (let i = 0; i < 6; i++) { await esp(p, 1000); console.log(i, p.url(), await p.evaluate(() => (document.querySelector('.mt-polos') || {}).innerText)); }
  await b.close();
})();
