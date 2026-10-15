// Utilitários comuns de prints.js e testes.js (rodada 3, tema 1).
// O Chromium do ambiente não confia na CA do proxy: as páginas e os dados vêm do site de teste ao vivo pelo curl (que confia)
// e são entregues ao navegador por page.route (cache em disco, fora da pasta de entrega). Os assets que o protótipo altera
// (proto/) entram no lugar dos do site; o HTML ganha a tag do script novo no mesmo ponto em que o gerador a poria.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), fs = require('fs'), os = require('os'), { execFileSync } = require('child_process');
const RAIZ = __dirname;
const BASE = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/';
const CACHE = process.env.CACHE_ARGOS || path.join(os.tmpdir(), 'argos-cache-r3t1'); fs.mkdirSync(CACHE, { recursive: true });
const CA = '/root/.ccr/ca-bundle.crt';
const TELAS = { d: { width: 1440, height: 900 }, m: { width: 390, height: 844 } };
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const MIME = { css: 'text/css', js: 'application/javascript', json: 'application/json', png: 'image/png', html: 'text/html', woff2: 'font/woff2' };

function baixa(url) {                               // [status, content-type, Buffer] via curl, com cache em disco
  const f = path.join(CACHE, Buffer.from(url).toString('base64url').slice(-120) + '.' + require('crypto').createHash('md5').update(url).digest('hex'));
  if (fs.existsSync(f)) { const t = JSON.parse(fs.readFileSync(f + '.json')); return [t.s, t.t, fs.readFileSync(f)]; }
  let s = 404, t = 'application/octet-stream', b = Buffer.alloc(0);
  try {
    const out = execFileSync('curl', ['-sS', '-L', '--cacert', CA, '-A', UA, '-o', f, '-w', '%{http_code} %{content_type}', url], { maxBuffer: 1 << 26 }).toString();
    s = +out.split(' ')[0]; t = out.slice(out.indexOf(' ') + 1) || t;
    b = fs.readFileSync(f);
  } catch (e) { s = 599; }
  if (s !== 200) { try { fs.unlinkSync(f); } catch (e) {} return [s, t, b]; }
  fs.writeFileSync(f + '.json', JSON.stringify({ s, t }));
  return [s, t, b];
}

