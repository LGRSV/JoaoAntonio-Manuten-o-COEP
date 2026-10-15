#!/bin/bash
# repete a lista em ordem alternada (reduz o efeito da máquina compartilhada) e isola o content-visibility
cd "$(dirname "$0")"
export PERFIS=cpu4 N=3
node alvos.js antes > medicoes/alvos-antes.log 2>&1
PROTO=1 node alvos.js depois > medicoes/alvos-depois.log 2>&1
for r in 1 2; do
  node medir-lista.js ab-antes-$r > medicoes/lista-ab-antes-$r.log 2>&1
  PROTO=1 node medir-lista.js ab-depois-$r > medicoes/lista-ab-depois-$r.log 2>&1
  PROTO=1 PROTO_SEM=lista node medir-lista.js ab-semlista-$r > medicoes/lista-ab-semlista-$r.log 2>&1
done
echo FIM > medicoes/fim-ab.txt
