"""Teste mínimo do pipeline por município.  python scripts/teste_gera_trechos.py

Rede inventada (DJ → religador → fusível) cortada ao meio por dois municípios fictícios: confere a divisão por
município (amostra de 20 m), os arquivos gerados, os links, a validação e que duas execuções dão o mesmo resultado.
"""
import hashlib
import json
import math
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import gera_trechos  # noqa: E402
import limpeza_faixa  # noqa: E402
import ativos_gis  # noqa: E402
import atualiza_critica  # noqa: E402
import inspecao  # noqa: E402
from alimentador.testes import _kml_daimon  # noqa: E402


def rede(d):
    y = lambda i: -7.2 + i * 0.0003                   # linha norte-sul, ~33 m por vão
    P = {i: (y(i), -48.2) for i in range(8)}
    meio = lambda i: ((y(i) + y(i + 1)) / 2, -48.2)
    chaves = [('DJ_ALTESTE_FICT', *meio(-1), False), ('7900001', *meio(2), False), ('0300001', *meio(5), False),
              ('3100001', *meio(4), False)]             # 3100001: ponto sem suporte (fora da topologia), no vão t4
    tr = [('Suporte Chave DJ_ALTESTE_FICT', (y(-1), -48.2), P[0]), ('t1', P[0], P[1]), ('t2', P[1], P[2]),
          ('Suporte Chave 7900001', P[2], P[3]), ('t3', P[3], P[4]), ('t4', P[4], P[5]),
          ('Suporte Chave 0300001', P[5], P[6]), ('t5', P[6], P[7])]
    (d / 'kml').mkdir()
    (d / 'kml' / 'SE-XTST_Circ-ALTESTE.kml').write_text(_kml_daimon(chaves, tr), encoding='utf-8')
    corte = y(3.5)                                    # divisa no meio do vão t3
    caixa = lambda c, n, s, nm: dict(type='Feature', properties=dict(id=c, name=nm), geometry=dict(
        type='Polygon', coordinates=[[[-48.3, s], [-48.1, s], [-48.1, n], [-48.3, n], [-48.3, s]]]))
    malha = dict(type='FeatureCollection', features=[caixa('1', corte, -7.3, 'Sul Teste'), caixa('2', -7.1, corte, 'Norte Teste')])
    (d / 'malha.json').write_text(json.dumps(malha), encoding='utf-8')


def assinatura(pasta):
    return {str(p.relative_to(pasta)): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(pasta.rglob('*')) if p.is_file()}


