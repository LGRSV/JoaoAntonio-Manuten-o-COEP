// Mede a fluidez do protótipo (Chromium headless, render por software: serve para comparar, não é FPS de aparelho real):
// tempo entre quadros (rAF) e tarefas longas (>50 ms) durante Ctrl+roda x10, arrastar, abrir a regional (voa), original x protótipo;
// e o custo de recalcular os cartões dos municípios (poeNomes) ao fim de cada gesto, no estado inteiro e no polo.
const fs = require('fs'), os = require('os');
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
const mediana = a => { const q = a.slice().sort((x, y) => x - y); return q.length ? +q[Math.floor(q.length / 2)].toFixed(1) : null; };
(async () => {
  const b = await lanca(), out = { carga_media_1min: +os.loadavg()[0].toFixed(1), nucleos: os.cpus().length };
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
  // (3) recalcular tudo depois de cada gesto (bandeirinhas + cartões dos municípios = recalcZ), por nível e em desktop x celular (CPU 4x mais lenta)
  for (const [nome, view, lento] of [['desktop', 'desk', 1], ['celular_cpu_4x', 'mob', 4]]) {
    const { ctx, page } = await abre(b, view, true, { calmo: false });
    if (lento > 1) { const c = await ctx.newCDPSession(page); await c.send('Emulation.setCPUThrottlingRate', { rate: lento }); }
    const xc = view === 'desk' ? 720 : 195, yc = view === 'desk' ? 560 : 400;
    const gesto = async n => { if (view === 'desk') { await page.mouse.move(xc, yc); await page.keyboard.down('Control'); for (let i = 0; i < n; i++) { await page.mouse.wheel(0, -120); await esp(page, 60); } await page.keyboard.up('Control'); } else { for (let i = 0; i < n / 2; i++) { await page.tap('.mt-zoom [data-z=mais]'); await esp(page, 400); } } await esp(page, 1500); };
    const med = () => page.evaluate(() => { const m = window.ARGOS_MAPA.zoom.medidas(); return m[m.length - 1]; });
    const r = {};
    await inicia(page); await gesto(2); r.estado_x1_7 = { ms_recalculo: await med(), ...await para(page) };
    await page.click('.mt-zoom [data-z=fit]'); await esp(page, 1500);
    await gesto(6); r.estado_zoom_alto = { ms_recalculo: await med() };
    await page.click('.mt-zoom [data-z=fit]'); await esp(page, 1500);
    await page.click('.mt-regcards button[data-reg="Centro"]'); await esp(page, 2000);
    await gesto(2); r.regional_x1_7 = { ms_recalculo: await med() };
    await gesto(4); r.regional_zoom_alto = { ms_recalculo: await med() };
    await page.click('.mt-zoom [data-z=fit]'); await esp(page, 1500);
    await page.click('.mt-barra .mt-pchip'); await esp(page, 2000);
    await gesto(2); r.polo_x1_7 = { ms_recalculo: await med() };
    r.todas_as_medidas_ms = await page.evaluate(() => window.ARGOS_MAPA.zoom.medidas());
    out['recalculo_' + nome] = r;
    await ctx.close();
  }
  // (4) base atual sem o zoom: custo de abrir regional/polo no celular com CPU 4x (para comparar com o recalculo acima)
  for (const proto of [false, true]) {
    const { ctx, page } = await abre(b, 'mob', proto, { calmo: false });
    const c = await ctx.newCDPSession(page); await c.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await inicia(page); await page.tap('.mt-regcards button[data-reg="Centro"]'); await esp(page, 2200);
    out[(proto ? 'prototipo' : 'original') + '_celular_cpu_4x_abrir_regional'] = await para(page);
    await ctx.close();
  }
  await b.close();
  fs.writeFileSync(__dirname + '/medidas.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
})();
