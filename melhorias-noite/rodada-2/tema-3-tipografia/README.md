# Tema 3 · Tipografia e design do mapa (rodada 2)

**Base usada:** `alimentador/site/` em 15/10 às 05:20 (commit `da85625`, já com o cartão do município "ao lado, ligado por um fio" quando não cabe dentro). Está em `orig-head/`; todos os "antes" são ela, injetada no navegador, e não o /teste/ ao vivo (que pode estar um commit atrás). Depois das 05:20 a árvore de trabalho ainda ganhou as "bandeirinhas" das regionais/polos e a lista do município sem km e subestação; não estão na base (ver "Como aplicar").

**Resumo (5 linhas)**
1. Espaçamento nos 8 polos em 4 telas (1440x900, 1280x720, tablet 820x1100, celular 390x844): no computador está bom (127 de 139 municípios com o nome dentro da forma), mas no celular só **58 de 139 têm o nome dentro**, 45 usam o cartão com fio e **35 ficam só com o número**. A causa não é falta de afastamento: no celular o mapa usa 30–45% da altura da tela e, no computador, o polo alto deixa metade da largura vazia. Afastar igual em todo o polo não resolve (o mapa encolhe e as distâncias em pixels ficam as mesmas).
2. **Afastamento adaptativo** (protótipo): depois do afastamento base, os municípios se espalham só no eixo que sobra tela, e o celular ganha moldura de altura fixa. Nome dentro da forma: computador 127 → 134, notebook 109 → 125, celular 58 → 91; cartões com fio 45 → 34 e "só número" 35 → 14 no celular; sem sobreposição em nenhum caso. Nome curto (sem " do Tocantins") no cartão compacto ajuda a caber.
3. **Município e foco no alimentador com o cartão preto:** a lista embaixo da busca vira cartão (município em Plex Condensed + selo "380 NAE", que sumia nesse nível), e o alimentador focado ganha um cartão no mapa (código, NAE, subestação, km, "Abrir a página →"). Corrigi um corte: com o alimentador em foco o SVG encolhia e a rede era cortada numa borda reta.
4. **Acabamento e ranking:** o selo pede Plex Mono 700, que o site não carrega (negrito sintético borrado em 32 textos) → 600 verdadeiro; fontes reserva com as métricas do Plex tiram o salto de layout da página de ranking no celular (CLS 0,172 → 0,0007 com fontes lentas). O ranking ganha marca ARGOS, escolha de polo com selo, cartão preto no escolhido e NAE da linha em selo; tema claro conferido nos 8 polos.
5. Protótipos em `proto/` (injeção Playwright; `proto/mudancas.diff`), prints em `prints/` (JPEG, escuro e claro, 1440x900 e 390x844), métricas em `metricas-antes.json` e `metricas-depois.json`, scripts reproduzíveis na raiz.

**Sugestão nº 1 recomendada: afastamento adaptativo + moldura fixa do mapa no celular (sugestão 1).** É o pedido do usuário ("espaça mais as cidades") com ganho medido em todos os polos e telas, e custa uma função (`ajusta`) e um `enquadra` reescrito. A seguir, a 3 (cartão do alimentador focado), que muda o uso e corrige o corte da rede.

**Como reproduzir:** `node prints.js antes|depois [filtro] [dark,light]`, `node metricas.js antes|depois [telas]`, `node perf.js`, `node fontes.js antes|depois`, `node fontes-cls.js antes|depois`, `node selos.js`, `python3 folhas.py`. `rede.js` busca o site ao vivo por curl (o Chromium do sandbox não confia na CA do proxy) e entrega por `page.route`, trocando `assets/site.css`, `mapa-municipios.js`, `busca-ativo.js` e `ranking-polos.js` por `orig-head/` ("antes") ou `proto/` ("depois").

Nomes dos prints: `antes|depois-<cenário>-<tema>-<desk|cel>.jpg`. Cenários: `1-estado`, `2-regional`, `polo-<araguaina|augustinopolis|guarai|palmas|porto|paraiso|gurupi|dianopolis>`, `mun-araguaina`, `mun-araguaina-lista` (campo da busca focado: abre a lista), `mun-palmas`, `al-foco`, `al-foco-lista`, `ranking`, `ranking-polo`. Folhas: `prints/folha-*.jpg`.

---

## Avaliação: o espaçamento atual (AFASTA_MUN 0,30, folga de 8 px) está bom?

Medido por `metricas.js` em cada polo aberto. "Dentro" = nome dentro da forma do município; "fio" = nome num cartão ao lado ligado por fio; "só número" = selo sem nome.

