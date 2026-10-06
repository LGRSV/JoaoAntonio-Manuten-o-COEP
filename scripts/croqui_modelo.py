"""Modelo do croqui de limpeza de faixa para o site: xlsx da Energisa → alimentador/site/croqui-modelo.js.

python scripts/croqui_modelo.py <CROQUI_*.xlsx> [saida.js]

O navegador (alimentador/site/croqui.js) preenche o modelo com os dados do trecho e baixa o Excel. Aqui o modelo é
guardado peça por peça (XML como texto, imagens em base64), sem os dados do croqui de exemplo: as duas figuras do
trecho viram um PNG em branco (o site desenha as do trecho escolhido), o autor some das propriedades e a lixeira
interna do arquivo ([trash]) sai.
"""
import base64
import json
import re
import sys
import zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PNG_VAZIO = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC')
FIGURAS = ('xl/media/image1.png', 'xl/media/image4.png')    # figura do satélite e a do GIS (ver drawing1.xml)


def converte(xlsx, saida):
    partes = []
    with zipfile.ZipFile(xlsx) as z:
        nomes = z.namelist()
        assert 'xl/worksheets/sheet1.xml' in nomes and 'xl/drawings/drawing1.xml' in nomes, 'não parece o modelo do croqui'
        for n in nomes:
            if n.startswith('[trash]'):
                continue
            dado = z.read(n)
            if n in FIGURAS:
                dado = PNG_VAZIO
            if n == 'docProps/core.xml':
                dado = re.sub(rb'<(dc:creator|cp:lastModifiedBy)>[^<]*</', rb'<\1></', dado)
            if n.endswith(('.xml', '.rels')):
                partes.append([n, 't', dado.decode('utf-8')])
            else:
                partes.append([n, 'b', base64.b64encode(dado).decode('ascii')])
    sheet = next(p[2] for p in partes if p[0] == 'xl/worksheets/sheet1.xml')
    for ref in ('U3', 'U6', 'U9', 'U11', 'I42'):                # células que o site preenche
        assert f'<c r="{ref}"' in sheet, f'modelo sem a célula {ref}'
    Path(saida).write_text('// Modelo do croqui de limpeza de faixa (gerado por scripts/croqui_modelo.py; não editar à mão)\n'
                           'window.CROQUI_MODELO=' + json.dumps(dict(partes=partes), ensure_ascii=False) + ';\n',
                           encoding='utf-8')
    return len(partes), Path(saida).stat().st_size


if __name__ == '__main__':
    saida = sys.argv[2] if len(sys.argv) > 2 else RAIZ / 'alimentador' / 'site' / 'croqui-modelo.js'
    print(converte(sys.argv[1], saida))
