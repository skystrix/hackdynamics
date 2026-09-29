# DSA practice problems (guide §8.4). One module per chapter in courses/dsa-by-patterns/practice/chNN.py
# holding PROBLEMS (prose + Python + Java) and BRUTE = {num: (generator, brute force)}.
#   python3 tools/practice.py check courses/dsa-by-patterns/practice/ch08.py [cases]
#     fuzzes each Python solution against its brute force, then runs the Java solution on the
#     same cases and requires identical output (return value plus every array/list argument after the call).
#     A problem with design=True is a class-design problem: its generator returns (ops, args) in LeetCode's
#     own format, ops[0] being the class name, and the brute force returns the list of results.
#     check_args=False skips comparing the arguments after the call (for inputs a language may reuse as scratch).
#   python3 tools/practice.py emit courses/dsa-by-patterns/practice/ch08.py > section.js
#     prints the "Practice Problems" section, ready to paste before the chapter's Exercises.
#   python3 tools/practice.py insert courses/dsa-by-patterns/practice/ch08.py <bookData.js> 8
#     writes it into the chapter, replacing an earlier Practice Problems section if there is one.
import copy, importlib.util, json, os, subprocess, sys, tempfile
sys.path.insert(0, os.path.dirname(__file__))
from chapter_asm import code, P

# Argument markers for chapter modules: pass LL([1, 2]) for a ListNode list, CYC([1, 2, 3], pos) for a
# list whose tail points back to index pos (LeetCode's cycle convention), RND([[val, random_index], ...])
# for the random-pointer Node list, and a list of LL for ListNode[]. Plain ints, strs, int lists, str lists
# and int matrices pass as is.
class LL:
    def __init__(self, vals): self.vals, self.pos = list(vals), -1
    def __repr__(self): return f"LL({self.vals})"
class CYC(LL):
    def __init__(self, vals, pos): super().__init__(vals); self.pos = pos
    def __repr__(self): return f"CYC({self.vals}, {self.pos})"
class RND:
    def __init__(self, pairs): self.pairs = [list(p) for p in pairs]
    def __repr__(self): return f"RND({self.pairs})"

class ListNode:
    def __init__(self, val=0, next=None): self.val, self.next = val, next
class Node:   # ponytail: LeetCode 138's random-pointer node; graph chapters will need their own Node
    def __init__(self, x=0, next=None, random=None): self.val, self.next, self.random = x, next, random

SUPPORT_JAVA = """class ListNode {
    int val; ListNode next;
    ListNode() {} ListNode(int val) { this.val = val; } ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}
class Node {
    int val; Node next, random;
    Node(int val) { this.val = val; }
}
"""

