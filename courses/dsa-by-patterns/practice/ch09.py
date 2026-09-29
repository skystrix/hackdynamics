# Chapter 9 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
import random
from itertools import combinations

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

# ---------------------------------------------------------------- Easy
prob(num=1480, slug="running-sum-of-1d-array", title="Running Sum of 1d Array", diff="Easy",
  method="runningSum",
  ask="Return an array whose i-th entry is the sum of the input's first i + 1 values.",
  cue="This is the prefix-sum array itself, the object the Repeated Range Sums section builds. Every other problem in this set starts from it.",
  brute="For each position, add up everything before it from scratch: 1 + 2 + … + n additions, O(n²).",
  approach="Each running total is the previous running total plus one new value. Carry the total forward in one pass instead of re-adding the beginning of the array every time.",
  cx="O(n) time. O(n) for the output, O(1) besides.",
  trap="None in the code; the trap is conceptual. The chapter's convention puts a 0 in front (prefix[0] = 0, prefix[i] = sum of the first i values) so that every range sum is one subtraction. This problem asks for the version without the 0. Know which one you built before you index into it.",
  py='''class Solution:
    def runningSum(self, nums: list[int]) -> list[int]:
        out = []
        total = 0
        for x in nums:
            total += x
            out.append(total)
        return out''',
  java='''class Solution {
    public int[] runningSum(int[] nums) {
        int[] out = new int[nums.length];
        int total = 0;
        for (int i = 0; i < nums.length; i++) {
            total += nums[i];
            out[i] = total;
        }
        return out;
    }
}''')

prob(num=724, slug="find-pivot-index", title="Find Pivot Index", diff="Easy",
  method="pivotIndex",
  ask="Find the leftmost position where the sum of everything to its left equals the sum of everything to its right (-1 if there is none).",
  cue="\"Sum of everything to the left\" is a prefix sum, and \"everything to the right\" is the total minus that prefix minus the element itself.",
  brute="For each position, add up the left side and the right side separately: O(n²).",
  approach="Compute the total once. Walk left to right keeping left = the sum of what you have passed. At position i the right side is total - left - nums[i]. Compare, then add nums[i] to left and move on.",
  cx="O(n) time, O(1) space.",
  trap="Adding nums[i] to left before the comparison, which counts the pivot on its own left side. The pivot belongs to neither side.",
  py='''class Solution:
    def pivotIndex(self, nums: list[int]) -> int:
        total = sum(nums)
        left = 0                       # sum of nums[:i]
        for i, x in enumerate(nums):
            if left == total - left - x:
                return i
            left += x
        return -1''',
  java='''class Solution {
    public int pivotIndex(int[] nums) {
        int total = 0;
        for (int x : nums) total += x;
        int left = 0;                  // sum of nums[0..i-1]
        for (int i = 0; i < nums.length; i++) {
            if (left == total - left - nums[i]) return i;
            left += nums[i];
        }
        return -1;
    }
}''')

prob(num=303, slug="range-sum-query-immutable", title="Range Sum Query - Immutable", diff="Easy", design=True,
  ask="Build a class over a fixed array that answers many queries of the form \"what is the sum from position left to position right, inclusive?\"",
  cue="Many range-sum queries over an array that never changes: build the prefix array once, answer every query with one subtraction. This is the Repeated Range Sums section in class form.",
  brute="Loop from left to right on every query: O(n) per query, so 10,000 queries over 10,000 values is 100 million additions.",
  approach="In the constructor, build prefix with a leading 0, so prefix[i] is the sum of the first i values. The sum of positions left..right is prefix[right + 1] - prefix[left]: everything up to right, minus everything before left.",
  cx="O(n) to build, O(1) per query. O(n) space.",
  trap="The + 1. Using prefix[right] - prefix[left] drops the right endpoint. The leading 0 is what makes the formula the same for every query, including left = 0.",
  py='''class NumArray:
    def __init__(self, nums: list[int]):
        self.prefix = [0]              # prefix[i] = sum of the first i values
        for x in nums:
            self.prefix.append(self.prefix[-1] + x)

    def sumRange(self, left: int, right: int) -> int:
        return self.prefix[right + 1] - self.prefix[left]''',
  java='''class NumArray {
    private final int[] prefix;        // prefix[i] = sum of the first i values

    public NumArray(int[] nums) {
        prefix = new int[nums.length + 1];
        for (int i = 0; i < nums.length; i++) prefix[i + 1] = prefix[i] + nums[i];
    }

    public int sumRange(int left, int right) {
        return prefix[right + 1] - prefix[left];
    }
}''')

