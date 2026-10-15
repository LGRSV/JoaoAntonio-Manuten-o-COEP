// Prints do material P3 (página do alimentador). Reproduzir:
//   NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node prints.js
// (o Chromium não confia na CA do proxy; common.js manda as requisições pelo Node)
const { chromium, abre: abre0, SITE } = require('./common');
const BASE = SITE + 'alimentadores/';
async function abre(vp) { const b = await chromium.launch(); const { ctx, page } = await abre0(b, vp === VPS.d ? 'd' : 'm'); return { b, ctx, page }; }
const fs = require('fs');
const OUT = __dirname + '/prints';
const VPS = { d: { width: 1440, height: 900 }, m: { width: 390, height: 844 } };
const esp = (p, ms) => p.waitForTimeout(ms);

async function carrega(p, al, query) {
  await p.goto(BASE + al + '/' + (query || ''), { waitUntil: 'load' });
  await p.waitForFunction(() => window.__map && window.D && document.documentElement.classList.contains('al-pronto'), null, { timeout: 60000 });
  await esp(p, 5000);                                    // satélite e camadas
}
const foto = (p, nome, vp) => p.screenshot({ path: `${OUT}/${nome}-${vp}.jpg`, type: 'jpeg', quality: 80 });
async function menu(p, camada, liga) {                   // liga/desliga uma camada do Menu do mapa
  const aberto = await p.getAttribute('.ctl-cam-b', 'aria-expanded');
  if (aberto !== 'true') await p.click('.ctl-cam-b');
  const cb = p.locator('#ctl-camadas button', { hasText: camada });
  const on = (await cb.getAttribute('aria-pressed')) === 'true';
  if (on !== liga) await cb.click();
  await esp(p, 500);
}
const fechaMenu = async p => { if (await p.getAttribute('.ctl-cam-b', 'aria-expanded') === 'true') await p.click('.ctl-cam-b'); await esp(p, 300); };
// desktop: sobe 190 px (mapa e painel inteiros à vista); celular: mapa fixo no alto e o painel logo abaixo
const rola = (p, vp, mais) => p.evaluate(y => window.scrollTo(0, y), vp === 'd' ? 190 : 330 + (mais || 0)).then(() => esp(p, 800));
const semFaixa = p => p.addInitScript(() => { try { localStorage.setItem('limp-ligado', '0'); } catch (e) {} });
const pg = async (p, texto) => { await p.locator('.limp-card button.abre', { hasText: texto }).first().click(); await esp(p, 700); };

