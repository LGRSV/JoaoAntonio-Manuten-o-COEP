// confere que o desenho das linhas não mudou (tira foto do mapa antes e depois do protótipo, em 3 zooms, e compara pixel a pixel) e que não há erro de console
const L = require('./lib.js'), fs = require('fs');
const foto = async (proto, nome) => { process.env.PROTO = proto ? '1' : ''; delete require.cache[require.resolve('./injeta.js')]; const inj = require('./injeta.js');
  const s = await L.abre({ w: 1440, h: 900 }); await inj.aplica(s.ctx, s.page); const p = s.page;
  await s.ctx.route('https://server.arcgisonline.com/**', r => r.fulfill({ status: 200, body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'), contentType: 'image/png' }));   // satélite neutro: só as linhas contam
  await p.goto(L.BASE + 'alimentadores/LD02022033/', { waitUntil: 'load' }); await p.waitForFunction('window.__map && document.querySelector("#lista > *")', null, { timeout: 40000 }); await p.waitForTimeout(2000);
  for (const dz of [0, 2, 4]) { await p.evaluate(dz => { const m = window.__map; m.setView(m.getCenter(), 10 + dz, { animate: false }); }, dz); await p.waitForTimeout(700); await p.locator('#map').screenshot({ path: `/tmp/eq-${nome}-${dz}.png` }); }
  const erros = s.log.erros.filter(e => !/arcgis|Failed to load resource/.test(e)); await s.browser.close(); return erros; };
(async () => { const e1 = await foto(false, 'a'), e2 = await foto(true, 'b'); console.log('erros antes:', e1.length, e1.slice(0, 2), '| depois:', e2.length, e2.slice(0, 2)); })();
