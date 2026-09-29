# Chapter 8 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
# Solutions are in LeetCode's `class Solution` form so they paste straight into the judge.
import random, string

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

# ---------------------------------------------------------------- Easy
prob(num=125, slug="valid-palindrome", title="Valid Palindrome", diff="Easy",
  method="isPalindrome", sig="s",
  ask="Decide whether a string reads the same forwards and backwards once you ignore case and every character that is not a letter or a digit.",
  cue="You compare the first character with the last, the second with the second-to-last, and so on. Anything that pairs the two ends of a sequence is the opposite-ends shape from the Opposite Ends section.",
  brute="Build a cleaned, lowercased copy and compare it with its reverse. That is O(n) time too, but it needs O(n) extra memory for the copy, and interviewers usually ask for the version without it.",
  approach="Put i at the start and j at the end. Skip anything that is not a letter or digit on either side. When both point at real characters, they must match (ignoring case); if they do, move both inward. The discarded characters on the outside are already proved to match, which is the same argument as the pair-sum scan.",
  cx="O(n) time, since each step moves i or j inward. O(1) extra space.",
  trap="Moving both pointers when only one side is punctuation. Skip one side at a time, then compare. Also check i &lt; j inside the skipping, or a string like \".,\" walks off the end.",
  py='''class Solution:
    def isPalindrome(self, s: str) -> bool:
        i, j = 0, len(s) - 1
        while i < j:
            if not s[i].isalnum():
                i += 1
            elif not s[j].isalnum():
                j -= 1
            elif s[i].lower() != s[j].lower():
                return False
            else:
                i += 1
                j -= 1
        return True''',
  java='''class Solution {
    public boolean isPalindrome(String s) {
        int i = 0, j = s.length() - 1;
        while (i < j) {
            char a = s.charAt(i), b = s.charAt(j);
            if (!Character.isLetterOrDigit(a)) i++;
            else if (!Character.isLetterOrDigit(b)) j--;
            else if (Character.toLowerCase(a) != Character.toLowerCase(b)) return false;
            else { i++; j--; }
        }
        return true;
    }
}''')

prob(num=26, observe=lambda r, a: (r, a[0][:r]), slug="remove-duplicates-from-sorted-array", title="Remove Duplicates from Sorted Array", diff="Easy",
  method="removeDuplicates", sig="a",
  ask="Squeeze a sorted array in place so each distinct value appears once at the front, and return how many distinct values there are.",
  cue="\"In place\" plus \"keep some elements, drop others\" is the read-ahead, write-behind scan from the Same Direction section.",
  brute="Copy the distinct values into a new list, then copy them back. O(n) time but O(n) extra memory, which the problem forbids.",
  approach="A read pointer r visits every element; a write pointer w marks the end of the finished part. Because the array is sorted, a duplicate always sits right next to its first copy, so r only needs to compare against the last value written, nums[w - 1]. When it sees something new, it writes it at w and moves w forward.",
  cx="O(n) time, one pass. O(1) extra space.",
  trap="Comparing nums[r] with nums[r - 1] instead of nums[w - 1]. It happens to work here because the array is sorted, but it breaks the moment you adapt the code to \"allow each value at most twice\" (LeetCode 80), where you must compare against the written part.",
  py='''class Solution:
    def removeDuplicates(self, nums: list[int]) -> int:
        w = 1                          # nums[:w] is the finished, distinct part
        for r in range(1, len(nums)):
            if nums[r] != nums[w - 1]:
                nums[w] = nums[r]
                w += 1
        return w''',
  java='''class Solution {
    public int removeDuplicates(int[] nums) {
        int w = 1;                     // nums[0..w-1] is the finished, distinct part
        for (int r = 1; r < nums.length; r++) {
            if (nums[r] != nums[w - 1]) {
                nums[w] = nums[r];
                w++;
            }
        }
        return w;
    }
}''')

