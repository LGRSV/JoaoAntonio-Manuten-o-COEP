#!/usr/bin/env python3
"""Passa os prints crus (sNN-...) para a numeração final por slide (NN-...). Rodar depois de mapa.js, busca.js,
alimentador.js, alim2.js e ranking.js. Os slides 1 a 3 reaproveitam prints dos slides 4, 18 e 12 (cópias)."""
import os, re, shutil
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prints')
ESPECIAIS = {'s19-polo-araguaina': '18b-polo-araguaina', 's19b-trechos-t3': '18c-trechos-t3', 's20-nae-por-100km': '19-nae-por-100km',
             's21-relatorio-topo': '20-relatorio-topo', 's21b-relatorio-total': '20b-relatorio-total', 's22-fluxo-dados': '21-fluxo-dados'}
COPIAS = {'s04-estado': '01-capa', 's18-ranking-eto': '02-problema', 's12-visao-geral': '03-o-que-e'}
for v in ('d', 'm'):
    for a, b in COPIAS.items():
        if os.path.exists(f'{D}/{a}-{v}.jpg'): shutil.copy(f'{D}/{a}-{v}.jpg', f'{D}/{b}-{v}.jpg')
for f in sorted(os.listdir(D)):
    m = re.match(r'^(s\d.*)-([dm])\.jpg$', f)
    if not m: continue
    novo = ESPECIAIS.get(m.group(1), m.group(1)[1:])
    os.replace(f'{D}/{f}', f'{D}/{novo}-{m.group(2)}.jpg')
