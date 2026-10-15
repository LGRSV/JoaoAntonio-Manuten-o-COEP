// Monta medicoes/tabelas.md a partir dos JSONs (antes x depois). node tabelas.js
const fs = require('fs'); const J = f => { try { return JSON.parse(fs.readFileSync('medicoes/' + f, 'utf8')); } catch (e) { return null; } };
const out = [];
const f = (v, d = 0) => v == null ? '–' : (typeof v === 'number' ? (d ? v.toFixed(d).replace('.', ',') : Math.round(v).toLocaleString('pt-BR')) : v);
const par = (a, b, d = 0) => `${f(a, d)} → ${f(b, d)}`;
const nomeVp = k => k.replace('desktop', 'computador').replace('celular', 'celular').replace('base', 'normal').replace('cpu4', 'CPU 4x').replace('|', ' · ');
// CLS
const ca = J('cls-antes.json'), cd = J('cls-depois.json');
if (ca && cd) { out.push('## CLS por página (mediana de 3 cargas a frio, tema escuro)\n', '| Página · dispositivo · perfil | CLS antes → depois | FCP (ms) antes → depois |', '|---|---|---|');
  Object.keys(ca).forEach(k => { const [vp, pg, pf] = k.split('|'); out.push(`| ${pg} · ${nomeVp(vp + '|' + pf)} | ${par(ca[k].cls, cd[k] && cd[k].cls, 4)} | ${par(ca[k].fcp, cd[k] && cd[k].fcp)} |`); }); out.push(''); }
// páginas
for (const pg of ['alimentador', 'polos']) { const a = J(`${pg}-antes.json`), d = J(`${pg}-depois.json`); if (!a || !d) continue;
  out.push(`## ${pg === 'polos' ? 'Ranking (polos/)' : 'Página do alimentador LD02022033'}: carga (mediana de 3)\n`, '| Dispositivo · perfil | Pronto (ms) | LCP (ms) | TBT (ms) | Maior long task (ms) | CLS | Nós DOM |', '|---|---|---|---|---|---|---|');
  Object.keys(a).forEach(k => { const x = a[k], y = d[k] || {}; out.push(`| ${nomeVp(k)} | ${par(x.pronto, y.pronto)} | ${par(x.lcp, y.lcp)} | ${par(x.tbt, y.tbt)} | ${par(x.ltMax, y.ltMax)} | ${par(x.cls, y.cls, 4)} | ${f(x.nos)} → ${f(y.nos)} |`); }); out.push('');
  if (pg === 'alimentador') { out.push('### Interação com o mapa (Leaflet): fps · pior quadro (ms)\n', '| Dispositivo · perfil · gesto | fps | Pior quadro (ms) | Long tasks (máx ms) |', '|---|---|---|---|');
    Object.keys(a).forEach(k => Object.keys(a[k].interacao || {}).forEach(g => { const x = a[k].interacao[g], y = ((d[k] || {}).interacao || {})[g] || {}; out.push(`| ${nomeVp(k)} · ${g} | ${par(x.fps, y.fps, 1)} | ${par(x.pior, y.pior)} | ${par(x.ltMax, y.ltMax)} |`); })); out.push(''); } }
// lista
const la = J('lista-antes.json'), ld = J('lista-depois.json');
if (la && ld) { out.push('## Lista de trechos (1.019 linhas, aparece ao buscar): custo da ação até o 2º quadro (ms) e rolagem\n', '| Dispositivo · perfil | Mostrar (digitar "T3-A", "T3") | Filtrar | Limpar | Rolagem fps | Pior quadro na rolagem | Clique numa linha |', '|---|---|---|---|---|---|---|');
  Object.keys(la).forEach(k => { const x = la[k], y = ld[k] || {}; out.push(`| ${nomeVp(k)} | ${par(x.mostra, y.mostra)} | ${par(x.filtra, y.filtra)} | ${par(x.limpa, y.limpa)} | ${par(x.rolaFps, y.rolaFps, 1)} | ${par(x.rolaPior, y.rolaPior)} | ${par(x.clique, y.clique)} |`); }); out.push(''); }
// layout
out.push('## Estilo + layout e scripts na carga da página do alimentador (trace, mediana de 3, ms)\n', '| Perfil | Estilo+layout | Layout | Estilo | EvaluateScript | Commit |', '|---|---|---|---|---|---|');
for (const p of ['base', 'cpu4']) { const a = J(`layout-carga-antes-${p}.json`), d = J(`layout-carga-depois-${p}.json`); if (a && d) out.push(`| ${p === 'base' ? 'normal' : 'CPU 4x'} | ${par(a['estilo+layout'], d['estilo+layout'])} | ${par(a.Layout, d.Layout)} | ${par(a.UpdateLayoutTree, d.UpdateLayoutTree)} | ${par(a.EvaluateScript, d.EvaluateScript)} | ${par(a.Commit, d.Commit)} |`); }
out.push('');
const ra = J('redesenho-antes.json'), rd = J('redesenho-depois.json');
if (ra && rd) { out.push('## Redesenho da camada de linhas (a cada fim de zoom ou arrasto), ms, mediana de 8\n', '| Perfil | visão geral | +2 níveis | +4 níveis | anéis no canvas |', '|---|---|---|---|---|');
  for (const p of ['base', 'cpu4']) out.push(`| ${p === 'base' ? 'normal' : 'CPU 4x'} | ${par(ra[p]['zoom+0'], rd[p]['zoom+0'], 1)} | ${par(ra[p]['zoom+2'], rd[p]['zoom+2'], 1)} | ${par(ra[p]['zoom+4'], rd[p]['zoom+4'], 1)} | ${f(ra[p].aneis)} → ${f(rd[p].aneis)} |`); out.push(''); }
// Tab
const ta = J('tab-antes.json'), td = J('tab-depois.json');
if (ta && td) { out.push('## Tab e leitor de tela (computador; celular igual ou +1 parada)\n', '| Nível | Paradas do Tab | Paradas invisíveis/sem sentido | Aviso ao entrar (caracteres) |', '|---|---|---|---|');
  for (const n of ['estado', 'regional', 'polo', 'municipio', 'alimentador']) for (const vp of ['desktop', 'celular']) { const x = ta[`${vp}|${n}`], y = td[`${vp}|${n}`]; if (!x || !y) continue; const rr = a => a.paradas.filter(p => !p.volta && (p.invisivel || p.ariaHidden || p.foraDaTela || p.indicador === false)).length, np = a => a.paradas.filter(p => !p.volta).length;
    const an = a => a.anuncios.length ? a.anuncios.map(z => z.chars).join('+') : 'nada'; out.push(`| ${n} · ${vp === 'desktop' ? 'computador' : 'celular'} | ${np(x)} → ${np(y)} | ${rr(x)} → ${rr(y)} | ${an(x)} → ${an(y)} |`); } out.push(''); }
// alvos
const aa = J('alvos-antes.json'), ad = J('alvos-depois.json');
if (aa && ad) { out.push('## Alvos de toque < 44 px no celular (390 px; sem contar os paths de município)\n', '| Tela | antes → depois | o que sobra |', '|---|---|---|');
  Object.keys(aa).forEach(k => { const x = aa[k].pequenos.length, y = (ad[k] || { pequenos: [] }).pequenos; out.push(`| ${k} | ${x} → ${y.length} | ${y.map(z => `${z.nome}[${z.w}x${z.h}]`).join(', ') || '–'} |`); }); out.push(''); }
fs.writeFileSync('medicoes/tabelas.md', out.join('\n')); console.log(out.join('\n'));
