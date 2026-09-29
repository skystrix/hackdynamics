# Chapter 22 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
# Grid, interval, bitmask and digit DP have no free Easy problems on LeetCode, so this set starts at Medium.
import random
from functools import lru_cache
from itertools import permutations, product

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

# ---------------------------------------------------------------- Medium
prob(num=62, slug="unique-paths", title="Unique Paths", diff="Medium",
  method="uniquePaths",
  ask="A robot moves only right or down on an m × n grid. Count its paths from the top-left corner to the bottom-right.",
  cue="The Grid DP section's two predecessors: every cell is reached from the cell above or the cell to the left, so its count is their sum.",
  brute="Enumerate every path: C(m + n - 2, m - 1) of them, about 2.3 × 10⁵⁸ on a 100 × 100 grid (the problem promises the answer for its tests fits in 2 × 10⁹).",
  approach="Keep one row of counts, all 1 for the top row. For each next row, walk left to right with row[c] += row[c - 1]: row[c] still holds the value from above, and row[c - 1] was already updated to this row's left neighbour.",
  cx="O(m × n) time, O(n) space. (The count is also the binomial coefficient C(m + n - 2, m - 1), computable directly.)",
  trap="Forgetting the edge. Cells in the top row and left column have only one predecessor, so their counts are 1; the one-row version gets that for free by starting at all 1s and leaving row[0] alone.",
  py='''class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        row = [1] * n                  # the top row: one path to each cell
        for _ in range(m - 1):
            for c in range(1, n):
                row[c] += row[c - 1]   # from above (old row[c]) plus from the left
        return row[-1]''',
  java='''class Solution {
    public int uniquePaths(int m, int n) {
        int[] row = new int[n];
        java.util.Arrays.fill(row, 1); // the top row: one path to each cell
        for (int r = 1; r < m; r++)
            for (int c = 1; c < n; c++) row[c] += row[c - 1];   // above plus left
        return row[n - 1];
    }
}''')

prob(num=63, slug="unique-paths-ii", title="Unique Paths II", diff="Medium",
  method="uniquePathsWithObstacles",
  ask="Unique Paths, but some cells are blocked (marked 1) and cannot be entered.",
  cue="The Grid DP section's \"edge\": the same two-predecessor sum, where a blocked cell has 0 paths through it.",
  brute="Enumerate every path and discard the blocked ones: exponential.",
  approach="Keep one row of counts starting with row[0] = 1 if the start is open. For each cell in order, set row[c] = 0 if it is blocked; otherwise add row[c - 1] (the left neighbour) when c &gt; 0. row[c] itself already holds the count from above.",
  cx="O(m × n) time, O(n) space.",
  trap="Initializing the whole first row and column to 1 as in Unique Paths. A block partway along the top row cuts off every cell after it, so those cells must be 0; computing them with the same rule, instead of pre-filling, handles it.",
  py='''class Solution:
    def uniquePathsWithObstacles(self, obstacleGrid: list[list[int]]) -> int:
        n = len(obstacleGrid[0])
        row = [1] + [0] * (n - 1)      # before the first row: only the start is reachable
        for grid_row in obstacleGrid:
            for c in range(n):
                if grid_row[c] == 1:
                    row[c] = 0         # no path goes through a block
                elif c > 0:
                    row[c] += row[c - 1]
        return row[-1]''',
  java='''class Solution {
    public int uniquePathsWithObstacles(int[][] obstacleGrid) {
        int n = obstacleGrid[0].length;
        int[] row = new int[n];
        row[0] = 1;                    // before the first row: only the start is reachable
        for (int[] gridRow : obstacleGrid)
            for (int c = 0; c < n; c++) {
                if (gridRow[c] == 1) row[c] = 0;   // no path goes through a block
                else if (c > 0) row[c] += row[c - 1];
            }
        return row[n - 1];
    }
}''')

