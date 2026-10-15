// Injeta o protótipo único (proto/arvore e proto/assets, gerados por gera-proto.js) nas páginas do espelho SEM tocar no site (context.route).
// PROTO=1 liga tudo. PROTO_SEM=lista (ou vaos,cls,toque) desliga um pedaço, para ablação (só a página do alimentador).
const fs = require('fs'), path = require('path');
const ler = f => fs.readFileSync(f, 'utf8');
const ON = process.env.PROTO === '1';
const SEM = new Set((process.env.PROTO_SEM || '').split(',').filter(Boolean));
const ARV = path.join(__dirname, 'proto', 'arvore', 'alimentador', 'site'), ASS = path.join(__dirname, 'proto', 'assets');
async function aplica(ctx) {
  if (!ON) return;
  const serve = (rota, arq, tipo, tira) => ctx.route(rota, r => { let c = ler(arq); if (tira) c = tira(c); r.fulfill({ body: c, contentType: tipo, headers: { 'cache-control': 'no-store' } }); });
  const js = 'text/javascript', css = 'text/css';
  await serve('**/assets/site.css', path.join(ARV, 'site.css'), css);
  for (const f of ['mapa-municipios.js', 'busca-ativo.js', 'menu.js', 'ranking-polos.js', 'limpeza.js', 'inspecao.js', 'extras.js']) await serve('**/assets/' + f, path.join(ARV, f), js);
  await serve('**/assets/alimentador.css', path.join(ASS, 'alimentador.css'), css, c => SEM.has('lista') ? c.replace(/\.lista>\.row,\.lista>\.grp\{content-visibility[^\n]*\n\.lista>\.grp\{[^\n]*\n/, '') : c);
  await serve('**/assets/alimentador.js', path.join(ASS, 'alimentador.js'), js);
}
module.exports = { aplica };
