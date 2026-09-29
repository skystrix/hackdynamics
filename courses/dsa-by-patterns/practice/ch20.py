# Chapter 20 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
# The knapsack family has no free Easy problem on LeetCode, so this set starts at Medium.
import random
from itertools import combinations, product

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

MOD = 10**9 + 7

# ---------------------------------------------------------------- Medium
prob(num=416, slug="partition-equal-subset-sum", title="Partition Equal Subset Sum", diff="Medium",
  method="canPartition",
  ask="Decide whether an array of positive integers can be split into two groups with equal sums.",
  cue="Two equal halves means one group sums to exactly total / 2. \"Can some subset reach this sum?\" is 0/1 knapsack with yes-or-no cells, the first of the Four Problems, One Table.",
  brute="Try every subset: 2ⁿ, about 1.6 × 10⁶⁰ at n = 200.",
  approach="If the total is odd, answer false. Otherwise keep can[s] = \"some subset of the numbers seen so far sums to s\", starting with can[0] = True. For each number x, for s from total / 2 down to x, set can[s] = can[s] or can[s - x]. Answer can[total / 2].",
  cx="O(n × total) time, O(total) space. Pseudopolynomial: fast because the sums here are at most 20,000, not because the problem is tractable in general.",
  trap="Looping s upwards. Then can[s - x] may already include x from this same round, so x gets used twice. Going down reads only last round's values: the Why the Loop Flips section, in the 0/1 direction.",
  py='''class Solution:
    def canPartition(self, nums: list[int]) -> bool:
        total = sum(nums)
        if total % 2:
            return False
        half = total // 2
        can = [True] + [False] * half  # can[s]: some subset sums to s
        for x in nums:
            for s in range(half, x - 1, -1):   # downwards: each number at most once
                can[s] = can[s] or can[s - x]
        return can[half]''',
  java='''class Solution {
    public boolean canPartition(int[] nums) {
        int total = 0;
        for (int x : nums) total += x;
        if (total % 2 != 0) return false;
        int half = total / 2;
        boolean[] can = new boolean[half + 1];   // can[s]: some subset sums to s
        can[0] = true;
        for (int x : nums)
            for (int s = half; s >= x; s--)       // downwards: each number at most once
                can[s] = can[s] || can[s - x];
        return can[half];
    }
}''')

prob(num=494, slug="target-sum", title="Target Sum", diff="Medium",
  method="findTargetSumWays",
  ask="Put a + or - in front of every number so the total equals a target. Count the ways.",
  cue="Let P be the numbers given +. Then sum(P) - (total - sum(P)) = target, so sum(P) = (total + target) / 2. Counting the subsets with that sum is the counting row of the same knapsack table.",
  brute="Try all 2ⁿ sign patterns: about a million at n = 20, which passes, but the table is the lesson.",
  approach="If total + target is odd or |target| &gt; total, there are no ways. Otherwise count[s] = number of subsets of the numbers seen so far summing to s, with count[0] = 1. For each x, for s downwards from the goal to x, add count[s - x] to count[s]. Answer count[goal].",
  cx="O(n × total) time, O(total) space.",
  trap="Zeros. A 0 can take + or -, doubling the count, and the downward loop must include s = x = 0 for that to happen. A loop that stops at s = 1 silently loses those ways.",
  py='''class Solution:
    def findTargetSumWays(self, nums: list[int], target: int) -> int:
        total = sum(nums)
        if abs(target) > total or (total + target) % 2:
            return 0
        goal = (total + target) // 2   # the sum of the numbers given +
        count = [1] + [0] * goal
        for x in nums:
            for s in range(goal, x - 1, -1):   # includes s = 0 when x = 0: zeros double
                count[s] += count[s - x]
        return count[goal]''',
  java='''class Solution {
    public int findTargetSumWays(int[] nums, int target) {
        int total = 0;
        for (int x : nums) total += x;
        if (Math.abs(target) > total || (total + target) % 2 != 0) return 0;
        int goal = (total + target) / 2;   // the sum of the numbers given +
        int[] count = new int[goal + 1];
        count[0] = 1;
        for (int x : nums)
            for (int s = goal; s >= x; s--)   // includes s = 0 when x = 0: zeros double
                count[s] += count[s - x];
        return count[goal];
    }
}''')