RUNNER = r"""import java.io.*; import java.lang.reflect.*; import java.util.*;
public class Runner {
    static Set<Object> inputNodes = Collections.newSetFromMap(new IdentityHashMap<>());
    public static void main(String[] a) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder out = new StringBuilder(); String line;
        while ((line = br.readLine()) != null) {
            inputNodes.clear();
            if (a[0].equals("--design")) { out.append(design(line)).append("\n"); continue; }
            Class<?> k = Class.forName("Solution"); Constructor<?> ctor = k.getDeclaredConstructor(); ctor.setAccessible(true);
            Object sol = ctor.newInstance(); Method m = find(k.getDeclaredMethods(), a[0], -1);
            String[] ps = line.split("\t", -1);
            Object[] args = parse(m.getParameterTypes(), ps);
            out.append(fmt(m.invoke(sol, args)));
            if (a.length < 2)          // "noargs": skip the arguments-after-the-call check
                for (Object x : args) if (x != null && !(x instanceof Integer || x instanceof String || x instanceof Node)) out.append(" | ").append(fmt(x));
            out.append("\n");
        }
        System.out.print(out);
    }
    static String design(String line) throws Exception {
        String[] ops = line.split("\u001f", -1); List<String> res = new ArrayList<>();
        String[] c = ops[0].split("\t", -1); Class<?> k = Class.forName(c[0]);
        Constructor<?> ctor = k.getDeclaredConstructors()[0]; ctor.setAccessible(true);
        Object obj = ctor.newInstance(parse(ctor.getParameterTypes(), Arrays.copyOfRange(c, 1, c.length)));
        res.add("None");
        for (int i = 1; i < ops.length; i++) {
            String[] f = ops[i].split("\t", -1);
            Method m = find(k.getDeclaredMethods(), f[0], f.length - 1);
            res.add(fmt(m.invoke(obj, parse(m.getParameterTypes(), Arrays.copyOfRange(f, 1, f.length)))));
        }
        return "[" + String.join(", ", res) + "]";
    }
    static Method find(Method[] ms, String name, int arity) {
        for (Method x : ms) if (x.getName().equals(name) && (arity < 0 || x.getParameterCount() == arity)) { x.setAccessible(true); return x; }
        throw new RuntimeException("no method " + name);
    }
    static Object[] parse(Class<?>[] ts, String[] ps) {
        Object[] args = new Object[ts.length];
        for (int i = 0; i < ts.length; i++) args[i] = parse(ts[i], ps[i]);
        return args;
    }
    static int[] ints(String v) { return v.isEmpty() ? new int[0] : Arrays.stream(v.split(",")).mapToInt(Integer::parseInt).toArray(); }
    static Object parse(Class<?> t, String v) {
        if (t == int.class) return Integer.parseInt(v);
        if (t == String.class) return v;
        if (t == int[].class) return ints(v);
        if (t == String[].class) return v.isEmpty() ? new String[0] : v.split(",", -1);
        if (t == int[][].class) { if (v.isEmpty()) return new int[0][]; String[] r = v.split(";", -1); int[][] m = new int[r.length][]; for (int i = 0; i < r.length; i++) m[i] = ints(r[i]); return m; }
        if (t == ListNode.class) {
            String[] pv = v.split("\\|", -1); int pos = Integer.parseInt(pv[0]); int[] vals = ints(pv[1]);
            ListNode[] n = new ListNode[vals.length];
            for (int i = 0; i < n.length; i++) { n[i] = new ListNode(vals[i]); inputNodes.add(n[i]); if (i > 0) n[i - 1].next = n[i]; }
            if (pos >= 0) n[n.length - 1].next = n[pos];
            return n.length == 0 ? null : n[0];
        }
        if (t == ListNode[].class) {
            if (v.isEmpty()) return new ListNode[0];
            String[] ls = v.split("#", -1); ListNode[] out = new ListNode[ls.length];
            for (int i = 0; i < ls.length; i++) out[i] = (ListNode) parse(ListNode.class, ls[i]);
            return out;
        }
        if (t == Node.class) {
            if (v.isEmpty()) return null;
            String[] r = v.split(";"); Node[] n = new Node[r.length];
            for (int i = 0; i < n.length; i++) { n[i] = new Node(Integer.parseInt(r[i].split(",")[0])); inputNodes.add(n[i]); if (i > 0) n[i - 1].next = n[i]; }
            for (int i = 0; i < n.length; i++) { int ri = Integer.parseInt(r[i].split(",")[1]); if (ri >= 0) n[i].random = n[ri]; }
            return n[0];
        }
        throw new RuntimeException("unsupported parameter type " + t);
    }
    static String fmt(Object r) {
        if (r == null) return "None";
        if (r instanceof int[]) return Arrays.toString((int[]) r);
        if (r instanceof Object[]) { List<String> s = new ArrayList<>(); for (Object x : (Object[]) r) s.add(fmt(x)); return "[" + String.join(", ", s) + "]"; }
        if (r instanceof ListNode) {
            List<String> s = new ArrayList<>(); IdentityHashMap<Object, Integer> seen = new IdentityHashMap<>();
            for (ListNode x = (ListNode) r; x != null; x = x.next) {
                if (seen.containsKey(x)) { s.add("@" + seen.get(x)); break; }
                seen.put(x, seen.size()); s.add(String.valueOf(x.val));
            }
            return "L[" + String.join(", ", s) + "]";
        }
        if (r instanceof Node) {
            List<Node> ns = new ArrayList<>(); IdentityHashMap<Object, Integer> idx = new IdentityHashMap<>(); boolean shared = false;
            for (Node x = (Node) r; x != null && !idx.containsKey(x); x = x.next) { idx.put(x, ns.size()); ns.add(x); shared |= inputNodes.contains(x); }
            List<String> s = new ArrayList<>();
            for (Node x : ns) s.add("[" + x.val + ", " + (x.random == null ? -1 : idx.getOrDefault(x.random, -2)) + "]");
            return "N[" + String.join(", ", s) + "]" + (shared ? " SHARED" : "");
        }
        return String.valueOf(r);
    }
}"""

