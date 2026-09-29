# Chapter 15 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
import random
from collections import Counter
from functools import cmp_to_key
from itertools import permutations
from practice import Approx

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

def custom_ok(r, a):
    order, s = a
    rank = {c: i for i, c in enumerate(order)}
    ranks = [rank[c] for c in r if c in rank]
    return sorted(r) == sorted(s) and ranks == sorted(ranks)

# ---------------------------------------------------------------- Easy
prob(num=88, slug="merge-sorted-array", title="Merge Sorted Array", diff="Easy",
  method="merge", observe=lambda r, a: a[0],
  ask="Merge a sorted array nums2 into a sorted array nums1 in place. nums1 has exactly enough spare slots at its end.",
  cue="Mergesort's merge step, with one twist. Merging from the front would overwrite values of nums1 not yet read; merging from the back fills the spare slots first, so nothing unread is ever overwritten.",
  brute="Copy nums2 into the spare slots and sort the whole array: O((m + n) log(m + n)).",
  approach="Keep i at the last real value of nums1, j at the last value of nums2, and w at the last slot. Repeatedly write the larger of nums1[i] and nums2[j] at w and move that pointer and w left. When nums2 runs out, the rest of nums1 is already in place.",
  cx="O(m + n) time, O(1) extra space.",
  trap="Stopping when nums1 runs out. If nums2 still has values, they must be copied; the loop below runs while j ≥ 0 for exactly that reason.",
  py='''class Solution:
    def merge(self, nums1: list[int], m: int, nums2: list[int], n: int) -> None:
        i, j, w = m - 1, n - 1, m + n - 1
        while j >= 0:                  # once nums2 is empty, nums1's rest is in place
            if i >= 0 and nums1[i] > nums2[j]:
                nums1[w] = nums1[i]
                i -= 1
            else:
                nums1[w] = nums2[j]
                j -= 1
            w -= 1                     # fill from the back: nothing unread is overwritten''',
  java='''class Solution {
    public void merge(int[] nums1, int m, int[] nums2, int n) {
        int i = m - 1, j = n - 1, w = m + n - 1;
        while (j >= 0) {               // once nums2 is empty, nums1's rest is in place
            if (i >= 0 && nums1[i] > nums2[j]) nums1[w--] = nums1[i--];
            else nums1[w--] = nums2[j--];   // fill from the back
        }
    }
}''')

prob(num=977, slug="squares-of-a-sorted-array", title="Squares of a Sorted Array", diff="Easy",
  method="sortedSquares",
  ask="Given a sorted array that may include negatives, return the squares of its values in sorted order, in O(n).",
  cue="The squares form two sorted runs: the negatives' squares shrink toward the middle and the positives' squares grow away from it. The largest square is always at one of the two ends, so merge the two runs from the outside in.",
  brute="Square everything and sort: O(n log n).",
  approach="Put i at the start and j at the end, and fill the output from its last slot backwards. At each step, write the larger of the two end squares and move that end inward.",
  cx="O(n) time, O(n) for the output.",
  trap="Merging from the middle outward. You would first have to find where the negatives end, and every boundary case (all negative, all positive) needs its own branch. From the outside in there are none.",
  py='''class Solution:
    def sortedSquares(self, nums: list[int]) -> list[int]:
        out = [0] * len(nums)
        i, j = 0, len(nums) - 1
        for w in range(len(nums) - 1, -1, -1):   # the largest square is at an end
            if abs(nums[i]) > abs(nums[j]):
                out[w] = nums[i] * nums[i]
                i += 1
            else:
                out[w] = nums[j] * nums[j]
                j -= 1
        return out''',
  java='''class Solution {
    public int[] sortedSquares(int[] nums) {
        int[] out = new int[nums.length];
        int i = 0, j = nums.length - 1;
        for (int w = nums.length - 1; w >= 0; w--) {   // the largest square is at an end
            if (Math.abs(nums[i]) > Math.abs(nums[j])) { out[w] = nums[i] * nums[i]; i++; }
            else { out[w] = nums[j] * nums[j]; j--; }
        }
        return out;
    }
}''')

