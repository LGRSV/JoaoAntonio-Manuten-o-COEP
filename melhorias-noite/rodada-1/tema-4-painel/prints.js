/* Gera os prints do tema 4 (Painel do alimentador): antes (site ao vivo) e depois (site ao vivo + protótipo injetado).
 *
 *   NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node prints.js [conjunto ...] [--estados=a,b] [--alim=LD01072001,...]
 *
 * conjuntos: antes | s1 | s2 | s3 | s4 | s5 | todas | todas-claro        (padrão: todos)
 *   s1..s5  = só aquela sugestão (a s5 sempre com a s1, que a precede: cabeçalho compacto)
 *   todas   = as cinco juntas
 * estados: inicial, camadas, trecho, sem-faixa, menu, tela-cheia, dados, painel-longo, gaveta
 *
 * Como o protótipo entra: o HTML da página do alimentador é reescrito na resposta (page.route), ganhando
 * <style> proto/painel.css no <head> e <script> proto/painel.js no fim do <body>, com window.__PROTO = flags.
 * Nada é gravado no site nem no repositório. As respostas de rede passam por fetch do Node (e não pela rede do
 * Chromium) só porque, neste ambiente, o Chromium não confia no certificado do proxy de saída; fora daqui,
 * basta trocar o page.route por page.goto direto.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const BASE = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/alimentadores/';
const OUT = __dirname;
const CSS = fs.readFileSync(path.join(OUT, 'proto/painel.css'), 'utf8');
const JS = fs.readFileSync(path.join(OUT, 'proto/painel.js'), 'utf8');

const FLAGS = {
  antes: null,
  s1: { s1: 1 }, s2: { s2: 1 }, s3: { s3: 1 }, s4: { s4: 1 }, s5: { s1: 1, s5: 1 },
  todas: { s1: 1, s2: 1, s3: 1, s4: 1, s5: 1 }, 'todas-claro': { s1: 1, s2: 1, s3: 1, s4: 1, s5: 1 },
};
const VPS = { d: { width: 1440, height: 900 }, m: { width: 390, height: 844 } };
const ALIM = ['LD01072001', 'AL03037009', 'LD02022033', 'AL01015049'];   // médio, médio, grande (1.375 km), pequeno (5,5 km)
const cache = {};

async function abre(browser, cod, vp, flags, claro) {
  const ctx = await browser.newContext({ viewport: VPS[vp], deviceScaleFactor: 1, isMobile: vp === 'm', hasTouch: vp === 'm' });
  if (claro) await ctx.addInitScript(() => { try { localStorage.setItem('tema', 'claro'); } catch (e) {} });
  const p = await ctx.newPage();
  await p.route('**/*', async r => {
    const u = r.request().url();
    try {
      let e = cache[u];
      if (!e) {
        const resp = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } });
        const body = Buffer.from(await resp.arrayBuffer()), headers = {};
        resp.headers.forEach((v, k) => { if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(k)) headers[k] = v; });
        e = { status: resp.status, headers, body };
        if (resp.status === 200) cache[u] = e;
      }
      if (flags && u === BASE + cod + '/') {
        let h = e.body.toString('utf8');
        h = h.replace('</head>', `<style id="proto-css">${CSS}</style></head>`)
             .replace('</body>', `<script>window.__PROTO=${JSON.stringify(flags)}</script><script>${JS}</script></body>`);
        e = { ...e, body: Buffer.from(h, 'utf8') };
      }
      await r.fulfill(e);
    } catch (err) { await r.abort(); }
  });
  await p.goto(BASE + cod + '/', { waitUntil: 'load' });
  await p.waitForTimeout(4500);
  return { ctx, p };
}

const menuMapa = async (p, abrir) => { const b = await p.$('.ctl-cam-b'); if (b && (await b.getAttribute('aria-expanded')) !== String(abrir)) await b.click(); await p.waitForTimeout(350); };
async function ligaCamadas(p) {
  await menuMapa(p, true);
  for (const c of ['.ctl-insp', '.ctl-mnt', '.ctl-exe']) { const e = await p.$('#ctl-camadas ' + c); if (e) await e.click(); await p.waitForTimeout(450); }
  await menuMapa(p, false);
}
const soltaPainel = p => p.addStyleTag({ content: '.panel{max-height:none!important;position:static!important;overflow:visible!important;height:auto!important;transform:none!important}' });

