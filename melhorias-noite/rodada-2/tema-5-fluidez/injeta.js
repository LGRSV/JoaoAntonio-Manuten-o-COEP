// Injeta os protótipos (proto/) nas páginas do espelho SEM tocar no site: PROTO=1 liga tudo; PROTO_ITENS=a,b liga só alguns.
// Itens: foco (css de foco/visibility + alvos de toque), cls (reserva do ☰ e cartões escondidos até posicionar), live (aria-live dos níveis),
//        al (página do alimentador: carga), polos (ranking)
const fs = require('fs'), path = require('path');
const P = f => path.join(__dirname, 'proto', f), ler = f => fs.readFileSync(f, 'utf8');
const ON = process.env.PROTO === '1' ? new Set(['foco', 'cls', 'live', 'toque', 'al', 'polos']) : new Set((process.env.PROTO_ITENS || '').split(',').filter(Boolean));
const ativo = k => ON.has(k);
async function aplica(ctx) {
  if (!ON.size) return;
  const ORI = process.env.ESPELHO || '/tmp/claude-0/-home-user-smartled/2ba15095-ae67-51f0-acd3-e77e4b1d05de/scratchpad/mirror2';
  await ctx.route('**/assets/site.css', r => {
    let css = ler(ORI + '/assets/site.css');
    ['cls', 'foco', 'toque'].forEach(k => { if (ativo(k) && fs.existsSync(P(k + '.css'))) css += '\n' + ler(P(k + '.css')); });
    r.fulfill({ body: css, contentType: 'text/css' });
  });
  await ctx.route('**/assets/mapa-municipios.js', r => {
    const f = ativo('cls') || ativo('live') ? P('mapa-municipios.js') : ORI + '/assets/mapa-municipios.js';
    r.fulfill({ body: ler(f), contentType: 'text/javascript' });
  });
  await ctx.route('**/assets/menu.js', r => {
    let js = ler(ORI + '/assets/menu.js');
    if (ativo('live') && fs.existsSync(P('live.js'))) js += '\n' + ler(P('live.js'));
    r.fulfill({ body: js, contentType: 'text/javascript' });
  });
}
module.exports = { aplica, ativo };
