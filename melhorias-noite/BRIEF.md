# Rodada noturna de melhorias do ARGOS Manutenção (15/10/2026)

Pedido do usuário: 5 agentes a cada 2 horas, das 23h40 às 07:30 (horário de Tocantins, UTC-3), com sugestões
de verdade, prints e protótipos. Em paralelo, 5 agentes montam um material de apresentação das funcionalidades do site.
O resultado final vira um só Artifact.

## O site
- Ao vivo (versão de teste, sempre disponível): https://lgrsv.github.io/vera-vegeta-o-back/teste/
  - Página inicial: mapa do Tocantins com drill-down: estado → regional (Norte/Centro/Sul em cards pretos) →
    polo (cards na barra) → município (redes dos alimentadores em monocromático + lista de alimentadores) →
    foco no alimentador (zoom; 2º clique abre a página dele).
  - Busca (botão com o olho do ARGOS, no canto esquerdo acima do mapa): ativo, município, alimentador ou OS (nº/ano).
  - Menu ☰: Night shift (tema claro/escuro, atalho Shift+K), download do script KML, atualizar bases.
  - Página do alimentador ("painel"), ex.: .../teste/alimentadores/LD01072001/ e .../teste/alimentadores/AL03037009/
    mapa com trechos T1/T2/T3, NAE por trecho, camadas Faixa/Inspeção/Manutenção, tela cheia, croqui Excel.
  - Ranking por polos: .../teste/polos/   ·   Relatório de validação: .../teste/relatorio.html
- Código-fonte (só LEITURA): /home/user/smartled/alimentador/site/ (site.css, mapa-municipios.js, busca-ativo.js,
  menu.js, telacheia.js, extras.js, ...), gerador da página inicial em /home/user/smartled/scripts/gera_trechos.py,
  página do alimentador em /home/user/smartled/alimentador/mapa_trechos.html.
