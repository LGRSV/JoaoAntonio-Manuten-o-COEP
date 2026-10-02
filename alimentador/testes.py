"""Testes das regras e das saídas.  python -m alimentador.testes   (ou: pytest alimentador/testes.py)"""
import tempfile
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

from openpyxl import load_workbook

from . import critica, exemplo, exporta, regras, trechos


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
    assert [zona_apos(res, n) for n in ('79-1', '79-3', '03-5', '03-7')] == [2, 2, 3, 3], 'religador nunca cria T3; não existe T4'
    res = regras.analisar(*rede_linha(['79', 'P', '03', 'P', '79', 'P']), 'DJ')
    assert zona_apos(res, '03-3') == 2 and zona_apos(res, '79-5') == 2, '03 antes de religador é seccionamento'
    assert res['fim_tronco'] == '79-5' and any('seccionamento' in a for a in res['avisos'])
    assert not any(v['tronco'] and v['zona'] > 2 for v in res['vaos'])
    res = regras.analisar(*rede_linha(['P', '79', 'P', '03', 'P', '03', 'P']), 'DJ')
    assert [zona_apos(res, n) for n in ('03-4', '03-6')] == [3, 3], 'fusível sem religador depois continua fusível (T3)'
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
    assert zonas_ref['03-E'] == 3 and zonas_ref['03-F'] == 3 and zonas_ref['03-C'] == 3
    rl2 = next(b for b in res['blocos'] if b['ref'] == 'RL2' and b['tronco'])
    assert set(rl2['ate']) == {'RL3', '03-E'}, 'o T depois do 2º religador é tronco até os próximos ativos'
    ramais = {b['ref']: b['ramal'] for b in res['blocos'] if not b['tronco']}
    assert ramais['RL3'] == 'Ramal após RL3' and ramais['03-E'] == 'Ramal após 03-E' and ramais['03-F'] == 'Ramal após 03-E'
    assert not any(v['tronco'] and v['zona'] > 2 for v in res['vaos'])

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


def _kml_daimon(chaves, trechos):
    pm_c = ''.join(f'<Placemark><name>{n}</name><styleUrl>#mapDaimonChave{"NA" if na else ""}</styleUrl>'
                   f'<Point><coordinates>{lon},{lat},0</coordinates></Point></Placemark>' for n, lat, lon, na in chaves)
    pm_t = ''.join(f'<Placemark><name>{n}</name><LineString><coordinates>{a[1]},{a[0]},0 {b[1]},{b[0]},0'
                   f'</coordinates></LineString></Placemark>' for n, a, b in trechos)
    return ('<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>'
            f'<Folder><name>Circ_X</name><Folder><name>Chave</name>{pm_c}</Folder>'
            f'<Folder><name>Trecho</name>{pm_t}</Folder></Folder></Document></kml>')


def test_leitor_daimon():
    """DJ → religador com 90 em série e bypass NA em paralelo → fusível. A energia passa pelo religador."""
    from . import daimon
    y = lambda i: -9.6 + i * 0.0003     # pontos numa linha, ~33 m entre eles
    P = {i: (y(i), -48.45) for i in range(12)}
    B = (y(4), -48.4497)                # ponto do desvio (bypass) ao lado
    chaves = [('DJ_X_FICT', (y(-1) + P[0][0]) / 2, (-48.4503 + P[0][1]) / 2, False),   # DJ no meio do suporte (empate) ('9000001', (y(2) + y(3)) / 2, -48.45, False),
              ('7900001', (y(3) + y(4)) / 2, -48.45, False), ('9000002', (y(4) + y(5)) / 2, -48.45, False),
              ('8000001', (y(3) + B[0]) / 2, -48.4498, True), ('0300001', (y(8) + y(9)) / 2, -48.45, False)]
    trechos = [('Suporte Chave DJ_X_FICT', (y(-1), -48.4503), P[0]), ('t1', P[0], P[1]), ('t2', P[1], P[2]),
               ('Suporte Chave 9000001', P[2], P[3]), ('Suporte Chave 7900001', P[3], P[4]),
               ('Suporte Chave 9000002', P[4], P[5]), ('Suporte Chave 8000001', P[3], B), ('t3', B, P[5]),
               ('t4', P[5], P[6]), ('t5', P[6], P[7]), ('t6', P[7], P[8]), ('Suporte Chave 0300001', P[8], P[9]),
               ('t7', P[9], P[10]), ('t8', P[10], P[11])]
    with tempfile.TemporaryDirectory() as d:
        arq = Path(d) / 'SE-X_Circ-ALTESTE.kml'
        arq.write_text(_kml_daimon(chaves, trechos), encoding='utf-8')
        nos, vaos, raiz, info = daimon.ler_circuito(arq)
    assert info['abertas'] == ['8000001'], info['abertas']
    assert nos[raiz]['lat'] == round(P[0][0], 6), 'raiz é a ponta do suporte do DJ mais longe do ponto do DJ'
    tipos = sorted(n['tipo'] for n in nos.values() if n['tipo'] != 'P')
    assert tipos == ['03', '79', 'DJ'], tipos          # 90 vira passagem; 80 NA fica fora
    res = regras.analisar(nos, vaos, raiz)
    assert zona_apos(res, '7900001') == 2 and zona_apos(res, '0300001') == 3
    # sai só o suporte do DJ e o da chave NA; o fio do desvio fica como ponta sem saída, ligado do lado de baixo
    assert len(res['vaos']) == len(trechos) - 2
    assert info['nomes_vaos'][next(v for v in vaos if nos[v[1]]['tipo'] == '79')] == 'Suporte Chave 7900001'



