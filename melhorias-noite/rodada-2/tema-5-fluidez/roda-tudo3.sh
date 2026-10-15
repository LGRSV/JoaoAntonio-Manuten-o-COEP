#!/bin/bash
cd "$(dirname "$0")"
PROTO=1 node medir-alim.js depois alimentador > medicoes/alimentador-depois.log 2>&1
node medir-alim.js antes alimentador > medicoes/alimentador-antes.log 2>&1
PROTO=1 node polos-inp.js depois > medicoes/polos-inp-depois.log 2>&1
node polos-inp.js antes > medicoes/polos-inp-antes.log 2>&1
echo FIM > medicoes/fim3.txt
