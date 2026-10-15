// Gera os prints (JPEG q80, 1440x900 e 390x844, tema escuro) antes/depois. node prints.js   (espelho em :18766 de pé)
const L = require('./lib.js'), fs = require('fs'), inj = require('./injeta.js');
const SAI = 'prints/'; fs.mkdirSync(SAI, { recursive: true });
const VPS = { '1440': { w: 1440, h: 900 }, '390': { w: 390, h: 844, mobile: true } };
const espera = async (page, cond, ms = 8000) => { try { await page.waitForFunction(cond, null, { timeout: ms, polling: 30 }); } catch (e) {} };
const FIM = `!document.querySelector('.mt-mapa').classList.contains('voando')`;
const shot = (p, nome) => p.screenshot({ path: SAI + nome + '.jpg', type: 'jpeg', quality: 80 });
// legenda sobreposta (só nos prints; marcada como tal) para mostrar o que não aparece na tela: foco invisível, aviso de leitor de tela
const legenda = (p, txt, cor = '#fff', fundo = 'rgba(20,24,27,.92)') => p.evaluate(([t, c, f]) => { let e = document.getElementById('__leg'); if (!e) { e = document.createElement('div'); e.id = '__leg'; e.style.cssText = 'position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:99999;max-width:92vw;padding:8px 12px;border-radius:8px;font:600 13px/1.35 IBM Plex Sans,system-ui;text-align:center;border:1px solid #888;white-space:pre-line'; document.body.append(e); } e.style.color = c; e.style.background = f; e.textContent = t; }, [txt, cor, fundo]);
const marcaAlvos = p => p.evaluate(() => { const sels = 'a[href],button,input:not([type=hidden]),select,summary,[role=button]'; document.querySelectorAll(sels).forEach(e => { const r = e.getBoundingClientRect(); if (!r.width) return; let ok = true, op = 1; for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const c = getComputedStyle(n); if (c.display === 'none' || c.visibility === 'hidden') ok = false; op *= +c.opacity; } if (!ok || op < .05) return; const small = r.width < 44 || r.height < 44; e.style.outline = (small ? '2px solid #ff3b30' : '2px solid #34c759'); e.style.outlineOffset = '-2px'; }); });
const FOTO_ATRASO = () => { // para fotografar o 1º quadro: o ResizeObserver (que posiciona os cartões) e o menu.js chegam 700 ms depois
  const RO = window.ResizeObserver; window.ResizeObserver = class { constructor(cb) { this.o = new RO((...a) => setTimeout(() => cb(...a), 700)); } observe(x) { this.o.observe(x); } unobserve(x) { this.o.unobserve(x); } disconnect() { this.o.disconnect(); } }; };
