# Chapter 3 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
import random
from itertools import combinations

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

def beautiful_ok(r, a):
    n = a[0]
    if sorted(r) != list(range(1, n + 1)): return False
    return not any(2 * r[k] == r[i] + r[j] for i in range(n) for j in range(i + 2, n) for k in range(i + 1, j))

# ---------------------------------------------------------------- Easy
prob(num=1763, slug="longest-nice-substring", title="Longest Nice Substring", diff="Easy",
  method="longestNiceSubstring",
  ask="A string is nice if every letter in it appears in both upper and lower case. Return the longest nice substring (the earliest one on a tie, or \"\" if there is none).",
  cue="A letter whose other case is missing from the whole string can never be inside a nice substring. So it splits the problem: the answer lies entirely to its left or entirely to its right. Splitting and solving the pieces is divide and conquer.",
  brute="Check every substring for niceness: O(n²) substrings with an O(n) check each, O(n³), which is fine for n ≤ 100 but teaches nothing.",
  approach="If the string is nice, return it. Otherwise find the first character whose other case does not occur in the string, solve the part before it and the part after it recursively, and return the longer answer, preferring the left one on a tie so the earliest wins.",
  cx="O(n²) in the worst case: each level does O(n) work, and a split can peel off a single character (try \"aaaa\"), like quicksort's worst case. Fine at the problem's n ≤ 100.",
  trap="Returning the right piece when the two answers have equal length. The problem asks for the earliest, so compare with ≥ in favour of the left.",
  py='''class Solution:
    def longestNiceSubstring(self, s: str) -> str:
        chars = set(s)
        for i, c in enumerate(s):
            if c.swapcase() not in chars:          # c can never be in a nice substring
                left = self.longestNiceSubstring(s[:i])
                right = self.longestNiceSubstring(s[i + 1:])
                return left if len(left) >= len(right) else right   # earliest on a tie
        return s                                   # every letter has its partner''',
  java='''import java.util.HashSet;

class Solution {
    public String longestNiceSubstring(String s) {
        HashSet<Character> chars = new HashSet<>();
        for (char c : s.toCharArray()) chars.add(c);
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            char other = Character.isUpperCase(c) ? Character.toLowerCase(c) : Character.toUpperCase(c);
            if (!chars.contains(other)) {          // c can never be in a nice substring
                String left = longestNiceSubstring(s.substring(0, i));
                String right = longestNiceSubstring(s.substring(i + 1));
                return left.length() >= right.length() ? left : right;   // earliest on a tie
            }
        }
        return s;                                  // every letter has its partner
    }
}''')

# ---------------------------------------------------------------- Medium
prob(num=241, slug="different-ways-to-add-parentheses", title="Different Ways to Add Parentheses", diff="Medium",
  method="diffWaysToCompute", observe=lambda r, a: sorted(r),
  ask="Given an expression of numbers and + - *, return every value you can get by adding parentheses in different ways (with repeats, in any order).",
  cue="Every way of parenthesizing has a last operation to be applied. Choose it, and the left and right sides are the same problem on smaller expressions: divide at every operator, conquer each side, combine every pair of results.",
  brute="There is no simpler correct method; the number of answers itself grows like the Catalan numbers, so any solution is exponential in the number of operators.",
  approach="If the expression is a plain number, return it. Otherwise, for each operator position, recursively compute all values of the left part and all values of the right part, and combine every left value with every right value using that operator.",
  cx="Exponential, bounded by the Catalan numbers: about 1,430 results for 8 operators. Remembering the results for each substring (Chapter 19's memoization) avoids recomputing shared pieces.",
  trap="Treating each digit as a number. Values can have two digits, like \"11\", so the base case is \"no operator in this piece\", not \"one character long\".",
  py='''class Solution:
    def diffWaysToCompute(self, expression: str) -> list[int]:
        out = []
        for i, c in enumerate(expression):
            if c in "+-*":                         # c is the last operation applied
                for a in self.diffWaysToCompute(expression[:i]):
                    for b in self.diffWaysToCompute(expression[i + 1:]):
                        out.append(a + b if c == "+" else a - b if c == "-" else a * b)
        return out or [int(expression)]            # no operator: a plain number''',
  java='''import java.util.*;

class Solution {
    public List<Integer> diffWaysToCompute(String expression) {
        List<Integer> out = new ArrayList<>();
        for (int i = 0; i < expression.length(); i++) {
            char c = expression.charAt(i);
            if (c != '+' && c != '-' && c != '*') continue;   // c is the last operation
            for (int a : diffWaysToCompute(expression.substring(0, i)))
                for (int b : diffWaysToCompute(expression.substring(i + 1)))
                    out.add(c == '+' ? a + b : c == '-' ? a - b : a * b);
        }
        if (out.isEmpty()) out.add(Integer.parseInt(expression));   // a plain number
        return out;
    }
}''')

