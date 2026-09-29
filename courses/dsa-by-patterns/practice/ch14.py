# Chapter 14 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
# Every search finds the first value where a monotone predicate turns true, with the chapter's template.
import random, math
from itertools import combinations

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

# ---------------------------------------------------------------- Easy
prob(num=69, slug="sqrtx", title="Sqrt(x)", diff="Easy",
  method="mySqrt",
  ask="Return the integer square root of a non-negative integer x (the square root rounded down), without a built-in power or square-root function.",
  cue="You are not searching an array but a range of candidate answers, 0 to x. \"r × r &gt; x\" is false for small r and true for large r: the chapter's generalisation, binary search over any monotone predicate.",
  brute="Try r = 0, 1, 2, … until r × r exceeds x: O(√x), about 46,000 steps for x near 2³¹.",
  approach="Find the first r in [0, x + 1) with r × r &gt; x using the template, then return r - 1, the last value whose square still fits.",
  cx="O(log x) time, O(1) space.",
  trap="Overflow. For x near 2³¹, mid × mid does not fit in a Java int; compute it as a long. This is the same class of bug as the Overflow Bug section's (lo + hi) / 2.",
  py='''class Solution:
    def mySqrt(self, x: int) -> int:
        lo, hi = 0, x + 1              # first r with r * r > x lies in [0, x + 1]
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if mid * mid > x:
                hi = mid
            else:
                lo = mid + 1
        return lo - 1                  # the last r whose square fits''',
  java='''class Solution {
    public int mySqrt(int x) {
        long lo = 0, hi = (long) x + 1;    // first r with r * r > x lies in [0, x + 1]
        while (lo < hi) {
            long mid = lo + (hi - lo) / 2;
            if (mid * mid > x) hi = mid;   // long: mid * mid overflows an int
            else lo = mid + 1;
        }
        return (int) (lo - 1);             // the last r whose square fits
    }
}''')

prob(num=367, slug="valid-perfect-square", title="Valid Perfect Square", diff="Easy",
  method="isPerfectSquare",
  ask="Decide whether a positive integer is a perfect square, without a square-root function.",
  cue="Sqrt(x) with a yes-or-no ending: find the first r with r × r ≥ num, and check whether its square is exactly num.",
  brute="Try r = 1, 2, 3, … while r × r ≤ num: O(√num).",
  approach="Search [1, num] for the first r with r × r ≥ num. The number is a perfect square exactly when that r squares to num.",
  cx="O(log num) time, O(1) space.",
  trap="The same overflow as Sqrt(x): square mid in a long in Java.",
  py='''class Solution:
    def isPerfectSquare(self, num: int) -> bool:
        lo, hi = 1, num                # first r with r * r >= num
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if mid * mid >= num:
                hi = mid
            else:
                lo = mid + 1
        return lo * lo == num''',
  java='''class Solution {
    public boolean isPerfectSquare(int num) {
        long lo = 1, hi = num;         // first r with r * r >= num
        while (lo < hi) {
            long mid = lo + (hi - lo) / 2;
            if (mid * mid >= num) hi = mid;
            else lo = mid + 1;
        }
        return lo * lo == num;
    }
}''')

prob(num=441, slug="arranging-coins", title="Arranging Coins", diff="Easy",
  method="arrangeCoins",
  ask="You build a staircase with n coins: row 1 has 1 coin, row 2 has 2, and so on. How many complete rows can you build?",
  cue="k full rows use 1 + 2 + … + k = k(k + 1) / 2 coins, which grows with k. \"Do k rows need more than n coins?\" is a monotone predicate over k.",
  brute="Build rows one at a time until the coins run out: O(√n).",
  approach="Find the first k in [0, n + 1) with k(k + 1) / 2 &gt; n, and return k - 1. (A closed formula with a square root exists, but floating-point rounding makes it fragile near perfect squares; the search is exact.)",
  cx="O(log n) time, O(1) space.",
  trap="k(k + 1) / 2 overflows a Java int when k is around 65,000 or more. Use long.",
  py='''class Solution:
    def arrangeCoins(self, n: int) -> int:
        lo, hi = 0, n + 1              # first k whose staircase needs more than n coins
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if mid * (mid + 1) // 2 > n:
                hi = mid
            else:
                lo = mid + 1
        return lo - 1''',
  java='''class Solution {
    public int arrangeCoins(int n) {
        long lo = 0, hi = (long) n + 1;    // first k needing more than n coins
        while (lo < hi) {
            long mid = lo + (hi - lo) / 2;
            if (mid * (mid + 1) / 2 > n) hi = mid;   // long: this overflows an int
            else lo = mid + 1;
        }
        return (int) (lo - 1);
    }
}''')

