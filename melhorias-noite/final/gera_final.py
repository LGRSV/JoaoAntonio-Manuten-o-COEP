"""Monta o Artifact final da noite de melhorias do ARGOS (uma página, duas abas: Melhorias e Apresentação).

Lê melhorias-noite/rodada-4/tema-K-*/FINAL.md (+ prints-finais/), o resumo de cada rodada (README de cada tema) e
melhorias-noite/apresentacao/revisao/README.md (+ prints/). Copia as imagens usadas para final/img/ e escreve
final/argos-noite.html. O texto do topo (o que entrou no /teste/, recomendações e decisões) vem de topo.json.
"""
import html
import json
import re
import shutil
import sys
from pathlib import Path

RAIZ = Path('/home/user/smartled/melhorias-noite')
OUT = Path(__file__).resolve().parent
IMG = OUT / 'img'
TEMAS = [
    ('tema-1-busca-animacao', 'Busca, tela cheia e voltar'),
    ('tema-2-mapa-zoom', 'Zoom e interação no mapa'),
    ('tema-3-tipografia', 'Tipografia e rótulos dos municípios'),
    ('tema-4-painel', 'Painel do alimentador'),
    ('tema-5-fluidez', 'Fluidez e acabamento'),
]
usadas = {}


def img(caminho: Path, nome: str) -> str:
    """Copia a imagem para img/ (nome curto e único) e devolve o caminho publicado."""
    if not caminho.exists():
        return ''
    alvo = f'img/{nome}'
    if alvo not in usadas:
        IMG.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(caminho, OUT / alvo)
        usadas[alvo] = caminho
    return alvo


def inline(t: str) -> str:
    t = html.escape(t, quote=False)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    t = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<![\w*])\*([^*\n]+)\*(?!\*)', r'<em>\1</em>', t)
    t = re.sub(r'\[([^\]]+)\]\((https?://[^)\s]+)\)', r'<a href="\2" target="_blank" rel="noopener">\1</a>', t)
    return t