prob(num=240, slug="search-a-2d-matrix-ii", title="Search a 2D Matrix II", diff="Medium",
  method="searchMatrix",
  ask="Every row and every column of a grid is sorted in increasing order. Decide whether a target value is in the grid.",
  cue="A tempting divide and conquer checks the middle cell and throws away one of four quadrants, leaving three. The Master Theorem section prices that: T(n) = 3T(n/2) + O(1) is O(n^1.58) for an n × n grid, worse than O(m + n). A better idea discards a whole row or column per step.",
  brute="Scan every cell: O(m × n). Binary-searching every row is O(m log n).",
  approach="Start at the top-right corner. If the value there is bigger than the target, everything below it in that column is bigger too, so drop the column (move left). If it is smaller, everything to its left in that row is smaller, so drop the row (move down). Each step removes a row or a column.",
  cx="O(m + n) time, O(1) space.",
  trap="Starting at the top-left corner. There both neighbours are bigger, so a too-small value gives no direction. The top-right and bottom-left corners are the two where one move increases and the other decreases.",
  py='''class Solution:
    def searchMatrix(self, matrix: list[list[int]], target: int) -> bool:
        r, c = 0, len(matrix[0]) - 1               # top-right corner
        while r < len(matrix) and c >= 0:
            v = matrix[r][c]
            if v == target:
                return True
            if v > target:
                c -= 1                             # the rest of this column is bigger
            else:
                r += 1                             # the rest of this row is smaller
        return False''',
  java='''class Solution {
    public boolean searchMatrix(int[][] matrix, int target) {
        int r = 0, c = matrix[0].length - 1;       // top-right corner
        while (r < matrix.length && c >= 0) {
            int v = matrix[r][c];
            if (v == target) return true;
            if (v > target) c--;                   // the rest of this column is bigger
            else r++;                              // the rest of this row is smaller
        }
        return false;
    }
}''')

prob(num=932, slug="beautiful-array", title="Beautiful Array", diff="Medium",
  method="beautifulArray", observe=beautiful_ok,
  ask="Arrange 1 to n so that for no i &lt; k &lt; j is the middle value nums[k] exactly the average of nums[i] and nums[j]. Any valid arrangement is accepted.",
  cue="If all the odd numbers come first and all the even numbers after, no average can straddle the two halves, because odd + even is odd and cannot be twice anything. So only pairs inside each half matter, and each half is a smaller copy of the same problem.",
  brute="Try permutations until one works: O(n!).",
  approach="Build it recursively: take a beautiful arrangement of (n + 1) // 2 numbers and map each x to 2x - 1 (the odd numbers), take a beautiful arrangement of n // 2 numbers and map each x to 2x (the even numbers), and put the odd half first. Doubling and shifting every value keeps an arrangement beautiful, because it preserves which value is an average of which.",
  cx="O(n log n) time: T(n) = 2T(n/2) + O(n), the merge-sort recurrence. O(n log n) space as written; memoizing by n makes it O(n).",
  trap="Trying to verify an answer by comparing it with a sample output. Many arrangements are beautiful; a checker must test the property, which is what the test for this solution does.",
  py='''class Solution:
    def beautifulArray(self, n: int) -> list[int]:
        if n == 1:
            return [1]
        odds = [2 * x - 1 for x in self.beautifulArray((n + 1) // 2)]
        evens = [2 * x for x in self.beautifulArray(n // 2)]
        return odds + evens                        # no average straddles the halves''',
  java='''import java.util.*;

class Solution {
    public int[] beautifulArray(int n) {
        if (n == 1) return new int[]{1};
        int[] odd = beautifulArray((n + 1) / 2), even = beautifulArray(n / 2);
        int[] out = new int[n];
        int i = 0;
        for (int x : odd) out[i++] = 2 * x - 1;
        for (int x : even) out[i++] = 2 * x;       // no average straddles the halves
        return out;
    }
}''')