# ---------------------------------------------------------------- Medium
prob(num=238, slug="product-of-array-except-self", title="Product of Array Except Self", diff="Medium",
  method="productExceptSelf",
  ask="For each position, return the product of every other value in the array, without using division.",
  cue="\"Everything except position i\" splits into everything before i and everything after i: a prefix and a suffix. Prefix sums work for any operation you can accumulate, and products are one.",
  brute="Multiply the other n - 1 values for each position: O(n²). Dividing the total product by nums[i] is O(n) but is forbidden, and breaks on zeros anyway.",
  approach="First pass, left to right: out[i] = product of everything before i. Second pass, right to left, carrying a running product of everything after i and multiplying it into out[i]. The output array doubles as the prefix array, so no extra array is needed.",
  cx="O(n) time. O(1) extra space besides the output.",
  trap="Reaching for division. With one zero in the array, every answer except one is 0; with two zeros, every answer is 0. The prefix-and-suffix version handles both without a special case.",
  py='''class Solution:
    def productExceptSelf(self, nums: list[int]) -> list[int]:
        n = len(nums)
        out = [1] * n
        for i in range(1, n):          # out[i] = product of nums[:i]
            out[i] = out[i - 1] * nums[i - 1]
        after = 1                      # product of nums[i+1:]
        for i in range(n - 1, -1, -1):
            out[i] *= after
            after *= nums[i]
        return out''',
  java='''class Solution {
    public int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] out = new int[n];
        out[0] = 1;
        for (int i = 1; i < n; i++) out[i] = out[i - 1] * nums[i - 1];   // product before i
        int after = 1;                 // product after i
        for (int i = n - 1; i >= 0; i--) {
            out[i] *= after;
            after *= nums[i];
        }
        return out;
    }
}''')

prob(num=304, slug="range-sum-query-2d-immutable", title="Range Sum Query 2D - Immutable", diff="Medium", design=True,
  ask="Build a class over a fixed grid of numbers that answers many queries for the sum of a rectangle given by its top-left and bottom-right corners.",
  cue="Rectangle sums over a grid that never changes: the Two Dimensions section's one rectangle, four lookups.",
  brute="Add up every cell of the rectangle on each query: O(rows × cols) per query.",
  approach="Build P with an extra row and column of zeros, where P[r][c] is the sum of the rectangle from (0, 0) to (r - 1, c - 1). Build it with P[r+1][c+1] = cell + P[r][c+1] + P[r+1][c] - P[r][c]. A query is the big rectangle, minus the strip above, minus the strip to the left, plus the corner that was subtracted twice.",
  cx="O(rows × cols) to build, O(1) per query. O(rows × cols) space.",
  trap="Forgetting to add the corner back. The strip above and the strip to the left both contain the top-left corner, so subtracting both removes it twice.",
  py='''class NumMatrix:
    def __init__(self, matrix: list[list[int]]):
        R, C = len(matrix), len(matrix[0])
        self.P = [[0] * (C + 1) for _ in range(R + 1)]   # P[r][c] = sum above-left of (r, c)
        for r in range(R):
            for c in range(C):
                self.P[r + 1][c + 1] = (matrix[r][c] + self.P[r][c + 1]
                                        + self.P[r + 1][c] - self.P[r][c])

    def sumRegion(self, row1: int, col1: int, row2: int, col2: int) -> int:
        P = self.P
        return (P[row2 + 1][col2 + 1] - P[row1][col2 + 1]
                - P[row2 + 1][col1] + P[row1][col1])     # add back the corner''',
  java='''class NumMatrix {
    private final int[][] P;           // P[r][c] = sum above-left of (r, c)

    public NumMatrix(int[][] matrix) {
        int R = matrix.length, C = matrix[0].length;
        P = new int[R + 1][C + 1];
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++)
                P[r + 1][c + 1] = matrix[r][c] + P[r][c + 1] + P[r + 1][c] - P[r][c];
    }

    public int sumRegion(int row1, int col1, int row2, int col2) {
        return P[row2 + 1][col2 + 1] - P[row1][col2 + 1]
             - P[row2 + 1][col1] + P[row1][col1];        // add back the corner
    }
}''')

