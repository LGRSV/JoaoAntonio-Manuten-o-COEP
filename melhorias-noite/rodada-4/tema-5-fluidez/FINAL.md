# Tema 5 · Fluidez e acabamento: versão FINAL (rodada 4)

**Base:** commit `ff40f52` (alimentador/site = /teste/ ao vivo, gh-pages 8f86bf3, com a **lupa do painel**). **Patch:** `proto/final.diff` (275 linhas, 9 arquivos, +101/−18). `git apply --check` na raiz: **OK**. Nada no repositório foi alterado. Prints: `prints-finais/` (4 pares, 1440 e 390). Tudo foi testado COM a lupa no ar (era o limite da rodada 3).

## O que muda

1. **Sem salto de tela (CLS).** A linha do ☰ já nasce reservada e os cartões Norte/Centro/Sul ficam escondidos até posicionados. **Novo nesta rodada (por causa da lupa):** a barra de busca antiga, que a lupa leva para dentro do mapa, fica escondida até lá (some a folga de 52 px que o mapa reservava e devolvia) e as migalhas já vêm com a altura da seta ← da lupa (12 px). Sem isso o pacote da rodada 3 + lupa **piorava** o celular (CLS 0,096 contra 0,068); agora 0,001.
2. **Alimentador mais leve** (LD02022033, 1.019 trechos): vãos em sequência viram uma polilinha (52.548 → 8.104 anéis), `papel()` com índice, `Intl.NumberFormat` criado uma vez, `content-visibility` na lista **só no toque** (abaixo).
3. **Tab e leitor de tela:** 3 cartões invisíveis saem do Tab, regionais viram a 1ª parada, a caixa de resultados da busca deixa de ser parada e cada nível é anunciado (`role="status"`, 61 a 127 caracteres; a lista do município não é mais lida inteira: 395 → 61).
4. **Alvos de 44 px** só no toque (`pointer:coarse`): ☰, Ranking, chips, ← da lupa (40 → 44), migalhas, camadas, anos, downloads. No mouse nada muda.
5. **Nada quebra:** 27 estados × 4 fluxos (1440/390, escuro/claro; busca, tela cheia, camadas, lista): **0 diferenças estruturais, 0 erros de console**, pixels ≤ 0,32 % no computador. Fluxo da lupa (abrir, digitar "T3-A", escolher, tela cheia, Esc) idêntico antes e depois, nos dois tamanhos.

## Números (antes → depois, `medicoes/`)

| Medida | Antes → depois |
|---|---|
| CLS, página do alimentador (mediana de 3) | computador 0,061 → 0,0016 · celular 0,069 → 0,001 (com CPU 4x chegou a 0,160 → 0,001) |
| CLS, início / ranking (computador) | 0,064 → 0,008 · 0,038 → 0,0001 (celular já era 0) |
| Alimentador, celular, CPU 4x (5 cargas alternadas antes/depois) | pronto 7,4 s → 5,0 s · TBT 5,7 s → 3,2 s · maior long task 1,9 s → 0,8 s |
| Alimentador, computador, CPU 4x (5 cargas alternadas) | pronto 7,1 s → 7,4 s e TBT 5,7 s → 5,5 s (**sem ganho, dentro do ruído**) · maior long task 1,6 s → 1,2 s |
| Estilo + layout na carga (trace, CPU 4x / normal) | 3.712 → 2.061 ms / 1.247 → 704 ms (commit 1.117 → 253 ms) |
| Redesenho das linhas a cada zoom/arrasto (CPU 4x, visão geral) | 296 → 77 ms |
| Tab: paradas invisíveis por nível | 3 → 0 (e 3 a 4 paradas a menos) |
| Alvos < 44 px no celular (10 telas) | 4 a 27 por tela → 0 ou 1 (só a orelhinha da legenda aberta, cujo clique vale no painel todo, e o link "Leaflet" da licença) |

Leitura honesta: a máquina é compartilhada (carga média 7 a 19 em 4 núcleos). No celular o ganho é nítido (intervalos de 5 cargas não se cruzam). **No computador com CPU 4x, com a lupa no ar, "pronto" e TBT não melhoram** (duas rodadas, intervalos se cruzam); a rodada 3, sem a lupa e com a máquina mais calma, tinha dado TBT 6,2 → 3,2 s, então esse número não deve ser prometido. O que melhora no computador e é determinístico: CLS, anéis (−85 %), estilo+layout (−45 %), maior long task (−27 %), redesenho a cada zoom (−74 %).

