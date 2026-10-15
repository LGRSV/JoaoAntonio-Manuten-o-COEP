// Página inicial · tela cheia do mapa e botão Voltar do navegador (um nível do mapa por passo).
// Arquivo novo, carregado DEPOIS de busca-ativo.js. Só usa o que mapa-municipios.js já expõe: window.ARGOS_MAPA (nivel, vai)
// e o evento 'argos-nivel' (disparado a cada mudança de nível). Não altera nenhum outro arquivo.
//
// 1) TELA CHEIA: botão no canto superior direito do mapa leva o #mapa-to inteiro (barra com a busca e a trilha + mapa + legenda)
//    para a tela cheia. Usa a API do navegador (com prefixo webkit); sem ela (iPhone) ou se ela for negada (iframe), o mapa ocupa
//    a janela só por CSS (.tc-mapa). Sair: botão, F, Esc (nativo: o próprio navegador; só CSS: Esc sai primeiro, depois sobe nível).
//    No modo só CSS o gesto Voltar do celular também sai da tela cheia antes de subir um nível (uma entrada "sentinela" no histórico).
// 2) VOLTAR: cada nível do mapa tem um endereço (#centro, #centro/palmas, #centro/palmas/palmas, #centro/palmas/palmas/LD02059122).
//    Descer empilha uma entrada no histórico; Voltar/Avançar do navegador (e o gesto do celular) sobem e descem o mapa; subir pela
//    seta ←, Esc ou trilha reaproveita o Voltar (não empilha), então Esc seguido de Voltar nunca "desce" de novo. Abrir um link
//    com o endereço leva o mapa direto ao nível certo; endereço inválido cai no nível válido mais fundo e é corrigido na barra.
(function () {
  const A = window.ARGOS_MAPA, M = window.MUN;
  const raiz = document.getElementById('mapa-to'), caixa = raiz && raiz.querySelector('.mt-mapa');
  if (!A || !M || !raiz || !caixa || caixa.querySelector('.mt-tc')) return;
  const TITULO = 'ARGOS Manutenção';

  // ---------- endereço de cada nível ----------
  const sa = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const muns = M.muns.filter(m => m.slug), porCod = Object.fromEntries(muns.map(m => [m.cod, m])), porSlug = Object.fromEntries(muns.map(m => [m.slug, m]));
  const regDe = Object.fromEntries(Object.keys(M.regs || {}).map(r => [sa(r), r]));
  const hashDe = n => {                                       // {reg, pol, mun, al} do mapa → '#centro/palmas/palmas/LD02059122'
    if (!n || !n.reg) return '';
    const s = [sa(n.reg)];
    if (n.pol) { s.push(sa(n.pol)); if (n.mun && porCod[n.mun]) { s.push(porCod[n.mun].slug); if (n.al) s.push(n.al); } }
    return '#' + s.join('/');
  };
  function alvoDe(h) {                                        // '#…' → { reg, polo, cod, al } no nível válido mais fundo ({} se não for do mapa)
    let s;
    try { s = decodeURIComponent(h.replace(/^#\/?/, '')).split('/').filter(Boolean); } catch (e) { return {}; }
    const q = i => String(s[i] || '').toLowerCase();                  // maiúsculas e minúsculas tanto faz
    const reg = regDe[q(0)];
    if (!reg) return {};
    const m = muns.find(x => x.reg === reg && sa(x.polo) === q(1));
    if (!m) return { reg };
    const polo = m.polo, mu = porSlug[q(2)];
    if (!mu || mu.polo !== polo) return { reg, polo };
    const al = (mu.als.find(a => a.cod.toLowerCase() === q(3)) || {}).cod;
    return al ? { reg, polo, cod: mu.cod, al } : { reg, polo, cod: mu.cod };
  }
  const nivelDe = a => ({ reg: a.reg, pol: a.polo, mun: a.cod, al: a.al });
  const tituloDe = n => {
    const m = n.mun && porCod[n.mun];
    return (n.al || (m && m.nome) || (n.pol && 'Polo ' + n.pol) || (n.reg && 'Regional ' + n.reg) || '') ;
  };
  const poeTitulo = n => { const t = tituloDe(n); document.title = t ? `${t} · ${TITULO}` : TITULO; };
  const url = h => h || location.pathname + location.search;

  // ---------- tela cheia ----------
  const ABRE = '<svg class="abre" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
  const SAI = '<svg class="sai" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mt-tc';
  btn.setAttribute('aria-pressed', 'false');
  btn.title = 'Tela cheia (F)';
  btn.setAttribute('aria-label', 'Mapa em tela cheia');
  btn.innerHTML = ABRE + SAI;                                 // os dois ícones ficam no botão e o CSS mostra um (aria-pressed): trocar o HTML no clique soltava o alvo
  caixa.append(btn);
  const nativo = () => document.fullscreenElement || document.webkitFullscreenElement;
  const ligado = () => raiz.classList.contains('tc-mapa');
  let y = 0, soCss = false, saiuEm = -1e9;
  const poeY = () => window.scrollTo(0, y);
  function aplica(on) {
    if (ligado() === on) return;
    if (on) y = window.scrollY;
    raiz.classList.toggle('tc-mapa', on);
    document.body.classList.toggle('tc-mapa', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.title = on ? 'Sair da tela cheia (Esc)' : 'Tela cheia (F)';
    btn.setAttribute('aria-label', on ? 'Sair da tela cheia' : 'Mapa em tela cheia');
    if (!on) { requestAnimationFrame(poeY); setTimeout(poeY, 150); }   // a saída nativa muda o tamanho da janela um instante depois
  }
  const sentinela = () => !!(history.state && history.state.sentinela);
  function soPorCss() {                                       // sem tela cheia do navegador: o Voltar do celular sai antes de subir um nível
    soCss = true;
    if (!sentinela()) history.pushState({ prev: ultimo, tc: true, sentinela: true }, '', location.href);
  }
  function entraTC() {
    if (ligado()) return;
    aplica(true);
    const req = raiz.requestFullscreen || raiz.webkitRequestFullscreen;
    if (!req) { soPorCss(); return; }
    try { const p = req.call(raiz); if (p && p.then) p.then(null, soPorCss); } catch (e) { soPorCss(); }
  }
  function saiTC() {
    if (!ligado()) return;
    if (nativo()) { try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) { /* o fullscreenchange refaz o layout */ } }
    aplica(false);
    if (soCss) { soCss = false; if (sentinela()) history.back(); }
  }
  btn.addEventListener('click', () => (ligado() ? saiTC() : entraTC()));
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, () => {
    if (nativo()) return;
    saiuEm = performance.now();
    aplica(false); poeY();
  }));
  // Esc: na tela cheia só por CSS ele sai da tela cheia (como o nativo) em vez de subir um nível; com a lista da busca aberta ela fecha primeiro.
  // No nativo o navegador consome o Esc; se ele chegar à página logo depois da saída, é engolido (senão subiria um nível junto).
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (performance.now() - saiuEm < 250) { e.stopImmediatePropagation(); return; }
    if (ligado() && soCss && !nativo() && !document.querySelector('#ativo-res:not(:empty)')) { e.preventDefault(); e.stopImmediatePropagation(); saiTC(); }
  }, true);
  document.addEventListener('keydown', e => {
    if ((e.key !== 'f' && e.key !== 'F') || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.repeat || e.defaultPrevented) return;
    if (e.target.closest && e.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    e.preventDefault();
    ligado() ? saiTC() : entraTC();
  });

  // ---------- histórico ----------
  let ultimo = location.hash, aplicando = 0, espera = 0;
  const vai0 = A.vai;
  async function restaura(a) {
    if (a.al) { await vai0({ cod: a.cod }); await vai0({ al: a.al }); }   // o município do endereço primeiro (o alimentador por si só abriria no de mais km)
    else await vai0(a.cod ? { cod: a.cod } : a.polo ? { polo: a.polo } : a.reg ? { reg: a.reg } : {});
  }
  function leva(h) {                                          // leva o mapa ao endereço (sem empilhar) e corrige a barra se o que abriu não for o pedido
    const a = alvoDe(h), alvo = hashDe(nivelDe(a));
    ultimo = alvo;
    aplicando++;
    return restaura(a).catch(() => {}).finally(() => {
      aplicando--;
      const n = A.nivel(), real = hashDe(n);
      poeTitulo(n);
      if (!aplicando && (real !== ultimo || location.hash !== real)) { history.replaceState(history.state, '', url(real)); ultimo = real; }   // endereço inválido ou fora do padrão: a barra mostra o que abriu
    });
  }
  function sincroniza() {                                     // o mapa mudou por clique/Esc/busca: reflete no histórico
    if (aplicando) return;
    const n = A.nivel(), h = hashDe(n);
    poeTitulo(n);
    if (h === ultimo) return;
    const st = history.state || {}, antes = ultimo;
    ultimo = h;
    if (st.prev === h) { history.back(); return; }            // subiu para o nível de onde veio: usa o Voltar em vez de empilhar
    history.pushState({ prev: antes, tc: soCss && ligado() }, '', url(h));
  }
  const agenda = () => { clearTimeout(espera); espera = setTimeout(sincroniza, 0); };
  document.addEventListener('argos-nivel', () => { if (!aplicando) agenda(); });
  // a busca (e qualquer chamada de ARGOS_MAPA.vai) voa por vários níveis de uma vez: uma só entrada no histórico, no fim
  A.vai = async a => { aplicando++; try { return await vai0(a); } finally { aplicando--; agenda(); } };
  window.addEventListener('popstate', e => {
    if (ligado() && soCss && !(e.state && e.state.tc)) { aplica(false); soCss = false; }   // Voltar saiu da tela cheia só por CSS
    const alvo = hashDe(nivelDe(alvoDe(location.hash)));
    if (alvo !== ultimo) leva(location.hash);
  });
  if (alvoDe(location.hash).reg) leva(location.hash); else ultimo = '';
})();
