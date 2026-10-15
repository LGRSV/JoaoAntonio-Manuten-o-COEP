# Tema 1 · Busca e animação · rodada 1

Site analisado: https://lgrsv.github.io/vera-vegeta-o-back/teste/ (título "ARGOS / MANUTENÇÃO" já no ar; os arquivos ao vivo eram idênticos ao código em `alimentador/site/`).
Tudo foi feito por injeção no navegador (Playwright), sem tocar no código do site e sem commit. Prints em JPEG, 1440x900 (`d`) e 390x844 (`m`), tema escuro (claro onde faz diferença).

## Resumo

1. **Painel esquerdo único (S1, recomendada nº 1):** a legenda "NAE-Vegetação" era o elemento "de baixo": no computador ela fica no pé do mapa, fora da primeira tela, e no nível município abre por cima da lista de alimentadores; no celular a lista ficava presa embaixo. No protótipo legenda e lista ficam na coluna da esquerda (legenda some no município) e, no celular, a lista vira uma gaveta que sai da esquerda.
2. **Tela cheia do mapa inicial (S3):** botão no canto do mapa que leva barra + mapa + painel esquerdo para a tela cheia; a lógica é a do `telacheia.js` (nativa + fallback CSS para iPhone), mas o arquivo em si não serve direto (depende do Leaflet), então é uma função nova de ~45 linhas que `telacheia.js` pode passar a usar.
3. **Nada repetido (S2):** 6 repetições mapeadas com print (NAE de cada polo no chip e no selo do mapa; "Palmas › Palmas" + título + botão; código do alimentador 3x; tooltip repetindo o contexto; busca repetindo o que foi digitado).
4. **Busca renovada (S4) e busca que voa no mapa (S5):** botão com rótulo "Buscar" e atalho "/", exemplos clicáveis, linhas com contexto (regional › polo, NAE, SE) e destaque do trecho digitado; escolher município/alimentador faz o mapa voar até lá em vez de abrir outra página; voos com duração proporcional e rede de fundo escondida durante o voo (polo→município de 13 para 32 quadros).
5. **Testes:** `testes.js` (clique, Esc, ←, celular, tela cheia nativa e só CSS, reduced-motion, regressão sem flags): 93 verificações, tudo passou (`testes.log`). Nada quebrou; limites no fim.

## Como ver / reproduzir

- `proto/` contém só os arquivos alterados: `site.css`, `mapa-municipios.js`, `busca-ativo.js` (cópias dos de `assets/`, com `.diff` contra o original em `live/`) e `tela-cheia-mapa.js` (novo).
- Cada sugestão liga por `<html data-proto="s1 s2 s3 s4 s5">`; sem o atributo o comportamento é o do site (testado). Isso permite adotar uma de cada vez.
- `prints.js` gera todos os prints; `testes.js` roda os testes; `lib.js` é comum aos dois. `servidor.js` é um espelho local do site de teste (só para contornar o certificado do proxy do ambiente de trabalho; o conteúdo é o do site ao vivo).
- Injeção usada: `page.route('**/assets/site.css'|'mapa-municipios.js'|'busca-ativo.js', r => r.fulfill({path: 'proto/...'}))` e `addScriptTag` para `tela-cheia-mapa.js`.

---

## S1 · Painel esquerdo: legenda e alimentadores no lado esquerdo — esforço M · risco baixo

**Problema.** Navegando card Centro → polo Palmas → município Palmas descobri qual é o elemento "de baixo":
- no computador é a legenda **NAE-Vegetação** (`.mt-regs`, `bottom:0` do mapa). Com o mapa de 730 px de altura e o cabeçalho, ela fica abaixo da dobra aos 900 px (não aparece na primeira tela) e, ao abrir no município, **cobre a lista de alimentadores** (print abaixo). Nesse nível ela nem faz sentido: as cores de NAE somem e o município fica numa cor só.
- no celular é a **caixinha de alimentadores presa embaixo do mapa** (puxada por uma seta), que cobre o mapa e dá a tela com legenda + seta + rodapé empilhados.

Antes: `prints/s1-antes-d-primeira-tela.jpg`, `prints/s1-antes-d-mun.jpg` (legenda sobre a lista), `prints/s1-antes-d-alimentador.jpg`, `prints/s1-antes-m-mun.jpg`, `prints/s1-antes-m-mun-aberta.jpg`.

