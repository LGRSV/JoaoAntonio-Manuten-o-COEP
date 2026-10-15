# Tema 4 · Painel do alimentador: versão final (rodada 4)

Patch único `proto/final.diff` (contra a raiz do repositório, `git apply --check` passa no HEAD atual `f76584c` e também depois de cada um dos finais dos temas 1, 2, 3 e 5 aplicado sozinho). Base: `alimentador/site/` = /teste/ ao vivo, já com a **lupa no repositório** (`alimentador/site/lupa-painel.js`, sha256 `7bd7c62e…`, igual à do Artifact que usei na rodada 3: o acréscimo na lupa é o mesmo, agora aplicado no arquivo do repositório). Nada foi editado no repositório, nada foi publicado.

## O que muda (6 tópicos)
1. **Cabeçalho numa faixa só (64 px) e mapa na altura da tela.** `☰ · ← Municípios · código · SE | 199 trechos · 153,98 km · NAE 23` na linha de cima; o resumo fica sobre o painel (coluna de 400 px). Mapa todo à vista, sem rolar a página.
2. **Painel só com o que a lupa não diz.** Saem a tabela Classe/Trechos/Extensão, o bloco "NAE - vegetação", a lista de trechos e a legenda de cores do painel (a lupa e o resumo do cabeçalho já dizem). Sem camada ligada: aviso com o botão "Escolher camadas".
3. **Nota da NAE na lupa** (~10 linhas): "Soma das classes 24 = NAE do alimentador 23 + 3 de outros alimentadores que estão em trechos daqui − 2 sem trecho." A conta fecha nos 4 alimentadores (24 = 23+3−2 · 32 = 37+1−6 · 61 = 60+1 · 3 = 3, sem nota); só aparece quando fecha.
4. **Trecho escolhido: ficha curta + abas** `NAE · Faixa · Inspeção · Insp→manut · Manutenção` com a contagem de cada uma; camadas do alimentador inteiro recolhidas em acordeão (abre o cartão da camada que se liga na lupa) e legendas do mapa em linha (cor + nome, sem repetir os números do cartão).
5. **Celular: mapa quase na tela inteira e painel numa gaveta inferior** (fechada, 46% ou 88%; escolher um trecho sobe a gaveta e o mapa enquadra o trecho na parte livre; abrir a lupa desce a gaveta).
6. **O gerador passa a escrever o cabeçalho no HTML (para o CLS cair):** classe `al-site al-painel` no `<html>`, caminho com a seta ← (link `.lp-voltar-ph`, some quando o botão da lupa chega), SE, código, subtítulo e o resumo (trechos, km, selo da NAE com o período) já saem prontos; o 1º script do cabeçalho (que trocava o texto do h1/eyebrow depois) vira uma linha que só marca `al-pronto`. As trilhas do cabeçalho têm tamanho fixo (não dependem da fonte), o que impede o mapa de se mover quando o Google Fonts troca a fonte.

## Números antes → depois
Medidos em `LD01072001`, `AL03037009`, `LD02022033`, `AL01015049`, 1440×900 e 390×844 (`metricas.json`, `cls-teste.json`, `repeticoes.json`, `testes-*.json`). A geometria é a mesma nos 4 alimentadores.

