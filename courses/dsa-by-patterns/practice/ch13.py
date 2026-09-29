# Chapter 13 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
# Every search uses the chapter's half-open template: answer in [lo, hi), mid = lo + (hi - lo) // 2.
import random

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

def is_peak(r, a):
    n = a[0]
    return 0 <= r < len(n) and (r == 0 or n[r - 1] < n[r]) and (r == len(n) - 1 or n[r + 1] < n[r])

# ---------------------------------------------------------------- Easy
prob(num=704, slug="binary-search", title="Binary Search", diff="Easy",
  method="search",
  ask="Find the position of a target in a sorted array of distinct values, or return -1.",
  cue="Sorted input and a lookup: binary search. Use the chapter's lower_bound, which finds the first position whose value is at least the target, then check whether that value is the target.",
  brute="Scan left to right: O(n).",
  approach="Keep the invariant that the answer lies in [lo, hi). Look at mid. If a[mid] &lt; target, mid and everything left of it are too small, so lo = mid + 1. Otherwise mid might be the answer, so hi = mid. When lo meets hi, lo is the first position with a value ≥ target; it is the answer only if it is inside the array and holds the target.",
  cx="O(log n) time, O(1) space.",
  trap="Returning lo without checking it. When the target is missing, lower_bound still returns a position (where the target would be inserted), possibly len(nums), which is off the end.",
  py='''class Solution:
    def search(self, nums: list[int], target: int) -> int:
        lo, hi = 0, len(nums)          # the answer is in [lo, hi)
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if nums[mid] < target:
                lo = mid + 1           # mid is too small: discard it
            else:
                hi = mid               # mid might be the answer: keep it
        return lo if lo < len(nums) and nums[lo] == target else -1''',
  java='''class Solution {
    public int search(int[] nums, int target) {
        int lo = 0, hi = nums.length;  // the answer is in [lo, hi)
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] < target) lo = mid + 1;   // too small: discard it
            else hi = mid;                          // might be the answer: keep it
        }
        return lo < nums.length && nums[lo] == target ? lo : -1;
    }
}''')

prob(num=35, slug="search-insert-position", title="Search Insert Position", diff="Easy",
  method="searchInsert",
  ask="In a sorted array of distinct values, return the target's position if present, or the position where it would be inserted to keep the array sorted.",
  cue="\"Where would it go?\" is exactly what lower_bound returns, found or not. This is the Lower Bound, Upper Bound, Equal Range section with nothing added.",
  brute="Scan for the first value ≥ target: O(n).",
  approach="Run lower_bound and return lo. Unlike Binary Search, no check is needed afterwards: when the target is missing, lo is already its insertion point, including len(nums) for a target bigger than everything.",
  cx="O(log n) time, O(1) space.",
  trap="Starting with hi = len(nums) - 1. A target larger than every element belongs at position len(nums), and a search that never considers that position cannot return it. The half-open interval [0, len(nums)) with hi = len(nums) is what makes that answer reachable.",
  py='''class Solution:
    def searchInsert(self, nums: list[int], target: int) -> int:
        lo, hi = 0, len(nums)          # len(nums) is a legal answer
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if nums[mid] < target:
                lo = mid + 1
            else:
                hi = mid
        return lo''',
  java='''class Solution {
    public int searchInsert(int[] nums, int target) {
        int lo = 0, hi = nums.length;  // nums.length is a legal answer
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] < target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}''')

