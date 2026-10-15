// Pares finais antes/depois (JPEG q80) em prints-finais/: NN-assunto-antes-1440.jpg / -depois-1440.jpg, idem -390.
// "antes" = base atual (orig/), "depois" = proto/ (final.diff). Também a sequência curta Ctrl+roda -> zoom semântico (seq-ctrl-roda-1440.jpg).
// Uso: ARGOS_CACHE=<dir> node prints-finais.js && python3 folha-final.py
const fs = require('fs'), path = require('path');
const { lanca, abre, DIR } = require('./lib.js');
const OUT = path.join(DIR, 'prints-finais'); fs.mkdirSync(OUT, { recursive: true });
const esp = (p, ms) => p.waitForTimeout(ms);
const shot = (p, n) => p.screenshot({ path: path.join(OUT, n + '.jpg'), type: 'jpeg', quality: 80 });
const assenta = async p => { try { await p.waitForFunction(() => { const c = document.querySelector('.mt-mapa').classList; return !c.contains('mexe') && !c.contains('voando'); }, null, { timeout: 8000 }); } catch (e) {} await p.waitForTimeout(900); };
async function ctrlRoda(page, n, dy, x, y) {
  await page.mouse.move(x, y); await page.keyboard.down('Control');
  for (let i = 0; i < n; i++) { await page.mouse.wheel(0, dy); await esp(page, 50); }
  await page.keyboard.up('Control'); await page.mouse.move(1420, 520); await esp(page, 500); await assenta(page);
}
const toqueFn = cdp => (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ x: p[0], y: p[1], id: i + 1 })) });
async function pinca(cdp, cx, cy, d0, d1, n = 12) {
  const t = toqueFn(cdp), pts = d => [[cx - d / 2, cy], [cx + d / 2, cy]];
  await t('touchStart', pts(d0));
  for (let i = 1; i <= n; i++) { await t('touchMove', pts(d0 + (d1 - d0) * i / n)); await new Promise(r => setTimeout(r, 20)); }
  await t('touchEnd', []);
}
const rectSvg = page => page.evaluate(() => { const q = document.querySelector('.mt-mapa svg').getBoundingClientRect(); return [q.left, q.top, q.width, q.height]; });
const info = page => page.evaluate(() => `${(document.querySelector('.mt-zn') || {}).textContent} · ${document.querySelectorAll('.mt-nomes2 .mt-mn').length} cartões · visualViewport.scale ${visualViewport.scale}`);
const reg = async (page, tap) => { await page[tap ? 'tap' : 'click']('.mt-regcards button[data-reg="Centro"]'); await esp(page, 1800); await assenta(page); };
const polo = async (page, tap) => { await page[tap ? 'tap' : 'click']('.mt-barra .mt-pchip >> text=Palmas'); await esp(page, 1800); await assenta(page); };

(async () => {
  const b = await lanca(); let ctx, page, cdp, r, dados = {};
  // ===== 1440x900 =====
  for (const proto of [false, true]) {
    const lado = proto ? 'depois' : 'antes';
    for (const claro of [false, true]) {
      ({ ctx, page } = await abre(b, 'desk', proto, { claro }));
      if (!claro) {
        await ctrlRoda(page, 5, -120, 720, 560);                         // 01 estado: Ctrl + roda x5
        await shot(page, `01-estado-ctrl-roda-${lado}-1440`); dados[`01 desk ${lado}`] = await info(page);
        if (proto) {                                                       // sequência curta: 1x, roda x1, x2, x3, x5, arrastar
          await page.keyboard.press('Escape'); await esp(page, 1500); await assenta(page);
          const seq = [];
          const q = async (nome) => { await shot(page, 'seq-' + nome); seq.push([nome, await page.evaluate(() => (document.querySelector('.mt-zn') || {}).textContent || '1×')]); };
          await q('0'); await ctrlRoda(page, 1, -120, 720, 560); await q('1'); await ctrlRoda(page, 1, -120, 720, 560); await q('2');
          await ctrlRoda(page, 2, -120, 720, 540); await q('3'); await ctrlRoda(page, 2, -120, 720, 540); await q('4');
          await page.mouse.move(720, 560); await page.mouse.down(); await page.mouse.move(520, 440, { steps: 10 }); await page.mouse.up(); await esp(page, 500); await assenta(page); await q('5');
          dados.seq = seq;
        }
        await ctx.close(); ({ ctx, page } = await abre(b, 'desk', proto, {}));
        await reg(page);                                                  // 02 regional
        await ctrlRoda(page, 3, -120, 720, 560);
        await shot(page, `02-regional-zoom-${lado}-1440`); dados[`02 desk ${lado}`] = await info(page);
        if (proto) { await page.keyboard.press('Escape'); await esp(page, 1500); await assenta(page); }   // 1º Esc só enquadra (a base sobe um nível)
        await polo(page);                                                 // 03 polo
        await ctrlRoda(page, 2, -120, 720, 520);
        await shot(page, `03-polo-zoom-${lado}-1440`); dados[`03 desk ${lado}`] = await info(page);
      } else {
        await ctrlRoda(page, 3, -120, 720, 560);                          // 04 claro, estado
        await shot(page, `04-claro-estado-zoom-${lado}-1440`); dados[`04 desk ${lado}`] = await info(page);
      }
      await ctx.close();
    }
  }
  // ===== 390x844 (toques CDP) =====
  for (const proto of [false, true]) {
    const lado = proto ? 'depois' : 'antes';
    ({ ctx, page } = await abre(b, 'mob', proto, {})); cdp = await ctx.newCDPSession(page); r = await rectSvg(page);
    await pinca(cdp, 195, r[1] + r[3] * .45, 60, 200); await esp(page, 700); await assenta(page);
    await shot(page, `01-estado-ctrl-roda-${lado}-390`); dados[`01 mob ${lado}`] = await info(page);
    await ctx.close();
    ({ ctx, page } = await abre(b, 'mob', proto, {})); cdp = await ctx.newCDPSession(page);
    await reg(page, true); r = await rectSvg(page);
    await pinca(cdp, 195, r[1] + r[3] * .5, 60, 150); await esp(page, 700); await assenta(page);
    await shot(page, `02-regional-zoom-${lado}-390`); dados[`02 mob ${lado}`] = await info(page);
    await page.evaluate(() => { const z = document.querySelector('.mt-zoom [data-z=fit]'); if (z) z.click(); }); await esp(page, 1500); await assenta(page);
    await polo(page, true); r = await rectSvg(page);
    await pinca(cdp, 195, r[1] + r[3] * .5, 60, 140); await esp(page, 700); await assenta(page);
    await shot(page, `03-polo-zoom-${lado}-390`); dados[`03 mob ${lado}`] = await info(page);
    await ctx.close();
    ({ ctx, page } = await abre(b, 'mob', proto, { claro: true })); cdp = await ctx.newCDPSession(page); r = await rectSvg(page);
    await pinca(cdp, 195, r[1] + r[3] * .45, 60, 160); await esp(page, 700); await assenta(page);
    await shot(page, `04-claro-estado-zoom-${lado}-390`); dados[`04 mob ${lado}`] = await info(page);
    await ctx.close();
  }
  await b.close();
  fs.writeFileSync(path.join(DIR, 'prints-finais.json'), JSON.stringify(dados, null, 1));
  console.log(JSON.stringify(dados, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
