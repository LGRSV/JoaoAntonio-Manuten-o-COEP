## CLS por página (mediana de 3 cargas a frio, tema escuro)

| Página · dispositivo · perfil | CLS antes → depois | FCP (ms) antes → depois |
|---|---|---|
| inicio · computador · normal | 0,0639 → 0,0079 | 156 → 168 |
| inicio · computador · CPU 4x | 0,0699 → 0,0020 | 508 → 624 |
| polos · computador · normal | 0,0384 → 0,0001 | 308 → 232 |
| polos · computador · CPU 4x | 0,0384 → 0,0001 | 228 → 524 |
| alimentador · computador · normal | 0,0608 → 0,0016 | 180 → 168 |
| alimentador · computador · CPU 4x | 0,0637 → 0,0015 | 368 → 448 |
| inicio · celular · normal | 0,0000 → 0,0000 | 148 → 168 |
| inicio · celular · CPU 4x | 0,0000 → 0,0004 | 308 → 340 |
| polos · celular · normal | 0,0000 → 0,0000 | 92 → 156 |
| polos · celular · CPU 4x | 0,0585 → 0,0002 | 352 → 360 |
| alimentador · celular · normal | 0,0685 → 0,0010 | 156 → 208 |
| alimentador · celular · CPU 4x | 0,1596 → 0,0010 | 364 → 444 |

## Página do alimentador LD02022033: carga (mediana de 3)

| Dispositivo · perfil | Pronto (ms) | LCP (ms) | TBT (ms) | Maior long task (ms) | CLS | Nós DOM |
|---|---|---|---|---|---|---|
| computador · normal | 2.526 → 1.147 | 3.468 → 2.120 | 3.440 → 1.380 | 786 → 469 | 0,0638 → 0,0015 | 9.145 → 9.145 |
| computador · CPU 4x | 3.553 → 3.233 | 4.736 → 3.644 | 6.556 → 6.474 | 1.796 → 1.383 | 0,0821 → 0,0015 | 9.145 → 9.145 |
| celular · normal | 1.424 → 1.778 | 2.264 → 2.744 | 2.092 → 3.150 | 718 → 1.019 | 0,0685 → 0,0010 | 9.136 → 9.136 |
| celular · CPU 4x | 3.284 → 3.719 | 5.156 → 4.772 | 6.356 → 4.857 | 1.790 → 1.334 | 0,0685 → 0,0010 | 9.136 → 9.136 |

### Interação com o mapa (Leaflet): fps · pior quadro (ms)

| Dispositivo · perfil · gesto | fps | Pior quadro (ms) | Long tasks (máx ms) |
|---|---|---|---|
| computador · normal · arrastar | 44,4 → 51,2 | 367 → 133 | 116 → 87 |
| computador · normal · zoom-roda | 17,6 → 14,0 | 367 → 450 | 414 → 335 |
| computador · normal · hover-linhas | 54,4 → 47,1 | 67 → 167 | 0 → 87 |
| computador · CPU 4x · arrastar | 43,5 → 36,6 | 683 → 400 | 257 → 258 |
| computador · CPU 4x · zoom-roda | 6,8 → 8,4 | 883 → 617 | 555 → 378 |
| computador · CPU 4x · hover-linhas | 48,8 → 43,7 | 200 → 183 | 0 → 70 |
| celular · normal · arrastar | 60,0 → 56,0 | 17 → 50 | 0 → 0 |
| celular · normal · pinca | 36,2 → 24,5 | 433 → 717 | 114 → 395 |
| celular · normal · hover-linhas | 60,0 → 55,9 | 17 → 50 | 0 → 0 |
| celular · CPU 4x · arrastar | 55,6 → 46,2 | 67 → 83 | 0 → 0 |
| celular · CPU 4x · pinca | 22,7 → 23,2 | 833 → 483 | 419 → 272 |
| celular · CPU 4x · hover-linhas | 56,1 → 42,0 | 50 → 83 | 0 → 0 |

## Lista de trechos (1.019 linhas, aparece ao buscar): custo da ação até o 2º quadro (ms) e rolagem

| Dispositivo · perfil | Mostrar (digitar "T3-A", "T3") | Filtrar | Limpar | Rolagem fps | Pior quadro na rolagem | Clique numa linha |
|---|---|---|---|---|---|---|
| computador · normal | 538 → 510 | 54 → 35 | 102 → 90 | 46,3 → 40,5 | 150 → 150 | 435 → 309 |
| computador · CPU 4x | 1.260 → 676 | 240 → 140 | 176 → 191 | 22,8 → 14,5 | 233 → 317 | 1.682 → 588 |
| celular · normal | 563 → 326 | 304 → 173 | 59 → 48 | 58,4 → 59,2 | 33 → 33 | 471 → 178 |
| celular · CPU 4x | 1.778 → 705 | 457 → 506 | 170 → 164 | 58,1 → 55,4 | 67 → 150 | 814 → 643 |

## Estilo + layout e scripts na carga da página do alimentador (trace, mediana de 3, ms)

| Perfil | Estilo+layout | Layout | Estilo | EvaluateScript | Commit |
|---|---|---|---|---|---|
| normal | 1.247 → 704 | 724 → 476 | 464 → 228 | 1.583 → 1.109 | 282 → 140 |
| CPU 4x | 3.712 → 2.061 | 2.473 → 1.472 | 1.239 → 589 | 2.670 → 2.104 | 1.117 → 253 |

## Redesenho da camada de linhas (a cada fim de zoom ou arrasto), ms, mediana de 8

| Perfil | visão geral | +2 níveis | +4 níveis | anéis no canvas |
|---|---|---|---|---|
| normal | 128,5 → 72,2 | 28,7 → 23,1 | 3,7 → 2,6 | 52.548 → 8.104 |
| CPU 4x | 296,2 → 76,9 | 111,4 → 29,1 | 30,6 → 7,5 | 52.548 → 8.104 |

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
| alimentador · computador | 13 → 10 | 3 → 0 | nada → 127 |
| alimentador · celular | 13 → 10 | 3 → 0 | nada → 127 |

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
| alimentador-pagina | 27 → 1 | Leaflet[49x14] |
