#!/bin/sh
# Reaplica o zoom sobre a versão ATUAL de alimentador/site/ (o arquivo muda enquanto outras sessões trabalham).
# Merge de três vias: base = orig/ (a versão sobre a qual proto/ foi feito), nova = alimentador/site/, atual = proto/.
# Sem conflito (e node --check ok): proto/ já sai atualizado, orig/ passa a ser a nova base e os diffs são regerados
# (proto/mapa-municipios.diff e proto/site.css.diff, aplicáveis com: cd alimentador/site && patch -p1 < .../proto/X.diff).
# Com conflito: o merge sai em proto/_merge.conflito.js com as marcas <<<<<<<, e proto/ e orig/ ficam como estavam.
# Cuidado: orig/ deve receber só uma versão COMPLETA (outra sessão pode estar no meio de uma edição); o ideal é a do último commit
# (git show HEAD:alimentador/site/mapa-municipios.js). Depois do rebase rode: node teste-zoom.js && node teste-zoom-celular.js
cd "$(dirname "$0")"
S=/home/user/smartled/alimentador/site
cp proto/mapa-municipios.js proto/_merge.conflito.js
if git merge-file proto/_merge.conflito.js orig/mapa-municipios.js $S/mapa-municipios.js && node --check proto/_merge.conflito.js; then
  mv proto/_merge.conflito.js proto/mapa-municipios.js
  cp $S/mapa-municipios.js $S/site.css orig/
  cat orig/site.css proto/zoom.css > proto/site.css
  diff -u --label a/mapa-municipios.js --label b/mapa-municipios.js orig/mapa-municipios.js proto/mapa-municipios.js > proto/mapa-municipios.diff
  diff -u --label a/site.css --label b/site.css orig/site.css proto/site.css > proto/site.css.diff
  echo "rebase ok"
else
  echo "CONFLITO: resolva as marcas em proto/_merge.conflito.js, copie por cima de proto/mapa-municipios.js e rode de novo"; exit 1
fi
