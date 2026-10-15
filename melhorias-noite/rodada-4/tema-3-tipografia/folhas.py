# monta as folhas de comparação usadas no README (a partir de prints/*.jpg). Uso: python3 folhas.py
from PIL import Image
P = 'prints/'
POL = [('araguaina','Araguaína'),('augustinopolis','Augustinópolis'),('guarai','Guaraí'),('palmas','Palmas'),('porto','Porto Nacional'),('paraiso','Paraíso'),('gurupi','Gurupi'),('dianopolis','Dianópolis')]
def abre(n): return Image.open(P+n).convert('RGB')
def grade(nomes, cols, esc, saida):
    ims = [abre(n) for n in nomes]; ims = [i.resize((int(i.width*esc), int(i.height*esc)), Image.LANCZOS) for i in ims]
    w, h = ims[0].size; g = 6; lin = (len(ims)+cols-1)//cols
    f = Image.new('RGB', (cols*w+(cols-1)*g, lin*h+(lin-1)*g), (60,60,60))
    for k, i in enumerate(ims): f.paste(i, ((k%cols)*(w+g), (k//cols)*(h+g)))
    f.save(P+saida, quality=80); print(saida, f.size)
for modo in ('antes','depois'):
    for tema in ('dark','light'):
        grade([f'{modo}-polo-{s}-{tema}-desk.jpg' for s,_ in POL], 2, .5, f'folha-{modo}-8polos-{tema}-desk.jpg')
        grade([f'{modo}-polo-{s}-{tema}-cel.jpg' for s,_ in POL], 8, .5, f'folha-{modo}-8polos-{tema}-cel.jpg')
# celular, antes e depois lado a lado, polos mais densos
for tema in ('dark','light'):
    grade([f'{m}-polo-{s}-{tema}-cel.jpg' for s in ('augustinopolis','guarai','paraiso') for m in ('antes','depois')], 6, .75, f'folha-cel-antes-depois-{tema}.jpg')
