# Chapter 19 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
import math, random
from functools import lru_cache
from itertools import combinations

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

# ---------------------------------------------------------------- Easy
prob(num=70, slug="climbing-stairs", title="Climbing Stairs", diff="Easy",
  method="climbStairs",
  ask="You climb a staircase of n steps, one or two steps at a time. Count the distinct ways to reach the top.",
  cue="Your last move was either one step or two, so ways(n) = ways(n - 1) + ways(n - 2). That recursion repeats the same subproblems exponentially often: the chapter's opening picture of a tree that repeats itself.",
  brute="The plain recursion: about 1.6ⁿ calls, roughly 3.7 billion at n = 45 (the problem's limit).",
  approach="SRTBOT: subproblem ways(i) for the number of ways to reach step i; relate ways(i) = ways(i - 1) + ways(i - 2); topological order i increasing; base cases ways(0) = ways(1) = 1; original problem ways(n); time O(n). Only the last two values are ever needed, so keep two variables (the Rolling Array section).",
  cx="O(n) time, O(1) space.",
  trap="Recognizing it as \"Fibonacci\" and stopping there. The point of the exercise is to derive the relation from the last move, because the same derivation handles one, two or three steps, or any set of allowed step sizes.",
  py='''class Solution:
    def climbStairs(self, n: int) -> int:
        a, b = 1, 1                    # ways(0), ways(1)
        for _ in range(n - 1):
            a, b = b, a + b            # ways(i) = ways(i - 1) + ways(i - 2)
        return b''',
  java='''class Solution {
    public int climbStairs(int n) {
        int a = 1, b = 1;              // ways(0), ways(1)
        for (int i = 1; i < n; i++) {
            int next = a + b;          // ways(i) = ways(i - 1) + ways(i - 2)
            a = b;
            b = next;
        }
        return b;
    }
}''')

prob(num=746, slug="min-cost-climbing-stairs", title="Min Cost Climbing Stairs", diff="Easy",
  method="minCostClimbingStairs",
  ask="Step i costs cost[i] to leave, and each move climbs one or two steps. Starting from step 0 or 1, find the cheapest way past the last step.",
  cue="Climbing Stairs with costs: the same two predecessors, but take the minimum instead of the sum.",
  brute="Try every sequence of one- and two-step moves: exponential.",
  approach="Let best(i) be the cheapest cost to stand on step i. You can start on step 0 or 1 for free, so best(0) = best(1) = 0, and best(i) = min(best(i - 1) + cost[i - 1], best(i - 2) + cost[i - 2]). The answer is best(n), the step past the top. Keep only the last two values.",
  cx="O(n) time, O(1) space.",
  trap="Treating the last step as the top. The top is one past the last step, so the answer is best(n), not best(n - 1).",
  py='''class Solution:
    def minCostClimbingStairs(self, cost: list[int]) -> int:
        a, b = 0, 0                    # best(0), best(1): both starts are free
        for i in range(2, len(cost) + 1):   # up to n: the top is past the last step
            a, b = b, min(b + cost[i - 1], a + cost[i - 2])
        return b''',
  java='''class Solution {
    public int minCostClimbingStairs(int[] cost) {
        int a = 0, b = 0;              // best(0), best(1): both starts are free
        for (int i = 2; i <= cost.length; i++) {   // the top is past the last step
            int next = Math.min(b + cost[i - 1], a + cost[i - 2]);
            a = b;
            b = next;
        }
        return b;
    }
}''')

prob(num=118, slug="pascals-triangle", title="Pascal's Triangle", diff="Easy",
  method="generate",
  ask="Return the first numRows rows of Pascal's triangle, where each inner number is the sum of the two above it.",
  cue="Tabulation in its simplest form: each row is computed from the previous one, in order, and every cell is filled once.",
  brute="Compute each entry as a binomial coefficient C(r, c) from factorials: correct, but it recomputes large products the table gives you for free.",
  approach="Start with [1]. Each next row begins and ends with 1, and its inner entry c is previous[c - 1] + previous[c].",
  cx="O(numRows²) time and output size.",
  trap="Building each row by modifying the previous row in place and appending the same list object again. All rows then alias one list. Build a new list per row.",
  py='''class Solution:
    def generate(self, numRows: int) -> list[list[int]]:
        rows = [[1]]
        for _ in range(numRows - 1):
            prev = rows[-1]
            rows.append([1] + [prev[c - 1] + prev[c] for c in range(1, len(prev))] + [1])   # a new list
        return rows''',
  java='''import java.util.*;

class Solution {
    public List<List<Integer>> generate(int numRows) {
        List<List<Integer>> rows = new ArrayList<>();
        rows.add(List.of(1));
        for (int r = 1; r < numRows; r++) {
            List<Integer> prev = rows.get(r - 1), row = new ArrayList<>();   // a new list
            row.add(1);
            for (int c = 1; c < prev.size(); c++) row.add(prev.get(c - 1) + prev.get(c));
            row.add(1);
            rows.add(row);
        }
        return rows;
    }
}''')