## `content-visibility` da lista: decisão = SÓ NO TOQUE

Em 3 rodadas independentes (2 na rodada 3, 1 nesta) a regra em todos os aparelhos **piora a rolagem rápida da lista no computador com CPU 4x**: 22 a 27 fps sem ela → 14 a 17 fps com ela (cada linha que entra na vista é medida na hora). Com a regra só em `@media (pointer:coarse)`, o computador fica como hoje (21 a 23 fps, igual ao "antes") e o celular mantém o ganho: abrir a lista com CPU 4x 1.778 → 705 ms, clique numa linha 814 → 643 ms, rolagem 58 → 55 fps. O que se perde: no computador a lista não abre 2x mais rápido (1,26 s → 0,68 s com a regra global, 1,1 a 1,6 s sem). Vale a troca: rolar é o gesto mais frequente.

## O que implementar primeiro

| # | O quê | Esforço |
|---|---|---|
| 1 | **CLS** (site.css 3 regras, `cartoes.dataset.ok`, e o bloco do alimentador: `.barra-busca` escondida até `al-pronto`, migalhas com `min-height:32px`) | P |
| 2 | **Página do alimentador mais leve** (polilinhas, `papel()`, `Intl`, `content-visibility` no toque) | M |
| 3 | **Alvos de 44 px no toque** (inclui a seta ← da lupa) | P |
| 4 | **Tab e leitor de tela** (aviso por nível). Antes de publicar: uma volta com NVDA ou VoiceOver | P |
| 5 | Fontes próprias com `size-adjust` (zera os 0,008 de CLS que sobram na página inicial) e adiar o desenho das camadas Faixa/Inspeção/Manutenção (resto do TBT; é do tema 4) | M / G |

## Riscos

- `:has()` e `content-visibility` exigem Chrome 105/85+, Safari 15.4/18+, Firefox 121/125+; sem eles tudo continua como hoje (só o salto volta).
- Se o `lupa-painel.js` falhar, a barra antiga aparece em fluxo ao fim da carga (o mapa desce ~52 px uma vez, como hoje).
- Aviso do leitor de tela não foi testado com leitor real; "N opções" a cada abertura da busca pode cansar.
- `--alvo: 44px` no toque mexe em tudo que usa a variável (conferido nas 10 telas, não em tablet). Zoom por roda com CPU 4x (18 fps) e polígonos de município < 44 px no estado não mudam (área do tema 2).

## Toca nos arquivos/funções (para juntar os 5 temas)

- `site/site.css`: bloco novo **no fim do arquivo** (+23 linhas; sem conflito, a não ser que outro tema também anexe ao fim).
- `site/mapa-municipios.js`: constante `km` (topo, `Intl`); logo após criar `cartoes` (`caixa.append` → `caixa.prepend`); `poeCartoes()` (+1 linha `cartoes.dataset.ok`); **bloco novo antes de `window.ARGOS_MAPA = {…}`** (região de aviso, `ARGOS_ANUNCIA`, ouvinte de `argos-nivel`). Temas 1 e 2 mexem no mesmo arquivo (Voltar/hash, zoom): conferir o ouvinte `argos-nivel` e o fim do arquivo.
- `site/busca-ativo.js`: 3 pontos (`const q/res` do topo: `res.tabIndex=-1`, `removeAttribute('aria-live')`; abertura da lista: resumo no aviso; `Intl`).
- `site/menu.js` (CSS embutido, +2 linhas, 44 px) · `site/ranking-polos.js` (`:root --alvo`, `Intl`) · `site/limpeza.js` (`linhaDupla()`, `Intl`) · `site/inspecao.js` (`linhaDupla()`) · `site/extras.js` (`Intl`).
- `alimentador/mapa_trechos.html` (vira `alimentador.js/css`): CSS (as 2 regras de reserva do `.stage` viram 1 regra `.barra-busca{display:none}`, +bloco "Fluidez" no fim do `<style>`), `km`/`mil`, `papel()`/`inicioDe`, desenho dos vãos (`L.polyline(aneis…)`). **Tema 4 (painel) mexe neste arquivo e na lupa**: a regra `.al-site:not(.al-pronto) .wrap>.barra-busca{display:none}` e o `min-height:32px` das migalhas dependem de a lupa seguir levando a barra para o mapa.

Reprodução: `servidor-espelho.js`, `gera-proto.js` (`LISTA=global` gera a variante antiga), `roda-r4-{a,b,v}.sh`, `ab-carga.js`, `prints-finais.js` + `compoe-finais.py`.