prob(num=283, observe=lambda r, a: a[0], slug="move-zeroes", title="Move Zeroes", diff="Easy",
  method="moveZeroes", sig="a",
  ask="Move every zero to the end of the array in place, keeping the other values in their original order.",
  cue="\"In place\" and \"keep the order of the ones you keep\" is again the read-ahead, write-behind scan.",
  brute="Collect the non-zero values into a new list, pad with zeros, and copy back. Correct, but O(n) extra memory.",
  approach="The write pointer w marks where the next non-zero value belongs. The read pointer r scans everything. Each non-zero value is swapped into position w, and w moves on. Swapping, rather than overwriting, means the zeros get pushed back as a side effect, so no second pass is needed.",
  cx="O(n) time, O(1) extra space.",
  trap="Overwriting instead of swapping and then forgetting to fill the tail with zeros. Either fix works; forgetting both leaves old values at the end.",
  py='''class Solution:
    def moveZeroes(self, nums: list[int]) -> None:
        w = 0                          # nums[:w] holds the non-zeros, in order
        for r in range(len(nums)):
            if nums[r] != 0:
                nums[w], nums[r] = nums[r], nums[w]
                w += 1''',
  java='''class Solution {
    public void moveZeroes(int[] nums) {
        int w = 0;                     // nums[0..w-1] holds the non-zeros, in order
        for (int r = 0; r < nums.length; r++) {
            if (nums[r] != 0) {
                int tmp = nums[w]; nums[w] = nums[r]; nums[r] = tmp;
                w++;
            }
        }
    }
}''')

prob(num=121, slug="best-time-to-buy-and-sell-stock", title="Best Time to Buy and Sell Stock", diff="Easy",
  method="maxProfit", sig="a",
  ask="Given a price for each day, find the biggest profit from buying on one day and selling on a later day (zero if no trade makes money).",
  cue="You need a pair i &lt; j that maximizes prices[j] - prices[i]. The left end of the pair only ever needs to be the cheapest day so far, so it can jump forward and never has to come back.",
  brute="Try every buy day with every later sell day: n(n-1)/2 pairs, so about 5 billion checks at n = 100,000. Too slow.",
  approach="Scan the days once. Keep the lowest price seen so far (the best day to have bought). On each day, the best profit from selling today is today's price minus that lowest price. Keep the largest of those. The left end of the window is the cheapest day, and it jumps to today whenever today is cheaper.",
  cx="O(n) time, O(1) space.",
  trap="Taking the overall maximum minus the overall minimum. The maximum might come before the minimum, and you cannot sell before you buy. On [3, 9, 1] that shortcut says 9 - 1 = 8, but the real answer is 6: buy at 3, sell at 9.",
  py='''class Solution:
    def maxProfit(self, prices: list[int]) -> int:
        lowest = prices[0]             # cheapest day to have bought, so far
        best = 0
        for p in prices:
            lowest = min(lowest, p)
            best = max(best, p - lowest)
        return best''',
  java='''class Solution {
    public int maxProfit(int[] prices) {
        int lowest = prices[0];        // cheapest day to have bought, so far
        int best = 0;
        for (int p : prices) {
            lowest = Math.min(lowest, p);
            best = Math.max(best, p - lowest);
        }
        return best;
    }
}''')

# ---------------------------------------------------------------- Medium
prob(num=167, slug="two-sum-ii-input-array-is-sorted", title="Two Sum II - Input Array Is Sorted", diff="Medium",
  method="twoSum", sig="a i",
  ask="In a sorted array, find the two positions whose values add up to a target, counting positions from 1. There is exactly one answer.",
  cue="Sorted array, find a pair with a given sum. This is the pair-sum scan from the Opposite Ends section, word for word.",
  brute="Check every pair: O(n²). Or, for each element, binary-search for its partner: O(n log n). Both ignore what the sorting gives you for free.",
  approach="Put i at the start and j at the end. If the sum is too small, the smallest value a[i] cannot be in the answer with anything left, so drop it (i += 1). If the sum is too big, drop the largest (j -= 1). This is the section's invariant: every discarded element is proved not to be part of any answer.",
  cx="O(n) time, O(1) space.",
  trap="Returning 0-based indices. The judge counts from 1, so add one to each.",
  py='''class Solution:
    def twoSum(self, numbers: list[int], target: int) -> list[int]:
        i, j = 0, len(numbers) - 1
        while i < j:
            s = numbers[i] + numbers[j]
            if s == target:
                return [i + 1, j + 1]  # the judge counts positions from 1
            if s < target:
                i += 1
            else:
                j -= 1''',
  java='''class Solution {
    public int[] twoSum(int[] numbers, int target) {
        int i = 0, j = numbers.length - 1;
        while (i < j) {
            int s = numbers[i] + numbers[j];
            if (s == target) return new int[]{i + 1, j + 1};  // positions from 1
            if (s < target) i++;
            else j--;
        }
        return new int[0];             // unreachable: exactly one answer exists
    }
}''')

