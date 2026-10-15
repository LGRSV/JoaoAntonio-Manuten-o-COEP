# Gera prints/00-fps-antes-depois-1440.jpg a partir de medicoes/animacao-antes.json e animacao-depois.json
import json, matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
a=json.load(open('medicoes/animacao-antes.json')); d=json.load(open('medicoes/animacao-depois.json'))
etapas=['3 abrir município','4 zoom no alimentador','5 Esc (volta ao município)']
cenas=[('desktop|base','Desktop normal'),('desktop|cpu4','Desktop, CPU 4x'),('celular|base','Celular normal'),('celular|cpu4','Celular, CPU 4x')]
fig,axs=plt.subplots(1,4,figsize=(14.4,4.4),sharey=True); fig.patch.set_facecolor('#000')
for ax,(k,t) in zip(axs,cenas):
    ax.set_facecolor('#000'); xs=range(len(etapas)); w=.38
    va=[a[k][e]['fps'] for e in etapas]; vd=[d[k][e]['fps'] for e in etapas]
    b1=ax.bar([x-w/2 for x in xs],va,w,color='#8a8f94',label='Antes'); b2=ax.bar([x+w/2 for x in xs],vd,w,color='#e8743b',label='Depois (protótipo)')
    for r in list(b1)+list(b2): ax.text(r.get_x()+r.get_width()/2,r.get_height()+1,f'{r.get_height():.0f}',ha='center',color='#f3f4f4',fontsize=10)
    ax.axhline(60,color='#444',lw=1,ls='--'); ax.axhline(30,color='#444',lw=1,ls=':')
    ax.set_title(t,color='#f3f4f4',fontsize=12); ax.set_xticks(list(xs)); ax.set_xticklabels(['abrir\nmunicípio','zoom no\nalimentador','Esc: volta ao\nmunicípio'],color='#c9cdd0',fontsize=9)
    ax.tick_params(colors='#c9cdd0'); [s.set_color('#333') for s in ax.spines.values()]; ax.set_ylim(0,70)
axs[0].set_ylabel('quadros por segundo (mediana de 3)',color='#c9cdd0')
h,l=axs[0].get_legend_handles_labels(); fig.legend(h,l,loc='lower center',ncol=2,facecolor='#111',edgecolor='#333',labelcolor='#f3f4f4',fontsize=10)
fig.suptitle('Fluidez nas animações do mapa: antes e depois (60 = ideal; 30 = limite do incômodo)',color='#f3f4f4',fontsize=13)
plt.tight_layout(rect=[0,.07,1,.94]); plt.savefig('prints/00-fps-antes-depois-1440.jpg',dpi=100,facecolor='#000',pil_kwargs={'quality':85})
