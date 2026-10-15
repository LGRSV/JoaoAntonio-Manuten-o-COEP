#!/usr/bin/env python3
# README.md = README.template.md + tabelas geradas (medicoes/tabelas.md, verifica.md e o tema claro). python3 monta-readme.py
import json, subprocess
J = lambda f: json.load(open('medicoes/' + f))
subprocess.run(['node', 'tabelas.js'], stdout=subprocess.DEVNULL, check=True)
tab = open('medicoes/tabelas.md').read().replace('## ', '### ')
tab += '\nExceções contadas como atendidas: o link "Leaflet" da atribuição (texto em linha, exigido pela licença); a orelhinha da legenda ABERTA (48x22: o clique vale no painel inteiro, `leg.addEventListener(\'click\')`); no "menu-aberto" a orelhinha fica atrás do menu. Os 111 a 139 paths de município continuam menores que 44 px no estado: é a área do tema 2 (zoom por pinça).\n'
f = lambda v, d=0: '–' if v is None else (f'{v:.{d}f}'.replace('.', ',') if d else f'{round(v):,}'.replace(',', '.'))
par = lambda a, b, d=0: f'{f(a, d)} → {f(b, d)}'
cl = ['**CLS (mediana de 2 cargas)**\n', '| Página · dispositivo · perfil | CLS antes → depois |', '|---|---|']
ca, cd = J('cls-antes-claro.json'), J('cls-depois-claro.json')
for k in ca:
    vp, pg, pf = k.split('|'); cl.append(f"| {pg} · {vp.replace('desktop','computador')} · {pf.replace('base','normal').replace('cpu4','CPU 4x')} | {par(ca[k]['cls'], cd[k]['cls'], 4)} |")
aa, ad = J('alimentador-antes-claro.json'), J('alimentador-depois-claro.json')
cl += ['', '**Página do alimentador LD02022033, carga (mediana de 2)**\n', '| Dispositivo · perfil | Pronto (ms) | TBT (ms) | Maior long task (ms) |', '|---|---|---|---|']
for k in aa:
    cl.append(f"| {k.replace('desktop','computador').replace('base','normal').replace('cpu4','CPU 4x').replace('|',' · ')} | {par(aa[k]['pronto'], ad[k]['pronto'])} | {par(aa[k]['tbt'], ad[k]['tbt'])} | {par(aa[k]['ltMax'], ad[k]['ltMax'])} |")
cl.append('\nO tema claro não muda o que o protótipo faz; a oscilação do TBT entre as duas rodadas (escuro e claro) mostra o tamanho do ruído da máquina compartilhada, e só a direção (CPU 4x: pronto e TBT menores) é confiável.')
ver = open('medicoes/verifica.md').read()
t = open('README.template.md').read().replace('{{TABELAS}}', tab).replace('{{CLARO}}', '\n'.join(cl)).replace('{{VERIFICA}}', ver)
open('README.md', 'w').write(t)
print(len(t), 'bytes')
