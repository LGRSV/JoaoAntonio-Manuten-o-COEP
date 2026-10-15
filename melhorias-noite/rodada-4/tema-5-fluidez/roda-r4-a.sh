#!/bin/bash
# cadeia A (carga/CLS/gestos): antes e depois alternados
cd "$(dirname "$0")"
export PERFIS=base,cpu4 N=3
node medir-cls.js antes > medicoes/cls-antes.log 2>&1
PROTO=1 node medir-cls.js depois > medicoes/cls-depois.log 2>&1
node layout-carga.js antes > medicoes/layout-antes-base.log 2>&1
PROTO=1 node layout-carga.js depois > medicoes/layout-depois-base.log 2>&1
node layout-carga.js antes 4 > medicoes/layout-antes-cpu4.log 2>&1
PROTO=1 node layout-carga.js depois 4 > medicoes/layout-depois-cpu4.log 2>&1
node medir-alim.js antes alimentador > medicoes/alimentador-antes.log 2>&1
PROTO=1 node medir-alim.js depois alimentador > medicoes/alimentador-depois.log 2>&1
node redesenho.js antes > medicoes/redesenho-antes.log 2>&1
PROTO=1 node redesenho.js depois > medicoes/redesenho-depois.log 2>&1
echo FIM > medicoes/fim-a.txt
