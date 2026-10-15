# Tema 1 · Voltar do navegador, defeitos e dados repetidos · rodada 3 (consolidação)

Base: o /teste/ ao vivo de agora (gh-pages 5cdff04f), idêntico byte a byte a `alimentador/site/` (conferido para `site.css`, `mapa-municipios.js`, `busca-ativo.js`, `menu.js`). Tudo foi feito por injeção no navegador (Playwright), sem tocar no repositório e sem commit. Prints em JPEG, 1440x900 (`d`) e 390x844 (`m`), escuro e claro (`-claro`).
A tela cheia (`.mt-tc`) **já existe na base e não foi refeita**: daqui só entra o que faltava dela (tecla F, Esc saindo primeiro, rolagem restaurada, Voltar do celular), como parte do arquivo novo.

## Resumo

1. **`proto/mapa-extras.js` (novo, ~150 linhas), rebaseado e testado contra a base atual:** Voltar/Avançar e o gesto do celular sobem e descem um nível do mapa (`#centro`, `#centro/palmas`, `#centro/palmas/palmas`, `#centro/palmas/palmas/LD02059122`), links abrem no nível certo, título da aba acompanha; mais F, Esc-sai-primeiro, rolagem restaurada e gesto Voltar na tela cheia só por CSS. **Nenhum JavaScript existente muda por causa dele** (usa `ARGOS_MAPA`, `MUN`, o evento `argos-nivel` e o botão `.mt-tc`); só uma tag no gerador.
2. **Os 3 defeitos da rodada 2 continuam na base e estão corrigidos:** (1) a seta ← some debaixo da lista dos alimentadores; (2) o cartão do polo na regional é um `div` que engole o clique; (3) o balão do município repete e cobre o cartão. Agora a ← mora na barra, o cartão do polo é o botão e o balão só diz o que falta.
3. **Dados repetidos reavaliados nos prints da base nova:** muita coisa já tinha saído (legenda, NAE nos chips), mas sobraram 5: nome dos polos em chip **e** cartão; balão com nome/NAE/regional que o cartão e a trilha já dizem; "Regional Centro · Polo Palmas" em cada linha da lista da busca vazia; "Palmas › Palmas" na trilha; ← igual ao passo anterior da trilha (e coberta). Todos removidos.
4. **272 verificações automáticas passam, em escuro e em claro** (`testes.log`, `testes-claro.log`; computador e celular com toque; tela cheia nativa, só CSS e negada; Voltar rápido; F5; girar a tela). Medições antes/depois: sem diferença acima do ruído (`medidas.log`).
5. **Entrega:** `proto/*.diff` aplicam limpo (`patch -p1`) sobre `alimentador/site/` e `scripts/gera_trechos.py`; não testado em iPhone/Android reais.

**Sugestão nº 1 recomendada: publicar o `mapa-extras.js` (Voltar do navegador) + a correção dos 3 defeitos juntos** — arquivo novo mais um diff pequeno, risco baixo, e no celular o gesto de voltar deixa de expulsar a pessoa do mapa.

## O que implementar primeiro (lista priorizada)

| # | O quê | Esforço | Risco | Arquivos |
|---|-------|---------|-------|----------|
| 1 | **Voltar do navegador sobe um nível + links `#regional/polo/município/AL`** (+ F, Esc primeiro, rolagem e gesto Voltar na tela cheia só por CSS) | M | baixo (sem ele o site é o de hoje) | novo `assets/mapa-extras.js`; `scripts/gera_trechos.py` (2 linhas: copiar o asset e a tag depois de `busca-ativo.js`) |
| 2 | **Corrigir os 3 defeitos**: ← na barra, cartão do polo clicável (botão, teclado, foco), balão que não cobre o cartão | P | baixo | `mapa-municipios.js` (~60 linhas), `site.css` (~30 linhas) |
| 3 | **Tirar os dados repetidos**: chips dos polos, balão enxuto, lista da busca vazia sem o contexto da trilha, "Polo Palmas" na trilha | P | baixo | `mapa-municipios.js`, `busca-ativo.js` (~10 linhas) — vão no mesmo diff do nº 2 |
| 4 | Decisão de produto: manter a NAE nas linhas da lista da busca (mantive) ou tirar | P | — | `busca-ativo.js` |
| 5 | Sugestão para o tema do mapa: com a ← na barra a reserva de 52 px no topo e 52 px no pé do enquadramento no celular (`enquadra()`) deixou de ser necessária; o mapa pode crescer ~100 px | P | médio (mexe nas bandeirinhas) | `mapa-municipios.js` |
| 6 | Sugestão: `telacheia.js` (painel) e `.mt-tc` (início) fazem a mesma coisa; unificar numa função só | M | baixo | `telacheia.js`, `mapa-municipios.js` |

