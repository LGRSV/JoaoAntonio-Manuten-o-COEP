# Tema 3 · Tipografia, cartão preto, rótulos adaptativos e ranking — VERSÃO FINAL (rodada 4)

**Base:** HEAD `f7090e4` (`alimentador/site/` = `/teste/` ao vivo, conferido byte a byte nos 4 arquivos; já tem a lupa no painel e o 1 clique abrindo o painel). Patch: `proto/final.diff` (5 arquivos, +260/−74). `git apply --check` passa na raiz, contra o HEAD (`--cached`) e contra a árvore de trabalho de agora (que tem edições não commitadas de outras sessões em `municipios.js`, `ativos-zoom.js` e `gera_trechos.py`, sem sobreposição). Não há arquivo novo. Arquivos inteiros em `proto/`, base em `orig/`.

## O que muda
1. **Rótulos adaptativos nos polos.** `ajusta()` espalha os municípios só no eixo que sobra tela (teto 1,7x no computador, 3x no celular); no celular o mapa ganha moldura de altura fixa (544 px em 390x844), sem saltos de altura entre níveis. Cartão compacto com nome curto (sem " do Tocantins") e até 8 ordens de colocação quando sobra município só com número.
2. **Rede do alimentador em foco sem corte.** `enquadra()` passa a devolver `viewBox` na proporção da caixa; antes o SVG encolhia e cortava a rede numa borda reta.
3. **Cartão preto no município aberto**: título "Araguaína · 380 NAE · 33 ALIMENTADORES", linhas com código em Mono e selo da NAE, miniatura azul clara (a NAE do município não aparecia nesse nível).
4. **Cartão preto do alimentador em foco** (código, selo NAE, subestação e km, "ABRIR O PAINEL →"). Convive com o 1 clique: o foco só se alcança pela busca ou por "Ver no mapa", e o cartão é o caminho explícito dali ao painel; o texto segue o do balão ("Clique para abrir o painel do alimentador"). Verificado em `convive.js`: clique na rede (nível município e em foco) e no cartão vão para `alimentadores/<cód>/`; trocar o alimentador em foco atualiza o cartão; a seta o esconde; 0 erros de página.
5. **Tipografia:** selo da NAE em Plex Mono 600 (o 700 não é carregado: 32 textos com negrito sintético → 0) e três `@font-face` locais com métricas do Plex como fonte reserva.
6. **Ranking (`polos/`)** na mesma linguagem: marca ARGOS/MANUTENÇÃO (3 linhas em `gera_trechos.py`, mais reserva em JS), nome + selo da NAE, escolhido em cartão preto, NAE da linha no selo vermelho, cabeçalho em Mono.

## Números, antes → depois (8 polos, 139 municípios; `metricas.js`)
| Tela | com nome | só número | sem rótulo | sobreposições* |
|---|---|---|---|---|
| computador 1440x900 | 137 → **139** (dentro 128 → 134, ao lado 9 → 5) | 2 → **0** | 0 → 0 | 0 → 0 |
| celular 390x844 | 103 → **134** (dentro 72 → 95, ao lado 31 → 39) | 35 → **5** | 1 → **0** | 0 → 0 |
| notebook 1280x720 / tablet 820x1100 | 134 → 139 / 138 → 139 | 5 → 0 / 1 → 0 | 0 / 0 | 0 → 0 |

\* cartão sobre cartão + cartão sobre seta/tela cheia/lista + cartão cortado pela borda do mapa.
Celular por polo (só número): Araguaína 3→2, Augustinópolis 8→0, Guaraí 8→1, Palmas 0→0 (sem rótulo 1→0), Porto Nacional 3→0, Paraíso 5→1, Gurupi 4→0, Dianópolis 4→1. Os 5 que sobram só se resolvem entrando no município (4 em outras execuções da rodada 3; repeti 3 vezes: 95/97/97 nomes dentro, sempre 5 só número; o orçamento de 45 ms de `poeNomes` faz o resultado variar um pouco com a carga da máquina).
- Rede em foco (razão largura do SVG / caixa; 1,00 = sem corte; o alimentador de mais km do município de maior NAE de cada polo): computador 0,40–0,84 (**8 de 8 cortados**) → 1,00; notebook 0,36–0,73 (8 de 8) → 1,00; tablet e celular já eram 1,00.
- O cartão do alimentador em foco não cobre a rede: 0 de 3001 pontos do traçado sob o cartão nos 8 polos e 4 telas (`cartao-sobre.js`).
- Fonte lenta (1,5 s), CLS: ranking no celular **0,1724 → 0,0004**; início no celular 0,0011 → 0; ranking no computador 0,0473 → 0,0409; início no computador 0,0643 → 0,0637.
- Custo (rodada 3, `perf.js`, CPU 4x mais lenta; o código de `poeNomes` não mudou): celular, soma das tarefas longas por abertura de polo 702 → 460 ms, maior 319 → 168 ms; computador 627 → 620 ms. Não repeti nesta rodada.

