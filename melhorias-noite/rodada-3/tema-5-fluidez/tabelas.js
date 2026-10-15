// Monta medicoes/tabelas.md a partir dos JSONs (antes x depois)
const fs = require('fs'); const J = f => { try { return JSON.parse(fs.readFileSync('medicoes/' + f, 'utf8')); } catch (e) { return null; } };
const out = [];
const f = (v, d = 0) => v == null ? '–' : (typeof v === 'number' ? (d ? v.toFixed(d) : Math.round(v)) : v);
// CLS
const ca = J('cls-antes.json'), cd = J('cls-depois.json');
if (ca && cd) { out.push('## CLS e FCP por página (mediana de 3 cargas)\n', '| Página · dispositivo · perfil | CLS antes | CLS depois | FCP antes (ms) | FCP depois (ms) |', '|---|---|---|---|---|');
  Object.keys(ca).forEach(k => { const [vp, pg, pf] = k.split('|'); out.push(`| ${pg} · ${vp} · ${pf} | ${f(ca[k].cls, 4)} | ${f(cd[k] && cd[k].cls, 4)} | ${f(ca[k].fcp)} | ${f(cd[k] && cd[k].fcp)} |`); }); out.push(''); }
// páginas
for (const pg of ['alimentador', 'polos']) { const a = J(`${pg}-antes.json`), d = J(`${pg}-depois.json`); if (!a || !d) continue;
  out.push(`## ${pg}: carga (mediana de 3)\n`, '| Dispositivo · perfil | Pronto antes→depois (ms) | LCP | TBT (ms) | Long tasks (máx ms) | CLS | Nós DOM |', '|---|---|---|---|---|---|---|');
  Object.keys(a).forEach(k => { const x = a[k], y = d[k] || {}; out.push(`| ${k.replace('|', ' · ')} | ${f(x.pronto)} → ${f(y.pronto)} | ${f(x.lcp)} → ${f(y.lcp)} | ${f(x.tbt)} → ${f(y.tbt)} | ${f(x.lt)} (${f(x.ltMax)}) → ${f(y.lt)} (${f(y.ltMax)}) | ${f(x.cls, 4)} → ${f(y.cls, 4)} | ${f(x.nos)} → ${f(y.nos)} |`); }); out.push('');
  if (pg === 'alimentador') { out.push('### Interação com o mapa (Leaflet): fps · pior quadro (ms) · long tasks\n', '| Dispositivo · perfil · gesto | fps antes→depois | pior quadro antes→depois | long tasks antes→depois |', '|---|---|---|---|');
    Object.keys(a).forEach(k => Object.keys(a[k].interacao || {}).forEach(g => { const x = a[k].interacao[g], y = ((d[k] || {}).interacao || {})[g] || {}; out.push(`| ${k.replace('|', ' · ')} · ${g} | ${f(x.fps, 1)} → ${f(y.fps, 1)} | ${f(x.pior)} → ${f(y.pior)} | ${f(x.longtasks)} → ${f(y.longtasks)} |`); })); out.push(''); } }
fs.writeFileSync('medicoes/tabelas.md', out.join('\n')); console.log(out.join('\n'));
