#!/usr/bin/env python3
# Monta prints-finais/NN-assunto-{antes,depois}-{1440,390}.jpg a partir dos quadros de prints-finais/tmp (node prints-finais.js)
from PIL import Image, ImageDraw, ImageFont
import os
T = 'prints-finais/tmp/'; O = 'prints-finais/'
FONTE = next((f for f in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'] if os.path.exists(f)), None)
def fonte(n): return ImageFont.truetype(FONTE, n) if FONTE else ImageFont.load_default()
def compoe(quadros, legendas, saida, alvo_w_quadro, cor):
    ims = []
    for q in quadros:
        im = Image.open(T + q).convert('RGB'); h = round(im.height * alvo_w_quadro / im.width); ims.append(im.resize((alvo_w_quadro, h), Image.LANCZOS))
    H = max(i.height for i in ims); faixa = 34; gap = 6
    W = sum(i.width for i in ims) + gap * (len(ims) - 1)
    c = Image.new('RGB', (W, H + faixa), (24, 24, 24)); d = ImageDraw.Draw(c); x = 0
    for im, leg in zip(ims, legendas):
        d.rectangle([x, 0, x + im.width, faixa - 4], fill=cor); d.text((x + 8, 7), leg, fill='white', font=fonte(16)); c.paste(im, (x, faixa)); x += im.width + gap
    c.save(saida, quality=80, optimize=True)
ANTES, DEPOIS = (153, 27, 27), (22, 101, 52)
for vp in ['1440', '390']:
    w = 760 if vp == '1440' else 390   # 1440: cada quadro a ~53 %; 390 (DPR 2): metade
    for t, cor in [('antes', ANTES), ('depois', DEPOIS)]:
        L = t.upper()
        compoe([f'01-{t}-A-{vp}.jpg', f'01-{t}-B-{vp}.jpg'], [f'{L} · barra de busca na página' if t == 'antes' else f'{L} · mesmo momento, mapa no lugar', f'{L} · pronto (lupa no mapa)'], f'{O}01-cls-alimentador-{t}-{vp}.jpg', w, cor)
        compoe([f'02-{t}-A-{vp}.jpg', f'02-{t}-B-{vp}.jpg'], [f'{L} · 1º quadro (☰ e cartões chegam depois)', f'{L} · quadro seguinte'], f'{O}02-cls-inicio-{t}-{vp}.jpg', w, cor)
        compoe([f'03-{t}-A-{vp}.jpg'], [f'{L} · Tab com a regional Centro aberta'], f'{O}03-tab-regional-{t}-{vp}.jpg', 1100 if vp == '1440' else 780, cor)
        qs = [f'04-{t}-A-{vp}.jpg'] + ([f'04-{t}-B-{vp}.jpg'] if vp == '390' else [])
        compoe(qs, [f'{L} · alvos (vermelho < 44 px)', f'{L} · painel'][:len(qs)], f'{O}04-alvos-alimentador-{t}-{vp}.jpg', 1100 if vp == '1440' else 390, cor)
