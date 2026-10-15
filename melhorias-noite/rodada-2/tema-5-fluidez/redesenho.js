// Custo de redesenhar a camada de linhas do Leaflet (é o que roda a cada fim de zoom/arrasto): tempo de renderer._update() em 3 níveis de zoom.
// uso: node redesenho.js <rotulo> (PROTO=1 liga o protótipo) ; CPU 1x e 4x
const L = require('./lib.js'), inj = require('./injeta.js'), fs = require('fs');
(async () => {
  const R = {};
  for (const perfil of ['base', 'cpu4']) {
    const s = await L.abre({ perfil }); await inj.aplica(s.ctx, s.page); const p = s.page;
    await p.goto(L.BASE + 'alimentadores/LD02022033/', { waitUntil: 'load' }); await p.waitForFunction('window.__map && document.querySelector("#lista > *")', null, { timeout: 40000 }); await p.waitForTimeout(2500);
    const r = await p.evaluate(() => { const m = window.__map, rd = (Object.values(m._layers).find(l => l._renderer) || {})._renderer, out = {}; const c = m.getCenter(), z0 = m.getZoom();
      for (const dz of [0, 2, 4]) { m.setView(c, z0 + dz, { animate: false }); const t = []; for (let i = 0; i < 8; i++) { const a = performance.now(); rd._update(); t.push(performance.now() - a); } t.sort((a, b) => a - b); out['zoom+' + dz] = +t[4].toFixed(1); }
      let n = 0; Object.values(m._layers).forEach(l => { if (l.getLatLngs) n += (l.getLatLngs().flat ? l.getLatLngs().length : 0); }); out.aneis = n; return out; });
    R[perfil] = r; console.log(perfil, JSON.stringify(r)); await s.browser.close();
  }
  fs.writeFileSync(`medicoes/redesenho-${process.argv[2] || 'x'}.json`, JSON.stringify(R, null, 1));
})();