**Proposta.**
- Legenda dentro da coluna esquerda (`.mt-lado`), logo abaixo da seta ←, em todos os níveis em que as cores de NAE aparecem (estado, regional, polo). Fica visível na primeira tela.
- No município e no alimentador a legenda sai e a lista fica sozinha (sem sobreposição).
- Celular: legenda vira uma régua de cores colada na beira esquerda (toque abre os rótulos ao lado); a lista de alimentadores vira **gaveta da esquerda** com aba vertical "46 alimentadores"; escolher um alimentador recolhe a gaveta e dá zoom; Esc fecha só a gaveta; o mapa não reserva mais o pé (mais área).
- Animação de entrada do painel da esquerda para a direita, item a item (parte do S5, ligada por `s5`).

**Como fica.** `prints/s1-depois-d-primeira-tela.jpg`, `s1-depois-d-estado.jpg`, `s1-depois-d-regional.jpg`, `s1-depois-d-mun.jpg`, `s1-depois-d-alimentador.jpg`, `s1-depois-d-claro-mun.jpg` (tema claro); celular: `s1-depois-m-estado.jpg`, `s1-depois-m-mun.jpg` (gaveta fechada, só a aba), `s1-depois-m-mun-aberta.jpg`. Conjunto completo com todas as sugestões: `todas-d-*.jpg`, `todas-m-*.jpg`.

**Testado:** legenda no topo-esquerda do mapa e inteira na primeira tela; some no município e volta ao subir; sem sobreposição; Esc ×3 e ← sobem os níveis; no celular a gaveta fechada fica fora da tela e não recebe foco de teclado (`visibility:hidden`), abre/fecha por toque e por Esc, recolhe ao escolher alimentador; sem rolagem horizontal.

**Arquivos que mudariam:** `site.css` (regras `.mt-lado`, `.mt-regs`, `.mt-als`, `.mt-puxa`), `mapa-municipios.js` (mover `leg` para `lado`, `setPuxada`, `enquadra()` mobile, texto da aba), e o HTML gerado por `scripts/gera_trechos.py` não precisa mudar (a legenda é reposicionada por JS; para evitar qualquer salto no carregamento, o ideal é mover o `<details class="mt-regs">` para dentro de um `.mt-lado` no HTML gerado).

**Limites / o que ficou pendente:** no celular a aba cobre um pedaço do oeste do município (dá para descer a aba ou encolher); a régua de cores não tem título (tem `aria-label`); falta decidir se, ao entrar no município pela primeira vez, a gaveta deve começar aberta.

---

## S2 · Nenhum dado repetido — esforço P · risco baixo

**Mapa das repetições (prints "antes" com caixas amarelas numeradas):**

| # | Onde | O que se repete | Print |
|---|------|-----------------|-------|
| 1 | Regional aberta (Centro) | NAE de cada polo aparece **no chip da barra (588 / 633 / 434) e no selo vermelho do mapa** (mesmos números) | `s2-antes-d-regional.jpg`, `s2-antes-m-regional.jpg` |
| 2 | Município aberto (Palmas) | "Palmas" na trilha (polo), "Palmas" na trilha (município), título "Palmas · 46 alimentadores" e botão "Abrir Palmas →": o nome 4x; polo e município com o mesmo nome | `s2-antes-d-mun.jpg`, `s2-antes-m-mun.jpg` |
| 3 | Alimentador em foco | o código (LD02059122) aparece na trilha, no botão "Abrir LD02059122 →" e no cartão da lista; no celular a trilha ainda quebra em 2 linhas | `s2-antes-d-alimentador.jpg`, `s2-antes-m-alimentador.jpg` |
| 4 | Dica ao passar o mouse | com a Regional Centro e o polo Palmas abertos, a dica diz de novo "Regional Centro · Palmas"; na rede, "km em Palmas" | `s2-antes-d-regional-dica.jpg` (texto: "Rio Sono · 10 NAE · Regional Centro · Palmas · 2 alimentadores · 907,7 km") |
| 5 | Busca de ativo | o código digitado está no campo, no cabeçalho "1 resultado para 7900001071:" e na linha "Religador 7900001071" | `s4-antes-d-ativo-resultado.jpg` |
| 6 | Busca de OS | "ETO-RD-GU 000353/2026" no campo, "1 OS com o número 353/2026:" e o código de novo no cartão do resultado (e antes, na sugestão "OS …") | `s4-antes-d-os-resultado.jpg` |

Não encontrei a mesma NAE repetida entre barra, card e lista no nível estado (só os cards Norte/Centro/Sul) nem no polo (só no chip atual).

