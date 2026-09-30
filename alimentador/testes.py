"""Testes das regras e das saídas.  python -m alimentador.testes   (ou: pytest alimentador/testes.py)"""
import tempfile
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

from openpyxl import load_workbook

from . import exemplo, exporta, regras


def rede_linha(tipos, desvio=None):
    """Linha reta DJ → tipos[0] → tipos[1] ... com vãos de ~40 m. desvio = (índice, [tipos]) cria um ramal."""
    nos = {'DJ': dict(tipo='DJ', nome='DJ', poste='P0', lat=-9.6, lon=-48.45)}
    vaos, ant = [], 'DJ'
    for i, t in enumerate(tipos, 1):
        nos[f'n{i}'] = dict(tipo=t, nome=f'{t}-{i}' if t != 'P' else f'P{i}', poste=f'P{i}', lat=-9.6, lon=-48.45 + i * 0.00037)
        vaos.append((ant, f'n{i}'))
        ant = f'n{i}'
    if desvio:
        idx, ts = desvio
        ant = f'n{idx}'
        for j, t in enumerate(ts, 1):
            k = f'd{j}'
            nos[k] = dict(tipo=t, nome=f'{t}-d{j}' if t != 'P' else f'Pd{j}', poste=f'Pd{j}', lat=-9.6 - j * 0.00037,
                          lon=-48.45 + idx * 0.00037)
            vaos.append((ant, k))
            ant = k
    return nos, vaos


def zona_apos(res, nome):
    return next(a['zona_depois'] for a in res['ativos'] if a['nome'] == nome)


def test_zonas():
    res = regras.analisar(*rede_linha(['P', '03', 'P']), 'DJ')
    assert zona_apos(res, '03-2') == 3, 'fusível no T1 vai direto para T3'
    res = regras.analisar(*rede_linha(['79', 'P', '79', 'P', '03', 'P', '03', 'P']), 'DJ')
    assert [zona_apos(res, n) for n in ('79-1', '79-3', '03-5', '03-7')] == [2, 2, 3, 4], 'religador nunca cria T3'
    res = regras.analisar(*rede_linha(['79', 'P', '03', 'P', '79', 'P']), 'DJ')
    assert zona_apos(res, '79-5') == 3, 'religador dentro de T3 não muda a zona'
    assert not any(v['tronco'] and v['zona'] > 2 for v in res['vaos']), 'religador depois de 03 não é o 2º do tronco'
    res = regras.analisar(*rede_linha(['P', '79', 'P', '79', 'P'], desvio=(1, ['P', '79', 'P', '03', 'P'])), 'DJ')
    assert zona_apos(res, '79-d2') == 2, 'religador em ramal também conta'
    assert zona_apos(res, '03-d4') == 3
    res = regras.analisar(*rede_linha(['79', '88', 'P', '79', 'P']), 'DJ')
    assert zona_apos(res, '88-2') == 2, 'chave 88 não muda a zona'


def test_tronco_e_blocos():
    res = regras.analisar(*rede_linha(['P', '79', 'P', '79', 'P', 'P'], desvio=(3, ['P', '03', 'P'])), 'DJ')
    tronco = [v for v in res['vaos'] if v['tronco']]
    assert len(tronco) == 4 and all(v['zona'] <= 2 for v in tronco), 'tronco vai do DJ ao 2º religador'
    assert res['fim_tronco'] == '79-4'
    ramais = {v['ramal'] for v in res['vaos'] if not v['tronco']}
    assert ramais == {'Ramal após 79-4', 'Ramal P3'}, ramais
    assert not res['avisos']


