// A lupa do painel (lupa-painel.js) com o pacote ligado: abre, digita, escolhe um trecho, usa a tela cheia. Compara fatos antes x depois.
// uso: [PROTO=1] node lupa-fluxo.js <rotulo> <1440|390>
const L = require('./lib.js'), inj = require('./injeta.js'), fs = require('fs');
const rot = process.argv[2] || 'antes', vp = process.argv[3] || '1440';
(async () => {
  const s = await L.abre(vp === '390' ? { w: 390, h: 844, mobile: true } : {}); await inj.aplica(s.ctx, s.page); const p = s.page; const F = {};
  await p.goto(L.BASE + 'alimentadores/LD02022033/', { waitUntil: 'load' }); await p.waitForFunction(`document.documentElement.classList.contains('al-pronto')`, null, { timeout: 60000 }); await p.waitForTimeout(1500);
  const fato = () => p.evaluate(() => ({ aberta: document.querySelector('.barra-busca').classList.contains('lp-fechada') ? 'fechada' : 'aberta', sug: document.querySelectorAll('.lp-sug .lp-op, .lp-sug [role=option], .lp-sug button').length, drop: !document.getElementById('lp-drop').hidden,
    camadas: Object.keys(window.__map._layers).length, selecionado: ((document.querySelector('#lista .row.sel, #lista .row.on, #lista .row[aria-selected=true]') || {}).textContent || '').replace(/\s+/g, ' ').slice(0, 40), erroBarra: !!document.querySelector('.wrap>.barra-busca'), stageTop: Math.round(document.querySelector('.stage').getBoundingClientRect().top + scrollY) }));
  F.inicial = await fato();
  await p.click('.lp-lupa'); await p.waitForTimeout(500); F.aberta = await fato();
  await p.click('#busca'); await p.waitForTimeout(500); F.campo = await fato();
  await p.keyboard.type('T3-A', { delay: 40 }); await p.waitForTimeout(900); F.digitou = await fato();
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await p.waitForTimeout(1200); F.escolheu = await fato();
  await p.locator('.tc-btn').click().catch(() => {}); await p.waitForTimeout(900); F.telaCheia = await p.evaluate(() => ({ barraNaGaveta: !!document.querySelector('.tc-gaveta .barra-busca, [class*=gaveta] .barra-busca'), mapa: (() => { const b = document.getElementById('map').getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; })() }));
  await p.keyboard.press('Escape'); await p.waitForTimeout(600); F.saiu = await fato();
  F.erros = s.log.erros.filter(e => !/Failed to load resource|net::ERR/.test(e));
  fs.writeFileSync(`medicoes/lupa-fluxo-${rot}-${vp}.json`, JSON.stringify(F, null, 1)); console.log(rot, vp, JSON.stringify(F)); await s.browser.close();
})();