def test_pipeline():
    with tempfile.TemporaryDirectory() as d:
        d = Path(d)
        rede(d)
        args = ['--kml', str(d / 'kml'), '--malha', str(d / 'malha.json'), '--saida', str(d / 'site'), '--data', '2026-01-01',
                '--alimentador', 'ALTESTE']
        assert gera_trechos.main(args) == 0
        c = json.loads((d / 'site' / 'dados' / 'alimentadores' / 'ALTESTE.json').read_text(encoding='utf-8'))
        assert [t['nome'] for t in c['trechos']] == ['T1', 'T2'] and c['validacao']['status'] != 'falha'
        assert c['resumo']['fusiveis_tronco'] == 1, 'fusível na linha principal não abre T3'
        muns = {m['nome']: m['m'] for m in c['municipios']}
        assert set(muns) == {'Sul Teste', 'Norte Teste'} and abs(sum(muns.values()) - c['resumo']['extensao_m']) < 1
        assert len(c['limitrofes']) == 1 and c['limitrofes'][0]['trecho'] == 'T2', 'vão da divisa medido por amostra'
        assert set(c['trechos'][1]['municipios']) == {'1', '2'} and c['trechos'][0]['caminho'] == ['T1']
        assert c['trechos'][1]['caminho'] == ['T1', 'T2']
        fora = {p[0]: p for p in c['chaves_sem_topologia']}
        assert fora['3100001'][3:] == ['T2', 16.7], 'chave fora da topologia: trecho e distância da ponta de vão mais perto'
        assert all(-51 < v[0] < -45 and -14 < v[1] < -5 for v in c['vaos']), 'coordenadas [lon, lat]'
        man = json.loads((d / 'site' / 'manifesto.json').read_text(encoding='utf-8'))
        assert [m['slug'] for m in man['municipios']] == ['norte-teste', 'sul-teste']
        ativos = d / 'site' / 'dados' / 'ativos'
        hit = json.loads((ativos / (gera_trechos.fatia('7900001') + '.json')).read_text(encoding='utf-8'))['7900001']
        assert hit[0][:4] == ['ALTESTE', '79', 'T2', 'início do T2 · fim do T1'], 'busca de ativo: o religador abre o T2'
        assert gera_trechos.chave_ativo(' 0300-001 ') == '300001', 'busca ignora zeros à esquerda e pontuação'
        for f in ('index.html', 'municipios/norte-teste/index.html', 'alimentadores/ALTESTE/index.html',
                  'alimentadores/ALTESTE/dados.js', 'alimentadores/ALTESTE/ALTESTE-trechos.kmz', 'relatorio.md',
                  'assets/alimentador.js', 'assets/extras.js', 'assets/leaflet/leaflet.js',
                  'assets/busca-ativo.js', 'polos/index.html', 'assets/ranking-polos.js', 'assets/ranking-polos-dados.js',
                  'assets/croqui.js', 'assets/croqui-modelo.js', 'assets/inspecao.js'):
            assert (d / 'site' / f).exists(), f
        pag = (d / 'site' / 'alimentadores' / 'ALTESTE' / 'index.html').read_text(encoding='utf-8')
        assert 'cdnjs' not in pag and 'const D' not in pag and len(pag) < 20000, 'página leve: dados e código em arquivos'
        assert 'assets/croqui.js' in pag and 'croqui-modelo.js' not in pag, 'croqui na página; o modelo só carrega quando pedido'
        assert '<script src="inspecao.js"></script>' in pag and 'assets/inspecao.js' in pag, 'inspeção na página'
        antes = assinatura(d / 'site')
        assert gera_trechos.main(args) == 0
        assert assinatura(d / 'site') == antes, 'segunda execução igual à primeira'
        assert gera_trechos.main(['--saida', str(d / 'site'), '--validar']) == 0
        assert gera_trechos.main(['--saida', str(d / 'site'), '--so-interface']) == 0
        assert assinatura(d / 'site') == antes, 'só a interface: mesmo resultado'
        ativos_gis_no_site(d)
        critica_sem_kml(d)
        inspecao_no_site(d)


