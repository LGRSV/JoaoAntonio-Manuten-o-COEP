# Tema 5 · Fluidez e acabamento (rodada 3: pacote único)

## Resumo

1. **Um patch só, 263 linhas** (`proto/tema5-rodada3.diff`, confere com `git apply --check` na base atual: `alimentador/site/` = /teste/ ao vivo, gh-pages 5cdff04f). Junta o melhor das rodadas 1 e 2 em 4 blocos: página do alimentador mais leve, CLS do ☰ e dos cartões, Tab/leitor de tela e alvos de 44 px no toque. A animação da página inicial não foi tocada.
2. **Página do alimentador (LD02022033, a maior)**: com CPU 4x, TBT **6,2 s → 3,2 s** (computador) e **6,7 s → 2,8 s** (celular), pronto **4,2 s → 2,6 s**, estilo+layout **3.250 → 1.723 ms**, redesenho a cada zoom **134 → 54 ms**, abrir a lista de trechos **~1.100 → ~700 ms** (CPU 4x). Ficou igual: zoom por roda com CPU 4x (18 fps).
3. **CLS**: início (computador) **0,070 → 0,008**, ranking **0,037 → 0,0001**, alimentador **0,055 → 0** (celular: 0,06 → 0), escuro e claro. O que sobra (0,008) é a troca de fonte do Google Fonts.
4. **Tab/leitor**: 3 paradas invisíveis por nível → **0**, 3 a 4 paradas a menos, cada nível passa a ser anunciado (61 a 108 caracteres) e a lista do município deixa de ser lida inteira (395 → 61). **Toque**: 5 a 30 alvos abaixo de 44 px por tela → **0**, exceções: link "Leaflet" da licença e a orelhinha da legenda aberta (o clique vale no painel todo).
5. **Nada quebrou**: legenda com orelhinha, busca no olho, tela cheia, bandeirinhas e rótulos com fio, lista/camadas/tela cheia do alimentador: 27 estados por fluxo, 4 fluxos (1440 e 390, escuro e claro), **0 diferenças estruturais**, 0 erros de console; no computador os pixels diferem no máximo 0,42 %. A verificação achou **2 defeitos do próprio protótipo** (orelha recolhida andava 52 px, cartões recolhidos com texto no topo) e eles já estão corrigidos no diff.

**Sugestão nº 1 recomendada: aplicar o pacote inteiro, começando pelo bloco da página do alimentador (maior ganho de fluidez) e levando junto o bloco de CLS (3 regras de CSS e 1 linha de JS, risco praticamente nulo).** Ordem sugerida em "O que implementar primeiro".

![resumo](prints/00-resumo-antes-depois.jpg)

---

## O que entra no pacote

| Arquivo (em `alimentador/`) | Linhas (+/−) | Blocos |
|---|---|---|
| `site/site.css` | +22 / 0 | 2 (CLS), 3 (Tab), 4 (toque) |
| `site/mapa-municipios.js` | +19 / −2 | 2 (1 linha), 3 (aviso, ordem do Tab), 1 (`Intl`) |
| `site/busca-ativo.js` | +6 / −2 | 3 (caixa de resultados fora do Tab, resumo no aviso), 1 (`Intl`) |
| `site/menu.js` | +2 / 0 | 4 (toque) |
| `site/ranking-polos.js` | +3 / −1 | 1 (`Intl`), 4 (`--alvo`) |
| `site/limpeza.js`, `site/inspecao.js`, `site/extras.js` | +13 / −7 | 1 (polilinhas, `Intl`) |
| `mapa_trechos.html` (vira `alimentador.js` e `alimentador.css`) | +31 / −4 | 1 (polilinhas, `papel()`, `Intl`, `content-visibility`), 2 (CLS), 4 (toque) |
| **Total** | **+96 / −16** (263 linhas de diff) | |

Esforço por bloco: 1 = M, 2 = P, 3 = P, 4 = P. Risco: 1 baixo a médio, 2 baixo, 3 baixo (falta teste com NVDA/VoiceOver), 4 baixo.

