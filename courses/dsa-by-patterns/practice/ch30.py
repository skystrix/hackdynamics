# Chapter 30 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
# The Fenwick tree in every solution is 1-indexed: tree[i] covers the last (i & -i) positions ending at i.
import random
from itertools import combinations

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

MOD = 10**9 + 7

# ---------------------------------------------------------------- Medium
prob(num=307, slug="range-sum-query-mutable", title="Range Sum Query - Mutable", diff="Medium", design=True,
  ask="Support updating an array element and summing any range, both fast.",
  cue="Chapter 9's prefix array answers a range sum in O(1) but costs O(n) per update. The Update/Query Trade-off section's middle point, the Fenwick tree, does both in O(log n).",
  brute="Update in place and sum the range with a loop: O(1) update, O(n) query.",
  approach="Keep the array and a Fenwick tree over it. To set index i to val, add (val - old) at position i + 1 in the tree: walk i += i &amp; -i, adding the change. A prefix sum walks i -= i &amp; -i, adding tree[i]. A range sum is prefix(right + 1) - prefix(left).",
  cx="O(n log n) to build by repeated adds (O(n) is possible), O(log n) per update and per query, O(n) space.",
  trap="Adding val instead of the difference. The tree stores sums, so an update must add the change from the old value, which means remembering the current array.",
  py='''class NumArray:
    def __init__(self, nums: list[int]):
        self.nums = [0] * len(nums)
        self.tree = [0] * (len(nums) + 1)   # 1-indexed Fenwick tree
        for i, x in enumerate(nums):
            self.update(i, x)

    def _add(self, i, delta):
        i += 1
        while i < len(self.tree):
            self.tree[i] += delta
            i += i & -i                # the next node that covers position i

    def _prefix(self, i):              # sum of the first i elements
        s = 0
        while i > 0:
            s += self.tree[i]
            i -= i & -i                # drop the lowest set bit
        return s

    def update(self, index: int, val: int) -> None:
        self._add(index, val - self.nums[index])   # the change, not the value
        self.nums[index] = val

    def sumRange(self, left: int, right: int) -> int:
        return self._prefix(right + 1) - self._prefix(left)''',
  java='''class NumArray {
    private final int[] nums, tree;    // tree: 1-indexed Fenwick tree

    public NumArray(int[] nums) {
        this.nums = new int[nums.length];
        tree = new int[nums.length + 1];
        for (int i = 0; i < nums.length; i++) update(i, nums[i]);
    }

    private void add(int i, int delta) {
        for (i++; i < tree.length; i += i & -i) tree[i] += delta;   // nodes covering i
    }

    private int prefix(int i) {        // sum of the first i elements
        int s = 0;
        for (; i > 0; i -= i & -i) s += tree[i];   // drop the lowest set bit
        return s;
    }

    public void update(int index, int val) {
        add(index, val - nums[index]); // the change, not the value
        nums[index] = val;
    }

    public int sumRange(int left, int right) { return prefix(right + 1) - prefix(left); }
}''')

prob(num=1395, slug="count-number-of-teams", title="Count Number of Teams", diff="Medium",
  method="numTeams",
  ask="Count the triples i &lt; j &lt; k whose (distinct) ratings are strictly increasing or strictly decreasing.",
  cue="Fix the middle soldier j. The increasing teams through j number (smaller on the left) × (larger on the right), and the decreasing ones (larger on the left) × (smaller on the right). A Fenwick tree over ratings counts \"smaller on the left\" as you sweep.",
  brute="Try every triple: O(n³).",
  approach="Compress the ratings to ranks 1..n. Sweep left to right with a Fenwick tree of ranks seen: before inserting j, smaller-left = prefix(rank - 1) and larger-left = j - smaller-left. The right-side counts follow: smaller-right = (rank - 1) - smaller-left and larger-right = (n - rank) - larger-left. Add both products.",
  cx="O(n log n) time, O(n) space. (Counting both sides with plain loops for each j is O(n²), also fine at this problem's size.)",
  trap="Counting only increasing teams. Decreasing ones count too, and they use the other two counts.",
  py='''class Solution:
    def numTeams(self, rating: list[int]) -> int:
        n = len(rating)
        rank = {r: i + 1 for i, r in enumerate(sorted(rating))}   # compress to 1..n
        tree = [0] * (n + 1)
        teams = 0
        for j, r in enumerate(rating):
            k, smaller_left = rank[r] - 1, 0
            while k > 0:
                smaller_left += tree[k]
                k -= k & -k
            larger_left = j - smaller_left
            smaller_right = (rank[r] - 1) - smaller_left
            larger_right = (n - rank[r]) - larger_left
            teams += smaller_left * larger_right + larger_left * smaller_right   # up, and down
            k = rank[r]
            while k <= n:
                tree[k] += 1
                k += k & -k
        return teams''',
  java='''import java.util.*;

class Solution {
    public int numTeams(int[] rating) {
        int n = rating.length;
        int[] sorted = rating.clone();
        Arrays.sort(sorted);
        int[] tree = new int[n + 1];
        int teams = 0;
        for (int j = 0; j < n; j++) {
            int rank = Arrays.binarySearch(sorted, rating[j]) + 1;   // compress to 1..n
            int smallerLeft = 0;
            for (int k = rank - 1; k > 0; k -= k & -k) smallerLeft += tree[k];
            int largerLeft = j - smallerLeft;
            int smallerRight = (rank - 1) - smallerLeft, largerRight = (n - rank) - largerLeft;
            teams += smallerLeft * largerRight + largerLeft * smallerRight;   // up, and down
            for (int k = rank; k <= n; k += k & -k) tree[k]++;
        }
        return teams;
    }
}''')

