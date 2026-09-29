# Chapter 21 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
import random, re
from itertools import combinations

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

def longest_pal_ok(r, a):
    s = a[0]
    best = max(j - i for i in range(len(s)) for j in range(i + 1, len(s) + 1) if s[i:j] == s[i:j][::-1])
    return r in s and r == r[::-1] and len(r) == best

# ---------------------------------------------------------------- Easy
prob(num=392, slug="is-subsequence", title="Is Subsequence", diff="Easy",
  method="isSubsequence",
  ask="Decide whether s can be obtained from t by deleting some characters without reordering the rest.",
  cue="The simplest alignment in the chapter's family: match each character of s to the earliest usable character of t. Taking the earliest match never hurts, because it leaves the most of t for the rest of s.",
  brute="Try every way to pick len(s) positions from t: exponential.",
  approach="Walk t with a pointer i into s. Whenever t's character equals s[i], advance i. s is a subsequence exactly when i reaches the end of s.",
  cx="O(len(t)) time, O(1) space.",
  trap="The follow-up: with a billion strings s checked against the same t, rescanning t each time is too slow. Precompute, for each letter, the sorted list of its positions in t; each s then costs len(s) binary searches (Chapter 13).",
  py='''class Solution:
    def isSubsequence(self, s: str, t: str) -> bool:
        i = 0
        for c in t:
            if i < len(s) and s[i] == c:
                i += 1                 # the earliest match is always safe to take
        return i == len(s)''',
  java='''class Solution {
    public boolean isSubsequence(String s, String t) {
        int i = 0;
        for (int j = 0; j < t.length() && i < s.length(); j++)
            if (s.charAt(i) == t.charAt(j)) i++;   // the earliest match is always safe
        return i == s.length();
    }
}''')

# ---------------------------------------------------------------- Medium
prob(num=300, slug="longest-increasing-subsequence", title="Longest Increasing Subsequence", diff="Medium",
  method="lengthOfLIS",
  ask="Find the length of the longest strictly increasing subsequence of an array.",
  cue="The chapter's first two sections. The quadratic DP asks, for each i, for the longest increasing subsequence ending at i. The n log n version keeps tails[len] = the smallest possible last value of an increasing subsequence of length len + 1, and places each value with a binary search.",
  brute="Check every subsequence: 2ⁿ.",
  approach="Keep tails, which is always sorted. For each x, find with lower_bound the first tail ≥ x. If there is none, x extends the longest subsequence: append it. Otherwise replace that tail with x, because a subsequence of that length can now end lower. The answer is len(tails).",
  cx="O(n log n) time, O(n) space. The O(n²) DP is fine at n = 2,500 too, and is the version to derive first.",
  trap="Reading tails as the subsequence itself: the LIS in n log n, and the Array That Lies section. tails is only a record of the best ending value for each length; for [3, 4, 1] it ends as [1, 4], which is not a subsequence. Rebuilding the actual sequence needs parent pointers.",
  py='''from bisect import bisect_left

class Solution:
    def lengthOfLIS(self, nums: list[int]) -> int:
        tails = []                     # tails[k]: smallest last value of an increasing run of length k + 1
        for x in nums:
            i = bisect_left(tails, x)  # first tail >= x (strictly increasing)
            if i == len(tails):
                tails.append(x)        # x extends the longest run
            else:
                tails[i] = x           # a run of length i + 1 can now end lower
        return len(tails)''',
  java='''class Solution {
    public int lengthOfLIS(int[] nums) {
        int[] tails = new int[nums.length];   // tails[k]: smallest end of a run of length k + 1
        int size = 0;
        for (int x : nums) {
            int lo = 0, hi = size;     // first tail >= x
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (tails[mid] < x) lo = mid + 1; else hi = mid;
            }
            tails[lo] = x;             // replace, or extend when lo == size
            if (lo == size) size++;
        }
        return size;
    }
}''')

