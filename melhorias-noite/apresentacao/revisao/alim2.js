// Cenas extras do alimentador: Insp→manut (INSP nº → MANUT nº) e dados do painel. Uso: node alim2.js
const { chromium, abre, esp, foto, SITE } = require('./common');
const BASE = SITE + 'alimentadores/';
const log = [];
async function carrega(p, al, q) {
  await p.goto(BASE + al + '/' + (q || ''), { waitUntil: 'load' });
  await p.waitForFunction(() => window.__map && window.D && document.documentElement.classList.contains('al-pronto'), null, { timeout: 60000 });
  await esp(p, 5000);
}
async function run(vp) {
  const b = await chromium.launch();
  const { ctx, page: p } = await abre(b, vp);
  const L = (k, v) => log.push([vp, k, v]);
  await p.addInitScript(() => { try { localStorage.setItem('limp-ligado', '0'); } catch (e) {} });
  await carrega(p, 'LD01072001');
  if (await p.getAttribute('.ctl-cam-b', 'aria-expanded') !== 'true') await p.click('.ctl-cam-b');
  await p.locator('#ctl-camadas button', { hasText: 'Insp→manut' }).click(); await esp(p, 800);
  L('menu', await p.evaluate(() => document.querySelector('#ctl-camadas').innerText.replace(/\s+/g, ' ')));
  await p.click('.ctl-cam-b'); await esp(p, 600);
  const card = await p.evaluate(() => { const c = document.querySelector('.mnt-sec, #mnt-card, .limp-card.mnt'); return c ? c.innerText.replace(/\s+/g, ' ').slice(0, 800) : null; });
  L('card', card);
  // abre o 1º grupo da lista (situação) e foca a 1ª OS
  const abres = p.locator('.limp-card button.abre');
  L('n-abre', await abres.count());
  await p.evaluate(vp => window.scrollTo(0, vp === 'd' ? 190 : 330), vp); await esp(p, 600);
  for (let i = 0; i < await abres.count(); i++) { const t = await abres.nth(i).innerText(); L('abre-' + i, t.replace(/\s+/g, ' ')); }
  await foto(p, 's16c-insp-manut-0', vp);
  const sec = p.locator('.limp-card', { hasText: 'Insp→manut' });
  const btns = sec.locator('button.abre:not([disabled])');
  if (await btns.count()) { await btns.first().click(); await esp(p, 900); }
  const os = sec.locator('button[data-k]'); L('n-os', await os.count());
  if (await os.count()) { await os.first().click(); await esp(p, 1800); L('os1', await os.first().innerText()); }
  if (vp === 'm') await p.evaluate(() => { const c = [...document.querySelectorAll('.limp-card')].find(x => /Insp→manut/.test(x.innerText)); window.scrollTo(0, c.getBoundingClientRect().top + scrollY - 400); }); await esp(p, 900);
  await foto(p, 's16c-insp-manut', vp);
  await b.close();
}
(async () => { await run('d'); await run('m'); console.log(JSON.stringify(log.filter(x => x[0] === 'd'), null, 1)); })();
