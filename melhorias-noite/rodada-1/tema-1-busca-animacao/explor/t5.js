const L=require('../lib.js');
(async()=>{
 const b=await L.chromium.launch();
 for (const t of ['d','m']) {
  const p=await L.abre(b,t,'s4 s5 s2');
  await L.foto(p,'x-'+t+'-b0-fechada');
  await p.keyboard.press('/'); await p.waitForTimeout(500); await L.foto(p,'x-'+t+'-b1-aberta');
  await p.fill('#ativo-q','palm'); await p.waitForTimeout(900); await L.foto(p,'x-'+t+'-b2-palm');
  await p.fill('#ativo-q','LD0107'); await p.waitForTimeout(900); await L.foto(p,'x-'+t+'-b3-al');
  await p.fill('#ativo-q','790000'); await p.waitForTimeout(1200); await L.foto(p,'x-'+t+'-b4-ativo');
  await p.fill('#ativo-q','7900001071'); await p.keyboard.press('Enter'); await p.waitForTimeout(1500); await L.foto(p,'x-'+t+'-b5-ativo-res');
  await p.fill('#ativo-q','ETO-RD-GU 000353/2026'); await p.waitForTimeout(500); await p.keyboard.press('Enter'); await p.waitForTimeout(1500); await L.foto(p,'x-'+t+'-b6-os-res');
  await p.fill('#ativo-q','zzzz'); await p.waitForTimeout(800); await L.foto(p,'x-'+t+'-b7-vazio');
  console.log(t,p.erros);
 }
 await b.close();
})();
