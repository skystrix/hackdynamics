// Phase 4 chapter check: sections/terms/quiz counts, body words (incl. Exercises; ~4% under the
// ch1-29 counter), banned words, missing terms, quiz key-longest/shortest + positions, <p> balance, refs.
globalThis.window = globalThis;
const fs = require('fs');
eval(fs.readFileSync(process.argv[2], 'utf8'));
const n = +process.argv[3];
const ch = CHAPTERS.find(c => c.num === n);
const strip = h => h.replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<pre[\s\S]*?<\/pre>/g, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z]+;|&#\d+;/g, ' ');
const content = ch.sections;
const body = content.map(s => strip(s.html)).join(' ');
const words = body.split(/\s+/).filter(w => /\w/.test(w)).length;
const allHtml = ch.sections.map(s => s.html).join('');
const low = strip(allHtml).replace(/\s+/g, ' ').toLowerCase();
const banned = ['master','crack','hack','guru','ultimate','roadmap','simply','obviously','just','easy'];
const texts = [body, ch.blurb, ...ch.terms.map(t => t.d), ...ch.quiz.flatMap(q => [q.q, q.why, ...(q.opts||[]), ...(q.items||[])])].join(' ').toLowerCase();
const bannedHits = banned.filter(b => new RegExp('\\b' + b + '\\b').test(texts));
const missing = ch.terms.filter(t => !low.includes(t.t.toLowerCase())).map(t => t.t);
const mc = ch.quiz.filter(q => q.type === 'mc');
let kl = 0, ks = 0; const pos = [0,0,0,0];
mc.forEach((q, i) => { const L = q.opts.map(o => o.length); const k = L[q.a];
  if (k === Math.max(...L)) kl++; if (k === Math.min(...L)) ks++; pos[q.a]++;
  console.log(`  Q${ch.quiz.indexOf(q)+1} a=${q.a} lens=${L.join(',')}`); });
const po = (allHtml.match(/<p>/g)||[]).length, pc = (allHtml.match(/<\/p>/g)||[]).length;
const refs = [...new Set((allHtml.match(/Chapter \d+/g)||[]))];
console.log({ part: ch.part, sections: ch.sections.length, terms: ch.terms.length, quiz: ch.quiz.length, words,
  vizzes: ch.sections.filter(s => s.viz).map(s => s.viz), bannedHits, missing, keylong: kl, keyshort: ks, mc: mc.length, pos,
  pOpen: po, pClose: pc, figs: (allHtml.match(/<svg/g)||[]).length, refs });
