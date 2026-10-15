// Prints do mapa (slides 4 a 8). Uso: node mapa.js   -> prints/s04-*, s05-*, ...
const { chromium, abre, esp, foto, SITE } = require('./common');
const log = [];
const txt = (p, sel) => p.evaluate(s => [...document.querySelectorAll(s)].map(e => e.innerText.replace(/\s+/g, ' ').trim()), sel);
async function run(vp) {
  const b = await chromium.launch();
  const { ctx, page: p } = await abre(b, vp);
  const L = (k, v) => log.push([vp, k, v]);
  await p.goto(SITE, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready); await esp(p, 2500);
  await foto(p, 's04-estado', vp);
  L('regcards', await txt(p, '.mt-regcards button'));
  // legenda recolhida (orelhinha): números saem do mapa
  await p.click('.mt-regs-b, .mt-regs'); await esp(p, 1200);
  await foto(p, 's04b-estado-legenda-recolhida', vp);
  await p.click('.mt-regs'); await esp(p, 900);
  // regional
  await p.click('.mt-regcards button[data-reg="Norte"]'); await esp(p, 2800);
  await foto(p, 's05-regional-norte', vp);
  L('polos', await txt(p, '.mt-polos button'));
  // polo Augustinópolis
  await p.click('.mt-polos button[data-polo*="ugust"]'); await esp(p, 2800);
  await foto(p, 's05b-polo-augustinopolis', vp);
  L('muns-rot', await txt(p, '.mt-mn'));
  // município Araguatins
  const cod = await p.evaluate(() => { const t = [...document.querySelectorAll('.mt-nomes text, .mt-mn')].find(x => /Araguatins/.test(x.textContent)); return t && t.dataset.cod; });
  L('cod', cod);
  await p.evaluate(c => document.querySelector(`.mun[data-cod="${c}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })), cod);
  await esp(p, 3000);
  await foto(p, 's06-municipio', vp);
  L('lista', await txt(p, '#ativo-res .sug-op, #ativo-res .sug-t'));
  L('res-html', await p.evaluate(() => document.querySelector('#ativo-res').innerText.replace(/\s+/g,' ').slice(0,300)));
  await p.locator('#ativo-res .so-al').first().click(); await esp(p, 2500);
  await foto(p, 's07-foco-alimentador', vp);
  L('caixa-foco', await txt(p, '.mt-amun'));
  L('barra', await txt(p, '.mt-polos'));
  await p.keyboard.press('Escape'); await esp(p, 2000); await foto(p, 's07b-esc-municipio', vp);
  await p.keyboard.press('Escape'); await esp(p, 2000); await foto(p, 's07c-esc-polo', vp);
  await p.keyboard.press('Escape'); await esp(p, 2000);
  await p.keyboard.press('Escape'); await esp(p, 2000);
  // tela cheia (estado)
  await p.click('.mt-tc'); await esp(p, 2000); await foto(p, 's08-tela-cheia', vp);
  await p.keyboard.press('Escape'); await esp(p, 1200);
  // tema claro
  await p.keyboard.press('Shift+K'); await esp(p, 800);
  await foto(p, 's08b-estado-claro', vp);
  await p.click('.mt-regcards button[data-reg="Centro"]'); await esp(p, 2800);
  await foto(p, 's08c-regional-claro', vp);
  L('centro', await txt(p, '.mt-polos button'));
  await b.close();
}
(async () => { await run('d'); await run('m'); console.log(JSON.stringify(log, null, 1)); })();
