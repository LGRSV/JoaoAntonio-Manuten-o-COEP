// Fotos da carga em instantes fixos (para ver o que pula): node quadros.js <pagina> <w> <h> <rotulo> [t1,t2,...]   (PROTO=1 liga o protótipo)
// Os scripts do site são atrasados de forma realista só pelo CPU/rede do perfil; as fotos usam CDP Page.captureScreenshot a cada instante.
const L = require('./lib.js'), inj = require('./injeta.js');
(async () => {
  const [pg, w, h, rot, ts] = [process.argv[2] || '', +process.argv[3] || 1440, +process.argv[4] || 900, process.argv[5] || 'x', (process.argv[6] || '120,500,1500,4000').split(',').map(Number)];
  const mobile = w < 600;
  const s = await L.abre({ w, h, mobile, perfil: process.env.PERFIL || 'base' }); await inj.aplica(s.ctx, s.page);
  const p = s.page, t0 = Date.now(); const fotos = [];
  const nav = p.goto(L.BASE + pg, { waitUntil: 'commit' });
  for (const t of ts) { const falta = t - (Date.now() - t0); if (falta > 0) await new Promise(r => setTimeout(r, falta)); try { const b = await p.screenshot({ type: 'jpeg', quality: 70 }); fotos.push([t, b]); } catch (e) {} }
  await nav; 
  const dir = process.env.SAIDA || 'prints'; require('fs').mkdirSync(dir, { recursive: true });
  fotos.forEach(([t, b]) => require('fs').writeFileSync(`${dir}/${rot}-${w}-t${t}.jpg`, b));
  console.log('fotos', fotos.map(f => f[0]).join(','));
  await s.browser.close();
})();
