// Gera os prints (JPEG q80, 1440x900 e 390x844, tema escuro) antes/depois. node prints.js   (espelho em :18766 de pé)
const L = require('./lib.js'), fs = require('fs'), inj = require('./injeta.js');
const TEMA = process.env.TEMA || 'escuro', SUF = TEMA === 'claro' ? '-claro' : '';
const SAI = 'prints-finais/tmp/'; fs.mkdirSync(SAI, { recursive: true });
const VPS = { '1440': { w: 1440, h: 900 }, '390': { w: 390, h: 844, mobile: true } };
const espera = async (page, cond, ms = 8000) => { try { await page.waitForFunction(cond, null, { timeout: ms, polling: 30 }); } catch (e) {} };
const FIM = `!document.querySelector('.mt-mapa').classList.contains('voando')`;
const shot = (p, nome) => process.env.SO && !nome.startsWith(process.env.SO) ? null : p.screenshot({ path: SAI + nome + SUF + '.jpg', type: 'jpeg', quality: 80 });
// legenda sobreposta (só nos prints; marcada como tal) para mostrar o que não aparece na tela: foco invisível, aviso de leitor de tela
const legenda = (p, txt, cor = '#fff', fundo = 'rgba(20,24,27,.92)') => p.evaluate(([t, c, f]) => { let e = document.getElementById('__leg'); if (!e) { e = document.createElement('div'); e.id = '__leg'; e.style.cssText = 'position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:99999;max-width:92vw;padding:8px 12px;border-radius:8px;font:600 13px/1.35 IBM Plex Sans,system-ui;text-align:center;border:1px solid #888;white-space:pre-line'; document.body.append(e); } e.style.color = c; e.style.background = f; e.textContent = t; }, [txt, cor, fundo]);
const marcaAlvos = p => p.evaluate(() => { const sels = 'a[href],button,input:not([type=hidden]),select,summary,[role=button]'; document.querySelectorAll(sels).forEach(e => { const r = e.getBoundingClientRect(); if (!r.width) return; let ok = true, op = 1; for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const c = getComputedStyle(n); if (c.display === 'none' || c.visibility === 'hidden') ok = false; op *= +c.opacity; } if (!ok || op < .05) return; const small = r.width < 44 || r.height < 44; e.style.outline = (small ? '2px solid #ff3b30' : '2px solid #34c759'); e.style.outlineOffset = '-2px'; }); });
const FOTO_ATRASO = () => { // para fotografar o 1º quadro: o ResizeObserver (que posiciona os cartões) e o menu.js chegam 700 ms depois
  const RO = window.ResizeObserver; window.ResizeObserver = class { constructor(cb) { this.o = new RO((...a) => setTimeout(() => cb(...a), 700)); } observe(x) { this.o.observe(x); } unobserve(x) { this.o.unobserve(x); } disconnect() { this.o.disconnect(); } }; };
const atrasaMenu = (s, proto, ms) => s.ctx.route('**/assets/menu.js', async r => { await new Promise(k => setTimeout(k, ms)); r.fulfill({ body: fs.readFileSync(proto ? 'proto/arvore/alimentador/site/menu.js' : '/tmp/claude-0/-home-user-smartled/2ba15095-ae67-51f0-acd3-e77e4b1d05de/scratchpad/mirror4/assets/menu.js', 'utf8'), contentType: 'text/javascript' }); });
async function abre(vp, proto, extra) {
  process.env.PROTO = proto ? '1' : '';
  const s = await L.abre({ ...VPS[vp], tema: TEMA }); delete require.cache[require.resolve('./injeta.js')]; await require('./injeta.js').aplica(s.ctx, s.page);
  if (extra) await s.ctx.addInitScript(extra);
  return s;
}

