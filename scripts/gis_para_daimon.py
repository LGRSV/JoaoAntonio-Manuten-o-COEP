"""Converte a exportação do GIS por camadas (KMZ_GOOGLE_EARTH2) para o formato do KML do Daimon.

    python scripts/gis_para_daimon.py --gis ".../KMZ_GOOGLE_EARTH2/dados" --saida kml-gis [--alimentador AL01007055 ...]

Grava uma pasta por SE com SE-<SIGLA>_Circ-<AL>.kml (pastas "Chave" e "Trecho"), que o gera_trechos.py lê como se
fosse o Daimon. Onde fica cada coisa no GIS (conferido contra o Daimon):

- Rede MT: Vaos_e_condutores/Vaos_MT.kmz e Jumpers_MT.kmz. Cada linha vira um trecho por segmento, com FaseConcat.
- Chaves (religador 79, fusível 03/33/02, trip saver 40/41, faca 80, 88…): Equipamentos/Equipamentos_de_isolacao/
  Fechado.kmz e Aberto.kmz (Aberto = normalmente aberta). O UTM_ROTA de cada chave coincide com um segmento da rede:
  esse segmento vira o "Suporte Chave <número>", como no Daimon.
- Disjuntor: não existe em nenhuma camada do GIS (Equipamentos_de_protecao só tem para-raios e indicador de falta).
  O Daimon também não tem um disjuntor real: usa DJ_<AL>_FICT no início da rede. Aqui o DJ fictício é posto na
  ponta dos vãos do bloco do próprio alimentador (Name_Bloco = AL…) mais perto da subestação (Subestacao.kmz).
"""
import argparse
import math
import re
import sys
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

CAMPO = re.compile(r'<(?:SimpleData|Data) name="([^"]+)">\s*(?:<value>)?([^<]*)<')
PAR = re.compile(r'(-?[\d.]+) (-?[\d.]+)')


def placemarks(arq):
    if not arq.exists():
        return []
    z = zipfile.ZipFile(arq)
    t = z.read(next(n for n in z.namelist() if n.endswith('.kml'))).decode('utf-8', 'replace')
    out = []
    for pm in re.findall(r'<Placemark>(.*?)</Placemark>', t, re.S):
        d = dict(CAMPO.findall(pm))
        d['_ll'] = [tuple(map(float, c.split(',')[:2])) for bloco in re.findall(r'<coordinates>([^<]*)<', pm)
                    for c in bloco.split()]
        out.append(d)
    return out


def utm(s):
    return [(round(float(x), 2), round(float(y), 2)) for x, y in PAR.findall(s or '')]