# ---------------------------------------------------------------- Medium
prob(num=875, slug="koko-eating-bananas", title="Koko Eating Bananas", diff="Medium",
  method="minEatingSpeed",
  ask="Koko eats from one pile per hour at k bananas per hour (finishing a smaller pile early and waiting). Find the smallest k that lets her eat every pile within h hours.",
  cue="The chapter works this one in the Constructing the Predicate section (\"Eating speed\"); try it from memory. Faster never hurts, so \"can she finish at speed k?\" is false, then true, as k grows.",
  brute="Try k = 1, 2, 3, … up to the largest pile: O(n × max pile), up to 10¹³ steps.",
  approach="The answer is in [1, max(piles)], because at the largest pile's size each pile takes one hour. For a speed k, the hours needed are the sum of ceil(p / k). Find the first k whose hours are at most h.",
  cx="O(n log(max pile)) time, O(1) space.",
  trap="Overflow of the hour count. With 10,000 piles of 10⁹ bananas at speed 1, the total is 10¹³ hours, far past a Java int. Sum it in a long. And ceil(p / k) in integers is (p + k - 1) // k.",
  py='''class Solution:
    def minEatingSpeed(self, piles: list[int], h: int) -> int:
        lo, hi = 1, max(piles)         # at max(piles) every pile takes one hour
        while lo < hi:
            mid = lo + (hi - lo) // 2
            hours = sum((p + mid - 1) // mid for p in piles)   # ceil(p / mid)
            if hours <= h:
                hi = mid               # fast enough: the answer is mid or slower
            else:
                lo = mid + 1
        return lo''',
  java='''class Solution {
    public int minEatingSpeed(int[] piles, int h) {
        int lo = 1, hi = 0;
        for (int p : piles) hi = Math.max(hi, p);   // at max(piles) each pile takes an hour
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            long hours = 0;            // long: can reach 10^13
            for (int p : piles) hours += (p + (long) mid - 1) / mid;   // ceil(p / mid)
            if (hours <= h) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}''')

prob(num=1011, slug="capacity-to-ship-packages-within-d-days", title="Capacity To Ship Packages Within D Days", diff="Medium",
  method="shipWithinDays",
  ask="Packages must ship in the given order, one day's load at a time. Find the smallest ship capacity that ships everything within the given number of days.",
  cue="Also worked in the chapter (\"Shipping capacity\"); try it from memory. A bigger ship never needs more days, so the predicate is monotone, and checking one capacity is a greedy pass.",
  brute="Try every capacity from the heaviest package upwards: O(n × total weight).",
  approach="The answer is in [max(weights), sum(weights)]: the ship must carry the heaviest package, and at the total it ships everything in one day. For a capacity, count days greedily: fill today until the next package would overflow, then start a new day. Find the first capacity that needs at most the allowed days.",
  cx="O(n log(sum of weights)) time, O(1) space.",
  trap="Starting the search at 1. A capacity below the heaviest package can never ship it, and a greedy counter that does not check for that loops or miscounts. Starting at the maximum removes the case.",
  py='''class Solution:
    def shipWithinDays(self, weights: list[int], days: int) -> int:
        def days_needed(cap):          # greedy: start a new day only when forced to
            used, load = 1, 0
            for w in weights:
                if load + w > cap:
                    used, load = used + 1, 0
                load += w
            return used

        lo, hi = max(weights), sum(weights)
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if days_needed(mid) <= days:
                hi = mid
            else:
                lo = mid + 1
        return lo''',
  java='''class Solution {
    public int shipWithinDays(int[] weights, int days) {
        int lo = 0, hi = 0;
        for (int w : weights) { lo = Math.max(lo, w); hi += w; }
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            int used = 1, load = 0;    // greedy: start a new day only when forced to
            for (int w : weights) {
                if (load + w > mid) { used++; load = 0; }
                load += w;
            }
            if (used <= days) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}''')

