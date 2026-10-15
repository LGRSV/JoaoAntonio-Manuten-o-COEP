// Injeção de protótipos (sem tocar no site). ligado=true (ou PROTO=1) usa proto/site.css e proto/mapa-municipios.js.
// fontes=true (ou PROTO_FONTES=1) troca o CSS do Google por fontes próprias (proto/fonts + proto/fontes.css) com preload, só na página inicial.
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'proto');
exports.aplica = async (ctx, page, ligado = !!process.env.PROTO, fontes = !!process.env.PROTO_FONTES) => {
  const BASE = process.env.BASE || 'http://localhost:18765/';
  if (ligado) {
    const css = path.join(dir, 'site.css'), js = path.join(dir, 'mapa-municipios.js');
    if (fs.existsSync(css)) await ctx.route('**/assets/site.css', r => r.fulfill({ path: css, contentType: 'text/css' }));
    if (fs.existsSync(js)) await ctx.route('**/assets/mapa-municipios.js', r => r.fulfill({ path: js, contentType: 'text/javascript' }));
  }
  if (fontes) {
    await ctx.route('**/assets/fonts/*.woff2', r => r.fulfill({ path: path.join(dir, 'fonts', r.request().url().split('/').pop()), contentType: 'font/woff2', headers: { 'cache-control': 'max-age=31536000' } }));
    await ctx.route(u => { const s = u.toString(); return s === BASE || s === BASE + 'index.html'; }, async r => {
      const res = await r.fetch(); let html = await res.text();
      const faces = fs.readFileSync(path.join(dir, 'fontes.css'), 'utf8');
      html = html.replace(/<link rel="preconnect"[^>]*>/g, '').replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, '')
        .replace('<link rel="stylesheet" href="assets/site.css">',
          '<link rel="preload" href="assets/fonts/ibm-plex-sans-condensed-700.woff2" as="font" type="font/woff2" crossorigin>' +
          '<link rel="preload" href="assets/fonts/ibm-plex-sans-600.woff2" as="font" type="font/woff2" crossorigin>' +
          '<style>' + faces + '</style><link rel="stylesheet" href="assets/site.css">');
      r.fulfill({ response: res, body: html, headers: { ...res.headers(), 'content-length': String(Buffer.byteLength(html)) } });
    });
  }
};