- Tema: fundo preto (#000) por padrão; claro com Night shift. Fontes IBM Plex Sans / Sans Condensed / Mono.

## Regras (obrigatórias)
- NÃO editar nada em /home/user/smartled fora da sua pasta de saída. NÃO fazer git commit/push. NÃO mexer em dados.
- Protótipos sem tocar no site: copie o arquivo original (ex.: alimentador/site/site.css ou o asset baixado do site
  ao vivo) para a sua pasta, altere a cópia e injete no navegador com Playwright:
    await page.route('**/assets/site.css', r => r.fulfill({ path: '<sua pasta>/proto/site.css', contentType: 'text/css' }));
  ou page.addStyleTag / page.addScriptTag. Guarde o script que gera os prints (prints.js) para ser reprodutível.
- Playwright: const { chromium } = require('/opt/node22/lib/node_modules/playwright'); (Chromium já instalado; NÃO rode
  "playwright install"). Prints em JPEG (type:'jpeg', quality:80), sempre 1440x900 E 390x844 (celular), tema escuro
  (e claro quando fizer diferença). Antes/depois do mesmo enquadramento.
- Português do Brasil, direto. Sem inventar dados: números só do site.

## Entrega (na sua pasta)
- README.md: para cada sugestão: Problema (com print "antes"), Proposta, Como fica (print "depois" do protótipo),
  Esforço (P/M/G), Risco, Arquivos que mudariam. No topo, um resumo de 5 linhas e a sugestão nº 1 recomendada.
- resumo.json: {"tema": "...", "sugestoes": [{"titulo": "...", "prioridade": 1, "esforco": "P|M|G",
  "antes": ["arquivo.jpg"], "depois": ["arquivo.jpg"], "prototipo": ["proto/..."], "descricao": "..."}]}
- proto/ (arquivos alterados) e prints.js.
- Rodadas seguintes: leia as rodadas anteriores do mesmo tema e APROFUNDE (corrija o que ficou ruim, valide, refine
  o protótipo, teste no celular), não repita.

## Temas de melhoria (um agente cada)
1. Busca e animação: melhorar a visualização da busca e das animações; nenhum dado repetido no mapa (ex.: mesma info
   na barra, no card e na legenda); o elemento que hoje aparece EMBAIXO ao pré-selecionar os alimentadores (lista de
   alimentadores do município / legenda) deve ir para o LADO ESQUERDO da tela; botão de TELA CHEIA do mapa.
2. Mapa: visualização e layout; zoom antes de ir aos alimentadores (rolar com Ctrl + roda do mouse, pinça no celular,
   arrastar), mais interativo.
3. Design de fonte/tipografia, principalmente no mapa. O usuário GOSTOU do card preto (cards Norte/Centro/Sul). Na
   visão por município, mostrar a NAE embaixo do nome de cada município, bonito e bem espaçado.
4. Painel (página do alimentador): encaixe e organização para otimizar espaço e não repetir dados.
5. Fluidez e qualidade: nada travado (sem engasgos de animação, sem tela presa, sem rolagem bloqueada), carregamento,
   acessibilidade e acabamento impecável. Medir (tempo de carga, long tasks, FPS nas animações) antes e depois.

## Material de apresentação (um agente cada)
P1. Visão geral e navegação do mapa (estado → regional → polo → município → alimentador).
P2. Busca (ativo/município/alimentador/OS) e menu (Night shift, Shift+K, script KML, atualizar bases).
P3. Página do alimentador: trechos T1/T2/T3, NAE por trecho, camadas Faixa/Inspeção/Manutenção, tela cheia, croqui.
P4. Ranking por polos, NAE/100 km, relatório de validação, de onde vêm os dados e como atualizar.
P5. Roteiro de apresentação de 10 minutos + glossário (NAE, T1/T2/T3, OS, polo, regional) + perguntas frequentes.
Entrega: README.md com o texto pronto para slide (título + 3–5 tópicos curtos por slide) + prints numerados.

## Atualização 00h30 (Tocantins): tema 3 aprovado e publicado
O usuário aprovou o design do tema 3 (rodada 1) e ele já está no /teste/: cartão preto nos municípios com a NAE embaixo,
cartões dos polos com nome e NAE, título ARGOS em wordmark com o Ranking em botão, legenda em faixa horizontal e
municípios mais espaçados. As rodadas seguintes partem DESTA versão (o "antes" agora é ela). Pedido do usuário: espaçar
ainda mais as cidades onde ficar apertado. No Artifact existe também uma busca integrada ao mapa (outra sessão),
ainda não publicada no /teste/.

## Atualização 01h30 (Tocantins): base da rodada 2
- No /teste/ agora (e no gerador): design do tema 3 + busca integrada ao mapa (campo sempre visível; escolher um resultado
  move o mapa até lá) + lista dos alimentadores do município aberta EMBAIXO da busca (a caixa ao lado do mapa saiu).
- Outra sessão ("Argos design improvements") está cuidando, a pedido do usuário, de: (a) animação e renderização do mapa
  da página inicial e (b) busca/lupa no painel do alimentador (proposta em assets/lupa-painel.js,
  https://claude.ai/artifact/F9h14JEhEqGMgZqPrZXV8W). NÃO duplicar:
  - Tema 1: a busca já foi feita; foque em TELA CHEIA do mapa, dados repetidos que sobraram e no botão Voltar do
    navegador subir um nível (hash na URL).
  - Tema 4: parta da proposta lupa-painel (leia o artifact acima) e proponha só o que ela não cobre (resumo único,
    camadas, celular).
  - Tema 5: a fluidez das animações da página inicial está com a outra sessão; foque em Tab/foco, CLS do cabeçalho,
    alvos de toque, página do alimentador e ranking.

## Atualização 03h05 (Tocantins): base da rodada 3
- Base ATUAL = /teste/ ao vivo (gh-pages 5cdff04f) = /home/user/smartled/alimentador/site/ (Artifact v34): busca só no olho,
  legenda NAE com título e orelhinha (recolher esconde os números), tela cheia (.mt-tc), bandeirinhas das regionais/polos
  saindo do contorno, rótulos de TODOS os municípios do polo (dentro, ou ao lado com fio .mt-fios), lista do município
  embaixo do olho, página sem rodapé (Relatórios no menu ☰). Ranking por polo agora bate com o mapa (polo do município).
- A outra sessão ("Argos design improvements") continua dona de: legenda, busca, tela cheia, bandeirinhas, lupa do painel.
  Proponha mudanças nessas partes só como sugestão, sem refazer.
- Rodada 3 = CONSOLIDAR: um protótipo único por tema, juntando o melhor das rodadas 1 e 2, aplicado sobre a base ATUAL,
  entregue como patch pronto (proto/*.diff contra /home/user/smartled/alimentador/site/ + arquivos novos), validado
  em 1440x900 e 390x844, escuro E claro, com medições antes/depois e lista "o que implementar primeiro".
- Prazo: terminar até 07:30 UTC (04:30 em Tocantins).

## Atualização 04h35 (Tocantins): rodada 4 (final)
- Base = commit atual da branch (alimentador/site/ = /teste/ ao vivo, gh-pages 8f86bf3, com a lupa no painel e 1 clique
  no alimentador abrindo o painel).
- Entrega FINAL por tema, na pasta rodada-4/tema-K-.../:
  - proto/final.diff contra a base (aplica com `git apply --check` na raiz do repositório) + arquivos novos;
  - prints-finais/: 3 a 4 PARES antes/depois dos momentos mais importantes, em 1440x900 e 390x844 (nomes
    NN-assunto-antes-1440.jpg / NN-assunto-depois-1440.jpg, idem -390), JPEG qualidade 80;
  - FINAL.md de 1 página: o que muda (3 a 6 tópicos), números antes→depois, o que implementar primeiro (lista
    priorizada com esforço), riscos, e "toca nos arquivos/funções" (para eu juntar os 5 temas sem conflito).
- Prazo rígido: 08:35 UTC (05:35 em Tocantins).
