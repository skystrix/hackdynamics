# Chapter 17 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
import random
from collections import Counter
from itertools import combinations, product
from math import gcd

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

# ---------------------------------------------------------------- Easy
prob(num=1, slug="two-sum", title="Two Sum", diff="Easy",
  method="twoSum",
  ask="Find the positions of the two numbers in an unsorted array that add up to a target. Exactly one such pair exists.",
  cue="For each number you need to know, instantly, whether its partner target - x has been seen, and where. \"Have I seen this value, and where?\" is a hash map lookup: The Patterns That Are Secretly This section.",
  brute="Check every pair: O(n²), about 5 × 10⁷ pairs at n = 10,000. Sorting and using Chapter 8's two pointers is O(n log n), but sorting loses the original positions you have to return.",
  approach="Walk the array once, keeping a map from each value seen so far to its position. For the value at position i, look up target - nums[i]. If it is in the map, you have the pair; otherwise record nums[i] and move on.",
  cx="O(n) expected time, O(n) space.",
  trap="Inserting nums[i] into the map before looking up its partner. With target = 6 and nums[i] = 3, the lookup finds 3 itself and returns the same position twice. Look up first, then insert.",
  py='''class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}                      # value -> position
        for i, x in enumerate(nums):
            if target - x in seen:     # look up before inserting x itself
                return [seen[target - x], i]
            seen[x] = i
        return []''',
  java='''import java.util.HashMap;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> seen = new HashMap<>();   // value -> position
        for (int i = 0; i < nums.length; i++) {
            Integer j = seen.get(target - nums[i]);         // look up before inserting
            if (j != null) return new int[]{j, i};
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}''')

prob(num=217, slug="contains-duplicate", title="Contains Duplicate", diff="Easy",
  method="containsDuplicate",
  ask="Decide whether any value appears at least twice in an array.",
  cue="\"Have I seen this before?\" on every element is the hash set's single job.",
  brute="Compare every pair: O(n²). Sorting and checking neighbours: O(n log n) and no extra memory.",
  approach="Walk the array with a set of values seen so far. If the current value is already in the set, answer true; otherwise add it. If the walk finishes, answer false.",
  cx="O(n) expected time, O(n) space. The sort-based version trades that memory for O(n log n) time.",
  trap="Forgetting that \"expected\" is doing work in O(n) expected. The Hash Flooding section shows inputs chosen so that every value lands in one bucket. Java caps the damage for Integer keys by treeifying a flooded bucket (they are Comparable), so a lookup stays O(log n). CPython randomizes string hashes, but not integer hashes, so crafted integer inputs can still slow a Python set down.",
  py='''class Solution:
    def containsDuplicate(self, nums: list[int]) -> bool:
        seen = set()
        for x in nums:
            if x in seen:
                return True
            seen.add(x)
        return False''',
  java='''import java.util.HashSet;

class Solution {
    public boolean containsDuplicate(int[] nums) {
        HashSet<Integer> seen = new HashSet<>();
        for (int x : nums)
            if (!seen.add(x)) return true;   // add returns false if already present
        return false;
    }
}''')

prob(num=242, slug="valid-anagram", title="Valid Anagram", diff="Easy",
  method="isAnagram",
  ask="Decide whether two strings use exactly the same letters the same number of times.",
  cue="Compare letter counts. With only 26 lowercase letters, the \"hash table\" can be a plain array indexed by letter: The Problem, and Why an Array Is Not the Answer section explains when an array is the answer, and a small known key range is that case.",
  brute="Sort both strings and compare: O(n log n).",
  approach="If the lengths differ, answer false. Otherwise add 1 for each letter of s and subtract 1 for each letter of t in a 26-slot array. The strings are anagrams exactly when every slot ends at 0.",
  cx="O(n) time, O(1) space for 26 counters.",
  trap="The follow-up asks about Unicode. A 26-slot array no longer covers the keys, and that is precisely when you switch to a real hash map (Counter in Python, HashMap in Java).",
  py='''class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        if len(s) != len(t):
            return False
        count = [0] * 26               # 26 known keys: an array is the hash table
        for a, b in zip(s, t):
            count[ord(a) - 97] += 1
            count[ord(b) - 97] -= 1
        return not any(count)''',
  java='''class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] count = new int[26];     // 26 known keys: an array is the hash table
        for (int i = 0; i < s.length(); i++) {
            count[s.charAt(i) - 'a']++;
            count[t.charAt(i) - 'a']--;
        }
        for (int c : count) if (c != 0) return false;
        return true;
    }
}''')