Nº 2 e nº 3 estão no mesmo `mapa-municipios.js.diff` porque mexem nas mesmas funções (`legendaRegional`, `poeSelos`, `mousemove`); se quiser separar, o nº 3 são: o bloco do `mousemove` (balão), `legendaRegional`, os dois "Polo " da trilha e o `busca-ativo.js.diff`.

## Como ver e reproduzir

- `proto/`: `mapa-extras.js` (novo), `site.css`, `mapa-municipios.js`, `busca-ativo.js` (cópias do ao vivo com as alterações), os `.diff` contra `/home/user/smartled/alimentador/site/` e `gera_trechos.py.diff` contra `scripts/gera_trechos.py`. `live/` guarda os arquivos ao vivo usados como "antes".
- `lib.js` abre a página (o Chromium daqui não confia na CA do proxy: HTML e dados vêm por `curl`; `proto/` entra no lugar dos assets e a tag do `mapa-extras.js` entra depois de `busca-ativo.js`, onde o gerador a poria; `SEM_EXTRAS=1` tira só ela).
- `node prints.js antes|depois|links|css|todos` gera os prints; `node testes.js [historico-d|historico-m|cheia-d|cheia-m|extras|repeticoes|defeitos|estresse]` (`CLARO=1` para o tema claro); `node medidas.js` gera `medidas.json`/`medidas.log`.

---

## S1 · Voltar do navegador e links (mapa-extras.js) · P/M · risco baixo

**Problema.** O mapa tem cinco níveis e nenhum muda o endereço nem o histórico: quem desce quatro níveis e faz o gesto de voltar sai do site, e não dá para mandar o link de um polo ou município. Abrir `#sul/gurupi` hoje ignora o `#`: `prints/antes-d-link-ignorado.jpg`, `antes-m-link-ignorado.jpg` (abre no estado inteiro). Na tela cheia só por CSS (iPhone, iframe sem permissão) o Esc **sobe um nível antes de sair** (o nativo sai primeiro), não há tecla F e o gesto Voltar do celular expulsa em vez de sair da tela cheia; no modo nativo a página volta ao topo ao sair (medido: rolagem 19 → 0).

**Proposta.** Um arquivo novo, carregado depois de `busca-ativo.js`:
- Endereço por nível: regional `#centro`, polo `#centro/palmas`, município `#centro/palmas/palmas`, alimentador `#centro/palmas/palmas/LD02059122` (sem acento e minúsculas; tanto faz a caixa ao abrir).
- Descer empilha uma entrada; Voltar/Avançar sobem e descem com a mesma animação; ←, Esc e trilha **reaproveitam o Voltar** (não empilham: "Esc e depois Voltar" nunca desce de novo); salto de vários níveis pela trilha empilha; a **busca que voa por vários níveis é uma entrada só**.
- Abrir um link (ou F5) leva direto ao nível; endereço inválido cai no nível válido mais fundo e a barra é corrigida; `#zzz` é deixado quieto; num link aberto direto o Voltar sai do site (normal).
- Título da aba: `Palmas · ARGOS Manutenção`, `Polo Palmas · …`.
- Tela cheia (o botão é o da base): **F** liga/desliga (ignorada em campos de texto); no modo só CSS o **Esc sai primeiro** e o **gesto Voltar sai antes de subir** (uma entrada "sentinela" no histórico); a rolagem da página volta ao lugar de antes ao sair.
- `history.*` em `try/catch`: dentro do iframe do Artifact o mapa funciona igual, só sem histórico.

**Como fica.** `prints/depois-d-voltar-folha.jpg` e `depois-m-voltar-folha.jpg` (alimentador → município → polo → regional → estado, com o endereço de cada quadro); links abertos direto: `depois-d-link-polo.jpg` (`#sul/gurupi`), `depois-m-link-polo.jpg`, `depois-d-link-alimentador.jpg`, `depois-m-link-alimentador.jpg`; tela cheia só por CSS com a barra e a ←: `depois-d-cheia-css-mun.jpg`, `depois-m-cheia-css-mun.jpg`; tela cheia nativa: `antes-d-cheia-alimentador.jpg` × `depois-d-cheia-alimentador.jpg` (e `-m-`).

