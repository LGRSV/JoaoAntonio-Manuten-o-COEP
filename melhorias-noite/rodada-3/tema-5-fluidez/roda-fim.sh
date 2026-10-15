#!/bin/bash
# depois da correção da orelha/cartões no toque: refaz o que depende dela (alvos, verificação "depois", prints) em paralelo
cd "$(dirname "$0")"
(PROTO=1 node alvos.js depois > medicoes/alvos-depois.log 2>&1; node alvos.js antes > medicoes/alvos-antes.log 2>&1) &
(for t in escuro claro; do for v in 1440 390; do PROTO=1 node verifica.js depois $t $v > medicoes/verifica-depois-$t-$v.log 2>&1; done; done) &
(node prints.js > medicoes/prints-escuro.log 2>&1; TEMA=claro node prints.js > medicoes/prints-claro.log 2>&1) &
wait
echo FIM > medicoes/fim-final.txt