prob(num=706, slug="design-hashmap", title="Design HashMap", diff="Easy", design=True,
  ask="Build a map from integer keys to integer values with put, get (returning -1 for a missing key) and remove, without a built-in hash table.",
  cue="The chapter in miniature: a hash function to pick a bucket, the Chaining section's buckets as lists, and the Load Factor section's one knob, which decides when to grow the table.",
  brute="A list of (key, value) pairs searched on every call: O(n) per operation. Or an array of 10⁶ + 1 slots indexed by key, which works only because this problem caps keys at 10⁶.",
  approach="Keep an array of buckets, each a list of [key, value] pairs, and send key k to bucket k mod (number of buckets). put updates the pair if the key is present, otherwise appends it; get and remove search only that bucket. When the number of keys exceeds the number of buckets (load factor above 1), double the bucket count and reinsert everything, so buckets stay short on average.",
  cx="O(1) expected per operation, with each resize's O(n) cost amortized over the insertions that caused it (Chapter 4's argument). O(n) space.",
  trap="With open addressing instead of chaining, deleting by emptying the slot breaks later lookups that probed past it. The Open Addressing, and the Deletion Bug section explains why deletions must leave a tombstone. Chaining avoids the problem, because removal only touches one bucket's list.",
  py='''class MyHashMap:
    def __init__(self):
        self.buckets = [[] for _ in range(8)]
        self.size = 0

    def _bucket(self, key):
        return self.buckets[key % len(self.buckets)]

    def put(self, key: int, value: int) -> None:
        b = self._bucket(key)
        for pair in b:
            if pair[0] == key:
                pair[1] = value        # update in place
                return
        b.append([key, value])
        self.size += 1
        if self.size > len(self.buckets):          # load factor above 1: grow
            old = self.buckets
            self.buckets = [[] for _ in range(2 * len(old))]
            for bucket in old:
                for k, v in bucket:
                    self._bucket(k).append([k, v])

    def get(self, key: int) -> int:
        for k, v in self._bucket(key):
            if k == key:
                return v
        return -1

    def remove(self, key: int) -> None:
        b = self._bucket(key)
        for i, pair in enumerate(b):
            if pair[0] == key:
                b.pop(i)               # chaining: removal touches one list only
                self.size -= 1
                return''',
  java='''import java.util.*;

class MyHashMap {
    private List<int[]>[] buckets = newBuckets(8);
    private int size = 0;

    @SuppressWarnings("unchecked")
    private static List<int[]>[] newBuckets(int n) {
        List<int[]>[] b = new List[n];
        for (int i = 0; i < n; i++) b[i] = new ArrayList<>();
        return b;
    }

    private List<int[]> bucket(int key) { return buckets[key % buckets.length]; }

    public MyHashMap() {}

    public void put(int key, int value) {
        for (int[] pair : bucket(key))
            if (pair[0] == key) { pair[1] = value; return; }   // update in place
        bucket(key).add(new int[]{key, value});
        if (++size > buckets.length) {                         // load factor above 1: grow
            List<int[]>[] old = buckets;
            buckets = newBuckets(2 * old.length);
            for (List<int[]> b : old) for (int[] pair : b) bucket(pair[0]).add(pair);
        }
    }

    public int get(int key) {
        for (int[] pair : bucket(key)) if (pair[0] == key) return pair[1];
        return -1;
    }

    public void remove(int key) {
        if (bucket(key).removeIf(pair -> pair[0] == key)) size--;   // one list only
    }
}''')

