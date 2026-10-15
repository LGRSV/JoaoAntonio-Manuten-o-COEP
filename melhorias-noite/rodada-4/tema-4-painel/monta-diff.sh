#!/bin/sh
# Monta proto/final.diff (contra a raiz do repositório): lupa-painel.js (nota da NAE), gera_trechos.py (cabecalho_painel + copia painel.js/painel.css),
# e os arquivos novos alimentador/site/painel.css e painel.js. Confere com git apply --check.
cd "$(dirname "$0")"
R=/home/user/smartled
rm -rf tmp/mont && mkdir -p tmp/mont/a/alimentador/site tmp/mont/a/scripts tmp/mont/b/alimentador/site tmp/mont/b/scripts
cp $R/alimentador/site/lupa-painel.js tmp/mont/a/alimentador/site/; cp proto/lupa-painel.js tmp/mont/b/alimentador/site/
cp $R/scripts/gera_trechos.py tmp/mont/a/scripts/; cp tmp/repo/scripts/gera_trechos.py tmp/mont/b/scripts/
cp proto/painel.css proto/painel.js tmp/mont/b/alimentador/site/
: > tmp/mont/a/alimentador/site/painel.css; : > tmp/mont/a/alimentador/site/painel.js
( cd tmp/mont; diff -ruN a b | sed -e 's#^diff -ruN a/\(.*\) b/.*#diff --git a/\1 b/\1#' ) > proto/final.diff.tmp
# arquivos novos: usar /dev/null como origem
python3 - <<'PY'
import re
s=open('proto/final.diff.tmp').read()
out=[]
for bloco in re.split(r'(?m)^(?=diff --git )', s):
    if not bloco: continue
    m=re.match(r'diff --git a/(\S+) b/(\S+)\n',bloco)
    novo = m.group(1).endswith(('painel.css','painel.js')) and not m.group(1).endswith('lupa-painel.js')
    if novo:
        bloco=re.sub(r'--- a/(\S+)[^\n]*\n\+\+\+ b/(\S+)[^\n]*\n', lambda x: '--- /dev/null\n+++ b/%s\n'%x.group(2), bloco, count=1)
        bloco=re.sub(r'@@ -0,0 \+1,(\d+) @@', r'@@ -0,0 +1,\1 @@', bloco)
        bloco=bloco.replace('diff --git a/','new file mode 100644\ndiff --git a/',0)
        bloco=bloco.replace('\n--- /dev/null','\nnew file mode 100644\n--- /dev/null',1)
    else:
        bloco=re.sub(r'(--- a/\S+)\t[^\n]*', r'\1', bloco); bloco=re.sub(r'(\+\+\+ b/\S+)\t[^\n]*', r'\1', bloco)
    out.append(bloco)
open('proto/final.diff','w').write(''.join(out))
PY
rm proto/final.diff.tmp
cd $R && git apply --check melhorias-noite/rodada-4/tema-4-painel/proto/final.diff && echo "git apply --check: OK"