prob(num=1051, slug="height-checker", title="Height Checker", diff="Easy",
  method="heightChecker",
  ask="Students should stand in non-decreasing order of height. Count how many are standing in a position different from the one they would have in sorted order.",
  cue="Heights are whole numbers from 1 to 100. A small, known range of keys is counting sort's case from the Breaking the Bound section: count each height, then read the counts back in order.",
  brute="Sort a copy and compare position by position: O(n log n), which is also a fine answer here.",
  approach="Count how many students have each height. Then walk the heights from 1 to 100, and for each student in the line, the next expected height is the smallest one whose count is not used up. Compare it with the student actually standing there.",
  cx="O(n + H) time and O(H) space, with H = 100 possible heights.",
  trap="Comparing counts instead of positions. Two lines with the same multiset of heights can differ in many positions; you must compare the line with its sorted version slot by slot.",
  py='''class Solution:
    def heightChecker(self, heights: list[int]) -> int:
        count = [0] * 101              # counting sort: heights are 1..100
        for h in heights:
            count[h] += 1
        wrong, expected = 0, 1
        for h in heights:
            while count[expected] == 0:
                expected += 1          # next height in sorted order
            if h != expected:
                wrong += 1
            count[expected] -= 1
        return wrong''',
  java='''class Solution {
    public int heightChecker(int[] heights) {
        int[] count = new int[101];    // counting sort: heights are 1..100
        for (int h : heights) count[h]++;
        int wrong = 0, expected = 1;
        for (int h : heights) {
            while (count[expected] == 0) expected++;   // next height in sorted order
            if (h != expected) wrong++;
            count[expected]--;
        }
        return wrong;
    }
}''')

prob(num=1636, slug="sort-array-by-increasing-frequency", title="Sort Array by Increasing Frequency", diff="Easy",
  method="frequencySort",
  ask="Sort values by how often they occur, least frequent first; values with the same frequency go in decreasing order.",
  cue="Two sort keys. The Stability as a Design Tool section's move: a stable sort keeps equal items in their existing order, so sort by the secondary key first (value, decreasing), then stably by the primary key (frequency, increasing).",
  brute="There is nothing slower worth writing; the work is getting the two keys right.",
  approach="Count each value. Sort by the key (frequency, -value). That is the same as two stable passes in one, and in Java it is a comparator that compares frequencies first and values in reverse on a tie.",
  cx="O(n log n) time, O(n) space.",
  trap="Forgetting that ties go in decreasing value order. A single key of frequency gives the right groups in the wrong order within each group.",
  py='''from collections import Counter

class Solution:
    def frequencySort(self, nums: list[int]) -> list[int]:
        freq = Counter(nums)
        return sorted(nums, key=lambda x: (freq[x], -x))   # frequency up, then value down''',
  java='''import java.util.*;

class Solution {
    public int[] frequencySort(int[] nums) {
        Map<Integer, Integer> freq = new HashMap<>();
        for (int x : nums) freq.merge(x, 1, Integer::sum);
        return Arrays.stream(nums).boxed()
            .sorted((a, b) -> !freq.get(a).equals(freq.get(b))
                    ? Integer.compare(freq.get(a), freq.get(b))   // frequency up
                    : Integer.compare(b, a))                      // then value down
            .mapToInt(Integer::intValue).toArray();
    }
}''')

