# Chapter 12 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
import random
from itertools import combinations

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

# ---------------------------------------------------------------- Easy
prob(num=169, slug="majority-element", title="Majority Element", diff="Easy",
  method="majorityElement",
  ask="Find the value that appears more than half the time in an array. Such a value is guaranteed to exist.",
  cue="The Majority Vote section: pair off different values and cancel them; the majority cannot be cancelled out, because it has more copies than everything else combined.",
  brute="Count every value with a hash map: O(n) time, O(n) space. Sorting and taking the middle element is O(n log n).",
  approach="Keep a candidate and a count. For each value: if the count is 0, adopt the value as the new candidate. Then add 1 if the value equals the candidate, otherwise subtract 1. The candidate left at the end is the majority.",
  cx="O(n) time, O(1) space.",
  trap="Skipping the verification pass in general. Here the problem guarantees a majority exists, so the candidate is the answer. The chapter's clause that ruins it: without that guarantee, the vote always outputs some candidate, and a second counting pass is the only way to know whether it really is a majority. Majority Element II below needs that pass.",
  py='''class Solution:
    def majorityElement(self, nums: list[int]) -> int:
        candidate, count = None, 0
        for x in nums:
            if count == 0:
                candidate = x
            count += 1 if x == candidate else -1
        return candidate               # a majority is guaranteed here''',
  java='''class Solution {
    public int majorityElement(int[] nums) {
        int candidate = 0, count = 0;
        for (int x : nums) {
            if (count == 0) candidate = x;
            count += x == candidate ? 1 : -1;
        }
        return candidate;              // a majority is guaranteed here
    }
}''')

prob(num=228, slug="summary-ranges", title="Summary Ranges", diff="Easy",
  method="summaryRanges",
  ask="Given a sorted list of distinct integers, describe it as the shortest list of ranges, written \"a->b\" for a run and \"a\" for a single value.",
  cue="Walk the sorted values and close a range whenever the next value is not one more than the current one. The same \"extend or close\" step as merging intervals.",
  brute="There is no slower sensible approach; the brute force is the same scan. The work is getting the output format and the last range right.",
  approach="Remember where the current run started. For each position i, if i is the last index or nums[i + 1] is not nums[i] + 1, the run ends at nums[i]: emit \"start\" or \"start->nums[i]\", then start the next run at i + 1.",
  cx="O(n) time, O(1) extra space besides the output.",
  trap="Forgetting the final run. Closing a run inside the loop only when the next value breaks it leaves the last run unwritten; checking \"is this the last index?\" in the same condition closes it.",
  py='''class Solution:
    def summaryRanges(self, nums: list[int]) -> list[str]:
        out = []
        start = 0
        for i in range(len(nums)):
            if i == len(nums) - 1 or nums[i + 1] != nums[i] + 1:   # the run ends here
                if start == i:
                    out.append(str(nums[i]))
                else:
                    out.append(f"{nums[start]}->{nums[i]}")
                start = i + 1
        return out''',
  java='''import java.util.*;

class Solution {
    public List<String> summaryRanges(int[] nums) {
        List<String> out = new ArrayList<>();
        int start = 0;
        for (int i = 0; i < nums.length; i++) {
            if (i == nums.length - 1 || nums[i + 1] != nums[i] + 1) {   // the run ends here
                out.add(start == i ? String.valueOf(nums[i]) : nums[start] + "->" + nums[i]);
                start = i + 1;
            }
        }
        return out;
    }
}''')

prob(num=1854, slug="maximum-population-year", title="Maximum Population Year", diff="Easy",
  method="maximumPopulation",
  ask="Each person has a birth year and a death year (between 1950 and 2050). A person counts as alive from their birth year up to, but not including, their death year. Find the earliest year with the most people alive.",
  cue="Each person adds one to a range of years: the Counting Overlaps section, which the chapter points out is Chapter 9's difference array.",
  brute="For every year, count the people alive: 101 years × n people.",
  approach="Keep a change array over the years. Each person adds +1 at their birth year and -1 at their death year. Sweep the years in order with a running total; the first year where it reaches a new maximum is the answer.",
  cx="O(n + Y) time and O(Y) space, where Y = 101 years.",
  trap="The boundary convention. A person is not alive in their death year, so the -1 goes at the death year itself, which makes each lifetime a half-open range [birth, death). The chapter's advice is to decide the convention once, before writing the loop.",
  py='''class Solution:
    def maximumPopulation(self, logs: list[list[int]]) -> int:
        change = [0] * 101             # years 1950..2050
        for birth, death in logs:
            change[birth - 1950] += 1
            change[death - 1950] -= 1  # not alive in the death year: [birth, death)
        best_year, best, alive = 1950, 0, 0
        for i, c in enumerate(change):
            alive += c
            if alive > best:           # strictly greater keeps the earliest year
                best, best_year = alive, 1950 + i
        return best_year''',
  java='''class Solution {
    public int maximumPopulation(int[][] logs) {
        int[] change = new int[101];   // years 1950..2050
        for (int[] l : logs) {
            change[l[0] - 1950]++;
            change[l[1] - 1950]--;     // not alive in the death year: [birth, death)
        }
        int bestYear = 1950, best = 0, alive = 0;
        for (int i = 0; i < 101; i++) {
            alive += change[i];
            if (alive > best) {        // strictly greater keeps the earliest year
                best = alive;
                bestYear = 1950 + i;
            }
        }
        return bestYear;
    }
}''')

