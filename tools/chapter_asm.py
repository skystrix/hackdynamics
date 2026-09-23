# Phase 4 chapter assembler: write sections as Python (P() paragraphs, code(py, java) tabs, figure HTML
# strings), then build(...) emits a CHAPTERS.push({...}) block to append to a bookData file.
# Each section is dict(title=..., blocks=[...], viz=..., vizTitle=...); EX is [(bold lead, text)], terms [(t, d)].
# Check the output with tools/chapcheck.js on a copy of the bookData before appending.
import json, re

def code(py, java):
    def pre(lang, src, hidden):
        lines = src.strip('\n').split('\n')
        out = f"<pre data-lang='{lang}'{' hidden' if hidden else ''}><code>"
        parts = [json.dumps(out + lines[0] + ('\n' if len(lines) > 1 else ''))]
        for k, l in enumerate(lines[1:], 1):
            parts.append(json.dumps(l + ('\n' if k < len(lines) - 1 else '')))
        parts[-1] = parts[-1][:-1] + '</code></pre>"'
        return parts
    head = json.dumps("<div class='code-tabs'><div class='code-tab-bar'><button class='code-tab active' data-lang='python'>Python</button><button class='code-tab' data-lang='java'>Java</button></div>")
    p = pre('python', py, False); j = pre('java', java, True)
    j[-1] = j[-1][:-1] + '</div>"'
    return ('RAW', [head] + p + j)

def P(s): return '<p>' + ' '.join(s.split()) + '</p>'


def build(NUM, TITLE, BLURB, S, EX, terms, quiz, outname, PART=4):
    def emit_blocks(blocks):
        lines = []
        for b in blocks:
            if isinstance(b, tuple) and b[0] == 'RAW': lines += b[1]
            else: lines.append(json.dumps(b))
        return lines
    
    out = ["", "/* ======================= CHAPTER %d ======================= */" % NUM + "", "CHAPTERS.push({",
      f'  num: {NUM}, part: {PART}, title: {json.dumps(TITLE)},',
      '  blurb: ' + json.dumps(BLURB) + ',',
      "  sections: [", ""]
    secs = []
    for s in S:
        head = f"    {{ title: {json.dumps(s['title'])},\n"
        if s.get('viz'): head += f"      viz: {json.dumps(s['viz'])}, vizTitle: {json.dumps(s['vizTitle'])},\n"
        body = emit_blocks(s['blocks'])
        head += "      html:\n        " + " +\n        ".join(body) + "\n    }"
        secs.append(head)
    ex = "    { title: \"Exercises\",\n      html:\n        " + " +\n        ".join(
        [json.dumps("<ol>")] + [json.dumps(f"<li><strong>{a}</strong> {b}</li>") for a, b in EX] + [json.dumps("</ol>")]) + "\n    }"
    secs.append(ex)
    out.append(",\n\n".join(secs))
    out += ["", "  ],", "", "  terms: ["]
    out.append(",\n".join(f"    {{ t: {json.dumps(t)}, d: {json.dumps(d)} }}" for t, d in terms))
    out += ["  ],", "", "  quiz: ["]
    qs = []
    for q in quiz:
        s = f"    {{ type: {json.dumps(q['type'])},\n      q: {json.dumps(q['q'])},\n"
        if q['type'] == 'mc':
            s += "      opts: [\n" + ",\n".join("        " + json.dumps(o) for o in q['opts']) + f"\n      ], a: {q['a']},\n"
        elif q['type'] == 'blank':
            s += f"      a: {json.dumps(q['a'])},\n"
        else:
            s += "      items: [\n" + ",\n".join("        " + json.dumps(o) for o in q['items']) + "\n      ],\n"
        s += f"      why: {json.dumps(q['why'])} }}"
        qs.append(s)
    out.append(",\n\n".join(qs))
    out += ["  ]", "});", ""]
    txt = "\n".join(out)
    txt = txt.replace('\\u2014', '&mdash;')
    open(outname, 'w').write(txt)
    print("chars", len(txt), "p open", txt.count('<p>'), "p close", txt.count('</p>'))
    
