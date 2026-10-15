const L=require('../lib.js');
const variantes={ base:'', esconde:'.voando .mt-redes-f{visibility:hidden}', escondeTudo:'.voando .mt-redes-f,.voando .mt-redes-d{visibility:hidden}', semNaoEscala:'.voando .mt-redes path{vector-effect:none!important}' };
(async()=>{
 const b=await L.chromium.launch();
 for (const [nome,css] of Object.entries(variantes)) {
  const q=await L.abre(b,'d','s5');
  if (css) await q.addStyleTag({content:css});
  await q.evaluate(()=>{ window.__t=[]; const f=t=>{window.__t.push([t,document.querySelector('.mt-mapa svg').getAttribute('viewBox')]);requestAnimationFrame(f)};requestAnimationFrame(f);});
  const med=async(acao,n)=>{ await q.evaluate(()=>{window.__t=[]}); await acao(); await L.esperaVoo(q,4000); await q.waitForTimeout(300);
    const r=await q.evaluate(()=>{const a=window.__t;let ini=-1,fim=-1;for(let i=1;i<a.length;i++)if(a[i][1]!==a[i-1][1]){if(ini<0)ini=i;fim=i}let mx=0;for(let i=ini;i<=fim;i++)mx=Math.max(mx,a[i][0]-a[i-1][0]);return [Math.round(a[fim][0]-a[ini][0]),fim-ini+1,Math.round(mx)]});
    console.log(nome.padEnd(12),n.padEnd(14),'dur',r[0],'quadros',r[1],'maxGap',r[2]); };
  await med(()=>q.click('.mt-regcards button[data-reg="Centro"]'),'reg');
  await med(()=>q.click('.mt-pchip[data-polo="Palmas"]'),'polo');
  await med(()=>q.click('.mun.tem[aria-label="Palmas"]',{force:true}),'mun');
  await med(()=>q.click('.mt-al'),'al');
  await med(()=>q.click('.mt-volta'),'al->mun');
  await q.context().close();
 }
 await b.close();
})();
