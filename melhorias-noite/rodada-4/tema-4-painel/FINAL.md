# Tema 4 · Painel do alimentador: versão final (rodada 4)

**Patch:** `proto/final.diff` (raiz do repositório; `git apply --check` passa no HEAD `f76584c`, sozinho e depois de cada final dos temas 1, 2, 3 e 5 aplicado sozinho). Rebaseado na **lupa do repositório** (`alimentador/site/lupa-painel.js`, sha256 `7bd7c62e…`): o único acréscimo nela são ~10 linhas + 1 de CSS. Nada foi editado no repositório nem publicado.

## O que muda
1. **Cabeçalho numa faixa só (64 px) e mapa na altura da tela:** `☰ · ← Municípios · código · SE | 199 trechos · 153,98 km · NAE 23` (o resumo fica sobre o painel de 400 px). Mapa todo à vista, a página não rola.
2. **Painel só com o que a lupa não diz:** saem a tabela Classe/Trechos/Extensão, o bloco "NAE - vegetação", a lista de trechos e a legenda de cores. Sem camada ligada: aviso + botão "Escolher camadas".
3. **Nota da NAE na lupa:** "Soma das classes 24 = NAE do alimentador 23 + 3 de outros alimentadores que estão em trechos daqui − 2 sem trecho." Fecha nos 4 alimentadores (24=23+3−2 · 32=37+1−6 · 61=60+1 · 3=3, sem nota).
4. **Trecho escolhido: ficha curta + abas** `NAE · Faixa · Inspeção · Insp→manut · Manutenção` (com a contagem de cada uma); camadas do alimentador inteiro em acordeão; legendas do mapa em linha (cor + nome, sem repetir os números do cartão).
5. **Celular: mapa quase na tela inteira e painel em gaveta inferior** (fechada, 46% ou 88%; escolher um trecho sobe a gaveta e enquadra o trecho na parte livre; abrir a lupa desce a gaveta).
6. **O gerador escreve o cabeçalho no HTML (é o que derruba o CLS):** classe `al-site al-painel` no `<html>`, caminho com a seta ← (link `.lp-voltar-ph`, some quando o botão da lupa chega), SE, código, subtítulo e o resumo (trechos, km, selo da NAE e período). O 1º script do cabeçalho, que trocava o texto do h1/eyebrow, vira uma linha que só marca `al-pronto`. As trilhas do cabeçalho têm tamanho fixo (independem da fonte) e a folga do modelo acima do mapa é zerada: o mapa nasce no tamanho final.

## Números antes → depois
`LD01072001`, `AL03037009`, `LD02022033`, `AL01015049`; 1440×900 e 390×844 (`metricas.json`, `cls-teste.json`, `repeticoes.json`, `testes-*.json`). A geometria é igual nos 4.

| | antes | depois |
|---|---|---|
| Topo até o mapa (desktop / celular) | 224 / 226 px | 64 / 66 px |
| Mapa desktop | 924×702 (passa 26 px da janela) | 992×820, todo à vista |
| **Área visível do mapa, desktop** | 624.624 px² (48,2%) | **813.440 px² (62,8%), +30%** |
| Mapa celular | 358×490 | 366×710 |
| **Área visível do mapa, celular** | 175.420 px² (53,3%) | **259.860 px² (78,9%), +48%** |
| Rolagem da página (desktop / celular, LD01072001) | 58 / 526 px | 0 / 0 |
| **CLS (mediana de 3 cargas), desktop** | 0,061 a 0,064 | **0,0047 a 0,0048** |
| **CLS, celular** | 0,066 a 0,069 (AL01015049: 0) | **0 a 0,0125** (reconferido em 2 alimentadores: 0) |
| Painel com as 4 camadas, LD01072001 | 1.528 px (rola) | 820 px (cabe) |
| Painel com T2-A + 4 camadas, LD01072001 (desktop / celular) | 11.409 / 11.965 px | 1.158 / 1.310 px |
| Idem, AL03037009 · LD02022033 · AL01015049 (desktop) | 7.576 · 2.115 · 1.598 px | 1.094 · 820 · 847 px |
| Coluna de legendas sobre o mapa, 4 camadas (desktop / celular) | 598 / 386 px | 156 / 32 px |
| Repetições na tela, soma dos 4, desktop: inicial · 4 camadas · lupa aberta · classe T1 aberta | 4 · 6 · 17 · 13 | 0 · 1 * · 3 ** · 0 |
| Idem, celular: lupa aberta · classe T1 aberta | 13 · 3 | 3 ** · 0 |
| Testes de interação (63 por alimentador, desktop e celular) | n/a | **252 de 252 ok**; 0 erros de JavaScript |

\* Falso positivo do contador no `LD02022033` ("1.019 ativos" na Manutenção = 1.019 trechos). \*\* É a nota da NAE (o total dito de novo na lupa, de propósito: é a conta que fecha 24 com 23).
Prints (`prints-finais/`, 4 pares, 1440 e 390, JPEG 80, `LD01072001` escuro): `01-cabecalho-e-mapa`, `02-lupa-e-nota-da-nae`, `03-trecho-em-abas`, `04-camadas-e-legendas`. Claro e `AL03037009` em `antes-depois/`.

