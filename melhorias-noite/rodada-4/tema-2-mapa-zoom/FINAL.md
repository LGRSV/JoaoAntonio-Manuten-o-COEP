# FINAL · Tema 2 · Mapa: zoom e interatividade

Base: HEAD `ff40f52` (alimentador/site/ idêntico ao `/teste/` ao vivo e à base da rodada 3, `8ab7caf`; `cmp` byte a byte). O `rebase.sh` rodou contra o HEAD atual: **"rebase ok", sem conflito**. `git apply --check` na raiz do repositório: **aplica**; aplicado numa cópia, reproduz `proto/mapa-municipios.js` e `proto/site.css` byte a byte e passa `node --check`. Nada foi alterado fora desta pasta; sem commit, push nem Artifact.

**Entrega:** `proto/final.diff` (2 arquivos: `mapa-municipios.js` +276/−21 em 16 trechos, `site.css` +31 no fim) e `zoom.css` (as mesmas 31 linhas, para quem prefere acrescentar ao fim do `site.css`). Nenhuma mudança em `gera_trechos.py` nem em arquivo novo do site.

## O que muda (6 tópicos)
1. **Ctrl/⌘ + roda aproxima o mapa** (centrado no cursor; limite de 26 px de tela por unidade do mapa, ≈ ×7 a ×8); rolar sem Ctrl continua rolando a página e mostra o aviso "Use Ctrl + rolagem". Arrastar move o mapa; Esc enquadra (o Esc seguinte sobe um nível, como já era).
2. **Celular**: pinça de dois dedos amplia o **mapa** (antes ampliava a página inteira: `visualViewport.scale` = 5) e um dedo arrasta; um dedo só rola a página e mostra "use dois dedos".
3. **Zoom semântico**: com o mapa aproximado cada município ganha o cartão preto com nome e NAE (do maior NAE para o menor, até 70), sem sobreposição e sempre dentro do próprio município.
4. **Botões + · ×N · − · ↺** no canto (alvo de 40 px, o `--alvo` do site) e teclas `+ − 0`.
5. **Convivência**: bandeirinhas das regionais/polos somem durante o gesto e voltam recalculadas (até ×1,8; acima disso saem de cena), legenda recolhida (cartões só com o nome), tela cheia (solta o zoom e funciona lá dentro), busca (`ARGOS_MAPA.vai`), clique no alimentador e lupa do painel.
6. **Cache dos pontos do contorno** (`contorno()`/`ptsContorno`, um `WeakMap` por elemento do contorno), pequeno e seguro (12 linhas): pode sair sozinho e melhora a base mesmo sem zoom.

## Números antes → depois
Chromium por software em máquina compartilhada: vale para comparar, não é FPS de aparelho. As linhas de fps e recálculo são da rodada 3 (carga 7 a 15; a base de código é a mesma, `cmp` idêntico); a medição refeita hoje, com carga 14 a 25 por causa dos outros agentes, ficou ruidosa demais (fps 12 a 39 inclusive na base) e só serve para a contagem de chamadas (`medidas-r4-carga-alta.json`).
| Medida | Antes | Depois |
|---|---|---|
| Ctrl + roda ×5 no estado | nada acontece | ×3,7, 42 cartões nome+NAE |
| Pinça no celular (390×844) | amplia a página (escala 5) | amplia o mapa (escala da página 1; ×3,3, 26 cartões) |
| Tempo em `getPointAtLength` abrindo regional/voltando/abrindo outra | 74 a 120 ms (720 a 990 chamadas) na rodada 3; 162 a 282 ms (990) hoje, sob carga 14 a 25 | 23 a 44 ms (450) na rodada 3; 47 a 59 ms (450) hoje: ~4× menos nas duas medições |
| Abrir a regional, fps (rodada 3, mesma base) | 37,9 | 46 (sem piora; celular CPU 4×: 44,6 → 41,7/52,5) |
| Recalcular cartões depois do gesto (uma vez, 110 ms parado) | n/a | estado ×1,7: 38 a 59 ms (desktop), 31 a 108 ms (celular CPU 4×) |
| Ctrl+roda ×10 / arrastar 40 passos, fps | n/a | 42 a 46 / 50 a 59 |

