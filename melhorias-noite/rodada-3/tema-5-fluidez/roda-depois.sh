#!/bin/bash
# "depois" = /teste/ atual + protótipo único (PROTO=1), mesmos perfis do roda-antes.sh
cd "$(dirname "$0")"
export PERFIS=base,cpu4 PROTO=1
node tab-foco.js depois > medicoes/tab-depois.log 2>&1
node alvos.js depois > medicoes/alvos-depois.log 2>&1
node medir-cls.js depois > medicoes/cls-depois.log 2>&1
node layout-carga.js depois > medicoes/layout-depois-base.log 2>&1
node layout-carga.js depois 4 > medicoes/layout-depois-cpu4.log 2>&1
node redesenho.js depois > medicoes/redesenho-depois.log 2>&1
node medir-alim.js depois alimentador > medicoes/alimentador-depois.log 2>&1
node medir-alim.js depois polos > medicoes/polos-depois.log 2>&1
node medir-lista.js depois > medicoes/lista-depois.log 2>&1
echo FIM > medicoes/fim-depois.txt
