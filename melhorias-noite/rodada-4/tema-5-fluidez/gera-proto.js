// Rodada 3, tema 5: gera o patch ÚNICO sobre a base atual (repositório, só leitura).
// Fonte: /home/user/smartled/alimentador/ (site/*.js, site/site.css, mapa_trechos.html). Cada troca precisa casar UMA vez.
// Saída (nada é escrito no repositório):
//   proto/arvore/…                      cópias já alteradas (mesmo caminho relativo do repositório)
//   proto/assets/alimentador.js|css     o que o gera_trechos.py publica a partir do mapa_trechos.html alterado
//   proto/final.diff            patch completo (git apply / patch -p1 na raiz do repositório)
//   proto/<arquivo>.diff                um diff por arquivo
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const REPO = '/home/user/smartled', OUT = path.join(__dirname, 'proto');
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(path.join(OUT, 'arvore'), { recursive: true }); fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
const ler = f => fs.readFileSync(f, 'utf8');
const diffs = [];
function patch(rel, trocas, anexo) {
  let s = ler(path.join(REPO, rel)); const orig = s;
  trocas.forEach(([a, b], i) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${rel}: troca ${i + 1} casou ${n} vezes: ${a.slice(0, 70)}`); s = s.replace(a, () => b); });
  if (anexo) s += (s.endsWith('\n') ? '' : '\n') + anexo;
  const dest = path.join(OUT, 'arvore', rel); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, s);
  const tmpo = path.join(OUT, '.orig'); fs.writeFileSync(tmpo, orig);
  let d = ''; try { execFileSync('diff', ['-u', tmpo, dest], { stdio: 'pipe' }); } catch (e) { d = (e.stdout || '').toString(); }
  d = d.replace(/^--- .*$/m, '--- a/' + rel).replace(/^\+\+\+ .*$/m, '+++ b/' + rel);
  fs.unlinkSync(tmpo); diffs.push([rel, d]); return s;
}

// =====================================================================================================================
// CSS comum (site.css): CLS + Tab + toque
// =====================================================================================================================
const CSS_SITE = `
/* ====== Fluidez e acabamento (tema 5) ======
   (1) CLS: o menu.js monta a linha do ☰ depois do 1º quadro e empurrava a página 64 px; a pseudo-linha tem a mesma geometria
       do .mnu (altura do alvo, margem -8 px, mais o gap da grade) e some quando o ☰ chega. Sem :has() volta ao comportamento de hoje.
       Os cartões Norte/Centro/Sul nascem em (0,0) e o JS os põe no lugar: escondidos até lá (mapa-municipios.js marca data-ok). */
.wrap:not(:has(>.mnu))::before{content:"";display:block;min-height:var(--alvo);margin-bottom:calc(var(--s2) * -1)}
.mt-regcards:not([data-ok]) button{visibility:hidden}
/* (2) Tab: cartões escondidos (regional aberta ou voando) saem de verdade do Tab depois do fade (opacity:0 não tira do Tab) */
.mt-regcards button{transition:opacity .3s,border-color .15s,visibility 0s}
.aberta .mt-regcards button,.voando .mt-regcards button{visibility:hidden;transition:opacity .3s,border-color .15s,visibility 0s .3s}
/* (3) toque: alvos de 44 px (só telas de toque; no mouse nada muda) */
@media (pointer:coarse){
  :root{--alvo:44px}
  .mt-barra .mt-pchip,.mt-passo,.mt-puxa,.ativo .ir-mapa,.mt-regs>summary{min-height:44px}
  .mt-volta{min-width:44px}
  .mt-amun{display:inline-flex;align-items:center;min-height:44px}
  .sug-op,.mun-op{min-height:48px}
  .mt-regcards button{min-height:44px;align-content:center}   /* com a legenda recolhida (.sem-nae) os cartões das regionais caem para 27 px */
  /* orelhinha da legenda (parte da outra sessão): com a legenda aberta o clique vale para o painel inteiro (leg.addEventListener('click')),
     então não há o que mudar; recolhida, sobra só a orelhinha (30 px): o visual não muda, a área de toque ganha 8 px (da borda interna) para cada lado */
  .mt-regs.fechada .mt-regs-b{position:relative;left:auto;top:auto}   /* (a regra de base tem left:50%; sem zerar, a orelha recolhida andaria 50 %) */
  .mt-regs.fechada .mt-regs-b::after{content:"";position:absolute;inset:-8px}
}
`;

patch('alimentador/site/site.css', [], CSS_SITE);

// =====================================================================================================================
// mapa-municipios.js: CLS dos cartões, Tab (cartões 1º), aviso do nível (role=status), formatadores em cache
// =====================================================================================================================
patch('alimentador/site/mapa-municipios.js', [
  // formatador de km criado uma vez
  [`  const km = m => (m / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' km';`,
   `  const __nf1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });   // toLocaleString com opções cria um Intl.NumberFormat a cada chamada
  const km = m => __nf1.format(m / 1000) + ' km';`],
  // (Tab) os cartões vêm antes do SVG na ordem do DOM: no estado inteiro as regionais são a 1ª parada do mapa (posição é por JS, o visual não muda)
  [`  caixa.append(cartoes);
  cartoes.addEventListener('click'`, `  caixa.prepend(cartoes);                                   // antes do svg na ordem do Tab (posicionados por JS: a ordem do DOM não muda o visual)
  cartoes.addEventListener('click'`],
  // (CLS) cartões só aparecem depois de posicionados
  [`    if (caixa.classList.contains('aberta') || caixa.classList.contains('voando') || !svg.getBoundingClientRect().width) return;
    fios.innerHTML = bandeiras(`, `    if (caixa.classList.contains('aberta') || caixa.classList.contains('voando') || !svg.getBoundingClientRect().width) return;
    cartoes.dataset.ok = '1';                                 // posicionados: o CSS os mostra (antes ficam escondidos, sem pular de (0,0))
    fios.innerHTML = bandeiras(`],
  // (leitor de tela) região de aviso: a cada troca de nível diz onde o mapa está agora (texto curto, só do nível final)
  [`  window.ARGOS_MAPA = { nivel:`,
   `  const aviso = document.createElement('p');
  aviso.className = 'vh'; aviso.id = 'mt-aviso'; aviso.setAttribute('role', 'status'); aviso.setAttribute('aria-live', 'polite'); aviso.setAttribute('aria-atomic', 'true');
  alvo.append(aviso);
  const fala = txt => { aviso.textContent = ''; clearTimeout(fala.t); fala.t = setTimeout(() => { aviso.textContent = txt; }, 60); };
  window.ARGOS_ANUNCIA = fala;
  const __nf0 = new Intl.NumberFormat('pt-BR'), nfa = n => __nf0.format(n || 0);
  const textoNivel = d => {
    if (d.al) { const m = porCod[d.mun], a = m.als.find(x => x.cod === d.al) || {}; return \`Alimentador \${d.al} em foco, em \${m.nome}: \${nfa(a.n)} NAE. O link Abrir \${d.al} leva ao painel dele. Esc volta ao município.\`; }
    if (d.mun) { const m = porCod[d.mun]; return \`\${m.nome}\${m.nome === m.polo ? '' : ', polo ' + m.polo}: \${nAls(m)}, \${nfa(m.nae)} NAE. Esc volta ao polo.\`; }
    if (d.pol) { const ms = M.muns.filter(m => m.polo === d.pol); return \`Polo \${d.pol}: \${ms.length} municípios, \${nfa(ms.reduce((s, m) => s + (m.nae || 0), 0))} NAE. Esc volta à regional \${d.reg}.\`; }
    if (d.reg) { const ps = polosDe(d.reg).map(([p]) => p); return \`Regional \${d.reg}: \${ps.length} polos, \${ps.join(', ')}. Esc volta ao Tocantins.\`; }
    return \`Tocantins inteiro. Regionais: \${Object.keys(M.regs || {}).map(r => r + ' ' + nfa(M.muns.filter(m => m.reg === r).reduce((s, m) => s + (m.nae || 0), 0)) + ' NAE').join(', ')}.\`;
  };
  let primeira = true;   // o 1º evento é o da carga da página: sem anúncio
  document.addEventListener('argos-nivel', e => { if (primeira) { primeira = false; if (!(e.detail || {}).reg) return; } fala(textoNivel(e.detail || {})); });
  window.ARGOS_MAPA = { nivel:`],
]);

// =====================================================================================================================
// busca-ativo.js: Tab (caixa de resultados fora do Tab), sem leitura da lista inteira, resumo no aviso
// =====================================================================================================================
patch('alimentador/site/busca-ativo.js', [
  [`  const q = document.getElementById('ativo-q'), res = document.getElementById('ativo-res');`,
   `  const q = document.getElementById('ativo-q'), res = document.getElementById('ativo-res');
  res.tabIndex = -1;                                     // área rolável fora do Tab (sem isto o Chromium para nela e o Tab seguinte fecha a lista)
  res.removeAttribute('aria-live');                      // a lista inteira não é lida a cada abertura; o resumo vai na região de aviso (ARGOS_ANUNCIA)`],
  [`    q.setAttribute('aria-expanded', 'true');
    marca(-1);`,
   `    q.setAttribute('aria-expanded', 'true');
    if (!classe && window.ARGOS_ANUNCIA) window.ARGOS_ANUNCIA(sug.length ? \`\${sug.length} \${sug.length === 1 ? 'opção' : 'opções'}. Use as setas para escolher.\` : 'Nenhuma opção.');
    marca(-1);`],
  [`  const nf = n => (n || 0).toLocaleString('pt-BR');
  const kmTxt = m => (m / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' km';`,
   `  const __nfb = new Intl.NumberFormat('pt-BR'), __nfk = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });   // formatadores criados uma vez
  const nf = n => __nfb.format(n || 0);
  const kmTxt = m => __nfk.format(m / 1000) + ' km';`],
]);

// =====================================================================================================================
// menu.js: alvos de 44 px no toque
// =====================================================================================================================
patch('alimentador/site/menu.js', [
  [`  document.head.append(css);`,
   `  css.textContent += '@media (pointer:coarse){.mnu{min-height:44px}.mnu .mnu-btn,.mnu .mnu-x{width:44px;height:44px}.mnu-lista a,.mnu-lista button{min-height:44px}' +
    '.mnu-dlg input,.mnu-dlg select,.mnu-dlg button{min-height:44px}.mnu-esq{min-height:44px}}';
  document.head.append(css);`],
]);

// =====================================================================================================================
// ranking-polos.js: formatador em cache + --alvo de 44 px (o CSS embutido repete os tokens depois do site.css)
// =====================================================================================================================
patch('alimentador/site/ranking-polos.js', [
  [`const nf = (n, d = 0) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });`,
   `const __nfs = {};   // um Intl.NumberFormat por nº de casas (toLocaleString com opções cria um novo a cada chamada)
  const nf = (n, d = 0) => (__nfs[d] || (__nfs[d] = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }))).format(n);`],
  [`.wrap{max-width:var(--wrap)}
#polos{display:grid`, `@media (pointer:coarse){:root{--alvo:44px}}
.wrap{max-width:var(--wrap)}
#polos{display:grid`],
]);

// =====================================================================================================================
// Página do alimentador: limpeza.js, inspecao.js, extras.js (repositório) e mapa_trechos.html (vira alimentador.js/css)
// =====================================================================================================================
patch('alimentador/site/limpeza.js', [
  [`const km = m => (m / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' km';`,
   `const __nf1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const km = m => __nf1.format(m / 1000) + ' km';`],
  // vãos em sequência (fim de um = começo do seguinte) viram UMA polilinha: a camada Faixa desenhava a rede inteira 2x (contorno + cor)
  [`  const seg = v => [[v[0], v[1]], [v[2], v[3]]];`,
   `  const seg = v => [[v[0], v[1]], [v[2], v[3]]];
  const cadeia = vs => { const out = []; let cur = null; vs.forEach(v => { if (cur && cur[cur.length - 1][0] === v[0] && cur[cur.length - 1][1] === v[1]) cur.push([v[2], v[3]]); else out.push(cur = [[v[0], v[1]], [v[2], v[3]]]); }); return out; };`],
  [`    return [L.polyline(vs.map(seg), { color: '#0b0f14', weight: peso + 4, opacity: .75 * opacidade, interactive: false, lineCap: 'round' }),
      L.polyline(vs.map(seg), Object.assign({ color: cor, weight: peso, opacity: opacidade, interactive: false, lineCap: 'round' }, extra))];`,
   `    const an = cadeia(vs);
    return [L.polyline(an, { color: '#0b0f14', weight: peso + 4, opacity: .75 * opacidade, interactive: false, lineCap: 'round', lineJoin: 'round' }),
      L.polyline(an, Object.assign({ color: cor, weight: peso, opacity: opacidade, interactive: false, lineCap: 'round', lineJoin: 'round' }, extra))];`],
]);
patch('alimentador/site/inspecao.js', [
  [`    return [L.polyline(vs.map(seg), { color: '#0b0f14', weight: peso + 4, opacity: .75 * opacidade, interactive: false, lineCap: 'round' }),
      L.polyline(vs.map(seg), Object.assign({ color: cor, weight: peso, opacity: opacidade, interactive: false, lineCap: 'round' }, extra))];`,
   `    const an = []; let cur = null;                             // vãos em sequência → uma só polilinha (menos anéis a cada redesenho)
    vs.forEach(v => { if (cur && cur[cur.length - 1][0] === v[0] && cur[cur.length - 1][1] === v[1]) cur.push([v[2], v[3]]); else an.push(cur = [[v[0], v[1]], [v[2], v[3]]]); });
    return [L.polyline(an, { color: '#0b0f14', weight: peso + 4, opacity: .75 * opacidade, interactive: false, lineCap: 'round', lineJoin: 'round' }),
      L.polyline(an, Object.assign({ color: cor, weight: peso, opacity: opacidade, interactive: false, lineCap: 'round', lineJoin: 'round' }, extra))];`],
]);
patch('alimentador/site/extras.js', [
  [`const km = m => (m / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' km';`,
   `const __nfx2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), __nfx0 = new Intl.NumberFormat('pt-BR');
  const km = m => __nfx2.format(m / 1000) + ' km';`],
  [`const mil = x => x === '' || x == null ? '' : Number(x).toLocaleString('pt-BR');`, `const mil = x => x === '' || x == null ? '' : __nfx0.format(Number(x));`],
]);

const CSS_AL = `
/* ====== Fluidez e acabamento (tema 5) ======
   (1) CLS: a linha do ☰ já reservada no 1º quadro (menu.js monta depois dos 14 scripts, ~1,3 s) */
.wrap:not(:has(>.mnu))::before{content:"";display:block;min-height:var(--alvo);margin-bottom:calc(var(--s2) * -1)}
/* o "Como os trechos são divididos" sai do cabeçalho quando o extras.js monta a barra de busca (vai para "Dados e procedência"): não ocupa lugar antes disso */
.al-site:not(.al-pronto) header>details.regra{display:none}
/* (2) lista de trechos (até ~1.000 linhas, 8.000 nós): o que está fora da vista não entra no layout (a lista rola por dentro de .lista) */
.lista>.row,.lista>.grp{content-visibility:auto;contain-intrinsic-size:auto 48px}
.lista>.grp{contain-intrinsic-size:auto 32px}
/* (3) alvos de toque de 44 px (só telas de toque). html body na frente: limpeza.js / extras.js / telacheia.js injetam <style> depois deste */
@media (pointer:coarse){
  :root{--alvo:44px}
  html body .migalhas a{min-height:44px}
  html body .mapbox .classes button{min-width:44px;min-height:44px}
  html body .leaflet-container .leaflet-bar a{width:44px;height:44px;line-height:44px}
  html body :is(.ctl-cam-b,.tc-btn){min-height:44px;min-width:44px}
  html body :is(.limp-maplg,.limp-seg) button{min-height:44px}
  html body .limp-ano-l button{min-height:44px}
  html body .limp-ano-l .liga{min-width:44px}
  html body :is(.dados,.regra,.mais)>summary{min-height:44px}
  html body :is(.dl-btn,.exe-tipos-b,.fecha){min-height:44px}
  html body .fecha{width:44px}
}
`;
const html = patch('alimentador/mapa_trechos.html', [
  [`const km = m => m < 1000 ? Math.round(m) + ' m' : (m / 1000).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' km';`,
   `const __nf2 = new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}), __nf0 = new Intl.NumberFormat('pt-BR');   // formatadores criados uma vez (km e mil rodam ~2x por linha das ~1.000 da lista)
const km = m => m < 1000 ? Math.round(m) + ' m' : __nf2.format(m / 1000) + ' km';`],
  [`const mil = x => Number(x).toLocaleString('pt-BR');`, `const mil = x => __nf0.format(Number(x));`],
  // papel(nome) varria os ~1.000 trechos para cada um dos ~1.000 fusíveis: índice por início, igual ao fimDe
  [`const papel = nome => [...D.trechos.filter(t => t.inicio === nome).map(t => 'início do ' + t.nome), ...(fimDe[nome] || []).map(n => 'fim do ' + n)].join(' · ');`,
   `const inicioDe = {};
D.trechos.forEach(t => (inicioDe[t.inicio] = inicioDe[t.inicio] || []).push(t.nome));
const papel = nome => [...(inicioDe[nome] || []).map(n => 'início do ' + n), ...(fimDe[nome] || []).map(n => 'fim do ' + n)].join(' · ');`],
  [`    const l = L.polyline(vs.map(v => [[v[0], v[1]], [v[2], v[3]]]), {color: t.cor, weight: t.peso, opacity: 1, lineCap: 'round'}).addTo(map);`,
   `    const aneis = []; let cur = null;                       // vãos em sequência (fim = começo do seguinte) formam uma só polilinha
    vs.forEach(v => { if (cur && cur[cur.length - 1][0] === v[0] && cur[cur.length - 1][1] === v[1]) cur.push([v[2], v[3]]); else aneis.push(cur = [[v[0], v[1]], [v[2], v[3]]]); });
    const l = L.polyline(aneis, {color: t.cor, weight: t.peso, opacity: 1, lineCap: 'round', lineJoin: 'round'}).addTo(map);`],
  [`</style>`, CSS_AL + `</style>`],
]);
// o que o gera_trechos.py publica (ativos_interface): mesmos recortes por expressão regular
const css = html.match(/<style>\n([\s\S]*?)<\/style>/)[1], js = html.match(/<script>\nconst D = %%DADOS%%;\n([\s\S]*?)<\/script>/)[1];
fs.writeFileSync(path.join(OUT, 'assets', 'alimentador.css'), css); fs.writeFileSync(path.join(OUT, 'assets', 'alimentador.js'), 'const D = window.D;\n' + js);

fs.writeFileSync(path.join(OUT, 'final.diff'), diffs.map(x => x[1]).join(''));
diffs.forEach(([rel, d]) => fs.writeFileSync(path.join(OUT, path.basename(rel) + '.diff'), d));
console.log('proto/ gerado:', diffs.map(x => x[0]).join(', '));