# ---------------------------------------------------------------- Medium
prob(num=912, slug="sort-an-array", title="Sort an Array", diff="Medium",
  method="sortArray", check_args=False,
  ask="Sort an array of integers without a built-in sort, in O(n log n) time.",
  cue="The Mergesort section, as an exercise. Mergesort's O(n log n) is guaranteed on every input, which matters here because the judge's tests include inputs designed to break a naive quicksort.",
  brute="Insertion sort (one of The Elementary Three): O(n²), about 1.25 × 10⁹ steps at n = 50,000.",
  approach="Split the array in half, sort each half recursively, and merge the two sorted halves by repeatedly taking the smaller front element. Take from the left half on ties so the sort is stable.",
  cx="O(n log n) time, O(n) extra space for merging.",
  trap="Quicksort with the first or last element as pivot. On already-sorted input, or an array of one repeated value, every partition is lopsided and the sort takes O(n²). The Quicksort section's fixes are a random pivot and three-way partitioning.",
  py='''class Solution:
    def sortArray(self, nums: list[int]) -> list[int]:
        if len(nums) <= 1:
            return nums
        mid = len(nums) // 2
        left, right = self.sortArray(nums[:mid]), self.sortArray(nums[mid:])
        out, i, j = [], 0, 0
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:    # <= takes from the left on ties: stable
                out.append(left[i])
                i += 1
            else:
                out.append(right[j])
                j += 1
        return out + left[i:] + right[j:]''',
  java='''class Solution {
    public int[] sortArray(int[] nums) {
        mergeSort(nums, new int[nums.length], 0, nums.length);
        return nums;
    }

    private void mergeSort(int[] a, int[] tmp, int lo, int hi) {
        if (hi - lo <= 1) return;
        int mid = (lo + hi) >>> 1;
        mergeSort(a, tmp, lo, mid);
        mergeSort(a, tmp, mid, hi);
        int i = lo, j = mid, k = lo;
        while (i < mid || j < hi)      // <= takes from the left on ties: stable
            tmp[k++] = (j >= hi || (i < mid && a[i] <= a[j])) ? a[i++] : a[j++];
        System.arraycopy(tmp, lo, a, lo, hi - lo);
    }
}''')

prob(num=215, slug="kth-largest-element-in-an-array", title="Kth Largest Element in an Array", diff="Medium",
  method="findKthLargest", check_args=False,
  ask="Find the k-th largest value in an unsorted array without fully sorting it.",
  cue="The Quickselect section: partition around a pivot, then recurse only into the side that contains position n - k. And with up to 100,000 values drawn from only 20,001 possible ones, duplicates are guaranteed, which is the Quicksort section's reason for three-way partitioning.",
  brute="Sort and index: O(n log n). A size-k heap is O(n log k); Chapter 27 builds that version.",
  approach="Look for the value at sorted position n - k. Pick a random pivot and split the range into three groups: less than, equal to, and greater than the pivot. If the target position falls in the equal group, the pivot is the answer; otherwise continue in the one group that contains it.",
  cx="O(n) expected time, because each round keeps on average a constant fraction of the range. O(n²) in the worst case with vanishing probability. O(1) extra space in Java, O(n) in the list-building Python version.",
  trap="Two-way partitioning on many equal values. When most values equal the pivot, a two-way split puts them all on one side and each round removes almost nothing, so the expected O(n) becomes O(n²). The equal group removes them all at once.",
  py='''import random

class Solution:
    def findKthLargest(self, nums: list[int], k: int) -> int:
        target = len(nums) - k         # the answer's position in sorted order
        while True:
            pivot = random.choice(nums)
            less = [x for x in nums if x < pivot]
            equal = sum(1 for x in nums if x == pivot)   # three-way: duplicates in one go
            if target < len(less):
                nums = less
            elif target < len(less) + equal:
                return pivot
            else:
                target -= len(less) + equal
                nums = [x for x in nums if x > pivot]''',
  java='''import java.util.Random;

class Solution {
    private final Random rng = new Random();

    public int findKthLargest(int[] nums, int k) {
        int lo = 0, hi = nums.length - 1, target = nums.length - k;   // position in sorted order
        while (true) {
            int pivot = nums[lo + rng.nextInt(hi - lo + 1)];
            int lt = lo, i = lo, gt = hi;   // three-way: [lo,lt) < pivot, [lt,i) == pivot, (gt,hi] > pivot
            while (i <= gt) {
                if (nums[i] < pivot) swap(nums, lt++, i++);
                else if (nums[i] > pivot) swap(nums, i, gt--);
                else i++;
            }
            if (target < lt) hi = lt - 1;
            else if (target > gt) lo = gt + 1;
            else return pivot;
        }
    }

    private void swap(int[] a, int i, int j) { int t = a[i]; a[i] = a[j]; a[j] = t; }
}''')