prob(num=2529, slug="maximum-count-of-positive-integer-and-negative-integer", title="Maximum Count of Positive Integer and Negative Integer", diff="Easy",
  method="maximumCount",
  ask="A sorted array may contain negatives, zeros and positives. Return the larger of the number of negatives and the number of positives.",
  cue="Counting values below or above a threshold in a sorted array is two lower_bound calls: the first position with a value ≥ 0, and the first with a value ≥ 1.",
  brute="Count with a loop: O(n). Correct, and the problem's follow-up asks for O(log n).",
  approach="neg = lower_bound(0), because everything before the first value ≥ 0 is negative. pos = n - lower_bound(1), because everything from the first value ≥ 1 onwards is positive. The zeros sit between the two positions and are counted by neither.",
  cx="O(log n) time, O(1) space.",
  trap="Using lower_bound(0) for both. Everything from that position on includes the zeros, which are neither negative nor positive.",
  py='''class Solution:
    def maximumCount(self, nums: list[int]) -> int:
        def lower_bound(t):            # first position with nums[i] >= t
            lo, hi = 0, len(nums)
            while lo < hi:
                mid = lo + (hi - lo) // 2
                if nums[mid] < t:
                    lo = mid + 1
                else:
                    hi = mid
            return lo

        neg = lower_bound(0)
        pos = len(nums) - lower_bound(1)   # zeros are skipped by both
        return max(neg, pos)''',
  java='''class Solution {
    private int lowerBound(int[] nums, int t) {   // first position with nums[i] >= t
        int lo = 0, hi = nums.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] < t) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    public int maximumCount(int[] nums) {
        int neg = lowerBound(nums, 0);
        int pos = nums.length - lowerBound(nums, 1);   // zeros are skipped by both
        return Math.max(neg, pos);
    }
}''')

# ---------------------------------------------------------------- Medium
prob(num=34, slug="find-first-and-last-position-of-element-in-sorted-array", title="Find First and Last Position of Element in Sorted Array", diff="Medium",
  method="searchRange",
  ask="In a sorted array that may contain repeats, return the first and last positions of a target, or [-1, -1].",
  cue="The Equal Range: all copies of the target sit between lower_bound(target) and lower_bound(target + 1).",
  brute="Find any copy, then walk left and right to the ends of the run: O(n) when the whole array is the target.",
  approach="first = lower_bound(target). If first is off the end or does not hold the target, return [-1, -1]. Otherwise last = lower_bound(target + 1) - 1, the position right before the first value bigger than the target.",
  cx="O(log n) time, O(1) space.",
  trap="Finding one copy with a plain binary search and then scanning outwards. It looks logarithmic and is linear on an array of 100,000 copies of the same value.",
  py='''class Solution:
    def searchRange(self, nums: list[int], target: int) -> list[int]:
        def lower_bound(t):
            lo, hi = 0, len(nums)
            while lo < hi:
                mid = lo + (hi - lo) // 2
                if nums[mid] < t:
                    lo = mid + 1
                else:
                    hi = mid
            return lo

        first = lower_bound(target)
        if first == len(nums) or nums[first] != target:
            return [-1, -1]
        return [first, lower_bound(target + 1) - 1]   # right before the next bigger value''',
  java='''class Solution {
    private int lowerBound(int[] nums, int t) {
        int lo = 0, hi = nums.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] < t) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    public int[] searchRange(int[] nums, int target) {
        int first = lowerBound(nums, target);
        if (first == nums.length || nums[first] != target) return new int[]{-1, -1};
        return new int[]{first, lowerBound(nums, target + 1) - 1};   // before the next bigger value
    }
}''')

prob(num=74, slug="search-a-2d-matrix", title="Search a 2D Matrix", diff="Medium",
  method="searchMatrix",
  ask="Each row of a grid is sorted, and each row starts with a value bigger than the last value of the row above. Decide whether a target is in the grid.",
  cue="Read row by row, the grid is one sorted list of m × n values. Binary-search that list, converting a list position i to the cell (i // n, i % n).",
  brute="Scan every cell: O(m × n). Or pick the row, then search it: two searches, also fine.",
  approach="Run lower_bound over positions 0 to m × n, reading the value at position i as matrix[i // n][i % n]. Then check whether the position found holds the target.",
  cx="O(log(m × n)) time, O(1) space.",
  trap="Confusing this with Chapter 3's Search a 2D Matrix II, where only rows and columns are sorted separately. The \"each row starts after the previous row ends\" rule is what makes the whole grid one sorted list; without it, this search is wrong.",
  py='''class Solution:
    def searchMatrix(self, matrix: list[list[int]], target: int) -> bool:
        m, n = len(matrix), len(matrix[0])
        lo, hi = 0, m * n              # the grid as one sorted list
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if matrix[mid // n][mid % n] < target:
                lo = mid + 1
            else:
                hi = mid
        return lo < m * n and matrix[lo // n][lo % n] == target''',
  java='''class Solution {
    public boolean searchMatrix(int[][] matrix, int target) {
        int m = matrix.length, n = matrix[0].length;
        int lo = 0, hi = m * n;        // the grid as one sorted list
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (matrix[mid / n][mid % n] < target) lo = mid + 1;
            else hi = mid;
        }
        return lo < m * n && matrix[lo / n][lo % n] == target;
    }
}''')

