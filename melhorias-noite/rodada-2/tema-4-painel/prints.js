/* Rodada 2 · tema 4 (painel do alimentador): prints do site ao vivo, do site + lupa (base) e do protótipo consolidado.
 *
 *   NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node prints.js <conjunto...> [--estados=a,b] [--alim=LD01072001,...]
 *
 * conjuntos:
 *   lupa         site ao vivo + proto/original/lupa-painel.orig.js (a proposta da outra sessão, como está)   -> antes/
 *   consolidado  site + proto/lupa-painel.js + proto/painel.css + proto/painel.js (escuro)                    -> depois/
 *   claro        o mesmo, tema claro                                                                          -> depois/
 *
 * O HTML da página do alimentador é reescrito na resposta (page.route): ganha <style> e <script>, e o script da lupa
 * (que o site ao vivo ainda não tem). Nada é gravado no site nem no repositório. As respostas passam pelo fetch do Node
 * porque o Chromium daqui não confia no certificado do proxy.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const BASE = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/alimentadores/';
const ASSETS = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/assets/';
const OUT = __dirname;
const rd = f => fs.readFileSync(path.join(OUT, f), 'utf8');
const VPS = { d: { width: 1440, height: 900 }, m: { width: 390, height: 844 } };
const ALIM = ['LD01072001', 'AL03037009', 'LD02022033', 'AL01015049'];
const cache = {};

const CONJ = {
  lupa:        { lupa: 'proto/original/lupa-painel.orig.js', css: null, js: null, dir: 'antes', pre: 'lupa-' },
  consolidado: { lupa: 'proto/lupa-painel.js', css: 'proto/painel.css', js: 'proto/painel.js', dir: 'depois', pre: '' },
  claro:       { lupa: 'proto/lupa-painel.js', css: 'proto/painel.css', js: 'proto/painel.js', dir: 'depois', pre: 'claro-', claro: true },
};

async function abre(browser, cod, vp, conj) {
  const C = CONJ[conj];
  const ctx = await browser.newContext({ viewport: VPS[vp], deviceScaleFactor: 1, isMobile: vp === 'm', hasTouch: vp === 'm' });
  if (C.claro) await ctx.addInitScript(() => { try { localStorage.setItem('tema', 'claro'); } catch (e) {} });
  const p = await ctx.newPage();
  const lupaJs = C.lupa ? rd(C.lupa) : null, css = C.css ? rd(C.css) : null, js = C.js ? rd(C.js) : null;
  await p.route('**/*', async r => {
    const u = r.request().url();
    try {
      if (lupaJs && u === ASSETS + 'lupa-painel.js') return r.fulfill({ status: 200, contentType: 'text/javascript', body: lupaJs });
      let e = cache[u];
      if (!e) {
        const resp = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } });
        const body = Buffer.from(await resp.arrayBuffer()), headers = {};
        resp.headers.forEach((v, k) => { if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(k)) headers[k] = v; });
        e = { status: resp.status, headers, body };
        if (resp.status === 200) cache[u] = e;
      }
      if (u === BASE + cod + '/') {
        let h = e.body.toString('utf8');
        if (css) h = h.replace('</head>', `<style id="proto-css">${css}</style></head>`);
        const tail = (lupaJs ? '<script src="../../assets/lupa-painel.js"></script>' : '') + (js ? `<script>${js}</script>` : '');
        h = h.replace('</body>', tail + '</body>');
        e = { ...e, body: Buffer.from(h, 'utf8') };
      }
      await r.fulfill(e);
    } catch (err) { await r.abort(); }
  });
  const erros = [];
  p.on('pageerror', e => erros.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) erros.push(m.text()); });
  await p.goto(BASE + cod + '/', { waitUntil: 'load' });
  await p.waitForTimeout(4500);
  p.__erros = erros;
  return { ctx, p };
}

const menuMapa = async (p, abrir) => { const b = await p.$('.ctl-cam-b'); if (b && (await b.getAttribute('aria-expanded')) !== String(abrir)) await b.click(); await p.waitForTimeout(350); };