## O que implementar primeiro
| # | O quê | Esforço | Arquivos |
|---|---|---|---|
| 1 | Enquadramento corrigido + afastamento adaptativo + moldura fixa no celular | M | `mapa-municipios.js` |
| 2 | Nome curto + ordens de colocação com cache e orçamento | P | `mapa-municipios.js` |
| 3 | Selo Mono 600 + fontes reserva | P | `site.css`, `ranking-polos.js` (1 linha) |
| 4 | Cartão preto do município e do alimentador em foco | M | `site.css`, `busca-ativo.js`, `mapa-municipios.js` |
| 5 | Ranking com a mesma linguagem + marca no gerador | P | `ranking-polos.js`, `gera_trechos.py` |

## Riscos
- (1) distorce um pouco a geografia (teto 1,7x/3x); no celular o mapa passa a ter 544 px fixos e o que vem abaixo desce em polos antes baixos. Se o tema 2 trouxer zoom/arrastar, `ajusta` deve rodar só ao abrir o nível (hoje em `entraPolo`).
- (2) `poeNomes` é compartilhada com legenda/tela cheia/balão: conflito provável no mesmo bloco se o tema 1 ou 2 mexer nele. Resultado depende da velocidade da máquina (em aparelho lento roda só a 1ª ordem: na rodada 3, com orçamento 0, ficaram 6 só número em vez de 4).
- (4) a lista da busca e o painel são da outra sessão: só mexo no título (`{html}`) e no CSS; o cartão do foco entra em `.mt-lado` sem tocar o resto.
- (5) selos em 60 linhas pesam na coluna NAE; se incomodar, só nos 10 primeiros.

## Toca nos arquivos/funções (para juntar os 5 temas)
- `alimentador/site/mapa-municipios.js`: `entraPolo`, `enquadra`, novas `ajusta`/`areaPx`/`alturaCel`/`lateral`, `NIVEIS_ROT`/`poeNomes`/`chaveNomes`, `curto`, criação de `cartaoAl` em `.mt-lado` (junto de `volta` e `legAl`), `focaAl`, `saiAl`.
- `alimentador/site/busca-ativo.js`: `mostra` (título aceita `{html}`) e `atalhos` (cabeçalho do município; 2 linhas).
- `alimentador/site/site.css`: tokens `--f-*`, 3 `@font-face`, regra do peso dos selos, blocos `.mt-ac` e `#ativo-res.lista-mun`.
- `alimentador/site/ranking-polos.js`: reserva da marca, `--f-display`, bloco CSS "tema 3", templates `pil`, seletor do celular e célula NAE.
- `scripts/gera_trechos.py`: 3 linhas em volta de `corpo = (migalhas('../', 'Ranking por polo') ...` (`marca` antes de `migalhas`, página `polos/`).
- Depois de aplicar, rode `scripts/gera_trechos.py` (copia os assets).

## Prints (`prints-finais/`, escuro, JPEG q80)
`01-polo-denso` (Augustinópolis, 24 municípios: no celular 8 só número → 0), `02-municipio-cartao` (Araguaína), `03-alimentador-foco` (LD03010004 com o cartão), `04-ranking`; cada um `-antes-` e `-depois-` em `1440` e `390`. Reprodução: `node prints-finais.js antes|depois`, `node metricas.js antes|depois [telas]`, `python3 resume-metricas.py`, `node foco.js antes|depois`, `node convive.js depois`, `node cartao-sobre.js`, `node fontes.js` e `fontes-cls.js antes|depois`. Medições e logs em `medicao/` (`prints/` guarda só os prints da fonte lenta de `fontes-cls.js`); prints da rodada 3 (claro, 8 polos, tela cheia) em `../../rodada-3/tema-3-tipografia/prints/`.
