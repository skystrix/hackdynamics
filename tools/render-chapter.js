globalThis.window = globalThis;
const fs = require('fs');
require(process.argv[2]);
const out = process.argv[3];
const css = "body{background:#0c1220;color:#c9d6ea;font-family:sans-serif;margin:0;padding:16px;line-height:1.6;max-width:880px}h1,h2{color:#2de2ff}h3{color:#3ddc97}code{background:#111a2e;padding:1px 4px;border-radius:3px;color:#ffd166}.callout{background:#111a2e;border-left:3px solid #ffd166;padding:10px 14px;margin:16px 0}.fig{margin:22px 0;background:#0e1626;border:1px solid #1c2a45;border-radius:10px;padding:10px}.fig svg{width:100%;height:auto;display:block}.fig-cap{color:#7d8fb0;font-size:12px;margin-top:8px}.viz{border:1px dashed #4f7cff;padding:20px;color:#4f7cff;margin:16px 0}.q{border-top:1px solid #1c2a45;padding-top:10px;margin-top:14px}";
let h = '<html><head><meta charset="utf-8"><style>' + css + '</style></head><body>';
for (const c of window.CHAPTERS) {
  h += '<h1>' + c.num + '. ' + c.title + '</h1><p><em>' + c.blurb + '</em></p>';
  for (const s of c.sections) {
    h += '<h2>' + s.title + '</h2>';
    if (s.viz) h += '<div class="viz">MACHINE: ' + s.viz + ' &mdash; ' + s.vizTitle + '</div>';
    h += s.html;
  }
  h += '<h2>Key terms</h2><ul>' + c.terms.map(t => '<li><strong>' + t.t + '</strong> &mdash; ' + t.d + '</li>').join('') + '</ul>';
  h += '<h2>Quiz</h2>' + c.quiz.map((q, i) => {
    let o = '<div class="q"><p><strong>' + (i + 1) + '. ' + q.q + '</strong></p>';
    if (q.opts) o += '<ol type="A">' + q.opts.map((t, j) => '<li' + (j === q.a ? ' style="color:#3ddc97"' : '') + '>' + t + '</li>').join('') + '</ol>';
    if (q.items) o += '<ol>' + q.items.map(t => '<li>' + t + '</li>').join('') + '</ol>';
    if (Array.isArray(q.a)) o += '<p style="color:#3ddc97">accepts: ' + q.a.join(' / ') + '</p>';
    return o + '<p style="color:#7d8fb0">' + q.why + '</p></div>';
  }).join('');
}
h += '</body></html>';
fs.writeFileSync(out, h);
console.log('written', h.length, 'bytes ->', out);

// Usage: node tools/render-chapter.js <bookData-*.js> <out.html>
// Renders chapter data to a standalone page for eyeballing figures and quiz
// answers before the machines exist. Not shipped; a Phase 4 authoring tool.