Custo em bytes (gzip): +0,6 KB `site.css`, +0,7 KB `mapa-municipios.js`, +0,2 KB `busca-ativo.js`, +0,7 KB `alimentador.js/css`, o resto menos de 0,15 KB cada. Total ~ +2,6 KB.

Como aplicar (não foi aplicado, nada no repositório mudou): `cd /home/user/smartled && git apply melhorias-noite/rodada-3/tema-5-fluidez/proto/tema5-rodada3.diff`. Há também um `.diff` por arquivo em `proto/` e as cópias já alteradas em `proto/arvore/` e `proto/assets/` (`alimentador.js` e `alimentador.css` são o que o `gera_trechos.py` publica a partir do `mapa_trechos.html` alterado, conferido byte a byte contra o site ao vivo antes da alteração).

---

## Medições (antes → depois do protótipo, sobre o /teste/ atual)

{{TABELAS}}

### Lista de trechos: repetição em ordem alternada e ablação (CPU 4x, mediana de 3 cargas, 2 rodadas)

A máquina é compartilhada (carga média 11 em 4 núcleos), então repeti em ordem antes, depois, "depois sem `content-visibility`", duas vezes. A ação "mostrar" é digitar "T3-A" na busca da página (a lista de 1.019 linhas está `display:none` até lá) até o 2º quadro.

| Dispositivo | Variante | Mostrar a lista (ms) | Rolar a lista (fps) | Clique numa linha (ms) |
|---|---|---|---|---|
| computador | antes | 1.213 · 954 | 26,6 · 27,1 | 863 · 1.042 |
| computador | depois (pacote) | **598 · 797** | **17,0 · 15,4** | **531 · 478** |
| computador | depois sem `content-visibility` | 1.048 · 1.118 | 26,9 · 23,3 | 638 · 744 |
| celular | antes | 1.114 · 1.092 | 59,2 · 58,9 | 745 · 608 |
| celular | depois (pacote) | **721 · 760** | 57,3 · 58,1 | **537 · 641** |
| celular | depois sem `content-visibility` | 1.133 · 1.018 | 58,9 · 60,0 | 509 · 734 |

Leitura honesta: **o ganho de abrir a lista vem do `content-visibility`** (as outras mudanças sozinhas não mexem nela), mas **no computador com CPU 4x a rolagem rápida da lista piora (27 → 15 a 17 fps)**: cada linha que entra na vista é medida na hora. Com CPU normal a rolagem fica igual (51 → 51 fps) e o pior quadro cai (117 → 50 ms). A altura estimada está certa (as linhas medem exatamente 48 px; os grupos, 31 px contra 32 estimados), então não é erro de estimativa. Se isso incomodar, dá para limitar a regra ao toque (`@media (pointer:coarse)`), onde o ganho é o mesmo e não há perda de rolagem.

### Tema claro (N = 2)

{{CLARO}}

---

## Sugestão 1 (prioridade 1) · Página do alimentador mais leve

**Problema.** A LD02022033 (1.019 trechos, 16.184 vãos, `dados.js` de 1,8 MB) é a página mais pesada do site: 9.127 nós no DOM (8.153 só na lista de trechos), TBT de 6,2 s a 6,7 s com CPU 4x, três camadas que desenham a rede inteira (52.548 anéis de 2 pontos no canvas, redesenhados a cada fim de zoom ou arrasto), dois laços quadráticos pequenos (`papel()` varre os 1.019 trechos para cada um dos ~1.000 fusíveis) e duas chamadas de `toLocaleString` com opções por linha da lista (cada uma cria um `Intl.NumberFormat`). Abrir a lista (digitar na busca) leva ~1 s com CPU 4x.

Antes (1º quadro, com o `menu.js` atrasado para fotografar o que vem antes dele, e quadro final):

![antes: alimentador 1440, quadro 1](prints/02-antes-cls-alimentador-quadro1-1440.jpg)
![antes: alimentador 1440, final](prints/02-antes-cls-alimentador-quadro2-1440.jpg)

**Proposta.** Quatro ajustes, todos pequenos:

