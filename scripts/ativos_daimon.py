"""Ativos de ponto do KML do Daimon (transformador, particular, capacitor…) no site: trecho de cada um e NAE deles.

python scripts/ativos_daimon.py <pasta do site> <pasta com <AL>.json de pontos>

Os pontos saem do KML do Daimon (placemarks mapDaimonET, EP, Capacitor…: [nome, tipo, lon, lat]); a rede do site
pode vir de outra fonte (GIS). Cada ponto vai para o vão mais próximo da rede do site, até LIM_M. Grava:
  - dados/alimentadores/<AL>.json → 'ativos_kml': [[nome, tipo, lon, lat, trecho ou None, distância em m, vão], ...];
  - nas ocorrências 'ativo fora do KML' cujo ativo é um desses pontos (até LIM_M): trecho, regra
    'vão mais próximo do ativo' e dist_m, no JSON e no alimentadores/<AL>/dados.js (a página e o ranking leem dali).
Depois rodar gera_trechos.py --so-interface (ranking, busca de ativo) para refazer o resto.
"""
import json
import math
import sys
from pathlib import Path

LIM_M = 100          # ponto mais longe que isso da rede do site não entra em trecho (rede incompleta na fonte)
CELULA = 0.002       # ~220 m: grade para achar os vãos perto do ponto


def le_js(p):
    s = p.read_text(encoding='utf-8')
    i = s.index('{', s.index('='))                 # 'window.D = ' fica igual
    return s[:i], json.loads(s[i:].strip().rstrip(';'))


def vao_mais_perto(vaos, lon, lat, grade):
    """(índice do vão, distância em m) do vão mais próximo, olhando as células vizinhas da grade."""
    k = math.cos(math.radians(lat))
    gx, gy = int(lon // CELULA), int(lat // CELULA)
    melhor = (None, float('inf'))
    for i in {i for dx in (-1, 0, 1) for dy in (-1, 0, 1) for i in grade.get((gx + dx, gy + dy), ())}:
        ax, ay, bx, by = vaos[i][0] * k, vaos[i][1], vaos[i][2] * k, vaos[i][3]
        px, py = lon * k, lat
        dx, dy = bx - ax, by - ay
        l2 = dx * dx + dy * dy
        f = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / l2)) if l2 else 0.0
        d = math.hypot(ax + f * dx - px, ay + f * dy - py) * 111320
        if d < melhor[1]:
            melhor = (i, d)
    return melhor


def aplica(site, pontos_dir):
    tot = dict(alimentadores=0, pontos=0, no_trecho=0, nae_localizadas=0)
    for pf in sorted(Path(pontos_dir).glob('*.json')):
        al = pf.stem
        jf, mf = site / 'dados' / 'alimentadores' / f'{al}.json', site / 'alimentadores' / al / 'dados.js'
        if not jf.exists():
            continue
        c = json.loads(jf.read_text(encoding='utf-8'))
        if c['validacao']['status'] == 'falha':
            continue
        vaos, ts = c['vaos'], c['trechos']
        grade = {}
        for i, v in enumerate(vaos):
            for gx in range(int(min(v[0], v[2]) // CELULA), int(max(v[0], v[2]) // CELULA) + 1):
                for gy in range(int(min(v[1], v[3]) // CELULA), int(max(v[1], v[3]) // CELULA) + 1):
                    grade.setdefault((gx, gy), []).append(i)
        ativos, onde = [], {}
        for nome, tipo, lon, lat in json.loads(pf.read_text(encoding='utf-8'))['pontos']:
            i, d = vao_mais_perto(vaos, lon, lat, grade)
            t = ts[vaos[i][4]]['nome'] if i is not None and d <= LIM_M else None
            ativos.append([nome, tipo, lon, lat, t, round(d, 1) if i is not None else None, i if t else None])
            if t:
                onde.setdefault(nome, (t, round(d, 1)))
        c['ativos_kml'] = ativos

        def localiza(oc):
            n = 0
            for o in oc:
                if o.get('trecho') or o.get('regra') != 'ativo fora do KML':
                    continue
                cod = next((x for x in (o.get('ativo'), o.get('prob')) if x in onde), None)
                if cod:
                    o['trecho'], o['dist_m'] = onde[cod]
                    o['ativo'], o['fora'], o['regra'] = cod, None, 'vão mais próximo do ativo'
                    n += 1
            return n
        n = localiza(c['nae']['oc'])
        jf.write_text(json.dumps(c, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        cab, D = le_js(mf)
        if localiza(D['nae']['oc']) != n:
            raise SystemExit(f'{al}: NAE do JSON e do dados.js não batem')
        mf.write_text(cab + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
        tot['alimentadores'] += 1
        tot['pontos'] += len(ativos)
        tot['no_trecho'] += sum(1 for a in ativos if a[4])
        tot['nae_localizadas'] += n
    return tot


if __name__ == '__main__':
    print(aplica(Path(sys.argv[1]), sys.argv[2]))
