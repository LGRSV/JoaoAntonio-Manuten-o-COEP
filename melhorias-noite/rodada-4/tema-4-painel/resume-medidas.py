#!/usr/bin/env python3
"""Lê metricas.json, repeticoes.json e testes-*.json e imprime as tabelas (markdown) usadas no README.md."""
import json, glob, sys
M = json.load(open('metricas.json'))
def n(x): return f'{x:,}'.replace(',', '.')
print('### metricas (l×a | início do mapa | altura visível | área visível | rolagem)')
for cod in ['LD01072001', 'AL03037009', 'LD02022033', 'AL01015049']:
    for vp in 'dm':
        a, b = M['lupa'][f'{cod}-{vp}'], M['consolidado'][f'{cod}-{vp}']
        f = lambda r: f"{r['mapa']['w']}×{r['mapa']['h']} (y={r['mapa']['y']}; visível {r['mapaVisivelH']} px; {n(r['areaVisivelPx2'])} px² = {r['areaVisivelPct']}%; rolagem {r['rolagemPagina']} px)"
        d = (b['areaVisivelPx2'] / a['areaVisivelPx2'] - 1) * 100
        print(f'{cod} {vp}: antes {f(a)} | depois {f(b)} | {d:+.0f}% | painel4cam {a["painel4camadasPx"]}->{b["painel4camadasPx"]} | leg {a["legendaAltura"]}->{b["legendaAltura"]} | T2A {a["detalheT2A_px"]}->{b["detalheT2A_px"]} | erros {a["erros"]} {b["erros"]}')
try:
    R = json.load(open('repeticoes.json'))
    print('\n### repetições')
    for cod, d in R.items():
        for k in sorted(d):
            tot = sum(max(0, x['vezes'] - 1) for x in d[k]); varios = [(x['dado'][:30], x['vezes']) for x in d[k] if x['vezes'] > 1]
            print(cod, k, 'repetições:', tot, varios)
except Exception as e: print('sem repeticoes.json', e)
r = []
for f in sorted(glob.glob('testes-*.json')): r += json.load(open(f))
print('\n### testes', len(r), 'ok', sum(x['ok'] for x in r), 'falhas', [x for x in r if not x['ok']])