```css
/* alimentador.css: linhas fora da vista não entram no layout (a lista rola por dentro de .lista) */
.lista>.row,.lista>.grp{content-visibility:auto;contain-intrinsic-size:auto 48px}
.lista>.grp{contain-intrinsic-size:auto 32px}
```
```js
// 1) vãos em sequência (o fim de um é o começo do próximo: 13.773 de 16.184) viram UMA polilinha
//    (alimentador.js; o mesmo em linhaDupla() de limpeza.js e inspecao.js): anéis 52.548 -> 8.104
const aneis = []; let cur = null;
vs.forEach(v => { if (cur && cur[cur.length - 1][0] === v[0] && cur[cur.length - 1][1] === v[1]) cur.push([v[2], v[3]]); else aneis.push(cur = [[v[0], v[1]], [v[2], v[3]]]); });
const l = L.polyline(aneis, {color: t.cor, weight: t.peso, opacity: 1, lineCap: 'round', lineJoin: 'round'}).addTo(map);
// 2) papel() com índice por início (igual ao fimDe que já existe)
const inicioDe = {}; D.trechos.forEach(t => (inicioDe[t.inicio] = inicioDe[t.inicio] || []).push(t.nome));
// 3) formatadores criados uma vez (alimentador.js km/mil, limpeza.js, extras.js, ranking-polos.js, mapa-municipios.js, busca-ativo.js)
const __nf2 = new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
```

**Como fica.** Mesmo desenho (conferido por pixels no computador e por contagem de camadas: 2.121 antes e depois), 0 erros de console e os números das tabelas acima. Depois:

![depois: alimentador 1440, quadro 1](prints/02-depois-cls-alimentador-quadro1-1440.jpg)
![depois: alimentador 1440, final](prints/02-depois-cls-alimentador-quadro2-1440.jpg)
![antes e depois lado a lado, carga final, 1440](prints/07-nada-quebra-20-ld02-carga-1440.jpg)
![antes e depois lado a lado, carga final, 390](prints/07-nada-quebra-20-ld02-carga-390.jpg)

**Esforço** M. **Risco** baixo a médio: `content-visibility` só tem efeito em Chrome 85+, Safari 18+ e Firefox 125+ (nos outros segue como hoje); rolagem rápida da lista no computador lento piora (ver acima); a simplificação de polilinhas do Leaflet é de menos de 1 px; não testei o foco por teclado percorrendo as 1.000 linhas com `content-visibility`. **Arquivos:** `alimentador/mapa_trechos.html` (blocos `<style>` e `<script>` que o `gera_trechos.py` publica), `limpeza.js`, `inspecao.js`, `extras.js`, `ranking-polos.js`, `mapa-municipios.js`, `busca-ativo.js`.

**Não fiz (e por quê):** codificar `D.vaos` em deltas (dados.js cairia ~22 % e exige mexer no gerador); adiar o desenho das camadas Faixa/Inspeção/Manutenção para depois do 1º quadro (é onde está o resto do TBT: `limpeza.js` 120 a 180 ms e `alimentador.js` ~320 ms em CPU normal; o `al-pronto` espera todos os scripts) — ficam para o tema 4 (painel).

---

## Sugestão 2 (prioridade 2, faça junto) · Sem salto de 64 px em nenhuma página

**Problema.** O `menu.js` é o último script e monta a linha do ☰ depois do 1º quadro: em toda página o conteúdo desce 64 px (no alimentador, depois de ~1,3 s de página já visível). Na página inicial os 3 cartões Norte/Centro/Sul nascem em (0,0) e pulam para o lugar (CLS 0,070 no computador).

![antes: início 1440, 1º quadro (título cortado, cartão Sul fora do lugar)](prints/01-antes-cls-inicio-quadro1-1440.jpg)
![antes: ranking 390, 1º quadro](prints/03-antes-cls-polos-quadro1-390.jpg)
![antes: ranking 390, quadro seguinte (tudo desceu)](prints/03-antes-cls-polos-quadro2-390.jpg)

**Proposta.**

