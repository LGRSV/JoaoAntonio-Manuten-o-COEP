"""PDF de referência da divisão em trechos (T1, T2, T2-A…, T3-A…) e do NAE por trecho.

    python -m alimentador.referencia_pdf            → alimentador/docs/referencia-trechos.pdf

As figuras e tabelas saem do próprio código (rede esquemática passada por regras/trechos) e dos mapas já gerados
em alimentador/saida/ (AL04010004, LD01110005, LD02110005). Precisa de reportlab e matplotlib.
"""
import collections
import json
import math
import re
import sys
import tempfile
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (CondPageBreak, Image, KeepTogether, PageBreak, Paragraph, Preformatted,
                                SimpleDocTemplate, Spacer, Table, TableStyle)

from . import regras, trechos

RAIZ = Path(__file__).resolve().parent
SAIDA = RAIZ / 'saida'
FONTES = Path('/usr/share/fonts/truetype')
TINTA, CINZA, LINHA, FUNDO, ACENTO, ALERTA = '#1b2024', '#5a636a', '#d6dad6', '#f2f3f0', '#b8431f', '#b91c1c'
CORES_T2 = {'T1': '#1f3a5f', 'T2': '#2e86c1', 'T2-A': '#16a085', 'T2-B': '#8e44ad', 'T2-C': '#d35400'}
COR_T3 = '#c49a6c'
MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro',
         'novembro', 'dezembro']


def dados_mapa(al):
    h = (SAIDA / al / 'mapa-trechos.html').read_text(encoding='utf-8')
    return json.loads(re.search(r'const D = (\{.*?\});\n', h, re.S).group(1).replace('<\\/', '</'))


# ---------- figuras ----------

def rede_esquematica():
    """Rede de exemplo em grade (1 unidade ≈ 44 m) com todos os casos da regra."""
    U = 0.0004
    nos, vaos = {}, []

    def no(k, tipo, x, y, nome=None):
        nos[k] = dict(tipo=tipo, nome=nome or f'poste {k}', poste=k, lat=-9.6 + y * U, lon=-48.45 + x * U, x=x, y=y)

    def linha(*pts):
        vaos.extend(zip(pts, pts[1:]))

    no('DJ', 'DJ', 0, 0, 'DJ')
    for x in range(1, 14):
        no(f't{x}', {4: '79', 8: '79', 12: '88'}.get(x, 'P'), x, 0, {4: 'RL-1', 8: 'RL-2', 12: '88'}.get(x))
    linha('DJ', *[f't{x}' for x in range(1, 14)])
    no('a1', '03', 2, 1, 'F-1'), no('a2', 'P', 2, 2), no('a3', 'P', 2, 3), no('a4', 'P', 2, 4)
    linha('t2', 'a1', 'a2', 'a3', 'a4')
    no('a5', '03', 3, 2, 'F-2'), no('a6', 'P', 4, 2), no('a7', 'P', 5, 2)
    linha('a2', 'a5', 'a6', 'a7')
    no('s1', 'P', 3, -1), no('s2', 'P', 3, -2)
    linha('t3', 's1', 's2')
    no('b1', 'P', 6, -1), no('b2', 'P', 6, -2), no('b3', '79', 6, -3, 'RL-3'), no('b4', 'P', 6, -4), no('b5', 'P', 6, -5)
    linha('t6', 'b1', 'b2', 'b3', 'b4', 'b5')
    no('b6', '03', 7, -4, 'F-3'), no('b7', 'P', 8, -4)
    linha('b4', 'b6', 'b7')
    no('c1', '03', 10, -1, 'F-S'), no('c2', 'P', 10, -2), no('c3', '79', 10, -3, 'RL-4'), no('c4', 'P', 10, -4)
    no('c5', 'P', 10, -5)
    linha('t10', 'c1', 'c2', 'c3', 'c4', 'c5')
    no('d1', '03', 11, 1, 'F-4'), no('d2', 'P', 11, 2), no('d3', 'P', 11, 3)
    linha('t11', 'd1', 'd2', 'd3')
    return nos, vaos


