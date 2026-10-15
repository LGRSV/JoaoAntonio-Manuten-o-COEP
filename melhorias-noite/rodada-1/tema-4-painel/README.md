# Tema 4 · Painel do alimentador: encaixe, ordem e zero repetição (rodada 1)

Páginas analisadas ao vivo: `LD01072001` (154 km), `AL03037009` (212 km), `LD02022033` (grande: 1.375 km, 1.019 trechos) e `AL01015049` (pequeno: 5,5 km, 11 trechos). Fonte lida: `alimentador/mapa_trechos.html` + `alimentador/site/*.js` (o site ao vivo é idêntico ao fonte). Nada foi editado no repositório: o protótipo é CSS/JS injetado por Playwright (`prints.js`).

## Resumo (5 linhas)
1. Hoje 31% da altura da tela (276 px de 900) é cabeçalho + barra; o mapa tem 924×702 e ainda sai 78 px da tela. Depois: mapa 992×814, inteiro na tela, sem rolar a página (+40% de área visível).
2. A mesma informação aparece 2 a 5 vezes: extensão total (5 lugares), contagem por classe (tabela + botões + legenda), anos/OS de cada camada (legenda do mapa + cartão do painel, idênticos; "153 no prazo" aparece 4× na mesma tela), nome das camadas (4 nomes diferentes para cada uma).
3. Com um trecho escolhido e as camadas ligadas, o painel tem **9.329 px** de rolagem (T2-A do LD01072001); com abas vira **792 px**. Com as 4 camadas ligadas, a legenda cobre 598 px do mapa; em linha, 156 px.
4. No celular o cabeçalho ocupa 346 px antes do mapa e o resumo fica 3 telas abaixo; a gaveta inferior põe o mapa na tela inteira e o painel a um toque.
5. **Recomendação nº 1: Sugestão 1 (cabeçalho e barra numa linha, mapa na altura da tela)**: quase só CSS, não mexe em dado nenhum, é a que mais devolve mapa. Depois, 2 e 3.

Medidas (`metricas.json`, LD01072001, 1440×900 e 390×844):

| | antes | depois (todas juntas) |
|---|---|---|
| Mapa, desktop (largura × altura; visível na 1ª tela) | 924 × 702 (624 visíveis) | 992 × 814 (814) |
| Mapa, celular | 358 × 490, começa em y=346 | 366 × 555, começa em y=221 |
| Rolagem da página, desktop | 112 px | 0 |
| Painel com as 4 camadas ligadas | 1.528 px | cabe nos 814 px (acordeão) |
| Detalhe do T2-A com as 4 camadas | 9.329 px | 792 px (abas) |
| Legenda das camadas sobre o mapa | 598 px de altura | 156 px |

---

## Inventário do painel (o que existe hoje, de cima para baixo)

**Cabeçalho**: ☰ do site · caminho (Municípios › município › trecho escolhido) · SE (sobretítulo) · código do alimentador (h1) · subtítulo "Trechos por ativo".
**Barra**: busca (trecho, ativo ou poste; os achados caem embaixo) · Município (só quando há mais de um; filtra só a lista de trechos) · Meses do NAE (+ "Contar individuais" dentro da lista de meses).
**Mapa**: botões T1/T2/T3 (liga/desliga a classe) · Menu de camadas (Faixa, Inspeção, Insp→manut, Manutenção) · rótulos dos trechos (nome, selo de NAE; com Faixa: data e km) · DJ/religadores/fusíveis · INÍCIO/FIM do trecho escolhido · divisas e nomes de município · legenda de cada camada ligada (canto inferior esquerdo) · tela cheia (canto inferior direito) · crédito Esri/Leaflet.
**Painel (aside)**: tabela Classe/Trechos/Extensão + Total · "NAE - vegetação: N no alimentador" · cartão Limpeza de faixa (resumo, Por ano/Vencimento, linhas por ano com OS e km, cada uma abre as OS) · cartão Inspeção visual · cartão Insp→manut (resumo, tabela alimentador × polo, tipos, 3 linhas Vencidas/No prazo/Executadas) · cartão Manutenção (OS e ativos, linhas por ano) · lista de trechos (só aparece com todas as camadas desligadas ou ao buscar; ordem por NAE) · legenda T1/T2/T3 (junto da lista) · **Dados** (fechado): Downloads por camada, **Croqui da faixa**, KMZ, municípios com km, continuidades, avisos, origem, procedência, regra T1/T2/T3, nota "Fim do trecho".
**Detalhe do trecho** (troca a tabela do topo): nome e tipo · Início · Passa por · Fim · Extensão e vãos · Fases · Vem de · Derivações (chips) · NAE (contagem + cada ocorrência) · uma seção por camada ligada (Faixa, Inspeção, Insp→manut, Manutenção) com a lista de OS.
**Tela cheia**: mapa solto; o painel vira gaveta lateral pelo item "Painel" do Menu.

