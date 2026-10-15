// Perfil de CPU (CDP Profiler) durante a carga: quem gasta tempo. Uso: node perfil-carga.js <caminho> (ex.: alimentadores/LD01072001/)
const L = require('./lib.js');
(async () => {
  const url = process.argv[2] || '';
  const s = await L.abre({ perfil: 'cpu4', extraInit: L.instrumenta }); const { page, cdp } = s;
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 300 }); await cdp.send('Profiler.start');
  await page.goto(L.BASE + url, { waitUntil: 'load' }); await page.waitForTimeout(2500);
  const { profile } = await cdp.send('Profiler.stop');
  const dt = profile.timeDeltas, nodes = Object.fromEntries(profile.nodes.map(n => [n.id, n])), self = {};
  profile.samples.forEach((id, i) => { const n = nodes[id], cf = n.callFrame; const k = `${cf.functionName || '(anon)'} ${cf.url.split('/').slice(-2).join('/')}:${cf.lineNumber + 1}`; self[k] = (self[k] || 0) + (dt[i] || 0); });
  const porArq = {}; Object.entries(self).forEach(([k, v]) => { const f = k.split(' ').pop().split(':')[0]; porArq[f] = (porArq[f] || 0) + v; });
  console.log('Por arquivo (ms, CPU 4x):'); Object.entries(porArq).sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([k, v]) => console.log('  ', (v / 1000).toFixed(0).padStart(5), k));
  console.log('Funções:'); Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => console.log('  ', (v / 1000).toFixed(0).padStart(5), k));
  const m = await page.evaluate(() => ({ lt: window.__lt })); console.log('long tasks', JSON.stringify(m.lt));
  await s.browser.close();
})();
