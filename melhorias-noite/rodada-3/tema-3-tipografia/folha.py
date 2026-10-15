# folha de contato: python3 folha.py saida.jpg largura_cel entrada1 entrada2 ... (lado a lado, mesma altura)
import sys
from PIL import Image
out, *ins = sys.argv[1:]
ims = [Image.open(p).convert('RGB') for p in ins]
H = max(i.height for i in ims)
W = sum(i.width for i in ims) + 8 * (len(ims) - 1)
f = Image.new('RGB', (W, H), (40, 40, 40)); x = 0
for i in ims: f.paste(i, (x, 0)); x += i.width + 8
f.save(out, quality=82)