### Dados que aparecem mais de uma vez (marcados com ⟲)

| Dado | Onde aparece hoje | Onde fica na proposta |
|---|---|---|
| ⟲ Código do alimentador | h1 · `<title>` da aba · 1ª linha da tabela do Insp→manut | h1 (compacto, na barra) · aba. A linha da tabela continua (é comparação com o polo) |
| ⟲ "Trechos por ativo" | subtítulo sob o h1 · `<title>` ("· trechos") | só no `<title>`; subtítulo some |
| SE (subestação) | sobretítulo | ao lado do código, na mesma linha |
| ⟲ Extensão total (153,98 km) | linha Total da tabela · "24,2 km de 154,0 km" (Faixa) · "34,0 km de 154,0 km" (Inspeção) · Dados › Municípios (139,58 + 14,40) · seletor Município "(139,58 km)" | uma vez no cabeçalho ("199 trechos · 153,98 km"); os "x de 154,0 km" dos cartões ficam (são a fração, não o total); município no seletor |
| ⟲ Nº de trechos e km por classe | tabela Classe/Trechos/Extensão · legenda de cores `#legenda` · grupos da lista | dentro dos próprios botões T1/T2/T3 do mapa ("195 · 114,99 km"); tabela e legenda de cores saem |
| ⟲ NAE do alimentador (23) | "23 no alimentador" no painel; o filtro de meses que o altera fica na barra, do outro lado da tela | selo vermelho no botão dos meses: "NAE (23) · Meses: todos" |
| NAE por trecho | rótulo no mapa · pílula na lista · detalhe | igual; no detalhe vira a aba "NAE (4)" |
| ⟲ Cor e ano de cada camada | botões da legenda do mapa **e** linhas do cartão no painel (os dois ligam/desligam o mesmo ano) | legenda em linha no mapa (cor + nome); o cartão fica com OS, km e a lista |
| ⟲ Contagens da Manutenção (2026: 147 …) | legenda do mapa **e** linhas do cartão, idênticas | só no cartão |
| ⟲ Insp→manut "153 no prazo" | legenda do mapa · subtítulo do cartão · tabela · linha "No prazo 153 OS" (4× na mesma tela) | legenda do mapa sem número; subtítulo do cartão (resumo) fica; o resto, ver "Achados" |
| ⟲ Nome das camadas | Menu: Faixa / Inspeção / Insp→manut / Manutenção · cartão: Limpeza de faixa / Inspeção visual / Insp→manut / Manutenção · detalhe: "Limpeza de faixa · T2 a cada 4 anos" / Inspeção visual / "Manutenção (da inspeção)" / "Manutenção executada" · Downloads: Faixa / Inspeção / Insp→manut / Manutenção | um nome por camada nos quatro lugares (abas e legendas já usam os do Menu). "Manutenção" hoje designa duas camadas |
| Início/Fim do trecho | detalhe **e** marcadores INÍCIO/FIM no mapa | igual (um é texto, o outro é lugar; complementares) |
| Regra T1/T2/T3 | "Como os trechos são divididos" e a nota "Fim do trecho", ambas em Dados | igual (sem mudança; texto de consulta) |
| Croqui da faixa | só em Dados › Downloads › Faixa (abrir Dados, rolar o painel até o fim) | continua lá nesta rodada; ver Achados |
| Lista de trechos | escondida enquanto houver camada ligada (ou seja, quase sempre) | continua (a busca a traz de volta) |
| Tabela alimentador × polo (Insp→manut) | cartão | cartão (dado único) |

