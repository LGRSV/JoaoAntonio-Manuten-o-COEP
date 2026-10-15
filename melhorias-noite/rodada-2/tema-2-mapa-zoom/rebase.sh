#!/bin/sh
# Reaplica o zoom sobre a versão ATUAL de alimentador/site/ (o arquivo muda enquanto outras sessões trabalham).
# Merge de três vias: base = orig/ (a versão sobre a qual proto/ foi feito), nova = alimentador/site/, atual = proto/.
# Sem conflito: proto/ já sai atualizado, orig/ passa a ser a nova base e os diffs são regerados. Com conflito: marcas <<<<<<< em proto/ para resolver à mão.
cd "$(dirname "$0")"
S=/home/user/smartled/alimentador/site
if git merge-file proto/mapa-municipios.js orig/mapa-municipios.js $S/mapa-municipios.js; then
  cp $S/mapa-municipios.js $S/site.css orig/
  cat orig/site.css proto/zoom.css > proto/site.css
  diff -u orig/mapa-municipios.js proto/mapa-municipios.js > proto/mapa-municipios.diff
  diff -u orig/site.css proto/site.css > proto/site.css.diff
  node --check proto/mapa-municipios.js && echo "rebase ok"
else
  echo "CONFLITO: resolva as marcas em proto/mapa-municipios.js e rode de novo (orig/ ainda é a base antiga)"; exit 1
fi
