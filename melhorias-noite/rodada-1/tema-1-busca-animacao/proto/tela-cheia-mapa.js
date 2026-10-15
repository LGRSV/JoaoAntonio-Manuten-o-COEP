// PROTÓTIPO s3: botão de TELA CHEIA do mapa da página inicial (o #mapa-to inteiro: barra com a lupa e a trilha + mapa + painel esquerdo).
// Mesma lógica do telacheia.js da página do alimentador: usa a tela cheia do navegador quando existe; no iPhone (sem a função) o mapa
// ocupa a janela por CSS (.tc-mapa); Esc / saída nativa desfazem; a rolagem da página volta ao lugar. O telacheia.js em si não serve
// direto (depende do Leaflet: window.__map, invalidateSize, gaveta do painel), mas dá para extrair dele esta função comum.
(function () {
  const raiz = document.getElementById('mapa-to'), caixa = raiz && raiz.querySelector('.mt-mapa');
  if (!caixa || caixa.querySelector('.mt-tc')) return;
  const ABRE = '<svg class="abre" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
  const SAI = '<svg class="sai" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'mt-tc';
  b.setAttribute('aria-pressed', 'false');
  b.title = 'Tela cheia';
  b.setAttribute('aria-label', 'Mapa em tela cheia');
  b.innerHTML = ABRE + SAI;                       // os dois ícones ficam no botão e o CSS mostra um ou outro (como no telacheia.js)
  caixa.append(b);
  const nativo = () => document.fullscreenElement || document.webkitFullscreenElement;
  const ligado = () => document.body.classList.contains('tc-mapa');
  let y = 0, nivelAntes = false;
  function aplica(on) {
    if (ligado() === on) return;
    if (on) y = window.scrollY;
    raiz.classList.toggle('tc-mapa', on);
    document.body.classList.toggle('tc-mapa', on);
    b.setAttribute('aria-pressed', String(on));
    b.title = on ? 'Sair da tela cheia (Esc)' : 'Tela cheia';
    b.setAttribute('aria-label', on ? 'Sair da tela cheia' : 'Mapa em tela cheia');
    if (!on) requestAnimationFrame(() => window.scrollTo(0, y));
    window.dispatchEvent(new Event('resize'));     // o mapa reenquadra no tamanho novo
  }
  b.addEventListener('click', () => {
    if (!ligado()) {
      const req = raiz.requestFullscreen || raiz.webkitRequestFullscreen;
      if (req) { try { const p = req.call(raiz); if (p && p.catch) p.catch(() => {}); } catch (e) { /* sem tela cheia nativa: fica só o CSS */ } }
      aplica(true);
    } else {
      if (nativo()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      aplica(false);
    }
  });
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, () => { if (!nativo()) aplica(false); }));
  // tela cheia só por CSS (sem a nativa): o primeiro Esc sobe um nível do mapa (quem trata é mapa-municipios.js); sem nível aberto, sai
  document.addEventListener('keydown', e => { if (e.key === 'Escape') nivelAntes = raiz.classList.contains('aberta'); }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && ligado() && !nativo() && !nivelAntes && !e.defaultPrevented) aplica(false); });
})();