prob(num=1143, slug="longest-common-subsequence", title="Longest Common Subsequence", diff="Medium",
  method="longestCommonSubsequence",
  ask="Find the length of the longest subsequence common to two strings.",
  cue="The Longest Common Subsequence section: look at the last characters of both prefixes. If they match, they can end the common subsequence; if not, one of them is not in it, so drop one or the other and take the better result.",
  brute="Enumerate the subsequences of the shorter string and check each: 2ⁿ.",
  approach="L[i][j] is the LCS length of text1[:i] and text2[:j]. If text1[i - 1] == text2[j - 1], L[i][j] = L[i - 1][j - 1] + 1; otherwise L[i][j] = max(L[i - 1][j], L[i][j - 1]). Row 0 and column 0 are 0. Only the previous row is needed.",
  cx="O(m × n) time, O(n) space with two rows.",
  trap="On a match, also taking the max with the two neighbours. It is not wrong, since L[i - 1][j - 1] + 1 is never smaller, but reasoning that it might be is the confusion the chapter's section resolves: matching the last characters is always safe.",
  py='''class Solution:
    def longestCommonSubsequence(self, text1: str, text2: str) -> int:
        prev = [0] * (len(text2) + 1)  # row i - 1 of the table
        for a in text1:
            cur = [0]
            for j, b in enumerate(text2, 1):
                cur.append(prev[j - 1] + 1 if a == b else max(prev[j], cur[j - 1]))
            prev = cur
        return prev[-1]''',
  java='''class Solution {
    public int longestCommonSubsequence(String text1, String text2) {
        int n = text2.length();
        int[] prev = new int[n + 1], cur = new int[n + 1];   // two rows of the table
        for (int i = 1; i <= text1.length(); i++) {
            for (int j = 1; j <= n; j++)
                cur[j] = text1.charAt(i - 1) == text2.charAt(j - 1)
                       ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
            int[] t = prev; prev = cur; cur = t;
        }
        return prev[n];
    }
}''')

prob(num=72, slug="edit-distance", title="Edit Distance", diff="Medium",
  method="minDistance",
  ask="Find the fewest single-character insertions, deletions and replacements that turn word1 into word2.",
  cue="The Edit Distance section. Look at the last characters: if they match, they cost nothing; otherwise the last operation was a replace, a delete or an insert, each leaving a smaller pair of prefixes.",
  brute="Try every edit sequence: exponential.",
  approach="D[i][j] is the distance between word1[:i] and word2[:j]. D[i][0] = i (delete everything) and D[0][j] = j (insert everything). If the last characters match, D[i][j] = D[i - 1][j - 1]; otherwise 1 + min(D[i - 1][j - 1] (replace), D[i - 1][j] (delete), D[i][j - 1] (insert)).",
  cx="O(m × n) time, O(n) space with two rows.",
  trap="Forgetting the first row and column. Turning a string into the empty string costs its length, and without those base cases every answer comes out too small.",
  py='''class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        prev = list(range(len(word2) + 1))   # row 0: insert everything
        for i, a in enumerate(word1, 1):
            cur = [i]                          # column 0: delete everything
            for j, b in enumerate(word2, 1):
                if a == b:
                    cur.append(prev[j - 1])
                else:
                    cur.append(1 + min(prev[j - 1], prev[j], cur[j - 1]))   # replace, delete, insert
            prev = cur
        return prev[-1]''',
  java='''class Solution {
    public int minDistance(String word1, String word2) {
        int n = word2.length();
        int[] prev = new int[n + 1], cur = new int[n + 1];
        for (int j = 0; j <= n; j++) prev[j] = j;          // row 0: insert everything
        for (int i = 1; i <= word1.length(); i++) {
            cur[0] = i;                                    // column 0: delete everything
            for (int j = 1; j <= n; j++)
                cur[j] = word1.charAt(i - 1) == word2.charAt(j - 1) ? prev[j - 1]
                       : 1 + Math.min(prev[j - 1], Math.min(prev[j], cur[j - 1]));   // replace, delete, insert
            int[] t = prev; prev = cur; cur = t;
        }
        return prev[n];
    }
}''')

