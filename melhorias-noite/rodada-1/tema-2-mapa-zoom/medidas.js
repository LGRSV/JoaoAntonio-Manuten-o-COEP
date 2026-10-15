// Mede a fluidez do protótipo (Chromium headless, renderização por software: vale para comparar, não como FPS de usuário):
// tempo entre quadros (rAF) e tarefas longas (>50 ms) durante (a) Ctrl+roda x10, (b) arrastar, (c) abrir a regional (voa), original x protótipo.
const fs = require('fs');
const { lanca, abre } = require('./lib.js');
const esp = (p, ms) => p.waitForTimeout(ms);
const inicia = page => page.evaluate(() => { window.__q = []; window.__lt = 0; window.__ltMax = 0; try { new PerformanceObserver(l => l.getEntries().forEach(e => { window.__lt++; window.__ltMax = Math.max(window.__ltMax, e.duration); })).observe({ entryTypes: ['longtask'] }); } catch (e) {} let t0 = performance.now(); window.__on = true; const f = t => { window.__q.push(t - t0); t0 = t; if (window.__on) requestAnimationFrame(f); }; requestAnimationFrame(f); });
const para = async page => page.evaluate(() => { window.__on = false; const q = window.__q.slice(2).sort((a, b) => a - b); const n = q.length, soma = q.reduce((s, x) => s + x, 0); return { quadros: n, medio_ms: +(soma / n).toFixed(1), p95_ms: +q[Math.floor(n * .95)].toFixed(1), max_ms: +q[n - 1].toFixed(1), fps_medio: +(1000 / (soma / n)).toFixed(1), tarefas_longas: window.__lt, tarefa_longa_max_ms: +window.__ltMax.toFixed(0) }; });
(async () => {
  const b = await lanca(), out = {};
  for (const proto of [false, true]) {
    const nome = proto ? 'prototipo' : 'original';
    const { ctx, page } = await abre(b, 'desk', proto, { calmo: false });
    out[nome] = {};
    if (proto) {
      await page.mouse.move(720, 560);
      await inicia(page);
      await page.keyboard.down('Control');
      for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, -120); await esp(page, 60); }
      await page.keyboard.up('Control'); await esp(page, 1200);
      out[nome].ctrl_roda_x10 = await para(page);
      await inicia(page);
      await page.mouse.move(700, 560); await page.mouse.down(); await page.mouse.move(400, 420, { steps: 40 }); await page.mouse.up(); await esp(page, 400);
      out[nome].arrastar_40_passos = await para(page);
      await page.click('.mt-zoom [data-z=fit]'); await esp(page, 1500);
    }
    await inicia(page);
    await page.click('.mt-regcards button[data-reg="Centro"]'); await esp(page, 1500);
    out[nome].abrir_regional_voa = await para(page);
    await ctx.close();
  }
  await b.close();
  fs.writeFileSync(__dirname + '/medidas.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
})();
