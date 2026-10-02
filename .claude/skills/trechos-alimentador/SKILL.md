---
name: trechos-alimentador
description: Divide alimentadores de média tensão da Energisa (export KML do Daimon) em trechos por ativo — T1 (DJ → 1º religador), T2 (religador → religador), T2-A, T2-B… (cada religador seguinte), T3-A, T3-B… (cada fusível, sem T4) — com a chave de início e fim de cada trecho, e calcula o NAE por trecho e mês a partir da base Crítica (Critica*.txt). Gera mapa com satélite, KMZ para Google Earth e páginas no site (GitHub Pages). Use sempre que o usuário falar de alimentador (códigos AL… ou LD…), subestação (SE-XXXX), KML do Daimon, T1/T2/T3, trechos, tronco, ramal, religador, fusível, chave de início/fim, NAE, Crítica, interrupções ou DEC/FEC por trecho, ou planejamento de poda/manutenção por trecho, mesmo que não peça "trechos" ou "skill" com essas palavras.
---

# Trechos de alimentador e NAE por trecho

Organiza a rede de um alimentador para localizar defeito e planejar poda e manutenção: cada trecho começa numa
chave (DJ, religador ou fusível) e termina na próxima. O usuário trabalha em português, quer respostas curtas e
só quer receber o que foi conferido. Fale sempre em português, inclusive nas mensagens de andamento.

## As regras (aprovadas pelo usuário)

| Trecho | Começa | Termina |
|---|---|---|
| **T1** | DJ | 1º religador (79) do tronco |
| **T2** | 1º religador | 2º religador (ou a chave onde a linha principal acaba) |
| **T2-A, T2-B…** | cada religador seguinte, no tronco ou fora dele, em ordem de distância do DJ | próximo religador, chave ou fim de linha |
| **T3-A, T3-B…** | cada fusível (03, 33, 02), inclusive fusível dentro de fusível — **não existe T4** — numa sequência só, pela distância do DJ (A…Z, AA, AB…) | próxima chave ou fim de linha |

- A letra só nasce em ativo: derivação em poste sem chave continua no trecho de onde saiu.
- Fusível com religador depois dele é **seccionamento**: não abre trecho e não muda a zona.
- Chaves 88 e outras (80, 90, 31, 68) não dividem trecho.
- Fim do trecho: o religador onde começa o T2 seguinte; senão, seguindo a linha principal (rumo ao ponto mais
  distante do DJ), a 1ª chave onde começa outro trecho; sem chave, o poste de fim de linha.

O detalhe do algoritmo, os casos especiais e o histórico de cada decisão estão em `references/regras.md`. Leia
antes de mudar qualquer regra ou quando o resultado parecer estranho. Para o usuário há um PDF com a mesma regra
(`alimentador/docs/referencia-trechos.pdf` no repositório; refazer com `python -m alimentador.referencia_pdf`).

## Fluxo

1. **Achar os KMLs.** No Google Drive há uma pasta por SE com `SE-XXXX.kml` (lista os circuitos; o nome da SE vem
   em `<description>`) e um `SE-XXXX_Circ-<alimentador>.kml` por alimentador. O nome popular da SE nem sempre bate
   com o código (Arraias I = SE-2ARR, Arraias II = SE-2ARS): confira a `<description>` ou o
   `dados/indice.json` do vera-vegetacao. Buscas e o limite de 10 MB do conector: `references/bases.md`.