## O que implementar primeiro
| # | O quê | Esforço | Risco | Ganho |
|---|---|---|---|---|
| 1 | Cabeçalho numa faixa + mapa na altura da tela + painel enxuto + cabeçalho escrito pelo gerador (tópicos 1, 2, 6): `painel.css` seções 1, 2/3, 8; `painel.js` blocos A e C; `cabecalho_painel()` | P/M | baixo | +30% / +48% de mapa; CLS 0,06 → 0,005; sem rolagem |
| 2 | Nota da NAE na lupa (tópico 3) | P | baixo (arquivo da outra sessão) | 24 ≠ 23 deixa de parecer erro |
| 3 | Abas no trecho escolhido (tópico 4, bloco F) | M | baixo | 11.409 → 1.158 px |
| 4 | Acordeão + legendas em linha (blocos D, D2, E) | M | médio | painel cabe nos 820 px; legenda 598 → 156 px |
| 5 | Gaveta no celular (bloco G) | G | médio | mapa 490 → 710 px de altura |

O `final.diff` traz os 5 juntos, e é o que foi testado; não testei fatiá-lo (`window.__PROTO = {g:0}` desliga um bloco, letras a a h, só para depurar).

## Riscos
- **Gaveta (5) só foi testada no Chromium emulado**: falta o arrastar por dedo e a barra de endereço do iOS (por isso `100dvh`) em aparelho real.
- **Gancho na lupa:** o `painel.js` usa dela `.lp-lupa`, `.lp-fbt`, `.lp-voltar`, `.barra-busca`/`lp-fechada`, `.lp-tr`, `.lp-so`, `#f-mun`, `window.__sel/__selecao/__limpar/__map` e `doMes()`/`doExt()`. Se a outra sessão renomear algum, o painel perde o gancho em silêncio (a página abre).
- **O gerador falha alto se o modelo mudar:** `cabecalho_painel()` tem `assert` no texto do cabeçalho de `mapa_trechos.html` (eyebrow + `<h1>`) e remove o 1º script por regex.
- **Selo da NAE no HTML** = `len(nae.oc)`; confere com `doMes().length` nos 4. Se o filtro padrão mudar, a JS corrige no carregamento (um dígito troca).
- Janela com menos de 600 px de altura: rolagem normal. Sobra 0,005 de CLS da troca de fonte do Google Fonts. Fora do escopo: croqui da faixa à vista, `role="tabpanel"`, "0,0 km (0%)" no `AL01015049`.
- Um teste do `AL01015049` falhou 1 vez em 3 execuções, na medida do mapa logo depois de sair da tela cheia, com a máquina em carga (layout ainda em transição); repetido, 63 de 63 (o `testes-AL01015049.json` é dessa repetição; a execução com a falha está em `tmp/`).

## Toca nos arquivos/funções (para juntar os 5 temas)
| Arquivo | Mudança |
|---|---|
| `alimentador/site/painel.css` (novo, 204 linhas) | tudo sob `html.al-painel`; não toca em `site.css` nem `alimentador.css` |
| `alimentador/site/painel.js` (novo, 378 linhas) | IIFE depois de `lupa-painel.js`; `a()` resumo, `b()` T1/T2/T3 na tela cheia, `c()` painel enxuto, `d()`/`d2()` legendas, `e()` acordeão, `f()` abas, `g()` gaveta, `hh()` município |
| `alimentador/site/lupa-painel.js` | `desenha()` (+10 linhas, a nota) e a string de CSS (+`.lp-nota`) |
| `scripts/gera_trechos.py` | 4 hunks: `ativos_interface()` copia `painel.js`/`painel.css` (um `for` próprio antes do `for` da lista); `cabecalho_painel(h, c)` nova, antes de `pagina_alimentador`; `pagina_alimentador()`: `<link>` do `painel.css`, `<script>` do `painel.js` depois do `ativos-zoom.js`, chamada de `cabecalho_painel` |
| Não toca | `mapa_trechos.html`, `alimentador.css`, `extras.js`, `limpeza.js`, `inspecao.js`, `manutencao.js`, `executadas.js`, `telacheia.js`, `menu.js`, `site.css` |

Com o tema 5: o modelo reserva uma folga acima do mapa até `al-pronto` (`.al-site:not(.al-pronto) .wrap:not(:has(>.barra-busca))>.stage{margin-top}`); o `painel.css` a zera com `!important` (sem isso o mapa pulava 32 px e o CLS ia a 0,14). O final do tema 5 já remove essa regra: então a linha fica redundante e inofensiva. O `::before` do ☰ do tema 5 cai na célula do ☰ da minha grade (coluna 1, 40 px) e some quando o botão chega. Os dois patches juntos só foram checados com `git apply --check`, não no navegador. Se o tema 5 mudar a marcação dos cartões (`.limp-card`, `.limp-top`), rodar `testes.js`.

## Reproduzir
`python3 gera-paginas.py` (monta `tmp/depois/<AL>.html` com o `cabecalho_painel()` do gerador alterado); `./roda-testes.sh`; `node metricas.js`; `node repeticoes.js --alim=LD01072001,AL03037009,LD02022033,AL01015049`; `node cls-teste.js`; `./roda-prints.sh` + `./copia-prints.sh` (com `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`). `./monta-diff.sh` refaz o `final.diff`. "Antes" = /teste/ ao vivo; "depois" = a mesma página com o patch (HTML do gerador + `painel.css`, `painel.js`, `lupa-painel.js` de `proto/` servidos por `page.route`).
