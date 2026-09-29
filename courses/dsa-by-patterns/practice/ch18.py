# Chapter 18 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
# Every solution is the chapter's template: choose, recurse, un-choose, with pruning where it pays.
import random
from functools import reduce
from itertools import combinations, permutations, product
from operator import xor

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

SET_OF_LISTS = lambda r, a: sorted(sorted(x) for x in r)
SORTED = lambda r, a: sorted(r)

def sudoku_ok(r, a):
    board = a[0]
    rows = [set(row) for row in board]
    return all(len(s) == 9 and "." not in s for s in rows) and \
        all(len({board[r][c] for r in range(9)}) == 9 for c in range(9)) and \
        all(len({board[r][c] for r in range(br, br + 3) for c in range(bc, bc + 3)}) == 9 for br in (0, 3, 6) for bc in (0, 3, 6))

# ---------------------------------------------------------------- Easy
prob(num=1863, slug="sum-of-all-subset-xor-totals", title="Sum of All Subset XOR Totals", diff="Easy",
  method="subsetXORSum",
  ask="For every subset of an array, take the XOR of its values (0 for the empty subset), and return the sum of all those XORs.",
  cue="\"Every subset\" is the Subsets section's tree: at each element, one branch takes it and one does not. The leaves are the 2ⁿ subsets.",
  brute="Enumerate subsets as bitmasks 0 to 2ⁿ - 1 and XOR each one's values: O(2ⁿ × n). Fine for n ≤ 12.",
  approach="Recurse over the positions carrying the XOR of the values taken so far. At position i, either skip nums[i] or take it (XOR it in). When i reaches the end, the carried XOR is one subset's total; return it, and let each call return the sum of its two branches.",
  cx="O(2ⁿ) time, O(n) recursion depth. (There is also a one-line trick: the answer is the OR of all values shifted left by n - 1, because every bit that appears anywhere is set in exactly half the subsets.)",
  trap="Forgetting that the empty subset counts. It contributes 0, so it does not change the sum, but the recursion must still reach the end with nothing taken rather than treating an empty choice as invalid.",
  py='''class Solution:
    def subsetXORSum(self, nums: list[int]) -> int:
        def go(i, xor):
            if i == len(nums):
                return xor             # one subset's total
            return go(i + 1, xor) + go(i + 1, xor ^ nums[i])   # skip it, or take it
        return go(0, 0)''',
  java='''class Solution {
    public int subsetXORSum(int[] nums) {
        return go(nums, 0, 0);
    }

    private int go(int[] nums, int i, int xor) {
        if (i == nums.length) return xor;   // one subset's total
        return go(nums, i + 1, xor) + go(nums, i + 1, xor ^ nums[i]);   // skip, or take
    }
}''')

# ---------------------------------------------------------------- Medium
prob(num=78, slug="subsets", title="Subsets", diff="Medium",
  method="subsets", observe=SET_OF_LISTS,
  ask="Return every subset of an array of distinct values (in any order).",
  cue="The Subsets section's second reading of the tree: every node, not only the leaves, is a subset if each call adds the next element from a start index onwards.",
  brute="Bitmasks 0 to 2ⁿ - 1, one subset each: also O(2ⁿ × n), and a good way to check your recursion.",
  approach="Keep a path (the current subset). Record a copy of the path at every call. Then for each index j from start to the end, append nums[j], recurse with start j + 1, and pop it again (choose, recurse, un-choose).",
  cx="O(2ⁿ × n) time, dominated by copying each of the 2ⁿ subsets. O(n) recursion depth.",
  trap="Recording the path itself instead of a copy. Every recorded entry then points at the same list, which is empty by the time the recursion finishes.",
  py='''class Solution:
    def subsets(self, nums: list[int]) -> list[list[int]]:
        out, path = [], []

        def go(start):
            out.append(path[:])        # a copy: path keeps changing
            for j in range(start, len(nums)):
                path.append(nums[j])   # choose
                go(j + 1)              # recurse
                path.pop()             # un-choose

        go(0)
        return out''',
  java='''import java.util.*;

class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> out = new ArrayList<>();
        go(nums, 0, new ArrayList<>(), out);
        return out;
    }

    private void go(int[] nums, int start, List<Integer> path, List<List<Integer>> out) {
        out.add(new ArrayList<>(path));  // a copy: path keeps changing
        for (int j = start; j < nums.length; j++) {
            path.add(nums[j]);           // choose
            go(nums, j + 1, path, out);  // recurse
            path.remove(path.size() - 1);   // un-choose
        }
    }
}''')

