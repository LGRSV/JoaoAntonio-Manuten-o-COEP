// Ajudas comuns dos prints da revisão (rodada 3). O Chromium daqui não confia na CA do proxy:
// as requisições https são feitas pelo curl (com o CA bundle do proxy) e entregues via page.route (ponte.js).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const ponte = require('./ponte');
const SITE = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/';
const OUT = path.join(__dirname, 'prints');
const VPS = { d: { width: 1440, height: 900 }, m: { width: 390, height: 844 } };
async function abre(b, vp, tema) {
  const mobile = vp === 'm';
  const ctx = await b.newContext({ viewport: VPS[vp], deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, acceptDownloads: true });
  await ponte(ctx);
  await ctx.addInitScript(t => { try { localStorage.setItem('tema', t); } catch (e) {} }, tema || 'escuro');
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', e => console.log('PAGEERR', e.message));
  return { ctx, page };
}
const esp = (p, ms) => p.waitForTimeout(ms);
const foto = (p, nome, vp) => p.screenshot({ path: path.join(OUT, `${nome}-${vp}.jpg`), type: 'jpeg', quality: 80 });
module.exports = { chromium, abre, esp, foto, SITE, OUT, VPS };
