// Prints da busca e do menu (slides 9 a 11). Uso: node busca.js
const { chromium, abre, esp, foto, SITE } = require('./common');
const log = [];
const digita = async (p, t) => { const q = p.locator('#ativo-q'); await q.fill(''); await q.pressSequentially(t, { delay: 40 }); await esp(p, 1100); };
const res = p => p.evaluate(() => document.querySelector('#ativo-res').innerText.replace(/\s+/g, ' ').slice(0, 600));
async function run(vp) {
  const b = await chromium.launch();
  const { ctx, page: p } = await abre(b, vp);
  const L = (k, v) => log.push([vp, k, v]);
  const inicio = async () => { await p.goto(SITE, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready); await esp(p, 2000); };
  await inicio();
  await p.click('#lupa'); await esp(p, 600);
  await foto(p, 's09-busca-aberta', vp);
  await digita(p, 'Palmas'); L('palmas', await res(p)); await foto(p, 's09b-busca-municipio', vp);
  await digita(p, 'AL03037009'); L('al', await res(p)); await foto(p, 's09c-busca-alimentador', vp);
  await digita(p, '7933799001'); L('ativo-sug', await res(p)); await foto(p, 's10-busca-ativo-sugestao', vp);
  await p.press('#ativo-q', 'Enter'); await esp(p, 1500); L('ativo-res', await res(p)); await foto(p, 's10b-busca-ativo-resultado', vp);
  await digita(p, '943/2022'); L('os-sug', await res(p)); await foto(p, 's10c-busca-os-sugestao', vp);
  await p.press('#ativo-q', 'Enter'); await esp(p, 1500); L('os-res', await res(p)); await foto(p, 's10d-busca-os-resultado', vp);
  await digita(p, 'ETO-RD-PO 000353/2026'); await p.press('#ativo-q', 'Enter'); await esp(p, 1500); L('os-eq', await res(p)); await foto(p, 's10e-busca-os-equipe', vp);
  await Promise.all([p.waitForNavigation({ waitUntil: 'load' }), p.locator('#ativo-res a').first().click()]);
  await esp(p, 7000); L('url', p.url()); await foto(p, 's10f-abrir-no-mapa', vp);
  // menu
  await inicio();
  await p.click('.mnu-btn'); await esp(p, 600); L('menu', await p.evaluate(() => document.querySelector('.mnu-lista') && document.querySelector('.mnu-lista').innerText.replace(/\s+/g, ' ')));
  await foto(p, 's11-menu', vp);
  await p.keyboard.press('Escape'); await p.keyboard.press('Shift+K'); await esp(p, 600);
  await p.click('.mnu-btn'); await esp(p, 500); await foto(p, 's11b-menu-claro', vp);
  await p.keyboard.press('Escape'); await p.keyboard.press('Shift+K'); await esp(p, 400);
  await p.click('.mnu-btn'); await p.locator('.mnu-lista button', { hasText: 'tualiza' }).first().click(); await esp(p, 2500);
  L('bases', await p.evaluate(() => (document.querySelector('.mnu-bases') || document.body).innerText.replace(/\s+/g, ' ').slice(0, 700)));
  await foto(p, 's11c-atualizar-bases', vp);
  await b.close();
}
(async () => { await run('d'); await run('m'); console.log(JSON.stringify(log, null, 1)); })();