# ---------------------------------------------------------------- Medium
prob(num=49, slug="group-anagrams", title="Group Anagrams", diff="Medium",
  method="groupAnagrams", observe=lambda r, a: sorted(sorted(g) for g in r),
  ask="Group a list of words so that anagrams of each other end up in the same group (groups and words in any order).",
  cue="Two words are anagrams exactly when they have the same canonical form, for example their letters sorted. Grouping by a canonical key is a hash map from key to list.",
  brute="Compare every pair of words with Valid Anagram: O(n² × L).",
  approach="For each word, compute its key, the word's letters in sorted order, and append the word to the map's list for that key. The map's values are the groups.",
  cx="O(n × L log L) time for n words of length up to L, O(n × L) space. A 26-count tuple as the key makes it O(n × L).",
  trap="Using a mutable list as a Python dict key, which raises TypeError. Use a string or a tuple. The Java version keeps groups in first-seen order with LinkedHashMap; plain HashMap is also correct, since any order is accepted.",
  py='''class Solution:
    def groupAnagrams(self, strs: list[str]) -> list[list[str]]:
        groups = {}                    # canonical key -> words with that key
        for w in strs:
            key = "".join(sorted(w))   # a string, so it can be a dict key
            groups.setdefault(key, []).append(w)
        return list(groups.values())''',
  java='''import java.util.*;

class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> groups = new LinkedHashMap<>();   // key -> its words
        for (String w : strs) {
            char[] c = w.toCharArray();
            Arrays.sort(c);
            groups.computeIfAbsent(new String(c), k -> new ArrayList<>()).add(w);
        }
        return new ArrayList<>(groups.values());
    }
}''')

prob(num=128, slug="longest-consecutive-sequence", title="Longest Consecutive Sequence", diff="Medium",
  method="longestConsecutive",
  ask="Find the length of the longest run of consecutive integers (like 4, 5, 6, 7) that can be formed from an unsorted array's values, in O(n) time.",
  cue="O(n) rules out sorting. With all values in a hash set, \"is x + 1 present?\" costs O(1), so you can walk a run upward. The trick is to start walking only from the beginning of a run.",
  brute="Sort, then scan for runs: O(n log n). Walking upward from every value without the start check is O(n²) on an input like 1, 2, …, n.",
  approach="Put every value in a set. For each value x in the set, if x - 1 is also present, x is not the start of a run: skip it. Otherwise count x, x + 1, x + 2, … while they are present, and keep the longest count.",
  cx="O(n) expected time: every value is visited once as a potential start and at most once while walking a run. O(n) space.",
  trap="Looping over the original array instead of the set. With many duplicates of a run's first value, the same run is walked once per copy, which is O(n²) on an array of n copies of 1, 2, …",
  py='''class Solution:
    def longestConsecutive(self, nums: list[int]) -> int:
        values = set(nums)
        best = 0
        for x in values:               # the set: each value once
            if x - 1 in values:
                continue               # not the start of a run
            length = 1
            while x + length in values:
                length += 1
            best = max(best, length)
        return best''',
  java='''import java.util.HashSet;

class Solution {
    public int longestConsecutive(int[] nums) {
        HashSet<Integer> values = new HashSet<>();
        for (int x : nums) values.add(x);
        int best = 0;
        for (int x : values) {         // the set: each value once
            if (values.contains(x - 1)) continue;   // not the start of a run
            int length = 1;
            while (values.contains(x + length)) length++;
            best = Math.max(best, length);
        }
        return best;
    }
}''')

