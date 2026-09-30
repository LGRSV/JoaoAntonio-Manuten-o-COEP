# Alimentador em zonas, ramais e blocos

Organiza a rede de média tensão de um alimentador para localizar defeito e planejar manutenção:

**Alimentador › Zona (T1, T2, T3…) › Tronco ou Ramal › Bloco (ativo de referência) › Vão entre postes**

Hoje roda com um **circuito de exemplo** (não é rede real). O leitor do export real do AL01048007
(`Vaos_e_condutores.kmz`, `Apoios_e_pontos.kmz`, `Equipamentos.kmz`) será escrito quando esses arquivos chegarem.

## Regras

| Item | Regra |
|---|---|
| Zona | T1 do DJ ao 1º religador (79). Cada 79 no caminho soma uma zona, inclusive 79 dentro de ramal. Depois de uma chave fusível (03) é no mínimo T3; se já era T3 ou mais, soma uma. |
| Tronco | Caminho DJ → 1º 79 → 2º 79; termina no 2º 79. Nunca tem T3. |
| Ramal | Todo o resto. Leva o nome do poste onde sai do tronco. Depois do 2º 79: "Ramal após <2º 79>". |
| Ativo de referência | Último DJ, 79 ou 03 antes do vão. Engloba o vão e tudo o que vem depois. |
| Bloco | Vãos com o mesmo ativo de referência e o mesmo ramal. Chaves 88 não dividem bloco; aparecem listadas. |

Pontos ainda a confirmar (o código segue o exemplo aprovado até agora e avisa quando acontecem):

- Zonas depois do T3 (03 depois do 2º 79 vira T4; cada novo 79/03 soma mais uma).
- Mais de um candidato a 2º religador: fica o que tem mais rede depois dele.
- Alimentador sem 2º religador: o tronco segue o lado com mais rede T1/T2 e para antes de um 03.

## Como rodar

```bash
pip install -r alimentador/requirements.txt
python -m alimentador.exemplo      # gera alimentador/saida/
python -m alimentador.testes       # 5 testes das regras e das saídas
```

## Saídas (`alimentador/saida/`)

| Arquivo | O que é |
|---|---|
| `mapa-blocos.html` | Mapa sobre imagem de satélite com 5 visualizações: zonas, tronco e ramais, blocos, o que cada ativo engloba, localizar um vão. Baixe e abra no navegador com internet. |
| `*.kmz` | Para o Google Earth. Pastas Tronco › Bloco e Ramais › Ramal › Bloco; cada vão com zona, bloco, ativo de referência e ativos posteriores no balão. |
| `*.xlsx` | Abas: Árvore de blocos, Consulta (digite um poste), Blocos (ativos um por coluna e concatenados), Por bloco (vãos agrupados, botão +), Trechos (um vão por linha), Ativos. As fórmulas recalculam ao abrir. |

## Arquivos

- `regras.py`: aplica as regras sobre qualquer rede em árvore (nós com tipo DJ/79/03/88/P e vãos pai→filho).
- `exemplo.py`: monta o circuito de exemplo e gera as saídas.
- `exporta.py`: KMZ, Excel e mapa HTML.
- `mapa_modelo.html`: modelo do mapa (Leaflet + imagem Esri World Imagery, carregados ao vivo).
- `testes.py`: testes.
