// Coerência do histórico no protótipo: abre/sobe por interface e pelo Voltar/Avançar do navegador e confere o nível em cada passo
const L = require('./lib.js'), inj = require('./injeta.js');
const esp = async (p, c, ms = 6000) => { try { await p.waitForFunction(c, null, { timeout: ms, polling: 30 }); } catch (e) {} };
const FIM = `!document.querySelector('.mt-mapa').classList.contains('voando')`;
const nivel = p => p.evaluate(() => { const c = document.querySelector('.mt-mapa'); return !c ? 'FORA DO MAPA' : c.classList.contains('nivel-mun') ? 'município' : c.classList.contains('polo') ? 'polo' : c.classList.contains('aberta') ? 'regional' : 'estado'; });
(async () => {
  const s = await L.abre({}); await inj.aplica(s.ctx, s.page, true); const p = s.page; const passos = [];
  const reg = async t => { await p.waitForTimeout(900); passos.push(t + ' → ' + await nivel(p) + ' (histórico ' + await p.evaluate(() => history.length) + ')'); };
  await p.goto('about:blank'); await p.goto(L.BASE, { waitUntil: 'load' }); await esp(p, `document.querySelectorAll('.mun').length>100`); await p.waitForTimeout(400);
  await p.click('.mt-regcards button[data-reg="Centro"]'); await reg('clicar Centro');
  await (await p.$('.mt-pchip[data-polo]')).click(); await reg('clicar polo');
  await p.evaluate(() => [...document.querySelectorAll('.mun')].find(x => x.getAttribute('tabindex') === '0').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await reg('clicar município');
  await p.goBack(); await reg('Voltar #1');
  await p.keyboard.press('Escape'); await reg('Esc');
  await p.goBack(); await reg('Voltar #2');
  await p.goForward(); await reg('Avançar (não reabre: só mantém o estado)');
  await p.click('.mt-regcards button[data-reg="Sul"]'); await reg('clicar Sul');
  await p.click('.mt-volta'); await reg('botão ←');
  await p.goBack({ waitUntil: 'commit' }).catch(() => {}); await p.waitForTimeout(800); passos.push('Voltar final → ' + (p.url() === 'about:blank' ? 'saiu do site (about:blank)' : await nivel(p)));
  console.log(passos.join('\n')); console.log(s.log.erros); await s.browser.close();
})();
