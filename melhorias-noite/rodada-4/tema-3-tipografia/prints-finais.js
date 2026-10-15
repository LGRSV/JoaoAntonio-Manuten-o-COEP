// Prints FINAIS do tema 3, rodada 4: pares NN-assunto-antes|depois-1440|390.jpg em prints-finais/ (base atual = orig/; depois = proto/).
// Uso: node prints.js antes|depois [filtro-regex] [temas=dark,light]
//   "antes"  = /teste/ ao vivo; "depois" = /teste/ com os arquivos de proto/ injetados (site.css, mapa-municipios.js,
//   busca-ativo.js, ranking-polos.js). Saída: prints/<modo>-<cenario>-<tema>-<desk|cel>.jpg (JPEG q80, 1440x900 e 390x844).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), fs = require('fs');
const { liga, arquivosModo } = require('./rede.js');
const modo = process.argv[2] || 'antes', filtro = new RegExp(process.argv[3] || '.');
const temas = (process.argv[4] || 'dark').split(',');
const BASE = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/';
const over = arquivosModo(modo);
const TAMS = { desk: { width: 1440, height: 900 }, cel: { width: 390, height: 844 } };
// cenários: id, página, e passos {reg,polo,cod,al,foco:true...} (usa window.ARGOS_MAPA.vai, o mesmo caminho dos cliques)
const POLOS = [['araguaina', 'Araguaína'], ['augustinopolis', 'Augustinópolis'], ['guarai', 'Guaraí'], ['palmas', 'Palmas'],
  ['porto', 'Porto Nacional'], ['paraiso', 'Paraíso'], ['gurupi', 'Gurupi'], ['dianopolis', 'Dianópolis']];
const CEN = [
  { id: '01-polo-denso', polo: 'Augustinópolis' },
  { id: '02-municipio-cartao', polo: 'Araguaína', mun: 'Araguaína', lista: true },
  { id: '03-alimentador-foco', polo: 'Araguaína', mun: 'Araguaína', al: 1 },
  { id: '04-ranking', pagina: 'polos/' },
];
async function vai(p, c) {
  if (c.polo || c.mun) {
    await p.evaluate(({ polo, mun, al }) => {
      const M = window.MUN, m = mun ? M.muns.find(x => x.nome === mun && x.polo === polo) : null;
      const alvo = m ? { cod: m.cod } : { polo };
      window.__vai = window.ARGOS_MAPA.vai(alvo);
      return window.__vai;
    }, c);
    await p.waitForTimeout(c.mun ? 2400 : 2000);
  } else if (c.reg) { await p.evaluate(r => window.ARGOS_MAPA.vai({ reg: r }), c.reg); await p.waitForTimeout(1800); }
  if (c.al) {
    const al = await p.evaluate(() => { const m = window.MUN.muns.find(x => x.nome === 'Araguaína'); return m.als.slice().sort((a, b) => b.m - a.m)[0].cod; });
    await p.evaluate(a => window.ARGOS_MAPA.vai({ al: a }), al);
    await p.waitForTimeout(2200);
  }
  if (c.lista) {            // abre a lista da busca (como o foco no campo faria)
    await p.focus('#ativo-q').catch(() => {}); await p.waitForTimeout(600);
  }
}
(async () => {
  const b = await chromium.launch();
  for (const tema of temas) for (const [tn, vp] of Object.entries(TAMS)) for (const c of CEN) {
    const nome = `${modo}-${c.id}-${tema}-${tn}`;
    if (!filtro.test(nome)) continue;
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: tn === 'cel', hasTouch: tn === 'cel' });
    await ctx.addInitScript(t => { try { localStorage.setItem('tema', t === 'light' ? 'claro' : 'escuro'); } catch (e) {} }, tema);
    await liga(ctx, over);
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('pageerror', nome, e.message));
    await p.goto(BASE + (c.pagina || ''), { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(1000);
    try { if (!c.pagina) await vai(p, c); } catch (e) { console.log('ERRO nav', nome, e.message.split('\n')[0]); }
    await p.mouse.move(vp.width - 5, 5);
    await p.screenshot({ path: path.join(__dirname, 'prints-finais', `${c.id}-${modo}-${tn === 'desk' ? '1440' : '390'}${tema === 'light' ? '-claro' : ''}.jpg`), type: 'jpeg', quality: 80 });
    console.log('ok', nome);
    await ctx.close();
  }
  await b.close();
})();
