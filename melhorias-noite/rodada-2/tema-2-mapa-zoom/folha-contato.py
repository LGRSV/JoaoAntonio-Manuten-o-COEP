# monta as folhas de contato (z-sequencia-desk.jpg, z-sequencia-mob.jpg, z-antes-depois-*.jpg) a partir dos prints (uso: python3 folha-contato.py)
from PIL import Image, ImageDraw, ImageFont
P = 'prints/'
def folha(nomes, saida, cols, tw, th, rotulos):
    rows = (len(nomes) + cols - 1) // cols; pad = 8; lh = 26
    im = Image.new('RGB', (cols * tw + (cols + 1) * pad, rows * (th + lh + pad) + pad), (0, 0, 0)); d = ImageDraw.Draw(im)
    try: f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 14)
    except Exception: f = ImageFont.load_default()
    for i, (n, l) in enumerate(zip(nomes, rotulos)):
        r, c = divmod(i, cols); x = pad + c * (tw + pad); y = pad + r * (th + lh + pad)
        d.text((x + 2, y + 4), l, fill=(240, 138, 93), font=f)
        im.paste(Image.open(P + n + '.jpg').convert('RGB').resize((tw, th), Image.LANCZOS), (x, y + lh))
    im.save(P + saida + '.jpg', 'JPEG', quality=80)
folha(['z-depois-desk-1-aviso', 'z-depois-desk-2-estado-1x7', 'z-depois-desk-3-estado-3x7', 'z-depois-desk-4-arrastar', 'z-depois-desk-6-regional-1x7', 'z-depois-desk-8-polo-zoom'], 'z-sequencia-desk', 3, 480, 300,
      ['1. rolar sem Ctrl: página rola + aviso', '2. Ctrl+roda x2: cartões nome+NAE (1,7x)', '3. Ctrl+roda x5: mais cartões (3,7x)', '4. arrastar o mapa: cartões recalculados', '5. regional aberta, zoom 1,7x', '6. polo aberto, zoom'])
folha(['z-depois-mob-1-aviso', 'z-depois-mob-2-pinca-1', 'z-depois-mob-3-pinca-2', 'z-depois-mob-4-arrastar', 'z-depois-mob-5-regional-pinca', 'z-depois-mob-6-polo-pinca'], 'z-sequencia-mob', 6, 234, 506,
      ['1. 1 dedo rola + aviso', '2. pinça (2,2x)', '3. pinça (7,2x)', '4. 1 dedo arrasta', '5. regional', '6. polo'])
folha(['z-antes-desk-2-ctrl-roda', 'z-depois-desk-3-estado-3x7', 'z-antes-desk-3-regional', 'z-depois-desk-7-regional-3x7'], 'z-antes-depois-desk', 2, 720, 450,
      ['ANTES: Ctrl+roda x5 não faz nada', 'DEPOIS: Ctrl+roda, nome+NAE por município', 'ANTES: regional (1x)', 'DEPOIS: regional com zoom'])
folha(['z-antes-mob-2-pinca', 'z-depois-mob-2-pinca-1', 'z-antes-mob-4-polo', 'z-depois-mob-6-polo-pinca'], 'z-antes-depois-mob', 4, 234, 506,
      ['ANTES: pinça amplia a página', 'DEPOIS: pinça amplia o mapa', 'ANTES: polo (1x)', 'DEPOIS: polo com pinça'])
