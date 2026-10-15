## CLS por página (mediana de 3 cargas a frio, tema escuro)

| Página · dispositivo · perfil | CLS antes → depois | FCP (ms) antes → depois |
|---|---|---|
| inicio · computador · normal | 0,0700 → 0,0079 | 124 → 96 |
| inicio · computador · CPU 4x | 0,0699 → 0,0079 | 244 → 268 |
| polos · computador · normal | 0,0367 → 0,0001 | 88 → 128 |
| polos · computador · CPU 4x | 0,0384 → 0,0001 | 196 → 224 |
| alimentador · computador · normal | 0,0551 → 0,0000 | 176 → 160 |
| alimentador · computador · CPU 4x | 0,0581 → 0,0009 | 224 → 568 |
| inicio · celular · normal | 0,0000 → 0,0000 | 108 → 304 |
| inicio · celular · CPU 4x | 0,0000 → 0,0000 | 228 → 404 |
| polos · celular · normal | 0,0000 → 0,0000 | 80 → 116 |
| polos · celular · CPU 4x | 0,0585 → 0,0000 | 224 → 304 |
| alimentador · celular · normal | 0,0592 → 0,0000 | 152 → 172 |
| alimentador · celular · CPU 4x | 0,0621 → 0,0000 | 256 → 400 |

## Página do alimentador LD02022033: carga (mediana de 3)

| Dispositivo · perfil | Pronto (ms) | LCP (ms) | TBT (ms) | Maior long task (ms) | CLS | Nós DOM |
|---|---|---|---|---|---|---|
| computador · normal | 1.192 → 1.186 | 2.228 → 2.028 | 1.601 → 1.332 | 429 → 389 | 0,0551 → 0,0000 | 9.127 → 9.127 |
| computador · CPU 4x | 4.178 → 2.593 | 4.328 → 3.180 | 6.216 → 3.161 | 1.338 → 942 | 0,0581 → 0,0009 | 9.127 → 9.127 |
| celular · normal | 1.109 → 887 | 2.420 → 1.452 | 1.676 → 798 | 530 → 317 | 0,0621 → 0,0363 | 9.118 → 9.118 |
| celular · CPU 4x | 3.937 → 2.436 | 4.240 → 3.808 | 6.650 → 2.829 | 1.885 → 874 | 0,0621 → 0,0000 | 9.118 → 9.118 |

### Interação com o mapa (Leaflet): fps · pior quadro (ms)

| Dispositivo · perfil · gesto | fps | Pior quadro (ms) | Long tasks (máx ms) |
|---|---|---|---|
| computador · normal · arrastar | 51,0 → 53,0 | 217 → 100 | 196 → 75 |
| computador · normal · zoom-roda | 30,7 → 34,2 | 250 → 200 | 155 → 127 |
| computador · normal · hover-linhas | 59,0 → 56,9 | 33 → 67 | 0 → 0 |
| computador · CPU 4x · arrastar | 43,8 → 51,1 | 650 → 200 | 138 → 73 |
| computador · CPU 4x · zoom-roda | 18,0 → 18,2 | 483 → 317 | 397 → 273 |
| computador · CPU 4x · hover-linhas | 51,7 → 55,1 | 133 → 67 | 0 → 0 |
| celular · normal · arrastar | 57,6 → 59,2 | 33 → 33 | 0 → 0 |
| celular · normal · pinca | 53,1 → 52,4 | 217 → 167 | 283 → 95 |
| celular · normal · hover-linhas | 56,1 → 60,0 | 50 → 17 | 0 → 0 |
| celular · CPU 4x · arrastar | 57,3 → 58,5 | 33 → 50 | 0 → 0 |
| celular · CPU 4x · pinca | 26,8 → 29,6 | 867 → 417 | 320 → 272 |
| celular · CPU 4x · hover-linhas | 58,1 → 56,0 | 33 → 50 | 0 → 0 |

## Ranking (polos/): carga (mediana de 3)

