# Chapter 31 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
# Segment-tree problems on LeetCode are Hard; there are no free Easy or Medium problems that need one.
import random

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

MOD = 10**9 + 7

prob(num=2407, slug="longest-increasing-subsequence-ii", title="Longest Increasing Subsequence II", diff="Hard",
  method="lengthOfLIS",
  ask="Find the longest strictly increasing subsequence in which neighbouring values differ by at most k.",
  cue="Chapter 21's quadratic LIS asks, for each value v, for the best length ending at any earlier value in [v - k, v - 1]. That is a range maximum over values, updated one point at a time: a segment tree indexed by value (the Over a Monoid section, with max as the operation).",
  brute="The quadratic DP over positions: O(n²), 10¹⁰ at n = 10⁵.",
  approach="Keep best[v] = the longest valid subsequence ending with value v, in an iterative segment tree over values 1..max. For each x in order, query the maximum over [x - k, x - 1], add 1, and write that into position x (keeping the larger if x already has a value). The answer is the tree's overall maximum.",
  cx="O(n log V) time and O(V) space for values up to V.",
  trap="Chapter 21's n log n LIS with the tails array. It cannot enforce the \"differ by at most k\" rule, because tails forgets which earlier values produced each length; the range query over values keeps exactly that information.",
  py='''class Solution:
    def lengthOfLIS(self, nums: list[int], k: int) -> int:
        size = max(nums) + 1
        tree = [0] * (2 * size)        # iterative segment tree: leaves at size..2*size-1

        def query(lo, hi):             # max of best[v] for v in [lo, hi)
            res, lo, hi = 0, lo + size, hi + size
            while lo < hi:
                if lo & 1:
                    res = max(res, tree[lo]); lo += 1
                if hi & 1:
                    hi -= 1; res = max(res, tree[hi])
                lo, hi = lo // 2, hi // 2
            return res

        def update(i, val):
            i += size
            tree[i] = max(tree[i], val)
            while i > 1:
                i //= 2
                tree[i] = max(tree[2 * i], tree[2 * i + 1])

        for x in nums:
            update(x, query(max(0, x - k), x) + 1)   # best over [x - k, x - 1], plus x
        return tree[1]''',
  java='''class Solution {
    private int[] tree;
    private int size;

    public int lengthOfLIS(int[] nums, int k) {
        for (int x : nums) size = Math.max(size, x + 1);
        tree = new int[2 * size];      // iterative segment tree: leaves at size..2*size-1
        for (int x : nums) update(x, query(Math.max(0, x - k), x) + 1);   // best over [x-k, x-1]
        return tree[1];
    }

    private int query(int lo, int hi) {   // max over [lo, hi)
        int res = 0;
        for (lo += size, hi += size; lo < hi; lo >>= 1, hi >>= 1) {
            if ((lo & 1) == 1) res = Math.max(res, tree[lo++]);
            if ((hi & 1) == 1) res = Math.max(res, tree[--hi]);
        }
        return res;
    }

    private void update(int i, int val) {
        i += size;
        tree[i] = Math.max(tree[i], val);
        for (i >>= 1; i >= 1; i >>= 1) tree[i] = Math.max(tree[2 * i], tree[2 * i + 1]);
    }
}''')

