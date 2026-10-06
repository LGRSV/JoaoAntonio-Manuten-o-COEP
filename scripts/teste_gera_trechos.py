"""Teste mínimo do pipeline por município.  python scripts/teste_gera_trechos.py

Rede inventada (DJ → religador → fusível) cortada ao meio por dois municípios fictícios: confere a divisão por
município (amostra de 20 m), os arquivos gerados, os links, a validação e que duas execuções dão o mesmo resultado.
"""
import hashlib
import json
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import gera_trechos  # noqa: E402
from alimentador.testes import _kml_daimon  # noqa: E402


def rede(d):
    y = lambda i: -7.2 + i * 0.0003                   # linha norte-sul, ~33 m por vão
    P = {i: (y(i), -48.2) for i in range(8)}
    meio = lambda i: ((y(i) + y(i + 1)) / 2, -48.2)
    chaves = [('DJ_ALTESTE_FICT', *meio(-1), False), ('7900001', *meio(2), False), ('0300001', *meio(5), False)]
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
                  'assets/busca-ativo.js'):
            assert (d / 'site' / f).exists(), f
        pag = (d / 'site' / 'alimentadores' / 'ALTESTE' / 'index.html').read_text(encoding='utf-8')
        assert 'cdnjs' not in pag and 'const D' not in pag and len(pag) < 20000, 'página leve: dados e código em arquivos'
        antes = assinatura(d / 'site')
        assert gera_trechos.main(args) == 0
        assert assinatura(d / 'site') == antes, 'segunda execução igual à primeira'
        assert gera_trechos.main(['--saida', str(d / 'site'), '--validar']) == 0
        assert gera_trechos.main(['--saida', str(d / 'site'), '--so-interface']) == 0
        assert assinatura(d / 'site') == antes, 'só a interface: mesmo resultado'


if __name__ == '__main__':
    test_pipeline()
    print('ok test_pipeline')