prob(num=1482, slug="minimum-number-of-days-to-make-m-bouquets", title="Minimum Number of Days to Make m Bouquets", diff="Medium",
  method="minDays",
  ask="Flower i blooms on day bloomDay[i]. A bouquet needs k adjacent bloomed flowers. Find the first day on which you can make m bouquets, or -1 if it is never possible.",
  cue="Waiting longer only makes more flowers bloom, so \"can I make m bouquets by day d?\" is monotone in d. Checking one day is a single left-to-right pass.",
  brute="Try every distinct bloom day in increasing order, checking each: O(n²).",
  approach="If m × k is more than the number of flowers, return -1. Otherwise search days in [min(bloomDay), max(bloomDay)]. For a day d, walk the flowers counting a run of bloomed ones; every time the run reaches k, make a bouquet and reset the run. Find the first day with at least m bouquets.",
  cx="O(n log(max day)) time, O(1) space.",
  trap="Checking m × k &gt; n in Java ints. m can be 10⁶ and k up to 10⁵, so the product reaches 10¹¹ and overflows into a wrong comparison. Multiply as long.",
  py='''class Solution:
    def minDays(self, bloomDay: list[int], m: int, k: int) -> int:
        if m * k > len(bloomDay):
            return -1                  # not enough flowers, ever

        def bouquets(day):
            made = run = 0
            for b in bloomDay:
                run = run + 1 if b <= day else 0
                if run == k:           # k adjacent bloomed flowers
                    made, run = made + 1, 0
            return made

        lo, hi = min(bloomDay), max(bloomDay)
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if bouquets(mid) >= m:
                hi = mid
            else:
                lo = mid + 1
        return lo''',
  java='''class Solution {
    public int minDays(int[] bloomDay, int m, int k) {
        if ((long) m * k > bloomDay.length) return -1;   // long: m * k can reach 10^11
        int lo = Integer.MAX_VALUE, hi = 0;
        for (int b : bloomDay) { lo = Math.min(lo, b); hi = Math.max(hi, b); }
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            int made = 0, run = 0;
            for (int b : bloomDay) {
                run = b <= mid ? run + 1 : 0;
                if (run == k) { made++; run = 0; }   // k adjacent bloomed flowers
            }
            if (made >= m) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}''')

prob(num=1283, slug="find-the-smallest-divisor-given-a-threshold", title="Find the Smallest Divisor Given a Threshold", diff="Medium",
  method="smallestDivisor",
  ask="Divide every number by the same positive divisor, rounding each result up, and add them. Find the smallest divisor that keeps the sum at or below a threshold.",
  cue="Koko Eating Bananas in different clothes: a bigger divisor only shrinks each rounded-up quotient, so the sum falls as the divisor grows.",
  brute="Try divisors 1, 2, 3, … up to the largest number: O(n × max).",
  approach="The answer is in [1, max(nums)], because at the maximum every quotient is 1 and the sum is n, which the problem guarantees is within the threshold. Find the first divisor whose sum of ceil(x / d) is at most the threshold.",
  cx="O(n log(max)) time, O(1) space.",
  trap="Rounding down instead of up. ceil(x / d) is (x + d - 1) // d; plain integer division undercounts and returns a divisor that is too small.",
  py='''class Solution:
    def smallestDivisor(self, nums: list[int], threshold: int) -> int:
        lo, hi = 1, max(nums)          # at max(nums) the sum is len(nums)
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if sum((x + mid - 1) // mid for x in nums) <= threshold:   # rounded up
                hi = mid
            else:
                lo = mid + 1
        return lo''',
  java='''class Solution {
    public int smallestDivisor(int[] nums, int threshold) {
        int lo = 1, hi = 0;
        for (int x : nums) hi = Math.max(hi, x);   // at max(nums) the sum is nums.length
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            long total = 0;
            for (int x : nums) total += (x + mid - 1) / mid;   // rounded up
            if (total <= threshold) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}''')

