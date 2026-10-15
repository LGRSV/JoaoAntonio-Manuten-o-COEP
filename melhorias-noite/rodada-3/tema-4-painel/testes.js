/* Rodada 3 · testes de interação do protótipo consolidado (rebaseado na lupa atual: olho no canto do mapa) (lupa + painel): desktop 1440x900 e celular 390x844.
 *   NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node testes.js [--alim=LD01072001,...]
 * Cada linha: ok/FALHA · alimentador · viewport · o que foi conferido. Grava testes.json.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const { abre, ALIM, ligaCamadas } = require('./prints.js');

const res = [];
const t = (cod, vp, nome, ok, det) => { res.push({ alimentador: cod, vp, teste: nome, ok: !!ok, detalhe: det === undefined ? '' : String(det) }); console.log(ok ? 'ok   ' : 'FALHA', cod, vp, nome, det === undefined ? '' : '· ' + det); };
const vis = (p, s) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return !e.hidden && cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0; }, s);

const abreBarra = async p => { if (!(await vis(p, '#busca'))) { await p.click('.lp-lupa'); await p.waitForTimeout(300); } };

async function roda(browser, cod, vp) {
  const { ctx, p } = await abre(browser, cod, vp, 'consolidado');
  const mob = vp === 'm';
  // 1 · carga
  t(cod, vp, 'sem erro de JavaScript na carga', p.__erros.length === 0, p.__erros.join(' | '));
  const res0 = await p.evaluate(() => ({ t: (document.querySelector('.al-res .r-t b') || {}).textContent, k: (document.querySelector('.al-res .r-k b') || {}).textContent, n: (document.querySelector('.al-res .r-nn') || {}).textContent, D: D.trechos.length, nae: typeof doMes === 'function' ? doMes().length : null }));
  t(cod, vp, 'resumo do cabeçalho bate com os dados', res0.t === res0.D.toLocaleString('pt-BR') && (res0.n == null || +res0.n === res0.nae), JSON.stringify(res0));
  t(cod, vp, 'tabela Classe/Trechos/Extensão, lista e legenda de cores fora do painel', !(await vis(p, '.resumo-classe')) && !(await vis(p, '#lista')) && !(await vis(p, '#ord-lista')));
  // 2 · lupa: classes, nota, camadas
  await p.click('.lp-lupa'); await p.waitForTimeout(300);
  const lupa = await p.evaluate(() => ({ cls: document.querySelectorAll('.lp-drop .lp-cls').length, cam: document.querySelectorAll('.lp-drop .lp-cam').length, nota: (document.querySelector('.lp-nota') || {}).textContent || '' }));
  t(cod, vp, 'lupa abre com as classes e as camadas', lupa.cls >= 1 && lupa.cam === 4, JSON.stringify(lupa));
  const conta = await p.evaluate(() => {
    const pills = [...document.querySelectorAll('.lp-drop .lp-cls .lp-n')].map(e => parseInt(e.textContent, 10) || 0), soma = pills.reduce((a, b) => a + b, 0);
    const total = +(document.querySelector('.al-res .r-nn') || {}).textContent, nota = (document.querySelector('.lp-nota') || {}).textContent || '';
    const m = /Soma das classes ([\d.]+) = NAE do alimentador ([\d.]+)(?: \+ ([\d.]+) de outro)?(?:.* − ([\d.]+) sem trecho)?/.exec(nota);
    return { soma, total, nota: nota.slice(0, 160), m: m ? m.slice(1).map(x => x == null ? 0 : +x.replace('.', '')) : null };
  });
  const confere = conta.soma === conta.total ? !conta.nota : !!conta.m && conta.m[0] === conta.soma && conta.m[1] === conta.total && conta.m[0] === conta.m[1] + conta.m[2] - conta.m[3];
  t(cod, vp, 'nota da NAE: a conta das classes fecha com o total (ou some quando já fecha)', confere, JSON.stringify(conta));
  // 3 · classe → trecho
  const cls = await p.evaluate(() => [...document.querySelectorAll('.lp-abre')].map(b => b.dataset.c));
  const c0 = cls[cls.length - 1];
  await p.click(`.lp-abre[data-c="${c0}"]`); await p.waitForTimeout(300);
  const nTr = await p.evaluate(() => document.querySelectorAll('.lp-drop .lp-tr').length);
  t(cod, vp, `classe ${c0} lista trechos (máx. 150 por vez)`, nTr > 0 && nTr <= 150, nTr);
  const nome = await p.evaluate(() => document.querySelector('.lp-drop .lp-tr').dataset.t);
  await p.click('.lp-drop .lp-tr'); await p.waitForTimeout(2300);
  const sel = await p.evaluate(() => window.__selecao());
  t(cod, vp, 'escolher o trecho na lupa seleciona no mapa e abre a ficha', sel[0] === nome && await vis(p, '#det > h2'), `${nome} → ${sel}`);
  t(cod, vp, 'a lista suspensa fecha ao escolher', !(await vis(p, '.lp-drop')));
  if (mob) { const est = await p.evaluate(() => document.querySelector('.panel').dataset.estado); t(cod, vp, 'celular: a gaveta sobe sozinha até a ficha', est === 'meio', est); }
  // 4 · abas
  const abas = await p.evaluate(() => [...document.querySelectorAll('.det-abas button')].map(b => b.textContent.trim()));
  t(cod, vp, 'ficha do trecho com abas (ou sem, se só há uma seção)', true, abas.join(' | ') || '(sem abas)');
  if (abas.length > 1) {
    await p.click('.det-abas button:nth-child(2)'); await p.waitForTimeout(200);
    const ativas = await p.evaluate(() => [...document.querySelectorAll('#det > [data-aba]')].filter(e => !e.hidden).length);
    t(cod, vp, 'só a aba escolhida fica à vista', ativas === 1, ativas);
  }
  // com trecho: cartões recolhidos + título
  const rec = await p.evaluate(() => ({ abertos: [...document.querySelectorAll('.panel>.limp-card:not([hidden]):not(.acd-fechada)')].length, tit: !document.querySelector('.al-sec').hidden }));
  t(cod, vp, 'com trecho escolhido os cartões do alimentador ficam recolhidos sob o título', rec.abertos === 0 && rec.tit, JSON.stringify(rec));
  await p.click('#todos'); await p.waitForTimeout(700);
  const rec2 = await p.evaluate(() => ({ abertos: [...document.querySelectorAll('.panel>.limp-card:not([hidden]):not(.acd-fechada)')].length, tit: !document.querySelector('.al-sec').hidden }));
  t(cod, vp, 'limpar o trecho reabre o cartão que estava aberto', rec2.abertos === 1 && !rec2.tit, JSON.stringify(rec2));
  // 5 · camadas pela lupa abrem o cartão certo
  await p.click('.lp-lupa'); await p.waitForTimeout(300);
  await p.click('.lp-drop .lp-cam[data-i="1"]'); await p.waitForTimeout(900);
  const insp = await p.evaluate(() => { const k = document.querySelector('.panel>.insp-card'); return k ? { visivel: !k.hidden, aberto: !k.classList.contains('acd-fechada'), faixaAberta: !document.querySelector('.panel>.limp-card:not(.insp-card):not(.mnt-card):not(.exe-card)').classList.contains('acd-fechada') } : null; });
  t(cod, vp, 'ligar Inspeção na lupa abre o cartão dela e fecha o da Faixa', insp && insp.visivel && insp.aberto && !insp.faixaAberta, JSON.stringify(insp));
  await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  t(cod, vp, 'Esc fecha a lista suspensa', !(await vis(p, '.lp-drop')));
  // 6 · busca
  await abreBarra(p); await p.click('#busca'); await p.keyboard.type('N1060', { delay: 30 }); await p.waitForTimeout(1500);
  const b1 = await p.evaluate(() => ({ aberta: !document.querySelector('.lp-sug').hidden, n: document.querySelectorAll('.lp-sug .lp-so').length, vazio: !!document.querySelector('.lp-sug .lp-vazio') }));
  t(cod, vp, 'digitar abre o resultado na lupa (poste N1060)', b1.aberta && (b1.n > 0 || b1.vazio), JSON.stringify(b1));
  await p.fill('#busca', ''); await p.keyboard.type('zzzzqq', { delay: 20 }); await p.waitForTimeout(700);
  t(cod, vp, 'busca sem resultado diz o que digitar', await p.evaluate(() => !!document.querySelector('.lp-sug .lp-vazio')));
  await p.fill('#busca', ''); await p.keyboard.type('T3-A', { delay: 20 }); await p.waitForTimeout(700);
  await p.keyboard.press('Enter'); await p.waitForTimeout(1800);
  const enter = await p.evaluate(() => window.__selecao());
  t(cod, vp, 'Enter no campo escolhe o 1º resultado', enter.length === 1, enter.join(','));
  await p.waitForTimeout(300); await p.evaluate(() => document.activeElement && document.activeElement.blur());
  // 7 · meses: o NAE do cabeçalho acompanha
  const mesTxt = await p.evaluate(() => { const l = document.querySelector('#mes-lista input[value]:not([value=""])'); return l ? l.value : null; });
  if (mesTxt) {
    await abreBarra(p); await p.click('.lp-fbt'); await p.waitForTimeout(250);
    await p.click('#mes'); await p.waitForTimeout(250);
    await p.click(`#mes-lista input[value="${mesTxt}"]`); await p.waitForTimeout(500);
    const nae = await p.evaluate(() => ({ cab: +document.querySelector('.al-res .r-nn').textContent, dados: doMes().length, per: document.querySelector('.al-res .r-np').textContent, badge: (document.querySelector('.lp-fn') || {}).textContent }));
    t(cod, vp, 'escolher um mês muda o NAE do cabeçalho (e o selo do Filtros)', nae.cab === nae.dados && nae.badge === '1', JSON.stringify(nae));
    await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    await p.evaluate(() => { const l = document.querySelector('#mes-lista .mes-tds input'); if (l && !l.checked) { l.click(); } });
    await p.waitForTimeout(400);
  } else t(cod, vp, 'sem filtro de meses neste alimentador', true, '');
  // 8 · chip do NAE abre os Filtros
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.evaluate(() => { document.querySelectorAll('.lp-fdrop,.lp-drop,.lp-sug').forEach(e => { e.hidden = true; }); const l = document.querySelector('.lp-lupa'); if (document.querySelector('.barra-busca:not(.lp-fechada)') && l) l.click(); }); await p.waitForTimeout(300);
  if (await p.$('.al-res .r-nae')) {
    await p.click('.al-res .r-nae'); await p.waitForTimeout(300);
    t(cod, vp, 'o selo do NAE no cabeçalho abre os Filtros', await vis(p, '.lp-fdrop'));
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  }
  // 9 · município enquadra o mapa
  const temMun = await p.$('#f-mun');
  if (temMun) {
    const antes = await p.evaluate(() => window.__map.getZoom() + ':' + window.__map.getCenter().lat.toFixed(4));
    await abreBarra(p); if (!(await vis(p, '#lp-fdrop'))) { await p.click('.lp-fbt'); await p.waitForTimeout(250); }
    const v = await p.evaluate(() => { const o = [...document.querySelectorAll('#f-mun option')].filter(o => o.value); return o[o.length - 1].value; });
    await p.selectOption('#f-mun', v); await p.waitForTimeout(1500);
    const dep = await p.evaluate(() => window.__map.getZoom() + ':' + window.__map.getCenter().lat.toFixed(4));
    t(cod, vp, 'escolher o município enquadra o mapa nele', antes !== dep, `${antes} → ${dep}`);
    await p.selectOption('#f-mun', ''); await p.waitForTimeout(800);
    await p.keyboard.press('Escape');
  } else t(cod, vp, 'alimentador de um município só: sem seletor', true, '');
  t(cod, vp, 'sem erro de JavaScript durante os testes (parte 1)', p.__erros.length === 0, p.__erros.join(' | '));
  await ctx.close();
}

async function roda2(browser, cod, vp) {
  const { ctx, p } = await abre(browser, cod, vp, 'consolidado');
  const mob = vp === 'm';
  // 10 · sem camadas: aviso e botão
  await p.evaluate(async () => { for (const e of document.querySelectorAll('#ctl-camadas .ctl-card > button[aria-pressed="true"]:not(.tc-painel-m)')) { e.click(); await new Promise(r => setTimeout(r, 200)); } });
  await p.waitForTimeout(500);
  t(cod, vp, 'sem camada ligada: aviso no painel e legenda das classes no mapa', await vis(p, '.al-vazio') && await vis(p, '.ctl-lgs > #legenda'));
  if (mob) { await p.click('.sheet-h'); await p.waitForTimeout(700); }
  await p.click('.al-vazio button'); await p.waitForTimeout(400);
  t(cod, vp, 'o botão do aviso abre a lupa', await vis(p, '.lp-drop'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  // 11 · tela cheia: resumo vai para a gaveta e volta
  if (mob && (await p.evaluate(() => document.querySelector('.panel').dataset.estado)) !== 'peek') { await p.click('.sheet-h'); await p.waitForTimeout(500); }
  await p.click('.tc-btn'); await p.waitForTimeout(1200);
  const tc = await p.evaluate(() => ({ nopanel: !!document.querySelector('.panel > .al-res'), btnN: [...document.querySelectorAll('#classes button')].map(b => b.textContent.replace(/\s+/g, ' ').trim()) }));
  t(cod, vp, 'tela cheia: resumo vai para a gaveta; T1/T2/T3 voltam ao mapa com nº e km', tc.nopanel && tc.btnN.length >= 1, JSON.stringify(tc));
  await p.click('.tc-btn'); await p.waitForTimeout(1200);
  t(cod, vp, 'sair da tela cheia: resumo volta ao cabeçalho', await p.evaluate(() => !document.querySelector('.panel > .al-res') && !!document.querySelector('.wrap > .al-res')));
  // 12 · layout
  const lay = await p.evaluate(() => { const m = document.querySelector('#map').getBoundingClientRect(); return { y: Math.round(m.y), h: Math.round(m.height), bottom: Math.round(m.bottom), vh: innerHeight, rolagem: document.documentElement.scrollHeight - innerHeight, hscroll: document.documentElement.scrollWidth - innerWidth }; });
  t(cod, vp, 'mapa inteiro na tela, sem rolagem da página nem horizontal', lay.bottom <= lay.vh + 1 && lay.rolagem <= 0 && lay.hscroll <= 0, JSON.stringify(lay));
  t(cod, vp, 'cabeçalho numa faixa só: o mapa começa em até 70 px do topo', lay.y <= 70, lay.y);
  const olho = await p.evaluate(() => { const o = document.querySelector('.lp-lupa').getBoundingClientRect(), m = document.querySelector('#map').getBoundingClientRect(); return { dentro: o.left >= m.left && o.top >= m.top && o.right <= m.right && o.bottom <= m.bottom, w: Math.round(o.width), h: Math.round(o.height) }; });
  t(cod, vp, 'o olho da lupa fica dentro do mapa, com alvo de toque de 40 px ou mais', olho.dentro && olho.w >= 40 && olho.h >= 40, JSON.stringify(olho));
  t(cod, vp, 'sem erro de JavaScript durante os testes (parte 2)', p.__erros.length === 0, p.__erros.join(' | '));
  await ctx.close();
}

(async () => {
  const args = process.argv.slice(2), alims = (args.find(a => a.startsWith('--alim=')) || '').slice(7).split(',').filter(Boolean), vps = (args.find(a => a.startsWith('--vp=')) || '--vp=d,m').slice(5).split(','), saida = (args.find(a => a.startsWith('--out=')) || '--out=testes.json').slice(6), partes = (args.find(a => a.startsWith('--parte=')) || '--parte=12').slice(8);
  const b = await chromium.launch();
  for (const cod of (alims.length ? alims : ALIM)) for (const vp of vps) {
    try { if (partes.includes('1')) await roda(b, cod, vp); if (partes.includes('2')) await roda2(b, cod, vp); } catch (e) { t(cod, vp, 'teste interrompido', false, e.message.split('\n')[0]); }
  }
  fs.writeFileSync(path.join(__dirname, saida), JSON.stringify(res, null, 1));
  console.log(res.filter(r => r.ok).length + ' ok · ' + res.filter(r => !r.ok).length + ' falhas');
  await b.close();
})();
