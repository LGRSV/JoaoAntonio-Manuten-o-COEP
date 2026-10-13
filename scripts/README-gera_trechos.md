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

## Crítica nova (todo mês)

Não precisa dos KMLs nem do acervo do GIS: o site já guarda tudo o que a associação usa (trechos com a chave de
início, vãos, chaves, chaves fora da topologia e `dados/trafos_gis.json`).

```bash
python scripts/atualiza_critica.py --site site --critica 'crit/Critica-CHEIO_09-2026.txt' --planilha NAE.xlsx
python scripts/atualiza_critica.py --site site --conferir     # refaz a associação das NAE do site e compara
```

- O mês do arquivo (`MM-AAAA` no nome) é trocado inteiro; os outros meses do site ficam. Arquivo reemitido de um mês
  já carregado troca só aquele mês. Passar todos os arquivos refaz tudo.
- Mesmas regras da geração completa (abrangência DJ, chave de início, vão mais próximo do ponto do ativo, trafo do GIS
  até 50 m, `hoje no X` nas duas pontas). Conferido contra a geração completa: as 5.748 NAE de jan–ago/2026 saem
  iguais (trecho, regra, motivo, NAE de outro alimentador, rankings e polos); só a distância pode variar 0,1 m
  (coordenada da chave guardada arredondada).
- Ativo que não está em nenhum cadastro (chave nova, código digitado errado) fica `fora do cadastro atual`. Rede ou
  GIS novos: rodar a geração completa (`gera_trechos.py`) e `ativos_gis.py` antes.

## Inspeção visual (base de inspeção)

```bash
python scripts/inspecao.py "BASE INSPEÇÃO.xlsx" site     # grava alimentadores/<AL>/inspecao.js
python scripts/gera_trechos.py --saida site --so-interface
```

- Só OS **EXECUTADA** (aba `Dados`). A inspeção cobre a rede do `ELEMENTO` subindo até a `ABRANGENCIA` (conferido na
  base de 13/10/2026: a ABRANGÊNCIA está sempre a montante do ELEMENTO). Data: `FIM_EXEC` (ou `INICIO_EXEC` se o fim
  vier mais de 60 dias depois).
- Os dois ativos no mapa do alimentador: o caminho entre eles. Só um: só o ponto dele. Nenhum: sem posição (fica na
  lista). Os `90…` (bloco de chave faca) não têm ponto no cadastro do site.
- Na página: card **Inspeção** no mapa, ao lado do **Faixa** (ligar um desliga o outro), anos e inspeções no painel e
  as inspeções de cada trecho no detalhe dele.

## Publicar no `/teste/` do gh-pages

Depois de copiar o site para `teste/` do `vera-vegeta-o-back`, rodar na raiz do gh-pages, antes do commit:

```bash
python3 teste/ferramentas/nae_rede.py teste
```

Grava `nae_rede` em `assets/ranking-nae.js` e `assets/ranking-polos-dados.js`: o NAE/100 km usa a NAE no
alimentador onde o ativo está hoje no GIS (a coluna NAE segue a Crítica). Toda geração (`--so-interface`,
`atualiza_critica.py`, `refaz_trechos.py`) reescreve esses dois arquivos sem o campo; sem rodar a ferramenta o
NAE/100 km volta a dividir a NAE da Crítica pela rede do GIS. Ela usa o `teste-acervo/` ao lado de `teste/`, para
na hora se a NAE por polo não bater com os `dados.js` e rodar de novo dá o mesmo resultado.

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
                                   'chaves_sem_topologia': pontos do KML que a topologia não usa (tipo de chave não
                                   reconhecido, sem suporte), com o trecho do vão mais próximo (Crítica nova sem KML)
dados/ativos/<fatia>.json          código de chave, transformador ou número de poste → alimentador e trecho (busca "Em que trecho
                                   está o ativo?" da página inicial; 256 pedaços, a página baixa só o do código)
dados/trafos_gis.json              transformadores do acervo do GIS → [lon, lat, alimentador do GIS] (scripts/ativos_gis.py)
manifesto.json                     município ↔ polo, SE e alimentadores
polos/index.html                   ranking dos alimentadores de cada polo DCMD (assets/ranking-polos-dados.js)
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
- **Transformadores** (`scripts/ativos_gis.py <pasta do site> <pasta com os Transformadores.kmz do acervo GIS>`): a
  conversão do GIS não traz transformador, então NAE de trafo ficava `ativo fora do KML`. O script lê a camada
  Transformadores do próprio GIS (um `Transformadores.kmz` por alimentador no acervo), põe cada trafo no vão mais
  próximo da rede do site (até 50 m) e dá trecho às NAE dele (`vão mais próximo do ativo (GIS)`), no JSON canônico
  e no `dados.js`. A rede do site não muda; o total de NAE do alimentador também não (só o trecho). Trafo que o GIS
  põe em outro alimentador e longe desta rede fica `hoje no X`. Rodar `--so-interface` e a planilha depois.
- **Validação:** falha crítica (sem DJ, nome repetido, vão sem trecho, soma ≠ total, coordenada fora do TO ou fora
  da ordem [lon, lat], mais da metade fora da malha) tira o alimentador das páginas e vai para "Não processados".
  Avisos (pontos soltos, chave sem vão, vão duplicado, sem postes, vãos na divisa, trechos a revisar) aparecem na
  página e no relatório.

- **Polos:** `alimentador/site/polos.json` (município → polo DCMD e regional) sai da planilha de cidades por polo com
  `python scripts/polos_municipios.py Cidades_por_Polo_e_Regional_DCMD_MAIUSCULAS_SEM_ACENTO.xlsx`. No ranking, o
  alimentador entra em cada polo onde tem rede: km e NAE do trecho contam no polo do município onde o trecho tem mais
  rede; NAE sem trecho conta no polo onde o alimentador tem mais rede.
- **Limpeza de faixa** (`scripts/limpeza_faixa.py`): OS executada só conta se for das equipes ETO-RD dos 8 polos
  (prefixo do número da OS); pendentes aparecem de qualquer equipe. `--so-equipes <pasta do site>` aplica a regra
  nos `limpeza.js` já gerados. Rodar `--so-interface` depois, para o ranking pegar a limpeza.

Abrir as páginas localmente: `python -m http.server -d site` e `http://localhost:8000`.