def inspecao_no_site(d):
    """Base de inspeção: só EXECUTADA; caminho do ELEMENTO subindo até a ABRANGÊNCIA; só o ponto; sem posição."""
    import datetime as dt
    import openpyxl
    cab = ['NUMERO_OS', 'ALIMENTADOR', 'SITUACAO', 'CODEQUIPE', 'CRITICIDADE', 'INICIO_EXEC', 'FIM_EXEC',
           'ELEMENTO', 'ABRANGENCIA', 'MONT_ABRANGENCIA', 'DESCRICAO_OS']
    h = lambda *a: dt.datetime(*a)
    linhas = [
        ['ETO-INPA01  000001/2026', 'ALTESTE', 'EXECUTADA', 'ETO-INPA01', 'ALTA', h(2026, 1, 10, 8), h(2026, 1, 10, 10),
         '0300001', '7900001', 'DJ_ALTESTE_FICT', 'OS despachada automaticamente pelo Scheduler/SOMA'],
        ['ETO-INPA01  000002/2026', 'ALTESTE', 'EXECUTADA', 'ETO-INPA01', 'BAIXA', h(2026, 1, 1, 8), h(2026, 4, 1, 8),
         '7900001', '9000001', 'DJ_ALTESTE_FICT', 'BLOCO CHAVE FACA - 9000001'],
        ['ETO-INPA01  000003/2026', 'ALTESTE', 'EXECUTADA', 'ETO-INPA01', 'BAIXA', h(2026, 2, 1, 8), h(2026, 2, 1, 9),
         '9000002', '9000003', '', ''],
        ['ETO-INPA01  000004/2026', 'ALTESTE', 'CRIADA', 'ETO-INPA01', 'BAIXA', None, None, '0300001', '7900001', '', ''],
        ['ETO-INPA01  000005/2026', 'ALOUTRO', 'EXECUTADA', 'ETO-INPA01', 'BAIXA', h(2026, 3, 1, 8), h(2026, 3, 1, 9),
         '1', '2', '', ''],
    ]
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Dados'
    for r in [cab] + linhas:
        ws.append(r)
    wb.save(d / 'insp.xlsx')
    r = inspecao.main(d / 'insp.xlsx', d / 'site')
    assert r['executadas'] == 4 and r['sem_pagina'] == {'ALOUTRO': 1}, 'só EXECUTADA; alimentador fora do site à parte'
    assert r['situacao'] == {'no mapa (vãos)': 1, 'só o ponto': 1, 'sem posição': 1}, r['situacao']
    arq = d / 'site' / 'alimentadores' / 'ALTESTE' / 'inspecao.js'
    ins = inspecao.le_js(arq)
    os_ = {o['os']: o for o in ins['os']}
    c = json.loads((d / 'site' / 'dados' / 'alimentadores' / 'ALTESTE.json').read_text(encoding='utf-8'))
    poste = {ch['nome']: ch['poste'] for ch in c['chaves']}
    o1 = os_['000001/2026']
    k1 = ins['os'].index(o1)
    vaos = {v for v, ks in ins['vaos'].items() if k1 in ks}
    assert (poste['0300001'], poste['7900001']) == ('N6', 'N3') and sorted(vaos) == ['TR-004', 'TR-005', 'TR-006'], vaos
    assert o1['metodo'] == 'entre o ELEMENTO e a ABRANGÊNCIA' and o1['m'] == 100.2 and o1['data'] == '2026-01-10', o1
    assert o1['desc'] == '' and o1['pt'] is None, 'caminho do fusível subindo até o religador; descrição automática fora'
    o2 = os_['000002/2026']
    assert o2['metodo'].startswith('só o ponto do ELEMENTO') and o2['pt'] and o2['m'] == 0, o2
    assert o2['data'] == '2026-01-01', 'FIM mais de 60 dias depois do INICIO: vale o INICIO'
    o3 = os_['000003/2026']
    assert o3['metodo'].startswith('sem posição') and o3['pt'] is None and ins['base_ate'] == '2026-03-01'
    antes = arq.read_bytes()
    inspecao.main(d / 'insp.xlsx', d / 'site')
    assert arq.read_bytes() == antes, 'inspeção: segunda execução igual'
    print('ok inspecao_no_site')


CRITICA_CAB = ('DTA_CMPT_HDE;TIPO_INTER_KTI;COD_ELE_REDE_PROBLEMA;COD_ELE_PROBLEMA;ABRANGÊNCIA;NUM_SEQ_OPER_INIC_HDE;'
               'DTA_ABERT;NUM_PASSO_INIC_HDE;COD_ELE_REDE_INTERROMPIDO;COD_ELE_INTERROMPIDO;NUM_PASSO_FIM_HDE;DTA_FECH;'
               'COD_ELE_FECHADO;QTD_CONS_INTER_FAT;DURACAO;DES_CAUSA_INTER_CAU;DES_SUB_CAUSA_INTER_SCR;QTD_IFEC_ALIM;'
               'QTD_IDEC_ALIM;COD_ALIMENTADOR')


