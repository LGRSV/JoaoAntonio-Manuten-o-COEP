// Acréscimos da página do alimentador no site por município (roda depois de alimentador.js, com window.D):
// caminho Município › Alimentador › Trecho, barra acima do mapa com a busca e o filtro de município (a classe segue o T1/T2/T3 do mapa),
// resumo por classe, avisos, origem e KMZ.
(function () {
  const M = D.meta || {};
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const km = m => (m / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' km';
  const mil = x => x === '' || x == null ? '' : Number(x).toLocaleString('pt-BR');
  const muns = M.municipios || [];
  const mun = muns.find(x => x.slug === new URLSearchParams(location.search).get('m'));
  const css = document.createElement('style');
  // (o caminho .migalhas tem o CSS no alimentador.css: aparece já na 1ª pintura)
  css.textContent = '.ie.ativo{transform:translate(-50%,9px)}.ie.ativo em{background:#1d4ed8}' +
    '.dados>*+*{margin-top:var(--s3)}.dados>summary+*{margin-top:var(--s2)}.dados>summary .selo{margin-left:var(--s1);font:400 var(--t-xs) var(--f-body);font-style:normal;color:var(--muted);' +
    'border:1px solid var(--line);border-radius:var(--rp);padding:1px var(--s2);white-space:nowrap;display:inline-flex;align-items:center;gap:6px}' +
    '.dados>summary .selo::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--aviso)}' +
    '.aviso-dados{display:grid;gap:2px;border-left:2px solid var(--aviso);padding:var(--s2) var(--s3);font-size:var(--t-sm)}' +
    '.resumo-classe{width:100%;border-collapse:collapse;font-size:var(--t-sm)}' +
    '.resumo-classe td,.resumo-classe th{padding:6px 8px;text-align:left;border-bottom:1px solid var(--line)}' +
    '.resumo-classe tr:first-child th{font:500 var(--t-xs) var(--f-body);color:var(--muted)}' +
    '.resumo-classe td+td,.resumo-classe th+th{text-align:right;font-family:var(--f-mono);font-variant-numeric:tabular-nums}' +
    '.resumo-classe td:first-child{font:600 var(--t-sm) var(--f-mono)}' +
    '.regra.rodape{border-top:1px solid var(--line);padding-top:var(--s3)}' +
    '.origem{font-size:var(--t-xs);color:var(--muted);overflow-wrap:anywhere}.dados .foot{overflow-wrap:anywhere}' +
    '.ativo-hit:empty{display:none}.ativo-hit{display:grid;gap:var(--s1);margin:var(--s2) 0}' +
    '.ativo-hit button{display:grid;gap:2px;text-align:left;width:100%;min-height:var(--alvo);padding:var(--s2) var(--s3);border:1px solid var(--line-forte);' +
    'border-radius:var(--r2);background:var(--paper);color:var(--fg);font:var(--t-sm) var(--f-body);cursor:pointer}' +
    '.ativo-hit button span{color:var(--muted);font-size:var(--t-xs)}.ativo-hit .ir{color:var(--accent)}' +
    '.ativo-hit button:hover{border-color:var(--accent)}.ativo-hit button:focus-visible{outline:2px solid var(--accent);outline-offset:1px}';
  document.head.append(css);

  // título: o código do alimentador; a SE fica no sobretítulo. O HTML da página já sai assim (script no cabeçalho do modelo);
  // aqui só se completa o que faltar.
  const h1 = document.querySelector('h1'), eyebrow = document.querySelector('.eyebrow');
  if (M.al && h1 && h1.textContent !== M.al) {
    h1.textContent = M.al;
    if (eyebrow) eyebrow.textContent = eyebrow.textContent.replace(/\s*·\s*Alimentador\s+\S+\s*$/i, '');
    if (!h1.nextElementSibling?.classList.contains('sub')) h1.insertAdjacentHTML('afterend', '<p class="sub">Trechos por ativo</p>');
  }

  // caminho e volta para o município (o município só se sabe com os dados: entra no lugar reservado)
  const sep = '<span aria-hidden="true">›</span>';
  const linkMun = mun ? `<a href="../../municipios/${esc(mun.slug)}/">${esc(mun.nome)}</a>${sep}` : '';
  let nav = document.querySelector('header .migalhas');
  if (nav) { const lugar = nav.querySelector('.mig-mun'); if (lugar) lugar.innerHTML = linkMun; }
  else {
    nav = document.createElement('nav');
    nav.className = 'migalhas';
    nav.setAttribute('aria-label', 'Caminho');
    nav.innerHTML = `<a href="../../">Municípios</a>${sep}${linkMun}` +
      `<span aria-current="page">${esc(M.al)}</span><span class="mig-t" id="mig-trecho"></span>`;
    document.querySelector('header').prepend(nav);
  }

  // barra acima do mapa (como a busca da página inicial): a busca sobe do painel (o ouvinte do modelo vai junto, pelo id) e o
  // filtro de município fica ao lado dela; no celular, embaixo. Os achados da busca de ativo entram logo abaixo (.ativo-hit).
  // Na tela cheia a barra vai para o alto da gaveta do painel (telacheia.js). Sem o .stage, tudo fica no painel como antes.
  // A classe vem dos botões T1/T2/T3 do mapa (window.__visivel, de alimentador.js): classe escondida no mapa também sai
  // da lista. A lista é refeita a cada busca: o filtro é reaplicado
  const lista = document.getElementById('lista');
  const f = document.createElement('div');
  f.className = 'filtros';
  f.innerHTML = (muns.length > 1 ? `<label for="f-mun" class="vh">Município</label><select id="f-mun"><option value="">Todos os municípios</option>${muns.map(x =>
      `<option value="${esc(x.cod)}"${mun && x.cod === mun.cod ? ' selected' : ''}>${esc(x.nome)} (${km(x.m)})</option>`).join('')}</select>` : '');
  const ferr = document.getElementById('ferramentas'), stage = document.querySelector('.wrap>.stage'), bus = document.getElementById('busca');
  let barra = null;
  if (stage && bus) {
    barra = document.createElement('div');
    barra.className = 'barra-busca';
    barra.setAttribute('role', 'search');
    barra.setAttribute('aria-label', 'Busca e município');
    const linha = document.createElement('div');
    linha.className = 'barra-linha';
    linha.append(bus, f);
    barra.append(linha);
    stage.before(barra);
  } else ferr ? ferr.prepend(f) : document.getElementById('busca').after(f);
  {
    const s = document.createElement('style');
    s.textContent = '.barra-busca{position:relative;display:grid;gap:var(--s2);min-width:0}' +
      '.barra-linha{display:flex;flex-wrap:wrap;align-items:center;gap:var(--s2) var(--s3);min-width:0}' +
      '.barra-linha>.busca{flex:1 1 240px;width:auto;min-width:0}' +
      '.barra-linha select{flex:0 1 300px;width:auto}' +   // o nome "Município" fica só para o leitor de tela (.vh)
      '@media (max-width:640px){.barra-linha select{flex:1 1 100%}}' +   // celular: o município numa linha só dele
      '.barra-busca>.ativo-hit{margin:0;grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr))}' +
      '.barra-busca~.stage .ferramentas{margin-top:0}';   // a busca saiu do painel: o NAE não encosta mais nela
    document.head.append(s);
  }
  const tm = M.trecho_mun || {};
  function aplica(mexeu) {
    const vis = window.__visivel || {}, fm = (document.getElementById('f-mun') || {}).value || '';
    let grp = null, n = 0;                               // título de grupo: conta só as linhas à vista; sem nenhuma, some junto
    const fechaGrp = () => {
      if (!grp) return;
      grp.hidden = !n;
      const tit = grp.dataset.tit ?? (grp.dataset.tit = grp.textContent.replace(/ · [\d.]+$/, ''));
      const txt = `${tit} · ${mil(n)}`;
      if (grp.textContent !== txt) grp.textContent = txt;
    };
    [...lista.children].forEach(r => {
      if (r.classList.contains('grp')) { fechaGrp(); grp = r; n = 0; return; }
      if (!r.classList.contains('row')) return;
      const t = r.dataset.t;
      r.hidden = !(vis[t.split('-')[0]] !== false && (!fm || (tm[t] || []).includes(fm)));
      n += r.hidden ? 0 : 1;
    });
    fechaGrp();
    if (window.__tabLista) window.__tabLista();          // a parada do Tab na lista passa para uma linha à vista
    const m = mexeu === true && lista.querySelector('.row[aria-current="true"]:not([hidden])');
    if (m) {                                             // filtro trocado: o trecho escolhido continua à vista na lista
      const q = lista.getBoundingClientRect(), r = m.getBoundingClientRect();
      if (r.top < q.top + 32 || r.bottom > q.bottom) lista.scrollTop += r.top - q.top - 40;
    }
  }
  f.addEventListener('change', () => aplica(true));
  const cls = document.getElementById('classes');      // o clique do mapa (alimentador.js) já trocou o __visivel
  if (cls) cls.addEventListener('click', e => { if (e.target.closest('button')) aplica(true); });
  new MutationObserver(ms => {
    if (ms.some(m => m.type === 'childList' && m.target === lista)) aplica();   // lista refeita (não a contagem dos títulos)
    const s = [...lista.querySelectorAll('.row[aria-current="true"]')].map(b => b.dataset.t);
    document.getElementById('mig-trecho').innerHTML = s.length ? sep + esc(s.join(' + ')) : '';
  }).observe(lista, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-current'] });
  aplica();

  // NAE só de vegetação: deixa isso escrito no seletor de mês
  const labMes = document.querySelector('label[for="mes"]');
  if (labMes && (M.origem || {}).nae_filtro === 'arvore') labMes.firstChild.textContent = 'NAE árvore/eucalipto em ';

  // resumo por classe, avisos de dados e origem: tudo em "Dados", fechado
  const r = M.resumo || {};
  const v = M.validacao || { avisos: [] };
  const o = M.origem || {};
  const box = document.createElement('details');
  box.className = 'dados';
  box.innerHTML = `<summary>Dados${v.avisos.length ? '<em class="selo">com avisos</em>' : ''}</summary>` +
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
  const kmz = document.createElement('p');
  kmz.className = 'origem kmz';
  kmz.innerHTML = `<a href="${esc(M.al)}-trechos.kmz" download>Baixar o KMZ (Google Earth)</a>`;
  box.before(kmz);
  const foot = document.querySelector('.foot');
  if (foot) box.append(foot);
  // "Como os trechos são divididos" vai para o rodapé da página, depois do mapa e do painel (pedido do painel)
  const regra = document.querySelector('header .regra'), wrap = document.querySelector('.wrap');
  if (regra && wrap) { regra.classList.add('rodape'); wrap.append(regra); }

  // abre enquadrado na parte do município escolhido
  if (mun && window.__map && window.L) {
    const pts = [];
    D.vaos.forEach(x => { if ((tm[D.trechos[x[4]].nome] || []).includes(mun.cod)) pts.push([x[0], x[1]], [x[2], x[3]]); });
    if (pts.length) window.__map.fitBounds(L.latLngBounds(pts), { padding: [20, 20] });
  }

  // marcador de um ativo no mapa (busca da página inicial ou da lista): um só por vez
  let marcaAtivo = null;
  function poeAtivo(ll, cod) {
    const map = window.__map;
    if (!map || !window.L) return;
    if (marcaAtivo) marcaAtivo.remove();
    marcaAtivo = L.marker(ll, { interactive: false, zIndexOffset: 1000, icon: L.divIcon({ className: '', iconSize: null,
      html: `<div class="ie ativo"><em>ATIVO</em>${esc(cod)}</div>` }) }).addTo(map);
    map.setView(ll, Math.max(map.getZoom(), 16), { animate: false });
  }

  // busca da lista: código de transformador ou de chave que não abre nem fecha trecho (índice dados/ativos, o mesmo da
  // busca da página inicial; baixa só o pedaço do código). Achados deste alimentador aparecem acima da lista.
  const campo = document.getElementById('busca');
  if (campo && lista) {
    const TIPO = { DJ: 'Disjuntor', '79': 'Religador', '03': 'Fusível 03', '33': 'Fusível 33', '02': 'Chave 02', '88': 'Chave faca 88',
      '40': 'Trip saver 40', '41': 'Trip saver 41', SEC: 'Fusível (seccionamento)', FTR: 'Fusível no tronco', TR: 'Transformador',
      ET: 'Transformador', EP: 'Transformador particular', Capacitor: 'Banco de capacitor', Regulador: 'Regulador de tensão',
      Chave: 'Chave', ChaveNA: 'Chave NA' };
    const chave = s => { const k = String(s).toUpperCase().replace(/[^0-9A-Z]/g, ''); return /^\d+$/.test(k) ? (k.replace(/^0+/, '') || '0') : k; };
    const fatia = k => { let h = 0; for (let i = 0; i < k.length; i++) h = (Math.imul(h, 31) + k.charCodeAt(i)) >>> 0; return (h % 256).toString(16).padStart(2, '0'); };
    const cache = {};
    const baixa = x => cache[x] || (cache[x] = fetch(`../../dados/ativos/${x}.json`).then(r => r.ok ? r.json() : {}).catch(() => { delete cache[x]; return {}; }));
    const box = document.createElement('div');
    box.className = 'ativo-hit';
    box.setAttribute('aria-live', 'polite');
    barra ? barra.append(box) : lista.before(box);       // embaixo da barra de busca (na largura toda) ou acima da lista
    let pedido = 0, espera = null;
    campo.addEventListener('input', () => {
      clearTimeout(espera);
      box.innerHTML = '';
      const txt = campo.value.trim(), k = chave(txt), meu = ++pedido;
      if (k.length < 4) return;
      espera = setTimeout(async () => {
        const d = await baixa(fatia(k));
        if (meu !== pedido) return;                      // o texto mudou enquanto baixava
        const hits = (d[k] || []).filter(h => h[0] === M.al && h[1] !== 'poste');   // poste: a própria lista já acha
        box.innerHTML = hits.map(([, tipo, t, papel, lat, lon]) =>
          `<button type="button" data-t="${esc(t)}" data-ll="${lat},${lon}" data-a="${esc(txt)}"><b>${esc(TIPO[tipo] || 'Chave ' + tipo)} ${esc(txt)}</b>` +
          `<span>${esc(papel)}</span><span class="ir">${t ? 'Ver ' + esc(t) + ' no mapa' : 'Ver no mapa'} →</span></button>`).join('');
      }, 250);
    });
    box.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.t && window.__sel) window.__sel(b.dataset.t, false);
      poeAtivo(b.dataset.ll.split(',').map(Number), b.dataset.a);
    });
  }

  // sem os botões + e − do mapa (pedido do painel): o zoom fica no gesto de pinça, na roda do mouse e no duplo clique
  if (window.__map && window.__map.zoomControl) window.__map.removeControl(window.__map.zoomControl);

  // canto superior direito do mapa: o card T1 T2 T3 e, embaixo dele, o menu "Camadas ▾" com Faixa (limpeza.js), Inspeção
  // (inspecao.js), Insp→manut (manutencao.js) e Manutenção (executadas.js). Devolve a lista do menu (criada na 1ª chamada),
  // onde cada camada põe o seu card; sem o card das classes (mapa não carregou), devolve null.
  // O Tela cheia fica no canto inferior direito (telacheia.js), com o mesmo card (.ctl-card).
  window.__ctlMapa = function () {
    const cls = document.getElementById('classes');
    let dir = document.querySelector('.ctl-dir');
    if (!dir) {
      if (!cls) return null;
      dir = document.createElement('div');
      dir.className = 'ctl-dir';
      cls.before(dir);
      const cam = document.createElement('div');
      cam.className = 'ctl-cam';
      cam.hidden = true;                                   // aparece com a 1ª camada
      cam.innerHTML = '<div class="ctl-card"><button type="button" class="ctl-cam-b" aria-expanded="false" aria-controls="ctl-camadas" ' +
        'title="Ligar ou desligar as camadas do mapa">Camadas<span class="ctl-cam-n"></span><span class="ctl-cam-cores" aria-hidden="true"></span>' +
        '<svg class="ctl-cam-v" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4"/></svg></button></div>' +
        '<div class="ctl-l ctl-l2" id="ctl-camadas" role="group" aria-label="Camadas do mapa" hidden></div>';
      const l = cam.querySelector('.ctl-l2'), b = cam.querySelector('.ctl-cam-b');
      if (window.L) L.DomEvent.disableClickPropagation(cam);
      cam.addEventListener('click', e => e.stopPropagation());   // clique no menu não chega ao mapa (que limparia a seleção)
      // o menu fica aberto ao ligar uma camada (dá para ligar várias); fecha no botão, no Esc, fora dele ou saindo com o Tab
      const abre = sim => { l.hidden = !sim; b.setAttribute('aria-expanded', String(sim)); };
      b.addEventListener('click', () => abre(l.hidden));
      document.addEventListener('keydown', e => {          // antes do Esc da tela cheia: fecha só o menu
        if (e.key !== 'Escape' || l.hidden) return;
        e.stopPropagation();
        if (cam.contains(document.activeElement)) b.focus();
        abre(false);
      }, true);
      document.addEventListener('pointerdown', e => { if (!l.hidden && !cam.contains(e.target)) abre(false); }, true);
      cam.addEventListener('focusout', e => { if (e.relatedTarget && !cam.contains(e.relatedTarget)) abre(false); });
      // o botão mostra quantas camadas estão ligadas e as cores delas (o traço colorido de cada botão)
      const conta = () => {
        const on = [...l.querySelectorAll('button[aria-pressed="true"]')];
        cam.hidden = !l.children.length;
        b.querySelector('.ctl-cam-n').textContent = on.length ? ' · ' + on.length : '';
        b.querySelector('.ctl-cam-cores').innerHTML = on.map(x => {
          const g = getComputedStyle(x).backgroundImage;
          return g && g !== 'none' ? `<i style="background-image:${g.replace(/"/g, "'")}"></i>` : '';
        }).join('');
      };
      new MutationObserver(conta).observe(l, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
      dir.append(cls, cam);
    }
    return dir.querySelector('.ctl-l2');
  };
  // balão do mapa: o Leaflet desenha os balões por baixo dos cards do canto (que ficam fora do mapa), então o balão
  // aberto perto do alto empurra o mapa até ficar abaixo deles (folga de cima = altura dos cards; com o menu aberto, até o fim dele)
  window.__folgaBalao = () => {
    const dir = document.querySelector('.ctl-dir'), m = document.getElementById('map');
    if (!dir || !m) return [20, 20];
    const l = dir.querySelector('.ctl-l2'), fim = Math.max(dir.getBoundingClientRect().bottom, l && !l.hidden ? l.getBoundingClientRect().bottom : 0);
    return [20, Math.max(20, Math.round(fim - m.getBoundingClientRect().top) + 12)];
  };
  // as camadas se combinam livremente (Faixa, Inspeção, Insp→manut e Manutenção, quantas quiser ao mesmo tempo)
  {
    const s = document.createElement('style');
    s.textContent = '.ctl-dir{position:absolute;right:12px;top:12px;z-index:810;display:flex;flex-direction:column;align-items:flex-end;gap:var(--s2);max-width:calc(100% - 76px)}' +
      '.ctl-dir>.classes{position:static}' +
      '.ctl-l{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:var(--s2)}.ctl-l:empty{display:none}' +
      '.ctl-card{display:flex;padding:var(--s1);background:var(--vidro);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);border:1px solid var(--vidro-borda);border-radius:var(--r2);box-shadow:var(--sh-vidro)}' +
      '.ctl-card button{display:inline-flex;align-items:center;gap:6px;font:600 var(--t-sm)/1 var(--f-mono);padding:0 var(--s3);border:0;border-radius:var(--r1);background-color:transparent;' +
      'color:var(--vidro-fg);cursor:pointer;min-width:40px;min-height:40px;white-space:nowrap}' +
      '.ctl-card button:hover{background-color:var(--vidro-hover)}.ctl-card button:focus-visible{outline:2px solid var(--foco-mapa);outline-offset:1px}' +
      '@media (prefers-reduced-motion:no-preference){.ctl-card button{transition:background-color var(--dur) var(--ease),opacity var(--dur) var(--ease)}}' +
      // menu Camadas: o botão (com o número e as cores das ligadas) e, embaixo, a lista solta sobre o mapa
      '.ctl-cam{position:relative;display:flex;flex-direction:column;align-items:flex-end}' +
      '.ctl-cam-n{font-variant-numeric:tabular-nums}.ctl-cam-cores{display:inline-flex;gap:2px}.ctl-cam-cores:empty{display:none}' +
      '.ctl-cam-cores i{width:12px;height:4px;border-radius:2px;box-shadow:0 0 0 1px #0006}' +
      '@media (max-width:640px){.ctl-cam-cores{display:none}}' +   // celular: só o número (o card estreito deixa lugar às legendas)
      '.ctl-cam-v{flex:none;width:10px;height:6px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;opacity:.85}.ctl-cam-b[aria-expanded=true]{background-color:var(--vidro-hover)}.ctl-cam-b[aria-expanded=true] .ctl-cam-v{transform:rotate(180deg)}' +
      '.ctl-l2{position:absolute;top:calc(100% + var(--s1));right:0;flex-direction:column;flex-wrap:nowrap;gap:2px;min-width:200px;max-width:calc(100vw - 24px);padding:var(--s1);' +
      'background:var(--vidro);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);border:1px solid var(--vidro-borda);border-radius:var(--r2);box-shadow:var(--sh-vidro)}' +
      '.ctl-l2>.ctl-card{display:block;padding:0;background:none;-webkit-backdrop-filter:none;backdrop-filter:none;border:0;border-radius:0;box-shadow:none}' +
      // cada camada é uma linha inteira: caixa de marcar à esquerda, o filete colorido embaixo do nome (o de cada camada)
      '.ctl-l2 .ctl-card button{width:100%;justify-content:flex-start;gap:var(--s2);padding:0 var(--s3) 0 var(--s2);background-size:calc(100% - 40px) 3px;background-position:32px 100%}' +
      '.ctl-l2 .ctl-card button[aria-pressed=false]{text-decoration:none;box-shadow:none}' +
      '.ctl-l2 .ctl-card button::before{content:"";flex:none;display:grid;place-items:center;width:16px;height:16px;box-sizing:border-box;border:1.5px solid currentColor;border-radius:4px;' +
      'font:700 12px/1 var(--f-body);color:inherit}' +
      '.ctl-l2 .ctl-card button[aria-pressed=true]::before{content:"✓";background:var(--vidro-fg);border-color:var(--vidro-fg);color:#0b0f14}' +
      '@media (prefers-reduced-motion:no-preference){.ctl-cam-v{transition:transform var(--dur) var(--ease)}}';
    document.head.append(s);
  }

  // vindo da busca de ativo da página inicial (?t=trecho&a=código&ll=lat,lon): seleciona o trecho e marca o ativo.
  // Espera o load para a limpeza de faixa (scripts seguintes) também pintar a seleção.
  const pq = new URLSearchParams(location.search), tq = pq.get('t'), ll = (pq.get('ll') || '').split(',').map(Number);
  const temT = tq && window.__sel && D.trechos.some(t => t.nome === tq), temLL = ll.length === 2 && ll.every(Number.isFinite);
  if (temT || temLL) addEventListener('load', () => {    // ativo longe da rede: só o marcador
    if (temT) window.__sel(tq, !temLL);                  // com o ponto do ativo, o mapa vai até ele (sem animar até o trecho)
    if (temLL) poeAtivo(ll, pq.get('a') || '');
  });

  // ordem do painel: resumo (ou detalhe do trecho) primeiro, depois o mês do NAE, os blocos das camadas ligadas
  // (Faixa, Inspeção, Insp→manut, Manutenção) e só então a lista. Os blocos entram pelos scripts seguintes: arruma
  // quando todos já rodaram (DOMContentLoaded, na mesma volta que mostra o painel: a ordem antiga não chega a aparecer)
  const ordena = () => {
    const det = document.getElementById('det');
    if (!det || !lista) return;
    let ult = det;
    const poe = el => {                                  // só o que está no painel (busca e município ficam onde estão)
      if (!el || el.parentElement !== det.parentElement) return;
      if (el !== ult.nextElementSibling) ult.after(el);
      ult = el;
    };
    poe(document.getElementById('ferramentas'));
    document.querySelectorAll('.panel>.limp-card').forEach(poe);
    poe(lista);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ordena); else ordena();
})();
