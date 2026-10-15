// utilitários compartilhados pelos scripts de print (tema 2 · mapa e zoom)
// O Chromium do sandbox não confia na CA do proxy, então toda requisição https passa por curl (com o CA do proxy) e fica em cache em disco.
const path = require('path'), fs = require('fs'), crypto = require('crypto'), { execFileSync } = require('child_process');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const DIR = __dirname;
const CACHE = process.env.ARGOS_CACHE || '/tmp/claude-0/-home-user-smartled/2ba15095-ae67-51f0-acd3-e77e4b1d05de/scratchpad/cache-site';
fs.mkdirSync(CACHE, { recursive: true });
const URL = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/';
const VIEWS = { desk: { width: 1440, height: 900 }, mob: { width: 390, height: 844 } };
function busca(url) {
  const h = crypto.createHash('sha1').update(url).digest('hex'), f = path.join(CACHE, h);
  if (!fs.existsSync(f + '.body')) {
    try {
      execFileSync('curl', ['-sS', '--fail', '--cacert', '/root/.ccr/ca-bundle.crt', '-D', f + '.hdr', '-o', f + '.body', url], { stdio: 'pipe' });
    } catch (e) { return { status: 404, type: 'text/plain', body: Buffer.from('') }; }
  }
  const hdr = fs.readFileSync(f + '.hdr', 'utf8').split(/\r?\n/).reverse().find(l => /^content-type:/i.test(l));
  return { status: 200, type: hdr ? hdr.split(':').slice(1).join(':').trim() : 'application/octet-stream', body: fs.readFileSync(f + '.body') };
}
async function abre(browser, view, proto, opts = {}) {
  const v = VIEWS[view];
  const ctx = await browser.newContext({
    viewport: v, deviceScaleFactor: 1, colorScheme: opts.claro ? 'light' : 'dark',
    hasTouch: view === 'mob', isMobile: view === 'mob', reducedMotion: opts.calmo ? 'reduce' : 'no-preference',
  });
  if (opts.claro) await ctx.addInitScript(() => { try { localStorage.setItem('tema', 'claro'); } catch (e) {} });
  const page = await ctx.newPage();
  await page.route(/^https:\/\//, r => {
    const u = r.request().url();
    if (proto && /\/assets\/mapa-municipios\.js$/.test(u)) return r.fulfill({ path: path.join(DIR, 'proto/mapa-municipios.js'), contentType: 'application/javascript' });
    if (proto && /\/assets\/site\.css$/.test(u)) return r.fulfill({ path: path.join(DIR, 'proto/site.css'), contentType: 'text/css' });
    const b = busca(u);
    r.fulfill({ status: b.status, contentType: b.type, body: b.body });
  });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) console.log('CONSOLE', m.text()); });
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForSelector('.mt-mapa svg path.mun');
  await page.evaluate(() => document.fonts && document.fonts.ready);
  for (const f of opts.css || []) await page.addStyleTag({ path: path.join(DIR, f) });
  for (const f of opts.js || []) await page.addScriptTag({ path: path.join(DIR, f) });
  await page.waitForTimeout(600);
  return { ctx, page };
}
const shot = (page, name, opts = {}) => page.screenshot({ path: path.join(DIR, 'prints', name + '.jpg'), type: 'jpeg', quality: 80, ...opts });
const lanca = () => chromium.launch();
module.exports = { chromium, lanca, abre, shot, DIR, VIEWS, URL };
