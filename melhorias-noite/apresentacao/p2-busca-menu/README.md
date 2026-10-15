# P2 · Busca e menu do ARGOS Manutenção

Slides prontos (título + tópicos + print). Prints em JPEG, `-d` = 1440x900 (computador) e `-m` = 390x844 (celular), tema escuro.
Site: https://lgrsv.github.io/vera-vegeta-o-back/teste/ · Gerados por `prints.js` (Playwright) nesta pasta.
Códigos usados nos exemplos, todos reais (conferidos nos dados do site): alimentador AL03037009, religador 7900001071,
transformador ETO310211A, OS ETO-RD-PO 000353/2026.

---

## Slide 1 · Um só campo de busca, atrás do olho do ARGOS

- O botão com o olho do ARGOS fica no canto esquerdo, acima do mapa; tocar abre o campo
- Uma única busca para quatro coisas: município, alimentador, ativo (chave, religador, transformador, poste) e OS
- Digitou, a lista suspensa aparece na hora e não empurra o mapa; Esc ou clique fora fecha
- Funciona igual no celular, com a lista ocupando a largura da tela

Print 1: `01-inicio-d.jpg` · `01-inicio-m.jpg`

## Slide 2 · Município e alimentador

- Município: digite "Palmas" e a lista mostra o município com a quantidade de alimentadores (46); escolher abre a página do município
- Alimentador: digite "AL03037009" (aceita parte do código) e aparece com a subestação (SE GUARAÍ I); escolher abre o painel dele
- Acentos não atrapalham: a busca ignora maiúsculas e acentos
- Os resultados vêm dos próprios dados do mapa, sem esperar download

Print 2: `02-busca-municipio-d.jpg` · `02-busca-municipio-m.jpg`
Print 3: `03-busca-alimentador-d.jpg` · `03-busca-alimentador-m.jpg`

## Slide 3 · Ativo: chave, religador, transformador, poste

- Com 3 caracteres já sugere códigos que começam igual (disjuntor, religador, fusível, chave, transformador, poste)
- Exemplo: religador 7900001071 → T2 · AL01018071, "Início do T2 · fim do T1", SE BREJINHO DE NAZARÉ
- Exemplo: transformador ETO310211A → LD02010004, no T3-DP
- O resultado diz alimentador, trecho e o papel do ativo; "Abrir no mapa →" leva até ele
- Só vale o código completo; postes sem número no cadastro não entram

Print 4: `04a-busca-ativo-sugestao-d.jpg` · `04b-busca-ativo-resultado-d.jpg` · `04b-busca-ativo-resultado-m.jpg`
Print 5: `05-busca-transformador-d.jpg` · `05-busca-transformador-m.jpg`

## Slide 4 · OS no formato nº/ano

- Digite o número e o ano, como em 353/2026; a lista oferece "Buscar a OS" nas bases de faixa, inspeção, manutenção e executadas
- Sem a equipe: mostra todas as OS com esse número (a 353/2026 existe em várias equipes)
- Com a equipe (ETO-RD-PO 000353/2026): mostra só a dela, aqui 2 registros em LD02047073 (manutenção gerada pela inspeção e executada em 2026-04-20)
- Cada linha traz a base, a data ou situação e o alimentador com a subestação

Print 6: `06a-busca-os-sugestao-d.jpg` · `06b-busca-os-resultado-d.jpg`
Print 7: `07-busca-os-equipe-d.jpg` · `07-busca-os-equipe-m.jpg`

## Slide 5 · "Abrir no mapa"

- O link da OS ou do ativo abre o painel do alimentador já centrado no ponto (parâmetros `?a=` e `ll=` no endereço)
- O ponto aparece marcado no mapa com a etiqueta ATIVO e o código procurado (ex.: ETO-RD-PO 000353/2026 em LD02047073)
- No painel o usuário segue para trechos T1/T2/T3, NAE e camadas
- O endereço pode ser copiado e enviado a outra pessoa, que vê o mesmo ponto

Print 8: `08-abrir-no-mapa-d.jpg` · `08-abrir-no-mapa-m.jpg`

## Slide 6 · Menu ☰: Night shift, script KML e atualização de bases

- Menu no canto superior esquerdo de todas as páginas, com três itens
- Night shift: alterna escuro (padrão, fundo preto) e claro; atalho Shift+K fora dos campos de texto; a escolha fica guardada no navegador e vale para todas as páginas
- Script KML → trechos (.zip): baixa o pacote (cerca de 94 KB) que divide o KML do Daimon em trechos T1/T2/T3 e gera o mapa; vem com LEIA-ME.txt
- Atualização de dados: arrastar o arquivo, o site reconhece a base pelo nome (Crítica, limpeza de faixa, inspeção, manutenção da inspeção, executadas) e a lista mostra a última atualização de cada uma
- O envio exige a chave do GitHub, colada uma vez e guardada só no navegador; depois o site acompanha o processamento (uns 5 min) e publica em 1–2 min
- Estado das bases hoje: executadas 215.325 OS até 15/10/2026; inspeção 2.081 até 09/10/2026; manutenção da inspeção 5.323 até 10/10/2026; limpeza de faixa 2.615 OS; Crítica de jan/2026 a ago/2026

Print 9: `09-menu-d.jpg` · `09-menu-m.jpg`
Print 10: `10-night-shift-claro-d.jpg` · `10-night-shift-claro-m.jpg`
Print 11: `11-atualizar-bases-d.jpg` · `11-atualizar-bases-m.jpg`

---

## Notas para quem apresenta

- Os prints da tela de atualização só abrem o diálogo; nenhum envio foi feito e nenhuma chave foi digitada.
- Para refazer os prints: `node prints.js` nesta pasta. Dentro deste ambiente o Chromium precisa do proxy e da CA dele
  (já tratados no script).
- Dado a conferir antes de apresentar: na tela de bases, a Crítica aparece sem data de atualização ("—") porque `dados/bases.json` só traz o período (jan a ago/2026), não a data de processamento.
