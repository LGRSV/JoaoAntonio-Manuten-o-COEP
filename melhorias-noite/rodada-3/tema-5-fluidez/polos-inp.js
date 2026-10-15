// Ranking por polos: latência de interação (Event Timing, como o INP) ao clicar nos filtros/ordenação, com CPU 4x.
// uso: node polos-inp.js <rotulo>   (PROTO=1 liga o protótipo)
const L = require('./lib.js'), fs = require('fs'), inj = require('./injeta.js');
const rot = process.argv[2] || 'antes', mediana = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
(async () => {
  const R = {};
  for (const [vp, cfg] of Object.entries({ desktop: { w: 1440, h: 900 }, celular: { w: 390, h: 844, mobile: true } })) {
    const dur = [];
    for (let rep = 0; rep < 3; rep++) {
      const s = await L.abre({ ...cfg, perfil: 'cpu4' }); await inj.aplica(s.ctx, s.page); const p = s.page;
      await s.ctx.addInitScript(() => { window.__ev = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => { if (e.interactionId) window.__ev.push({ n: e.name, d: Math.round(e.duration) }); })).observe({ type: 'event', durationThreshold: 16, buffered: true }); } catch (e) {} });
      await p.goto(L.BASE + 'polos/', { waitUntil: 'load' }); await p.waitForTimeout(1500);
      const alvos = await p.$$('#polos .pl-pil, #polos .pl-seg button, #polos .pl-vis button, #polos th button');
      for (const a of alvos.slice(0, 14)) { try { cfg.mobile ? await a.tap({ timeout: 2000 }) : await a.click({ timeout: 2000 }); } catch (e) {} await p.waitForTimeout(400); }
      const ev = await p.evaluate(() => window.__ev); dur.push(...ev.filter(e => /click|pointerup|mouseup|keydown/.test(e.n)).map(e => e.d)); await s.browser.close();
    }
    R[vp] = { n: dur.length, mediana: mediana(dur), p90: dur.sort((a, b) => a - b)[Math.floor(dur.length * .9)], max: Math.max(...dur) };
    console.log(vp, JSON.stringify(R[vp]));
  }
  fs.writeFileSync(`medicoes/polos-inp-${rot}.json`, JSON.stringify(R, null, 1));
})();