const base4 = '/tmp/claude-0/-home-user-smartled/2ba15095-ae67-51f0-acd3-e77e4b1d05de/scratchpad/mirror4/assets/menu.js';
(async () => {  if (process.env.SO) console.log("so", process.env.SO);
  for (const vp of Object.keys(VPS)) {
    for (const proto of [false, true]) {
      const t = proto ? 'depois' : 'antes';
      // 01) página do alimentador (com a lupa): quadro A = a barra de busca já criada em fluxo (extras.js) antes da lupa levá-la ao mapa; quadro B = pronto
      { const s = await abre(vp, proto); const p = s.page;
        await s.ctx.route('**/assets/lupa-painel.js', async r => { await new Promise(k => setTimeout(k, 11000)); r.fulfill({ body: fs.readFileSync(base4.replace('menu.js', 'lupa-painel.js'), 'utf8'), contentType: 'text/javascript' }); });   // segura a lupa para fotografar o quadro de antes dela
        const nav = p.goto(L.BASE + 'alimentadores/LD02022033/', { waitUntil: 'commit' });
        await espera(p, `document.querySelector('.mnu') && document.querySelector('.stage')`, 20000); await p.waitForTimeout(300); await shot(p, `01-${t}-A-${vp}`);
        await nav; await espera(p, `document.documentElement.classList.contains('al-pronto')`, 20000); await p.waitForTimeout(1500); await shot(p, `01-${t}-B-${vp}`); await s.browser.close(); }
      // 02) página inicial: 1º quadro (menu.js e posicionamento dos cartões 700 ms depois) e quadro seguinte
      { const s = await abre(vp, proto, FOTO_ATRASO); const p = s.page;
        await s.ctx.route('**/assets/menu.js', async r => { await new Promise(k => setTimeout(k, 700)); r.fulfill({ body: fs.readFileSync(proto ? 'proto/arvore/alimentador/site/menu.js' : base4, 'utf8'), contentType: 'text/javascript' }); });
        const nav = p.goto(L.BASE, { waitUntil: 'commit' }); await p.waitForTimeout(450); await shot(p, `02-${t}-A-${vp}`);
        await nav; await p.waitForTimeout(1800); await shot(p, `02-${t}-B-${vp}`); await s.browser.close(); }
      // 03) Tab com a regional aberta
      { const s = await abre(vp, proto); const p = s.page;
        await p.goto(L.BASE, { waitUntil: 'load' }); await espera(p, `document.querySelectorAll('.mun').length>100`); await p.waitForTimeout(400);
        await p.evaluate(() => window.ARGOS_MAPA.vai({ reg: 'Centro' })); await espera(p, FIM); await p.waitForTimeout(900);
        const aviso = await p.evaluate(() => (document.getElementById('mt-aviso') || {}).textContent || '');
        await p.evaluate(() => { document.activeElement && document.activeElement.blur(); const e = document.createElement('i'); e.tabIndex = 0; document.body.prepend(e); e.focus(); e.remove(); });
        let alvo = '';
        for (let i = 0; i < 30; i++) { await p.keyboard.press('Tab'); const a = await p.evaluate(() => { const a = document.activeElement; return { n: (a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 40), reg: !!a.closest('.mt-regcards'), volta: a.classList.contains('mt-volta') }; });
          if (!proto && a.reg) { alvo = a.n; break; } if (proto && a.volta) { alvo = a.n; break; } }
        await legenda(p, proto ? `Foco (Tab): "${alvo}"\nOs 3 cartões Norte/Centro/Sul saíram do Tab.\nAviso do leitor de tela: "${aviso}"` : `Foco (Tab): "${alvo}" ← cartão INVISÍVEL (opacity:0), sem contorno\nAviso do leitor de tela ao abrir a regional: nenhum`, '#fff', proto ? 'rgba(22,101,52,.95)' : 'rgba(153,27,27,.95)');
        await shot(p, `03-${t}-A-${vp}`); await s.browser.close(); }
      // 04) alvos de toque na página do alimentador (com a lupa): vermelho < 44 px, verde >= 44 px
      { const s = await abre(vp, proto); const p = s.page;
        await p.goto(L.BASE + 'alimentadores/LD02022033/', { waitUntil: 'load' }); await espera(p, `document.documentElement.classList.contains('al-pronto')`, 20000); await p.waitForTimeout(1500); await marcaAlvos(p);
        await shot(p, `04-${t}-A-${vp}`);
        if (vp === '390') { await p.evaluate(() => window.scrollTo(0, document.querySelector('.panel').getBoundingClientRect().top + scrollY - 340)); await p.waitForTimeout(300); await shot(p, `04-${t}-B-${vp}`); }
        await s.browser.close(); }
    }
  }
  console.log('frames prontos em', SAI);
})();