prob(num=347, slug="top-k-frequent-elements", title="Top K Frequent Elements", diff="Medium",
  method="topKFrequent", observe=lambda r, a: sorted(r),
  ask="Return the k values that occur most often (in any order). The answer is unique. The follow-up asks for better than O(n log n).",
  cue="Counting is a hash map. Beating O(n log n) is Chapter 15's bucket idea: a frequency is a whole number between 1 and n, so values can be dropped into buckets indexed by frequency instead of being sorted.",
  brute="Count, then sort values by count: O(n log n). A size-k heap is O(n log k), which Chapter 27 builds.",
  approach="Count each value in a map. Make n + 1 buckets and put each value into bucket[its count]. Walk the buckets from the highest count down, collecting values until you have k.",
  cx="O(n) time, O(n) space.",
  trap="Sizing the buckets by the number of distinct values instead of n. A value can occur n times, so bucket index n must exist.",
  py='''from collections import Counter

class Solution:
    def topKFrequent(self, nums: list[int], k: int) -> list[int]:
        count = Counter(nums)
        buckets = [[] for _ in range(len(nums) + 1)]   # a count can be as large as n
        for x, c in count.items():
            buckets[c].append(x)
        out = []
        for c in range(len(nums), 0, -1):              # highest counts first
            out.extend(buckets[c])
            if len(out) >= k:
                return out[:k]
        return out''',
  java='''import java.util.*;

class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> count = new LinkedHashMap<>();
        for (int x : nums) count.merge(x, 1, Integer::sum);
        List<List<Integer>> buckets = new ArrayList<>();   // a count can be as large as n
        for (int i = 0; i <= nums.length; i++) buckets.add(new ArrayList<>());
        for (Map.Entry<Integer, Integer> e : count.entrySet()) buckets.get(e.getValue()).add(e.getKey());
        int[] out = new int[k];
        int filled = 0;
        for (int c = nums.length; c > 0 && filled < k; c--)   // highest counts first
            for (int x : buckets.get(c)) if (filled < k) out[filled++] = x;
        return out;
    }
}''')

prob(num=36, slug="valid-sudoku", title="Valid Sudoku", diff="Medium",
  method="isValidSudoku",
  ask="Check whether a partially filled 9 × 9 Sudoku board breaks the rules: no digit twice in a row, a column, or a 3 × 3 box. (Solvability does not matter.)",
  cue="Three kinds of \"have I seen this digit here before?\", one per row, column and box. Hash sets keyed by (group, digit) answer all of them in one pass.",
  brute="For each filled cell, scan its row, column and box for the same digit: 81 × 27 checks. Fine for a fixed 9 × 9 board, but it repeats work.",
  approach="Walk every filled cell once. Cell (r, c) belongs to row r, column c, and box (r // 3) × 3 + c // 3. For each of the three, if the digit is already in that group's set, the board is invalid; otherwise add it.",
  cx="O(81) time and space for a 9 × 9 board: O(1), or O(n²) for an n × n generalization.",
  trap="The box index. (r // 3) × 3 + c // 3 numbers the boxes 0 to 8 row by row; r // 3 + c // 3 alone gives the same number to different boxes, like (0, 3) and (3, 0).",
  py='''class Solution:
    def isValidSudoku(self, board: list[list[str]]) -> bool:
        seen = set()                   # ("row", r, d), ("col", c, d), ("box", b, d)
        for r in range(9):
            for c in range(9):
                d = board[r][c]
                if d == ".":
                    continue
                keys = [("row", r, d), ("col", c, d), ("box", (r // 3) * 3 + c // 3, d)]
                if any(k in seen for k in keys):
                    return False
                seen.update(keys)
        return True''',
  java='''import java.util.HashSet;

class Solution {
    public boolean isValidSudoku(char[][] board) {
        HashSet<String> seen = new HashSet<>();   // "r0:5", "c3:5", "b4:5"
        for (int r = 0; r < 9; r++)
            for (int c = 0; c < 9; c++) {
                char d = board[r][c];
                if (d == '.') continue;
                int box = (r / 3) * 3 + c / 3;
                if (!seen.add("r" + r + ":" + d) | !seen.add("c" + c + ":" + d) | !seen.add("b" + box + ":" + d))
                    return false;              // non-short-circuit |: always add all three
            }
        return true;
    }
}''')