prob(num=1109, slug="corporate-flight-bookings", title="Corporate Flight Bookings", diff="Medium",
  method="corpFlightBookings",
  ask="Flights are numbered 1 to n. Each booking reserves some seats on every flight from a first to a last flight. Return the total seats reserved on each flight.",
  cue="Many \"add this amount to a whole range\" updates, then one read of every position: the difference array, which the chapter calls the same trick backwards.",
  brute="For each booking, loop over its flights and add the seats: O(bookings × n).",
  approach="Keep diff of length n + 1. A booking (first, last, seats) becomes two writes: diff[first - 1] += seats where the range starts, and diff[last] -= seats one past where it ends. After all bookings, a running sum over diff turns it back into the actual count per flight.",
  cx="O(bookings + n) time, O(n) space.",
  trap="The 1-based flight numbers. Flight first is index first - 1, and the \"stop adding\" mark goes at index last, one past flight last. The extra slot at the end is there so last = n needs no special case.",
  py='''class Solution:
    def corpFlightBookings(self, bookings: list[list[int]], n: int) -> list[int]:
        diff = [0] * (n + 1)
        for first, last, seats in bookings:
            diff[first - 1] += seats   # flights are numbered from 1
            diff[last] -= seats        # stop adding after flight `last`
        out, running = [], 0
        for i in range(n):
            running += diff[i]
            out.append(running)
        return out''',
  java='''class Solution {
    public int[] corpFlightBookings(int[][] bookings, int n) {
        int[] diff = new int[n + 1];
        for (int[] b : bookings) {
            diff[b[0] - 1] += b[2];    // flights are numbered from 1
            diff[b[1]] -= b[2];        // stop adding after flight b[1]
        }
        int[] out = new int[n];
        int running = 0;
        for (int i = 0; i < n; i++) {
            running += diff[i];
            out[i] = running;
        }
        return out;
    }
}''')

prob(num=1094, slug="car-pooling", title="Car Pooling", diff="Medium",
  method="carPooling",
  ask="A car drives east only. Each trip picks up some passengers at one kilometre mark and drops them at a later one. Decide whether the car ever holds more passengers than its capacity.",
  cue="Each trip adds passengers over a range of positions. That is a range update, and you only need the total at every position afterwards: difference array again.",
  brute="For each trip, add its passengers at every kilometre it covers, then check each kilometre: O(trips × distance).",
  approach="At a trip's start, the load goes up by its passengers; at its end, down by the same amount. Record those two changes per trip in a difference array over the kilometre marks, then sweep left to right with a running load. If the running load ever exceeds capacity, answer false.",
  cx="O(trips + D) time and O(D) space, where D is the largest drop-off point (1,000 here).",
  trap="Dropping passengers one kilometre late. Passengers leave at the drop-off point, so the change goes at index to, not to + 1; someone getting on at that same mark does not overlap with them.",
  py='''class Solution:
    def carPooling(self, trips: list[list[int]], capacity: int) -> bool:
        change = [0] * 1001            # load change at each kilometre mark
        for people, start, end in trips:
            change[start] += people
            change[end] -= people      # they leave at `end`, not after it
        load = 0
        for c in change:
            load += c
            if load > capacity:
                return False
        return True''',
  java='''class Solution {
    public boolean carPooling(int[][] trips, int capacity) {
        int[] change = new int[1001];  // load change at each kilometre mark
        for (int[] t : trips) {
            change[t[1]] += t[0];
            change[t[2]] -= t[0];      // they leave at t[2], not after it
        }
        int load = 0;
        for (int c : change) {
            load += c;
            if (load > capacity) return false;
        }
        return true;
    }
}''')