prob(num=2226, slug="maximum-candies-allocated-to-k-children", title="Maximum Candies Allocated to K Children", diff="Medium",
  method="maximumCandies",
  ask="Piles of candies can be split (not merged). Give each of k children a pile of the same size, taken from a single original pile. Find the largest possible size (0 if even size 1 fails).",
  cue="The Minimise the Maximum, Maximise the Minimum section's other direction. A smaller size always lets you serve at least as many children, so \"can I serve k children with size x?\" is true, then false. You want the last true.",
  brute="Try every size from the largest pile downwards: O(n × max pile).",
  approach="Turn \"last true\" into \"first false\": find the first size x in [1, max + 1) where the number of portions, the sum of c // x, falls below k. The answer is x - 1, which is 0 when even size 1 does not serve everyone.",
  cx="O(n log(max pile)) time, O(1) space.",
  trap="k goes up to 10¹², which is why the Java signature takes a long, and the portion count must be a long too. And searching for \"last true\" directly with the first-true template gives an off-by-one; convert it as above.",
  py='''class Solution:
    def maximumCandies(self, candies: list[int], k: int) -> int:
        lo, hi = 1, max(candies) + 1   # first size that serves fewer than k children
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if sum(c // mid for c in candies) < k:
                hi = mid
            else:
                lo = mid + 1
        return lo - 1                  # the last size that still serves everyone''',
  java='''class Solution {
    public int maximumCandies(int[] candies, long k) {
        int lo = 1, hi = 1;
        for (int c : candies) hi = Math.max(hi, c + 1);   // first size serving fewer than k
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            long portions = 0;         // long: k itself reaches 10^12
            for (int c : candies) portions += c / mid;
            if (portions < k) hi = mid;
            else lo = mid + 1;
        }
        return lo - 1;                 // the last size that still serves everyone
    }
}''')

prob(num=1552, slug="magnetic-force-between-two-balls", title="Magnetic Force Between Two Balls", diff="Medium",
  method="maxDistance",
  ask="Place m balls into baskets at given positions so that the smallest distance between any two balls is as large as possible. Return that distance.",
  cue="Maximise the minimum: the chapter's max_min_gap, from memory. A smaller required gap is always easier to achieve, and checking one gap is greedy: place each ball in the first basket far enough from the last one.",
  brute="Try every way to choose m baskets: C(n, m), astronomically many.",
  approach="Sort the positions. Find the first gap g in [1, span + 1) that cannot be achieved, where span is last - first; the answer is g - 1. To test a gap, put a ball in the first basket, then walk right and put one in every basket at least g past the previous ball; the gap is achievable if you place m balls.",
  cx="O(n log n) for the sort plus O(n log(span)) for the search. O(1) extra space.",
  trap="Forgetting to sort. The greedy placement is only correct left to right over sorted positions.",
  py='''class Solution:
    def maxDistance(self, position: list[int], m: int) -> int:
        position.sort()

        def fits(gap):                 # greedy: take every basket that is far enough
            placed, last = 1, position[0]
            for p in position[1:]:
                if p - last >= gap:
                    placed, last = placed + 1, p
            return placed >= m

        lo, hi = 1, position[-1] - position[0] + 1   # first gap that does not fit
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if not fits(mid):
                hi = mid
            else:
                lo = mid + 1
        return lo - 1''',
  java='''import java.util.Arrays;

class Solution {
    public int maxDistance(int[] position, int m) {
        Arrays.sort(position);
        int lo = 1, hi = position[position.length - 1] - position[0] + 1;   // first gap that fails
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            int placed = 1, last = position[0];
            for (int p : position)     // greedy: take every basket that is far enough
                if (p - last >= mid) { placed++; last = p; }
            if (placed < m) hi = mid;
            else lo = mid + 1;
        }
        return lo - 1;
    }
}''', check_args=False)

# ---------------------------------------------------------------- Hard
prob(num=410, slug="split-array-largest-sum", title="Split Array Largest Sum", diff="Hard",
  method="splitArray",
  ask="Split an array of non-negative numbers into k non-empty consecutive parts so that the largest part sum is as small as possible. Return that sum.",
  cue="Minimise the maximum, worked in the chapter as \"Splitting an array\". It is Capacity To Ship Packages with \"days\" renamed \"parts\": allowing a larger part sum never needs more parts.",
  brute="Try every way to place k - 1 cut points: C(n - 1, k - 1) splits, or a dynamic program in O(k × n²).",
  approach="Search the largest part sum L in [max(nums), sum(nums)]. For a given L, cut greedily: extend the current part until adding the next number would exceed L, then start a new part. Find the first L that needs at most k parts. Using fewer than k parts is fine, because a part can always be split further without raising the maximum.",
  cx="O(n log(sum)) time, O(1) space.",
  trap="Worrying that the greedy check might use fewer than k parts. Splitting any part with two or more elements never increases the largest sum, so \"at most k\" is the right test.",
  py='''class Solution:
    def splitArray(self, nums: list[int], k: int) -> int:
        def parts_needed(limit):       # greedy: close a part only when forced to
            parts, total = 1, 0
            for x in nums:
                if total + x > limit:
                    parts, total = parts + 1, 0
                total += x
            return parts

        lo, hi = max(nums), sum(nums)
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if parts_needed(mid) <= k:
                hi = mid
            else:
                lo = mid + 1
        return lo''',
  java='''class Solution {
    public int splitArray(int[] nums, int k) {
        int lo = 0, hi = 0;
        for (int x : nums) { lo = Math.max(lo, x); hi += x; }
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            int parts = 1, total = 0;  // greedy: close a part only when forced to
            for (int x : nums) {
                if (total + x > mid) { parts++; total = 0; }
                total += x;
            }
            if (parts <= k) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}''')