const ESTADOS = {
  inicial: async () => {},
  camadas: async p => { await ligaCamadas(p); },
  trecho: async (p, vp, depois) => {
    await ligaCamadas(p);
    await p.evaluate(() => window.__sel(window.D.trechos.some(t => t.nome === 'T2-A') ? 'T2-A' : 'T1', true)); await p.waitForTimeout(2200);
    if (vp === 'm' && !depois) await p.evaluate(() => { const m = document.querySelector('.mapbox').getBoundingClientRect(); window.scrollBy(0, m.top); });
    await p.waitForTimeout(500);
  },
  'sem-faixa': async p => { await menuMapa(p, true); await p.click('#ctl-camadas .ctl-faixa'); await p.waitForTimeout(500); await menuMapa(p, false); await p.waitForTimeout(500); },
  menu: async p => { await menuMapa(p, true); },
  'tela-cheia': async p => { await p.click('.tc-btn'); await p.waitForTimeout(1500); },
  dados: async (p, vp, depois) => {
    await p.evaluate(() => { const d = document.querySelector('details.dados'); d.open = true; d.scrollIntoView({ block: 'start' }); });
    await p.waitForTimeout(500);
  },
  gaveta: async (p) => { await p.click('.sheet-h'); await p.waitForTimeout(700); },
};
// estados que fazem sentido por conjunto (além do 'inicial')
const POR_CONJUNTO = {
  antes: ['camadas', 'trecho', 'sem-faixa', 'menu', 'tela-cheia', 'dados', 'painel-longo'],
  s1: [], s2: ['sem-faixa'], s3: ['camadas', 'menu'], s4: ['trecho'], s5: ['camadas', 'trecho', 'gaveta'],
  todas: ['camadas', 'trecho', 'sem-faixa', 'tela-cheia', 'dados', 'painel-longo', 'gaveta'], 'todas-claro': ['trecho'],
};

async function principal() {
  const args = process.argv.slice(2);
  const conj = args.filter(a => !a.startsWith('--')), only = (args.find(a => a.startsWith('--estados=')) || '').slice(10).split(',').filter(Boolean);
  const alims = (args.find(a => a.startsWith('--alim=')) || '').slice(7).split(',').filter(Boolean);
  const lista = conj.length ? conj : Object.keys(FLAGS);
  const browser = await chromium.launch();
  for (const c of lista) {
    const flags = FLAGS[c], depois = c !== 'antes', claro = c === 'todas-claro';
    for (const cod of (alims.length ? alims : ALIM)) {
      for (const vp of ['d', 'm']) {
        let estados = ['inicial'].concat(cod === 'LD01072001' ? POR_CONJUNTO[c] : []);
        if (c === 'todas' && cod !== 'LD01072001') estados = ['inicial', 'trecho'];
        if (only.length) estados = estados.filter(e => only.includes(e));
        for (const est of estados) {
          if (est === 'gaveta' && vp === 'd') continue;                      // a gaveta é do celular
          if (est === 'gaveta' && !(flags && flags.s5)) continue;
          const { ctx, p } = await abre(browser, cod, vp, flags, claro);
          try {
            if (est === 'painel-longo') { await ESTADOS.camadas(p); await soltaPainel(p); await p.waitForTimeout(400); if (vp === 'd') { const el = await p.$('.panel'); await el.screenshot({ path: file(c, cod, vp, est), type: 'jpeg', quality: 80 }); } else await p.screenshot({ path: file(c, cod, vp, est), type: 'jpeg', quality: 70, fullPage: true }); }
            else {
              if (est === 'gaveta') await ESTADOS.camadas(p);
              await ESTADOS[est](p, vp, depois);
              await p.screenshot({ path: file(c, cod, vp, est), type: 'jpeg', quality: 80 });
            }
            console.log('ok', c, cod, vp, est);
          } catch (e) { console.log('ERRO', c, cod, vp, est, e.message.split('\n')[0]); }
          await ctx.close();
        }
      }
    }
  }
  await browser.close();
}
if (require.main === module) principal(); else module.exports = { abre, FLAGS, ESTADOS, menuMapa, ligaCamadas };

function file(c, cod, vp, est) {
  const dir = path.join(OUT, c === 'antes' ? 'antes' : 'depois');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, (c === 'antes' ? '' : c + '-') + `${cod}-${vp}-${est}.jpg`);
}
