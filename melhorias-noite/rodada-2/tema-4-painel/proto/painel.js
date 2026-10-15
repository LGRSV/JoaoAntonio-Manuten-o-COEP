/* ============================================================================================
   PROTÓTIPO CONSOLIDADO · Painel do alimentador (tema 4, rodada 2) — parte JS
   Roda depois de proto/lupa-painel.js (a lupa do ARGOS), com window.D. Não altera dado nenhum: só reorganiza o que a página já
   desenha e liga os pedaços à lupa, sem repetir o que ela faz (classes T1/T2/T3 com trechos, km e NAE; camadas; filtros; busca).
   Blocos:
     A  resumo do cabeçalho: nº de trechos, km e NAE do alimentador (no lugar da tabela Classe/Trechos/Extensão do painel)
     B  T1/T2/T3 do mapa, só na tela cheia (onde a lupa os devolve ao mapa): com nº e km nos botões
     C  painel enxuto: sem lista de trechos nem legenda de cores (a lupa faz); aviso quando não há camada ligada
     D  legenda das classes dentro do mapa, só quando nenhuma camada de linha (Faixa, Inspeção) a esconde
     E  camadas em acordeão (o cartão da camada ligada na lupa abre sozinho)
     F  trecho escolhido: ficha curta + abas (NAE · Faixa · Inspeção · Insp→manut · Manutenção)
     G  celular: painel numa gaveta inferior; o mapa enquadra o trecho na parte que a gaveta não cobre
     H  município (Filtros da lupa) enquadra o mapa nele
   ============================================================================================ */
