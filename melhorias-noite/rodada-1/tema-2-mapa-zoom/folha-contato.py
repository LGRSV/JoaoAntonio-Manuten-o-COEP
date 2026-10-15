# monta as folhas de contato s1-sequencia-desk.jpg e s1-sequencia-mob.jpg a partir dos prints (uso: python3 folha-contato.py)
from PIL import Image, ImageDraw, ImageFont
P = 'prints/'
def folha(nomes, saida, cols, tw, th, rotulos):
    rows = (len(nomes) + cols - 1) // cols; pad = 8; lh = 26
    im = Image.new('RGB', (cols * tw + (cols + 1) * pad, rows * (th + lh) + (rows + 1) * pad), (0, 0, 0)); d = ImageDraw.Draw(im)
    try: f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 14)
    except Exception: f = ImageFont.load_default()
    for i, (n, l) in enumerate(zip(nomes, rotulos)):
        r, c = divmod(i, cols); x = pad + c * (tw + pad); y = pad + r * (th + lh + pad)
        d.text((x + 2, y + 4), l, fill=(240, 138, 93), font=f)
        im.paste(Image.open(P + n + '.jpg').convert('RGB').resize((tw, th), Image.LANCZOS), (x, y + lh))
    im.save(P + saida + '.jpg', 'JPEG', quality=80)
folha(['s1-depois-desk-1-dica', 's1-depois-desk-2-zoom2', 's1-depois-desk-3-zoom5', 's1-depois-desk-4-arrastar', 's1-depois-desk-5-clique-regional', 's1-depois-desk-7-esc-enquadra'], 's1-sequencia-desk', 3, 480, 300,
      ['1. rolar sem Ctrl: página rola + dica', '2. Ctrl+roda x3: nomes aparecem', '3. Ctrl+roda x6: nome + NAE e prévia das redes', '4. arrastar o mapa', '5. clicar num município: abre a regional', '6. Esc: enquadra de novo'])
folha(['s1-depois-mob-1-estado', 's1-depois-mob-2-pinca', 's1-depois-mob-3-pinca-mais', 's1-depois-mob-4-arrastar', 's1-depois-mob-5-toque-regional'], 's1-sequencia-mob', 5, 234, 506,
      ['1. estado', '2. pinça', '3. pinça + zoom', '4. 1 dedo arrasta', '5. toque: regional'])
