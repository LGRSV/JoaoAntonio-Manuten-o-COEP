// Ajuda de rede: o Chromium não confia na CA do proxy; as requisições passam pelo Node (que usa a CA do proxy).
// Rodar com: NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node prints.js
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const BASE = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/alimentadores/';
async function abre(viewport, tema) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport, deviceScaleFactor: 1, acceptDownloads: true, hasTouch: viewport.width < 600, isMobile: viewport.width < 600 });
  await ctx.addInitScript(t => { try { localStorage.setItem('tema', t); } catch (e) {} }, tema || 'escuro');
  await ctx.route('**/*', async r => {
    const u = r.request().url();
    if (!u.startsWith('http')) return r.continue();
    try {
      const resp = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } });
      const body = Buffer.from(await resp.arrayBuffer());
      const h = {}; resp.headers.forEach((v, k) => { if (!/^(content-encoding|content-length|transfer-encoding|connection)$/i.test(k)) h[k] = v; });
      await r.fulfill({ status: resp.status, headers: h, body });
    } catch (e) { await r.abort(); }
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR', e.message));
  return { b, ctx, page };
}
module.exports = { abre, BASE };