prob(num=11, slug="container-with-most-water", title="Container With Most Water", diff="Medium",
  method="maxArea", sig="a",
  ask="Vertical lines stand at each position with the given heights. Pick two lines that, with the ground, hold the most water, and return that amount.",
  cue="You are choosing a pair of positions and the score depends on the distance between them. Start as wide as possible and move inward: opposite ends.",
  brute="Try every pair of lines: O(n²), about 5 billion pairs at n = 100,000.",
  approach="Start with the widest container, lines 0 and n-1. The water level is set by the shorter line. Now move the shorter line inward. Why is that safe? Any container that keeps the shorter line and swaps the other one is narrower, and its level can never rise above that same short line, so none of them can win. The shorter line is finished, exactly like a discarded element in pair sum.",
  cx="O(n) time, O(1) space.",
  trap="Moving the taller line. It feels like keeping the best wall, but it throws away containers that could win. The chapter's Build exercise measures this: it gets roughly half of random inputs wrong.",
  py='''class Solution:
    def maxArea(self, height: list[int]) -> int:
        i, j = 0, len(height) - 1
        best = 0
        while i < j:
            best = max(best, (j - i) * min(height[i], height[j]))
            if height[i] < height[j]:
                i += 1                 # the shorter line can do no better
            else:
                j -= 1
        return best''',
  java='''class Solution {
    public int maxArea(int[] height) {
        int i = 0, j = height.length - 1, best = 0;
        while (i < j) {
            best = Math.max(best, (j - i) * Math.min(height[i], height[j]));
            if (height[i] < height[j]) i++;   // the shorter line can do no better
            else j--;
        }
        return best;
    }
}''')

prob(num=15, observe=lambda r, a: sorted(r), slug="3sum", title="3Sum", diff="Medium",
  method="threeSum", sig="a",
  ask="Find every distinct triple of values in an array that adds up to zero. The same triple must not be reported twice.",
  cue="Three numbers with a target sum. Fix one of them and the other two are a pair-sum problem, which the Opposite Ends section's \"three pointers is two pointers with a loop around it\" covers.",
  brute="Three nested loops over all triples: O(n³). With n = 3,000 that is about 4.5 billion triples.",
  approach="Sort the array. For each position k, run the pair-sum scan on the part to its right with target -nums[k]. To avoid repeats, skip k when its value equals the previous k's value, and after recording a triple, move i past every copy of the value it used.",
  cx="O(n²) time: n choices of k, each followed by one O(n) scan. The sort is O(n log n) and is dominated. O(1) extra space apart from the output and the sort.",
  trap="Duplicates. Putting the triples in a set works but hides the real fix, and interviewers ask for it. Skip equal values for k and for i, and the output has no repeats by construction.",
  py='''class Solution:
    def threeSum(self, nums: list[int]) -> list[list[int]]:
        nums.sort()
        out = []
        for k in range(len(nums) - 2):
            if k > 0 and nums[k] == nums[k - 1]:
                continue               # same first value, same triples
            i, j = k + 1, len(nums) - 1
            while i < j:
                s = nums[k] + nums[i] + nums[j]
                if s < 0:
                    i += 1
                elif s > 0:
                    j -= 1
                else:
                    out.append([nums[k], nums[i], nums[j]])
                    i += 1
                    while i < j and nums[i] == nums[i - 1]:
                        i += 1         # skip copies of the value used
        return out''',
  java='''import java.util.*;

class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> out = new ArrayList<>();
        for (int k = 0; k < nums.length - 2; k++) {
            if (k > 0 && nums[k] == nums[k - 1]) continue;   // same first value, same triples
            int i = k + 1, j = nums.length - 1;
            while (i < j) {
                int s = nums[k] + nums[i] + nums[j];
                if (s < 0) i++;
                else if (s > 0) j--;
                else {
                    out.add(List.of(nums[k], nums[i], nums[j]));
                    i++;
                    while (i < j && nums[i] == nums[i - 1]) i++;   // skip copies
                }
            }
        }
        return out;
    }
}''')

