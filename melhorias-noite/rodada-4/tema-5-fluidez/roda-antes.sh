#!/bin/bash
# "antes" = /teste/ atual sem protótipo (perfis: normal e CPU 4x)
cd "$(dirname "$0")"
export PERFIS=base,cpu4
node tab-foco.js antes > medicoes/tab-antes.log 2>&1
node alvos.js antes > medicoes/alvos-antes.log 2>&1
node medir-cls.js antes > medicoes/cls-antes.log 2>&1
node layout-carga.js antes > medicoes/layout-antes-base.log 2>&1
node layout-carga.js antes 4 > medicoes/layout-antes-cpu4.log 2>&1
node redesenho.js antes > medicoes/redesenho-antes.log 2>&1
node medir-alim.js antes alimentador > medicoes/alimentador-antes.log 2>&1
node medir-alim.js antes polos > medicoes/polos-antes.log 2>&1
node medir-lista.js antes > medicoes/lista-antes.log 2>&1
echo FIM > medicoes/fim-antes.txt
