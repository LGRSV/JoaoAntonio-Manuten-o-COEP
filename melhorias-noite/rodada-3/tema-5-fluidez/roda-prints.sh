#!/bin/bash
cd "$(dirname "$0")"
mkdir -p prints
node prints.js > medicoes/prints-escuro.log 2>&1 &
TEMA=claro node prints.js > medicoes/prints-claro.log 2>&1 &
wait
echo FIM > medicoes/fim-prints.txt