# ---------------------------------------------------------------- Medium
prob(num=56, slug="merge-intervals", title="Merge Intervals", diff="Medium",
  method="merge",
  ask="Merge all overlapping intervals and return the result sorted by start. Intervals that touch, like [1, 4] and [4, 5], count as overlapping.",
  cue="The Merging and Inserting section. Once the intervals are sorted by start, an interval can only overlap the one merged immediately before it.",
  brute="Repeatedly scan all pairs, merging any two that overlap, until nothing changes: O(n²) per round.",
  approach="Sort by start. Walk the intervals, keeping the last merged interval. If the next one starts at or before its end, extend the end to the larger of the two ends. Otherwise the last merged interval is final, and the new one becomes the last.",
  cx="O(n log n) time for the sort, O(n) for the output.",
  trap="Setting the end to the new interval's end instead of the larger of the two. [1, 10] followed by [2, 3] must stay [1, 10].",
  py='''class Solution:
    def merge(self, intervals: list[list[int]]) -> list[list[int]]:
        intervals.sort(key=lambda iv: iv[0])
        out = [intervals[0][:]]
        for start, end in intervals[1:]:
            if start <= out[-1][1]:    # overlaps (or touches) the last one
                out[-1][1] = max(out[-1][1], end)
            else:
                out.append([start, end])
        return out''',
  java='''import java.util.*;

class Solution {
    public int[][] merge(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> out = new ArrayList<>();
        out.add(intervals[0].clone());
        for (int i = 1; i < intervals.length; i++) {
            int[] last = out.get(out.size() - 1);
            if (intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]);   // overlaps
            else out.add(intervals[i].clone());
        }
        return out.toArray(new int[0][]);
    }
}''', check_args=False)

prob(num=57, slug="insert-interval", title="Insert Interval", diff="Medium",
  method="insert",
  ask="Insert a new interval into a sorted list of non-overlapping intervals, merging where needed, and return the sorted result.",
  cue="The list is already sorted and non-overlapping, so it splits into three runs: intervals entirely before the new one, intervals that overlap it, and intervals entirely after it. The Merging and Inserting section calls this another instance of the same loop.",
  brute="Append the new interval and run Merge Intervals: O(n log n), throwing away the fact that the input is already sorted.",
  approach="Copy every interval that ends before the new one starts. Then, while intervals start at or before the new interval's end, absorb them into it by widening its start and end. Add the widened new interval. Copy the rest.",
  cx="O(n) time, O(n) for the output.",
  trap="Off-by-one on touching intervals. [1, 2] and [2, 3] overlap here, so \"entirely before\" means end &lt; new start, strictly.",
  py='''class Solution:
    def insert(self, intervals: list[list[int]], newInterval: list[int]) -> list[list[int]]:
        out = []
        start, end = newInterval
        i, n = 0, len(intervals)
        while i < n and intervals[i][1] < start:     # entirely before
            out.append(intervals[i])
            i += 1
        while i < n and intervals[i][0] <= end:      # overlaps: absorb it
            start = min(start, intervals[i][0])
            end = max(end, intervals[i][1])
            i += 1
        out.append([start, end])
        out.extend(intervals[i:])                    # entirely after
        return out''',
  java='''import java.util.*;

class Solution {
    public int[][] insert(int[][] intervals, int[] newInterval) {
        List<int[]> out = new ArrayList<>();
        int start = newInterval[0], end = newInterval[1], i = 0, n = intervals.length;
        while (i < n && intervals[i][1] < start) out.add(intervals[i++]);   // entirely before
        while (i < n && intervals[i][0] <= end) {                           // overlaps: absorb it
            start = Math.min(start, intervals[i][0]);
            end = Math.max(end, intervals[i][1]);
            i++;
        }
        out.add(new int[]{start, end});
        while (i < n) out.add(intervals[i++]);                              // entirely after
        return out.toArray(new int[0][]);
    }
}''')

