#!/usr/bin/env python3
"""Gera as páginas do "depois": pega o HTML ao vivo do alimentador (= o que o gerador escreve hoje), refaz o cabeçalho com a função
cabecalho_painel() do gera_trechos.py PATCHADO (tmp/repo/scripts/gera_trechos.py = repo + proto/final.diff) e grava em tmp/depois/<AL>.html.
Os dados (resumo, NAE) vêm do dados.js ao vivo. Uso: python3 gera-paginas.py"""
import json, re, sys, importlib.util, pathlib
AQUI = pathlib.Path(__file__).parent
spec = importlib.util.spec_from_file_location('gt', AQUI / 'tmp/repo/scripts/gera_trechos.py')
sys.path.insert(0, '/home/user/smartled'); sys.path.insert(0, '/home/user/smartled/scripts')
gt = importlib.util.module_from_spec(spec); spec.loader.exec_module(gt)
(AQUI / 'tmp/depois').mkdir(exist_ok=True)
for al in ['LD01072001', 'AL03037009', 'LD02022033', 'AL01015049']:
    h = (AQUI / f'tmp/live/{al}.html').read_text(encoding='utf-8')
    raw = (AQUI / f'tmp/live/{al}.dados.js').read_text(encoding='utf-8')
    D = json.loads(raw[raw.index('=') + 1:].strip().rstrip(';'))
    m = re.search(r'<span class="eyebrow">(.*?) · Alimentador', h)
    import html as H
    se_txt = H.unescape(m.group(1)); se, _, se_nome = se_txt.partition(' ')
    meta = D.get('meta') or {}
    c = dict(alimentador=al, se=se, se_nome=se_nome, resumo=meta['resumo'], nae=D.get('nae'), origem=meta.get('origem') or {})
    # o gerador escreve estas duas linhas no <head>/<body> antes de chamar cabecalho_painel: simula-as
    h = h.replace('<link rel="stylesheet" href="../../assets/alimentador.css">', '<link rel="stylesheet" href="../../assets/alimentador.css">\n<link rel="stylesheet" href="../../assets/painel.css">', 1)
    h = h.replace('<script src="../../assets/lupa-painel.js"></script>', '<script src="../../assets/lupa-painel.js"></script>\n<script src="../../assets/painel.js"></script>', 1)
    h = gt.cabecalho_painel(h, c)
    (AQUI / f'tmp/depois/{al}.html').write_text(h, encoding='utf-8')
    print(al, 'ok', meta['resumo']['trechos'], meta['resumo']['extensao_m'], 'nae oc', len((D.get('nae') or {}).get('oc', [])), 'meses', bool((D.get('nae') or {}).get('meses')), meta.get('origem', {}).get('nae_filtro'))