prob(num=64, slug="minimum-path-sum", title="Minimum Path Sum", diff="Medium",
  method="minPathSum",
  ask="Moving only right or down, find the path from the top-left to the bottom-right corner with the smallest sum of cell values.",
  cue="Unique Paths with min instead of sum: the cheapest way to reach a cell is its own value plus the cheaper of the two predecessors.",
  brute="Every path: exponential in m + n.",
  approach="Keep one row of best costs. The first row is a running sum along it. For each later row, row[0] += that row's first value (only from above), and row[c] = value + min(row[c], row[c - 1]).",
  cx="O(m × n) time, O(n) space.",
  trap="A greedy that always steps to the cheaper neighbour. A cheap first step can lead into an expensive corridor; the table considers every path implicitly.",
  py='''class Solution:
    def minPathSum(self, grid: list[list[int]]) -> int:
        row = []
        for v in grid[0]:
            row.append(v + (row[-1] if row else 0))   # the first row: only from the left
        for grid_row in grid[1:]:
            row[0] += grid_row[0]      # the first column: only from above
            for c in range(1, len(row)):
                row[c] = grid_row[c] + min(row[c], row[c - 1])   # above, or left
        return row[-1]''',
  java='''class Solution {
    public int minPathSum(int[][] grid) {
        int n = grid[0].length;
        int[] row = new int[n];
        row[0] = grid[0][0];
        for (int c = 1; c < n; c++) row[c] = row[c - 1] + grid[0][c];   // only from the left
        for (int r = 1; r < grid.length; r++) {
            row[0] += grid[r][0];      // only from above
            for (int c = 1; c < n; c++) row[c] = grid[r][c] + Math.min(row[c], row[c - 1]);
        }
        return row[n - 1];
    }
}''')

prob(num=221, slug="maximal-square", title="Maximal Square", diff="Medium",
  method="maximalSquare",
  ask="In a grid of '0' and '1', find the area of the largest square containing only '1's.",
  cue="Grid DP with three predecessors. The largest all-ones square with its bottom-right corner at a cell is limited by the squares ending directly above, directly left, and diagonally above-left.",
  brute="For each cell as the top-left corner, grow a square while it stays all ones: O((m × n)²) in the worst case.",
  approach="side[r][c] = 0 for a '0'; for a '1' it is 1 + min(side above, side left, side diagonal). The answer is the largest side, squared. With one row, keep the diagonal value in a variable before overwriting.",
  cx="O(m × n) time, O(n) space.",
  trap="Returning the side length. The problem asks for the area.",
  py='''class Solution:
    def maximalSquare(self, matrix: list[list[str]]) -> int:
        n = len(matrix[0])
        side = [0] * (n + 1)           # one row, with a zero column on the left
        best = 0
        for row in matrix:
            diag = 0                   # side[r - 1][c - 1]
            for c in range(1, n + 1):
                above = side[c]
                side[c] = 1 + min(above, side[c - 1], diag) if row[c - 1] == "1" else 0
                diag = above
                best = max(best, side[c])
        return best * best             # the area, not the side''',
  java='''class Solution {
    public int maximalSquare(char[][] matrix) {
        int n = matrix[0].length, best = 0;
        int[] side = new int[n + 1];   // one row, with a zero column on the left
        for (char[] row : matrix) {
            int diag = 0;              // side[r - 1][c - 1]
            for (int c = 1; c <= n; c++) {
                int above = side[c];
                side[c] = row[c - 1] == '1' ? 1 + Math.min(above, Math.min(side[c - 1], diag)) : 0;
                diag = above;
                best = Math.max(best, side[c]);
            }
        }
        return best * best;            // the area, not the side
    }
}''')

prob(num=1039, slug="minimum-score-triangulation-of-polygon", title="Minimum Score Triangulation of Polygon", diff="Medium",
  method="minScoreTriangulation",
  ask="Cut a convex polygon into triangles; each triangle scores the product of its three vertex values. Minimize the total score.",
  cue="The Interval DP section. In any triangulation, the edge from vertex i to vertex j belongs to exactly one triangle, whose third vertex k lies between them. Choosing k splits the polygon into two smaller ranges.",
  brute="Enumerate all triangulations: Catalan-many, about 10²⁶ for 50 vertices.",
  approach="C[i][j] is the best score for the polygon piece from vertex i to vertex j. C[i][j] = min over i &lt; k &lt; j of C[i][k] + C[k][j] + v[i] × v[k] × v[j], with C[i][i + 1] = 0. Fill by increasing gap j - i.",
  cx="O(n³) time, 125,000 steps at n = 50, and O(n²) space.",
  trap="Filling the table row by row with i increasing. C[i][j] needs C[k][j] for k &gt; i, which is not computed yet. Filling by increasing length j - i guarantees every smaller range is ready.",
  py='''class Solution:
    def minScoreTriangulation(self, values: list[int]) -> int:
        n = len(values)
        C = [[0] * n for _ in range(n)]
        for gap in range(2, n):        # by increasing length: smaller ranges first
            for i in range(n - gap):
                j = i + gap
                C[i][j] = min(C[i][k] + C[k][j] + values[i] * values[k] * values[j]
                              for k in range(i + 1, j))   # k: the third vertex on edge i-j
        return C[0][n - 1]''',
  java='''class Solution {
    public int minScoreTriangulation(int[] values) {
        int n = values.length;
        int[][] C = new int[n][n];
        for (int gap = 2; gap < n; gap++)          // by increasing length
            for (int i = 0; i + gap < n; i++) {
                int j = i + gap;
                C[i][j] = Integer.MAX_VALUE;
                for (int k = i + 1; k < j; k++)    // k: the third vertex on edge i-j
                    C[i][j] = Math.min(C[i][j], C[i][k] + C[k][j] + values[i] * values[k] * values[j]);
            }
        return C[0][n - 1];
    }
}''')

