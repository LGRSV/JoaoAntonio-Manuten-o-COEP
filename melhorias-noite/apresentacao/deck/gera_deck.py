"""Apresentação do ARGOS em slides (estilo PowerPoint), com todos os textos editáveis.

Os textos ficam em <saida>/textos.js (window.ARGOS_TEXTOS): capa, título, bloco, tempo, tópicos e frase de cada slide,
a marca, o endereço do quadro e os rótulos. A página (index.html) só desenha a partir dele, e o botão "Editar textos"
(ou a tecla E) deixa cada texto editável ali mesmo (ver molde.html).

    python gera_deck.py <saida>                 index.html, artifact.html e img/; textos.js só se ainda não existe
    python gera_deck.py <saida> --refaz-textos  textos.js de novo a partir do roteiro (perde o que foi editado)
    python gera_deck.py <saida> --artifact      também artifact.html (sem doctype/head, para o Artifact)

O roteiro de origem é ../revisao/README.md (slides, blocos, tempos e a frase de cada bloco); só os prints de computador
(-d.jpg). index.html é o documento completo (repositório, GitHub Pages ou abrir no navegador).
"""
import html
import json
import re
import shutil
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
REV = AQUI.parent / 'revisao'
args = [a for a in sys.argv[1:] if not a.startswith('--')]
SAIDA = Path(args[0] if args else AQUI / 'site')
REFAZ = '--refaz-textos' in sys.argv


def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    t = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', t)
    return re.sub(r'(?<![\w*])\*([^*\n]+)\*(?!\*)', r'<em>\1</em>', t)


def textos():
    t = (REV / 'README.md').read_text(encoding='utf-8')
    frases = {}
    for linha in t.splitlines():
        m = re.match(r'^\|\s*([^|]+?)\s*\|\s*\d[^|]*\|\s*([^|]+?)\s*\|\s*"?(.+?)"?\s*\|$', linha)
        if m and m.group(1) != 'Bloco':
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
        topicos = [inline(b) for b in re.findall(r'(?m)^- (.+)$', resto)]
        imgs = [dict(src='img/' + Path(f).name, alt=a or titulo)
                for a, f in re.findall(r'!\[([^\]]*)\]\((prints/[^)]+-d\.jpg)\)', resto)]
        tempo, frase = frases.get(bloco, ('', ''))
        s = dict(titulo=inline(titulo), bloco=html.escape(bloco), tempo=tempo, frase=html.escape(frase), opcional=opcional,
                 topicos=topicos, imgs=imgs)
        if not slides:                                   # capa: o 1º tópico vira o subtítulo
            s['subtitulo'] = topicos[0] if topicos else ''
            s['topicos'] = topicos[1:]
        slides.append(s)
    assert len(slides) == 23, len(slides)
    return dict(
        titulo='ARGOS Apresentação',
        marca=dict(nome='ARGOS', sub='Manutenção'),
        url='lgrsv.github.io/vera-vegeta-o-back/teste',
        rotulos=dict(dica='← → ou clique para avançar · F tela cheia · G todos os slides · E editar textos',
                     grade_titulo='Todos os slides', opcional='se sobrar tempo', pode_pular='pode pular',
                     reproduzir='Reproduzir', notas='Notas', todos='Todos', tela='Tela cheia', editar='Editar textos',
                     editando='Editando: clique num texto para mudar. Enter num tópico cria outro; tópico vazio sai ao salvar.'),
        slides=slides)


SAIDA.mkdir(parents=True, exist_ok=True)
(SAIDA / 'img').mkdir(exist_ok=True)
arq = SAIDA / 'textos.js'
novo = REFAZ or not arq.exists()
if novo:
    arq.write_text('// Textos da apresentação do ARGOS. Pode editar aqui (mantendo as aspas) ou pelo botão "Editar textos" da página.\n'
                   'window.ARGOS_TEXTOS = ' + json.dumps(textos(), ensure_ascii=False, indent=1) + ';\n', encoding='utf-8')
dados = json.loads(arq.read_text(encoding='utf-8').split('=', 1)[1].strip().rstrip(';'))
usadas = sorted({Path(i['src']).name for s in dados['slides'] for i in s['imgs']})
for nome in usadas:
    shutil.copyfile(REV / 'prints' / nome, SAIDA / 'img' / nome)
pag = (AQUI / 'molde.html').read_text(encoding='utf-8')
if '--artifact' in sys.argv:                                  # cópia sem doctype/head, para publicar como Artifact
    (SAIDA / 'artifact.html').write_text(pag, encoding='utf-8')
cab, _, resto = pag.partition('<style>')
doc = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
       '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
       '<meta name="robots" content="noindex, nofollow">\n'
       + cab.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '') + '<style>' +
       resto.replace('</style>', '</style>\n</head>\n<body>', 1) + '\n</body>\n</html>\n')
(SAIDA / 'index.html').write_text(doc, encoding='utf-8')
print(f'{len(dados["slides"])} slides · {len(usadas)} prints · textos.js {"novo" if novo else "mantido"}')