prob(num=2141, slug="maximum-running-time-of-n-computers", title="Maximum Running Time of N Computers", diff="Hard",
  method="maxRunTime",
  ask="Run n computers at the same time. Each battery can power one computer at a time and can be swapped between computers at any moment. Find the longest time all n can run together.",
  cue="Longer is harder, so \"can all n run for T minutes?\" is monotone. The insight is the check: a battery can contribute at most T minutes (it can only power one computer at a time), so T is achievable exactly when the batteries' capped total, the sum of min(b, T), is at least n × T.",
  brute="Simulate minute by minute, each minute powering the n computers from the n fullest batteries: O(T × n log n), with T up to 10¹⁴.",
  approach="Search T in [0, sum(batteries) // n + 1) for the first T that is not achievable, and return T - 1. Test a T by summing min(b, T) over the batteries and comparing with n × T.",
  cx="O(m log(sum / n)) time for m batteries, O(1) space.",
  trap="Overflow: the battery total reaches 10¹⁴, so both the search range and n × T need long in Java, which is why the method returns long. And the cap matters: without min(b, T), one enormous battery looks like it can power several computers at once.",
  py='''class Solution:
    def maxRunTime(self, n: int, batteries: list[int]) -> int:
        lo, hi = 0, sum(batteries) // n + 1   # first T that cannot be reached
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if sum(min(b, mid) for b in batteries) < n * mid:   # a battery gives at most T
                hi = mid
            else:
                lo = mid + 1
        return lo - 1''',
  java='''class Solution {
    public long maxRunTime(int n, int[] batteries) {
        long total = 0;
        for (int b : batteries) total += b;
        long lo = 0, hi = total / n + 1;   // long: the total reaches 10^14
        while (lo < hi) {
            long mid = lo + (hi - lo) / 2;
            long usable = 0;
            for (int b : batteries) usable += Math.min(b, mid);   // a battery gives at most T
            if (usable < (long) n * mid) hi = mid;
            else lo = mid + 1;
        }
        return lo - 1;
    }
}''')

prob(num=719, slug="find-k-th-smallest-pair-distance", title="Find K-th Smallest Pair Distance", diff="Hard",
  method="smallestDistancePair",
  ask="Among all pairs of numbers in an array, find the k-th smallest distance |a - b|.",
  cue="Listing all n(n - 1)/2 distances is 5 × 10⁷ at n = 10,000. Instead search the answer d: \"are at least k pairs within distance d?\" is monotone in d, and counting those pairs on a sorted array is Chapter 8's two-pointer scan.",
  brute="Compute every pair distance and sort: O(n² log n).",
  approach="Sort. Search d in [0, max - min] for the first d with at least k pairs of distance ≤ d. To count them, move a right pointer j across the array while a left pointer i advances until nums[j] - nums[i] ≤ d; every index from i to j - 1 pairs with j, adding j - i.",
  cx="O(n log n + n log(range)) time, O(1) extra space.",
  trap="Returning a d that is not an actual pair distance. It cannot happen here: the first d with count ≥ k is always a real distance, because the count only changes at real distances.",
  py='''class Solution:
    def smallestDistancePair(self, nums: list[int], k: int) -> int:
        nums.sort()

        def pairs_within(d):           # Chapter 8's two-pointer count
            count = i = 0
            for j in range(len(nums)):
                while nums[j] - nums[i] > d:
                    i += 1
                count += j - i
            return count

        lo, hi = 0, nums[-1] - nums[0]
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if pairs_within(mid) >= k:
                hi = mid
            else:
                lo = mid + 1
        return lo''',
  java='''import java.util.Arrays;

class Solution {
    public int smallestDistancePair(int[] nums, int k) {
        Arrays.sort(nums);
        int lo = 0, hi = nums[nums.length - 1] - nums[0];
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            int count = 0;             // Chapter 8's two-pointer count
            for (int i = 0, j = 0; j < nums.length; j++) {
                while (nums[j] - nums[i] > mid) i++;
                count += j - i;
            }
            if (count >= k) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}''', check_args=False)

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(14)
def arr(lo, hi, nmin=1, nmax=8): return [R.randint(lo, hi) for _ in range(R.randint(nmin, nmax))]

