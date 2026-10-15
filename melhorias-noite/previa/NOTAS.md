# Prévia da noite — rodada 4 com os 5 temas aplicados

Cópia local do ARGOS (página inicial + página do alimentador **LD01072001** + ranking `polos/`) com as 5 propostas da
rodada 4 juntas, para ver "como ficaria". **Nada foi publicado**: sem push, sem gh-pages, sem Artifact.

- Código: branch local `preview-noite` na worktree `agent-a09200a22dc2bd480` (base `cc821db`, a ponta de
  `claude/relaxed-bohr-bmyl0q`), um commit por tema: tema 1 `c3eadb4` → tema 3 `0a08fe8` → tema 5 `bd6a802` → tema 2 `e789ba0` →
  tema 4 `304e4c6`.
- Site gerado: `build/` é a cópia inteira do `exe_site` (467 MB) refeita com `gera_trechos.py --so-interface` + `nae_rede.py`
  a partir da worktree (validação: 0 problemas; `scripts/teste_gera_trechos.py` passa). `site/` é o recorte para quem só vê a
  página inicial e o LD01072001 (13 MB, 52 arquivos; montado por `monta-site.js`).
- Verificação: `smoke.js` e `extra.js` (Playwright + Chromium), saída em `verificacao.log` e `verificacao-extra.log`;
  prints em `prints/`.

## Ordem e como cada tema entrou

Ordem: 1, 3, 5, 2 (zoom) e 4 (independente). Cada final.diff foi fundido em 3 vias contra a base em que foi feito
(`merge3.py`: base = `git show BASE:arquivo`, deles = base + diff, nosso = árvore atual).

### Tema 1 · Voltar do navegador, tela cheia, 3 defeitos, repetições — entrou inteiro
- `final.diff` (base e6bca61) aplicou sem conflito: `mapa-extras.js` novo (Voltar/Avançar sobem e descem um nível, endereço
  `#regional/polo/município/AL`, tecla F, Esc sai da tela cheia só-CSS antes de subir de nível), seta ← na barra, cartão do
  polo como `<button>`, balão do município sem repetir, chips repetidos removidos, 2 linhas no gerador.
- Ficou de fora (o próprio FINAL deixa para depois): decidir a NAE nas linhas da lista da busca (a opção continua
  comentada em `busca-ativo.js`); tirar a reserva de 52 px do `enquadra()` no celular; unificar `telacheia.js` e `.mt-tc`.

### Tema 3 · Tipografia, cartão preto, rótulos adaptativos, ranking — entrou inteiro
- Base f7090e4 (mapa de antes do "mapa mais leve"). 4 conflitos, resolvidos assim:
  - `site.css`: os blocos do tema 1 e do tema 3 no fim, um depois do outro.
  - `mapa-municipios.js`, criação do cartão do alimentador em foco: `lado.append(legAl, cartaoAl)` — a seta `volta` saiu da
    coluna porque o tema 1 a levou para a barra.
  - `enquadra()`: a do tema 3 (viewBox na proporção da caixa, moldura fixa no celular, `lateral()`), mantendo o `baseEnq`
    que o mapa mais leve usa para não reenquadrar à toa.
  - `poeNomes()` (o conflito real): ficou a **medição única** do mapa mais leve (os 3 níveis de cartão de todos os municípios
    medidos de uma vez, escritas só no fim) e a escolha virou `tenta(ordem)`, que roda as **8 ordens do tema 3** só com
    contas (sem tocar no DOM entre uma e outra) e fica com a melhor, respeitando o orçamento de 45 ms. O `data-cod` do
    tema 1 continua nos cartões. Diferença do tema 3 original: ele remedia cada cartão a cada tentativa; aqui a medida é
    reaproveitada (o resultado deve ser o mesmo, mas os números do FINAL do tema 3 não foram medidos de novo).
- Resto sem conflito: afastamento adaptativo (`ajusta`, só em `entraPolo`), nome curto, cartão preto do município e do
  alimentador em foco, selos em Plex Mono 600 + `@font-face` reserva, ranking (`ranking-polos.js` + marca no gerador).