def critica_sem_kml(d):
    """Crítica nova só com os dados do site: chave de início, chave fora da topologia, trafo do GIS e ativo desconhecido."""
    site = d / 'site'
    ativos_gis.grava_trafos(site, ativos_gis.transformadores(d / 'gis')[0])
    linha = lambda n, abr, tipo, prob, inter, dia: ';'.join((
        '01/01/26', 'COLETIVA' if tipo != 'UC' else 'INDIVIDUAL', tipo, prob, abr, str(n), f'{dia}/01/2026 10:00', '1',
        'TR' if tipo == 'UC' else tipo, inter, '2', f'{dia}/01/2026 11:00', inter, '3', '60', 'MEIO AMBIENTE',
        'ARVORE DE GRANDE PORTE NA REDE', '0', '0', 'ALTESTE'))
    arq = d / 'Critica-CHEIO_01-2026.txt'
    arq.write_text('\n'.join([CRITICA_CAB, linha(1, 'DJ', 'DJ', 'DJ_ALTESTE_FICT', 'DJ_ALTESTE_FICT', '02'),
                              linha(2, 'RL', 'RL', '7900001', '7900001', '03'),
                              linha(3, 'CH FUS', 'CH FUS', '3100001', '3100001', '04'),
                              linha(4, 'TR', 'UC', '123456', '5700001', '05'),
                              linha(5, 'CH FUS', 'CH FUS', '9999999', '9999999', '06')]) + '\n', encoding='latin-1')
    xlsx = d / 'NAE.xlsx'
    assert atualiza_critica.main(['--site', str(site), '--critica', str(arq), '--planilha', str(xlsx)]) == 0 and xlsx.exists()
    c = json.loads((site / 'dados' / 'alimentadores' / 'ALTESTE.json').read_text(encoding='utf-8'))
    got = [(o['ativo'], o['trecho'], o['regra'], o['fora']) for o in c['nae']['oc']]
    assert got == [('DJ_ALTESTE_FICT', 'T1', 'abrangência DJ', None),
                   ('7900001', 'T2', 'chave de início do trecho', None),
                   ('3100001', 'T2', 'vão mais próximo do ativo', None),
                   ('5700001', 'T2', ativos_gis.REGRA, None),
                   ('9999999', None, 'ativo fora do KML', 'fora do cadastro atual')], got
    assert c['nae']['meses'] == ['2026-01'] and c['origem']['critica'] == ['Critica-CHEIO_01-2026.txt']
    assert ativos_gis.le_js(site / 'alimentadores' / 'ALTESTE' / 'dados.js')[1]['nae'] == c['nae'], 'página igual ao JSON'
    assert atualiza_critica.main(['--site', str(site), '--conferir']) == 0, 'refazer a associação dá o mesmo'
    antes = assinatura(site)
    assert atualiza_critica.main(['--site', str(site), '--critica', str(arq)]) == 0
    assert assinatura(site) == antes, 'rodar a mesma Crítica de novo não muda nada'