**Testado** (computador e celular, `testes.log`): hash correto nos 4 níveis e +4 entradas; Voltar ×4 e Avançar ×4; Esc e ← não empilham; trilha com salto e Voltar que devolve; busca "Lagoa da Confusão" e "LD01072001" = **uma** entrada; `#sul` à mão; 6 links válidos e 5 inválidos; Voltar num link direto sai do site. Tela cheia nativa, só CSS e API recusada: entrar/sair por botão, F, Enter, Espaço, `exitFullscreen` (o que o Esc nativo chama) e Esc simulado, "f" digitado no campo não alterna, Shift+K dentro dela, lista da busca dentro dela, rolagem restaurada, sentinela (entrar e sair não deixa Voltar morto; Voltar na tela cheia sobe e só o último sai), girar a tela, paisagem 844x390, movimento reduzido. Tentando quebrar: 4 Voltar sem esperar a animação, 2 Avançar seguidos, Voltar com a lista da busca aberta, F5 no município, trocar o endereço com a tela cheia ligada. Sem erros de JavaScript.

**Esforço M · Risco baixo.** Depende de 3 contratos do `mapa-municipios.js` (`ARGOS_MAPA.vai/nivel`, evento `argos-nivel`, `.mt-tc` + classe `.mt-cheia`); `node testes.js historico-d` avisa se algum mudar. Efeito colateral: quem explora muito acumula entradas no histórico (uma por nível descido).

## S2 · Os 3 defeitos (confirmados na base e corrigidos) · P · risco baixo

| # | Defeito na base | Prova (antes) | Correção | Depois |
|---|---|---|---|---|
| 1 | A seta ← fica **coberta pela lista dos alimentadores** no município (computador e celular; `elementFromPoint` devolve a linha da lista) | `antes-d-mun-notas.jpg` (nº 2), `antes-m-mun.jpg`; `testes.log` ("ANTES · DEFEITO 1 confirmado") | A ← vira o 1º item do grupo da trilha, **dentro da barra** (sempre acima da lista). No celular a trilha fica na linha do olho (do polo em diante começa em "Centro ›" ou "Polo Palmas ›": Tocantins e a regional saem, a ← e o Voltar levam até lá) porque a lista abre embaixo dessa linha e cobriria uma segunda | `depois-d-mun.jpg`, `depois-m-mun.jpg`, `depois-m-alimentador.jpg`, claro: `depois-d-mun-claro.jpg`, `depois-m-mun-claro.jpg` |
| 2 | O cartão do polo na regional é um `div` (`.mt-selos .mt-pm`) que **não responde ao clique** (o `elementFromPoint` é o selo de NAE dentro dele); só o chip da barra abria o polo | `antes-d-regional-notas.jpg`; `antes-m-regional.jpg` | O cartão vira `<button>` (clique, toque, Enter, Espaço, foco visível, `aria-label` "Abrir o polo Palmas, 434 NAE"); passar o mouse realça o polo no mapa; o foco do teclado sobrevive ao recálculo ao girar a tela | `depois-d-regional.jpg`, `depois-m-regional.jpg`, claro: `depois-d-regional-claro.jpg` |
| 3 | O balão do município (polo aberto) repete nome, NAE e "Regional Centro · Palmas" (já no cartão e na trilha) e, mais alto que o cartão, **cobre** o dele ou o do vizinho | `antes-d-polo-balao.jpg`, `antes-m-polo-balao.jpg` | Com o cartão no mapa o balão traz só "2 alimentadores · 907,7 km" + o convite ao clique; se mesmo assim cobrir o cartão do próprio município, sobe para cima do cartão (ou desce, sem espaço). Sem cartão com nome (cartão só de número) ou na regional, volta a dizer o nome; no estado diz regional e polo | `depois-d-polo-balao.jpg`, `depois-m-polo-balao.jpg`, claro `-claro` |

**Testado:** os 3 defeitos aparecem na base e somem no protótipo, nos dois tamanhos; balão: 26 pontos do mouse em 6 municípios, nenhum cobre o cartão do próprio município (computador e celular); ← visível e clicável com a lista aberta; trilha na linha do olho no município e no alimentador; cartão do polo abre por clique, Enter e Espaço.

**Esforço P · Risco baixo.** `mapa-municipios.js.diff` e `site.css.diff`.

## S3 · Dados repetidos: o que a base já resolveu e o que sobrou · P · risco baixo

Reavaliação, nível a nível (prints "antes" com caixas amarelas: `antes-d-regional-notas.jpg`, `antes-m-regional-notas.jpg`, `antes-d-mun-notas.jpg`, `antes-m-mun-notas.jpg`):

