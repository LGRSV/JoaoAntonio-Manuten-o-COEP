# Tema 1 · Voltar do navegador, tela cheia, 3 defeitos e dados repetidos · FINAL (rodada 4)

Base: HEAD e6bca61 (`alimentador/site/` = /teste/ ao vivo, gh-pages f715a31 "mapa mais leve"; inclui a lupa no painel e **1 clique no alimentador abrindo o painel**). Rebaseado 2 vezes durante a rodada (o `mapa-municipios.js` mudou ~450 linhas no commit do mapa mais leve): fusão de 3 vias sem conflito de lógica; o único ajuste foi pôr `data-cod` nos cartões do novo laço de rótulos. Patch único: `proto/final.diff` (5 arquivos, +210 −18; `git apply --check` na raiz passa no HEAD e6bca61 e na árvore de trabalho de 08:20 UTC; contexto de 1 linha de propósito, para aguentar o `gera_trechos.py` que outra sessão está mexendo). Arquivo novo dentro do diff: `alimentador/site/mapa-extras.js`. Cópias prontas dos 4 arquivos em `proto/`.
**Atenção ao rebase:** o `.diff` da rodada 3 desfazia o "1 clique abre o painel" (foi gerado contra a base de antes). Esta versão foi refeita por fusão de 3 vias contra a base nova (sem conflito) e o "1 clique" está preservado e testado.

## O que muda (6 tópicos)

1. **Voltar do navegador sobe um nível.** Cada nível ganha endereço (`#centro`, `#centro/palmas`, `#centro/palmas/palmas`, `#centro/palmas/palmas/LD02059122`); Voltar/Avançar e o gesto do celular sobem e descem com a mesma animação; ←, Esc e trilha reaproveitam o Voltar (não empilham); a busca que voa vários níveis é 1 entrada só. Links abrem no nível certo, inválidos caem no nível válido mais fundo, título da aba acompanha. Novo: **Voltar de dentro do painel do alimentador devolve ao mapa no município de onde saiu** (testado com a base nova).
2. **Tela cheia: só o que faltava.** O botão `.mt-tc` já é da base. Entram: tecla **F**, **Esc sai da tela cheia antes de subir de nível** (no modo só CSS, iPhone), gesto Voltar do celular sai da tela cheia antes de navegar, e a rolagem da página volta ao lugar ao sair (no nativo ela ia ao topo: medido 19 → 0).
3. **Defeito 1:** a seta ← some debaixo da lista dos alimentadores (computador e celular). Agora mora **na barra**, dentro da trilha.
4. **Defeito 2:** o cartão do polo na regional era um `div` que engolia o clique. Agora é `<button>` (clique, toque, Enter, Espaço, foco visível, `aria-label`) e realça o polo no mapa.
5. **Defeito 3:** o balão do município repetia nome/NAE/regional e cobria o cartão. Agora diz só "2 alimentadores · 907,7 km" + o convite ao clique, e sobe/desce se ainda cobrir o cartão.
6. **Dados repetidos que sobraram, removidos:** nome do polo em chip **e** cartão; contexto "Regional Centro · Polo Palmas" em cada linha da lista da busca vazia; "Palmas › Palmas" (vira "Polo Palmas › Palmas"); balão repetindo cartão e trilha. **Decisão de produto em aberto, NÃO decidida:** NAE nas linhas da lista da busca no computador. O código mantém a NAE (comportamento de hoje) e traz a opção **comentada** em `busca-ativo.js` (`mostra()`, 2 linhas para ligar).

## Números antes → depois (Chromium, `testes*.log`)

| | Antes (base) | Depois |
|---|---|---|
| Entradas de histórico ao descer 4 níveis | 0 (Voltar sai do site) | 4 (Voltar sobe 1 nível por vez) |
| Links `#regional/polo/município/AL` que abrem no nível | 0 de 6 (abre o estado inteiro) | 6 de 6; 5 inválidos tratados |
| Seta ← clicável com a lista aberta (município) | não (`elementFromPoint` = lista) | sim, nos 2 tamanhos |
| Clique no cartão do polo (regional) | ignorado | abre o polo (clique, Enter, Espaço) |
| Balão cobrindo o cartão do próprio município | sim | 0 em 26 pontos × 6 municípios |
| Repetições de informação no mapa/lista | 5 | 0 |
| Verificações automáticas | — | **278 ok escuro + 278 ok claro, 0 falhas** (inclui 6 de "1 clique abre o painel / Voltar do painel volta ao município" por tema); computador, celular com toque, tela cheia nativa/só CSS/negada, Voltar rápido, F5, girar tela |
| Fluidez (`medidas.log`, 3 repetições, mediana) | — | **sem diferença acima do ruído**: ex. computador, regional→polo, maior intervalo 67 → 67 ms; município→alimentador 267 → 217 ms; celular polo→município 183 → 100 ms. Com CPU 4x há oscilações nos dois sentidos (custo é o desenho da rede, tema 5) |

