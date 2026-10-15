"""Monta a apresentação do ARGOS em slides (estilo PowerPoint) a partir do roteiro revisado.

Lê melhorias-noite/apresentacao/revisao/README.md (slides, blocos, tempos e a frase de cada bloco) e usa só os prints
de computador (-d.jpg). Escreve em <saida>/: index.html (documento completo, para o GitHub Pages), artifact.html (o
mesmo conteúdo sem doctype/head, para o Artifact) e img/.

    python gera_deck.py <saida>
"""
import html
import json
import re
import shutil
import sys
from pathlib import Path

REV = Path(__file__).resolve().parent.parent / 'revisao'
AQUI = Path(__file__).resolve().parent
SAIDA = Path(sys.argv[1] if len(sys.argv) > 1 else AQUI / 'out')


def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    t = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', t)
    return re.sub(r'(?<![\w*])\*([^*\n]+)\*(?!\*)', r'<em>\1</em>', t)


def ler():
    t = (REV / 'README.md').read_text(encoding='utf-8')
    frases = {}
    for linha in t.splitlines():
        m = re.match(r'^\|\s*([^|]+?)\s*\|\s*\d[^|]*\|\s*([^|]+?)\s*\|\s*"?(.+?)"?\s*\|$', linha)
        if m and m.group(1) not in ('Bloco',):
            frases[m.group(1)] = (m.group(2).replace(' a ', '–'), m.group(3))
    corpo = t.split('\n# Slides', 1)[1].split('\n# Glossário', 1)[0]
    slides, bloco = [], None
    for parte in re.split(r'(?m)^(?=##+ )', corpo):
        cab, _, resto = parte.partition('\n')
        m = re.match(r'^## (.+?) \(', cab)
        if m:
            bloco = m.group(1)
            continue
        m = re.match(r'^### Slide (\d+)\. (.+)$', cab)
        if not m:
            continue
        titulo = m.group(2).strip()
        opcional = bool(re.search(r'\(se sobrar tempo\)', titulo))
        titulo = re.sub(r'\s*\(se sobrar tempo\)', '', titulo)
        bullets = [inline(b) for b in re.findall(r'(?m)^- (.+)$', resto)]
        imgs = [(a, f) for a, f in re.findall(r'!\[([^\]]*)\]\((prints/[^)]+-d\.jpg)\)', resto)]
        tempo, frase = frases.get(bloco, ('', ''))
        slides.append(dict(n=int(m.group(1)), titulo=titulo, opcional=opcional, bloco=bloco, tempo=tempo,
                           frase=frase, bullets=bullets, imgs=imgs))
    return slides


def slide_html(s, total):
    capa = s['n'] == 1
    lazy = '' if s['n'] <= 2 else 'loading="lazy" '
    figs = ''.join(
        f'<img class="{"vis" if k == 0 else ""}" src="img/{Path(f).name}" alt="{html.escape(a or s["titulo"])}"'
        f' width="1440" height="900" {lazy}decoding="async">'
        for k, (a, f) in enumerate(s['imgs']))
    pontos = ''.join(f'<i class="{"vis" if k == 0 else ""}"></i>' for k in range(len(s['imgs']))) if len(s['imgs']) > 1 else ''
    lis = ''.join(f'<li style="--k:{k}">{b}</li>' for k, b in enumerate(s['bullets']))
    opc = '<span class="opc">se sobrar tempo</span>' if s['opcional'] else ''
    lis_capa = ''.join(f'<li style="--k:{k}">{b}</li>' for k, b in enumerate(s['bullets'][1:]))
    pontos_div = f'<div class="pontos">{pontos}</div>' if pontos else ''
    if capa:
        texto = (f'<div class="txt"><p class="marca"><b>ARGOS</b><span>Manutenção</span></p>'
                 f'<h2>{html.escape(s["bullets"][0] if s["bullets"] else s["titulo"])}</h2>'
                 f'<ul>{lis_capa}</ul></div>')
    else:
        texto = (f'<div class="txt"><p class="sobre">{html.escape(s["bloco"])}{opc}</p>'
                 f'<h2>{inline(s["titulo"])}</h2><ul>{lis}</ul></div>')
    denso = sum(len(re.sub('<[^>]+>', '', b)) for b in s['bullets']) + 2 * len(s['titulo']) > 520
    return (f'<section class="slide{" capa" if capa else ""}{" denso" if denso else ""}" id="s{s["n"]}" data-n="{s["n"]}" aria-roledescription="slide" '
            f'aria-label="{s["n"]} de {total}: {html.escape(s["titulo"])}">'
            f'{texto}<figure class="quadro"><div class="barra-nav" aria-hidden="true"><i></i><i></i><i></i>'
            f'<span>lgrsv.github.io/vera-vegeta-o-back/teste</span></div><div class="tela">{figs}</div>'
            f'{pontos_div}</figure></section>')


slides = ler()
assert len(slides) == 23, len(slides)
(SAIDA / 'img').mkdir(parents=True, exist_ok=True)
usadas = sorted({Path(f).name for s in slides for _, f in s['imgs']})
for nome in usadas:
    shutil.copyfile(REV / 'prints' / nome, SAIDA / 'img' / nome)
total = len(slides)
notas = {s['n']: dict(bloco=s['bloco'], tempo=s['tempo'], frase=s['frase'], opcional=s['opcional']) for s in slides}
miolo = ''.join(slide_html(s, total) for s in slides)
grade = ''.join(f'<button class="mini" data-ir="{s["n"]}"><img src="img/{Path(s["imgs"][0][1]).name}" alt="" loading="lazy">'
                f'<span><b>{s["n"]:02d}</b> {inline(s["titulo"])}</span></button>' for s in slides)
molde = (AQUI / 'molde.html').read_text(encoding='utf-8')
pag = (molde.replace('{{SLIDES}}', miolo).replace('{{GRADE}}', grade).replace('{{TOTAL}}', str(total))
       .replace('{{NOTAS}}', json.dumps(notas, ensure_ascii=False)))
(SAIDA / 'artifact.html').write_text(pag, encoding='utf-8')
cab, _, resto = pag.partition('<style>')
doc = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
       '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
       + cab.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '') + '<style>' +
       resto.replace('</style>', '</style>\n</head>\n<body>', 1) + '\n</body>\n</html>\n')
(SAIDA / 'index.html').write_text(doc, encoding='utf-8')
print(f'{total} slides · {len(usadas)} prints · {sum((SAIDA / "img" / n).stat().st_size for n in usadas) / 1e6:.1f} MB')
