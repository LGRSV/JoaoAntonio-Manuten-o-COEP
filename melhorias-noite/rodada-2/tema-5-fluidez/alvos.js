// Alvos de toque < 44 px no celular (390x844) em cada nível do mapa, no menu, na busca aberta, nos polos e na página do alimentador.
// Conta botões, links, campos, summary e elementos focáveis visíveis (os paths dos municípios ficam numa contagem à parte).
// uso: node alvos.js <rotulo>
const L = require('./lib.js'), fs = require('fs'), inj = require('./injeta.js');
const rotulo = process.argv[2] || 'antes', MIN = 44;
const espera = async (page, cond, ms = 6000) => { try { await page.waitForFunction(cond, null, { timeout: ms, polling: 30 }); } catch (e) {} };
const FIM = `!document.querySelector('.mt-mapa').classList.contains('voando')`;
const varre = (page, min) => page.evaluate(min => {
  const sels = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=option],[tabindex="0"]';
  const out = [], mun = [];
  document.querySelectorAll(sels).forEach(e => {
    const r = e.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return;
    let ok = true, op = 1; for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const c = getComputedStyle(n); if (c.display === 'none' || c.visibility === 'hidden') ok = false; op *= parseFloat(c.opacity); }
    if (!ok || op < .05) return;
    if (r.bottom < 0 || r.top > innerHeight * 3) return;
    const isMun = e instanceof SVGElement; const w = Math.round(r.width), h = Math.round(r.height);
    const nome = (e.getAttribute('aria-label') || e.textContent || e.placeholder || '').trim().replace(/\s+/g, ' ').slice(0, 28);
    const item = { n: e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : ''), nome, w, h };
    if (isMun) { mun.push(item); return; }
    // alvo efetivo: o elemento ou, se menor, o espaço livre até os vizinhos não conta; aqui só o retângulo do próprio elemento
    if (w < min || h < min) out.push(item);
  });
  return { pequenos: out, municipiosPaths: mun.length, municipiosMenoresQue44: mun.filter(x => x.w < min || x.h < min).length };
}, min);
(async () => {
  const R = {};
  const s = await L.abre({ w: 390, h: 844, mobile: true }); await inj.aplica(s.ctx, s.page); const p = s.page;
  await p.goto(L.BASE, { waitUntil: 'load' }); await espera(p, `document.querySelectorAll('.mun').length>100`); await p.waitForTimeout(500);
  const reg = async (nome, f) => { await f(); await espera(p, FIM, 8000); await p.waitForTimeout(1100); R[nome] = await varre(p, MIN); console.log(nome.padEnd(22), 'alvos < 44:', R[nome].pequenos.length, '| paths:', R[nome].municipiosPaths, '(<44:', R[nome].municipiosMenoresQue44 + ')', R[nome].pequenos.map(x => `${x.nome}[${x.w}x${x.h}]`).join('  ')); };
  await reg('estado', async () => {});
  await reg('regional', () => p.evaluate(() => window.ARGOS_MAPA.vai({ reg: 'Centro' })));
  await reg('polo', () => p.evaluate(() => window.ARGOS_MAPA.vai({ polo: 'Porto Nacional' })));
  await reg('municipio', () => p.evaluate(() => window.ARGOS_MAPA.vai({ cod: window.MUN.muns.find(m => m.polo === 'Porto Nacional' && m.busca.includes('porto nacional')).cod })));
  await reg('alimentador', () => p.evaluate(() => { const m = window.MUN.muns.find(x => x.cod === window.ARGOS_MAPA.nivel().mun); return window.ARGOS_MAPA.vai({ al: m.als.slice().sort((a, b) => b.m - a.m)[0].cod }); }));
  // gaveta de alimentadores do celular (seta) e busca aberta
  await reg('busca-aberta', async () => { await p.evaluate(() => window.ARGOS_MAPA.vai({})); await p.waitForTimeout(900); await p.tap('#ativo-q'); await p.waitForTimeout(400); });
  await reg('menu-aberto', async () => { await p.keyboard.press('Escape'); await p.evaluate(() => document.activeElement.blur()); await p.tap('.mnu-btn'); await p.waitForTimeout(300); });
  for (const [nome, url] of [['polos', 'polos/'], ['alimentador-pagina', 'alimentadores/LD02022033/']]) {
    await p.goto(L.BASE + url, { waitUntil: 'load' }); await p.waitForTimeout(nome === 'polos' ? 1500 : 4000); R[nome] = await varre(p, MIN);
    console.log(nome.padEnd(22), 'alvos < 44:', R[nome].pequenos.length, R[nome].pequenos.map(x => `${x.nome}[${x.w}x${x.h}]`).join('  '));
  }
  fs.writeFileSync(`medicoes/alvos-${rotulo}.json`, JSON.stringify(R, null, 1));
  await s.browser.close();
})();