_input_nodes = set()
def materialize(x):
    if isinstance(x, LL):
        ns = [ListNode(v) for v in x.vals]
        for a, b in zip(ns, ns[1:]): a.next = b
        if x.pos >= 0: ns[-1].next = ns[x.pos]
        _input_nodes.update(map(id, ns)); return ns[0] if ns else None
    if isinstance(x, RND):
        ns = [Node(v) for v, _ in x.pairs]
        for a, b in zip(ns, ns[1:]): a.next = b
        for n, (_, r) in zip(ns, x.pairs): n.random = ns[r] if r >= 0 else None
        _input_nodes.update(map(id, ns)); return ns[0] if ns else None
    if isinstance(x, list) and x and isinstance(x[0], LL): return [materialize(y) for y in x]
    return copy.deepcopy(x)

def fmt(x):
    if x is None: return "None"
    if isinstance(x, bool): return "true" if x else "false"
    if isinstance(x, (list, tuple)): return "[" + ", ".join(map(fmt, x)) + "]"
    if isinstance(x, ListNode):
        s, seen = [], {}
        while x is not None:
            if id(x) in seen: s.append(f"@{seen[id(x)]}"); break
            seen[id(x)] = len(seen); s.append(str(x.val)); x = x.next
        return "L[" + ", ".join(s) + "]"
    if isinstance(x, Node):
        ns, idx = [], {}
        while x is not None and id(x) not in idx: idx[id(x)] = len(ns); ns.append(x); x = x.next
        shared = any(id(n) in _input_nodes for n in ns)
        return "N[" + ", ".join(f"[{n.val}, {-1 if n.random is None else idx.get(id(n.random), -2)}]" for n in ns) + "]" + (" SHARED" if shared else "")
    return str(x)

def enc(x):
    if isinstance(x, bool): raise TypeError(f"unsupported argument {x!r}")
    if isinstance(x, (int, str)): return str(x)
    if isinstance(x, LL): return f"{x.pos}|" + ",".join(map(str, x.vals))
    if isinstance(x, RND): return ";".join(f"{v},{r}" for v, r in x.pairs)
    if isinstance(x, list):
        if x and isinstance(x[0], LL): return "#".join(map(enc, x))   # ListNode[]
        if x and isinstance(x[0], list): return ";".join(",".join(map(str, r)) for r in x)
        return ",".join(map(str, x))
    raise TypeError(f"unsupported argument {x!r}")