prob(num=435, slug="non-overlapping-intervals", title="Non-overlapping Intervals", diff="Medium",
  method="eraseOverlapIntervals",
  ask="Find the fewest intervals to remove so the rest do not overlap. Touching intervals, like [1, 2] and [2, 3], do not overlap here.",
  cue="Keeping as many intervals as possible is the classic activity-selection problem: sort by end and keep whatever finishes first. Chapter 23 proves this greedy rule correct with the exchange argument; here you use it.",
  brute="Try every subset and keep the largest non-overlapping one: O(2ⁿ).",
  approach="Sort by end. Walk the intervals, remembering the end of the last one kept. An interval that starts at or after that end is kept (and its end becomes the new one). Any other interval overlaps and is removed. The answer is the number removed.",
  cx="O(n log n) time for the sort, O(1) extra space.",
  trap="Sorting by start. An interval that starts early can be very long and block many others; the one that ends earliest leaves the most room. The chapter's boundary convention matters too: here touching is allowed, so the test is start ≥ last end.",
  py='''class Solution:
    def eraseOverlapIntervals(self, intervals: list[list[int]]) -> int:
        intervals.sort(key=lambda iv: iv[1])   # earliest end first
        removed = 0
        last_end = float("-inf")
        for start, end in intervals:
            if start >= last_end:      # touching is fine here
                last_end = end
            else:
                removed += 1
        return removed''',
  java='''import java.util.Arrays;

class Solution {
    public int eraseOverlapIntervals(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));   // earliest end first
        int removed = 0;
        long lastEnd = Long.MIN_VALUE;
        for (int[] iv : intervals) {
            if (iv[0] >= lastEnd) lastEnd = iv[1];   // touching is fine here
            else removed++;
        }
        return removed;
    }
}''', check_args=False)

prob(num=452, slug="minimum-number-of-arrows-to-burst-balloons", title="Minimum Number of Arrows to Burst Balloons", diff="Medium",
  method="findMinArrowShots",
  ask="Balloons span horizontal ranges [start, end]. A vertical arrow shot at x bursts every balloon with start ≤ x ≤ end. Find the fewest arrows that burst them all.",
  cue="The same greedy as Non-overlapping Intervals, mirrored: sort by end, and shoot each arrow as far right as it can go, at the end of the first unburst balloon.",
  brute="Try every set of arrow positions at balloon ends, smallest sets first: exponential.",
  approach="Sort by end. Shoot the first arrow at the first balloon's end. Walk on: every balloon that starts at or before that arrow's position is already burst. The first balloon that starts after it needs a new arrow, shot at its end.",
  cx="O(n log n) time, O(1) extra space.",
  trap="Two. Here touching counts (start ≤ x ≤ end), the opposite convention from Non-overlapping Intervals, so the test is start &gt; arrow. And in Java, sorting with a[1] - b[1] overflows, because coordinates go down to -2³¹; use Integer.compare.",
  py='''class Solution:
    def findMinArrowShots(self, points: list[list[int]]) -> int:
        points.sort(key=lambda p: p[1])
        arrows, arrow = 0, None
        for start, end in points:
            if arrow is None or start > arrow:   # not burst yet: shoot at its end
                arrows += 1
                arrow = end
        return arrows''',
  java='''import java.util.Arrays;

class Solution {
    public int findMinArrowShots(int[][] points) {
        Arrays.sort(points, (a, b) -> Integer.compare(a[1], b[1]));   // a[1] - b[1] can overflow
        int arrows = 1;
        int arrow = points[0][1];
        for (int[] p : points) {
            if (p[0] > arrow) {        // not burst yet: shoot at its end
                arrows++;
                arrow = p[1];
            }
        }
        return arrows;
    }
}''', check_args=False)

prob(num=2406, slug="divide-intervals-into-minimum-number-of-groups", title="Divide Intervals Into Minimum Number of Groups", diff="Medium",
  method="minGroups",
  ask="Split closed intervals [left, right] into the fewest groups so that no two intervals in the same group share a point. (This is the free version of the premium \"Meeting Rooms II\".)",
  cue="The fewest groups equals the largest number of intervals covering any single point: the Counting Overlaps section's sweep.",
  brute="Place intervals one at a time into the first group they fit, trying every order: exponential, and greedy in the wrong order gives wrong answers.",
  approach="Turn each interval into two events: +1 at left and -1 at right + 1 (the first point it no longer covers). Sort the events, processing a -1 before a +1 at the same point, and sweep with a running count. The largest count is the answer.",
  cx="O(n log n) time for the sort, O(n) space.",
  trap="The closed boundary. [1, 5] and [5, 8] share the point 5 and cannot be in the same group, so the -1 goes at right + 1, not at right.",
  py='''class Solution:
    def minGroups(self, intervals: list[list[int]]) -> int:
        events = []
        for left, right in intervals:
            events.append((left, 1))
            events.append((right + 1, -1))   # closed interval: stops covering at right + 1
        events.sort()                  # at equal points, -1 sorts before +1
        best = cur = 0
        for _, delta in events:
            cur += delta
            best = max(best, cur)
        return best''',
  java='''import java.util.Arrays;

class Solution {
    public int minGroups(int[][] intervals) {
        int n = intervals.length;
        int[][] events = new int[2 * n][];
        for (int i = 0; i < n; i++) {
            events[2 * i] = new int[]{intervals[i][0], 1};
            events[2 * i + 1] = new int[]{intervals[i][1] + 1, -1};   // stops covering at right + 1
        }
        Arrays.sort(events, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0])
                                                   : Integer.compare(a[1], b[1]));   // -1 first
        int best = 0, cur = 0;
        for (int[] e : events) {
            cur += e[1];
            best = Math.max(best, cur);
        }
        return best;
    }
}''')

