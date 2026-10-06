"""Modelo do croqui de limpeza de faixa para o site: xlsx da Energisa → alimentador/site/croqui-modelo.js.

python scripts/croqui_modelo.py <CROQUI_*.xlsx> [saida.js]

O navegador (alimentador/site/croqui.js) preenche o modelo com os dados do trecho e baixa o Excel. Aqui o modelo é
guardado peça por peça (XML como texto, imagens em base64), sem nada do croqui de exemplo: as duas figuras do trecho
viram um PNG em branco (o site desenha as do trecho escolhido); as células de dados (OS, chaves, coordenadas,
alimentador, obra, faixa, deslocamento) e a célula solta E14 ficam vazias; os textos do exemplo saem da lista de
textos; o município da descrição vira MUNICIPIO; somem o caminho da pasta de quem salvou, o autor, o último editor,
a data de impressão e a lixeira interna ([trash]).
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
VAZIAS = ('U2', 'U3', 'U4', 'U5', 'U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'E14')   # dados do exemplo


def limpa_planilha(sheet, sst):
    """Esvazia as células de dados (mantém o estilo) e tira os textos do exemplo da lista de textos."""
    textos = re.findall(r'<si>.*?</si>', sst, re.S)
    for ref in VAZIAS:
        m = re.search(rf'<c r="{ref}"([^>]*?)(?:/>|>(.*?)</c>)', sheet, re.S)
        assert m, f'modelo sem a célula {ref}'
        est = (re.search(r'\ss="\d+"', m.group(1)) or [''])[0]
        if 't="s"' in m.group(1):                               # texto da lista: some de lá também
            i = int(re.search(r'<v>(\d+)</v>', m.group(2)).group(1))
            textos[i] = '<si><t></t></si>'
        sheet = sheet.replace(m.group(0), f'<c r="{ref}"{est}/>')
    sheet = re.sub(r'(trecho localizado em )[^"&]*?( conforme)', r'\1MUNICIPIO\2', sheet)
    for ref in ('Y2', 'Y3', 'L41', 'I42'):                     # resultado guardado das fórmulas de texto (o site refaz)
        sheet = re.sub(rf'(<c r="{ref}"[^>]*>(?:(?!</c>).)*?</f>)<v>.*?</v>', r'\1<v></v>', sheet, flags=re.S)
    ini = sst.index('<si>')
    return sheet, sst[:ini] + ''.join(textos) + sst[sst.rindex('</si>') + 5:]


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
                dado = re.sub(rb'<cp:lastPrinted>[^<]*</cp:lastPrinted>', b'', dado)
                criado = re.search(rb'<dcterms:created[^>]*>([^<]*)<', dado).group(1)
                dado = re.sub(rb'(<dcterms:modified[^>]*>)[^<]*<', rb'\g<1>' + criado + b'<', dado)
            if n == 'xl/drawings/drawing1.xml':                # etiquetas ligadas a Y2/Y3: só o título (o site preenche)
                for lig, tit in ((rb'\$Y\$2', b'ATIVO INICIAL:'), (rb'\$Y\$3', b'ATIVO FINAL:')):
                    dado = re.sub(rb'(<xdr:sp [^>]*textlink="' + lig + rb'"(?:(?!</xdr:sp>).)*?<a:t>).*?(</a:t>)',
                                  rb'\g<1>' + tit + rb'\2', dado, flags=re.S)
            if n == 'xl/workbook.xml':                          # caminho da pasta de quem salvou o exemplo
                dado = re.sub(rb'<mc:AlternateContent[^>]*><mc:Choice Requires="x15"><x15ac:absPath[^>]*/></mc:Choice></mc:AlternateContent>', b'', dado)
            if n.endswith(('.xml', '.rels')):
                partes.append([n, 't', dado.decode('utf-8')])
            else:
                partes.append([n, 'b', base64.b64encode(dado).decode('ascii')])
    i_sh = next(i for i, p in enumerate(partes) if p[0] == 'xl/worksheets/sheet1.xml')
    i_ss = next(i for i, p in enumerate(partes) if p[0] == 'xl/sharedStrings.xml')
    partes[i_sh][2], partes[i_ss][2] = limpa_planilha(partes[i_sh][2], partes[i_ss][2])
    sheet = partes[i_sh][2]
    assert 'absPath' not in next(p[2] for p in partes if p[0] == 'xl/workbook.xml')
    assert 'localizado em MUNICIPIO conforme' in sheet
    for ref in ('U3', 'U6', 'U9', 'U11', 'I42'):                # células que o site preenche
        assert f'<c r="{ref}"' in sheet, f'modelo sem a célula {ref}'
    Path(saida).write_text('// Modelo do croqui de limpeza de faixa (gerado por scripts/croqui_modelo.py; não editar à mão)\n'
                           'window.CROQUI_MODELO=' + json.dumps(dict(partes=partes), ensure_ascii=False) + ';\n',
                           encoding='utf-8')
    return len(partes), Path(saida).stat().st_size


if __name__ == '__main__':
    saida = sys.argv[2] if len(sys.argv) > 2 else RAIZ / 'alimentador' / 'site' / 'croqui-modelo.js'
    print(converte(sys.argv[1], saida))
