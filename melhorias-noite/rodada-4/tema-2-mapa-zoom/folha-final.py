# monta prints-finais/seq-ctrl-roda-1440.jpg (sequência curta Ctrl+roda -> zoom semântico -> arrastar) e prints-finais/folha-antes-depois.jpg
import json
from PIL import Image, ImageDraw, ImageFont
P = 'prints-finais/'
d = json.load(open('prints-finais.json'))
f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
def folha(nomes, rotulos, saida, cols, tw, th):
    rows = (len(nomes) + cols - 1) // cols; pad = 8; lh = 26
    im = Image.new('RGB', (cols * tw + (cols + 1) * pad, rows * (th + lh + pad) + pad), (0, 0, 0)); dr = ImageDraw.Draw(im)
    for i, (n, l) in enumerate(zip(nomes, rotulos)):
        r, c = divmod(i, cols); x = pad + c * (tw + pad); y = pad + r * (th + lh + pad)
        dr.text((x + 2, y + 4), l, fill=(240, 138, 93), font=f)
        im.paste(Image.open(P + n + '.jpg').convert('RGB').resize((tw, th), Image.LANCZOS), (x, y + lh))
    im.save(P + saida + '.jpg', 'JPEG', quality=80)
seq = d['seq']
leg = ['1. estado, sem zoom', '2. Ctrl+roda x1', '3. Ctrl+roda x2', '4. Ctrl+roda x4', '5. Ctrl+roda x6', '6. arrastar o mapa']
rot = [leg[0]] + [f'{leg[i]}  ({seq[i][1]})' for i in range(1, len(seq))]
folha(['seq-' + s[0] for s in seq], rot, 'seq-ctrl-roda-1440', 3, 480, 300)