prob(num=322, slug="coin-change", title="Coin Change", diff="Medium",
  method="coinChange",
  ask="Find the fewest coins (each denomination usable any number of times) that add up to an amount, or -1 if it cannot be made.",
  cue="Unbounded knapsack, minimizing the count: the Why the Loop Flips for Unbounded section. And it is Chapter 23's \"a greedy that fails\": with coins 1, 3 and 4, taking the largest coin first makes 6 as 4 + 1 + 1, while 3 + 3 uses two coins.",
  brute="Try every combination of coin counts recursively: exponential in amount / smallest coin.",
  approach="fewest[0] = 0 and every other amount starts at infinity (or amount + 1, which no answer can reach). For each coin c, for a from c upwards to amount, fewest[a] = min(fewest[a], fewest[a - c] + 1). Answer fewest[amount], or -1 if it is still at the sentinel.",
  cx="O(len(coins) × amount) time, O(amount) space. Pseudopolynomial in the amount, at most 10⁴ here.",
  trap="Starting \"impossible\" at Integer.MAX_VALUE in Java. Adding 1 to it wraps to a negative number, which then looks like the best answer. Use amount + 1 as the sentinel.",
  py='''class Solution:
    def coinChange(self, coins: list[int], amount: int) -> int:
        NONE = amount + 1              # more coins than any real answer needs
        fewest = [0] + [NONE] * amount
        for c in coins:
            for a in range(c, amount + 1):   # upwards: a coin may be reused
                fewest[a] = min(fewest[a], fewest[a - c] + 1)
        return fewest[amount] if fewest[amount] != NONE else -1''',
  java='''import java.util.Arrays;

class Solution {
    public int coinChange(int[] coins, int amount) {
        int none = amount + 1;         // not MAX_VALUE: MAX_VALUE + 1 wraps negative
        int[] fewest = new int[amount + 1];
        Arrays.fill(fewest, none);
        fewest[0] = 0;
        for (int c : coins)
            for (int a = c; a <= amount; a++)   // upwards: a coin may be reused
                fewest[a] = Math.min(fewest[a], fewest[a - c] + 1);
        return fewest[amount] == none ? -1 : fewest[amount];
    }
}''')

prob(num=518, slug="coin-change-ii", title="Coin Change II", diff="Medium",
  method="change",
  ask="Count the combinations of coins (each denomination usable any number of times) that make an amount. Order does not matter.",
  cue="Counting unbounded knapsack with coins in the outer loop. That order builds each combination with its coins in a fixed sequence, so it is counted once; Chapter 19's Combination Sum IV swaps the loops and counts orderings instead.",
  brute="Enumerate multisets of coins recursively: exponential.",
  approach="ways[0] = 1. For each coin c, for a from c up to amount, ways[a] += ways[a - c]. When coin c is processed, ways[a - c] already counts combinations of the earlier coins plus any number of c, so each combination is counted exactly once.",
  cx="O(len(coins) × amount) time, O(amount) space.",
  trap="Putting the amounts in the outer loop. Then 1 + 2 and 2 + 1 are both counted, which is Combination Sum IV's answer, not this one's.",
  py='''class Solution:
    def change(self, amount: int, coins: list[int]) -> int:
        ways = [1] + [0] * amount
        for c in coins:                # coins outer: each combination counted once
            for a in range(c, amount + 1):
                ways[a] += ways[a - c]
        return ways[amount]''',
  java='''class Solution {
    public int change(int amount, int[] coins) {
        int[] ways = new int[amount + 1];
        ways[0] = 1;
        for (int c : coins)            // coins outer: each combination counted once
            for (int a = c; a <= amount; a++) ways[a] += ways[a - c];
        return ways[amount];
    }
}''')

