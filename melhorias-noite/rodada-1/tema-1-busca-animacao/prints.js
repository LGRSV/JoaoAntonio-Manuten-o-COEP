// Gera todos os prints do README (JPEG, 1440x900 e 390x844, tema escuro; claro onde faz diferença).
// Uso: (NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node servidor.js &) ; node prints.js [s1 s2 s3 s4 s5 ...]
// Nomes: prints/<sugestão>-<antes|depois>-<d|m>-<cena>.jpg  (d = 1440x900, m = 390x844)
const L = require('./lib.js');
const { abre, nivel, esperaVoo, foto, mapaNoTopo, anota, folha } = L;
const so = process.argv.slice(2);
const quer = s => !so.length || so.includes(s);
const LADOS = [['antes', ''], ['depois', null]];          // null = com o protótipo (flags da sugestão)

(async () => {
  const b = await L.chromium.launch();
  const cada = async (flags, fn, { claro = false, telas = ['d', 'm'], modos = LADOS } = {}) => {
    for (const t of telas) for (const [modo, f] of modos) {
      const p = await abre(b, t, f === null ? flags : f, {}, claro);
      await fn(p, `${flags.split(' ')[0]}-${modo}-${t}`, t, modo);
      if (p.erros.length) console.log('ERRO', flags, modo, t, p.erros);
      await p.context().close();
    }
  };

  // ---------- S1: painel esquerdo (legenda + alimentadores) ----------
  if (quer('s1')) {
    await cada('s1', async (p, n, t) => {
      if (t === 'd') await foto(p, n + '-primeira-tela');                     // como abre, sem rolar
      await mapaNoTopo(p); await foto(p, n + '-estado');
      await nivel(p, 'regional'); await mapaNoTopo(p); if (t === 'd') await foto(p, n + '-regional');
      await nivel(p, 'polo'); await nivel(p, 'mun');
      await mapaNoTopo(p); await foto(p, n + '-mun');
      if (t === 'm') { const px = await p.$('.mt-puxa'); if (px && await px.isVisible()) { await px.click(); await p.waitForTimeout(500); await foto(p, n + '-mun-aberta'); } else { await foto(p, n + '-mun-aberta'); } }
      if (t === 'd') { await p.click('.mt-al'); await esperaVoo(p); await foto(p, n + '-alimentador'); }
    });
    await cada('s1', async (p, n, t) => { await nivel(p, 'mun'); await mapaNoTopo(p); await foto(p, n + '-claro-mun'); }, { claro: true, telas: ['d'] });
  }

  // ---------- S2: nenhum dado repetido ----------
  if (quer('s2')) {
    await cada('s2', async (p, n, t, modo) => {
      await nivel(p, 'regional'); await mapaNoTopo(p);
      if (t === 'd') { await p.mouse.move(1000, 600); await p.waitForTimeout(300); await foto(p, n + '-regional-dica'); }
      await p.mouse.move(5, 5); await p.waitForTimeout(200);
      if (modo === 'antes') await anota(p, [['.mt-pchip i', 1], ['.mt-selos span', 1]]);
      await foto(p, n + '-regional');
      if (modo === 'antes') await p.evaluate(() => document.querySelectorAll('.__nota').forEach(e => e.remove()));
      await nivel(p, 'polo'); await nivel(p, 'mun'); await mapaNoTopo(p);
      if (modo === 'antes') await anota(p, [['.mt-passo[data-ir="polo"]', 2], ['b.mt-atual', 2], ['.mt-polos-t', 2], ['.mt-amun', 2]]);
      await foto(p, n + '-mun');
      if (modo === 'antes') await p.evaluate(() => document.querySelectorAll('.__nota').forEach(e => e.remove()));
      if (t === 'm') { const px = await p.$('.mt-puxa'); if (px && await px.isVisible()) { await px.click(); await p.waitForTimeout(500); } }
      await p.click('.mt-al'); await esperaVoo(p); await mapaNoTopo(p);
      if (modo === 'antes') await anota(p, [['b.mt-atual', 3], ['.mt-amun', 3], ['.mt-al.foco b', 3]]);
      await foto(p, n + '-alimentador');
    });
  }

  // ---------- S3: tela cheia ----------
  if (quer('s3')) {
    await cada('s3', async (p, n, t, modo) => {
      await foto(p, n + '-primeira-tela');
      await mapaNoTopo(p); await foto(p, n + '-estado');
      if (modo === 'depois') {
        await p.click('.mt-tc'); await p.waitForTimeout(900); await foto(p, n + '-cheia-estado');
        await nivel(p, 'mun'); await foto(p, n + '-cheia-mun');
        await p.click('.mt-tc'); await p.waitForTimeout(700); await foto(p, n + '-saiu-mun');
      } else { await nivel(p, 'mun'); await mapaNoTopo(p); await foto(p, n + '-mun'); }
    }, {});
    await cada('s3', async (p, n, t, modo) => {
      if (modo !== 'depois') return;
      await p.click('.mt-tc'); await p.waitForTimeout(900); await foto(p, n + '-claro-cheia-estado');
    }, { claro: true, telas: ['d'] });
  }

  // ---------- S4: busca renovada ----------
  if (quer('s4')) {
    await cada('s4', async (p, n, t, modo) => {
      await foto(p, n + '-fechada');
      if (modo === 'depois') await p.keyboard.press('/'); else await p.click('#lupa');
      await p.waitForTimeout(500); await foto(p, n + '-aberta');
      const diga = async (txt, nome, espera = 1000, enter = false, notas = null) => {
        await p.fill('#ativo-q', txt); if (enter) await p.keyboard.press('Enter'); await p.waitForTimeout(espera);
        if (modo === 'antes' && notas) await anota(p, notas);
        await foto(p, n + '-' + nome);
        await p.evaluate(() => document.querySelectorAll('.__nota').forEach(e => e.remove()));
      };
      await diga('palm', 'municipios');
      await diga('LD0107', 'alimentadores');
      await diga('790000', 'ativos');
      await diga('7900001071', 'ativo-resultado', 1500, true, [['#ativo-q', 4], ['#ativo-res>p', 4], ['#ativo-res li b + span', 4]]);
      await diga('ETO-RD-GU 000353/2026', 'os-sugestao', 600);
      await diga('ETO-RD-GU 000353/2026', 'os-resultado', 1500, true, [['#ativo-q', 5], ['#ativo-res>p', 5], ['#ativo-res li b', 5]]);
      await diga('zzzz', 'vazio', 800);
    });
    await cada('s4', async (p, n, t, modo) => {
      if (modo === 'depois') await p.keyboard.press('/'); else await p.click('#lupa');
      await p.fill('#ativo-q', 'palm'); await p.waitForTimeout(900); await foto(p, n + '-claro-municipios');
    }, { claro: true, telas: ['d'] });
  }

  // ---------- S5: a busca voa no mapa + transições ----------
  if (quer('s5')) {
    for (const t of ['d', 'm']) {
      // depois: quadros do voo da busca "palmas" até o município (tempo real: cada captura leva ~0,1–0,4 s)
      const p = await abre(b, t, 's1 s2 s4 s5');
      await p.click('#lupa'); await p.fill('#ativo-q', 'palmas'); await p.waitForTimeout(900);
      const t0 = Date.now(), rot = [];
      await p.click('.sug-op');
      for (let i = 0; i < 5; i++) { rot.push(((Date.now() - t0) / 1000).toFixed(1) + ' s'); await foto(p, `s5-depois-${t}-voo${i}`); }
      await esperaVoo(p, 3000); rot.push('fim'); await foto(p, `s5-depois-${t}-voo5`);
      await folha(b, [0, 1, 2, 3, 4, 5].map(i => `s5-depois-${t}-voo${i}`), `s5-depois-${t}-voo-folha`, rot);
      if (t === 'm') { await p.click('.mt-puxa'); await p.waitForTimeout(600); await foto(p, 's5-depois-m-voo-gaveta'); }
      await p.context().close();
      // antes: escolher o município na busca abre outra página (o mapa some e a página recarrega)
      const q = await abre(b, t, '');
      await q.click('#lupa'); await q.fill('#ativo-q', 'palmas'); await q.waitForTimeout(900);
      await Promise.all([q.waitForNavigation(), q.click('.sug-op')]);
      await q.waitForTimeout(1200); await foto(q, `s5-antes-${t}-pagina-municipio`);
      await q.context().close();
      // transição polo → município: quadros antes (650 ms fixos) e depois
      for (const [modo, f] of LADOS) {
        const r = await abre(b, t, f === null ? 's1 s2 s5' : '');
        await nivel(r, 'polo'); await mapaNoTopo(r); await r.waitForTimeout(300);
        const t1 = Date.now(), rr = [];
        await r.click('.mun.tem[aria-label="Palmas"]', { force: true });
        for (let i = 0; i < 4; i++) { rr.push(((Date.now() - t1) / 1000).toFixed(1) + ' s'); await foto(r, `s5-${modo}-${t}-trans${i}`); }
        await esperaVoo(r, 3000); rr.push('fim'); await foto(r, `s5-${modo}-${t}-trans4`);
        await folha(b, [0, 1, 2, 3, 4].map(i => `s5-${modo}-${t}-trans${i}`), `s5-${modo}-${t}-trans-folha`, rr);
        await r.context().close();
      }
    }
  }
  await b.close();
})();
