// Servidor local que espelha https://lgrsv.github.io/vera-vegeta-o-back/teste/ (baixa com curl na 1a vez e guarda em cache).
// Existe só porque o Chromium do Playwright não confia na CA do proxy do ambiente. Serve com gzip (como o GitHub Pages).
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib'), { execFileSync } = require('child_process');
const RAIZ = process.env.ESPELHO || '/tmp/claude-0/-home-user-smartled/2ba15095-ae67-51f0-acd3-e77e4b1d05de/scratchpad/mirror2';
const VIVO = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/';
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };
const OVERRIDES = {};   // caminho -> arquivo local (protótipos), preenchido por /__override
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(RAIZ, p);
  if (!f.startsWith(RAIZ)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(f)) {
    try { fs.mkdirSync(path.dirname(f), { recursive: true }); execFileSync('curl', ['-sSf', '-m', '60', '-o', f, VIVO + p.slice(1)], { stdio: 'pipe' }); }
    catch (e) { try { fs.unlinkSync(f); } catch (_) {} res.writeHead(404); return res.end('404'); }
  }
  const buf = fs.readFileSync(f), ext = path.extname(f), h = { 'content-type': TIPOS[ext] || 'application/octet-stream', 'cache-control': 'max-age=600' };
  const comp = /\.(html|js|css|json|svg)$/.test(ext) && /gzip/.test(req.headers['accept-encoding'] || '');
  if (comp) { const z = zlib.gzipSync(buf, { level: 6 }); h['content-encoding'] = 'gzip'; h['content-length'] = z.length; res.writeHead(200, h); res.end(z); }
  else { h['content-length'] = buf.length; res.writeHead(200, h); res.end(buf); }
});
srv.listen(process.env.PORTA || 18766, () => console.log('espelho em :' + (process.env.PORTA || 18766)));
