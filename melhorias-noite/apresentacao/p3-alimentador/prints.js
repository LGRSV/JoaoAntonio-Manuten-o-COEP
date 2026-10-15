// Prints do material P3 (página do alimentador). Reproduzir:
//   NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node prints.js
// (o Chromium não confia na CA do proxy; common.js manda as requisições pelo Node)
const { abre, BASE } = require('./common');
const fs = require('fs');
const OUT = process.env.OUT || __dirname;
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
  '01-visao-geral': async (p, vp) => { await carrega(p, 'LD01072001'); await foto(p, '01-visao-geral', vp); },
  // 02 T1: DJ → 1º religador (chave de início = DJ, de fim = 1º religador)
  '02-t1': async (p, vp) => {
    await semFaixa(p); await carrega(p, 'LD01072001', '?t=T1'); await esp(p, 2500); await rola(p, vp); await foto(p, '02-t1', vp);
  },
  // 03 T2-A: religador → religador
  '03-t2a': async (p, vp) => {
    await semFaixa(p); await carrega(p, 'LD01072001', '?t=T2-A'); await esp(p, 2500); await rola(p, vp); await foto(p, '03-t2a', vp);
  },
  // 04 T3 depois de fusível (T3-BC)
  '04-t3': async (p, vp) => {
    await semFaixa(p); await carrega(p, 'LD01072001', '?t=T3-BC'); await esp(p, 2500); await rola(p, vp); await foto(p, '04-t3', vp);
  },
  // 05 lista de trechos (Faixa desligada) com chave de início → fim e NAE por trecho, ordenada por maior NAE
  '05-lista-nae': async (p, vp) => {
    await semFaixa(p); await carrega(p, 'LD01072001');
    await rola(p, vp, 300);
    await foto(p, '05-lista-nae', vp);
  },
  // 06 NAE por mês: botão Meses aberto
  '06-nae-meses': async (p, vp) => {
    await semFaixa(p); await carrega(p, 'LD01072001');
    await p.click('#mes'); await esp(p, 500);
    await foto(p, '06-nae-meses', vp);
  },
  // 07 NAE de janeiro/2026 só: números nos rótulos do mapa e lista reordenada
  '07-nae-janeiro': async (p, vp) => {
    await semFaixa(p); await carrega(p, 'LD01072001');
    await p.click('#mes'); await p.locator('#mes-lista input[value="2026-01"]').check(); await p.keyboard.press('Escape'); await esp(p, 1200);
    await rola(p, vp, 300); await foto(p, '07-nae-janeiro', vp);
  },
  // 08 Faixa: OS criadas (tracejado) — LD01072001
  '08-faixa-criadas': async (p, vp) => {
    await carrega(p, 'LD01072001'); await pg(p, 'Criadas');
    await p.evaluate(() => document.querySelector('.limp-card button.liga[data-a="cri"]')?.getAttribute('aria-pressed') === 'true' || document.querySelector('.limp-card button.liga[data-a="cri"]')?.click());
    await esp(p, 800); await rola(p, vp); await foto(p, '08-faixa-criadas', vp);
  },
  // 09 Faixa: criadas e pendentes (a reprogramar) — LD02010004 (o único dos dois exemplos sem pendentes é o LD01072001)
  '09-faixa-pendentes': async (p, vp) => {
    await carrega(p, 'LD02010004'); await pg(p, 'Pendentes');
    await p.evaluate(() => { const b = document.querySelector('.limp-card button.liga[data-a="pend"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
    await esp(p, 1200); await rola(p, vp); await foto(p, '09-faixa-pendentes', vp);
  },
  // 10 Faixa por vencimento (T1 a cada 3 anos, T2 a cada 4, T3 a cada 5)
  '10-faixa-vencimento': async (p, vp) => {
    await carrega(p, 'LD01072001'); await p.click('.limp-card button[data-acao="sit"]'); await esp(p, 1200);
    await rola(p, vp); await foto(p, '10-faixa-vencimento', vp);
  },
  // 11 Inspeção + Manutenção: Menu do mapa com as camadas
  '11-inspecao-manutencao': async (p, vp) => {
    await semFaixa(p); await carrega(p, 'LD01072001');
    await menu(p, 'Inspeção', true); await menu(p, 'Manutenção', true); await fechaMenu(p); await esp(p, 1500);
    await rola(p, vp); await foto(p, '11-inspecao-manutencao', vp);
  },
  '11b-menu-camadas': async (p, vp) => {
    await carrega(p, 'LD01072001'); await menu(p, 'Inspeção', true); await menu(p, 'Manutenção', true); await esp(p, 1200);
    await foto(p, '11b-menu-camadas', vp);
  },
  // 12 Tela cheia no satélite, perto (zoom 17)
  '12-tela-cheia': async (p, vp) => {
    await carrega(p, 'LD01072001', '?t=T2-A');
    await p.click('.tc-btn'); await esp(p, 1500);
    await p.evaluate(() => { const t = D.trechos.find(x => x.nome === 'T2-A'); window.__map.setView([t.inicio_lat, t.inicio_lon], 17, { animate: false }); });
    await esp(p, 4000); await foto(p, '12-tela-cheia', vp);
  },
  // 13 Dados › Downloads (KMZ, croqui, Excel por camada)
  '13-downloads': async (p, vp) => {
    await carrega(p, 'LD01072001', '?t=T2-A');
    await p.click('summary:has-text("Dados")'); await esp(p, 600);
    await p.evaluate(() => document.querySelector('.dl-b[data-b="rede"]').scrollIntoView({ block: 'end' })); await esp(p, 600);
    await foto(p, '13-downloads', vp);
  },
  // 14 Croqui da faixa (Excel): a janela já preenchida
  '14-croqui': async (p, vp) => {
    await carrega(p, 'LD01072001', '?t=T2-A');
    await p.click('summary:has-text("Dados")'); await esp(p, 500);
    await p.locator('.dl-btn', { hasText: 'Croqui da faixa' }).click();
    await p.waitForSelector('dialog.croqui[open]', { timeout: 30000 }); await esp(p, 5000);
    await foto(p, '14-croqui', vp);
  },
  // 15 AL03037009: só T1 (sem religador) e T3
  '15-al03037009': async (p, vp) => {
    await semFaixa(p); await carrega(p, 'AL03037009', '?t=T1'); await esp(p, 2000); await rola(p, vp); await foto(p, '15-al03037009', vp);
  },
};
(async () => {
  const quais = process.argv.slice(2);
  for (const [nome, fn] of Object.entries(CENAS)) {
    if (quais.length && !quais.some(q => nome.startsWith(q))) continue;
    for (const vp of ['d', 'm']) {
      const { b, page } = await abre(VPS[vp], 'escuro');
      try { await fn(page, vp); console.log('ok', nome, vp); } catch (e) { console.log('FALHOU', nome, vp, e.message.split('\n')[0]); }
      await b.close();
    }
  }
})();
