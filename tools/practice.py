# DSA practice problems (guide §8.4). One module per chapter in courses/dsa-by-patterns/practice/chNN.py
# holding PROBLEMS (prose + Python + Java) and BRUTE = {num: (generator, brute force)}.
#   python3 tools/practice.py check courses/dsa-by-patterns/practice/ch08.py [cases]
#     fuzzes each Python solution against its brute force, then runs the Java solution on the
#     same cases and requires identical output (return value plus every int[] argument after the call).
#   python3 tools/practice.py emit courses/dsa-by-patterns/practice/ch08.py > section.js
#     prints the "Practice Problems" section, ready to paste before the chapter's Exercises.
import copy, importlib.util, json, os, subprocess, sys, tempfile
sys.path.insert(0, os.path.dirname(__file__))
from chapter_asm import code, P

RUNNER = r'''import java.io.*; import java.lang.reflect.*; import java.util.*;
public class Runner {
    public static void main(String[] a) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        Solution sol = new Solution(); Method m = null;
        for (Method x : Solution.class.getDeclaredMethods()) if (x.getName().equals(a[0])) m = x;
        m.setAccessible(true);
        StringBuilder out = new StringBuilder(); String line;
        while ((line = br.readLine()) != null) {
            String[] ps = line.split("\t", -1); Object[] args = new Object[ps.length];
            for (int i = 0; i < ps.length; i++) {
                char t = ps[i].charAt(0); String v = ps[i].substring(2);
                args[i] = t == 'i' ? (Object) Integer.parseInt(v) : t == 's' ? v
                        : v.isEmpty() ? new int[0] : Arrays.stream(v.split(",")).mapToInt(Integer::parseInt).toArray();
            }
            out.append(fmt(m.invoke(sol, args)));
            for (Object x : args) if (x instanceof int[]) out.append(" | ").append(fmt(x));
            out.append("\n");
        }
        System.out.print(out);
    }
    static String fmt(Object r) {
        if (r == null) return "None";
        if (r instanceof int[]) return Arrays.toString((int[]) r);
        return String.valueOf(r);
    }
}'''

def load(path):
    spec = importlib.util.spec_from_file_location("chapter_practice", path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

def fmt(x):
    if x is None: return "None"
    if isinstance(x, bool): return "true" if x else "false"
    return str(x)

def enc(x):   # one argument per tab-separated field; ponytail: int, str and int[] only, extend when a chapter needs more
    if isinstance(x, bool) or not isinstance(x, (int, str, list)): raise TypeError(f"unsupported argument {x!r}")
    return f"i:{x}" if isinstance(x, int) else f"s:{x}" if isinstance(x, str) else "a:" + ",".join(map(str, x))

def check(mod, n):
    bad = 0
    for p in mod.PROBLEMS:
        ns = {}; exec(p["py"], ns); f = getattr(ns["Solution"](), p["method"])
        gen, brute = mod.BRUTE[p["num"]]
        # `observe` (optional) maps (return value, args after the call) to what the brute force returns
        observe = p.get("observe", lambda r, args: r)
        cases, pyout, fails = [], [], 0
        for _ in range(n):
            args = gen(); after = copy.deepcopy(args); r = f(*after)
            got, want = observe(r, after), brute(*copy.deepcopy(args))
            if got != want:
                fails += 1
                if fails <= 2: print("  PY FAIL", p["num"], args, "got", got, "want", want)
            cases.append("\t".join(map(enc, args)))
            pyout.append(" | ".join([fmt(r)] + [fmt(x) for x in after if isinstance(x, list)]))
        with tempfile.TemporaryDirectory() as d:
            open(f"{d}/Solution.java", "w").write(p["java"]); open(f"{d}/Runner.java", "w").write(RUNNER)
            c = subprocess.run(["javac", "-d", d, f"{d}/Solution.java", f"{d}/Runner.java"], capture_output=True, text=True)
            if c.returncode: print("  JAVAC FAIL", p["num"], c.stderr[:800]); bad += 1; continue
            j = subprocess.run(["java", "-cp", d, "Runner", p["method"]], input="\n".join(cases) + "\n", capture_output=True, text=True)
        jout = j.stdout.splitlines()
        diffs = [(c_, a, b) for c_, a, b in zip(cases, pyout, jout) if a != b]
        jd = len(diffs) + abs(len(pyout) - len(jout))
        if jd: print("  JAVA DIFF", p["num"], j.stderr[:300], diffs[:1])
        bad += fails + jd
        print(f"{p['num']:>5} {p['title'][:42]:42} py-vs-brute fails={fails}  java-vs-py diffs={jd}  ({n} cases)")
    print("ALL PASS" if bad == 0 else f"FAILURES: {bad}")
    return bad

def emit(mod):
    J = json.dumps
    L = [J(P("""These are real interview problems from LeetCode, and every one is solved by an idea from this chapter.
They run from Easy, where the pattern is in plain sight, through Medium, where it is disguised, to Hard,
where it needs one more idea on top. Work through them in order.""")),
         J(P("""Give each problem 15 minutes (Easy), 25 (Medium) or 40 (Hard) on your own before you open anything.
If you are stuck, open the <strong>Hint</strong> first: it names the clue in the problem that points to the
pattern. Open the <strong>Solution</strong> only if the hint did not get you moving. Each solution starts
from the brute force, so you can see what the pattern saves, and it is written in LeetCode's own
<code>class Solution</code> form, so you can paste it into the judge to check it."""))]
    for k, p in enumerate(mod.PROBLEMS, 1):
        for fld in ("ask", "cue", "brute", "approach", "cx", "trap"):
            assert "<" not in p[fld].replace("&lt;", ""), (p["num"], fld)
        url = f"https://leetcode.com/problems/{p['slug']}/"
        L += [J(f"<h3>{k}. {p['title']}</h3>"),
              J(f"<p><strong>LeetCode {p['num']} &#183; {p['diff']}</strong> &#183; <a href='{url}' target='_blank' rel='noopener'>Open the problem</a></p>"),
              J(P(p["ask"])),
              J("<details class='solution'><summary>Hint</summary>" + P(p["cue"]) + "</details>"),
              J("<details class='solution'><summary>Solution</summary>"),
              J(P("<strong>Brute force.</strong> " + p["brute"])),
              J(P("<strong>Approach.</strong> " + p["approach"]))]
        L += code(p["py"], p["java"])[1]
        L += [J(P("<strong>Complexity.</strong> " + p["cx"])),
              J(P("<strong>The trap.</strong> " + p["trap"]) + "</details>")]
    return '    { title: "Practice Problems",\n      html:\n        ' + ' +\n        '.join(L) + '\n    },\n'

if __name__ == "__main__":
    cmd, path = sys.argv[1:3]; mod = load(path)
    if cmd == "check": sys.exit(1 if check(mod, int(sys.argv[3]) if len(sys.argv) > 3 else 3000) else 0)
    else: sys.stdout.write(emit(mod))