prob(num=229, slug="majority-element-ii", title="Majority Element II", diff="Medium",
  method="majorityElement", observe=lambda r, a: sorted(r),
  ask="Find every value that appears more than n / 3 times, using O(1) extra space.",
  cue="At most two values can each take more than a third. Boyer-Moore generalizes: keep two candidates and cancel triples of different values. And with no guarantee that any such value exists, the chapter's second pass is mandatory.",
  brute="Count everything with a hash map: O(n) time but O(n) space.",
  approach="Pass one: keep two candidates with counts. A value matching a candidate increments its count; otherwise, if a count is 0, the value takes that slot; otherwise both counts drop by one (three different values cancel). Pass two: count how often each candidate really appears, and keep those above n / 3.",
  cx="O(n) time, O(1) space.",
  trap="Skipping pass two. The first pass always ends with two candidates, even for an array like [1, 2, 3] where nothing qualifies; only the recount tells you which, if any, are real. Also make sure the two candidates are different values before reporting both.",
  py='''class Solution:
    def majorityElement(self, nums: list[int]) -> list[int]:
        c1, c2, n1, n2 = None, None, 0, 0
        for x in nums:                 # pass one: find up to two candidates
            if x == c1:
                n1 += 1
            elif x == c2:
                n2 += 1
            elif n1 == 0:
                c1, n1 = x, 1
            elif n2 == 0:
                c2, n2 = x, 1
            else:
                n1 -= 1                # three different values cancel
                n2 -= 1
        return [c for c in (c1, c2)    # pass two is not optional
                if c is not None and nums.count(c) > len(nums) // 3]''',
  java='''import java.util.*;

class Solution {
    public List<Integer> majorityElement(int[] nums) {
        Integer c1 = null, c2 = null;
        int n1 = 0, n2 = 0;
        for (int x : nums) {           // pass one: find up to two candidates
            if (c1 != null && x == c1) n1++;
            else if (c2 != null && x == c2) n2++;
            else if (n1 == 0) { c1 = x; n1 = 1; }
            else if (n2 == 0) { c2 = x; n2 = 1; }
            else { n1--; n2--; }       // three different values cancel
        }
        List<Integer> out = new ArrayList<>();
        for (Integer c : new Integer[]{c1, c2}) {   // pass two is not optional
            if (c == null) continue;
            int count = 0;
            for (int x : nums) if (x == c) count++;
            if (count > nums.length / 3) out.add(c);
        }
        return out;
    }
}''')

prob(num=54, slug="spiral-matrix", title="Spiral Matrix", diff="Medium",
  method="spiralOrder",
  ask="Return the elements of a grid in clockwise spiral order, starting at the top-left.",
  cue="No clever pattern: the Simulation section's case. The work is in choosing a representation that makes the edge cases disappear, here four shrinking boundaries.",
  brute="Walk with a direction and a visited grid, turning right whenever the next cell is outside or visited: O(rows × cols) time and O(rows × cols) extra space.",
  approach="Keep four boundaries: top, bottom, left, right. Read the top row left to right and move top down; read the right column top to bottom and move right in; then, if rows remain, read the bottom row right to left and move bottom up; if columns remain, read the left column bottom to top and move left in. Repeat while top ≤ bottom and left ≤ right.",
  cx="O(rows × cols) time, O(1) extra space besides the output.",
  trap="Reading a row or column twice when the grid is not square. After the first two sides, check again that a row (top ≤ bottom) and a column (left ≤ right) remain before reading the other two.",
  py='''class Solution:
    def spiralOrder(self, matrix: list[list[int]]) -> list[int]:
        out = []
        top, bottom, left, right = 0, len(matrix) - 1, 0, len(matrix[0]) - 1
        while top <= bottom and left <= right:
            for c in range(left, right + 1):
                out.append(matrix[top][c])
            top += 1
            for r in range(top, bottom + 1):
                out.append(matrix[r][right])
            right -= 1
            if top <= bottom:          # a row is left for the bottom side
                for c in range(right, left - 1, -1):
                    out.append(matrix[bottom][c])
                bottom -= 1
            if left <= right:          # a column is left for the left side
                for r in range(bottom, top - 1, -1):
                    out.append(matrix[r][left])
                left += 1
        return out''',
  java='''import java.util.*;

class Solution {
    public List<Integer> spiralOrder(int[][] matrix) {
        List<Integer> out = new ArrayList<>();
        int top = 0, bottom = matrix.length - 1, left = 0, right = matrix[0].length - 1;
        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) out.add(matrix[top][c]);
            top++;
            for (int r = top; r <= bottom; r++) out.add(matrix[r][right]);
            right--;
            if (top <= bottom) {       // a row is left for the bottom side
                for (int c = right; c >= left; c--) out.add(matrix[bottom][c]);
                bottom--;
            }
            if (left <= right) {       // a column is left for the left side
                for (int r = bottom; r >= top; r--) out.add(matrix[r][left]);
                left++;
            }
        }
        return out;
    }
}''')

