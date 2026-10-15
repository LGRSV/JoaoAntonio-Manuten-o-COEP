# Gráfico resumo antes/depois (valores lidos de medicoes/*.json). python3 grafico.py
import json, matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
J = lambda f: json.load(open('medicoes/' + f))
ca, cd = J('cls-antes.json'), J('cls-depois.json'); aa, ad = J('alimentador-antes.json'), J('alimentador-depois.json')
la, ld = J('layout-carga-antes-cpu4.json'), J('layout-carga-depois-cpu4.json'); ra, rd = J('redesenho-antes.json'), J('redesenho-depois.json')
fig, ax = plt.subplots(1, 4, figsize=(15, 3.8), dpi=110); fig.patch.set_facecolor('#111314')
CA, CD = '#7b858c', '#f08a5d'
def barras(a, titulo, rot, v0, v1, fmt='{:.0f}', unit=''):
    a.set_facecolor('#111314'); x = range(len(rot)); w = .38
    b0 = a.bar([i - w/2 for i in x], v0, w, color=CA, label='antes'); b1 = a.bar([i + w/2 for i in x], v1, w, color=CD, label='depois')
    for b in list(b0) + list(b1): a.text(b.get_x() + b.get_width()/2, b.get_height(), fmt.format(b.get_height()) + unit, ha='center', va='bottom', color='#e7eaeb', fontsize=8)
    a.set_xticks(list(x)); a.set_xticklabels(rot, color='#e7eaeb', fontsize=8); a.set_title(titulo, color='#e7eaeb', fontsize=10, loc='left')
    a.tick_params(colors='#9aa4ab', labelsize=8); [s.set_color('#2a2f33') for s in a.spines.values()]; a.spines['top'].set_visible(False); a.spines['right'].set_visible(False)
k = ['inicio|desktop|base', 'polos|desktop|base', 'alimentador|desktop|base']
g = lambda d, pg: d['desktop|' + pg + '|base']['cls']
barras(ax[0], 'CLS (computador)', ['início', 'polos', 'alimentador'], [g(ca, p) for p in ('inicio', 'polos', 'alimentador')], [g(cd, p) for p in ('inicio', 'polos', 'alimentador')], '{:.4f}')
barras(ax[1], 'Alimentador: TBT na carga (ms, CPU 4x)', ['computador', 'celular'], [aa['desktop|cpu4']['tbt'], aa['celular|cpu4']['tbt']], [ad['desktop|cpu4']['tbt'], ad['celular|cpu4']['tbt']])
barras(ax[2], 'Estilo + layout na carga (ms)', ['normal', 'CPU 4x'], [J('layout-carga-antes-base.json')['estilo+layout'], la['estilo+layout']], [J('layout-carga-depois-base.json')['estilo+layout'], ld['estilo+layout']])
barras(ax[3], 'Redesenho do mapa a cada zoom (ms)', ['visão geral', '+2 níveis'], [ra['cpu4']['zoom+0'], ra['cpu4']['zoom+2']], [rd['cpu4']['zoom+0'], rd['cpu4']['zoom+2']], '{:.0f}')
ax[3].set_xlabel('CPU 4x', color='#9aa4ab', fontsize=8); ax[0].legend(facecolor='#111314', labelcolor='#e7eaeb', fontsize=8, frameon=False)
plt.tight_layout(); plt.savefig('prints/00-resumo-antes-depois.jpg', pil_kwargs={'quality': 85}, facecolor=fig.get_facecolor())