prob(num=395, slug="longest-substring-with-at-least-k-repeating-characters", title="Longest Substring with At Least K Repeating Characters", diff="Medium",
  method="longestSubstring",
  ask="Find the length of the longest substring in which every character appears at least k times.",
  cue="A character that appears fewer than k times in the whole string cannot be in any valid substring, so it splits the string into pieces that can be solved separately. The same split as Longest Nice Substring.",
  brute="Check every substring's counts: O(n²) substrings, O(26) each with running counts, about 1.3 billion steps at n = 10,000.",
  approach="Count the characters. If every character appears at least k times, the whole string is the answer. Otherwise split the string at every character that appears fewer than k times, solve each piece recursively, and return the largest answer.",
  cx="O(26 × n): each level of recursion removes at least one distinct letter entirely, so there are at most 26 levels, each doing O(n) work in total.",
  trap="A sliding window looks natural here and does not work directly: adding a character can make the window either more or less valid, so the window does not shrink monotonically (Chapter 8's failure case). Divide and conquer sidesteps that.",
  py='''from collections import Counter

class Solution:
    def longestSubstring(self, s: str, k: int) -> int:
        count = Counter(s)
        for c in count:
            if count[c] < k:                       # c splits the problem
                return max(self.longestSubstring(piece, k) for piece in s.split(c))
        return len(s)                              # every character appears k times''',
  java='''class Solution {
    public int longestSubstring(String s, int k) {
        int[] count = new int[26];
        for (char c : s.toCharArray()) count[c - 'a']++;
        for (int c = 0; c < 26; c++) {
            if (count[c] > 0 && count[c] < k) {    // this letter splits the problem
                int best = 0;
                for (String piece : s.split(String.valueOf((char) ('a' + c))))
                    best = Math.max(best, longestSubstring(piece, k));
                return best;
            }
        }
        return s.length();                         // every character appears k times
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=315, slug="count-of-smaller-numbers-after-self", title="Count of Smaller Numbers After Self", diff="Hard",
  method="countSmaller",
  ask="For each position, count how many values to its right are smaller than it.",
  cue="Split the array in half. Pairs inside each half are the same problem, smaller. Pairs that cross the middle (left element, right element) can all be counted during the merge step of merge sort, the way closest pair handles the strip across the split line in the Divide and Conquer as a Paradigm section.",
  brute="For each position, scan everything to its right: O(n²), 5 × 10⁹ steps at n = 100,000.",
  approach="Merge-sort the indices by value. While merging a left half and a right half (both sorted), keep a count of how many right-half elements have already been placed. When a left-half element is placed, every right-half element placed before it is smaller and was to its right in the original array: add that count to its answer.",
  cx="O(n log n) time: T(n) = 2T(n/2) + O(n). O(n) extra space.",
  trap="Sorting values instead of indices. The answers belong to original positions, and after sorting you cannot tell which position a value came from, especially with duplicates. Sort indices and compare their values. On equal values, place the left element first so equal values are not counted as smaller.",
  py='''class Solution:
    def countSmaller(self, nums: list[int]) -> list[int]:
        counts = [0] * len(nums)

        def sort(idx):                             # merge sort of indices by value
            if len(idx) <= 1:
                return idx
            mid = len(idx) // 2
            left, right = sort(idx[:mid]), sort(idx[mid:])
            merged, j = [], 0
            for i in left:
                while j < len(right) and nums[right[j]] < nums[i]:
                    merged.append(right[j])        # smaller, and was to the right of i
                    j += 1
                counts[i] += j                     # crossing pairs counted in the merge
                merged.append(i)
            return merged + right[j:]

        sort(list(range(len(nums))))
        return counts''',
  java='''import java.util.*;

class Solution {
    private int[] nums, counts, tmp;

    public List<Integer> countSmaller(int[] nums) {
        int n = nums.length;
        this.nums = nums;
        counts = new int[n];
        tmp = new int[n];
        int[] idx = new int[n];
        for (int i = 0; i < n; i++) idx[i] = i;
        sort(idx, 0, n);                           // merge sort of indices by value
        List<Integer> out = new ArrayList<>();
        for (int c : counts) out.add(c);
        return out;
    }

    private void sort(int[] idx, int lo, int hi) {
        if (hi - lo <= 1) return;
        int mid = (lo + hi) / 2;
        sort(idx, lo, mid);
        sort(idx, mid, hi);
        int j = mid, k = lo;
        for (int i = lo; i < mid; i++) {
            while (j < hi && nums[idx[j]] < nums[idx[i]]) tmp[k++] = idx[j++];   // smaller, to the right
            counts[idx[i]] += j - mid;             // crossing pairs counted in the merge
            tmp[k++] = idx[i];
        }
        while (j < hi) tmp[k++] = idx[j++];
        System.arraycopy(tmp, lo, idx, lo, hi - lo);
    }
}''')

prob(num=493, slug="reverse-pairs", title="Reverse Pairs", diff="Hard",
  method="reversePairs",
  ask="Count the pairs i &lt; j with nums[i] > 2 × nums[j].",
  cue="Count Smaller After Self with a different comparison. Pairs inside each half are counted recursively; crossing pairs are counted between two sorted halves with one forward-moving pointer, before merging them.",
  brute="Check every pair: O(n²), about 1.25 × 10⁹ at n = 50,000.",
  approach="Merge-sort the array. After both halves are sorted and before merging, walk the left half with i while a pointer j moves forward through the right half as long as left[i] > 2 × right[j]. Because the left half is sorted, j never needs to move back, so each crossing count costs O(n) per level. Add j to the total for each i, then merge.",
  cx="O(n log n) time, O(n) extra space.",
  trap="Overflow. Values reach 2³¹ - 1, so 2 × nums[j] does not fit in a Java int; compute it in long. And count before merging: the comparison is not the merge's own ordering, so it cannot be folded into the merge loop.",
  py='''class Solution:
    def reversePairs(self, nums: list[int]) -> int:
        def sort(a):                               # returns (sorted a, pairs inside a)
            if len(a) <= 1:
                return a, 0
            mid = len(a) // 2
            left, x = sort(a[:mid])
            right, y = sort(a[mid:])
            count, j = x + y, 0
            for v in left:                         # crossing pairs, before merging
                while j < len(right) and v > 2 * right[j]:
                    j += 1
                count += j
            return sorted(left + right), count     # Timsort merges two sorted runs in O(n)

        return sort(nums)[1]''',
  java='''class Solution {
    private int[] tmp;

    public int reversePairs(int[] nums) {
        tmp = new int[nums.length];
        return sort(nums, 0, nums.length);
    }

    private int sort(int[] a, int lo, int hi) {
        if (hi - lo <= 1) return 0;
        int mid = (lo + hi) / 2;
        int count = sort(a, lo, mid) + sort(a, mid, hi);
        int j = mid;
        for (int i = lo; i < mid; i++) {           // crossing pairs, before merging
            while (j < hi && (long) a[i] > 2L * a[j]) j++;   // long: 2 * a[j] can overflow
            count += j - mid;
        }
        int i = lo, k = lo;                        // standard merge
        j = mid;
        while (i < mid || j < hi)
            tmp[k++] = (j >= hi || (i < mid && a[i] <= a[j])) ? a[i++] : a[j++];
        System.arraycopy(tmp, lo, a, lo, hi - lo);
        return count;
    }
}''', check_args=False)

prob(num=327, slug="count-of-range-sum", title="Count of Range Sum", diff="Hard",
  method="countRangeSum",
  ask="Count the blocks of consecutive values whose sum lies between lower and upper, inclusive.",
  cue="Chapter 9 turns every block sum into a difference of two prefix sums, P[j] - P[i] with i &lt; j. The question becomes: count pairs i &lt; j with lower ≤ P[j] - P[i] ≤ upper. Counting ordered pairs by a condition on their values is the crossing-pairs merge step again.",
  brute="Try every block with a running sum: O(n²), 5 × 10⁹ at n = 100,000.",
  approach="Build the prefix sums P (with P[0] = 0) and merge-sort them. For two sorted halves, walk each left value p with two forward-moving pointers into the right half: lo stops at the first value ≥ p + lower, hi at the first value > p + upper. The right values in between make valid pairs with p, so add hi - lo. Both pointers only move forward because p increases.",
  cx="O(n log n) time, O(n) extra space.",
  trap="Overflow: values reach ±2³¹, so prefix sums need long in Java. And the prefix array has n + 1 entries, because P[0] = 0 is what counts blocks that start at position 0.",
  py='''class Solution:
    def countRangeSum(self, nums: list[int], lower: int, upper: int) -> int:
        P = [0]                                    # Chapter 9's prefix sums
        for x in nums:
            P.append(P[-1] + x)

        def sort(a):                               # returns (sorted a, pairs inside a)
            if len(a) <= 1:
                return a, 0
            mid = len(a) // 2
            left, x = sort(a[:mid])
            right, y = sort(a[mid:])
            count, lo, hi = x + y, 0, 0
            for p in left:                         # crossing pairs (i in left, j in right)
                while lo < len(right) and right[lo] - p < lower:
                    lo += 1
                while hi < len(right) and right[hi] - p <= upper:
                    hi += 1
                count += hi - lo
            return sorted(left + right), count

        return sort(P)[1]''',
  java='''class Solution {
    private long[] tmp;
    private int lower, upper;

    public int countRangeSum(int[] nums, int lower, int upper) {
        this.lower = lower;
        this.upper = upper;
        long[] P = new long[nums.length + 1];      // long: sums pass 2^31
        for (int i = 0; i < nums.length; i++) P[i + 1] = P[i] + nums[i];
        tmp = new long[P.length];
        return sort(P, 0, P.length);
    }

    private int sort(long[] a, int from, int to) {
        if (to - from <= 1) return 0;
        int mid = (from + to) / 2;
        int count = sort(a, from, mid) + sort(a, mid, to);
        int lo = mid, hi = mid;
        for (int i = from; i < mid; i++) {         // crossing pairs (i left, j right)
            while (lo < to && a[lo] - a[i] < lower) lo++;
            while (hi < to && a[hi] - a[i] <= upper) hi++;
            count += hi - lo;
        }
        int i = from, j = mid, k = from;           // standard merge
        while (i < mid || j < to)
            tmp[k++] = (j >= to || (i < mid && a[i] <= a[j])) ? a[i++] : a[j++];
        System.arraycopy(tmp, from, a, from, to - from);
        return count;
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(3)
def arr(lo, hi, nmin=1, nmax=10): return [R.randint(lo, hi) for _ in range(R.randint(nmin, nmax))]

def brute1763(s):
    best = ""
    for i in range(len(s)):
        for j in range(i + 1, len(s) + 1):
            t = s[i:j]
            if all(c.swapcase() in t for c in t) and len(t) > len(best): best = t
    return best

def gen241():
    parts = [str(R.randint(0, 20))]
    for _ in range(R.randint(0, 4)): parts += [R.choice("+-*"), str(R.randint(0, 20))]
    return ["".join(parts)]
def brute241(e):
    import re
    toks = re.findall(r"\d+|[+*-]", e)
    def all_vals(t):
        if len(t) == 1: return [int(t[0])]
        out = []
        for k in range(1, len(t), 2):
            for a in all_vals(t[:k]):
                for b in all_vals(t[k + 1:]):
                    out.append(eval(f"({a}){t[k]}({b})"))
        return out
    return sorted(all_vals(toks))

def gen240():
    r, c = R.randint(1, 5), R.randint(1, 5); g = [[0] * c for _ in range(r)]
    for i in range(r):
        for j in range(c):
            g[i][j] = max(g[i - 1][j] if i else -5, g[i][j - 1] if j else -5) + R.randint(0, 3)
    return [g, R.randint(-5, 25)]

def brute395(s, k):
    return max([j - i for i in range(len(s)) for j in range(i + 1, len(s) + 1)
                if all(s[i:j].count(c) >= k for c in set(s[i:j]))] or [0])

BRUTE = {
  1763: (lambda: ["".join(R.choice("aAbBcC") for _ in range(R.randint(1, 10)))], brute1763),
  241:  (gen241, brute241),
  240:  (gen240, lambda g, t: any(t in row for row in g)),
  932:  (lambda: [R.randint(1, 24)], lambda n: True),
  395:  (lambda: ["".join(R.choice("abc") for _ in range(R.randint(1, 12))), R.randint(1, 4)], brute395),
  315:  (lambda: [arr(-5, 5)], lambda a: [sum(1 for y in a[i + 1:] if y < a[i]) for i in range(len(a))]),
  493:  (lambda: [R.choice([arr(-10, 10), arr(-2**31, 2**31 - 1)])],
         lambda a: sum(1 for i, j in combinations(range(len(a)), 2) if a[i] > 2 * a[j])),
  327:  (lambda: [R.choice([arr(-5, 5), arr(-2**31, 2**31 - 1)]), *sorted([R.randint(-8, 8), R.randint(-8, 8)])],
         lambda a, lo, hi: sum(1 for i in range(len(a)) for j in range(i + 1, len(a) + 1) if lo <= sum(a[i:j]) <= hi)),
}
