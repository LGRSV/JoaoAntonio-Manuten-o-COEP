#!/bin/sh
# copia os prints escolhidos (tmp/prints) para prints-finais/ com os nomes pedidos (NN-assunto-antes|depois-1440|390.jpg) e o resto para antes-depois/
cd "$(dirname "$0")"; mkdir -p prints-finais antes-depois
n=0
for par in inicial:cabecalho-e-mapa lupa:lupa-e-nota-da-nae trecho:trecho-em-abas camadas:camadas-e-legendas; do
  n=$((n+1)); est=${par%%:*}; nome=${par##*:}
  for v in d:1440 m:390; do
    vp=${v%%:*}; px=${v##*:}
    cp tmp/prints/antes-LD01072001-$vp-$est.jpg  prints-finais/0$n-$nome-antes-$px.jpg
    cp tmp/prints/depois-LD01072001-$vp-$est.jpg prints-finais/0$n-$nome-depois-$px.jpg
  done
done
cp tmp/prints/*.jpg antes-depois/
ls prints-finais