def load(path):
    spec = importlib.util.spec_from_file_location("chapter_practice", path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

def solution_ns(src):
    ns = {"ListNode": ListNode, "Node": Node}
    exec("from typing import *\n" + src, ns); return ns

def run_py(p, ns, args):
    """Run one case. Returns (value compared with the brute force, printed line compared with Java)."""
    _input_nodes.clear()
    if p.get("design"):
        ops, opargs = args
        obj = ns[ops[0]](*map(materialize, opargs[0]))
        res = [None] + [getattr(obj, op)(*map(materialize, a)) for op, a in zip(ops[1:], opargs[1:])]
        return res, fmt(res)
    after = [materialize(x) for x in args]
    r = getattr(ns["Solution"](), p["method"])(*after)
    shown = [x for x in after if isinstance(x, (list, ListNode))] if p.get("check_args", True) else []
    line = " | ".join([fmt(r)] + [fmt(x) for x in shown])
    got = p.get("observe", lambda r, a: r)(r, after)
    return got, line

def java_case(p, args):
    if p.get("design"):
        ops, opargs = args
        return "\u001f".join("\t".join([op] + [enc(x) for x in a]) for op, a in zip(ops, opargs))
    return "\t".join(map(enc, args))

def check(mod, n):
    bad = 0
    for p in mod.PROBLEMS:
        ns = solution_ns(p["py"])
        gen, brute = mod.BRUTE[p["num"]]
        cases, pyout, fails = [], [], 0
        for _ in range(n):
            args = gen()
            got, line = run_py(p, ns, args)
            want = brute(*copy.deepcopy(args))
            if got != want:
                fails += 1
                if fails <= 2: print("  PY FAIL", p["num"], args, "got", got, "want", want)
            cases.append(java_case(p, args)); pyout.append(line)
        with tempfile.TemporaryDirectory() as d:
            open(f"{d}/Solution.java", "w").write(p["java"]); open(f"{d}/Runner.java", "w").write(RUNNER)
            open(f"{d}/Support.java", "w").write(SUPPORT_JAVA)
            c = subprocess.run(["javac", "-d", d, f"{d}/Solution.java", f"{d}/Runner.java", f"{d}/Support.java"], capture_output=True, text=True)
            if c.returncode: print("  JAVAC FAIL", p["num"], c.stderr[:800]); bad += 1; continue
            j = subprocess.run(["java", "-cp", d, "Runner", "--design" if p.get("design") else p["method"]]
                               + ([] if p.get("check_args", True) else ["noargs"]),
                               input="\n".join(cases) + "\n", capture_output=True, text=True)
        jout = j.stdout.splitlines()
        diffs = [(c_, a, b) for c_, a, b in zip(cases, pyout, jout) if a != b]
        jd = len(diffs) + abs(len(pyout) - len(jout))
        if jd: print("  JAVA DIFF", p["num"], j.stderr[:400], diffs[:1])
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

def insert(section, book, num):
    """Put the section before chapter `num`'s Exercises, replacing an earlier Practice Problems section."""
    L = open(book).read().split("\n")
    start = next(i for i, l in enumerate(L) if l.startswith(f"  num: {num}, part"))
    end = next((i for i in range(start + 1, len(L)) if l_is_chapter(L[i])), len(L))
    ex = next(i for i in range(start, end) if L[i] == '    { title: "Exercises",')
    old = next((i for i in range(start, ex) if L[i] == '    { title: "Practice Problems",'), None)
    lo = old if old is not None else ex
    L[lo:ex] = section.rstrip("\n").split("\n") + [""]
    open(book, "w").write("\n".join(L))
    print(("replaced" if old is not None else "inserted"), f"Practice Problems in chapter {num}")

def l_is_chapter(line): return line.startswith("  num: ") and ", part" in line

if __name__ == "__main__":
    sys.modules["practice"] = sys.modules["__main__"]   # chapter modules `from practice import LL, CYC, RND`
    cmd, path = sys.argv[1:3]; mod = load(path)
    if cmd == "check": sys.exit(1 if check(mod, int(sys.argv[3]) if len(sys.argv) > 3 else 3000) else 0)
    elif cmd == "insert": insert(emit(mod), sys.argv[3], int(sys.argv[4]))
    else: sys.stdout.write(emit(mod))
