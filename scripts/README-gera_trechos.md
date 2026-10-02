# Trechos por município (`scripts/gera_trechos.py`)

Gera o site **Município → Alimentador → Trecho** a partir dos KMLs do Daimon, com as regras da skill
`trechos-alimentador` (código em `alimentador/`: `daimon.py`, `regras.py`, `trechos.py`, `critica.py`). Nada é
publicado: o script só grava na pasta `--saida`. Publicar é copiar essa pasta para o `gh-pages` e fazer push, depois
de conferir o relatório.

## Entradas

| Entrada | De onde | Para quê |
|---|---|---|
| `--kml <pasta>` | KMLs do Daimon (`SE-XXXX_Circ-<alimentador>.kml`), uma pasta por SE no Drive; busca nas subpastas | Rede com chaves (DJ, 79, 03/33/02…) e vãos: **única fonte com as chaves**. Os `cabos/` do vera-vegetacao só têm `t1`/`t2` sem chaves nem T3 |
| `--vegetacao <clone>` | `LGRSV/vera-vegetacao` | `dados/indice.json` (polo, SE) e `dados/<POLO>/<AL>.json` (número dos postes) |
| `--critica 'Critica-*.txt'` | zip da Crítica | NAE por trecho e mês (opcional). Por padrão só causa **Meio Ambiente** + subcausa **Árvore** (pequeno/médio ou grande porte) ou **Eucalipto**, na rede/faixa; `--nae todas` para todas |
| `--malha <geojson>` | opcional | Sem ela, baixa a malha municipal do TO da API do IBGE (qualidade máxima) para `--cache` na 1ª vez |

## Comandos

```bash
# tudo o que estiver na pasta de KMLs
python scripts/gera_trechos.py --kml ~/Drive/Daimon --vegetacao ../vera-vegetacao --critica 'crit/Critica-*.txt' \
    --saida site --todos
# só um município (alimentadores com poste dentro dele, pela malha) ou só alguns alimentadores
python scripts/gera_trechos.py ... --municipio "Araguaína"
python scripts/gera_trechos.py ... --alimentador AL04010004 --alimentador AL02040004
# sem reprocessar
python scripts/gera_trechos.py --saida site --validar        # JSON, validação de cada alimentador e links
python scripts/gera_trechos.py --saida site --so-interface   # refaz páginas, índice, manifesto e relatório
python scripts/gera_trechos.py --saida site --comparar ../vera-vegeta-o-back   # contra as páginas publicadas
```

`--data AAAA-MM-DD` fixa a data de referência mostrada na página (padrão: data do arquivo KML). Mesmas entradas,
mesma saída (o teste `python scripts/teste_gera_trechos.py` confere).

## Saída

```
index.html                         municípios (busca)
municipios/<slug>/index.html       alimentadores com rede no município (≥ 100 m)
alimentadores/<AL>/index.html      mapa e trechos (página leve)
alimentadores/<AL>/dados.js        dados do mapa ([lat, lon], formato do mapa da skill)
alimentadores/<AL>/<AL>-trechos.kmz
dados/alimentadores/<AL>.json      fonte canônica do alimentador inteiro ([lon, lat]): trechos, vãos, chaves,
                                   municípios, NAE, avisos e validação. O recorte por município é só um filtro na
                                   página; o arquivo canônico nunca é recortado.
manifesto.json                     município ↔ polo, SE e alimentadores
relatorio.md / relatorio.html      por município e alimentador, totais e não processados
assets/                            Leaflet 1.9.4, CSS e JS compartilhados (o JS do mapa sai do modelo da skill)
```

## Regras usadas

- **Trechos:** as da skill, sem mudança (T1, T2, T2-A…, T3-A…, sem T4; seccionamento; fim pela linha principal).
  Ordem e letras pela topologia a partir do DJ, nunca pela ordem do arquivo.
- **Município:** cada vão é amostrado a cada 20 m (meio de cada pedaço) contra a malha; o vão na divisa é dividido
  pela proporção das amostras e listado em `limitrofes`. O alimentador aparece no município com ≥ 100 m.
- **Conexões:** nenhuma ligação virtual é criada. Pontos sem ligação com o DJ (depois de abrir as chaves NA) ficam
  fora e aparecem nos avisos; `continuidades_estimadas` fica vazio.
- **NAE:** cada ocorrência leva a regra usada (`abrangência DJ`, `abrangência SE`, `chave de início do trecho`,
  `vão mais próximo do ativo` com a distância em m, `ativo fora do KML`).
- **Validação:** falha crítica (sem DJ, nome repetido, vão sem trecho, soma ≠ total, coordenada fora do TO ou fora
  da ordem [lon, lat], mais da metade fora da malha) tira o alimentador das páginas e vai para "Não processados".
  Avisos (pontos soltos, chave sem vão, vão duplicado, sem postes, vãos na divisa, trechos a revisar) aparecem na
  página e no relatório.

Abrir as páginas localmente: `python -m http.server -d site` e `http://localhost:8000`.
