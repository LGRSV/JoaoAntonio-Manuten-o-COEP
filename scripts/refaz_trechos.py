"""Refaz a divisão em trechos de um site já gerado só com o JSON canônico (sem KML), depois de mudar as regras.

    python scripts/refaz_trechos.py --site site [--alimentador AL01020023 ...] [--renomear] [--simular]

Para cada alimentador publicado: remonta a rede (nós e vãos, do DJ para as pontas) do JSON canônico e aplica as
regras atuais (alimentador/regras.py). Só o alimentador em que algum trecho muda é regravado, e só depois de conferir
que a rede remontada, com a regra anterior (fusível no tronco sem limite de distância), dá exatamente os trechos
gravados. Regrava: trechos, vãos, chaves, avisos, municípios por trecho, dados do mapa, KMZ, a ligação da limpeza de
faixa (código de cada vão) e a NAE (reassociada com as mesmas regras de scripts/atualiza_critica.py). Depois refaz a
NAE de outro alimentador (nae.ext), o ponto de cada ativo, os trafos do GIS por trecho, as páginas e o relatório.

Nomes: nenhum trecho que já existia muda de nome (mesma chave de início, mesmo nome); trecho novo recebe a próxima
letra livre da sua classe. --renomear: letras em ordem a partir do DJ, como numa geração nova.
Fase: não fica guardada por vão. Trecho dividido fica com a fase do trecho de antes quando ela é certa: o de antes
tinha uma fase só, ou a predominante dele passa da metade do pedaço mesmo que todas as outras caiam nele (aí sem a
divisão por fase). Senão fica sem fase (a página não mostra) e o script avisa.
"""
import argparse
import copy
import heapq
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import ativos_gis as ag  # noqa: E402
import atualiza_critica as ac  # noqa: E402
import gera_trechos as gt  # noqa: E402
from alimentador import daimon, regras, trechos  # noqa: E402


def rede(c):
    """nós, vãos (pai, filho) e raiz do JSON canônico. O nó é o ponto (mesmas coordenadas em todos os vãos que chegam
    nele); a chave fica no nó do seu ponto; a ordem dos vãos é a do leitor do KML (do DJ para as pontas)."""
    pts, nos, vaos = {}, {}, []

    def no(lat, lon, nome):
        if (lat, lon) not in pts:
            nid = f'n{len(pts)}'
            pts[(lat, lon)] = nid
            nos[nid] = dict(tipo='P', nome=nome, poste=nome, lat=lat, lon=lon)
        return pts[(lat, lon)]
    for v in c['vaos']:
        vaos.append((no(v[1], v[0], v[6]), no(v[3], v[2], v[7])))
    raiz = None
    for ch in c['chaves']:
        n = pts.get((ch['lonlat'][1], ch['lonlat'][0]))
        if n is None:
            continue
        t = 'DJ' if ch['tipo'] == 'DJ' else daimon._prefixo(ch['nome'])
        nos[n].update(tipo=t, nome=ch['nome'], poste=ch['poste'])
        raiz = n if t == 'DJ' else raiz
    filhos = defaultdict(list)
    for p, f in vaos:
        filhos[p].append(f)
    dist, fila, ordem = {raiz: 0.0}, [(0.0, raiz)], []
    while fila:
        d, x = heapq.heappop(fila)
        if d > dist[x]:
            continue
        ordem.append(x)
        for y in filhos[x]:
            dd = d + regras.haversine((nos[x]['lat'], nos[x]['lon']), (nos[y]['lat'], nos[y]['lon']))
            if dd < dist.get(y, float('inf')):
                dist[y] = dd
                heapq.heappush(fila, (dd, y))
    pos = {n: i for i, n in enumerate(ordem)}
    vaos.sort(key=lambda pc: pos[pc[1]])
    return nos, vaos, raiz


def analisa(nos, vaos, raiz, ftr_max):
    antes = regras.FTR_MAX_M
    regras.FTR_MAX_M = ftr_max
    try:
        return regras.analisar(nos, vaos, raiz)
    finally:
        regras.FTR_MAX_M = antes