// liga as camadas pelos botões do Menu (escondidos fora da tela cheia): mesmo efeito do clique na lupa, sem depender do desenho dela
async function ligaCamadas(p) {
  await p.evaluate(async () => {
    for (const c of ['.ctl-insp', '.ctl-mnt', '.ctl-exe']) { const e = document.querySelector('#ctl-camadas ' + c); if (e && e.getAttribute('aria-pressed') !== 'true') e.click(); await new Promise(r => setTimeout(r, 450)); }
  });
  await p.waitForTimeout(500);
}
const escolhe = async (p, nome) => { await p.evaluate(n => window.__sel(window.D.trechos.some(t => t.nome === n) ? n : 'T1', true), nome); await p.waitForTimeout(2200); };

const ESTADOS = {
  inicial: async () => {},
  lupa: async p => { await p.click('.lp-lupa'); await p.waitForTimeout(500); },
  classe: async p => { await p.click('.lp-lupa'); await p.waitForTimeout(300); await p.click('.lp-abre[data-c="T3"]'); await p.waitForTimeout(500); },
  filtros: async p => { await p.click('.lp-fbt'); await p.waitForTimeout(500); },
  camadas: async p => { await ligaCamadas(p); },
  'camadas-lupa': async p => { await ligaCamadas(p); await p.click('.lp-lupa'); await p.waitForTimeout(500); },
  trecho: async p => { await ligaCamadas(p); await escolhe(p, 'T2-A'); },
  'sem-faixa': async p => { await p.evaluate(() => document.querySelector('#ctl-camadas .ctl-faixa').click()); await p.waitForTimeout(700); },
  busca: async p => { await p.click('#busca'); await p.keyboard.type('T3-A', { delay: 40 }); await p.waitForTimeout(900); },
  'busca-poste': async p => { await p.click('#busca'); await p.keyboard.type('N1060', { delay: 40 }); await p.waitForTimeout(1200); },
  municipio: async p => {
    await p.click('.lp-fbt'); await p.waitForTimeout(300);
    const v = await p.evaluate(() => { const o = [...document.querySelectorAll('#f-mun option')].filter(o => o.value); return o.length ? o[o.length - 1].value : ''; });
    if (v) await p.selectOption('#f-mun', v); await p.waitForTimeout(1500);
  },
  'tela-cheia': async p => { await p.click('.tc-btn'); await p.waitForTimeout(1500); },
  'tela-cheia-gaveta': async p => {
    await p.click('.tc-btn'); await p.waitForTimeout(1200);
    await p.click('.ctl-cam-b'); await p.waitForTimeout(300);
    await p.click('.tc-painel-m'); await p.waitForTimeout(900);
  },
  dados: async p => { await p.evaluate(() => { const d = document.querySelector('details.dados'); d.open = true; d.scrollIntoView({ block: 'start' }); }); await p.waitForTimeout(500); },
  gaveta: async p => { await ligaCamadas(p); await p.click('.sheet-h'); await p.waitForTimeout(800); },
};
module.exports = { abre, CONJ, VPS, ALIM, OUT, BASE, ESTADOS, ligaCamadas, escolhe };

const file = (conj, cod, vp, est) => {
  const C = CONJ[conj], dir = path.join(OUT, C.dir);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${C.pre}${cod}-${vp}-${est}.jpg`);
};

async function principal() {
  const args = process.argv.slice(2);
  const conj = args.filter(a => !a.startsWith('--')), only = (args.find(a => a.startsWith('--estados=')) || '').slice(10).split(',').filter(Boolean);
  const alims = (args.find(a => a.startsWith('--alim=')) || '').slice(7).split(',').filter(Boolean);
  const vps = (args.find(a => a.startsWith('--vp=')) || '--vp=d,m').slice(5).split(',');
  const browser = await chromium.launch();
  for (const c of conj) {
    for (const cod of (alims.length ? alims : ALIM)) for (const vp of vps) {
      let estados = (args.find(a => a.startsWith('--estados=')) ? only : ['inicial', 'lupa', 'classe', 'filtros', 'camadas', 'trecho']);
      for (const est of estados) {
        if (est === 'gaveta' && (vp === 'd' || c === 'lupa')) continue;
        const { ctx, p } = await abre(browser, cod, vp, c);
        try {
          await ESTADOS[est](p);
          await p.screenshot({ path: file(c, cod, vp, est), type: 'jpeg', quality: 80 });
          console.log('ok', c, cod, vp, est, p.__erros.length ? 'ERROS JS: ' + p.__erros.join(' | ') : '');
        } catch (e) { console.log('ERRO', c, cod, vp, est, e.message.split('\n')[0]); }
        await ctx.close();
      }
    }
  }
  await browser.close();
}
if (require.main === module) principal();
