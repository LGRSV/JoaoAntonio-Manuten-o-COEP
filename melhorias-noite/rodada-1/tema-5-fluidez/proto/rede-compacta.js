// Protótipo: compacta o "d" das redes (dados/redes/*.json) — remove segmentos de comprimento zero, encadeia segmentos
// consecutivos em polilinhas e simplifica (Ramer–Douglas–Peucker) com tolerância eps em unidades do mapa.
// Serve tanto no navegador (window.compactaRede) quanto para ser portado para scripts/gera_trechos.py.
(function (g) {
  function rdp(p, eps) {
    if (p.length < 3) return p;
    const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1;
    const st = [[0, p.length - 1]];
    while (st.length) {
      const [a, b] = st.pop(); let m = -1, id = -1;
      const dx = p[b][0] - p[a][0], dy = p[b][1] - p[a][1], L = Math.hypot(dx, dy) || 1e-9;
      for (let i = a + 1; i < b; i++) { const d = Math.abs((p[i][0] - p[a][0]) * dy - (p[i][1] - p[a][1]) * dx) / L; if (d > m) { m = d; id = i; } }
      if (m > eps) { keep[id] = 1; st.push([a, id], [id, b]); }
    }
    return p.filter((_, i) => keep[i]);
  }
  function compactaRede(d, eps) {
    eps = eps == null ? 0.01 : eps;
    const segs = d.split('M').slice(1).map(s => s.split('L').map(p => p.split(',').map(Number)));
    const out = []; let cur = null;
    for (const s of segs) for (let i = 0; i < s.length - 1; i++) {
      const a = s[i], b = s[i + 1];
      if (a[0] === b[0] && a[1] === b[1]) continue;
      if (cur && cur[cur.length - 1][0] === a[0] && cur[cur.length - 1][1] === a[1]) cur.push(b); else { cur = [a, b]; out.push(cur); }
    }
    return out.map(p => (eps > 0 ? rdp(p, eps) : p)).map(p => 'M' + p.map(q => q[0] + ',' + q[1]).join('L')).join('');
  }
  g.compactaRede = compactaRede;
  if (typeof module !== 'undefined') module.exports = compactaRede;
})(typeof window !== 'undefined' ? window : globalThis);