**Testes desta rodada, rodados de novo depois do último ajuste (todos passam):** `teste-zoom.js` desktop, **76 verificações** · `teste-zoom-celular.js` toques CDP 390×844, **37** · `teste-painel.js` (novo), **17**: com o zoom ligado, 1 clique num alimentador da lista abre o painel; 1 clique na rede abre; arrastar a partir da rede **não** abre; a lupa do painel (`.lp-lupa`) monta em desktop e celular. Escuro e claro cobertos (cartões sem sobreposição no claro). Prints: `prints-finais/` (4 pares × 1440 e 390, `01-estado-ctrl-roda`, `02-regional-zoom`, `03-polo-zoom`, `04-claro-estado-zoom`, mais a sequência `seq-ctrl-roda-1440.jpg`: 1× → roda ×1 → ×2 → ×4 → ×6 → arrastar, com ×1,3 · ×1,7 · ×2,9 · ×4,9). Nos pares 390 o "antes" mostra a página inteira ampliada pela pinça (é o defeito).

## O que implementar primeiro
| # | O quê | Esforço |
|---|---|---|
| 1 | `contorno()` com cache (hunk isolado; ganho sem zoom) | P |
| 2 | Zoom completo (`final.diff`) | M |
| 3 | Teste em aparelho real (iPhone Safari, Android Chrome) e pinça de trackpad do Safari (`gesturechange`, hoje só Ctrl+roda e botões) | P a M |
| 4 | Balão do mouse sem repetir nome/NAE do cartão (já é o foco do tema 1, ver conflito abaixo) | P |
| 5 | NAE dentro do `aria-label` dos municípios (cartões são `aria-hidden`) | P |

## Riscos
- Aparelho real não testado (CDP em Chromium emulado); a pinça só é bloqueada **sobre o mapa** (`touch-action: pan-x pan-y`); alternativas: botões e teclas.
- Teste do celular: em 1 de 4 execuções, sob carga 20 da máquina, uma verificação falhou ("Palmas → Lajeado": o centro do cartão de Palmas caiu sobre o município vizinho logo depois da pinça na regional, 250 ms depois de assentar); as outras 3 execuções e a anterior passaram 37/37. Parece corrida de tempo do teste sob carga (o cartão ainda assentava), mas vale conferir em aparelho real.
- O recálculo roda na thread principal: em celular fraco os cartões voltam ~0,1 a 0,2 s depois de parar.
- Com zoom no estado/regional não há fios dos rótulos (teia): quem não cabe dentro fica sem cartão.

## Toca nos arquivos/funções (para juntar os 5 temas)
Só `alimentador/site/mapa-municipios.js` e `alimentador/site/site.css`. No JS (marcado "ZOOM"): bloco novo grande (~220 linhas) antes do fim do arquivo com `ligaZ/aplica/limita/zoomaF/recalcZ/fimZ/zLimpa/enquadraZ/dicaZoom` e `ARGOS_MAPA.zoom`; **alterados**: `contorno()` (cache), `bandeiras()` (botão do zoom como obstáculo, `bandFios`), `voa()` (fim: `if (Z) fimZ(); else {...}`, `nivelVb`, `zLimpa()`), `escala()`, `poeNomes()` (ramo novo para estado/regional com zoom; chave do cache inclui legenda aberta/recolhida), `ResizeObserver` da caixa e tratamento do Esc, clique na rede (engole o clique após arrastar). No CSS: 31 linhas **no fim** (`.mt-zoom`, `.mt-zdica`, `.mexe`, `.zoom-longe`, `.mt-mapa{touch-action}`).

**Conflitos com os outros finais** (testado com `git merge-file` sobre a base, contra cada `final.diff` dos temas 1, 3 e 5):
- `site.css`: 1 conflito trivial com cada um (todos acrescentam ao **fim**; manter os dois blocos).
- Tema 5: 1 conflito trivial em `mapa-municipios.js` (`#mt-aviso` aria-live, perto do mesmo ponto onde o zoom monta o aviso; manter os dois).
- Tema 1: 1 conflito em `mapa-municipios.js` no balão do mouse (`mouseover`/`mede`); o do tema 1 é o certo (balão sem repetir), o zoom só mexe ali por causa do `semGesto`; resolver à mão em poucos minutos.
- Tema 3: **3 conflitos reais em `poeNomes()`** (ele reescreve os rótulos do polo com cartão dentro/fora e o `tenta`; o zoom acrescenta o ramo estado/regional com zoom no começo da função). Resolução: aplicar o do tema 3 e reencaixar o ramo `Z` do zoom (guarda `if (Z && !pol) {...; return}` antes da lógica do polo); depois rodar `teste-zoom.js` e `teste-zoom-celular.js`.
- Ordem sugerida: temas 1, 3, 5, depois o zoom (`rebase.sh` refaz o merge de três vias com o `node --check` e acusa o que sobrar).

Reprodução: `./rebase.sh` · `node teste-zoom.js` · `node teste-zoom-celular.js` · `node teste-painel.js` · `node prints-finais.js && python3 folha-final.py` (defina `ARGOS_CACHE`; o HTML vem do `/teste/` ao vivo por `curl`). Logs: `teste-*.log`.