def figura_esquema(caminho):
    nos, vaos = rede_esquematica()
    res = regras.analisar(nos, vaos, 'DJ')
    ts = trechos.segmentar(nos, res)
    cor = lambda n: CORES_T2.get(n, COR_T3)
    fig, ax = plt.subplots(figsize=(7.4, 4.6), dpi=220)
    por_trecho = collections.defaultdict(list)
    for v in res['vaos']:
        a, b = nos[v['_p']], nos[v['_c']]
        ax.plot([a['x'], b['x']], [a['y'], b['y']], color=cor(v['trecho']), lw=3.2, solid_capstyle='round', zorder=1)
        por_trecho[v['trecho']].append((a, b))
    # rótulo de cada trecho num ponto livre, escolhido pela chave onde ele começa
    lugar = {'DJ': (3.0, .45, 'center'), 'RL-1': (6.0, .45, 'center'), 'RL-2': (9.6, .45, 'center'),
             'RL-3': (5.6, -4.7, 'right'), 'RL-4': (10.4, -4.7, 'left'), 'F-1': (2.4, 3.4, 'left'),
             'F-2': (4.0, 2.45, 'center'), 'F-3': (8.25, -4.0, 'left'), 'F-4': (11.4, 2.5, 'left')}
    for t in ts:
        x, y, ha = lugar[t['inicio']]
        ax.text(x, y, t['nome'], ha=ha, va='center', fontsize=9.5, fontweight='bold', color=cor(t['nome']), zorder=4,
                bbox=dict(boxstyle='round,pad=0.18', fc='white', ec='none', alpha=.9))
    pai = {c: p for p, c in vaos}
    secc = {a['nome'] for a in res['ativos'] if a['tipo'] == 'SEC'}
    for k, n in nos.items():
        if n['tipo'] == 'P':
            continue
        estilo = {'DJ': dict(marker='s', s=90, c='black'), '79': dict(marker='D', s=70, c=ALERTA),
                  '88': dict(marker='s', s=34, c='#9aa4ab'), '03': dict(marker='o', s=55, c='#e67e22')}[n['tipo']]
        ax.scatter([n['x']], [n['y']], zorder=5, edgecolors='white', linewidths=1.2, **estilo)
        if n['nome'] in secc:
            ax.scatter([n['x']], [n['y']], marker='x', s=40, c='black', zorder=6, linewidths=1.4)
        if n['y'] == 0:                                   # no tronco: embaixo
            dx, dy, ha, va = 0, -.32, 'center', 'top'
        elif nos[pai[k]]['y'] == n['y']:                  # vão horizontal: em cima
            dx, dy, ha, va = 0, .3, 'center', 'bottom'
        else:                                             # vão vertical: à esquerda
            dx, dy, ha, va = -.22, 0, 'right', 'center'
        ax.text(n['x'] + dx, n['y'] + dy, n['nome'], fontsize=7.6, ha=ha, va=va, color=TINTA, zorder=6)
    notas = [((3.2, -2.0), 'left', 'derivação sem chave:\ncontinua T1'),
             ((5.3, 2.0), 'left', 'fusível dentro de\nfusível: T3-B (sem T4)'),
             ((10.3, -1.6), 'left', 'F-S: seccionamento\n(religador depois dele:\nnão abre trecho)'),
             ((12.0, .45), 'center', '88 não divide')]
    for (x, y), ha, txt in notas:
        ax.text(x, y, txt, fontsize=7, color=CINZA, va='center', ha=ha, style='italic')
    ax.set_xlim(-.7, 14.3)
    ax.set_ylim(-5.6, 4.6)
    ax.set_aspect('equal')
    ax.axis('off')
    fig.tight_layout(pad=.2)
    fig.savefig(caminho)
    plt.close(fig)
    return ts, res