prob(num=153, slug="find-minimum-in-rotated-sorted-array", title="Find Minimum in Rotated Sorted Array", diff="Medium",
  method="findMin",
  ask="A sorted array of distinct values was rotated (for example [3, 4, 5, 1, 2]). Find its minimum in O(log n).",
  cue="The Finding the Rotation Point subsection: every value in the rotated-away left part is bigger than the last element, and every value in the right part is at most the last element. \"nums[i] ≤ nums[-1]\" is false, then true: a monotone predicate, so lower_bound finds where it flips.",
  brute="Scan for the smallest value: O(n).",
  approach="Search for the first index where nums[i] ≤ nums[n - 1]. If nums[mid] &gt; nums[n - 1], mid is in the left part, so lo = mid + 1; otherwise hi = mid. The index found is the rotation point, which holds the minimum.",
  cx="O(log n) time, O(1) space.",
  trap="Comparing with nums[0] instead of the last element. When the array is not rotated at all, every value is ≥ nums[0], and the search heads off the wrong way. The last element works in both cases.",
  py='''class Solution:
    def findMin(self, nums: list[int]) -> int:
        lo, hi = 0, len(nums) - 1      # the last index always satisfies the predicate
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if nums[mid] > nums[-1]:
                lo = mid + 1           # mid is in the rotated-away left part
            else:
                hi = mid
        return nums[lo]''',
  java='''class Solution {
    public int findMin(int[] nums) {
        int last = nums[nums.length - 1];
        int lo = 0, hi = nums.length - 1;   // the last index always satisfies the predicate
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] > last) lo = mid + 1;   // in the rotated-away left part
            else hi = mid;
        }
        return nums[lo];
    }
}''')

prob(num=33, slug="search-in-rotated-sorted-array", title="Search in Rotated Sorted Array", diff="Medium",
  method="search",
  ask="Find a target's position in a rotated sorted array of distinct values, or return -1, in O(log n).",
  cue="Two templated searches beat one clever one. First find the rotation point (Find Minimum in Rotated Sorted Array). The array is then two sorted runs, and the target can only be in one of them.",
  brute="Scan: O(n).",
  approach="Find the rotation point p as in the previous problem. If the target is at most the last element, it can only be in the right run nums[p:]; otherwise only in the left run nums[:p]. Run lower_bound on that run and check the result.",
  cx="O(log n) time, O(1) space: two binary searches.",
  trap="The one-pass version with four nested comparisons is the classic source of off-by-one bugs. Splitting it into two searches, each an unmodified template, removes the cases you have to get right.",
  py='''class Solution:
    def search(self, nums: list[int], target: int) -> int:
        lo, hi = 0, len(nums) - 1      # 1: find the rotation point
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if nums[mid] > nums[-1]:
                lo = mid + 1
            else:
                hi = mid
        p = lo
        lo, hi = (p, len(nums)) if target <= nums[-1] else (0, p)   # 2: pick the run
        while lo < hi:                 # 3: ordinary lower_bound inside it
            mid = lo + (hi - lo) // 2
            if nums[mid] < target:
                lo = mid + 1
            else:
                hi = mid
        return lo if lo < len(nums) and nums[lo] == target else -1''',
  java='''class Solution {
    public int search(int[] nums, int target) {
        int n = nums.length, last = nums[n - 1];
        int lo = 0, hi = n - 1;        // 1: find the rotation point
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] > last) lo = mid + 1;
            else hi = mid;
        }
        int p = lo;
        if (target <= last) { lo = p; hi = n; } else { lo = 0; hi = p; }   // 2: pick the run
        while (lo < hi) {              // 3: ordinary lower_bound inside it
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] < target) lo = mid + 1;
            else hi = mid;
        }
        return lo < n && nums[lo] == target ? lo : -1;
    }
}''')

