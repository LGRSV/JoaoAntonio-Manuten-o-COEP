#!/bin/bash
cd "$(dirname "$0")"
PROTO=1 PROTO_FONTES=1 N=3 PAGINAS=inicial,polos node medir-carga.js depois-home > /tmp/g-carga-depois.log 2>&1
PROTO=1 node a11y.js depois > /tmp/g-a11y-depois.log 2>&1
node travas-menu.js > /tmp/g-menu.log 2>&1
node prints.js > /tmp/g-prints.log 2>&1
echo fim > /tmp/g-fim
