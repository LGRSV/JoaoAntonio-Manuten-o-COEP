#!/bin/bash
cd "$(dirname "$0")"
export PERFIS=base,cpu4
node alvos.js antes > medicoes/alvos-antes.log 2>&1
node medir-lista.js antes > medicoes/lista-antes.log 2>&1