(function () {
  'use strict';
  const root = document.documentElement;
  const F = window.__PROTO || {};
  const liga = k => F[k] !== 0;                           // todas ligadas, a não ser que o teste desligue (window.__PROTO = {g:0})
  root.classList.add('p-r2');

  const $ = id => document.getElementById(id);
  const D = window.D;
  if (!D) return;
  const nf = n => Number(n).toLocaleString('pt-BR');
  const kmL = m => m < 1000 ? Math.round(m) + ' m' : (m / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' km';
  const kmC = m => m < 1000 ? Math.round(m) + ' m' : Math.round(m / 1000).toLocaleString('pt-BR') + ' km';
  const cheia = () => document.body.classList.contains('tela-cheia');
  const celular = () => matchMedia('(max-width:980px)').matches && !cheia();
  const panel = document.querySelector('.panel'), wrap = document.querySelector('.wrap'), header = document.querySelector('header');
  const barra = document.querySelector('.barra-busca');
  const M = D.meta || {};

  /* ---------------------------------------------------------------- A · resumo do cabeçalho */
  let res = null;
  function a() {
    const total = (M.resumo || {}).extensao_m ?? D.trechos.reduce((s, t) => s + t.ext, 0);
    const temNae = !!(D.nae && D.nae.meses && D.nae.meses.length) && typeof doMes === 'function';
    const sufixo = typeof ROT_NAE === 'string' && /-\s*(.+)$/.exec(ROT_NAE);
    res = document.createElement('div');
    res.className = 'al-res';
    res.setAttribute('role', 'group');
    res.setAttribute('aria-label', 'Resumo do alimentador');
    res.innerHTML =
      `<span class="r-i r-t"><b>${nf(D.trechos.length)}</b><small>${D.trechos.length === 1 ? 'trecho' : 'trechos'}</small></span>` +
      `<span class="r-i r-k"><b>${(total / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b><small>km</small></span>` +
      (temNae ? `<button type="button" class="r-i r-nae" aria-haspopup="true"><b><span class="r-nr">NAE</span> <span class="r-nn"></span></b><small class="r-np"></small></button>` : '');
    (header || wrap).after(res);
    if (!temNae) return;
    const mesTxt = document.querySelector('#mes .mes-txt'), btn = res.querySelector('.r-nae');
    const upd = () => {
      const n = doMes().length, per = mesTxt ? mesTxt.textContent.trim() : '';
      const todos = per === 'todos' || !per;
      res.querySelector('.r-nn').textContent = nf(n);
      btn.classList.toggle('zero', !n);
      res.querySelector('.r-np').textContent = (sufixo ? sufixo[1] + ' · ' : '') + (todos ? 'todos os meses' : per);
      const ind = $('ind') && !$('ind').checked ? ', sem individuais' : '';
      btn.title = `${typeof ROT_NAE === 'string' ? ROT_NAE : 'NAE'} no alimentador: ${nf(n)} (${todos ? 'todos os meses' : per}${ind}). Toque para mudar o período nos Filtros.`;
      btn.setAttribute('aria-label', `${nf(n)} NAE no alimentador, ${todos ? 'todos os meses' : per}${ind}. Abrir os Filtros`);
    };
    upd();
    if (mesTxt) new MutationObserver(upd).observe(mesTxt, { childList: true, characterData: true, subtree: true });
    if ($('ind')) $('ind').addEventListener('change', () => setTimeout(upd));
    btn.addEventListener('click', () => { const f = document.querySelector('.lp-fbt'); if (f) f.click(); });   // o período se muda nos Filtros (da lupa)
    // tela cheia: o cabeçalho some e o painel vira gaveta; o resumo vai para o alto dela (a lupa já levou a barra para lá)
    const lugar = () => { if (cheia() && barra) barra.after(res); else if (!cheia() && res.parentElement !== wrap) (header || wrap).after(res); };
    new MutationObserver(lugar).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  /* ---------------------------------------------------------------- B · T1/T2/T3 do mapa (tela cheia) com nº e km */
  function b() {
    const cl = { T1: [0, 0], T2: [0, 0], T3: [0, 0] };
    D.trechos.forEach(t => { const c = cl[t.nome.split('-')[0]]; if (c) { c[0]++; c[1] += t.ext; } });
    document.querySelectorAll('#classes button[data-c]').forEach(btn => {
      const [n, m] = cl[btn.dataset.c];
      btn.innerHTML = `<span class="cl-n">${btn.dataset.c}<em>${nf(n)}</em></span><small><span class="k-d">${nf(n)} · ${kmL(m)}</span><span class="k-m">${kmC(m)}</span></small>`;
      btn.title = `${btn.dataset.c}: ${nf(n)} ${n === 1 ? 'trecho' : 'trechos'} · ${kmL(m)}. Clique para mostrar ou esconder.`;
    });
  }

  /* ---------------------------------------------------------------- C · painel enxuto */
  let vazio = null;
  function c() {
    const det = $('det');
    vazio = document.createElement('div');
    vazio.className = 'al-vazio';
    vazio.hidden = true;
    vazio.innerHTML = '<p>Nenhuma camada ligada. O mapa mostra só os trechos.</p><button type="button">Escolher camadas</button>';
    vazio.querySelector('button').addEventListener('click', () => { const l = document.querySelector('.lp-lupa'); if (l) l.click(); });
    (det || panel).after(vazio);
    const confere = () => {
      const cards = [...document.querySelectorAll('.panel>.limp-card')];
      vazio.hidden = cards.some(k => !k.hidden) || !!(det && det.querySelector(':scope>h2'));
    };
    document.querySelectorAll('.panel>.limp-card').forEach(k => new MutationObserver(confere).observe(k, { attributes: true, attributeFilter: ['hidden'] }));
    if (det) new MutationObserver(confere).observe(det, { childList: true });
    confere();
  }

  /* ---------------------------------------------------------------- D · legenda das classes no mapa */
  function d() {
    const lg = $('legenda'), box = document.querySelector('.mapbox>.ctl-lgs');
    if (!lg || !box) return;
    lg.setAttribute('role', 'group');
    lg.setAttribute('aria-label', 'Cores das classes de trecho');
    box.prepend(lg);
  }

  /* ---------------------------------------------------------------- D2 · celular: legendas recolhíveis (4 camadas = ~215 px do mapa) */
  function d2() {
    const box = document.querySelector('.mapbox>.ctl-lgs');
    if (!box) return;
    const bt = document.createElement('button');
    bt.type = 'button'; bt.className = 'lg-tg'; bt.setAttribute('aria-expanded', 'true');
    bt.innerHTML = '<span class="lg-tt">Legendas</span><em class="lg-n"></em><span class="lg-ch" aria-hidden="true"></span>';
    box.prepend(bt);
    let mexeu = false;                                    // o usuário abriu ou fechou: não mexer mais sozinho
    const blocos = () => [...box.children].filter(k => k !== bt && k.id !== 'legenda' && !k.hidden);      // as legendas ligam e desligam pelo atributo hidden
    const poe = fechada => { box.classList.toggle('lg-fechada', fechada); bt.setAttribute('aria-expanded', String(!fechada)); };
    const confere = () => {
      const n = blocos().length;
      const nn = bt.querySelector('.lg-n'), t = n > 1 ? String(n) : '';
      if (nn.textContent !== t) nn.textContent = t;
      box.classList.toggle('lg-varias', n > 1);          // com uma legenda só, o botão nem aparece
      if (!mexeu) poe(celular() && n > 1);
    };
    bt.addEventListener('click', () => { mexeu = true; poe(!box.classList.contains('lg-fechada')); });
    new MutationObserver(confere).observe(box, { childList: true, attributes: true, subtree: true, attributeFilter: ['hidden'] });
    addEventListener('resize', confere);
    confere();
  }

  /* ---------------------------------------------------------------- E · camadas em acordeão */
  function e() {
    const cards = () => [...document.querySelectorAll('.panel>.limp-card')];
    const abre = (k, sim) => {
      k.classList.toggle('acd-fechada', !sim);
      const t = k.querySelector(':scope>.limp-top'); if (t) t.setAttribute('aria-expanded', String(sim));
    };
    const prep = k => {                                   // o cartão refaz o próprio HTML: o gancho de teclado volta a cada vez
      const t = k.querySelector(':scope>.limp-top');
      if (t && !t.hasAttribute('role')) { t.setAttribute('role', 'button'); t.tabIndex = 0; t.setAttribute('aria-expanded', String(!k.classList.contains('acd-fechada'))); }
    };
    cards().forEach(k => {
      prep(k);
      const tog = () => abre(k, k.classList.contains('acd-fechada'));
      k.addEventListener('click', ev => { if (ev.target.closest(':scope>.limp-top')) tog(); });
      k.addEventListener('keydown', ev => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches(':scope>.limp-top')) { ev.preventDefault(); tog(); } });
      new MutationObserver(() => prep(k)).observe(k, { childList: true });
      new MutationObserver(() => {                        // camada ligada na lupa: abre o cartão dela e fecha os outros
        if (k.hidden) return;
        cards().forEach(o => { if (o !== k) abre(o, false); });
        abre(k, true);
      }).observe(k, { attributes: true, attributeFilter: ['hidden'] });
    });
    const primeiro = cards().find(k => !k.hidden);
    cards().forEach(k => abre(k, k === primeiro));
  }

  /* ---------------------------------------------------------------- F · trecho escolhido: ficha + abas */
  function f() {
    const det = $('det'); if (!det) return;
    let ativa = null, quadro = 0;
    const GR = [['faixa', 'Faixa', s => !s.matches('.insp-sec,.mnt-sec,.exe-sec')], ['insp', 'Inspeção', s => s.matches('.insp-sec')],
                ['mnt', 'Insp→manut', s => s.matches('.mnt-sec')], ['exe', 'Manutenção', s => s.matches('.exe-sec')]];
    const mostra = () => {
      det.querySelectorAll(':scope>[data-aba]').forEach(el => { el.hidden = el.dataset.aba !== ativa; });
      det.querySelectorAll(':scope>.det-abas button').forEach(bt => bt.setAttribute('aria-selected', String(bt.dataset.aba === ativa)));
    };
    const monta = () => {
      quadro = 0;
      let bar = det.querySelector(':scope>.det-abas');
      if (!det.querySelector(':scope>h2')) { if (bar) bar.remove(); return; }          // sem trecho escolhido: sem abas
      const secs = [...det.querySelectorAll(':scope>section.limp-sec')];
      let nae = det.querySelector(':scope>.det-nae');
      if (!nae) {
        const dt = det.querySelector('dt.nae'), dd = det.querySelector('dd.nae');
        if (dt && dd) { nae = document.createElement('dl'); nae.className = 'det-nae'; nae.append(dt, dd); }
      }
      const abas = [];
      if (nae) { nae.dataset.aba = 'nae'; abas.push({ id: 'nae', rot: 'NAE', n: +((nae.querySelector('dd b') || {}).textContent || 0), el: nae }); }
      GR.forEach(([id, rot, ok]) => secs.filter(ok).forEach(s => {
        s.dataset.aba = id;
        abas.push({ id, rot, n: s.querySelectorAll('button[class*="-os-b"]').length, el: s });
      }));
      if (abas.length < 2) {                                                              // uma aba só: mostra tudo como antes
        if (bar) bar.remove();
        abas.forEach(x => { x.el.hidden = false; });
        if (nae && !nae.isConnected) det.append(nae);
        return;
      }
      if (!abas.some(x => x.id === ativa)) ativa = abas[0].id;
      const sig = abas.map(x => x.id + x.n).join('|');
      if (!bar) { bar = document.createElement('div'); bar.className = 'det-abas'; bar.setAttribute('role', 'tablist'); bar.setAttribute('aria-label', 'Dados do trecho'); }
      if (bar.dataset.sig !== sig) {
        bar.dataset.sig = sig;
        bar.innerHTML = abas.map(x => `<button type="button" role="tab" class="tab-${x.id}${x.n ? '' : ' vazia'}" data-aba="${x.id}">${x.rot}<em>${nf(x.n)}</em></button>`).join('');
      }
      const antes = secs[0] || null;                                                      // ordem: ficha, abas, conteúdo da aba
      if (bar.parentElement !== det) { if (antes) det.insertBefore(bar, antes); else det.append(bar); }
      if (nae && bar.nextElementSibling !== nae) bar.after(nae);
      mostra();
    };
    det.addEventListener('click', ev => {
      const bt = ev.target.closest('.det-abas button'); if (!bt) return;
      ativa = bt.dataset.aba; mostra();
    });
    det.addEventListener('keydown', ev => {                                               // ← → entre as abas
      const bt = ev.target.closest('.det-abas button'); if (!bt || !/^Arrow(Left|Right)$/.test(ev.key)) return;
      const bs = [...det.querySelectorAll('.det-abas button')], i = bs.indexOf(bt) + (ev.key === 'ArrowRight' ? 1 : -1), n = bs[(i + bs.length) % bs.length];
      ev.preventDefault(); n.focus(); n.click();
    });
    new MutationObserver(() => { if (!quadro) quadro = requestAnimationFrame(monta); }).observe(det, { childList: true });
    monta();
  }

  /* ---------------------------------------------------------------- G · celular: gaveta inferior */
  let gavetaEstado = () => 'peek';
  function g() {
    const det = $('det');
    if (!panel) return;
    const h = document.createElement('button');
    h.type = 'button'; h.className = 'sheet-h'; h.setAttribute('aria-expanded', 'false'); h.setAttribute('aria-label', 'Painel: abrir ou fechar');
    h.innerHTML = '<span class="sh-t"><span class="sh-tt">Painel</span><small class="sh-ts"></small></span><span class="sh-s" aria-hidden="true"></span>';
    panel.prepend(h);
    const ALTURA = { peek: () => 60, meio: () => innerHeight * .46, cheio: () => innerHeight * .88 };
    let estado = 'peek';
    gavetaEstado = () => estado;
    const inertiza = () => [...panel.children].forEach(k => { if (k !== h) k.inert = celular() && estado === 'peek'; });
    const set = x => { estado = x; panel.dataset.estado = x; h.setAttribute('aria-expanded', String(x !== 'peek')); inertiza(); rotulo(); };
    function rotulo() {                                          // a linha da gaveta fechada: o trecho escolhido ou as camadas ligadas
      const h2 = det && det.querySelector(':scope>h2'), tt = h.querySelector('.sh-tt'), ts = h.querySelector('.sh-ts');
      if (estado !== 'peek') { tt.textContent = 'Painel'; ts.textContent = ''; }          // aberta: a ficha e as camadas estão logo abaixo, sem repetir
      else if (h2) {
        const tipo = h2.querySelector('small');
        tt.textContent = [...h2.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim() + (tipo ? ' · ' + tipo.textContent.trim() : '');
        const dd = [...det.querySelectorAll(':scope>dl>dt')].find(x => x.textContent.trim() === 'Extensão');
        ts.textContent = dd ? dd.nextElementSibling.textContent.trim() : '';
      } else {
        const on = [...document.querySelectorAll('#ctl-camadas button[aria-pressed="true"]:not(.tc-painel-m)')].map(x => x.textContent.trim());
        tt.textContent = 'Painel';
        ts.textContent = on.length ? 'Camadas: ' + on.join(' · ') : 'Nenhuma camada ligada';
      }
    };
    rotulo();
    let ultimo = '';
    if (det) new MutationObserver(() => {
      rotulo();
      const h2 = det.querySelector(':scope>h2'), nome = h2 ? h2.textContent : '';
      if (nome && nome !== ultimo && estado === 'peek' && celular() && document.activeElement !== $('busca')) set('meio');   // escolheu um trecho: a gaveta sobe até a ficha (não enquanto digita)
      ultimo = nome;
    }).observe(det, { childList: true });
    const camadas = $('ctl-camadas');
    if (camadas) new MutationObserver(rotulo).observe(camadas, { subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
    // toque: abre e fecha; arrastar: segue o dedo e encaixa no estado mais perto
    let y0 = null, v0 = 0, mexeu = false;
    h.addEventListener('pointerdown', ev => { y0 = ev.clientY; v0 = ALTURA[estado](); mexeu = false; panel.dataset.arrasta = '1'; h.setPointerCapture(ev.pointerId); });
    h.addEventListener('pointermove', ev => {
      if (y0 == null) return;
      const dy = y0 - ev.clientY; if (Math.abs(dy) > 6) mexeu = true;
      panel.style.setProperty('--visivel', Math.max(60, Math.min(innerHeight * .88, v0 + dy)) + 'px');
    });
    const solta = ev => {
      if (y0 == null) return;
      const v = Math.max(60, Math.min(innerHeight * .88, v0 + (y0 - ev.clientY)));
      y0 = null; delete panel.dataset.arrasta; panel.style.removeProperty('--visivel');
      if (!mexeu) return set(estado === 'peek' ? 'meio' : 'peek');
      set(Object.keys(ALTURA).reduce((m, k) => Math.abs(ALTURA[k]() - v) < Math.abs(ALTURA[m]() - v) ? k : m, 'peek'));
    };
    h.addEventListener('pointerup', solta); h.addEventListener('pointercancel', solta);
    h.addEventListener('keydown', ev => { if (ev.key === 'Escape' && estado !== 'peek') set('peek'); });
    // escolher um trecho ou ativo no resultado da lupa: a gaveta sobe até a ficha (o campo perdeu o foco)
    document.addEventListener('click', ev => {
      if (!ev.target.closest('.lp-tr, .lp-at')) return;
      setTimeout(() => { if (celular() && estado === 'peek' && window.__selecao && window.__selecao().length) set('meio'); }, 60);
    });
    addEventListener('resize', inertiza);
    new MutationObserver(inertiza).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    set('peek');
    // o mapa enquadra o trecho na parte que a gaveta não cobre (o Leaflet não sabe da gaveta): folga embaixo = o que ela vai cobrir
    const map = window.__map;
    if (map && !map.__fitR2) {
      map.__fitR2 = true;
      const orig = map.fitBounds.bind(map);
      map.fitBounds = (bounds, o) => {
        o = Object.assign({}, o);
        if (celular() && panel && window.__selecao && window.__selecao().length) {   // só ao enquadrar um trecho escolhido
          const sobe = estado === 'peek' ? .46 : ({ meio: .46, cheio: .88 })[estado];            // a gaveta abre em 46% ao escolher o trecho
          const mb = document.querySelector('.mapbox').getBoundingClientRect(), cobre = Math.max(0, mb.bottom - innerHeight * (1 - sobe));
          const pb = o.paddingBottomRight || [24, 64];
          o.paddingBottomRight = [pb[0], Math.max(pb[1], Math.round(cobre) + 16)];
        }
        return orig(bounds, o);
      };
    }
  }

  /* ---------------------------------------------------------------- H · município (Filtros) enquadra o mapa */
  function hh() {
    const fm = $('f-mun'), map = window.__map;
    if (!fm || !map || !window.L) return;
    const tm = M.trecho_mun || {};
    fm.addEventListener('change', () => {
      const pts = [];
      D.vaos.forEach(x => { if (!fm.value || (tm[D.trechos[x[4]].nome] || []).includes(fm.value)) pts.push([x[0], x[1]], [x[2], x[3]]); });
      if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.04), { padding: [20, 20] });
    });
  }

  function init() {
    if (liga('a')) a();
    if (liga('b')) b();
    if (liga('c')) c();
    if (liga('d')) d();
    if (liga('d')) d2();
    if (liga('e')) e();
    if (liga('f')) f();
    if (liga('g')) g();
    if (liga('h')) hh();
    if (window.__map) window.__map.invalidateSize();
    root.classList.add('proto-pronto');
  }
  if (document.readyState === 'complete') init(); else addEventListener('load', init);
})();
