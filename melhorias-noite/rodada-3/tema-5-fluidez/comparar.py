#!/usr/bin/env python3
# Compara verif/antes x verif/depois: fatos (JSON) e pixels (JPEG). uso: python3 comparar.py > medicoes/verifica.md
import json, glob, os, sys
from PIL import Image, ImageChops
import numpy as np
out = ['| Tela | Pixels diferentes (> 24/255) | Fatos diferentes |', '|---|---|---|']
tot = 0
def dif(a, b, pre=''):
    r = []
    if isinstance(a, dict) and isinstance(b, dict):
        for k in sorted(set(a) | set(b)):
            r += dif(a.get(k), b.get(k), f'{pre}{k}.')
    elif isinstance(a, list) and isinstance(b, list) and len(a) == len(b):
        for i, (x, y) in enumerate(zip(a, b)): r += dif(x, y, f'{pre}{i}.')
    elif a != b:
        r.append(f'{pre[:-1]}: {a} -> {b}')
    return r
for fa in sorted(glob.glob('verif/antes/*.json')):
    fd = fa.replace('/antes/', '/depois/')
    if not os.path.exists(fd): continue
    A, D = json.load(open(fa)), json.load(open(fd))
    base = os.path.basename(fa)[:-5]
    for k in A:
        if k in ('erros', 'falhas'): continue
        d = [x for x in dif(A[k], D.get(k)) if not x.startswith(('aviso', 'avisoRole', 'busca.foco'))]
        ja = f'verif/antes/{base}-{k}.jpg'; jd = f'verif/depois/{base}-{k}.jpg'
        pix = ''
        if os.path.exists(ja) and os.path.exists(jd):
            x, y = Image.open(ja).convert('RGB'), Image.open(jd).convert('RGB')
            if x.size == y.size:
                m = np.asarray(ImageChops.difference(x, y)).max(axis=2) > 24
                pix = f'{100 * m.mean():.2f} %'
            else: pix = 'tamanho diferente'
        if d or (pix and pix not in ('0.00 %',)):
            out.append(f'| {base} · {k} | {pix} | {"; ".join(d)[:400]} |')
            tot += 1
    out.append(f'| {base} · erros de console | – | antes {len(A.get("erros", []))} / depois {len(D.get("erros", []))} |')
out.append(f'\n{tot} telas com alguma diferença (de pixels ou de fatos).')
print('\n'.join(out))