def figura_al04010004(D, caminho):
    ts = D['trechos']
    lat0 = sum(v[0] for v in D['vaos']) / len(D['vaos'])
    k = math.cos(math.radians(lat0))
    fig, ax = plt.subplots(figsize=(7.4, 5.0), dpi=220)
    for v in D['vaos']:
        nome = ts[v[4]]['nome']
        principal = nome in CORES_T2
        ax.plot([v[1] * k, v[3] * k], [v[0], v[2]], color=CORES_T2.get(nome, COR_T3), lw=2.6 if principal else 1.4,
                solid_capstyle='round', zorder=2 if principal else 1)
    for f in D['fusiveis']:
        ax.scatter([f['lon'] * k], [f['lat']], s=9, c='#e67e22', zorder=3, linewidths=0)
    for t in ts:
        if t['nome'] in CORES_T2 and t.get('rotulo'):
            ax.text(t['rotulo'][1] * k, t['rotulo'][0], t['nome'], fontsize=10, fontweight='bold',
                    color=CORES_T2[t['nome']], ha='center', va='center', zorder=6,
                    bbox=dict(boxstyle='round,pad=0.2', fc='white', ec=CORES_T2[t['nome']], lw=.8))
    lados = {'DJ AL04010004': (9, -2, 'left'), '7903565004': (9, -3, 'left'), '7935867004': (-8, -12, 'right'),
             '7902218004': (10, 10, 'left')}
    for p in D['principais']:
        ax.scatter([p['lon'] * k], [p['lat']], marker='s' if p['t'] == 'DJ' else 'D', s=70 if p['t'] == 'DJ' else 55,
                   c='black' if p['t'] == 'DJ' else ALERTA, edgecolors='white', linewidths=1.2, zorder=7)
        dx, dy, ha = lados.get(p['nome'], (8, 8, 'left'))
        ax.annotate(p['nome'] if p['t'] != 'DJ' else 'DJ', (p['lon'] * k, p['lat']), xytext=(dx, dy),
                    textcoords='offset points', fontsize=8, ha=ha, color=TINTA, zorder=8)
    # barra de escala de 1 km
    x0, x1 = ax.get_xlim()
    y0, y1 = ax.get_ylim()
    um_km = 1 / 111.32
    bx, by = x1 - (x1 - x0) * .06 - um_km, y0 + (y1 - y0) * .05
    ax.plot([bx, bx + um_km], [by, by], color=TINTA, lw=2)
    ax.text(bx + um_km / 2, by + (y1 - y0) * .015, '1 km', ha='center', va='bottom', fontsize=8, color=TINTA)
    ax.set_aspect('equal')
    ax.axis('off')
    fig.tight_layout(pad=.2)
    fig.savefig(caminho)
    plt.close(fig)


# ---------- PDF ----------

def fontes():
    """Liberation Sans (acentos e símbolos) com a Helvetica embutida no reportlab como reserva."""
    arqs = {'Sans': 'liberation/LiberationSans-Regular.ttf', 'Sans-B': 'liberation/LiberationSans-Bold.ttf',
            'Sans-I': 'liberation/LiberationSans-Italic.ttf', 'Mono': 'dejavu/DejaVuSansMono.ttf'}
    if all((FONTES / a).exists() for a in arqs.values()):
        for nome, arq in arqs.items():
            pdfmetrics.registerFont(TTFont(nome, str(FONTES / arq)))
        pdfmetrics.registerFontFamily('Sans', normal='Sans', bold='Sans-B', italic='Sans-I', boldItalic='Sans-B')
        return {}
    return {'Sans': 'Helvetica', 'Sans-B': 'Helvetica-Bold', 'Sans-I': 'Helvetica-Oblique', 'Mono': 'Courier'}