def chave(a, b):
    """Vão pela geometria: (lat, lon) das duas pontas, arredondado como no dados.js."""
    return tuple(round(x, 7) for x in (*a, *b))


def assinatura(ts):
    return [(t['nome'], t['inicio'], tuple(t['fim']), round(t['ext'], 1)) for t in ts]


def regrava(site, c, nos, r1, fixos):
    """JSON canônico, dados.js, KMZ e limpeza.js do alimentador com a divisão nova. Devolve avisos de fase/posição."""
    al, avisos_script = c['alimentador'], []
    ts, D = trechos.dados_mapa(nos, r1, None, fixos)
    idx = {t['nome']: i for i, t in enumerate(ts)}
    r0_avisos = c['_avisos_regras']
    avisos = [a for a in c['avisos'] if a not in r0_avisos] + r1['avisos']

    # o que vem do vão de antes (pela geometria): município principal, divisa e trecho
    velho = {}
    for i, v in enumerate(c['vaos']):
        velho.setdefault(chave((v[1], v[0]), (v[3], v[2])), []).append((i, v))
    lim_velho = {x['vao']: x for x in c.get('limitrofes') or []}
    nome_velho = [t['nome'] for t in c['trechos']]
    vaos_novos, limitrofes, de_velho = [], [], {}
    for i, v in enumerate(r1['vaos']):
        j, vv = velho[chave(v['a'], v['b'])].pop(0)
        de_velho[i] = j
        vaos_novos.append([v['a'][1], v['a'][0], v['b'][1], v['b'][0], idx[v['trecho']], round(v['ext'], 1), v['ini'], v['fim'],
                           vv[8]])
        if j in lim_velho:
            limitrofes.append(dict(vao=i, trecho=v['trecho'], m=lim_velho[j]['m']))
    conj_novo, conj_velho = defaultdict(set), defaultdict(set)
    for i, v in enumerate(r1['vaos']):
        conj_novo[v['trecho']].add(de_velho[i])
    for j, v in enumerate(c['vaos']):
        conj_velho[nome_velho[v[4]]].add(j)
    igual = {n: next((o for o, s in conj_velho.items() if s == conj_novo[n]), None) for n in conj_novo}
    tv = {t['nome']: t for t in c['trechos']}

    por_nome = {t['nome']: t for t in ts}

    def caminho(t):
        cam = [t['nome']]
        while por_nome[cam[-1]]['pai']:
            cam.append(por_nome[cam[-1]]['pai'])
        return cam[::-1]

    def confianca(t):
        motivos = [a for a in avisos if re.search(rf'\b{re.escape(t["inicio"])}\b', a)]
        if t['nome'] == 'T2' and any('sem 2º religador' in a for a in avisos):
            motivos.append('alimentador sem 2º religador: fim do T2 decidido pela regra')
        return ('revisar', motivos) if motivos else ('alta', [])

    canon = []
    for i, t in enumerate(ts):
        o = igual[t['nome']]
        if o is not None:                                   # mesmos vãos de um trecho de antes: municípios e fase dele
            muns, fase, fases = tv[o]['municipios'], tv[o]['fase'], tv[o]['fases']
        else:
            m = {}
            for k, v in enumerate(r1['vaos']):
                if v['trecho'] != t['nome']:
                    continue
                for cod, x in ((lim_velho[de_velho[k]]['m'].items()) if de_velho[k] in lim_velho
                               else [(str(vaos_novos[k][8]), v['ext'])]):
                    m[cod] = m.get(cod, 0) + x
            muns = {cod: round(x, 1) for cod, x in sorted(m.items())}
            pais = {nome_velho[c['vaos'][de_velho[k]][4]] for k, v in enumerate(r1['vaos']) if v['trecho'] == t['nome']}
            fs = {f for p in pais for f in tv[p]['fases']}
            pai = tv[next(iter(pais))] if len(pais) == 1 else None
            outras = sum(x for f, x in pai['fases'].items() if f != max(pai['fases'], key=pai['fases'].get)) if pai and pai['fases'] else None
            if len(fs) == 1:
                fase, fases = tv[next(iter(pais))]['fase'], {next(iter(fs)): round(t['ext'], 1)}
            elif not fs:                                    # o de antes também não tinha fase
                fase, fases = '', {}
            elif outras is not None and t['ext'] - outras > t['ext'] / 2:
                # mesmo com todas as outras fases do trecho de antes neste pedaço, a predominante ainda é mais da metade
                fase, fases = pai['fase'], {}
            else:
                fase, fases = '', {}
                avisos_script.append(f'{al} {t["nome"]}: fase não recalculada (o trecho de antes tinha mais de uma)')
        conf, motivos = confianca(t)
        canon.append(dict(
            nome=t['nome'], classe=gt.classe(t['nome']), ordem=i, zona=t['zona'], tipo=t['tipo'], tronco=t['tronco'],
            inicio=dict(chave=t['inicio'], tipo=t['inicio_tipo'], poste=t['inicio_poste'], lonlat=[t['inicio_lon'], t['inicio_lat']]),
            fim=t['fim'], fim_lonlat=[[p[1], p[0]] for p in t['fim_pts']], pai=t['pai'], caminho=caminho(t),
            passa=t['passa'], derivacoes=t['derivacoes'], ext_m=t['ext'], vaos=t['qtd'], municipios=muns,
            fase=fase, fases=fases, confianca=conf, motivos=motivos))
        D['trechos'][i]['fase'], D['trechos'][i]['fases'] = fase, fases

    resumo = dict(c['resumo'], extensao_m=round(r1['total_m'], 1), trechos=len(ts),
                  religadores=sum(a['tipo'] == '79' for a in r1['ativos']),
                  fusiveis=sum(a['tipo'] in regras.FUSIVEIS for a in r1['ativos']),
                  seccionamentos=sum(a['tipo'] == 'SEC' for a in r1['ativos']),
                  fusiveis_tronco=sum(a['tipo'] == 'FTR' for a in r1['ativos']))
    for k in gt.CLASSES:
        resumo[k] = dict(n=sum(gt.classe(t['nome']) == k for t in ts),
                         m=round(sum(t['ext'] for t in ts if gt.classe(t['nome']) == k), 1))
    # chaves fora da topologia: com ponto, o trecho é refeito; sem ponto (semeadas pela NAE), fica o de antes
    stp = []
    for q in c.get('chaves_sem_topologia') or []:
        if q[1] is not None:
            stp.append(gt.sem_topologia({q[0]: (q[2], q[1])}, r1)[0] if q[0] not in {a['nome'] for a in r1['ativos']} else q)
        else:
            stp.append(q)
            if q[3] and igual.get(q[3]) is None and q[3] in conj_novo:
                avisos_script.append(f'{al} {q[0]}: chave fora da topologia sem ponto, trecho {q[3]} mantido (o trecho mudou)')
    c.pop('_avisos_regras')
    c.update(resumo=resumo, trechos=canon, vaos=vaos_novos, limitrofes=limitrofes, avisos=avisos,
             chaves=[dict(nome=a['nome'], tipo=a['tipo'], lonlat=[a['lon'], a['lat']], poste=a['poste']) for a in r1['ativos']],
             chaves_sem_topologia=stp)
    c['validacao'] = gt.validar(c)
    gt.grava_json(site / 'dados' / 'alimentadores' / f'{al}.json', c)

    pasta = site / 'alimentadores' / al
    cab, D_velho = ag.le_js(pasta / 'dados.js')
    D['nae'] = c.get('nae')
    D['meta'] = gt.meta_interface(c)
    (pasta / 'dados.js').write_text(cab + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    gt.kmz_fixo(nos, r1, al, pasta / f'{al}-trechos.kmz', fixos)
    # limpeza de faixa: a OS fica ligada ao código do vão, que muda com a nova numeração (mesma geometria)
    lj = pasta / 'limpeza.js'
    if lj.exists() and 'window.LIMPEZA = null' not in lj.read_text(encoding='utf-8'):
        lcab, lp = ag.le_js(lj)
        id_velho = {d[5]: chave((d[0], d[1]), (d[2], d[3])) for d in D_velho['vaos']}
        id_novo = {chave((d[0], d[1]), (d[2], d[3])): d[5] for d in D['vaos']}
        lp['vaos'] = {id_novo[id_velho[k]]: v for k, v in lp['vaos'].items()}
        lj.write_text(lcab + json.dumps(lp, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    return avisos_script


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--site', required=True)
    ap.add_argument('--alimentador', action='append', help='só estes (repetir)')
    ap.add_argument('--renomear', action='store_true', help='letras em ordem a partir do DJ (muda nome de trechos)')
    ap.add_argument('--simular', action='store_true', help='só conta o que mudaria, sem gravar')
    a = ap.parse_args(argv)
    site = Path(a.site)
    mudou, avisos, erros = [], [], []
    for jf in sorted((site / 'dados' / 'alimentadores').glob('*.json')):
        c = json.loads(jf.read_text(encoding='utf-8'))
        al = c['alimentador']
        if (a.alimentador and al not in a.alimentador) or c['validacao']['status'] == 'falha' or not c.get('vaos') \
                or not (site / 'alimentadores' / al / 'dados.js').exists():
            continue
        nos, vaos, raiz = rede(c)
        r1 = analisa(nos, vaos, raiz, regras.FTR_MAX_M)
        fixos = None if a.renomear else {t['inicio']['chave']: t['nome'] for t in c['trechos']}
        ts1 = trechos.segmentar(copy.deepcopy(nos), copy.deepcopy(r1), fixos)
        velhos = [(t['nome'], t['inicio']['chave'], tuple(t['fim']), round(t['ext_m'], 1)) for t in c['trechos']]
        if assinatura(ts1) == velhos:
            continue                                        # nada muda neste alimentador
        r0 = analisa(nos, vaos, raiz, None)
        if assinatura(trechos.segmentar(copy.deepcopy(nos), copy.deepcopy(r0))) != velhos:
            erros.append(f'{al}: a rede remontada não reproduz os trechos gravados; ficou como estava')
            continue
        novos = {t['nome'] for t in ts1} - {t['nome'] for t in c['trechos']}
        mudou.append((al, sorted(novos), len(ts1) - len(c['trechos'])))
        if a.simular:
            continue
        c['_avisos_regras'] = r0['avisos']
        avisos += regrava(site, c, nos, r1, fixos)
    print(f'{len(mudou)} alimentador(es) com trechos novos ou mudados; {sum(x[2] for x in mudou)} trecho(s) a mais')
    for e in erros + avisos:
        print('  ' + e)
    if a.simular or not mudou:
        return 1 if erros else 0
    # NAE dos alimentadores regravados: mesmas regras da Crítica, com os trechos novos
    cad = ac.Cadastro(site)
    for al, _, _ in mudou:
        jf = site / 'dados' / 'alimentadores' / f'{al}.json'
        c = json.loads(jf.read_text(encoding='utf-8'))
        if not (c.get('nae') or {}).get('oc'):
            continue
        oc = cad.associa(al, [dict({k: v for k, v in o.items() if k not in ('lonlat', 'hoje')}, _cand=[o['prob'], o['ativo']])
                              for o in c['nae']['oc']])
        ag.grava(site, al, lambda n, oc=oc: n.__setitem__('oc', copy.deepcopy(oc)))
    ag.aplica(site, pts=cad.trafos)                 # trafos do GIS por trecho (ativos_kml)
    ag.outros(site, pts=cad.trafos)                 # NAE com o ativo hoje em outro alimentador (nae.ext)
    ag.posicoes(site, pts=cad.trafos)               # ponto do ativo de cada NAE com trecho
    dados, man = gt.interface(site)
    rel = site / 'relatorio.md'
    sem_kml = re.findall(r'^- (\S+): sem KML do Daimon', rel.read_text(encoding='utf-8'), re.M) if rel.exists() else []
    gt.relatorio(site, dados, man, sem_kml)
    return 0 if gt.validar_saida(site) and not erros else 1


if __name__ == '__main__':
    sys.exit(main())
