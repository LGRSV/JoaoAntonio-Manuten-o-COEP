// Mede a fluidez do protótipo (Chromium headless, render por software: serve para comparar, não é FPS de aparelho real):
// tempo entre quadros (rAF) e tarefas longas (>50 ms) durante Ctrl+roda x10, arrastar, abrir a regional (voa), original x protótipo;
// e o custo de recalcular os cartões dos municípios (poeNomes) ao fim de cada gesto, no estado inteiro e no polo.
const fs = require('fs');
const { lanca, abre } = require('./lib.js');
const esp = (p, ms) => p.waitForTimeout(ms);
const inicia = page => page.evaluate(() => { window.__q = []; window.__lt = 0; window.__ltMax = 0; try { new PerformanceObserver(l => l.getEntries().forEach(e => { window.__lt++; window.__ltMax = Math.max(window.__ltMax, e.duration); })).observe({ entryTypes: ['longtask'] }); } catch (e) {} let t0 = performance.now(); window.__on = true; const f = t => { window.__q.push(t - t0); t0 = t; if (window.__on) requestAnimationFrame(f); }; requestAnimationFrame(f); });
const para = async page => page.evaluate(() => { window.__on = false; const q = window.__q.slice(2).sort((a, b) => a - b); const n = q.length, soma = q.reduce((s, x) => s + x, 0); return { quadros: n, medio_ms: +(soma / n).toFixed(1), p95_ms: +q[Math.floor(n * .95)].toFixed(1), max_ms: +q[n - 1].toFixed(1), fps_medio: +(1000 / (soma / n)).toFixed(1), tarefas_longas: window.__lt, tarefa_longa_max_ms: +window.__ltMax.toFixed(0) }; });
// custo de poeNomes: poeNomes começa com nomes2.innerHTML = '' e a tarefa termina quando o MutationObserver (microtarefa) roda
const sonda = page => page.evaluate(() => {
  window.__pn = []; let ini = 0;
  const d = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  Object.defineProperty(Element.prototype, 'innerHTML', { ...d, set(v) { if (this.classList && this.classList.contains('mt-nomes2') && v === '') ini = performance.now(); return d.set.call(this, v); } });
  new MutationObserver(() => { if (ini) { window.__pn.push(performance.now() - ini); ini = 0; } }).observe(document.querySelector('.mt-nomes2'), { childList: true });
});
const custo = page => page.evaluate(() => { const q = window.__pn.filter(x => x > 0).sort((a, b) => a - b); window.__pn = []; return q.length ? { vezes: q.length, mediana_ms: +q[Math.floor(q.length / 2)].toFixed(1), max_ms: +q[q.length - 1].toFixed(1) } : null; });
(async () => {
  const b = await lanca(), out = {};
  // (1) abrir a regional (voa), em página limpa, 4 repetições alternadas original x protótipo (mediana dos quadros médios)
  const reps = { original: [], prototipo: [] };
  for (let i = 0; i < 4; i++) for (const proto of [false, true]) {
    const { ctx, page } = await abre(b, 'desk', proto, { calmo: false });
    await inicia(page);
    await page.click('.mt-regcards button[data-reg="Centro"]'); await esp(page, 1500);
    reps[proto ? 'prototipo' : 'original'].push(await para(page));
    await ctx.close();
  }
  for (const k of Object.keys(reps)) { const o = reps[k].slice().sort((a, b) => a.medio_ms - b.medio_ms); out[k] = { abrir_regional_voa_mediana: o[Math.floor(o.length / 2)], repeticoes_fps: reps[k].map(r => r.fps_medio), repeticoes_tarefa_longa_max_ms: reps[k].map(r => r.tarefa_longa_max_ms) }; }
  // (2) gestos do zoom (só o protótipo) e custo de recalcular os cartões
  {
    const { ctx, page } = await abre(b, 'desk', true, { calmo: false });
    await sonda(page);
    await page.mouse.move(720, 560);
    await inicia(page);
    await page.keyboard.down('Control');
    for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, -120); await esp(page, 60); }
    await page.keyboard.up('Control'); await esp(page, 1200);
    out.prototipo.ctrl_roda_x10 = await para(page);
    out.prototipo.cartoes_estado_zoom_alto_1a_vez = await custo(page);
    await inicia(page);
    await page.mouse.move(700, 560); await page.mouse.down(); await page.mouse.move(400, 420, { steps: 40 }); await page.mouse.up(); await esp(page, 400);
    out.prototipo.arrastar_40_passos = await para(page);
    out.prototipo.cartoes_depois_de_arrastar = await custo(page);
    await page.click('.mt-zoom [data-z=fit]'); await esp(page, 1500);
    await custo(page);
    for (const rep of [1, 2]) {
      await page.mouse.move(720, 560); await page.keyboard.down('Control'); for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, -120); await esp(page, 60); } await page.keyboard.up('Control'); await esp(page, 1200);
      out.prototipo['cartoes_estado_zoom_medio_' + rep + 'a_vez'] = await custo(page);
      await page.click('.mt-zoom [data-z=fit]'); await esp(page, 1500); await custo(page);
    }
    await ctx.close();
  }
  await b.close();
  fs.writeFileSync(__dirname + '/medidas.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
})();