prob(num=75, observe=lambda r, a: a[0], slug="sort-colors", title="Sort Colors", diff="Medium",
  method="sortColors", sig="a",
  ask="An array holds only 0s, 1s and 2s. Sort it in place in one pass, without calling a library sort.",
  cue="Three kinds of value, in place, one pass. This is the Dutch national flag from the Dutch National Flag section.",
  brute="Count the 0s, 1s and 2s, then overwrite the array. That is two passes and is a fine answer, but the problem's follow-up asks for one.",
  approach="Keep three boundaries: everything before lo is 0, everything from lo to i is 1, everything after hi is 2, and i to hi is not examined yet. Look at nums[i]. A 0 swaps to lo and both move on. A 1 is already in place, so i moves on. A 2 swaps to hi and only hi moves, because the value that came back from hi has not been examined yet.",
  cx="O(n) time, at most n iterations. O(1) space.",
  trap="Advancing i after swapping with hi. The value that arrived from the right end has never been looked at, so it could be a 0 that then stays in the wrong place.",
  py='''class Solution:
    def sortColors(self, nums: list[int]) -> None:
        lo, i, hi = 0, 0, len(nums) - 1
        while i <= hi:
            if nums[i] == 0:
                nums[lo], nums[i] = nums[i], nums[lo]
                lo += 1
                i += 1
            elif nums[i] == 2:
                nums[i], nums[hi] = nums[hi], nums[i]
                hi -= 1                # i stays: the new nums[i] is unexamined
            else:
                i += 1''',
  java='''class Solution {
    public void sortColors(int[] nums) {
        int lo = 0, i = 0, hi = nums.length - 1;
        while (i <= hi) {
            if (nums[i] == 0) {
                int t = nums[lo]; nums[lo] = nums[i]; nums[i] = t;
                lo++; i++;
            } else if (nums[i] == 2) {
                int t = nums[hi]; nums[hi] = nums[i]; nums[i] = t;
                hi--;                  // i stays: the new nums[i] is unexamined
            } else {
                i++;
            }
        }
    }
}''')

prob(num=567, slug="permutation-in-string", title="Permutation in String", diff="Medium",
  method="checkInclusion", sig="s s",
  ask="Decide whether some rearrangement of the first string appears as a block of consecutive characters inside the second string.",
  cue="The block you are looking for always has the same length as the first string. A fixed length means a fixed window, from the Fixed Window section.",
  brute="For every starting position, take the block of the right length, count its letters, and compare with the first string's counts. That is O(n·k) for a block of length k.",
  approach="Count the letters of s1 once. Slide a window of exactly len(s1) across s2, keeping letter counts for the window: add the letter entering on the right and remove the one leaving on the left. Whenever the two count arrays are equal, the window is a rearrangement of s1.",
  cx="O(26·n) = O(n) time, since comparing two 26-letter count arrays is constant work. O(1) space.",
  trap="The off-by-one on which letter leaves. When the right end is at position r, the letter leaving is s2[r - k], and it leaves only once r ≥ k. The Fixed Window section is about exactly this line.",
  py='''class Solution:
    def checkInclusion(self, s1: str, s2: str) -> bool:
        k = len(s1)
        if k > len(s2):
            return False
        need, have = [0] * 26, [0] * 26
        for c in s1:
            need[ord(c) - 97] += 1
        for r, c in enumerate(s2):
            have[ord(c) - 97] += 1
            if r >= k:
                have[ord(s2[r - k]) - 97] -= 1   # the letter leaving the window
            if have == need:
                return True
        return False''',
  java='''import java.util.Arrays;

class Solution {
    public boolean checkInclusion(String s1, String s2) {
        int k = s1.length();
        if (k > s2.length()) return false;
        int[] need = new int[26], have = new int[26];
        for (char c : s1.toCharArray()) need[c - 'a']++;
        for (int r = 0; r < s2.length(); r++) {
            have[s2.charAt(r) - 'a']++;
            if (r >= k) have[s2.charAt(r - k) - 'a']--;   // the letter leaving the window
            if (Arrays.equals(have, need)) return true;
        }
        return false;
    }
}''')