prob(num=179, slug="largest-number", title="Largest Number", diff="Medium",
  method="largestNumber",
  ask="Arrange non-negative integers so that, written side by side, they form the largest possible number. Return it as a string.",
  cue="A sort with a custom order. Which of two numbers should come first? Glue them both ways and compare: a goes before b if a followed by b is bigger than b followed by a. That rule is a consistent ordering, so any comparison sort can use it.",
  brute="Try every order of the numbers: O(n!).",
  approach="Convert the numbers to strings and sort with the comparator \"a + b &gt; b + a means a first\". Join the result. If the first character is \"0\", every number was 0, so return \"0\".",
  cx="O(n log n) comparisons, each O(L) for numbers of up to L digits.",
  trap="Sorting the strings in plain reverse lexicographic order. It puts \"30\" before \"3\", giving 303 instead of 330, and \"121\" before \"12\", giving 12112 instead of 12121. And an input of all zeros must return \"0\", not \"000\".",
  py='''from functools import cmp_to_key

class Solution:
    def largestNumber(self, nums: list[int]) -> str:
        s = [str(x) for x in nums]
        s.sort(key=cmp_to_key(lambda a, b: -1 if a + b > b + a else (1 if a + b < b + a else 0)))
        out = "".join(s)
        return "0" if out[0] == "0" else out   # all zeros''',
  java='''import java.util.Arrays;

class Solution {
    public String largestNumber(int[] nums) {
        String[] s = new String[nums.length];
        for (int i = 0; i < nums.length; i++) s[i] = String.valueOf(nums[i]);
        Arrays.sort(s, (a, b) -> (b + a).compareTo(a + b));   // a first if a+b is bigger
        String out = String.join("", s);
        return out.charAt(0) == '0' ? "0" : out;               // all zeros
    }
}''')

prob(num=164, slug="maximum-gap", title="Maximum Gap", diff="Medium",
  method="maximumGap", check_args=False,
  ask="Return the largest difference between neighbouring values after sorting, in linear time.",
  cue="Linear time rules out comparison sorting, by the chapter's Ω(n log n) bound. The values are non-negative integers below 2³⁰, which is radix sort's case: sort by one byte at a time with counting sort.",
  brute="Sort and scan: O(n log n), fine in practice and ruled out by the problem's linear-time requirement.",
  approach="LSD radix sort: four passes of a stable counting sort on bits 0–7, 8–15, 16–23 and 24–31. Each pass keeps the order from the previous passes among equal bytes, which is what makes the final order correct. Then scan neighbours for the largest difference.",
  cx="O(4 × (n + 256)) = O(n) time, O(n) extra space.",
  trap="An unstable counting pass. Radix sort relies on each pass preserving the previous passes' order among equal digits; filling the output from the front of each bucket, in input order, is what keeps it stable.",
  py='''class Solution:
    def maximumGap(self, nums: list[int]) -> int:
        for shift in (0, 8, 16, 24):   # LSD radix sort, one byte per pass
            count = [0] * 257
            for x in nums:
                count[((x >> shift) & 255) + 1] += 1
            for b in range(256):
                count[b + 1] += count[b]          # bucket start positions
            out = [0] * len(nums)
            for x in nums:                        # input order: the pass is stable
                b = (x >> shift) & 255
                out[count[b]] = x
                count[b] += 1
            nums = out
        return max((b - a for a, b in zip(nums, nums[1:])), default=0)''',
  java='''class Solution {
    public int maximumGap(int[] nums) {
        int[] out = new int[nums.length];
        for (int shift = 0; shift < 32; shift += 8) {   // LSD radix sort, one byte per pass
            int[] count = new int[257];
            for (int x : nums) count[((x >> shift) & 255) + 1]++;
            for (int b = 0; b < 256; b++) count[b + 1] += count[b];   // bucket starts
            for (int x : nums) out[count[(x >> shift) & 255]++] = x;  // stable
            int[] t = nums; nums = out; out = t;
        }
        int best = 0;
        for (int i = 1; i < nums.length; i++) best = Math.max(best, nums[i] - nums[i - 1]);
        return best;
    }
}''')

