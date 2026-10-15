// Experimento: qual parte do SVG pesa nos quadros da animação "abrir município / zoom no alimentador / voltar"? (CPU 4x, desktop)
const L = require('./lib.js');
const V = {
  'V0 original': '',
  'V1 sem redes durante voo': '.voando .mt-redes{visibility:hidden}',
  'V2 sem non-scaling-stroke': '.voando .mt-redes path{vector-effect:none}',
  'V3 sem clip-path': '.voando .mt-redes-d{clip-path:none}',
  'V4 sem camada de fundo (-f)': '.voando .mt-redes-f{display:none}',
  'V5 optimizeSpeed': '.voando .mt-redes path{shape-rendering:optimizeSpeed}',
  'V6 outros municipios ocultos': '.voando .mun:not(.aberto-m){visibility:hidden}',
  'V7 nomes/selos/dica ocultos': '.voando .mt-nomes,.voando .mt-nomes2,.voando .mt-selos{display:none}',
};
const espera = async (page, cond, ms = 8000) => { try { await page.waitForFunction(cond, null, { timeout: ms, polling: 30 }); } catch (e) {} };
(async () => {
  for (const [nome, css] of Object.entries(V)) {
    const out = [];
    for (let i = 0; i < 2; i++) {
      const s = await L.abre({ perfil: 'cpu4', extraInit: L.instrumenta }); const { page } = s;
      await page.goto(L.BASE, { waitUntil: 'load' }); await espera(page, `document.querySelectorAll('.mun').length>100`);
      if (css) await page.addStyleTag({ content: css });
      await page.click('.mt-regcards button[data-reg="Centro"]'); await espera(page, `!document.querySelector('.mt-mapa').classList.contains('voando')`); await page.waitForTimeout(300);
      await (await page.$('.mt-pchip[data-polo]')).click(); await espera(page, `!document.querySelector('.mt-mapa').classList.contains('voando')`); await page.waitForTimeout(300);
      const r = {};
      for (const [k, act] of [['mun', async () => page.evaluate(() => [...document.querySelectorAll('.mun')].find(x => x.getAttribute('tabindex') === '0').dispatchEvent(new MouseEvent('click', { bubbles: true })))], ['aliment', async () => { await espera(page, `document.querySelectorAll('.mt-redes-d path').length>0`, 15000); await (await page.$('.mt-al')).click(); }], ['esc', () => page.keyboard.press('Escape')]]) {
        if (k === 'aliment') await act(); // prepara
        await page.evaluate(() => { window.__lt.length = 0; window.__fpsIni(); });
        if (k !== 'aliment') await act();
        await page.waitForTimeout(40); await espera(page, `!document.querySelector('.mt-mapa').classList.contains('voando')`); await page.waitForTimeout(100);
        r[k] = await page.evaluate(() => ({ ...window.__fpsFim(), ltMax: Math.max(0, ...window.__lt.map(x => x.d)) }));
      }
      out.push(r); await s.browser.close();
    }
    console.log(nome.padEnd(32), ['mun', 'aliment', 'esc'].map(k => `${k}: ${out.map(o => o[k].fps + 'fps/' + Math.round(o[k].ltMax) + 'ms').join(' , ')}`).join('  |  '));
  }
})();
