// Espelho local do site de teste (busca cada arquivo do site ao vivo com verificação TLS normal e guarda em cache),
// para o Playwright abrir http://localhost:8765/teste/ sem problema de certificado do proxy do ambiente.
// Uso: NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node servidor.js
const http=require('http'),https=require('https'),fs=require('fs'),path=require('path');
const BASE='https://lgrsv.github.io/vera-vegeta-o-back';
const CACHE=path.join(__dirname,'.cache');fs.mkdirSync(CACHE,{recursive:true});
const get=(u,cb)=>https.get(u,r=>{ if(r.statusCode>=300&&r.statusCode<400&&r.headers.location) return get(new URL(r.headers.location,u).href,cb);
  const c=[];r.on('data',d=>c.push(d));r.on('end',()=>cb(r.statusCode,r.headers['content-type'],Buffer.concat(c)));}).on('error',e=>cb(599,'text/plain',Buffer.from(String(e))));
http.createServer((q,s)=>{
  let u=q.url.split('?')[0]; if(u.endsWith('/')) u+='index.html';
  const f=path.join(CACHE,Buffer.from(u).toString('hex')+'.bin'), m=f+'.json';
  if(fs.existsSync(f)){const t=JSON.parse(fs.readFileSync(m));s.writeHead(200,{'content-type':t.t});return s.end(fs.readFileSync(f));}
  get(BASE+u,(st,t,b)=>{ if(st===200){fs.writeFileSync(f,b);fs.writeFileSync(m,JSON.stringify({t}));} s.writeHead(st,{'content-type':t||'application/octet-stream'});s.end(b);});
}).listen(8765,()=>console.log('ok'));
