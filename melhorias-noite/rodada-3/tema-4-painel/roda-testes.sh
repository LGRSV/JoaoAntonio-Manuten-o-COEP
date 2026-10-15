#!/bin/sh
# testes de interação do protótipo (um arquivo por alimentador); ver testes.js
cd "$(dirname "$0")"
export NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt
for a in LD01072001 AL03037009 LD02022033 AL01015049; do node testes.js --alim=$a --out=testes-$a.json 2>&1 | grep -E "FALHA|falhas"; done