```css
/* site.css e alimentador.css: reserva a linha do ☰ com uma pseudo-linha da mesma geometria (some quando o ☰ chega) */
.wrap:not(:has(>.mnu))::before{content:"";display:block;min-height:var(--alvo);margin-bottom:calc(var(--s2) * -1)}
/* site.css: cartões escondidos até serem posicionados */
.mt-regcards:not([data-ok]) button{visibility:hidden}
/* alimentador.css: o "Como os trechos são divididos" sai do cabeçalho quando o extras.js monta a barra de busca */
.al-site:not(.al-pronto) header>details.regra{display:none}
```
```js
// mapa-municipios.js, em poeCartoes(), logo antes de desenhar as bandeirinhas
cartoes.dataset.ok = '1';
```

**Como fica.** Título e mapa já no lugar no 1º quadro; nenhuma página muda de altura ao chegar o ☰.

![depois: início 1440, 1º quadro](prints/01-depois-cls-inicio-quadro1-1440.jpg)
![depois: início 390, 1º quadro](prints/01-depois-cls-inicio-quadro1-390.jpg)
![depois: ranking 390, 1º quadro](prints/03-depois-cls-polos-quadro1-390.jpg)
![depois: início 1440 claro, 1º quadro](prints/01-depois-cls-inicio-quadro1-1440-claro.jpg)

**Esforço** P. **Risco** baixo: `:has()` precisa de Chrome 105+, Safari 15.4+, Firefox 121+ (sem ele o salto continua como hoje); se o `menu.js` falhar, sobra uma faixa vazia de ~40 px. **Limite:** o 0,008 que sobra no início (computador) é o título e o mapa descendo 4 a 5 px quando o Google Fonts chega (`display=swap`); fontes próprias com `size-adjust` zeram. **Arquivos:** `site.css`, `mapa_trechos.html` (CSS), `mapa-municipios.js`.

---

## Sugestão 3 (prioridade 3) · Tab coerente e leitor de tela que sabe onde o mapa está

**Problema.** (a) Com uma regional, polo, município ou alimentador abertos, os cartões Norte/Centro/Sul (`opacity:0`) continuam no Tab: 3 paradas em que o foco some. (b) Tab saindo do campo de busca cai na caixa de resultados (o Chromium põe áreas roláveis no Tab), com contorno gigante. (c) No estado inteiro as regionais (a ação principal) vêm depois de "Palmas" e da legenda. (d) Nenhum nível é anunciado e, ao abrir um município, a região `aria-live` do `#ativo-res` lê a lista inteira (395 caracteres, 1.112 com a miniatura).

![antes: Tab com a regional aberta cai num cartão invisível, 1440](prints/04-antes-tab-regional-1440.jpg)
![antes: Tab na busca cai na caixa de resultados, 1440](prints/05-antes-tab-busca-1440.jpg)

(A faixa vermelha/verde no rodapé dos prints é uma legenda desenhada só no print; não faz parte do site.)

**Proposta.**

```css
/* site.css: o cartão some de verdade (e sai do Tab) depois do fade */
.mt-regcards button{transition:opacity .3s,border-color .15s,visibility 0s}
.aberta .mt-regcards button,.voando .mt-regcards button{visibility:hidden;transition:opacity .3s,border-color .15s,visibility 0s .3s}
```
```js
// mapa-municipios.js
caixa.prepend(cartoes);   // as regionais são a 1ª parada do mapa (posição é por JS: o visual não muda)
// região <p class="vh" role="status" aria-live="polite" aria-atomic="true"> + document.addEventListener('argos-nivel', ...) com texto curto do nível final
// busca-ativo.js
res.tabIndex = -1; res.removeAttribute('aria-live');   // a lista não é mais lida inteira; o resumo vai no aviso ("12 opções. Use as setas...")
```

No estado inteiro o número de paradas é o mesmo (9), só a ordem muda: as três regionais vêm antes de "Palmas".

Textos do aviso (todos dos dados do mapa): "Regional Centro: 3 polos, Paraíso, Porto Nacional, Palmas. Esc volta ao Tocantins." · "Polo Porto Nacional: 12 municípios, 633 NAE. Esc volta à regional Centro." · "Porto Nacional: 23 alimentadores, 268 NAE. Esc volta ao polo." · "Alimentador AL02057189 em foco, em Porto Nacional: 44 NAE. Enter abre a página dele. Esc volta ao município." **Mudança em relação à rodada 2:** o botão do olho NÃO sai mais do Tab (agora ele é a única entrada da busca; a lupa duplicada da rodada 2 deixou de existir).