| | antes | depois |
|---|---|---|
| Topo da página até o mapa (desktop / celular) | 224 / 226 px | 64 / 66 px |
| Mapa (desktop) | 924×702, passa 26 px da janela | 992×820, todo à vista |
| **Área visível do mapa, desktop** | 624.624 px² (48,2% da janela) | **813.440 px² (62,8%), +30%** |
| Mapa (celular) | 358×490 | 366×710 |
| **Área visível do mapa, celular** | 175.420 px² (53,3%) | **259.860 px² (78,9%), +48%** |
| Rolagem da página (desktop / celular, LD01072001) | 58 / 526 px | 0 / 0 |
| **CLS da página, desktop (mediana de 3, 4 alimentadores)** | 0,061 a 0,064 | **0,0047 a 0,0048** |
| **CLS da página, celular** | 0,066 a 0,069 (AL01015049: 0) | **0 a 0,0125** |
| Painel com as 4 camadas ligadas, LD01072001 | 1.528 px (rola dentro da caixa) | 820 px (cabe) |
| Painel com o trecho T2-A e as 4 camadas, LD01072001 (desktop / celular) | 11.409 / 11.965 px | 1.158 / 1.310 px |
| Idem, AL03037009 · LD02022033 · AL01015049 (desktop) | 7.576 · 2.115 · 1.598 px | 1.094 · 820 · 847 px |
| Coluna de legendas sobre o mapa, 4 camadas (desktop / celular) | 598 / 386 px | 156 / 32 px |
| Repetições de dados na tela (soma dos 4 alimentadores), desktop: inicial · 4 camadas · lupa aberta · classe T1 aberta | 4 · 5 · 17 · 13 | 0 · 1 * · 3 ** · 0 |
| Idem, celular: lupa aberta · classe T1 aberta | 13 · 3 | 3 ** · 0 |
| Testes de interação (63 por alimentador, desktop e celular) | n/a | **252 de 252 ok**, 0 erros de JavaScript |

\* Falso positivo do contador no `LD02022033` ("1.019 ativos" na Manutenção = 1.019 trechos). \*\* É a nota da NAE (dado do cabeçalho dito de novo na lupa, de propósito: é a conta que fecha 24 com 23).

Prints (`prints-finais/`, pares antes/depois, 1440 e 390, JPEG 80): `01-cabecalho-e-mapa`, `02-lupa-e-nota-da-nae`, `03-trecho-em-abas`, `04-camadas-e-legendas` (`LD01072001`, escuro). Os demais (claro, `AL03037009`) estão em `antes-depois/`.

## O que implementar primeiro
| # | O quê | Esforço | Risco | Ganho |
|---|---|---|---|---|
| 1 | Cabeçalho numa faixa + mapa na altura da tela + painel sem tabela/lista/NAE + o que o gerador escreve no HTML (tópicos 1, 2 e 6): `painel.css` seções 1, 2/3, 8 e `painel.js` blocos A e C, `cabecalho_painel()` | P/M | baixo | +30% (desktop) e +48% (celular) de mapa; CLS 0,06 → 0,005; fim da rolagem da página |
| 2 | Nota da NAE na lupa (tópico 3, ~10 linhas) | P | baixo (arquivo da outra sessão) | 24 ≠ 23 deixa de parecer erro |
| 3 | Abas no trecho escolhido (tópico 4, bloco F) | M | baixo | 11.409 → 1.158 px |
| 4 | Acordeão das camadas + legendas em linha (tópico 4, blocos D, D2, E) | M | médio | painel cabe nos 820 px; legenda 598 → 156 px |
| 5 | Gaveta no celular (tópico 5, bloco G) | G | médio | mapa de 490 → 710 px de altura (testar em aparelho real antes) |

O `final.diff` já traz os 5; se for preciso entregar aos poucos, `painel.js` tem o interruptor `window.__PROTO = {g:0}` (letras a a h = blocos de `painel.js`; cada um desliga sem os outros).

## Riscos
- **Gaveta (5) não foi testada em aparelho real**: o arrastar por dedo (pointer events) e a barra de endereço do iOS (por isso `100dvh`). Testada só no Chromium emulado.
- **Acréscimo na lupa** (`desenha()` + 1 linha de CSS `.lp-nota`): o arquivo é da outra sessão; o resto do patch só usa dela `.lp-lupa`, `.lp-fbt`, `.lp-voltar`, `.barra-busca`/`lp-fechada`, `.lp-tr`, `.lp-so`, `#f-mun`, `window.__sel/__selecao/__limpar/__map`, e as globais `doMes()`/`doExt()`. Se ela renomear algum, o `painel.js` perde o gancho em silêncio (a página continua abrindo).
- **O gerador falha alto se o modelo mudar**: `cabecalho_painel()` tem `assert` no texto do cabeçalho de `mapa_trechos.html` (eyebrow + `<h1>`) e remove o 1º script por expressão regular. O patch do tema 5 mexe em `mapa_trechos.html` mas não nessas linhas (conferido: aplicam juntos).
- **Selo da NAE no HTML**: o número escrito pelo gerador (`len(nae.oc)`) confere com `doMes().length` nos 4 alimentadores; se o filtro padrão mudar, a JS corrige no carregamento (o único custo é um dígito trocar de lugar).
- Abaixo de 600 px de altura de janela o leiaute cai para rolagem normal (`min-height:600px`); as fontes do Google Fonts ainda trocam e mexem no texto do cabeçalho (o que sobra de CLS, 0,005).
- Fica de fora: croqui da faixa à vista (3 cliques hoje); `role="tabpanel"`; "0,0 km (0%)" no `AL01015049`.

