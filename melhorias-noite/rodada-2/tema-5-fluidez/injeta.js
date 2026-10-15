// Injeta os protótipos (proto/) nas páginas do espelho SEM tocar no site (page/context.route).
// PROTO=1 liga tudo; PROTO_ITENS=cls,foco,... liga só alguns. Itens:
//   cls    CLS: reserva da linha do ☰ (todas as páginas) + cartões das regionais escondidos até posicionados (proto/cls.css, mapa-municipios.js)
//   foco   Tab: cartões fora do Tab quando escondidos, cartões 1º na ordem do mapa, caixa de resultados e lupa fora do Tab (foco.css, mapa-municipios.js, busca-ativo.js)
//   live   leitores de tela: região de aviso do nível + resumo da busca (mapa-municipios.js, busca-ativo.js)
//   toque  alvos de 44 px no toque (toque.css, menu.js, al-toque.css)
//   lista  página do alimentador: content-visibility na lista de trechos (al-lista.css)
//   vaos   página do alimentador: vãos encadeados numa só polilinha (alimentador.js)
//   fmt    Intl.NumberFormat criado uma vez (alimentador.js, limpeza.js, extras.js, ranking-polos.js)
const fs = require('fs'), path = require('path');
const P = f => path.join(__dirname, 'proto', f), ler = f => fs.readFileSync(f, 'utf8');
const TODOS = ['cls', 'foco', 'live', 'toque', 'lista', 'vaos', 'fmt'];
const ON = process.env.PROTO === '1' ? new Set(TODOS) : new Set((process.env.PROTO_ITENS || '').split(',').filter(Boolean));
const ativo = k => ON.has(k);
const ORI = process.env.ESPELHO || '/tmp/claude-0/-home-user-smartled/2ba15095-ae67-51f0-acd3-e77e4b1d05de/scratchpad/mirror2';
async function aplica(ctx) {
  if (!ON.size) return;
  const css = (rota, arquivos, base) => ctx.route(rota, r => { let c = ler(ORI + base); arquivos.forEach(([k, f]) => { if (ativo(k) && fs.existsSync(P(f))) c += '\n' + ler(P(f)); }); r.fulfill({ body: c, contentType: 'text/css' }); });
  await css('**/assets/site.css', [['cls', 'cls.css'], ['foco', 'foco.css'], ['toque', 'toque.css']], '/assets/site.css');
  await css('**/assets/alimentador.css', [['cls', 'al-cls.css'], ['toque', 'al-toque.css'], ['lista', 'al-lista.css']], '/assets/alimentador.css');
  const js = (rota, nome, itens) => ctx.route(rota, r => r.fulfill({ body: ler(itens.some(ativo) ? P(nome) : ORI + '/assets/' + nome), contentType: 'text/javascript' }));
  await js('**/assets/mapa-municipios.js', 'mapa-municipios.js', ['cls', 'foco', 'live']);
  await js('**/assets/busca-ativo.js', 'busca-ativo.js', ['foco', 'live']);
  await js('**/assets/menu.js', 'menu.js', ['toque']);
  await js('**/assets/ranking-polos.js', 'ranking-polos.js', ['toque', 'fmt']);
  await js('**/assets/limpeza.js', 'limpeza.js', ['fmt']);
  await js('**/assets/extras.js', 'extras.js', ['fmt']);
  await js('**/assets/alimentador.js', 'alimentador.js', ['vaos', 'fmt']);
}
module.exports = { aplica, ativo };