def gen875():
    piles = arr(1, 30); return [piles, R.randint(len(piles), len(piles) + 20)]
def brute875(piles, h):
    return next(k for k in range(1, max(piles) + 1) if sum(-(-p // k) for p in piles) <= h)

def gen1011():
    w = arr(1, 10); return [w, R.randint(1, len(w))]
def brute1011(w, days):
    def ok(cap):
        for cuts in range(len(w)):
            for c in combinations(range(1, len(w)), cuts):
                edges = [0, *c, len(w)]
                if all(sum(w[a:b]) <= cap for a, b in zip(edges, edges[1:])) and cuts + 1 <= days: return True
        return False
    return next(c for c in range(max(w), sum(w) + 1) if ok(c))

def gen1482():
    b = arr(1, 12); return [b, R.randint(1, 4), R.randint(1, 3)]
def brute1482(b, m, k):
    for day in sorted(set(b)):
        run = 0; made = 0
        for x in b:
            run = run + 1 if x <= day else 0
            if run == k: made += 1; run = 0
        if made >= m: return day
    return -1

def gen1283():
    a = arr(1, 30); return [a, R.randint(len(a), len(a) + 40)]

def gen1552():
    pos = R.sample(range(1, 40), R.randint(2, 7)); return [pos, R.randint(2, len(pos))]
def brute1552(pos, m):
    return max(min(b - a for a, b in zip(c, c[1:])) for c in combinations(sorted(pos), m))

def gen410():
    a = arr(0, 10); return [a, R.randint(1, len(a))]
def brute410(a, k):
    best = None
    for c in combinations(range(1, len(a)), k - 1):
        edges = [0, *c, len(a)]
        v = max(sum(a[x:y]) for x, y in zip(edges, edges[1:]))
        best = v if best is None else min(best, v)
    return best

def gen2141():
    b = arr(1, 6, 1, 6); return [R.randint(1, len(b)), b]
def brute2141(n, b):
    b, t = b[:], 0
    while True:                       # each minute, power from the n fullest batteries
        b.sort(reverse=True)
        if b[n - 1] == 0: return t
        for i in range(n): b[i] -= 1
        t += 1

def gen719():
    a = arr(0, 15, 2, 8); return [a, R.randint(1, len(a) * (len(a) - 1) // 2)]

BRUTE = {
  69:   (lambda: [R.choice([R.randint(0, 200), R.randint(0, 2**31 - 1), R.randint(0, 50) ** 2])], math.isqrt),
  367:  (lambda: [R.choice([R.randint(1, 200), R.randint(1, 46340) ** 2, R.randint(1, 2**31 - 1)])], lambda n: math.isqrt(n) ** 2 == n),
  441:  (lambda: [R.choice([R.randint(1, 100), R.randint(1, 2**31 - 1)])], lambda n: (math.isqrt(8 * n + 1) - 1) // 2),
  875:  (gen875, brute875),
  1011: (gen1011, brute1011),
  1482: (gen1482, brute1482),
  1283: (gen1283, lambda a, t: next(d for d in range(1, max(a) + 1) if sum(-(-x // d) for x in a) <= t)),
  2226: (lambda: [arr(1, 20), R.randint(1, 60)],
         lambda c, k: max([x for x in range(1, max(c) + 1) if sum(v // x for v in c) >= k] or [0])),
  1552: (gen1552, brute1552),
  410:  (gen410, brute410),
  2141: (gen2141, brute2141),
  719:  (gen719, lambda a, k: sorted(abs(a[i] - a[j]) for i, j in combinations(range(len(a)), 2))[k - 1]),
}