### Tema 5 · Fluidez e acabamento — entrou inteiro
- Base ff40f52. 3 conflitos, todos de encaixe:
  - `site.css`: bloco do tema 5 no fim (depois dos temas 1 e 3).
  - `poeCartoes()`: `cartoes.dataset.ok = '1'` antes da linha atual das bandeirinhas (que no mapa mais leve usa `chave/d`).
  - fim do arquivo: o `redeDe` atual (miniatura leve depois do pouso) + a região de aviso `#mt-aviso` / `ARGOS_ANUNCIA`.
- Sem conflito: `caixa.prepend(cartoes)`, `Intl.NumberFormat`, alvos de 44 px no toque (`menu.js`, `ranking-polos.js`,
  site.css), `limpeza.js`/`inspecao.js`/`extras.js`, e `mapa_trechos.html` (polilinhas, `papel()`, barra escondida até
  `al-pronto`, `content-visibility` só no toque).
- Não medi de novo CLS, TBT nem fps.

### Tema 2 · Zoom do mapa — entrou, com mais trabalho de fusão
- **Atenção:** o `final.diff` é contra **ff40f52** (antes do mapa mais leve). O `orig/` da pasta do tema é o e6bca61, mas o
  `proto/` não foi rebaseado (o `proto/` = ff40f52 + diff), então usei ff40f52 como base. Deu 15 trechos em conflito (estilo
  diff3), resolvidos assim:
  - `contorno()`: ficou o do mapa mais leve (`amostra` com cache por chave), que já faz o que o cache `WeakMap` do tema 2 fazia.
  - `bandeiras()`: leitura única dos tamanhos (mapa mais leve) + `ctl` como obstáculo, `bandFios` e "cartão sem âncora some
    com zoom" (tema 2).
  - `escala(forca)`: aceita o zoom (`--k` segue o viewBox; sem `poeCartoes` com zoom) e passou a rodar com a regional aberta
    quando chamada com `forca` (o `fimZ()` agora chama `escala(true)` para devolver a letra do nível).
  - balão do município: o do tema 1 (sem repetir), só com o realce da regional desligado no zoom (`realca(Z ? null : …)`).
  - voo: a curva do mapa mais leve (`trajeto/curva`) + `nivelVb`/`zLimpa()` do tema 2; o pouso (`pousa()`) chama `fimZ()`
    quando o zoom está ligado e guarda `nivelVb` quando reenquadra.
  - `poeNomes()`: o do tema 3 para o polo (com o `cand` do tema 2, que procura também perto da borda com zoom) e, **antes** do
    ramo do polo, o ramo do zoom para o estado/regional (só cartões dentro do município, até 70, sem fio), como o FINAL sugeria.
  - um `ResizeObserver` só: o do mapa mais leve (compara com o tamanho do pouso) + "a caixa mudou de verdade: solta o zoom".
  - `ARGOS_MAPA.zoom` exposto; `zoom.css` acrescentado ao fim do `site.css`.
- Ficou de fora: o cache de tamanhos `tamCartao` no ramo do polo (lá vale a medição única do mapa mais leve); os testes do
  próprio tema (`teste-zoom.js`, `teste-zoom-celular.js`, `teste-painel.js`) não foram rodados nesta prévia.

