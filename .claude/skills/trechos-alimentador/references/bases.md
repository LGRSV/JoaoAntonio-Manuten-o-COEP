# Bases de dados: onde estão e o que quebra

## KML do Daimon (rede MT)

- **Onde:** Google Drive do usuário, uma pasta por SE (ex.: "SE ARRAIAS II"), com `SE-XXXX.kml` e
  `SE-XXXX_Circ-<alimentador>.kml`. Alimentadores `AL…` (urbanos/rurais) e `LD…` (linhas de distribuição).
- **Busca no Drive:** `title contains '_Circ-AL'` funciona; pedaço de número (`'110005'`) não acha nada. Para
  achar a SE: `fullText contains 'ARRAIAS II'` ou o nome da pasta. Liste a pasta com `parentId = '<id>'`.
- **Download:** o conector do Drive baixa até **10 MB** por arquivo e devolve JSON com `content` em base64
  (salvo num arquivo de resultado quando é grande): decodifique com Python. Zips grandes (Energisa.zip, 304 MB)
  não dá para abrir; peça ao usuário o arquivo solto.
- **Estrutura usada:** pastas `Chave` (pontos; nome de 10 dígitos, prefixo = tipo) e `Trecho` (LineString de 2
  pontos). Cada chave tem um trecho "Suporte Chave <nome>" em série com ela. O DJ é `DJ_<alimentador>_FICT`.
  Estilo com `ChaveNA` = chave aberta (sai da rede). Pastas `ET_<trafo>` trazem a BT; o ponto do trafo é um
  Placemark com o código.
- **Prefixos:** 79 religador · 03, 33, 02 fusível · 88 só listada · 80 faca · 90, 31, 68 passagem.
- **Leitura** (`daimon.ler_circuito`): nós = coordenadas arredondadas a 6 casas; raiz na ponta do suporte do DJ que
  encosta na rede; caminho por Dijkstra com peso 10.000 nos suportes de 02/68/90/31; poste a até 6 m dá nome ao nó.

## Postes

`LGRSV/vera-vegetacao`, `dados/<REGIÃO>/<alimentador>.json` (lista `{id, lat, lon}`). `dados/indice.json` traz
`se`, `se_code` e município de cada alimentador — bom para descobrir a SE pelo nome popular.

## Crítica (interrupções)

- **Onde:** o usuário envia o zip (`Critica-CHEIO_01-2026.txt` … `_06-2026.txt`). Não está solto no Drive.
- **Formato:** separador `;`, latin-1, **sem tratamento de aspas** (`csv.QUOTE_NONE`), `csv.field_size_limit(10**7)`,
  64 colunas. Mapeie **pelo nome** do cabeçalho: o arquivo de 12/2025 tem 65 colunas em outra ordem.
- **Colunas usadas:** `DTA_CMPT_HDE` (competência), `TIPO_INTER_KTI` (COLETIVO/INDIVIDUAL), `ABRANGÊNCIA`
  (DJ, RL, CH FUS, TR, UC), `COD_ELE_PROBLEMA`, `COD_ELE_INTERROMPIDO`, `NUM_SEQ_OPER_INIC_HDE` (ocorrência),
  `DTA_ABERT`, `QTD_CONS_INTER_FAT`, `DURACAO` (min), `DES_CAUSA_INTER_CAU`, `DES_SUB_CAUSA_INTER_SCR`,
  `QTD_IFEC_ALIM`/`QTD_IDEC_ALIM` (contribuição ao FEC/DEC do alimentador), `COD_ALIMENTADOR`, `OBSERVACAO`.
- **Armadilhas:**
  - O arquivo de um mês traz linhas de competência do mês seguinte (jan trouxe 956 de fevereiro).
  - Há linhas idênticas repetidas entre arquivos (7 no 1º semestre de 2026).
  - Uma ocorrência tem vários passos (linhas); some consumidores e CHI entre eles.
  - `DTA_INIC_ELE`/`DTA_FIM_ELE` vêm vazias em algumas extrações: use `DTA_ABERT`/`DTA_FECH`.
  - O DJ tem código próprio (ex.: `224R004`) e o mesmo desarme pode aparecer em dois alimentadores (consumidores
    transferidos). A `OBSERVACAO` costuma explicar ("Desarme dj 224r…").
  - `COD_ELE_PROBLEMA` de individual é o número da UC: não publique.
  - Prefixo de trafo 53 × 57 às vezes vem trocado ("CODIGO INVALIDO" na OBSERVACAO).