// proto: false = site como está (arquivos de live/ = os de alimentador/site/); true = injeta proto/ (arquivos presentes na pasta)
async function abre(browser, tela, { proto = false, claro = false, hash = '', extra = {}, ctx: ctxOpt = null, base = BASE } = {}) {
  const ctx = ctxOpt || await browser.newContext({ viewport: TELAS[tela], deviceScaleFactor: 1, hasTouch: tela === 'm', isMobile: tela === 'm', ...extra });
  const p = await ctx.newPage();
  const erros = [];
  p.on('pageerror', e => erros.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) erros.push(m.text()); });
  p.erros = erros;
  if (claro) await p.addInitScript(() => { try { localStorage.setItem('tema', 'claro'); } catch (e) {} });
  await p.route(/^https:\/\/(lgrsv\.github\.io|fonts\.googleapis\.com|fonts\.gstatic\.com)\//, async r => {
    const u = r.request().url().split('#')[0];
    const m = u.match(/\/teste\/assets\/([^?]+)/);
    if (m) {
      const pf = path.join(RAIZ, 'proto', m[1]), lf = path.join(RAIZ, 'live', m[1]);
      if (proto && fs.existsSync(pf)) return r.fulfill({ path: pf, contentType: MIME[m[1].split('.').pop()] || 'application/octet-stream' });
      if (fs.existsSync(lf)) return r.fulfill({ path: lf, contentType: MIME[m[1].split('.').pop()] || 'application/octet-stream' });
    }
    if (/\/teste\/(index\.html)?(\?.*)?$/.test(u)) {
      let h = fs.readFileSync(path.join(RAIZ, 'live', 'index.html'), 'utf8');
      if (proto && !process.env.SEM_EXTRAS && fs.existsSync(path.join(RAIZ, 'proto', 'mapa-extras.js'))) h = h.replace('<script src="assets/busca-ativo.js"></script>', '<script src="assets/busca-ativo.js"></script>\n<script src="assets/mapa-extras.js"></script>');
      return r.fulfill({ body: h, contentType: 'text/html; charset=utf-8' });
    }
    const [s, t, b] = baixa(u);
    return r.fulfill({ status: s, body: b, contentType: t });
  });
  await p.goto(base + (hash || ''), { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  return p;
}
const esperaVoo = async (p, ms = 2500) => { try { await p.waitForFunction(() => !document.querySelector('.mt-mapa.voando'), null, { timeout: ms }); } catch (e) {} await p.waitForTimeout(350); };
const nivelAtual = p => p.evaluate(() => window.ARGOS_MAPA.nivel());
// navega por cliques de verdade até o nível pedido (só faz o que falta)
async function nivel(p, ate) {
  try { await nivel0(p, ate); } finally { await p.mouse.move(1, 1); await p.waitForTimeout(250); }
}
async function nivel0(p, ate) {
  const tem = c => p.$eval('.mt-mapa', (e, c) => e.classList.contains(c), c);
  if (!await tem('aberta')) { await p.click('.mt-regcards button[data-reg="Centro"]'); await esperaVoo(p); }
  if (ate === 'regional') return;
  if (!await tem('polo')) {                                     // protótipo: o cartão do polo no mapa é o botão; site atual: o chip da barra
    await p.waitForSelector('.mt-selos button.mt-pm, .mt-pchip[data-polo]', { timeout: 5000 });
    await p.click(await p.$('.mt-selos button.mt-pm[data-polo="Palmas"]') ? '.mt-selos button.mt-pm[data-polo="Palmas"]' : '.mt-pchip[data-polo="Palmas"]'); await esperaVoo(p);
  }
  if (ate === 'polo') return;
  if (!await tem('nivel-mun')) { await p.click('.mun.tem[aria-label="Palmas"]', { force: true }); await esperaVoo(p); }
  if (ate === 'mun') return;
  if (!await p.$('#ativo-res .sug-op')) { await p.click('#ativo-q'); await p.waitForTimeout(300); }
  await p.click('#ativo-res .sug-op'); await esperaVoo(p);
}
const solta = p => p.mouse.move(1, 1);                 // tira o mouse de cima do mapa (o toque emulado deixa um "hover" que apaga os outros polos)
const foto = (p, nome, opt = {}) => p.screenshot({ path: path.join(RAIZ, 'prints', nome + '.jpg'), type: 'jpeg', quality: 80, ...opt });
// caixas tracejadas numeradas sobre elementos (mapa das repetições)
async function anota(p, grupos) {
  await p.evaluate(g => {
    document.querySelectorAll('.__nota').forEach(e => e.remove());
    g.forEach(([sel, n, max]) => [...document.querySelectorAll(sel)].slice(0, max || 999).forEach(el => {
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
      const d = document.createElement('div'); d.className = '__nota';
      d.style.cssText = `position:fixed;left:${r.left - 3}px;top:${r.top - 3}px;width:${r.width + 6}px;height:${r.height + 6}px;border:2px dashed #ffd400;border-radius:6px;z-index:99999;pointer-events:none`;
      const b = document.createElement('span'); b.textContent = n;
      b.style.cssText = 'position:absolute;left:-10px;top:-12px;min-width:20px;height:20px;border-radius:10px;background:#ffd400;color:#000;font:700 12px/20px sans-serif;text-align:center;padding:0 4px';
      d.append(b); document.body.append(d);
    }));
  }, grupos);
}
const semNotas = p => p.evaluate(() => document.querySelectorAll('.__nota').forEach(e => e.remove()));
module.exports = { chromium, abre, nivel, solta, esperaVoo, nivelAtual, foto, anota, semNotas, TELAS, BASE, RAIZ, baixa };