Prints em `prints-finais/` (4 pares, 1440 e 390, escuro): 01 link `#sul/gurupi` (base ignora, depois abre no polo) · 02 município (← coberta × na barra) · 03 regional (chips repetidos × cartão-botão) · 04 balão (repete e cobre × enxuto).

## O que implementar primeiro

| # | O quê | Esforço | Risco |
|---|---|---|---|
| 1 | `mapa-extras.js` + 2 linhas no `gera_trechos.py` (Voltar, links, F, Esc primeiro) | M | baixo (sem o arquivo o site é o de hoje) |
| 2 | Defeitos 1, 2 e 3 (← na barra, cartão-botão, balão) | P | baixo |
| 3 | Repetições removidas (chips, lista da busca vazia, trilha) | P | baixo; vai junto com o nº 2 (mesmas funções) |
| 4 | Decidir a NAE nas linhas da lista (opção comentada pronta) | P | — |
| 5 | Depois: com a ← na barra, a reserva de 52 px no topo e no pé do `enquadra()` no celular sobra (+~100 px de mapa); unificar `telacheia.js` e `.mt-tc` | P / M | médio / baixo |

## Riscos e limites

- Depende de 3 contratos do `mapa-municipios.js`: `ARGOS_MAPA.vai/nivel`, evento `argos-nivel`, `.mt-tc` + `.mt-cheia` (`node testes.js historico-d` avisa se mudarem). Quem explora muito acumula entradas no histórico.
- Só Chromium emulado; **não testado em iPhone/Android reais** nem dentro do iframe do Artifact (cai no CSS e o `history` em `try/catch`).
- Na tela cheia só CSS, mudar de nível e sair pelo botão deixa 1 Voltar "vazio" (caso raro).
- Medição do passo município→alimentador mudou de método: a base nova abre o painel ao clicar na lista, então o alimentador em foco vem da busca (mesmo método antes e depois).

## Toca nos arquivos/funções (para juntar os 5 temas)

- **novo** `alimentador/site/mapa-extras.js` (130 linhas, IIFE própria; só lê `ARGOS_MAPA`, `MUN`, `argos-nivel`, `.mt-tc`).
- `alimentador/site/mapa-municipios.js` (+58 −~12): handler `mousemove` do `svg` (balão `dica`, ~L291-312); criação de `legPolos`/`volta`/`lado` + novo `trilha` (~L346-385); `legendaEstado/Regional/Polo` e `trilhaMun` (~L463-600, saem os chips `.mt-pchip` da regional); `t.dataset.cod` no laço de `nomes2`; `poeSelos()` + 3 listeners novos em `selos` (cartão `div` → `button`). **Não toca** `focaAl`, `abreAl`, `enquadra`, bandeirinhas, tela cheia.
- `alimentador/site/site.css` (+23): bloco novo no fim (`.mt-trilha`, `.mt-volta` na barra, `button.mt-pm`, `.mt-dica small.sem-h`, `.mt-dica.abaixo`).
- `alimentador/site/busca-ativo.js` (+~10): `item.polo/mun` (parâmetro `curto`), `atalhos()` (títulos "· por NAE"), comentário da opção NAE em `mostra()`.
- `scripts/gera_trechos.py` (+4): `ativos_interface()` (1 `copyfile` do `mapa-extras.js` após o laço) e `interface()` (tag depois de `busca-ativo.js`).
- Conflito provável: tema 3 (tipografia) em `.mt-dica` e nos cartões `.mt-pm`/`.mt-mn`; tema 2 (zoom) no `mousemove`/`svg`; tema 5 se mexer em `legendaRegional`. Nenhum toca o painel.

## Reproduzir

`node testes.js` (`CLARO=1` para o claro; `um-clique` para o novo), `node finais.js` (prints-finais), `node medidas.js`. `lib.js` serve `live/` (= arquivos atuais) ou `proto/` no lugar dos assets; `live/mapa-municipios-dados.js` e `index.html` vieram da rodada 3 (a home não mudou no commit da lupa).
