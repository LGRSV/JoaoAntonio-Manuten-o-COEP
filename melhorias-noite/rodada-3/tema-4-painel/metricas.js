/* Medidas do tema 4, rodada 3: site + lupa ATUAL (base, "lupa") contra o protótipo consolidado ("consolidado"), nos 4 alimentadores,
 * 1440x900 e 390x844. Grava metricas.json.
 *   NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node metricas.js
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const { abre, ALIM, ligaCamadas, escolhe } = require('./prints.js');

const rect = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; }, sel);

(async () => {
  const b = await chromium.launch(), out = {};
  for (const conj of ['lupa', 'consolidado']) {
    out[conj] = {};
    for (const cod of ALIM) for (const vp of ['d', 'm']) {
      const k = `${cod}-${vp}`, r = {};
      const { ctx, p } = await abre(b, cod, vp, conj);
      const H = (await p.viewportSize()).height;
      r.mapa = await rect(p, '#map');
      r.mapaVisivelH = r.mapa ? Math.max(0, Math.min(r.mapa.y + r.mapa.h, H) - Math.max(r.mapa.y, 0)) : null;
      r.topoAteMapa = r.mapa ? r.mapa.y : null;
      const W = (await p.viewportSize()).width;
      r.areaVisivelPx2 = r.mapa ? Math.max(0, Math.min(r.mapa.x + r.mapa.w, W) - Math.max(r.mapa.x, 0)) * r.mapaVisivelH : null;      // parte do mapa que cabe na janela
      r.areaVisivelPct = r.areaVisivelPx2 != null ? +(100 * r.areaVisivelPx2 / (W * H)).toFixed(1) : null;
      r.cabecalhoAlt = await p.evaluate(() => { const ys = ['.mnu', 'header', '.al-res'].map(s => document.querySelector(s)).filter(Boolean).map(e => e.getBoundingClientRect().bottom); return Math.round(Math.max(...ys)); });
      r.rolagemPagina = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      r.painel = await rect(p, '.panel');
      r.painelConteudoPx = await p.evaluate(() => { const e = document.querySelector('.panel'); return e ? e.scrollHeight : null; });
      await ligaCamadas(p);
      r.painel4camadasPx = await p.evaluate(() => { const e = document.querySelector('.panel'); return e ? e.scrollHeight : null; });
      r.legendaAltura = await p.evaluate(() => { const e = document.querySelector('.ctl-lgs'); return e ? Math.round(e.getBoundingClientRect().height) : 0; });
      await escolhe(p, 'T2-A');
      r.detalheT2A_px = await p.evaluate(() => { const e = document.querySelector('.panel'); return e ? e.scrollHeight : null; });
      r.erros = p.__erros.slice();
      await ctx.close();
      out[conj][k] = r;
      console.log(conj, k, JSON.stringify(r));
    }
  }
  fs.writeFileSync(path.join(__dirname, 'metricas.json'), JSON.stringify(out, null, 1));
  await b.close();
})();
