// Onde vai o tempo na carga: perfil de CPU (CDP Profiler) + trace (EvaluateScript, compile, Layout, Paint) por arquivo.
// uso: node perfil-alim.js [caminho] [cpu]   ex.: node perfil-alim.js alimentadores/LD02022033/ 4
const L = require('./lib.js'), fs = require('fs'), inj = require('./injeta.js');
(async () => {
  const url = process.argv[2] || 'alimentadores/LD02022033/', cpu = process.argv[3] === '4' ? 'cpu4' : 'base';
  const s = await L.abre({ perfil: cpu }); await inj.aplica(s.ctx, s.page); const { page, cdp, browser } = s;
  await s.ctx.addInitScript(L.instrumenta);
  await browser.startTracing(page, { categories: ['devtools.timeline', 'v8', 'disabled-by-default-devtools.timeline'] });
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 250 }); await cdp.send('Profiler.start');
  await page.goto(L.BASE + url, { waitUntil: 'load' }); await page.waitForTimeout(3500);
  const { profile } = await cdp.send('Profiler.stop'); const buf = await browser.stopTracing();
  const dt = profile.timeDeltas, nodes = Object.fromEntries(profile.nodes.map(n => [n.id, n])), self = {};
  profile.samples.forEach((id, i) => { const n = nodes[id], cf = n.callFrame; const k = `${cf.functionName || '(anon)'} ${cf.url.split('/').slice(-2).join('/')}:${cf.lineNumber + 1}`; self[k] = (self[k] || 0) + (dt[i] || 0); });
  const porArq = {}; Object.entries(self).forEach(([k, v]) => { const f = k.split(' ').pop().split(':')[0] || '(nativo)'; porArq[f] = (porArq[f] || 0) + v; });
  console.log(`CPU ${cpu}: tempo de JS por arquivo (ms, amostragem)`); Object.entries(porArq).sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([k, v]) => console.log('  ', (v / 1000).toFixed(0).padStart(6), k));
  console.log('Funções (próprio):'); Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 14).forEach(([k, v]) => console.log('  ', (v / 1000).toFixed(0).padStart(6), k));
  const ev = JSON.parse(buf.toString()).traceEvents, soma = {}, porUrl = {};
  ev.forEach(e => { if (e.ph !== 'X' || !e.dur) return; const n = e.name; if (!/^(EvaluateScript|v8\.compile|v8\.parseOnBackground|ParseHTML|Layout|UpdateLayoutTree|Paint|PrePaint|Layerize|Commit|RunTask|FunctionCall|CompileScript|ResourceFinish|XHRReadyStateChange|FireAnimationFrame|HitTest|ImageDecodeTask|Decode Image|TimerFire|EventDispatch)$/.test(n)) return;
    soma[n] = (soma[n] || 0) + e.dur; if (/EvaluateScript|CompileScript|v8\.compile/.test(n) && e.args && e.args.data && e.args.data.url) { const u = e.args.data.url.split('/').slice(-2).join('/'); porUrl[n + ' ' + u] = (porUrl[n + ' ' + u] || 0) + e.dur; } });
  console.log('Trace (ms, soma; RunTask inclui tudo):'); Object.entries(soma).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log('  ', (v / 1000).toFixed(0).padStart(6), k));
  console.log('Scripts: compilar/executar por arquivo:'); Object.entries(porUrl).sort((a, b) => b[1] - a[1]).slice(0, 18).forEach(([k, v]) => console.log('  ', (v / 1000).toFixed(0).padStart(6), k));
  const m = await page.evaluate(() => ({ lt: window.__lt })); console.log('long tasks', JSON.stringify(m.lt));
  await s.browser.close();
})();