![depois: Tab com a regional aberta cai no ← (aviso lido pelo leitor de tela na legenda), 1440](prints/04-depois-tab-regional-1440.jpg)
![depois: 390](prints/04-depois-tab-regional-390.jpg)
![depois: Tab na busca vai para o "Tocantins"](prints/05-depois-tab-busca-1440.jpg)

**Esforço** P. **Risco** baixo: verifiquei as paradas do Tab e o texto das regiões `aria-live` por script (MutationObserver); **não** testei com NVDA, VoiceOver ou TalkBack. Anunciar "N opções" a cada abertura da busca pode ser repetitivo para quem abre e fecha muito. **Arquivos:** `site.css`, `mapa-municipios.js`, `busca-ativo.js`.

---

## Sugestão 4 (prioridade 4) · Alvos de toque de 44 px em todas as telas

**Problema.** `--alvo` é 40 px em `site.css`, em `alimentador.css` e dentro do CSS embutido do `ranking-polos.js`; o ☰ (`menu.js`) tem 40 px fixos. No celular: ☰, Ranking, olho, tela cheia, trilha, chips dos polos (36 px), menu aberto; no ranking os 8 botões de polo e as abas; na página do alimentador T1/T2/T3, camadas, anos, botões de download (30 alvos). Com a legenda recolhida (novo desde a rodada 2) os cartões das regionais caem para 27 px e a orelhinha tem 30 px.

![antes: alvos em vermelho (< 44 px), estado, 390](prints/06-antes-alvos-estado-390.jpg)
![antes: alimentador, 390](prints/06-antes-alvos-alimentador-390.jpg)
![antes: ranking, 390](prints/06-antes-alvos-polos-390.jpg)

**Proposta.** Só em tela de toque (`pointer:coarse`; no mouse nada muda):

```css
@media (pointer:coarse){
  :root{--alvo:44px}                                     /* site.css, alimentador.css e o bloco :root do ranking-polos.js */
  .mt-barra .mt-pchip,.mt-passo,.mt-puxa,.ativo .ir-mapa,.mt-regs>summary{min-height:44px}
  .mt-volta{min-width:44px} .mt-amun{display:inline-flex;align-items:center;min-height:44px}
  .mt-regcards button{min-height:44px;align-content:center}      /* legenda recolhida: cartões de 27 px */
  .mt-regs.fechada .mt-regs-b{position:relative;left:auto;top:auto}   /* a regra de base tem left:50%: sem zerar a orelha andava 52 px */
  .mt-regs.fechada .mt-regs-b::after{content:"";position:absolute;inset:-8px}   /* orelha recolhida: visual igual, toque de 46 px */
}
/* menu.js (CSS embutido): .mnu{min-height:44px} .mnu .mnu-btn,.mnu .mnu-x{width:44px;height:44px} .mnu-lista a,.mnu-lista button{min-height:44px} ... */
/* alimentador.css: html body na frente porque limpeza.js/extras.js/telacheia.js injetam <style> depois */
@media (pointer:coarse){ html body .migalhas a{min-height:44px} html body .mapbox .classes button{min-width:44px;min-height:44px} /* ... 10 regras */ }
```

**Como fica.** Verde = 44 px ou mais, vermelho = menor (a orelhinha da legenda aberta fica vermelha no print porque o clique vale no painel inteiro, `leg.addEventListener('click')`; o cartão e o olho ficam verdes):

![depois: estado, 390](prints/06-depois-alvos-estado-390.jpg)
![depois: alimentador, 390](prints/06-depois-alvos-alimentador-390.jpg)
![depois: ranking, 390](prints/06-depois-alvos-polos-390.jpg)
![legenda recolhida, antes e depois, 390](prints/07-nada-quebra-02-legenda-recolhida-390.jpg)

O layout do celular cresce 4 px por linha de controles (por isso a comparação por pixels só vale no computador). **Esforço** P. **Risco** baixo; trocar `--alvo` mexe em tudo que usa a variável (migalhas, rodapé, `.cab-link`, opções da busca), conferido nas telas acima, mas não em tablet. **Arquivos:** `site.css`, `menu.js`, `ranking-polos.js`, `mapa_trechos.html` (CSS). A regra da orelhinha mexe numa peça da outra sessão (legenda): é só área de toque, pode ser aplicada por quem cuida dela.

