#!/bin/bash
# "nada quebra": 4 fluxos em paralelo (escuro/claro x 1440/390), cada um antes e depois; depois compara pixels e fatos
cd "$(dirname "$0")"
rm -rf verif; mkdir -p verif
fluxo() { node verifica.js antes $1 $2 > medicoes/verifica-antes-$1-$2.log 2>&1; PROTO=1 node verifica.js depois $1 $2 > medicoes/verifica-depois-$1-$2.log 2>&1; }
fluxo escuro 1440 & fluxo escuro 390 & fluxo claro 1440 & fluxo claro 390 &
wait
python3 comparar.py > medicoes/verifica.md
echo FIM > medicoes/fim-verifica.txt