# ---------------------------------------------------------------- Medium
prob(num=198, slug="house-robber", title="House Robber", diff="Medium",
  method="rob",
  ask="Houses in a row hold amounts of money. You may not rob two neighbours. Find the most you can take.",
  cue="Decide about the last house: rob it (and skip its neighbour) or skip it. Each choice leaves a smaller copy of the same problem, which is the SRTBOT section's \"relate\" step.",
  brute="Try every set of non-adjacent houses: exponential (about 1.6ⁿ sets).",
  approach="SRTBOT: best(i) is the most from the first i houses; relate best(i) = max(best(i - 1), best(i - 2) + nums[i - 1]); order i increasing; base best(0) = 0, best(1) = nums[0]; answer best(n). Keep the last two values.",
  cx="O(n) time, O(1) space.",
  trap="A greedy like \"take every other house\" or \"take the biggest first\". On [2, 1, 1, 2] every-other gives 3, while the answer is 4 (the two ends).",
  py='''class Solution:
    def rob(self, nums: list[int]) -> int:
        prev, cur = 0, 0               # best(i - 2), best(i - 1)
        for x in nums:
            prev, cur = cur, max(cur, prev + x)   # skip this house, or rob it
        return cur''',
  java='''class Solution {
    public int rob(int[] nums) {
        int prev = 0, cur = 0;         // best(i - 2), best(i - 1)
        for (int x : nums) {
            int next = Math.max(cur, prev + x);   // skip this house, or rob it
            prev = cur;
            cur = next;
        }
        return cur;
    }
}''')

prob(num=213, slug="house-robber-ii", title="House Robber II", diff="Medium",
  method="rob",
  ask="House Robber, but the houses stand in a circle, so the first and last are neighbours.",
  cue="The circle adds exactly one constraint: not both the first and last house. Split into two line problems, one without the first house and one without the last, and reuse House Robber.",
  brute="Try every valid set on the circle: exponential.",
  approach="Answer = max(rob(nums[1:]), rob(nums[:-1])), each solved as a line. A single house is its own answer, since both slices would be empty.",
  cx="O(n) time, O(1) space.",
  trap="The one-house case. nums[1:] and nums[:-1] are both empty, and the answer would come out 0 instead of nums[0].",
  py='''class Solution:
    def rob(self, nums: list[int]) -> int:
        def line(houses):              # House Robber on a line
            prev, cur = 0, 0
            for x in houses:
                prev, cur = cur, max(cur, prev + x)
            return cur

        if len(nums) == 1:
            return nums[0]
        return max(line(nums[1:]), line(nums[:-1]))   # not both first and last''',
  java='''class Solution {
    private int line(int[] nums, int from, int to) {   // House Robber on nums[from..to)
        int prev = 0, cur = 0;
        for (int i = from; i < to; i++) {
            int next = Math.max(cur, prev + nums[i]);
            prev = cur;
            cur = next;
        }
        return cur;
    }

    public int rob(int[] nums) {
        if (nums.length == 1) return nums[0];
        return Math.max(line(nums, 1, nums.length), line(nums, 0, nums.length - 1));   // not both ends
    }
}''')

