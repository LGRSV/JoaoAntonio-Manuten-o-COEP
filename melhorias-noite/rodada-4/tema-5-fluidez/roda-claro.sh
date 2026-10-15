#!/bin/bash
# tema claro: CLS (N=2) e, depois, carga da página do alimentador (N=2, sem interação)
cd "$(dirname "$0")"
export TEMA=claro PERFIS=base,cpu4 N=2
if [ "$1" = "cls" ]; then
  node medir-cls.js antes > medicoes/cls-antes-claro.log 2>&1
  PROTO=1 node medir-cls.js depois > medicoes/cls-depois-claro.log 2>&1
else
  INTERACAO=0 node medir-alim.js antes alimentador > medicoes/alimentador-antes-claro.log 2>&1
  INTERACAO=0 PROTO=1 node medir-alim.js depois alimentador > medicoes/alimentador-depois-claro.log 2>&1
  echo FIM > medicoes/fim-claro.txt
fi