def ativos_gis_no_site(d):
    """Trafo do GIS (camada Transformadores) dá trecho à NAE que estava 'ativo fora do KML'."""
    site, y = d / 'site', lambda i: -7.2 + i * 0.0003
    (d / 'gis0').mkdir()
    assert ativos_gis.aplica(site, d / 'gis0')[0]['nae_localizadas'] == 0, 'site sem Crítica (nae vazio) não quebra'
    assert ativos_gis.outros(site, pts={})['nae_hoje_em_outro'] == 0 and ativos_gis.posicoes(site, pts={})
    oc = dict(mes='2026-01', dia='02/01 10:00', col=True, abr='TR', ativo='5700001', prob='5700001', causa='Meio ambiente',
              sub='Árvore', prog=False, cons=3, dur=60, trecho=None, fora='fora do cadastro atual', regra='ativo fora do KML',
              dist_m=None)
    jf, mf = site / 'dados' / 'alimentadores' / 'ALTESTE.json', site / 'alimentadores' / 'ALTESTE' / 'dados.js'
    c = json.loads(jf.read_text(encoding='utf-8'))
    c['nae'] = dict(meses=['2026-01'], oc=[dict(oc), dict(oc, ativo='5799999', prob='5799999')])
    jf.write_text(json.dumps(c), encoding='utf-8')
    cab, D = ativos_gis.le_js(mf)
    D['nae'] = json.loads(json.dumps(c['nae']))
    mf.write_text(cab + json.dumps(D) + ';\n', encoding='utf-8')
    pm = lambda n, lat, lon: (f'<Placemark><name>{n}</name><ExtendedData><Data name="Alimentador"><value>ALTESTE</value></Data>'
                              f'</ExtendedData><Point><coordinates>{lon},{lat},0</coordinates></Point></Placemark>')
    (d / 'gis').mkdir()
    (d / 'gis' / 'Transformadores.kml').write_text('<kml><Document><name>Transformadores</name>' + pm('5700001', y(4.5), -48.20001)
                                                   + pm('5700002', y(4.5), -48.21) + '</Document></kml>', encoding='utf-8')
    tot, _ = ativos_gis.aplica(site, d / 'gis')
    assert tot['nae_localizadas'] == 1 and tot['nae_sem_ponto'] == 1, tot
    c = json.loads(jf.read_text(encoding='utf-8'))
    o = c['nae']['oc'][0]
    assert (o['trecho'], o['regra']) == ('T2', ativos_gis.REGRA) and o['dist_m'] < 2, 'trafo a 1 m do vão t4 (T2)'
    assert c['nae']['oc'][1]['trecho'] is None, 'trafo que não está no GIS continua sem trecho'
    assert [a[4] for a in c['ativos_kml']] == ['T2', None], 'trafo a ~1 km da rede não entra em trecho'
    assert ativos_gis.le_js(mf)[1]['nae']['oc'][0]['trecho'] == 'T2', 'página (dados.js) igual ao JSON'
    assert gera_trechos.main(['--saida', str(site), '--so-interface']) == 0
    antes = (jf.read_text(encoding='utf-8'), mf.read_text(encoding='utf-8'))
    ativos_gis.aplica(site, d / 'gis'); ativos_gis.outros(site, d / 'gis'); ativos_gis.posicoes(site, d / 'gis')
    c2 = json.loads(jf.read_text(encoding='utf-8'))
    assert c2['nae'] == json.loads(antes[0])['nae'] | {'oc': c2['nae']['oc']} and c2['nae']['oc'][0]['trecho'] == 'T2', 'rodar de novo não muda'
    assert c2['nae']['oc'][0].get('lonlat') and 'hoje' not in c2['nae']['oc'][0]
    hit = json.loads((site / 'dados' / 'ativos' / (gera_trechos.fatia('5700001') + '.json')).read_text(encoding='utf-8'))['5700001']
    assert hit[0][:3] == ['ALTESTE', 'TR', 'T2'], 'busca de ativo acha o trafo no trecho'


def test_chave_sem_segmento():
    """GIS com a linha passando direto pela chave (sem o conector): a chave entra no vão onde está o ponto dela."""
    import gis_para_daimon as g
    segs = {((0.0, 0.0), (100.0, 0.0)): dict(nome='v1', fase='ABC')}
    ll, grau = {(0.0, 0.0): (-48.0, -10.0), (100.0, 0.0): (-47.9991, -10.0)}, {(0.0, 0.0): 1, (100.0, 0.0): 1}
    k = g.encaixa((50.3, 0.2), segs, ll, grau, '0300001')
    assert k == ((49.8, 0.0), (50.8, 0.0)) and segs[k]['nome'] == 'Suporte Chave 0300001' and len(segs) == 3
    assert abs(sum(math.dist(a, b) for a, b in segs) - 100) < 1e-6, 'a rede não muda de tamanho'
    assert g.encaixa((50.0, 5.0), {((0.0, 0.0), (100.0, 0.0)): dict(nome='v', fase='')}, dict(ll), dict(grau), 'X') is None


def test_equipes_limpeza():
    assert limpeza_faixa.conta('EXECUTADA', 'ETO-RD-GU 004972/2022'), 'executada da equipe do polo conta'
    assert not limpeza_faixa.conta('EXECUTADA', 'ETO-LD-PCM 000452/2025'), 'executada de outra equipe não conta'
    assert limpeza_faixa.conta('CRIADA', 'ETO-LD-PCM 000452/2025'), 'pendente aparece, de qualquer equipe'


if __name__ == '__main__':
    test_pipeline()
    print('ok test_pipeline')
    test_equipes_limpeza()
    print('ok test_equipes_limpeza')
    test_chave_sem_segmento()
    print('ok test_chave_sem_segmento')
