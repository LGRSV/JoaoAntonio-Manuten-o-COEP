// Uso: NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node prints.js
// (o fetch passa pelo proxy do ambiente; o Chromium recebe as respostas via page.route)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const URL = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/';
const OUT = __dirname + '/';
const log = [];
async function run(nome, vp, mobile) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  await ctx.route('**/*', async r => { try {
    const rs = await fetch(r.request().url());
    const buf = Buffer.from(await rs.arrayBuffer());
    const h = Object.fromEntries([...rs.headers].filter(([k]) => !/content-encoding|content-length|transfer-encoding/i.test(k)));
    await r.fulfill({ status: rs.status, headers: h, body: buf });
  } catch (e) { await r.abort(); } });
  const p = await ctx.newPage();
  const shot = async (n, extra) => { await p.waitForTimeout(1600); await p.screenshot({ path: `${OUT}${n}-${nome}.jpg`, type: 'jpeg', quality: 80 }); };
  const txt = async sel => p.evaluate(s => [...document.querySelectorAll(s)].map(e => e.innerText.replace(/\s+/g, ' ').trim()), sel);
  await p.goto(URL, { waitUntil: 'networkidle' });
  await shot('01-estado');
  // regional
  await p.click('button[data-reg="Norte"]'); 
  await shot('02-regional');
  log.push([nome, 'polos', await txt('.mt-pchip')]);
  // polo
  const polos = await p.$$('.mt-pchip[data-polo]');
  const poloNome = await polos[0].getAttribute('data-polo');
  await polos[0].click();
  await shot('03-polo');
  log.push([nome, 'poloNome', poloNome]);
  // município: clica no 1º município com slug (aberto automaticamente 'roda' -> pega o focado)
  const cod = await p.evaluate(() => { const f = document.querySelector('.mun.roda, .mun[tabindex="0"]'); return f && f.dataset.cod; });
  log.push([nome, 'codMun', cod]);
  await p.evaluate(c => document.querySelector(`.mun[data-cod="${c}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })), cod);
  await p.waitForTimeout(2500);
  await shot('04-municipio');
  log.push([nome, 'alim', await txt('.mt-al')]);
  log.push([nome, 'caixaMun', await txt('.mt-amun')]);
  // foco no alimentador: 1º da lista
  if (mobile) { await p.click('.mt-puxa'); await shot('04b-municipio-lista'); }
  await p.click('.mt-al');
  await shot('05-foco-alimentador');
  log.push([nome, 'abrir', await txt('.mt-amun')]);
  log.push([nome, 'trilha', await txt('#legpolos, .mt-passo, .mt-atual')]);
  // voltar pela trilha (Esc)
  await p.keyboard.press('Escape'); await shot('06-esc-volta-municipio');
  await p.keyboard.press('Escape'); await shot('07-esc-volta-polo');
  await p.keyboard.press('Escape'); await shot('08-esc-volta-regional');
  await p.keyboard.press('Escape'); await shot('09-esc-volta-estado');
  // tema claro
  await p.keyboard.press('Shift+K'); await p.waitForTimeout(600);
  await shot('10-estado-claro');
  await p.click('button[data-reg="Centro"]');
  await shot('11-regional-claro');
  log.push([nome, 'centro', await txt('.mt-pchip')]);
  await b.close();
}
(async () => {
  await run('desk', { width: 1440, height: 900 }, false);
  await run('mob', { width: 390, height: 844 }, true);
  console.log(JSON.stringify(log, null, 1));
})();
