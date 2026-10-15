// Monta proto/fonts/*.woff2 e proto/fontes.css (só o subconjunto latin das 6 faces usadas na página inicial) a partir do CSS do Google já em cache
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const CACHE = '/tmp/claude-0/-home-user-smartled/2ba15095-ae67-51f0-acd3-e77e4b1d05de/scratchpad/ext';
const h = u => path.join(CACHE, crypto.createHash('md5').update(u).digest('hex'));
const CSS_URL = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans+Condensed:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap';
const css = fs.readFileSync(h(CSS_URL) + '.body', 'utf8');
const USADAS = ['IBM Plex Mono|600', 'IBM Plex Sans|400', 'IBM Plex Sans|600', 'IBM Plex Sans|700', 'IBM Plex Sans Condensed|600', 'IBM Plex Sans Condensed|700'];
fs.mkdirSync(path.join(__dirname, 'proto/fonts'), { recursive: true });
let out = '';
for (const bloco of css.split('/* ').slice(1)) {
  const sub = bloco.split(' */')[0]; if (sub !== 'latin') continue;
  const fam = /font-family: '([^']+)'/.exec(bloco)[1], w = /font-weight: (\d+)/.exec(bloco)[1], url = /url\(([^)]+)\)/.exec(bloco)[1], ur = /unicode-range: ([^;]+)/.exec(bloco)[1];
  if (!USADAS.includes(fam + '|' + w)) continue;
  const variavel = fam === 'IBM Plex Sans';       // o Google serve o mesmo arquivo (variável) para 400/600/700: uma só @font-face e um só download
  if (variavel && w !== '400') continue;
  const nome = variavel ? 'ibm-plex-sans-var.woff2' : fam.toLowerCase().replace(/ /g, '-') + '-' + w + '.woff2';
  if (!fs.existsSync(h(url) + '.body')) { console.log('falta no cache', url); continue; }
  fs.copyFileSync(h(url) + '.body', path.join(__dirname, 'proto/fonts', nome));
  out += `@font-face{font-family:'${fam}';font-style:normal;font-weight:${variavel ? '100 700' : w};font-display:swap;src:url(@BASE@assets/fonts/${nome}) format('woff2');unicode-range:${ur}}\n`;
  console.log(nome, fs.statSync(path.join(__dirname, 'proto/fonts', nome)).size);
}
fs.writeFileSync(path.join(__dirname, 'proto/fontes.css'), out);