const CENAS = {
  // 01 visão geral da página, Faixa ligada (padrão)
  's12-visao-geral': async (p, vp) => { await carrega(p, 'LD01072001'); await foto(p, 's12-visao-geral', vp); },
  // 02 T1: DJ → 1º religador (chave de início = DJ, de fim = 1º religador)
  's13-t1': async (p, vp) => {
    await semFaixa(p); await carrega(p, 'LD01072001', '?t=T1'); await esp(p, 2500); await rola(p, vp); await foto(p, 's13-t1', vp);
  },
  // 03 T2-A: religador → religador
  's13b-t2a': async (p, vp) => {
    await semFaixa(p); await carrega(p, 'LD01072001', '?t=T2-A'); await esp(p, 2500); await rola(p, vp); await foto(p, 's13b-t2a', vp);
  },
  // 04 T3 depois de fusível (T3-BC)
  's13c-t3': async (p, vp) => {
    await semFaixa(p); await carrega(p, 'LD01072001', '?t=T3-BC'); await esp(p, 2500); await rola(p, vp); await foto(p, 's13c-t3', vp);
  },
  // 05 lista de trechos (Faixa desligada) com chave de início → fim e NAE por trecho, ordenada por maior NAE
  's14-lista-nae': async (p, vp) => {
    await semFaixa(p); await carrega(p, 'LD01072001');
    await rola(p, vp, 300);
    await foto(p, 's14-lista-nae', vp);
  },
  // 06 NAE por mês: botão Meses aberto
  's14b-nae-meses': async (p, vp) => {
    await semFaixa(p); await carrega(p, 'LD01072001');
    await p.click('#mes'); await esp(p, 500);
    await foto(p, 's14b-nae-meses', vp);
  },
  // 07 NAE de janeiro/2026 só: números nos rótulos do mapa e lista reordenada
  's14c-nae-janeiro': async (p, vp) => {
    await semFaixa(p); await carrega(p, 'LD01072001');
    await p.click('#mes'); await p.locator('#mes-lista input[value="2026-01"]').check(); await p.keyboard.press('Escape'); await esp(p, 1200);
    await rola(p, vp, 300); await foto(p, 's14c-nae-janeiro', vp);
  },
  // 08 Faixa: OS criadas (tracejado) — LD01072001
  's15-faixa-criadas': async (p, vp) => {
    await carrega(p, 'LD01072001'); await pg(p, 'Criadas');
    await p.evaluate(() => document.querySelector('.limp-card button.liga[data-a="cri"]')?.getAttribute('aria-pressed') === 'true' || document.querySelector('.limp-card button.liga[data-a="cri"]')?.click());
    await esp(p, 800); await rola(p, vp); await foto(p, 's15-faixa-criadas', vp);
  },
  // 09 Faixa: criadas e pendentes (a reprogramar) — LD02010004 (o único dos dois exemplos sem pendentes é o LD01072001)
  's15b-faixa-pendentes': async (p, vp) => {
    await carrega(p, 'LD02010004'); await pg(p, 'Pendentes');
    await p.evaluate(() => { const b = document.querySelector('.limp-card button.liga[data-a="pend"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
    await esp(p, 1200); await rola(p, vp); await foto(p, 's15b-faixa-pendentes', vp);
  },
  // 10 Faixa por vencimento (T1 a cada 3 anos, T2 a cada 4, T3 a cada 5)
  's15c-faixa-vencimento': async (p, vp) => {
    await carrega(p, 'LD01072001'); await p.click('.limp-card button[data-acao="sit"]'); await esp(p, 1200);
    await rola(p, vp); await foto(p, 's15c-faixa-vencimento', vp);
  },
  // 11 Inspeção + Manutenção: Menu do mapa com as camadas
  's16-inspecao-manutencao': async (p, vp) => {
    await semFaixa(p); await carrega(p, 'LD01072001');
    await menu(p, 'Inspeção', true); await menu(p, 'Manutenção', true); await fechaMenu(p); await esp(p, 1500);
    await rola(p, vp); await foto(p, 's16-inspecao-manutencao', vp);
  },
  's16b-menu-camadas': async (p, vp) => {
    await carrega(p, 'LD01072001'); await menu(p, 'Inspeção', true); await menu(p, 'Manutenção', true); await esp(p, 1200);
    await foto(p, 's16b-menu-camadas', vp);
  },
  // 12 Tela cheia no satélite, perto (zoom 17)
  's17-tela-cheia': async (p, vp) => {
    await carrega(p, 'LD01072001', '?t=T2-A');
    await p.click('.tc-btn'); await esp(p, 1500);
    await p.evaluate(() => { const t = D.trechos.find(x => x.nome === 'T2-A'); window.__map.setView([t.inicio_lat, t.inicio_lon], 17, { animate: false }); });
    await esp(p, 4000); await foto(p, 's17-tela-cheia', vp);
  },
  // 13 Dados › Downloads (KMZ, croqui, Excel por camada)
  's17c-downloads': async (p, vp) => {
    await carrega(p, 'LD01072001', '?t=T2-A');
    await p.click('summary:has-text("Dados")'); await esp(p, 600);
    await p.evaluate(() => document.querySelector('.dl-b[data-b="rede"]').scrollIntoView({ block: 'end' })); await esp(p, 600);
    await foto(p, 's17c-downloads', vp);
  },
  // 14 Croqui da faixa (Excel): a janela já preenchida
  's17b-croqui': async (p, vp) => {
    await carrega(p, 'LD01072001', '?t=T2-A');
    await p.click('summary:has-text("Dados")'); await esp(p, 500);
    await p.locator('.dl-btn', { hasText: 'Croqui da faixa' }).click();
    await p.waitForSelector('dialog.croqui[open]', { timeout: 30000 }); await esp(p, 5000);
    await foto(p, 's17b-croqui', vp);
  },
  // 15 AL03037009: só T1 (sem religador) e T3
  's13d-al03037009': async (p, vp) => {
    await semFaixa(p); await carrega(p, 'AL03037009', '?t=T1'); await esp(p, 2000); await rola(p, vp); await foto(p, 's13d-al03037009', vp);
  },
};
(async () => {
  const quais = process.argv.slice(2);
  for (const [nome, fn] of Object.entries(CENAS)) {
    if (quais.length && !quais.some(q => nome.startsWith(q))) continue;
    for (const vp of ['d', 'm']) {
      const { b, page } = await abre(VPS[vp]);
      try { await fn(page, vp); console.log('ok', nome, vp); } catch (e) { console.log('FALHOU', nome, vp, e.message.split('\n')[0]); }
      await b.close();
    }
  }
})();
