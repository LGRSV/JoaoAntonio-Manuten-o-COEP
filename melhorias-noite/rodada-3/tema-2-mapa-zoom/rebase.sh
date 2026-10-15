#!/bin/sh
# Reaplica o zoom sobre a versão ATUAL de alimentador/site/ (o arquivo muda enquanto outras sessões trabalham).
# Merge de três vias: base = orig/ (a versão sobre a qual proto/ foi feito), nova = alimentador/site/, atual = proto/.
# Sem conflito: proto/ já sai atualizado, orig/ passa a ser a nova base e os diffs são regerados. Com conflito: o merge sai numa cópia
# (proto/_merge.conflito.js) com as marcas <<<<<<<, e proto/ e orig/ ficam como estavam.
# Cuidado: copie para orig/ só uma versão COMPLETA (outra sessão pode estar no meio de uma edição); o ideal é a do último commit
# (git show HEAD:alimentador/site/mapa-municipios.js).
cd "$(dirname "$0")"
S=/home/user/smartled/alimentador/site
cp proto/mapa-municipios.js proto/_merge.conflito.js
if git merge-file proto/_merge.conflito.js orig/mapa-municipios.js $S/mapa-municipios.js && node --check proto/_merge.conflito.js; then
  mv proto/_merge.conflito.js proto/mapa-municipios.js
  cp $S/mapa-municipios.js $S/site.css orig/
  cat orig/site.css proto/zoom.css > proto/site.css
  diff -u orig/mapa-municipios.js proto/mapa-municipios.js > proto/mapa-municipios.diff
  diff -u orig/site.css proto/site.css > proto/site.css.diff
  echo "rebase ok"
else
  echo "CONFLITO: resolva as marcas em proto/_merge.conflito.js, copie por cima de proto/mapa-municipios.js e rode de novo"; exit 1
fi
