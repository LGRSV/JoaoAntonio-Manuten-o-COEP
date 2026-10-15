## CLS e FCP por página (mediana de 3 cargas)

| Página · dispositivo · perfil | CLS antes | CLS depois | FCP antes (ms) | FCP depois (ms) |
|---|---|---|---|---|
| inicio · desktop · base | 0.0591 | 0.0002 | 148 | 136 |
| inicio · desktop · cpu4 | 0.0591 | 0.0001 | 276 | 300 |
| inicio · desktop · lenta | 0.0592 | 0.0003 | 904 | 892 |
| polos · desktop · base | 0.0367 | 0.0001 | 100 | 72 |
| polos · desktop · cpu4 | 0.0384 | 0.0001 | 328 | 192 |
| polos · desktop · lenta | 0.0492 | 0.0105 | 908 | 856 |
| alimentador · desktop · base | 0.0581 | 0.0000 | 140 | 108 |
| alimentador · desktop · cpu4 | 0.0580 | 0.0000 | 352 | 236 |
| alimentador · desktop · lenta | 0.0581 | 0.0009 | 932 | 868 |
| inicio · celular · base | 0.0000 | 0.0000 | 128 | 84 |
| inicio · celular · cpu4 | 0.0000 | 0.0000 | 244 | 236 |
| inicio · celular · lenta | 0.0006 | 0.0006 | 916 | 900 |
| polos · celular · base | 0.0000 | 0.0000 | 80 | 84 |
| polos · celular · cpu4 | 0.0585 | 0.0002 | 268 | 176 |
| polos · celular · lenta | 0.2938 | 0.1437 | 880 | 848 |
| alimentador · celular · base | 0.0592 | 0.0000 | 164 | 108 |
| alimentador · celular · cpu4 | 0.0621 | 0.0000 | 480 | 204 |
| alimentador · celular · lenta | 0.0621 | 0.0363 | 992 | 880 |

## alimentador: carga (mediana de 3)

| Dispositivo · perfil | Pronto antes→depois (ms) | LCP | TBT (ms) | Long tasks (máx ms) | CLS | Nós DOM |
|---|---|---|---|---|---|---|
| desktop · base | 753 → 616 | 1524 → 1036 | 966 → 469 | 7 (345) → 6 (239) | 0.0551 → 0.0000 | 9096 → 9096 |
| desktop · cpu4 | 3924 → 2211 | 4016 → 2632 | 6704 → 3774 | 15 (1791) → 15 (795) | 0.0581 → 0.0009 | 9096 → 9096 |
| desktop · lenta | 6522 → 5307 | 7856 → 5736 | 6814 → 4134 | 17 (1837) → 16 (901) | 0.0581 → 0.0009 | 9096 → 9096 |
| celular · base | 712 → 537 | 1532 → 896 | 1013 → 386 | 7 (390) → 6 (182) | 0.0592 → 0.0000 | 9087 → 9087 |
| celular · cpu4 | 3173 → 2197 | 4332 → 2328 | 6963 → 3673 | 17 (2185) → 16 (752) | 0.0592 → 0.0000 | 9087 → 9087 |
| celular · lenta | 6773 → 5118 | 8008 → 5708 | 7434 → 3607 | 17 (2088) → 16 (836) | 0.0621 → 0.0363 | 9087 → 9087 |

### Interação com o mapa (Leaflet): fps · pior quadro (ms) · long tasks

| Dispositivo · perfil · gesto | fps antes→depois | pior quadro antes→depois | long tasks antes→depois |
|---|---|---|---|
| desktop · base · arrastar | 56.2 → 57.9 | 167 → 83 | 1 → 1 |
| desktop · base · zoom-roda | 40.7 → 44.0 | 200 → 83 | 4 → 0 |
| desktop · base · hover-linhas | 60.0 → 60.0 | 17 → 17 | 0 → 0 |
| desktop · cpu4 · arrastar | 58.0 → 53.3 | 50 → 300 | 1 → 1 |
| desktop · cpu4 · zoom-roda | 28.1 → 28.2 | 300 → 283 | 12 → 13 |
| desktop · cpu4 · hover-linhas | 59.5 → 59.0 | 33 → 50 | 0 → 0 |
| celular · base · arrastar | 60.0 → 60.0 | 17 → 17 | 0 → 0 |
| celular · base · pinca | 50.1 → 56.7 | 267 → 83 | 3 → 1 |
| celular · base · hover-linhas | 60.0 → 60.0 | 17 → 17 | 0 → 0 |
| celular · cpu4 · arrastar | 57.7 → 57.7 | 50 → 50 | 0 → 0 |
| celular · cpu4 · pinca | 29.8 → 44.0 | 850 → 350 | 2 → 3 |
| celular · cpu4 · hover-linhas | 60.0 → 60.0 | 17 → 17 | 0 → 0 |

## polos: carga (mediana de 3)

| Dispositivo · perfil | Pronto antes→depois (ms) | LCP | TBT (ms) | Long tasks (máx ms) | CLS | Nós DOM |
|---|---|---|---|---|---|---|
| desktop · base | 206 → 190 | 88 → 100 | 9 → 18 | 1 (59) → 1 (68) | 0.0367 → 0.0001 | 1460 → 1460 |
| desktop · cpu4 | 755 → 686 | 256 → 220 | 426 → 429 | 4 (265) → 4 (247) | 0.0384 → 0.0001 | 1460 → 1460 |
| desktop · lenta | 1487 → 1485 | 856 → 884 | 336 → 513 | 5 (191) → 6 (249) | 0.0473 → 0.0105 | 1460 → 1460 |
| celular · base | 216 → 215 | 108 → 92 | 66 → 45 | 3 (93) → 2 (85) | 0.0000 → 0.0000 | 1457 → 1457 |
| celular · cpu4 | 887 → 713 | 236 → 200 | 533 → 484 | 4 (336) → 4 (311) | 0.0000 → 0.0000 | 1457 → 1457 |
| celular · lenta | 1705 → 1625 | 840 → 876 | 706 → 567 | 5 (354) → 5 (316) | 0.2938 → 0.0002 | 1457 → 1457 |