### Achados fora das 5 sugestões
- O seletor **Município** da barra só filtra a lista de trechos, que fica escondida com qualquer camada ligada: com a Faixa ligada (o padrão) ele não muda nada que se veja. Sugestão para a rodada 2: fazer o filtro valer também para o mapa (esmaecer o que é de outro município) ou tirá-lo da barra.
- O **Croqui da faixa** é uma das funções mais úteis e está a 3 cliques (Dados, rolar, botão). Candidato a ação visível ao lado do Menu do mapa, trecho escolhido já selecionado.
- No cartão Insp→manut os três números (Vencidas/No prazo/Executadas) saem na linha de resumo, na tabela e nas 3 linhas-botão. As 3 linhas são também o liga/desliga; dá para fundir a tabela nelas (colunas "alimentador" e "polo").
- Nas camadas sem dado (AL01015049) o cartão e a aba mostram "0"; melhor esconder a camada vazia do Menu ou marcá-la como sem dados.

---

## Sugestão 1 · Cabeçalho e barra numa linha só; mapa na altura da tela  (recomendada nº 1)
**Esforço P · Risco baixo**

**Problema.** ☰, caminho, SE, código, subtítulo, busca e filtros empilham 276 px antes do mapa (celular: 346 px). O mapa (924×702) ainda passa da borda da tela e a página rola 112 px; a legenda e o botão de tela cheia ficam cortados.
Antes: `antes/LD01072001-d-inicial.jpg`, `antes/LD01072001-m-inicial.jpg`, `antes/LD02022033-d-inicial.jpg`, `antes/AL01015049-d-inicial.jpg`.

**Proposta.** Uma grade de uma linha: ☰ · [caminho / código + SE] · busca · município · meses. O subtítulo "Trechos por ativo" sai (a aba já diz). A página passa a ter a altura da janela (`100dvh`): mapa e painel preenchem o resto, o painel rola por dentro. O resultado da busca de ativo vira lista solta sobre o mapa (hoje empurra o mapa para baixo). Sem select de município (alimentador de um município só) a busca ocupa o espaço dele. Celular: ☰ + título na 1ª linha, busca, município + meses; 346 px → 221 px.

**Como fica.** `depois/s1-LD01072001-d-inicial.jpg`, `depois/s1-LD01072001-m-inicial.jpg`, `depois/s1-AL01015049-d-inicial.jpg`, `depois/s1-AL01015049-m-inicial.jpg`, `depois/s1-LD02022033-d-inicial.jpg`, `depois/s1-AL03037009-d-inicial.jpg`. Busca com a lista solta: dentro de `depois/todas-*` (testado, ver `prints.js`).

**Arquivos que mudariam.** CSS de `alimentador/mapa_trechos.html` (grade do `.wrap`, `header`, `.stage`, `#map`, `.panel`); `alimentador/site/extras.js` (só o CSS da `.barra-busca` e do `.ativo-hit`). `telacheia.js` não muda (as regras valem só fora da tela cheia).
**Risco.** O mapa muda de tamanho antes da primeira pintura: aplicar no CSS (não depois do Leaflet iniciar). Telas baixas (<600 px de altura) caem para rolagem normal (`min-height:600px`).

## Sugestão 2 · Um resumo só: classes nos botões do mapa, total no cabeçalho, NAE junto dos meses
**Esforço M · Risco baixo**

**Problema.** A tabela Classe/Trechos/Extensão (166 px no topo do painel), a legenda de cores T1/T2/T3 e os botões T1/T2/T3 do mapa dizem a mesma coisa em três lugares; o total de km aparece em 5 lugares; o "23 no alimentador" fica longe do filtro de meses que o muda.
Antes: `antes/LD01072001-d-inicial.jpg` (tabela e NAE no painel), `antes/LD01072001-d-sem-faixa.jpg` (legenda repetida embaixo).

**Proposta.** Os botões T1/T2/T3 passam a levar "nº · km" (celular: "nº" em cima e km arredondado embaixo, ex.: "T3 195 / 115 km") e continuam liga/desliga; o título do botão traz o valor exato. O Total vai para o cabeçalho ("199 trechos · 153,98 km"). A NAE do alimentador vira um selo vermelho (o mesmo das pílulas de NAE da lista) no botão dos meses: "NAE (23) · Meses: todos". Tabela, bloco "NAE - vegetação" e legenda de cores saem do painel. Nenhum dado some: o que era tabela está nos botões, no cabeçalho e no selo.

