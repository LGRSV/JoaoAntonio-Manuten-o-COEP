#!/bin/bash
# Rodada final de medições: antes e depois (protótipo) em sequência. Uso: bash roda-final.sh
cd "$(dirname "$0")"
N=3 PAGINAS=inicial,polos node medir-carga.js antes-home > /tmp/f-carga-antes.log 2>&1
PROTO=1 PROTO_FONTES=1 N=3 PAGINAS=inicial,polos node medir-carga.js depois-home > /tmp/f-carga-depois.log 2>&1
N=2 PAGINAS=alimentador node medir-carga.js antes-alimentador > /tmp/f-carga-al.log 2>&1
N=3 node medir-animacao.js antes > /tmp/f-anim-antes.log 2>&1
PROTO=1 N=3 node medir-animacao.js depois > /tmp/f-anim-depois.log 2>&1
node travas.js antes > /tmp/f-travas-antes.log 2>&1
PROTO=1 node travas.js depois > /tmp/f-travas-depois.log 2>&1
node tab-foco.js antes > /tmp/f-tab-antes.log 2>&1
PROTO=1 node tab-foco.js depois > /tmp/f-tab-depois.log 2>&1
node a11y.js antes > /tmp/f-a11y-antes.log 2>&1
PROTO=1 node a11y.js depois > /tmp/f-a11y-depois.log 2>&1
echo fim > /tmp/f-fim