def test_trechos():
    # DJ → RL1 → RL2 → 03 → 03 no tronco; do poste entre RL1 e RL2 sai um desvio com religador e fusível
    nos, vaos = rede_linha(['P', '79', 'P', '79', 'P', '03', 'P', '03', 'P'], desvio=(3, ['P', '79', 'P', '03', 'P']))
    res = regras.analisar(nos, vaos, 'DJ')
    ts = {t['nome']: t for t in trechos.segmentar(nos, res)}
    assert sorted(ts) == ['T1', 'T2', 'T2-A', 'T2-B', 'T3-A', 'T3-B', 'T3-C'], sorted(ts)
    assert (ts['T1']['inicio'], ts['T1']['fim']) == ('DJ', ['79-2'])
    assert (ts['T2']['inicio'], ts['T2']['fim']) == ('79-2', ['79-4']), 'T2 vai de religador até religador'
    assert (ts['T2-A']['inicio'], ts['T2-A']['pai'], ts['T2-A']['tronco']) == ('79-4', 'T2', True), '2º religador abre T2-A'
    assert ts['T2']['derivacoes'] == ['T2-B'], 'religador fora do tronco é derivação'
    assert (ts['T2-B']['inicio'], ts['T2-B']['pai'], ts['T2-B']['derivacoes']) == ('79-d2', 'T2', ['T3-B'])
    assert ts['T2-A']['fim'] == ['03-6'] and ts['T2-B']['fim'] == ['03-d4'], 'sem religador no fim: ponto mais distante'
    assert ts['T3-B']['fim'] == ['fim de linha · poste Pd5']
    assert [ts[n]['inicio'] for n in ('T3-A', 'T3-B', 'T3-C')] == ['03-6', '03-d4', '03-8'], 'só T3, letras pela distância do DJ'
    assert ts['T3-A']['fim'] == ['03-8'] and ts['T3-C']['pai'] == 'T3-A', 'fusível dentro de fusível também é T3'
    assert abs(sum(t['ext'] for t in ts.values()) - res['total_m']) < 0.5
    assert all(v['zona'] == ts[v['trecho']]['zona'] for v in res['vaos'])
    assert [trechos.letras(i) for i in (0, 25, 26, 27, 51, 52)] == ['A', 'Z', 'AA', 'AB', 'AZ', 'BA']
    with tempfile.TemporaryDirectory() as d:
        trechos.mapa(nos, res, 'TESTE', Path(d) / 'm.html')
        html = (Path(d) / 'm.html').read_text(encoding='utf-8')
        assert '%%' not in html and '"nome":"T2-A"' in html
        trechos.kmz(nos, res, 'TESTE', Path(d) / 't.kmz')
        doc = ET.fromstring(zipfile.ZipFile(Path(d) / 't.kmz').read('doc.kml'))
        n = '{http://www.opengis.net/kml/2.2}'
        pastas = [f.find(n + 'name').text for g in doc.find(n + 'Document').find(n + 'Folder').findall(n + 'Folder')
                  for f in g.findall(n + 'Folder')]
        assert [p.split(' · ')[0] for p in pastas] == ['T1', 'T2', 'T2-A', 'T2-B', 'T3-A', 'T3-B', 'T3-C'], pastas
        assert pastas[4].startswith('T3-A · 03-6 → 03-8')



