/* Confere a ressalva do README (Sugestão 1, risco a): com as regras sob `html.al-site` (classe que o 1º script do cabeçalho já põe), o mapa já nasce
 * no tamanho final, antes do painel.js rodar; com `html.p-r3` (a classe que o painel.js põe no fim) ele pula. Mede o Layout Shift (PerformanceObserver) e o
 * retângulo do #map no DOMContentLoaded e depois de carregado.
 *   NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node cls-teste.js */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const BASE = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/alimentadores/LD01072001/', ASSETS = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/assets/';
const rd = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const cache = {};
(async () => {
  const b = await chromium.launch(), saida = {};
  for (const variante of ['antes', 'p-r3', 'html-p-r3']) for (const vp of ['d', 'm']) {
    const css = variante === 'antes' ? '' : rd('proto/painel.css'), js = variante === 'antes' ? '' : rd('proto/painel.js'), lupa = variante === 'antes' ? rd('proto/original/lupa-painel.artifact.js') : rd('proto/lupa-painel.js');
    const ctx = await b.newContext({ viewport: vp === 'd' ? { width: 1440, height: 900 } : { width: 390, height: 844 }, isMobile: vp === 'm', hasTouch: vp === 'm' });
    const p = await ctx.newPage();
    await p.addInitScript(() => {
      window.__cls = 0; window.__linhas = [];
      try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__linhas.push([Math.round(e.startTime), +e.value.toFixed(4), (e.sources || []).map(s => (s.node && (s.node.nodeName + '.' + (s.node.className && s.node.className.baseVal === undefined ? s.node.className : '') + '#' + (s.node.id || ''))) || '?').join(',')]); } }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
      document.addEventListener('DOMContentLoaded', () => { const m = document.getElementById('map').getBoundingClientRect(); window.__dcl = { y: Math.round(m.y), w: Math.round(m.width), h: Math.round(m.height) }; });
    });
    await p.route('**/*', async r => {
      const u = r.request().url();
      try {
        if (u === ASSETS + 'lupa-painel.js') return r.fulfill({ status: 200, contentType: 'text/javascript', body: lupa });
        let e = cache[u];
        if (!e) { const resp = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } }); const body = Buffer.from(await resp.arrayBuffer()), headers = {}; resp.headers.forEach((v, k) => { if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(k)) headers[k] = v; }); e = { status: resp.status, headers, body }; if (resp.status === 200) cache[u] = e; }
        if (u === BASE) { let h = e.body.toString('utf8'); if (variante === 'html-p-r3') h = h.replace(/<html([^>]*)>/, (m, a) => /class=/.test(a) ? m.replace(/class="/, 'class="p-r3 ') : `<html${a} class="p-r3">`); h = h.replace('</head>', `<style>${css}</style></head>`).replace('</body>', '<script src="../../assets/lupa-painel.js"></script><script>' + js + '</script></body>'); e = { ...e, body: Buffer.from(h) }; }
        await r.fulfill(e);
      } catch (err) { await r.abort(); }
    });
    await p.goto(BASE, { waitUntil: 'load' }); await p.waitForTimeout(5000);
    const r = await p.evaluate(() => { const m = document.getElementById('map').getBoundingClientRect(); return { cls: +window.__cls.toFixed(4), fontes: window.__linhas, noDOMContentLoaded: window.__dcl, final: { y: Math.round(m.y), w: Math.round(m.width), h: Math.round(m.height) } }; });
    saida[`${variante}-${vp}`] = r; console.log(variante, vp, JSON.stringify(r));
    await ctx.close();
  }
  fs.writeFileSync(path.join(__dirname, 'cls-teste.json'), JSON.stringify(saida, null, 1));
  await b.close();
})();