prob(num=5, slug="longest-palindromic-substring", title="Longest Palindromic Substring", diff="Medium",
  method="longestPalindrome", observe=longest_pal_ok,
  ask="Return the longest substring that reads the same forwards and backwards (any one, if several tie).",
  cue="The Palindromic Variants section. Every palindrome has a centre, either a character or the gap between two, and grows outward from it one matching pair at a time. There are only 2n - 1 centres.",
  brute="Check every substring: O(n³).",
  approach="For each centre, expand while the characters on both sides match, and remember the longest stretch found. Do it for odd-length centres (i, i) and even-length ones (i, i + 1).",
  cx="O(n²) time, O(1) space. Manacher's algorithm (Chapter 42) does it in O(n).",
  trap="Only trying odd-length centres. \"abba\" has no character at its centre, so it is found only from the gap between the two b's.",
  py='''class Solution:
    def longestPalindrome(self, s: str) -> str:
        best = (0, 1)                  # [start, end) of the best so far
        for centre in range(2 * len(s) - 1):
            lo, hi = centre // 2, (centre + 1) // 2   # a character, or a gap
            while lo >= 0 and hi < len(s) and s[lo] == s[hi]:
                lo, hi = lo - 1, hi + 1
            if hi - lo - 1 > best[1] - best[0]:
                best = (lo + 1, hi)
        return s[best[0]:best[1]]''',
  java='''class Solution {
    public String longestPalindrome(String s) {
        int bestLo = 0, bestHi = 1;    // [bestLo, bestHi)
        for (int centre = 0; centre < 2 * s.length() - 1; centre++) {
            int lo = centre / 2, hi = (centre + 1) / 2;   // a character, or a gap
            while (lo >= 0 && hi < s.length() && s.charAt(lo) == s.charAt(hi)) { lo--; hi++; }
            if (hi - lo - 1 > bestHi - bestLo) { bestLo = lo + 1; bestHi = hi; }
        }
        return s.substring(bestLo, bestHi);
    }
}''')

prob(num=647, slug="palindromic-substrings", title="Palindromic Substrings", diff="Medium",
  method="countSubstrings",
  ask="Count the substrings of a string that are palindromes (by position, so repeats count separately).",
  cue="The same centre expansion, counting instead of measuring: every successful expansion step from a centre is one more palindrome.",
  brute="Check every substring: O(n³).",
  approach="For each of the 2n - 1 centres, expand while both sides match, adding 1 for each step that succeeds.",
  cx="O(n²) time, O(1) space.",
  trap="Counting distinct palindromes instead of palindromic positions. In \"aaa\" the answer is 6 (three \"a\", two \"aa\", one \"aaa\"), not 3.",
  py='''class Solution:
    def countSubstrings(self, s: str) -> int:
        count = 0
        for centre in range(2 * len(s) - 1):
            lo, hi = centre // 2, (centre + 1) // 2
            while lo >= 0 and hi < len(s) and s[lo] == s[hi]:
                count += 1             # s[lo..hi] is one more palindrome
                lo, hi = lo - 1, hi + 1
        return count''',
  java='''class Solution {
    public int countSubstrings(String s) {
        int count = 0;
        for (int centre = 0; centre < 2 * s.length() - 1; centre++) {
            int lo = centre / 2, hi = (centre + 1) / 2;
            while (lo >= 0 && hi < s.length() && s.charAt(lo) == s.charAt(hi)) {
                count++;               // s[lo..hi] is one more palindrome
                lo--;
                hi++;
            }
        }
        return count;
    }
}''')

prob(num=516, slug="longest-palindromic-subsequence", title="Longest Palindromic Subsequence", diff="Medium",
  method="longestPalindromeSubseq",
  ask="Find the length of the longest subsequence (not necessarily contiguous) that is a palindrome.",
  cue="The chapter's One Family point: this is the LCS of the string and its reverse. Or directly, an interval DP over s[i..j] that looks at both ends.",
  brute="Check every subsequence: 2ⁿ.",
  approach="P[i][j] is the answer for s[i..j]. If s[i] == s[j], both ends belong to it: P[i][j] = P[i + 1][j - 1] + 2. Otherwise drop one end: max(P[i + 1][j], P[i][j - 1]). Single characters give 1. Fill with i decreasing so P[i + 1] is ready.",
  cx="O(n²) time, O(n) space with one row per i.",
  trap="Filling the table with i increasing. P[i][j] needs row i + 1, which would not be computed yet. The order is the T in SRTBOT: every subproblem must come after the ones it depends on.",
  py='''class Solution:
    def longestPalindromeSubseq(self, s: str) -> int:
        n = len(s)
        nxt = [0] * n                  # row i + 1 of the table
        for i in range(n - 1, -1, -1): # i decreasing: row i + 1 is ready
            cur = [0] * n
            cur[i] = 1
            for j in range(i + 1, n):
                cur[j] = nxt[j - 1] + 2 if s[i] == s[j] else max(nxt[j], cur[j - 1])
            nxt = cur
        return nxt[n - 1]''',
  java='''class Solution {
    public int longestPalindromeSubseq(String s) {
        int n = s.length();
        int[] next = new int[n], cur = new int[n];   // rows i + 1 and i
        for (int i = n - 1; i >= 0; i--) {           // i decreasing: row i + 1 is ready
            cur[i] = 1;
            for (int j = i + 1; j < n; j++)
                cur[j] = s.charAt(i) == s.charAt(j) ? next[j - 1] + 2 : Math.max(next[j], cur[j - 1]);
            int[] t = next; next = cur; cur = t;
        }
        return next[n - 1];
    }
}''')

