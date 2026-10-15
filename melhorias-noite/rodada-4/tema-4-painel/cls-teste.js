/* CLS (Layout Shift, PerformanceObserver) da página do alimentador: "antes" = /teste/ ao vivo; "depois" = a mesma página com o que o gerador passa a escrever
 * (tmp/depois/<AL>.html, de gera-paginas.py) + proto/painel.css, painel.js e lupa-painel.js. 3 cargas por caso (mediana). Grava cls-teste.json.
 *   NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node cls-teste.js */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const BASE0 = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/alimentadores/', ASSETS = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/assets/';
const rd = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const cache = {};
const med = a => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
(async () => {
  const b = await chromium.launch(), saida = {};
  for (const cod of (process.env.ALS || 'LD01072001,AL03037009,LD02022033,AL01015049').split(',')) for (const variante of (process.env.VARS || 'antes,depois').split(',')) for (const vp of ['d', 'm']) {
    const BASE = BASE0 + cod + '/', cs = [], ult = {};
    for (let rep = 0; rep < 3; rep++) {
      const ctx = await b.newContext({ viewport: vp === 'd' ? { width: 1440, height: 900 } : { width: 390, height: 844 }, isMobile: vp === 'm', hasTouch: vp === 'm' });
      const p = await ctx.newPage();
      await p.addInitScript(() => {
        window.__cls = 0; window.__linhas = [];
        try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__linhas.push([Math.round(e.startTime), +e.value.toFixed(4), (e.sources || []).map(s => (s.node && (s.node.nodeName + '.' + (s.node.className && s.node.className.baseVal === undefined ? s.node.className : '') + '#' + (s.node.id || ''))) || '?').join(',')]); } }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
      });
      await p.route('**/*', async r => {
        const u = r.request().url();
        try {
          if (variante === 'depois') {
            if (u === ASSETS + 'lupa-painel.js') return r.fulfill({ status: 200, contentType: 'text/javascript', body: rd('proto/lupa-painel.js') });
            if (u === ASSETS + 'painel.css') return r.fulfill({ status: 200, contentType: 'text/css', body: rd('proto/painel.css') });
            if (u === ASSETS + 'painel.js') return r.fulfill({ status: 200, contentType: 'text/javascript', body: rd('proto/painel.js') });
            if (u === BASE) return r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: rd('tmp/depois/' + cod + '.html') });
          }
          let e = cache[u];
          if (!e) { const resp = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } }); const body = Buffer.from(await resp.arrayBuffer()), headers = {}; resp.headers.forEach((v, k) => { if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(k)) headers[k] = v; }); e = { status: resp.status, headers, body }; if (resp.status === 200) cache[u] = e; }
          await r.fulfill(e);
        } catch (err) { await r.abort(); }
      });
      await p.goto(BASE, { waitUntil: 'load' }); await p.waitForTimeout(5000);
      const r = await p.evaluate(() => { const m = document.getElementById('map').getBoundingClientRect(); return { cls: +window.__cls.toFixed(4), fontes: window.__linhas, final: { y: Math.round(m.y), w: Math.round(m.width), h: Math.round(m.height) } }; });
      cs.push(r.cls); Object.assign(ult, r);
      await ctx.close();
    }
    saida[`${cod}-${variante}-${vp}`] = { cls: cs, mediana: med(cs), fontes: ult.fontes, mapa: ult.final };
    console.log(cod, variante, vp, 'CLS', cs.join(' '), 'mediana', med(cs), JSON.stringify(ult.fontes).slice(0, 300));
  }
  fs.writeFileSync(path.join(__dirname, process.env.SAIDA || 'cls-teste.json'), JSON.stringify(saida, null, 1));
  await b.close();
})();
