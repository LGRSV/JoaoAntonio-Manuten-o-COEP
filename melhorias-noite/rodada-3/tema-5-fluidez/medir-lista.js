// Página do alimentador (LD02022033): a lista de trechos (display:none até a busca) — custo de mostrar/filtrar (digitar na busca até o quadro seguinte),
// fps ao rolar a lista e custo do clique numa linha. Mediana de N cargas. uso: [PROTO=1] node medir-lista.js <rotulo>  (PERFIS=base,cpu4)
const L = require('./lib.js'), fs = require('fs'), inj = require('./injeta.js');
const rot = process.argv[2] || 'antes', N = +(process.env.N || 3), perfis = (process.env.PERFIS || 'base,cpu4').split(',');
const med = a => { const v = a.filter(x => x != null).sort((x, y) => x - y); return v.length ? v[Math.floor(v.length / 2)] : null; };
(async () => {
  const R = {};
  for (const [vp, cfg] of Object.entries({ desktop: { w: 1440, h: 900 }, celular: { w: 390, h: 844, mobile: true } })) for (const perfil of perfis) {
    const acc = { mostra: [], filtra: [], limpa: [], rolaFps: [], rolaPior: [], clique: [] };
    for (let i = 0; i < N; i++) {
      const s = await L.abre({ ...cfg, perfil }); await inj.aplica(s.ctx, s.page); const p = s.page; await s.ctx.addInitScript(L.instrumenta);
      await p.goto(L.BASE + 'alimentadores/LD02022033/', { waitUntil: 'load' }); await p.waitForFunction(`window.__map && document.querySelector('#lista > *')`, null, { timeout: 40000 }); await p.waitForTimeout(perfil === 'cpu4' ? 3000 : 1500);
      const digita = async t => p.evaluate(async t => { const q = document.querySelector('input[placeholder^="Buscar trecho"]'); const a = performance.now(); q.value = t; q.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return performance.now() - a; }, t);
      acc.mostra.push(await digita('T3-A')); await p.waitForTimeout(400);
      acc.filtra.push(await digita('T3-B')); await p.waitForTimeout(400);
      acc.limpa.push(await digita('')); await p.waitForTimeout(400);
      acc.mostra.push(await digita('T3')); await p.waitForTimeout(500);
      // rola a lista (roda do mouse ou gesto de toque), mede fps
      await p.evaluate(() => document.getElementById('lista').scrollIntoView({ block: 'center' })); await p.waitForTimeout(300); const b0 = await p.locator('#lista').boundingBox(); const vh = cfg.h; const y0 = Math.max(b0.y, 60), y1 = Math.min(b0.y + b0.height, vh - 60); const b = { x: b0.x, width: b0.width, y: y0, height: y1 - y0 };
      await p.evaluate(() => window.__fpsIni());
      if (vp === 'desktop') { await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); for (let k = 0; k < 40; k++) { await p.mouse.wheel(0, 240); await p.waitForTimeout(30); } }
      else { await s.cdp.send('Input.synthesizeScrollGesture', { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2), xDistance: 0, yDistance: -2400, speed: 1200, gestureSourceType: 'touch' }); }
      await p.waitForTimeout(400); const f = await p.evaluate(() => window.__fpsFim()); acc.rolaFps.push(f.fps); acc.rolaPior.push(f.pior);
      acc.clique.push(await p.evaluate(async () => { const rows = [...document.querySelectorAll('#lista > .row:not([hidden])')]; const r = rows[30]; r.scrollIntoView({ block: 'center' }); await new Promise(k => setTimeout(k, 200)); const a = performance.now(); r.click(); await new Promise(r2 => requestAnimationFrame(() => requestAnimationFrame(r2))); return performance.now() - a; }));
      await s.browser.close();
    }
    R[`${vp}|${perfil}`] = Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, med(v) == null ? null : +med(v).toFixed(1)]));
    console.log(`${vp}|${perfil}`.padEnd(14), JSON.stringify(R[`${vp}|${perfil}`]));
  }
  fs.writeFileSync(`medicoes/lista-${rot}.json`, JSON.stringify(R, null, 1));
})();
