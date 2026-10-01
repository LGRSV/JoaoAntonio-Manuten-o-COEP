"""Trechos nomeados pelos ativos: T1, T2, T2-A…, T3-A…, T4-A…, cada um com ativo de início e fim.

Regras (a partir do resultado de regras.analisar):
    - T1: do DJ até o 1º religador. Derivação em poste sem ativo continua no T1.
    - T2: rede T2 do tronco (passa pelos religadores do tronco). Derivação em poste sem ativo continua no T2.
    - T2-A, T2-B…: rede T2 que começa num religador fora do tronco (ou no último religador do tronco,
      quando dele só sai ramal). A letra só nasce em ativo.
    - T3-A, T3-B…: cada fusível (03/33/02) que sai do T1/T2, em ordem de distância a partir do DJ:
      A…Z, AA, AB…  Fusível dentro de fusível segue a zona das regras (T4-A…, T5-A…), com sequência própria.
    - Chave de seccionamento (SEC), 88 e outras não criam trecho.
Fim do trecho: o religador do tronco (ou de dentro do ramal) onde começa o T2 seguinte; sem ele, o ponto do trecho
mais distante do DJ (poste de fim de linha ou ativo onde passa para outro trecho). Religador fora do tronco que sai
do T1/T2 é derivação, não fim.
"""
import json
from collections import defaultdict
from pathlib import Path
from xml.sax.saxutils import escape

FUSIVEIS = {'03', '33', '02'}


def letras(i):
    """0 → A, 25 → Z, 26 → AA, 27 → AB…"""
    s, i = '', i + 1
    while i:
        i, r = divmod(i - 1, 26)
        s = chr(65 + r) + s
    return s


def segmentar(nos, res):
    vaos = res['vaos']
    tipo_at = {a['nome']: a['tipo'] for a in res['ativos']}
    filhos = defaultdict(list)
    for v in vaos:
        filhos[v['_p']].append(v)
    chegada = {v['_c']: v for v in vaos}
    raiz = next(v['_p'] for v in vaos if v['_p'] not in chegada)
    tipo = lambda n: 'P' if nos[n]['tipo'] == 'P' else tipo_at.get(nos[n]['nome'], nos[n]['tipo'])
    dist_no = lambda n: chegada[n]['dist_dj'] if n in chegada else 0.0

    # chave do trecho de cada vão, da raiz para as pontas
    chave_vao, inicio_no = {}, {}
    pilha = [(raiz, None)]
    while pilha:
        n, atual = pilha.pop()
        t = tipo(n)
        for v in filhos[n]:
            if t == 'DJ':
                k = 'T1'
            elif t in FUSIVEIS:
                k = ('F', n)
            elif t == '79':
                k = 'T2' if any(x['tronco'] for x in filhos[n]) else ('R', n)
            else:
                k = atual
            if k != atual or t == '79':
                ns = inicio_no.setdefault(k, [])
                if n not in ns:
                    ns.append(n)
            chave_vao[v['id']] = k
            pilha.append((v['_c'], k))

    # nomes: letras em ordem de distância do ativo de início
    nome_de = {'T1': 'T1', 'T2': 'T2'}
    ramais = sorted((k for k in inicio_no if k[0] == 'R'), key=lambda k: dist_no(k[1]))
    nome_de.update({k: f'T2-{letras(i)}' for i, k in enumerate(ramais)})
    zona_k = {k: 1 if k == 'T1' else 2 if k == 'T2' or k[0] == 'R' else filhos[ns[0]][0]['zona'] for k, ns in inicio_no.items()}
    por_zona = defaultdict(list)
    for k in inicio_no:
        if k[0] == 'F':
            por_zona[zona_k[k]].append(k)
    for z, ks in por_zona.items():
        ks.sort(key=lambda k: dist_no(k[1]))
        nome_de.update({k: f'T{z}-{letras(i)}' for i, k in enumerate(ks)})

    # monta os trechos
    tr = {}
    for k, ns in inicio_no.items():
        ns = sorted(ns, key=dist_no)
        n0 = ns[0]
        z = zona_k[k]
        pai = chave_vao[chegada[n0]['id']] if n0 in chegada else None
        tr[k] = dict(nome=nome_de[k], zona=z, tipo='principal' if k in ('T1', 'T2') else 'ramal' if k[0] == 'R' else 'fusivel',
                     inicio=nos[n0]['nome'], inicio_tipo=tipo(n0), inicio_poste=nos[n0]['poste'],
                     inicio_lat=nos[n0]['lat'], inicio_lon=nos[n0]['lon'], dist_inicio=round(dist_no(n0)),
                     passa=[nos[n]['nome'] for n in ns[1:]], pai=nome_de[pai] if pai else None,
                     ext=0.0, qtd=0, vaos=[], fim=[], derivacoes=[], _nos=ns)
    for v in vaos:
        t = tr[chave_vao[v['id']]]
        if v['zona'] != t['zona']:
            raise ValueError(f"vão {v['id']} é T{v['zona']} mas caiu no trecho {t['nome']}")
        t['ext'] += v['ext']
        t['qtd'] += 1
        t['vaos'].append(v['id'])
        v['trecho'] = t['nome']

    # fim e derivações (em ordem de distância do DJ). O T2 seguinte é fim do trecho quando começa num religador
    # do tronco (T1 → T2, fim do tronco → T2-A) ou dentro de um ramal T2; religador fora do tronco é derivação.
    no_tronco = {a['nome']: a['no_tronco'] for a in res['ativos']}
    for t in sorted(tr.values(), key=lambda t: t['dist_inicio']):
        if t['pai'] is None:
            continue
        pai = next(x for x in tr.values() if x['nome'] == t['pai'])
        if t['zona'] <= 2 and (pai['tipo'] != 'principal' or no_tronco[t['inicio']]):
            pai['fim'].append(t['inicio'])
        else:
            pai['derivacoes'].append(t['nome'])
    for k, t in tr.items():
        if not t['fim']:   # ponto mais distante do DJ: fim de linha ou ativo onde passa para outro trecho
            cands = [(v['dist_dj'], f"fim de linha · poste {v['fim']}") for v in vaos
                     if chave_vao[v['id']] == k and not filhos[v['_c']]]
            cands += [(x['dist_inicio'], x['inicio']) for x in tr.values() if x['nome'] in t['derivacoes']]
            t['fim'] = [max(cands)[1]]
        t['ext'] = round(t['ext'], 1)
        t['rotulo'] = _ponto_rotulo(t, vaos, chave_vao, chegada, k)
        del t['_nos']
    grupo = {'principal': 0, 'ramal': 1, 'fusivel': 2}
    return sorted(tr.values(), key=lambda t: (grupo[t['tipo']], t['zona'], t['dist_inicio']))


