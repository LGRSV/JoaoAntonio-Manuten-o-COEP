// Mede área do mapa e altura do painel, antes e depois (mesmos 4 alimentadores). Saída: metricas.json
const P = require('./prints.js'); const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(), r = {};
  for (const [nome, fl] of [['antes', null], ['todas', P.FLAGS.todas]]) for (const vp of ['d', 'm']) {
    const { ctx, p } = await P.abre(b, 'LD01072001', vp, fl);
    const k = nome + '-' + vp, M = {};
    M.mapa = await p.evaluate(() => { const m = document.getElementById('map').getBoundingClientRect(); const vy = innerHeight; return { w: Math.round(m.width), h: Math.round(m.height), topo: Math.round(m.top), visivelH: Math.round(Math.min(m.bottom, vy) - Math.max(m.top, 0)) }; });
    await P.ligaCamadas(p);
    M.painelTodasCamadas = await p.evaluate(() => { const e = document.querySelector('.panel'); return { alturaConteudo: e.scrollHeight }; });
    M.legendaMapaAltura = await p.evaluate(() => Math.round((document.querySelector('.ctl-lgs') || { getBoundingClientRect: () => ({ height: 0 }) }).getBoundingClientRect().height));
    await p.evaluate(() => window.__sel('T2-A', true)); await p.waitForTimeout(2000);
    M.detalheT2A = await p.evaluate(() => { const d = document.getElementById('det'); return { alturaConteudo: d.scrollHeight, alturaVisivel: Math.round(d.getBoundingClientRect().height) }; });
    M.scrollPagina = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    r[k] = M; await ctx.close();
  }
  fs.writeFileSync('metricas.json', JSON.stringify(r, null, 1)); console.log(JSON.stringify(r, null, 1)); await b.close();
})();
