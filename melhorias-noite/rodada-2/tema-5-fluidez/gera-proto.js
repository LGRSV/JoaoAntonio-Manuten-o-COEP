// Gera proto/ a partir dos arquivos do site (espelho em mirror2/): copia, aplica as alterações por substituição exata
// (cada trecho precisa casar UMA vez, senão para) e grava também o .diff. Não toca no repositório.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ORI = process.env.ESPELHO || '/tmp/claude-0/-home-user-smartled/2ba15095-ae67-51f0-acd3-e77e4b1d05de/scratchpad/mirror2';
const OUT = path.join(__dirname, 'proto');
fs.mkdirSync(OUT, { recursive: true });
function patch(rel, nome, trocas) {
  let s = fs.readFileSync(path.join(ORI, rel), 'utf8'); const orig = s;
  trocas.forEach(([a, b], i) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${nome}: troca ${i + 1} casou ${n} vezes: ${a.slice(0, 60)}`); s = s.replace(a, () => b); });
  fs.writeFileSync(path.join(OUT, nome), s);
  fs.writeFileSync(path.join(OUT, nome + '.orig'), orig);
  try { execFileSync('diff', ['-u', path.join(OUT, nome + '.orig'), path.join(OUT, nome)], { stdio: 'pipe' }); } catch (e) { fs.writeFileSync(path.join(OUT, nome + '.diff'), (e.stdout || '').toString().replace(/^(---|\+\+\+) .*$/mg, (m, k) => k + ' ' + nome)); }
  fs.unlinkSync(path.join(OUT, nome + '.orig'));
}

// ---------- página inicial: mapa-municipios.js ----------
patch('assets/mapa-municipios.js', 'mapa-municipios.js', [
  // (CLS) cartões das regionais só aparecem depois de posicionados
  [`    if (!r.width) return;
    const k = Math.min(r.width / VW, r.height / H), oy = (r.height - H * k) / 2;`,
   `    if (!r.width) return;
    cartoes.dataset.ok = '1';                                 // posicionados: o CSS os mostra (antes ficam escondidos, sem pular de (0,0))
    const k = Math.min(r.width / VW, r.height / H), oy = (r.height - H * k) / 2;`],
  // (Tab) os cartões vêm antes do município de teclado: no estado inteiro as regionais são a 1ª parada do mapa
  [`  caixa.append(cartoes);`, `  caixa.prepend(cartoes);                                   // antes do svg na ordem do Tab (são posicionados por JS, a ordem do DOM não muda o visual)`],
  // (leitor de tela) região de aviso: a cada troca de nível diz onde o mapa está agora
  [`  window.ARGOS_MAPA = {`,
   `  // aviso do nível para leitores de tela (a animação e os cartões não dizem nada sozinhos). Texto curto, só do nível final
  // (o vai() passa por vários níveis em sequência), uma região role="status" escondida
  const aviso = document.createElement('p');
  aviso.className = 'vh'; aviso.id = 'mt-aviso'; aviso.setAttribute('role', 'status'); aviso.setAttribute('aria-live', 'polite'); aviso.setAttribute('aria-atomic', 'true');
  alvo.append(aviso);
  const fala = txt => { aviso.textContent = ''; clearTimeout(fala.t); fala.t = setTimeout(() => { aviso.textContent = txt; }, 60); };
  window.ARGOS_ANUNCIA = fala;
  const nf = n => (n || 0).toLocaleString('pt-BR');
  const textoNivel = d => {
    if (d.al) { const m = porCod[d.mun], a = m.als.find(x => x.cod === d.al) || {}; return \`Alimentador \${d.al} em foco, em \${m.nome}: \${nf(a.n)} NAE. Enter abre a página dele. Esc volta ao município.\`; }
    if (d.mun) { const m = porCod[d.mun]; return \`\${m.nome}\${m.nome === m.polo ? '' : ', polo ' + m.polo}: \${nAls(m)}, \${nf(m.nae)} NAE. Esc volta ao polo.\`; }
    if (d.pol) { const ms = M.muns.filter(m => m.polo === d.pol); return \`Polo \${d.pol}: \${ms.length} municípios, \${nf(ms.reduce((s, m) => s + (m.nae || 0), 0))} NAE. Esc volta à regional \${d.reg}.\`; }
    if (d.reg) { const ps = polosDe(d.reg).map(([p]) => p); return \`Regional \${d.reg}: \${ps.length} polos, \${ps.join(', ')}. Esc volta ao Tocantins.\`; }
    return \`Tocantins inteiro. Regionais: \${Object.keys(M.regs || {}).map(r => r + ' ' + nf(M.muns.filter(m => m.reg === r).reduce((s, m) => s + (m.nae || 0), 0)) + ' NAE').join(', ')}.\`;
  };
  let primeira = true;
  document.addEventListener('argos-nivel', e => { if (primeira) { primeira = false; if (!(e.detail || {}).reg) return; } fala(textoNivel(e.detail || {})); });
  window.ARGOS_MAPA = {`],
]);