prob(num=3, slug="longest-substring-without-repeating-characters", title="Longest Substring Without Repeating Characters", diff="Medium",
  method="lengthOfLongestSubstring", sig="s",
  ask="Find the length of the longest block of consecutive characters in a string in which no character appears twice.",
  cue="\"Longest block of consecutive items such that some condition holds\", where breaking the condition can be fixed by trimming the left end. That is the variable window from the Variable Window section.",
  brute="Check every block: O(n²) blocks, each checked for repeats. Even with a set that is O(n²), about 2.5 billion steps at n = 50,000.",
  approach="Grow the window by one character on the right. If that character is already inside the window, shrink from the left until it is not. The window is now repeat-free, so record its length. Each character enters once and leaves at most once, which is the 2n bound the Variable Window section proves.",
  cx="O(n) time. O(min(n, σ)) space for the set, where σ is the number of possible characters (128 here). Not O(1), as the chapter's cost table warns.",
  trap="Jumping left to one past the repeat's earlier position without checking that position is still inside the window. On \"abba\" the second 'a' would drag left backwards. The shrink-while version below cannot make that mistake.",
  py='''class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        seen = set()                   # the characters inside the window
        left = best = 0
        for right, c in enumerate(s):
            while c in seen:
                seen.remove(s[left])
                left += 1
            seen.add(c)
            best = max(best, right - left + 1)
        return best''',
  java='''class Solution {
    public int lengthOfLongestSubstring(String s) {
        boolean[] seen = new boolean[128];   // the characters inside the window
        int left = 0, best = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            while (seen[c]) {
                seen[s.charAt(left)] = false;
                left++;
            }
            seen[c] = true;
            best = Math.max(best, right - left + 1);
        }
        return best;
    }
}''')

prob(num=209, slug="minimum-size-subarray-sum", title="Minimum Size Subarray Sum", diff="Medium",
  method="minSubArrayLen", sig="i a",
  ask="Given positive numbers and a target, find the length of the shortest block of consecutive numbers whose sum is at least the target (0 if none).",
  cue="Shortest consecutive block meeting a sum condition, and every number is positive. Positive values are what make the window legal: adding on the right only raises the sum, removing on the left only lowers it.",
  brute="Sum every block: O(n²) with a running sum.",
  approach="Grow the window on the right, adding to a running total. As long as the total reaches the target, record the length and shrink from the left, subtracting as you go. You stop shrinking the moment the total drops below the target, because any shorter block ending here would be smaller still.",
  cx="O(n) time, each element enters and leaves once. O(1) space.",
  trap="Using this on arrays that can contain negative numbers. Then removing an element can raise the sum, and the window gives wrong answers. The section on windows that do not shrink monotonically shows the counterexamples; Chapter 9's prefix sums are the fix.",
  py='''class Solution:
    def minSubArrayLen(self, target: int, nums: list[int]) -> int:
        left = total = 0
        best = len(nums) + 1           # "none found yet"
        for right, x in enumerate(nums):
            total += x
            while total >= target:
                best = min(best, right - left + 1)
                total -= nums[left]
                left += 1
        return best if best <= len(nums) else 0''',
  java='''class Solution {
    public int minSubArrayLen(int target, int[] nums) {
        int left = 0, total = 0, best = nums.length + 1;   // "none found yet"
        for (int right = 0; right < nums.length; right++) {
            total += nums[right];
            while (total >= target) {
                best = Math.min(best, right - left + 1);
                total -= nums[left];
                left++;
            }
        }
        return best <= nums.length ? best : 0;
    }
}''')

