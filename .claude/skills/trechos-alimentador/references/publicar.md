# Publicar e entregar

## Site (GitHub Pages) — o que o usuário usa no celular

- Repositório `LGRSV/vera-vegeta-o-back`, branch **`gh-pages`** (o `main` só tem o README; não mexa nele).
  Endereço: https://lgrsv.github.io/vera-vegeta-o-back/
- Estrutura: `index.html` (lista por SE), `<alimentador>.html` (mapa) e `<alimentador>-trechos.kmz`. A página do
  site leva o Leaflet 1.9.4 embutido (`alimentador/leaflet/`), então não depende de CDN; só o satélite vem da Esri.
- Gerar: `python -m alimentador.gerar_trechos <KMLs> ... --site <clone do gh-pages> --se-nome SE-XXXX='Nome'`.
  O índice é refeito a partir de todas as páginas da pasta (meta `alimentador` em cada uma), então rodar só um
  alimentador novo não apaga os outros.
- Commit e push no `gh-pages`; o GitHub publica sozinho em ~1 minuto (aparece em Actions como
  "pages build and deployment").
- **O site é público** (só tem `noindex`). Confirme com o usuário antes de publicar um alimentador novo. Nunca
  publique número de UC nem o texto bruto da Crítica.

## Mapa (mapa-trechos.html)

Uma visão só: satélite Esri ao vivo, DJ e religadores com código, fusíveis como ponto, chaves 88 escondidas,
lista lateral com início → fim, selo de NAE por mês, opção "Contar individuais", busca por trecho/ativo/poste.
Ao tocar num trecho: marcas INÍCIO e FIM no mapa e as interrupções do mês. Testado em celular (390 px) e
computador; 11 mil vãos carregam em menos de 1 s.

## KMZ (Google Earth)

`<alimentador>-trechos.kmz`: uma pasta por trecho, balão com início, fim, extensão, de onde vem e derivações.
No celular: app Google Earth → Projetos → Abrir → Importar arquivo KML. No Google Maps: importar no My Maps.

## O que não funciona

- **Página hospedada no Claude (Artifact):** bloqueia imagem de outros sites, então fica sem satélite. O usuário
  recusou esse caminho; não republique.
- **Felt:** a conta do usuário não tem API (plano Enterprise).
- **Baixar imagens de satélite para dentro da página:** a rede do ambiente bloqueia o servidor da Esri.