| Tela | municípios | dentro | fio | só número |
|---|---|---|---|---|
| computador 1440x900 | 139 | 127 | 10 | 2 |
| notebook 1280x720 | 139 | 109 | 25 | 5 |
| tablet 820x1100 | 139 | 130 | 8 | 1 |
| celular 390x844 | 139 | 58 | 45 | 35 |

Nome dentro por polo no computador: Araguaína 19/20, Augustinópolis 20/24, Guaraí 21/21, Palmas 10/10, Porto Nacional 12/12, Paraíso 12/18, Gurupi 18/18, Dianópolis 15/16. **Apertados: Augustinópolis e Paraíso** (no notebook, 12/24 e 9/18). No celular: Porto Nacional 3/12, Guaraí 5/21.

![8 polos, computador, antes](prints/folha-antes-8polos-dark-desk.jpg)
![8 polos, celular, antes](prints/folha-antes-8polos-dark-cel.jpg)

Três achados:
- **Afastar mais, sozinho, não adianta.** Se todos se afastam igual, o mapa inteiro encolhe para caber e a distância em pixels entre os centros não muda; só as formas ficam menores. O que dá espaço de verdade é usar a tela que sobra.
- **A tela sobra.** No computador o polo alto (Augustinópolis, Paraíso) ocupa ~570 px dos ~1000 px livres; no celular o SVG tem a altura justa dos municípios (Porto Nacional: ~150 px numa tela de 844) e a altura da página muda a cada polo.
- **O cartão com fio (da base de 05:20) resolve "ninguém sem nome", mas é o plano B:** cartão fora da forma, com fio, é mais difícil de ler que o nome dentro. Quanto mais espaço, menos fios.

---

## Sugestão 1 · Afastamento adaptativo e moldura fixa no celular — prioridade 1 · esforço M
**Problema.** Ver a avaliação. Antes: `prints/antes-polo-augustinopolis-dark-desk.jpg`, `prints/antes-polo-porto-dark-cel.jpg`.

| computador, Augustinópolis (antes) | (depois) |
|---|---|
| ![](prints/antes-polo-augustinopolis-dark-desk.jpg) | ![](prints/depois-polo-augustinopolis-dark-desk.jpg) |

**Proposta.**
1. `entraPolo()` calcula o afastamento base como hoje. Depois `ajusta()` compara a proporção do conjunto com a da área útil em pixels (a mesma conta do `enquadra`) e amplia a posição relativa ao centro do polo **só no eixo que sobra**, por bissecção, até as proporções casarem (teto 1,7× no computador e 3× no celular, para o mapa continuar reconhecível). O eixo limitante não muda, então o tamanho das formas também não: só ganha lugar para os cartões.
2. Celular: o SVG ganha moldura de **altura fixa** (`alturaCel()`: a altura do estado inteiro, sem passar de 78% da tela nem de `innerHeight − 300` px; 544 px em 390x844) e o conjunto é centralizado nela. A página deixa de pular de altura entre níveis (hoje 590 px no estado e ~150–400 px no polo).
3. `enquadra()` passa a devolver sempre um viewBox com a proporção da caixa inteira (ver sugestão 3: era o que cortava a rede).

**Como fica.** 8 polos no computador: `prints/folha-depois-8polos-dark-desk.jpg`. Celular, antes/depois (Porto Nacional, Gurupi, Augustinópolis):

![celular antes/depois](prints/folha-cel-antes-depois.jpg)

Resultado medido nos 8 polos (sobreposição de cartões = 0 em todos os casos):

| Tela | dentro | fio | só número |
|---|---|---|---|
| computador 1440x900 | 127 → 134 | 10 → 5 | 2 → 0 |
| notebook 1280x720 | 109 → 125 | 25 → 13 | 5 → 1 |
| tablet 820x1100 | 130 → 135 | 8 → 4 | 1 → 0 |
| celular 390x844 | 58 → 91 | 45 → 34 | 35 → 14 |

Nome dentro por polo no celular (antes → depois, de n): Araguaína 9→13/20, Augustinópolis 8→12/24, Guaraí 5→14/21, Palmas 8→8/10, Porto Nacional 3→9/12, Paraíso 9→9/18, Gurupi 8→15/18, Dianópolis 8→11/16. Notebook: Augustinópolis 12→18/24, Paraíso 9→13/18, Araguaína 17→20/20.

