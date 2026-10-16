"""Divide em trechos os alimentadores da exceção SEM_CHAVES (gera_trechos.py) com as chaves de sem_chaves.json.

    python scripts/sem_chaves.py <pasta do site>

O GIS desses alimentadores veio sem o Fechado.kmz e eles não têm rede no Daimon: o JSON canônico sai com a rede inteira
num trecho só. Este script põe as chaves de sem_chaves.json nos nós da rede (lonlat), aplica a regra de sempre
(regras.analisar) e regrava JSON, dados.js, KMZ e limpeza.js como o refaz_trechos.py; a fase de cada trecho vem de
sem_chaves.json (ela não fica guardada por vão). Depois reassocia o NAE das ocorrências e os trafos do GIS aos trechos
novos. Em seguida rode o gera_trechos.py --so-interface e os scripts das camadas (inspecao, manutencao, executadas,
ativos_js, nae_rede), como numa atualização normal. Alimentador já dividido (todas as chaves no JSON) fica como está.
"""
import copy
import json
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI)); sys.path.insert(0, str(AQUI.parent))
import ativos_gis as ag  # noqa: E402
import atualiza_critica as ac  # noqa: E402
import gera_trechos as gt  # noqa: E402
import refaz_trechos as rt  # noqa: E402
from alimentador import regras  # noqa: E402


def main(argv=None):
    site = Path((argv or sys.argv[1:])[0])
    lista = json.loads((AQUI / 'sem_chaves.json').read_text(encoding='utf-8'))
    mudou = []
    for al in sorted(gt.SEM_CHAVES):
        jf = site / 'dados' / 'alimentadores' / f'{al}.json'
        if al not in lista or not jf.exists():
            continue
        c = json.loads(jf.read_text(encoding='utf-8'))
        ja = {ch['nome'] for ch in c['chaves']}
        novas = [ch for ch in lista[al]['chaves'] if ch['nome'] not in ja]
        if not novas:
            print(f'{al}: já dividido ({len(c["trechos"])} trechos)')
            continue
        nos0, vaos0, raiz0 = rt.rede(c)
        c['_avisos_regras'] = rt.analisa(nos0, vaos0, raiz0, regras.FTR_MAX_M)['avisos']
        c['chaves'] += [{k: ch[k] for k in ('nome', 'tipo', 'lonlat', 'poste')} for ch in novas]
        nos, vaos, raiz = rt.rede(c)
        r1 = rt.analisa(nos, vaos, raiz, regras.FTR_MAX_M)
        rt.regrava(site, c, nos, r1, None)
        # fase de cada trecho (sem_chaves.json), no canônico e no dados.js
        fases = lista[al]['fases']
        c = json.loads(jf.read_text(encoding='utf-8'))
        novo = {}
        for t in c['trechos']:
            d = fases.get(t['nome'], {})
            t['fases'] = d
            t['fase'] = gt.fase_txt('' if not d else max(sorted(d), key=lambda k: d[k]).replace('não informado', ''))
            novo[t['nome']] = (t['fase'], t['fases'])
        c['validacao'] = gt.validar(c)
        gt.grava_json(jf, c)
        js = site / 'alimentadores' / al / 'dados.js'
        cab, D = ag.le_js(js)
        for t in D['trechos']:
            t['fase'], t['fases'] = novo[t['nome']]
        D['meta']['validacao'] = c['validacao']          # a página mostra a validação do dados.js
        js.write_text(cab + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
        print(f'{al}: {len(novas)} chaves -> {len(c["trechos"])} trechos ({c["validacao"]["status"]})')
        mudou.append(al)
    if not mudou:
        return
    cad = ac.Cadastro(site)
    for al in mudou:
        c = json.loads((site / 'dados' / 'alimentadores' / f'{al}.json').read_text(encoding='utf-8'))
        if (c.get('nae') or {}).get('oc'):
            oc = cad.associa(al, [dict({k: v for k, v in o.items() if k not in ('lonlat', 'hoje')}, _cand=[o['prob'], o['ativo']])
                                  for o in c['nae']['oc']])
            ag.grava(site, al, lambda n, oc=oc: n.__setitem__('oc', copy.deepcopy(oc)))
    ag.aplica(site, pts=cad.trafos)
    ag.outros(site, pts=cad.trafos)
    ag.posicoes(site, pts=cad.trafos)


if __name__ == '__main__':
    main()