prob(num=699, slug="falling-squares", title="Falling Squares", diff="Hard",
  method="fallingSquares",
  ask="Squares fall one at a time onto a line, each landing on whatever is highest beneath it. After each drop, report the tallest stack so far.",
  cue="A drop reads the maximum height over the square's span and raises that whole span to (maximum + side). \"Range max, then raise a range\" is the Lazy Propagation section's case, over coordinates compressed to the few distinct endpoints.",
  brute="Compare each square with every earlier one it overlaps: O(n²), fine at n = 1,000 and a good check.",
  approach="Compress all left edges and right edges to indices. Keep a segment tree of heights with a lazy \"raise to at least h\" tag. For each square [l, l + side), query the max over its compressed range, then apply \"raise to max + side\" over the same range; the new overall maximum is tree[1]. Raising to at least h is safe here because the new top is higher than everything beneath it.",
  cx="O(n log n) time, O(n) space.",
  trap="Treating touching squares as overlapping. A square covering [1, 3) and one starting at 3 only touch; using half-open spans keeps the second from landing on the first.",
  py='''class Solution:
    def fallingSquares(self, positions: list[list[int]]) -> list[int]:
        xs = sorted({x for l, s in positions for x in (l, l + s)})
        idx = {x: i for i, x in enumerate(xs)}   # compressed coordinates
        n = len(xs)
        tree, lazy = [0] * (4 * n), [0] * (4 * n)

        def push(node):                # hand a pending raise to the children
            for c in (2 * node, 2 * node + 1):
                tree[c] = max(tree[c], lazy[node])
                lazy[c] = max(lazy[c], lazy[node])
            lazy[node] = 0

        def query(node, lo, hi, l, r):     # max over [l, r) within the node's [lo, hi)
            if r <= lo or hi <= l:
                return 0
            if l <= lo and hi <= r:
                return tree[node]
            push(node)
            mid = (lo + hi) // 2
            return max(query(2 * node, lo, mid, l, r), query(2 * node + 1, mid, hi, l, r))

        def raise_to(node, lo, hi, l, r, h):
            if r <= lo or hi <= l:
                return
            if l <= lo and hi <= r:
                tree[node], lazy[node] = max(tree[node], h), max(lazy[node], h)   # lazily
                return
            push(node)
            mid = (lo + hi) // 2
            raise_to(2 * node, lo, mid, l, r, h)
            raise_to(2 * node + 1, mid, hi, l, r, h)
            tree[node] = max(tree[2 * node], tree[2 * node + 1])

        out = []
        for left, side in positions:
            l, r = idx[left], idx[left + side]     # half-open: touching is not overlapping
            top = query(1, 0, n, l, r) + side
            raise_to(1, 0, n, l, r, top)
            out.append(tree[1])
        return out''',
  java='''import java.util.*;

class Solution {
    private int[] tree, lazy;

    public List<Integer> fallingSquares(int[][] positions) {
        TreeSet<Integer> set = new TreeSet<>();
        for (int[] p : positions) { set.add(p[0]); set.add(p[0] + p[1]); }
        Map<Integer, Integer> idx = new HashMap<>();   // compressed coordinates
        for (int x : set) idx.put(x, idx.size());
        int n = idx.size();
        tree = new int[4 * n]; lazy = new int[4 * n];
        List<Integer> out = new ArrayList<>();
        for (int[] p : positions) {
            int l = idx.get(p[0]), r = idx.get(p[0] + p[1]);   // half-open span
            int top = query(1, 0, n, l, r) + p[1];
            raise(1, 0, n, l, r, top);
            out.add(tree[1]);
        }
        return out;
    }

    private void push(int node) {      // hand a pending raise to the children
        for (int c = 2 * node; c <= 2 * node + 1; c++) {
            tree[c] = Math.max(tree[c], lazy[node]);
            lazy[c] = Math.max(lazy[c], lazy[node]);
        }
        lazy[node] = 0;
    }

    private int query(int node, int lo, int hi, int l, int r) {
        if (r <= lo || hi <= l) return 0;
        if (l <= lo && hi <= r) return tree[node];
        push(node);
        int mid = (lo + hi) / 2;
        return Math.max(query(2 * node, lo, mid, l, r), query(2 * node + 1, mid, hi, l, r));
    }

    private void raise(int node, int lo, int hi, int l, int r, int h) {
        if (r <= lo || hi <= l) return;
        if (l <= lo && hi <= r) { tree[node] = Math.max(tree[node], h); lazy[node] = Math.max(lazy[node], h); return; }
        push(node);
        int mid = (lo + hi) / 2;
        raise(2 * node, lo, mid, l, r, h);
        raise(2 * node + 1, mid, hi, l, r, h);
        tree[node] = Math.max(tree[2 * node], tree[2 * node + 1]);
    }
}''')

