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
folha(['d-desk-01-aviso', 'd-desk-02-estado-1x7', 'd-desk-03-estado-3x7', 'd-desk-04-arrastar', 'd-desk-06-regional-1x7', 'd-desk-08-polo-zoom'], 'z-sequencia-desk', 3, 480, 300,
      ['1. rolar sem Ctrl: página rola + aviso', '2. Ctrl+roda x2: bandeirinhas + cartões (1,7x)', '3. Ctrl+roda x5: mais cartões (3,7x)', '4. arrastar o mapa: cartões recalculados', '5. regional aberta, zoom 1,7x', '6. polo aberto, zoom'])
folha(['d-mob-1-aviso', 'd-mob-2-pinca-1', 'd-mob-3-pinca-2', 'd-mob-4-arrastar', 'd-mob-5-regional-pinca', 'd-mob-6-polo-pinca'], 'z-sequencia-mob', 6, 234, 506,
      ['1. 1 dedo + aviso', '2. pinça (2,2x)', '3. pinça (7,2x)', '4. 1 dedo arrasta', '5. regional', '6. polo'])
folha(['a-desk-2-ctrl-roda', 'd-desk-03-estado-3x7', 'a-desk-3-regional', 'd-desk-07-regional-3x7'], 'z-antes-depois-desk', 2, 720, 450,
      ['ANTES: Ctrl+roda x5 não faz nada', 'DEPOIS: Ctrl+roda, nome+NAE por município', 'ANTES: regional (1x)', 'DEPOIS: regional com zoom (3,7x)'])
folha(['a-mob-2-pinca', 'd-mob-2-pinca-1', 'a-mob-4-polo', 'd-mob-6-polo-pinca'], 'z-antes-depois-mob', 4, 234, 506,
      ['ANTES: pinça amplia a página', 'DEPOIS: pinça amplia o mapa', 'ANTES: polo (1x)', 'DEPOIS: polo com pinça'])
folha(['d-desk-12-legenda-recolhida', 'd-desk-13-tela-cheia-zoom', 'd-desk-10-busca-com-zoom', 'd-desk-14-claro-estado'], 'z-convivencia-desk', 2, 720, 450,
      ['legenda recolhida: só o nome', 'tela cheia + zoom', 'busca aberta com o mapa aproximado', 'tema claro'])
