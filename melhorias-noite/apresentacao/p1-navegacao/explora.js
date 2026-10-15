const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1440,height:900}});
 await ctx.route('**/*', async r=>{ try{ const rs=await fetch(r.request().url(),{headers:{'user-agent':'Mozilla/5.0'}}); const buf=Buffer.from(await rs.arrayBuffer()); const h=Object.fromEntries([...rs.headers].filter(([k])=>!/content-encoding|content-length|transfer-encoding/i.test(k))); await r.fulfill({status:rs.status,headers:h,body:buf}); }catch(e){ await r.abort(); } });
 const p=await ctx.newPage();
 await p.goto('https://lgrsv.github.io/vera-vegeta-o-back/teste/',{waitUntil:'networkidle'});
 console.log(await p.title());
 console.log(await p.evaluate(()=>document.body.innerText.slice(0,1500)));
 console.log(await p.evaluate(()=>[...document.querySelectorAll('button,a')].slice(0,40).map(e=>e.tagName+'|'+(e.className||'')+'|'+(e.dataset.reg||'')+'|'+e.innerText.slice(0,40).replace(/\n/g,' ')).join('\n')));
 await p.screenshot({path:'/tmp/claude-0/x.jpg',type:'jpeg'});
 await b.close();
})();
