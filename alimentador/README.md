# Alimentador em zonas, ramais e blocos

Organiza a rede de média tensão de um alimentador para localizar defeito e planejar manutenção:

**Alimentador › Zona (T1, T2, T3…) › Tronco ou Ramal › Bloco (ativo de referência) › Vão entre postes**

Lê o export do Daimon (`SE-XXXX_Circ-ALxxxxxxxxx.kml`, pastas `Chave` e `Trecho`) e gera KMZ, Excel e mapa.
Também tem um circuito de exemplo (não é rede real) para mostrar as regras.

## Regras

| Item | Regra |
|---|---|
| Zona | T1 do DJ ao 1º religador (79). Depois de qualquer 79 é T2, inclusive 79 dentro de ramal ou depois do 2º 79: religador nunca cria T3. Depois de uma chave fusível (03, 33 ou 02) é T3; fusível depois de fusível continua T3 (não existe T4). |
| Seccionamento | Chave 03/33/02 que tem religador depois dela não é tratada como fusível: não muda a zona e aparece na lista de chaves do bloco (tipo `SEC`). Sai um aviso com a lista. |
| Tronco | Caminho DJ → 1º 79 → 2º 79 e, depois do 2º 79, até os próximos ativos (79 ou fusível): o trecho entre dois ativos do tronco ainda é tronco. Pontas sem equipamento são ramal. Nunca tem T3. |
| Ramal | Todo o resto. Nome: "Ramal após <ativo>" quando sai de um ativo; senão o poste de onde sai do tronco; se esse ponto não tem poste cadastrado, "Ramal do <primeiro ativo>". |
| Ativo de referência | Último DJ, 79 ou fusível antes do vão. Engloba o vão e tudo o que vem depois. |
| Bloco | Vãos com o mesmo ativo de referência e o mesmo ramal. Chaves 88 e outras não dividem bloco; aparecem listadas. |

Leitura do Daimon (`daimon.py`): raiz na ponta do suporte do DJ que encosta na rede; caminho por Dijkstra com peso 10000
nos suportes de 02/68/90/31; chaves com estilo `ChaveNA` saem da rede (abertas); 90/31/68 viram passagem.
Postes (opcional, lista `{id, lat, lon}`) dão nome aos nós até 6 m; nó sem poste vira `N<número>`.

Pontos ainda a confirmar (o código avisa quando acontecem):

- Chave 03 com religador depois = seccionamento.
- Chave 02 conta como fusível.
- Alimentador sem 2º religador: o tronco segue o lado com mais rede T1/T2 e para antes de um fusível.
- Mais de um candidato a 2º religador: fica o que tem mais rede depois dele.

## Como rodar

```bash
pip install -r alimentador/requirements.txt
python -m alimentador.exemplo      # gera alimentador/saida/ com o circuito de exemplo
python -m alimentador.testes       # 7 testes das regras, do leitor do Daimon e das saídas
```

Alimentador real:

```python
import json
from alimentador import daimon
postes = json.load(open('AL01010004.json'))          # opcional
daimon.gerar('alimentador/entrada/SE-2AR0_Circ-AL01010004.kml', 'alimentador/saida/AL01010004', postes)
```

`alimentador/entrada/` fica fora do git (dados da rede).

## Saídas (`alimentador/saida/`)

| Pasta | Conteúdo |
|---|---|
| `AL04010004/` | Alimentador real de exemplo: 3 religadores em série (DJ → RL1 → RL2 → RL3), 14,9 km, 97 blocos. |
| `AL01010004/`, `AL01048007/` | Alimentadores reais (export Daimon). |
| raiz | Circuito de exemplo. |

| Arquivo | O que é |
|---|---|
| `*-trechos.kmz` | Os mesmos trechos para o **Google Earth** (satélite) ou para importar no **Google My Maps**: uma pasta por trecho (T1, T2, T2-A…, T3-A…), início e fim no balão, DJ/religadores com código. |
| `mapa-trechos.html` | Mapa simplificado (uma visão): trechos T1, T2, T2-A…, T3-A… com ativo de início e fim (`trechos.py`). Protótipo em validação. |
| `mapa-blocos.html` | Mapa sobre imagem de satélite com 5 visualizações: zonas, tronco e ramais, blocos, o que cada ativo engloba, localizar um vão. Baixe e abra no navegador com internet. |
| `*.kmz` | Para o Google Earth. Pastas Tronco › Bloco e Ramais › Ramal › Bloco; cada vão com zona, bloco, ativo de referência e ativos posteriores no balão. |
| `*.xlsx` | Abas: Árvore de blocos, Consulta (digite um poste), Blocos (ativos um por coluna e concatenados), Por bloco (vãos agrupados, botão +), Trechos (um vão por linha, com o nome do trecho no Daimon), Ativos. As fórmulas recalculam ao abrir. |

## Arquivos

- `regras.py`: aplica as regras sobre qualquer rede em árvore (nós com tipo DJ/79/03/33/02/88/P e vãos pai→filho).
- `daimon.py`: lê o KML do Daimon e chama as regras e as saídas.
- `exemplo.py`: monta o circuito de exemplo e gera as saídas.
- `exporta.py`: KMZ, Excel e mapa HTML.
- `trechos.py`: trechos nomeados pelos ativos (T1, T2, T2-A…, T3-A… em ordem a partir do DJ) o mapa `mapa-trechos.html` (modelo `mapa_trechos.html`) e o `*-trechos.kmz`.
- `mapa_modelo.html`: modelo do mapa (Leaflet + imagem Esri World Imagery, carregados ao vivo).
- `testes.py`: testes.