prob(num=560, slug="subarray-sum-equals-k", title="Subarray Sum Equals K", diff="Medium",
  method="subarraySum",
  ask="Count the blocks of consecutive values whose sum is exactly k. The values can be negative.",
  cue="Count subarrays with a given sum, and negative numbers are allowed. Negatives rule out Chapter 8's window (the sum no longer grows as the window grows). The Prefix Sums with a Hash Map section is built for this.",
  brute="Try every start and extend to every end with a running sum: O(n²).",
  approach="A block from i to j sums to k exactly when prefix[j + 1] - prefix[i] = k, that is, when some earlier prefix equals current - k. Walk once, keeping a map from each prefix value to how many times it has occurred. At each step, add the count of current - k to the answer, then record the current prefix.",
  cx="O(n) time, O(n) space for the map.",
  trap="Forgetting to seed the map with {0: 1}. That entry is the empty prefix before the array starts, and without it every block that starts at position 0 is missed.",
  py='''class Solution:
    def subarraySum(self, nums: list[int], k: int) -> int:
        seen = {0: 1}                  # prefix value -> times seen; 0 is the empty prefix
        prefix = count = 0
        for x in nums:
            prefix += x
            count += seen.get(prefix - k, 0)
            seen[prefix] = seen.get(prefix, 0) + 1
        return count''',
  java='''import java.util.HashMap;

class Solution {
    public int subarraySum(int[] nums, int k) {
        HashMap<Integer, Integer> seen = new HashMap<>();
        seen.put(0, 1);                // the empty prefix
        int prefix = 0, count = 0;
        for (int x : nums) {
            prefix += x;
            count += seen.getOrDefault(prefix - k, 0);
            seen.merge(prefix, 1, Integer::sum);
        }
        return count;
    }
}''')

prob(num=525, slug="contiguous-array", title="Contiguous Array", diff="Medium",
  method="findMaxLength",
  ask="In an array of 0s and 1s, find the length of the longest block of consecutive values with as many 0s as 1s.",
  cue="Count 0 as -1 and 1 as +1. \"Equal numbers of each\" becomes \"sums to 0\", which is Subarray Sum Equals K with k = 0, except the question is the longest block rather than how many.",
  brute="Check every block with a running balance: O(n²).",
  approach="Walk once with balance = (number of 1s) - (number of 0s) so far. A block has equal counts when the balance at its end equals the balance before its start. To make that block as long as possible, remember the first index where each balance appeared, and measure from there.",
  cx="O(n) time, O(n) space.",
  trap="The chapter explains why the map holds counts for counting problems. For a longest-block problem it must hold the first index, and you must not overwrite it when the balance repeats; overwriting keeps the latest index and shortens every answer.",
  py='''class Solution:
    def findMaxLength(self, nums: list[int]) -> int:
        first = {0: -1}                # balance -> first index it appeared (before the array: -1)
        balance = best = 0
        for i, x in enumerate(nums):
            balance += 1 if x == 1 else -1
            if balance in first:
                best = max(best, i - first[balance])
            else:
                first[balance] = i     # keep the earliest, never overwrite
        return best''',
  java='''import java.util.HashMap;

class Solution {
    public int findMaxLength(int[] nums) {
        HashMap<Integer, Integer> first = new HashMap<>();   // balance -> first index
        first.put(0, -1);              // before the array
        int balance = 0, best = 0;
        for (int i = 0; i < nums.length; i++) {
            balance += nums[i] == 1 ? 1 : -1;
            if (first.containsKey(balance)) best = Math.max(best, i - first.get(balance));
            else first.put(balance, i);   // keep the earliest, never overwrite
        }
        return best;
    }
}''')