---

## Nada quebra: legenda, busca no olho, tela cheia, bandeirinhas, rótulos com fio

`verifica.js` percorre 15 estados da página inicial (estado, legenda recolhida e reaberta pela orelhinha, busca "palmas" com seta e Enter, regional, polo Porto Nacional, polo Araguaína com rótulos e fios, município, alimentador em foco, tela cheia dentro de um município e no estado inteiro, Esc na tela cheia) e, nas páginas LD02022033 e AL03037009, a carga, a busca de trechos, a rolagem da lista, o clique numa linha, as 4 camadas (Faixa, Inspeção, Insp→manut, Manutenção) e a tela cheia. Compara **contagens e estados** (bandeirinhas `.mt-fio`/`.mt-pino`, `.mt-fios line/circle`, rótulos, chips, legenda aberta/recolhida, `.sem-nae`, tela cheia e trava de rolagem, opções da busca, nível do mapa, linhas da lista, camadas do Leaflet) e, no computador, os **pixels**.

{{VERIFICA}}

- A única diferença de pixels no computador (0,3 a 0,4 %) é o cartão de uma regional 5 px mais perto ou mais longe: **acontece também sem o protótipo** (4 cargas do site sem alteração deram 3 vezes (800,391) e 1 vez (805,396)): a posição das bandeirinhas depende do momento em que a fonte chega. Fica como achado para a sessão dona das bandeirinhas.
- Prints lado a lado (antes à esquerda, depois à direita), 1440 reduzido a 62 % e 390 em tamanho real, escuro e `-claro`: `prints/07-nada-quebra-*`:

![legenda recolhida, 1440](prints/07-nada-quebra-02-legenda-recolhida-1440.jpg)
![busca no olho, 1440](prints/07-nada-quebra-04-busca-palmas-1440.jpg)
![polo Araguaína com rótulos e fios, 1440](prints/07-nada-quebra-08-polo-araguaina-1440.jpg)
![regional com bandeirinhas, 1440 claro](prints/07-nada-quebra-06-regional-1440-claro.jpg)
![tela cheia, 390](prints/07-nada-quebra-11-tela-cheia-390.jpg)
![tela cheia no estado, 1440](prints/07-nada-quebra-13-estado-tela-cheia-1440.jpg)
![camadas ligadas no alimentador, 1440](prints/07-nada-quebra-24-ld02-camadas-ligadas-1440.jpg)

---

## O que implementar primeiro

| # | O quê | Esforço | Por quê nessa ordem |
|---|---|---|---|
| 1 | **Bloco 1 · página do alimentador mais leve** (decidir antes se `content-visibility` vai em todos os aparelhos ou só no toque) | M | É onde o usuário espera e vê engasgo: TBT -50 % a -60 % com CPU 4x, redesenho de zoom -60 %, lista abre 2x mais rápido |
| 2 | **Bloco 2 · CLS** (3 regras + 1 linha) | P | Melhor custo-benefício: 5 minutos, nenhum risco visual, tira o salto de 64 px de TODAS as páginas; pode sair no mesmo dia que o 1 |
| 3 | **Bloco 4 · alvos de 44 px no toque** | P | Só vale em celular; conferir menu, ranking e página do alimentador no aparelho; avisar a sessão da legenda sobre a orelhinha |
| 4 | **Bloco 3 · Tab e leitor de tela** | P | Ganho real para teclado e leitor, mas pede uma volta com NVDA ou VoiceOver antes de publicar |
| 5 | Fontes próprias (IBM Plex em `assets/`, `size-adjust`) | M | Zera o CLS que sobra (0,008) e o FCP em rede lenta; discutível por causa do cache de 10 min do GitHub Pages |
| 6 | Adiar o desenho das camadas Faixa/Inspeção/Manutenção para depois do 1º quadro (tema 4) | G | É onde está o resto do TBT da página do alimentador |

## Como medi (e limites)