prob(num=791, slug="custom-sort-string", title="Custom Sort String", diff="Medium",
  method="customSortString", observe=custom_ok,
  ask="Rearrange a string so that its letters follow the order given by another string; letters not mentioned there can go anywhere.",
  cue="There are only 26 keys and their order is given, so this is counting sort with a custom key order: count the letters, then write them out in the given order.",
  brute="Sort with a comparator that looks up each letter's rank: O(n log n).",
  approach="Count each letter of s. Walk the order string and write each of its letters as many times as it was counted, zeroing the count. Then append the remaining letters, the ones the order does not mention.",
  cx="O(n + 26) time, O(26) extra space.",
  trap="Dropping the letters that are not in the order string. They must still appear in the output, anywhere.",
  py='''from collections import Counter

class Solution:
    def customSortString(self, order: str, s: str) -> str:
        count = Counter(s)
        out = []
        for c in order:                # counting sort with the given key order
            out.append(c * count.pop(c, 0))
        for c in sorted(count):        # letters the order does not mention
            out.append(c * count[c])
        return "".join(out)''',
  java='''class Solution {
    public String customSortString(String order, String s) {
        int[] count = new int[26];
        for (char c : s.toCharArray()) count[c - 'a']++;
        StringBuilder out = new StringBuilder();
        for (char c : order.toCharArray()) {       // counting sort with the given order
            out.append(String.valueOf(c).repeat(count[c - 'a']));
            count[c - 'a'] = 0;
        }
        for (int c = 0; c < 26; c++)               // letters the order does not mention
            out.append(String.valueOf((char) ('a' + c)).repeat(count[c]));
        return out.toString();
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=4, slug="median-of-two-sorted-arrays", title="Median of Two Sorted Arrays", diff="Hard",
  method="findMedianSortedArrays",
  ask="Find the median of the combined values of two sorted arrays in O(log(m + n)) time.",
  cue="The chapter's last section, Selection Across Two Sorted Arrays, including why the obvious binary search does not work. Binary-search how many elements the shorter array contributes to the lower half; the longer array's contribution is then fixed.",
  brute="Merge the two arrays (Merge Sorted Array) and take the middle: O(m + n).",
  approach="Make nums1 the shorter array. Search i, the number of elements taken from nums1 into the lower half, in [0, m]; then j = (m + n + 1) // 2 - i come from nums2. The split is right when nums1[i - 1] ≤ nums2[j] and nums2[j - 1] ≤ nums1[i], treating missing neighbours as minus or plus infinity. If nums1[i - 1] &gt; nums2[j], i is too big; otherwise, if the split is still wrong, it is too small. At the right split, the median is the largest lower-half value (odd total) or its average with the smallest upper-half value (even total).",
  cx="O(log(min(m, n))) time, O(1) space.",
  trap="Searching over the longer array. Then j can go negative or past the end of the shorter array. Searching the shorter one keeps every j valid, and it is also the faster search.",
  py='''class Solution:
    def findMedianSortedArrays(self, nums1: list[int], nums2: list[int]) -> float:
        if len(nums1) > len(nums2):
            nums1, nums2 = nums2, nums1           # search the shorter array
        m, n = len(nums1), len(nums2)
        half = (m + n + 1) // 2
        lo, hi = 0, m
        inf = float("inf")
        while True:
            i = (lo + hi) // 2                    # taken from nums1 into the lower half
            j = half - i                          # the rest comes from nums2
            a_left = nums1[i - 1] if i > 0 else -inf
            a_right = nums1[i] if i < m else inf
            b_left = nums2[j - 1] if j > 0 else -inf
            b_right = nums2[j] if j < n else inf
            if a_left > b_right:
                hi = i - 1                        # took too many from nums1
            elif b_left > a_right:
                lo = i + 1                        # took too few
            else:
                low_max = max(a_left, b_left)
                if (m + n) % 2:
                    return float(low_max)
                return (low_max + min(a_right, b_right)) / 2''',
  java='''class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        if (nums1.length > nums2.length) return findMedianSortedArrays(nums2, nums1);   // shorter first
        int m = nums1.length, n = nums2.length, half = (m + n + 1) / 2;
        int lo = 0, hi = m;
        while (true) {
            int i = (lo + hi) / 2, j = half - i;  // i from nums1, the rest from nums2
            int aLeft = i > 0 ? nums1[i - 1] : Integer.MIN_VALUE;
            int aRight = i < m ? nums1[i] : Integer.MAX_VALUE;
            int bLeft = j > 0 ? nums2[j - 1] : Integer.MIN_VALUE;
            int bRight = j < n ? nums2[j] : Integer.MAX_VALUE;
            if (aLeft > bRight) hi = i - 1;       // took too many from nums1
            else if (bLeft > aRight) lo = i + 1;  // took too few
            else {
                int lowMax = Math.max(aLeft, bLeft);
                if ((m + n) % 2 == 1) return lowMax;
                return (lowMax + (double) Math.min(aRight, bRight)) / 2;
            }
        }
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(15)
def arr(lo, hi, nmin=1, nmax=10): return [R.randint(lo, hi) for _ in range(R.randint(nmin, nmax))]

def gen88():
    a, b = sorted(arr(-9, 9, 0, 6)), sorted(arr(-9, 9, 0, 6))
    if not a and not b: b = [R.randint(-9, 9)]
    return [a + [0] * len(b), len(a), b, len(b)]

def brute179(nums):
    best = max("".join(p) for p in permutations(map(str, nums)))
    return "0" if best[0] == "0" else best

def brute4(a, b):
    c = sorted(a + b); n = len(c)
    return Approx(c[n // 2] if n % 2 else (c[n // 2 - 1] + c[n // 2]) / 2)

def gen4():
    a, b = sorted(arr(-20, 20, 0, 7)), sorted(arr(-20, 20, 0, 7))
    if not a and not b: a = [R.randint(-20, 20)]
    return [a, b]

BRUTE = {
  88:   (gen88, lambda a, m, b, n: sorted(a[:m] + b)),
  977:  (lambda: [sorted(arr(-10, 10))], lambda a: sorted(x * x for x in a)),
  1051: (lambda: [arr(1, 8)], lambda h: sum(1 for x, y in zip(h, sorted(h)) if x != y)),
  1636: (lambda: [arr(-5, 5)], lambda a: sorted(a, key=lambda x: (a.count(x), -x))),
  912:  (lambda: [arr(-20, 20, 1, 15)], sorted),
  215:  (lambda: (lambda a: [a, R.randint(1, len(a))])(arr(-3, 3, 1, 12)), lambda a, k: sorted(a)[-k]),
  179:  (lambda: [R.choice([arr(0, 40, 1, 5), arr(0, 1, 1, 4), [R.choice([0, 3, 30, 34, 12, 121, 5, 9]) for _ in range(R.randint(1, 5))]])], brute179),
  164:  (lambda: [R.choice([arr(0, 30), arr(0, 10**9)])], lambda a: max([y - x for x, y in zip(sorted(a), sorted(a)[1:])] or [0])),
  791:  (lambda: ["".join(R.sample("abcdefgh", R.randint(1, 6))), "".join(R.choice("abcdefghij") for _ in range(R.randint(1, 12)))],
         lambda order, s: True),
  4:    (gen4, brute4),
}
