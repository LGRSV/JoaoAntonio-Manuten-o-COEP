// Sugestão 4 (protótipo): "voar até". (a) Lista "Maiores NAE" ao lado esquerdo do mapa do estado: passar o mouse acende o município,
// clicar leva o mapa até ele (zoom livre). (b) Na busca da lupa, ao marcar um município (setas) ou quando ele é o primeiro resultado,
// o mapa já voa até ele; Enter continua abrindo a página do município. Depende de window.ARGOSMapa e window.MUN.
(function () {
  const A = window.ARGOSMapa, M = window.MUN, caixa = document.querySelector('.mt-mapa');
  if (!A || !M || !caixa) return;
  const porNome = Object.fromEntries(M.muns.map(m => [m.nome, m]));
  const top = M.muns.filter(m => m.slug && m.nae).sort((a, b) => b.nae - a.nae).slice(0, 8);
  const box = document.createElement('nav');
  box.className = 'mt-top';
  box.setAttribute('aria-label', 'Municípios com maior NAE');
  box.innerHTML = '<b class="mt-top-t">Maiores NAE</b>' + top.map((m, i) =>
    `<button type="button" data-cod="${m.cod}"><span class="n">${i + 1}</span><span class="nm">${m.nome}</span><i>${m.nae.toLocaleString('pt-BR')}</i></button>`).join('');
  caixa.append(box);
  const st = document.createElement('style');
  st.textContent = `.mt-top{position:absolute;left:0;top:0;z-index:3;display:grid;gap:2px;width:228px;padding:var(--s2);border:1px solid var(--line);border-radius:var(--r2);background:var(--paper);box-shadow:var(--sh1)}
.mt-mapa.aberta .mt-top{display:none}
.mt-top-t{padding:2px 6px 6px;font:700 var(--t-sm) var(--f-body)}
.mt-top button{display:grid;grid-template-columns:18px minmax(0,1fr) auto;gap:var(--s2);align-items:center;min-height:32px;padding:0 6px;border:0;border-radius:var(--r1);background:none;color:var(--fg);font:500 var(--t-sm) var(--f-body);text-align:left;cursor:pointer}
.mt-top button:hover,.mt-top button.on{background:var(--hover);color:var(--accent)}
.mt-top .n{font:600 var(--t-xs) var(--f-mono);color:var(--muted)}.mt-top .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mt-top i{font:700 var(--t-xs) var(--f-mono);font-style:normal;padding:2px 6px;border-radius:5px;background:#b8431f;color:#fff;font-variant-numeric:tabular-nums}
@media (max-width:860px){.mt-top{display:none}}`;
  document.head.append(st);
  const mun = cod => document.querySelector(`.mt-mapa .mun[data-cod="${cod}"]`);
  const acende = cod => document.querySelectorAll('.mt-mapa .mun.acende').forEach(p => p.classList.remove('acende')) || (cod && mun(cod) && mun(cod).classList.add('acende'));
  box.addEventListener('mouseover', e => { const b = e.target.closest('button'); acende(b && b.dataset.cod); });
  box.addEventListener('mouseleave', () => acende(null));
  box.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    box.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    A.voaPara(b.dataset.cod, .5);
  });
  // busca da lupa
  const res = document.getElementById('ativo-res');
  if (res) {
    let ultimo = null;
    new MutationObserver(() => {
      const ops = [...res.querySelectorAll('.sug-op')].filter(o => o.querySelector('b.nome'));
      const o = ops.find(x => x.classList.contains('marcado')) || ops[0], m = o && porNome[o.querySelector('b.nome').textContent];
      const cod = m ? m.cod : null;
      if (cod === ultimo) return;
      ultimo = cod;
      if (cod) { acende(cod); A.voaPara(cod, .45); } else { acende(null); if (A.ativo() && !res.querySelector('.sug-op')) A.enquadra(); }
    }).observe(res, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }
})();
