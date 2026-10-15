// O que há dentro de cada long task da carga (trace do Chromium): para cada RunTask > 50 ms, o tempo por tipo de evento filho e os scripts avaliados.
// uso: node tarefas-longas.js [caminho] [4]   (PROTO=1 liga o protótipo)
const L = require('./lib.js'), inj = require('./injeta.js');
(async () => {
  const url = process.argv[2] || 'alimentadores/LD02022033/', cpu = process.argv[3] === '4' ? 'cpu4' : 'base';
  const s = await L.abre({ perfil: cpu }); await inj.aplica(s.ctx, s.page); const { page, browser } = s;
  await browser.startTracing(page, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8'] });
  await page.goto(L.BASE + url, { waitUntil: 'load' }); await page.waitForTimeout(4000);
  const ev = JSON.parse((await browser.stopTracing()).toString()).traceEvents;
  const main = ev.filter(e => e.ph === 'X' && e.name === 'RunTask' && e.dur > 50000).sort((a, b) => a.ts - b.ts);
  const t0 = Math.min(...ev.filter(e => e.ts).map(e => e.ts));
  main.forEach(t => { const kids = ev.filter(e => e.ph === 'X' && e.tid === t.tid && e.pid === t.pid && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur && e !== t && e.dur > 3000); const por = {};
    kids.forEach(k => { const key = k.name + (k.args && k.args.data && k.args.data.url ? ' ' + k.args.data.url.split('/').slice(-2).join('/') : ''); if (/^(RunTask|FunctionCall|EvaluateScript|v8\.run|ThreadControllerImpl::RunTask)$/.test(k.name) && !/ /.test(key)) return; por[key] = Math.max(por[key] || 0, k.dur); });
    console.log(`t=${Math.round((t.ts - t0) / 1000)} dur=${Math.round(t.dur / 1000)}ms`, Object.entries(por).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k}:${Math.round(v / 1000)}`).join(' | ')); });
  await browser.close();
})();