prob(num=698, slug="partition-to-k-equal-sum-subsets", title="Partition to K Equal Sum Subsets", diff="Medium",
  method="canPartitionKSubsets",
  ask="Decide whether up to 16 numbers can be split into k groups with equal sums.",
  cue="Sixteen items is the Bitmask DP section's signal: a subset is an integer from 0 to 2¹⁶ - 1. Fill the groups one at a time, so the state only needs the set of numbers used; the current group's fill level follows from their sum.",
  brute="Try every assignment of numbers to groups: kⁿ, about 4.3 billion at k = 4, n = 16.",
  approach="If the total is not divisible by k, answer false; let target = total / k. fill[mask] is the sum of the current, partly filled group after using the numbers in mask, or -1 if mask cannot be reached. From each reachable mask, add any unused number that fits: fill[mask | bit] = (fill[mask] + x) % target. The answer is whether the full mask is reachable.",
  cx="O(n × 2ⁿ) time, about a million steps at n = 16, and O(2ⁿ) space.",
  trap="Tracking the group each number went to. The groups are interchangeable, so that multiplies the work by k! for nothing. Filling one group at a time removes the symmetry.",
  py='''class Solution:
    def canPartitionKSubsets(self, nums: list[int], k: int) -> bool:
        total = sum(nums)
        if total % k:
            return False
        target, n = total // k, len(nums)
        fill = [-1] * (1 << n)         # fill[mask]: level of the current group, -1 if unreachable
        fill[0] = 0
        for mask in range(1 << n):
            if fill[mask] < 0:
                continue
            for i, x in enumerate(nums):
                if not mask >> i & 1 and fill[mask] + x <= target:
                    fill[mask | 1 << i] = (fill[mask] + x) % target   # a full group resets to 0
        return fill[-1] == 0''',
  java='''import java.util.Arrays;

class Solution {
    public boolean canPartitionKSubsets(int[] nums, int k) {
        int total = 0, n = nums.length;
        for (int x : nums) total += x;
        if (total % k != 0) return false;
        int target = total / k;
        int[] fill = new int[1 << n];  // level of the current group, -1 if unreachable
        Arrays.fill(fill, -1);
        fill[0] = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            if (fill[mask] < 0) continue;
            for (int i = 0; i < n; i++)
                if ((mask >> i & 1) == 0 && fill[mask] + nums[i] <= target)
                    fill[mask | 1 << i] = (fill[mask] + nums[i]) % target;   // a full group resets
        }
        return fill[(1 << n) - 1] == 0;
    }
}''')

