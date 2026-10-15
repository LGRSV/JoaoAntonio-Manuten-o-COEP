#!/bin/bash
# 2ª parte: carga do alimentador e do ranking com os ajustes de JS (fmt) + ablação só com a lista (content-visibility)
cd "$(dirname "$0")"
PROTO=1 node medir-alim.js depois alimentador > medicoes/alimentador-depois.log 2>&1
PROTO=1 node medir-alim.js depois polos > medicoes/polos-depois.log 2>&1
PROTO_ITENS=lista node medir-alim.js so-lista alimentador > medicoes/alimentador-so-lista.log 2>&1
PROTO_ITENS=vaos node medir-alim.js so-vaos alimentador > medicoes/alimentador-so-vaos.log 2>&1
PROTO_ITENS=fmt node medir-alim.js so-fmt alimentador > medicoes/alimentador-so-fmt.log 2>&1
echo FIM > medicoes/fim2.txt