**Proposta.** Regra: cada número/nome aparece uma vez por nível.
1. Regional: NAE do polo só no selo do mapa (como os cards do estado); chips só com nome e cor (o `aria-label` mantém a NAE para leitor de tela). No polo aberto o número fica só no chip atual.
2. Trilha: polo ganha o prefixo ("Tocantins › Centro › **Polo Palmas** › Palmas"); título da lista vira "46 alimentadores"; botão vira "Página do município →" (e "Página do alimentador →" com o alimentador em foco).
3. Celular: trilha encurta para "… › Polo Palmas › Palmas" / "… › Palmas › LD02059122" (o "…" volta ao Tocantins), cabendo em uma linha.
4. Dica: omite o que a trilha já diz (regional e polo quando abertos; "em Palmas").
5/6. Busca: cabeçalho vira só "1 resultado" / "1 OS" (ver S4).

**Como fica.** `prints/s2-depois-d-regional.jpg`, `s2-depois-d-mun.jpg`, `s2-depois-d-alimentador.jpg`, `s2-depois-d-regional-dica.jpg`; celular `s2-depois-m-regional.jpg`, `s2-depois-m-mun.jpg`, `s2-depois-m-alimentador.jpg`; busca em `s4-depois-d-ativo-resultado.jpg` e `s4-depois-d-os-resultado.jpg`. (Esses prints usam só a flag `s2`; por isso a legenda ainda aparece sobre a lista, que é o S1.)

**Testado:** textos conferidos por teste automático (chips sem número, 3 selos, trilha "Polo Palmas › Palmas", título, botões, Esc devolve o texto do botão).

**Arquivos:** `mapa-municipios.js` (`legendaRegional`, `trilhaMun`, `tituloAls`/`abreMunTxt`/`abreAlTxt`, `dica`), `busca-ativo.js` (cabeçalhos dos resultados). Só texto; sem CSS novo.

**Limite:** decisão de produto aberta: tirar a NAE do chip (proposto) ou do selo. Se o usuário preferir a NAE no chip, é só não remover `nae(p.nae)` e esconder o selo.

---

## S3 · Botão de tela cheia no mapa da página inicial — esforço P · risco baixo

**Problema.** A página inicial não tem tela cheia: no 1440x900 o mapa começa a 289 px do topo e termina abaixo da dobra (o card "Sul" e a legenda ficam cortados; precisa rolar). Antes: `prints/s3-antes-d-primeira-tela.jpg`, `s3-antes-m-primeira-tela.jpg`, `s3-antes-d-mun.jpg`.

**Reaproveitar o `telacheia.js`?** Parcialmente. A lógica (Fullscreen API com prefixo webkit, fallback por CSS no iPhone, `fullscreenchange`, voltar à rolagem anterior, os dois ícones no botão e o CSS escolhe qual mostrar) vale igual. O arquivo em si não, porque depende do Leaflet (`window.__map`, `invalidateSize`, `.mapbox`, gaveta do painel). Proposta: extrair a lógica comum para uma função `alternaTelaCheia(elemento, aoMudar)` e usá-la nos dois. O protótipo (`proto/tela-cheia-mapa.js`, 46 linhas) já está escrito nesse molde, usando os mesmos ícones.

**Proposta.** Botão 40x40 no canto superior direito do mapa (mesmo estilo do ←). Em tela cheia vai o `#mapa-to` inteiro: barra (lupa/trilha), mapa e painel esquerdo; o mapa reenquadra no tamanho novo sozinho (os `ResizeObserver` do `mapa-municipios.js` já tratam). Sair: botão, Esc (nativo) ou, no fallback CSS, Esc sobe um nível do mapa e, no estado inteiro, sai.

**Como fica.** `prints/s3-depois-d-estado.jpg` (botão), `s3-depois-d-cheia-estado.jpg`, `s3-depois-d-cheia-mun.jpg`, `s3-depois-d-saiu-mun.jpg` (voltou ao layout normal, mesmo nível), `s3-depois-d-claro-cheia-estado.jpg` (tema claro); celular `s3-depois-m-estado.jpg`, `s3-depois-m-cheia-estado.jpg`, `s3-depois-m-cheia-mun.jpg`, `s3-depois-m-saiu-mun.jpg`. Com tudo junto: `todas-d-cheia-alimentador.jpg`, `todas-m-cheia-alimentador.jpg`, `todas-d-claro-cheia-mun.jpg`.

