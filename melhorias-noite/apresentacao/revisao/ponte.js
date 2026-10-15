// Ponte de rede: o Chromium do Playwright não confia na CA do proxy do ambiente; as requisições
// são feitas com curl (que usa o CA bundle do proxy) e entregues ao navegador por page.route.
const { execFile } = require('child_process');
const cache = new Map();
const curl = url => cache.get(url) || (() => {
  const p = new Promise(res => execFile('curl', ['-sS', '-L', '--max-time', '60', '--cacert', '/root/.ccr/ca-bundle.crt',
    '-w', '\n%{http_code}\n%{content_type}', url], { encoding: 'buffer', maxBuffer: 1 << 28 }, (e, out) => {
    if (e || !out) return res({ status: 599, body: Buffer.alloc(0), type: 'text/plain' });
    const s = out.toString('latin1'); const ix = s.lastIndexOf('\n', s.lastIndexOf('\n') - 1);
    const meta = s.slice(ix + 1).split('\n');
    res({ status: +meta[0] || 599, body: out.subarray(0, ix), type: meta[1] || 'application/octet-stream' });
  }));
  cache.set(url, p); return p;
})();
module.exports = async function ponte(ctx) {
  await ctx.route(/^https:\/\//, async r => {
    const u = r.request().url();
    const x = await curl(u);
    await r.fulfill({ status: x.status, body: x.body, contentType: x.type });
  });
};
