// Lê medicoes/*.json e imprime as tabelas em Markdown usadas no README
const fs = require('fs'); const J = f => JSON.parse(fs.readFileSync('medicoes/' + f + '.json', 'utf8'));
const n = (x, d = 0) => x == null ? '–' : (+x).toFixed(d);
const out = [];
// 1. carga
const aH = J('carga-antes-home'), dH = J('carga-depois-home'), aA = J('carga-antes-alimentador');
out.push('### Carga (mediana de 3 cargas a frio; ms)\n');
out.push('| Página · dispositivo · perfil | Mapa aparece (antes → depois) | 1º conteúdo FCP (antes → depois) | Baixado gzip KB (antes → depois) | Requisições | Long tasks / TBT ms (antes) | CLS (antes → depois) |');
out.push('|---|---|---|---|---|---|---|');
const PERF = { base: 'normal', cpu4: 'CPU 4x', lenta: 'CPU 4x + 4G lenta' };
for (const pg of ['inicial', 'polos']) for (const vp of ['desktop', 'celular']) for (const pf of ['base', 'cpu4', 'lenta']) {
  const k = `${vp}|${pf}|${pg}`, a = aH[k], d = dH[k]; if (!a || !d) continue;
  const kbA = o => n((o.bytes_local + (o.bytes_ext || 0)) / 1024), kbD = o => n((aH[k].bytes_local + 903 + 100508 + 1500) / 1024);   // depois: o protótipo é servido sem gzip pelo Playwright; soma o gzip real (+0,9 KB) e as 4 fontes próprias (100,5 KB)
  out.push(`| ${pg} · ${vp} · ${PERF[pf]} | ${n(a.mapa)} → ${n(d.mapa)} | ${n(a.fcp)} → ${n(d.fcp)} | ${kbA(a)} → ${kbD(d)} | ${a.reqs_local + a.reqs_ext} → ${d.reqs_local + d.reqs_ext} | ${a.lt_n} / ${a.tbt} | ${n(a.cls, 4)} → ${n(d.cls, 4)} |`);
}
out.push('\n### Página do alimentador LD01072001 (só antes)\n');
out.push('| dispositivo · perfil | Mapa+lista prontos | FCP | LCP | Baixado KB (local + tiles/fontes) | Requisições | Long tasks | TBT ms | CLS |'); out.push('|---|---|---|---|---|---|---|---|---|');
for (const vp of ['desktop', 'celular']) for (const pf of ['base', 'cpu4', 'lenta']) { const a = aA[`${vp}|${pf}|alimentador`]; out.push(`| ${vp} · ${PERF[pf]} | ${n(a.mapa)} | ${n(a.fcp)} | ${n(a.lcp)} | ${n(a.bytes_local / 1024)} + ${n(a.bytes_ext / 1024)} | ${a.reqs_local} + ${a.reqs_ext} | ${a.lt_n} | ${n(a.tbt)} | ${n(a.cls, 4)} |`); }
// 2. animação
const aN = J('animacao-antes'), dN = J('animacao-depois');
out.push('\n### FPS nas animações (mediana de 3 execuções; quadros lentos = > 50 ms)\n');
out.push('| Etapa | Desktop normal | Desktop CPU 4x | Celular normal | Celular CPU 4x |'); out.push('|---|---|---|---|---|');
const etapas = ['0 mouse varrendo o estado', '1 abrir regional (Centro)', '2 abrir polo', '3 abrir município', '4 zoom no alimentador', '5 Esc (volta ao município)', '6 Esc (volta ao polo)', '7 Esc (volta à regional)', '8 Esc (volta ao Tocantins)'];
for (const e of etapas) {
  const c = k => { const a = (aN[k] || {})[e], d = (dN[k] || {})[e]; return a ? `${n(a.fps, 0)} → ${n(d.fps, 0)} fps (pior quadro ${n(a.pior_ms)} → ${n(d.pior_ms)} ms)` : '–'; };
  out.push(`| ${e.slice(2)} | ${c('desktop|base')} | ${c('desktop|cpu4')} | ${c('celular|base')} | ${c('celular|cpu4')} |`);
}
fs.writeFileSync('medicoes/tabelas.md', out.join('\n') + '\n'); console.log(out.join('\n'));