// ---------- página inicial: busca-ativo.js ----------
patch('assets/busca-ativo.js', 'busca-ativo.js', [
  // (Tab) a caixa de resultados é uma área rolável: o Chromium a põe no Tab sozinho (parada extra, com contorno gigante). tabindex -1 tira do Tab
  [`  const q = document.getElementById('ativo-q'), res = document.getElementById('ativo-res');`,
   `  const q = document.getElementById('ativo-q'), res = document.getElementById('ativo-res');
  res.tabIndex = -1;                                     // área rolável fora do Tab (sem isto o Tab para nela e depois fecha a lista)
  res.removeAttribute('aria-live');                      // a lista inteira não é lida a cada abertura; o resumo vai na região de aviso (ARGOS_ANUNCIA)`],
  // (leitor de tela) quantas opções, em vez de ler a lista inteira
  [`    q.setAttribute('aria-expanded', 'true');
    marca(-1);`,
   `    q.setAttribute('aria-expanded', 'true');
    if (!classe && window.ARGOS_ANUNCIA) window.ARGOS_ANUNCIA(sug.length ? \`\${sug.length} \${sug.length === 1 ? 'opção' : 'opções'}. Use as setas para escolher.\` : 'Nenhuma opção.');
    marca(-1);`],
  // (Tab) a lupa só leva o foco ao campo, que já está sempre à vista: uma parada a menos (mouse e toque seguem iguais)
  [`    lupa.removeAttribute('aria-expanded');`, `    lupa.removeAttribute('aria-expanded');
    lupa.tabIndex = -1; lupa.setAttribute('aria-hidden', 'true');   // duplicava o campo no Tab e na leitura`],
]);

// ---------- menu.js: alvo de 44 px no toque ----------
patch('assets/menu.js', 'menu.js', [
  [`  document.head.append(css);`,
   `  css.textContent += '@media (pointer:coarse){.mnu{min-height:44px}.mnu .mnu-btn,.mnu .mnu-x{width:44px;height:44px}.mnu-lista a,.mnu-lista button{min-height:44px}' +
    '.mnu-dlg input,.mnu-dlg select,.mnu-dlg button{min-height:44px}.mnu-esq{min-height:44px}}';
  document.head.append(css);`],
]);

// ---------- limpeza.js e extras.js (página do alimentador): mesmo ajuste do formatador ----------
patch('assets/limpeza.js', 'limpeza.js', [
  [`const km = m => (m / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' km';`,
   `const __nf1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const km = m => __nf1.format(m / 1000) + ' km';`],
]);
patch('assets/extras.js', 'extras.js', [
  [`const km = m => (m / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' km';`,
   `const __nfx2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), __nfx0 = new Intl.NumberFormat('pt-BR');
  const km = m => __nfx2.format(m / 1000) + ' km';`],
  [`const mil = x => x === '' || x == null ? '' : Number(x).toLocaleString('pt-BR');`, `const mil = x => x === '' || x == null ? '' : __nfx0.format(Number(x));`],
]);

// ---------- ranking por polos: o CSS embutido repete os tokens (--alvo:40px) depois do site.css ----------
patch('assets/ranking-polos.js', 'ranking-polos.js', [
  [`const nf = (n, d = 0) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });`,
   `const __nfs = {};   // um Intl.NumberFormat por nº de casas (toLocaleString com opções cria um novo a cada chamada: 186 ms de CPU 4x só aqui)
  const nf = (n, d = 0) => (__nfs[d] || (__nfs[d] = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }))).format(n);`],
  [`.wrap{max-width:var(--wrap)}
#polos{display:grid`, `@media (pointer:coarse){:root{--alvo:44px}}
.wrap{max-width:var(--wrap)}
#polos{display:grid`],
]);

// ---------- página do alimentador: desenho dos vãos ----------
patch('assets/alimentador.js', 'alimentador.js', [
  // vãos encadeados (o fim de um é o começo do próximo) viram UMA linha: o Leaflet simplifica e desenha menos segmentos
  // toLocaleString() com opções cria um Intl.NumberFormat a CADA chamada (km e mil rodam ~2x por linha das ~1.000 linhas da lista): formatador criado uma vez
  [`const km = m => m < 1000 ? Math.round(m) + ' m' : (m / 1000).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' km';`,
   `const __nf2 = new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}), __nf0 = new Intl.NumberFormat('pt-BR');
const km = m => m < 1000 ? Math.round(m) + ' m' : __nf2.format(m / 1000) + ' km';`],
  [`const mil = x => Number(x).toLocaleString('pt-BR');`, `const mil = x => __nf0.format(Number(x));`],
  [`    const l = L.polyline(vs.map(v => [[v[0], v[1]], [v[2], v[3]]]), {color: t.cor, weight: t.peso, opacity: 1, lineCap: 'round'}).addTo(map);`,
   `    const aneis = []; let cur = null;                       // vãos em sequência (fim = começo do seguinte) formam uma só polilinha
    vs.forEach(v => { if (cur && cur[cur.length - 1][0] === v[0] && cur[cur.length - 1][1] === v[1]) cur.push([v[2], v[3]]); else aneis.push(cur = [[v[0], v[1]], [v[2], v[3]]]); });
    const l = L.polyline(aneis, {color: t.cor, weight: t.peso, opacity: 1, lineCap: 'round', lineJoin: 'round'}).addTo(map);`],
]);
console.log('proto/ gerado');
