// "Nada quebra": percorre as partes que a outra sessão cuida (legenda com orelhinha, busca no olho, tela cheia, bandeirinhas,
// rótulos com fio) e a página do alimentador, antes e depois do protótipo. Grava um JSON de fatos (contagens, posições, textos)
// e um JPEG de cada estado em verif/<rotulo>/; comparar.py compara os dois conjuntos.
// uso: [PROTO=1] node verifica.js <antes|depois> <escuro|claro> <1440|390>
const L = require('./lib.js'), fs = require('fs'), inj = require('./injeta.js');
const [rot, tema, vp] = [process.argv[2] || 'antes', process.argv[3] || 'escuro', process.argv[4] || '1440'];
const cfg = vp === '390' ? { w: 390, h: 844, mobile: true } : { w: 1440, h: 900 };
const dir = `verif/${rot}`; fs.mkdirSync(dir, { recursive: true });
const espera = async (page, cond, ms = 9000) => { try { await page.waitForFunction(cond, null, { timeout: ms, polling: 30 }); } catch (e) { return false; } return true; };
const FIM = `!document.querySelector('.mt-mapa').classList.contains('voando')`;
const F = {};
(async () => {
  const s = await L.abre({ ...cfg, tema }); await inj.aplica(s.ctx, s.page); const p = s.page;
  const shot = async nome => { await p.screenshot({ path: `${dir}/${vp}-${tema}-${nome}.jpg`, type: 'jpeg', quality: 80 }); };
  const fatos = (nome) => p.evaluate(() => {
    const r = e => { if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
    const q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
    return {
      cartoes: qa('.mt-regcards button').map(b => ({ t: b.textContent.replace(/\s+/g, ' ').trim(), r: r(b), vis: getComputedStyle(b).visibility, op: getComputedStyle(b).opacity })),
      fios: qa('.mt-fio').length, pinos: qa('.mt-pino').length, fiosRotulo: qa('.mt-fios line').length, pontosRotulo: qa('.mt-fios circle').length,
      rotulos: qa('.mt-mn').filter(e => e.getBoundingClientRect().width).length, chips: qa('.mt-pchip').length,
      legenda: { aberta: !!q('.mt-regs') && !q('.mt-regs').classList.contains('fechada'), orelha: r(q('.mt-regs-b')), painel: r(q('.mt-regs')), semNae: q('#mapa-to').classList.contains('sem-nae') },
      tc: { btn: r(q('.mt-tc')), cheia: q('#mapa-to').classList.contains('mt-cheia') || !!document.fullscreenElement, trava: document.documentElement.classList.contains('mt-cheia-trava'), mapa: r(q('.mt-mapa')) },
      busca: { campoVisivel: !!(q('#ativo-q') && q('#ativo-q').getBoundingClientRect().width), opcoes: qa('#ativo-res .sug-op').length, lupa: r(q('#lupa')), foco: document.activeElement && (document.activeElement.id || document.activeElement.className) },
      aviso: (q('#mt-aviso') || {}).textContent || null, avisoRole: q('#mt-aviso') ? q('#mt-aviso').getAttribute('role') : null,
      scrollY: Math.round(scrollY), altura: document.documentElement.scrollHeight, nivel: window.ARGOS_MAPA && window.ARGOS_MAPA.nivel(),
    };
  }).then(x => { F[nome] = x; return x; });

  // ---------- página inicial ----------
  await p.goto(L.BASE, { waitUntil: 'load' }); await espera(p, `document.querySelectorAll('.mun').length>100`); await p.waitForTimeout(1200);
  await shot('01-estado'); await fatos('01-estado');
  // legenda: recolhe pela orelhinha e reabre
  const orelha = p.locator('.mt-regs-b'); await orelha.click(); await p.waitForTimeout(500); await shot('02-legenda-recolhida'); await fatos('02-legenda-recolhida');
  await orelha.click(); await p.waitForTimeout(500); await fatos('03-legenda-reaberta');
  // busca no olho
  await p.locator('#lupa').click(); await p.waitForTimeout(500); await p.keyboard.type('palmas', { delay: 30 }); await p.waitForTimeout(700);
  await shot('04-busca-palmas'); await fatos('04-busca-palmas');
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await espera(p, FIM); await p.waitForTimeout(1300);
  await shot('05-busca-escolheu'); await fatos('05-busca-escolheu');
  await p.evaluate(() => window.ARGOS_MAPA.vai({})); await espera(p, FIM); await p.waitForTimeout(1200);
  // regional / polo (bandeirinhas) / polo com rótulos e fios / município / alimentador
  await p.evaluate(() => window.ARGOS_MAPA.vai({ reg: 'Centro' })); await espera(p, FIM); await p.waitForTimeout(1300); await shot('06-regional'); await fatos('06-regional');
  await p.evaluate(() => window.ARGOS_MAPA.vai({ polo: 'Porto Nacional' })); await espera(p, FIM); await p.waitForTimeout(1300); await shot('07-polo'); await fatos('07-polo');
  await p.evaluate(() => window.ARGOS_MAPA.vai({ polo: 'Araguaína' })); await espera(p, FIM); await p.waitForTimeout(1300); await shot('08-polo-araguaina'); await fatos('08-polo-araguaina');
  await p.evaluate(() => window.ARGOS_MAPA.vai({ cod: window.MUN.muns.find(m => m.polo === 'Porto Nacional' && m.busca.includes('porto nacional')).cod })); await espera(p, FIM); await p.waitForTimeout(1300);
  await shot('09-municipio'); await fatos('09-municipio');
  await p.evaluate(() => { const m = window.MUN.muns.find(x => x.cod === window.ARGOS_MAPA.nivel().mun); return window.ARGOS_MAPA.vai({ al: m.als.slice().sort((a, b) => b.m - a.m)[0].cod }); }); await espera(p, FIM); await p.waitForTimeout(1300);
  await shot('10-alimentador-foco'); await fatos('10-alimentador-foco');
  // tela cheia, com o município aberto: entra, mede, Esc sai
  await p.locator('.mt-tc').click(); await p.waitForTimeout(900); await shot('11-tela-cheia'); await fatos('11-tela-cheia');
  await p.keyboard.press('Escape'); await p.waitForTimeout(800); await fatos('12-esc-na-tela-cheia');
  await p.locator('.mt-tc').click(); await p.waitForTimeout(800); await fatos('12b-saiu');
  await p.evaluate(() => window.ARGOS_MAPA.vai({})); await espera(p, FIM); await p.waitForTimeout(1200);
  await p.locator('.mt-tc').click(); await p.waitForTimeout(900); await shot('13-estado-tela-cheia'); await fatos('13-estado-tela-cheia');
  await p.locator('.mt-tc').click(); await p.waitForTimeout(800); await fatos('14-estado-saiu');

  // ---------- página do alimentador ----------
  const alim = async (cod, tag) => {
    await p.goto(L.BASE + `alimentadores/${cod}/`, { waitUntil: 'load' }); await espera(p, `window.__map && document.querySelector('#lista > *')`, 40000); await p.waitForTimeout(2500);
    await shot(`20-${tag}-carga`);
    const base = await p.evaluate(() => ({ linhas: document.querySelectorAll('#lista > *').length, camadas: Object.keys(window.__map._layers).length, zoom: window.__map.getZoom(), titulo: document.title,
      lista0: document.querySelector('#lista > *').textContent.replace(/\s+/g, ' ').slice(0, 80), listaN: document.querySelector('#lista > *:last-child').textContent.replace(/\s+/g, ' ').slice(0, 80),
      papel: [...document.querySelectorAll('#lista [data-t],#lista .row')].slice(0, 3).map(e => e.textContent.replace(/\s+/g, ' ').slice(0, 60)) }));
    F[tag + '-base'] = base;
    // lista (fica display:none até a busca ser usada): digita, rola até o fim (content-visibility) e clica numa linha do meio
    await p.fill('input[placeholder^="Buscar trecho"]', 'T3-A'); await p.waitForTimeout(900);
    const alt = await p.evaluate(async () => { const l = document.getElementById('lista'); const r = []; for (const f of [.3, .6, 1]) { l.scrollTop = l.scrollHeight * f; await new Promise(k => setTimeout(k, 200)); r.push(Math.round(l.scrollTop)); }
      return { scrolls: r, sh: l.scrollHeight, ch: l.clientHeight, visiveis: [...l.children].filter(e => !e.hidden).length, ultima: [...l.children].filter(e => !e.hidden).pop().textContent.replace(/\s+/g, ' ').slice(0, 70) }; });
    F[tag + '-rolagem'] = alt; await p.waitForTimeout(300); await shot(`21-${tag}-lista-fim`);
    await p.evaluate(() => { document.getElementById('lista').scrollTop = 0; });
    const sel = await p.evaluate(async () => { const rows = [...document.querySelectorAll('#lista > .row:not([hidden])')]; const r = rows[Math.min(40, rows.length - 1)]; r.scrollIntoView({ block: 'center' }); await new Promise(k => setTimeout(k, 250));
      const rb = r.getBoundingClientRect(), lb = document.getElementById('lista').getBoundingClientRect(); const dentro = rb.top >= lb.top - 1 && rb.bottom <= lb.bottom + 1;
      r.click(); await new Promise(k => setTimeout(k, 900)); return { classes: r.className, dentroDaLista: dentro, centro: window.__map.getCenter().lat.toFixed(4), z: window.__map.getZoom(), painel: document.querySelector('.panel h2,.panel h3,.panel .tit') ? document.querySelector('.panel h2,.panel h3,.panel .tit').textContent.trim().slice(0, 40) : null }; });
    F[tag + '-clique-linha'] = sel; await shot(`22-${tag}-linha`);
    // camadas: abre o menu do mapa e liga tudo, uma a uma
    await p.locator('.ctl-cam-b').click(); await p.waitForTimeout(500);
    F[tag + '-camadas-itens'] = await p.evaluate(() => [...document.querySelectorAll('#ctl-camadas button')].map(e => e.textContent.trim() + ':' + e.getAttribute('aria-pressed')));
    await shot(`23-${tag}-camadas-menu`);
    const contagens = [];
    for (const c of ['.ctl-insp', '.ctl-mnt', '.ctl-exe', '.ctl-faixa']) { await p.locator('#ctl-camadas ' + c).click(); await p.waitForTimeout(1000); contagens.push(c + '=' + await p.evaluate(() => Object.keys(window.__map._layers).length)); }
    F[tag + '-camadas-contagens'] = contagens;
    for (const c of ['.ctl-insp', '.ctl-mnt', '.ctl-exe', '.ctl-faixa']) { await p.locator('#ctl-camadas ' + c).click(); await p.waitForTimeout(600); }
    await p.waitForTimeout(400); await shot(`24-${tag}-camadas-ligadas`);
    // tela cheia do mapa da página
    await p.keyboard.press('Escape'); await p.locator('.tc-btn').click().catch(() => {}); await p.waitForTimeout(900); await shot(`25-${tag}-tela-cheia`);
    F[tag + '-tela-cheia'] = await p.evaluate(() => ({ cheia: !!document.fullscreenElement || !!document.querySelector('.tc-cheia,.tc-on,[class*=cheia]'), mapa: (() => { const b = document.getElementById('map').getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; })() }));
    await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  };
  await alim('LD02022033', 'ld02'); await alim('AL03037009', 'al03');
  F.erros = s.log.erros.filter(e => !/Failed to load resource|net::ERR/.test(e)); F.falhas = s.log.falhas.length;
  fs.writeFileSync(`${dir}/${vp}-${tema}.json`, JSON.stringify(F, null, 1));
  console.log(rot, tema, vp, 'ok | erros:', F.erros.length, F.erros.slice(0, 3).join(' || '));
  await s.browser.close();
})();