prob(num=474, slug="ones-and-zeroes", title="Ones and Zeroes", diff="Medium",
  method="findMaxForm",
  ask="Choose as many binary strings as possible such that together they contain at most m zeros and at most n ones.",
  cue="0/1 knapsack with two capacities (zeros and ones) instead of one. The table gains a dimension; nothing else changes, including the downward loops.",
  brute="Try every subset of strings: 2⁶⁰⁰ at the limit.",
  approach="best[z][o] is the most strings that fit within z zeros and o ones. For each string with z0 zeros and o1 ones, for z from m down to z0 and o from n down to o1, best[z][o] = max(best[z][o], best[z - z0][o - o1] + 1).",
  cx="O(len(strs) × m × n) time, O(m × n) space.",
  trap="Looping either capacity upwards, which lets the same string be taken twice. Both loops must go down.",
  py='''class Solution:
    def findMaxForm(self, strs: list[str], m: int, n: int) -> int:
        best = [[0] * (n + 1) for _ in range(m + 1)]   # best[z][o]: within z zeros, o ones
        for s in strs:
            z0, o1 = s.count("0"), s.count("1")
            for z in range(m, z0 - 1, -1):             # both capacities downwards
                for o in range(n, o1 - 1, -1):
                    best[z][o] = max(best[z][o], best[z - z0][o - o1] + 1)
        return best[m][n]''',
  java='''class Solution {
    public int findMaxForm(String[] strs, int m, int n) {
        int[][] best = new int[m + 1][n + 1];   // best[z][o]: within z zeros, o ones
        for (String s : strs) {
            int z0 = 0, o1 = 0;
            for (char c : s.toCharArray()) if (c == '0') z0++; else o1++;
            for (int z = m; z >= z0; z--)       // both capacities downwards
                for (int o = n; o >= o1; o--)
                    best[z][o] = Math.max(best[z][o], best[z - z0][o - o1] + 1);
        }
        return best[m][n];
    }
}''')

prob(num=1049, slug="last-stone-weight-ii", title="Last Stone Weight II", diff="Medium",
  method="lastStoneWeightII",
  ask="Repeatedly smash two stones; equal stones both vanish, otherwise the heavier keeps the difference. Find the smallest possible weight left at the end (0 if nothing is left).",
  cue="Every sequence of smashes ends up adding some stones and subtracting the others, so the question is: split the stones into two piles with sums as close as possible. That is Partition Equal Subset Sum asking for the nearest reachable sum instead of an exact one.",
  brute="Simulate every smashing order: factorial in the number of stones.",
  approach="Compute which sums up to total // 2 are reachable with 0/1 knapsack (downward loop). The best pile is the largest reachable sum s ≤ total // 2, and the answer is total - 2s.",
  cx="O(n × total) time, O(total) space, with total at most 3,000.",
  trap="Simulating greedily by always smashing the two heaviest stones. That is a different problem (Last Stone Weight, 1046) and does not minimize the result here. On [3, 5, 6, 6, 4] it leaves 2, while the split 3 + 5 + 4 against 6 + 6 leaves 0.",
  py='''class Solution:
    def lastStoneWeightII(self, stones: list[int]) -> int:
        total = sum(stones)
        half = total // 2
        can = [True] + [False] * half
        for x in stones:
            for s in range(half, x - 1, -1):
                can[s] = can[s] or can[s - x]
        best = max(s for s in range(half + 1) if can[s])   # the pile closest to half
        return total - 2 * best''',
  java='''class Solution {
    public int lastStoneWeightII(int[] stones) {
        int total = 0;
        for (int x : stones) total += x;
        int half = total / 2;
        boolean[] can = new boolean[half + 1];
        can[0] = true;
        for (int x : stones)
            for (int s = half; s >= x; s--) can[s] = can[s] || can[s - x];
        for (int s = half; s >= 0; s--)
            if (can[s]) return total - 2 * s;   // the pile closest to half
        return total;
    }
}''')

prob(num=279, slug="perfect-squares", title="Perfect Squares", diff="Medium",
  method="numSquares",
  ask="Find the fewest perfect squares (1, 4, 9, …) that add up to n.",
  cue="Coin Change where the coins are the squares up to n: unbounded knapsack, minimizing the count.",
  brute="Try every combination of squares recursively: exponential.",
  approach="fewest[0] = 0. For each a from 1 to n, fewest[a] = 1 + the minimum of fewest[a - j²] over all j with j² ≤ a.",
  cx="O(n √n) time, about 10⁶ steps at n = 10⁴, and O(n) space. (Lagrange's four-square theorem says the answer is never more than 4, which some faster solutions exploit.)",
  trap="Taking the largest square first. For 12 that gives 9 + 1 + 1 + 1, four squares, while 4 + 4 + 4 uses three.",
  py='''class Solution:
    def numSquares(self, n: int) -> int:
        fewest = [0] + [n] * n         # n ones always work
        for a in range(1, n + 1):
            j = 1
            while j * j <= a:
                fewest[a] = min(fewest[a], fewest[a - j * j] + 1)
                j += 1
        return fewest[n]''',
  java='''class Solution {
    public int numSquares(int n) {
        int[] fewest = new int[n + 1];
        for (int a = 1; a <= n; a++) {
            fewest[a] = a;             // a ones always work
            for (int j = 1; j * j <= a; j++) fewest[a] = Math.min(fewest[a], fewest[a - j * j] + 1);
        }
        return fewest[n];
    }
}''')

