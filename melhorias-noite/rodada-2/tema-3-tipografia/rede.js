// Ajuda de rede: o navegador do sandbox não confia na CA do proxy, então as requisições do site ao vivo são
// feitas com curl (que usa a CA do proxy) e entregues ao Chromium via page.route; cache em ./cache.
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const CACHE = path.join(__dirname, 'cache'); fs.mkdirSync(CACHE, { recursive: true });
function baixa(url) {
  const h = crypto.createHash('md5').update(url).digest('hex'), f = path.join(CACHE, h), m = f + '.ct';
  if (!fs.existsSync(f)) {
    try {
      const out = execFileSync('curl', ['-sS', '-L', '--cacert', '/root/.ccr/ca-bundle.crt', '-A', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        '-D', f + '.h', '-o', f, '-w', '%{http_code}', url], { maxBuffer: 1 << 28 }).toString();
      if (out !== '200') { fs.writeFileSync(m, 'x/' + out); return { status: +out, body: fs.existsSync(f) ? fs.readFileSync(f) : Buffer.alloc(0), ct: 'text/plain' }; }
      const hd = fs.readFileSync(f + '.h', 'utf8').split(/\r?\n\r?\n/).filter(Boolean).pop();
      const ct = (/content-type:\s*([^\r\n]+)/i.exec(hd) || [])[1] || 'application/octet-stream';
      fs.writeFileSync(m, ct);
    } catch (e) { return { status: 502, body: Buffer.from(String(e)), ct: 'text/plain' }; }
  }
  const ct = fs.readFileSync(m, 'utf8');
  if (ct.startsWith('x/')) return { status: +ct.slice(2), body: Buffer.alloc(0), ct: 'text/plain' };
  return { status: 200, body: fs.readFileSync(f), ct };
}
// over: { '/assets/site.css': 'caminho/local' } troca arquivos do site por versões do protótipo
async function liga(ctx, over = {}, trocas = [], atrasoFonte = 0) {   // trocas: [[de, para]] aplicadas ao HTML das páginas
  await ctx.route('**/*', async route => {
    const u = new URL(route.request().url());
    if (!/^(lgrsv\.github\.io|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(u.host)) return route.continue();
    for (const [k, v] of Object.entries(over)) if (u.pathname.endsWith(k) && u.host === 'lgrsv.github.io') {
      const ct = k.endsWith('.css') ? 'text/css' : k.endsWith('.js') ? 'application/javascript' : 'text/plain';
      return route.fulfill({ status: 200, contentType: ct, body: fs.readFileSync(v) });
    }
    if (atrasoFonte && u.host === 'fonts.gstatic.com') await new Promise(r => setTimeout(r, atrasoFonte));
    const r = baixa(u.href);
    if (trocas.length && /text\/html/.test(r.ct)) { let h = r.body.toString('utf8'); trocas.forEach(([a, b]) => { h = h.split(a).join(b); }); r.body = Buffer.from(h); }
    route.fulfill({ status: r.status, contentType: r.ct, body: r.body, headers: { 'access-control-allow-origin': '*' } });
  });
}
// arquivos do site por modo: "antes" = a versão atual do repositório (orig-head/, de alimentador/site/ em 15/10 05:20; o /teste/ ao vivo
// pode estar um commit atrás), "depois" = protótipo (proto/). Troca assets/<arquivo> no navegador, sem tocar no site.
const ARQ = ['site.css', 'mapa-municipios.js', 'busca-ativo.js', 'ranking-polos.js'];
function arquivosModo(modo) {
  const o = {}, dir = modo === 'depois' ? 'proto' : 'orig-head';
  for (const f of ARQ) { const p = path.join(__dirname, dir, f); if (fs.existsSync(p)) o['/assets/' + f] = p; }
  return o;
}
module.exports = { liga, baixa, arquivosModo };
