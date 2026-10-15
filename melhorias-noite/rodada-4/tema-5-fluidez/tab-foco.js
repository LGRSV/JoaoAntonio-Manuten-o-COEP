// Percorre o Tab em cada nível do mapa e registra: onde o foco para, se o elemento está visível / dentro de aria-hidden / fora da tela,
// se tem indicador de foco, quantas paradas há e o que as regiões aria-live anunciam na troca de nível.
// uso: node tab-foco.js <rotulo>      (PROTO=1 ou PROTO_ITENS=foco,live ... para o protótipo)
const L = require('./lib.js'), fs = require('fs'), inj = require('./injeta.js');
const rotulo = process.argv[2] || 'antes';
const espera = async (page, cond, ms = 6000) => { try { await page.waitForFunction(cond, null, { timeout: ms, polling: 30 }); } catch (e) {} };
const FIM = `!document.querySelector('.mt-mapa').classList.contains('voando')`;
const info = page => page.evaluate(() => {
  const a = document.activeElement; if (!a || a === document.body) return { n: 'BODY' };
  window.__ids = window.__ids || new WeakMap(); if (!window.__ids.has(a)) window.__ids.set(a, (window.__nid = (window.__nid || 0) + 1)); const uid = window.__ids.get(a);
  const r = a.getBoundingClientRect(), cs = getComputedStyle(a);
  let op = 1, vis = true, ah = false;
  for (let n = a; n && n.nodeType === 1; n = n.parentElement) { const c = getComputedStyle(n); op *= parseFloat(c.opacity); if (c.visibility === 'hidden') vis = false; if (n.getAttribute('aria-hidden') === 'true' || n.inert) ah = true; }
  const contorno = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0, sombra = cs.boxShadow !== 'none', traco = a instanceof SVGElement && cs.stroke !== 'none' && parseFloat(cs.strokeWidth) >= 2;
  const nome = (a.getAttribute('aria-label') || a.textContent || a.value || a.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  return { uid, n: a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') + (typeof a.className === 'string' && a.className ? '.' + a.className.split(' ')[0] : ''), nome, invisivel: op < 0.05 || !vis, ariaHidden: ah, foraDaTela: r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth, w: Math.round(r.width), h: Math.round(r.height), indicador: contorno || sombra || traco };
});
(async () => {
  const R = {};
  for (const [vp, cfg] of Object.entries({ desktop: { w: 1440, h: 900 }, celular: { w: 390, h: 844, mobile: true } })) {
    const s = await L.abre(cfg); await inj.aplica(s.ctx, s.page); const p = s.page;
    await s.ctx.addInitScript(() => { window.__anuncios = []; window.__ult = {}; document.addEventListener('DOMContentLoaded', () => {
      const obs = new MutationObserver(ms => ms.forEach(m => { const el = (m.target.nodeType === 3 ? m.target.parentElement : m.target); const lr = el && el.closest && el.closest('[aria-live],[role=status],[role=alert]'); if (lr && lr.getAttribute('aria-live') !== 'off') { const t = lr.textContent.trim().replace(/\s+/g, ' '); const k = (lr.id || lr.className || lr.tagName); if (t && window.__ult[k] !== t) { window.__ult[k] = t; window.__anuncios.push({ k, chars: t.length, t: t.slice(0, 150) }); } } }));
      obs.observe(document.body, { subtree: true, childList: true, characterData: true }); }); });
    await p.goto(L.BASE, { waitUntil: 'load' }); await espera(p, `document.querySelectorAll('.mun').length>100`); await p.waitForTimeout(500);
    const niveis = [
      ['estado', async () => {}],
      ['regional', async () => { await p.evaluate(() => window.ARGOS_MAPA.vai({ reg: 'Centro' })); }],
      ['polo', async () => { await p.evaluate(() => window.ARGOS_MAPA.vai({ polo: 'Porto Nacional' })); }],
      ['municipio', async () => { await p.evaluate(() => window.ARGOS_MAPA.vai({ cod: [...window.MUN.muns].find(m => m.polo === 'Porto Nacional' && m.slug && m.busca.includes('porto nacional')).cod })); }],
      ['alimentador', async () => { await p.evaluate(() => { const nv = window.ARGOS_MAPA.nivel(); const m = window.MUN.muns.find(x => x.cod === nv.mun); return window.ARGOS_MAPA.vai({ al: m.als.slice().sort((a, b) => b.m - a.m)[0].cod }); }); }],
    ];
    for (const [nivel, ir] of niveis) {
      await p.evaluate(() => { window.__anuncios = []; });
      await ir(); await espera(p, FIM, 8000); await p.waitForTimeout(900);
      const anuncios = await p.evaluate(() => window.__anuncios.slice());
      await p.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
      await p.evaluate(() => { const e = document.createElement('i'); e.id = '__ini'; e.tabIndex = 0; document.body.prepend(e); e.focus(); e.remove(); });
      const paradas = [], vistos = new Set();
      for (let i = 0; i < 40; i++) { await p.keyboard.press('Tab'); const x = await info(p); const k = x.uid; if (vistos.has(k) || x.n === 'BODY') { paradas.push({ ...x, volta: true }); break; } vistos.add(k); paradas.push(x); }
      const arvore = await p.locator('body').ariaSnapshot().catch(() => '');
      const vivas = await p.evaluate(() => [...document.querySelectorAll('[aria-live],[role=status],[role=alert]')].map(e => (e.id || e.className || e.tagName) + '[' + (e.getAttribute('aria-live') || e.getAttribute('role')) + ']'));
      R[`${vp}|${nivel}`] = { paradas, anuncios, vivas, arvore };
      const ruins = paradas.filter(x => x.invisivel || x.ariaHidden || x.foraDaTela || x.indicador === false);
      console.log(vp, nivel, 'paradas:', paradas.filter(x => !x.volta).length, '| problemas:', ruins.length, '| anúncios:', anuncios.length);
      paradas.forEach((x, i) => console.log('  ', String(i + 1).padStart(2), (x.n + ' "' + (x.nome || '') + '"').padEnd(62), x.invisivel ? 'INVISIVEL ' : '', x.ariaHidden ? 'ARIA-HIDDEN ' : '', x.foraDaTela ? 'fora-da-tela ' : '', x.indicador === false ? 'SEM-INDICADOR ' : '', x.volta ? '(volta ao começo)' : ''));
      console.log('   live:', vivas.join(', ')); anuncios.slice(0, 6).forEach(a => console.log('   anúncio:', a.k, a.chars + ' car.', a.t));
    }
    await s.browser.close();
  }
  fs.writeFileSync(`medicoes/tab-${rotulo}.json`, JSON.stringify(R, null, 1));
})();