Custo, com CPU 4x mais lenta (`perf.js`, mediana de 9 aberturas de polo; variância alta): parte síncrona da abertura 38 → 36 ms (computador) e 42 → 34 ms (celular); maior tarefa longa durante a animação 241 → 109 ms e 321 → 178 ms (menos fios para procurar). Ou seja, não piora.

**Esforço:** M (`ajusta` ~25 linhas, `areaPx`/`alturaCel`/`lateral` ~15, `enquadra` reescrito). **Risco:** médio. (a) O espalhamento distorce a geografia (o polo vira um "mapa explodido" mais esticado, com mais folga entre municípios); o teto limita isso. (b) No celular o mapa passa a ter 544 px fixos: o rodapé desce em polos que antes eram baixos. (c) Mexe no layout do mapa (tema 2): se vier zoom/arrastar, `ajusta` só deve rodar ao abrir o nível. (d) Porto Nacional no celular segue com 2 cartões com fio e 1 só número: a área útil (358x440 px) é o limite físico. **Arquivos:** `alimentador/site/mapa-municipios.js` (`entraPolo`, `enquadra`, novas `ajusta`/`areaPx`/`alturaCel`/`lateral`).

---

## Sugestão 2 · Nome curto no cartão compacto — prioridade 2 · esforço P
**Problema.** Nomes como "Palmeiras do Tocantins" (170 px) não cabem dentro da forma de municípios pequenos e vão para o cartão com fio ou viram só o número.

**Proposta.** O cartão compacto (nível 1 do `poeNomes`) usa o nome **curto**, sem " do Tocantins" (37 municípios; conferi que nenhum nome se repete no estado). O cartão cheio e o balão do mouse seguem com o nome completo. Uma linha: `const curto = n => n.replace(/ do Tocantins$/, '')` e `NIVEIS_ROT[1]` usa `curto(m.nome)`. O ganho está embutido nos números da sugestão 1 (não medi isolado); exemplos: "Santa Terezinha", "Sítio Novo", "Palmeiras" em `prints/depois-polo-augustinopolis-dark-desk.jpg` e `prints/depois-polo-augustinopolis-dark-cel.jpg`.

**Esforço:** P. **Risco:** baixo (nome abreviado só quando o cheio não coube). **Arquivos:** `mapa-municipios.js` (`NIVEIS_ROT`).

---

## Sugestão 3 · Município e foco no alimentador com a linguagem do cartão preto — prioridade 3 · esforço M
**Problema.** No nível município a lista era uma caixa clara com título pequeno e a NAE do município **sumia** (só ficava a dos alimentadores); com o alimentador em foco nada no mapa dizia qual era (só o último item da trilha) nem que o 2º clique abre a página. Além disso, um defeito: com o alimentador em foco o mapa encolhia (o SVG tem `width:auto` e segue a proporção do viewBox: 803 px de 1328) e a rede e os municípios eram **cortados numa borda reta**. Antes: `prints/antes-mun-araguaina-lista-dark-desk.jpg`, `prints/antes-al-foco-dark-desk.jpg`, `prints/antes-al-foco-dark-cel.jpg`.

| antes | depois |
|---|---|
| ![](prints/antes-mun-araguaina-lista-dark-desk.jpg) | ![](prints/depois-mun-araguaina-lista-dark-desk.jpg) |
| ![](prints/antes-al-foco-dark-desk.jpg) | ![](prints/depois-al-foco-dark-desk.jpg) |

**Proposta.**
- **Lista embaixo da busca (`#ativo-res.lista-mun`)** vira cartão preto nos dois temas: cabeçalho fixo com o município em Plex Sans Condensed 700 (20 px), selo **"380 NAE"** (a NAE do município, que já está nos dados) e "33 alimentadores" em Plex Mono caixa alta; linhas com código em Mono 600, selo da NAE à direita (o mesmo selo dos cartões do mapa); miniatura da rede em azul claro sobre preto (no claro, o azul escuro `--rede` quase sumia).
- **Cartão do alimentador em foco (`.mt-ac`)**: código em mono, selo da NAE, "SE ARAGUAÍNA I · 451,2 km em Araguaína" e "ABRIR A PÁGINA →". No computador fica na coluna da esquerda, embaixo da seta de voltar (onde a lista saía); no celular fica preso embaixo do mapa. É um link: o "2º clique" deixa de ser um segredo. O km e a subestação aparecem aqui só uma vez (a lista da árvore de trabalho já tirou os dois das linhas, a pedido do usuário).
- **Corte da rede**: `enquadra()` sempre devolve viewBox com a proporção da caixa inteira (centraliza o alimentador na área livre), então o SVG ocupa a largura toda e o contexto não é cortado.
- Sem dado repetido: o município não ganhou cartão no mapa (nome e contagem já estão no cabeçalho da lista), só a NAE dele voltou a aparecer. A regra `.sem-nae` (legenda recolhida) também esconde o selo do cartão.

