// repete 4x os gestos do zoom (Ctrl+roda x10 e arrastar) e acrescenta a faixa de fps em medidas.json (a máquina é compartilhada: veja carga_media_1min)
const fs = require('fs'), os = require('os');
const { lanca, abre } = require('./lib.js');
const esp = (p, ms) => p.waitForTimeout(ms);
const inicia = page => page.evaluate(() => { window.__q = []; window.__lt = 0; try { new PerformanceObserver(l => l.getEntries().forEach(() => window.__lt++)).observe({ entryTypes: ['longtask'] }); } catch (e) {} let t0 = performance.now(); window.__on = true; const f = t => { window.__q.push(t - t0); t0 = t; if (window.__on) requestAnimationFrame(f); }; requestAnimationFrame(f); });
const para = page => page.evaluate(() => { window.__on = false; const q = window.__q.slice(2).sort((a, b) => a - b), n = q.length, s = q.reduce((a, x) => a + x, 0); return { fps: +(1000 / (s / n)).toFixed(1), p95_ms: +q[Math.floor(n * .95)].toFixed(1), tarefas_longas: window.__lt }; });
(async () => {
  const b = await lanca(), out = { carga_media_1min: +os.loadavg()[0].toFixed(1), ctrl_roda_x10: [], arrastar_40_passos: [] };
  for (let i = 0; i < 4; i++) {
    const { ctx, page } = await abre(b, 'desk', true, { calmo: false });
    await inicia(page); await page.mouse.move(720, 560); await page.keyboard.down('Control');
    for (let k = 0; k < 10; k++) { await page.mouse.wheel(0, -120); await esp(page, 60); }
    await page.keyboard.up('Control'); await esp(page, 1200); out.ctrl_roda_x10.push(await para(page));
    await inicia(page); await page.mouse.move(700, 560); await page.mouse.down(); await page.mouse.move(400, 420, { steps: 40 }); await page.mouse.up(); await esp(page, 500); out.arrastar_40_passos.push(await para(page));
    await ctx.close();
  }
  await b.close();
  const f = __dirname + '/medidas.json', d = JSON.parse(fs.readFileSync(f)); d.gestos_4_repeticoes = out; fs.writeFileSync(f, JSON.stringify(d, null, 1));
  console.log(JSON.stringify(out));
})();
