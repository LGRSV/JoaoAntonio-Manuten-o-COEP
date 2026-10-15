# Tema 1 · Tela cheia, botão Voltar e dados repetidos · rodada 2

Base: o site de teste como está agora (https://lgrsv.github.io/vera-vegeta-o-back/teste/, idêntico a `alimentador/site/*.js` e `site.css`: conferido byte a byte). Os protótipos da rodada 1 eram sobre a versão antiga; tudo aqui foi refeito sobre o design novo com a busca integrada, sem tocar no código do repositório e sem commit. Prints em JPEG, 1440x900 (`d`) e 390x844 (`m`), tema escuro (claro onde faz diferença).

## Resumo

1. **Tela cheia (S1)**: botão no canto superior direito do mapa leva a barra (busca e trilha), o mapa e a legenda para a tela cheia. Sai por botão, `F` ou Esc. Funciona com a API nativa e, sem ela (iPhone, iframe sem permissão), por CSS; no celular, em paisagem e com tema claro. Passou em teste de clique, teclado e toque.
2. **Voltar do navegador sobe um nível (S2)**: cada nível tem endereço (`#centro`, `#centro/palmas`, `#centro/palmas/palmas`, `#centro/palmas/palmas/LD02059122`). Descer empilha uma entrada; Voltar/Avançar e o gesto do celular sobem e descem o mapa; Esc, ← e trilha aproveitam o Voltar (Esc seguido de Voltar nunca "desce" de novo); uma busca que voa por vários níveis vira uma entrada só; abrir o link já cai no nível certo, e endereço inválido é corrigido na barra.
3. **S1 e S2 são um arquivo novo só (`proto/mapa-extras.js`, 155 linhas)** que usa o que o `mapa-municipios.js` já expõe (`window.ARGOS_MAPA` e o evento `argos-nivel`): **nenhum JavaScript existente muda** para ter as duas coisas (só um bloco de CSS e a tag no HTML gerado).
4. **Dados repetidos (S3)**: 6 repetições ainda existiam no layout novo (cartão e balão do município, lista da busca com NAE e "Polo Palmas · Centro" em toda linha, nomes dos polos em chip e em cartão, "Palmas › Palmas" na trilha). O protótipo (diff pequeno em `mapa-municipios.js` e `busca-ativo.js`) remove todas, e de quebra conserta dois defeitos do site atual: a seta ← some debaixo da lista dos alimentadores e o cartão do polo não responde ao clique.
5. **Testes: 232 verificações, todas passam** (`testes.log`: Chromium com viewport e toque emulados; tela cheia nativa e só CSS; Voltar/Avançar; F5; girar a tela; Voltar rápido). Não testado em iPhone/Android reais (limites no fim).

**Sugestão nº 1 recomendada: publicar o `mapa-extras.js` (S1 + S2 juntos).** Custo baixo, risco baixo (arquivo novo; sem ele o site é o de hoje) e ganho direto no celular, onde um único gesto de voltar hoje expulsa a pessoa do mapa e perde o nível em que ela estava. Se for escolher uma só: S2. Depois, S3.

## Como ver e reproduzir

- `proto/`: `mapa-extras.js` (novo), `site.css`, `mapa-municipios.js` e `busca-ativo.js` (cópias dos ao vivo com as alterações) e os `.diff` de cada um contra `live/`. `live/` guarda os arquivos do site ao vivo usados como "antes".
- `lib.js` abre a página: o Chromium daqui não confia na CA do proxy, então o HTML e os dados vêm pelo `curl` e entram no navegador por `page.route` (cache em disco fora desta pasta); `proto/` entra no lugar dos assets e o HTML ganha a tag `<script src="assets/mapa-extras.js">` logo depois da de `busca-ativo.js`, o mesmo ponto onde `scripts/gera_trechos.py` a poria.
- `prints.js antes|depois|todos` gera todos os prints; `node testes.js [historico-d|historico-m|cheia-d|cheia-m|extras|repeticoes|estresse]` roda os testes (`testes.log` é a saída completa).

---

## S1 · Tela cheia do mapa da página inicial · esforço P · risco baixo

**Problema.** A página inicial não tem tela cheia (só a página do alimentador tem). No celular o mapa fica pequeno e ainda divide a tela com cabeçalho, busca e rodapé: no polo e no município ele ocupa uma faixa de 300 px. Antes: `prints/antes-m-polo.jpg`, `antes-m-regional.jpg`, `antes-d-estado.jpg`.

**Proposta.**
- Botão 40x40 no canto superior direito do mapa (mesmo estilo da seta ←), com o ícone de expandir; em tela cheia vira o de recolher. `aria-pressed`, `title` e `aria-label` acompanham.
- Vai para a tela cheia o `#mapa-to` inteiro: barra com a busca e a trilha, mapa, legenda, cartões, balões e a lista da busca. O mapa se reencaixa sozinho (os `ResizeObserver` do `mapa-municipios.js` já tratam). O título e o menu ☰ ficam de fora (Night shift continua em Shift+K; testado).
- Sai por: botão; **F** (liga e desliga; ignorado dentro de campo de texto); **Esc**.
- **Nativa e fallback.** Usa `requestFullscreen` (com prefixo webkit). Sem a API (iPhone) ou se ela for negada (iframe sem `allow="fullscreen"`, como a cópia no Artifact), o mapa ocupa a janela só por CSS (`.tc-mapa`, `position:fixed`). O botão funciona igual nos dois.
- **Esc, decisão revista em relação à rodada 1:** na rodada 1, no modo só CSS o Esc subia um nível antes de sair. Agora o Esc **sai da tela cheia primeiro nos dois modos** (como o navegador faz no nativo); o Esc seguinte sobe um nível. Com a lista da busca aberta, o Esc fecha a lista primeiro.
- **Voltar do celular (só CSS):** ao entrar na tela cheia sem API fica uma entrada "sentinela" no histórico; o gesto Voltar a consome e sai da tela cheia (em vez de expulsar da página ou subir um nível por baixo). Níveis percorridos dentro da tela cheia: cada Voltar sobe um e só o último sai.
- Na tela cheia o botão fica acima da lista da busca; no celular a lista deixa livre a coluna dele (antes de eu fazer isso a lista cobria o único botão de saída do modo CSS).
- A rolagem da página volta ao lugar de antes ao sair.

**Como fica.** Botão: `prints/depois-d-estado.jpg`, `depois-m-estado.jpg`. Tela cheia no computador: `depois-d-cheia-estado.jpg`, `-cheia-regional`, `-cheia-polo`, `-cheia-mun`, `-cheia-alimentador`, tema claro `depois-d-cheia-claro-alimentador.jpg` e `depois-d-claro-cheia-regional.jpg`; depois de sair: `depois-d-saiu-alimentador.jpg`. Celular: `depois-m-cheia-estado.jpg`, `-cheia-regional`, `-cheia-polo`, `-cheia-mun` (lista aberta e o botão livre), `-cheia-alimentador`, `depois-m-cheia-claro-alimentador.jpg`, `depois-m-saiu-alimentador.jpg`. Paisagem (844x390): `depois-m-paisagem-cheia-estado.jpg`, `depois-m-paisagem-cheia-polo.jpg`. Cada passo dos testes também gerou `t-*.jpg`.

**Testado (computador e celular, `testes.log`):** nativa: entra, mapa ocupa a janela (1408x824 no 1440x900; 358x764 no celular), página não rola por baixo, sem rolagem lateral; clicar/tocar nos níveis dentro dela; lista da busca abre dentro da tela cheia sem cortar; Shift+K; "f" digitado no campo não alterna; saída por botão, por `F` e por `exitFullscreen()` (é o que o Esc do navegador chama) mantém o nível; o Esc seguinte sobe um nível; Voltar na tela cheia sobe e mantém a tela cheia; rolagem restaurada. Só CSS (API removida): os mesmos, mais Esc sai primeiro, sentinela, gesto Voltar sai da tela cheia e nenhum Voltar "morto" sobra. API recusada (`requestFullscreen` rejeita): cai no CSS e sai pelo botão. Enter/Espaço no botão por teclado. Girar a tela com a tela cheia ligada (900x1440 e 844x390): o mapa reencaixa e não há rolagem lateral. Movimento reduzido. Sem erros de JavaScript.

**Esforço P · Risco baixo.** Arquivos que mudariam: novo `assets/mapa-extras.js` (parte da tela cheia: ~70 linhas), `site.css` (~25 linhas: `.mt-tc`, `#mapa-to.tc-mapa`, `body.tc-mapa`), `scripts/gera_trechos.py` (uma tag `<script>` depois de `busca-ativo.js` e copiar o asset). O `telacheia.js` da página do alimentador continua separado: dá para unificar depois numa função `alternaTelaCheia(elemento, aoMudar)`, mas não é necessário.

---

## S2 · Botão Voltar do navegador / gesto de voltar sobe um nível do mapa · esforço M · risco médio-baixo

**Problema.** O mapa tem cinco níveis (estado, regional, polo, município, alimentador) e nenhum deles muda o endereço nem o histórico. Quem desce quatro níveis e faz o gesto de voltar (ou usa o Voltar do navegador) sai do site, perde onde estava, e não dá para mandar o link de um polo ou de um município. Abrir um link com `#centro/palmas` hoje ignora o `#`: `prints/antes-d-link-ignorado.jpg` (abre no estado inteiro).

**Proposta.** O endereço de cada nível é um hash legível que espelha a trilha:

| Nível | Endereço |
|---|---|
| Estado inteiro | sem hash |
| Regional | `#centro` |
| Polo | `#centro/palmas` |
| Município | `#centro/palmas/palmas` |
| Alimentador em foco | `#centro/palmas/palmas/LD02059122` |

(regional e polo sem acento e em minúsculas, município pelo `slug` que já existe, alimentador pelo código; maiúsculas e minúsculas tanto faz ao abrir.) Regras:
- **Descer empilha** uma entrada (`pushState`). Voltar/Avançar (teclado, mouse, gesto do celular) sobem e descem o mapa com a mesma animação do clique.
- **Subir pelo site (←, Esc, trilha) não empilha: usa o Voltar** quando o nível de cima é de onde a pessoa veio. Assim "Esc e depois Voltar" nunca desce de novo. Saltos de vários níveis pela trilha (ex.: "Tocantins" do alimentador) empilham, e o Voltar devolve ao nível de onde saiu.
- **A busca que voa por vários níveis é uma entrada só** (a ponte `ARGOS_MAPA.vai` é embrulhada: o histórico é atualizado quando o voo termina).
- **Abrir um link** (ou F5) leva o mapa direto ao nível certo, passando pelos níveis de cima em um único voo; para alimentador abre primeiro o município do endereço (o `vai({al})` sozinho abriria no município de mais km). **Endereço inválido** cai no nível válido mais fundo e a barra é corrigida (`#centro/palmas/xyz` vira `#centro/palmas`); hash que não é do mapa (`#zzz`) é deixado quieto.
- Num link aberto direto o histórico não ganha entradas extras: Voltar sai do site (comportamento normal do navegador).
- O título da aba acompanha o nível (`Palmas · ARGOS Manutenção`, `Polo Palmas · …`), o que também deixa legível o menu de histórico do navegador.
- Chamadas ao `history` ficam em `try/catch`: na cópia dentro de um iframe sandbox (Artifact) o mapa funciona igual, só sem histórico.

**Como fica.** Sequência do Voltar do alimentador ao estado, com o endereço de cada quadro: `prints/depois-d-voltar-folha.jpg` (computador) e `prints/depois-m-voltar-folha.jpg` (celular). Link aberto direto: `depois-d-link-alimentador.jpg`, `depois-d-link-polo.jpg` (`#sul/gurupi`), `depois-m-link-alimentador.jpg`, `depois-m-link-polo.jpg`.

**Testado (computador e celular, 48 verificações em cada, `testes.log`):** hash correto em cada um dos 4 níveis e +4 entradas no histórico; Voltar ×4 sobe passo a passo até o estado (cartões das regionais voltam) e Avançar ×4 desce até o alimentador; Esc e ← não empilham e o Voltar seguinte vai ao nível de cima do anterior; trilha com salto e Voltar que devolve; busca "Lagoa da Confusão" (do estado ao município, outra regional) e "LD01072001" (já com o alimentador em foco): **uma só entrada**; trocar o hash à mão (`#sul`); 6 links válidos (inclui `#centro/PALMAS/Palmas` e código do alimentador em minúscula) e 5 inválidos (corrigidos na barra, sem erro); Voltar num link aberto direto sai do site. Para quebrar: 4 Voltar seguidos sem esperar a animação (termina no estado, endereço vazio, sem erro), 2 Avançar seguidos, Voltar com a lista da busca aberta (sobe e a lista do município fecha), F5 no município (reabre no mesmo) e Voltar depois do F5, trocar o endereço com a tela cheia ligada. Sem erros de JavaScript.

**Esforço M · Risco médio-baixo.** Arquivos que mudariam: o mesmo `assets/mapa-extras.js` (parte do histórico: ~75 linhas) e a tag em `scripts/gera_trechos.py`; **`mapa-municipios.js` não muda**. Risco: (a) a pessoa que explora muito acumula entradas no histórico (uma por nível descido, como em qualquer app de uma página só); (b) o embrulho de `ARGOS_MAPA.vai` e a escuta de `argos-nivel` dependem desse contrato: se o `mapa-municipios.js` mudar essas duas coisas, os testes (`node testes.js historico-d`) avisam. Quem mantiver o mapa pode mover o código para dentro dele depois sem mudar o comportamento.

---

## S3 · Dados repetidos que ainda sobraram no layout novo · esforço P · risco baixo

**Mapa das repetições** (prints "antes" com caixas amarelas numeradas):

| # | Onde | O que se repete | Print |
|---|------|-----------------|-------|
| 1 | Regional aberta (Centro) | O **nome de cada polo** aparece no chip da barra (Paraíso, Porto Nacional, Palmas) e no cartão do mapa (esses com NAE). Os chips são botões; o cartão é um `div` que intercepta o clique e **não faz nada** | `antes-d-regional-notas.jpg`, `antes-m-regional-notas.jpg` |
| 2 | Polo aberto, mouse sobre um município | O balão repete o **nome e a NAE** que o cartão do município, logo abaixo, já mostra ("Rio Sono 10 NAE" duas vezes), e ainda diz "Regional Centro · Palmas", que a trilha já diz | `antes-d-polo-dica-notas.jpg` |
| 3 | Campo da busca vazio (computador) | Cada linha da lista traz o **contexto que a trilha já diz** ("Polo Palmas · Centro · 3 alimentadores", ×9) | `antes-d-busca-polo-notas.jpg` |
| 4 | Campo da busca vazio (computador) | Cada linha traz a **NAE** (336, 35, 19…) que os cartões do mapa ao lado já mostram; idem nas regionais (3.130 / 1.655 / 963, também nos cartões) | `antes-d-busca-polo-notas.jpg`, `antes-d-busca-estado.jpg` |
| 5 | Município aberto | Trilha "Tocantins › Centro › **Palmas › Palmas**" (polo e município com o mesmo nome) | `antes-d-mun-notas.jpg`, `antes-m-mun.jpg` |
| 6 | Município aberto | A seta ← é a mesma ação do passo anterior da trilha, do Esc e (agora) do Voltar; pior: **fica escondida debaixo da lista dos alimentadores** (computador e celular) | `antes-d-mun-notas.jpg` (nº 6) |

Não encontrei repetição nova no estado inteiro (regionais só nos cartões), na legenda (as faixas aparecem uma vez) nem no alimentador em foco. No município o balão da rede ("km em Palmas") fica, porque a lista aberta pode estar rolada e o balão é o único que diz qual alimentador é aquele traço; só troquei "em Palmas" por "aqui" (como a lista).

**Proposta.**
1. **Regional:** os cartões dos polos viram os botões (`<button>`, foco por teclado, `aria-label` com a NAE, passar o mouse realça o polo) e a barra deixa de repetir os nomes: fica só "← Tocantins › Centro". (Libera uma linha no celular.)
2. **Balão do município:** sem nome/NAE quando o cartão do município já está no mapa (só "2 alimentadores · 907,7 km" e a dica de clique); só o nome quando o cartão é o de "só número"; sem "Regional X" quando a regional está aberta, nem o polo quando o polo está aberto. No estado e na regional, onde não há cartão de município, o balão continua completo.
3. **Lista da busca vazia (computador):** sem NAE e sem o contexto da trilha nas linhas de regionais, polos e municípios (ficam "12 municípios", "46 alimentadores"); o título diz a ordem ("Municípios do polo Palmas · por NAE"). A NAE continua nos "Alimentadores com mais NAE" (não aparece no mapa). **No celular a lista cobre o mapa, então lá a NAE fica** (decisão por `matchMedia`).
4. **Trilha:** "Polo Palmas" (e "Polo Palmas 434" no chip atual), então "Tocantins › Centro › Polo Palmas › Palmas". No celular, do município em diante a trilha esconde "Tocantins" para caber em uma linha.
5. **← dentro da trilha** (primeiro item), em vez de solta no canto: no computador a lista não a cobre mais; no celular a lista (tela toda) ainda cobre a trilha, então a seta só aparece depois de fechar a lista com um toque fora (o Voltar do celular sobe de qualquer jeito).

**Como fica.** `prints/depois-d-regional.jpg` e `depois-m-regional.jpg` (cartões como botões, trilha enxuta, seta na trilha); `depois-d-polo-dica.jpg` (balão sem o repetido); `depois-d-busca-estado.jpg`, `depois-d-busca-polo.jpg` (lista sem NAE nem contexto repetido); `depois-m-busca-polo.jpg` (celular mantém a NAE); `depois-d-mun.jpg`, `depois-m-mun.jpg`, `depois-d-alimentador.jpg`, `depois-m-alimentador.jpg` (trilha com "Polo Palmas", uma linha no celular). Os "antes" do mesmo enquadramento: `antes-d-regional.jpg`, `antes-d-polo-dica.jpg`, `antes-d-busca-estado.jpg`, `antes-d-busca-polo.jpg`, `antes-d-mun.jpg`, `antes-d-alimentador.jpg` (e `-m-`).

**Testado:** sem chips de polo na regional e 3 cartões `button` (nos dois tamanhos); clicar no cartão abre o polo; Enter no cartão focado abre o polo; ← é o primeiro item da trilha; trilha do polo diz "Polo Palmas"; lista do campo vazio sem NAE e sem "Polo/Centro" no computador e com NAE no celular; ← visível e clicável com a lista aberta no computador, coberta pela lista no celular (documentado) e clicável com a lista fechada; no site atual (antes) a ← está de fato coberta no município aberto.

**Esforço P · Risco baixo.** Arquivos que mudariam: `mapa-municipios.js` (balão, `trilha()`, cartões como botão: `proto/mapa-municipios.js.diff`, 100 linhas de diff), `busca-ativo.js` (`item.*` com modo curto e títulos: `proto/busca-ativo.js.diff`), `site.css` (~15 linhas). Decisão de produto aberta: **tirar a NAE da lista no computador** (proposto, para não repetir o cartão) ou manter por ser uma visão ordenada; é só não passar o `curto` em `atalhos()`. A lista cobre parte do mapa, então quem prefere ver a NAE sem olhar o cartão pode querer mantê-la.

---

## O que quebrou

**No site atual (achados dos testes):**
1. A seta ← fica **escondida debaixo da lista dos alimentadores** ao abrir um município (computador e celular). Confirmado por teste no site sem protótipo. Corrigido no computador pela seta na trilha; no celular a lista (tela toda) ainda cobre a trilha.
2. O cartão do polo na regional aberta **não responde ao clique** (é um `div` por cima do mapa). Corrigido em S3.
3. O balão do município cobre o cartão do mesmo município (S3 item 2).
4. O Voltar do navegador sai do site e `#…` é ignorado (S2).

**No que eu fiz (encontrado e corrigido durante os testes):** o seletor da tela cheia (`#mapa-to.tc-mapa .mt-mapa svg`) inflava o ícone do botão para 38 px (agora `>svg`); o endereço inválido não era corrigido na barra e `#centro/PALMAS/Palmas` não era reconhecido; a lista da busca cobria o botão da tela cheia no celular, a única saída do modo CSS (botão acima e lista com margem); a trilha quebrava em duas linhas no celular com "Polo Palmas"; no modo só CSS meu teste esperava que o Voltar mantivesse a tela cheia, mas o desenho é sair dela (corrigi o teste e acrescentei o caso dos níveis dentro da tela cheia); o toque emulado deixa um "hover" nos cartões dos polos que escurece os outros nos prints (só nos testes: nos prints solto o mouse).

## Limites e o que não deu para testar

- **Não testado em aparelho real** (iOS Safari, Android Chrome): só Chromium com viewport e toque emulados. Em especial: (a) no Chrome real em tela cheia nativa o Esc não chega à página (o navegador o consome): simulei com `exitFullscreen()` e deixei uma guarda de 250 ms que engole um Esc que chegue logo depois da saída; (b) o gesto Voltar do Android em tela cheia nativa deve sair da tela cheia antes de navegar (comportamento do navegador, não verifiquei); (c) o fallback CSS no iPhone foi simulado removendo a API.
- A cópia do site dentro do Artifact roda em iframe: sem `allow="fullscreen"` a tela cheia cai no CSS (testado como "API recusada") e, se o sandbox bloquear o `history`, o mapa funciona sem histórico (`try/catch`, não testado dentro de um Artifact real).
- No modo só CSS, se a pessoa mudar de nível dentro da tela cheia e sair pelo botão, sobra uma entrada "sentinela" no histórico (um Voltar que não muda nada); no caso comum (entrar e sair sem mexer) a entrada some.
- A rede de fundo do município e o voo continuam pesados (tema 5/outra sessão cuida das animações): num link direto o mapa voa do estado até o nível pedido em um só voo de 650 ms, e para alimentador espera baixar a rede dele.
- Fontes IBM Plex carregaram nos prints desta rodada (busquei o CSS do Google Fonts pelo curl), então as larguras são as de produção.
