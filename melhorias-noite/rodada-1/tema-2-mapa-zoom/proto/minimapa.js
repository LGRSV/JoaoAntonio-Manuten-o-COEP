// Sugestão 5 (protótipo): mini-mapa de orientação. Aparece quando o mapa do estado está aproximado (≥ 1,5×) e mostra o Tocantins
// inteiro com um retângulo do que está na tela; clicar ou arrastar nele leva o mapa até lá. Depende de window.ARGOSMapa (zoom livre).
(function () {
  const A = window.ARGOSMapa, M = window.MUN, caixa = document.querySelector('.mt-mapa');
  if (!A || !M || !caixa) return;
  const NS = 'http://www.w3.org/2000/svg', VB = [-6, -6, M.w + 12, M.h + 12];
  const box = document.createElement('div');
  box.className = 'mt-mini'; box.hidden = true;
  box.setAttribute('aria-hidden', 'true');
  box.innerHTML = `<svg viewBox="${VB.join(' ')}"><g class="c">${Object.values(M.regs || {}).map(d => `<path d="${d}"/>`).join('')}</g><rect class="r"/></svg>`;
  caixa.append(box);
  const svg = box.querySelector('svg'), rect = box.querySelector('.r');
  const st = document.createElement('style');
  st.textContent = `.mt-mini{position:absolute;right:0;top:172px;z-index:4;width:76px;padding:6px;border:1px solid var(--line);border-radius:var(--r2);background:var(--paper);box-shadow:var(--sh1);cursor:crosshair;touch-action:none}
.mt-mini[hidden]{display:none}.mt-mapa .mt-mini svg{display:block;width:100%;height:auto;min-height:0;max-height:none;margin:0;overflow:visible}
.mt-mini .c path{fill:var(--mt-tem);stroke:var(--mt-borda);stroke-width:1;vector-effect:non-scaling-stroke}
.mt-mini .r{fill:rgb(240 138 93 / .18);stroke:var(--accent);stroke-width:1.5;vector-effect:non-scaling-stroke}`;
  document.head.append(st);
  function atualiza() {
    const v = A.vista(), pode = A.ativo() && !/aberta/.test(caixa.className) && VB[2] / v[2] > 1.5;
    box.hidden = !pode;
    if (!pode) return;
    const x = Math.max(v[0], VB[0]), y = Math.max(v[1], VB[1]), x2 = Math.min(v[0] + v[2], VB[0] + VB[2]), y2 = Math.min(v[1] + v[3], VB[1] + VB[3]);
    [['x', x], ['y', y], ['width', Math.max(2, x2 - x)], ['height', Math.max(2, y2 - y)]].forEach(([k, n]) => rect.setAttribute(k, n.toFixed(1)));
  }
  A.aoMudar(atualiza);
  const vai = e => {
    const r = svg.getBoundingClientRect();
    A.centraEm(VB[0] + (e.clientX - r.left) / r.width * VB[2], VB[1] + (e.clientY - r.top) / r.height * VB[3]);
  };
  let arrasta = false;
  box.addEventListener('pointerdown', e => { arrasta = true; box.setPointerCapture(e.pointerId); vai(e); e.preventDefault(); });
  box.addEventListener('pointermove', e => { if (arrasta) vai(e); });
  box.addEventListener('pointerup', () => { arrasta = false; });
})();