prob(num=90, slug="subsets-ii", title="Subsets II", diff="Medium",
  method="subsetsWithDup", observe=SET_OF_LISTS,
  ask="Return every distinct subset of an array that may contain repeated values.",
  cue="The Duplicates section's rule: sort first, so equal values sit together, then at any one level of the tree never start two branches with the same value.",
  brute="Generate all 2ⁿ subsets, sort each, and deduplicate with a set: correct, but it does all the duplicate work and throws it away.",
  approach="Sort. Run the Subsets recursion, but inside the loop skip index j when j &gt; start and nums[j] == nums[j - 1]: that value was already tried as the next element at this level, and trying it again builds the same subsets.",
  cx="O(2ⁿ × n) time in the worst case (all values distinct), O(n) depth.",
  trap="Skipping with j &gt; 0 instead of j &gt; start. That also forbids taking the second copy after the first at a deeper level, so subsets like [2, 2] disappear.",
  py='''class Solution:
    def subsetsWithDup(self, nums: list[int]) -> list[list[int]]:
        nums.sort()                    # equal values side by side
        out, path = [], []

        def go(start):
            out.append(path[:])
            for j in range(start, len(nums)):
                if j > start and nums[j] == nums[j - 1]:
                    continue           # this value already started a branch here
                path.append(nums[j])
                go(j + 1)
                path.pop()

        go(0)
        return out''',
  java='''import java.util.*;

class Solution {
    public List<List<Integer>> subsetsWithDup(int[] nums) {
        Arrays.sort(nums);             // equal values side by side
        List<List<Integer>> out = new ArrayList<>();
        go(nums, 0, new ArrayList<>(), out);
        return out;
    }

    private void go(int[] nums, int start, List<Integer> path, List<List<Integer>> out) {
        out.add(new ArrayList<>(path));
        for (int j = start; j < nums.length; j++) {
            if (j > start && nums[j] == nums[j - 1]) continue;   // already started a branch here
            path.add(nums[j]);
            go(nums, j + 1, path, out);
            path.remove(path.size() - 1);
        }
    }
}''', check_args=False)

prob(num=46, slug="permutations", title="Permutations", diff="Medium",
  method="permute", observe=SORTED,
  ask="Return every ordering of an array of distinct values.",
  cue="The Permutations section: at each position you may place any value not placed yet. A used[] array (\"mark used\") tracks which ones are free.",
  brute="There is nothing faster than listing n! orderings; the question is only how cleanly you list them.",
  approach="Build the ordering one position at a time. For each index i not yet used, mark it used, append nums[i], recurse, then pop it and unmark it. When the path has n values, record a copy.",
  cx="O(n! × n) time, O(n) depth plus the used array.",
  trap="Forgetting to unmark on the way back. The value stays \"used\" for every later branch, and most permutations never appear.",
  py='''class Solution:
    def permute(self, nums: list[int]) -> list[list[int]]:
        out, path, used = [], [], [False] * len(nums)

        def go():
            if len(path) == len(nums):
                out.append(path[:])
                return
            for i in range(len(nums)):
                if used[i]:
                    continue
                used[i] = True         # choose
                path.append(nums[i])
                go()
                path.pop()             # un-choose, and unmark
                used[i] = False

        go()
        return out''',
  java='''import java.util.*;

class Solution {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> out = new ArrayList<>();
        go(nums, new boolean[nums.length], new ArrayList<>(), out);
        return out;
    }

    private void go(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> out) {
        if (path.size() == nums.length) { out.add(new ArrayList<>(path)); return; }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;            // choose
            path.add(nums[i]);
            go(nums, used, path, out);
            path.remove(path.size() - 1);   // un-choose, and unmark
            used[i] = false;
        }
    }
}''')

prob(num=47, slug="permutations-ii", title="Permutations II", diff="Medium",
  method="permuteUnique", observe=SORTED,
  ask="Return every distinct ordering of an array that may contain repeated values.",
  cue="Permutations plus the Duplicates section's rule, in its permutation form: sort, and among equal values always use them in left-to-right order, so two copies are never placed in swapped order.",
  brute="Generate all n! orderings and deduplicate with a set: up to n! wasted work when many values repeat.",
  approach="Sort. In the Permutations loop, skip index i if nums[i] == nums[i - 1] and i - 1 is not currently used. That condition means the earlier copy was already tried at this position and released, so placing this copy here would repeat its branches.",
  cx="O(n! × n) worst case, much less with repeats. O(n) depth.",
  trap="Writing the condition with \"used\" instead of \"not used\". Both versions produce each ordering once, but the \"used\" version prunes far later and explores many dead branches. The chapter's section asks you to derive which copy may go first, and \"left copy before right copy\" is the rule that prunes early.",
  py='''class Solution:
    def permuteUnique(self, nums: list[int]) -> list[list[int]]:
        nums.sort()
        out, path, used = [], [], [False] * len(nums)

        def go():
            if len(path) == len(nums):
                out.append(path[:])
                return
            for i in range(len(nums)):
                if used[i]:
                    continue
                if i > 0 and nums[i] == nums[i - 1] and not used[i - 1]:
                    continue           # equal copies go left to right only
                used[i] = True
                path.append(nums[i])
                go()
                path.pop()
                used[i] = False

        go()
        return out''',
  java='''import java.util.*;

class Solution {
    public List<List<Integer>> permuteUnique(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> out = new ArrayList<>();
        go(nums, new boolean[nums.length], new ArrayList<>(), out);
        return out;
    }

    private void go(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> out) {
        if (path.size() == nums.length) { out.add(new ArrayList<>(path)); return; }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            if (i > 0 && nums[i] == nums[i - 1] && !used[i - 1]) continue;   // left copy first
            used[i] = true;
            path.add(nums[i]);
            go(nums, used, path, out);
            path.remove(path.size() - 1);
            used[i] = false;
        }
    }
}''', check_args=False)