prob(num=715, slug="range-module", title="Range Module", diff="Hard", design=True,
  ask="Track a set of real numbers under three operations on half-open ranges [left, right): add the range, remove it, and ask whether the whole range is tracked.",
  cue="Coordinates reach 10⁹, so the Dynamic, Implicit and Persistent section's options are a segment tree created only where it is touched, or no tree at all. A sorted list of boundaries is enough: a point is tracked exactly when an odd number of boundaries lie at or before it.",
  brute="Store every tracked integer point: impossible at 10⁹.",
  approach="Keep bounds, a sorted list [s₀, e₀, s₁, e₁, …] of disjoint tracked ranges. addRange(l, r): find i = first index with bounds[i] ≥ l and j = first index with bounds[j] &gt; r, and replace bounds[i:j] with l if i is even and r if j is even (those are the new outer edges). removeRange is the same with i and j both taken as the first index ≥ the endpoint and the parities flipped. queryRange(l, r) is true when l and r - 1 sit inside the same tracked range: the counts of boundaries ≤ l and &lt; r are equal and odd.",
  cx="O(log n) to locate plus O(n) for the list splice per call; with 10⁴ calls that is fast. A dynamic segment tree makes every call O(log C) for coordinate range C.",
  trap="Mixing closed and half-open ends. With [left, right) ranges, adding [1, 3) and [3, 5) must merge into [1, 5), which the \"first index &gt; r\" in addRange does, while removing [3, 5) from [1, 5) must leave [1, 3).",
  py='''from bisect import bisect_left, bisect_right

class RangeModule:
    def __init__(self):
        self.bounds = []               # [s0, e0, s1, e1, ...]: disjoint tracked ranges

    def addRange(self, left: int, right: int) -> None:
        i, j = bisect_left(self.bounds, left), bisect_right(self.bounds, right)
        mid = ([left] if i % 2 == 0 else []) + ([right] if j % 2 == 0 else [])
        self.bounds[i:j] = mid         # an even index means we are outside a range there

    def queryRange(self, left: int, right: int) -> bool:
        i, j = bisect_right(self.bounds, left), bisect_left(self.bounds, right)
        return i == j and i % 2 == 1   # both ends inside the same tracked range

    def removeRange(self, left: int, right: int) -> None:
        i, j = bisect_left(self.bounds, left), bisect_left(self.bounds, right)
        mid = ([left] if i % 2 == 1 else []) + ([right] if j % 2 == 1 else [])
        self.bounds[i:j] = mid''',
  java='''import java.util.*;

class RangeModule {
    private final List<Integer> bounds = new ArrayList<>();   // [s0, e0, s1, e1, ...]

    public RangeModule() {}

    private int firstAtLeast(int x) {  // first index with bounds[i] >= x
        int lo = 0, hi = bounds.size();
        while (lo < hi) { int m = (lo + hi) >>> 1; if (bounds.get(m) < x) lo = m + 1; else hi = m; }
        return lo;
    }

    private int firstAbove(int x) { return firstAtLeast(x + 1); }   // first index with bounds[i] > x

    private void splice(int i, int j, List<Integer> mid) {
        bounds.subList(i, j).clear();
        bounds.addAll(i, mid);
    }

    public void addRange(int left, int right) {
        int i = firstAtLeast(left), j = firstAbove(right);
        List<Integer> mid = new ArrayList<>();
        if (i % 2 == 0) mid.add(left);     // even: outside a range there
        if (j % 2 == 0) mid.add(right);
        splice(i, j, mid);
    }

    public boolean queryRange(int left, int right) {
        int i = firstAbove(left), j = firstAtLeast(right);
        return i == j && i % 2 == 1;       // both ends inside the same range
    }

    public void removeRange(int left, int right) {
        int i = firstAtLeast(left), j = firstAtLeast(right);
        List<Integer> mid = new ArrayList<>();
        if (i % 2 == 1) mid.add(left);
        if (j % 2 == 1) mid.add(right);
        splice(i, j, mid);
    }
}''')

prob(num=218, slug="the-skyline-problem", title="The Skyline Problem", diff="Hard",
  method="getSkyline",
  ask="Given rectangular buildings [left, right, height], return the key points where the skyline's height changes, as [x, height] pairs from left to right.",
  cue="Sweep the x-axis (Chapter 12). At each building edge, the skyline is the tallest building still standing: a max-heap of (height, right edge), where buildings that have ended are removed lazily when they reach the top. The Beyond Arrays section solves the same problem with a segment tree over compressed x.",
  brute="At every edge coordinate, scan all buildings for the tallest one covering it: O(n²).",
  approach="Make events: each building's left edge (adding it) and every right edge (a point where heights may drop). Sort them by x, with taller starts first at the same x. Keep a max-heap of (height, right) seeded with the ground (0, infinity). At each event, pop buildings whose right edge is at or before x, push the starting building if any, and if the tallest height differs from the last key point's height, record [x, height].",
  cx="O(n log n) time, O(n) space.",
  trap="Removing a building from the heap the moment it ends. A binary heap cannot delete from the middle cheaply; lazy deletion (discard it when it surfaces at the top) keeps every step O(log n). In Java, keep right edges in a long so the ground's \"infinity\" is larger than any real edge, which can be 2³¹ - 1.",
  py='''import heapq

class Solution:
    def getSkyline(self, buildings: list[list[int]]) -> list[list[int]]:
        events = sorted([(l, -h, r) for l, r, h in buildings] +     # starts: taller first
                        [(r, 0, 0) for _, r, _ in buildings])        # ends
        out, live = [[0, 0]], [(0, float("inf"))]                   # (-height, right); ground
        for x, neg_h, r in events:
            while live[0][1] <= x:
                heapq.heappop(live)    # lazy deletion: it ended already
            if neg_h:
                heapq.heappush(live, (neg_h, r))
            if out[-1][1] != -live[0][0]:
                out.append([x, -live[0][0]])   # the height changed here
        return out[1:]''',
  java='''import java.util.*;

class Solution {
    public List<List<Integer>> getSkyline(int[][] buildings) {
        List<long[]> events = new ArrayList<>();   // {x, -height, right}; ends have height 0
        for (int[] b : buildings) {
            events.add(new long[]{b[0], -b[2], b[1]});
            events.add(new long[]{b[1], 0, 0});
        }
        events.sort((a, b) -> a[0] != b[0] ? Long.compare(a[0], b[0]) : Long.compare(a[1], b[1]));   // taller starts first
        PriorityQueue<long[]> live = new PriorityQueue<>((a, b) -> Long.compare(b[0], a[0]));   // {height, right}
        live.add(new long[]{0, Long.MAX_VALUE});   // the ground; long: rights reach 2^31 - 1
        List<List<Integer>> out = new ArrayList<>();
        long last = 0;
        for (long[] e : events) {
            while (live.peek()[1] <= e[0]) live.poll();   // lazy deletion
            if (e[1] != 0) live.add(new long[]{-e[1], e[2]});
            long h = live.peek()[0];
            if (h != last) { out.add(List.of((int) e[0], (int) h)); last = h; }   // the height changed
        }
        return out;
    }
}''', check_args=False)