prob(num=526, slug="beautiful-arrangement", title="Beautiful Arrangement", diff="Medium",
  method="countArrangement",
  ask="Count the orderings of 1 to n (n ≤ 15) where, at every position i (from 1), the number there divides i or i divides it.",
  cue="Fill the positions in order. The position being filled is always one more than the count of numbers used, so the set of numbers used is the whole state: a bitmask.",
  brute="Try all n! orderings: 1.3 × 10¹² at n = 15.",
  approach="ways[mask] counts the ways to fill positions 1 to popcount(mask) using exactly the numbers in mask. For each mask, the next position is popcount(mask) + 1; add ways[mask] to ways[mask | bit(x)] for every unused x that is compatible with that position.",
  cx="O(n × 2ⁿ) time, about 500,000 steps at n = 15, and O(2ⁿ) space.",
  trap="Treating (position, mask) as the state. The position is already determined by the mask's popcount, so the extra dimension adds nothing but size.",
  py='''class Solution:
    def countArrangement(self, n: int) -> int:
        ways = [0] * (1 << n)
        ways[0] = 1
        for mask in range(1 << n):
            if not ways[mask]:
                continue
            pos = bin(mask).count("1") + 1         # the position is implied by the mask
            for x in range(1, n + 1):
                if not mask >> (x - 1) & 1 and (x % pos == 0 or pos % x == 0):
                    ways[mask | 1 << (x - 1)] += ways[mask]
        return ways[-1]''',
  java='''class Solution {
    public int countArrangement(int n) {
        int[] ways = new int[1 << n];
        ways[0] = 1;
        for (int mask = 0; mask < (1 << n); mask++) {
            if (ways[mask] == 0) continue;
            int pos = Integer.bitCount(mask) + 1;  // the position is implied by the mask
            for (int x = 1; x <= n; x++)
                if ((mask >> (x - 1) & 1) == 0 && (x % pos == 0 || pos % x == 0))
                    ways[mask | 1 << (x - 1)] += ways[mask];
        }
        return ways[(1 << n) - 1];
    }
}''')