prob(num=77, slug="combinations", title="Combinations", diff="Medium",
  method="combine", observe=SORTED,
  ask="Return every way to choose k numbers from 1 to n.",
  cue="The Combinations section: a start index makes each combination come out once, in increasing order. The Pruning section adds a cheap cut: stop when too few numbers remain to reach k.",
  brute="Generate all subsets and keep those of size k: O(2ⁿ) instead of O(C(n, k)).",
  approach="Recurse with a start value. When the path has k numbers, record it. Otherwise try each next value i from start up to n - (k - len(path)) + 1: past that, there are not enough numbers left to finish, so those branches are cut before they begin.",
  cx="O(C(n, k) × k) time, O(k) depth.",
  trap="Looping i all the way to n. The answers are the same, but the search walks into branches that can never be completed; for n = 20, k = 18 that is most of the tree.",
  py='''class Solution:
    def combine(self, n: int, k: int) -> list[list[int]]:
        out, path = [], []

        def go(start):
            if len(path) == k:
                out.append(path[:])
                return
            for i in range(start, n - (k - len(path)) + 2):   # enough numbers left
                path.append(i)
                go(i + 1)
                path.pop()

        go(1)
        return out''',
  java='''import java.util.*;

class Solution {
    public List<List<Integer>> combine(int n, int k) {
        List<List<Integer>> out = new ArrayList<>();
        go(n, k, 1, new ArrayList<>(), out);
        return out;
    }

    private void go(int n, int k, int start, List<Integer> path, List<List<Integer>> out) {
        if (path.size() == k) { out.add(new ArrayList<>(path)); return; }
        for (int i = start; i <= n - (k - path.size()) + 1; i++) {   // enough numbers left
            path.add(i);
            go(n, k, i + 1, path, out);
            path.remove(path.size() - 1);
        }
    }
}''')

prob(num=39, slug="combination-sum", title="Combination Sum", diff="Medium",
  method="combinationSum", observe=SET_OF_LISTS,
  ask="Return every combination of the given distinct numbers (each usable any number of times) that adds up to a target.",
  cue="Combinations with reuse: recurse with the same start index after taking a number, so it may be taken again, and never go back to earlier numbers, so each combination appears once. Sorting lets you prune: once a number overshoots, every later one does too.",
  brute="Enumerate multisets without order control and deduplicate afterwards: exponentially more branches.",
  approach="Sort the candidates. Recurse with (start, remaining). If remaining is 0, record the path. Otherwise, for each j from start, stop the loop as soon as candidates[j] &gt; remaining; else take candidates[j] and recurse with start j (not j + 1, so it can be reused).",
  cx="Exponential in target / smallest candidate; the pruning keeps it small at the problem's limits.",
  trap="Recursing with j + 1, which forbids reuse, or with 0, which produces the same combination in several orders.",
  py='''class Solution:
    def combinationSum(self, candidates: list[int], target: int) -> list[list[int]]:
        candidates.sort()
        out, path = [], []

        def go(start, remaining):
            if remaining == 0:
                out.append(path[:])
                return
            for j in range(start, len(candidates)):
                if candidates[j] > remaining:
                    break              # sorted: every later one overshoots too
                path.append(candidates[j])
                go(j, remaining - candidates[j])   # j, not j + 1: reuse allowed
                path.pop()

        go(0, target)
        return out''',
  java='''import java.util.*;

class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        Arrays.sort(candidates);
        List<List<Integer>> out = new ArrayList<>();
        go(candidates, 0, target, new ArrayList<>(), out);
        return out;
    }

    private void go(int[] c, int start, int remaining, List<Integer> path, List<List<Integer>> out) {
        if (remaining == 0) { out.add(new ArrayList<>(path)); return; }
        for (int j = start; j < c.length && c[j] <= remaining; j++) {   // sorted: stop at overshoot
            path.add(c[j]);
            go(c, j, remaining - c[j], path, out);   // j, not j + 1: reuse allowed
            path.remove(path.size() - 1);
        }
    }
}''', check_args=False)