**Como fica.** `depois/s2-LD01072001-d-inicial.jpg`, `depois/s2-LD01072001-d-sem-faixa.jpg`, `depois/s2-LD01072001-m-inicial.jpg`, `depois/s2-LD01072001-m-sem-faixa.jpg`; grande: `depois/todas-LD02022033-m-inicial.jpg` (T3 com 1.009 trechos e 1.190 km cabe no celular).

**Arquivos.** `alimentador/mapa_trechos.html` (JS `resumo()`, criação dos botões `#classes`, CSS `.classes`); `site/extras.js` (total no `.eyebrow`, selo no `#mes`; o `doMes()` já existe).
**Risco.** Botões de duas linhas deixam o cartão do canto 6 px mais alto. Texto "KM" não pode virar maiúsculo (o `.eyebrow` é caixa-alta: o protótipo desliga no `.tot`).

## Sugestão 3 · Camadas em acordeão no painel e legenda do mapa em linha
**Esforço M · Risco médio**

**Problema.** Quatro cartões empilhados abertos (1.528 px) escondem Insp→manut e Manutenção atrás de rolagem e "Dados" no fim. Cada ano/situação aparece na legenda do mapa (coluna de 598 px que cobre o mapa) e de novo no cartão, com os mesmos números.
Antes: `antes/LD01072001-d-camadas.jpg`, `antes/LD01072001-d-painel-longo.jpg`, `antes/LD01072001-m-camadas.jpg`.

**Proposta.** Cada cartão vira uma linha de acordeão (título + o resumo que já existe, ex.: "153 OS · 0 vencidas · 153 no prazo · 0 executadas"); abre um por vez, e ligar uma camada no Menu abre o cartão dela. O painel mostra as 4 camadas e o "Dados" de uma vez. No mapa a legenda vira uma linha por camada (título + cor + nome, sem os números, que já estão no painel): 598 px → 156 px de altura no desktop. Os mesmos botões de ano continuam liga/desliga.

**Como fica.** `depois/s3-LD01072001-d-camadas.jpg`, `depois/s3-LD01072001-d-menu.jpg`, `depois/s3-LD01072001-m-camadas.jpg`; com o mapa na altura da tela: `depois/todas-LD01072001-d-camadas.jpg`, `depois/todas-LD01072001-m-camadas.jpg`.

**Arquivos.** `site/limpeza.js`, `inspecao.js`, `manutencao.js`, `executadas.js` (marcação do `.limp-top` e legenda `.limp-maplg/.mnt-lg/.exe-lg`); `extras.js` (coluna `.ctl-lgs`).
**Risco.** No celular quatro linhas de legenda ainda ocupam ~216 px do mapa (a legenda poderia recolher atrás de um botão, ideia para a rodada 2); o `.lg-info` ("sem registro") some no celular, como já é hoje.

## Sugestão 4 · Trecho escolhido: ficha curta + abas (NAE · Faixa · Inspeção · Insp→manut · Manutenção)
**Esforço M · Risco baixo**

**Problema.** Escolhendo o T2-A com as 4 camadas ligadas, o painel vira uma rolagem de **9.329 px** (NAE 376 px, Insp→manut 3.652 px, Manutenção 4.253 px). Para ver a Manutenção é preciso passar por tudo; a ordem não segue o que o usuário procura primeiro (quem é o trecho, e a NAE).
Antes: `antes/LD01072001-d-trecho.jpg`, `antes/LD01072001-m-trecho.jpg`.

**Proposta.** Fixa a ficha (nome, tipo, início, fim, extensão, fases, vem de, derivações) e embaixo uma fileira de abas com a contagem de cada uma: **NAE 4 · Faixa 2 · Inspeção 5 · Insp→manut 46 · Manutenção 60**; a aba aberta mostra a lista inteira que já existe, só ela. A fileira gruda no alto ao rolar, ←/→ trocam de aba, a aba escolhida é lembrada ao trocar de trecho; abas sem item ficam apagadas; se só existe uma, nada muda. Mesmos nomes do Menu (corrige os 4 nomes por camada).

**Como fica.** `depois/s4-LD01072001-d-trecho.jpg`, `depois/s4-LD01072001-m-trecho.jpg`; pequeno: `depois/todas-AL01015049-d-trecho.jpg`; claro: `depois/todas-claro-LD01072001-d-trecho.jpg`. 9.329 px → 792 px.