def estilos():
    troca = fontes()
    F = lambda n: troca.get(n, n)
    base = dict(fontName=F('Sans'), textColor=colors.HexColor(TINTA), alignment=TA_LEFT)
    return {
        'titulo': ParagraphStyle('titulo', fontSize=21, leading=25, fontName=F('Sans-B'), spaceAfter=4, **{k: v for k, v in base.items() if k != 'fontName'}),
        'sub': ParagraphStyle('sub', fontSize=10, leading=14, textColor=colors.HexColor(CINZA), fontName=F('Sans'), spaceAfter=10),
        'h1': ParagraphStyle('h1', fontSize=13.5, leading=17, fontName=F('Sans-B'), spaceBefore=12, spaceAfter=6, keepWithNext=1,
                             textColor=colors.HexColor(ACENTO)),
        'p': ParagraphStyle('p', fontSize=9.6, leading=13.6, spaceAfter=5, **base),
        'item': ParagraphStyle('item', fontSize=9.6, leading=13.6, leftIndent=12, bulletIndent=2, spaceAfter=2.5, **base),
        'cel': ParagraphStyle('cel', fontSize=8.6, leading=11.2, **base),
        'celb': ParagraphStyle('celb', fontSize=8.6, leading=11.2, fontName=F('Sans-B'), textColor=colors.HexColor(TINTA)),
        'leg': ParagraphStyle('leg', fontSize=8.4, leading=11.4, textColor=colors.HexColor(CINZA), fontName=F('Sans-I'),
                              spaceBefore=3, spaceAfter=8),
        'code': ParagraphStyle('code', fontName=F('Mono'), fontSize=8, leading=10.6, textColor=colors.HexColor(TINTA),
                               backColor=colors.HexColor(FUNDO), borderPadding=6, leftIndent=6, rightIndent=6,
                               spaceBefore=4, spaceAfter=8),
    }


def tabela(linhas, larguras, E, cabecalho=True, destaque=None):
    dados = [[Paragraph(str(c), E['celb'] if (cabecalho and i == 0) else E['cel']) for c in lin]
             for i, lin in enumerate(linhas)]
    t = Table(dados, colWidths=[w * mm for w in larguras], repeatRows=1 if cabecalho else 0)
    estilo = [('VALIGN', (0, 0), (-1, -1), 'TOP'), ('TOPPADDING', (0, 0), (-1, -1), 3.2),
              ('BOTTOMPADDING', (0, 0), (-1, -1), 3.2), ('LEFTPADDING', (0, 0), (-1, -1), 5),
              ('RIGHTPADDING', (0, 0), (-1, -1), 5), ('LINEBELOW', (0, 0), (-1, -1), .4, colors.HexColor(LINHA))]
    if cabecalho:
        estilo += [('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(FUNDO)),
                   ('LINEBELOW', (0, 0), (-1, 0), .8, colors.HexColor(TINTA))]
    for i in destaque or []:
        estilo.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor('#fbf3ee')))
    t.setStyle(TableStyle(estilo))
    return t


def rodape(canvas, doc):
    canvas.saveState()
    canvas.setFont('Sans' if 'Sans' in pdfmetrics.getRegisteredFontNames() else 'Helvetica', 7.5)
    canvas.setFillColor(colors.HexColor(CINZA))
    canvas.drawString(18 * mm, 10 * mm, 'Trechos de alimentador e NAE por trecho · referência')
    canvas.drawRightString(A4[0] - 18 * mm, 10 * mm, f'{doc.page}')
    canvas.restoreState()


def km(m):
    return f'{m / 1000:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')


def km1(m):
    return f'{m / 1000:,.0f}'.replace(',', '.')