## Toca nos arquivos/funções (para juntar os 5 temas)
| Arquivo | Mudança | Onde |
|---|---|---|
| `alimentador/site/painel.css` (novo, 204 linhas) | tudo escopado em `html.al-painel`; não toca no `site.css` nem no `alimentador.css` | seções 1 a 8 |
| `alimentador/site/painel.js` (novo, 378 linhas) | IIFE, blocos A a H; roda depois de `lupa-painel.js`, lê `window.D` | `a()` resumo, `b()` T1/T2/T3 da tela cheia, `c()` painel enxuto, `d()`/`d2()` legendas, `e()` acordeão, `f()` abas, `g()` gaveta, `h()` município |
| `alimentador/site/lupa-painel.js` | +10 linhas (nota da NAE) e +1 linha de CSS | `desenha()` e a string de CSS (`.lp-nota`) |
| `scripts/gera_trechos.py` | `cabecalho_painel(h, c)` (função nova, antes de `pagina_alimentador`); `pagina_alimentador()`: `<link>` do `painel.css`, `<script>` do `painel.js` depois do `ativos-zoom.js`, chamada de `cabecalho_painel`; `ativos_interface()`: copia `painel.js` e `painel.css` (um `for` próprio, logo antes do `for` da lista de assets) | 4 hunks, nenhum encosta nos dos temas 1, 2, 3 e 5 |
| Não toca | `alimentador/mapa_trechos.html`, `alimentador.css`, `extras.js`, `limpeza.js`, `inspecao.js`, `manutencao.js`, `executadas.js`, `telacheia.js`, `menu.js`, `site.css` | os blocos de `painel.js` reaplicam-se por `MutationObserver` aos cartões das camadas; se o tema 5 mudar a marcação `.limp-card`/`.limp-top`, rodar `testes.js` |

Pegadas para o tema 5: o modelo atual reserva uma folga acima do mapa até `al-pronto` (`.al-site:not(.al-pronto) .wrap:not(:has(>.barra-busca))>.stage{margin-top:…}`); o `painel.css` a zera com `!important` só no leiaute novo (sem isso o mapa pulava 32 px no fim da carga e o CLS ia a 0,14). O final do tema 5 já remove essa regra: nesse caso a linha do `painel.css` fica redundante e inofensiva. A regra do ☰ do tema 5 (`.wrap:not(:has(>.mnu))::before`) cai na célula do ☰ da minha grade (coluna 1, linha 1, 40 px) e some quando o botão chega: sem deslocamento. Não testei os dois patches juntos no navegador (só `git apply --check`).

## Como reproduzir
`python3 gera-paginas.py` (monta `tmp/depois/<AL>.html` com a função `cabecalho_painel()` do gerador já alterado), depois `./roda-testes.sh`, `node metricas.js`, `node repeticoes.js --alim=LD01072001,AL03037009,LD02022033,AL01015049`, `node cls-teste.js`, `./roda-prints.sh` e `./copia-prints.sh` (todos precisam de `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`). `./monta-diff.sh` refaz o `proto/final.diff` a partir de `proto/*` e `tmp/repo/scripts/gera_trechos.py`. "Antes" = /teste/ ao vivo; "depois" = a mesma página com o `final.diff` (HTML do gerador + `painel.css`, `painel.js` e `lupa-painel.js` de `proto/` servidos por `page.route`).
