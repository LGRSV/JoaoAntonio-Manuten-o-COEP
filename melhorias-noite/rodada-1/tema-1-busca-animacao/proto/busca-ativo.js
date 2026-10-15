// Página inicial: busca única atrás da lupa — ativo (chave, transformador, poste), município, alimentador ou OS.
// Tocar na lupa abre o campo. Ao digitar, a lista suspensa mostra os municípios e os alimentadores que batem (dados do
// mapa, window.MUN) e, com 3 caracteres ou mais, os ativos cujo código começa assim (dados/ativos-pref/<2 primeiros>.json).
// Escolher um município ou alimentador abre a página dele; escolher um ativo (ou dar Enter) busca no índice
// dados/ativos/<fatia>.json (gerados por scripts/gera_trechos.py), que diz o alimentador e o trecho.
// OS: com número/ano (ex.: 002507/2026, com ou sem a equipe na frente) aparece "Buscar a OS…", que procura em
// dados/os/<fatia>.json as OS de faixa, inspeção, manutenção e executadas com esse número.
// A lista e o resultado abrem presos ao campo (não empurram o mapa); fecham com Esc ou clicando fora.
// O formulário já vem no HTML dentro da barra em cima do mapa (.mt-barra) e o estilo está em assets/site.css:
// nada muda de lugar nem de cara quando este script carrega.
// PROTÓTIPO (rodada 1, tema 1). s4 = busca renovada (rótulo no botão, atalho "/", exemplos, linhas com contexto e destaque, sem texto repetido);
// s5 = escolher município/alimentador faz o mapa voar até ele (window.__mapaTO.vaiPara, de mapa-municipios.js) em vez de abrir outra página.
(function () {
  const form = document.getElementById('ativo');
  if (!form) return;
  const P = k => (document.documentElement.dataset.proto || '').split(' ').includes(k);
  const q = document.getElementById('ativo-q'), res = document.getElementById('ativo-res');
  const barra = document.querySelector('.mt-barra');     // página de versão antiga, com o formulário fora da barra
  if (barra && !barra.contains(form)) barra.prepend(form);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TIPO = { DJ: 'Disjuntor', '79': 'Religador', '03': 'Fusível 03', '33': 'Fusível 33', '02': 'Chave 02', '88': 'Chave faca 88',
    '40': 'Trip saver 40', '41': 'Trip saver 41', SEC: 'Fusível (seccionamento)', FTR: 'Fusível no tronco', poste: 'Poste',
    TR: 'Transformador', ET: 'Transformador', EP: 'Transformador particular', Capacitor: 'Banco de capacitor', Regulador: 'Regulador de tensão',
    Chave: 'Chave', ChaveNA: 'Chave NA' };
  const se = {};                                  // alimentador → subestação (dados do mapa da página inicial)
  const muns = ((window.MUN || {}).muns || []).filter(m => m.slug);
  muns.forEach(m => (m.als || []).forEach(a => { se[a.cod] = a.se; }));
  const als = Object.keys(se).sort();
  const info = {};                                // alimentador → NAE, subestação e municípios por onde passa (o de mais km primeiro)
  muns.forEach(m => (m.als || []).forEach(a => { const i = info[a.cod] || (info[a.cod] = { n: a.n || 0, se: a.se, ms: [] }); i.ms.push([m.nome, a.m]); }));
  Object.values(info).forEach(i => i.ms.sort((a, b) => b[1] - a[1]));
  const IC = {
    mun: '<path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z"/><circle cx="12" cy="11" r="2.2"/>',
    al: '<path d="M3 17l5-5 4 3 8-9"/><circle cx="3" cy="17" r="1"/><circle cx="20" cy="6" r="1"/>',
    at: '<path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z"/>',
    os: '<path d="M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h5M9.5 16h5"/>',
    go: '<path d="m9 6 6 6-6 6"/>',
  };
  const ic = k => `<svg class="sug-ic" viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;
  const semAcento = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  // lupa: abre e fecha o campo (fechado, só a lupa aparece)
  const lupa = document.getElementById('lupa');
  const abreCampo = sim => {
    if (!lupa) return;
    q.hidden = !sim;
    lupa.setAttribute('aria-expanded', String(sim));
    if (sim) { q.focus(); if (P('s4') && !q.value.trim() && !res.innerHTML) res.innerHTML = dicas(); } else { q.value = ''; res.innerHTML = ''; fechaSug(); }
  };
  if (lupa) lupa.addEventListener('click', () => abreCampo(q.hidden || !q.value.trim() ? q.hidden : true));
  if (P('s4') && lupa) {
    lupa.classList.add('com-rotulo');
    lupa.insertAdjacentHTML('beforeend', '<span class="lupa-t">Buscar</span><kbd class="lupa-k" aria-hidden="true">/</kbd>');
    document.addEventListener('keydown', e => {   // "/" abre a busca de qualquer lugar da página (fora de campos de texto)
      const a = document.activeElement;
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable))) return;
      e.preventDefault();
      abreCampo(true);
    });
  }
  const EX = [['Município', 'Palmas'], ['Alimentador', 'LD01072001'], ['Ativo: chave, trafo ou poste', '7900001071'], ['OS (nº/ano)', '000353/2026']];
  const dicas = () => '<div class="sug-dicas"><p>Busque por</p><div>' +
    EX.map(([t, x]) => `<button type="button" class="sug-ex" data-ex="${x}"><span>${t}</span><b>${x}</b></button>`).join('') + '</div></div>';
  q.addEventListener('blur', () => setTimeout(() => {
    if (lupa && !form.contains(document.activeElement) && !q.value.trim() && (!res.innerHTML || res.querySelector('.sug-dicas'))) abreCampo(false);
  }, 150));

  const chave = s => { const k = String(s).toUpperCase().replace(/[^0-9A-Z]/g, ''); return /^\d+$/.test(k) ? (k.replace(/^0+/, '') || '0') : k; };
  const hash = k => { let h = 0; for (let i = 0; i < k.length; i++) h = (Math.imul(h, 31) + k.charCodeAt(i)) >>> 0; return h; };
  const fatia = k => (hash(k) % 256).toString(16).padStart(2, '0');
  const fatiaOS = k => (hash(k) % 64).toString(16).padStart(2, '0');      // FATIAS_OS de scripts/gera_trechos.py
  const chaveOS = s => { const m = String(s).match(/(\d{1,7})\s*\/\s*(\d{4})(?!\d)/); return m ? `${+m[1]}/${m[2]}` : null; };
  const BASE_OS = { f: 'Limpeza de faixa', i: 'Inspeção', m: 'Manutenção (gerada pela inspeção)', e: 'Executada' };
  const cache = {};
  const baixa = f => cache[f] || (cache[f] = fetch(`dados/${f}.json`).then(r => r.ok ? r.json() : {}).catch(() => { delete cache[f]; return null; }));

  // ---------- lista suspensa: ativos que começam com o que se digita ----------
  const ORDEM = ['DJ', '79', '03', '33', '02', '40', '41', 'SEC', 'FTR', '88', 'TR', 'ET', 'EP', 'poste'];
  const peso = t => { const i = ORDEM.indexOf(t); return i < 0 ? ORDEM.length - 1.5 : i; };
  let sug = [], marcado = -1, pedido = 0;
  q.setAttribute('role', 'combobox');
  q.setAttribute('aria-autocomplete', 'list');
  q.setAttribute('aria-controls', 'ativo-res');
  q.setAttribute('aria-expanded', 'false');
  const fechaSug = () => { sug = []; marcado = -1; q.setAttribute('aria-expanded', 'false'); q.removeAttribute('aria-activedescendant'); };
  const marca = i => {
    marcado = i;
    res.querySelectorAll('.sug-op').forEach((o, k) => o.classList.toggle('marcado', k === i));
    const o = res.querySelector(`#ativo-sug-${i}`);
    if (o) { q.setAttribute('aria-activedescendant', o.id); o.scrollIntoView({ block: 'nearest' }); } else q.removeAttribute('aria-activedescendant');
  };
  async function sugere() {
    const txt = q.value.trim(), k = chave(txt), meu = ++pedido, n = semAcento(txt), K = txt.toUpperCase().replace(/[^0-9A-Z]/g, '');
    const ms = n.length >= 2 ? muns.filter(m => m.busca.includes(n)).sort((a, b) => a.busca.indexOf(n) - b.busca.indexOf(n) || a.nome.localeCompare(b.nome, 'pt-BR')).slice(0, 5) : [];
    const as = K.length >= 2 ? als.filter(c => c.includes(K)).sort((a, b) => a.indexOf(K) - b.indexOf(K) || a.localeCompare(b)).slice(0, 5) : [];
    let achados = [];
    if (k.length >= 3) {
      const d = await baixa('ativos-pref/' + k.slice(0, 2));
      if (meu !== pedido) return;                   // já digitaram outra coisa
      if (d) Object.entries(d).forEach(([tipo, lista]) => lista.split(' ').forEach(c => { if (chave(c).startsWith(k)) achados.push([c, tipo]); }));
      achados.sort((a, b) => (chave(b[0]) === k) - (chave(a[0]) === k) || peso(a[1]) - peso(b[1]) || a[0].length - b[0].length || a[0].localeCompare(b[0]));
    }
    if (meu !== pedido) return;
    if (!txt) { fechaSug(); res.innerHTML = P('s4') ? dicas() : ''; return; }
    const kOS = chaveOS(txt);
    const at = achados.slice(0, ms.length || as.length ? 8 : 12);
    sug = [...(kOS ? [{ os: txt }] : []), ...ms.map(m => ({ href: `municipios/${m.slug}/`, mun: m.cod })), ...as.map(c => ({ href: `alimentadores/${encodeURIComponent(c)}/`, al: c })),
      ...at.map(([c]) => ({ ativo: c }))];
    if (!sug.length) {
      fechaSug();
      res.innerHTML = n.length < 2 ? '' : `<p>Nada encontrado para <b>${esc(txt)}</b>.</p>` + (P('s4') ? dicas() : '');
      return;
    }
    if (P('s4')) {
      let j = 0;
      const hl = (t, termo) => {                  // destaca o que foi digitado (sem diferenciar acento nem caixa)
        const k = semAcento(termo).trim(), p = k ? semAcento(t).indexOf(k) : -1;
        return p < 0 ? esc(t) : esc(t.slice(0, p)) + '<mark>' + esc(t.slice(p, p + k.length)) + '</mark>' + esc(t.slice(p + k.length));
      };
      const op2 = (tit, sub, icone, cl = '') => `<li class="sug-op s4" role="option" id="ativo-sug-${j}" data-i="${j++}">${ic(icone)}<span class="sug-tx"><b${cl}>${tit}</b><span>${sub}</span></span>${ic('go').replace('sug-ic', 'sug-go')}</li>`;
      const bl = (t, itens) => itens.length ? `<li class="sug-t" role="presentation">${t}<i>${itens.length}</i></li>` + itens.join('') : '';
      const nNae = v => (v || 0).toLocaleString('pt-BR');
      res.innerHTML = '<ul class="sug" role="listbox" aria-label="Resultados">' +
        bl('OS', kOS ? [op2(`OS ${esc(txt)}`, 'bases de faixa, inspeção, manutenção e executadas', 'os')] : []) +
        bl('Municípios', ms.map(m => op2(hl(m.nome, txt), `${m.reg ? 'Regional ' + esc(m.reg) + ' · ' + esc(m.polo) + ' · ' : ''}${nNae(m.nae)} NAE · ${m.als.length} alimentador${m.als.length > 1 ? 'es' : ''}`, 'mun', ' class="nome"'))) +
        bl('Alimentadores', as.map(c => { const o = info[c] || { ms: [] }; return op2(hl(c, txt), `${esc(o.se || '')} · ${nNae(o.n)} NAE · ${esc(o.ms[0] ? o.ms[0][0] : '')}${o.ms.length > 1 ? ' e mais ' + (o.ms.length - 1) : ''}`, 'al'); })) +
        bl('Ativos', at.map(([c, tipo]) => op2(hl(c, txt), esc(TIPO[tipo] || 'Chave ' + tipo), 'at'))) + '</ul>' +
        (achados.length > at.length ? `<p class="sug-mais">e mais ${(achados.length - at.length).toLocaleString('pt-BR')} ativos: continue digitando</p>` : '') +
        '<p class="sug-teclas" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> navegar · <kbd>Enter</kbd> escolher · <kbd>Esc</kbd> fechar</p>';
      q.setAttribute('aria-expanded', 'true');
      marca(-1);
      return;
    }
    let i = 0;
    const op = (b, sp, cl = '') => `<li class="sug-op" role="option" id="ativo-sug-${i}" data-i="${i++}"><b${cl}>${b}</b><span>${sp}</span></li>`;
    const bloco = (t, itens) => itens.length ? `<li class="sug-t" role="presentation">${t}</li>` + itens.join('') : '';
    res.innerHTML = `<ul class="sug" role="listbox" aria-label="Resultados">` +
      bloco('OS', kOS ? [op(`OS ${esc(txt)}`, 'buscar nas bases de faixa, inspeção, manutenção e executadas')] : []) +
      bloco('Municípios', ms.map(m => op(esc(m.nome), `${m.als.length} alimentador${m.als.length > 1 ? 'es' : ''}`, ' class="nome"'))) +
      bloco('Alimentadores', as.map(c => op(esc(c), esc(se[c] || '')))) +
      bloco('Ativos', at.map(([c, tipo]) => op(esc(c), esc(TIPO[tipo] || 'Chave ' + tipo)))) + '</ul>' +
      (achados.length > at.length ? `<p class="sug-mais">e mais ${(achados.length - at.length).toLocaleString('pt-BR')} ativos: continue digitando</p>` : '');
    q.setAttribute('aria-expanded', 'true');
    marca(-1);
  }
  let espera = 0;
  q.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(sugere, 120); });
  q.addEventListener('keydown', e => {
    if (!sug.length || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter')) return;
    if (e.key === 'Enter') {
      // Enter sem escolher: se só veio município ou alimentador, abre o primeiro; senão busca o ativo digitado
      const i = marcado >= 0 ? marcado : sug[0] && sug[0].os ? 0 : sug.some(o => o.ativo) ? -1 : 0;
      if (i >= 0) { e.preventDefault(); escolhe(i); }
      return;
    }
    e.preventDefault();
    marca(e.key === 'ArrowDown' ? Math.min(sug.length - 1, marcado + 1) : Math.max(0, marcado - 1));
  });
  res.addEventListener('mousedown', e => { if (e.target.closest('.sug-op, .sug-ex')) e.preventDefault(); });   // o campo não perde o foco
  res.addEventListener('click', e => {
    const x = e.target.closest('.sug-ex');
    if (!x) return;
    q.value = x.dataset.ex; q.focus(); q.dispatchEvent(new Event('input'));
  });
  res.addEventListener('click', e => { const o = e.target.closest('.sug-op'); if (o) escolhe(+o.dataset.i); });
  function escolhe(i) {
    const to = window.__mapaTO, cod = sug[i].mun || (sug[i].al && to && to.municipioDe(sug[i].al));
    if (P('s5') && to && cod) {                    // o mapa voa até o município/alimentador; "Página do município/alimentador" no painel abre a página
      const href = sug[i].href;
      q.value = ''; res.innerHTML = ''; fechaSug(); abreCampo(false); if (lupa) lupa.focus({ preventScroll: true });
      const raiz = document.getElementById('mapa-to');
      if (raiz) raiz.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      to.vaiPara(cod, sug[i].al).then(ok => { if (!ok) location.href = href; });
      return;
    }
    if (sug[i].href) { location.href = sug[i].href; return; }
    if (sug[i].os) { buscaOS(sug[i].os); return; }
    q.value = sug[i].ativo;
    fechaSug();
    form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true }));
  }

  // OS: todas as que têm esse número/ano; com a equipe digitada (ex.: ETO-RD-PO 002507/2026) fica só a dela
  async function buscaOS(txt) {
    clearTimeout(espera); pedido++; fechaSug();
    const k = chaveOS(txt);
    res.innerHTML = P('s4') ? '<div class="sug-sk" aria-busy="true"><i></i><i></i><i></i></div>' : '<p>Buscando a OS…</p>';
    const d = await baixa('os/' + fatiaOS(k));
    if (d === null) { res.innerHTML = '<p>Não foi possível carregar o índice de OS. Confira a internet e tente de novo.</p>'; return; }
    const equipe = s => String(s).replace(/\d{1,7}\s*\/\s*\d{4}.*$/, '').toUpperCase().replace(/[^0-9A-Z]/g, '');
    const todas = d[k] || [], eq = equipe(txt), comEquipe = /[A-Z]/.test(eq);
    const daEquipe = comEquipe ? todas.filter(h => equipe(h[0]).includes(eq)) : [];
    const hits = daEquipe.length ? daEquipe : todas;
    if (!hits.length) { res.innerHTML = `<p>A OS <b>${esc(txt)}</b> não está nas bases de faixa, inspeção, manutenção nem executadas.</p>`; return; }
    const mostra = hits.slice(0, 40);
    res.innerHTML = (P('s4') ? `<p class="res-n">${hits.length === 1 ? '1 OS' : hits.length + ' OS'}${comEquipe && !daEquipe.length ? ' (nenhuma da equipe digitada; mostrando todas)' : ''}</p><ul>`
      : `<p>${hits.length === 1 ? '1 OS' : hits.length + ' OS'} com o número <b>${esc(k)}</b>${comEquipe && !daEquipe.length ? ' (nenhuma da equipe digitada; mostrando todas)' : ''}:</p><ul>`) +
      mostra.map(([os, al, base, info, lat, lon]) =>
        `<li><a href="alimentadores/${encodeURIComponent(al)}/${lat != null ? `?a=${encodeURIComponent(os)}&ll=${lat},${lon}` : ''}">` +
        `<b>${esc(os)}</b><span>${esc(BASE_OS[base] || base)}${info ? ' · ' + esc(info) : ''}</span><span>${esc(al)}${se[al] ? ' · ' + esc(se[al]) : ''}</span>` +
        '<span class="ir">Abrir no mapa →</span></a></li>').join('') + '</ul>' +
      (hits.length > mostra.length ? `<p class="sug-mais">e mais ${hits.length - mostra.length}: digite a equipe junto (ex.: ETO-RD-PO ${esc(k)})</p>` : '');
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    clearTimeout(espera); pedido++; fechaSug();
    const txt = q.value.trim(), k = chave(txt);
    if (chaveOS(txt)) { buscaOS(txt); return; }
    if (!k) { res.innerHTML = ''; return; }
    res.innerHTML = P('s4') ? '<div class="sug-sk" aria-busy="true"><i></i><i></i><i></i></div>' : '<p>Buscando…</p>';
    const d = await baixa('ativos/' + fatia(k));
    if (d === null) { res.innerHTML = '<p>Não foi possível carregar o índice. Confira a internet e tente de novo.</p>'; return; }
    const hits = d[k] || [];
    if (!hits.length) {
      res.innerHTML = `<p><b>${esc(txt)}</b> não foi encontrado. Confira o código: a busca é pelo código completo da chave, do transformador ` +
        'ou pelo número do poste. Postes sem número no cadastro não entram.</p>';
      return;
    }
    res.innerHTML = (P('s4') ? `<p class="res-n">${hits.length === 1 ? '1 resultado' : hits.length + ' resultados'}</p><ul>`
      : `<p>${hits.length === 1 ? '1 resultado' : hits.length + ' resultados'} para <b>${esc(txt)}</b>:</p><ul>`) +
      hits.map(([al, tipo, t, papel, lat, lon]) => {
        const onde = tipo === 'poste' ? (papel ? 'Trechos ' + esc(papel) : 'Trecho ' + esc(t)) : esc(papel[0] ? papel[0].toUpperCase() + papel.slice(1) : '');
        return `<li><a href="alimentadores/${encodeURIComponent(al)}/?${t ? 't=' + encodeURIComponent(t) + '&' : ''}a=${encodeURIComponent(txt)}&ll=${lat},${lon}">` +
          `<b>${t ? esc(t) + ' · ' : ''}${esc(al)}</b><span>${esc(TIPO[tipo] || 'Chave ' + tipo)} ${esc(txt)}${se[al] ? ' · ' + esc(se[al]) : ''}</span>` +
          (onde ? `<span>${onde}</span>` : '') + '<span class="ir">Abrir no mapa →</span></a></li>';
      }).join('') + '</ul>';
  });
  // fecha a lista: Esc (no campo ou na lista; o foco volta ao campo) ou clique fora do formulário
  form.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!res.innerHTML || (P('s4') && res.querySelector('.sug-dicas'))) { if (lupa && !q.hidden) { e.preventDefault(); abreCampo(false); lupa.focus(); } return; }
    e.preventDefault();                           // sem isto o Esc também apagaria o texto do campo de busca
    res.innerHTML = '';
    fechaSug();
    q.focus();
  });
  document.addEventListener('pointerdown', e => { if (res.innerHTML && !form.contains(e.target)) { res.innerHTML = ''; fechaSug(); } });
})();