prob(num=81, slug="search-in-rotated-sorted-array-ii", title="Search in Rotated Sorted Array II", diff="Medium",
  method="search",
  ask="Search in Rotated Sorted Array, but values may repeat. Return whether the target is present.",
  cue="The Where Duplicates Break It subsection. With repeats, [1, 1, 1, 2, 1] gives nums[mid] equal to both ends, and you cannot tell which side the rotation point is on. No predicate is monotone any more, so the worst case has to be linear.",
  brute="Scan: O(n), which is also the true worst case of any method here.",
  approach="Search a closed range [lo, hi]. If nums[mid] is the target, done. If nums[lo], nums[mid] and nums[hi] are all equal, you learn nothing, so shrink both ends by one. Otherwise one half is sorted: if nums[lo] ≤ nums[mid] the left half is, so search it if the target lies in its range, else the right half; symmetrically when the right half is sorted.",
  cx="O(log n) on most inputs, O(n) in the worst case (every value equal except one).",
  trap="Claiming O(log n). Interviewers ask this follow-up precisely to see whether you notice that duplicates make the problem linear in the worst case, and why.",
  py='''class Solution:
    def search(self, nums: list[int], target: int) -> bool:
        lo, hi = 0, len(nums) - 1      # closed range [lo, hi]
        while lo <= hi:
            mid = lo + (hi - lo) // 2
            if nums[mid] == target:
                return True
            if nums[lo] == nums[mid] == nums[hi]:
                lo += 1                # no information: shrink both ends
                hi -= 1
            elif nums[lo] <= nums[mid]:          # left half is sorted
                if nums[lo] <= target < nums[mid]:
                    hi = mid - 1
                else:
                    lo = mid + 1
            else:                                # right half is sorted
                if nums[mid] < target <= nums[hi]:
                    lo = mid + 1
                else:
                    hi = mid - 1
        return False''',
  java='''class Solution {
    public boolean search(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;   // closed range [lo, hi]
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return true;
            if (nums[lo] == nums[mid] && nums[mid] == nums[hi]) { lo++; hi--; }   // no information
            else if (nums[lo] <= nums[mid]) {            // left half is sorted
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {                                     // right half is sorted
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return false;
    }
}''')

prob(num=162, slug="find-peak-element", title="Find Peak Element", diff="Medium",
  method="findPeakElement", observe=is_peak,
  ask="In an array where neighbours are never equal, return the index of any peak (a value bigger than its neighbours; the ends count as next to minus infinity), in O(log n).",
  cue="The array is not sorted, yet binary search works. If nums[mid] &lt; nums[mid + 1], the values rise to the right, and a rise must end in a peak before the array does, so a peak exists on the right. That is enough to discard the left half.",
  brute="Scan for the first i with nums[i] &gt; nums[i + 1]: O(n).",
  approach="Search [0, n - 1]. At mid, if nums[mid] &lt; nums[mid + 1], a peak lies to the right of mid, so lo = mid + 1; otherwise mid itself or something to its left is a peak, so hi = mid. When lo meets hi, it is a peak.",
  cx="O(log n) time, O(1) space.",
  trap="Believing binary search needs sorted input. It needs a question whose answer tells you which half still contains an answer. \"Is the next value bigger?\" is such a question here.",
  py='''class Solution:
    def findPeakElement(self, nums: list[int]) -> int:
        lo, hi = 0, len(nums) - 1
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if nums[mid] < nums[mid + 1]:
                lo = mid + 1           # rising: a peak lies to the right
            else:
                hi = mid               # falling: mid or something left of it
        return lo''',
  java='''class Solution {
    public int findPeakElement(int[] nums) {
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] < nums[mid + 1]) lo = mid + 1;   // rising: a peak to the right
            else hi = mid;                                 // falling: mid or to its left
        }
        return lo;
    }
}''')

