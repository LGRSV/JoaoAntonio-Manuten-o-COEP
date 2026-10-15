// utilitários compartilhados pelos scripts de print (tema 2 · mapa e zoom)
// O Chromium do sandbox não confia na CA do proxy, então toda requisição https passa por curl (com o CA do proxy) e fica em cache em disco.
const path = require('path'), fs = require('fs'), crypto = require('crypto'), { execFileSync } = require('child_process');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const DIR = __dirname;
const CACHE = process.env.ARGOS_CACHE || '/tmp/claude-0/-home-user-smartled/2ba15095-ae67-51f0-acd3-e77e4b1d05de/scratchpad/cache-site-r2';
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
// confere os cartões dos municípios (.mt-nomes2 .mt-mn) na tela: sem sobreposição entre si nem com o que está por cima do mapa
// (legenda aberta, botões de zoom, seta de voltar, cartões das regionais/polos enquanto aparecem), dentro da caixa do mapa
// e com o centro dentro do PRÓPRIO município (confere o nome do cartão com o município que está embaixo dele)
const checaCartoes = page => page.evaluate(() => {
  const caixa = document.querySelector('.mt-mapa'), cr = caixa.getBoundingClientRect();
  const longe = caixa.classList.contains('zoom-longe'), reg = caixa.classList.contains('aberta'), pol = caixa.classList.contains('polo');
  const cards = [...document.querySelectorAll('.mt-nomes2 .mt-mn')].map(e => ({ e, r: e.getBoundingClientRect(), nome: (e.querySelector('b') || {}).textContent || null }));
  const fixos = [];
  const add = (e, nome) => { if (e && e.offsetParent) fixos.push({ nome, r: e.getBoundingClientRect() }); };
  add(document.querySelector('.mt-regs[open] .mt-regs-c'), 'legenda'); add(document.querySelector('.mt-regs'), 'legenda-resumo');
  add(document.querySelector('.mt-zoom'), 'botoes-zoom'); add(document.querySelector('.mt-volta:not([hidden])'), 'voltar');
  if (!longe && !reg) document.querySelectorAll('.mt-regcards button').forEach(b => add(b, 'cartao-regional'));
  if (!longe && reg && !pol) document.querySelectorAll('.mt-selos .mt-mn').forEach(b => add(b, 'cartao-polo'));
  const cruza = (a, b) => a.left < b.right - .5 && a.right > b.left + .5 && a.top < b.bottom - .5 && a.bottom > b.top + .5;
  const out = { n: cards.length, sobrepoe: [], comFixo: [], fora: [], foraDoMun: [], semNae: 0 };
  cards.forEach((c, i) => {
    if (!c.e.querySelector('i')) out.semNae++;
    for (let j = i + 1; j < cards.length; j++) if (cruza(c.r, cards[j].r)) out.sobrepoe.push([c.nome, cards[j].nome]);
    fixos.forEach(f => { if (cruza(c.r, f.r)) out.comFixo.push([c.nome, f.nome]); });
    if (c.r.left < cr.left - 1 || c.r.right > cr.right + 1 || c.r.top < cr.top - 1 || c.r.bottom > cr.bottom + 1) out.fora.push(c.nome);
    if (c.nome) {
      const m = window.MUN.muns.find(x => x.nome === c.nome), el = document.elementFromPoint((c.r.left + c.r.right) / 2, (c.r.top + c.r.bottom) / 2), p = el && el.closest('.mun');
      if (!p || !m || p.dataset.cod !== m.cod) out.foraDoMun.push(c.nome + ' → ' + (p ? p.getAttribute('aria-label') || p.dataset.cod : el && el.tagName));
    }
  });
  return out;
});
module.exports = { chromium, lanca, abre, shot, checaCartoes, DIR, VIEWS, URL };