prob(num=91, slug="decode-ways", title="Decode Ways", diff="Medium",
  method="numDecodings",
  ask="Digits encode letters as \"1\" = A through \"26\" = Z. Count the ways to decode a digit string.",
  cue="The last letter came from either the last digit or the last two digits. Like Climbing Stairs, but a step is only allowed when the digits form a valid code.",
  brute="Try every way to split the string into pieces of one or two digits: exponential.",
  approach="ways(i) counts decodings of the first i digits. ways(i) gets ways(i - 1) if digit i - 1 is not \"0\", plus ways(i - 2) if the two digits ending at i - 1 form a number from 10 to 26. Base ways(0) = 1 (the empty prefix has one decoding: nothing).",
  cx="O(n) time, O(1) space with two variables.",
  trap="Zeros. \"0\" alone decodes to nothing, and \"06\" is not a valid two-digit code; only 10 to 26 are. A string starting with 0 has zero decodings, and the rules above give that automatically.",
  py='''class Solution:
    def numDecodings(self, s: str) -> int:
        prev, cur = 1, 1 if s[0] != "0" else 0    # ways(0), ways(1)
        for i in range(2, len(s) + 1):
            nxt = 0
            if s[i - 1] != "0":
                nxt += cur             # last letter from one digit
            if 10 <= int(s[i - 2:i]) <= 26:
                nxt += prev            # last letter from two digits (not "06")
            prev, cur = cur, nxt
        return cur''',
  java='''class Solution {
    public int numDecodings(String s) {
        int prev = 1, cur = s.charAt(0) != '0' ? 1 : 0;   // ways(0), ways(1)
        for (int i = 2; i <= s.length(); i++) {
            int next = 0;
            if (s.charAt(i - 1) != '0') next += cur;       // one digit
            int two = Integer.parseInt(s.substring(i - 2, i));
            if (two >= 10 && two <= 26) next += prev;      // two digits (not "06")
            prev = cur;
            cur = next;
        }
        return cur;
    }
}''')

prob(num=139, slug="word-break", title="Word Break", diff="Medium",
  method="wordBreak",
  ask="Decide whether a string can be split into a sequence of dictionary words (each word usable any number of times).",
  cue="A prefix of s is breakable if it ends with a dictionary word whose start is itself a breakable prefix. The subproblem is \"is the first i characters breakable?\".",
  brute="Try every way to cut the string and check each piece: 2ⁿ⁻¹ ways, astronomical at n = 300.",
  approach="ok[0] = True. For each i from 1 to n, ok[i] is True if some j &lt; i has ok[j] and s[j:i] in the word set. Only word lengths up to the longest dictionary word are worth trying as s[j:i].",
  cx="O(n × L) substring checks for a longest word length L, each O(L) to hash: O(n × L²). O(n) space.",
  trap="Plain recursion without memoization. On s = \"aaaa…ab\" with words \"a\", \"aa\", \"aaa\", the same suffixes are re-tried exponentially often before failing. The table computes each prefix once.",
  py='''class Solution:
    def wordBreak(self, s: str, wordDict: list[str]) -> bool:
        words = set(wordDict)
        longest = max(map(len, wordDict))
        ok = [True] + [False] * len(s)     # ok[i]: the first i characters can be split
        for i in range(1, len(s) + 1):
            for j in range(max(0, i - longest), i):
                if ok[j] and s[j:i] in words:
                    ok[i] = True
                    break
        return ok[len(s)]''',
  java='''import java.util.*;

class Solution {
    public boolean wordBreak(String s, List<String> wordDict) {
        Set<String> words = new HashSet<>(wordDict);
        int longest = 0;
        for (String w : wordDict) longest = Math.max(longest, w.length());
        boolean[] ok = new boolean[s.length() + 1];   // ok[i]: first i characters can be split
        ok[0] = true;
        for (int i = 1; i <= s.length(); i++)
            for (int j = Math.max(0, i - longest); j < i; j++)
                if (ok[j] && words.contains(s.substring(j, i))) { ok[i] = true; break; }
        return ok[s.length()];
    }
}''')

prob(num=377, slug="combination-sum-iv", title="Combination Sum IV", diff="Medium",
  method="combinationSum4",
  ask="Count the ordered sequences of the given distinct positive numbers (repeats allowed) that add up to a target. Different orders count separately.",
  cue="The Loop Order Matters section. Counting ordered sequences means the last number chosen can be any of them: ways(t) = the sum of ways(t - x) over every x. The outer loop runs over totals, the inner over numbers.",
  brute="Enumerate every sequence recursively: exponential in target / smallest number.",
  approach="ways[0] = 1. For t from 1 to target, ways[t] = sum of ways[t - x] for each x ≤ t. Because every total considers every number as the last one, sequences in different orders are counted separately, which is what this problem wants.",
  cx="O(target × len(nums)) time, O(target) space.",
  trap="Swapping the loops (numbers outer, totals inner). That counts each multiset once, the answer to Coin Change II in Chapter 20, not this problem's. (In Java some intermediate counts can pass 2³¹; int arithmetic wraps, but the final sum is still right because the problem guarantees the answer fits.)",
  py='''class Solution:
    def combinationSum4(self, nums: list[int], target: int) -> int:
        ways = [1] + [0] * target
        for t in range(1, target + 1): # totals outer: order matters
            for x in nums:
                if x <= t:
                    ways[t] += ways[t - x]   # x was the last number chosen
        return ways[target]''',
  java='''class Solution {
    public int combinationSum4(int[] nums, int target) {
        int[] ways = new int[target + 1];
        ways[0] = 1;
        for (int t = 1; t <= target; t++)      // totals outer: order matters
            for (int x : nums)
                if (x <= t) ways[t] += ways[t - x];   // x was the last number chosen
        return ways[target];
    }
}''')