2. **Postes** (opcional, dá o número real do poste): `LGRSV/vera-vegetacao`, `dados/<REGIÃO>/<alimentador>.json`.
3. **Crítica** (para o NAE): os `Critica*.txt` que o usuário envia (zip). Não ficam soltos no Drive.
4. **Rodar o comando** a partir de qualquer pasta, apontando o `PYTHONPATH` para o código (a raiz do repositório
   `LGRSV/smartled` ou a pasta `scripts/` desta skill). Passe sempre `--saida` (o padrão é relativo à pasta atual):

   ```bash
   PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=<smartled ou pasta da skill>/scripts \
   python3 -m alimentador.gerar_trechos <KMLs...> --saida <pasta> \
       --postes <vera-vegetacao>/dados --critica '<pasta>/Critica-*.txt' --mes 2026-01 \
       [--outros <KML de alimentador vizinho>] [--site <pasta do site> --se-nome SE-XXXX='Nome']
   ```

   `--mes AAAA-MM` imprime o NAE daquele mês por trecho (coletivas · individuais), além do total de cada mês.
   Só usa a biblioteca padrão do Python. Um alimentador de 1.500 km leva uns 4 minutos; rode em segundo plano.
   Se mudar o código no repositório, copie de novo para `scripts/alimentador/` (o teste `test_copia_da_skill`
   acusa a diferença).
5. **Conferir antes de entregar.** O comando imprime trechos, avisos e NAE por mês. Confira:
   - a soma dos trechos bate com a extensão total (o código garante; se falhar, é bug);
   - os avisos (sem 2º religador, religadores em paralelo, seccionamento) viram perguntas ao usuário;
   - abra o mapa num navegador se puder: sem erro de JavaScript, sem rolagem lateral em 390 px. Neste ambiente o
     Playwright está em `/opt/node22/lib/node_modules/playwright` (Chromium em `/opt/pw-browsers`). O
     `mapa-trechos.html` puxa o Leaflet do cdnjs e o Chromium daqui não passa pelo proxy: teste a página gerada com
     `--site` (Leaflet embutido) e responda às imagens do Esri (`arcgisonline`) com uma imagem qualquer via
     `page.route`.
6. **Publicar** quando o usuário quiser ver no celular: site no GitHub Pages (`references/publicar.md`). O site é
   público; confirme antes de publicar um alimentador novo.
7. **Responder** curto: tabela dos trechos principais (início → fim, km), NAE do mês pedido por trecho, o link do
   site (se publicou) ou o `mapa-trechos.html` e o KMZ enviados como arquivo, e os pontos que a regra decidiu
   sozinha (avisos do comando) como perguntas.

## O que já deu errado (e como evitar)

- **Crítica.** O mês é a competência (`DTA_CMPT_HDE`), não a abertura: o arquivo de janeiro traz passos de
  fevereiro, que voltam no arquivo de fevereiro só com os indicadores recalculados (contam uma vez). O mesmo passo
  pode vir em várias linhas, uma por localidade (somam-se). A ocorrência é `NUM_SEQ_OPER_INIC_HDE`. O DJ da
  Crítica tem outro código (ex.: `224R004`); vai para o T1 pela `ABRANGÊNCIA = DJ`. `ABRANGÊNCIA = SE` (defeito na
  subestação) fica fora dos trechos como "na subestação". O código já trata tudo isso; detalhes em
  `references/bases.md`.
- **A rede muda entre meses.** Ativo que aparece na Crítica e não está no KML atual pode ter ido para outro
  alimentador. Passe o KML do vizinho em `--outros` para a página dizer "hoje no <alimentador>".
- **NAE.** Aqui é o número de interrupções coletivas do trecho no mês (atuou DJ, religador, fusível ou trafo); foi
  assim que o usuário conferiu o T1 do AL04010004 (jan/2026 = 2). Individuais (um consumidor, no trecho do trafo)
  vão à parte; a página deixa escolher se conta. O número da UC nunca vai para a página nem para a resposta.
- **Satélite.** Páginas hospedadas no Claude não carregam imagem de outros sites; o usuário não quer mais esse
  caminho. Use o site no GitHub Pages ou o KMZ no Google Earth.
- **Pendente com o usuário:** se a chave **02** conta como fusível (no AL04010004 ela abre 35 dos 50 trechos T3,
  todos com menos de 50 m) e se a ocorrência "na subestação" (`ABRANGÊNCIA = SE`) deve entrar no T1.
