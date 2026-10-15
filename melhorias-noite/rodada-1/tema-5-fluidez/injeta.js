// Injeção de protótipos (sem tocar no site). PROTO=1 liga; PROTO_CSS/PROTO_JS escolhem os arquivos (padrão proto/site.css e proto/mapa-municipios.js).
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'proto');
exports.aplica = async (ctx, page) => {
  if (!process.env.PROTO) return;
  const css = path.join(dir, process.env.PROTO_CSS || 'site.css'), js = path.join(dir, process.env.PROTO_JS || 'mapa-municipios.js');
  if (fs.existsSync(css)) await ctx.route('**/assets/site.css', r => r.fulfill({ path: css, contentType: 'text/css' }));
  if (fs.existsSync(js)) await ctx.route('**/assets/mapa-municipios.js', r => r.fulfill({ path: js, contentType: 'text/javascript' }));
  if (process.env.PROTO_EXTRA) for (const [de, para] of Object.entries(JSON.parse(process.env.PROTO_EXTRA))) await ctx.route(de, r => r.fulfill({ path: path.join(dir, para) }));
};