def test_tronco_sem_segundo_religador():
    res = regras.analisar(*rede_linha(['P', '79', 'P', 'P', 'P'], desvio=(3, ['03', 'P', 'P', 'P', 'P', 'P', 'P'])), 'DJ')
    assert res['avisos'] and 'sem 2º religador' in res['avisos'][0]
    tronco = [v for v in res['vaos'] if v['tronco']]
    assert tronco and all(v['zona'] <= 2 for v in tronco)
    assert not any(v['tronco'] for v in res['vaos'] if v['zona'] >= 3), 'tronco não entra depois do 03'
    res = regras.analisar(*rede_linha(['03', 'P', 'P']), 'DJ')
    assert not any(v['tronco'] for v in res['vaos']) and {v['zona'] for v in res['vaos']} == {1, 3}, 'DJ direto num 03'


def test_rede_invalida():
    nos, vaos = rede_linha(['P', 'P'])
    for ruim, msg in ((vaos + [('DJ', 'n2')], 'dois vãos'),
                      (vaos, None)):
        if msg is None:
            nos2 = dict(nos, solto=dict(tipo='P', nome='X', poste='X', lat=0, lon=0))
            try:
                regras.analisar(nos2, ruim, 'DJ')
                raise AssertionError('nó solto deveria falhar')
            except regras.RedeInvalida as e:
                assert 'sem ligação' in str(e)
        else:
            try:
                regras.analisar(nos, ruim, 'DJ')
                raise AssertionError('deveria falhar')
            except regras.RedeInvalida as e:
                assert msg in str(e)


def test_exemplo_completo():
    nos, vaos = exemplo.montar_rede()
    res = regras.analisar(nos, vaos, 'DJ')
    assert len(res['blocos']) == 15, len(res['blocos'])
    assert abs(sum(v['ext'] for v in res['vaos']) - res['total_m']) < 1e-6
    assert abs(sum(b['ext'] for b in res['blocos']) - res['total_m']) < 1e-6
    for v in res['vaos']:
        assert v['caminho'][-1] == v['ref'] and v['dist_ref'] >= 0
    for b in res['blocos']:
        assert {v['zona'] for v in res['vaos'] if v['bloco'] == b['n']} == {b['zona']}
    assert not any(b['ref'].startswith('88') for b in res['blocos']), 'chave 88 não é ativo de referência'
    b88 = {c: b for b in res['blocos'] for c in b['chaves88']}
    assert b88['88-A']['ref'] == 'RL1' and b88['88-A']['tronco']
    assert b88['88-B']['ref'] == '03-E'
    zonas_ref = {b['ref']: b['zona'] for b in res['blocos']}
    assert zonas_ref['RL2'] == 2 and zonas_ref['RL3'] == 2, 'depois do 2º religador ainda é T2 (T2 Ramal)'
    assert zonas_ref['03-E'] == 3 and zonas_ref['03-F'] == 4 and zonas_ref['03-C'] == 3

    with tempfile.TemporaryDirectory() as d:
        d = Path(d)
        exporta.kmz(res, 'T', d / 't.kmz')
        exporta.excel(res, 'T', d / 't.xlsx')
        exporta.mapa(res, 'T', d / 't.html')
        root = ET.fromstring(zipfile.ZipFile(d / 't.kmz').read('doc.kml'))
        ns = {'k': 'http://www.opengis.net/kml/2.2'}
        linhas = [p for p in root.iter('{http://www.opengis.net/kml/2.2}Placemark') if p.find('.//k:LineString', ns) is not None]
        assert len(linhas) == len(res['vaos'])
        wb = load_workbook(d / 't.xlsx')
        assert wb.sheetnames == ['Leia-me', 'Árvore de blocos', 'Consulta', 'Blocos', 'Por bloco', 'Trechos', 'Ativos']
        assert wb['Trechos'].max_row == len(res['vaos']) + 1
        html = (d / 't.html').read_text(encoding='utf-8')
        assert '%%' not in html and '"trechos"' in html


if __name__ == '__main__':
    testes = [f for n, f in sorted(globals().items()) if n.startswith('test_')]
    for f in testes:
        f()
        print('ok', f.__name__)
    print(f'{len(testes)} testes passaram')
