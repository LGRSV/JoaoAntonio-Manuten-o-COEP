// [RODADA 2 · tema 4] Cópia da proposta da outra sessão (proto/original/lupa-painel.orig.js) com 2 acréscimos, marcados com "R2-a" e "R2-b".
//   R2-a: com texto no campo, a lista suspensa mostra o resultado (ativos e trechos): a lista de trechos do painel e os achados
//         soltos sobre o mapa saem (era a mesma lista em dois lugares). Enter abre o 1º resultado; ↓ entra na lista.
//   R2-b: nota que fecha a conta da NAE (a soma das classes não bate com o total do alimentador).
// Painel do alimentador: a lupa do ARGOS (como na página inicial) no lugar da busca solta, dos botões T1 T2 T3 e do "Menu"
// das camadas em cima do mapa. A barra fica: olho do ARGOS · campo "Buscar trecho, ativo ou poste" · botão Filtros.
// - Olho (ou o campo vazio com foco): lista suspensa com as classes T1, T2 e T3 (trechos, km e NAE no período). Tocar na
//   classe abre os trechos dela (maior NAE primeiro); tocar num trecho escolhe ele no mapa. O olho de cada classe mostra ou
//   esconde a classe no mapa. Embaixo, as camadas do Menu (Faixa, Inspeção, Insp→manut, Manutenção).
//   Classes e camadas usam os próprios botões de alimentador.js e extras.js (que ficam escondidos): a lógica é a mesma.
// - Filtros: menu suspenso com o município e os meses do NAE (os mesmos controles de extras.js e alimentador.js, só mudam de
//   lugar); o número no botão diz quantos filtros estão ligados.
// - Digitar no campo continua como antes (filtra a lista e acha ativo); a lista suspensa fecha.
// - Tela cheia: a barra vai para a gaveta (telacheia.js) e os botões T1 T2 T3 / Menu voltam ao mapa (é por eles que a gaveta abre).
(function () {
  const barra = document.querySelector('.barra-busca'), linha = barra && barra.querySelector('.barra-linha'), q = document.getElementById('busca');
  if (!barra || !linha || !q || barra.querySelector('.lp-lupa')) return;   // sem a barra (mapa não carregou): fica como antes
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pasta = ((document.currentScript && document.currentScript.src) || '').replace(/[^/]*$/, '');   // a pasta assets/
  const D = window.D || { trechos: [] };
  const mil = n => Number(n).toLocaleString('pt-BR');
  const km = m => m < 1000 ? Math.round(m) + ' m' : (m / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' km';
  const classe = n => n.split('-')[0];
  const CLS = ['T1', 'T2', 'T3'];
  const btCls = c => document.querySelector(`#classes button[data-c="${c}"]`);
  const visivel = c => (window.__visivel || {})[c] !== false;

  // ---------- barra: olho · campo · Filtros ----------
  linha.classList.add('lp-linha');
  q.placeholder = 'Trecho, ativo ou poste';              // cabe no celular ao lado do olho e do Filtros
  const lupa = document.createElement('button');
  lupa.type = 'button';
  lupa.className = 'lp-lupa';
  lupa.setAttribute('aria-label', 'Classes T1, T2, T3 e camadas do mapa');
  lupa.setAttribute('aria-expanded', 'false');
  lupa.setAttribute('aria-controls', 'lp-drop');
  lupa.innerHTML = `<img src="${esc(pasta)}argos.png" alt="" width="34" height="23">`;
  linha.prepend(lupa);

  const filtros = linha.querySelector('.filtros'), ctrl = document.getElementById('ctrl');
  const temFiltro = !!((filtros && filtros.querySelector('select')) || (ctrl && !ctrl.hidden));
  const bf = document.createElement('button');
  bf.type = 'button';
  bf.className = 'lp-fbt';
  bf.setAttribute('aria-expanded', 'false');
  bf.setAttribute('aria-controls', 'lp-fdrop');
  bf.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5h17l-6.5 8v5.5l-4 2V13z"/></svg><span class="lp-ftxt">Filtros</span><b class="lp-fn" hidden></b>';
  bf.hidden = !temFiltro;
  q.after(bf);

  const drop = document.createElement('div');
  drop.className = 'lp-drop';
  drop.id = 'lp-drop';
  drop.hidden = true;
  const fdrop = document.createElement('div');
  fdrop.className = 'lp-fdrop';
  fdrop.id = 'lp-fdrop';
  fdrop.setAttribute('role', 'group');
  fdrop.setAttribute('aria-label', 'Filtros: município e meses do NAE');
  fdrop.hidden = true;
  fdrop.innerHTML = '<p class="lp-t">Filtros</p>';
  if (filtros) fdrop.append(filtros);                    // município (extras.js): o ouvinte vai junto com o elemento
  if (ctrl) fdrop.append(ctrl);                          // meses do NAE e "Contar individuais" (alimentador.js)
  linha.after(drop, fdrop);

  // ---------- Filtros: quantos estão ligados (município escolhido, meses diferentes de todos) ----------
  const fmun = document.getElementById('f-mun');
  function contaFiltros() {
    const tds = document.querySelector('#mes-lista .mes-tds input');
    const partes = [];
    if (fmun && fmun.value) partes.push(fmun.selectedOptions[0].textContent.replace(/\s*\(.*\)$/, ''));
    if (tds && !tds.checked) partes.push((document.querySelector('#mes .mes-txt') || {}).textContent || 'meses');
    const n = bf.querySelector('.lp-fn');
    n.hidden = !partes.length;
    n.textContent = partes.length;
    bf.title = partes.length ? 'Filtros: ' + partes.join(' · ') : 'Filtros: todos os municípios e meses';
    bf.setAttribute('aria-label', partes.length ? `Filtros, ${partes.length} ligado${partes.length > 1 ? 's' : ''}: ${partes.join(', ')}` : 'Filtros: nenhum ligado');
  }
  fdrop.addEventListener('change', () => setTimeout(contaFiltros, 0));   // depois do ouvinte de alimentador.js
  const mesTxt = document.querySelector('#mes .mes-txt');
  if (mesTxt) new MutationObserver(contaFiltros).observe(mesTxt, { childList: true, characterData: true, subtree: true });
  contaFiltros();

  // ---------- lista suspensa do olho: classes (com os trechos) e camadas ----------
  let aberta = null;                                     // classe aberta na lista (T1, T2, T3) ou null
  const LOTE = 150;                                      // trechos por vez (alimentador grande tem quase 2.000 T3)
  let limite = LOTE;
  // uma passada pela lista do painel: a NAE de cada trecho no período (o número da própria lista) e as linhas escondidas
  function leLista() {
    const nae = {}, escondida = new Set();
    let tem = false;
    document.querySelectorAll('#lista .row').forEach(r => {
      const s = r.querySelector('strong.nae');
      if (s) { tem = true; nae[r.dataset.t] = parseInt(s.textContent, 10) || 0; }
      if (r.hidden) escondida.add(r.dataset.t);
    });
    return { nae: tem ? nae : null, escondida };
  }
  // com a classe à vista, uma linha escondida na lista é filtro de município: o trecho sai daqui também
  const OLHO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="o" d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle class="o" cx="12" cy="12" r="2.8"/><path class="x" d="M4 4l16 16"/></svg>';
  const pill = n => n == null ? '' : `<i class="lp-n${n ? '' : ' zero'}">${mil(n)}<span class="vh"> NAE</span></i>`;
  // R2-a: uma linha de trecho (a mesma na lista da classe e no resultado da busca)
  const linhaTr = (t, nae) => `<button type="button" class="lp-op lp-tr" data-t="${esc(t.nome)}" style="--c:${esc(t.cor)}"><span class="lp-bol" aria-hidden="true"></span>` +
    `<span class="lp-x"><b>${esc(t.nome)}</b><small>${esc(t.inicio)} → ${esc(t.fim.join(' / ').replace('fim de linha · poste ', 'fim '))} · ${km(t.ext)}</small></span>${pill(nae ? nae[t.nome] || 0 : null)}</button>`;
  const buscando = () => !!q.value.trim();
  const achados = () => [...document.querySelectorAll('.barra-busca>.ativo-hit>button')];   // ativos achados por extras.js (código de chave, trafo…)
  function desenhaBusca() {
    const { nae } = leLista(), porNome = Object.fromEntries(D.trechos.map(t => [t.nome, t]));
    const trs = [...document.querySelectorAll('#lista .row')].filter(r => !r.hidden).map(r => porNome[r.dataset.t]).filter(Boolean);   // a lista da página já filtrou por texto, classe e município
    const ats = achados();
    let html = '';
    if (ats.length) html += `<p class="lp-t">Ativos · ${mil(ats.length)}</p>` + ats.map((b, i) => {
      const sp = b.querySelectorAll('span');
      return `<button type="button" class="lp-op lp-at" data-i="${i}"><span class="lp-pin" aria-hidden="true"></span><span class="lp-x"><b>${esc(b.querySelector('b').textContent)}</b>` +
        `<small>${esc(sp[0] ? sp[0].textContent : '')}</small></span><span class="lp-ir">${esc((sp[1] ? sp[1].textContent : 'Ver no mapa').replace(/ →$/, ''))}</span></button>`;
    }).join('');
    if (trs.length) html += `<p class="lp-t">Trechos · ${mil(trs.length)}${nae ? ' · maior NAE primeiro' : ''}</p>` + trs.slice(0, limite).map(t => linhaTr(t, nae)).join('');
    if (trs.length > limite) html += `<button type="button" class="lp-op lp-mais"><span class="lp-x"><b>Mostrar mais ${mil(Math.min(LOTE, trs.length - limite))}</b>` +
      `<small>faltam ${mil(trs.length - limite)}; ou escreva mais do nome</small></span></button>`;
    if (!html) html = '<p class="lp-vazio">Nada encontrado neste alimentador. Escreva o nome do trecho (T3-AK), o código de uma chave ou transformador, ou o número de um poste.</p>';
    drop.innerHTML = html;
  }
  function desenha() {
    if (buscando()) return desenhaBusca();
    const { nae, escondida } = leLista(), cor = c => { const b = btCls(c); return b ? b.style.getPropertyValue('--c') : ''; };
    const doCls = c => D.trechos.filter(t => classe(t.nome) === c && (!visivel(c) || !escondida.has(t.nome)));
    let html = '';
    if (!aberta) {
      html += '<p class="lp-t">Classes</p>' + CLS.filter(btCls).map(c => {
        const ts = doCls(c), m = ts.reduce((s, t) => s + t.ext, 0), n = nae ? ts.reduce((s, t) => s + (nae[t.nome] || 0), 0) : null, v = visivel(c);
        return `<div class="lp-cls${v ? '' : ' off'}" style="--c:${esc(cor(c))}">` +
          `<button type="button" class="lp-op lp-abre" data-c="${c}"><span class="lp-bar" aria-hidden="true"></span>` +
          `<span class="lp-x"><b>${c}</b><small>${mil(ts.length)} trecho${ts.length === 1 ? '' : 's'} · ${km(m)}${v ? '' : ' · escondida no mapa'}</small></span>${pill(n)}` +
          '<span class="lp-seta" aria-hidden="true">›</span></button>' +
          `<button type="button" class="lp-olho" data-c="${c}" aria-pressed="${v}" title="${v ? 'Esconder' : 'Mostrar'} ${c} no mapa" aria-label="Mostrar ${c} no mapa">${OLHO}</button></div>`;
      }).join('');
      // R2-b: a soma das classes não fecha com o total do alimentador: entram nas classes as NAE de outros alimentadores cujo ativo hoje está aqui
      // (doExt) e ficam de fora as que a Crítica não consegue pôr num trecho (sem trecho). Dito em uma linha, para o número não parecer erro.
      if (nae && typeof doMes === 'function') {
        const de = doExt().length, sem = doMes().filter(o => !o.trecho).length, partes = [];
        if (de) partes.push(de === 1 ? 'entra 1 ocorrência de outro alimentador que hoje está em trecho daqui' : `entram ${de} ocorrências de outros alimentadores que hoje estão em trechos daqui`);
        if (sem) partes.push(sem === 1 ? 'fica de fora 1 sem trecho' : `ficam de fora ${sem} sem trecho`);
        if (partes.length) html += `<p class="lp-nota">A soma das classes não é o NAE do alimentador (o selo no alto): ${partes.join('; ')}.</p>`;   // sem repetir o número do selo
      }
      const cams = [...document.querySelectorAll('#ctl-camadas .ctl-card > button:not(.tc-painel-m)')];
      if (cams.length) html += '<p class="lp-t">Camadas</p>' + cams.map((b, i) =>
        `<button type="button" class="lp-op lp-cam" data-i="${i}" aria-pressed="${b.getAttribute('aria-pressed') === 'true'}"><span class="lp-chk" aria-hidden="true"></span>` +
        `<span class="lp-x"><b>${esc(b.textContent.trim())}</b></span></button>`).join('');
    } else {
      const ts = doCls(aberta).sort((a, b) => nae ? (nae[b.nome] || 0) - (nae[a.nome] || 0) : 0);
      html += `<button type="button" class="lp-op lp-volta"><span class="lp-seta" aria-hidden="true">‹</span><span class="lp-x"><b>Classes</b></span></button>` +
        `<p class="lp-t">${aberta} · ${mil(ts.length)} trecho${ts.length === 1 ? '' : 's'}${nae ? ' · maior NAE primeiro' : ''}</p>` +
        ts.slice(0, limite).map(t => linhaTr(t, nae)).join('') ||
        '<p class="lp-vazio">Nenhum trecho com o filtro de município.</p>';
      if (ts.length > limite) html += `<button type="button" class="lp-op lp-mais"><span class="lp-x"><b>Mostrar mais ${mil(Math.min(LOTE, ts.length - limite))}</b>` +
        `<small>faltam ${mil(ts.length - limite)}; ou digite o nome do trecho no campo</small></span></button>`;
    }
    drop.innerHTML = html;
  }
  const abreDrop = (sim, foco) => {
    if (sim === !drop.hidden) return;
    if (sim) { abreF(false); aberta = null; desenha(); }
    drop.hidden = !sim;
    lupa.setAttribute('aria-expanded', String(sim));
    if (sim && foco) { const b = drop.querySelector('.lp-op'); if (b) b.focus(); }
  };
  const abreF = sim => {
    if (sim === !fdrop.hidden) return;
    if (sim) abreDrop(false);
    fdrop.hidden = !sim;
    bf.setAttribute('aria-expanded', String(sim));
  };
  lupa.addEventListener('click', e => abreDrop(drop.hidden, e.detail === 0));   // teclado: o foco entra na lista
  bf.addEventListener('click', () => abreF(fdrop.hidden));
  q.addEventListener('focus', () => { if (!q.value.trim()) abreDrop(true); });
  q.addEventListener('input', () => {                    // R2-a: com texto, a lista suspensa é o resultado da busca (limite volta ao 1º lote)
    limite = LOTE;
    if (document.activeElement !== q) return abreDrop(false);
    if (drop.hidden) abreDrop(true); else { aberta = null; desenha(); drop.scrollTop = 0; }
  });
  const observa = achados => { const h = document.querySelector('.barra-busca>.ativo-hit'); if (h) new MutationObserver(achados).observe(h, { childList: true }); };
  observa(() => { if (!drop.hidden && buscando()) { const y = drop.scrollTop; desenha(); drop.scrollTop = y; } });   // os ativos chegam depois (busca no índice)
  q.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' && !drop.hidden) { const b = drop.querySelector('.lp-op'); if (b) { e.preventDefault(); b.focus(); } }
    else if (e.key === 'ArrowDown' && drop.hidden) { abreDrop(true, true); e.preventDefault(); }
    else if (e.key === 'Enter' && buscando() && !drop.hidden) { const b = drop.querySelector('.lp-at, .lp-tr'); if (b) { e.preventDefault(); b.click(); } }
  });
  drop.addEventListener('keydown', e => {                // ↑ ↓ andam na lista; ↑ no 1º volta ao campo
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const bs = [...drop.querySelectorAll('.lp-op, .lp-olho')], i = bs.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    if (e.key === 'ArrowUp' && i === 0) return q.focus();
    (bs[i + (e.key === 'ArrowDown' ? 1 : -1)] || bs[i]).focus();
  });
  drop.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });   // o campo não perde o foco
  drop.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    e.stopPropagation();
    if (b.classList.contains('lp-olho')) { const o = btCls(b.dataset.c); if (o) o.click(); desenha(); drop.querySelector(`.lp-olho[data-c="${b.dataset.c}"]`).focus(); return; }
    if (b.classList.contains('lp-mais')) {
      const y = drop.scrollTop, i = limite;
      limite += LOTE;
      desenha();
      drop.scrollTop = y;
      const n = drop.querySelectorAll('.lp-tr')[i];
      if (n && e.detail === 0) n.focus();
      return;
    }
    if (b.classList.contains('lp-abre')) { aberta = b.dataset.c; limite = LOTE; desenha(); drop.scrollTop = 0; const f = drop.querySelector('.lp-tr, .lp-volta'); if (f && e.detail === 0) f.focus(); return; }
    if (b.classList.contains('lp-volta')) { const era = aberta; aberta = null; desenha(); if (e.detail === 0) drop.querySelector(`.lp-abre[data-c="${era}"]`).focus(); return; }
    if (b.classList.contains('lp-cam')) {
      const o = document.querySelectorAll('#ctl-camadas .ctl-card > button:not(.tc-painel-m)')[+b.dataset.i];
      if (o) o.click();
      desenha();
      const n = drop.querySelector(`.lp-cam[data-i="${b.dataset.i}"]`);
      if (n && e.detail === 0) n.focus();
      return;
    }
    if (b.classList.contains('lp-at')) {                 // R2-a: ativo achado: o botão original (extras.js) escolhe o trecho e põe o marcador
      const o = achados()[+b.dataset.i];
      abreDrop(false);
      if (document.activeElement === q) q.blur();
      if (o) o.click();
      return;
    }
    if (b.classList.contains('lp-tr')) {                 // trecho: liga a classe se estiver escondida e escolhe no mapa
      const nome = b.dataset.t, c = classe(nome);
      if (!visivel(c) && btCls(c)) btCls(c).click();
      abreDrop(false);
      if (document.activeElement === q) q.blur();
      if (window.__sel) window.__sel(nome, true);
    }
  });
  // fecha: Esc (o foco volta ao olho ou ao botão Filtros), clique fora ou o foco saindo da barra
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || e.cancelBubble) return;    // Esc já usado (lista dos meses, menu do mapa): não fecha mais nada
    if (!drop.hidden) { e.stopPropagation(); const f = drop.contains(document.activeElement); abreDrop(false); if (f) lupa.focus(); }
    else if (!fdrop.hidden) { e.stopPropagation(); const f = fdrop.contains(document.activeElement); abreF(false); if (f) bf.focus(); }
  }, true);
  document.addEventListener('pointerdown', e => {
    if (!drop.hidden && !drop.contains(e.target) && !lupa.contains(e.target) && e.target !== q) abreDrop(false);
    if (!fdrop.hidden && !fdrop.contains(e.target) && !bf.contains(e.target)) abreF(false);
  });
  barra.addEventListener('focusout', e => {
    if (!e.relatedTarget) return;
    if (!drop.contains(e.relatedTarget) && e.relatedTarget !== lupa && e.relatedTarget !== q) abreDrop(false);
    if (!fdrop.contains(e.relatedTarget) && e.relatedTarget !== bf) abreF(false);
  });
  // botões T1/T2/T3 do mapa (tela cheia) ou camada ligada por outro lugar: a lista aberta acompanha
  const cls = document.getElementById('classes');
  if (cls) cls.addEventListener('click', () => { if (!drop.hidden) setTimeout(desenha, 0); });

  const s = document.createElement('style');
  s.textContent =
    // fora da tela cheia, T1 T2 T3 e o Menu saem do mapa (estão na lupa); em tela cheia voltam, porque a barra vai para a gaveta
    'body:not(.tela-cheia) .ctl-dir>.ctl-topo{display:none}' +
    '.barra-busca .barra-linha.lp-linha,body.tela-cheia .panel .barra-linha.lp-linha{display:flex;flex-wrap:nowrap;align-items:center;gap:var(--s2)}' +
    '.barra-busca .lp-linha>.busca{flex:1 1 auto;width:auto;min-width:0;min-height:44px}' +
    '@media (min-width:861px){.barra-busca .lp-linha>.busca{min-height:40px}}' +
    '.lp-lupa,.lp-fbt{flex:none;display:inline-flex;align-items:center;justify-content:center;min-height:44px;border:1px solid var(--line);background:var(--paper);color:var(--fg);cursor:pointer;box-shadow:var(--sh1)}' +
    '@media (min-width:861px){.lp-lupa,.lp-fbt{min-height:40px}}' +
    '.lp-lupa{width:48px;padding:0;border-radius:999px}.lp-lupa img{display:block;width:34px;height:auto;pointer-events:none}' +
    ':root[data-theme="light"] .lp-lupa img{filter:invert(1)}' +
    '.lp-fbt{gap:6px;padding:0 var(--s3);border-color:var(--line-forte);border-radius:var(--r2);font:600 var(--t-sm) var(--f-body)}' +
    '.lp-fbt svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linejoin:round}' +
    '.lp-fn{min-width:20px;padding:1px 6px;border-radius:999px;background:var(--accent);color:var(--on-accent);font:700 var(--t-xs)/1.4 var(--f-mono);text-align:center}' +
    '@media (max-width:640px){.lp-ftxt{display:none}.lp-fbt{width:48px;padding:0}}' +
    '.lp-lupa:hover,.lp-fbt:hover{background:var(--hover)}' +
    '.lp-lupa[aria-expanded=true],.lp-fbt[aria-expanded=true]{border-color:var(--accent);color:var(--accent)}' +
    '.lp-lupa:focus-visible,.lp-fbt:focus-visible,.lp-drop button:focus-visible{outline:2px solid var(--accent);outline-offset:1px}' +
    // listas suspensas presas à barra (por cima do mapa, sem empurrar nada)
    '.lp-drop,.lp-fdrop{position:absolute;top:calc(100% + 6px);z-index:1000;max-height:min(70vh,600px);overflow:auto;overscroll-behavior:contain;' +
    'padding:var(--s1);border-radius:var(--r3);background:var(--paper);box-shadow:var(--sh2);border:1px solid var(--line)}' +
    '.lp-drop{left:0;width:min(100%,460px)}.lp-fdrop{right:0;width:min(100%,340px);display:grid;gap:var(--s2);padding:var(--s2) var(--s3) var(--s3)}' +
    '.lp-drop[hidden],.lp-fdrop[hidden]{display:none}' +
    '.lp-t{margin:0;padding:var(--s2) var(--s3) 2px;font:700 var(--t-xs)/1.4 var(--f-body);letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}' +
    '.lp-fdrop .lp-t{padding:0}.lp-fdrop select{width:100%}.lp-fdrop #ctrl{display:grid;gap:var(--s2)}.lp-fdrop .mes,.lp-fdrop #mes{width:100%}' +
    '.lp-fdrop .mes-lista{position:static;width:auto;min-width:0;max-width:none;margin-top:var(--s1);box-shadow:none}' +
    '.lp-op{display:flex;align-items:center;gap:var(--s2);width:100%;min-height:48px;padding:var(--s2) var(--s3);border:0;border-radius:var(--r1);' +
    'background:none;color:var(--fg);font:inherit;text-align:left;cursor:pointer}' +
    '.lp-op:hover{background:var(--hover)}.lp-op:hover b{color:var(--accent)}' +
    '.lp-x{flex:1;min-width:0;display:grid;gap:1px}.lp-x b{font:600 var(--t-base)/1.3 var(--f-mono);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.lp-x small{font-size:var(--t-xs);line-height:1.35;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.lp-n{flex:none;font:700 var(--t-xs)/1.2 var(--f-mono);font-style:normal;padding:2px 7px;border-radius:5px;background:#b8431f;color:#fff;font-variant-numeric:tabular-nums}' +
    '.lp-n.zero{background:none;color:var(--muted);padding-inline:0}' +
    '.lp-seta{flex:none;color:var(--muted);font:400 var(--t-lg)/1 var(--f-body)}' +
    '.lp-cls{display:flex;align-items:stretch;gap:2px}.lp-cls>.lp-abre{flex:1;min-width:0}' +
    '.lp-bar{flex:none;width:6px;align-self:stretch;margin-block:6px;border-radius:3px;background:var(--c)}' +
    '.lp-cls.off .lp-bar{background:none;box-shadow:inset 0 0 0 1.5px var(--c)}.lp-cls.off .lp-x b{color:var(--muted)}' +
    '.lp-olho{flex:none;display:grid;place-items:center;width:48px;border:0;border-radius:var(--r1);background:none;color:var(--fg);cursor:pointer}' +
    '.lp-olho:hover{background:var(--hover)}.lp-olho svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round}' +
    '.lp-olho .x{display:none}.lp-olho[aria-pressed=false]{color:var(--muted)}.lp-olho[aria-pressed=false] .x{display:inline}' +
    '.lp-bol{flex:none;width:10px;height:10px;border-radius:50%;background:var(--c)}' +
    '.lp-chk{flex:none;width:18px;height:18px;border:1.5px solid var(--line-forte);border-radius:4px;display:grid;place-items:center;font:700 12px/1 var(--f-body)}' +
    '.lp-cam[aria-pressed=true] .lp-chk{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}.lp-cam[aria-pressed=true] .lp-chk::before{content:"✓"}' +
    '.lp-cam .lp-x b{font-family:var(--f-body)}' +
    '.lp-volta .lp-x b{font-family:var(--f-body);color:var(--muted)}' +
    '.lp-vazio{margin:0;padding:var(--s3);color:var(--muted);font-size:var(--t-sm)}' +
    '.lp-nota{margin:0;padding:var(--s1) var(--s3) var(--s2);color:var(--muted);font-size:var(--t-xs);line-height:1.45}' +
    '.lp-pin{flex:none;width:10px;height:10px;box-sizing:border-box;border:2px solid var(--accent);border-radius:50% 50% 50% 0;transform:rotate(-45deg);margin:0 1px}' +
    '.lp-ir{flex:none;max-width:44%;text-align:right;font:600 var(--t-xs)/1.3 var(--f-body);color:var(--accent)}' +
    '@media (prefers-reduced-motion:no-preference){.lp-drop:not([hidden]),.lp-fdrop:not([hidden]){animation:lp-entra var(--dur,160ms) ease-out}}' +
    '@keyframes lp-entra{from{opacity:0;transform:translateY(4px)}}';
  document.head.append(s);
})();