prob(num=1438, slug="longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit", title="Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit", diff="Medium",
  method="longestSubarray",
  ask="Find the longest block of consecutive values whose maximum and minimum differ by at most a limit.",
  cue="A variable window (Chapter 8) whose validity depends on the window's max and min. The Sparse Table and Idempotence section answers \"max (or min) of any range\" in O(1) after O(n log n) preprocessing, because max and min tolerate overlapping halves.",
  brute="Check every block's max and min: O(n²) even with running values.",
  approach="Build sparse tables for max and min: level j stores the answer for every range of length 2ʲ. A range [l, r] is covered by two overlapping blocks of length 2ᵏ, with k the largest power fitting, so its max is the larger of two lookups. Slide a window: extend r, and while the window's max - min exceeds the limit, advance l. Track the longest window.",
  cx="O(n log n) time and space for the tables, O(n) for the sweep. (Chapter 10's monotonic deques give O(n) overall.)",
  trap="Using a sparse table for sums. Sums are not idempotent: the two overlapping halves would count the middle twice. That is why this structure is for max, min and gcd, and the Fenwick tree is for sums.",
  py='''class Solution:
    def longestSubarray(self, nums: list[int], limit: int) -> int:
        n = len(nums)
        hi, lo = [nums[:]], [nums[:]]  # level j: max / min of nums[i : i + 2^j]
        j = 1
        while 1 << j <= n:
            half = 1 << (j - 1)
            hi.append([max(hi[-1][i], hi[-1][i + half]) for i in range(n - (1 << j) + 1)])
            lo.append([min(lo[-1][i], lo[-1][i + half]) for i in range(n - (1 << j) + 1)])
            j += 1

        def spread(l, r):              # max - min of nums[l..r]: two overlapping blocks
            k = (r - l + 1).bit_length() - 1
            return max(hi[k][l], hi[k][r - (1 << k) + 1]) - min(lo[k][l], lo[k][r - (1 << k) + 1])

        best = l = 0
        for r in range(n):
            while spread(l, r) > limit:
                l += 1
            best = max(best, r - l + 1)
        return best''',
  java='''class Solution {
    public int longestSubarray(int[] nums, int limit) {
        int n = nums.length, levels = 32 - Integer.numberOfLeadingZeros(n);
        int[][] hi = new int[levels][], lo = new int[levels][];   // level j: max / min over 2^j
        hi[0] = nums.clone(); lo[0] = nums.clone();
        for (int j = 1; j < levels; j++) {
            int len = n - (1 << j) + 1, half = 1 << (j - 1);
            hi[j] = new int[len]; lo[j] = new int[len];
            for (int i = 0; i < len; i++) {
                hi[j][i] = Math.max(hi[j - 1][i], hi[j - 1][i + half]);
                lo[j][i] = Math.min(lo[j - 1][i], lo[j - 1][i + half]);
            }
        }
        int best = 0, l = 0;
        for (int r = 0; r < n; r++) {
            while (true) {             // max - min of nums[l..r]: two overlapping blocks
                int k = 31 - Integer.numberOfLeadingZeros(r - l + 1), s = r - (1 << k) + 1;
                long spread = (long) Math.max(hi[k][l], hi[k][s]) - Math.min(lo[k][l], lo[k][s]);
                if (spread <= limit) break;
                l++;
            }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=1649, slug="create-sorted-array-through-instructions", title="Create Sorted Array through Instructions", diff="Hard",
  method="createSortedArray",
  ask="Insert numbers one at a time into a sorted container. Each insertion costs the smaller of (how many existing values are strictly less) and (how many are strictly greater). Return the total cost modulo 1,000,000,007.",
  cue="Each cost is two counting queries over values seen so far, followed by a point update: a Fenwick tree indexed by value.",
  brute="Keep a sorted list and count by scanning: O(n) per insertion, O(n²) overall.",
  approach="Keep a Fenwick tree over values 1..max. For the i-th insertion of x, less = prefix(x - 1) and greater = i - prefix(x), where i values are already inserted. Add min(less, greater) to the total, then add 1 at x.",
  cx="O(n log V) time and O(V) space for values up to V.",
  trap="Computing greater as i - less. That counts copies of x as greater; greater must exclude values equal to x, which is why it uses prefix(x), not prefix(x - 1).",
  py='''class Solution:
    def createSortedArray(self, instructions: list[int]) -> int:
        MOD = 10**9 + 7
        size = max(instructions)
        tree = [0] * (size + 1)        # Fenwick tree indexed by value

        def prefix(i):
            s = 0
            while i > 0:
                s += tree[i]
                i -= i & -i
            return s

        cost = 0
        for i, x in enumerate(instructions):
            less = prefix(x - 1)
            greater = i - prefix(x)    # excludes copies of x
            cost += min(less, greater)
            while x <= size:
                tree[x] += 1
                x += x & -x
        return cost % MOD''',
  java='''class Solution {
    public int createSortedArray(int[] instructions) {
        int size = 0;
        for (int x : instructions) size = Math.max(size, x);
        int[] tree = new int[size + 1];   // Fenwick tree indexed by value
        long cost = 0;
        for (int i = 0; i < instructions.length; i++) {
            int x = instructions[i], less = 0, upToX = 0;
            for (int k = x - 1; k > 0; k -= k & -k) less += tree[k];
            for (int k = x; k > 0; k -= k & -k) upToX += tree[k];
            cost += Math.min(less, i - upToX);   // greater excludes copies of x
            for (int k = x; k <= size; k += k & -k) tree[k]++;
        }
        return (int) (cost % 1_000_000_007);
    }
}''')

prob(num=2179, slug="count-good-triplets-in-an-array", title="Count Good Triplets in an Array", diff="Hard",
  method="goodTriplets",
  ask="Two arrays are both permutations of 0..n-1. Count the value triples (x, y, z) that appear in increasing position order in both arrays.",
  cue="Relabel each value by its position in nums2; then walk nums1. A good triple is an increasing triple of labels, and for each middle element the count is (smaller labels before it) × (larger labels after it), which a Fenwick tree gives in one sweep.",
  brute="Try every triple of values and check both orders: O(n³).",
  approach="Let pos2[v] be v's index in nums2 and a[i] = pos2[nums1[i]]. Sweep i left to right with a Fenwick tree of labels seen: smaller_before = prefix(a[i]). The labels larger than a[i] number n - 1 - a[i] in total, of which i - smaller_before are already behind, so larger_after = (n - 1 - a[i]) - (i - smaller_before). Add smaller_before × larger_after.",
  cx="O(n log n) time, O(n) space.",
  trap="Overflow: the count reaches about n³/6, far beyond int, which is why the Java signature returns long; multiply in long.",
  py='''class Solution:
    def goodTriplets(self, nums1: list[int], nums2: list[int]) -> int:
        n = len(nums1)
        pos2 = [0] * n
        for i, v in enumerate(nums2):
            pos2[v] = i
        tree = [0] * (n + 1)
        total = 0
        for i, v in enumerate(nums1):
            a = pos2[v]                # the label: v's position in nums2
            k, smaller_before = a, 0
            while k > 0:
                smaller_before += tree[k]
                k -= k & -k
            larger_after = (n - 1 - a) - (i - smaller_before)
            total += smaller_before * larger_after
            k = a + 1
            while k <= n:
                tree[k] += 1
                k += k & -k
        return total''',
  java='''class Solution {
    public long goodTriplets(int[] nums1, int[] nums2) {
        int n = nums1.length;
        int[] pos2 = new int[n], tree = new int[n + 1];
        for (int i = 0; i < n; i++) pos2[nums2[i]] = i;
        long total = 0;                // long: the count reaches about n^3 / 6
        for (int i = 0; i < n; i++) {
            int a = pos2[nums1[i]], smallerBefore = 0;   // the label: position in nums2
            for (int k = a; k > 0; k -= k & -k) smallerBefore += tree[k];
            long largerAfter = (n - 1 - a) - (i - smallerBefore);
            total += smallerBefore * largerAfter;
            for (int k = a + 1; k <= n; k += k & -k) tree[k]++;
        }
        return total;
    }
}''')

prob(num=2426, slug="number-of-pairs-satisfying-inequality", title="Number of Pairs Satisfying Inequality", diff="Hard",
  method="numberOfPairs",
  ask="Count the pairs i &lt; j with nums1[i] - nums1[j] ≤ nums2[i] - nums2[j] + diff.",
  cue="Move the i terms to one side: with a[k] = nums1[k] - nums2[k], the condition is a[i] ≤ a[j] + diff. For each j, count the earlier a[i] at most a[j] + diff: a Fenwick tree over (shifted) values of a.",
  brute="Check every pair: O(n²).",
  approach="Compute a. Sweep j left to right: query how many earlier values are ≤ a[j] + diff, then insert a[j]. Values of a can be negative, so shift them by a constant to make every tree index positive, and clamp the query bound to the tree's range.",
  cx="O(n log V) time for a value range V, O(V) space.",
  trap="Rearranging the inequality with the sides mixed up, which counts pairs the wrong way round. And negative values need the shift before they can index the tree; a negative index silently corrupts it.",
  py='''class Solution:
    def numberOfPairs(self, nums1: list[int], nums2: list[int], diff: int) -> int:
        a = [x - y for x, y in zip(nums1, nums2)]   # condition: a[i] <= a[j] + diff
        lo = min(a) - 1                # shift: every index becomes positive
        size = max(a) - lo
        tree = [0] * (size + 1)
        pairs = 0
        for v in a:
            k = min(v + diff - lo, size)   # count earlier values <= v + diff
            while k > 0:
                pairs += tree[k]
                k -= k & -k
            k = v - lo
            while k <= size:
                tree[k] += 1
                k += k & -k
        return pairs''',
  java='''class Solution {
    public long numberOfPairs(int[] nums1, int[] nums2, int diff) {
        int n = nums1.length, min = Integer.MAX_VALUE, max = Integer.MIN_VALUE;
        int[] a = new int[n];
        for (int i = 0; i < n; i++) {  // condition: a[i] <= a[j] + diff
            a[i] = nums1[i] - nums2[i];
            min = Math.min(min, a[i]); max = Math.max(max, a[i]);
        }
        int lo = min - 1, size = max - lo;   // shift: indices become positive
        int[] tree = new int[size + 1];
        long pairs = 0;
        for (int v : a) {
            for (int k = Math.min(v + diff - lo, size); k > 0; k -= k & -k) pairs += tree[k];
            for (int k = v - lo; k <= size; k += k & -k) tree[k]++;
        }
        return pairs;
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(30)
def arr(lo, hi, nmin=1, nmax=9): return [R.randint(lo, hi) for _ in range(R.randint(nmin, nmax))]

def gen307():
    nums = arr(-9, 9); ops, args = ["NumArray"], [[nums]]
    for _ in range(R.randint(1, 10)):
        if R.random() < 0.5: ops.append("update"); args.append([R.randrange(len(nums)), R.randint(-9, 9)])
        else:
            l = R.randrange(len(nums)); ops.append("sumRange"); args.append([l, R.randrange(l, len(nums))])
    return ops, args
def brute307(ops, args):
    a, res = list(args[0][0]), [None]
    for op, x in zip(ops[1:], args[1:]):
        if op == "update": a[x[0]] = x[1]; res.append(None)
        else: res.append(sum(a[x[0]:x[1] + 1]))
    return res

def brute1395(r):
    return sum(1 for i, j, k in combinations(range(len(r)), 3) if r[i] < r[j] < r[k] or r[i] > r[j] > r[k])

def brute1438(a, limit):
    return max(j - i for i in range(len(a)) for j in range(i + 1, len(a) + 1) if max(a[i:j]) - min(a[i:j]) <= limit)

def brute1649(ins):
    seen, cost = [], 0
    for x in ins:
        cost += min(sum(1 for y in seen if y < x), sum(1 for y in seen if y > x)); seen.append(x)
    return cost % MOD

def gen2179():
    n = R.randint(3, 8); a = list(range(n)); b = list(range(n)); R.shuffle(a); R.shuffle(b); return [a, b]
def brute2179(a, b):
    pa, pb = {v: i for i, v in enumerate(a)}, {v: i for i, v in enumerate(b)}
    return sum(1 for x, y, z in combinations(range(len(a)), 3)
               for t in [(a[x], a[y], a[z])] if pb[t[0]] < pb[t[1]] < pb[t[2]])

def gen2426():
    n = R.randint(2, 8); return [[R.randint(-6, 6) for _ in range(n)], [R.randint(-6, 6) for _ in range(n)], R.randint(-5, 5)]
def brute2426(a, b, d):
    return sum(1 for i, j in combinations(range(len(a)), 2) if a[i] - a[j] <= b[i] - b[j] + d)

BRUTE = {
  307:  (gen307, brute307),
  1395: (lambda: [R.sample(range(1, 30), R.randint(3, 8))], brute1395),
  1438: (lambda: [arr(1, 10), R.randint(0, 5)], brute1438),
  1649: (lambda: [arr(1, 8, 1, 10)], brute1649),
  2179: (gen2179, brute2179),
  2426: (gen2426, brute2426),
}
