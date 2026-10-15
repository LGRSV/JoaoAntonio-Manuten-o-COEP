// Gera os prints do material P2 (busca e menu). Uso: node prints.js
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const URL = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/';
const OUT = __dirname;
const VPS = { d: { width: 1440, height: 900 }, m: { width: 390, height: 844 } };
const shot = (page, nome, vp) => page.screenshot({ path: path.join(OUT, `${nome}-${vp}.jpg`), type: 'jpeg', quality: 80 });
const digita = async (page, txt) => {
  const q = page.locator('#ativo-q');
  await q.fill('');
  await q.pressSequentially(txt, { delay: 40 });
  await page.waitForTimeout(900);
};
(async () => {
  const browser = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY || 'http://127.0.0.1:43789' },
    // confia só na CA do proxy do ambiente (pino do SPKI dela); sem isto o Chromium não reconhece o certificado
    args: ['--ignore-certificate-errors-spki-list=' + (process.env.PROXY_CA_SPKI || 'PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0=')] });
  for (const vp of ['d', 'm']) {
    const ctx = await browser.newContext({ viewport: VPS[vp], deviceScaleFactor: 1, hasTouch: vp === 'm', isMobile: vp === 'm',
      acceptDownloads: true });
    await ctx.addInitScript(() => { try { localStorage.setItem('tema', 'escuro'); } catch (e) {} });
    const page = await ctx.newPage();
    const abre = async () => { await page.goto(URL, { waitUntil: 'networkidle' }); await page.waitForTimeout(1500); };
    await abre();
    await shot(page, '01-inicio', vp);
    // 02 lupa aberta, município
    await page.click('#lupa'); await page.waitForTimeout(300);
    await digita(page, 'Palmas');
    await shot(page, '02-busca-municipio', vp);
    // 03 alimentador
    await digita(page, 'AL03037009');
    await shot(page, '03-busca-alimentador', vp);
    // 04 ativo: religador (sugestões e resultado)
    await digita(page, '7900001071');
    await shot(page, '04a-busca-ativo-sugestao', vp);
    await page.press('#ativo-q', 'Enter'); await page.waitForTimeout(1500);
    await shot(page, '04b-busca-ativo-resultado', vp);
    // 05 transformador
    await digita(page, 'ETO310211A');
    await page.press('#ativo-q', 'Enter'); await page.waitForTimeout(1500);
    await shot(page, '05-busca-transformador', vp);
    // 06 OS
    await digita(page, '353/2026');
    await shot(page, '06a-busca-os-sugestao', vp);
    await page.press('#ativo-q', 'Enter'); await page.waitForTimeout(1500);
    await shot(page, '06b-busca-os-resultado', vp);
    // 07 OS com equipe
    await digita(page, 'ETO-RD-PO 000353/2026');
    await page.press('#ativo-q', 'Enter'); await page.waitForTimeout(1500);
    await shot(page, '07-busca-os-equipe', vp);
    // 08 Abrir no mapa
    await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle' }), page.locator('#ativo-res a').first().click()]);
    await page.waitForTimeout(4000);
    console.log(vp, 'abriu', page.url());
    await shot(page, '08-abrir-no-mapa', vp);
    // 09 menu
    await abre();
    await page.click('.mnu-btn'); await page.waitForTimeout(400);
    await shot(page, '09-menu', vp);
    // 10 Night shift (claro) via Shift+K
    await page.keyboard.press('Escape');
    await page.keyboard.press('Shift+K'); await page.waitForTimeout(500);
    await page.click('.mnu-btn'); await page.waitForTimeout(400);
    await shot(page, '10-night-shift-claro', vp);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Shift+K'); await page.waitForTimeout(300);  // volta ao escuro
    // 11 atualizar bases (só abre a tela)
    await page.click('.mnu-btn'); await page.click('.mnu-lista button'); await page.waitForTimeout(1500);
    await shot(page, '11-atualizar-bases', vp);
    await ctx.close();
  }
  await browser.close();
})();