| celular, lista | celular, foco | celular, foco, claro |
|---|---|---|
| ![](prints/depois-mun-araguaina-lista-dark-cel.jpg) | ![](prints/depois-al-foco-dark-cel.jpg) | ![](prints/depois-al-foco-light-cel.jpg) |

Antes no celular: `prints/antes-mun-araguaina-lista-dark-cel.jpg`, `prints/antes-al-foco-dark-cel.jpg`. Claro, computador: `prints/depois-mun-araguaina-lista-light-desk.jpg`.

**Esforço:** M (CSS ~35 linhas, `cartaoAl` ~12 linhas, título HTML na `mostra()` de `busca-ativo.js`, `enquadra`). **Risco:** baixo a médio: o título da lista passou a aceitar `{html}` (textos continuam escapados com `esc`); o `enquadra` novo vale para todos os níveis, então confira regional e município em tela muito larga (ultrawide). **Arquivos:** `mapa-municipios.js` (`cartaoAl`, `focaAl`, `saiAl`, `enquadra`), `busca-ativo.js` (`atalhos`, `mostra`), `site.css` (blocos `.mt-ac` e `#ativo-res.lista-mun`).

---

## Sugestão 4 · Página de ranking (polos/) com a mesma tipografia — prioridade 4 · esforço P
**Problema.** A página não tem a marca nem o cartão: a escolha de polo é uma nuvem de texto ("Araguaína 1.235 NAE" no mesmo peso), a NAE da linha é só um número em negrito e o cabeçalho da tabela usa o mesmo cinza do corpo. Antes: `prints/antes-ranking-dark-desk.jpg`, `prints/antes-ranking-dark-cel.jpg`.

| antes | depois |
|---|---|
| ![](prints/antes-ranking-dark-desk.jpg) | ![](prints/depois-ranking-dark-desk.jpg) |

**Proposta.** (1) Marca ARGOS/MANUTENÇÃO (a do início, menor) na linha do menu, como link para a página inicial. (2) Escolha de ETO/regional/polo: nome em Plex Sans 600 + selo da NAE; o escolhido vira **cartão preto** com selo vermelho e filete laranja (como o polo aberto na barra do mapa), os demais ficam só com contorno e selo vazado (12 cartões pretos de uma vez pesariam, sobretudo no claro). No celular, ETO/Norte/Centro/Sul têm o mesmo desenho (nome em caixa alta, selo embaixo). (3) NAE de cada linha no **selo vermelho** do mapa. (4) Cabeçalhos da tabela em Plex Mono 11 px caixa alta; KPIs em Plex Sans Condensed 700.

| celular, escuro (depois) | celular, claro (depois) |
|---|---|
| ![](prints/depois-ranking-dark-cel.jpg) | ![](prints/depois-ranking-light-cel.jpg) |

Computador, claro: `prints/depois-ranking-light-desk.jpg`; polo rolado: `prints/depois-ranking-polo-dark-desk.jpg`. **Esforço:** P (CSS dentro do `<style>` que o `ranking-polos.js` injeta + 3 templates; no protótipo a marca entra por JS, no real vai no HTML de `scripts/gera_trechos.py`). **Risco:** baixo; o selo em 60 linhas pesa na coluna NAE: se incomodar, só nos 10 primeiros. **Arquivos:** `ranking-polos.js` (`pil`, segmentado, célula NAE, bloco CSS), `scripts/gera_trechos.py` (link da marca).

---

## Sugestão 5 · Acabamento: pesos de fonte, fontes reserva e tema claro — prioridade 5 · esforço P
**Pesos (auditado por `fontes.js` em início, polo, município e ranking).** Carregados: Plex Sans 400/500/600/700, Condensed 600/700, Mono 600 (e 400 sob demanda no ranking). Em uso sem peso carregado: **Plex Mono 700 em 32 textos** (todos os selos da NAE e o título "NAE-Vegetação" da legenda): o navegador sintetiza negrito em cima do 600, que borra nos 9–12 px. Comparação ampliada 3x (sintético atual, 600 verdadeiro, 700 verdadeiro): `prints/selo-comparacao.png`. **Proposta:** 600 (zero custo; uma linha de CSS no protótipo; depois dela todo texto usa peso carregado). Se quiser o 700 de verdade: incluir `IBM+Plex+Mono:wght@400;600;700` no link do Google Fonts (+~15 KB, no HTML gerado por `gera_trechos.py`).