prob(num=852, slug="peak-index-in-a-mountain-array", title="Peak Index in a Mountain Array", diff="Medium",
  method="peakIndexInMountainArray",
  ask="An array strictly increases and then strictly decreases. Return the index of its top.",
  cue="The Mountain Array subsection. \"Is the next value smaller?\" is false all the way up and true all the way down: a monotone predicate, so lower_bound finds the first index where it turns true, which is the top.",
  brute="Scan until the values start falling: O(n).",
  approach="Search [0, n - 1] for the first i with arr[i] &gt; arr[i + 1]. If arr[mid] &lt; arr[mid + 1], mid is still on the way up, so lo = mid + 1; otherwise hi = mid.",
  cx="O(log n) time, O(1) space.",
  trap="Reading arr[mid + 1] when mid could be the last index. Setting hi = n - 1 (not n) keeps mid below n - 1, because mid is always less than hi inside the loop.",
  py='''class Solution:
    def peakIndexInMountainArray(self, arr: list[int]) -> int:
        lo, hi = 0, len(arr) - 1       # mid < hi, so arr[mid + 1] is always safe
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if arr[mid] < arr[mid + 1]:
                lo = mid + 1           # still climbing
            else:
                hi = mid
        return lo''',
  java='''class Solution {
    public int peakIndexInMountainArray(int[] arr) {
        int lo = 0, hi = arr.length - 1;   // mid < hi, so arr[mid + 1] is safe
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] < arr[mid + 1]) lo = mid + 1;   // still climbing
            else hi = mid;
        }
        return lo;
    }
}''')

prob(num=540, slug="single-element-in-a-sorted-array", title="Single Element in a Sorted Array", diff="Medium",
  method="singleNonDuplicate",
  ask="In a sorted array, every value appears exactly twice except one, which appears once. Find it in O(log n) time and O(1) space.",
  cue="Before the single element, every pair starts at an even index; after it, every pair starts at an odd index. \"Does the pair at this even index match?\" is true, then false: a monotone predicate over the even indices.",
  brute="Scan in steps of two until a pair does not match: O(n). XOR of everything is also O(n).",
  approach="Search the even positions only. Take mid, and if it is odd, step back one so it is even. If nums[mid] == nums[mid + 1], the pairs are still aligned, so the single element is after this pair: lo = mid + 2. Otherwise it is at mid or before: hi = mid.",
  cx="O(log n) time, O(1) space.",
  trap="Forgetting to make mid even. At an odd mid, \"matches the next value\" means the opposite, and the search moves the wrong way.",
  py='''class Solution:
    def singleNonDuplicate(self, nums: list[int]) -> int:
        lo, hi = 0, len(nums) - 1
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if mid % 2 == 1:
                mid -= 1               # pairs start at even indices before the single one
            if nums[mid] == nums[mid + 1]:
                lo = mid + 2           # still aligned: the single one is further right
            else:
                hi = mid
        return nums[lo]''',
  java='''class Solution {
    public int singleNonDuplicate(int[] nums) {
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (mid % 2 == 1) mid--;   // pairs start at even indices before the single one
            if (nums[mid] == nums[mid + 1]) lo = mid + 2;   // still aligned: look right
            else hi = mid;
        }
        return nums[lo];
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=154, slug="find-minimum-in-rotated-sorted-array-ii", title="Find Minimum in Rotated Sorted Array II", diff="Hard",
  method="findMin",
  ask="Find the minimum of a rotated sorted array that may contain repeated values.",
  cue="Find Minimum in Rotated Sorted Array plus the duplicates problem from Search in Rotated Sorted Array II. When nums[mid] equals the last element you cannot tell which side the minimum is on, but you can safely drop the last element, because nums[mid] is an equal copy of it.",
  brute="Scan: O(n), which is again the true worst case.",
  approach="Compare nums[mid] with nums[hi]. Smaller: the minimum is at mid or to its left, hi = mid. Bigger: mid is in the rotated-away part, lo = mid + 1. Equal: hi -= 1, which cannot lose the minimum because nums[mid] holds the same value.",
  cx="O(log n) typically, O(n) in the worst case, for the same reason as Search in Rotated Sorted Array II.",
  trap="Comparing against a fixed nums[-1] as in the distinct version. With duplicates the rotation can put copies of the last value on both sides, and the fixed comparison gives the wrong half on inputs like [3, 1, 3, 3, 3]. Compare with the moving nums[hi].",
  py='''class Solution:
    def findMin(self, nums: list[int]) -> int:
        lo, hi = 0, len(nums) - 1
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if nums[mid] < nums[hi]:
                hi = mid
            elif nums[mid] > nums[hi]:
                lo = mid + 1
            else:
                hi -= 1                # nums[mid] is an equal copy: dropping nums[hi] is safe
        return nums[lo]''',
  java='''class Solution {
    public int findMin(int[] nums) {
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] < nums[hi]) hi = mid;
            else if (nums[mid] > nums[hi]) lo = mid + 1;
            else hi--;                 // nums[mid] is an equal copy: dropping nums[hi] is safe
        }
        return nums[lo];
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(13)
def sorted_arr(lo=-9, hi=9, nmin=1, nmax=10, distinct=False):
    n = R.randint(nmin, nmax)
    return sorted(R.sample(range(lo, hi + 1), min(n, hi - lo + 1))) if distinct else sorted(R.randint(lo, hi) for _ in range(n))
