// Acessibilidade básica: alvos de toque, contraste de texto, foco visível. Uso: node a11y.js [rotulo]
const L = require('./lib.js'), fs = require('fs'), inj = require('./injeta.js');
const rotulo = process.argv[2] || 'antes';
const espera = async (page, cond, ms = 6000) => { try { await page.waitForFunction(cond, null, { timeout: ms, polling: 30 }); } catch (e) {} };
const FIM = `!document.querySelector('.mt-mapa').classList.contains('voando')`;
const ANALISA = `(() => {
  const vis = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth; };
  const nome = e => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/)[0] : '') + ' "' + (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 28) + '"');
  const alvos = [...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,summary,[role=button],[tabindex="0"]')].filter(vis).map(e => { const r = e.getBoundingClientRect(); return { n: nome(e), w: Math.round(r.width), h: Math.round(r.height) }; })
    .filter(a => !/^path\\.mun/.test(a.n));
  // contraste
  const parse = c => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const fundo = e => { let layers = []; for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; } } let base = { r: 0, g: 0, b: 0 }; const ex = parse(getComputedStyle(document.body).backgroundColor); if (ex && ex.a > 0) base = ex; for (let i = layers.length - 1; i >= 0; i--) { const c = layers[i]; base = { r: c.r * c.a + base.r * (1 - c.a), g: c.g * c.a + base.g * (1 - c.a), b: c.b * c.a + base.b * (1 - c.a) }; } return base; };
  const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
  const baixos = [];
  for (const e of document.querySelectorAll('body *')) {
    if (!vis(e) || e.closest('svg') && e.tagName.toLowerCase() !== 'text') continue;
    const tem = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (!tem) continue;
    const cs = getComputedStyle(e), fg = parse(cs.color), bg = fundo(e); if (!fg) continue;
    const op = parseFloat(cs.opacity); const a = fg.a * op; const mix = { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a) };
    const l1 = lum(mix), l2 = lum(bg), cr = (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
    const px = parseFloat(cs.fontSize), grande = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight) >= 700);
    if (cr < (grande ? 3 : 4.5)) baixos.push({ n: nome(e), cr: +cr.toFixed(2), px, cor: cs.color, fundo: 'rgb(' + [bg.r, bg.g, bg.b].map(Math.round) + ')' });
  }
  return { alvos, baixos };
})()`;
(async () => {
  const R = {};
  for (const tema of ['escuro', 'claro']) for (const [vp, cfg] of Object.entries({ desktop: { w: 1440, h: 900 }, celular: { w: 390, h: 844, mobile: true } })) {
    const s = await L.abre({ ...cfg, tema }); await inj.aplica(s.ctx, s.page); const p = s.page;
    await p.goto(L.BASE, { waitUntil: 'load' }); await espera(p, `document.querySelectorAll('.mun').length>100`); await p.waitForTimeout(500);
    const k = `${vp}|${tema}`; R[k] = {};
    R[k]['estado'] = await p.evaluate(ANALISA);
    await p.click('#lupa'); await p.waitForTimeout(300); R[k]['busca aberta'] = await p.evaluate(ANALISA); await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
    await p.click('.mt-regcards button[data-reg="Centro"]'); await espera(p, FIM); await p.waitForTimeout(400); R[k]['regional'] = await p.evaluate(ANALISA);
    await (await p.$('.mt-pchip[data-polo]')).click(); await espera(p, FIM); await p.waitForTimeout(400); R[k]['polo'] = await p.evaluate(ANALISA);
    await p.evaluate(() => [...document.querySelectorAll('.mun')].find(x => x.getAttribute('tabindex') === '0').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await espera(p, FIM); await p.waitForTimeout(800);
    if (cfg.mobile) { const px = await p.$('.mt-puxa'); if (px) { await px.click(); await p.waitForTimeout(300); } }
    R[k]['município'] = await p.evaluate(ANALISA);
    await s.browser.close();
    // página do alimentador
    const s2 = await L.abre({ ...cfg, tema }); await inj.aplica(s2.ctx, s2.page); const q = s2.page;
    await q.goto(L.BASE + 'alimentadores/LD01072001/', { waitUntil: 'load' }); await q.waitForTimeout(2500); R[k]['alimentador'] = await q.evaluate(ANALISA); await s2.browser.close();
  }
  // resumo
  for (const [k, est] of Object.entries(R)) { console.log('==', k); for (const [e, v] of Object.entries(est)) {
    const lim = k.startsWith('celular') ? 44 : 24; const peq = v.alvos.filter(a => a.w < lim || a.h < lim);
    console.log(`  ${e.padEnd(13)} alvos ${v.alvos.length}, menores que ${lim}px: ${peq.length}`, peq.slice(0, 5).map(a => `${a.n} ${a.w}x${a.h}`).join(' ; '));
    console.log(`  ${''.padEnd(13)} contraste baixo: ${v.baixos.length}`, v.baixos.slice(0, 4).map(a => `${a.n} ${a.cr}:1 ${a.px}px`).join(' ; ')); } }
  fs.writeFileSync(`medicoes/a11y-${rotulo}.json`, JSON.stringify(R, null, 1));
})();