![selos](prints/selo-comparacao.png)

**Fontes reserva com as métricas do Plex.** Com os woff2 do Google demorando 1,5 s (simulado), a troca de fonte desloca o layout (`fontes-cls.js`): **ranking no celular CLS 0,172** (acima de 0,1, "ruim"), ranking no computador 0,011, início no celular 0,001. Medi largura e alturas de linha do Plex contra Arial/Courier e declarei três `@font-face` locais (Plex Sans Fallback: `size-adjust` 98%; Plex Cond Fallback: 88,9%; Plex Mono Fallback: 100%; com `ascent/descent-override`), colocados depois do Plex em `--f-body`, `--f-display` e `--f-mono`. **Depois: ranking no celular 0,0007, início no celular 0**, ranking no computador 0,0045. Onde não há Arial/Courier (Android) cai no `system-ui` de sempre, sem piora. `--f-display` também está copiado dentro de `ranking-polos.js` e precisa do mesmo ajuste.

**Tema claro.** Conferi os 8 polos, município, foco e ranking nos dois tamanhos (`prints/*-light-*.jpg`): os cartões pretos mantêm contraste sobre qualquer faixa de laranja; lista e cartão do alimentador são pretos também no claro (como as regionais aprovadas); nada ilegível. Único ajuste que o claro pediu: miniatura da rede em azul claro dentro do cartão.

**Esforço:** P. **Risco:** baixo (o `local()` só vale onde a fonte existe). **Arquivos:** `site.css` (tokens `--f-*`, `@font-face` reserva, peso dos selos), `ranking-polos.js` (`--f-display`), opcional `scripts/gera_trechos.py` (link do Google Fonts).

---

## Como aplicar (a base ainda se move)
As mudanças são aditivas e em funções separadas: `ajusta`/`areaPx`/`alturaCel`/`lateral` e o `enquadra` (sugestão 1), `NIVEIS_ROT[1]` (2), `cartaoAl`/`focaAl`/`saiAl` + CSS `.mt-ac`/`#ativo-res.lista-mun` + `{html}` em `mostra()` (3), CSS do ranking (4), `@font-face` e peso dos selos (5). Conflito esperado com as "bandeirinhas" (cartões das regionais e dos polos à direita, com fio): mexem em `poeCartoes`/`poeSelos` e em `.mt-regcards`/`.mt-selos`, que não toquei; o `enquadra` e o `lateral` de hoje (lista de 460 px, legenda fora da caixa) já estão no protótipo. A lista do município sem km/SE só pede tirar "· mais km primeiro" do cabeçalho (já tirei). `git merge-file` de `proto/` contra a árvore atual com base em `orig-head/` resolve sozinho o que não se sobrepõe.

## Achados fora do escopo
- **Números por polo diferentes entre o mapa e o ranking** (mesmos dados, fontes diferentes): Paraíso 588 (mapa) × 609 (ranking), Porto Nacional 633 × 612, Guaraí 543 × 545, Gurupi 702 × 700; regionais Norte 3.130 × 3.132 e Sul 963 × 961 (Centro 1.655 e o total da ETO, 5.748, batem). O mapa soma os municípios do polo em `mapa-municipios-dados.js`; o ranking usa `ranking-polos-dados.js`. Vale conferir a atribuição de município a polo nas duas.
- **CLS do cabeçalho (tema 5):** na página inicial o `header.cab` e os cartões das regionais deslocam 0,06 aos ~200 ms (o botão do menu entra via `menu.js` e empurra a página 64 px; no ranking, 0,037 pelo mesmo motivo). Reservar o `.mnu` no HTML gerado resolve.
- **Trilha "Tocantins › Norte › Araguaína › Araguaína":** quando o município tem o nome do polo a trilha parece repetida.
- **Toque sem balão:** no celular, município com só o número só se identifica entrando nele. Primeiro toque mostrando o balão (nome, NAE) e segundo abrindo seria o complemento natural (tema 2).

## Limites do protótipo
- Chromium do sandbox (Linux): sem Arial/Courier reais, o teste das fontes reserva usa Liberation Sans/Mono (métricas compatíveis).
- Tempos com CPU 4x mais lenta do Playwright; variância entre repetições alta (±30%), por isso falo em "não piora".
- Todos os números dos prints e das métricas vêm do site; nada foi inventado.