prob(num=48, slug="rotate-image", title="Rotate Image", diff="Medium",
  method="rotate", observe=lambda r, a: a[0],   # in place: check the grid
  ask="Rotate a square grid 90 degrees clockwise, in place.",
  cue="Simulation again, with a representation trick: a clockwise rotation is a transpose (flip across the main diagonal) followed by reversing each row. Both steps are simple in-place swaps.",
  brute="Build a new grid with new[c][n - 1 - r] = old[r][c] and copy it back: O(n²) time, but O(n²) extra space, which the problem forbids.",
  approach="Transpose: swap matrix[r][c] with matrix[c][r] for every c > r. Then reverse each row. Check it on a 2 × 2 grid by hand: [[1, 2], [3, 4]] becomes [[1, 3], [2, 4]], then [[3, 1], [4, 2]].",
  cx="O(n²) time, O(1) extra space.",
  trap="Transposing with both loops over the full range. Swapping (r, c) and later (c, r) swaps every pair back, leaving the grid unchanged. Only visit c > r.",
  py='''class Solution:
    def rotate(self, matrix: list[list[int]]) -> None:
        n = len(matrix)
        for r in range(n):             # transpose: only above the diagonal
            for c in range(r + 1, n):
                matrix[r][c], matrix[c][r] = matrix[c][r], matrix[r][c]
        for row in matrix:             # then reverse each row
            row.reverse()''',
  java='''class Solution {
    public void rotate(int[][] matrix) {
        int n = matrix.length;
        for (int r = 0; r < n; r++)    // transpose: only above the diagonal
            for (int c = r + 1; c < n; c++) {
                int t = matrix[r][c]; matrix[r][c] = matrix[c][r]; matrix[c][r] = t;
            }
        for (int[] row : matrix)       // then reverse each row
            for (int i = 0, j = n - 1; i < j; i++, j--) {
                int t = row[i]; row[i] = row[j]; row[j] = t;
            }
    }
}''')