def md(texto: str, pular_imagens=True) -> str:
    """Markdown simples (títulos, listas, tabelas, parágrafos) para HTML. Imagens ficam de fora: vêm dos pares."""
    out, lista, tabela, par = [], None, [], []

    def fecha():
        nonlocal lista, tabela, par
        if par:
            out.append('<p>' + inline(' '.join(par)) + '</p>')
            par = []
        if lista:
            out.append(f'</{lista}>')
            lista = None
        if tabela:
            linhas = [l for l in tabela if not re.match(r'^\|\s*:?-{2,}', l)]
            cel = lambda l: [c.strip() for c in l.strip().strip('|').split('|')]
            h = ''.join(f'<th>{inline(c)}</th>' for c in cel(linhas[0]))
            b = ''.join('<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in cel(l)) + '</tr>' for l in linhas[1:])
            out.append(f'<div class="tab-wrap"><table><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table></div>')
            tabela = []

    for linha in texto.splitlines():
        s = linha.rstrip()
        if pular_imagens and re.match(r'^\s*!\[', s):
            continue
        if s.startswith('|'):
            if par or lista:
                fecha()
            tabela.append(s)
            continue
        if tabela:
            fecha()
        m = re.match(r'^(#{2,4})\s+(.*)', s)
        if m:
            fecha()
            n = min(len(m.group(1)) + 1, 5)
            out.append(f'<h{n}>{inline(m.group(2))}</h{n}>')
            continue
        m = re.match(r'^\s*([-*]|\d+[.)])\s+(.*)', s)
        if m:
            if par:
                fecha()
            tipo = 'ol' if m.group(1)[0].isdigit() else 'ul'
            if lista != tipo:
                if lista:
                    out.append(f'</{lista}>')
                out.append(f'<{tipo}>')
                lista = tipo
            out.append(f'<li>{inline(m.group(2))}</li>')
            continue
        if not s.strip():
            fecha()
            continue
        if lista and linha.startswith('  '):
            out[-1] = out[-1][:-5] + ' ' + inline(s.strip()) + '</li>'
            continue
        if lista:
            fecha()
        par.append(s.strip())
    fecha()
    return '\n'.join(out)


def pares(pasta: Path, tema: str):
    """prints-finais/NN-assunto-antes-1440.jpg etc. → [{assunto, antes:{1440,390}, depois:{1440,390}}]"""
    grupos = {}
    for f in sorted((pasta / 'prints-finais').glob('*.jpg')):
        m = re.match(r'^(\d+[a-z]?)-(.+)-(antes|depois)-(1440|390)\.jpg$', f.name)
        if not m:
            continue
        k = (m.group(1), m.group(2))
        g = grupos.setdefault(k, {'n': m.group(1), 'assunto': m.group(2).replace('-', ' '), 'antes': {}, 'depois': {}})
        g[m.group(3)][m.group(4)] = img(f, f'{tema[:6]}-{f.name}')
    return [g for _, g in sorted(grupos.items()) if g['antes'] or g['depois']]


def tema_html(i, slug, titulo):
    p4 = RAIZ / 'rodada-4' / slug
    final = (p4 / 'FINAL.md').read_text(encoding='utf-8') if (p4 / 'FINAL.md').exists() else ''
    if not final:   # rodada 4 não entregou: usa o README da rodada 3
        p4 = RAIZ / 'rodada-3' / slug
        final = (p4 / 'README.md').read_text(encoding='utf-8') if (p4 / 'README.md').exists() else '(sem entrega)'
    final = re.sub(r'^#\s.*\n', '', final, count=1)
    ps = pares(p4, slug)
    blocos = []
    for g in ps:
        def fig(lado):
            a = g[lado]
            if not a:
                return f'<figure class="vazio"><figcaption>{"Antes" if lado == "antes" else "Depois"}</figcaption><div class="sem">sem print</div></figure>'
            src1440, src390 = a.get('1440', ''), a.get('390', '')
            return (f'<figure><figcaption>{"Antes" if lado == "antes" else "Depois"}</figcaption>'
                    f'<img loading="lazy" class="v1440" src="{src1440 or src390}" alt="{html.escape(g["assunto"])}, {lado}, computador">'
                    f'<img loading="lazy" class="v390" src="{src390 or src1440}" alt="{html.escape(g["assunto"])}, {lado}, celular"></figure>')
        blocos.append(f'<div class="par"><h4>{html.escape(g["assunto"].capitalize())}</h4><div class="lado">{fig("antes")}{fig("depois")}</div></div>')
    rodadas = TOPO.get('rodadas', {}).get(slug, [])
    rl = ''.join(f'<li><b>R{k + 1}</b> {inline(t)}</li>' for k, t in enumerate(rodadas))
    return (f'<section class="tema" id="t{i}"><header><span class="num">Tema {i}</span><h2>{html.escape(titulo)}</h2></header>'
            f'<div class="tema-grid"><div class="texto">{md(final)}</div>'
            f'<aside><h3>Como chegou aqui</h3><ol class="rodadas">{rl}</ol></aside></div>'
            f'<div class="pares">{"".join(blocos)}</div></section>')


def slides_html():
    t = (RAIZ / 'apresentacao' / 'revisao' / 'README.md').read_text(encoding='utf-8')
    pr = RAIZ / 'apresentacao' / 'revisao'
    partes = re.split(r'(?m)^## ', t)
    intro = md(partes[0].split('\n', 1)[1] if '\n' in partes[0] else '')
    blocos, extras = [], []
    for p in partes[1:]:
        cab, _, corpo = p.partition('\n')
        if '### Slide' not in corpo:
            extras.append(f'<section class="extra"><h3>{inline(cab)}</h3>{md(corpo)}</section>')
            continue
        sl = re.split(r'(?m)^### ', corpo)
        cards = []
        for s in sl[1:]:
            tt, _, cc = s.partition('\n')
            imgs = re.findall(r'!\[[^\]]*\]\((prints/[^)]+)\)', cc)
            figs = ''
            for a in imgs:
                d = img(pr / a, 'sl-' + Path(a).name)
                mob = a.replace('-d.jpg', '-m.jpg')
                m = img(pr / mob, 'sl-' + Path(mob).name) if mob != a else ''
                figs += (f'<img loading="lazy" class="v1440" src="{d}" alt="{html.escape(tt)}">'
                         f'<img loading="lazy" class="v390" src="{m or d}" alt="{html.escape(tt)}, celular">')
            txt = re.sub(r'(?m)^Prints:.*$', '', cc)
            cards.append(f'<article class="slide"><div class="slide-txt"><h4>{inline(tt)}</h4>{md(txt)}</div>'
                         f'<div class="slide-img">{figs}</div></article>')
        blocos.append(f'<section class="bloco"><h3>{inline(cab)}</h3>{"".join(cards)}</section>')
    return intro, ''.join(blocos), ''.join(extras)


TOPO = json.loads((OUT / 'topo.json').read_text(encoding='utf-8'))
temas = ''.join(tema_html(i + 1, s, t) for i, (s, t) in enumerate(TEMAS))
intro, slides, extras = slides_html()
lista = lambda xs: ''.join(f'<li>{inline(x)}</li>' for x in xs)
pagina = (OUT / 'molde.html').read_text(encoding='utf-8')
pagina = (pagina.replace('{{NO_AR}}', lista(TOPO['no_ar']))
          .replace('{{RECOMENDA}}', lista(TOPO['recomenda']))
          .replace('{{DECIDE}}', lista(TOPO['decide']))
          .replace('{{NAV_TEMAS}}', ''.join(f'<a href="#t{i + 1}">{html.escape(t)}</a>' for i, (_, t) in enumerate(TEMAS)))
          .replace('{{TEMAS}}', temas)
          .replace('{{SLIDES_INTRO}}', intro).replace('{{SLIDES}}', slides).replace('{{SLIDES_EXTRA}}', extras))
(OUT / 'argos-noite.html').write_text(pagina, encoding='utf-8')
tam = sum((OUT / a).stat().st_size for a in usadas)
print(f'argos-noite.html {len(pagina) // 1024} KB · {len(usadas)} imagens · {tam / 1e6:.1f} MB')
json.dump(sorted(usadas), open(OUT / 'imagens.json', 'w'))
