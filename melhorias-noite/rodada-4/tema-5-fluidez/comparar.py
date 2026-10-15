#!/usr/bin/env python3
# Compara verif/antes x verif/depois. Fatos ESTRUTURAIS (contagens, estados, textos) e, no computador, pixels.
# No celular o protótipo muda a altura dos alvos de toque de propósito (40 -> 44 px), então só os fatos estruturais valem.
# uso: python3 comparar.py > medicoes/verifica.md
import json, glob, os
from PIL import Image, ImageChops
import numpy as np
EST = ('fios', 'pinos', 'fiosRotulo', 'pontosRotulo', 'rotulos', 'chips', 'nivel')
def estrutura(x):
    if not isinstance(x, dict): return x
    if 'fios' in x:
        r = {k: x[k] for k in EST}
        r['cartoes'] = [c['t'] for c in x['cartoes']]
        r['legenda'] = {k: x['legenda'][k] for k in ('aberta', 'semNae')}
        r['tc'] = {k: x['tc'][k] for k in ('cheia', 'trava')}
        r['busca'] = {k: x['busca'][k] for k in ('campoVisivel', 'opcoes')}
        return r
    r = dict(x)
    for k in ('centro', 'z', 'scrolls', 'sh', 'mapa'): r.pop(k, None)       # geometria / rolagem em px
    return r
def dif(a, b, pre=''):
    r = []
    if isinstance(a, dict) and isinstance(b, dict):
        for k in sorted(set(a) | set(b)): r += dif(a.get(k), b.get(k), f'{pre}{k}.')
    elif isinstance(a, list) and isinstance(b, list) and len(a) == len(b):
        for i, (x, y) in enumerate(zip(a, b)): r += dif(x, y, f'{pre}{i}.')
    elif a != b: r.append(f'{pre[:-1]}: {a} -> {b}')
    return r
lin = ['| Fluxo | Estados comparados | Com diferença estrutural | Maior diferença de pixels | Erros de console antes/depois |', '|---|---|---|---|---|']
det = []
for fa in sorted(glob.glob('verif/antes/*.json')):
    fd = fa.replace('/antes/', '/depois/')
    if not os.path.exists(fd): continue
    A, D = json.load(open(fa)), json.load(open(fd)); base = os.path.basename(fa)[:-5]
    n = nd = 0; pmax = 0; pior = ''
    for k in A:
        if k in ('erros', 'falhas'): continue
        n += 1
        d = dif(estrutura(A[k]), estrutura(D.get(k)))
        if d: nd += 1; det.append(f'- {base} · {k}: ' + '; '.join(d)[:300])
        ja, jd = f'verif/antes/{base}-{k}.jpg', f'verif/depois/{base}-{k}.jpg'
        if os.path.exists(ja) and os.path.exists(jd):
            x, y = Image.open(ja).convert('RGB'), Image.open(jd).convert('RGB')
            if x.size == y.size:
                p = 100 * (np.asarray(ImageChops.difference(x, y)).max(axis=2) > 24).mean()
                if p > pmax: pmax, pior = p, k
    pix = f'{pmax:.2f} % ({pior})' if base.startswith('1440') else 'não vale (alvos de 44 px mudam a altura)'
    lin.append(f'| {base} | {n} | {nd} | {pix} | {len(A.get("erros", []))} / {len(D.get("erros", []))} |')
print('\n'.join(lin)); print('\nDiferenças estruturais:' if det else '\nNenhuma diferença estrutural.'); print('\n'.join(det))
