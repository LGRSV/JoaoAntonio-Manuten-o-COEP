// Mapa dos municípios do Tocantins na página inicial (usa window.MUN de mapa-municipios-dados.js).
// Cada município pintado pela NAE dele (faixas), com o contorno das regionais por cima. Clicar numa regional aproxima
// nela e separa os polos (cada polo controla um grupo de municípios); aí clicar num município abre a página dele.
// A busca de município (#busca) abre a lista suspensa de todos os municípios (#mun-lista) e acende os achados no mapa.
// [PROTÓTIPO tema 2 · zoom livre] as partes novas estão entre os marcadores ZOOM LIVRE; o resto é o arquivo original.
// A casca (#mapa-to com a barra e o svg com viewBox) vem pronta no HTML de scripts/gera_trechos.py
// e todo o estilo está em assets/site.css: este script só preenche, nada muda de tamanho nem de lugar ao carregar.
(function () {
  const M = window.MUN, alvo = document.getElementById('mapa-to');
  if (!M || !alvo || !alvo.querySelector('.mt-mapa svg')) return;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const km = m => (m / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' km';
  const semAcento = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const kmTot = m => m.als.reduce((s, a) => s + a.m, 0);
  const nAls = m => `${m.als.length} alimentador${m.als.length > 1 ? 'es' : ''}`;
  const porCod = Object.fromEntries(M.muns.map(m => [m.cod, m]));

  const svg = alvo.querySelector('.mt-mapa svg'), dica = alvo.querySelector('.mt-dica'), caixa = svg.parentNode;
  const VW = M.w + 12;
  svg.setAttribute('viewBox', `-6 -6 ${VW} ${M.h + 12}`);
  const NS = 'http://www.w3.org/2000/svg', el = {}, rot = {};
  let foco = null, achou = new Set();
  // cor de cada município pela NAE dele (faixas; a legenda sai daqui) e, por cima, o contorno das regionais
  const FAIXAS = [0, 1, 11, 31, 101, 201];
  const faixa = n => FAIXAS.reduce((k, l, i) => n >= l ? i : k, 0);
  const rotFaixa = i => i === 0 ? 'Sem NAE' : i === FAIXAS.length - 1 ? `${FAIXAS[i]} ou mais` : `${FAIXAS[i]} a ${FAIXAS[i + 1] - 1}`;
  // municípios agrupados por polo (o grupo é o que se afasta ao abrir a regional), com o contorno do polo no fim do grupo
  const grp = {};
  const grupo = m => {
    if (!m.polo) return svg;
    if (!grp[m.polo]) {
      const gp = grp[m.polo] = document.createElementNS(NS, 'g');
      gp.setAttribute('class', 'mt-polo');
      gp.dataset.reg = m.reg;
      svg.append(gp);
    }
    return grp[m.polo];
  };
  M.muns.forEach(m => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', m.d);
    p.setAttribute('class', `mun ${m.slug ? 'tem' : 'sem'} nae-${faixa(m.nae || 0)}`);
    if (m.slug) { p.setAttribute('tabindex', '-1'); p.setAttribute('role', 'button'); p.setAttribute('aria-label', m.nome); }
    p.dataset.cod = m.cod;
    grupo(m).append(p);
    el[m.cod] = p;
  });
  // contorno do polo: um traço claro por baixo (fundo) faz a cor aparecer também sobre os municípios laranja
  Object.entries(grp).forEach(([polo, gp]) => ['mt-poloc fundo', 'mt-poloc'].forEach(cl => {
    const c = document.createElementNS(NS, 'path');
    c.setAttribute('class', cl);
    c.setAttribute('aria-hidden', 'true');
    c.setAttribute('d', (M.pols || {})[polo] || '');
    gp.append(c);
  }));
  const regs = document.createElementNS(NS, 'g');
  regs.setAttribute('class', 'mt-regc');
  regs.setAttribute('aria-hidden', 'true');
  Object.values(M.regs || {}).forEach(d => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); regs.append(p); });
  svg.append(regs);
  const leg = alvo.querySelector('.mt-regs');
  // legenda: canto inferior esquerdo, já aberta (details open) e recolhível; no celular começa fechada para não cobrir o mapa
  if (leg && matchMedia('(max-width:860px)').matches) leg.open = false;
  if (leg) leg.innerHTML = '<summary>NAE-Vegetação</summary><div class="mt-regs-c">' +
    FAIXAS.map((l, i) => `<span><i class="nae-${i}" aria-hidden="true"></i>${rotFaixa(i)}</span>`).join('') +
    (M.regs ? '<span class="lim-s"><i class="lim" aria-hidden="true"></i>Limite das regionais</span>' : '') + '</div>';
  // teclado: um só município na ordem do Tab (o escolhido, ou Palmas); as setas andam pelo mapa
  const roda = cod => {
    svg.querySelectorAll('.mun[tabindex="0"]').forEach(p => p.setAttribute('tabindex', '-1'));
    el[cod].setAttribute('tabindex', '0');
  };
  const inicial = M.muns.find(m => m.slug && m.busca === 'palmas') || M.muns.find(m => m.slug);
  if (inicial) roda(inicial.cod);

  // nomes: no estado inteiro aparecem só as regionais (Norte, Centro, Sul); o município escolhido também aparece
  const REF = [];
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'mt-nomes');
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
  // regionais no estado inteiro: um cartãozinho com o nome e a NAE de cada uma, todos alinhados no meio do mapa, cada um
  // na altura do meio dos municípios da sua regional; clicar abre a regional (e eles somem até voltar ao Tocantins).
  // Os cartões dos polos só aparecem na barra da lupa depois de abrir uma regional.
  const cartoes = document.createElement('div');
  cartoes.className = 'mt-regcards';
  const regInfo = Object.keys(M.regs || {}).map(r => {
    const ms = M.muns.filter(m => m.reg === r);
    return { r, y: ms.reduce((s, m) => s + m.c[1], 0) / ms.length, nae: ms.reduce((s, m) => s + (m.nae || 0), 0) };
  });
  cartoes.innerHTML = regInfo.map(i => `<button type="button" data-reg="${esc(i.r)}" aria-label="Abrir a Regional ${esc(i.r)}, ${i.nae.toLocaleString('pt-BR')} NAE">` +
    `<b>${esc(i.r)}</b><i>${i.nae.toLocaleString('pt-BR')} NAE</i></button>`).join('');
  caixa.append(cartoes);
  cartoes.addEventListener('click', e => { const b = e.target.closest('button'); if (b) entra(b.dataset.reg, e.detail === 0); });
  const poeCartoes = () => {                                // ZOOM LIVRE: posição pelo viewBox atual (no estado inteiro é o mesmo de antes)
    const r = svg.getBoundingClientRect(), c = caixa.getBoundingClientRect(), v = vb();
    if (!r.width) return;
    const k = Math.min(r.width / v[2], r.height / v[3]), ox = (r.width - v[2] * k) / 2, oy = (r.height - v[3] * k) / 2;
    [...cartoes.children].forEach((e, i) => {
      e.style.left = (r.left - c.left + ox + (M.w / 2 - v[0]) * k).toFixed(0) + 'px';
      e.style.top = (r.top - c.top + oy + (regInfo[i].y - v[1]) * k).toFixed(0) + 'px';
    });
  };
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
    const r = svg.getBoundingClientRect();                 // o SVG pode ficar limitado pela altura (max-height)
    if (!r.width || !r.height) return;
    g.style.setProperty('--k', Z ? uPorPx().toFixed(4) : (1 / Math.min(r.width / VW, r.height / (M.h + 12))).toFixed(3));   // ZOOM LIVRE: com zoom a letra segue o viewBox atual
    poeCartoes();
    desamontoa();
  };
  rotulos();
  if (window.ResizeObserver) new ResizeObserver(escala).observe(svg); else escala();

  // contorno do município por cima dos vizinhos (antes do contorno das regionais e dos nomes); quem está com o foco do teclado não o perde
  const traz = p => {
    const gp = p.parentNode, fim = gp.querySelector('.mt-poloc');
    if (p.nextSibling === fim && gp.nextSibling === regs) return;
    const tinha = document.activeElement === p;
    if (fim) { gp.insertBefore(p, fim); svg.insertBefore(gp, regs); } else svg.insertBefore(p, regs);
    if (tinha && document.activeElement !== p) p.focus({ preventScroll: true });
  };

  svg.addEventListener('mousemove', e => {
    if (dr && dr.on) return;                                  // ZOOM LIVRE: arrastando o mapa não mostra a dica
    const rd = e.target.closest('.mt-redes path[data-al]');
    if (rd) {
      const m = porCod[mun], a = m.als.find(x => x.cod === rd.dataset.al), r = caixa.getBoundingClientRect();
      realceAl(a.cod);
      dica.innerHTML = `${esc(a.cod)} <small>· ${esc(a.se)} · ${(a.n || 0).toLocaleString('pt-BR')} NAE · ${km(a.m)} em ${esc(m.nome)}</small>` +
        `<small class="mt-dica-c">${alf === a.cod ? 'Clique para abrir o alimentador' : 'Clique para dar zoom no alimentador'}</small>`;
      dica.style.left = (e.clientX - r.left) + 'px'; dica.style.top = (e.clientY - r.top) + 'px'; dica.style.display = 'block';
      return;
    }
    if (mun) realceAl(null);
    const p = e.target.closest('.mun');
    if (!p) { dica.style.display = 'none'; return; }
    const m = porCod[p.dataset.cod], r = caixa.getBoundingClientRect();
    if (!reg) realca(Z ? null : m.reg); else if (!pol) realcaPolo(m.reg === reg ? m.polo : null);
    dica.innerHTML = `${esc(m.nome)} <small>· ${(m.nae || 0).toLocaleString('pt-BR')} NAE${m.reg ? ` · Regional ${esc(m.reg)} · ${esc(m.polo)}` : ''}${m.slug ? ` · ${nAls(m)} · ${km(kmTot(m))}` : ' · sem dados ainda'}</small>` +
      (!reg && m.reg ? `<small class="mt-dica-c">Clique para ver os polos da Regional ${esc(m.reg)}</small>` :
        reg && !pol && m.reg === reg ? `<small class="mt-dica-c">Clique para ver os municípios de ${esc(m.polo)}</small>` :
        pol && !mun && m.polo === pol && m.slug ? '<small class="mt-dica-c">Clique para ver os alimentadores</small>' : '');
    dica.style.left = (e.clientX - r.left) + 'px'; dica.style.top = (e.clientY - r.top) + 'px'; dica.style.display = 'block';
  });
  svg.addEventListener('mouseleave', () => { dica.style.display = 'none'; if (!reg) realca(null); else if (!pol) realcaPolo(null); else if (mun) realceAl(null); });

  // regional aberta: o mapa aproxima nela, as outras somem e os polos se afastam um do outro (do centro da regional
  // para fora). Ao fim da animação cada polo ganha o contorno na cor dele, e a legenda ao lado (como o T1/T2/T3 do
  // painel) lista os polos com a mesma cor, os municípios e a NAE; tocar num polo da legenda apaga ou acende ele no mapa.
  // "← Tocantins" ou Esc voltam ao estado inteiro.
  // Polo aberto (clicar num polo da regional aberta): do mesmo jeito, o mapa aproxima no polo e os municípios dele se
  // afastam um do outro, com o nome de cada um; aí clicar num município abre a página dele. "← Regional" ou Esc voltam.
  let reg = null, pol = null, anima = 0, mdesl = {}, corDe = {};
  let Z = null;                         // ZOOM LIVRE: {base, wc, hs} enquanto o zoom livre está ligado (null = enquadramento do nível)
  const TODO = [-6, -6, VW, M.h + 12], AFASTA = 0.32, AFASTA_MUN = 0.22, DUR = 650, CORES = ['a', 'b', 'c', 'd'];
  let nivelVb = TODO.slice();         // ZOOM LIVRE: enquadramento do nível atual (o último destino de voa)
  const calmo = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vb = () => svg.getAttribute('viewBox').split(' ').map(Number);
  const une = (a, b) => !a ? b : { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), x2: Math.max(a.x2, b.x2), y2: Math.max(a.y2, b.y2) };
  const caixaDe = e => { const r = e.getBBox(); return { x: r.x, y: r.y, x2: r.x + r.width, y2: r.y + r.height }; };
  const polosDe = r => Object.entries(grp).filter(([, gp]) => gp.dataset.reg === r);
  function realca(r) {
    Object.values(grp).forEach(gp => gp.classList.toggle('apaga', !!r && gp.dataset.reg !== r));
  }
  function realcaPolo(polo) {
    polosDe(reg).forEach(([po, gp]) => gp.classList.toggle('apaga', !!polo && po !== polo));
  }
  const soma = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const tr = d => `translate(${d[0].toFixed(1)}px,${d[1].toFixed(1)}px)`;
  function voa(alvoVb) {             // anima o viewBox até o alvo
    cancelAnimationFrame(anima);
    caixa.classList.remove('pronta');
    caixa.classList.add('voando');
    nivelVb = alvoVb.slice();         // ZOOM LIVRE: o nível novo vira a referência; limpa nomes/prévias do zoom
    zLimpa();
    const de = vb(), t0 = performance.now(), dur = calmo() ? 0 : DUR;
    const passo = agora => {
      const t = dur ? Math.min(1, (agora - t0) / dur) : 1, e = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      svg.setAttribute('viewBox', de.map((v, i) => +(v + (alvoVb[i] - v) * e).toFixed(2)).join(' '));
      if (t < 1) anima = requestAnimationFrame(passo); else { anima = 0; caixa.classList.remove('voando'); caixa.classList.toggle('pronta', !!reg); if (Z) fimZ(); poeNomes(); poeSelos(); }
    };
    selos.innerHTML = '';
    anima = requestAnimationFrame(passo);
  }
  const volta = document.createElement('button');
  volta.type = 'button';
  volta.className = 'mt-volta';
  volta.hidden = true;
  volta.textContent = '←';
  // polos da regional aberta: lá em cima, na barra da lupa (economiza o espaço do mapa)
  const legPolos = document.createElement('span');
  legPolos.className = 'mt-polos';
  legPolos.setAttribute('role', 'group');
  legPolos.hidden = true;
  (document.querySelector('.mt-barra') || caixa).append(legPolos);
  // alimentadores do município aberto: no computador na coluna da esquerda; no celular presos embaixo do mapa, numa
  // caixinha fechada que uma seta discreta puxa para cima (site.css)
  const legAl = document.createElement('span');
  legAl.className = 'mt-als';
  legAl.setAttribute('role', 'group');
  legAl.hidden = true;
  let puxada = false;
  const caixaPolos = (titulo, chips) => `<button type="button" class="mt-puxa" aria-expanded="${puxada}" aria-label="${puxada ? 'Esconder' : 'Mostrar'} os alimentadores">` +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg></button>' +
    `<span class="mt-polos-c"><b class="mt-polos-t">${titulo}</b>${chips}</span>`;
  // coluna da esquerda do mapa: a seta de voltar e, com o município aberto, os alimentadores dele
  const lado = document.createElement('div');
  lado.className = 'mt-lado';
  lado.append(volta, legAl);
  caixa.append(lado);
  // NAE de cada polo num selo vermelho no meio dele (regional aberta, depois da animação)
  const selos = document.createElement('div');
  selos.className = 'mt-selos';
  selos.setAttribute('aria-hidden', 'true');
  caixa.append(selos);
  let desl = {};
  // enquadra a regional aberta deixando livre a coluna da legenda (computador) ou o topo para o "← Tocantins" (celular)
  const move = (b, [dx, dy]) => ({ x: b.x + dx, y: b.y + dy, x2: b.x2 + dx, y2: b.y2 + dy });
  function enquadra() {
    let bb = null;
    if (alCaixa) bb = alCaixa;
    else if (mun) bb = move(caixaDe(el[mun]), soma(desl[pol], mdesl[mun]));
    else if (pol) M.muns.forEach(m => { if (m.polo === pol) bb = une(bb, move(caixaDe(el[m.cod]), soma(desl[pol], mdesl[m.cod]))); });
    else polosDe(reg).forEach(([polo, gp]) => { bb = une(bb, move(caixaDe(gp), desl[polo])); });
    const x = bb.x - 12, y = bb.y - 12, w = bb.x2 - bb.x + 24, h = bb.y2 - bb.y + 24, W = caixa.clientWidth;
    // celular (mesmo corte do site.css): sobra o topo para a seta de voltar e o pé para a seta dos polos
    if (matchMedia('(max-width:860px)').matches) { const t = 52 * w / W, f = 52 * w / W; return [x, y - t, w, h + t + f]; }
    // a coluna da esquerda (seta, lista de alimentadores e, embaixo, a legenda) fica livre
    const H = svg.clientHeight || 600, L1 = Math.max(lado.offsetWidth, leg ? leg.offsetWidth : 0) + 24, L2 = 24;
    const k = Math.min(H / h, Math.max(1e-3, W - L1 - L2) / w);
    const altura = H / k;
    return [x - L1 / k, y - (altura - h) / 2, w + (L1 + L2) / k, altura];
  }
  function entra(r, teclado, cod) {
    if (!r || reg === r) return;
    reg = r;
    realca(null);
    dica.style.display = 'none';
    const ps = polosDe(r).map(([polo, gp]) => {
      const ms = M.muns.filter(m => m.polo === polo), b = caixaDe(gp);
      return { polo, gp, ms, nae: ms.reduce((s, m) => s + (m.nae || 0), 0), cx: (b.x + b.x2) / 2, cy: (b.y + b.y2) / 2, b };
    });
    const vai = k => Math.max(...ps.map(p => p[k])) - Math.min(...ps.map(p => p[k]));
    const eixo = vai('cy') >= vai('cx') ? 'cy' : 'cx';            // legenda na ordem do mapa: de cima para baixo ou da esquerda para a direita
    ps.sort((a, b) => a[eixo] - b[eixo]);
    const rb = ps.reduce((a, p) => une(a, p.b), null), rc = [(rb.x + rb.x2) / 2, (rb.y + rb.y2) / 2];
    desl = {};
    ps.forEach((p, i) => {
      desl[p.polo] = [(p.cx - rc[0]) * AFASTA, (p.cy - rc[1]) * AFASTA];
      p.gp.style.setProperty('--pc', `var(--polo-${CORES[i % CORES.length]})`);
    });
    Object.entries(grp).forEach(([polo, gp]) => {
      const dentro = gp.dataset.reg === r;
      gp.classList.toggle('fora', !dentro);
      gp.classList.remove('desliga');
      gp.style.transform = dentro ? `translate(${desl[polo][0].toFixed(1)}px,${desl[polo][1].toFixed(1)}px)` : '';
    });
    caixa.classList.add('aberta');
    corDe = Object.fromEntries(ps.map((p, i) => [p.polo, `var(--polo-${CORES[i % CORES.length]})`]));
    legendaRegional(ps);
    legPolos.hidden = false;
    volta.hidden = false;
    voa(enquadra());
    const prim = porCod[cod] && porCod[cod].slug ? porCod[cod] : M.muns.filter(m => m.reg === r && m.slug).sort((a, b) => kmTot(b) - kmTot(a))[0];
    if (prim) { roda(prim.cod); if (teclado) el[prim.cod].focus({ preventScroll: true }); }
  }
  let psReg = [];
  const numeros = (ms, nae) => `${nae.toLocaleString('pt-BR')} NAE`;
  const nae = n => `<i>${n.toLocaleString('pt-BR')}</i>`;
  // trilha na barra da lupa: cada passo já percorrido é um botão que volta até ele; no fim, as opções do nível atual
  // (regionais, polos) como cartõezinhos com a NAE — clicar num deles abre ele e tira os outros do mapa
  const passo = (ir, txt) => `<button type="button" class="mt-passo" data-ir="${ir}">${txt}</button><span class="mt-sep" aria-hidden="true">›</span>`;
  const atual = txt => `<b class="mt-atual" aria-current="location">${txt}</b>`;
  function legendaEstado() {                               // estado inteiro: a barra só tem a busca (as regionais estão no mapa)
    legPolos.hidden = true;
    legPolos.innerHTML = '';
  }
  legendaEstado();
  function legendaRegional(ps) {
    if (ps) psReg = ps;
    legPolos.hidden = false;
    legPolos.setAttribute('aria-label', `Polos da Regional ${reg}`);
    legPolos.innerHTML = passo('estado', 'Tocantins') + atual(esc(reg)) + '<span class="mt-sep" aria-hidden="true">·</span>' + psReg.map(p =>
      `<button type="button" class="mt-pchip" data-polo="${esc(p.polo)}" style="--c:${corDe[p.polo]}" ` +
      `aria-label="${esc(p.polo)}, ${numeros(p.ms, p.nae)}"><b>${esc(p.polo)}</b>${nae(p.nae)}</button>`).join('');
    volta.setAttribute('aria-label', `Regional ${reg}. Voltar ao Tocantins`);
    volta.title = 'Voltar ao Tocantins';
  }
  // polo aberto: os municípios do polo se afastam do centro do polo; os outros polos da regional somem
  function entraPolo(polo, teclado, cod) {
    if (!reg || pol === polo || !grp[polo]) return;
    pol = polo;
    realcaPolo(null);
    dica.style.display = 'none';
    const b = caixaDe(grp[polo]), pc = [(b.x + b.x2) / 2, (b.y + b.y2) / 2], ms = M.muns.filter(m => m.polo === polo);
    mdesl = {};
    const g0 = Math.hypot(b.x2 - b.x, b.y2 - b.y) * 0.025;        // folga mínima: os do meio do polo também se soltam
    ms.forEach(m => {
      const c = cen(m.cod), dx = c[0] - pc[0], dy = c[1] - pc[1], d = Math.hypot(dx, dy) || 1, f = AFASTA_MUN + g0 / d;
      mdesl[m.cod] = [dx * f, dy * f];
      el[m.cod].style.transform = tr(mdesl[m.cod]);
    });
    polosDe(reg).forEach(([po, gp]) => { gp.classList.toggle('fora', po !== polo); gp.classList.remove('desliga'); });
    caixa.classList.add('polo');
    legendaPolo();
    voa(enquadra());
    const prim = porCod[cod] && porCod[cod].slug ? porCod[cod] : ms.filter(m => m.slug).sort((a, b) => kmTot(b) - kmTot(a))[0];
    if (prim) { roda(prim.cod); if (teclado) el[prim.cod].focus({ preventScroll: true }); }
  }
  function legendaPolo() {
    const ms = M.muns.filter(m => m.polo === pol), nae = ms.reduce((s, m) => s + (m.nae || 0), 0);
    legPolos.setAttribute('aria-label', `Polo ${pol}`);
    legPolos.innerHTML = passo('estado', 'Tocantins') + passo('regional', esc(reg)) +
      `<span class="mt-pchip mt-atual" style="--c:${corDe[pol]}" aria-current="location" aria-label="${esc(pol)}, ${numeros(ms, nae)}"><b>${esc(pol)}</b><i>${nae.toLocaleString('pt-BR')}</i></span>`;
    volta.setAttribute('aria-label', `${pol}. Voltar à Regional ${reg}`);
    volta.title = `Voltar à Regional ${reg}`;
  }
  // município aberto (clicar num município do polo aberto): o mapa aproxima nele e desenha numa cor só a rede de cada
  // alimentador que passa por ali (dados/redes/<AL>.json, de scripts/gera_trechos.py); fora do município a rede fica
  // apagada. Na caixinha, os alimentadores com a miniatura da rede, a NAE e os km no município: passar o mouse numa
  // linha (ou na rede) destaca o alimentador e clicar abre a página dele.
  let mun = null;
  const redes = {};
  const baixaJson = u => fetch(u).then(r => r.ok ? r.json() : null).catch(() => null);
  const pacotes = {};    // cópias reduzidas do site (ex.: a do Artifact) trazem a rede num pacote por polo
  const rede = (al, polo) => redes[al] || (redes[al] = baixaJson(`dados/redes/${encodeURIComponent(al)}.json`).then(r => r ||
    (pacotes[polo] = pacotes[polo] || baixaJson(`dados/redes/polo-${encodeURIComponent(semAcento(polo).replace(/[^a-z0-9]+/g, '-'))}.json`))
      .then(pk => (pk && pk[al]) || null)).then(r => { if (!r) delete redes[al]; return r; }));
  const camada = document.createElementNS(NS, 'g');
  camada.setAttribute('class', 'mt-redes');
  const realceAl = al => {
    if (alf) al = null;
    camada.classList.toggle('realce', !!al);
    camada.querySelectorAll('path[data-al]').forEach(p => p.classList.toggle('on', p.dataset.al === al));
    legAl.querySelectorAll('.mt-al').forEach(a => a.classList.toggle('on', a.dataset.al === al));
  };
  function entraMun(cod, teclado) {
    const m = porCod[cod];
    if (!pol || mun || !m || !m.slug || m.polo !== pol) return;
    mun = cod;
    dica.style.display = 'none';
    nomes2.innerHTML = '';
    caixa.classList.add('nivel-mun');
    M.muns.forEach(x => { if (x.polo === pol) el[x.cod].classList.toggle('fora-m', x.cod !== cod); });
    el[cod].classList.add('aberto-m');
    camada.innerHTML = `<defs><clipPath id="mt-corte"><path d="${m.d}"/></clipPath></defs>` +
      '<g class="mt-redes-f"></g><g class="mt-redes-d" clip-path="url(#mt-corte)"></g>';
    camada.style.transform = tr(mdesl[cod]);
    grp[pol].append(camada);
    const als = m.als.slice().sort((a, b) => b.m - a.m);
    trilhaMun();
    legAl.setAttribute('aria-label', `Alimentadores de ${m.nome}`);
    legAl.hidden = false;
    legAl.innerHTML = caixaPolos(`${esc(m.nome)} · ${m.als.length} alimentador${m.als.length > 1 ? 'es' : ''}`,
      `<a class="mt-amun" href="municipios/${esc(m.slug)}/">Abrir ${esc(m.nome)} →</a>` + als.map(a =>
        `<button type="button" class="mt-al" data-al="${esc(a.cod)}" title="Clique para dar zoom; clique de novo para abrir"><span class="mt-al-m" aria-hidden="true"></span>` +
        `<b>${esc(a.cod)}</b><span>${(a.n || 0).toLocaleString('pt-BR')} NAE · ${km(a.m)} aqui</span></button>`).join(''));
    legAl.classList.toggle('aberta', puxada);
    volta.setAttribute('aria-label', `${m.nome}. Voltar ao polo ${pol}`);
    volta.title = `Voltar ao polo ${pol}`;
    voa(enquadra());
    roda(cod);
    if (teclado) el[cod].focus({ preventScroll: true });
    als.forEach(a => rede(a.cod, m.polo).then(r => {
      if (mun !== cod || !r) return;
      [['.mt-redes-f', ''], ['.mt-redes-d', a.cod]].forEach(([g, al]) => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', r.d);
        if (al) p.dataset.al = al;
        camada.querySelector(g).append(p);
      });
      const mini = legAl.querySelector(`.mt-al[data-al="${a.cod}"] .mt-al-m`), [x0, y0, x1, y1] = r.b;
      const w = Math.max(x1 - x0, .05), h = Math.max(y1 - y0, .05), f = Math.max(w, h) * .08;
      if (mini) mini.innerHTML = `<svg viewBox="${x0 - f} ${y0 - f} ${w + 2 * f} ${h + 2 * f}"><path d="${r.d}"/></svg>`;
    }));
  }
  // alimentador em foco (clicar nele na lista ou na rede): o mapa aproxima na rede inteira dele, que fica forte e sem
  // corte; os outros apagam. Clicar nele de novo (ou em "Abrir …") abre a página do alimentador.
  let alf = null, alCaixa = null;
  const abreAl = al => { location.href = `alimentadores/${encodeURIComponent(al)}/`; };
  function trilhaMun() {
    const m = porCod[mun];
    legPolos.innerHTML = passo('estado', 'Tocantins') + passo('regional', esc(reg)) + passo('polo', esc(pol)) +
      (alf ? passo('mun', esc(m.nome)) + atual(esc(alf)) : atual(esc(m.nome)));
  }
  async function focaAl(al) {
    if (!mun || alf === al) return;
    const cod = mun, r = await rede(al, porCod[mun].polo);
    if (!r || mun !== cod) return;
    alf = al;
    const [x0, y0, x1, y1] = r.b, d = soma(desl[pol], mdesl[mun]);
    alCaixa = move({ x: x0, y: y0, x2: x1, y2: y1 }, d);
    camada.classList.add('foco');
    let gf = camada.querySelector('.mt-redes-a');
    if (!gf) { gf = document.createElementNS(NS, 'g'); gf.setAttribute('class', 'mt-redes-a'); camada.append(gf); }
    gf.innerHTML = '';
    const pa = document.createElementNS(NS, 'path');
    pa.setAttribute('d', r.d);
    pa.dataset.al = al;
    gf.append(pa);
    legAl.querySelectorAll('.mt-al').forEach(a => a.classList.toggle('foco', a.dataset.al === al));
    const ab = legAl.querySelector('.mt-amun');
    if (ab) { ab.href = `alimentadores/${encodeURIComponent(al)}/`; ab.textContent = `Abrir ${al} →`; }
    trilhaMun();
    volta.setAttribute('aria-label', `${al}. Voltar a ${porCod[mun].nome}`);
    volta.title = `Voltar a ${porCod[mun].nome}`;
    voa(enquadra());
  }
  function saiAl(animar = true) {
    if (!alf) return;
    alf = null;
    alCaixa = null;
    camada.classList.remove('foco');
    const gf = camada.querySelector('.mt-redes-a');
    if (gf) gf.innerHTML = '';
    if (!mun) return;
    const m = porCod[mun];
    legAl.querySelectorAll('.mt-al.foco').forEach(a => a.classList.remove('foco'));
    const ab = legAl.querySelector('.mt-amun');
    if (ab) { ab.href = `municipios/${m.slug}/`; ab.textContent = `Abrir ${m.nome} →`; }
    trilhaMun();
    volta.setAttribute('aria-label', `${m.nome}. Voltar ao polo ${pol}`);
    volta.title = `Voltar ao polo ${pol}`;
    if (animar) voa(enquadra());
  }
  function saiMun(animar = true) {
    if (!mun) return;
    saiAl(false);
    const cod = mun;
    mun = null;
    const tinha = document.activeElement === volta || legAl.contains(document.activeElement);
    caixa.classList.remove('nivel-mun');
    legAl.hidden = true;
    legAl.innerHTML = '';
    M.muns.forEach(x => el[x.cod].classList.remove('fora-m', 'aberto-m'));
    camada.remove();
    camada.innerHTML = '';
    camada.classList.remove('realce');
    if (!animar) return;
    legendaPolo();
    voa(enquadra());
    if (tinha) { roda(cod); el[cod].focus({ preventScroll: true }); }
  }
  legAl.addEventListener('mouseover', e => { const a = e.target.closest('.mt-al'); realceAl(a ? a.dataset.al : null); });
  legAl.addEventListener('mouseleave', () => realceAl(null));
  legAl.addEventListener('focusin', e => { const a = e.target.closest('.mt-al'); realceAl(a ? a.dataset.al : null); });
  legAl.addEventListener('click', e => {
    const al = e.target.closest('.mt-al');
    if (al) { if (alf === al.dataset.al) abreAl(al.dataset.al); else focaAl(al.dataset.al); return; }
    const px = e.target.closest('.mt-puxa');
    if (!px) return;
    puxada = !puxada;
    legAl.classList.toggle('aberta', puxada);
    px.setAttribute('aria-expanded', String(puxada));
    px.setAttribute('aria-label', `${puxada ? 'Esconder' : 'Mostrar'} os alimentadores`);
  });
  function saiPolo(animar = true) {
    if (!pol) return;
    saiMun(false);
    const polo = pol;
    pol = null;
    M.muns.forEach(m => { if (m.polo === polo) el[m.cod].style.transform = ''; });
    polosDe(reg).forEach(([, gp]) => gp.classList.remove('fora'));
    caixa.classList.remove('polo');
    const tinha = document.activeElement === volta;
    if (!animar) return;
    legendaRegional();
    voa(enquadra());
    const m = M.muns.find(x => x.polo === polo && x.slug);
    if (tinha && m) { roda(m.cod); el[m.cod].focus({ preventScroll: true }); }
  }
  // nome de cada município do polo aberto, já no lugar afastado (entra depois da animação; os que se cruzam somem)
  const nomes2 = document.createElementNS(NS, 'g');
  nomes2.setAttribute('class', 'mt-nomes2');
  nomes2.setAttribute('aria-hidden', 'true');
  svg.append(nomes2);
  function poeNomes() {
    nomes2.innerHTML = '';
    if (!pol || mun || anima || Z) return;                    // ZOOM LIVRE: com zoom quem desenha os nomes é nomesDoZoom()
    const r = svg.getBoundingClientRect(), v = vb();
    if (!r.width) return;
    nomes2.style.setProperty('--k', Math.max(v[2] / r.width, v[3] / r.height).toFixed(4));
    const ok = [];
    M.muns.filter(m => m.polo === pol).sort((a, b) => (b.nae || 0) - (a.nae || 0)).forEach(m => {
      const t = document.createElementNS(NS, 'text'), [x, y] = soma(soma(m.c, desl[pol]), mdesl[m.cod]);
      t.setAttribute('x', x); t.setAttribute('y', y);
      t.setAttribute('class', 'mt-rot');
      t.textContent = m.nome;
      nomes2.append(t);
      const q = t.getBBox();
      if (ok.some(o => q.x < o.x + o.width + 2 && q.x + q.width + 2 > o.x && q.y < o.y + o.height && q.y + q.height > o.y)) t.remove();
      else ok.push(q);
    });
  }
  // selo de cada polo: no município do polo mais perto do meio dele (o selo sempre cai dentro do polo)
  function poeSelos() {
    selos.innerHTML = '';
    if (!reg || pol || anima) return;
    const ctm = svg.getScreenCTM(), cx = caixa.getBoundingClientRect();
    selos.innerHTML = psReg.map(p => {
      const mx = p.ms.reduce((s, m) => s + m.c[0], 0) / p.ms.length, my = p.ms.reduce((s, m) => s + m.c[1], 0) / p.ms.length;
      const m = p.ms.reduce((a, b) => Math.hypot(b.c[0] - mx, b.c[1] - my) < Math.hypot(a.c[0] - mx, a.c[1] - my) ? b : a);
      const pt = svg.createSVGPoint();
      [pt.x, pt.y] = soma(m.c, desl[p.polo]);
      const s = pt.matrixTransform(ctm);
      return `<span data-polo="${esc(p.polo)}" style="left:${(s.x - cx.left).toFixed(0)}px;top:${(s.y - cx.top).toFixed(0)}px"` +
        `${grp[p.polo].classList.contains('desliga') ? ' class="off"' : ''}>${p.nae.toLocaleString('pt-BR')}</span>`;
    }).join('');
  }
  legPolos.addEventListener('click', e => {
    const bt = e.target.closest('button');
    if (!bt) return;
    if (bt.dataset.reg) { entra(bt.dataset.reg, e.detail === 0); return; }
    if (bt.dataset.polo) { entraPolo(bt.dataset.polo, e.detail === 0); return; }
    const ir = bt.dataset.ir;
    if (ir === 'estado') sai();
    else if (ir === 'regional') { saiMun(false); saiPolo(); }
    else if (ir === 'polo') saiMun();
    else if (ir === 'mun') saiAl();
  });
  function sai() {
    if (!reg) return;
    saiPolo(false);
    nomes2.innerHTML = '';
    selos.innerHTML = '';
    const r = reg;
    reg = null;
    Object.values(grp).forEach(gp => { gp.classList.remove('fora', 'desliga'); gp.style.transform = ''; });
    const tinha = document.activeElement === volta || legPolos.contains(document.activeElement);
    caixa.classList.remove('aberta');
    legendaEstado();
    volta.hidden = true;
    voa(TODO);
    const m = M.muns.find(x => x.reg === r && x.slug);
    if (tinha && m) { roda(m.cod); el[m.cod].focus({ preventScroll: true }); }
  }
  const sobe = () => (alf ? saiAl() : mun ? saiMun() : pol ? saiPolo() : sai());
  volta.addEventListener('click', sobe);
  // ZOOM LIVRE: com o mapa aproximado, o primeiro Esc enquadra de novo; o seguinte sobe um nível, como antes
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    if (Z) { e.preventDefault(); enquadraZ(); } else if (reg) sobe();
  });
  if (window.ResizeObserver) new ResizeObserver(() => {
    if (Z && Math.abs(caixa.clientWidth - Z.wc) > 1) fimZ();  // largura mudou de verdade: volta ao enquadramento do nível
    if (reg && !anima && !Z) { nivelVb = enquadra(); svg.setAttribute('viewBox', nivelVb.join(' ')); poeNomes(); poeSelos(); }
  }).observe(caixa);

  // ===================================== ZOOM LIVRE (protótipo · tema 2) =====================================
  // O viewBox continua sendo a única fonte da verdade. voa() anima até o enquadramento do nível (nivelVb); o zoom livre só
  // mexe no viewBox DENTRO desse enquadramento (Z.base = nivelVb "alargado" até a caixa inteira, para o mapa poder crescer
  // para os lados). Qualquer clique de navegação chama voa(), que parte do viewBox atual (aproximado ou não) e, ao chegar,
  // desliga o zoom (fimZ). Entradas: Ctrl/⌘ + roda (e pinça do trackpad), pinça de dois dedos, arrastar, botões + − ⤢,
  // teclas + − 0 e Esc. Sem Ctrl a roda rola a página; no celular um dedo rola a página e dois dedos mexem no mapa.
  const ZPPU = 26, ZFATOR = 1.6;                           // máximo de px de tela por unidade do mapa; passo dos botões
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || '');
  const ehToque = matchMedia('(pointer:coarse)').matches;
  const fmt1 = n => n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  let alvoZ = null, rafZ = 0, tRot = 0, arrastou = 0, dr = null, tp = null;
  const uPorPx = () => { const r = svg.getBoundingClientRect(), v = vb(); return Math.max(v[2] / r.width, v[3] / r.height); };

  const nomesZ = document.createElementNS(NS, 'g');          // nomes (e NAE) que aparecem conforme o zoom
  nomesZ.setAttribute('class', 'mt-nomesz');
  nomesZ.setAttribute('aria-hidden', 'true');
  const previa = document.createElementNS(NS, 'g');          // prévia das redes dos municípios que ficaram grandes na tela
  previa.setAttribute('class', 'mt-previa');
  previa.setAttribute('aria-hidden', 'true');
  svg.insertBefore(previa, g);                               // depois do contorno das regionais, antes dos nomes
  svg.append(nomesZ);

  const ic = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  const ctl = document.createElement('div');
  ctl.className = 'mt-zoom';
  ctl.setAttribute('role', 'group');
  ctl.setAttribute('aria-label', 'Zoom do mapa');
  ctl.innerHTML =
    `<button type="button" data-z="mais" aria-label="Aproximar o mapa" title="Aproximar (+ ou ${mac ? '⌘' : 'Ctrl'} + rolagem)">${ic('M12 5v14M5 12h14')}</button>` +
    `<output class="mt-zn" hidden>×1,0</output>` +
    `<button type="button" data-z="menos" aria-label="Afastar o mapa" title="Afastar (−)" disabled>${ic('M5 12h14')}</button>` +
    `<button type="button" data-z="fit" aria-label="Enquadrar o mapa" title="Enquadrar (0 ou Esc)" hidden>${ic('M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5')}</button>`;
  caixa.append(ctl);
  const dicaZ = document.createElement('div');
  dicaZ.className = 'mt-zdica';
  dicaZ.setAttribute('role', 'status');
  caixa.append(dicaZ);
  let tDica = 0;
  function dicaZoom() {                                      // "use Ctrl + rolagem": só aparece quando a pessoa rola por cima do mapa
    dicaZ.innerHTML = ehToque ? 'Use <b>dois dedos</b> para aproximar o mapa' : `Use <kbd>${mac ? '⌘' : 'Ctrl'}</kbd> + rolagem para dar zoom`;
    dicaZ.classList.add('on');
    clearTimeout(tDica);
    tDica = setTimeout(() => dicaZ.classList.remove('on'), 1700);
  }

  const widen = (B, wc, hs) => { const s = Math.min(wc / B[2], hs / B[3]), w = wc / s, h = hs / s; return [B[0] + B[2] / 2 - w / 2, B[1] + B[3] / 2 - h / 2, w, h]; };
  function ligaZ() {                                         // zoom livre ligado: o mapa passa a usar a largura toda da caixa
    if (Z) return true;
    if (anima) return false;
    const hs = svg.getBoundingClientRect().height, wc = caixa.clientWidth;
    if (!wc || !hs) return false;
    svg.style.width = '100%'; svg.style.height = hs + 'px';
    Z = { base: widen(vb(), wc, hs), wc, hs };
    caixa.classList.add('zoomando');
    if (!reg) realca(null);                                  // o destaque da regional sob o mouse não vale com o mapa aproximado
    nomes2.innerHTML = ''; dica.style.display = 'none';
    alvoZ = Z.base.slice();
    aplica(alvoZ);
    return true;
  }
  function fimZ() {                                          // volta ao enquadramento do nível (visualmente igual ao zoom 1×)
    if (!Z) return;
    cancelAnimationFrame(rafZ); rafZ = 0; clearTimeout(tRot);
    Z = null; alvoZ = null; dr = null; tp = null;
    caixa.classList.remove('zoomando', 'zoom-longe', 'arrastando', 'mexe');
    svg.style.width = svg.style.height = '';
    svg.setAttribute('viewBox', nivelVb.map(n => +n.toFixed(3)).join(' '));
    nomesZ.innerHTML = ''; previa.innerHTML = '';
    ctl.querySelector('.mt-zn').hidden = ctl.querySelector('[data-z=fit]').hidden = true;
    ctl.querySelector('[data-z=menos]').disabled = true;
    escala(); poeCartoes();
    if (!anima) { poeNomes(); poeSelos(); }
  }
  function zLimpa() {                                        // chamado por voa(): uma animação de nível não convive com nomes/prévias do zoom
    clearTimeout(tRot); cancelAnimationFrame(rafZ); rafZ = 0;
    nomesZ.innerHTML = ''; previa.innerHTML = '';
  }
  function aplica(v) { svg.setAttribute('viewBox', v.map(n => +n.toFixed(3)).join(' ')); sync(); }
  function sync() {                                          // tudo o que depende do enquadramento atual
    const r = svg.getBoundingClientRect(), v = vb();
    if (!r.width || !Z) return;
    const u = uPorPx().toFixed(4), z = Z.base[2] / v[2];
    g.style.setProperty('--k', u); nomesZ.style.setProperty('--k', u);
    caixa.classList.toggle('zoom-longe', z > 1.8);
    const zn = ctl.querySelector('.mt-zn');
    zn.hidden = ctl.querySelector('[data-z=fit]').hidden = z < 1.02;
    zn.textContent = '×' + fmt1(z);
    ctl.querySelector('[data-z=menos]').disabled = z < 1.02;
    poeCartoes(); moveSelos();
    clearTimeout(tRot);
    caixa.classList.add('mexe');                             // enquanto mexe, a prévia das redes (pesada de desenhar) fica escondida
    tRot = setTimeout(() => {
      caixa.classList.remove('mexe');
      if (Z && !anima && !mun) { nomesDoZoom(); tRot = setTimeout(() => { if (Z && !anima && !mun) previaDoZoom(); }, 60); }   // nomes primeiro, prévia no quadro seguinte (tarefas curtas)
    }, 110);
  }
  function moveSelos() {                                     // os selos de NAE dos polos acompanham o mapa
    if (!reg || pol || anima || !selos.children.length) return;
    const ctm = svg.getScreenCTM(), cx = caixa.getBoundingClientRect();
    psReg.forEach(p => {
      const sp = selos.querySelector(`[data-polo="${CSS.escape(p.polo)}"]`);
      if (!sp) return;
      const mx = p.ms.reduce((s, m) => s + m.c[0], 0) / p.ms.length, my = p.ms.reduce((s, m) => s + m.c[1], 0) / p.ms.length;
      const m = p.ms.reduce((a, b) => Math.hypot(b.c[0] - mx, b.c[1] - my) < Math.hypot(a.c[0] - mx, a.c[1] - my) ? b : a);
      const pt = svg.createSVGPoint();
      [pt.x, pt.y] = soma(m.c, desl[p.polo]);
      const s = pt.matrixTransform(ctm);
      sp.style.left = (s.x - cx.left).toFixed(0) + 'px'; sp.style.top = (s.y - cx.top).toFixed(0) + 'px';
    });
  }
  function limita(v) {                                       // nunca menos zoom que o nível, nunca mais que ZPPU; arrastar não sai do enquadramento
    const [bx, by, bw, bh] = Z.base, asp = bh / bw;
    const w = Math.min(bw, Math.max(Z.wc / ZPPU, v[2])), h = w * asp, s = .12 * w * (1 - w / bw);
    return [Math.min(Math.max(v[0], bx - s), bx + bw - w + s), Math.min(Math.max(v[1], by - s * asp), by + bh - h + s * asp), w, h];
  }
  function terminouZ() { if (Z && vb()[2] >= Z.base[2] * .995 && (!alvoZ || alvoZ[2] >= Z.base[2] * .995)) fimZ(); }
  function vai(n, suave) {                                   // vai ao viewBox n: direto (arrastar, pinça) ou com suavização (roda, botões)
    alvoZ = n;
    if (!suave || calmo()) { cancelAnimationFrame(rafZ); rafZ = 0; aplica(n); return; }
    if (rafZ) return;
    let t0 = performance.now();
    const passo = t => {
      const a = 1 - Math.exp(-Math.min(64, t - t0) / 70); t0 = t;
      const v = vb(), nv = v.map((x, i) => x + (alvoZ[i] - x) * a);
      if (Math.abs(alvoZ[2] - nv[2]) < alvoZ[2] * .0008 && Math.abs(alvoZ[0] - nv[0]) < alvoZ[2] * .0008) { rafZ = 0; aplica(alvoZ); terminouZ(); return; }
      aplica(nv);
      rafZ = requestAnimationFrame(passo);
    };
    rafZ = requestAnimationFrame(passo);
  }
  function zoomaF(f, px, py, suave) {                        // multiplica o zoom por f mantendo o ponto (px,py) da tela no mesmo lugar
    if (anima || !ligaZ()) return;
    const r = svg.getBoundingClientRect(), v = alvoZ || vb(), asp = Z.base[3] / Z.base[2];
    const fx = (px - r.left) / r.width, fy = (py - r.top) / r.height, w = v[2] / f;
    vai(limita([v[0] + fx * v[2] - fx * w, v[1] + fy * v[3] - fy * w * asp, w, w * asp]), suave);
    if (!suave) terminouZ();
  }
  function enquadraZ() {                                     // "enquadrar" / Esc: anima de volta ao enquadramento do nível
    if (!Z) return;
    cancelAnimationFrame(rafZ); rafZ = 0;
    if (Math.abs(vb()[2] - Z.base[2]) < Z.base[2] * .004) fimZ(); else voa(nivelVb.slice());
  }
  // vai até um município (busca, atalhos): o município ocupa ~55% da menor dimensão do mapa
  function voaPara(cod, folga = .55) {
    const m = porCod[cod];
    if (!m || anima || mun || !doNivel(m) || !ligaZ()) return false;
    const b = (el[cod].getBBox()), [ox, oy] = (reg && desl[m.polo] ? desl[m.polo] : [0, 0]).map((q, i) => q + (pol && mdesl[cod] ? mdesl[cod][i] : 0));
    const asp = Z.base[3] / Z.base[2], w = Math.max(b.width / folga, b.height / folga / asp), cx = b.x + b.width / 2 + ox, cy = b.y + b.height / 2 + oy;
    vai(limita([cx - w / 2, cy - w * asp / 2, w, w * asp]), true);
    return true;
  }

  ctl.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    const r = svg.getBoundingClientRect(), z = b.dataset.z;
    if (z === 'fit') enquadraZ();
    else zoomaF(z === 'mais' ? ZFATOR : 1 / ZFATOR, r.left + r.width / 2, r.top + r.height / 2, true);
  });
  caixa.addEventListener('wheel', e => {                     // Ctrl/⌘ + roda (e pinça do trackpad, que chega como Ctrl + roda) dá zoom; sem Ctrl a página rola
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1);
      zoomaF(Math.exp(-dy * (Math.abs(dy) >= 50 ? .0022 : .009)), e.clientX, e.clientY, true);
    } else if (!Z && !e.target.closest('.mt-lado')) dicaZoom();
  }, { passive: false });
  caixa.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest('input,textarea')) return;
    const r = svg.getBoundingClientRect();
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomaF(ZFATOR, r.left + r.width / 2, r.top + r.height / 2, true); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomaF(1 / ZFATOR, r.left + r.width / 2, r.top + r.height / 2, true); }
    else if (e.key === '0' && Z) { e.preventDefault(); enquadraZ(); }
  });

  // arrastar com o mouse (só com o mapa aproximado; passou de 5 px é arrasto e o clique seguinte é ignorado)
  svg.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !Z || anima) return;
    dr = { id: e.pointerId, x: e.clientX, y: e.clientY, v: alvoZ || vb(), on: false };
  });
  svg.addEventListener('pointermove', e => {
    if (!dr || e.pointerId !== dr.id) return;
    const dx = e.clientX - dr.x, dy = e.clientY - dr.y;
    if (!dr.on) {
      if (Math.hypot(dx, dy) < 5) return;
      dr.on = true; svg.setPointerCapture(e.pointerId); caixa.classList.add('arrastando'); dica.style.display = 'none';
    }
    const r = svg.getBoundingClientRect(), v = dr.v;
    vai(limita([v[0] - dx * v[2] / r.width, v[1] - dy * v[3] / r.height, v[2], v[3]]), false);
  });
  const fimArrasto = e => {
    if (!dr || e.pointerId !== dr.id) return;
    if (dr.on) { arrastou = performance.now(); try { svg.releasePointerCapture(e.pointerId); } catch (_) {} caixa.classList.remove('arrastando'); }
    dr = null;
  };
  svg.addEventListener('pointerup', fimArrasto);
  svg.addEventListener('pointercancel', fimArrasto);
  svg.addEventListener('click', e => { if (performance.now() - arrastou < 350) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);

  // celular: um dedo rola a página (touch-action: pan-x pan-y); dois dedos fazem pinça + arrastar; com o mapa aproximado um dedo arrasta
  const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const meio = t => [(t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2];
  svg.addEventListener('touchstart', e => {
    tp = null;
    if (anima) return;
    if (e.touches.length === 2) {
      if (!ligaZ()) return;
      cancelAnimationFrame(rafZ); rafZ = 0;
      tp = { pinca: true, d: dist(e.touches), c: meio(e.touches), v: alvoZ || vb() };
    } else if (e.touches.length === 1 && Z) tp = { pinca: false, moveu: false, c: [e.touches[0].clientX, e.touches[0].clientY], v: alvoZ || vb() };
  }, { passive: true });
  svg.addEventListener('touchmove', e => {
    if (!tp) { if (!Z && e.touches.length === 1) dicaZoom(); return; }
    const r = svg.getBoundingClientRect(), v = tp.v, asp = Z.base[3] / Z.base[2];
    if (tp.pinca && e.touches.length >= 2) {
      if (e.cancelable) e.preventDefault();
      const f = dist(e.touches) / tp.d, c = meio(e.touches), w = v[2] / f;
      const fx0 = (tp.c[0] - r.left) / r.width, fy0 = (tp.c[1] - r.top) / r.height, fx = (c[0] - r.left) / r.width, fy = (c[1] - r.top) / r.height;
      vai(limita([v[0] + fx0 * v[2] - fx * w, v[1] + fy0 * v[3] - fy * w * asp, w, w * asp]), false);
    } else if (!tp.pinca && e.touches.length === 1) {
      if (e.cancelable) e.preventDefault();
      const t = e.touches[0], dx = t.clientX - tp.c[0], dy = t.clientY - tp.c[1];
      if (Math.hypot(dx, dy) > 6) tp.moveu = true;
      vai(limita([v[0] - dx * v[2] / r.width, v[1] - dy * v[3] / r.height, v[2], v[3]]), false);
    }
  }, { passive: false });
  const fimToque = e => {
    if (e.touches.length === 0) { if (tp && tp.moveu !== false) arrastou = performance.now(); tp = null; terminouZ(); }
    else if (e.touches.length === 1 && tp && tp.pinca) tp = { pinca: false, moveu: true, c: [e.touches[0].clientX, e.touches[0].clientY], v: alvoZ || vb() };   // soltou um dedo: o outro segue arrastando
  };
  svg.addEventListener('touchend', fimToque);
  svg.addEventListener('touchcancel', fimToque);

  // nomes e NAE conforme o zoom: só os municípios que já têm tamanho para isso na tela, os maiores primeiro; os que se cruzam somem
  const bbMun = {};
  const bboxMun = cod => bbMun[cod] || (bbMun[cod] = el[cod].getBBox());
  const offDe = m => { const a = reg && desl[m.polo] || [0, 0], b = pol && mdesl[m.cod] || [0, 0]; return [a[0] + b[0], a[1] + b[1]]; };
  const doNivel = m => (!reg || m.reg === reg) && (!pol || m.polo === pol);
  const sobrepoe = (q, o) => q.x < o.x + o.width + 2 && q.x + q.width + 2 > o.x && q.y < o.y + o.height && q.y + q.height > o.y;
  function nomesDoZoom() {
    nomesZ.innerHTML = '';
    const r = svg.getBoundingClientRect(), v = vb(), ppu = r.width / v[2], marg = 24 / ppu, cand = [];
    M.muns.filter(doNivel).forEach(m => {
      const b = bboxMun(m.cod), [ox, oy] = offDe(m), x = m.c[0] + ox, y = m.c[1] + oy;
      if (x < v[0] - marg || x > v[0] + v[2] + marg || y < v[1] - marg || y > v[1] + v[3] + marg) return;
      const tam = Math.max(b.width, b.height) * ppu;
      if (tam >= 40) cand.push({ m, x, y, tam, larg: b.width * ppu });
    });
    cand.sort((a, b) => (prio({ dataset: { cod: b.m.cod } }) - prio({ dataset: { cod: a.m.cod } })) || b.tam - a.tam);
    const ts = cand.slice(0, 80).map(c => {
      const dois = c.tam >= 70, t = document.createElementNS(NS, 'text'), a = document.createElementNS(NS, 'tspan');
      t.setAttribute('class', 'mt-rot' + (c.m.slug ? '' : ' sem'));
      t.setAttribute('x', c.x); t.setAttribute('y', c.y);
      a.setAttribute('x', c.x); if (dois) a.setAttribute('dy', '-.6em');
      a.textContent = c.m.nome; t.append(a);
      if (dois) {
        const n = document.createElementNS(NS, 'tspan');
        n.setAttribute('x', c.x); n.setAttribute('dy', '1.35em'); n.setAttribute('class', 'mz-n');
        n.textContent = c.m.nae ? `${c.m.nae.toLocaleString('pt-BR')} NAE` : 'Sem NAE';
        t.append(n);
      }
      nomesZ.append(t);
      return { t, c };
    });
    const qs = ts.map(o => o.t.getBBox()), ok = [];           // medir tudo de uma vez (um só layout), depois decidir quem fica
    ts.forEach((o, i) => {
      const q = qs[i];
      if (q.width * ppu > Math.max(o.c.larg * 1.6, 96) || ok.some(r => sobrepoe(q, r))) o.t.remove(); else ok.push(q);
    });
  }
  // prévia das redes: município que ocupa bastante da tela mostra, dentro dele, a rede de cada alimentador (mesmos dados do município aberto)
  function previaDoZoom() {
    const r = svg.getBoundingClientRect(), v = vb(), ppu = r.width / v[2], cx = v[0] + v[2] / 2, cy = v[1] + v[3] / 2;
    const alvos = M.muns.filter(m => {
      if (!m.slug || !doNivel(m)) return false;
      const b = bboxMun(m.cod), [ox, oy] = offDe(m);
      return Math.max(b.width, b.height) * ppu >= 180 && b.x + ox < v[0] + v[2] && b.x + ox + b.width > v[0] && b.y + oy < v[1] + v[3] && b.y + oy + b.height > v[1];
    }).sort((a, b) => Math.hypot(a.c[0] - cx, a.c[1] - cy) - Math.hypot(b.c[0] - cx, b.c[1] - cy)).slice(0, 4);
    const cods = new Set(alvos.map(m => m.cod));
    [...previa.children].forEach(c => { if (!cods.has(c.dataset.cod)) c.remove(); });
    alvos.forEach(m => {
      if (previa.querySelector(`[data-cod="${m.cod}"]`)) return;
      const gm = document.createElementNS(NS, 'g'), [ox, oy] = offDe(m);
      gm.dataset.cod = m.cod;
      gm.style.transform = tr([ox, oy]);
      gm.setAttribute('clip-path', `url(#mt-pv-${m.cod})`);
      gm.innerHTML = `<defs><clipPath id="mt-pv-${m.cod}"><path d="${m.d}"/></clipPath></defs>`;
      previa.append(gm);
      m.als.slice().sort((a, b) => b.m - a.m).slice(0, 16).forEach(a => rede(a.cod, m.polo).then(rd => {   // prévia: os 16 maiores alimentadores (Palmas tem 46)
        if (!rd || !gm.isConnected) return;
        ['h', 'l'].forEach(cl => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', rd.d); p.setAttribute('class', cl); gm.append(p); });
      }));
    });
  }
  window.ARGOSMapa = {                                       // ganchos para a busca e para o mini-mapa
    voaPara, enquadra: enquadraZ, vista: () => vb(), ativo: () => !!Z, zoom: () => Z ? Z.base[2] / vb()[2] : 1,
    centraEm(ux, uy) { if (!ligaZ()) return; const v = alvoZ || vb(); vai(limita([ux - v[2] / 2, uy - v[3] / 2, v[2], v[3]]), true); },
    aoMudar(fn) { new MutationObserver(fn).observe(svg, { attributes: true, attributeFilter: ['viewBox'] }); },
  };
  // ================================== fim do ZOOM LIVRE ==================================

  // no estado inteiro, escolher um município abre a regional dele; com a regional aberta, abre o polo dele; com o polo
  // aberto, abre o município (a rede dos alimentadores); com o município aberto, abre a página dele
  const abre = cod => { const m = porCod[cod]; if (m && m.slug) location.href = `municipios/${m.slug}/`; };
  const escolhe = (cod, teclado) => {
    const m = porCod[cod];
    if (!reg && m.reg) entra(m.reg, teclado, cod);
    else if (reg && !pol && m.reg === reg && m.polo) entraPolo(m.polo, teclado, cod);
    else if (pol && !mun && m.polo === pol && m.slug) entraMun(cod, teclado);
    else if (!reg || (mun ? cod === mun : pol ? m.polo === pol : m.reg === reg)) abre(cod);
  };
  svg.addEventListener('click', e => {
    const r = e.target.closest('.mt-redes path[data-al]');
    if (r) { if (alf === r.dataset.al) abreAl(r.dataset.al); else focaAl(r.dataset.al); return; }
    const p = e.target.closest('.mun');
    if (p) escolhe(p.dataset.cod);
  });

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
      if (!m.slug || m.cod === p.dataset.cod || mun || (reg && m.reg !== reg) || (pol && m.polo !== pol)) return;
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

  // município: o campo #busca abre a lista suspensa (#mun-lista) com todos os municípios, filtrada pelo que se digita;
  // os achados acendem no mapa. Setas andam na lista, Enter abre o município (ou o único achado), Esc fecha.
  const busca = document.getElementById('busca'), lista = document.getElementById('mun-lista');
  if (busca && lista) {
    const todos = M.muns.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    let ops = [], ativo = -1;
    const acende = cod => { Object.values(el).forEach(p => p.classList.remove('acende')); if (cod) el[cod].classList.add('acende'); };
    const marca = i => {
      ops.forEach((o, k) => o.classList.toggle('marcado', k === i));
      ativo = i;
      if (i >= 0) { busca.setAttribute('aria-activedescendant', ops[i].id); ops[i].scrollIntoView({ block: 'nearest' }); acende(ops[i].dataset.cod); }
      else { busca.removeAttribute('aria-activedescendant'); acende(null); }
    };
    const abreLista = sim => {
      lista.hidden = !sim;
      busca.setAttribute('aria-expanded', String(sim));
      if (!sim) marca(-1);
    };
    function filtra() {
      const q = semAcento(busca.value.trim());
      const ms = todos.filter(m => !q || m.busca.includes(q));
      achou.forEach(c => el[c].classList.remove('achou'));
      achou = new Set(q ? ms.map(m => m.cod) : []);
      achou.forEach(c => el[c].classList.add('achou'));
      rotulos();
      lista.innerHTML = ms.map((m, i) => m.slug
        ? `<a class="mun-op" role="option" id="mun-op-${i}" data-cod="${esc(m.cod)}" href="municipios/${esc(m.slug)}/" tabindex="-1"><b>${esc(m.nome)}</b><span>${nAls(m)} · ${km(kmTot(m))}</span></a>`
        : `<div class="mun-op sem" role="option" id="mun-op-${i}" data-cod="${esc(m.cod)}" aria-disabled="true"><b>${esc(m.nome)}</b><span>sem dados ainda</span></div>`).join('')
        || `<p class="vazio">Nenhum município com “${esc(busca.value.trim())}”.</p>`;
      ops = [...lista.querySelectorAll('.mun-op')];
      abreLista(true);
      marca(q && ops.length === 1 ? 0 : -1);
    }
    busca.addEventListener('input', filtra);
    busca.addEventListener('focus', filtra);
    busca.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (lista.hidden) filtra();
        if (!ops.length) return;
        marca(e.key === 'ArrowDown' ? Math.min(ops.length - 1, ativo + 1) : Math.max(0, ativo - 1));
      } else if (e.key === 'Enter') {
        const o = ops[ativo >= 0 ? ativo : 0];
        if (o && o.href) { e.preventDefault(); location.href = o.href; }
      } else if (e.key === 'Escape' && !lista.hidden) { e.preventDefault(); abreLista(false); }
    });
    lista.addEventListener('mousedown', e => e.preventDefault());   // clicar na lista não tira o foco do campo antes do clique
    lista.addEventListener('mouseover', e => { const o = e.target.closest('.mun-op'); if (o) marca(ops.indexOf(o)); });
    document.addEventListener('pointerdown', e => { if (!lista.hidden && !busca.parentElement.contains(e.target)) abreLista(false); });
    busca.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== busca) abreLista(false); }, 0));
  }
})();
