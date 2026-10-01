"""Circuito de EXEMPLO (não é rede real) para validar o formato das saídas.

Gera em alimentador/saida/: KMZ, Excel e o mapa HTML.

    python -m alimentador.exemplo
"""
import math
from pathlib import Path

from . import regras, exporta

NOME = 'EXEMPLO_AL-ILUSTRATIVO'
LAT0, LON0 = -9.600, -48.450   # âncora do desenho: área qualquer, só para abrir no mapa
M_PX = 2.0                     # 1 unidade do desenho = 2 m
VAO = 40.0                     # vão alvo entre postes (m)

# desenho unifilar: id -> (tipo, x, y, nome). 'J' = derivação, 'F' = fim de linha (ambos são postes)
DESENHO = {
    'DJ': ('DJ', 60, 220, 'DJ'),
    'nA': ('J', 170, 220, 'P-102'), 'nB': ('J', 280, 220, 'P-105'),
    'RL1': ('79', 390, 220, 'RL1'),
    'nC': ('J', 500, 220, 'P-131'), '88A': ('88', 555, 220, '88-A'), 'nD': ('J', 610, 220, 'P-138'),
    'RL2': ('79', 720, 220, 'RL2'),
    'nE': ('J', 840, 220, 'P-160'), 'RL3': ('79', 840, 120, 'RL3'), 'f3': ('F', 840, 40, 'P-171'),
    '03E': ('03', 960, 220, '03-E'), '88B': ('88', 1040, 220, '88-B'), 'nF': ('J', 1080, 220, 'P-190'),
    '03F': ('03', 1080, 120, '03-F'), 'fF': ('F', 1080, 40, 'P-199'), 'fG': ('F', 1080, 360, 'P-195'),
    'RLA': ('79', 170, 320, 'RL-A'), '03A': ('03', 170, 430, '03-A'), 'nA2': ('J', 170, 530, 'P-120'),
    '03B': ('03', 300, 530, '03-B'), 'fB': ('F', 420, 530, 'P-127'), 'fA': ('F', 170, 630, 'P-124'),
    '03C': ('03', 280, 120, '03-C'), 'fC': ('F', 280, 40, 'P-110'),
    '03D': ('03', 500, 330, '03-D'), 'fD': ('F', 500, 440, 'P-135'),
    'fDD': ('F', 610, 60, 'P-140'),
}
LIGACOES = [
    ('DJ', 'nA'), ('nA', 'nB'), ('nB', 'RL1'), ('RL1', 'nC'), ('nC', '88A'), ('88A', 'nD'), ('nD', 'RL2'),
    ('RL2', 'nE'), ('nE', 'RL3'), ('RL3', 'f3'), ('nE', '03E'), ('03E', '88B'), ('88B', 'nF'),
    ('nF', '03F'), ('03F', 'fF'), ('nF', 'fG'),
    ('nA', 'RLA'), ('RLA', '03A'), ('03A', 'nA2'), ('nA2', '03B'), ('03B', 'fB'), ('nA2', 'fA'),
    ('nB', '03C'), ('03C', 'fC'), ('nC', '03D'), ('03D', 'fD'), ('nD', 'fDD'),
]


def latlon(x, y):
    lat = LAT0 - (y * M_PX) / 111320.0
    lon = LON0 + (x * M_PX) / (111320.0 * math.cos(math.radians(LAT0)))
    return lat, lon


def montar_rede():
    """Converte o desenho em árvore de vãos de ~40 m, com postes intermediários."""
    seq = iter(range(201, 10000))
    nos = {}
    for k, (t, x, y, nome) in DESENHO.items():
        lat, lon = latlon(x, y)
        tipo = 'P' if t in ('J', 'F') else t
        poste = nome if t in ('J', 'F') else f'P-{next(seq)}'
        nos[k] = dict(tipo=tipo, nome=nome if tipo != 'P' else poste, poste=poste, lat=lat, lon=lon)
    vaos = []
    for p, c in LIGACOES:
        a, b = (nos[p]['lat'], nos[p]['lon']), (nos[c]['lat'], nos[c]['lon'])
        k = max(1, round(regras.haversine(a, b) / VAO))
        ant = p
        for i in range(1, k):
            nid = f'{p}>{c}#{i}'
            poste = f'P-{next(seq)}'
            nos[nid] = dict(tipo='P', nome=poste, poste=poste,
                            lat=a[0] + (b[0] - a[0]) * i / k, lon=a[1] + (b[1] - a[1]) * i / k)
            vaos.append((ant, nid))
            ant = nid
        vaos.append((ant, c))
    return nos, vaos


def main():
    nos, vaos = montar_rede()
    res = regras.analisar(nos, vaos, 'DJ')
    saida = Path(__file__).resolve().parent / 'saida'
    saida.mkdir(exist_ok=True)
    # defeito de exemplo: vão do meio do bloco da chave 03-F (fim de linha, dentro de outro fusível: T3)
    b03f = next(b for b in res['blocos'] if b['ref'] == '03-F')
    vaos_b = [v for v in res['vaos'] if v['bloco'] == b03f['n']]
    defeito = vaos_b[len(vaos_b) // 2]['id']
    exporta.kmz(res, NOME, saida / f'{NOME}.kmz', defeito=defeito, aviso_exemplo=True)
    exporta.excel(res, NOME, saida / f'{NOME}.xlsx', defeito=defeito, aviso_exemplo=True)
    exporta.mapa(res, NOME, saida / 'mapa-blocos.html', defeito=defeito, aviso_exemplo=True)
    print(f"{len(res['vaos'])} vãos · {res['total_m']:.0f} m · {len(res['blocos'])} blocos · "
          f"{sum(1 for a in res['ativos'] if a['tipo'] == '88')} chaves 88 → {saida}")
    for a in res['avisos']:
        print('AVISO:', a)


if __name__ == '__main__':
    main()