def _ponto_rotulo(t, vaos, chave_vao, chegada, k):
    """Meio do caminho mais longo do trecho (do início até o vão mais distante do DJ)."""
    proprios = [v for v in vaos if chave_vao[v['id']] == k]
    v = max(proprios, key=lambda v: v['dist_dj'])
    cam = []
    while v is not None and chave_vao[v['id']] == k:
        cam.append(v)
        v = chegada.get(v['_p'])
    cam.reverse()
    total, acc = sum(x['ext'] for x in cam), 0.0
    for x in cam:
        acc += x['ext']
        if acc >= total / 2:
            return [round((x['a'][0] + x['b'][0]) / 2, 7), round((x['a'][1] + x['b'][1]) / 2, 7)]
    return [round(cam[-1]['b'][0], 7), round(cam[-1]['b'][1], 7)]


def mapa(nos, res, nome, caminho):
    """Mapa HTML com os trechos (uma visão só): DJ e religadores com código, fusíveis como ponto, 88 escondidas."""
    ts = segmentar(nos, res)
    idx = {t['nome']: i for i, t in enumerate(ts)}
    inicio_de = {t['inicio']: t['nome'] for t in ts if t['tipo'] == 'fusivel'}
    r7 = lambda x: round(x, 7)
    dados = dict(
        trechos=[{k: v for k, v in t.items() if k != 'vaos'} for t in ts],
        vaos=[[r7(v['a'][0]), r7(v['a'][1]), r7(v['b'][0]), r7(v['b'][1]), idx[v['trecho']], v['id'], v['ini'], v['fim'],
               round(v['ext'], 1)] for v in res['vaos']],
        principais=[dict(nome=a['nome'], t=a['tipo'], lat=r7(a['lat']), lon=r7(a['lon']), poste=a['poste'])
                    for a in res['ativos'] if a['tipo'] in ('DJ', '79')],
        fusiveis=[dict(nome=a['nome'], t=a['tipo'], lat=r7(a['lat']), lon=r7(a['lon']), trecho=inicio_de.get(a['nome']))
                  for a in res['ativos'] if a['tipo'] in FUSIVEIS or a['tipo'] == 'SEC'])
    modelo = (Path(__file__).resolve().parent / 'mapa_trechos.html').read_text(encoding='utf-8')
    html = (modelo.replace('%%TITULO%%', escape(nome)).replace('%%ROTULO%%', escape(f'Alimentador {nome}'))
            .replace('%%DADOS%%', json.dumps(dados, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')))
    assert '%%' not in html
    Path(caminho).write_text(html, encoding='utf-8')
    return ts