**Testado (desktop e celular):** entra em tela cheia nativa e o mapa ocupa 1440x900 / 390x844; a página não rola por baixo; navegar até o município e subir com ← dentro da tela cheia; sair pelo botão e por `exitFullscreen()` (equivalente ao Esc do navegador) devolve o layout, a rolagem (limitada ao que a página permite) e o nível do mapa; fallback sem Fullscreen API (iPhone): Esc sobe nível por nível e, no estado inteiro, sai.

**Arquivos:** novo `tela-cheia-mapa.js` (ou função comum em `telacheia.js`), `site.css` (`.mt-tc`, `#mapa-to.tc-mapa`), carregar o script depois de `mapa-municipios.js` na página gerada por `scripts/gera_trechos.py`.

**Limites:** em tela cheia o título ARGOS e o menu ☰ ficam fora (o ☰ some; Night shift continua por Shift+K); num teste real em iPhone o fallback CSS precisa ser conferido (simulei só removendo a API).

---

## S4 · Busca renovada — esforço M · risco baixo

**Problema.** O botão é só o olho do ARGOS, sem texto, pequeno e de baixo contraste: não diz que é a busca. O campo aberto não diz o que dá para digitar nem dá exemplos. As linhas de resultado trazem pouco contexto (município: só "46 alimentadores"; alimentador: só a SE), não destacam o que foi digitado, o cabeçalho repete o termo (S2 itens 5 e 6) e "Buscando…" é texto solto. Antes: `prints/s4-antes-d-fechada.jpg`, `s4-antes-d-aberta.jpg`, `s4-antes-d-municipios.jpg`, `s4-antes-d-alimentadores.jpg`, `s4-antes-d-ativos.jpg`, `s4-antes-d-ativo-resultado.jpg`, `s4-antes-d-os-resultado.jpg`, `s4-antes-d-vazio.jpg` (e `-m-` no celular).

**Proposta.**
- Botão com o olho + rótulo "Buscar" + dica de atalho `/` (a tecla abre a busca de qualquer lugar; Shift+K continua do Night shift).
- Campo vazio mostra "Busque por" com 4 exemplos clicáveis (Município: Palmas; Alimentador: LD01072001; Ativo: 7900001071; OS: 000353/2026).
- Linhas de 2 linhas com ícone por tipo: município "Centro › Palmas · 336 NAE · 46 alimentadores"; alimentador "SE … · 23 NAE · Porto Nacional +1"; ativo com o tipo; trecho digitado destacado; contador por seção; rodapé de teclas (↑ ↓ Enter Esc) só em dispositivo com mouse.
- Resultados de ativo e OS com cabeçalho curto ("1 resultado", "1 OS") e esqueleto de carregamento no lugar do "Buscando…"; "nada encontrado" traz os mesmos exemplos; no celular o placeholder encurta para caber.
- Todos os números (NAE, alimentadores, SE) vêm do `window.MUN` já carregado.

**Como fica.** `prints/s4-depois-d-fechada.jpg`, `s4-depois-d-aberta.jpg`, `s4-depois-d-municipios.jpg`, `s4-depois-d-alimentadores.jpg`, `s4-depois-d-ativos.jpg`, `s4-depois-d-ativo-resultado.jpg`, `s4-depois-d-os-sugestao.jpg`, `s4-depois-d-os-resultado.jpg`, `s4-depois-d-vazio.jpg`, `s4-depois-d-claro-municipios.jpg` (tema claro); celular: mesmos nomes com `-m-`.

**Testado (desktop e celular):** `/` abre e foca o campo; `/` dentro do campo digita normal; tocar no exemplo preenche e busca; setas navegam; Enter no ativo/OS mostra resultado com cabeçalho curto; "zzzz" mostra exemplos; Esc com só os exemplos fecha o campo, Esc com lista fecha a lista; sem erros de JavaScript. Corrigi durante os testes um temporizador que repovoava a lista depois de fechar.

**Arquivos:** `busca-ativo.js` (`dicas`, `op2`/`hl`, `info` por alimentador, atalho, esqueleto), `site.css` (seção `s4`).

**Limites:** busca de ativo continua exigindo o código completo no Enter (o protótipo não mudou os índices); a SE aparece como vem do dado ("SE PORTO NACIONAL"); o ícone do olho continua pequeno no pill (o PNG original tem pouco contraste: vale um retoque no `argos.png`).

---

## S5 · A busca voa no mapa + transições mais fluidas — esforço M (G se incluir histórico) · risco médio

