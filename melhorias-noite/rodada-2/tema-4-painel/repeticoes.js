/* Conta quantas vezes cada dado aparece, ao mesmo tempo, na tela (texto visível na janela, sem o que está rolado para fora do painel).
 * Compara o site com a lupa (antes) e o protótipo consolidado (depois). Grava repeticoes.json.
 *   NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node repeticoes.js [--alim=LD01072001]
 * Estados: "inicial" (padrão: Faixa ligada), "camadas" (as 4 ligadas), "trecho" (T2-A escolhido, 4 camadas) e "lupa" (lista suspensa aberta
 * sobre o estado inicial). Cada dado é um padrão de texto; o resultado traz os trechos de texto onde ele apareceu.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const { abre, ligaCamadas, escolhe } = require('./prints.js');

// os dados vêm da própria página (window.D): nada digitado à mão. Cada dado é um número (ou texto) distintivo do alimentador, em
// qualquer formato que o site usa (2 casas na tabela, 1 casa na lupa). A "linha" de texto é o bloco visual onde o número aparece.
const FATOS = D => {
  const nf = n => Number(n).toLocaleString('pt-BR'), kd = (m, c) => (m / 1000).toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
  const total = (D.meta.resumo || {}).extensao_m ?? D.trechos.reduce((s, t) => s + t.ext, 0);
  const cl = { T1: [0, 0], T2: [0, 0], T3: [0, 0] };
  D.trechos.forEach(t => { const c = cl[t.nome.split('-')[0]]; if (c) { c[0]++; c[1] += t.ext; } });
  const nae = typeof doMes === 'function' ? doMes().length : null;
  const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const num = n => '(^|[^\\d.,])' + esc(nf(n)) + '([^\\d.,]|$)';
  const f = [
    [`extensão total do alimentador (${kd(total, 2)} km, ou ${kd(total, 1)} km nos subtítulos)`, new RegExp('(^|[^\\d.,])(' + esc(kd(total, 2)) + '([^\\d]|$)|' + esc(kd(total, 1)) + ' km)')],
    ['nº total de trechos (199)', new RegExp(num(D.trechos.length))],
    ['subestação (SE-… NOME)', new RegExp('^\\s*' + esc(((document.querySelector('.eyebrow') || {}).textContent || 'SE-').trim().slice(0, 10)))],
    ['código do alimentador (título, ou célula da tabela)', new RegExp('^\\s*' + esc(D.meta.al || '') + '\\s*$')],
    ['"Trechos por ativo"', /Trechos por ativo/],
  ];
  Object.entries(cl).forEach(([c, [n, m]]) => { if (n > 20) f.push([`${c}: nº de trechos (${nf(n)})`, new RegExp(num(n))]); f.push([`${c}: extensão (${kd(m, 2)} km / ${kd(m, 1)} km)`, new RegExp('(^|[^\\d.,])(' + esc(kd(m, 2)) + '|' + esc(kd(m, 1)) + ') km')]); });
  f.push(['linha do trecho T1 (nome … → fim)', /(^|\s)T1\s[^→]*→/]);
  if (nae != null) f.push([`NAE do alimentador (${nae})`, new RegExp('NAE[^\\d]{0,24}' + nae + '([^\\d]|$)|(^|[^\\d])' + nae + ' no alimentador')]);
  return f.map(([nome, re]) => [nome, re.source]);
};

const COLETA = (fatos) => {
  const visivel = el => {
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false;
    if (r.bottom <= 0 || r.right <= 0 || r.top >= innerHeight || r.left >= innerWidth) return false;
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0' || e.hidden) return false;
      if (e.tagName === 'DETAILS' && !e.open && !(el.closest('summary'))) return false;   // conteúdo de <details> fechado não está à vista
      if (cs.overflowY !== 'visible' || cs.overflowX !== 'visible') { const q = e.getBoundingClientRect(); if (r.bottom <= q.top + 1 || r.top >= q.bottom - 1 || r.right <= q.left + 1 || r.left >= q.right - 1) return false; }
    }
    return true;
  };
  const alvos = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    const tx = n.textContent.replace(/\s+/g, ' ').trim(); if (!tx) continue;
    const el = n.parentElement; if (!el || /SCRIPT|STYLE|NOSCRIPT/.test(el.tagName)) continue;
    if (el.closest('.leaflet-container') && !el.closest('.ctl-lgs, .classes, .ctl-dir, .tc-canto')) continue;   // só o que é interface sobre o mapa (rótulos do mapa são o próprio mapa)
    if (visivel(el)) alvos.push({ tx, bloco: (el.closest('.lp-drop,.lp-fdrop') ? 'lupa' : el.closest('.panel') ? 'painel' : el.closest('header,.al-res,.migalhas') ? 'cabeçalho' : el.closest('.ctl-lgs,.classes') ? 'legenda do mapa' : el.closest('.barra-busca') ? 'barra' : 'outro') });
  }
  // junta os nós de texto de cada "linha" (o pai mais próximo com bloco) para achar "153,98 km" e "NAE 23" mesmo quebrados em <b>/<span>
  const linhas = new Map();
  const w2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w2.nextNode());) {
    const el = n.parentElement; if (!el || /SCRIPT|STYLE|NOSCRIPT/.test(el.tagName) || !n.textContent.trim() || !visivel(el)) continue;
    if (el.closest('.leaflet-container') && !el.closest('.ctl-lgs, .classes, .ctl-dir, .tc-canto')) continue;
    let b = el; while (b.parentElement && b.parentElement !== document.body && !/^(P|LI|TR|DIV|SECTION|HEADER|BUTTON|DT|DD|H1|H2|H3|A|LABEL|SUMMARY)$/.test(b.tagName)) b = b.parentElement;
    const bloco = el.closest('.lp-drop,.lp-fdrop') ? 'lupa' : el.closest('.panel') ? 'painel' : el.closest('header,.al-res,.migalhas') ? 'cabeçalho' : el.closest('.ctl-lgs,.classes') ? 'legenda do mapa' : el.closest('.barra-busca') ? 'barra' : 'outro';
    const k = linhas.get(b) || { tx: '', bloco }; k.tx += ' ' + n.textContent.replace(/\s+/g, ' ').trim(); linhas.set(b, k);
  }
  const L = [...linhas.values()].map(k => ({ tx: k.tx.replace(/\s+/g, ' ').trim(), bloco: k.bloco }));
  return fatos.map(([nome, src]) => {
    const re = new RegExp(src), ach = L.filter(l => re.test(l.tx));
    return { dado: nome, vezes: ach.length, onde: ach.map(l => l.bloco + ': ' + l.tx.slice(0, 70)) };
  });
};

const ESTADO = {
  inicial: async () => {},
  camadas: async p => { await ligaCamadas(p); },
  trecho: async p => { await ligaCamadas(p); await escolhe(p, 'T2-A'); },
  lupa: async p => { await p.click('.lp-lupa'); await p.waitForTimeout(500); },
};

(async () => {
  const args = process.argv.slice(2), alims = (args.find(a => a.startsWith('--alim=')) || '--alim=LD01072001').slice(7).split(',');
  const b = await chromium.launch(), out = {};
  for (const cod of alims) for (const vp of ['d', 'm']) for (const conj of ['lupa', 'consolidado']) {
    const { ctx, p } = await abre(b, cod, vp, conj);
    try {
      const fatos = await p.evaluate(`(${FATOS.toString()})(window.D)`);
      const regista = async est => {
        const r = await p.evaluate(`(${COLETA.toString()})(${JSON.stringify(fatos)})`);
        (out[cod] = out[cod] || {})[`${conj}-${vp}-${est}`] = r;
        console.log(cod, conj, vp, est, r.map(x => x.vezes).join(','));
      };
      await regista('inicial');
      await ESTADO.lupa(p); await regista('lupa');
      await p.keyboard.press('Escape'); await p.waitForTimeout(300);
      await ligaCamadas(p); await regista('camadas');
      await escolhe(p, 'T2-A'); await regista('trecho');
      await p.evaluate(async () => {                       // sem camada, sem trecho, classe T1 aberta na lupa: onde a lista de trechos aparece
        window.__limpar();
        for (const b of document.querySelectorAll('#ctl-camadas .ctl-card > button[aria-pressed="true"]:not(.tc-painel-m)')) { b.click(); await new Promise(r => setTimeout(r, 250)); }
      });
      await p.waitForTimeout(600);
      await p.click('.lp-lupa'); await p.waitForTimeout(300); await p.click('.lp-abre[data-c="T1"]'); await p.waitForTimeout(500);
      await regista('lista');
    } catch (e) { console.log('ERRO', cod, conj, vp, e.message.split('\n')[0]); }
    await ctx.close();
  }
  fs.writeFileSync(path.join(__dirname, 'repeticoes.json'), JSON.stringify(out, null, 1));
  await b.close();
})();
