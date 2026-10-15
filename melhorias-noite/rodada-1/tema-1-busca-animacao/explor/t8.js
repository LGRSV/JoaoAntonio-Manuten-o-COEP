const L=require('../lib.js');
(async()=>{
 const b=await L.chromium.launch();
 let p=await L.abre(b,'d','s4');
 await p.keyboard.press('/'); await p.waitForTimeout(300);
 await p.keyboard.press('Escape'); await p.waitForTimeout(300);
 console.log('esc direto, hidden:', await p.$eval('#ativo-q',e=>e.hidden), await p.$eval('#ativo-res',e=>e.innerHTML.length));
 await p.keyboard.press('/'); await p.fill('#ativo-q','a/b'); await p.waitForTimeout(800);
 await p.fill('#ativo-q',''); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
 console.log('apos fill vazio+esc, hidden:', await p.$eval('#ativo-q',e=>e.hidden), await p.$eval('#ativo-res',e=>e.innerHTML.slice(0,80)));
 await p.context().close();
 p=await L.abre(b,'m','s1 s2 s3 s5');
 await p.evaluate(()=>{Element.prototype.requestFullscreen=undefined;});
 await p.tap('.mt-tc'); await p.waitForTimeout(500);
 console.log(await p.evaluate(()=>[document.getElementById('mapa-to').getBoundingClientRect().toJSON(), innerHeight, document.documentElement.clientHeight, visualViewport.height]));
 await b.close();
})();
