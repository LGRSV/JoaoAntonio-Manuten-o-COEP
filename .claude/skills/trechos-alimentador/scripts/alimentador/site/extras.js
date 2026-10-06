// Acréscimos da página do alimentador no site por município (roda depois de alimentador.js, com window.D):
// caminho Município › Alimentador › Trecho, filtros por classe e município, resumo por classe, avisos, origem e KMZ.
(function () {
  const M = D.meta || {};
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const km = m => (m / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' km';
  const mil = x => x === '' || x == null ? '' : Number(x).toLocaleString('pt-BR');
  const muns = M.municipios || [];
  const mun = muns.find(x => x.slug === new URLSearchParams(location.search).get('m'));
  const css = document.createElement('style');
  css.textContent = '.ie.ativo{transform:translate(-50%,9px)}.ie.ativo em{background:#1d4ed8}' +
    '.migalhas{display:flex;flex-wrap:wrap;align-items:center;gap:0 var(--s2);font-size:var(--t-sm);color:var(--muted)}' +
    '.migalhas a{color:var(--muted);text-decoration:none}.migalhas a:hover{color:var(--fg);text-decoration:underline}' +
    '.migalhas [aria-current]{color:var(--fg);font:600 var(--t-sm) var(--f-mono);font-variant-numeric:tabular-nums}' +
    '.migalhas .mig-t{display:inline-flex;gap:var(--s2);font:600 var(--t-sm) var(--f-mono);color:var(--fg)}.migalhas .mig-t:empty{display:none}' +
    '@media (pointer:coarse){.migalhas a{display:inline-flex;align-items:center;min-height:40px}}' +
    '.dados>*+*{margin-top:var(--s3)}.dados>summary+*{margin-top:var(--s2)}.dados>summary .selo{margin-left:var(--s1);font:400 var(--t-xs) var(--f-body);font-style:normal;color:var(--muted);' +
    'border:1px solid var(--line);border-radius:var(--rp);padding:1px var(--s2);white-space:nowrap;display:inline-flex;align-items:center;gap:6px}' +
    '.dados>summary .selo::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--aviso)}' +
    '.aviso-dados{display:grid;gap:2px;border-left:2px solid var(--aviso);padding:var(--s2) var(--s3);font-size:var(--t-sm)}' +
    '.resumo-classe{width:100%;border-collapse:collapse;font-size:var(--t-sm)}' +
    '.resumo-classe td,.resumo-classe th{padding:6px 8px;text-align:left;border-bottom:1px solid var(--line)}' +
    '.resumo-classe tr:first-child th{font:500 var(--t-xs) var(--f-body);color:var(--muted)}' +
    '.resumo-classe td+td,.resumo-classe th+th{text-align:right;font-family:var(--f-mono);font-variant-numeric:tabular-nums}' +
    '.resumo-classe td:first-child{font:600 var(--t-sm) var(--f-mono)}' +
    '.origem{font-size:var(--t-xs);color:var(--muted);overflow-wrap:anywhere}.dados .foot{overflow-wrap:anywhere}';
  document.head.append(css);

  // título: o código do alimentador; a SE fica no sobretítulo
  const h1 = document.querySelector('h1'), eyebrow = document.querySelector('.eyebrow');
  if (M.al && h1) {
    h1.textContent = M.al;
    if (eyebrow) eyebrow.textContent = eyebrow.textContent.replace(/\s*·\s*Alimentador\s+\S+\s*$/i, '');
    h1.insertAdjacentHTML('afterend', '<p class="sub">Trechos por ativo</p>');
  }

  // caminho e volta para o município
  const sep = '<span aria-hidden="true">›</span>';
  const nav = document.createElement('nav');
  nav.className = 'migalhas';
  nav.setAttribute('aria-label', 'Caminho');
  nav.innerHTML = `<a href="../../">Municípios</a>${sep}` +
    (mun ? `<a href="../../municipios/${esc(mun.slug)}/">${esc(mun.nome)}</a>${sep}` : '') +
    `<span aria-current="page">${esc(M.al)}</span><span class="mig-t" id="mig-trecho"></span>`;
  document.querySelector('header').prepend(nav);

  // filtros por classe e município (a lista é refeita a cada busca: o filtro é reaplicado)
  const lista = document.getElementById('lista');
  const f = document.createElement('div');
  f.className = 'filtros';
  f.innerHTML = '<label>Classe <select id="f-classe"><option value="">Todas</option><option>T1</option><option>T2</option><option>T3</option></select></label>' +
    (muns.length > 1 ? `<label>Município <select id="f-mun"><option value="">Todos</option>${muns.map(x =>
      `<option value="${esc(x.cod)}"${mun && x.cod === mun.cod ? ' selected' : ''}>${esc(x.nome)} (${km(x.m)})</option>`).join('')}</select></label>` : '');
  const ferr = document.getElementById('ferramentas');
  ferr ? ferr.prepend(f) : document.getElementById('busca').after(f);
  const tm = M.trecho_mun || {};
  function aplica() {
    const c = document.getElementById('f-classe').value, fm = (document.getElementById('f-mun') || {}).value || '';
    lista.querySelectorAll('.row').forEach(r => {
      const t = r.dataset.t;
      r.hidden = !((!c || t.split('-')[0] === c) && (!fm || (tm[t] || []).includes(fm)));
    });
  }
  f.addEventListener('change', aplica);
  new MutationObserver(ms => {
    if (ms.some(m => m.type === 'childList')) aplica();
    const s = [...lista.querySelectorAll('.row[aria-current="true"]')].map(b => b.dataset.t);
    document.getElementById('mig-trecho').innerHTML = s.length ? sep + esc(s.join(' + ')) : '';
  }).observe(lista, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-current'] });
  aplica();

  // NAE só de vegetação: deixa isso escrito no seletor de mês
  const labMes = document.querySelector('label[for="mes"]');
  if (labMes && (M.origem || {}).nae_filtro === 'arvore') labMes.firstChild.textContent = 'NAE árvore/eucalipto em ';

  // resumo por classe, avisos de dados e origem: tudo em "Dados e procedência", fechado
  const r = M.resumo || {};
  const v = M.validacao || { avisos: [] };
  const o = M.origem || {};
  const box = document.createElement('details');
  box.className = 'dados';
  box.innerHTML = `<summary>Dados e procedência${v.avisos.length ? '<em class="selo">com avisos</em>' : ''}</summary>` +
    `<table class="resumo-classe"><tr><th>Classe</th><th>Trechos</th><th>Extensão</th></tr>` +
    ['T1', 'T2', 'T3'].map(k => `<tr><td>${k}</td><td>${mil((r[k] || {}).n ?? 0)}</td><td>${km((r[k] || {}).m || 0)}</td></tr>`).join('') +
    `<tr><th>Total</th><th>${mil(r.trechos ?? '')}</th><th>${km(r.extensao_m || 0)}</th></tr></table>` +
    `<p class="origem">Municípios: ${muns.map(x => `${esc(x.nome)} ${km(x.m)}`).join(' · ') || '—'}</p>` +
    `<p class="origem">Continuidades estimadas: ${(M.continuidades_estimadas || []).length || (o.observacao ? 'não contabilizadas (ver procedência)' : 'nenhuma (o processamento não cria ligações)')}</p>` +
    (v.avisos.length ? `<div class="aviso-dados"><b>Dados a conferir:</b>${v.avisos.map(a => `<span>${esc(a)}</span>`).join('')}</div>` : '') +
    `<p class="origem">Origem: ${esc(o.kml)} (${esc(o.data)})` +
    (o.observacao ? `</p><p class="origem"><b>Procedência:</b> ${esc(M.origem.observacao)}` : '') +
    `${o.postes ? ' · postes ' + esc(M.origem.postes) : ''}${o.critica ? ' · Crítica ' + esc(M.origem.critica.join(', ')) + (M.origem.nae_filtro === 'arvore' ? ' (só Meio Ambiente · Árvore/Eucalipto na rede)' : '') : ''}` +
    `${o.malha ? ' · municípios: ' + esc(M.origem.malha) : ''}</p><p class="origem"><a href="${esc(M.al)}-trechos.kmz">Baixar o KMZ (Google Earth)</a></p>`;
  document.querySelector('.panel').append(box);
  const foot = document.querySelector('.foot');
  if (foot) box.append(foot);

  // abre enquadrado na parte do município escolhido
  if (mun && window.__map && window.L) {
    const pts = [];
    D.vaos.forEach(x => { if ((tm[D.trechos[x[4]].nome] || []).includes(mun.cod)) pts.push([x[0], x[1]], [x[2], x[3]]); });
    if (pts.length) window.__map.fitBounds(L.latLngBounds(pts), { padding: [20, 20] });
  }

  // vindo da busca de ativo da página inicial (?t=trecho&a=código&ll=lat,lon): seleciona o trecho e marca o ativo.
  // Espera o load para a limpeza de faixa (scripts seguintes) também pintar a seleção.
  const pq = new URLSearchParams(location.search), tq = pq.get('t'), ll = (pq.get('ll') || '').split(',').map(Number);
  const temT = tq && window.__sel && D.trechos.some(t => t.nome === tq), temLL = ll.length === 2 && ll.every(Number.isFinite);
  if (temT || temLL) addEventListener('load', () => {    // ativo longe da rede: só o marcador
    if (temT) window.__sel(tq, true);
    const map = window.__map;
    if (!map || !window.L || !temLL) return;
    L.marker(ll, { interactive: false, zIndexOffset: 1000, icon: L.divIcon({ className: '', iconSize: null,
      html: `<div class="ie ativo"><em>ATIVO</em>${esc(pq.get('a') || '')}</div>` }) }).addTo(map);
    map.setView(ll, Math.max(map.getZoom(), 16), { animate: false });
  });
})();