async function abre(vp, proto, extra) {
  process.env.PROTO = proto ? '1' : '';
  const s = await L.abre(VPS[vp]); delete require.cache[require.resolve('./injeta.js')]; await require('./injeta.js').aplica(s.ctx, s.page);
  if (extra) await s.ctx.addInitScript(extra);
  return s;
}
(async () => {
  for (const vp of Object.keys(VPS)) {
    for (const proto of [false, true]) {
      const t = proto ? 'depois' : 'antes';
      // 1) CLS da página inicial: 1º quadro (menu.js e posicionamento dos cartões atrasados 700 ms) e quadro seguinte
      { const s = await abre(vp, proto, FOTO_ATRASO); const p = s.page;
        await s.ctx.route('**/assets/menu.js', async r => { await new Promise(k => setTimeout(k, 700)); const f = proto ? 'proto/menu.js' : null; r.fulfill({ body: fs.readFileSync(f || '/tmp/claude-0/-home-user-smartled/2ba15095-ae67-51f0-acd3-e77e4b1d05de/scratchpad/mirror2/assets/menu.js', 'utf8'), contentType: 'text/javascript' }); });
        const nav = p.goto(L.BASE, { waitUntil: 'commit' }); await p.waitForTimeout(450); await shot(p, `01-${t}-cls-inicio-quadro1-${vp}`);
        await nav; await p.waitForTimeout(1500); await shot(p, `01-${t}-cls-inicio-quadro2-${vp}`); await s.browser.close(); }
      // 2) CLS da página do alimentador (menu.js chega no fim): 1º quadro e quadro final
      { const s = await abre(vp, proto); const p = s.page;
        const nav = p.goto(L.BASE + 'alimentadores/LD02022033/', { waitUntil: 'commit' }); await p.waitForTimeout(300); await shot(p, `02-${t}-cls-alimentador-quadro1-${vp}`);
        await nav; await p.waitForTimeout(3500); await shot(p, `02-${t}-cls-alimentador-quadro2-${vp}`); await s.browser.close(); }
      // 3) CLS do ranking por polos
      { const s = await abre(vp, proto); const p = s.page;
        const nav = p.goto(L.BASE + 'polos/', { waitUntil: 'commit' }); await p.waitForTimeout(250); await shot(p, `03-${t}-cls-polos-quadro1-${vp}`);
        await nav; await p.waitForTimeout(1500); await shot(p, `03-${t}-cls-polos-quadro2-${vp}`); await s.browser.close(); }
      // 4) Tab com a regional aberta: foco no cartão invisível (antes) x no ← (depois); aviso do leitor de tela
      { const s = await abre(vp, proto); const p = s.page;
        await p.goto(L.BASE, { waitUntil: 'load' }); await espera(p, `document.querySelectorAll('.mun').length>100`); await p.waitForTimeout(400);
        await p.evaluate(() => window.ARGOS_MAPA.vai({ reg: 'Centro' })); await espera(p, FIM); await p.waitForTimeout(900);
        await p.evaluate(() => { document.activeElement && document.activeElement.blur(); const e = document.createElement('i'); e.tabIndex = 0; document.body.prepend(e); e.focus(); e.remove(); });
        let alvo = '';
        for (let i = 0; i < 30; i++) { await p.keyboard.press('Tab'); const a = await p.evaluate(() => { const a = document.activeElement; return { n: (a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 40), reg: !!a.closest('.mt-regcards'), volta: a.classList.contains('mt-volta') }; });
          if (!proto && a.reg) { alvo = a.n; break; } if (proto && a.volta) { alvo = a.n; break; } }
        const aviso = await p.evaluate(() => (document.getElementById('mt-aviso') || {}).textContent || '');
        await legenda(p, proto ? `Foco (Tab): "${alvo}"\nOs 3 cartões Norte/Centro/Sul saíram do Tab.\nAviso do leitor de tela: "${aviso}"` : `Foco (Tab): "${alvo}" ← cartão INVISÍVEL (opacity:0), sem contorno\nAviso do leitor de tela ao abrir a regional: (nenhum)`, '#fff', proto ? 'rgba(22,101,52,.95)' : 'rgba(153,27,27,.95)');
        await shot(p, `04-${t}-tab-regional-${vp}`); await s.browser.close(); }
      // 5) Tab saindo da busca: a caixa de resultados vira parada do Tab (antes)
      if (vp === '1440') { const s = await abre(vp, proto); const p = s.page;
        await p.goto(L.BASE, { waitUntil: 'load' }); await espera(p, `document.querySelectorAll('.mun').length>100`);
        await p.evaluate(() => window.ARGOS_MAPA.vai({ polo: 'Porto Nacional' })); await espera(p, FIM); await p.waitForTimeout(900);
        await p.focus('#ativo-q'); await p.waitForTimeout(400); await p.keyboard.press('Tab'); await p.waitForTimeout(300);
        const on = await p.evaluate(() => { const a = document.activeElement; return a.id || (a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 30); });
        await legenda(p, proto ? `Depois de Tab na busca o foco vai para: "${on}" (próxima parada real)` : `Depois de Tab na busca o foco cai em: #${on} (a caixa de resultados, uma área rolável)`, '#fff', proto ? 'rgba(22,101,52,.95)' : 'rgba(153,27,27,.95)');
        await shot(p, `05-${t}-tab-busca-${vp}`); await s.browser.close(); }
      // 6) alvos de toque (só no celular): vermelho < 44 px, verde >= 44 px
      if (vp === '390') for (const [nivel, ir] of [['regional', () => window.ARGOS_MAPA.vai({ reg: 'Centro' })], ['polo', () => window.ARGOS_MAPA.vai({ polo: 'Porto Nacional' })]]) {
        const s = await abre(vp, proto); const p = s.page;
        await p.goto(L.BASE, { waitUntil: 'load' }); await espera(p, `document.querySelectorAll('.mun').length>100`);
        await p.evaluate(ir); await espera(p, FIM); await p.waitForTimeout(1100); await marcaAlvos(p); await shot(p, `06-${t}-alvos-${nivel}-${vp}`); await s.browser.close(); }
      if (vp === '390') { for (const [nome, url] of [['alimentador', 'alimentadores/LD02022033/'], ['polos', 'polos/']]) { const s = await abre(vp, proto); const p = s.page;
        await p.goto(L.BASE + url, { waitUntil: 'load' }); await p.waitForTimeout(4000); await marcaAlvos(p); await shot(p, `06-${t}-alvos-${nome}-${vp}`);
        if (nome === 'alimentador') { await p.evaluate(() => window.scrollTo(0, document.querySelector('.panel').getBoundingClientRect().top + scrollY - 340)); await p.waitForTimeout(300); await shot(p, `06-${t}-alvos-alimentador-painel-${vp}`); }
        await s.browser.close(); } }
    }
  }
  console.log('prints prontos em', SAI);
})();