def rotate(a):
    k = R.randrange(len(a)); return a[k:] + a[:k]

def gen74():
    m, n = R.randint(1, 4), R.randint(1, 4)
    vals = sorted(R.sample(range(-20, 40), m * n))
    return [[vals[r * n:(r + 1) * n] for r in range(m)], R.randint(-22, 42)]

def gen162():
    a = [R.randint(-5, 5)]
    for _ in range(R.randint(0, 8)): a.append(a[-1] + R.choice([-3, -2, -1, 1, 2, 3]))
    return [a]

def gen852():
    up = sorted(R.sample(range(0, 30), R.randint(2, 6))); top = up[-1]
    down = sorted(R.sample(range(-10, top), R.randint(1, 5)), reverse=True)
    return [up + down]

def gen540():
    vals = sorted(R.sample(range(-10, 10), R.randint(1, 6))); s = R.choice(vals)
    return [sorted([v for v in vals for _ in range(1 if v == s else 2)])]

BRUTE = {
  704:  (lambda: [sorted_arr(distinct=True), R.randint(-10, 10)], lambda a, t: a.index(t) if t in a else -1),
  35:   (lambda: [sorted_arr(distinct=True), R.randint(-10, 10)], lambda a, t: sum(1 for x in a if x < t)),
  2529: (lambda: [sorted_arr(-3, 3)], lambda a: max(sum(1 for x in a if x < 0), sum(1 for x in a if x > 0))),
  34:   (lambda: [sorted_arr(-3, 3, 0), R.randint(-4, 4)],
         lambda a, t: [a.index(t), len(a) - 1 - a[::-1].index(t)] if t in a else [-1, -1]),
  74:   (gen74, lambda g, t: any(t in row for row in g)),
  153:  (lambda: [rotate(sorted_arr(distinct=True))], min),
  33:   (lambda: [rotate(sorted_arr(distinct=True)), R.randint(-10, 10)], lambda a, t: a.index(t) if t in a else -1),
  81:   (lambda: [rotate(sorted_arr(-3, 3)), R.randint(-4, 4)], lambda a, t: t in a),
  162:  (gen162, lambda a: True),
  852:  (gen852, lambda a: a.index(max(a))),
  540:  (gen540, lambda a: next(x for x in a if a.count(x) == 1)),
  154:  (lambda: [rotate(sorted_arr(-3, 3))], min),
}