prob(num=850, slug="rectangle-area-ii", title="Rectangle Area II", diff="Hard",
  method="rectangleArea",
  ask="Return the total area covered by a set of axis-aligned rectangles (overlaps counted once), modulo 1,000,000,007.",
  cue="Sweep a vertical line across x. Between consecutive x events, the covered area is (covered length on y) × (width). The covered length under many overlapping intervals is kept by a segment tree over compressed y that stores, per node, how many rectangles cover it fully and the length it covers.",
  brute="Cut the plane into the grid of compressed cells and mark each cell covered by some rectangle: O(n³) with n rectangles, fine at n = 200.",
  approach="Compress the y coordinates. For each rectangle, make two events: at x₁ add +1 over [y₁, y₂), at x₂ add -1. Sort events by x. Before applying each event, add covered × (x - previous x) to the area. In the segment tree, a node whose count is positive covers its whole y-span; otherwise it covers the sum of its children's covered lengths (0 for a leaf).",
  cx="O(n log n) time and O(n) space.",
  trap="Overflow. Coordinates reach 10⁹, so one slab's area reaches 10¹⁸: multiply in 64-bit arithmetic (a long in Java; Python's int is unbounded), and reduce the running total modulo 1,000,000,007 as you go. A 32-bit int overflows on the first large slab.",
  py='''class Solution:
    def rectangleArea(self, rectangles: list[list[int]]) -> int:
        ys = sorted({y for r in rectangles for y in (r[1], r[3])})
        yi = {y: i for i, y in enumerate(ys)}
        m = len(ys) - 1                # elementary y-intervals
        count, covered = [0] * (4 * m), [0] * (4 * m)

        def update(node, lo, hi, l, r, delta):   # node covers ys[lo]..ys[hi]
            if r <= lo or hi <= l:
                return
            if l <= lo and hi <= r:
                count[node] += delta
            else:
                mid = (lo + hi) // 2
                update(2 * node, lo, mid, l, r, delta)
                update(2 * node + 1, mid, hi, l, r, delta)
            if count[node] > 0:
                covered[node] = ys[hi] - ys[lo]  # fully covered by some rectangle
            elif hi - lo == 1:
                covered[node] = 0
            else:
                covered[node] = covered[2 * node] + covered[2 * node + 1]

        events = sorted([(x1, 1, y1, y2) for x1, y1, x2, y2 in rectangles] +
                        [(x2, -1, y1, y2) for x1, y1, x2, y2 in rectangles])
        area, prev_x = 0, events[0][0]
        for x, delta, y1, y2 in events:
            area += covered[1] * (x - prev_x)   # the slab since the last event
            update(1, 0, m, yi[y1], yi[y2], delta)
            prev_x = x
        return area % (10**9 + 7)''',
  java='''import java.util.*;

class Solution {
    private int[] count;
    private long[] covered;
    private int[] ys;

    public int rectangleArea(int[][] rectangles) {
        TreeSet<Integer> set = new TreeSet<>();
        for (int[] r : rectangles) { set.add(r[1]); set.add(r[3]); }
        ys = set.stream().mapToInt(Integer::intValue).toArray();
        Map<Integer, Integer> yi = new HashMap<>();
        for (int i = 0; i < ys.length; i++) yi.put(ys[i], i);
        int m = ys.length - 1;
        count = new int[4 * m]; covered = new long[4 * m];
        List<int[]> events = new ArrayList<>();   // {x, delta, y1, y2}
        for (int[] r : rectangles) {
            events.add(new int[]{r[0], 1, r[1], r[3]});
            events.add(new int[]{r[2], -1, r[1], r[3]});
        }
        events.sort((a, b) -> Integer.compare(a[0], b[0]));
        long area = 0;
        int prevX = events.get(0)[0];
        for (int[] e : events) {
            area = (area + covered[1] % 1_000_000_007 * (e[0] - prevX)) % 1_000_000_007;   // long slab
            update(1, 0, m, yi.get(e[2]), yi.get(e[3]), e[1]);
            prevX = e[0];
        }
        return (int) area;
    }

    private void update(int node, int lo, int hi, int l, int r, int delta) {   // node covers ys[lo..hi]
        if (r <= lo || hi <= l) return;
        if (l <= lo && hi <= r) count[node] += delta;
        else {
            int mid = (lo + hi) / 2;
            update(2 * node, lo, mid, l, r, delta);
            update(2 * node + 1, mid, hi, l, r, delta);
        }
        if (count[node] > 0) covered[node] = ys[hi] - ys[lo];   // fully covered
        else if (hi - lo == 1) covered[node] = 0;
        else covered[node] = covered[2 * node] + covered[2 * node + 1];
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(31)
def arr(lo, hi, nmin=1, nmax=9): return [R.randint(lo, hi) for _ in range(R.randint(nmin, nmax))]

def brute2407(a, k):
    best = [1] * len(a)
    for i in range(len(a)):
        for j in range(i):
            if 0 < a[i] - a[j] <= k: best[i] = max(best[i], best[j] + 1)
    return max(best)

def gen699():
    return [[[R.randint(1, 10), R.randint(1, 4)] for _ in range(R.randint(1, 7))]]
def brute699(pos):
    landed, out, top = [], [], 0
    for l, s in pos:
        base = max([h for a, b, h in landed if a < l + s and l < b] or [0])
        landed.append((l, l + s, base + s)); top = max(top, base + s); out.append(top)
    return out

def gen715():
    ops, args = ["RangeModule"], [[]]
    for _ in range(R.randint(1, 14)):
        op = R.choice(["addRange", "addRange", "queryRange", "removeRange"])
        l = R.randint(1, 12); ops.append(op); args.append([l, R.randint(l + 1, 14)])
    return ops, args
def brute715(ops, args):
    pts, res = set(), [None]
    for op, (l, r) in zip(ops[1:], args[1:]):
        cells = set(range(l, r))       # unit cells [x, x+1) stand in for the reals here
        if op == "addRange": pts |= cells; res.append(None)
        elif op == "removeRange": pts -= cells; res.append(None)
        else: res.append(cells <= pts)
    return res

def gen218():
    bs = []
    for _ in range(R.randint(1, 6)):
        l = R.randint(0, 10); bs.append([l, R.randint(l + 1, 12), R.randint(1, 6)])
    return [sorted(bs)]
def brute218(bs):
    xs = sorted({x for l, r, h in bs for x in (l, r)})
    out, last = [], 0
    for x in xs:
        h = max([hh for l, r, hh in bs if l <= x < r] or [0])
        if h != last: out.append([x, h]); last = h
    return out

def gen850():
    rs = []
    for _ in range(R.randint(1, 5)):
        x1, y1 = R.randint(0, 8), R.randint(0, 8)
        rs.append([x1, y1, R.randint(x1 + 1, 10), R.randint(y1 + 1, 10)])
    if R.random() < 0.1: rs.append([0, 0, 10**9, 10**9])   # one huge rectangle: 64-bit slabs
    return [rs]
def brute850(rs):
    if any(r[2] > 100 for r in rs):    # the huge case: everything else sits inside it
        return (10**9 * 10**9) % MOD
    return sum(1 for x in range(10) for y in range(10) if any(a <= x < c and b <= y < d for a, b, c, d in rs)) % MOD

BRUTE = {
  2407: (lambda: [arr(1, 12), R.randint(1, 4)], brute2407),
  699:  (gen699, brute699),
  715:  (gen715, brute715),
  218:  (gen218, brute218),
  850:  (gen850, brute850),
}