prob(num=583, slug="delete-operation-for-two-strings", title="Delete Operation for Two Strings", diff="Medium",
  method="minDistance",
  ask="Find the fewest single-character deletions, from either string, that make two strings equal.",
  cue="Whatever survives the deletions is a common subsequence, and to delete as little as possible it should be the longest one. So the answer is (m - LCS) + (n - LCS).",
  brute="Try every pair of deletion sets: exponential.",
  approach="Compute the LCS length L exactly as in Longest Common Subsequence, then return m + n - 2L.",
  cx="O(m × n) time, O(n) space.",
  trap="Reaching for Edit Distance. With replacements allowed the answer is different; here only deletions exist, and a replacement would count as two of them.",
  py='''class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        prev = [0] * (len(word2) + 1)  # LCS, two rows
        for a in word1:
            cur = [0]
            for j, b in enumerate(word2, 1):
                cur.append(prev[j - 1] + 1 if a == b else max(prev[j], cur[j - 1]))
            prev = cur
        return len(word1) + len(word2) - 2 * prev[-1]   # delete everything outside the LCS''',
  java='''class Solution {
    public int minDistance(String word1, String word2) {
        int n = word2.length();
        int[] prev = new int[n + 1], cur = new int[n + 1];   // LCS, two rows
        for (int i = 1; i <= word1.length(); i++) {
            for (int j = 1; j <= n; j++)
                cur[j] = word1.charAt(i - 1) == word2.charAt(j - 1)
                       ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
            int[] t = prev; prev = cur; cur = t;
        }
        return word1.length() + n - 2 * prev[n];   // delete everything outside the LCS
    }
}''')

prob(num=97, slug="interleaving-string", title="Interleaving String", diff="Medium",
  method="isInterleave",
  ask="Decide whether s3 can be formed by interleaving s1 and s2, keeping each one's characters in their original order.",
  cue="An alignment of three strings where s3's position is determined by the other two: after using i characters of s1 and j of s2, you are at position i + j of s3. The table is over (i, j).",
  brute="Try every way to assign each character of s3 to s1 or s2: 2^len(s3).",
  approach="ok[i][j] says whether s1[:i] and s2[:j] interleave into s3[:i + j]. ok[i][j] is true if the last character came from s1 (ok[i - 1][j] and s1[i - 1] == s3[i + j - 1]) or from s2 (ok[i][j - 1] and s2[j - 1] == s3[i + j - 1]). Check the lengths first.",
  cx="O(m × n) time, O(n) space with one row, which is the follow-up's request.",
  trap="A greedy that always takes from s1 when it matches. With s1 = \"aab\", s2 = \"aac\", s3 = \"aacaab\", taking both a's from s1 first gets stuck; the table explores both choices.",
  py='''class Solution:
    def isInterleave(self, s1: str, s2: str, s3: str) -> bool:
        m, n = len(s1), len(s2)
        if m + n != len(s3):
            return False
        ok = [False] * (n + 1)         # one row: ok[j] for the current i
        for i in range(m + 1):
            for j in range(n + 1):
                if i == 0 and j == 0:
                    ok[j] = True
                    continue
                from_s1 = i > 0 and ok[j] and s1[i - 1] == s3[i + j - 1]      # ok[j] is still row i - 1
                from_s2 = j > 0 and ok[j - 1] and s2[j - 1] == s3[i + j - 1]
                ok[j] = from_s1 or from_s2
        return ok[n]''',
  java='''class Solution {
    public boolean isInterleave(String s1, String s2, String s3) {
        int m = s1.length(), n = s2.length();
        if (m + n != s3.length()) return false;
        boolean[] ok = new boolean[n + 1];   // one row: ok[j] for the current i
        for (int i = 0; i <= m; i++)
            for (int j = 0; j <= n; j++) {
                if (i == 0 && j == 0) { ok[j] = true; continue; }
                boolean fromS1 = i > 0 && ok[j] && s1.charAt(i - 1) == s3.charAt(i + j - 1);   // row i - 1
                boolean fromS2 = j > 0 && ok[j - 1] && s2.charAt(j - 1) == s3.charAt(i + j - 1);
                ok[j] = fromS1 || fromS2;
            }
        return ok[n];
    }
}''')

