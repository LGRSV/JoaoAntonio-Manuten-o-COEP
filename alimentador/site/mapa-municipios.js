// Mapa dos municípios do Tocantins na página inicial (usa window.MUN de mapa-municipios-dados.js).
// Município com alimentador no site: colorido e clicável (mostra os alimentadores ao lado).
// A busca (#busca) e os blocos (.card[data-busca]) da página ficam ligados ao mapa.
// Os tokens de cor (--mt-*, --accent…) vêm de assets/site.css.
(function () {
  const M = window.MUN, alvo = document.getElementById('mapa-to');
  if (!M || !alvo) return;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const km = m => (m / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' km';
  const semAcento = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const kmTot = m => m.als.reduce((s, a) => s + a.m, 0);
  const nAls = m => `${m.als.length} alimentador${m.als.length > 1 ? 'es' : ''}`;
  const porCod = Object.fromEntries(M.muns.map(m => [m.cod, m]));
  const porBusca = Object.fromEntries(M.muns.map(m => [m.busca, m]));
  const calmo = matchMedia('(prefers-reduced-motion: reduce)');

  const css = document.createElement('style');
  css.textContent = `
.mapa-to{display:grid;grid-template-columns:340px minmax(0,1fr) 300px;grid-template-areas:'barra barra barra' 'rank mapa sel';
  gap:var(--s5) var(--s6);align-items:start}
.mt-barra{grid-area:barra}.mt-rank{grid-area:rank}.mt-mapa{grid-area:mapa}.mt-lado{grid-area:sel}
@media (max-width:1180px){.mapa-to{grid-template-columns:minmax(0,1fr) 300px;grid-template-areas:'barra barra' 'mapa sel' 'rank sel'}}
@media (max-width:860px){.mapa-to{grid-template-columns:minmax(0,1fr);grid-template-areas:'barra' 'mapa' 'sel' 'rank'}}

/* barra única: ativo + município (no computador, o município fica em cima do painel do município) */
.mt-barra{display:flex;flex-wrap:wrap;gap:var(--s3) var(--s4);align-items:start}
.mt-barra .ativo{flex:2 1 420px}
.mt-bmun{flex:1 1 240px;display:grid;gap:var(--s1)}
.mt-barra .busca{max-width:none}
@media (min-width:861px){
  .mt-barra{display:grid;grid-template-columns:minmax(0,1fr) 300px;column-gap:var(--s6)}
  .mt-barra .ativo .campo{max-width:640px}
}

/* ranking */
.mt-rank{display:grid;gap:var(--s3);align-content:start;border:0;background:transparent;padding:0}
.mt-rank h2{margin:0;font:700 var(--t-lg)/1.2 var(--f-display)}
.mt-rank h2 small{display:block;margin-top:2px;font:400 var(--t-xs)/1.4 var(--f-body);color:var(--muted)}
.mt-ord{display:flex;gap:2px;padding:3px;border:0;border-radius:var(--r2);background:var(--hover)}
.mt-ord button{flex:1;min-height:var(--alvo);padding:0 var(--s3);border:0;border-radius:7px;background:transparent;color:var(--muted);
  font:600 var(--t-sm) var(--f-body);white-space:nowrap;cursor:pointer}
.mt-ord button:hover{color:var(--fg)}
.mt-ord button[aria-pressed=true]{background:var(--paper);color:var(--fg);box-shadow:var(--sh1)}
.mt-rl{list-style:none;margin:0;padding:0;display:grid;gap:0}
.mt-ra{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:2px var(--s2);align-items:baseline;padding:var(--s3) var(--s1);
  border:0;border-bottom:1px solid var(--line);border-radius:0;background:transparent;color:var(--fg);text-decoration:none}
.mt-ra:hover{background:var(--hover)}
.mt-ra:focus-visible{outline-offset:-2px}
.mt-ra .p{grid-row:span 4;align-self:start;padding-top:3px;font:600 var(--t-xs) var(--f-mono);color:var(--muted);font-variant-numeric:tabular-nums}
.mt-ra b{font:600 var(--t-md) var(--f-mono)}
.mt-ra:hover b{color:var(--accent)}
.mt-ra .v{font:600 var(--t-lg) var(--f-mono);font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap}
.mt-ra .v small{font:500 var(--t-xs) var(--f-body);color:var(--muted);margin-left:3px}
.mt-ra .se,.mt-ra .ex{grid-column:2/4;font-size:var(--t-xs);color:var(--muted)}
.mt-ra .bar{grid-column:2/4;height:3px;margin:var(--s1) 0 2px;border-radius:2px;background:var(--line);overflow:hidden}
.mt-ra .bar i{display:block;height:100%;background:var(--accent)}
.mt-ra .ex .lp{white-space:nowrap}
.mt-ra .ex em{font-style:normal;font-weight:600}
.mt-ra .ex em.velha{color:var(--alerta)}
.mt-ra.zero b,.mt-ra.zero .v{color:var(--muted)}
.mt-mais{justify-self:center;min-height:var(--alvo);padding:0 var(--s4);border:0;border-radius:var(--rp);background:var(--hover);
  color:var(--fg);font:600 var(--t-sm) var(--f-body);cursor:pointer}
.mt-mais:hover{color:var(--accent)}
/* computador: o ranking fica da altura do mapa e rola por dentro (antes a coluna passava de 39 mil px) */
@media (min-width:1181px){
  .mt-rank{align-self:stretch;height:0;min-height:100%;grid-template-rows:auto auto minmax(0,1fr);align-content:stretch}
  .mt-rl{overflow-y:auto;min-height:0;overscroll-behavior:contain;scrollbar-width:thin;padding-bottom:var(--s5);
    -webkit-mask-image:linear-gradient(#000 calc(100% - 28px),transparent);mask-image:linear-gradient(#000 calc(100% - 28px),transparent)}
}

/* mapa do TO */
.mt-mapa{position:relative;border:0;background:transparent;padding:0}
.mt-mapa svg{display:block;height:min(calc(100svh - 260px),780px);min-height:460px;width:auto;max-width:100%;margin:0 auto;overflow:visible}
@media (max-width:860px){.mt-mapa svg{width:100%;height:auto;max-height:78svh;min-height:0}}
.mun{fill:var(--mt-vazio);stroke:var(--mt-borda);stroke-opacity:.6;stroke-width:.6;vector-effect:non-scaling-stroke}
.mun.tem{fill:var(--mt-tem);cursor:pointer}
.mun.tem:hover,.mun.acende{fill:var(--accent)}
.mun.sem:hover{fill:var(--mt-vazio-h)}
.mun.achou{stroke:var(--fg);stroke-opacity:1;stroke-width:2}
.mun.foco{fill:var(--accent);stroke:var(--fg);stroke-opacity:1;stroke-width:2}
.mun:focus{outline:none}
.mun:focus-visible{outline:none;fill:var(--accent);stroke:var(--fg);stroke-opacity:1;stroke-width:2.5}
.mt-rot{font-family:var(--f-body);font-weight:500;font-size:calc(11.5px * var(--k,1));fill:var(--muted);paint-order:stroke;stroke:var(--bg);
  stroke-width:calc(3px * var(--k,1));stroke-linejoin:round;pointer-events:none;text-anchor:middle;dominant-baseline:central}
.mt-rot.foco,.mt-rot.achou{font-weight:600;fill:var(--fg)}
.mt-rot.oculto{display:none}
.mt-dica{position:absolute;z-index:2;display:none;pointer-events:none;transform:translate(-50%,calc(-100% - 12px));padding:6px 10px;
  border-radius:var(--r1);background:var(--fg);color:var(--paper);box-shadow:var(--sh2);font:600 var(--t-sm)/1.3 var(--f-body);white-space:nowrap}
.mt-dica small{font-size:var(--t-sm);font-weight:400;opacity:.8}

/* painel do município */
.mt-lado{display:grid;gap:var(--s3);align-content:start;position:static}
@media (min-width:861px){.mt-lado{position:sticky;top:var(--s4)}}
.mt-sel{display:grid;gap:var(--s2);align-content:start;border:0;background:transparent;padding:0}
.mt-sel h2{margin:0;font:700 var(--t-2xl)/1.15 var(--f-display);letter-spacing:-.005em}
.mt-sel p{font-size:var(--t-md)}
.mt-sel p+.al{margin-top:var(--s2);border-top:1px solid var(--line)}
.mt-sel .al{display:grid;gap:2px;width:100%;padding:var(--s3) var(--s1);border:0;border-bottom:1px solid var(--line);border-radius:0;
  background:transparent;color:var(--fg);font:inherit;text-align:left;text-decoration:none;cursor:pointer}
.mt-sel .al:hover{background:var(--hover)}
.mt-sel .al:hover b{color:var(--accent)}
.mt-sel .al:focus-visible{outline-offset:-2px}
.mt-sel .al b{font:600 var(--t-base) var(--f-mono)}
.mt-sel .al.nome b{font-family:var(--f-body)}
.mt-sel .al span{font-size:var(--t-sm);color:var(--muted)}
.mt-sel .abre{justify-self:start;display:inline-flex;align-items:center;min-height:var(--alvo);font-weight:600;text-decoration:none}
.mt-sel .abre:hover{text-decoration:underline}
.mt-sel .mt-nada{color:var(--fg)}
.mt-leg{display:flex;align-items:center;gap:var(--s2);margin-top:var(--s1);font-size:var(--t-xs);color:var(--muted)}
.mt-leg i{flex:none;width:18px;height:10px;border-radius:2px;background:var(--mt-vazio);box-shadow:inset 0 0 0 1px var(--mt-borda)}
.card.acende{background:var(--sel);box-shadow:inset 3px 0 0 var(--accent)}
@media (prefers-reduced-motion:no-preference){
  .mun{transition:fill var(--dur) var(--ease)}
  .mt-sel>*{animation:entra var(--dur-l) var(--ease) both}
  .mt-mais{transition:color var(--dur) var(--ease),background-color var(--dur) var(--ease)}
}`;
  document.head.append(css);

  alvo.className = 'mapa-to';
  alvo.innerHTML = `<div class="mt-barra"></div><aside class="mt-rank" aria-label="Ranking de alimentadores por NAE"></aside>
    <div class="mt-mapa"><svg role="group" aria-label="Mapa dos municípios do Tocantins" tabindex="-1"></svg><div class="mt-dica" aria-hidden="true"></div></div>
    <div class="mt-lado"><section class="mt-sel" aria-live="polite"></section></div>`;
  const svg = alvo.querySelector('svg'), dica = alvo.querySelector('.mt-dica'), sel = alvo.querySelector('.mt-sel'), caixa = svg.parentNode;
  const VW = M.w + 12;
  svg.setAttribute('viewBox', `-6 -6 ${VW} ${M.h + 12}`);
  const NS = 'http://www.w3.org/2000/svg', el = {}, rot = {};
  let foco = null, achou = new Set();
  M.muns.forEach(m => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', m.d);
    p.setAttribute('class', 'mun ' + (m.slug ? 'tem' : 'sem'));
    if (m.slug) { p.setAttribute('tabindex', '-1'); p.setAttribute('role', 'button'); p.setAttribute('aria-label', m.nome); }
    p.dataset.cod = m.cod;
    svg.append(p);
    el[m.cod] = p;
  });
  // teclado: um só município na ordem do Tab (o escolhido, ou Palmas); as setas andam pelo mapa
  const roda = cod => {
    svg.querySelectorAll('.mun[tabindex="0"]').forEach(p => p.setAttribute('tabindex', '-1'));
    el[cod].setAttribute('tabindex', '0');
  };
  const inicial = M.muns.find(m => m.slug && m.busca === 'palmas') || M.muns.find(m => m.slug);
  if (inicial) roda(inicial.cod);

  // nomes: em repouso só as cidades de referência; o escolhido e os achados na busca também aparecem
  const REF = ['palmas', 'araguaina', 'gurupi', 'porto nacional', 'paraiso do tocantins', 'guarai', 'colinas do tocantins',
    'miracema do tocantins', 'pedro afonso', 'araguatins', 'tocantinopolis', 'dianopolis', 'natividade', 'formoso do araguaia', 'arraias'];
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('aria-hidden', 'true');
  M.muns.forEach(m => {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', m.c[0]); t.setAttribute('y', m.c[1]);
    t.setAttribute('class', 'mt-rot oculto');
    t.textContent = m.nome;
    t.dataset.cod = m.cod;
    t.dataset.p = m.slug ? kmTot(m) : -1;
    g.append(t);
    rot[m.cod] = t;
  });
  svg.append(g);
  const prio = t => t.dataset.cod === foco ? 2 : achou.has(t.dataset.cod) ? 1 : 0;
  const X0 = -6, X1 = M.w + 6;
  function desamontoa() {            // os que se cruzam somem (o escolhido e os achados ganham dos outros)
    const ts = [...g.children].filter(t => !t.classList.contains('oculto')).sort((a, b) => prio(b) - prio(a) || b.dataset.p - a.dataset.p);
    const ok = [];
    ts.forEach(t => {
      t.style.display = '';
      const cx = porCod[t.dataset.cod].c[0];
      t.setAttribute('x', cx);
      const r = t.getBBox();
      const dx = Math.max(X0 - r.x, 0) - Math.max(r.x + r.width - X1, 0);   // nome na beira do estado não sai da tela
      if (dx) { t.setAttribute('x', cx + dx); r.x += dx; }
      if (ok.some(q => r.x < q.x + q.width + 2 && r.x + r.width + 2 > q.x && r.y < q.y + q.height && r.y + r.height > q.y)) t.style.display = 'none';
      else ok.push(r);
    });
  }
  function rotulos() {
    M.muns.forEach(m => {
      const t = rot[m.cod], f = m.cod === foco, a = achou.has(m.cod);
      t.classList.toggle('foco', f);
      t.classList.toggle('achou', a && !f);
      t.classList.toggle('oculto', !(f || a || REF.includes(m.busca)));
    });
    desamontoa();
  }
  // letra de ~11,5 px na tela em qualquer largura do mapa
  const escala = () => {
    const w = svg.getBoundingClientRect().width;
    if (!w) return;
    g.style.setProperty('--k', (VW / w).toFixed(3));
    desamontoa();
  };
  rotulos();
  if (window.ResizeObserver) new ResizeObserver(escala).observe(svg); else escala();

  // contorno por cima dos vizinhos (antes do <g> dos nomes); quem está com o foco do teclado não o perde
  const traz = p => {
    if (p.nextSibling === g) return;
    const tinha = document.activeElement === p;
    svg.insertBefore(p, g);
    if (tinha && document.activeElement !== p) p.focus({ preventScroll: true });
  };

  svg.addEventListener('mousemove', e => {
    const p = e.target.closest('.mun');
    if (!p) { dica.style.display = 'none'; return; }
    const m = porCod[p.dataset.cod], r = caixa.getBoundingClientRect();
    dica.innerHTML = `${esc(m.nome)} <small>${m.slug ? `· ${nAls(m)} · ${km(kmTot(m))}` : '· sem dados ainda'}</small>`;
    dica.style.left = (e.clientX - r.left) + 'px'; dica.style.top = (e.clientY - r.top) + 'px'; dica.style.display = 'block';
  });
  svg.addEventListener('mouseleave', () => {
    dica.style.display = 'none';
    document.querySelectorAll('.card.acende').forEach(c => c.classList.remove('acende'));
  });

  // painel ao lado: só redesenha (e anima) quando o conteúdo muda
  let pintado = '';
  const pinta = h => { if (h !== pintado) sel.innerHTML = pintado = h; };
  const nTem = M.muns.filter(m => m.slug).length;
  const LEG = '<p class="mt-leg"><i aria-hidden="true"></i>Sem dados ainda</p>';
  function resumo(nada) {
    pinta(`<h2>Tocantins</h2><p>${nTem} de ${M.muns.length} municípios com alimentador no site. Clique ou toque num município no mapa ` +
      `ou busque pelo nome acima.</p>${nada ? `<p class="mt-nada">Nenhum município com “${esc(nada)}”.</p>` : ''}${LEG}`);
  }
  function achados(ms) {
    pinta('<h2>Encontrados</h2><p>Escolha o município:</p>' + ms.map(m =>
      `<button type="button" class="al nome" data-cod="${esc(m.cod)}"><b>${esc(m.nome)}</b>` +
      `<span>${m.slug ? `${nAls(m)} · ${km(kmTot(m))}` : 'Sem dados ainda'}</span></button>`).join(''));
  }
  function tiraFoco() {
    if (!foco) return;
    el[foco].classList.remove('foco');
    foco = null;
  }
  function escolhe(cod, rola) {
    const m = porCod[cod];
    tiraFoco();
    foco = cod;
    el[cod].classList.add('foco');
    if (m.slug) roda(cod);
    traz(el[cod]);
    rotulos();
    pinta(m.slug
      ? `<h2>${esc(m.nome)}</h2><p>${nAls(m)} · ${km(kmTot(m))} de rede no município</p>` +
        m.als.map(a => `<a class="al" href="alimentadores/${esc(a.cod)}/?m=${esc(m.slug)}"><b>${esc(a.cod)}</b><span>${esc(a.se)} · ${km(a.m)} aqui</span></a>`).join('') +
        `<a class="abre" href="municipios/${esc(m.slug)}/">Abrir a página do município →</a>`
      : `<h2>${esc(m.nome)}</h2><p>Ainda sem alimentador processado no site.</p>${LEG}`);
    if (rola && matchMedia('(max-width:860px)').matches) sel.scrollIntoView({ block: 'nearest', behavior: calmo.matches ? 'auto' : 'smooth' });
  }
  svg.addEventListener('click', e => { const p = e.target.closest('.mun'); if (p) escolhe(p.dataset.cod, true); });
  sel.addEventListener('click', e => { const b = e.target.closest('button.al[data-cod]'); if (b) escolhe(b.dataset.cod, true); });

  // setas: vai ao município mais perto na direção (dentro de um cone de ±56°)
  const centro = {};
  const cen = cod => centro[cod] || (centro[cod] = (b => [b.x + b.width / 2, b.y + b.height / 2])(el[cod].getBBox()));
  const DIR = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
  svg.addEventListener('keydown', e => {
    const p = e.target.closest('.mun');
    if (!p) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); escolhe(p.dataset.cod, true); return; }
    const d = DIR[e.key];
    if (!d) return;
    e.preventDefault();
    const [x0, y0] = cen(p.dataset.cod);
    let melhor = null, dist = Infinity;
    M.muns.forEach(m => {
      if (!m.slug || m.cod === p.dataset.cod) return;
      const [x, y] = cen(m.cod), dx = x - x0, dy = y - y0;
      const frente = dx * d[0] + dy * d[1], lado = Math.abs(dx * d[1] + dy * d[0]);
      if (frente <= 0 || lado > frente * 1.5) return;
      const q = dx * dx + dy * dy;
      if (q < dist) { dist = q; melhor = m.cod; }
    });
    if (melhor) { roda(melhor); el[melhor].focus({ preventScroll: true }); }
  });
  // mover o path no mousedown faria o navegador perder o clique: só o foco do teclado traz o contorno para cima
  let toque = 0;
  svg.addEventListener('pointerdown', () => { toque = performance.now(); });
  svg.addEventListener('focusin', e => {
    const p = e.target.closest('.mun');
    if (!p) return;
    if (porCod[p.dataset.cod].slug) roda(p.dataset.cod);
    if (performance.now() - toque > 600) traz(p);
  });
  svg.addEventListener('focusout', () => { if (foco) traz(el[foco]); });

  // busca da página: destaca no mapa (também os municípios sem dados); um resultado só = já escolhe
  const busca = document.getElementById('busca');
  if (busca) {
    const bm = document.createElement('div');
    bm.className = 'mt-bmun';
    bm.innerHTML = '<label for="busca" class="rot">Município</label>';
    bm.append(busca);
    alvo.querySelector('.mt-barra').append(bm);           // barra em cima do mapa (a lista de municípios continua embaixo)
    busca.placeholder = 'Buscar município (ex.: Arraias)';
    busca.setAttribute('aria-label', 'Buscar município');
    busca.addEventListener('input', () => {
      const txt = busca.value.trim(), q = semAcento(txt);
      achou.forEach(c => el[c].classList.remove('achou'));
      achou = new Set();
      if (!q) { tiraFoco(); rotulos(); resumo(); return; }
      const ms = M.muns.filter(m => m.busca.includes(q));
      ms.forEach(m => { el[m.cod].classList.add('achou'); achou.add(m.cod); });
      if (ms.length === 1) { escolhe(ms[0].cod); return; }
      tiraFoco();
      rotulos();
      if (ms.length >= 2 && ms.length <= 8) achados(ms); else resumo(ms.length ? '' : txt);
    });
  }
  // blocos da página: passar o mouse acende o município no mapa
  document.querySelectorAll('.card[data-busca]').forEach(c => {
    const m = porBusca[c.dataset.busca];
    if (!m) return;
    c.addEventListener('mouseenter', () => el[m.cod].classList.add('acende'));
    c.addEventListener('mouseleave', () => el[m.cod].classList.remove('acende'));
  });
  svg.addEventListener('mouseover', e => {
    const p = e.target.closest('.mun.tem');
    document.querySelectorAll('.card.acende').forEach(c => c.classList.remove('acende'));
    if (p) document.querySelector(`.card[data-busca="${CSS.escape(porCod[p.dataset.cod].busca)}"]`)?.classList.add('acende');
  });
  resumo();

  // ---------- ranking de alimentadores por NAE (window.RANK de ranking-nae.js) ----------
  const R = window.RANK, rank = alvo.querySelector('.mt-rank');
  if (!R || !R.als.length) { rank.remove(); return; }
  const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const rotMes = m => `${MES[+m.slice(5, 7) - 1]}/${m.slice(0, 4)}`;
  const nf = n => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  const ORD = {
    nae: { rot: 'NAE', val: a => a.nae, un: 'NAE' },
    cons: { rot: 'Consumidores', val: a => a.cons, un: 'cons.' },
    km: { rot: 'NAE/100 km', val: a => a.km ? a.nae / a.km * 100 : 0, un: '/100 km' },
  };
  let ord = 'nae';
  const slugDe = cod => (porCod[cod] || {}).slug;
  const hoje = new Date();
  const anosDesde = d => d ? (hoje - new Date(d + 'T00:00:00')) / 31557600000 : Infinity;
  const tres = matchMedia('(min-width:1181px)');          // 3 colunas: lista inteira com rolagem; senão, de 10 em 10
  let mostra = 10;
  function pintaRank() {
    const o = ORD[ord];
    const ls = R.als.slice().sort((a, b) => o.val(b) - o.val(a) || b.nae - a.nae);
    const vis = tres.matches ? ls : ls.slice(0, mostra);
    const max = Math.max(...ls.map(o.val), 1);
    rank.innerHTML = `<h2>Alimentadores com mais NAE<small>Árvore/eucalipto na rede · ${R.meses.length ? rotMes(R.meses[0]) + ' a ' + rotMes(R.meses[1]) : ''}</small></h2>
      <div class="mt-ord" role="group" aria-label="Ordenar por">${Object.entries(ORD).map(([k, x]) => `<button type="button" data-o="${k}" aria-pressed="${k === ord}">${x.rot}</button>`).join('')}</div>
      <ol class="mt-rl">${vis.map((a, i) => {
        const v = o.val(a), slug = a.muns.map(slugDe).find(Boolean), nomes = a.muns.map(c => (porCod[c] || {}).nome || c);
        const velha = anosDesde(a.ult_limpeza) > 3;
        return `<li><a class="mt-ra${a.nae ? '' : ' zero'}" href="alimentadores/${esc(a.al)}/${slug ? '?m=' + esc(slug) : ''}" data-al="${esc(a.al)}">
          <span class="p">${i + 1}º</span><b>${esc(a.al)}</b><span class="v">${nf(v)}<small>${o.un}</small></span>
          <span class="se">${esc(a.se)} · ${esc(nomes.slice(0, 3).join(', '))}${nomes.length > 3 ? ` e mais ${nomes.length - 3}` : ''}</span>
          <span class="bar"><i style="width:${100 * v / max}%"></i></span>
          <span class="ex">${a.nae} NAE · ${a.cons.toLocaleString('pt-BR')} cons. · ${nf(a.km)} km · <span class="lp">limpeza: <em class="${velha ? 'velha' : ''}">${a.ult_limpeza ? a.ult_limpeza.split('-').reverse().join('/') : 'sem registro'}</em></span></span></a></li>`;
      }).join('')}</ol>${vis.length < ls.length ? `<button type="button" class="mt-mais" data-mais>Mostrar mais ${Math.min(20, ls.length - vis.length)} (de ${ls.length})</button>` : ''}`;
  }
  rank.addEventListener('click', e => {
    const b = e.target.closest('[data-o],[data-mais]');
    if (!b) return;
    if (b.dataset.o) ord = b.dataset.o; else mostra += 20;
    pintaRank();
    if (b.hasAttribute('data-mais')) rank.querySelectorAll('.mt-ra')[mostra - 20]?.focus();   // foco no 1º item novo
    else rank.querySelector(`[data-o="${ord}"]`)?.focus();                                      // o botão escolhido continua com o foco
  });
  tres.addEventListener('change', pintaRank);
  // passar o mouse no alimentador acende os municípios dele no mapa
  const apaga = () => Object.values(el).forEach(p => p.classList.remove('acende'));
  const acende = a => (R.als.find(x => x.al === a.dataset.al) || { muns: [] }).muns.forEach(c => el[c] && el[c].classList.add('acende'));
  rank.addEventListener('mouseover', e => { const a = e.target.closest('.mt-ra'); apaga(); if (a) acende(a); });
  rank.addEventListener('mouseleave', apaga);
  rank.addEventListener('focusin', e => { const a = e.target.closest('.mt-ra'); apaga(); if (a) acende(a); });
  rank.addEventListener('focusout', e => { if (!rank.contains(e.relatedTarget)) apaga(); });
  pintaRank();
})();
