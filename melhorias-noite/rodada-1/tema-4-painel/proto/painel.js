/* ============================================================================================
   PROTÓTIPO · Painel do alimentador (tema 4, rodada 1) — parte JS
   Roda por último, depois de todos os scripts da página (alimentador.js, extras.js, limpeza.js, …), com window.D.
   Liga cada sugestão pelas flags de window.__PROTO = {s1:1, s2:1, s3:1, s4:1, s5:1} (as classes p-sN no <html>
   é o que o proto/painel.css usa). Não altera dado nenhum: só reorganiza o que a página já desenha.
   ============================================================================================ */
(function () {
  'use strict';
  const F = window.__PROTO || { s1: 1, s2: 1, s3: 1, s4: 1, s5: 1 };
  const root = document.documentElement;
  Object.keys(F).forEach(k => { if (F[k]) root.classList.add('p-' + k); });

  const $ = id => document.getElementById(id);
  const nf = n => Number(n).toLocaleString('pt-BR');
  const kmL = m => m < 1000 ? Math.round(m) + ' m' : (m / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' km';
  const kmC = m => m < 1000 ? Math.round(m) + ' m' : (m >= 99500 ? Math.round(m / 1000).toLocaleString('pt-BR') : (m / 1000).toFixed(1).replace('.', ',')) + ' km';
  const mobile = () => matchMedia('(max-width:980px)').matches && !document.body.classList.contains('tela-cheia');

  /* ---------------------------------------------------------------- S2 · resumo único */
  function s2() {
    const D = window.D, M = (D && D.meta) || {};
    if (!D) return;
    const cl = { T1: [0, 0], T2: [0, 0], T3: [0, 0] };
    D.trechos.forEach(t => { const c = cl[t.nome.split('-')[0]]; if (c) { c[0]++; c[1] += t.ext; } });
    const total = (M.resumo || {}).extensao_m ?? D.trechos.reduce((s, t) => s + t.ext, 0);
    // 1) T1/T2/T3 do mapa passam a levar o nº de trechos e a extensão (a tabela "Classe/Trechos/Extensão" e a legenda de cores saem do painel)
    document.querySelectorAll('#classes button[data-c]').forEach(b => {
      const [n, m] = cl[b.dataset.c];
      b.innerHTML = `<span class="cl-n">${b.dataset.c}</span><small>${nf(n)} · ${kmC(m)}</small>`;
      b.title = `${b.dataset.c}: ${nf(n)} ${n === 1 ? 'trecho' : 'trechos'} · ${kmL(m)}. Clique para mostrar ou esconder.`;
    });
    // 2) o total (a linha "Total" da tabela) vai para o cabeçalho, ao lado da subestação
    const ey = document.querySelector('header .eyebrow');
    if (ey && !ey.querySelector('.tot')) ey.insertAdjacentHTML('beforeend', `<span class="tot">${nf(D.trechos.length)} trechos · ${kmL(total)}</span>`);
    // 3) a NAE do alimentador (antes "23 no alimentador", no painel) vai para o botão dos meses, que é quem a muda
    const mes = $('mes');
    if (mes && typeof doMes === 'function') {
      const rot = mes.querySelector('.mes-rot');
      if (rot) rot.innerHTML = '<span class="mes-nae">NAE</span> <b class="mes-n"></b> · Meses';
      const upd = () => {
        const n = doMes().length, b = mes.querySelector('.mes-n');
        if (!b) return;
        b.textContent = nf(n); b.classList.toggle('zero', !n);
        mes.title = `${typeof ROT_NAE === 'string' ? ROT_NAE : 'NAE'}: ${nf(n)} no alimentador, no período escolhido`;
      };
      upd();
      $('mes-lista').addEventListener('change', () => setTimeout(upd));   // depois do ouvinte da página (mesSel já atualizado)
    }
  }

  /* ---------------------------------------------------------------- S3 · camadas em acordeão */
  function s3() {
    const cards = () => [...document.querySelectorAll('.panel>.limp-card')];
    const abre = (c, sim) => {
      c.classList.toggle('acd-fechada', !sim);
      const t = c.querySelector(':scope>.limp-top'); if (t) t.setAttribute('aria-expanded', String(sim));
    };
    const prep = c => {                                   // o cartão refaz o próprio HTML: o gancho de teclado volta a cada vez
      const t = c.querySelector(':scope>.limp-top');
      if (t && !t.hasAttribute('role')) { t.setAttribute('role', 'button'); t.tabIndex = 0; t.setAttribute('aria-expanded', String(!c.classList.contains('acd-fechada'))); }
    };
    cards().forEach(c => {
      prep(c);
      const tog = () => abre(c, c.classList.contains('acd-fechada'));
      c.addEventListener('click', e => { if (e.target.closest(':scope>.limp-top')) tog(); });
      c.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches(':scope>.limp-top')) { e.preventDefault(); tog(); } });
      new MutationObserver(() => prep(c)).observe(c, { childList: true });
      new MutationObserver(() => {                        // camada ligada no Menu: abre o cartão dela e fecha os outros
        if (c.hidden) return;
        cards().forEach(o => { if (o !== c) abre(o, false); });
        abre(c, true);
      }).observe(c, { attributes: true, attributeFilter: ['hidden'] });
    });
    const primeiro = cards().find(c => !c.hidden);
    cards().forEach(c => abre(c, c === primeiro));
  }

  /* ---------------------------------------------------------------- S4 · trecho escolhido: ficha + abas */
  function s4() {
    const det = $('det'); if (!det) return;
    let ativa = null, quadro = 0;
    const GR = [['faixa', 'Faixa', s => !s.matches('.insp-sec,.mnt-sec,.exe-sec')], ['insp', 'Inspeção', s => s.matches('.insp-sec')],
                ['mnt', 'Insp→manut', s => s.matches('.mnt-sec')], ['exe', 'Manutenção', s => s.matches('.exe-sec')]];
    const mostra = () => {
      det.querySelectorAll(':scope>[data-aba]').forEach(e => { e.hidden = e.dataset.aba !== ativa; });
      det.querySelectorAll(':scope>.det-abas button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.aba === ativa)));
    };
    const monta = () => {
      quadro = 0;
      let bar = det.querySelector(':scope>.det-abas');
      if (!det.querySelector(':scope>h2')) { if (bar) bar.remove(); return; }          // sem trecho escolhido: resumo, sem abas
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
        abas.forEach(a => { a.el.hidden = false; });
        if (nae && !nae.isConnected) det.append(nae);
        return;
      }
      if (!abas.some(a => a.id === ativa)) ativa = abas[0].id;
      const sig = abas.map(a => a.id + a.n).join('|');
      if (!bar) { bar = document.createElement('div'); bar.className = 'det-abas'; bar.setAttribute('role', 'tablist'); bar.setAttribute('aria-label', 'Dados do trecho'); }
      if (bar.dataset.sig !== sig) {
        bar.dataset.sig = sig;
        bar.innerHTML = abas.map(a => `<button type="button" role="tab" class="tab-${a.id}" data-aba="${a.id}">${a.rot}<em>${nf(a.n)}</em></button>`).join('');
      }
      const antes = secs[0] || null;                                                      // ordem: ficha, abas, conteúdo da aba
      if (bar.parentElement !== det) { if (antes) det.insertBefore(bar, antes); else det.append(bar); }
      if (nae && bar.nextElementSibling !== nae) bar.after(nae);
      mostra();
    };
    det.addEventListener('click', e => {
      const b = e.target.closest('.det-abas button'); if (!b) return;
      ativa = b.dataset.aba; mostra();
    });
    det.addEventListener('keydown', e => {                                                // ← → entre as abas
      const b = e.target.closest('.det-abas button'); if (!b || !/^Arrow(Left|Right)$/.test(e.key)) return;
      const bs = [...det.querySelectorAll('.det-abas button')], i = bs.indexOf(b) + (e.key === 'ArrowRight' ? 1 : -1), n = bs[(i + bs.length) % bs.length];
      e.preventDefault(); n.focus(); n.click();
    });
    new MutationObserver(() => { if (!quadro) quadro = requestAnimationFrame(monta); }).observe(det, { childList: true });
    monta();
  }

  /* ---------------------------------------------------------------- S5 · celular: gaveta inferior */
  function s5() {
    const panel = document.querySelector('.panel'), det = $('det');
    if (!panel) return;
    const h = document.createElement('button');
    h.type = 'button'; h.className = 'sheet-h'; h.setAttribute('aria-expanded', 'false'); h.setAttribute('aria-label', 'Painel: abrir ou fechar');
    h.innerHTML = '<span class="sh-t"><span class="sh-tt">Painel</span><small class="sh-ts"></small></span><span class="sh-s" aria-hidden="true"></span>';
    panel.prepend(h);
    const ALTURA = { peek: () => 60, meio: () => innerHeight * .46, cheio: () => innerHeight * .88 };
    let estado = 'peek';
    const inertiza = () => [...panel.children].forEach(c => { if (c !== h) c.inert = mobile() && estado === 'peek'; });
    const set = e => { estado = e; panel.dataset.estado = e; h.setAttribute('aria-expanded', String(e !== 'peek')); inertiza(); };
    const rotulo = () => {                                          // a linha da gaveta fechada: o trecho escolhido ou as camadas ligadas
      const h2 = det && det.querySelector(':scope>h2'), tt = h.querySelector('.sh-tt'), ts = h.querySelector('.sh-ts');
      if (h2) {
        const tipo = h2.querySelector('small');
        tt.textContent = (h2.childNodes.length ? [...h2.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim() : '') + (tipo ? ' · ' + tipo.textContent.trim() : '');
        const dds = [...det.querySelectorAll(':scope>dl>dt')].find(d => d.textContent.trim() === 'Extensão');
        ts.textContent = dds ? dds.nextElementSibling.textContent.trim() : '';
      } else {
        const on = [...document.querySelectorAll('#ctl-camadas button[aria-pressed="true"]')].map(b => b.textContent.trim());
        tt.textContent = 'Painel';
        ts.textContent = on.length ? 'Camadas: ' + on.join(' · ') : 'Camadas, NAE e dados';
      }
    };
    rotulo();
    let ultimo = '';
    if (det) new MutationObserver(() => {
      rotulo();
      const h2 = det.querySelector(':scope>h2'), nome = h2 ? h2.textContent : '';
      if (nome && nome !== ultimo && estado === 'peek' && mobile()) set('meio');                // escolheu um trecho: a gaveta sobe até a ficha
      ultimo = nome;
    }).observe(det, { childList: true });
    const camadas = $('ctl-camadas');
    if (camadas) new MutationObserver(rotulo).observe(camadas, { subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
    // toque: abre e fecha; arrastar: segue o dedo e encaixa no estado mais perto
    let y0 = null, v0 = 0, mexeu = false;
    h.addEventListener('pointerdown', e => { y0 = e.clientY; v0 = ALTURA[estado](); mexeu = false; panel.dataset.arrasta = '1'; h.setPointerCapture(e.pointerId); });
    h.addEventListener('pointermove', e => {
      if (y0 == null) return;
      const dy = y0 - e.clientY; if (Math.abs(dy) > 6) mexeu = true;
      panel.style.setProperty('--visivel', Math.max(60, Math.min(innerHeight * .88, v0 + dy)) + 'px');
    });
    const solta = e => {
      if (y0 == null) return;
      const v = Math.max(60, Math.min(innerHeight * .88, v0 + (y0 - e.clientY)));
      y0 = null; delete panel.dataset.arrasta; panel.style.removeProperty('--visivel');
      if (!mexeu) return set(estado === 'peek' ? 'meio' : 'peek');
      set(Object.keys(ALTURA).reduce((m, k) => Math.abs(ALTURA[k]() - v) < Math.abs(ALTURA[m]() - v) ? k : m, 'peek'));
    };
    h.addEventListener('pointerup', solta); h.addEventListener('pointercancel', solta);
    h.addEventListener('keydown', e => { if (e.key === 'Escape' && estado !== 'peek') { set('peek'); } });
    addEventListener('resize', inertiza);
    new MutationObserver(inertiza).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    set('peek');
  }

  function init() {
    if (F.s2) s2();
    if (F.s3) s3();
    if (F.s4) s4();
    if (F.s5) s5();
    if (window.__map) { window.__map.invalidateSize(); }
    root.classList.add('proto-pronto');
  }
  if (document.readyState === 'complete') init(); else addEventListener('load', init);
})();