prob(num=152, slug="maximum-product-subarray", title="Maximum Product Subarray", diff="Medium",
  method="maxProduct",
  ask="Find the largest product of any non-empty block of consecutive values (which may be negative or zero).",
  cue="Kadane from Chapter 9 with a twist: a negative number turns the smallest product into the largest. So the subproblem must track two things per position, the largest and the smallest product of a block ending there.",
  brute="Every block with a running product: O(n²).",
  approach="Walk the array keeping hi and lo, the largest and smallest products of a block ending at the current position. For a new value x, the candidates are x alone, hi × x and lo × x; the new hi is the largest of them and the new lo the smallest. Track the best hi seen.",
  cx="O(n) time, O(1) space.",
  trap="Updating hi first and then using the new hi to compute lo. Compute both from the old values at the same time. And tracking only the maximum, which misses that -2 × -3 = 6.",
  py='''class Solution:
    def maxProduct(self, nums: list[int]) -> int:
        hi = lo = best = nums[0]       # largest / smallest product ending here
        for x in nums[1:]:
            candidates = (x, hi * x, lo * x)
            hi, lo = max(candidates), min(candidates)   # both from the old values
            best = max(best, hi)
        return best''',
  java='''class Solution {
    public int maxProduct(int[] nums) {
        int hi = nums[0], lo = nums[0], best = nums[0];   // largest / smallest ending here
        for (int i = 1; i < nums.length; i++) {
            int x = nums[i], a = hi * x, b = lo * x;      // both from the old values
            hi = Math.max(x, Math.max(a, b));
            lo = Math.min(x, Math.min(a, b));
            best = Math.max(best, hi);
        }
        return best;
    }
}''')