**Arquivos.** `alimentador/mapa_trechos.html` (`detalhe()`/`detalheVarios()`: separar o bloco NAE do `<dl>`); `limpeza.js`, `inspecao.js`, `manutencao.js`, `executadas.js` (cada `section.limp-sec` já é um grupo).
**Risco.** As seções de camada entram depois da primeira pintura do detalhe: o protótipo reconstrói as abas ao notar (MutationObserver); na versão real, melhor as camadas entregarem a seção a uma função única.

## Sugestão 5 · Celular: mapa na tela quase inteira e painel numa gaveta inferior
**Esforço G · Risco médio** (depende da Sugestão 1)

**Problema.** No celular a primeira tela é cabeçalho + mapa de 490 px; o resumo, as camadas e o detalhe do trecho ficam abaixo (a página rola até 11.232 px com um trecho escolhido) e só se veem com o mapa grudado em cima ocupando metade da tela.
Antes: `antes/LD01072001-m-inicial.jpg`, `antes/LD01072001-m-trecho.jpg`, `antes/LD01072001-m-painel-longo.jpg`.

**Proposta.** A página tem a altura da tela; o mapa ocupa tudo entre a barra e uma faixa de 60 px no pé: a **gaveta**. Fechada, a faixa diz "Painel · Camadas: Faixa" (ou, com trecho escolhido, "T2-A · T2 · tronco · 16,58 km · 265 vãos"). Toque ou arraste a abre em 46% ou 88% da altura; escolher um trecho no mapa sobe a gaveta sozinha até a ficha. Dentro dela valem as sugestões 3 e 4. A tela cheia continua com a gaveta lateral atual.

**Como fica.** `depois/s5-LD01072001-m-inicial.jpg`, `depois/s5-LD01072001-m-gaveta.jpg`, `depois/s5-LD01072001-m-trecho.jpg`, `depois/s5-LD01072001-m-camadas.jpg`; tudo junto: `depois/todas-LD01072001-m-gaveta.jpg`, `depois/todas-LD01072001-m-trecho.jpg`, `depois/todas-LD02022033-m-inicial.jpg`; claro: `depois/todas-claro-LD01072001-m-trecho.jpg`. Tela cheia no celular: `depois/todas-LD01072001-m-tela-cheia.jpg`.

**Arquivos.** CSS de `mapa_trechos.html` (`.panel` fixo, `.sheet-h`); novo trecho em `extras.js` (estado peek/meio/cheio, arrastar); `telacheia.js` (a gaveta lateral continua; o `.panel` precisa de uma regra para não acumular os dois comportamentos).
**Risco.** Testado: toque no cabeçalho da gaveta, abertura automática ao escolher trecho, busca, lista de meses, tela cheia. **Não testado em aparelho real:** o arrastar por dedo (usa pointer events) e a barra de endereço do iOS (por isso `dvh`). O enquadramento do mapa ao escolher um trecho não desconta a parte coberta pela gaveta; ajustar o `fitBounds` com `paddingBottomRight`. Rolagem: a página deixa de rolar no celular, então o foco por teclado precisa abrir a gaveta (o protótipo marca o conteúdo fechado como `inert`).

---

## Como reproduzir
```
cd /home/user/smartled/melhorias-noite/rodada-1/tema-4-painel
NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node prints.js [antes s1 s2 s3 s4 s5 todas todas-claro] [--alim=LD01072001] [--estados=trecho,camadas]
node metricas.js        # gera metricas.json
```
`proto/painel.css` e `proto/painel.js` entram no HTML da página do alimentador na resposta (nada é gravado no site). Flags: `window.__PROTO={s1,s2,s3,s4,s5}`.
Estados dos prints: inicial, camadas (as 4 ligadas), trecho (T2-A, ou T1 onde não existe), sem-faixa (lista), menu, tela-cheia, dados, painel-longo, gaveta. Conjuntos: `antes` (site ao vivo), `s1`…`s5` (cada sugestão sozinha; a `s5` sempre com a `s1`), `todas` e `todas-claro` (as cinco juntas).

Arquivos: `antes/` (site ao vivo), `depois/` (prefixo = conjunto), `proto/painel.css`, `proto/painel.js`, `prints.js`, `metricas.js`, `metricas.json`, `resumo.json`.
