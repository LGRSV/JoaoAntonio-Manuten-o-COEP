// Auditoria de fontes: pesos usados na tela x pesos carregados. Uso: node fontes.js antes|depois  -> imprime tabela
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), fs = require('fs');
const { liga, arquivosModo } = require('./rede.js');
const modo = process.argv[2] || 'antes';
const BASE = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/';
const over = arquivosModo(modo);
const usados = () => {
  const m = new Map();
  document.querySelectorAll('body *').forEach(e => {
    if (!e.childNodes.length || ![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return;
    const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(), k = fam + ' ' + cs.fontWeight + (cs.fontStyle !== 'normal' ? ' ' + cs.fontStyle : '');
    const o = m.get(k) || { n: 0, ex: e.className ? '.' + String(e.className.baseVal ?? e.className).split(' ')[0] : e.tagName.toLowerCase() }; o.n++; m.set(k, o);
  });
  return [...m].map(([k, v]) => ({ k, ...v }));
};
(async () => {
  const b = await chromium.launch(), tudo = new Map();
  let carregadas = [];
  for (const [nome, pag, passos] of [['home', '', null], ['polo', '', { polo: 'Araguaína' }], ['mun', '', { cod: 'Araguaína' }], ['ranking', 'polos/', null]]) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); await liga(ctx, over);
    const p = await ctx.newPage(); await p.goto(BASE + pag, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(900);
    if (passos) {
      await p.evaluate(a => { const m = a.cod ? window.MUN.muns.find(x => x.nome === a.cod && x.polo === 'Araguaína') : null; return window.ARGOS_MAPA.vai(m ? { cod: m.cod } : a); }, passos);
      await p.waitForTimeout(2500);
      if (passos.cod) { await p.evaluate(() => window.ARGOS_MAPA.vai({ al: window.MUN.muns.find(x => x.nome === 'Araguaína').als[0].cod })); await p.waitForTimeout(1800); }
    }
    for (const u of await p.evaluate(usados)) { const o = tudo.get(u.k) || { n: 0, onde: new Set(), ex: u.ex }; o.n += u.n; o.onde.add(nome); tudo.set(u.k, o); }
    carregadas = carregadas.concat(await p.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/["']/g, '') + ' ' + f.weight + ' ' + (f.unicodeRange || '').slice(0, 12))));
    await ctx.close();
  }
  const fam = {}; carregadas.forEach(c => { const [f, w] = [c.split(/ (?=\d)/)[0], c.split(/ (?=\d)/)[1].split(' ')[0]]; (fam[f] = fam[f] || new Set()).add(w); });
  console.log('CARREGADAS:', Object.entries(fam).map(([f, s]) => f + ': ' + [...s].sort().join('/')).join(' | '));
  console.log('\nUSADOS (família peso -> nº de textos, onde, exemplo)');
  [...tudo].sort().forEach(([k, v]) => {
    const [f] = k.split(/ (?=\d)/), w = (k.match(/ (\d+)/) || [])[1], ok = fam[f] && fam[f].has(w);
    console.log((ok || !fam[f] ? '   ' : ' ! ') + k.padEnd(34), String(v.n).padStart(4), [...v.onde].join(','), v.ex);
  });
  await b.close();
})();
