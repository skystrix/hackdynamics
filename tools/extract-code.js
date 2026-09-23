// node tools/extract-code.js <bookData.js> <chapterNum>: writes code_py.py and code_java.txt in the cwd, the chapter's
// code blocks exactly as rendered (HTML unescaped), for running the snippets against brute force.
const fs=require('fs'), vm=require('vm');
const [file,num]=process.argv.slice(2);
const ctx={window:{}, console}; ctx.window=ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(file,'utf8')+';this.__C=(typeof CHAPTERS!=="undefined"?CHAPTERS:window.CHAPTERS);',ctx);
const ch=ctx.__C.find(c=>c.num==+num);
const html=ch.sections.map(s=>s.html).join('\n');
const un=t=>t.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
const get=lang=>[...html.matchAll(new RegExp(`<pre data-lang='${lang}'[^>]*><code>([\\s\\S]*?)</code></pre>`,'g'))].map(m=>un(m[1]));
fs.writeFileSync('code_py.py',get('python').join('\n\n'));
fs.writeFileSync('code_java.txt',get('java').join('\n\n'));
console.log('python',get('python').length,'java',get('java').length);