prob(num=974, slug="subarray-sums-divisible-by-k", title="Subarray Sums Divisible by K", diff="Medium",
  method="subarraysDivByK",
  ask="Count the blocks of consecutive values whose sum is divisible by k. Values can be negative.",
  cue="A block's sum is prefix[j] - prefix[i], and that is divisible by k exactly when the two prefixes leave the same remainder. Same hash-map counting as Subarray Sum Equals K, keyed on remainders.",
  brute="Every block with a running sum, testing divisibility: O(n²).",
  approach="Walk once with a running prefix sum. Keep count[r] = how many earlier prefixes had remainder r (seeded with the empty prefix, remainder 0). At each step, every earlier prefix with the same remainder closes a block divisible by k, so add count[r] and then increment it.",
  cx="O(n) time, O(k) space.",
  trap="Negative remainders in Java. In Java, -7 % 5 is -2, while Python gives 3. Two prefixes with the same true remainder can then land in different buckets. Normalize with ((x % k) + k) % k.",
  py='''class Solution:
    def subarraysDivByK(self, nums: list[int], k: int) -> int:
        count = [0] * k                # count[r] = earlier prefixes with remainder r
        count[0] = 1                   # the empty prefix
        prefix = total = 0
        for x in nums:
            prefix = (prefix + x) % k  # Python's % is never negative for k > 0
            total += count[prefix]
            count[prefix] += 1
        return total''',
  java='''class Solution {
    public int subarraysDivByK(int[] nums, int k) {
        int[] count = new int[k];      // count[r] = earlier prefixes with remainder r
        count[0] = 1;                  // the empty prefix
        int prefix = 0, total = 0;
        for (int x : nums) {
            prefix = ((prefix + x) % k + k) % k;   // Java's % can be negative
            total += count[prefix];
            count[prefix]++;
        }
        return total;
    }
}''')

prob(num=53, slug="maximum-subarray", title="Maximum Subarray", diff="Medium",
  method="maxSubArray",
  ask="Find the largest sum of any non-empty block of consecutive values.",
  cue="The Kadane section's problem, and Chapter 1's opening problem. The best block ending at position i either extends the best block ending at i - 1 or starts fresh at i.",
  brute="Every block with a running sum: O(n²). Chapter 1 races this against the faster versions.",
  approach="Walk once keeping here = the best sum of a block that ends exactly at the current position. It is max(x, here + x): extend the previous block if that helps, otherwise start over at x. The answer is the largest here ever seen.",
  cx="O(n) time, O(1) space.",
  trap="Starting best at 0. On an all-negative array the answer is the largest single value, which is negative, and a best that starts at 0 wrongly returns 0. Start it at the first value. This is the edge case the Kadane section warns about.",
  py='''class Solution:
    def maxSubArray(self, nums: list[int]) -> int:
        here = best = nums[0]          # not 0: every value may be negative
        for x in nums[1:]:
            here = max(x, here + x)    # extend, or start again at x
            best = max(best, here)
        return best''',
  java='''class Solution {
    public int maxSubArray(int[] nums) {
        int here = nums[0], best = nums[0];   // not 0: every value may be negative
        for (int i = 1; i < nums.length; i++) {
            here = Math.max(nums[i], here + nums[i]);   // extend, or start again
            best = Math.max(best, here);
        }
        return best;
    }
}''')

