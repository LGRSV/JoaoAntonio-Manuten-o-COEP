// Utilitários comuns de prints.js e testes.js.
// O site de teste é espelhado por servidor.js (http://localhost:8765/teste/) só para contornar o certificado do proxy do ambiente;
// o conteúdo é o do site ao vivo. Para rodar: NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node servidor.js &
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), fs = require('fs');
const RAIZ = __dirname;
const URL = process.env.SITE || 'http://localhost:8765/teste/';
const TELAS = { d: { width: 1440, height: 900 }, m: { width: 390, height: 844 } };

// abre a página: proto = '' (site ao vivo, sem tocar em nada) ou 's1 s2 ...' (injeta proto/ e liga as sugestões)
async function abre(browser, tela, proto = '', extra = {}, claro = false) {
  const ctx = await browser.newContext({ viewport: TELAS[tela], deviceScaleFactor: 1, hasTouch: tela === 'm', isMobile: tela === 'm', ...extra });
  const p = await ctx.newPage();
  const erros = [];
  p.on('pageerror', e => erros.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|favicon|Failed to load resource/.test(m.text())) erros.push(m.text()); });
  p.erros = erros;
  if (claro) await p.addInitScript(() => { try { localStorage.setItem('tema', 'claro'); } catch (e) {} });
  if (proto) {
    await p.addInitScript(v => { const set = () => { document.documentElement.dataset.proto = v; }; if (document.documentElement) set(); else new MutationObserver((m, o) => { if (document.documentElement) { set(); o.disconnect(); } }).observe(document, { childList: true }); }, proto);
    for (const f of ['site.css', 'mapa-municipios.js', 'busca-ativo.js']) {
      await p.route('**/assets/' + f, r => r.fulfill({ path: path.join(RAIZ, 'proto', f), contentType: f.endsWith('.css') ? 'text/css' : 'application/javascript' }));
    }
  }
  await p.goto(URL, { waitUntil: 'networkidle' });
  if (/\bs3\b/.test(proto)) await p.addScriptTag({ path: path.join(RAIZ, 'proto', 'tela-cheia-mapa.js') });
  await p.waitForTimeout(300);
  return p;
}
const esperaVoo = async (p, ms = 1500) => { try { await p.waitForFunction(() => !document.querySelector('.mt-mapa.voando'), null, { timeout: ms }); } catch (e) {} await p.waitForTimeout(350); };
async function nivel(p, ate) {                    // estado → regional Centro → polo Palmas → município Palmas → alimentador (só faz o que falta)
  const tem = c => p.$eval('.mt-mapa', (e, c) => e.classList.contains(c), c);
  if (!await tem('aberta')) { await p.click('.mt-regcards button[data-reg="Centro"]'); await esperaVoo(p); }
  if (ate === 'regional') return;
  if (!await tem('polo')) { await p.click('.mt-pchip[data-polo="Palmas"]'); await esperaVoo(p); }
  if (ate === 'polo') return;
  if (!await tem('nivel-mun')) { await p.click('.mun.tem[aria-label="Palmas"]', { force: true }); await esperaVoo(p); }
  if (ate === 'mun') return;
  const fechada = await p.$eval('.mt-polos-c', e => getComputedStyle(e).display === 'none' || getComputedStyle(e).visibility === 'hidden');
  if (fechada) { await p.click('.mt-puxa'); await p.waitForTimeout(450); }
  await p.click('.mt-al'); await esperaVoo(p);
}
const foto = (p, nome, opt = {}) => p.screenshot({ path: path.join(RAIZ, 'prints', nome + '.jpg'), type: 'jpeg', quality: 80, ...opt });
const mapaNoTopo = p => p.evaluate(() => { const r = document.getElementById('mapa-to'); if (r && !document.body.classList.contains('tc-mapa')) window.scrollTo(0, r.getBoundingClientRect().top + scrollY - 8); });

// caixas tracejadas numeradas sobre elementos (para mapear repetições nos prints "antes")
async function anota(p, grupos) {                 // grupos: [[seletor, número]]
  await p.evaluate(g => {
    document.querySelectorAll('.__nota').forEach(e => e.remove());
    g.forEach(([sel, n]) => document.querySelectorAll(sel).forEach(el => {
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
      const d = document.createElement('div'); d.className = '__nota';
      d.style.cssText = `position:fixed;left:${r.left - 3}px;top:${r.top - 3}px;width:${r.width + 6}px;height:${r.height + 6}px;border:2px dashed #ffd400;border-radius:6px;z-index:99999;pointer-events:none`;
      const b = document.createElement('span'); b.textContent = n;
      b.style.cssText = 'position:absolute;left:-10px;top:-12px;min-width:20px;height:20px;border-radius:10px;background:#ffd400;color:#000;font:700 12px/20px sans-serif;text-align:center;padding:0 4px';
      d.append(b); document.body.append(d);
    }));
  }, grupos);
}
// folha de contato: junta imagens lado a lado (sequência de quadros da animação)
async function folha(browser, arquivos, saida, rotulos = []) {
  const p = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const im = arquivos.map(f => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(RAIZ, 'prints', f + '.jpg')).toString('base64'));
  await p.setContent(`<body style="margin:0;background:#222;display:flex;gap:6px;padding:6px;align-items:flex-start">${im.map((s, i) => `<figure style="margin:0;color:#fff;font:600 13px sans-serif"><img src="${s}" style="height:${arquivos[0].includes('-m-') ? 700 : 520}px;display:block"><figcaption style="padding:4px 2px">${rotulos[i] || ''}</figcaption></figure>`).join('')}</body>`);
  const bb = await p.evaluate(() => [document.body.scrollWidth, document.body.scrollHeight]);
  await p.setViewportSize({ width: bb[0], height: bb[1] });
  await p.screenshot({ path: path.join(RAIZ, 'prints', saida + '.jpg'), type: 'jpeg', quality: 80 });
  await p.close();
}
module.exports = { chromium, abre, nivel, esperaVoo, foto, mapaNoTopo, anota, folha, TELAS, URL, RAIZ };