prob(num=740, slug="delete-and-earn", title="Delete and Earn", diff="Medium",
  method="deleteAndEarn",
  ask="Picking a value v earns v points and deletes every v - 1 and v + 1 from the array. Find the most points you can earn.",
  cue="Once you take one copy of v you may as well take all of them, and taking v forbids v - 1 and v + 1. Laid out by value, that is House Robber: neighbouring values are neighbouring houses.",
  brute="Try every subset of distinct values with no two adjacent: exponential in the number of distinct values.",
  approach="Build points[v] = v × (number of copies of v) for v up to the largest value. Run House Robber over points.",
  cx="O(n + V) time and O(V) space for values up to V = 10⁴.",
  trap="Running House Robber over the sorted distinct values as if they were adjacent. Values 3 and 5 are not in conflict; laying points out by value, with gaps as zeros, handles that automatically.",
  py='''class Solution:
    def deleteAndEarn(self, nums: list[int]) -> int:
        points = [0] * (max(nums) + 1)     # points[v]: everything earned by taking v
        for x in nums:
            points[x] += x
        prev, cur = 0, 0               # House Robber over values
        for p in points:
            prev, cur = cur, max(cur, prev + p)
        return cur''',
  java='''class Solution {
    public int deleteAndEarn(int[] nums) {
        int max = 0;
        for (int x : nums) max = Math.max(max, x);
        int[] points = new int[max + 1];   // points[v]: everything earned by taking v
        for (int x : nums) points[x] += x;
        int prev = 0, cur = 0;             // House Robber over values
        for (int p : points) {
            int next = Math.max(cur, prev + p);
            prev = cur;
            cur = next;
        }
        return cur;
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=1235, slug="maximum-profit-in-job-scheduling", title="Maximum Profit in Job Scheduling", diff="Hard",
  method="jobScheduling",
  ask="Jobs have start times, end times and profits. Choose jobs that do not overlap (one may start exactly when another ends) to maximize total profit.",
  cue="Weighted interval scheduling. Sort by end time and decide about the last job: skip it, or take it plus the best schedule of jobs ending no later than its start. Finding that earlier job is a binary search (Chapter 13).",
  brute="Try every compatible subset of jobs: O(2ⁿ).",
  approach="Sort jobs by end time. best[i] is the best profit using the first i jobs. For job i - 1, find with binary search the number k of jobs whose end time is at most its start time. Then best[i] = max(best[i - 1], best[k] + profit).",
  cx="O(n log n) time for the sort and the binary searches, O(n) space.",
  trap="Sorting by start time and relating to the next job instead. It can be made to work, but the binary search must then find the first job starting at or after the current end, and mixing the two conventions is the usual bug. Pick one and keep it.",
  py='''from bisect import bisect_right

class Solution:
    def jobScheduling(self, startTime: list[int], endTime: list[int], profit: list[int]) -> int:
        jobs = sorted(zip(endTime, startTime, profit))   # by end time
        ends = [e for e, _, _ in jobs]
        best = [0] * (len(jobs) + 1)   # best[i]: using the first i jobs
        for i, (e, s, p) in enumerate(jobs, 1):
            k = bisect_right(ends, s, 0, i - 1)          # jobs ending at or before s
            best[i] = max(best[i - 1], best[k] + p)      # skip it, or take it
        return best[-1]''',
  java='''import java.util.*;

class Solution {
    public int jobScheduling(int[] startTime, int[] endTime, int[] profit) {
        int n = startTime.length;
        Integer[] order = new Integer[n];
        for (int i = 0; i < n; i++) order[i] = i;
        Arrays.sort(order, (a, b) -> Integer.compare(endTime[a], endTime[b]));   // by end time
        int[] best = new int[n + 1];   // best[i]: using the first i jobs
        for (int i = 1; i <= n; i++) {
            int job = order[i - 1], s = startTime[job];
            int lo = 0, hi = i - 1;    // count the jobs among the first i - 1 ending at or before s
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (endTime[order[mid]] <= s) lo = mid + 1;
                else hi = mid;
            }
            best[i] = Math.max(best[i - 1], best[lo] + profit[job]);   // skip, or take
        }
        return best[n];
    }
}''')

prob(num=140, slug="word-break-ii", title="Word Break II", diff="Hard",
  method="wordBreak", observe=lambda r, a: sorted(r),
  ask="Return every way to split a string into dictionary words, as sentences with the words separated by spaces.",
  cue="The Reconstructing the Answer section: Word Break decides whether a split exists; here you must produce every split. Memoize, for each start position, the list of sentences that the rest of the string can form.",
  brute="Try every one of the 2ⁿ⁻¹ ways to cut the string and keep those made entirely of words.",
  approach="Define sentences(i) as the list of ways to split s[i:]. For each word w that s[i:] starts with, prepend w to every sentence of sentences(i + len(w)); the empty suffix has one way, the empty sentence. Cache sentences(i) so each suffix is solved once.",
  cx="Bounded by the size of the output, which can be exponential; the cache stops the work from exceeding it by more than a polynomial factor. The problem keeps the answer small (n ≤ 20).",
  trap="Returning an empty list for the empty suffix instead of a list containing one empty sentence. Then nothing ever gets built, because every sentence ends by reaching the end of the string.",
  py='''from functools import lru_cache

class Solution:
    def wordBreak(self, s: str, wordDict: list[str]) -> list[str]:
        words = set(wordDict)

        @lru_cache(maxsize=None)
        def sentences(i):              # every way to split s[i:]
            if i == len(s):
                return [""]            # one way: the empty sentence
            out = []
            for j in range(i + 1, len(s) + 1):
                if s[i:j] in words:
                    for rest in sentences(j):
                        out.append(s[i:j] + (" " + rest if rest else ""))
            return out

        return sentences(0)''',
  java='''import java.util.*;

class Solution {
    private final Map<Integer, List<String>> memo = new HashMap<>();

    public List<String> wordBreak(String s, List<String> wordDict) {
        return sentences(s, 0, new HashSet<>(wordDict));
    }

