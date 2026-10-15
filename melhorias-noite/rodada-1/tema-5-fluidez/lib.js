// Utilitários compartilhados pelos scripts de medição (Playwright + CDP)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { execFile } = require('child_process');
const BASE = process.env.BASE || 'http://localhost:18765/';
const CACHE = '/tmp/claude-0/-home-user-smartled/2ba15095-ae67-51f0-acd3-e77e4b1d05de/scratchpad/ext';
fs.mkdirSync(CACHE, { recursive: true });
const PERFIS = {
  base:   { cpu: 1, rede: null, nome: 'Normal' },
  cpu4:   { cpu: 4, rede: null, nome: 'CPU 4x mais lenta' },
  lenta:  { cpu: 4, rede: { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 }, nome: 'CPU 4x + 4G lenta (1,6 Mbps, 150 ms)' },
};
// requisições externas (fontes do Google, tiles do mapa) vão por curl (o Chromium não confia na CA do proxy) e ficam em cache
function externo(url) {
  const f = path.join(CACHE, crypto.createHash('md5').update(url).digest('hex'));
  return new Promise(ok => {
    if (fs.existsSync(f + '.body')) return ok({ f, tipo: fs.readFileSync(f + '.tipo', 'utf8') });
    execFile('curl', ['-sSL', '-m', '40', '-A', 'Mozilla/5.0 (X11; Linux x86_64) Chrome/120', '-D', f + '.h', '-o', f + '.body', url], err => {
      if (err || !fs.existsSync(f + '.body')) return ok(null);
      const h = fs.readFileSync(f + '.h', 'utf8'); const m = [...h.matchAll(/content-type:\s*([^\r\n]+)/gi)].pop();
      fs.writeFileSync(f + '.tipo', m ? m[1] : 'application/octet-stream'); ok({ f, tipo: m ? m[1] : 'application/octet-stream' });
    });
  });
}
async function abre({ w = 1440, h = 900, perfil = 'base', mobile = false, tema = 'escuro', extraInit } = {}) {
  const browser = await chromium.launch({ args: ['--enable-precise-memory-info'] });
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, locale: 'pt-BR' });
  const ext = { bytes: 0, n: 0 };
  await ctx.route(u => !/^http:\/\/localhost/.test(u.toString()) && /^https?:/.test(u.toString()), async r => {
    const e = await externo(r.request().url());
    if (!e) return r.abort();
    const body = fs.readFileSync(e.f + '.body'); ext.bytes += body.length; ext.n++;
    r.fulfill({ status: 200, body, contentType: e.tipo, headers: { 'access-control-allow-origin': '*' } });
  });
  if (tema === 'claro') await ctx.addInitScript(() => { try { localStorage.setItem('tema', 'claro'); } catch (e) {} });
  if (extraInit) await ctx.addInitScript(extraInit);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const P = PERFIS[perfil];
  if (P.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: P.cpu });
  await cdp.send('Network.enable');
  if (P.rede) await cdp.send('Network.emulateNetworkConditions', P.rede);
  const log = { erros: [], falhas: [] };
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) log.erros.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => log.erros.push('pageerror: ' + e.message));
  page.on('requestfailed', r => log.falhas.push(r.url() + ' ' + (r.failure() || {}).errorText));
  // bytes que passaram pela rede (transferência, já comprimida) por recurso
  const rec = {};
  cdp.on('Network.responseReceived', e => { rec[e.requestId] = { url: e.response.url, tipo: e.type, status: e.response.status }; });
  cdp.on('Network.loadingFinished', e => { if (rec[e.requestId]) rec[e.requestId].bytes = e.encodedDataLength; });
  return { browser, ctx, page, cdp, log, rec, ext };
}
const instrumenta = () => {
  window.__lt = []; window.__fps = null;
  try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push({ t: Math.round(e.startTime), d: Math.round(e.duration) }))).observe({ type: 'longtask', buffered: true }); } catch (e) {}
  // FPS: coleta timestamps de rAF enquanto window.__fpsOn estiver ligado
  window.__frames = [];
  const loop = t => { if (window.__fpsOn) window.__frames.push(t); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  window.__fpsIni = () => { window.__frames = []; window.__fpsOn = true; };
  window.__fpsFim = () => { window.__fpsOn = false; const f = window.__frames, d = []; for (let i = 1; i < f.length; i++) d.push(f[i] - f[i - 1]);
    if (!d.length) return { n: 0 }; const tot = f[f.length - 1] - f[0]; d.sort((a, b) => a - b);
    return { n: f.length, ms: Math.round(tot), fps: +(1000 * (f.length - 1) / tot).toFixed(1), p95: +d[Math.floor(d.length * .95)].toFixed(1), pior: +d[d.length - 1].toFixed(1), travados: d.filter(x => x > 50).length }; };
};
module.exports = { chromium, abre, instrumenta, BASE, PERFIS };