def gerar(destino):
    E = estilos()
    P = lambda t, s='p': Paragraph(t, E[s])
    item = lambda t: Paragraph(t, E['item'], bulletText='•')
    tmp = Path(tempfile.mkdtemp())
    ts_esq, res_esq = figura_esquema(tmp / 'esquema.png')
    D4 = dados_mapa('AL04010004')
    figura_al04010004(D4, tmp / 'al04010004.png')

    h = []
    h += [P('Trechos de alimentador e NAE por trecho', 'titulo'),
          P('Regra de divisão aprovada para os alimentadores de média tensão (export KML do Daimon) e cálculo do NAE '
            'por trecho a partir da Crítica · Energisa Tocantins · outubro de 2026', 'sub')]
    h.append(P('Cada trecho começa numa chave (DJ, religador ou fusível) e termina na próxima. O nome diz o tipo de '
               'chave que abre o trecho; a letra diz a ordem a partir do DJ. Serve para localizar defeito, planejar '
               'poda e manutenção e ver onde se concentram as interrupções (NAE) de cada mês.'))

    h.append(P('1. A regra', 'h1'))
    h.append(tabela([
        ['Trecho', 'Começa em', 'Termina em'],
        ['<b>T1</b>', 'DJ do alimentador', '1º religador (79) do tronco'],
        ['<b>T2</b>', '1º religador', '2º religador (ou a chave onde a linha principal acaba)'],
        ['<b>T2-A, T2-B…</b>', 'cada religador seguinte, no tronco ou fora dele', 'próximo religador, próxima chave ou fim de linha'],
        ['<b>T3-A, T3-B…</b>', 'cada fusível (03, 33, 02), inclusive fusível dentro de fusível', 'próxima chave ou fim de linha'],
    ], [30, 70, 74], E))
    h.append(Spacer(1, 6))
    for t in ['<b>Não existe T4.</b> Fusível depois de fusível continua sendo T3, com a letra seguinte.',
              '<b>Letras</b> em ordem de distância do DJ até a chave de início: A…Z, depois AA, AB… Uma sequência para '
              'os T2 e outra para os T3.',
              '<b>A letra só nasce em chave.</b> Derivação num poste sem chave continua no trecho de onde saiu, '
              'qualquer que seja o tamanho.',
              '<b>Seccionamento:</b> fusível que tem religador depois dele não abre trecho nem muda a zona.',
              'Chaves 88, facas (80) e chaves de passagem (90, 31, 68) não dividem trecho. Chave com estilo '
              '<i>ChaveNA</i> está aberta: o que vem depois dela fica fora do alimentador.']:
        h.append(item(t))

    h.append(P('2. Tipos de chave no KML do Daimon', 'h1'))
    h.append(P('O tipo vem dos dois primeiros dígitos do nome da chave (10 dígitos). O DJ é o ponto '
               '<i>DJ_&lt;alimentador&gt;_FICT</i>.'))
    h.append(tabela([
        ['Prefixo', 'O que é', 'Efeito no trecho'],
        ['DJ', 'disjuntor da subestação', 'abre o T1'],
        ['79', 'religador', 'abre o T2 (1º religador) ou um T2 com letra'],
        ['03, 33, 02', 'chave fusível', 'abre um T3 com letra (menos no seccionamento)'],
        ['88', 'chave listada no cadastro', 'não divide'],
        ['80', 'chave faca', 'não divide'],
        ['90, 31, 68', 'chaves de passagem, em série na rede', 'não divide'],
    ], [26, 66, 82], E))

    h.append(CondPageBreak(150 * mm))
    h.append(P('3. Exemplo esquemático', 'h1'))
    h.append(P('Rede inventada com todos os casos, passada pelo mesmo código que divide os alimentadores reais. Os '
               'nomes dos trechos na figura são os que o código deu.'))
    h.append(Image(str(tmp / 'esquema.png'), width=174 * mm, height=174 * mm * 4.6 / 7.4))
    h.append(P('Quadrado preto: DJ. Losango vermelho: religador. Círculo laranja: fusível (com X: seccionamento). '
               'Quadrado cinza: chave 88.', 'leg'))
    obs = {'T1': 'F-1 sai do T1 como derivação', 'T2': 'RL-3 está fora do tronco: é derivação do T2, não fim',
           'T2-A': 'RL-4 está dentro do T2-A (depois do seccionamento F-S): é o fim',
           'T2-B': 'segue a linha principal até F-3', 'T2-C': 'sem chave depois: fim de linha',
           'T3-A': 'segue a linha principal até F-2', 'T3-B': 'fusível dentro de fusível', 'T3-C': 'fusível dentro do T2-B',
           'T3-D': 'fusível no T2-A'}
    fim = lambda t: ' / '.join(re.sub(r' · poste .*', '', f) for f in t['fim'])
    h.append(tabela([['Trecho', 'Início', 'Fim', 'Por quê']] +
                    [[f'<b>{t["nome"]}</b>', t['inicio'], fim(t), obs.get(t['nome'], '')] for t in ts_esq],
                    [18, 20, 30, 106], E))

    h.append(PageBreak())
    h.append(P('4. Início e fim de cada trecho', 'h1'))
    h.append(P('O início é sempre a chave que abriu o trecho. O fim é procurado nesta ordem:'))
    for i, t in enumerate([
            '<b>Religador onde começa o T2 seguinte</b>, quando esse religador está no tronco (T1 → T2, T2 → T2-A…) '
            'ou dentro de um T2 com letra. Um religador fora do tronco que sai do T1 ou do T2 é <b>derivação</b>, '
            'não fim.',
            '<b>Senão, a 1ª chave da linha principal</b> onde começa outro trecho. Linha principal é, em cada '
            'bifurcação, o ramo que vai mais longe do DJ.',
            '<b>Sem chave nesse caminho:</b> "fim de linha" com o número do poste.'], 1):
        h.append(Paragraph(t, E['item'], bulletText=f'{i}.'))
    h.append(Spacer(1, 4))
    h.append(P('<b>Tronco</b>: DJ → 1º religador → 2º religador e, depois do 2º, até os próximos ativos. Nunca tem T3. '
               'Sem 2º religador, o tronco segue o lado com mais rede T1/T2 e para antes de um fusível. Se mais de um '
               'religador pode ser o 2º (religadores em paralelo logo depois do 1º), fica o que tem mais rede depois '
               'dele. Nos dois casos o programa avisa.'))
    h.append(P('Cada trecho guarda: chave de início (com tipo e poste), fim, extensão, de onde vem, os trechos que saem '
               'dele (derivações) e se é tronco. A soma das extensões é igual à extensão total do alimentador.'))

    h.append(P('5. NAE por trecho (base Crítica)', 'h1'))
    h.append(P('Cada ocorrência da Crítica vai para um trecho pela abrangência e pelo ativo que atuou:'))
    h.append(tabela([
        ['Abrangência / ativo', 'Vai para'],
        ['DJ', 'T1'],
        ['Religador ou fusível que abre um trecho', 'esse trecho'],
        ['Trafo, consumidor (individual, pelo trafo) ou outro ativo com ponto no KML', 'trecho do vão mais próximo'],
        ['Ativo que não está no KML atual', 'fora dos trechos; "hoje no &lt;alimentador&gt;" se for achado no KML vizinho'],
    ], [92, 82], E))
    h.append(Spacer(1, 6))
    for t in ['<b>Coletiva</b>: TIPO_INTER_KTI = COLETIVO (atuou DJ, religador, fusível ou trafo). <b>Individual</b>: '
              'um consumidor. O mapa deixa escolher se conta as individuais.',
              '<b>Mês</b> = competência (DTA_CMPT_HDE), não a data de abertura: o arquivo de janeiro traz 956 linhas de '
              'fevereiro.',
              '<b>Ocorrência</b> = NUM_SEQ_OPER_INIC_HDE. Cada linha é um passo de manobra: consumidores e CHI são '
              'somados entre os passos; a duração é a do maior passo.',
              'Linhas repetidas entre arquivos são descartadas (7 no 1º semestre de 2026).',
              'O DJ tem código próprio na Crítica (ex.: 224R004) e o mesmo desarme pode aparecer em dois alimentadores '
              '(consumidores transferidos).',
              '<b>Programada</b> = causa "Distribuição programada".',
              'O número da unidade consumidora nunca vai para o mapa nem para o site.']:
        h.append(item(t))

    h.append(PageBreak())
    h.append(P('6. Exemplo real: AL04010004 (SE-2AR0, Araguaína)', 'h1'))
    tsd = D4['trechos']
    n_t3 = sum(t['tipo'] == 'fusivel' for t in tsd)
    total = sum(t['ext'] for t in tsd)
    h.append(P(f'{km(total)} km, 3 religadores em série, {len(tsd)} trechos ({n_t3} T3). Linhas grossas: T1 e T2; '
               'linhas finas: T3; pontos laranja: fusíveis.'))
    h.append(Image(str(tmp / 'al04010004.png'), width=174 * mm, height=174 * mm * 5.0 / 7.4))
    h.append(Spacer(1, 4))
    h.append(tabela([['Trecho', 'Início', 'Fim', 'km']] +
                    [[f'<b>{t["nome"]}</b>', t['inicio'], ' / '.join(t['fim']), km(t['ext'])] for t in tsd
                     if t['tipo'] != 'fusivel'] +
                    [[f'<b>{n_t3} trechos T3</b>', 'T3-A … T3-' + trechos.letras(n_t3 - 1), 'próxima chave ou fim de linha',
                      km(sum(t['ext'] for t in tsd if t['tipo'] == 'fusivel'))]],
                    [34, 46, 74, 20], E))

    h.append(CondPageBreak(90 * mm))
    oc = [o for o in D4['nae']['oc'] if o['mes'] == '2026-01']
    h.append(P('NAE de janeiro de 2026 por trecho (AL04010004)', 'h1'))
    grupos = collections.OrderedDict()
    ordem_t = {t['nome']: i for i, t in enumerate(tsd)}
    for o in sorted(oc, key=lambda o: (o['trecho'] is None, ordem_t.get(o['trecho'], 0), o['fora'] or '')):
        grupos.setdefault(o['trecho'] or ('Fora · ' + o['fora'] if o['fora'].startswith('hoje') else 'Fora do cadastro atual'),
                          []).append(o)
    linhas = [['Trecho', 'Coletivas', 'Individuais', 'Coletivas: dia · chave · causa · consumidores']]
    for nome, os_ in grupos.items():
        col = [o for o in os_ if o['col']]
        det = '<br/>'.join(f'{o["dia"][:5]} · {o["prob"] if o["abr"] == "CH FUS" else o["ativo"]} ({o["abr"]}) · '
                           f'{o["causa"]} · {o["cons"]}' for o in col)
        linhas.append([f'<b>{nome}</b>', len(col), len(os_) - len(col), det or '—'])
    n_col, n_ind = sum(o['col'] for o in oc), sum(not o['col'] for o in oc)
    linhas.append(['<b>Total</b>', f'<b>{n_col}</b>', f'<b>{n_ind}</b>', ''])
    h.append(tabela(linhas, [38, 18, 20, 98], E, destaque=[1]))
    h.append(P('T1 = 2: os dois desarmes do DJ 224R004 (11/01 e 13/01), número conferido pelo usuário. As ocorrências '
               '"fora" são da parte da rede que passou para o AL02040004 em abril (o KML é de hoje; a Crítica, de '
               'janeiro).', 'leg'))

    h.append(CondPageBreak(70 * mm))
    h.append(P('7. SE Arraias II (SE-2ARS)', 'h1'))
    linhas = [['Alimentador', 'km', 'Religadores', 'Trechos', 'T2', 'T3', 'NAE jan/2026']]
    for al in ['LD01110005', 'LD02110005']:
        D = dados_mapa(al)
        tsa = D['trechos']
        n2 = [t['nome'] for t in tsa if t['tipo'] != 'fusivel' and t['nome'] != 'T1']
        o1 = [o for o in D['nae']['oc'] if o['mes'] == '2026-01']
        linhas.append([f'<b>{al}</b>', km1(sum(t['ext'] for t in tsa)), sum(p['t'] == '79' for p in D['principais']),
                       len(tsa), n2[0] if len(n2) == 1 else f'{n2[0]} … {n2[-1]}',
                       sum(t['tipo'] == 'fusivel' for t in tsa),
                       f'{sum(o["col"] for o in o1)} coletivas · {sum(not o["col"] for o in o1)} individuais'])
    h.append(tabela(linhas, [27, 15, 21, 17, 26, 13, 55], E))
    h.append(P('No LD02110005 há 4 seccionamentos (3327852005, 0327854005, 0320001051, 3320045051) e religadores em '
               'paralelo depois do 1º: ficou como 2º o 7932028020 (mais rede depois dele); o 7936769005 virou T2-A.',
               'leg'))

    h.append(CondPageBreak(80 * mm))
    h.append(P('8. Como gerar', 'h1'))
    h.append(P('No repositório LGRSV/smartled (ou na pasta <i>scripts</i> da skill <i>trechos-alimentador</i>), só com '
               'Python 3 e a biblioteca padrão:'))
    h.append(Preformatted(
        'python -m alimentador.gerar_trechos SE-2ARS_Circ-LD01110005.kml SE-2ARS_Circ-LD02110005.kml \\\n'
        '    --saida alimentador/saida --postes ../vera-vegetacao/dados \\\n'
        "    --critica 'crit/Critica-CHEIO_0*-2026.txt' \\\n"
        "    --site ../vera-vegeta-o-back --se-nome SE-2ARS='Arraias II'", E['code']))
    for t in ['<b>Entradas</b>: KML do Daimon por alimentador (Google Drive, pasta da SE), postes do vera-vegetacao '
              '(opcional, dá o número do poste), arquivos Critica*.txt (opcional, para o NAE) e, com <i>--outros</i>, o '
              'KML do alimentador vizinho para dizer onde está hoje o ativo que saiu do cadastro.',
              '<b>Saídas</b> por alimentador: <i>mapa-trechos.html</i> (satélite, lista de trechos com início → fim, '
              'NAE por mês, busca) e <i>&lt;alimentador&gt;-trechos.kmz</i> (Google Earth / My Maps).',
              '<b>Site</b> (<i>--site</i>): página do alimentador, KMZ e índice por SE em '
              'https://lgrsv.github.io/vera-vegeta-o-back/ (branch gh-pages). O site é público, sem indexação.',
              'O comando imprime trechos, avisos e NAE por mês para conferir antes de entregar. Um alimentador de '
              '1.500 km leva alguns minutos.']:
        h.append(item(t))

    h.append(P('9. Pontos em aberto', 'h1'))
    for t in ['<b>Chave 02 conta como fusível?</b> Hoje conta. No AL04010004 ela abre 35 dos 50 trechos T3, todos '
              'com menos de 50 m.',
              '<b>Alimentador sem 2º religador</b> e <b>religadores em paralelo</b>: a regra decide sozinha (lado com mais '
              'rede) e avisa; vale conferir caso a caso.']:
        h.append(item(t))

    h.append(P('10. Como a regra foi decidida', 'h1'))
    for t in ['"Só existe T1 e T2: DJ até o 1º RL é T1, do RL até o segundo é T2."',
              '"Não existe T3 com RL." → depois de qualquer religador é T2.',
              '"Chama T2 sem ser ramal de T2; quando for ramalizando T2-A, T2-B; quero o ativo início e fim de cada um."',
              'Tamanho mínimo para ganhar letra: "não tem, tem que seguir a lógica dos números dos ativos" → letra só '
              'em chave.',
              '"Vira T3-AA" → sequência A…Z, AA…; "T4 não era pra ter, só T3".',
              '"T1 – DJ até o RL; T2 – RL até a chave ou RL até RL; do T2 pra frente, chave até chave."',
              '"Aqui seria um T2-A e o outro azul clarinho o T2-B" → cada religador abre um T2.',
              '"Tá perfeito essa lógica."']:
        h.append(item(t))

    destino.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(str(destino), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=16 * mm,
                            bottomMargin=18 * mm, title='Trechos de alimentador e NAE por trecho',
                            author='LGRSV/smartled', subject='Regra de divisão em trechos T1/T2/T3 e NAE por trecho')
    doc.build(h, onFirstPage=rodape, onLaterPages=rodape)
    return destino


if __name__ == '__main__':
    destino = Path(sys.argv[1]) if len(sys.argv) > 1 else RAIZ / 'docs' / 'referencia-trechos.pdf'
    print(gerar(destino))