prob(num=454, slug="4sum-ii", title="4Sum II", diff="Medium",
  method="fourSumCount",
  ask="Given four arrays of equal length n, count the ways to pick one value from each so that the four sum to zero.",
  cue="Meet in the middle with a hash map (Chapter 12 meets Chapter 17): a + b + c + d = 0 means a + b = -(c + d). Count every a + b in a map, then look up every -(c + d).",
  brute="Four nested loops: n⁴ = 1.6 × 10⁹ at n = 200.",
  approach="Build a map from each sum a + b (over all n² pairs from the first two arrays) to how many pairs give it. Then for every pair c, d from the last two arrays, add the count of -(c + d).",
  cx="O(n²) time and space: 40,000 map entries at n = 200 instead of 1.6 billion checks.",
  trap="Storing whether a sum occurred instead of how many times. Different pairs with the same sum each form separate quadruples, so the map must hold counts.",
  py='''from collections import Counter

class Solution:
    def fourSumCount(self, nums1: list[int], nums2: list[int], nums3: list[int], nums4: list[int]) -> int:
        ab = Counter(a + b for a in nums1 for b in nums2)   # counts, not presence
        return sum(ab[-(c + d)] for c in nums3 for d in nums4)''',
  java='''import java.util.HashMap;

class Solution {
    public int fourSumCount(int[] nums1, int[] nums2, int[] nums3, int[] nums4) {
        HashMap<Integer, Integer> ab = new HashMap<>();     // counts, not presence
        for (int a : nums1) for (int b : nums2) ab.merge(a + b, 1, Integer::sum);
        int total = 0;
        for (int c : nums3) for (int d : nums4) total += ab.getOrDefault(-(c + d), 0);
        return total;
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=149, slug="max-points-on-a-line", title="Max Points on a Line", diff="Hard",
  method="maxPoints",
  ask="Given distinct points on a plane, find the largest number of them that lie on one straight line.",
  cue="Fix one point. Every line through it is identified by its slope, so group the other points by slope with a hash map; the biggest group plus the fixed point is the best line through it. The hard part is the key: the slope must be exact.",
  brute="For every pair of points, count the points on their line: O(n³), 2.7 × 10⁷ at n = 300. Fine here, and the hash map version is O(n²).",
  approach="For each point p, map every other point q to the slope key (dy, dx) with dy = qy - py and dx = qx - px, divided by their gcd and with a fixed sign (dx positive, or dx = 0 and dy = 1 for vertical lines). Count keys; the largest count plus 1 is the best line through p. Take the maximum over all p.",
  cx="O(n² log C) time, where log C is the gcd cost; O(n) space per fixed point.",
  trap="Using a floating-point slope dy / dx as the key. Two different slopes can round to the same double, and vertical lines divide by zero. The reduced integer pair is exact, and fixing the sign makes (1, 2) and (-1, -2) the same key.",
  py='''from math import gcd

class Solution:
    def maxPoints(self, points: list[list[int]]) -> int:
        best = 1
        for i, (px, py) in enumerate(points):
            slopes = {}
            for qx, qy in points[i + 1:]:
                dx, dy = qx - px, qy - py
                g = gcd(dx, dy)
                dx, dy = dx // g, dy // g          # reduced: exact, no floats
                if dx < 0 or (dx == 0 and dy < 0):
                    dx, dy = -dx, -dy              # one sign per direction
                slopes[(dy, dx)] = slopes.get((dy, dx), 0) + 1
            best = max(best, 1 + max(slopes.values(), default=0))
        return best''',
  java='''import java.util.HashMap;

class Solution {
    private int gcd(int a, int b) { return b == 0 ? Math.abs(a) : gcd(b, a % b); }

    public int maxPoints(int[][] points) {
        int best = 1;
        for (int i = 0; i < points.length; i++) {
            HashMap<Long, Integer> slopes = new HashMap<>();
            int localBest = 0;
            for (int j = i + 1; j < points.length; j++) {
                int dx = points[j][0] - points[i][0], dy = points[j][1] - points[i][1];
                int g = gcd(dx, dy);
                dx /= g; dy /= g;                   // reduced: exact, no floats
                if (dx < 0 || (dx == 0 && dy < 0)) { dx = -dx; dy = -dy; }   // one sign per direction
                long key = ((long) dy << 32) ^ (dx & 0xffffffffL);          // pack the pair
                localBest = Math.max(localBest, slopes.merge(key, 1, Integer::sum));
            }
            best = Math.max(best, 1 + localBest);
        }
        return best;
    }
}''')

prob(num=30, slug="substring-with-concatenation-of-all-words", title="Substring with Concatenation of All Words", diff="Hard",
  method="findSubstring", observe=lambda r, a: sorted(r),
  ask="All the given words have the same length. Find every starting position in s of a block that is some ordering of all the words, each used exactly once.",
  cue="A block is valid when its word counts equal the list's counts: a hash map comparison. Because every word has length L, you can slide a window one word at a time, as in Chapter 8, once for each of the L possible offsets.",
  brute="At every start position, cut the next len(words) × L characters into words and compare counts: O(n × len(words) × L).",
  approach="Count the target words in a map. For each offset 0 to L - 1, slide a window over s in steps of L, keeping counts of the words inside it. Add the next word; if it is not a target word, reset the window past it. If it now appears too often, drop words from the left until it does not. When the window holds exactly len(words) words, record its start.",
  cx="O(L × (n / L) × L) = O(n × L) time, since each word is added and removed at most once per offset and each costs O(L) to hash. O(len(words) × L) space.",
  trap="Duplicate words. The list can contain the same word twice, so the check must compare counts, not membership in a set.",
  py='''from collections import Counter

class Solution:
    def findSubstring(self, s: str, words: list[str]) -> list[int]:
        L, k = len(words[0]), len(words)
        need = Counter(words)          # counts: words can repeat
        out = []
        for offset in range(L):        # one sliding window per offset
            left, have, used = offset, Counter(), 0
            for right in range(offset, len(s) - L + 1, L):
                w = s[right:right + L]
                if w not in need:      # cannot be inside any answer: restart after it
                    left, have, used = right + L, Counter(), 0
                    continue
                have[w] += 1
                used += 1
                while have[w] > need[w]:           # too many copies: shrink from the left
                    have[s[left:left + L]] -= 1
                    left += L
                    used -= 1
                if used == k:
                    out.append(left)
        return out''',
  java='''import java.util.*;

class Solution {
    public List<Integer> findSubstring(String s, String[] words) {
        int L = words[0].length(), k = words.length;
        Map<String, Integer> need = new HashMap<>();   // counts: words can repeat
        for (String w : words) need.merge(w, 1, Integer::sum);
        List<Integer> out = new ArrayList<>();
        for (int offset = 0; offset < L; offset++) {   // one sliding window per offset
            Map<String, Integer> have = new HashMap<>();
            int left = offset, used = 0;
            for (int right = offset; right + L <= s.length(); right += L) {
                String w = s.substring(right, right + L);
                if (!need.containsKey(w)) {            // restart after it
                    have.clear(); used = 0; left = right + L;
                    continue;
                }
                have.merge(w, 1, Integer::sum);
                used++;
                while (have.get(w) > need.get(w)) {    // too many copies: shrink
                    have.merge(s.substring(left, left + L), -1, Integer::sum);
                    left += L;
                    used--;
                }
                if (used == k) out.add(left);
            }
        }
        return out;
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(17)
def arr(lo, hi, nmin=1, nmax=10): return [R.randint(lo, hi) for _ in range(R.randint(nmin, nmax))]

def gen1():
    while True:
        a = arr(-9, 9, 2, 8); t = R.randint(-12, 12)
        pairs = [(i, j) for i, j in combinations(range(len(a)), 2) if a[i] + a[j] == t]
        if len(pairs) == 1: return [a, t]

def gen242():
    s = "".join(R.choice("abc") for _ in range(R.randint(1, 8)))
    t = "".join(R.sample(s, len(s))) if R.random() < 0.5 else "".join(R.choice("abc") for _ in range(R.randint(1, 8)))
    return [s, t]

def gen706():
    ops, args = ["MyHashMap"], [[]]
    for _ in range(R.randint(1, 40)):
        op = R.choice(["put", "put", "get", "remove"]); key = R.randint(0, 30)
        ops.append(op); args.append([key, R.randint(0, 9)] if op == "put" else [key])
    return ops, args
def brute706(ops, args):
    d, res = {}, [None]
    for op, a in zip(ops[1:], args[1:]):
        if op == "put": d[a[0]] = a[1]; res.append(None)
        elif op == "get": res.append(d.get(a[0], -1))
        else: d.pop(a[0], None); res.append(None)
    return res

def gen347():
    while True:
        a = arr(-4, 4, 1, 12); c = Counter(a); k = R.randint(1, len(c))
        f = sorted(c.values(), reverse=True)
        if k == len(f) or f[k - 1] > f[k]: return [a, k]   # the answer must be unique

def gen36():
    board = [["."] * 9 for _ in range(9)]
    sol = [[(r * 3 + r // 3 + c) % 9 + 1 for c in range(9)] for r in range(9)]   # a valid full grid
    for r in range(9):
        for c in range(9):
            if R.random() < 0.4: board[r][c] = str(sol[r][c])
    if R.random() < 0.5:
        r, c = R.randrange(9), R.randrange(9); board[r][c] = str(R.randint(1, 9))
    return [board]
def brute36(b):
    cells = [(r, c, b[r][c]) for r in range(9) for c in range(9) if b[r][c] != "."]
    for (r1, c1, d1), (r2, c2, d2) in combinations(cells, 2):
        if d1 == d2 and (r1 == r2 or c1 == c2 or (r1 // 3, c1 // 3) == (r2 // 3, c2 // 3)): return False
    return True

def gen454():
    n = R.randint(1, 5); return [[R.randint(-3, 3) for _ in range(n)] for _ in range(4)]

def gen149():
    pts = R.sample([(x, y) for x in range(-3, 4) for y in range(-3, 4)], R.randint(1, 8)); return [[list(p) for p in pts]]
def brute149(pts):
    if len(pts) <= 2: return len(pts)
    best = 2
    for (x1, y1), (x2, y2) in combinations(pts, 2):
        best = max(best, sum(1 for x, y in pts if (x2 - x1) * (y - y1) == (y2 - y1) * (x - x1)))
    return best

def gen30():
    L = R.randint(1, 3); words = ["".join(R.choice("ab") for _ in range(L)) for _ in range(R.randint(1, 3))]
    return ["".join(R.choice("ab") for _ in range(R.randint(1, 14))), words]
def brute30(s, words):
    L, k = len(words[0]), len(words)
    return [i for i in range(len(s) - L * k + 1) if Counter(s[i + j * L:i + (j + 1) * L] for j in range(k)) == Counter(words)]

BRUTE = {
  1:   (gen1, lambda a, t: [[i, j] for i, j in combinations(range(len(a)), 2) if a[i] + a[j] == t][0]),
  217: (lambda: [arr(-5, 5)], lambda a: len(set(a)) < len(a)),
  242: (gen242, lambda s, t: sorted(s) == sorted(t)),
  706: (gen706, brute706),
  49:  (lambda: [["".join(R.choice("abc") for _ in range(R.randint(0, 3))) for _ in range(R.randint(1, 8))] + ["ab"]],   # ponytail: [""] alone encodes like [] for Java
        lambda ws: sorted(sorted(w for w in ws if sorted(w) == sorted(k)) for k in {"".join(sorted(w)) for w in ws})),
  128: (lambda: [arr(-6, 6, 0, 12)], lambda a: max([L for x in set(a) for L in range(1, 14) if all(x + i in a for i in range(L))] or [0])),
  347: (gen347, lambda a, k: sorted(sorted(Counter(a), key=lambda x: -Counter(a)[x])[:k])),
  36:  (gen36, brute36),
  454: (gen454, lambda a, b, c, d: sum(1 for w, x, y, z in product(a, b, c, d) if w + x + y + z == 0)),
  149: (gen149, brute149),
  30:  (gen30, brute30),
}