prob(num=918, slug="maximum-sum-circular-subarray", title="Maximum Sum Circular Subarray", diff="Medium",
  method="maxSubarraySumCircular",
  ask="Same as Maximum Subarray, but the array is circular: a block may run off the end and continue from the start.",
  cue="A block that wraps around is the whole array minus a block in the middle. So the best wrapping block is the total minus the smallest ordinary block, and Kadane finds both.",
  brute="Try every start and every length up to n, walking around the circle: O(n²).",
  approach="Run Kadane twice in one pass: once for the largest block (the non-wrapping answer) and once for the smallest block. The best wrapping block is total - smallest. Return the larger of the two, with one exception below.",
  cx="O(n) time, O(1) space.",
  trap="When every value is negative, the smallest block is the whole array, and total - smallest = 0 describes an empty block, which is not allowed. In that case return the ordinary maximum.",
  py='''class Solution:
    def maxSubarraySumCircular(self, nums: list[int]) -> int:
        total = 0
        cur_max = cur_min = 0
        best_max, best_min = nums[0], nums[0]
        for x in nums:
            cur_max = max(x, cur_max + x)
            best_max = max(best_max, cur_max)
            cur_min = min(x, cur_min + x)
            best_min = min(best_min, cur_min)
            total += x
        if best_max < 0:               # all negative: wrapping would mean an empty block
            return best_max
        return max(best_max, total - best_min)''',
  java='''class Solution {
    public int maxSubarraySumCircular(int[] nums) {
        int total = 0, curMax = 0, curMin = 0, bestMax = nums[0], bestMin = nums[0];
        for (int x : nums) {
            curMax = Math.max(x, curMax + x);
            bestMax = Math.max(bestMax, curMax);
            curMin = Math.min(x, curMin + x);
            bestMin = Math.min(bestMin, curMin);
            total += x;
        }
        if (bestMax < 0) return bestMax;   // all negative: wrapping would be empty
        return Math.max(bestMax, total - bestMin);
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=1074, slug="number-of-submatrices-that-sum-to-target", title="Number of Submatrices That Sum to Target", diff="Hard",
  method="numSubmatrixSumTarget",
  ask="Count the rectangles inside a grid whose cells add up to a target value.",
  cue="Two ideas from this chapter stacked. Fix a top row and a bottom row; the rectangle between them collapses into a one-dimensional array of column sums, and counting blocks of that array with a given sum is Subarray Sum Equals K.",
  brute="Enumerate all O(R²C²) rectangles and sum each with the 2D prefix array: O(R²C²), about 100 million for a 100 × 100 grid.",
  approach="For each pair of rows top ≤ bottom, keep col[c] = the sum of column c between those rows (extend it by one row at a time as bottom moves down). Then run the prefix-sum-and-hash-map count over col with the target.",
  cx="O(R² × C) time and O(C) space. Put the shorter dimension in the R² role if the grid is very unbalanced.",
  trap="Rebuilding the column sums from scratch for each (top, bottom) pair, which adds another factor of R. Keep top fixed and add one row to col as bottom moves down.",
  py='''class Solution:
    def numSubmatrixSumTarget(self, matrix: list[list[int]], target: int) -> int:
        R, C = len(matrix), len(matrix[0])
        count = 0
        for top in range(R):
            col = [0] * C              # column sums between rows top..bottom
            for bottom in range(top, R):
                for c in range(C):
                    col[c] += matrix[bottom][c]
                seen = {0: 1}          # Subarray Sum Equals K over col
                prefix = 0
                for x in col:
                    prefix += x
                    count += seen.get(prefix - target, 0)
                    seen[prefix] = seen.get(prefix, 0) + 1
        return count''',
  java='''import java.util.HashMap;

class Solution {
    public int numSubmatrixSumTarget(int[][] matrix, int target) {
        int R = matrix.length, C = matrix[0].length, count = 0;
        for (int top = 0; top < R; top++) {
            int[] col = new int[C];    // column sums between rows top..bottom
            for (int bottom = top; bottom < R; bottom++) {
                for (int c = 0; c < C; c++) col[c] += matrix[bottom][c];
                HashMap<Integer, Integer> seen = new HashMap<>();   // Subarray Sum Equals K
                seen.put(0, 1);
                int prefix = 0;
                for (int x : col) {
                    prefix += x;
                    count += seen.getOrDefault(prefix - target, 0);
                    seen.merge(prefix, 1, Integer::sum);
                }
            }
        }
        return count;
    }
}''')

prob(num=689, slug="maximum-sum-of-3-non-overlapping-subarrays", title="Maximum Sum of 3 Non-Overlapping Subarrays", diff="Hard",
  method="maxSumOfThreeSubarrays",
  ask="Choose three non-overlapping blocks, each exactly k long, with the largest total. Return their starting positions, choosing the earliest positions when there is a tie.",
  cue="Every block has the same length k, so each block's sum is one prefix-sum subtraction. Then fix the middle block: the best left block must end before it and the best right block must start after it, and both can be precomputed in one pass each.",
  brute="Try every triple of start positions: O(n³) triples.",
  approach="Compute w[i] = sum of the block starting at i, using prefix sums. Build left[i] = the start of the best block at or before i, scanning left to right, and right[i] = the start of the best block at or after i, scanning right to left. Then for each middle start m, the candidate is w[left[m - k]] + w[m] + w[right[m + k]]. Keep the best.",
  cx="O(n) time and O(n) space.",
  trap="The tie rule. Replace the left best only on a strictly larger sum (so the earlier position wins), but replace the right best on a larger-or-equal sum while scanning right to left (so the earlier position wins there too). Getting either comparison backwards returns a valid but later answer, and the judge rejects it.",
  py='''class Solution:
    def maxSumOfThreeSubarrays(self, nums: list[int], k: int) -> list[int]:
        n = len(nums)
        prefix = [0]
        for x in nums:
            prefix.append(prefix[-1] + x)
        w = [prefix[i + k] - prefix[i] for i in range(n - k + 1)]   # block sums
        left = [0] * len(w)            # best start at or before i (earliest on ties)
        for i in range(1, len(w)):
            left[i] = i if w[i] > w[left[i - 1]] else left[i - 1]
        right = [len(w) - 1] * len(w)  # best start at or after i (earliest on ties)
        for i in range(len(w) - 2, -1, -1):
            right[i] = i if w[i] >= w[right[i + 1]] else right[i + 1]
        best = None
        for m in range(k, len(w) - k):
            a, b = left[m - k], right[m + k]
            if best is None or w[a] + w[m] + w[b] > sum(w[j] for j in best):
                best = [a, m, b]
        return best''',
  java='''class Solution {
    public int[] maxSumOfThreeSubarrays(int[] nums, int k) {
        int n = nums.length, W = n - k + 1;
        int[] prefix = new int[n + 1];
        for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];
        int[] w = new int[W];          // block sums
        for (int i = 0; i < W; i++) w[i] = prefix[i + k] - prefix[i];
        int[] left = new int[W], right = new int[W];
        for (int i = 1; i < W; i++) left[i] = w[i] > w[left[i - 1]] ? i : left[i - 1];
        right[W - 1] = W - 1;
        for (int i = W - 2; i >= 0; i--) right[i] = w[i] >= w[right[i + 1]] ? i : right[i + 1];
        int[] best = null;
        int bestSum = Integer.MIN_VALUE;
        for (int m = k; m < W - k; m++) {
            int a = left[m - k], b = right[m + k], s = w[a] + w[m] + w[b];
            if (s > bestSum) { bestSum = s; best = new int[]{a, m, b}; }
        }
        return best;
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(9)
def arr(lo, hi, nmin=1, nmax=9): return [R.randint(lo, hi) for _ in range(R.randint(nmin, nmax))]
def grid(lo, hi, rmax=4, cmax=4):
    r, c = R.randint(1, rmax), R.randint(1, cmax)
    return [[R.randint(lo, hi) for _ in range(c)] for _ in range(r)]
def blocks(a): return [a[i:j] for i in range(len(a)) for j in range(i + 1, len(a) + 1)]

def gen303():
    a = arr(-5, 5); ops, args = ["NumArray"], [[a]]
    for _ in range(R.randint(1, 6)):
        i = R.randrange(len(a)); j = R.randrange(i, len(a)); ops.append("sumRange"); args.append([i, j])
    return ops, args
def brute303(ops, args):
    a = args[0][0]; return [None] + [sum(a[i:j + 1]) for i, j in args[1:]]

def gen304():
    g = grid(-5, 5); ops, args = ["NumMatrix"], [[g]]
    for _ in range(R.randint(1, 6)):
        r1 = R.randrange(len(g)); r2 = R.randrange(r1, len(g)); c1 = R.randrange(len(g[0])); c2 = R.randrange(c1, len(g[0]))
        ops.append("sumRegion"); args.append([r1, c1, r2, c2])
    return ops, args
def brute304(ops, args):
    g = args[0][0]
    return [None] + [sum(g[r][c] for r in range(r1, r2 + 1) for c in range(c1, c2 + 1)) for r1, c1, r2, c2 in args[1:]]

def gen1109():
    n = R.randint(1, 8); bs = []
    for _ in range(R.randint(1, 6)):
        f = R.randint(1, n); bs.append([f, R.randint(f, n), R.randint(1, 9)])
    return [bs, n]
def brute1109(bs, n):
    out = [0] * n
    for f, l, s in bs:
        for i in range(f - 1, l): out[i] += s
    return out

def gen1094():
    trips = []
    for _ in range(R.randint(1, 6)):
        s = R.randint(0, 12); trips.append([R.randint(1, 5), s, R.randint(s + 1, 14)])
    return [trips, R.randint(1, 12)]
def brute1094(trips, cap):
    return all(sum(p for p, s, e in trips if s <= x < e) <= cap for x in range(0, 15))

def brute1074(g, t):
    Rr, C = len(g), len(g[0])
    return sum(1 for r1 in range(Rr) for r2 in range(r1, Rr) for c1 in range(C) for c2 in range(c1, C)
               if sum(g[r][c] for r in range(r1, r2 + 1) for c in range(c1, c2 + 1)) == t)

def gen689():
    k = R.randint(1, 3); return [arr(0, 6, 3 * k, 3 * k + 5), k]
def brute689(a, k):
    n = len(a); best = None
    for i in range(n - k + 1):
        for j in range(i + k, n - k + 1):
            for l in range(j + k, n - k + 1):
                s = sum(a[i:i + k]) + sum(a[j:j + k]) + sum(a[l:l + k])
                if best is None or s > best[0]: best = (s, [i, j, l])   # loops run in lexicographic order
    return best[1]

BRUTE = {
  1480: (lambda: [arr(-9, 9)], lambda a: [sum(a[:i + 1]) for i in range(len(a))]),
  724:  (lambda: [arr(-3, 3)], lambda a: next((i for i in range(len(a)) if sum(a[:i]) == sum(a[i + 1:])), -1)),
  303:  (gen303, brute303),
  238:  (lambda: [arr(-3, 3, 2, 8)], lambda a: [eval("*".join(map(str, a[:i] + a[i + 1:])) or "1") for i in range(len(a))]),
  304:  (gen304, brute304),
  1109: (gen1109, brute1109),
  1094: (gen1094, brute1094),
  560:  (lambda: [arr(-3, 3), R.randint(-4, 4)], lambda a, k: sum(1 for b in blocks(a) if sum(b) == k)),
  525:  (lambda: [arr(0, 1)], lambda a: max([len(b) for b in blocks(a) if 2 * sum(b) == len(b)] or [0])),
  974:  (lambda: [arr(-9, 9), R.randint(2, 6)], lambda a, k: sum(1 for b in blocks(a) if sum(b) % k == 0)),
  53:   (lambda: [arr(-9, 9)], lambda a: max(sum(b) for b in blocks(a))),
  918:  (lambda: [arr(-9, 9)], lambda a: max(sum((a + a)[i:i + L]) for i in range(len(a)) for L in range(1, len(a) + 1))),
  1074: (lambda: [grid(-2, 2), R.randint(-2, 2)], brute1074),
  689:  (gen689, brute689),
}