prob(num=673, slug="number-of-longest-increasing-subsequence", title="Number of Longest Increasing Subsequence", diff="Medium",
  method="findNumberOfLIS",
  ask="Count how many longest strictly increasing subsequences an array has.",
  cue="The quadratic LIS DP, carrying a second number per position: besides the best length ending at i, the number of ways to reach that length.",
  brute="Enumerate every subsequence: 2ⁿ.",
  approach="For each i, look at every j &lt; i with nums[j] &lt; nums[i]. If length[j] + 1 beats length[i], adopt it and set count[i] = count[j]; if it ties, add count[j] to count[i]. The answer adds up count[i] over every i whose length is the maximum.",
  cx="O(n²) time, O(n) space.",
  trap="Summing counts only at the last index. Longest subsequences can end anywhere; every position that reaches the maximum length contributes.",
  py='''class Solution:
    def findNumberOfLIS(self, nums: list[int]) -> int:
        n = len(nums)
        length, count = [1] * n, [1] * n   # best length ending at i, and how many reach it
        for i in range(n):
            for j in range(i):
                if nums[j] < nums[i]:
                    if length[j] + 1 > length[i]:
                        length[i], count[i] = length[j] + 1, count[j]
                    elif length[j] + 1 == length[i]:
                        count[i] += count[j]
        best = max(length)
        return sum(c for l, c in zip(length, count) if l == best)   # they can end anywhere''',
  java='''class Solution {
    public int findNumberOfLIS(int[] nums) {
        int n = nums.length, best = 0, total = 0;
        int[] length = new int[n], count = new int[n];   // best length ending at i, and how many
        for (int i = 0; i < n; i++) {
            length[i] = 1;
            count[i] = 1;
            for (int j = 0; j < i; j++) {
                if (nums[j] >= nums[i]) continue;
                if (length[j] + 1 > length[i]) { length[i] = length[j] + 1; count[i] = count[j]; }
                else if (length[j] + 1 == length[i]) count[i] += count[j];
            }
            best = Math.max(best, length[i]);
        }
        for (int i = 0; i < n; i++) if (length[i] == best) total += count[i];   // can end anywhere
        return total;
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=354, slug="russian-doll-envelopes", title="Russian Doll Envelopes", diff="Hard",
  method="maxEnvelopes",
  ask="An envelope fits inside another if both its width and its height are strictly smaller. Find the most envelopes you can nest.",
  cue="Two dimensions collapse to one: sort by width, and the nesting chain is an increasing subsequence of heights. With up to 10⁵ envelopes, it must be the n log n LIS.",
  brute="The O(n²) DP over sorted envelopes: 10¹⁰ steps at the limit.",
  approach="Sort by width ascending and, for equal widths, height descending. Then run the n log n LIS on the heights.",
  cx="O(n log n) time, O(n) space.",
  trap="Sorting equal widths by height ascending. Then [2, 3] and [2, 4] look like a valid chain of heights 3, 4, although equal widths cannot nest. Descending heights within a width make any increasing run take at most one envelope per width.",
  py='''from bisect import bisect_left

class Solution:
    def maxEnvelopes(self, envelopes: list[list[int]]) -> int:
        envelopes.sort(key=lambda e: (e[0], -e[1]))   # equal widths: taller first
        tails = []                     # n log n LIS on the heights
        for _, h in envelopes:
            i = bisect_left(tails, h)
            if i == len(tails):
                tails.append(h)
            else:
                tails[i] = h
        return len(tails)''',
  java='''import java.util.Arrays;

class Solution {
    public int maxEnvelopes(int[][] envelopes) {
        Arrays.sort(envelopes, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0])
                                                      : Integer.compare(b[1], a[1]));   // equal widths: taller first
        int[] tails = new int[envelopes.length];   // n log n LIS on the heights
        int size = 0;
        for (int[] e : envelopes) {
            int lo = 0, hi = size;
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (tails[mid] < e[1]) lo = mid + 1; else hi = mid;
            }
            tails[lo] = e[1];
            if (lo == size) size++;
        }
        return size;
    }
}''', check_args=False)

prob(num=115, slug="distinct-subsequences", title="Distinct Subsequences", diff="Hard",
  method="numDistinct",
  ask="Count the distinct ways to pick characters of s, in order, that spell t.",
  cue="An LCS-shaped table that counts. For the last character of s: either it is not used, or, if it equals t's last character, it is used as that character.",
  brute="Try every set of len(t) positions in s: C(len(s), len(t)).",
  approach="W[i][j] counts ways to spell t[:j] from s[:i]. W[i][0] = 1 (the empty target, one way). W[i][j] = W[i - 1][j], plus W[i - 1][j - 1] when s[i - 1] == t[j - 1]. With one row, update j from right to left so W[i - 1][j - 1] is still last row's value.",
  cx="O(len(s) × len(t)) time, O(len(t)) space.",
  trap="Updating the single row left to right. Then W[j - 1] already holds this row's value, and one character of s gets used twice. (In Java, some intermediate counts can exceed int; the wrap is harmless because the final answer is guaranteed to fit.)",
  py='''class Solution:
    def numDistinct(self, s: str, t: str) -> int:
        ways = [1] + [0] * len(t)      # ways[j]: ways to spell t[:j]; the empty target has one
        for c in s:
            for j in range(len(t), 0, -1):   # right to left: ways[j - 1] is last row's
                if c == t[j - 1]:
                    ways[j] += ways[j - 1]
        return ways[len(t)]''',
  java='''class Solution {
    public int numDistinct(String s, String t) {
        int[] ways = new int[t.length() + 1];   // ways[j]: ways to spell t[:j]
        ways[0] = 1;                             // the empty target has one
        for (char c : s.toCharArray())
            for (int j = t.length(); j >= 1; j--)   // right to left: ways[j - 1] is last row's
                if (c == t.charAt(j - 1)) ways[j] += ways[j - 1];
        return ways[t.length()];
    }
}''')

prob(num=10, slug="regular-expression-matching", title="Regular Expression Matching", diff="Hard",
  method="isMatch",
  ask="Decide whether a pattern with '.' (any one character) and '*' (zero or more of the preceding element) matches an entire string.",
  cue="An alignment of the string against the pattern, with one special column rule for '*': it either matches zero copies (skip the pair \"x*\" in the pattern) or one more copy (consume one string character and stay on the star).",
  brute="Plain recursion over those choices: exponential on inputs like nineteen a's followed by a b, against the pattern \"a*a*a*a*a*a*c\".",
  approach="M[i][j] says whether s[:i] matches p[:j]. M[0][0] is true. If p[j - 1] is '*': M[i][j] = M[i][j - 2] (zero copies) or (M[i - 1][j] and s[i - 1] matches p[j - 2]) (one more copy). Otherwise M[i][j] = M[i - 1][j - 1] and s[i - 1] matches p[j - 1], where a character matches if equal or the pattern has '.'.",
  cx="O(len(s) × len(p)) time and space.",
  trap="Row 0. A pattern like \"a*b*\" matches the empty string, so M[0][j] must be filled using the zero-copies rule; initializing only M[0][0] misses those.",
  py='''class Solution:
    def isMatch(self, s: str, p: str) -> bool:
        m, n = len(s), len(p)
        M = [[False] * (n + 1) for _ in range(m + 1)]
        M[0][0] = True
        for i in range(m + 1):         # i = 0 included: "a*b*" matches ""
            for j in range(1, n + 1):
                if p[j - 1] == "*":
                    M[i][j] = M[i][j - 2] or (i > 0 and M[i - 1][j] and p[j - 2] in (s[i - 1], "."))   # zero, or one more
                else:
                    M[i][j] = i > 0 and M[i - 1][j - 1] and p[j - 1] in (s[i - 1], ".")
        return M[m][n]''',
  java='''class Solution {
    public boolean isMatch(String s, String p) {
        int m = s.length(), n = p.length();
        boolean[][] M = new boolean[m + 1][n + 1];
        M[0][0] = true;
        for (int i = 0; i <= m; i++)   // i = 0 included: "a*b*" matches ""
            for (int j = 1; j <= n; j++) {
                if (p.charAt(j - 1) == '*')
                    M[i][j] = M[i][j - 2] || (i > 0 && M[i - 1][j] && matches(s.charAt(i - 1), p.charAt(j - 2)));   // zero, or one more
                else
                    M[i][j] = i > 0 && M[i - 1][j - 1] && matches(s.charAt(i - 1), p.charAt(j - 1));
            }
        return M[m][n];
    }

    private boolean matches(char c, char pc) { return pc == '.' || pc == c; }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(21)
def arr(lo, hi, nmin=1, nmax=9): return [R.randint(lo, hi) for _ in range(R.randint(nmin, nmax))]
def word(alpha, nmin, nmax): return "".join(R.choice(alpha) for _ in range(R.randint(nmin, nmax)))
def subseqs(s): return {"".join(c) for k in range(len(s) + 1) for c in combinations(s, k)}

def inc_subseqs(a):
    return [c for k in range(1, len(a) + 1) for c in combinations(a, k) if all(x < y for x, y in zip(c, c[1:]))]

def brute72(a, b):
    from functools import lru_cache
    @lru_cache(maxsize=None)
    def d(i, j):
        if i == 0 or j == 0: return i + j
        return min(d(i - 1, j) + 1, d(i, j - 1) + 1, d(i - 1, j - 1) + (a[i - 1] != b[j - 1]))
    return d(len(a), len(b))

def brute97(a, b, c):
    if len(a) + len(b) != len(c): return False
    n = len(c)
    for mask in range(1 << n):
        x = "".join(c[i] for i in range(n) if mask >> i & 1); y = "".join(c[i] for i in range(n) if not mask >> i & 1)
        if x == a and y == b: return True
    return False

def gen97():
    a, b = word("ab", 0, 4), word("ab", 0, 4)
    if R.random() < 0.6:
        c, i, j = [], 0, 0
        while i < len(a) or j < len(b):
            if j == len(b) or (i < len(a) and R.random() < 0.5): c.append(a[i]); i += 1
            else: c.append(b[j]); j += 1
        return [a, b, "".join(c)]
    return [a, b, word("ab", 0, 8)]

def brute673(a):
    runs = inc_subseqs(a); best = max(map(len, runs))
    idx_runs = [c for k in range(best, best + 1) for c in combinations(range(len(a)), k)
                if all(a[x] < a[y] for x, y in zip(c, c[1:]))]
    return len(idx_runs)

def gen354():
    return [[[R.randint(1, 6), R.randint(1, 6)] for _ in range(R.randint(1, 7))]]
def brute354(env):
    best = 0
    for k in range(1, len(env) + 1):
        for c in combinations(sorted(env), k):
            if all(p[0] < q[0] and p[1] < q[1] for p, q in zip(c, c[1:])): best = k
    return best

def brute115(s, t):
    return sum(1 for c in combinations(range(len(s)), len(t)) if "".join(s[i] for i in c) == t)

def gen10():
    s = word("ab", 1, 6)
    p = ""
    for _ in range(R.randint(1, 5)):
        p += R.choice("ab.")
        if R.random() < 0.4: p += "*"
    return [s, p]

BRUTE = {
  392:  (lambda: [word("abc", 0, 4), word("abc", 0, 10)], lambda s, t: s in subseqs(t)),
  300:  (lambda: [arr(-5, 5)], lambda a: max(map(len, inc_subseqs(a)))),
  1143: (lambda: [word("abc", 1, 7), word("abc", 1, 7)], lambda a, b: max(len(x) for x in subseqs(a) & subseqs(b))),
  72:   (lambda: [word("abc", 0, 6), word("abc", 0, 6)], brute72),
  5:    (lambda: [word("ab", 1, 10)], lambda s: True),
  647:  (lambda: [word("ab", 1, 10)], lambda s: sum(1 for i in range(len(s)) for j in range(i + 1, len(s) + 1) if s[i:j] == s[i:j][::-1])),
  516:  (lambda: [word("abc", 1, 9)], lambda s: max(len(x) for x in subseqs(s) if x == x[::-1])),
  583:  (lambda: [word("abc", 1, 6), word("abc", 1, 6)], lambda a, b: len(a) + len(b) - 2 * max(len(x) for x in subseqs(a) & subseqs(b))),
  97:   (gen97, brute97),
  673:  (lambda: [arr(-3, 3, 1, 8)], brute673),
  354:  (gen354, brute354),
  115:  (lambda: [word("ab", 1, 9), word("ab", 1, 3)], brute115),
  10:   (gen10, lambda s, p: re.fullmatch(p, s) is not None),
}