- **Espelho local.** O Chromium daqui não confia na CA do proxy: `servidor-espelho.js` (porta 18767) baixa o /teste/ ao vivo com `curl` na 1ª requisição, guarda em cache e serve com gzip; os tiles do Esri e as fontes do Google passam por `route` + `curl` (`lib.js`). Base: assets do /teste/ de hoje (conferidos iguais a `alimentador/site/`, exceto os rascunhos `ativos-zoom.js`, `croqui-modelo.js`, `municipios-rascunho.js`, que não são publicados). O `lupa-painel.js` do repositório ainda não está no site ao vivo e **não foi testado junto**: ele tem regras próprias com `.wrap:not(:has(>.barra-busca))` e `.al-site:not(.al-pronto)` que convém conferir ao publicar os dois.
- **Protótipo.** `gera-proto.js` parte dos arquivos do repositório (só leitura), aplica cada troca por substituição exata (para se o trecho não casar uma vez) e grava `proto/`. `injeta.js` entrega o resultado por `page.route`; `PROTO=1` liga tudo, `PROTO_SEM=lista` tira o `content-visibility` (ablação). Nada no site nem no repositório foi alterado.
- **Medidas.** CLS: `layout-shift`; carga: long tasks e TBT (depois do FCP), "pronto" = mapa do Leaflet criado + lista; estilo e layout: trace do Chromium; redesenho: `renderer._update()` (API privada do Leaflet, só para medir); gestos: mouse e roda no computador, `Input.synthesizeScrollGesture`/`PinchGesture` no celular; lista: digitar na busca até o 2º quadro. Perfis: normal e CPU 4x (`Emulation.setCPUThrottlingRate`); **a 4G lenta da rodada 2 não foi refeita** (pedido desta rodada: com e sem CPU 4x). Viewports 1440x900 (mouse) e 390x844 (toque, DPR 2), escuro e claro.
- **Ruído.** A máquina é compartilhada e renderiza por software (sem GPU): o TBT oscila até 50 % entre rodadas (o "antes" do computador normal deu 1.601 ms aqui e 966 ms na rodada 2). Só confio em diferenças grandes: CLS, estilo+layout, redesenho, mostrar a lista, paradas do Tab. FCP e LCP de páginas pequenas variam sem relação com o protótipo (por isso não os destaco). Transferência: o Playwright entrega o protótipo sem gzip (760 KB contra 635 KB); com gzip o acréscimo é ~2,6 KB.
- **Não coberto:** leitor de tela real, Safari/Firefox, tablet, foco por teclado nas 1.000 linhas com `content-visibility`, o zoom por roda com CPU 4x no computador (continua em 18 fps: o resto é carga de tiles e animação do navegador).
- **Achado paralelo (não é do pacote):** 1 em cada 3 cargas do celular mostra um salto de 52 px no `div.stage` da página do alimentador (CLS 0,036, ainda abaixo de 0,1) quando a barra de busca chega.

## Arquivos

- `proto/tema5-rodada3.diff` (o patch completo), `proto/*.diff` (um por arquivo), `proto/arvore/alimentador/…` (cópias alteradas), `proto/assets/alimentador.js|css` (o que o gerador publica).
- Scripts: `gera-proto.js`, `injeta.js`, `lib.js`, `servidor-espelho.js`, `medir-cls.js`, `medir-alim.js`, `medir-lista.js`, `layout-carga.js`, `redesenho.js`, `tab-foco.js`, `alvos.js`, `verifica.js`, `comparar.py`, `prints.js`, `tabelas.js`, `grafico.py`, `roda-antes.sh`, `roda-depois.sh`, `roda-ab-lista.sh`, `roda-verifica.sh`, `roda-claro.sh`, `roda-fim.sh`.
- Resultados: `medicoes/*.json` e `*.log`, `medicoes/tabelas.md`, `medicoes/verifica.md`, `verif/` (um JPEG por estado, antes e depois).
- Reprodução: `ESPELHO=<pasta> PORTA=18767 node servidor-espelho.js &`, `node gera-proto.js`, `./roda-antes.sh`, `./roda-depois.sh`, `./roda-ab-lista.sh`, `./roda-verifica.sh`, `node prints.js` (e `TEMA=claro node prints.js`).
