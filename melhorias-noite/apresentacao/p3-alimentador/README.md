# P3 · Página do alimentador (material de apresentação)

Sete slides prontos. Cada print existe em duas versões: `-d` (computador, 1440x900) e `-m` (celular, 390x844), JPEG, tema escuro.
Exemplos ao vivo: `LD01072001` (SE Porto Nacional; T1, T2, T2-A, T2-B e 195 T3) e `AL03037009` (SE Guaraí I; só T1 e T3).
Os números vêm do site no dia 15/10/2026 (versão de teste). Para refazer os prints: `prints.js` + `common.js` desta pasta
(`NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node prints.js`).

Como abrir a página: pelo mapa (município → alimentador, 2º clique) ou direto em
`https://lgrsv.github.io/vera-vegeta-o-back/teste/alimentadores/LD01072001/`. Um trecho já selecionado abre com `?t=T2-A`.

---

## Slide 1 · A página do alimentador

- Cabeçalho: caminho (Municípios), subestação (SE-2PNA, SE Porto Nacional) e o código do alimentador.
- Barra de busca: trecho, ativo ou poste. Ao lado, filtro por município e botão **Meses** (NAE).
- Mapa de satélite com a rede em trechos coloridos; ao lado, o painel: tabela por classe (T1, T2, T3: quantidade e km), NAE do alimentador e blocos das camadas.
- LD01072001: 199 trechos e 153,98 km (T1 13,02 km, T2 25,97 km, T3 114,99 km); NAE vegetação: 23.

**Print 01** · `01-visao-geral-d.jpg` / `01-visao-geral-m.jpg`

---

## Slide 2 · Trechos: T1, T2 e T3

- **T1**: do disjuntor (DJ) ao 1º religador.
- **T2**: do 1º ao 2º religador; cada religador seguinte abre um novo T2 (**T2-A, T2-B…**), em ordem a partir do DJ.
- **T3-A, T3-B…**: cada fusível abre um T3 (fusível dentro de fusível continua T3; não existe T4). Exceção: o 1º fusível da linha principal a menos de 300 m de um religador não abre T3.
- Cores no mapa: T1 azul, T2 (e T2-A, T2-B…) verde, T3 amarelo (linha mais fina). Os botões **T1 / T2 / T3** no alto do mapa ligam e desligam cada classe.
- Tocar num trecho (mapa, lista ou busca) mostra o detalhe no painel; **Ctrl (⌘) + clique** soma vários trechos (extensão e NAE).

**Print 02** · `02-t1-d.jpg` / `02-t1-m.jpg` (T1 selecionado: DJ até o religador 7927413001, 13,02 km, 256 vãos)
**Print 15** · `15-al03037009-d.jpg` / `15-al03037009-m.jpg` (AL03037009 não tem religador: T1 de 29,71 km e só T3 depois)

---

## Slide 3 · Chave de início e de fim de cada trecho

- Todo trecho vai de chave até chave: o painel mostra **Início** (código, tipo da chave e poste), **Fim**, extensão, fases, **Vem de** e **Derivações**; no mapa aparecem os pinos INÍCIO (verde) e FIM (vermelho).
- **T2-A** (religador a religador): início 7933799001 (religador), fim 7954762001, 16,58 km, 265 vãos.
- **T3-BC** (depois de fusível): início no fusível 03 0309785001, fim "fim de linha · poste 31175389", 3,85 km.
- Fim do trecho: o religador onde começa o T2 seguinte; senão, seguindo a linha principal, a 1ª chave onde começa outro trecho ou o poste de fim de linha. Chaves 88 não dividem trecho.
- Os chips de "Vem de" e "Derivações" navegam entre trechos vizinhos.

**Print 03** · `03-t2a-d.jpg` / `03-t2a-m.jpg`
**Print 04** · `04-t3-d.jpg` / `04-t3-m.jpg`

---

## Slide 4 · NAE por trecho e por mês

- NAE = interrupções coletivas (atuou DJ, religador, fusível ou trafo) e, se marcado, individuais (um consumidor). Neste site só as de **vegetação** (Meio Ambiente · Árvore/Eucalipto na rede), da base Crítica.
- Cada interrupção cai no trecho do ativo que atuou: o número vermelho aparece no rótulo do trecho no mapa e na lista.
- **Meses**: marque um ou vários (LD01072001 tem jan a ago/2026); "Contar individuais" fica na mesma lista. Tudo recalcula: mapa, lista e painel.
- Lista ordenada por **Maior NAE** (ou Menor NAE, ou T1 › T2 › T3), com início → fim, km e o ano da última limpeza ("sem limpeza" quando não há).
- Exemplo: jan/2026 tem 9 das 23 NAE; T2-A lidera (4), seguido de T1 e T2 (2 cada). NAE registrada em outro alimentador é indicada com link.

