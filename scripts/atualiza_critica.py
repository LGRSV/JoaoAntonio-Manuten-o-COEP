"""Atualiza só a NAE (Crítica) de um site já gerado pelo gera_trechos.py, sem refazer trechos, municípios nem mapas.

    python scripts/atualiza_critica.py --site site --kml kml-gis --vegetacao ../vera-vegetacao \
        --critica "Criticas/Critica-CHEIO_*-2026.txt"

Para cada alimentador já processado (dados/alimentadores/<AL>.json), relê a rede do KML (rápido), associa as
ocorrências da Crítica aos trechos com as mesmas regras do gera_trechos.py e troca apenas:
  - `nae` e `origem.critica` no JSON canônico;
  - `nae` e `meta.origem` no alimentadores/<AL>/dados.js.
Depois refaz índice, manifesto, ranking e relatório. Os trechos, a geometria e o KMZ não mudam.
Alimentadores bloqueados (status falha) ficam como estão.
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import gera_trechos as gt  # noqa: E402
from alimentador import critica, daimon, regras, trechos  # noqa: E402


def nae_do_alimentador(al, fontes):
    postes, _ = fontes.postes(al)
    nos, vaos, raiz, _ = daimon.ler_circuito(fontes.kmls[al], postes)
    res = regras.analisar(nos, vaos, raiz)
    ts = trechos.segmentar(nos, res)
    oc = critica.ocorrencias(fontes.critica.get(al, []))
    if fontes.nae_filtro == 'arvore':
        oc = [o for o in oc if critica.arvore_na_rede(o)]
    oc = critica.por_trecho(oc, res, ts, fontes.pontos(al), fontes.outros(al))
    _, D = trechos.dados_mapa(nos, res, oc)
    D['nae']['meses'] = fontes.meses
    return D['nae']


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--site', required=True, help='pasta do site gerado pelo gera_trechos.py')
    ap.add_argument('--kml', action='append', required=True, help='mesma pasta de KMLs usada para gerar o site')
    ap.add_argument('--vegetacao', help='clone do vera-vegetacao (postes), como no gera_trechos.py')
    ap.add_argument('--critica', action='append', required=True, help="Critica*.txt (aceita padrão entre aspas)")
    ap.add_argument('--nae', choices=('arvore', 'todas'), default='arvore')
    a = ap.parse_args(argv)
    site = Path(a.site)
    fontes = gt.Fontes(a)
    print(f'Crítica: {len(fontes.critica_arqs)} arquivo(s), meses {", ".join(fontes.meses)}')
    ok = pul = 0
    for arq in sorted((site / 'dados' / 'alimentadores').glob('*.json')):
        c = json.loads(arq.read_text(encoding='utf-8'))
        al = c['alimentador']
        if c['validacao']['status'] == 'falha' or al not in fontes.kmls:
            pul += 1
            continue
        try:
            nae = nae_do_alimentador(al, fontes)
        except (ValueError, regras.RedeInvalida) as e:
            print(f'{al}: não atualizado ({e})')
            pul += 1
            continue
        c['nae'] = nae
        c['origem']['critica'] = [Path(f).name for f in fontes.critica_arqs]
        c['origem']['nae_filtro'] = fontes.nae_filtro
        gt.grava_json(arq, c)
        js = site / 'alimentadores' / al / 'dados.js'
        D = json.loads(js.read_text(encoding='utf-8')[len('window.D = '):].rstrip().rstrip(';'))
        D['nae'] = nae
        D['meta'] = gt.meta_interface(c)
        js.write_text('window.D = ' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
        ok += 1
        assoc = sum(1 for o in nae['oc'] if o.get('trecho'))
        print(f'{al}: {len(nae["oc"])} ocorrência(s), {assoc} em trecho')
    dados, man = gt.interface(site)
    gt.relatorio(site, dados, man, sorted(set(fontes.indice) - set(fontes.kmls)))
    valido = gt.validar_saida(site)
    print(f'NAE atualizada em {ok} alimentador(es); {pul} sem mudança (bloqueados ou sem KML)')
    return 0 if valido else 1


if __name__ == '__main__':
    sys.exit(main())