prob(num=40, slug="combination-sum-ii", title="Combination Sum II", diff="Medium",
  method="combinationSum2", observe=SET_OF_LISTS,
  ask="Return every distinct combination of the given numbers (which may repeat, each used at most once) that adds up to a target.",
  cue="Combination Sum without reuse (recurse with j + 1) plus Subsets II's duplicate rule (skip equal values at the same level).",
  brute="Generate all subsets, keep those with the right sum, deduplicate: O(2ⁿ).",
  approach="Sort. Recurse with (start, remaining). Record the path when remaining hits 0. In the loop, skip j &gt; start with candidates[j] == candidates[j - 1], stop when candidates[j] &gt; remaining, and otherwise take candidates[j] and recurse with j + 1.",
  cx="O(2ⁿ) in the worst case, far less with the two prunings.",
  trap="Deduplicating the output with a set instead of pruning. It gives the right answer and times out on inputs like thirty 1s with target 30, where the unpruned tree has over a billion branches.",
  py='''class Solution:
    def combinationSum2(self, candidates: list[int], target: int) -> list[list[int]]:
        candidates.sort()
        out, path = [], []

        def go(start, remaining):
            if remaining == 0:
                out.append(path[:])
                return
            for j in range(start, len(candidates)):
                if j > start and candidates[j] == candidates[j - 1]:
                    continue           # same value, same level: same branches
                if candidates[j] > remaining:
                    break
                path.append(candidates[j])
                go(j + 1, remaining - candidates[j])   # each number at most once
                path.pop()

        go(0, target)
        return out''',
  java='''import java.util.*;

class Solution {
    public List<List<Integer>> combinationSum2(int[] candidates, int target) {
        Arrays.sort(candidates);
        List<List<Integer>> out = new ArrayList<>();
        go(candidates, 0, target, new ArrayList<>(), out);
        return out;
    }

    private void go(int[] c, int start, int remaining, List<Integer> path, List<List<Integer>> out) {
        if (remaining == 0) { out.add(new ArrayList<>(path)); return; }
        for (int j = start; j < c.length && c[j] <= remaining; j++) {
            if (j > start && c[j] == c[j - 1]) continue;   // same value, same level
            path.add(c[j]);
            go(c, j + 1, remaining - c[j], path, out);     // each number at most once
            path.remove(path.size() - 1);
        }
    }
}''', check_args=False)

prob(num=22, slug="generate-parentheses", title="Generate Parentheses", diff="Medium",
  method="generateParenthesis", observe=SORTED,
  ask="Return every well-formed string of n pairs of parentheses.",
  cue="Build the string one character at a time and prune any prefix that can no longer become valid. The two rules are all you need: at most n opening brackets, and never more closing than opening.",
  brute="Generate all 2²ⁿ strings of brackets and check each: 2²ⁿ × 2n work, 65,536 strings at n = 8 (the problem's limit), of which 1,430 are valid.",
  approach="Recurse with counts of open and close brackets used. Add \"(\" if open &lt; n. Add \")\" if close &lt; open. When the string has length 2n, it is valid by construction; record it.",
  cx="Proportional to the number of answers, the n-th Catalan number (1,430 at n = 8), times 2n to build each.",
  trap="Checking validity only at the end. Pruning invalid prefixes as soon as they appear is what turns 2²ⁿ candidates into only the valid ones.",
  py='''class Solution:
    def generateParenthesis(self, n: int) -> list[str]:
        out, path = [], []

        def go(opened, closed):
            if len(path) == 2 * n:
                out.append("".join(path))   # valid by construction
                return
            if opened < n:
                path.append("(")
                go(opened + 1, closed)
                path.pop()
            if closed < opened:             # never close more than you opened
                path.append(")")
                go(opened, closed + 1)
                path.pop()

        go(0, 0)
        return out''',
  java='''import java.util.*;

class Solution {
    public List<String> generateParenthesis(int n) {
        List<String> out = new ArrayList<>();
        go(n, 0, 0, new StringBuilder(), out);
        return out;
    }

    private void go(int n, int opened, int closed, StringBuilder path, List<String> out) {
        if (path.length() == 2 * n) { out.add(path.toString()); return; }   // valid by construction
        if (opened < n) {
            path.append('(');
            go(n, opened + 1, closed, path, out);
            path.deleteCharAt(path.length() - 1);
        }
        if (closed < opened) {         // never close more than you opened
            path.append(')');
            go(n, opened, closed + 1, path, out);
            path.deleteCharAt(path.length() - 1);
        }
    }
}''')

