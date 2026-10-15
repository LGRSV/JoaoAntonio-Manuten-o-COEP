#!/bin/sh
# prints do tema 4 (rodada 4, final): antes = /teste/ ao vivo; depois = com o final.diff. Antes: python3 gera-paginas.py
cd "$(dirname "$0")"
export NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt
for c in antes depois antes-claro depois-claro; do node prints.js $c --alim=LD01072001 --estados=inicial,lupa,camadas,trecho 2>&1 | grep -E "^ok|ERRO"; done
node prints.js antes depois --alim=AL03037009 --estados=inicial,trecho 2>&1 | grep -E "^ok|ERRO"
