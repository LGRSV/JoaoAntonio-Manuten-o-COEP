// Alvos de toque < 44 px dentro da lupa do painel (lupa-painel.js) aberta, 390x844. uso: [PROTO=1] node alvos-lupa.js <rotulo>
const L = require('./lib.js'), inj = require('./injeta.js'), fs = require('fs');
const rot = process.argv[2] || 'antes';
(async () => {
  const s = await L.abre({ w: 390, h: 844, mobile: true }); await inj.aplica(s.ctx, s.page); const p = s.page;
  await p.goto(L.BASE + 'alimentadores/LD02022033/', { waitUntil: 'load' }); await p.waitForFunction(`document.documentElement.classList.contains('al-pronto')`, null, { timeout: 40000 }); await p.waitForTimeout(1200);
  const pega = () => p.evaluate(() => { const o = []; document.querySelectorAll('.barra-busca a[href],.barra-busca button,.barra-busca input,.barra-busca select,.barra-busca summary,.barra-busca [role=option],.barra-busca [role=button]').forEach(e => { const r = e.getBoundingClientRect(); if (!r.width || !r.height) return; let ok = true; for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const c = getComputedStyle(n); if (c.display === 'none' || c.visibility === 'hidden') ok = false; } if (!ok) return; if (r.width < 44 || r.height < 44) o.push((e.className || e.tagName).toString().split(' ')[0] + '[' + Math.round(r.width) + 'x' + Math.round(r.height) + '] ' + (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 24)); }); o.total = document.querySelectorAll('.barra-busca button,.barra-busca input').length; return o; });
  const R = {};
  R.fechada = await pega();
  await p.click('.lp-lupa'); await p.waitForTimeout(600); R.aberta = await pega();
  await p.click('#busca'); await p.waitForTimeout(500); R.campo = await pega();
  await p.click('#lp-fbt'); await p.waitForTimeout(500); R.filtros = await pega();
  await p.keyboard.press('Escape'); await p.fill('#busca', 'T3-A'); await p.waitForTimeout(700); R.digitando = await pega();
  for (const [k, v] of Object.entries(R)) console.log(rot, k.padEnd(10), v.length + '/' + v.total, v.join(' | '));
  fs.writeFileSync(`medicoes/alvos-lupa-${rot}.json`, JSON.stringify(R, null, 1));
  await s.browser.close();
})();