prob(num=1155, slug="number-of-dice-rolls-with-target-sum", title="Number of Dice Rolls With Target Sum", diff="Medium",
  method="numRollsToTarget",
  ask="Roll n dice with faces 1 to k. Count the ways (modulo 1,000,000,007) for the faces to add up to a target.",
  cue="A grouped knapsack: each die is a group from which exactly one face must be chosen. The table is ways[dice used][sum].",
  brute="Enumerate all kⁿ rolls: 30³⁰ at the limit.",
  approach="ways over sums starts as [1, 0, 0, …] for zero dice. For each die, build a new row: new[s] = sum of ways[s - f] for faces f from 1 to k with f ≤ s. Replace the row and move on. Answer ways[target] after n dice.",
  cx="O(n × target × k) time, about 900,000 steps at the limits, and O(target) space.",
  trap="Updating the row in place. Each die must use exactly one face, so every new sum must be built from the previous die's row; in-place updates let one die contribute several faces.",
  py='''class Solution:
    def numRollsToTarget(self, n: int, k: int, target: int) -> int:
        MOD = 10**9 + 7
        ways = [1] + [0] * target      # zero dice: only the sum 0
        for _ in range(n):
            new = [0] * (target + 1)   # a fresh row: exactly one face per die
            for s in range(1, target + 1):
                for f in range(1, min(k, s) + 1):
                    new[s] = (new[s] + ways[s - f]) % MOD
            ways = new
        return ways[target]''',
  java='''class Solution {
    public int numRollsToTarget(int n, int k, int target) {
        final int MOD = 1_000_000_007;
        int[] ways = new int[target + 1];
        ways[0] = 1;                   // zero dice: only the sum 0
        for (int d = 0; d < n; d++) {
            int[] next = new int[target + 1];   // a fresh row: one face per die
            for (int s = 1; s <= target; s++)
                for (int f = 1; f <= Math.min(k, s); f++) next[s] = (next[s] + ways[s - f]) % MOD;
            ways = next;
        }
        return ways[target];
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=879, slug="profitable-schemes", title="Profitable Schemes", diff="Hard",
  method="profitableSchemes",
  ask="Crimes each need some members and yield some profit; a member can join only one crime. Count the sets of crimes (modulo 1,000,000,007) that use at most n members and earn at least minProfit.",
  cue="0/1 knapsack with a capacity (members) and a threshold (profit). The trick for \"at least minProfit\" is to cap the profit dimension at minProfit: every profit beyond it counts the same.",
  brute="Try every subset of crimes: 2¹⁰⁰ at the limit.",
  approach="ways[m][p] counts the sets of crimes that use exactly m members and whose profit, capped at minProfit, is p. Start with ways[0][0] = 1. For each crime (g, pr), for m from n down to g and p from minProfit down to 0, add ways[m - g][p] into ways[m][min(minProfit, p + pr)]. Answer: the sum of ways[m][minProfit] over all m.",
  cx="O(crimes × n × minProfit) time, about 10⁶ at the limits, and O(n × minProfit) space.",
  trap="Letting the profit dimension grow to the true total (up to 10,000). It works, but the table is a hundred times bigger than needed. Capping at minProfit is the idea that makes a threshold constraint fit in a knapsack.",
  py='''class Solution:
    def profitableSchemes(self, n: int, minProfit: int, group: list[int], profit: list[int]) -> int:
        MOD = 10**9 + 7
        ways = [[0] * (minProfit + 1) for _ in range(n + 1)]   # [members][profit, capped]
        ways[0][0] = 1
        for g, pr in zip(group, profit):
            for m in range(n, g - 1, -1):                       # 0/1: downwards
                for p in range(minProfit, -1, -1):
                    capped = min(minProfit, p + pr)             # "at least" folds into the cap
                    ways[m][capped] = (ways[m][capped] + ways[m - g][p]) % MOD
        return sum(ways[m][minProfit] for m in range(n + 1)) % MOD''',
  java='''class Solution {
    public int profitableSchemes(int n, int minProfit, int[] group, int[] profit) {
        final int MOD = 1_000_000_007;
        int[][] ways = new int[n + 1][minProfit + 1];   // [members][profit, capped]
        ways[0][0] = 1;
        for (int c = 0; c < group.length; c++) {
            int g = group[c], pr = profit[c];
            for (int m = n; m >= g; m--)                // 0/1: downwards
                for (int p = minProfit; p >= 0; p--) {
                    int capped = Math.min(minProfit, p + pr);   // "at least" folds into the cap
                    ways[m][capped] = (ways[m][capped] + ways[m - g][p]) % MOD;
                }
        }
        int total = 0;
        for (int m = 0; m <= n; m++) total = (total + ways[m][minProfit]) % MOD;
        return total;
    }
}''')

prob(num=2035, slug="partition-array-into-two-arrays-to-minimize-sum-difference", title="Partition Array Into Two Arrays to Minimize Sum Difference", diff="Hard",
  method="minimumDifference",
  ask="Split an array of 2n integers (n ≤ 15, values up to ±10⁷) into two arrays of n each, minimizing the absolute difference of their sums.",
  cue="The values are too large for a knapsack table (the Pseudopolynomial section's warning), and 2³⁰ subsets are too many. Thirty items is the Meet in the Middle, When n Is Small section's case: split the array in half and combine the halves' subset sums.",
  brute="Try every way to choose n of the 2n elements: C(30, 15) ≈ 1.55 × 10⁸ subsets, each summed.",
  approach="Split into a left half and a right half of n each. For each half, list the subset sums grouped by how many elements were taken. A valid answer takes k from the left and n - k from the right, and you want that group sum as close to total / 2 as possible. For each k, sort the right half's sums for n - k, and for each left sum a binary-search the right sum that brings a + b closest to total / 2. The answer is |total - 2(a + b)| at the best pair.",
  cx="O(2ⁿ × n) time for listing and searching, with n = 15 giving about 32,768 sums per half. O(2ⁿ) space.",
  trap="Ignoring the size constraint. Both arrays must have exactly n elements, so sums must be matched by count: k from the left with n - k from the right. Matching any left sum with any right sum finds splits of the wrong sizes.",
  py='''from bisect import bisect_left

class Solution:
    def minimumDifference(self, nums: list[int]) -> int:
        n, total = len(nums) // 2, sum(nums)

        def sums_by_count(half):       # sums[k] = every subset sum using k elements
            sums = [[] for _ in range(n + 1)]
            for mask in range(1 << n):
                sums[bin(mask).count("1")].append(sum(half[i] for i in range(n) if mask >> i & 1))
            return sums

        left, right = sums_by_count(nums[:n]), sums_by_count(nums[n:])
        best = float("inf")
        for k in range(n + 1):
            rs = sorted(right[n - k])  # k from the left means n - k from the right
            for a in left[k]:
                i = bisect_left(rs, total / 2 - a)   # the right sum nearest total/2 - a
                for j in (i - 1, i):
                    if 0 <= j < len(rs):
                        best = min(best, abs(total - 2 * (a + rs[j])))
        return best''',
  java='''import java.util.*;

class Solution {
    public int minimumDifference(int[] nums) {
        int n = nums.length / 2;
        long total = 0;
        for (int x : nums) total += x;
        List<List<Long>> left = sumsByCount(nums, 0, n), right = sumsByCount(nums, n, n);
        long best = Long.MAX_VALUE;
        for (int k = 0; k <= n; k++) {
            List<Long> rs = right.get(n - k);   // k from the left means n - k from the right
            Collections.sort(rs);
            for (long a : left.get(k)) {
                // first right sum b with 2(a + b) >= total, and the one before it
                int lo = 0, hi = rs.size();
                while (lo < hi) {
                    int mid = (lo + hi) >>> 1;
                    if (2 * (a + rs.get(mid)) < total) lo = mid + 1; else hi = mid;
                }
                for (int j = lo - 1; j <= lo; j++)
                    if (j >= 0 && j < rs.size()) best = Math.min(best, Math.abs(total - 2 * (a + rs.get(j))));
            }
        }
        return (int) best;
    }

    private List<List<Long>> sumsByCount(int[] nums, int from, int n) {   // sums by elements used
        List<List<Long>> sums = new ArrayList<>();
        for (int k = 0; k <= n; k++) sums.add(new ArrayList<>());
        for (int mask = 0; mask < (1 << n); mask++) {
            long s = 0;
            for (int i = 0; i < n; i++) if ((mask >> i & 1) == 1) s += nums[from + i];
            sums.get(Integer.bitCount(mask)).add(s);
        }
        return sums;
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(20)
def arr(lo, hi, nmin=1, nmax=8): return [R.randint(lo, hi) for _ in range(R.randint(nmin, nmax))]
def subset_sums(a): return [sum(c) for k in range(len(a) + 1) for c in combinations(a, k)]

def brute322(coins, amount):
    best = {0: 0}
    for a in range(1, amount + 1):
        opts = [best[a - c] + 1 for c in coins if c <= a and best.get(a - c) is not None]
        best[a] = min(opts) if opts else None
    return best[amount] if best[amount] is not None else -1

def brute518(amount, coins):
    def go(i, rem):
        if rem == 0: return 1
        if i == len(coins) or rem < 0: return 0
        return go(i, rem - coins[i]) + go(i + 1, rem)
    return go(0, amount)

def gen474():
    strs = ["".join(R.choice("01") for _ in range(R.randint(1, 4))) for _ in range(R.randint(1, 7))]
    return [strs, R.randint(1, 6), R.randint(1, 6)]
def brute474(strs, m, n):
    best = 0
    for mask in range(1 << len(strs)):
        chosen = [strs[i] for i in range(len(strs)) if mask >> i & 1]
        if sum(s.count("0") for s in chosen) <= m and sum(s.count("1") for s in chosen) <= n:
            best = max(best, len(chosen))
    return best

def brute1049(stones):
    total = sum(stones); return min(abs(total - 2 * s) for s in subset_sums(stones))

def brute279(n):
    sq = [j * j for j in range(1, n + 1) if j * j <= n]
    best = [0] + [None] * n
    for a in range(1, n + 1): best[a] = min(best[a - q] + 1 for q in sq if q <= a)
    return best[n]

def gen879():
    c = R.randint(1, 6); return [R.randint(1, 10), R.randint(0, 8), [R.randint(1, 5) for _ in range(c)], [R.randint(0, 5) for _ in range(c)]]
def brute879(n, mp, g, p):
    return sum(1 for mask in range(1 << len(g))
               if sum(g[i] for i in range(len(g)) if mask >> i & 1) <= n and sum(p[i] for i in range(len(g)) if mask >> i & 1) >= mp) % MOD

def brute2035(nums):
    n, total = len(nums) // 2, sum(nums)
    return min(abs(total - 2 * sum(c)) for c in combinations(nums, n))

BRUTE = {
  416:  (lambda: [arr(1, 10)], lambda a: sum(a) % 2 == 0 and sum(a) // 2 in subset_sums(a)),
  494:  (lambda: [arr(0, 4, 1, 8), R.randint(-8, 8)],
         lambda a, t: sum(1 for signs in product((1, -1), repeat=len(a)) if sum(s * x for s, x in zip(signs, a)) == t)),
  322:  (lambda: [R.sample(range(1, 12), R.randint(1, 4)), R.randint(0, 30)], brute322),
  518:  (lambda: [R.randint(0, 20), R.sample(range(1, 10), R.randint(1, 4))], brute518),
  474:  (gen474, brute474),
  1049: (lambda: [arr(1, 20)], brute1049),
  279:  (lambda: [R.randint(1, 200)], brute279),
  1155: (lambda: [R.randint(1, 4), R.randint(1, 6), R.randint(1, 20)],
         lambda n, k, t: sum(1 for roll in product(range(1, k + 1), repeat=n) if sum(roll) == t) % MOD),
  879:  (gen879, brute879),
  2035: (lambda: [[R.randint(-20, 20) for _ in range(2 * R.randint(1, 5))]], brute2035),
}
