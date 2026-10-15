#!/bin/bash
# cadeia B (Tab, alvos, lista A/B)
cd "$(dirname "$0")"
export PERFIS=base,cpu4 N=3
node tab-foco.js antes > medicoes/tab-antes.log 2>&1
PROTO=1 node tab-foco.js depois > medicoes/tab-depois.log 2>&1
node alvos.js antes > medicoes/alvos-antes.log 2>&1
PROTO=1 node alvos.js depois > medicoes/alvos-depois.log 2>&1
node medir-lista.js antes > medicoes/lista-antes.log 2>&1
PROTO=1 node medir-lista.js depois > medicoes/lista-depois.log 2>&1
PROTO=1 PROTO_SEM=lista node medir-lista.js semlista > medicoes/lista-semlista.log 2>&1
node medir-lista.js antes2 > medicoes/lista-antes2.log 2>&1
PROTO=1 node medir-lista.js depois2 > medicoes/lista-depois2.log 2>&1
PROTO=1 PROTO_SEM=lista node medir-lista.js semlista2 > medicoes/lista-semlista2.log 2>&1
echo FIM > medicoes/fim-b.txt