**Problema.** Escolher um município ou alimentador na busca faz `location.href`: a página inteira recarrega e o mapa desaparece (print do destino em `prints/s5-antes-d-pagina-municipio.jpg`, `s5-antes-m-pagina-municipio.jpg`). Quem está explorando o mapa perde o contexto; a página do município só deveria abrir no "Página do município →". Nas transições, a câmera dura 650 ms fixos (igual para um salto curto e para ir do estado ao município), o painel aparece de uma vez, e as redes de milhares de traços, desenhadas com `vector-effect:non-scaling-stroke`, travam a animação: nas medições, polo → município renderizou só 13 quadros e alimentador → município 6 (maior intervalo 200 ms). Quadros "antes": `prints/s5-antes-d-trans-folha.jpg`, `s5-antes-m-trans-folha.jpg`.

**Proposta.**
- `window.__mapaTO.vaiPara(codMunicipio, alimentador?)` em `mapa-municipios.js`: parte de qualquer estado (estado, outra regional, outro polo, outro município), prepara regional → polo → município e faz **um único voo**; com alimentador, já dá zoom na rede dele. A busca chama isso, fecha o campo, rola até o mapa e deixa "Página do município/alimentador →" no painel.
- Duração do voo proporcional ao zoom e ao deslocamento (420–900 ms) com curva cúbica; reduced-motion continua sem animação.
- Durante o voo, as redes de fundo ficam escondidas e voltam com fade ao pousar.
- Painel da esquerda e trilha entram deslizando, item a item.

**Medição** (Chromium sem GPU, 1440x900; só o contraste antes/depois importa) em `testes.log`:

| Transição | Antes (quadros / maior intervalo) | Depois |
|---|---|---|
| polo → município | 13 / 100 ms | 32 / 83 ms |
| alimentador → município | 6 / 200 ms | 15 / 83 ms |
| regional → polo | 28 / 67 ms | 36 / 83 ms |
| estado → regional | 23 / 83 ms | 18 / 150 ms (ruído de captura; a duração acompanha o zoom) |
| município → alimentador | 8 / 200 ms | 7 / 133 ms (rede inteira do alimentador ainda é pesada) |

**Como fica.** Quadros do voo da busca "palmas" até o município: `prints/s5-depois-d-voo-folha.jpg`, `s5-depois-m-voo-folha.jpg`, gaveta no celular depois do voo `s5-depois-m-voo-gaveta.jpg`; transição polo → município: `s5-depois-d-trans-folha.jpg`, `s5-depois-m-trans-folha.jpg` (tempo real; as capturas atrasam a animação, então o tempo de cada quadro é aproximado).

**Testado:** busca "palmas" (do estado), "gurupi" (de Palmas para outra regional), "LD01072001" (vai a Porto Nacional e já foca o alimentador), "palmeirante"; depois do voo, Esc ×4 e ← ← sobem passo a passo; reduced-motion navega sem animação; sem erros de JavaScript.

**Arquivos:** `mapa-municipios.js` (`voa()` com duração, `vaiPara`, `municipioDe`), `busca-ativo.js` (`escolhe()`), `site.css` (seção `s5`). 

**Limites / pendente:** o navegador não tem histórico de níveis (o botão Voltar do navegador sai do site; já era assim). Ideal na próxima rodada: `#centro/palmas/palmas/LD02059122` com `pushState` (também permitiria compartilhar link e fazer a busca "voar" por URL), o que explica o esforço G; o foco do alimentador ainda é o passo mais pesado.

---

## O que quebrou / ressalvas gerais

- Nada quebrou nos testes (`testes.log`: TUDO PASSOU, incl. regressão com o protótipo carregado e sem flags).
- Falhas que apareceram e foram corrigidas no protótipo: o `bottom:0` herdado esticava a legenda no celular; `.mt-mapa svg{min-height:560px}` inflava o ícone do botão de tela cheia; o `Esc` do fallback CSS lia o estado do elemento errado; temporizador da busca repovoava a lista depois de fechar; `webkitRequestFullscreen` ainda existe no Chromium (por isso o teste de iPhone remove os dois).
- Não testado em dispositivo real (iOS Safari, Android): só Chromium com viewport e toque emulados. Fontes IBM Plex não carregaram no ambiente de captura (cai em fonte do sistema), então larguras de texto em produção serão um pouco diferentes.
- O espelho local (`servidor.js`) só existe por causa do certificado do proxy; os arquivos vêm do site ao vivo.
