// Gera os prints antes/depois (JPEG 1440x900 e 390x844, tema escuro). Uso: node prints.js
const L = require('./lib.js'), inj = require('./injeta.js'), fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, 'prints'); fs.mkdirSync(OUT, { recursive: true });
const VPS = { '1440': { w: 1440, h: 900 }, '390': { w: 390, h: 844, mobile: true } };
const espera = async (page, cond, ms = 8000) => { try { await page.waitForFunction(cond, null, { timeout: ms, polling: 30 }); } catch (e) {} };
const FIM = `!document.querySelector('.mt-mapa').classList.contains('voando')`;
const foto = (page, nome) => page.screenshot({ path: path.join(OUT, nome + '.jpg'), type: 'jpeg', quality: 80, scale: 'css' });
const novo = async (vp, proto, extra = {}) => { const s = await L.abre({ ...VPS[vp], ...extra }); await inj.aplica(s.ctx, s.page, proto); return s; };
(async () => {
  for (const vp of Object.keys(VPS)) for (const [lado, proto] of [['antes', false], ['depois', true]]) {
    // 01 · salto do cabeçalho: o menu.js atrasado 400 ms mostra o quadro de antes do menu entrar (hoje ele entra ~10 ms depois do 1º quadro)
    { const s = await novo(vp, proto);
      await s.ctx.route('**/assets/menu.js', async r => { await new Promise(ok => setTimeout(ok, 500)); r.continue(); });
      await s.page.goto(L.BASE, { waitUntil: 'commit' }); await espera(s.page, `document.querySelectorAll('.mun').length>100`); await s.page.waitForTimeout(200);
      await foto(s.page, `01-${lado}-salto-menu-${vp}-quadro1`);
      await espera(s.page, `!!document.querySelector('.mnu')`, 5000); await s.page.waitForTimeout(400); await foto(s.page, `01-${lado}-salto-menu-${vp}-quadro2`);
      await s.browser.close(); }
    // 02 · voo: meio da animação "abrir município" (CPU 4x) e o pouso
    { const s = await novo(vp, proto, { perfil: 'cpu4' }); const p = s.page;
      await p.goto(L.BASE, { waitUntil: 'load' }); await espera(p, `document.querySelectorAll('.mun').length>100`); await p.waitForTimeout(500);
      await p.click('.mt-regcards button[data-reg="Centro"]'); await espera(p, FIM); await p.waitForTimeout(400);
      await (await p.$('.mt-pchip[data-polo]')).click(); await espera(p, FIM); await p.waitForTimeout(400);
      await p.evaluate(() => [...document.querySelectorAll('.mun')].find(x => x.getAttribute('tabindex') === '0').dispatchEvent(new MouseEvent('click', { bubbles: true })));
      await espera(p, `document.querySelectorAll('.mt-redes-d path').length>0`, 15000); await p.waitForTimeout(1800);
      if (vp === '390') { const px = await p.$('.mt-puxa'); if (px) { await px.click(); await p.waitForTimeout(300); } }
      await foto(p, `02-${lado}-municipio-pousado-${vp}`);
      await p.evaluate(() => document.querySelector('.mt-al').click()); await p.waitForTimeout(260); await foto(p, `02-${lado}-zoom-alimentador-meio-do-voo-${vp}`);
      await espera(p, FIM); await p.waitForTimeout(700); await foto(p, `02-${lado}-zoom-alimentador-pousado-${vp}`);
      await s.browser.close(); }
    // 03 · foco: regional aberta, Tab até o 10º item (antes: pára em cartões invisíveis)
    { const s = await novo(vp, proto); const p = s.page;
      await p.goto(L.BASE, { waitUntil: 'load' }); await espera(p, `document.querySelectorAll('.mun').length>100`); await p.waitForTimeout(500);
      await p.click('.mt-regcards button[data-reg="Centro"]'); await espera(p, FIM); await p.waitForTimeout(600);
      await p.evaluate(() => { document.activeElement.blur(); const e = document.createElement('i'); e.tabIndex = 0; document.body.prepend(e); e.focus(); e.remove(); });
      const paradas = []; for (let i = 0; i < 12; i++) { await p.keyboard.press('Tab'); paradas.push(await p.evaluate(() => { const a = document.activeElement; let op = 1; for (let n = a; n && n.nodeType === 1; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity); const vis = getComputedStyle(a).visibility; return (a.getAttribute('aria-label') || a.textContent || a.tagName).trim().slice(0, 26) + (op < .05 || vis === 'hidden' ? ' [INVISÍVEL]' : ''); })); if (i === 9) await foto(p, `03-${lado}-tab-10-paradas-${vp}`); }
      fs.writeFileSync(path.join(OUT, `03-${lado}-tab-${vp}.txt`), paradas.map((x, i) => `${i + 1}. ${x}`).join('\n') + '\n');
      await s.browser.close(); }
    // 04 · Voltar do navegador depois de abrir regional e polo
    { const s = await novo(vp, proto); const p = s.page;
      await p.goto('about:blank'); await p.goto(L.BASE, { waitUntil: 'load' }); await espera(p, `document.querySelectorAll('.mun').length>100`); await p.waitForTimeout(500);
      await p.click('.mt-regcards button[data-reg="Centro"]'); await espera(p, FIM); await (await p.$('.mt-pchip[data-polo]')).click(); await espera(p, FIM); await p.waitForTimeout(500);
      await foto(p, `04-${lado}-antes-de-voltar-${vp}`);
      await p.goBack({ waitUntil: 'commit' }).catch(() => {}); await p.waitForTimeout(1200); await foto(p, `04-${lado}-depois-do-voltar-${vp}`);
      await s.browser.close(); }
    // 05 · alvos de toque (só celular): contorno vermelho nos alvos < 44 px
    if (vp === '390') { const s = await novo(vp, proto); const p = s.page;
      await p.goto(L.BASE, { waitUntil: 'load' }); await espera(p, `document.querySelectorAll('.mun').length>100`); await p.waitForTimeout(500);
      await p.click('.mt-regcards button[data-reg="Centro"]'); await espera(p, FIM); await p.waitForTimeout(600);
      await p.evaluate(() => { document.querySelectorAll('a[href],button,summary').forEach(e => { const r = e.getBoundingClientRect(); if (!r.width || !r.height || getComputedStyle(e).visibility === 'hidden' || +getComputedStyle(e).opacity < .05) return; const ok = r.width >= 44 && r.height >= 44; e.style.outline = ok ? '2px solid #22c55e' : '2px solid #ef4444'; e.style.outlineOffset = '-2px'; }); });
      await foto(p, `05-${lado}-alvos-de-toque-${vp}`); await s.browser.close(); }
  }
  console.log(fs.readdirSync(OUT).join('\n'));
})();