### Tema 4 · Painel do alimentador — entrou inteiro, com 1 ajuste
- `final.diff` (base f76584c) aplicou sem conflito, inclusive a nota da NAE dentro do `lupa-painel.js` novo (PR #12).
- Mantido o comportamento do PR #12: na tela cheia a barra do ARGOS fica no mapa só com o olho, T1/T2/T3 e o Menu antigo
  continuam escondidos e a gaveta do painel abre pelo item "Painel" no alto da lista do olho.
  - Contradição: o bloco B do tema 4 (T1/T2/T3 com nº e km na tela cheia) pressupõe que a lupa devolva esses botões ao mapa; o
    PR #12 os esconde. Ficou o PR #12; o bloco B só muda o texto dos botões escondidos (inofensivo).
  - Ajuste: na tela cheia o resumo (trechos · km · NAE) ia para "depois da barra", que desde o PR #12 está no mapa; agora
    entra no alto da gaveta (`.panel`), que é onde o `painel.css` o espera (`painel.js`, função `lugar`).
- Observação: no celular, com a gaveta aberta a 46 % (depois de escolher um trecho), ela cobre o botão de tela cheia; é preciso
  baixar a gaveta antes. Não mexi.

## Contradições entre propostas (o que prevaleceu)
| Onde | Quem | Ficou |
|---|---|---|
| balão do município | tema 1 × tema 2 | tema 1 (sem repetir) + realce desligado no zoom do tema 2 |
| `poeNomes()` | tema 3 × tema 2 | tema 3 no polo; ramo do zoom do tema 2 só no estado/regional |
| T1/T2/T3 na tela cheia | tema 4 × PR #12 | PR #12 (escondidos) |
| seta ← | tema 1 × tema 3 (cartão em foco na coluna) | seta na barra (tema 1), cartão em foco na coluna da esquerda |

## O que foi verificado (Chromium do ambiente, 1440×900 e 390×844, servindo `site/`)
- Página inicial: estado → regional Centro → polo Palmas (cartão-botão) → município Palmas (rede desenhada a partir dos pacotes
  por polo) → Voltar do navegador sobe ao polo → alimentador em foco (cartão preto do tema 3) → Ctrl+roda (computador) /
  botões + (celular) no zoom; sem erro de página e sem rolagem horizontal nos 2 tamanhos.
- Extras: Ctrl+roda no estado (×4,9, 36 cartões) e Esc volta ao enquadramento; zoom no polo e ↺; link `#centro/palmas` abre o
  polo; tecla F liga a tela cheia; no modo só CSS, Esc sai da tela cheia sem subir de nível; tema claro; ranking `polos/` nos
  2 tamanhos sem erro.
- LD01072001: cabeçalho numa faixa (mapa a 64/66 px do topo, página sem rolagem), lupa abre com a nota da NAE
  ("Soma das classes 24 = NAE do alimentador 23 + 3 … − 2 sem trecho"), busca "T2-A" e ficha com abas
  (NAE 4 · Faixa 2 · Inspeção 5 · Insp→manut 46 · Manutenção 60), tela cheia como no PR #12, item "Painel" abre a gaveta com o
  resumo no alto, sai da tela cheia; 0 erros de página nos 2 tamanhos.

## O que NÃO foi verificado
- Aparelho real (iPhone/Android), pinça de verdade e trackpad do Safari; dentro do iframe do Artifact.
- Esc na tela cheia **nativa** (no Chromium automatizado a tecla sintética não sai dela; testei o modo só CSS).
- Leitor de tela (aviso por nível do tema 5).
- Métricas dos FINAL (CLS, TBT, fps, contagem de rótulos por polo): não medidas de novo com os 5 temas juntos.
- Fontes do Google e imagem de satélite ficaram bloqueadas no teste (os prints usam a fonte reserva e mostram o aviso
  "A imagem de satélite não carregou", que é do ambiente, não da prévia).

## O recorte `site/` (para publicar)
- 13 MB, 52 arquivos: `index.html`, `assets/` (31), `alimentadores/LD01072001/` (10), `polos/index.html`,
  `dados/tocantins.js` e `dados/redes/polo-*.json` (8 pacotes, 9,8 MB no total, ~0,7 a 1,7 MB cada).
- A rede dos alimentadores do mapa (`dados/redes/<AL>.json`, 319 arquivos, 6,8 MB) foi juntada em um pacote por polo
  (`{AL: rede}`), formato que o `mapa-municipios.js` já lê quando o arquivo do alimentador não existe ("cópias reduzidas
  do site, ex.: a do Artifact"). Cada alimentador ainda pede o arquivo dele antes (404 esperado) e cai no pacote.
- Não vão no recorte (e por isso não funcionam na prévia): busca por código de ativo e por OS (`dados/ativos`, `ativos-pref`,
  `os`, `alimentadores`: ~233 MB), páginas dos outros alimentadores e dos municípios, `relatorio.html`/`manifesto.json`
  (links do ranking).