| Dispositivo · perfil | Pronto (ms) | LCP (ms) | TBT (ms) | Maior long task (ms) | CLS | Nós DOM |
|---|---|---|---|---|---|---|
| computador · normal | 260 → 215 | 112 → 124 | 17 → 10 | 64 → 60 | 0,0367 → 0,0001 | 1.491 → 1.491 |
| computador · CPU 4x | 772 → 775 | 316 → 228 | 399 → 392 | 249 → 229 | 0,0367 → 0,0001 | 1.491 → 1.491 |
| celular · normal | 376 → 214 | 180 → 80 | 111 → 17 | 114 → 67 | 0,0000 → 0,0000 | 1.488 → 1.488 |
| celular · CPU 4x | 792 → 776 | 320 → 228 | 434 → 492 | 274 → 311 | 0,0002 → 0,0000 | 1.488 → 1.488 |

## Lista de trechos (1.019 linhas, aparece ao buscar): custo da ação até o 2º quadro (ms) e rolagem

| Dispositivo · perfil | Mostrar (digitar "T3-A", "T3") | Filtrar | Limpar | Rolagem fps | Pior quadro na rolagem | Clique numa linha |
|---|---|---|---|---|---|---|
| computador · normal | 682 → 159 | 52 → 29 | 259 → 43 | 51,1 → 51,1 | 117 → 50 | 491 → 133 |
| computador · CPU 4x | 1.268 → 622 | 180 → 130 | 244 → 227 | 26,2 → 14,2 | 133 → 267 | 1.084 → 687 |
| celular · normal | 499 → 174 | 362 → 126 | 119 → 55 | 59,2 → 60,0 | 33 → 17 | 784 → 134 |
| celular · CPU 4x | 1.051 → 610 | 620 → 464 | 224 → 146 | 56,2 → 60,0 | 67 → 17 | 849 → 633 |

## Estilo + layout e scripts na carga da página do alimentador (trace, mediana de 3, ms)

| Perfil | Estilo+layout | Layout | Estilo | EvaluateScript | Commit |
|---|---|---|---|---|---|
| normal | 942 → 683 | 610 → 461 | 346 → 200 | 813 → 691 | 241 → 109 |
| CPU 4x | 3.250 → 1.723 | 1.932 → 1.315 | 1.218 → 483 | 2.034 → 1.752 | 764 → 301 |

## Redesenho da camada de linhas (a cada fim de zoom ou arrasto), ms, mediana de 8

| Perfil | visão geral | +2 níveis | +4 níveis | anéis no canvas |
|---|---|---|---|---|
| normal | 60,7 → 22,7 | 34,7 → 7,0 | 2,1 → 1,5 | 52.548 → 8.104 |
| CPU 4x | 133,9 → 54,3 | 91,7 → 27,4 | 2,0 → 6,0 | 52.548 → 8.104 |

## Tab e leitor de tela (computador; celular igual ou +1 parada)

| Nível | Paradas do Tab | Paradas invisíveis/sem sentido | Aviso ao entrar (caracteres) |
|---|---|---|---|
| estado · computador | 9 → 9 | 0 → 0 | nada → nada |
| estado · celular | 9 → 9 | 0 → 0 | nada → nada |
| regional · computador | 14 → 11 | 3 → 0 | nada → 82 |
| regional · celular | 14 → 11 | 3 → 0 | nada → 82 |
| polo · computador | 12 → 9 | 3 → 0 | nada → 73 |
| polo · celular | 12 → 9 | 3 → 0 | nada → 73 |
| municipio · computador | 13 → 9 | 3 → 0 | 395 → 61 |
| municipio · celular | 13 → 9 | 3 → 0 | 395 → 61 |
| alimentador · computador | 13 → 10 | 3 → 0 | nada → 108 |
| alimentador · celular | 13 → 10 | 3 → 0 | nada → 108 |

## Alvos de toque < 44 px no celular (390 px; sem contar os paths de município)

| Tela | antes → depois | o que sobra |
|---|---|---|
| estado | 5 → 1 | Legenda NAE-Vegetação[48x22] |
| regional | 10 → 1 | Legenda NAE-Vegetação[48x22] |
| polo | 8 → 1 | Legenda NAE-Vegetação[48x22] |
| municipio | 8 → 0 | – |
| alimentador | 9 → 0 | – |
| busca-aberta | 4 → 1 | Legenda NAE-Vegetação[48x22] |
| legenda-recolhida | 8 → 0 | – |
| menu-aberto | 11 → 1 | Legenda NAE-Vegetação[104x30] |
| polos | 12 → 0 | – |
| alimentador-pagina | 30 → 1 | Leaflet[49x14] |