prob(num=17, slug="letter-combinations-of-a-phone-number", title="Letter Combinations of a Phone Number", diff="Medium",
  method="letterCombinations", observe=SORTED,
  ask="Given digits 2 to 9, return every letter string they could spell on a phone keypad (\"2\" is abc, and so on). An empty input gives an empty list.",
  cue="One level of the tree per digit, one branch per letter on that key. The template with no pruning at all, because every leaf is an answer.",
  brute="Nested loops work only for a fixed number of digits; recursion (or a running product) handles any length.",
  approach="Recurse over the digit positions. At position i, for each letter on digit i's key, append it, recurse to i + 1, and remove it. When i reaches the end, record the string.",
  cx="O(4ⁿ × n) for n digits (7 and 9 have four letters).",
  trap="The empty input. The recursion would record one empty string, but the problem wants an empty list. Handle it before starting.",
  py='''class Solution:
    def letterCombinations(self, digits: str) -> list[str]:
        if not digits:
            return []                  # not [""]
        keys = {"2": "abc", "3": "def", "4": "ghi", "5": "jkl",
                "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"}
        out, path = [], []

        def go(i):
            if i == len(digits):
                out.append("".join(path))
                return
            for letter in keys[digits[i]]:
                path.append(letter)
                go(i + 1)
                path.pop()

        go(0)
        return out''',
  java='''import java.util.*;

class Solution {
    private static final String[] KEYS = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};

    public List<String> letterCombinations(String digits) {
        List<String> out = new ArrayList<>();
        if (digits.isEmpty()) return out;   // not [""]
        go(digits, 0, new StringBuilder(), out);
        return out;
    }

    private void go(String digits, int i, StringBuilder path, List<String> out) {
        if (i == digits.length()) { out.add(path.toString()); return; }
        for (char letter : KEYS[digits.charAt(i) - '0'].toCharArray()) {
            path.append(letter);
            go(digits, i + 1, path, out);
            path.deleteCharAt(path.length() - 1);
        }
    }
}''')

prob(num=79, slug="word-search", title="Word Search", diff="Medium",
  method="exist",
  ask="Decide whether a word can be traced in a grid of letters by moving between horizontally or vertically adjacent cells, using each cell at most once.",
  cue="From each starting cell, a path through the grid is a branch of a search tree, and \"each cell at most once\" is the used-marking from Permutations. A mismatched letter prunes the branch at once.",
  brute="There is no exhaustive alternative short of trying every path; the pruning is the whole game.",
  approach="For every cell, start a search for the word's first letter. A search at (r, c) for position i fails if the cell is off the grid or does not hold word[i]; succeeds if i is the last position; otherwise it marks the cell used (overwrite it with \"#\"), tries the four neighbours for position i + 1, and restores the letter before returning.",
  cx="O(R × C × 3^L) in the worst case for a word of length L: each step has at most 3 new directions. O(L) depth.",
  trap="Forgetting to restore the cell on the way back. The mark then leaks into searches that start elsewhere and blocks valid paths.",
  py='''class Solution:
    def exist(self, board: list[list[str]], word: str) -> bool:
        R, C = len(board), len(board[0])

        def go(r, c, i):
            if not (0 <= r < R and 0 <= c < C) or board[r][c] != word[i]:
                return False           # off the grid, used, or the wrong letter
            if i == len(word) - 1:
                return True
            board[r][c] = "#"          # mark used
            found = (go(r + 1, c, i + 1) or go(r - 1, c, i + 1)
                     or go(r, c + 1, i + 1) or go(r, c - 1, i + 1))
            board[r][c] = word[i]      # restore on the way back
            return found

        return any(go(r, c, 0) for r in range(R) for c in range(C))''',
  java='''class Solution {
    public boolean exist(char[][] board, String word) {
        for (int r = 0; r < board.length; r++)
            for (int c = 0; c < board[0].length; c++)
                if (go(board, word, r, c, 0)) return true;
        return false;
    }

    private boolean go(char[][] b, String word, int r, int c, int i) {
        if (r < 0 || r >= b.length || c < 0 || c >= b[0].length || b[r][c] != word.charAt(i))
            return false;              // off the grid, used, or the wrong letter
        if (i == word.length() - 1) return true;
        b[r][c] = '#';                 // mark used
        boolean found = go(b, word, r + 1, c, i + 1) || go(b, word, r - 1, c, i + 1)
                     || go(b, word, r, c + 1, i + 1) || go(b, word, r, c - 1, i + 1);
        b[r][c] = word.charAt(i);      // restore on the way back
        return found;
    }
}''')