**Print 05** · `05-lista-nae-d.jpg` / `05-lista-nae-m.jpg` (todos os meses: 23 NAE)
**Print 06** · `06-nae-meses-d.jpg` / `06-nae-meses-m.jpg` (botão Meses aberto)
**Print 07** · `07-nae-janeiro-d.jpg` / `07-nae-janeiro-m.jpg` (só jan/2026: 9 NAE)

---

## Slide 5 · Camada Faixa: limpeza de faixa

- Menu do mapa › **Faixa** (ligada por padrão). Duas vistas: **Por ano** (cada ano de OS executada com uma cor; rede sem limpeza em cinza) e **Vencimento** (T1 a cada 3 anos, T2 a cada 4, T3 a cada 5: em dia, vence em até 12 meses, vencida, sem registro).
- LD01072001: 6 OS executadas, 24,2 km de 154,0 km; 7,9 km vencidos na vista Vencimento.
- **Criadas** (OS criada, ainda não executada): traço tracejado no mapa. **Pendentes** (a reprogramar / reprogramada): traço pontilhado. Cada grupo liga e desliga no mapa e abre a lista de OS (número, data, km, descrição); tocar numa OS enquadra o trecho.
- LD01072001 tem 3 criadas e nenhuma pendente. O print das pendentes é do LD02010004 (SE Araguaína I: 22 executadas, 4 criadas, 6 pendentes).
- A posição da OS é aproximada (chaves e ativos citados na OS e km da descrição).

**Print 08** · `08-faixa-criadas-d.jpg` / `08-faixa-criadas-m.jpg` (LD01072001, Criadas aberta)
**Print 09** · `09-faixa-pendentes-d.jpg` / `09-faixa-pendentes-m.jpg` (LD02010004, Criadas e Pendentes)
**Print 10** · `10-faixa-vencimento-d.jpg` / `10-faixa-vencimento-m.jpg` (vista Vencimento)

---

## Slide 6 · Camadas Inspeção e Manutenção

- Menu do mapa (três barras): **Faixa**, **Inspeção**, **Insp→manut** e **Manutenção**; dá para ligar quantas quiser ao mesmo tempo, cada uma com sua legenda no canto do mapa e seu bloco no painel.
- **Inspeção**: rede inspecionada pintada com a cor do ano; pontos vermelhos marcam início e fim do bloco inspecionado. LD01072001: 21 inspeções, 34,0 km de 154,0 km.
- **Manutenção** (OS executadas, corretivas e preventivas): um losango por ativo (poste, trafo ou chave), na cor do ano da última OS; o número é a quantidade de OS. LD01072001: 825 OS em 415 ativos.
- **Insp→manut**: OS de manutenção geradas pela inspeção, por situação (vencida, no prazo, executada).
- AL03037009 não tem inspeção; a camada só aparece quando há dados.

**Print 11** · `11-inspecao-manutencao-d.jpg` / `11-inspecao-manutencao-m.jpg` (Inspeção + Manutenção ligadas)
**Print 11b** · `11b-menu-camadas-d.jpg` / `11b-menu-camadas-m.jpg` (Menu aberto)

---

## Slide 7 · Tela cheia, satélite, croqui em Excel e KMZ

- **Tela cheia**: botão no canto inferior direito do mapa; Esc sai. O painel vira uma gaveta (Menu › Painel).
- **Satélite**: imagem Esri World Imagery, carregada ao vivo, zoom até o nível 19; de perto aparecem as chaves que não dividem trecho (quadradinho âmbar, com o código no zoom 17).
- **Croqui de limpeza de faixa** (Dados › Downloads › Faixa › "Croqui da faixa"): usa o trecho selecionado (ou vários, ou o alimentador inteiro) e abre uma janela já preenchida com alimentador, extensão, município, chave inicial e final em UTM e figura de satélite. Você completa tipo (Convencional/Expedita), OS, obra e deslocamento e baixa o Excel no modelo da Energisa.
- **KMZ** (Dados › Downloads › Rede › "KMZ (Google Earth)"): os trechos para o Google Earth, uma pasta por trecho, com início e fim no balão. Também há Excel das OS de faixa, inspeções, Insp→manut e Manutenção.

**Print 12** · `12-tela-cheia-d.jpg` / `12-tela-cheia-m.jpg` (tela cheia, satélite no zoom 17)
**Print 14** · `14-croqui-d.jpg` / `14-croqui-m.jpg` (janela do croqui, T2-A)
**Print 13** · `13-downloads-d.jpg` / `13-downloads-m.jpg` (Downloads: Excel por camada e KMZ)

---

Observações para quem apresenta
- A página ao vivo carrega o satélite da Esri; sem internet o mapa mostra os trechos sem a imagem.
- Nos prints 02 a 07, 11 e 15 a camada Faixa foi desligada (preferência guardada no navegador) para as cores T1/T2/T3 aparecerem sem a Faixa por cima.
- Os dados do LD02010004 aparecem só no print 09 (para mostrar OS pendentes).