| Repetição da rodada 2 | Hoje na base | O que fiz |
|---|---|---|
| Nome do polo no chip da barra e no cartão do mapa (regional) | **Continua** (o chip só perdeu a NAE) | Chips saem; a barra diz "Tocantins › Centro" e o cartão é o botão. No celular libera uma linha |
| Balão repete nome/NAE/regional do cartão e da trilha | **Continua** | Balão enxuto (S2 nº 3) |
| Contexto "Polo Palmas · Centro" em cada linha da lista da busca vazia | **Continua** | No campo vazio a linha diz só "12 municípios" / "46 alimentadores"; o título diz a ordem ("… · por NAE"). **Digitando** o contexto continua (não há trilha para dizê-lo). Prints: `antes-d-busca-polo.jpg` × `depois-d-busca-polo.jpg` (e `-m-`) |
| NAE em cada linha da lista, que o cartão mostra | Continua; **decidi manter**: a lista é um ranking e o botão da legenda (recolher) já tira a NAE de todos os lugares, lista inclusive | Decisão de produto (nº 4 da lista) |
| Trilha "Palmas › Palmas" | **Continua** | "Tocantins › Centro › Polo Palmas › Palmas" (e "Polo Palmas 434" no polo) |
| Seta ← igual ao passo anterior da trilha | Continua, e coberta | Fica (é o alvo de toque grande do celular), mas dentro da trilha (S2 nº 1) |
| Legenda, faixas, regionais (3.130/1.655/963) | **Já resolvido pela base** (legenda em faixa única; regionais só nos cartões) | nada |

Deixei de propósito o balão da rede dos alimentadores (código + NAE): a lista pode estar rolada e ele traz a SE e os km que a lista não mostra.

**Testado:** sem chips de polo na regional; "Tocantins › Centro" é a barra inteira; lista da regional e do polo sem "Regional/Polo/Centro" nas linhas e **com** NAE; busca "palmas" ainda traz o contexto; trilha "Polo Palmas › Palmas". **Esforço P · Risco baixo** (`busca-ativo.js.diff`: parâmetro `curto` em `item.polo`/`item.mun` só em `atalhos()`).

## Rodadas 1 e 2: o que virou obsoleto, o que foi mantido

- **R1 S1 (painel esquerdo único com legenda + lista)**: obsoleto, a base fez outro desenho (lista embaixo do olho, legenda na barra). **R1 S3 e R2 S1 (tela cheia)**: a base já tem; ficam só os extras do S1 acima. **R1 S4/S5 (busca renovada, busca que voa)**: feitos pela outra sessão (`ARGOS_MAPA.vai`). **R1 S2 / R2 S3 (repetições)**: refeito sobre a base nova (S3). **R2 S2 (Voltar)**: mantido e rebaseado (S1).

## Medições (Chromium, 3 repetições, mediana; `medidas.log`)

Quadros durante a transição e maior intervalo entre quadros, base × protótipo. Regional e polo: protótipo igual ou um pouco melhor (computador: maior intervalo 67 → 50 ms e 83 → 67 ms; celular 67 → 33 ms no polo). Município e alimentador (rede de milhares de traços): **sem diferença acima do ruído** (computador, município→alimentador: tarefa longa máxima de 114 a 349 ms na base e de 176 a 399 ms no protótipo em 6 repetições, e o mesmo intervalo com `SEM_EXTRAS=1`; o custo é do desenho da rede, tema 5). Com CPU 4x mais lenta os números se mantêm. `pushState` e o título não aparecem nas tarefas longas.

## Limites e o que não deu para testar

- Só Chromium com viewport e toque emulados; **não testei em iPhone/Android reais**. No Chrome real o Esc nativo não chega à página: simulei com `exitFullscreen()` e deixei uma guarda de 250 ms que engole um Esc que chegue logo depois da saída. O fallback do iPhone foi simulado removendo a API; o gesto Voltar do Android em tela cheia nativa deve sair da tela cheia antes de navegar (comportamento do navegador, não verifiquei).
- Não testei dentro do iframe do Artifact real (sem `allow="fullscreen"` cai no CSS, testado como "API recusada"; sandbox sem `history` funciona sem histórico, `try/catch`).
- No celular, com o campo de busca aberto o campo ocupa a linha toda e a ← e a trilha vão para a linha de baixo, coberta pela lista da busca (já era assim na base); fechada a busca, aparecem. Do polo em diante a trilha do celular não mostra "Tocantins" (nem a regional no alimentador).
- Na tela cheia só por CSS, se a pessoa mudar de nível dentro dela e sair pelo botão, sobra uma entrada "sentinela" (um Voltar que não muda nada); no caso comum (entrar e sair) não sobra.
- Observação da base (não corrigida, fora do tema): se alguém apaga o campo da busca e clica num município em menos de 120 ms, o atraso do campo fecha a lista do município recém-aberta; só apareceu em teste automático.
- Fontes IBM Plex carregadas pelo `curl` do Google Fonts: as larguras são as de produção.