prob(num=357, slug="count-numbers-with-unique-digits", title="Count Numbers with Unique Digits", diff="Medium",
  method="countNumbersWithUniqueDigits",
  ask="Count the integers x with 0 ≤ x &lt; 10ⁿ whose digits are all different.",
  cue="The Counting and Digit DP section: count by length instead of by value. A d-digit number with distinct digits has 9 choices for its first digit (not 0), then 9, 8, 7, … for the rest.",
  brute="Check every number below 10ⁿ: 10⁸ checks at n = 8.",
  approach="Start with 1 (for the number 0). For each length d from 1 to n, the count of d-digit numbers with distinct digits is 9 × 9 × 8 × … with d factors in total; add it.",
  cx="O(n) time, O(1) space.",
  trap="Treating 0 as a first digit. A leading zero makes a shorter number, which is already counted at its own length; the first digit has 9 choices, not 10.",
  py='''class Solution:
    def countNumbersWithUniqueDigits(self, n: int) -> int:
        total, count = 1, 9            # 1 for the number 0; 9 first digits (no leading zero)
        for d in range(1, n + 1):
            total += count             # d-digit numbers with distinct digits
            count *= 10 - d            # the next digit has one fewer choice
        return total''',
  java='''class Solution {
    public int countNumbersWithUniqueDigits(int n) {
        int total = 1, count = 9;      // 1 for 0; 9 first digits (no leading zero)
        for (int d = 1; d <= n; d++) {
            total += count;            // d-digit numbers with distinct digits
            count *= 10 - d;           // the next digit has one fewer choice
        }
        return total;
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=312, slug="burst-balloons", title="Burst Balloons", diff="Hard",
  method="maxCoins",
  ask="Bursting balloon i earns the product of its value and its two current neighbours' values (missing neighbours count as 1). Burst them all for the most coins.",
  cue="Choosing the first balloon to burst changes everyone's neighbours, so the pieces are not independent. Choose the last balloon to burst in a range instead: while it survives, it walls off the two sides, which is what makes this an interval DP.",
  brute="Try all n! bursting orders.",
  approach="Pad the values with a 1 at each end. B[i][j] is the best for the balloons strictly between i and j. If k is the last one burst there, its neighbours at that moment are i and j, so B[i][j] = max over k of B[i][k] + B[k][j] + v[i] × v[k] × v[j]. Fill by increasing gap.",
  cx="O(n³) time, 2.7 × 10⁷ steps at n = 300, and O(n²) space.",
  trap="Recursing on the first balloon to burst. After it bursts, its two neighbours become adjacent and the left and right parts interact, so the subproblems overlap in a way no table can capture. Thinking about the last one is the key idea.",
  py='''class Solution:
    def maxCoins(self, nums: list[int]) -> int:
        v = [1] + nums + [1]           # padding: missing neighbours count as 1
        n = len(v)
        B = [[0] * n for _ in range(n)]
        for gap in range(2, n):
            for i in range(n - gap):
                j = i + gap
                B[i][j] = max(B[i][k] + B[k][j] + v[i] * v[k] * v[j]
                              for k in range(i + 1, j))   # k is burst last between i and j
        return B[0][n - 1]''',
  java='''class Solution {
    public int maxCoins(int[] nums) {
        int n = nums.length + 2;
        int[] v = new int[n];
        v[0] = v[n - 1] = 1;           // padding: missing neighbours count as 1
        for (int i = 0; i < nums.length; i++) v[i + 1] = nums[i];
        int[][] B = new int[n][n];
        for (int gap = 2; gap < n; gap++)
            for (int i = 0; i + gap < n; i++) {
                int j = i + gap;
                for (int k = i + 1; k < j; k++)    // k is burst last between i and j
                    B[i][j] = Math.max(B[i][j], B[i][k] + B[k][j] + v[i] * v[k] * v[j]);
            }
        return B[0][n - 1];
    }
}''')

prob(num=1547, slug="minimum-cost-to-cut-a-stick", title="Minimum Cost to Cut a Stick", diff="Hard",
  method="minCost",
  ask="A stick of length n must be cut at given positions; each cut costs the current length of the piece being cut. Choose the order of cuts to minimize the total cost.",
  cue="The first cut in a piece splits it into two independent pieces, and its cost is the piece's length. With the cut positions sorted and the stick's ends added, a piece is a range of consecutive cut positions: interval DP over the cuts, not over the stick's length (which reaches 10⁶).",
  brute="Try all orders of the cuts: up to 100!.",
  approach="Let pos = [0] + sorted(cuts) + [n]. C[i][j] is the cheapest way to make every cut strictly between pos[i] and pos[j]. C[i][j] = pos[j] - pos[i] + min over i &lt; k &lt; j of C[i][k] + C[k][j], and 0 when no cut lies between. Fill by increasing gap.",
  cx="O(c³) time for c cuts, about 10⁶ at c = 100, and O(c²) space, independent of the stick's length.",
  trap="Indexing the table by stick positions. With n up to 10⁶, an n × n table does not fit anywhere; only the cut positions matter.",
  py='''class Solution:
    def minCost(self, n: int, cuts: list[int]) -> int:
        pos = [0] + sorted(cuts) + [n] # a piece is a range of consecutive positions
        m = len(pos)
        C = [[0] * m for _ in range(m)]
        for gap in range(2, m):
            for i in range(m - gap):
                j = i + gap
                C[i][j] = pos[j] - pos[i] + min(C[i][k] + C[k][j] for k in range(i + 1, j))
        return C[0][m - 1]''',
  java='''import java.util.Arrays;

class Solution {
    public int minCost(int n, int[] cuts) {
        int m = cuts.length + 2;
        int[] pos = new int[m];        // a piece is a range of consecutive positions
        int[] sorted = cuts.clone();
        Arrays.sort(sorted);
        for (int i = 0; i < cuts.length; i++) pos[i + 1] = sorted[i];
        pos[m - 1] = n;
        int[][] C = new int[m][m];
        for (int gap = 2; gap < m; gap++)
            for (int i = 0; i + gap < m; i++) {
                int j = i + gap, best = Integer.MAX_VALUE;
                for (int k = i + 1; k < j; k++) best = Math.min(best, C[i][k] + C[k][j]);
                C[i][j] = pos[j] - pos[i] + best;
            }
        return C[0][m - 1];
    }
}''')

prob(num=1723, slug="find-minimum-time-to-finish-all-jobs", title="Find Minimum Time to Finish All Jobs", diff="Hard",
  method="minimumTimeRequired",
  ask="Assign up to 12 jobs to k workers so that the busiest worker's total time is as small as possible.",
  cue="The Assignment by Bitmask section: give each worker a subset of the jobs. After j workers, the state is the set of jobs done, and the next worker takes some subset of what remains.",
  brute="Try every assignment of jobs to workers: kⁿ, about 8.9 × 10¹² at k = n = 12.",
  approach="Precompute load[mask], the total time of the jobs in mask. best[mask] is the smallest possible maximum load after the first j workers finish exactly the jobs in mask. For each new worker, new[mask] = min over submasks sub of mask of max(best[mask ^ sub], load[sub]). Enumerate submasks with sub = (sub - 1) &amp; mask.",
  cx="O(k × 3ⁿ) time, since the pairs (mask, submask) number 3ⁿ: about 6.4 million steps at k = n = 12. O(2ⁿ) space.",
  trap="Looping over all 2ⁿ masks for every mask to find its submasks: 4ⁿ instead of 3ⁿ, 16.7 million instead of 531,441 pairs per worker. The (sub - 1) &amp; mask step visits only real submasks.",
  py='''class Solution:
    def minimumTimeRequired(self, jobs: list[int], k: int) -> int:
        n = len(jobs)
        load = [0] * (1 << n)          # load[mask]: total time of the jobs in mask
        for mask in range(1, 1 << n):
            low = mask & -mask
            load[mask] = load[mask ^ low] + jobs[low.bit_length() - 1]
        best = load[:]                 # one worker does everything in mask
        for _ in range(k - 1):
            new = best[:]
            for mask in range(1 << n):
                sub = mask
                while sub:             # every submask: this worker's share
                    new[mask] = min(new[mask], max(best[mask ^ sub], load[sub]))
                    sub = (sub - 1) & mask
            best = new
        return best[-1]''',
  java='''class Solution {
    public int minimumTimeRequired(int[] jobs, int k) {
        int n = jobs.length, full = (1 << n) - 1;
        int[] load = new int[1 << n];  // load[mask]: total time of the jobs in mask
        for (int mask = 1; mask <= full; mask++) {
            int low = mask & -mask;
            load[mask] = load[mask ^ low] + jobs[Integer.numberOfTrailingZeros(low)];
        }
        int[] best = load.clone();     // one worker does everything in mask
        for (int w = 1; w < k; w++) {
            int[] next = best.clone();
            for (int mask = 0; mask <= full; mask++)
                for (int sub = mask; sub > 0; sub = (sub - 1) & mask)   // this worker's share
                    next[mask] = Math.min(next[mask], Math.max(best[mask ^ sub], load[sub]));
            best = next;
        }
        return best[full];
    }
}''')

prob(num=233, slug="number-of-digit-one", title="Number of Digit One", diff="Hard",
  method="countDigitOne",
  ask="Count how many times the digit 1 appears when you write out every integer from 0 to n (n up to 10⁹).",
  cue="Counting and Digit DP: count digit by digit instead of number by number. For each decimal position, work out how many of the numbers 0 to n have a 1 there, from the digits of n above, at, and below that position.",
  brute="Write out every number and count: 10⁹ numbers at the limit.",
  approach="For each place value p = 1, 10, 100, …: split n into high = n // (10p), the digit d = (n // p) % 10, and low = n % p. Full cycles above contribute high × p ones. Then if d &gt; 1 the current partial cycle adds p more; if d == 1 it adds low + 1; if d == 0 it adds nothing.",
  cx="O(log₁₀ n) time, 10 positions for n up to 10⁹, and O(1) space.",
  trap="The d == 1 case. When the digit at this position is exactly 1, only the numbers from high × 10p + p to n have a 1 there, which is low + 1 of them, not p.",
  py='''class Solution:
    def countDigitOne(self, n: int) -> int:
        count, p = 0, 1
        while p <= n:
            high, d, low = n // (10 * p), (n // p) % 10, n % p
            count += high * p          # full cycles above this position
            if d > 1:
                count += p             # the partial cycle has all p ones
            elif d == 1:
                count += low + 1       # only up to n itself
            p *= 10
        return count''',
  java='''class Solution {
    public int countDigitOne(int n) {
        long count = 0;
        for (long p = 1; p <= n; p *= 10) {   // long: 10 * p passes 2^31 near n = 10^9
            long high = n / (10 * p), d = (n / p) % 10, low = n % p;
            count += high * p;         // full cycles above this position
            if (d > 1) count += p;     // the partial cycle has all p ones
            else if (d == 1) count += low + 1;   // only up to n itself
        }
        return (int) count;
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(22)
def arr(lo, hi, nmin=1, nmax=8): return [R.randint(lo, hi) for _ in range(R.randint(nmin, nmax))]
def grid(vals, rmax=5, cmax=5):
    r, c = R.randint(1, rmax), R.randint(1, cmax)
    return [[R.choice(vals) for _ in range(c)] for _ in range(r)]

def paths(g, blocked=lambda v: False):
    R_, C = len(g), len(g[0])
    @lru_cache(maxsize=None)
    def go(r, c):
        if r >= R_ or c >= C or blocked(g[r][c]): return 0
        if (r, c) == (R_ - 1, C - 1): return 1
        return go(r + 1, c) + go(r, c + 1)
    return go(0, 0)

def brute64(g):
    R_, C = len(g), len(g[0])
    @lru_cache(maxsize=None)
    def go(r, c):
        if (r, c) == (R_ - 1, C - 1): return g[r][c]
        opts = [go(r + 1, c)] if r + 1 < R_ else []
        if c + 1 < C: opts.append(go(r, c + 1))
        return g[r][c] + min(opts)
    return go(0, 0)

def brute221(m):
    best = 0
    for r in range(len(m)):
        for c in range(len(m[0])):
            s = 1
            while r + s <= len(m) and c + s <= len(m[0]) and all(m[i][j] == "1" for i in range(r, r + s) for j in range(c, c + s)):
                best = max(best, s); s += 1
    return best * best

def brute1039(v):
    @lru_cache(maxsize=None)
    def go(i, j):
        return 0 if j - i < 2 else min(go(i, k) + go(k, j) + v[i] * v[k] * v[j] for k in range(i + 1, j))
    return go(0, len(v) - 1)

def brute698(nums, k):
    if sum(nums) % k: return False
    t = sum(nums) // k
    for assign in product(range(k), repeat=len(nums)):
        if all(sum(x for x, g in zip(nums, assign) if g == j) == t for j in range(k)): return True
    return False

def brute312(nums):
    best = 0
    for order in permutations(range(len(nums))):
        alive, coins = list(range(len(nums))), 0
        for b in order:
            i = alive.index(b)
            left = nums[alive[i - 1]] if i > 0 else 1
            right = nums[alive[i + 1]] if i + 1 < len(alive) else 1
            coins += left * nums[b] * right; alive.pop(i)
        best = max(best, coins)
    return best

def brute1547(n, cuts):
    best = None
    for order in permutations(cuts):
        pieces, cost = [(0, n)], 0
        for c in order:
            for idx, (a, b) in enumerate(pieces):
                if a < c < b: cost += b - a; pieces[idx:idx + 1] = [(a, c), (c, b)]; break
        best = cost if best is None else min(best, cost)
    return best

def gen1547():
    n = R.randint(2, 12); return [n, R.sample(range(1, n), R.randint(1, min(n - 1, 5)))]

def gen1723():
    jobs = arr(1, 9, 1, 6); return [jobs, R.randint(1, len(jobs))]
def brute1723(jobs, k):
    return min(max(sum(j for j, w in zip(jobs, a) if w == x) for x in range(k)) for a in product(range(k), repeat=len(jobs)))

def brute233(n):
    if n <= 3000: return sum(str(x).count("1") for x in range(n + 1))
    digits = str(n)                   # a different method: digit DP over the decimal string
    @lru_cache(maxsize=None)
    def go(i, tight, ones):
        if i == len(digits): return ones
        top = int(digits[i]) if tight else 9
        return sum(go(i + 1, tight and d == top, ones + (d == 1)) for d in range(top + 1))
    return go(0, True, 0)

BRUTE = {
  62:   (lambda: [R.randint(1, 8), R.randint(1, 8)], lambda m, n: paths([[0] * n for _ in range(m)])),
  63:   (lambda: [grid([0, 0, 0, 1])], lambda g: paths(g, lambda v: v == 1)),
  64:   (lambda: [grid(range(10))], brute64),
  221:  (lambda: [grid(["0", "1", "1"])], brute221),
  1039: (lambda: [arr(1, 9, 3, 8)], brute1039),
  698:  (lambda: (lambda a: [a, R.randint(1, len(a))])(arr(1, 6, 1, 7)), brute698),
  526:  (lambda: [R.randint(1, 8)], lambda n: sum(1 for p in permutations(range(1, n + 1)) if all(x % i == 0 or i % x == 0 for i, x in enumerate(p, 1)))),
  357:  (lambda: [R.randint(0, 5)], lambda n: sum(1 for x in range(10 ** n) if len(set(str(x))) == len(str(x)))),
  312:  (lambda: [arr(0, 9, 1, 6)], brute312),
  1547: (gen1547, brute1547),
  1723: (gen1723, brute1723),
  233:  (lambda: [R.choice([R.randint(0, 3000), R.randint(0, 10**9)])], brute233),
}
