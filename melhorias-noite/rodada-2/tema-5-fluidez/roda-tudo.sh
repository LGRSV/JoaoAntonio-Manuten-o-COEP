#!/bin/bash
# reproduz as medições (espelho em :18766 precisa estar de pé: node servidor-espelho.js &)
cd "$(dirname "$0")"
node alvos.js antes > medicoes/alvos-antes.log 2>&1
PROTO=1 node alvos.js depois > medicoes/alvos-depois.log 2>&1
node tab-foco.js antes > medicoes/tab-antes.log 2>&1
PROTO=1 node tab-foco.js depois > medicoes/tab-depois.log 2>&1
node medir-cls.js antes > medicoes/cls-antes.log 2>&1
PROTO=1 node medir-cls.js depois > medicoes/cls-depois.log 2>&1
node medir-alim.js antes alimentador > medicoes/alimentador-antes.log 2>&1
PROTO=1 node medir-alim.js depois alimentador > medicoes/alimentador-depois.log 2>&1
node medir-alim.js antes polos > medicoes/polos-antes.log 2>&1
PROTO=1 node medir-alim.js depois polos > medicoes/polos-depois.log 2>&1
echo FIM > medicoes/fim.txt