def converter(pasta_al, sigla, se_ll):
    """Devolve (kml, resumo) de um alimentador."""
    al = pasta_al.name
    vaos = placemarks(pasta_al / 'Vaos_e_condutores' / 'Vaos_MT.kmz')
    jump = placemarks(pasta_al / 'Vaos_e_condutores' / 'Jumpers_MT.kmz')
    chaves, vistas = [], set()
    for sub in ('Equipamentos_de_isolacao', 'Sentidos_de_isolacao'):   # alguns alimentadores só têm a 2ª pasta
        iso = pasta_al / 'Equipamentos' / sub
        for arq, aberta in (('Fechado.kmz', False), ('Aberto.kmz', True)):
            for c in placemarks(iso / arq):
                chave = (c.get('Name') or c.get('Id'), c.get('UTM'))
                if chave not in vistas:
                    vistas.add(chave)
                    chaves.append((c, aberta))
    if not vaos:
        raise ValueError('sem Vaos_MT')

    ll = {}                       # vértice UTM -> (lon, lat)
    segs = {}                     # (a, b) ordenado -> dict(nome, fase)
    grau = {}
    bloco_al = set()
    for v in vaos + jump:
        pts = utm(v.get('UTM'))
        if len(pts) != len(v['_ll']):
            continue              # sem como casar UTM e lon/lat
        for p, q in zip(pts, v['_ll']):
            ll.setdefault(p, q)
        fase = v.get('FaseConcat') or v.get('FaseConcate') or v.get('Faseamento') or ''
        for a, b in zip(pts, pts[1:]):
            if a == b:
                continue
            k = (a, b) if a < b else (b, a)
            if k not in segs:
                segs[k] = dict(nome=v.get('Id') or '', fase=fase)
                grau[a] = grau.get(a, 0) + 1
                grau[b] = grau.get(b, 0) + 1
            if (v.get('Name_Bloco') or '') == al:
                bloco_al.update((a, b))

    # chaves: o segmento do UTM_ROTA vira "Suporte Chave"
    pontos, sem_seg = [], []
    for c, aberta in chaves:
        nome = (c.get('Name') or '').strip()
        r = utm(c.get('UTM_ROTA'))
        k = None
        if len(r) >= 2:
            a, b = r[0], r[-1]
            k = (a, b) if a < b else (b, a)
        if not nome or k not in segs or segs[k]['nome'].startswith('Suporte Chave '):
            sem_seg.append(nome or c.get('Id'))
            continue
        segs[k]['nome'] = f'Suporte Chave {nome}'
        p = utm(c.get('UTM'))
        pt = ll.get(p[0]) if p else None
        pontos.append((nome, aberta or (c.get('Estado Normal') == 'Open'), pt or ll[k[0]]))

    # DJ fictício na ponta mais perto da SE (preferindo o bloco do próprio alimentador e pontas soltas)
    def dist_se(p):
        lon, lat = ll[p]
        return math.hypot((lon - se_ll[0]) * 111320 * math.cos(math.radians(lat)), (lat - se_ll[1]) * 110540)
    cand = [p for p in bloco_al if p in ll] or list(ll)
    soltas = [p for p in cand if grau.get(p) == 1]
    raiz = min(soltas or cand, key=dist_se) if se_ll else min(soltas or cand)
    lon, lat = ll[raiz]
    fict = (lon + 0.00001, lat + 0.00001)
    dj = f'DJ_{al}_FICT'

    def pm_ponto(nome, est, p):
        return (f'<Placemark><name>{escape(nome)}</name><styleUrl>#{est}</styleUrl>'
                f'<Point><coordinates>{p[0]:.9f},{p[1]:.9f},0</coordinates></Point></Placemark>')

    def pm_linha(nome, a, b, fase=''):
        ext = f'<ExtendedData><Data name="FaseConcat"><value>{escape(fase)}</value></Data></ExtendedData>' if fase else ''
        return (f'<Placemark><name>{escape(nome)}</name>{ext}<LineString><coordinates>{a[0]:.9f},{a[1]:.9f},0 '
                f'{b[0]:.9f},{b[1]:.9f},0</coordinates></LineString></Placemark>')

    obs = (f'Convertido do GIS por camadas (KMZ_GOOGLE_EARTH2, {pasta_al.parent.name}/{al}). Chaves de '
           f'Equipamentos_de_isolacao (Fechado/Aberto) no segmento do conector. DJ fictício na saída da SE, como no Daimon '
           f'(o GIS não tem disjuntor).')
    linhas = [pm_linha(f'Suporte Chave {dj}', fict, (lon, lat))]
    linhas += [pm_linha(s['nome'], ll[a], ll[b], s['fase']) for (a, b), s in segs.items()]
    kml = ('<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>'
           f'<name>SE-{sigla}_Circ-{al}</name><description>{escape(obs)}</description>'
           '<Folder><name>Chave</name>' + pm_ponto(dj, 'mapDaimonChave', ((lon + fict[0]) / 2, (lat + fict[1]) / 2))
           + ''.join(pm_ponto(n, 'mapDaimonChaveNA' if na else 'mapDaimonChave', p) for n, na, p in pontos)
           + '</Folder><Folder><name>Trecho</name>' + ''.join(linhas) + '</Folder></Document></kml>\n')
    return kml, dict(al=al, vaos=len(segs), chaves=len(pontos), sem_segmento=sem_seg,
                     dj_dist_se_m=round(dist_se(raiz)) if se_ll else None)


def centro_se(pasta_se):
    sub = placemarks(pasta_se / 'Subestacao.kmz')
    if not sub or not sub[0]['_ll']:
        return None, None
    pts = sub[0]['_ll']
    sigla = sub[0].get('Sigla da Subestação') or pasta_se.name
    return sigla, (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--gis', required=True, help='pasta dados/ da exportação (uma pasta por SE)')
    ap.add_argument('--saida', required=True)
    ap.add_argument('--alimentador', action='append')
    a = ap.parse_args(argv)
    gis, saida = Path(a.gis), Path(a.saida)
    quero = set(a.alimentador or [])
    ok = falha = 0
    for pasta_se in sorted(p for p in gis.iterdir() if p.is_dir() and p.name.startswith('SE_')):
        als = [p for p in sorted(pasta_se.iterdir()) if p.is_dir() and (not quero or p.name in quero)]
        if not als:
            continue
        sigla, se_ll = centro_se(pasta_se)
        for pasta_al in als:
            try:
                kml, r = converter(pasta_al, sigla or pasta_se.name, se_ll)
            except Exception as e:  # noqa: BLE001 — um alimentador ruim não derruba o lote
                print(f'{pasta_al.name}: FALHA {e}')
                falha += 1
                continue
            destino = saida / pasta_se.name / f'SE-{sigla}_Circ-{pasta_al.name}.kml'
            destino.parent.mkdir(parents=True, exist_ok=True)
            destino.write_text(kml, encoding='utf-8')
            ok += 1
            extra = f' · {len(r["sem_segmento"])} chave(s) sem segmento' if r['sem_segmento'] else ''
            print(f'{r["al"]}: {r["vaos"]} segmentos, {r["chaves"]} chaves, DJ a {r["dj_dist_se_m"]} m da SE{extra}')
    print(f'convertidos {ok}, falhas {falha}')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
