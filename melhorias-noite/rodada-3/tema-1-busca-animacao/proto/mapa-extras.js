// Página inicial · botão Voltar do navegador (um nível do mapa por passo) e extras da tela cheia do mapa.
// Arquivo novo, carregado DEPOIS de busca-ativo.js (scripts/gera_trechos.py poria a tag). Só usa o que mapa-municipios.js já
// expõe: window.ARGOS_MAPA (nivel, vai), window.MUN e o evento 'argos-nivel' (disparado a cada mudança de nível), mais o botão
// .mt-tc e a classe .mt-cheia que o próprio mapa-municipios.js controla. Nenhum outro JavaScript muda.
//
// 1) VOLTAR: cada nível do mapa tem um endereço (#centro, #centro/palmas, #centro/palmas/palmas, #centro/palmas/palmas/LD02059122).
//    Descer empilha uma entrada no histórico; Voltar/Avançar do navegador (e o gesto do celular) sobem e descem o mapa; subir pela
//    seta ←, Esc ou trilha reaproveita o Voltar (não empilha), então Esc seguido de Voltar nunca "desce" de novo. Abrir um link
//    com o endereço leva o mapa direto ao nível certo; endereço inválido cai no nível válido mais fundo e é corrigido na barra.
// 2) TELA CHEIA (só o que o mapa-municipios.js ainda não faz): tecla F liga e desliga; no modo só CSS (iPhone, iframe sem permissão)
//    o Esc sai da tela cheia ANTES de subir um nível (como o navegador faz no modo nativo) e o gesto Voltar do celular também sai
//    da tela cheia antes de subir (uma entrada "sentinela" no histórico).
(function () {
  const A = window.ARGOS_MAPA, M = window.MUN;
  const raiz = document.getElementById('mapa-to'), caixa = raiz && raiz.querySelector('.mt-mapa');
  if (!A || !M || !raiz || !caixa || window.ARGOS_EXTRAS) return;
  window.ARGOS_EXTRAS = true;
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
    return n.al || (m && m.nome) || (n.pol && 'Polo ' + n.pol) || (n.reg && 'Regional ' + n.reg) || '';
  };
  const poeTitulo = n => { const t = tituloDe(n); document.title = t ? `${t} · ${TITULO}` : TITULO; };
  const url = h => h || location.pathname + location.search;
  // history.pushState/replaceState/back podem lançar (iframe sandbox da cópia no Artifact, origem 'null'): o mapa funciona igual, só sem histórico
  const seguro = f => { try { return f(); } catch (e) { return undefined; } };
  const empilha = (st, h) => seguro(() => history.pushState(st, '', url(h)));
  const troca = (st, h) => seguro(() => history.replaceState(st, '', url(h)));

  // ---------- tela cheia (o botão .mt-tc e a classe .mt-cheia são do mapa-municipios.js) ----------
  const tc = caixa.querySelector('.mt-tc');
  const nativa = () => (document.fullscreenElement || document.webkitFullscreenElement) === raiz;
  const soCss = () => raiz.classList.contains('mt-cheia');      // sem a API do navegador (iPhone, iframe sem permissão)
  const cheia = () => nativa() || soCss();
  let saiuEm = -1e9, porPop = false, cssAntes = soCss();
  const sentinela = () => !!(history.state && history.state.sentinela);
  const alterna = () => { if (tc) tc.click(); };
  // Esc: só CSS → sai da tela cheia antes de subir um nível (lista da busca aberta ou campo aberto: eles tratam o Esc primeiro).
  // Nativo: o navegador consome o Esc; se ele chegar logo depois da saída, é engolido (senão subiria um nível junto).
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (performance.now() - saiuEm < 250) { e.stopImmediatePropagation(); return; }
    const q = document.getElementById('ativo-q'), res = document.getElementById('ativo-res');
    if (soCss() && !nativa() && !(res && res.innerHTML) && !(q && !q.hidden)) { e.preventDefault(); e.stopImmediatePropagation(); alterna(); }
  }, true);
  document.addEventListener('keydown', e => {                   // F liga e desliga (ignorada em campo de texto, com Ctrl/Alt/Meta/Shift e em tecla repetida)
    if ((e.key !== 'f' && e.key !== 'F') || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.repeat || e.defaultPrevented) return;
    if (e.target.closest && e.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    e.preventDefault();
    alterna();
  });
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, () => { if (!nativa()) saiuEm = performance.now(); }));
  // só CSS: ao ligar fica uma entrada "sentinela" no histórico (o Voltar do celular a consome e sai da tela cheia); ao sair pelo botão ela é devolvida
  if (window.MutationObserver) new MutationObserver(() => {
    const css = soCss();
    if (css === cssAntes) return;
    cssAntes = css;
    if (css) { if (!sentinela()) seguro(() => history.pushState({ prev: ultimo, tc: true, sentinela: true }, '', location.href)); }
    else if (!porPop && sentinela()) seguro(() => history.back());
    porPop = false;
  }).observe(raiz, { attributes: true, attributeFilter: ['class'] });

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
      if (!aplicando && (real !== ultimo || location.hash !== real)) { troca(history.state, real); ultimo = real; }   // endereço inválido ou fora do padrão: a barra mostra o que abriu
    });
  }
  function sincroniza() {                                     // o mapa mudou por clique/Esc/busca: reflete no histórico
    if (aplicando) return;
    const n = A.nivel(), h = hashDe(n);
    poeTitulo(n);
    if (h === ultimo) return;
    const st = history.state || {}, antes = ultimo;
    ultimo = h;
    if (st.prev === h) { seguro(() => history.back()); return; }            // subiu para o nível de onde veio: usa o Voltar em vez de empilhar
    empilha({ prev: antes, tc: soCss() }, h);
  }
  const agenda = () => { clearTimeout(espera); espera = setTimeout(sincroniza, 0); };
  document.addEventListener('argos-nivel', () => { if (!aplicando) agenda(); });
  // a busca (e qualquer chamada de ARGOS_MAPA.vai) voa por vários níveis de uma vez: uma só entrada no histórico, no fim
  A.vai = async a => { aplicando++; try { return await vai0(a); } finally { aplicando--; agenda(); } };
  window.addEventListener('popstate', e => {
    if (soCss() && !nativa() && !(e.state && e.state.tc)) { porPop = true; alterna(); }   // o Voltar saiu da tela cheia só por CSS
    const alvo = hashDe(nivelDe(alvoDe(location.hash)));
    if (alvo !== ultimo) leva(location.hash);
  });
  if (alvoDe(location.hash).reg) leva(location.hash); else ultimo = '';
})();