def test_critica():
    nos, vaos = rede_linha(['P', '79', 'P', '79', 'P', '03', 'P', '03', 'P'], desvio=(3, ['P', '79', 'P', '03', 'P']))
    res = regras.analisar(nos, vaos, 'DJ')
    ts = trechos.segmentar(nos, res)
    cab = ['DTA_CMPT_HDE', 'TIPO_INTER_KTI', 'COD_ELE_REDE_PROBLEMA', 'COD_ELE_PROBLEMA', 'ABRANGÊNCIA', 'NUM_SEQ_OPER_INIC_HDE',
           'DTA_ABERT', 'COD_ELE_REDE_INTERROMPIDO', 'COD_ELE_INTERROMPIDO', 'QTD_CONS_INTER_FAT', 'DURACAO',
           'DES_CAUSA_INTER_CAU', 'DES_SUB_CAUSA_INTER_SCR', 'QTD_IFEC_ALIM', 'QTD_IDEC_ALIM', 'COD_ALIMENTADOR']
    lin = lambda *v: ';'.join(v)
    dj = lin('01/01/26', 'COLETIVO', 'DJ', '9DJ', 'DJ', '1', '11/01/2026 18:16', 'DJ', '9DJ', '300', '51', 'TERCEIROS', 'OBJETO', ',07', ',06', 'ALX')
    arq1 = [';'.join(cab), dj,
            lin('01/01/26', 'COLETIVO', 'DJ', '9DJ', 'DJ', '1', '11/01/2026 18:16', 'DJ', '9DJ', '20', '2', 'TERCEIROS', 'OBJETO', ',01', ',00', 'ALX'),
            lin('01/01/26', 'COLETIVO', 'CH', '03-6', 'CH FUS', '2', '20/01/2026 10:00', 'TR', 'TRX', '40', '90', 'MEIO AMBIENTE', 'ARVORE', ',01', ',02', 'ALX'),
            lin('01/01/26', 'INDIVIDUAL', 'UC', '123456', 'UC', '3', '21/01/2026 09:00', 'TR', 'TR-B', '1', '60', 'CONEXAO', 'RAMAL', ',0002', ',0001', 'ALX'),
            lin('01/02/26', 'INDIVIDUAL', 'UC', '654321', 'UC', '4', '02/02/2026 09:00', 'TR', 'TR-SUMIU', '1', '30', 'CONEXAO', 'RAMAL', ',0002', ',0001', 'ALX'),
            lin('01/01/26', 'COLETIVO', 'DJ', '9DJ', 'DJ', '5', '12/01/2026 08:00', 'DJ', '9DJ', '99', '5', 'X', 'Y', ',1', ',1', 'OUTRO')]
    arq2 = [';'.join(cab), dj]                                   # linha repetida entre arquivos
    fim_b = next(v for v in res['vaos'] if v['trecho'] == 'T2-B')['b']
    with tempfile.TemporaryDirectory() as d:
        for nome, linhas in (('a.txt', arq1), ('b.txt', arq2)):
            Path(d, nome).write_bytes(('\r\n'.join(linhas) + '\r\n').encode('latin-1'))
        linhas = critica.ler([Path(d, 'a.txt'), Path(d, 'b.txt')], 'ALX')
    assert len(linhas) == 5, 'só o alimentador pedido e sem a linha repetida'
    oc = critica.por_trecho(critica.ocorrencias(linhas), res, ts, {'TR-B': fim_b}, {'ALY': {'TR-SUMIU': (0, 0)}})
    dj_oc = next(o for o in oc if o['abr'] == 'DJ')
    assert (dj_oc['trecho'], dj_oc['cons'], dj_oc['mes']) == ('T1', 320, '2026-01'), 'passos somados numa ocorrência'
    assert next(o for o in oc if o['abr'] == 'CH FUS')['trecho'] == 'T3-A', 'fusível que abre trecho'
    uc = [o for o in oc if o['abr'] == 'UC']
    assert uc[0]['trecho'] == 'T2-B' and uc[0]['prob'] == '' and not uc[0]['coletiva'], 'individual pelo trafo, sem o número da UC'
    assert (uc[1]['mes'], uc[1]['trecho'], uc[1]['fora']) == ('2026-02', None, 'hoje no ALY'), 'competência e ativo fora do cadastro'


if __name__ == '__main__':
    testes = [f for n, f in sorted(globals().items()) if n.startswith('test_')]
    for f in testes:
        f()
        print('ok', f.__name__)
    print(f'{len(testes)} testes passaram')