    private List<String> sentences(String s, int i, Set<String> words) {   // every way to split s[i:]
        if (i == s.length()) return List.of("");   // one way: the empty sentence
        if (memo.containsKey(i)) return memo.get(i);
        List<String> out = new ArrayList<>();
        for (int j = i + 1; j <= s.length(); j++) {
            String w = s.substring(i, j);
            if (!words.contains(w)) continue;
            for (String rest : sentences(s, j, words)) out.add(rest.isEmpty() ? w : w + " " + rest);
        }
        memo.put(i, out);
        return out;
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(19)
def arr(lo, hi, nmin=1, nmax=10): return [R.randint(lo, hi) for _ in range(R.randint(nmin, nmax))]

def brute_ways(n, steps=(1, 2)):
    @lru_cache(maxsize=None)
    def w(i): return 1 if i == 0 else sum(w(i - s) for s in steps if s <= i)
    return w(n)

def brute746(cost):
    n = len(cost)
    def go(i): return 0 if i >= n else cost[i] + min(go(i + 1), go(i + 2))
    return min(go(0), go(1))

def brute_rob(a):
    best = 0
    for mask in range(1 << len(a)):
        if mask & (mask >> 1) == 0: best = max(best, sum(a[i] for i in range(len(a)) if mask >> i & 1))
    return best
def brute213(a):
    if len(a) == 1: return a[0]
    n = len(a); best = 0
    for mask in range(1 << n):
        if mask & (mask >> 1) == 0 and not (mask & 1 and mask >> (n - 1) & 1):
            best = max(best, sum(a[i] for i in range(n) if mask >> i & 1))
    return best

def brute91(s):
    if not s: return 1
    total = 0
    if s[0] != "0": total += brute91(s[1:])
    if len(s) >= 2 and 10 <= int(s[:2]) <= 26: total += brute91(s[2:])
    return total

def gen139():
    words = list({"".join(R.choice("ab") for _ in range(R.randint(1, 3))) for _ in range(R.randint(1, 4))})
    return ["".join(R.choice("ab") for _ in range(R.randint(1, 10))), words]
def splits(s, words):
    out = []
    for mask in range(1 << (len(s) - 1)):
        pieces, start = [], 0
        for i in range(1, len(s)):
            if mask >> (i - 1) & 1: pieces.append(s[start:i]); start = i
        pieces.append(s[start:])
        if all(p in words for p in pieces): out.append(" ".join(pieces))
    return out

def brute377(nums, t):
    return 1 if t == 0 else sum(brute377(nums, t - x) for x in nums if x <= t)

def brute740(a):
    vals = sorted(set(a)); best = 0
    for k in range(len(vals) + 1):
        for c in combinations(vals, k):
            if all(y - x != 1 for x, y in zip(c, c[1:])): best = max(best, sum(v * a.count(v) for v in c))
    return best

def gen1235():
    n = R.randint(1, 7); s = [R.randint(1, 10) for _ in range(n)]
    return [s, [x + R.randint(1, 5) for x in s], [R.randint(1, 9) for _ in range(n)]]
def brute1235(s, e, p):
    n, best = len(s), 0
    for mask in range(1 << n):
        jobs = sorted((s[i], e[i]) for i in range(n) if mask >> i & 1)
        if all(a[1] <= b[0] for a, b in zip(jobs, jobs[1:])):
            best = max(best, sum(p[i] for i in range(n) if mask >> i & 1))
    return best

BRUTE = {
  70:   (lambda: [R.randint(1, 25)], brute_ways),
  746:  (lambda: [arr(0, 9, 2, 10)], brute746),
  118:  (lambda: [R.randint(1, 12)], lambda n: [[math.comb(r, c) for c in range(r + 1)] for r in range(n)]),
  198:  (lambda: [arr(0, 9)], brute_rob),
  213:  (lambda: [arr(0, 9)], brute213),
  91:   (lambda: ["".join(R.choice("0112226789") for _ in range(R.randint(1, 10)))], brute91),
  139:  (gen139, lambda s, w: bool(splits(s, set(w)))),
  377:  (lambda: [R.sample(range(1, 7), R.randint(1, 4)), R.randint(1, 14)], brute377),
  152:  (lambda: [arr(-4, 4)], lambda a: max(math.prod(a[i:j]) for i in range(len(a)) for j in range(i + 1, len(a) + 1))),
  740:  (lambda: [arr(1, 8)], brute740),
  1235: (gen1235, brute1235),
  140:  (gen139, lambda s, w: sorted(splits(s, set(w)))),
}
