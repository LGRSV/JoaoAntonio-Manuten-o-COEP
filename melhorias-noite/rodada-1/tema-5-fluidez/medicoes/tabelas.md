### Carga (mediana de 3 cargas a frio; ms)

| Página · dispositivo · perfil | Mapa aparece (antes → depois) | 1º conteúdo FCP (antes → depois) | Baixado gzip KB (antes → depois) | Requisições | Long tasks / TBT ms (antes) | CLS (antes → depois) |
|---|---|---|---|---|---|---|
| inicial · desktop · normal | 96 → 84 | 84 → 76 | 253 → 239 | 12 → 11 | 0 / 0 | 0.0462 → 0.0000 |
| inicial · desktop · CPU 4x | 320 → 291 | 248 → 184 | 253 → 239 | 12 → 11 | 3 / 61 | 0.0462 → 0.0000 |
| inicial · desktop · CPU 4x + 4G lenta | 1193 → 963 | 828 → 196 | 253 → 239 | 12 → 11 | 3 / 101 | 0.0462 → 0.0000 |
| inicial · celular · normal | 103 → 81 | 96 → 68 | 253 → 239 | 12 → 11 | 0 / 0 | 0.0000 → 0.0000 |
| inicial · celular · CPU 4x | 374 → 256 | 212 → 360 | 253 → 239 | 12 → 11 | 3 / 93 | 0.0000 → 0.0000 |
| inicial · celular · CPU 4x + 4G lenta | 1204 → 934 | 836 → 180 | 253 → 239 | 12 → 11 | 3 / 68 | 0.0002 → 0.0001 |
| polos · desktop · normal | 151 → 138 | 92 → 56 | 233 → 238 | 9 → 8 | 1 / 2 | 0.0367 → 0.0001 |
| polos · desktop · CPU 4x | 475 → 456 | 204 → 196 | 233 → 238 | 9 → 8 | 4 / 463 | 0.0384 → 0.0001 |
| polos · desktop · CPU 4x + 4G lenta | 1375 → 1219 | 836 → 144 | 233 → 238 | 9 → 8 | 5 / 507 | 0.0492 → 0.0001 |
| polos · celular · normal | 150 → 142 | 80 → 64 | 233 → 238 | 9 → 8 | 1 / 14 | 0.0000 → 0.0000 |
| polos · celular · CPU 4x | 513 → 467 | 200 → 232 | 233 → 238 | 9 → 8 | 4 / 630 | 0.0585 → 0.0000 |
| polos · celular · CPU 4x + 4G lenta | 1442 → 1195 | 828 → 156 | 233 → 238 | 9 → 8 | 5 / 696 | 0.2938 → 0.0007 |

### Página do alimentador LD01072001 (só antes)

| dispositivo · perfil | Mapa+lista prontos | FCP | LCP | Baixado KB (local + tiles/fontes) | Requisições | Long tasks | TBT ms | CLS |
|---|---|---|---|---|---|---|---|---|
| desktop · normal | 463 | 140 | 540 | 253 + 409 | 23 + 29 | 5 | 120 | 0.0551 |
| desktop · CPU 4x | 1423 | 252 | 2000 | 253 + 409 | 23 + 29 | 12 | 1492 | 0.0580 |
| desktop · CPU 4x + 4G lenta | 2372 | 824 | 3044 | 253 + 409 | 23 + 29 | 15 | 1344 | 0.0581 |
| celular · normal | 414 | 108 | 560 | 253 + 203 | 23 + 11 | 5 | 131 | 0.0592 |
| celular · CPU 4x | 1471 | 272 | 1524 | 253 + 203 | 23 + 11 | 12 | 1479 | 0.0621 |
| celular · CPU 4x + 4G lenta | 2585 | 832 | 3132 | 253 + 203 | 23 + 11 | 11 | 1462 | 0.0621 |

### FPS nas animações (mediana de 3 execuções; quadros lentos = > 50 ms)

| Etapa | Desktop normal | Desktop CPU 4x | Celular normal | Celular CPU 4x |
|---|---|---|---|---|
| mouse varrendo o estado | 60 → 60 fps (pior quadro 17 → 17 ms) | 60 → 59 fps (pior quadro 33 → 33 ms) | – | – |
| abrir regional (Centro) | 60 → 60 fps (pior quadro 17 → 17 ms) | 53 → 54 fps (pior quadro 67 → 67 ms) | 60 → 60 fps (pior quadro 17 → 17 ms) | 52 → 48 fps (pior quadro 83 → 67 ms) |
| abrir polo | 58 → 55 fps (pior quadro 33 → 33 ms) | 52 → 48 fps (pior quadro 50 → 67 ms) | 60 → 60 fps (pior quadro 17 → 17 ms) | 55 → 52 fps (pior quadro 50 → 67 ms) |
| abrir município | 39 → 58 fps (pior quadro 50 → 50 ms) | 34 → 44 fps (pior quadro 67 → 67 ms) | 47 → 60 fps (pior quadro 33 → 17 ms) | 39 → 54 fps (pior quadro 50 → 50 ms) |
| zoom no alimentador | 22 → 53 fps (pior quadro 100 → 100 ms) | 20 → 46 fps (pior quadro 117 → 100 ms) | 25 → 36 fps (pior quadro 83 → 67 ms) | 26 → 31 fps (pior quadro 67 → 83 ms) |
| Esc (volta ao município) | 23 → 57 fps (pior quadro 100 → 50 ms) | 18 → 46 fps (pior quadro 100 → 67 ms) | 26 → 35 fps (pior quadro 83 → 67 ms) | 25 → 30 fps (pior quadro 83 → 67 ms) |
| Esc (volta ao polo) | 60 → 60 fps (pior quadro 17 → 17 ms) | 59 → 59 fps (pior quadro 33 → 33 ms) | 60 → 60 fps (pior quadro 17 → 17 ms) | 60 → 59 fps (pior quadro 17 → 33 ms) |
| Esc (volta à regional) | 60 → 60 fps (pior quadro 17 → 17 ms) | 55 → 56 fps (pior quadro 33 → 33 ms) | 60 → 60 fps (pior quadro 17 → 17 ms) | 38 → 36 fps (pior quadro 33 → 50 ms) |
| Esc (volta ao Tocantins) | 51 → 51 fps (pior quadro 50 → 50 ms) | 47 → 46 fps (pior quadro 50 → 67 ms) | 60 → 57 fps (pior quadro 17 → 33 ms) | 51 → 46 fps (pior quadro 50 → 50 ms) |
