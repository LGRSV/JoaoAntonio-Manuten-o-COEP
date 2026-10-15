const L=require('../lib.js');
(async()=>{
 const b=await L.chromium.launch();
 const p=await L.abre(b,'m','s1');
 console.log(await p.evaluate(()=>navigator.userAgent));
 for (const css of ['', '.mt-regs:not([open])::details-content{contain-intrinsic-block-size:0!important;block-size:0}', '.mt-regs{contain-intrinsic-size:none}', '.mt-regs:not([open])::details-content{content-visibility:hidden;contain-intrinsic-size:none}', '.mt-regs:not([open])>.mt-regs-c{display:none!important}']) {
  const h=await p.evaluate(c=>{let st=document.getElementById('tt');if(!st){st=document.createElement('style');st.id='tt';document.head.append(st)}st.textContent=c;return document.querySelector('.mt-regs').getBoundingClientRect().height},css);
  console.log(h,css);
 }
 await b.close();
})();
