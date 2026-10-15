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
