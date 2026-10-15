// Métricas de espaçamento por polo e tamanho de tela. Uso: node metricas.js antes|depois  -> metricas-<modo>.json + tabela no console
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), fs = require('fs');
const { liga } = require('./rede.js');
const modo = process.argv[2] || 'antes';
const BASE = 'https://lgrsv.github.io/vera-vegeta-o-back/teste/';
const over = {};
if (modo === 'depois') for (const f of ['site.css', 'mapa-municipios.js', 'busca-ativo.js']) {
  const p = path.join(__dirname, 'proto', f); if (fs.existsSync(p)) over['/assets/' + f] = p;
}
const TAMS = { desk: { width: 1440, height: 900 }, notebook: { width: 1280, height: 720 }, tablet: { width: 820, height: 1100 }, cel: { width: 390, height: 844 } };
const POLOS = ['Araguaína', 'Augustinópolis', 'Guaraí', 'Palmas', 'Porto Nacional', 'Paraíso', 'Gurupi', 'Dianópolis'];
const SO = (process.argv[3] || '').split(',').filter(Boolean);
(async () => {
  const b = await chromium.launch(), out = [];
  for (const [tn, vp] of Object.entries(TAMS)) { if (SO.length && !SO.includes(tn)) continue;
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: tn === 'cel', hasTouch: tn === 'cel' });
    await liga(ctx, over);
    const p = await ctx.newPage();
    await p.goto(BASE, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
    for (const polo of POLOS) {
      await p.evaluate(po => window.ARGOS_MAPA.vai({ polo: po }), polo);
      await p.waitForTimeout(2000);
      const r = await p.evaluate(modo => {
        const ms = [...document.querySelectorAll('.mt-nomes2 .mt-mn')];
        const NUM = modo === 'depois' ? 3 : 2, nv = [0, 0, 0, 0]; ms.forEach(t => nv[+t.dataset.nv]++);
        const nome = ms.filter(t => +t.dataset.nv < NUM).length;
        const polo = window.MUN.muns.filter(m => m.polo === window.ARGOS_MAPA.nivel().pol).length;
        const svg = document.querySelector('.mt-mapa svg'), ctm = svg.getScreenCTM();
        // união das caixas dos municípios do polo na tela / área do svg
        const gp = [...document.querySelectorAll('.mun')].filter(p => !p.closest('.fora') && p.getBoundingClientRect().width > 0 && getComputedStyle(p).opacity !== '0');
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        gp.forEach(p => { const q = p.getBoundingClientRect(); x0 = Math.min(x0, q.left); y0 = Math.min(y0, q.top); x1 = Math.max(x1, q.right); y1 = Math.max(y1, q.bottom); });
        const R = svg.getBoundingClientRect();
        // sobreposição entre cartões (deve ser 0) e distância mínima entre cartões
        const rs = ms.map(t => t.getBoundingClientRect()); let ov = 0, gmin = 1e9;
        for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
          const a = rs[i], c = rs[j], dx = Math.max(a.left - c.right, c.left - a.right), dy = Math.max(a.top - c.bottom, c.top - a.bottom);
          if (dx < 0 && dy < 0) ov++; else gmin = Math.min(gmin, Math.max(dx, dy));
        }
        return { n: polo, nv0: nv[0], nv1: nv[1], curto: modo === 'depois' ? nv[2] : 0, soNumero: nv[NUM], semRotulo: polo - ms.length, comNome: nome, k: +ctm.a.toFixed(3),
          ocupaL: +((x1 - x0) / R.width).toFixed(2), ocupaA: +((y1 - y0) / R.height).toFixed(2), sobrep: ov, gapMin: +gmin.toFixed(1) };
      }, modo);
      out.push({ tela: tn, polo, ...r });
      console.log(tn.padEnd(8), polo.padEnd(15), JSON.stringify(r));
      await p.evaluate(() => window.ARGOS_MAPA.vai({})); await p.waitForTimeout(1300);
    }
    await ctx.close();
  }
  fs.writeFileSync(path.join(__dirname, `metricas-${modo}.json`), JSON.stringify(out, null, 1));
  await b.close();
})();
