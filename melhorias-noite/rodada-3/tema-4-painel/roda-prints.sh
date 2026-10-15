#!/bin/sh
# gera todos os prints da rodada 3 (antes = site + lupa atual; depois = protótipo consolidado); ver prints.js
cd "$(dirname "$0")"
export NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt
node prints.js lupa --estados=inicial,lupa,camadas,trecho,insp-manut
node prints.js lupa-claro --estados=inicial,camadas,trecho
node prints.js consolidado --estados=inicial,lupa,camadas,trecho,busca,filtros
node prints.js consolidado --alim=LD01072001 --estados=trecho-insp,insp-manut,sem-faixa,municipio,tela-cheia,gaveta,classe
node prints.js claro --estados=inicial,camadas,trecho,lupa
