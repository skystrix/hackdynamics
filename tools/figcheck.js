/* figcheck.js — static geometry check for the inline SVG figures in bookData files.
   Catches the two defects that are invisible in source and obvious on screen:
   sibling <rect>s that overlap, and any element drawn outside the viewBox.
   Usage: node tools/figcheck.js <bookData-file.js> [chapterNum] */
"use strict";
const path = process.argv[2];
if (!path) { console.error("usage: node tools/figcheck.js <bookData file> [chapter]"); process.exit(2); }
global.window = global;
require(require("path").resolve(path));
const only = process.argv[3] ? Number(process.argv[3]) : null;

let figs = 0, problems = 0;
for (const ch of window.CHAPTERS) {
  if (only && ch.num !== only) continue;
  ch.sections.forEach((sec, si) => {
    const svgs = (sec.html.match(/<svg[\s\S]*?<\/svg>/g) || []);
    svgs.forEach((svg, fi) => {
      figs++;
      const where = `ch${ch.num} §${si + 1} "${sec.title}" fig${fi + 1}`;
      const vb = (svg.match(/viewBox='([^']+)'/) || [])[1];
      if (!vb) { console.log(`${where}: NO viewBox`); problems++; return; }
      const [, , VW, VH] = vb.split(/\s+/).map(Number);
      const overlapOK = /data-overlap='intentional'/.test(svg);

      // rects: overlap between any pair, and out-of-bounds
      const rects = [...svg.matchAll(/<rect x='(-?[\d.]+)' y='(-?[\d.]+)' width='([\d.]+)' height='([\d.]+)'/g)]
        .map(m => ({ x: +m[1], y: +m[2], w: +m[3], h: +m[4] }));
      for (let i = 0; i < rects.length; i++) {
        const a = rects[i];
        if (a.x < 0 || a.y < 0 || a.x + a.w > VW || a.y + a.h > VH) {
          console.log(`${where}: rect out of viewBox  x=${a.x} y=${a.y} w=${a.w} h=${a.h}  (viewBox ${VW}x${VH})`);
          problems++;
        }
        if (overlapOK) continue;   // ponytail: figure declares its overlaps are the content (Venn / inclusion-exclusion)
        for (let j = i + 1; j < rects.length; j++) {
          const b = rects[j];
          const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
          const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
          if (ox > 0 && oy > 0) {
            console.log(`${where}: rects overlap by ${ox}x${oy}  [${a.x},${a.y} ${a.w}x${a.h}] vs [${b.x},${b.y} ${b.w}x${b.h}]`);
            problems++;
          }
        }
      }
      // text: out of viewBox, and collisions with other text on the same line
      const texts = [...svg.matchAll(/<text x='(-?[\d.]+)' y='(-?[\d.]+)'([^>]*)>([^<]*)</g)].map(m => {
        const x = +m[1], y = +m[2], attrs = m[3], txt = m[4];
        const size = Number((attrs.match(/font-size='(\d+)'/) || [])[1] || 12);
        const anchor = (attrs.match(/text-anchor='(\w+)'/) || [])[1] || "start";
        const wpx = txt.length * size * 0.6;            // Menlo is ~0.6em per char
        const left = anchor === "middle" ? x - wpx / 2 : anchor === "end" ? x - wpx : x;
        return { x, y, size, txt, left, right: left + wpx };
      });
      texts.forEach(t => {
        // a baseline must leave room for descenders (g, y, p), else the glyphs are clipped
        const descender = t.size * 0.25;
        if (t.y + descender > VH || t.y - t.size < 0) {
          console.log(`${where}: text clipped by viewBox  baseline y=${t.y} (size ${t.size}) vs height ${VH}  "${t.txt.slice(0, 40)}"`); problems++;
        }
        else if (t.right > VW + 2 || t.left < -2) {
          console.log(`${where}: text overflows x  [${Math.round(t.left)}..${Math.round(t.right)}] vs 0..${VW}  "${t.txt.slice(0, 40)}"`);
          problems++;
        }
      });
      // two labels collide when they share a line band and their x-ranges overlap
      for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
        const a = texts[i], b = texts[j];
        const band = Math.max(a.size, b.size) * 0.8;    // baselines closer than this share a line
        if (Math.abs(a.y - b.y) >= band) continue;
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        if (ox > 2) {
          console.log(`${where}: text collision (${Math.round(ox)}px, y=${a.y}/${b.y})  "${a.txt.slice(0, 26)}" vs "${b.txt.slice(0, 26)}"`);
          problems++;
        }
      }
    });
  });
}
console.log(`\n${figs} figures checked, ${problems} problem(s).`);
process.exit(problems ? 1 : 0);