prob(num=424, slug="longest-repeating-character-replacement", title="Longest Repeating Character Replacement", diff="Medium",
  method="characterReplacement", sig="s i",
  ask="In a string of capital letters you may change at most k characters to any letter. Find the length of the longest block of identical letters you can end up with.",
  cue="Longest consecutive block that can be \"fixed\" within a budget. Too many repairs needed means trim the left end: variable window.",
  brute="For every block, count its most common letter; the block works if its length minus that count is at most k. O(n²) blocks.",
  approach="In any window, the cheapest fix is to keep the most common letter and repaint the rest, so the window costs (length - most common count) repaints. Grow the window on the right. While that cost exceeds k, shrink from the left. Every window you keep is fixable, so the longest one is the answer.",
  cx="O(26·n) = O(n) time, because finding the largest of 26 counts is constant work. O(1) space.",
  trap="Tracking the most common letter by its identity instead of its count, and getting lost when the left end removes it. Count all 26 letters and take the largest count each time, as below. (Faster versions keep a stale maximum on purpose; get this one right first.)",
  py='''class Solution:
    def characterReplacement(self, s: str, k: int) -> int:
        count = [0] * 26               # letter counts inside the window
        left = best = 0
        for right, c in enumerate(s):
            count[ord(c) - 65] += 1
            while (right - left + 1) - max(count) > k:   # repaints needed > k
                count[ord(s[left]) - 65] -= 1
                left += 1
            best = max(best, right - left + 1)
        return best''',
  java='''class Solution {
    public int characterReplacement(String s, int k) {
        int[] count = new int[26];     // letter counts inside the window
        int left = 0, best = 0;
        for (int right = 0; right < s.length(); right++) {
            count[s.charAt(right) - 'A']++;
            while ((right - left + 1) - max(count) > k) {   // repaints needed > k
                count[s.charAt(left) - 'A']--;
                left++;
            }
            best = Math.max(best, right - left + 1);
        }
        return best;
    }

    private int max(int[] a) {
        int m = 0;
        for (int x : a) m = Math.max(m, x);
        return m;
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=42, slug="trapping-rain-water", title="Trapping Rain Water", diff="Hard",
  method="trap", sig="a",
  ask="Bars of the given heights stand side by side. After rain, water collects in the dips between them. Return how much water is trapped.",
  cue="The water above a bar depends on the tallest bar to its left and the tallest to its right. Two sides that each carry information inward is the opposite-ends shape.",
  brute="For each bar, scan left for the tallest bar and right for the tallest bar; the water above it is min(left tallest, right tallest) - its height. O(n²). Storing both maxima in two arrays first makes it O(n) time and O(n) space.",
  approach="Put i at the left end and j at the right, and remember the tallest bar seen from each side. Whichever side is lower is the one you can settle. If height[i] &lt; height[j], the right side already has a wall at least height[j] tall, so the water at i is decided by the left maximum alone: add left_max - height[i] and move i. Otherwise do the same from the right. Each bar is settled once, and never revisited, for the same reason a discarded element never is.",
  cx="O(n) time, O(1) space.",
  trap="Believing the lower side is settled without saying why. Write the one sentence out: the other side has a wall at least this tall, so this side's own maximum is the binding one. That sentence is what the interviewer is checking.",
  py='''class Solution:
    def trap(self, height: list[int]) -> int:
        i, j = 0, len(height) - 1
        left_max = right_max = water = 0
        while i < j:
            if height[i] < height[j]:  # right side has a taller wall: settle i
                left_max = max(left_max, height[i])
                water += left_max - height[i]
                i += 1
            else:                      # left side has a wall at least as tall: settle j
                right_max = max(right_max, height[j])
                water += right_max - height[j]
                j -= 1
        return water''',
  java='''class Solution {
    public int trap(int[] height) {
        int i = 0, j = height.length - 1, leftMax = 0, rightMax = 0, water = 0;
        while (i < j) {
            if (height[i] < height[j]) {        // right side has a taller wall: settle i
                leftMax = Math.max(leftMax, height[i]);
                water += leftMax - height[i];
                i++;
            } else {                            // left side is at least as tall: settle j
                rightMax = Math.max(rightMax, height[j]);
                water += rightMax - height[j];
                j--;
            }
        }
        return water;
    }
}''')

prob(num=76, slug="minimum-window-substring", title="Minimum Window Substring", diff="Hard",
  method="minWindow", sig="s s",
  ask="Find the shortest block of consecutive characters in s that contains every character of t, counting repeats (return an empty string if there is none).",
  cue="Shortest consecutive block satisfying a covering condition. Adding characters can only help the cover, removing can only hurt: variable window, the \"shortest\" flavour, like Minimum Size Subarray Sum.",
  brute="Check every block against t's letter counts: O(n²) blocks times the check.",
  approach="Keep need[c] = how many more copies of c the window still needs, and missing = how many characters of t are not yet covered. Grow the window on the right; when a character that was still needed enters, missing drops. When missing reaches 0, the window covers t: record it if it is the shortest so far, then shrink from the left until it stops covering. A negative need[c] means the window has spare copies of c.",
  cx="O(n + m) time for s of length n and t of length m, since each character of s enters and leaves once. O(1) space for a 128-entry count table.",
  trap="Tracking coverage by comparing two whole count tables on every step. It works, but costs 128 per step. The single missing counter turns the \"does it cover?\" test into one comparison.",
  py='''class Solution:
    def minWindow(self, s: str, t: str) -> str:
        need = [0] * 128               # copies of each character still needed
        for c in t:
            need[ord(c)] += 1
        missing = len(t)
        left, best_start, best_len = 0, 0, len(s) + 1
        for right, c in enumerate(s):
            if need[ord(c)] > 0:
                missing -= 1
            need[ord(c)] -= 1          # negative means a spare copy in the window
            while missing == 0:        # the window covers t: record, then shrink
                if right - left + 1 < best_len:
                    best_start, best_len = left, right - left + 1
                out = ord(s[left])
                need[out] += 1
                if need[out] > 0:
                    missing += 1       # we dropped a character we needed
                left += 1
        return "" if best_len > len(s) else s[best_start:best_start + best_len]''',
  java='''class Solution {
    public String minWindow(String s, String t) {
        int[] need = new int[128];     // copies of each character still needed
        for (char c : t.toCharArray()) need[c]++;
        int missing = t.length(), left = 0, bestStart = 0, bestLen = s.length() + 1;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (need[c] > 0) missing--;
            need[c]--;                 // negative means a spare copy in the window
            while (missing == 0) {     // the window covers t: record, then shrink
                if (right - left + 1 < bestLen) {
                    bestStart = left;
                    bestLen = right - left + 1;
                }
                char out = s.charAt(left);
                need[out]++;
                if (need[out] > 0) missing++;   // we dropped a character we needed
                left++;
            }
        }
        return bestLen > s.length() ? "" : s.substring(bestStart, bestStart + bestLen);
    }
}''')

prob(num=41, slug="first-missing-positive", title="First Missing Positive", diff="Hard",
  method="firstMissingPositive", sig="a",
  ask="Find the smallest positive whole number that does not appear in an unsorted array, in O(n) time and O(1) extra space.",
  cue="The answer is between 1 and n + 1, so every value that matters has a natural home: value v belongs at index v - 1. \"The value tells you the index\" is cyclic placement, from the Same Direction section.",
  brute="Sort and scan: O(n log n). Or put everything in a set and test 1, 2, 3, …: O(n) time but O(n) space. The problem rules out both.",
  approach="Walk through the array. While the current value v is between 1 and n and its home slot does not already hold v, swap it home. Values outside 1..n are ignored; they can never be the answer's neighbours. After this pass, the first index i where nums[i] != i + 1 gives the answer i + 1. If every slot is correct, the answer is n + 1.",
  cx="O(n) time: every swap puts one value in its final home, so there are at most n swaps in total, even though there is a loop inside a loop. O(1) extra space.",
  trap="Two, one per language family. Without the \"home slot already holds v\" check, a duplicate swaps with itself forever. And in Python, the one-line swap nums[i], nums[nums[i] - 1] = nums[nums[i] - 1], nums[i] is wrong: nums[i] is assigned first, so the second index is computed from the new value. Save v first, as below.",
  py='''class Solution:
    def firstMissingPositive(self, nums: list[int]) -> int:
        n = len(nums)
        for i in range(n):
            # value v belongs at index v - 1; keep sending nums[i] home
            while 1 <= nums[i] <= n and nums[nums[i] - 1] != nums[i]:
                v = nums[i]
                nums[i], nums[v - 1] = nums[v - 1], v
        for i in range(n):
            if nums[i] != i + 1:
                return i + 1
        return n + 1''',
  java='''class Solution {
    public int firstMissingPositive(int[] nums) {
        int n = nums.length;
        for (int i = 0; i < n; i++) {
            // value v belongs at index v - 1; keep sending nums[i] home
            while (nums[i] >= 1 && nums[i] <= n && nums[nums[i] - 1] != nums[i]) {
                int v = nums[i];
                nums[i] = nums[v - 1];
                nums[v - 1] = v;
            }
        }
        for (int i = 0; i < n; i++) {
            if (nums[i] != i + 1) return i + 1;
        }
        return n + 1;
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
from itertools import combinations
R = random.Random(8)
def arr(lo, hi, nmin=0, nmax=9): return [R.randint(lo, hi) for _ in range(R.randint(nmin, nmax))]
def word(alpha, nmin=0, nmax=10): return "".join(R.choice(alpha) for _ in range(R.randint(nmin, nmax)))

def gen167():
    while True:
        a = sorted(arr(-8, 8, 2, 9)); t = R.randint(-12, 12)
        pairs = [(i, j) for i, j in combinations(range(len(a)), 2) if a[i] + a[j] == t]
        if len(pairs) == 1: return [a, t]

def brute_window(s, t):
    from collections import Counter
    need = Counter(t)
    for L in range(1, len(s) + 1):
        for i in range(len(s) - L + 1):
            if not need - Counter(s[i:i + L]): return s[i:i + L]
    return ""

def brute_repl(s, k):
    from collections import Counter
    best = 0
    for i in range(len(s)):
        for j in range(i + 1, len(s) + 1):
            if j - i - max(Counter(s[i:j]).values()) <= k: best = max(best, j - i)
    return best

def brute_trap(h):
    return sum(max(0, min(max(h[:i + 1]), max(h[i:])) - h[i]) for i in range(len(h)))

def brute_minlen(t, a):
    L = [j - i for i in range(len(a)) for j in range(i + 1, len(a) + 1) if sum(a[i:j]) >= t]
    return min(L) if L else 0

def brute_longest(s):
    return max([j - i for i in range(len(s)) for j in range(i + 1, len(s) + 1) if len(set(s[i:j])) == j - i] or [0])

PRINTABLE = string.ascii_letters[:6] + string.digits[:3] + " ,.:!A"
BRUTE = {
  125: (lambda: [word(PRINTABLE, 1, 12) if R.random() < .5 else (lambda w: w + w[::-1][R.randint(0, 1):])(word("aAbB1 ,", 0, 6))],
        lambda s: (lambda c: c == c[::-1])([x.lower() for x in s if x.isalnum()])),
  26:  (lambda: [sorted(arr(-3, 3, 1, 9))], lambda a: (len(set(a)), sorted(set(a)))),
  283: (lambda: [arr(0, 3, 1, 9)], lambda a: [x for x in a if x] + [0] * a.count(0)),
  121: (lambda: [arr(0, 9, 1, 9)], lambda p: max([p[j] - p[i] for i in range(len(p)) for j in range(i, len(p))])),
  167: (gen167, lambda a, t: [[i + 1, j + 1] for i, j in combinations(range(len(a)), 2) if a[i] + a[j] == t][0]),
  11:  (lambda: [arr(0, 9, 2, 9)], lambda h: max((j - i) * min(h[i], h[j]) for i, j in combinations(range(len(h)), 2))),
  15:  (lambda: [arr(-4, 4, 0, 9)], lambda a: sorted(map(list, {tuple(sorted(c)) for c in combinations(a, 3) if sum(c) == 0}))),
  75:  (lambda: [arr(0, 2, 1, 9)], lambda a: sorted(a)),
  567: (lambda: [word("abc", 1, 4), word("abc", 1, 9)],
        lambda p, s: any(sorted(s[i:i + len(p)]) == sorted(p) for i in range(len(s) - len(p) + 1))),
  3:   (lambda: [word("ab c1", 0, 10)], brute_longest),
  209: (lambda: [R.randint(1, 15), arr(1, 5, 1, 9)], brute_minlen),
  424: (lambda: [word("ABC", 1, 10), R.randint(0, 3)], brute_repl),
  42:  (lambda: [arr(0, 5, 1, 10)], brute_trap),
  76:  (lambda: [word("aAbc", 1, 10), word("aAbc", 1, 3)], brute_window),
  41:  (lambda: [arr(-2, 8, 1, 8)], lambda a: next(x for x in range(1, len(a) + 2) if x not in a)),
}
