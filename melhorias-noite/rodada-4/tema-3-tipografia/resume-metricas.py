# tabela antes/depois a partir de metricas-antes.json e metricas-depois.json (soma dos 8 polos por tela)
import json
a = json.load(open('metricas-antes.json')); d = json.load(open('metricas-depois.json'))
def soma(L, tela):
    r = [x for x in L if x['tela'] == tela]
    return {k: sum(x[k] for x in r) for k in ('n', 'nomeDentro', 'nomeFio', 'soNumero', 'semRotulo', 'sobrep', 'sobUI', 'cortados')}
print('| tela | município | nome dentro | nome ao lado (fio) | só número | sem rótulo | sobreposições |')
print('|---|---|---|---|---|---|---|')
nomes = {'desk': 'computador 1440x900', 'notebook': 'notebook 1280x720', 'tablet': 'tablet 820x1100', 'cel': 'celular 390x844'}
for t in ('desk', 'notebook', 'tablet', 'cel'):
    x, y = soma(a, t), soma(d, t)
    f = lambda k: f"{x[k]} → {y[k]}"
    print(f"| {nomes[t]} | {y['n']} | {f('nomeDentro')} | {f('nomeFio')} | {f('soNumero')} | {f('semRotulo')} | {x['sobrep']+x['sobUI']+x['cortados']} → {y['sobrep']+y['sobUI']+y['cortados']} |")
print()
print('por polo (celular): polo | dentro | fio | só número | sem rótulo  (antes → depois)')
for p in [x['polo'] for x in a if x['tela'] == 'cel']:
    x = next(r for r in a if r['tela'] == 'cel' and r['polo'] == p); y = next(r for r in d if r['tela'] == 'cel' and r['polo'] == p)
    print(f"| {p} ({y['n']}) | {x['nomeDentro']} → {y['nomeDentro']} | {x['nomeFio']} → {y['nomeFio']} | {x['soNumero']} → {y['soNumero']} | {x['semRotulo']} → {y['semRotulo']} |")
