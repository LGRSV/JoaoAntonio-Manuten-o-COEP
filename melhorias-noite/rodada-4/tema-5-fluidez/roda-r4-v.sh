#!/bin/bash
# "nada quebra" com a lupa no ar: escuro 1440 e 390 (depois claro)
cd "$(dirname "$0")"
mkdir -p verif
fluxo() { node verifica.js antes $1 $2 > medicoes/verifica-antes-$1-$2.log 2>&1; PROTO=1 node verifica.js depois $1 $2 > medicoes/verifica-depois-$1-$2.log 2>&1; }
fluxo escuro 1440 & fluxo escuro 390 &
wait
python3 comparar.py > medicoes/verifica-escuro.md 2>&1
echo FIM > medicoes/fim-v1.txt
fluxo claro 1440 & fluxo claro 390 &
wait
python3 comparar.py > medicoes/verifica.md 2>&1
echo FIM > medicoes/fim-v2.txt