prob(num=131, slug="palindrome-partitioning", title="Palindrome Partitioning", diff="Medium",
  method="partition", observe=SORTED,
  ask="Return every way to cut a string into pieces that are all palindromes.",
  cue="Each cut position is a choice: the next piece is s[start:end] for some end. Prune any piece that is not a palindrome, so only valid partitions are ever built.",
  brute="Try all 2ⁿ⁻¹ ways to cut and check every piece of each.",
  approach="Recurse with a start position. When start reaches the end, record the pieces. Otherwise, for each end from start + 1 to n, if s[start:end] is a palindrome, append it, recurse from end, and remove it.",
  cx="O(n × 2ⁿ) in the worst case (a string of one repeated letter, where every cut is valid).",
  trap="Re-checking the same substrings for palindromes over and over. For long strings, a table of which substrings are palindromes (Chapter 21's Palindromic Variants) removes the repeated work; at this problem's n ≤ 16 the direct check is fine.",
  py='''class Solution:
    def partition(self, s: str) -> list[list[str]]:
        out, path = [], []

        def go(start):
            if start == len(s):
                out.append(path[:])
                return
            for end in range(start + 1, len(s) + 1):
                piece = s[start:end]
                if piece == piece[::-1]:   # prune pieces that are not palindromes
                    path.append(piece)
                    go(end)
                    path.pop()

        go(0)
        return out''',
  java='''import java.util.*;

class Solution {
    public List<List<String>> partition(String s) {
        List<List<String>> out = new ArrayList<>();
        go(s, 0, new ArrayList<>(), out);
        return out;
    }

    private boolean isPal(String s, int i, int j) {   // s[i..j] inclusive
        while (i < j) if (s.charAt(i++) != s.charAt(j--)) return false;
        return true;
    }

    private void go(String s, int start, List<String> path, List<List<String>> out) {
        if (start == s.length()) { out.add(new ArrayList<>(path)); return; }
        for (int end = start + 1; end <= s.length(); end++) {
            if (!isPal(s, start, end - 1)) continue;   // prune non-palindromes
            path.add(s.substring(start, end));
            go(s, end, path, out);
            path.remove(path.size() - 1);
        }
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=51, slug="n-queens", title="N-Queens", diff="Hard",
  method="solveNQueens", observe=SORTED,
  ask="Place n queens on an n × n board so that none attacks another, and return every such board (\"Q\" for a queen, \".\" for empty).",
  cue="One queen per row, so the tree has one level per row and one branch per column. Three sets (columns, and the two diagonals, identified by r - c and r + c) make \"is this square attacked?\" a constant-time check that prunes the branch immediately.",
  brute="Try all C(n², n) placements: over 4 billion at n = 8. One queen per row cuts it to nⁿ; pruning cuts it to a few thousand nodes.",
  approach="Recurse over rows. In row r, for each column c not in cols, r - c not in diag1 and r + c not in diag2, place the queen (add to the three sets and record the column), recurse to row r + 1, then remove it. When r reaches n, turn the recorded columns into board strings.",
  cx="Bounded by O(n!) with far fewer nodes in practice; O(n) depth and set sizes.",
  trap="Checking attacks by scanning the board for every candidate square, O(n) per check. The diagonal keys r - c and r + c are constant along each diagonal, which is what makes the sets work.",
  py='''class Solution:
    def solveNQueens(self, n: int) -> list[list[str]]:
        out, queens = [], []           # queens[r] = column of the queen in row r
        cols, diag1, diag2 = set(), set(), set()

        def go(r):
            if r == n:
                out.append(["." * c + "Q" + "." * (n - c - 1) for c in queens])
                return
            for c in range(n):
                if c in cols or r - c in diag1 or r + c in diag2:
                    continue           # attacked: prune
                cols.add(c); diag1.add(r - c); diag2.add(r + c); queens.append(c)
                go(r + 1)
                cols.remove(c); diag1.remove(r - c); diag2.remove(r + c); queens.pop()

        go(0)
        return out''',
  java='''import java.util.*;

class Solution {
    public List<List<String>> solveNQueens(int n) {
        List<List<String>> out = new ArrayList<>();
        go(n, 0, new int[n], new boolean[n], new boolean[2 * n], new boolean[2 * n], out);
        return out;
    }

    // queens[r] = column in row r; d1 is indexed by r - c + n, d2 by r + c
    private void go(int n, int r, int[] queens, boolean[] cols, boolean[] d1, boolean[] d2, List<List<String>> out) {
        if (r == n) {
            List<String> board = new ArrayList<>();
            for (int c : queens) board.add(".".repeat(c) + "Q" + ".".repeat(n - c - 1));
            out.add(board);
            return;
        }
        for (int c = 0; c < n; c++) {
            if (cols[c] || d1[r - c + n] || d2[r + c]) continue;   // attacked: prune
            cols[c] = d1[r - c + n] = d2[r + c] = true;
            queens[r] = c;
            go(n, r + 1, queens, cols, d1, d2, out);
            cols[c] = d1[r - c + n] = d2[r + c] = false;
        }
    }
}''')

prob(num=37, slug="sudoku-solver", title="Sudoku Solver", diff="Hard",
  method="solveSudoku", observe=sudoku_ok,
  ask="Fill in a Sudoku board in place. The puzzle has exactly one solution.",
  cue="The Constraint Propagation section. Plain backtracking fills cells left to right; choosing the empty cell with the fewest legal digits first finds contradictions far sooner, and on hard puzzles that is the difference between milliseconds and minutes.",
  brute="Try all digits in every empty cell: up to 9⁵⁰ or so for a hard puzzle, which only pruning makes feasible.",
  approach="Keep sets of the digits used in each row, column and box. Recursively: find the empty cell with the fewest legal digits. If none is empty, the board is solved. If that cell has no legal digit, backtrack. Otherwise try each legal digit: place it (update the three sets), recurse, and if that fails, remove it.",
  cx="Exponential in the worst case; with the fewest-options rule, typical puzzles take well under a second.",
  trap="Returning after the recursion without undoing the placement when it fails. The next digit tried then sits on a board still holding the previous attempt.",
  py='''class Solution:
    def solveSudoku(self, board: list[list[str]]) -> None:
        rows = [set() for _ in range(9)]
        cols = [set() for _ in range(9)]
        boxes = [set() for _ in range(9)]
        empty = []
        for r in range(9):
            for c in range(9):
                d = board[r][c]
                if d == ".":
                    empty.append((r, c))
                else:
                    rows[r].add(d); cols[c].add(d); boxes[r // 3 * 3 + c // 3].add(d)

        def options(r, c):
            used = rows[r] | cols[c] | boxes[r // 3 * 3 + c // 3]
            return [d for d in "123456789" if d not in used]

        def go():
            if not empty:
                return True
            best = min(range(len(empty)), key=lambda i: len(options(*empty[i])))   # fewest options first
            r, c = empty.pop(best)
            for d in options(r, c):
                board[r][c] = d
                rows[r].add(d); cols[c].add(d); boxes[r // 3 * 3 + c // 3].add(d)
                if go():
                    return True
                rows[r].remove(d); cols[c].remove(d); boxes[r // 3 * 3 + c // 3].remove(d)
            board[r][c] = "."          # undo, and give the cell back
            empty.insert(best, (r, c))
            return False

        go()''',
  java='''import java.util.*;

class Solution {
    private final boolean[][] rows = new boolean[9][10], cols = new boolean[9][10], boxes = new boolean[9][10];
    private final List<int[]> empty = new ArrayList<>();
    private char[][] board;

    public void solveSudoku(char[][] board) {
        this.board = board;
        for (int r = 0; r < 9; r++)
            for (int c = 0; c < 9; c++) {
                if (board[r][c] == '.') empty.add(new int[]{r, c});
                else set(r, c, board[r][c] - '0', true);
            }
        go();
    }

    private void set(int r, int c, int d, boolean v) {
        rows[r][d] = v; cols[c][d] = v; boxes[r / 3 * 3 + c / 3][d] = v;
    }

    private int options(int r, int c) {
        int n = 0;
        for (int d = 1; d <= 9; d++) if (!rows[r][d] && !cols[c][d] && !boxes[r / 3 * 3 + c / 3][d]) n++;
        return n;
    }

    private boolean go() {
        if (empty.isEmpty()) return true;
        int best = 0;                  // fewest options first
        for (int i = 1; i < empty.size(); i++)
            if (options(empty.get(i)[0], empty.get(i)[1]) < options(empty.get(best)[0], empty.get(best)[1])) best = i;
        int[] cell = empty.remove(best);
        int r = cell[0], c = cell[1];
        for (int d = 1; d <= 9; d++) {
            if (rows[r][d] || cols[c][d] || boxes[r / 3 * 3 + c / 3][d]) continue;
            board[r][c] = (char) ('0' + d);
            set(r, c, d, true);
            if (go()) return true;
            set(r, c, d, false);
        }
        board[r][c] = '.';             // undo, and give the cell back
        empty.add(best, cell);
        return false;
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(18)
def arr(lo, hi, nmin=1, nmax=6): return [R.randint(lo, hi) for _ in range(R.randint(nmin, nmax))]

def all_subsets(a): return [list(c) for k in range(len(a) + 1) for c in combinations(a, k)]

def gen_sudoku():
    base = [[(r * 3 + r // 3 + c) % 9 + 1 for c in range(9)] for r in range(9)]
    digits = list(range(1, 10)); R.shuffle(digits)
    rows = [b * 3 + r for b in R.sample(range(3), 3) for r in R.sample(range(3), 3)]
    cols = [b * 3 + c for b in R.sample(range(3), 3) for c in R.sample(range(3), 3)]
    full = [[digits[base[r][c] - 1] for c in cols] for r in rows]
    board = [[str(full[r][c]) if R.random() < 0.45 else "." for c in range(9)] for r in range(9)]
    return [board]

def gen79():
    c = R.randint(1, 4)
    board = [[R.choice("ABC") for _ in range(c)] for _ in range(R.randint(1, 3))]
    return [board, "".join(R.choice("ABC") for _ in range(R.randint(1, 5)))]

def brute79(board, word):
    R_, C = len(board), len(board[0])
    def paths(r, c, i, seen):
        if board[r][c] != word[i]: return False
        if i == len(word) - 1: return True
        return any(paths(nr, nc, i + 1, seen | {(nr, nc)})
                   for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1))
                   if 0 <= nr < R_ and 0 <= nc < C and (nr, nc) not in seen)
    return any(paths(r, c, 0, {(r, c)}) for r in range(R_) for c in range(C))

def brute131(s):
    out = []
    for mask in range(1 << (len(s) - 1)):
        pieces, start = [], 0
        for i in range(1, len(s)):
            if mask >> (i - 1) & 1: pieces.append(s[start:i]); start = i
        pieces.append(s[start:])
        if all(p == p[::-1] for p in pieces): out.append(pieces)
    return sorted(out)

def brute51(n):
    out = []
    for perm in permutations(range(n)):
        if len({r - c for r, c in enumerate(perm)}) == n and len({r + c for r, c in enumerate(perm)}) == n:
            out.append(["." * c + "Q" + "." * (n - c - 1) for c in perm])
    return sorted(out)

def brute_combsum(c, t, reuse):
    out = set()
    def go(i, rem, path):
        if rem == 0: out.add(tuple(sorted(path))); return
        if i == len(c) or rem < 0: return
        if reuse: go(i, rem - c[i], path + [c[i]])
        else: go(i + 1, rem - c[i], path + [c[i]])
        go(i + 1, rem, path)
    go(0, t, [])
    return sorted(list(x) for x in out)

BRUTE = {
  1863: (lambda: [arr(1, 20, 1, 8)], lambda a: sum(reduce(xor, s, 0) for s in all_subsets(a))),
  78:   (lambda: [R.sample(range(-5, 6), R.randint(1, 6))], lambda a: sorted(sorted(s) for s in all_subsets(a))),
  90:   (lambda: [arr(0, 2, 1, 6)], lambda a: sorted(map(list, {tuple(sorted(s)) for s in all_subsets(a)}))),
  46:   (lambda: [R.sample(range(-5, 6), R.randint(1, 5))], lambda a: sorted(map(list, permutations(a)))),
  47:   (lambda: [arr(0, 2, 1, 6)], lambda a: sorted(map(list, set(permutations(a))))),
  77:   (lambda: (lambda n: [n, R.randint(1, n)])(R.randint(1, 8)), lambda n, k: sorted(map(list, combinations(range(1, n + 1), k)))),
  39:   (lambda: [R.sample(range(2, 9), R.randint(1, 4)), R.randint(1, 16)], lambda c, t: brute_combsum(sorted(c), t, True)),
  40:   (lambda: [arr(1, 5, 1, 8), R.randint(1, 10)], lambda c, t: brute_combsum(sorted(c), t, False)),
  22:   (lambda: [R.randint(1, 5)],
         lambda n: sorted(s for s in ("".join(p) for p in product("()", repeat=2 * n))
                          if all(s[:i].count("(") >= s[:i].count(")") for i in range(2 * n + 1)) and s.count("(") == n)),
  17:   (lambda: ["".join(R.choice("23456789") for _ in range(R.randint(0, 3)))],
         lambda d: sorted("".join(p) for p in product(*[{"2": "abc", "3": "def", "4": "ghi", "5": "jkl", "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"}[x] for x in d])) if d else []),
  79:   (gen79, brute79),
  131:  (lambda: ["".join(R.choice("ab") for _ in range(R.randint(1, 8)))], brute131),
  51:   (lambda: [R.randint(1, 7)], brute51),
  37:   (gen_sudoku, lambda b: True),
}
