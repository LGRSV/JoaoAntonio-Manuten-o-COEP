# Regras dos trechos: algoritmo, casos especiais e histórico das decisões

Código: `alimentador/regras.py` (zonas, tronco, blocos), `alimentador/trechos.py` (trechos, início e fim),
`alimentador/critica.py` (NAE).

## 1. Zonas (regras.analisar)

- T1 do DJ até o 1º religador (79).
- Depois de qualquer religador é T2, inclusive religador dentro de ramal ou depois do 2º religador:
  "não existe T3 com RL".
- Depois de fusível (03, 33, 02) é T3. Fusível depois de fusível continua T3: **não existe T4** (decisão do
  usuário; antes somava uma zona por fusível).
- **Seccionamento:** fusível que tem religador depois dele não conta como fusível (não muda a zona). Exemplo
  real: chave 0349277004 entre os dois religadores do AL01010004.
- **Fusível no tronco (FTR):** fusível na linha principal do tronco não abre T3 nem muda a zona. Linha principal:
  caminho do DJ até o 2º religador e, dali (ou do DJ, sem 2º religador), sempre o filho que ainda tem religador
  depois e, entre esses, o de mais rede, até o fim. Exemplo real: AL01086016, 3300018016 logo depois do religador.

## 2. Tronco

DJ → 1º religador → 2º religador e, depois do 2º, até os próximos ativos (o trecho entre dois ativos do tronco
ainda é tronco). Nunca tem T3.

- **Sem 2º religador:** o tronco é a linha principal inteira, até o fim, passando pelos fusíveis do tronco (gera
  aviso). Antes parava no 1º fusível; o usuário corrigiu ao ver o AL01086016.
- **Mais de um candidato a 2º religador** (religadores em paralelo logo depois do 1º): fica o que tem mais rede
  depois dele (gera aviso). Ex.: LD02110005, 7932028020 escolhido; 7936769005 virou T2-A.

## 3. Trechos (trechos.segmentar)

Percorre a rede do DJ para as pontas; cada vão herda o trecho do vão anterior, menos quando sai de:

| Nó de onde o vão sai | Trecho do vão |
|---|---|
| DJ | T1 |
| Religador por onde o tronco sai do T1 | T2 |
| Qualquer outro religador | novo T2 com letra |
| Fusível (03/33/02, não seccionamento) | novo T3 com letra |
| Poste, 88, 80, 90, 31, 68, seccionamento | continua o trecho de onde veio |

Letras: na ordem da distância do ativo de início até o DJ, `A…Z, AA, AB…` (uma sequência para T2 e outra para T3).

**Fim do trecho:**
1. Religador onde começa outro T2, quando esse religador está no tronco (T1 → T2, T2 → T2-A…) ou dentro de um
   T2 com letra. Religador fora do tronco que sai do T1/T2 é **derivação**, não fim.
2. Senão, segue a linha principal (sempre o ramo que chega mais longe do DJ) até a 1ª chave onde começa outro
   trecho → essa chave.
3. Sem chave nesse caminho → "fim de linha · poste X".

Cada trecho guarda: início (ativo, tipo, poste), religadores por onde passa, fim, extensão, vãos, de onde vem,
derivações (trechos que saem dele) e se é tronco.

## 4. NAE por trecho (critica.por_trecho)

- **DJ** (`ABRANGÊNCIA = DJ`): T1.
- **Subestação** (`ABRANGÊNCIA = SE`): fora dos trechos, "na subestação" (pendente: o usuário pode querer no T1).
- **Religador ou fusível que abre um trecho:** esse trecho.
- **Trafo ou outro ativo com ponto no KML:** trecho do vão mais próximo. Individual (um consumidor) cai pelo trafo.
- **Ativo fora do cadastro atual:** fora dos trechos, com "hoje no <alimentador>" se achado em `--outros`.
- Coletiva = `TIPO_INTER_KTI = COLETIVO`; individual = `INDIVIDUAL`. Programada = causa "DISTRIBUICAO
  PROGRAMADA" ou "PROGRAMADAS" (não "NAO-PROGRAMADAS"). Consumidores e CHI somados entre os passos (passo repetido
  entre arquivos conta uma vez); duração = maior passo.

## 5. Exemplos de referência

**AL04010004** (SE-2AR0, Araguaína, 14,9 km, 3 religadores em série):

| Trecho | Início | Fim | km |
|---|---|---|---|
| T1 | DJ AL04010004 | 7903565004 | 4,73 |
| T2 | 7903565004 | 7935867004 | 2,20 |
| T2-A | 7935867004 | 7902218004 | 2,68 |
| T2-B | 7902218004 | poste 555904 (fim de linha) | 1,74 |
| T3-P | 0300588004 | 0300591004 | 0,25 |
| T3-T | 0300591004 (fusível dentro do T3-P) | poste N257 | 0,88 |

NAE jan/2026: T1 = 2 (DJ 224R004: 11/01 objeto estranho na rede; 13/01 isolador de suspensão) — o usuário
conferiu esse número. Total: 5 coletivas e 16 individuais; 7 ficaram fora dos trechos porque essa parte da rede
passou para o AL02040004 em abril.

**SE-2ARS (Arraias II):** LD01110005 (478 km, 1 religador, 221 trechos) e LD02110005 (1.510 km, 10 religadores,
1.058 trechos; T2 → T2-I; 4 seccionamentos: 3327852005, 0327854005, 0320001051, 3320045051).

## 6. Histórico das decisões (frases do usuário)

- "Na verdade só existe T1 e T2: DJ a 1º RL é T1, do RL até o segundo é T2, depois complica."
- "Saindo do 79 seria um T2 Ramal; não existe T3 com RL."
- "Esse T continua fazendo parte do tronco pois tem um ativo anterior a ele."
- "Chama T2 sem ser ramal de T2; quando for ramalizando T2-A, T2-B; quero o ativo início e fim de cada um."
- Tamanho mínimo para ganhar letra: "não tem; tem que seguir a lógica dos números dos ativos" → letra só em ativo.
- "T1 geralmente é tronco, só se tiver bifurcado (casos raros)."
- T3: "Vira T3-AA" → sequência única A…Z, AA…; "T4 não era pra ter, só T3".
- "T1 – DJ até o RL; T2 – RL até a chave ou RL até RL; do T2 pra frente, chave até chave."
- Ao ver o mapa: "aqui seria um T2-A e o outro azul clarinho o T2-B" → cada religador abre um T2.
- "Tá perfeito essa lógica."
- AL01086016: "quando a gente tiver uma chave fusível no contexto dessa aqui que tem a nomenclatura de tronco,
  consideramos como T2 tronco ainda" → escolhido "fusível no caminho do tronco" (não toda 33, não só a 1ª).

Pendentes: chave 02 conta como fusível? Ocorrência na subestação entra no T1? Tronco no alimentador sem 2º
religador e escolha entre religadores em paralelo (a regra decide sozinha e avisa).