prob(num=73, slug="set-matrix-zeroes", title="Set Matrix Zeroes", diff="Medium",
  method="setZeroes", observe=lambda r, a: a[0],   # in place: check the grid
  ask="Wherever a grid holds a 0, set that cell's entire row and column to 0, in place.",
  cue="You must record which rows and columns to clear before clearing anything, or new zeros spread. The O(1)-space version stores those marks in the grid's own first row and first column.",
  brute="Copy the grid, and for each zero in the copy clear its row and column in the original: O(rows × cols) extra space. Recording two sets of row and column numbers cuts that to O(rows + cols), and is a fine first answer.",
  approach="First note whether the first row and the first column themselves contain a zero (two flags). Then for every other cell that is 0, mark its row by setting matrix[r][0] = 0 and its column by setting matrix[0][c] = 0. Clear every inner cell whose row mark or column mark is 0. Finally clear the first row and first column if their flags say so.",
  cx="O(rows × cols) time, O(1) extra space.",
  trap="Clearing the first row or column too early. They hold the marks for everything else, so they must be cleared last, from the flags saved at the start.",
  py='''class Solution:
    def setZeroes(self, matrix: list[list[int]]) -> None:
        R, C = len(matrix), len(matrix[0])
        first_row = any(matrix[0][c] == 0 for c in range(C))
        first_col = any(matrix[r][0] == 0 for r in range(R))
        for r in range(1, R):          # mark rows and columns in row 0 / column 0
            for c in range(1, C):
                if matrix[r][c] == 0:
                    matrix[r][0] = matrix[0][c] = 0
        for r in range(1, R):
            for c in range(1, C):
                if matrix[r][0] == 0 or matrix[0][c] == 0:
                    matrix[r][c] = 0
        if first_row:                  # the marks' own row and column go last
            for c in range(C):
                matrix[0][c] = 0
        if first_col:
            for r in range(R):
                matrix[r][0] = 0''',
  java='''class Solution {
    public void setZeroes(int[][] matrix) {
        int R = matrix.length, C = matrix[0].length;
        boolean firstRow = false, firstCol = false;
        for (int c = 0; c < C; c++) if (matrix[0][c] == 0) firstRow = true;
        for (int r = 0; r < R; r++) if (matrix[r][0] == 0) firstCol = true;
        for (int r = 1; r < R; r++)    // mark rows and columns in row 0 / column 0
            for (int c = 1; c < C; c++)
                if (matrix[r][c] == 0) { matrix[r][0] = 0; matrix[0][c] = 0; }
        for (int r = 1; r < R; r++)
            for (int c = 1; c < C; c++)
                if (matrix[r][0] == 0 || matrix[0][c] == 0) matrix[r][c] = 0;
        if (firstRow) for (int c = 0; c < C; c++) matrix[0][c] = 0;   // marks go last
        if (firstCol) for (int r = 0; r < R; r++) matrix[r][0] = 0;
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=1755, slug="closest-subsequence-sum", title="Closest Subsequence Sum", diff="Hard",
  method="minAbsDifference",
  ask="Choose any subset of up to 40 numbers (possibly empty) so that its sum is as close as possible to a goal, and return the smallest possible distance.",
  cue="Forty items is too many for 2⁴⁰ subsets but twenty is fine: 2²⁰ is about a million. That is the Meet in the Middle section: split in half, list every subset sum of each half, then combine the halves with Chapter 8's opposite-ends scan.",
  brute="Try all 2⁴⁰ ≈ 10¹² subsets: hours.",
  approach="Split the numbers into two halves and list all subset sums of each half (about 2²⁰ each). Sort both. Then run two pointers: i from the start of the left sums, j from the end of the right sums. At each step compare left[i] + right[j] with the goal, record the distance, and move i up if the sum is too small or j down if it is too big.",
  cx="O(2^(n/2) × n) time for listing and sorting, O(2^(n/2)) space.",
  trap="Forgetting the empty subset, whose sum is 0. The subset-sum lists must start from [0]; the building loop below does that by starting each list as [0] and doubling it.",
  py='''class Solution:
    def minAbsDifference(self, nums: list[int], goal: int) -> int:
        def subset_sums(arr):
            sums = [0]                 # the empty subset counts
            for x in arr:
                sums += [s + x for s in sums]
            return sorted(sums)

        half = len(nums) // 2
        left, right = subset_sums(nums[:half]), subset_sums(nums[half:])
        best = abs(goal)
        i, j = 0, len(right) - 1       # Chapter 8's opposite-ends scan
        while i < len(left) and j >= 0:
            s = left[i] + right[j]
            best = min(best, abs(s - goal))
            if s < goal:
                i += 1
            elif s > goal:
                j -= 1
            else:
                return 0
        return best''',
  java='''import java.util.Arrays;

class Solution {
    public int minAbsDifference(int[] nums, int goal) {
        int half = nums.length / 2;
        int[] left = subsetSums(Arrays.copyOfRange(nums, 0, half));
        int[] right = subsetSums(Arrays.copyOfRange(nums, half, nums.length));
        int best = Math.abs(goal);
        int i = 0, j = right.length - 1;   // Chapter 8's opposite-ends scan
        while (i < left.length && j >= 0) {
            int s = left[i] + right[j];
            best = Math.min(best, Math.abs(s - goal));
            if (s < goal) i++;
            else if (s > goal) j--;
            else return 0;
        }
        return best;
    }

    private int[] subsetSums(int[] arr) {
        int[] sums = new int[1 << arr.length];   // sums[0] = 0: the empty subset
        for (int k = 0; k < arr.length; k++)
            for (int m = 0; m < (1 << k); m++) sums[m + (1 << k)] = sums[m] + arr[k];
        Arrays.sort(sums);
        return sums;
    }
}''')

prob(num=732, slug="my-calendar-iii", title="My Calendar III", diff="Hard", design=True,
  ask="Events arrive one at a time as half-open ranges [start, end). After each booking, report the largest number of events that overlap at any single moment so far.",
  cue="Maximum overlap is the Counting Overlaps sweep. The twist is that bookings arrive one at a time and times go up to 10⁹, so the difference array becomes a sorted map from time to change.",
  brute="After each booking, test every booked start time against every booking: O(n²) per call.",
  approach="Keep a map from time to change: +1 at start, -1 at end. After each booking, sweep the keys in sorted order with a running count and return its maximum. Only times where something starts or ends matter, so there are at most 2n keys.",
  cx="O(n log n) per booking with the sorts here, O(n² log n) overall, which is fine for the problem's 400 bookings. For many more bookings, Chapter 31's segment tree with lazy propagation answers each booking in O(log range).",
  trap="Using an array indexed by time. Times reach 10⁹, so the array would not fit. Only the endpoints carry information; a map keyed by endpoint keeps the sweep exact.",
  py='''class MyCalendarThree:
    def __init__(self):
        self.change = {}               # time -> change in the number of events

    def book(self, startTime: int, endTime: int) -> int:
        self.change[startTime] = self.change.get(startTime, 0) + 1
        self.change[endTime] = self.change.get(endTime, 0) - 1   # half-open: gone at end
        best = cur = 0
        for t in sorted(self.change):
            cur += self.change[t]
            best = max(best, cur)
        return best''',
  java='''import java.util.TreeMap;

class MyCalendarThree {
    private final TreeMap<Integer, Integer> change = new TreeMap<>();   // kept sorted by time

    public MyCalendarThree() {}

    public int book(int startTime, int endTime) {
        change.merge(startTime, 1, Integer::sum);
        change.merge(endTime, -1, Integer::sum);   // half-open: gone at end
        int best = 0, cur = 0;
        for (int d : change.values()) {
            cur += d;
            best = Math.max(best, cur);
        }
        return best;
    }
}''')

prob(num=2251, slug="number-of-flowers-in-full-bloom", title="Number of Flowers in Full Bloom", diff="Hard",
  method="fullBloomFlowers",
  ask="Each flower blooms over a closed range of days [start, end]. Each person arrives on some day. For each person, report how many flowers are in bloom when they arrive.",
  cue="Answer all the questions together, offline: sort the people by arrival day and sweep through time once, the way the chapter's sweep processes events in order.",
  brute="For each person, check every flower: O(flowers × people), 2.5 × 10¹⁰ at the limits.",
  approach="Sort the start days and, separately, the end days. Visit the people in order of arrival day t, moving two pointers forward: one counts flowers with start ≤ t, the other flowers with end &lt; t (already finished). The flowers in bloom are the difference. Write each answer at the person's original position.",
  cx="O((f + p) log(f + p)) time for the sorts, O(f + p) space.",
  trap="Losing the original order of the people. Sort a list of indices by arrival day, not the arrival days themselves, so each answer can go back to the right person. And a flower is still in bloom on its end day, so only end &lt; t counts as finished.",
  py='''class Solution:
    def fullBloomFlowers(self, flowers: list[list[int]], people: list[int]) -> list[int]:
        starts = sorted(s for s, _ in flowers)
        ends = sorted(e for _, e in flowers)
        out = [0] * len(people)
        i = j = 0
        for p in sorted(range(len(people)), key=lambda k: people[k]):   # by arrival day
            t = people[p]
            while i < len(starts) and starts[i] <= t:
                i += 1                 # flowers that have started
            while j < len(ends) and ends[j] < t:
                j += 1                 # flowers that have finished (end day still blooms)
            out[p] = i - j
        return out''',
  java='''import java.util.Arrays;

class Solution {
    public int[] fullBloomFlowers(int[][] flowers, int[] people) {
        int f = flowers.length, n = people.length;
        int[] starts = new int[f], ends = new int[f];
        for (int k = 0; k < f; k++) { starts[k] = flowers[k][0]; ends[k] = flowers[k][1]; }
        Arrays.sort(starts);
        Arrays.sort(ends);
        Integer[] order = new Integer[n];
        for (int k = 0; k < n; k++) order[k] = k;
        Arrays.sort(order, (a, b) -> Integer.compare(people[a], people[b]));   // by arrival day
        int[] out = new int[n];
        int i = 0, j = 0;
        for (int p : order) {
            int t = people[p];
            while (i < f && starts[i] <= t) i++;   // flowers that have started
            while (j < f && ends[j] < t) j++;      // finished (end day still blooms)
            out[p] = i - j;
        }
        return out;
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(12)
def arr(lo, hi, nmin=1, nmax=9): return [R.randint(lo, hi) for _ in range(R.randint(nmin, nmax))]
def ivs(nmin=1, nmax=7, lo=0, hi=12, minlen=0):
    out = []
    for _ in range(R.randint(nmin, nmax)):
        s = R.randint(lo, hi); out.append([s, R.randint(s + minlen, hi + 3)])
    return out
def grid(lo, hi, rmax=5, cmax=5, square=False):
    r = R.randint(1, rmax); c = r if square else R.randint(1, cmax)
    return [[R.randint(lo, hi) for _ in range(c)] for _ in range(r)]

def gen169():
    n = R.randint(1, 9); m = R.randint(-3, 3); a = [m] * (n // 2 + 1) + [R.randint(-3, 3) for _ in range(n - n // 2 - 1)]
    R.shuffle(a); return [a]

def brute56(iv):
    pts = sorted(iv); changed = True
    while changed:
        changed = False
        for x, y in combinations(range(len(pts)), 2):
            a, b = pts[x], pts[y]
            if a[0] <= b[1] and b[0] <= a[1]:
                pts = [p for k, p in enumerate(pts) if k not in (x, y)] + [[min(a[0], b[0]), max(a[1], b[1])]]
                pts.sort(); changed = True; break
    return pts

def gen57():
    base = brute56(ivs(0, 6)); s = R.randint(0, 15); return [base, [s, R.randint(s, 17)]]

def max_keep(iv, touch_ok):
    best = 0
    for mask in range(1 << len(iv)):
        ch = [iv[i] for i in range(len(iv)) if mask >> i & 1]
        if all((a[1] <= b[0] or b[1] <= a[0]) if touch_ok else (a[1] < b[0] or b[1] < a[0]) for a, b in combinations(ch, 2)):
            best = max(best, len(ch))
    return best

def brute452(pts):
    xs = sorted({p[1] for p in pts})
    for k in range(1, len(pts) + 1):
        for shot in combinations(xs, k):
            if all(any(s <= x <= e for x in shot) for s, e in pts): return k

def brute2406(iv):
    return max(sum(1 for l, r in iv if l <= x <= r) for x in range(min(l for l, _ in iv), max(r for _, r in iv) + 1))

def brute54(g):
    out, g = [], [row[:] for row in g]
    while g:
        out += g.pop(0)
        g = [list(r) for r in zip(*g)][::-1]   # rotate the rest counter-clockwise
    return out

def brute73(g):
    rows = {r for r in range(len(g)) for c in range(len(g[0])) if g[r][c] == 0}
    cols = {c for r in range(len(g)) for c in range(len(g[0])) if g[r][c] == 0}
    return [[0 if r in rows or c in cols else g[r][c] for c in range(len(g[0]))] for r in range(len(g))]

def gen732():
    n = R.randint(1, 8); ops, args = ["MyCalendarThree"] + ["book"] * n, [[]]
    for _ in range(n):
        s = R.randint(0, 20); args.append([s, R.randint(s + 1, 25)])
    return ops, args
def brute732(ops, args):
    booked, res = [], [None]
    for s, e in args[1:]:
        booked.append((s, e)); res.append(max(sum(1 for a, b in booked if a <= t < b) for t in range(0, 26)))
    return res

BRUTE = {
  169:  (gen169, lambda a: max(set(a), key=a.count)),
  228:  (lambda: [sorted(R.sample(range(-5, 12), R.randint(0, 9)))],
         lambda a: [str(a[i]) if i == j else f"{a[i]}->{a[j]}" for i, j in
                    [(s, next(e for e in range(s, len(a)) if e == len(a) - 1 or a[e + 1] != a[e] + 1))
                     for s in range(len(a)) if s == 0 or a[s - 1] != a[s] - 1]]),
  1854: (lambda: [[(lambda b: [b, R.randint(b + 1, 2050)])(R.randint(1950, 2049)) for _ in range(R.randint(1, 6))]],
         lambda logs: max(range(1950, 2051), key=lambda y: (sum(1 for b, d in logs if b <= y < d), -y))),
  56:   (lambda: [ivs()], brute56),
  57:   (gen57, lambda base, new: brute56(base + [new])),
  435:  (lambda: [ivs(minlen=1)], lambda iv: len(iv) - max_keep(iv, True)),
  452:  (lambda: [ivs()], brute452),
  2406: (lambda: [ivs(lo=1)], brute2406),
  229:  (lambda: [arr(0, 3)], lambda a: sorted({x for x in a if a.count(x) > len(a) // 3})),
  54:   (lambda: [grid(0, 9)], brute54),
  48:   (lambda: [grid(0, 9, square=True)], lambda g: [list(r) for r in zip(*g[::-1])]),
  73:   (lambda: [grid(0, 3)], brute73),
  1755: (lambda: [arr(-20, 20, 1, 10), R.randint(-40, 40)],
         lambda a, goal: min(abs(sum(a[i] for i in range(len(a)) if m >> i & 1) - goal) for m in range(1 << len(a)))),
  732:  (gen732, brute732),
  2251: (lambda: [ivs(lo=1), arr(1, 16)], lambda fl, ppl: [sum(1 for s, e in fl if s <= t <= e) for t in ppl]),
}
