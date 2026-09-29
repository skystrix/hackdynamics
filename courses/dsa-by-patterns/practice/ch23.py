# Chapter 23 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
# Every brute force here searches all choices, so a wrong greedy rule cannot pass by agreeing with itself.
import random
from collections import Counter
from functools import lru_cache
from itertools import combinations, permutations, product

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

# ---------------------------------------------------------------- Easy
prob(num=455, slug="assign-cookies", title="Assign Cookies", diff="Easy",
  method="findContentChildren",
  ask="Each child needs a cookie of at least some size, and each cookie can go to one child. Maximize the number of satisfied children.",
  cue="Satisfy the least greedy child with the smallest cookie that works. The exchange argument from Two Ways to Prove a Greedy Correct: any optimal assignment can be rearranged to use that pairing without losing a child.",
  brute="Try every assignment of cookies to children: factorial.",
  approach="Sort both lists. Walk the cookies from smallest to largest with a pointer into the children: whenever the current cookie satisfies the current (least greedy remaining) child, give it and move to the next child. A cookie too small for this child is too small for everyone after, so skip it.",
  cx="O(n log n + m log m) time for the sorts, O(1) extra space.",
  trap="Giving the biggest cookie to the least greedy child. It satisfies them, but wastes a cookie that a greedier child needed.",
  py='''class Solution:
    def findContentChildren(self, g: list[int], s: list[int]) -> int:
        g.sort()
        s.sort()
        child = 0
        for cookie in s:               # smallest cookie first
            if child < len(g) and cookie >= g[child]:
                child += 1             # the least greedy child left takes it
        return child''',
  java='''import java.util.Arrays;

class Solution {
    public int findContentChildren(int[] g, int[] s) {
        Arrays.sort(g);
        Arrays.sort(s);
        int child = 0;
        for (int cookie : s)           // smallest cookie first
            if (child < g.length && cookie >= g[child]) child++;   // least greedy child takes it
        return child;
    }
}''', check_args=False)

prob(num=860, slug="lemonade-change", title="Lemonade Change", diff="Easy",
  method="lemonadeChange",
  ask="Lemonade costs 5. Customers pay with 5, 10 or 20 bills in order, and you start with no change. Decide whether you can give every customer correct change.",
  cue="Only one decision exists: change for a 20 can be 10 + 5 or 5 + 5 + 5. Prefer 10 + 5, because 5s are the more useful bill, needed for every 10 and every 20, while 10s are only ever useful for 20s.",
  brute="At each 20, try both ways of making change and search: exponential in the number of 20s.",
  approach="Count your 5s and 10s. A 5 needs nothing. A 10 needs one 5. A 20 takes a 10 and a 5 if you have both, otherwise three 5s. If the needed bills are missing, answer false.",
  cx="O(n) time, O(1) space.",
  trap="Paying a 20 with three 5s while a 10 is available. It works now and fails on the next 10, which cannot be changed without a 5.",
  py='''class Solution:
    def lemonadeChange(self, bills: list[int]) -> bool:
        fives = tens = 0
        for b in bills:
            if b == 5:
                fives += 1
            elif b == 10:
                if not fives:
                    return False
                fives, tens = fives - 1, tens + 1
            elif tens and fives:       # a 20: keep the 5s, they are more useful
                tens, fives = tens - 1, fives - 1
            elif fives >= 3:
                fives -= 3
            else:
                return False
        return True''',
  java='''class Solution {
    public boolean lemonadeChange(int[] bills) {
        int fives = 0, tens = 0;
        for (int b : bills) {
            if (b == 5) fives++;
            else if (b == 10) {
                if (fives == 0) return false;
                fives--; tens++;
            } else if (tens > 0 && fives > 0) { tens--; fives--; }   // keep the 5s
            else if (fives >= 3) fives -= 3;
            else return false;
        }
        return true;
    }
}''')

prob(num=1005, slug="maximize-sum-of-array-after-k-negations", title="Maximize Sum Of Array After K Negations", diff="Easy",
  method="largestSumAfterKNegations",
  ask="Negate exactly k elements (the same element may be negated repeatedly) to make the array's sum as large as possible.",
  cue="Each flip should gain as much as possible. Flipping the most negative number gains the most; once no negatives remain, spare flips cancel in pairs, and an odd one left over should hit the number closest to zero.",
  brute="Try every sequence of k flips: nᵏ.",
  approach="Sort. Walk from the smallest value, flipping negatives while k lasts. If k is still odd afterwards, flip the element with the smallest absolute value once. Return the sum.",
  cx="O(n log n) time, O(1) extra space.",
  trap="Flipping the smallest element of the original sorted order when k is left over. After the negatives were flipped, the smallest absolute value may be one of them, so take the minimum again.",
  py='''class Solution:
    def largestSumAfterKNegations(self, nums: list[int], k: int) -> int:
        nums.sort()
        for i in range(len(nums)):
            if k and nums[i] < 0:
                nums[i] = -nums[i]     # the most negative first: the biggest gain
                k -= 1
        if k % 2:                      # an odd flip is left: spend it where it costs least
            return sum(nums) - 2 * min(nums)
        return sum(nums)''',
  java='''import java.util.Arrays;

class Solution {
    public int largestSumAfterKNegations(int[] nums, int k) {
        Arrays.sort(nums);
        for (int i = 0; i < nums.length && k > 0 && nums[i] < 0; i++, k--)
            nums[i] = -nums[i];        // the most negative first: the biggest gain
        int sum = 0, min = Integer.MAX_VALUE;
        for (int x : nums) { sum += x; min = Math.min(min, x); }
        return k % 2 == 1 ? sum - 2 * min : sum;   // an odd flip left: spend it cheaply
    }
}''', check_args=False)

# ---------------------------------------------------------------- Medium
prob(num=55, slug="jump-game", title="Jump Game", diff="Medium",
  method="canJump",
  ask="From position i you may jump up to nums[i] steps forward. Starting at position 0, decide whether you can reach the last position.",
  cue="You never need to know which jumps you take, only how far you can get. Track the furthest reachable position; it only grows.",
  brute="Search every jump choice: exponential without memoization, O(n²) with a reachable-positions table.",
  approach="Walk the positions keeping reach, the furthest position reachable so far. If the current position is beyond reach, it cannot be reached, so answer false. Otherwise update reach = max(reach, i + nums[i]). If the walk finishes, the end was reachable.",
  cx="O(n) time, O(1) space.",
  trap="Stopping at the first 0. A 0 is only a dead end if nothing before it can jump past it.",
  py='''class Solution:
    def canJump(self, nums: list[int]) -> bool:
        reach = 0                      # the furthest position reachable so far
        for i, x in enumerate(nums):
            if i > reach:
                return False           # i itself cannot be reached
            reach = max(reach, i + x)
        return True''',
  java='''class Solution {
    public boolean canJump(int[] nums) {
        int reach = 0;                 // the furthest position reachable so far
        for (int i = 0; i < nums.length; i++) {
            if (i > reach) return false;   // i itself cannot be reached
            reach = Math.max(reach, i + nums[i]);
        }
        return true;
    }
}''')

prob(num=45, slug="jump-game-ii", title="Jump Game II", diff="Medium",
  method="jump",
  ask="Same jumps as Jump Game, with the end guaranteed reachable. Find the fewest jumps.",
  cue="Breadth-first search without a queue: the positions reachable in j jumps form one contiguous window, and the next window runs from the position after it to the furthest point any of its positions can reach.",
  brute="BFS over positions, or a DP where best[i] is the fewest jumps to i: O(n²).",
  approach="Keep the end of the current window and the furthest reach found inside it. Walk i from 0 to n - 2, updating the furthest reach. When i reaches the end of the current window, you must jump: count one jump and make the furthest reach the new window's end.",
  cx="O(n) time, O(1) space.",
  trap="Walking i all the way to n - 1. Arriving at the last position does not need another jump, and counting one there gives an answer one too high whenever the window ends exactly at the last index.",
  py='''class Solution:
    def jump(self, nums: list[int]) -> int:
        jumps = window_end = furthest = 0
        for i in range(len(nums) - 1): # not the last index: no jump needed from there
            furthest = max(furthest, i + nums[i])
            if i == window_end:        # the current window is used up: jump
                jumps += 1
                window_end = furthest
        return jumps''',
  java='''class Solution {
    public int jump(int[] nums) {
        int jumps = 0, windowEnd = 0, furthest = 0;
        for (int i = 0; i < nums.length - 1; i++) {   // no jump needed from the last index
            furthest = Math.max(furthest, i + nums[i]);
            if (i == windowEnd) {      // the current window is used up: jump
                jumps++;
                windowEnd = furthest;
            }
        }
        return jumps;
    }
}''')

prob(num=134, slug="gas-station", title="Gas Station", diff="Medium",
  method="canCompleteCircuit",
  ask="Stations on a circle each give some gas, and driving to the next costs some gas. Find the station to start from to drive the full circle, or -1 (the answer is unique when it exists).",
  cue="Two facts make it greedy. If total gas is at least total cost, some start works. And if you run dry going from start s to station i, no station between s and i can be the start either, so you can jump the start to i + 1.",
  brute="Simulate from every start: O(n²), 10¹⁰ at n = 10⁵.",
  approach="If sum(gas) &lt; sum(cost), return -1. Otherwise walk once with a tank starting at 0. Add gas[i] - cost[i]; if the tank goes negative, the start must be after i, so set start = i + 1 and empty the tank. Return start.",
  cx="O(n) time, O(1) space.",
  trap="Believing the jump skips a valid start. Every station passed since the last reset was reached with a tank of at least 0, so starting at any of them would arrive at i with no more gas than you had, and still run dry.",
  py='''class Solution:
    def canCompleteCircuit(self, gas: list[int], cost: list[int]) -> int:
        if sum(gas) < sum(cost):
            return -1                  # not enough gas in total
        start, tank = 0, 0
        for i in range(len(gas)):
            tank += gas[i] - cost[i]
            if tank < 0:               # nothing from start to i works: start after i
                start, tank = i + 1, 0
        return start''',
  java='''class Solution {
    public int canCompleteCircuit(int[] gas, int[] cost) {
        int total = 0, tank = 0, start = 0;
        for (int i = 0; i < gas.length; i++) {
            total += gas[i] - cost[i];
            tank += gas[i] - cost[i];
            if (tank < 0) { start = i + 1; tank = 0; }   // nothing from start to i works
        }
        return total < 0 ? -1 : start; // not enough gas in total
    }
}''')

prob(num=846, slug="hand-of-straights", title="Hand of Straights", diff="Medium",
  method="isNStraightHand",
  ask="Decide whether a hand of cards can be split into groups of groupSize consecutive values.",
  cue="The smallest card left must start a group, because nothing smaller remains to come before it. That forces every choice, which is what makes the greedy safe.",
  brute="Search over all ways to form groups: exponential.",
  approach="Count the cards. Repeatedly take the smallest value v still present with count c: the groups starting at v need c copies each of v, v + 1, …, v + groupSize - 1. Subtract c from each; if any has fewer than c, answer false.",
  cx="O(n log n) time with a sorted map, O(n) space.",
  trap="Using an array indexed by card value. Values go up to 10⁹; count with a hash map and visit the values in sorted order, or use a TreeMap.",
  py='''from collections import Counter

class Solution:
    def isNStraightHand(self, hand: list[int], groupSize: int) -> bool:
        if len(hand) % groupSize:
            return False
        count = Counter(hand)          # values reach 10^9: count in a map
        for v in sorted(count):
            c = count[v]
            if c == 0:
                continue
            for w in range(v, v + groupSize):   # the smallest card must start a group
                if count[w] < c:
                    return False
                count[w] -= c
        return True''',
  java='''import java.util.TreeMap;

class Solution {
    public boolean isNStraightHand(int[] hand, int groupSize) {
        if (hand.length % groupSize != 0) return false;
        TreeMap<Integer, Integer> count = new TreeMap<>();   // sorted, and values reach 10^9
        for (int v : hand) count.merge(v, 1, Integer::sum);
        for (int v : count.keySet()) {
            int c = count.get(v);
            if (c == 0) continue;
            for (int w = v; w < v + groupSize; w++) {      // the smallest card starts a group
                int have = count.getOrDefault(w, 0);
                if (have < c) return false;
                count.put(w, have - c);
            }
        }
        return true;
    }
}''')

prob(num=763, slug="partition-labels", title="Partition Labels", diff="Medium",
  method="partitionLabels",
  ask="Cut a string into as many pieces as possible so that each letter appears in at most one piece. Return the pieces' lengths.",
  cue="A piece that contains a letter must reach that letter's last occurrence. Extend the current piece to the furthest last occurrence of any letter inside it, and cut as soon as you reach that point.",
  brute="Try every set of cut positions: 2ⁿ⁻¹.",
  approach="Record each letter's last index. Walk the string keeping end = the furthest last index of any letter in the current piece. When i equals end, the piece can close: record its length and start a new one.",
  cx="O(n) time, O(1) space for 26 letters.",
  trap="Cutting as soon as the current letter's own last occurrence is reached. An earlier letter in the same piece may occur later still; the piece must reach the furthest of them.",
  py='''class Solution:
    def partitionLabels(self, s: str) -> list[int]:
        last = {c: i for i, c in enumerate(s)}
        out, start, end = [], 0, 0
        for i, c in enumerate(s):
            end = max(end, last[c])    # the piece must reach every letter's last copy
            if i == end:
                out.append(end - start + 1)
                start = i + 1
        return out''',
  java='''import java.util.*;

class Solution {
    public List<Integer> partitionLabels(String s) {
        int[] last = new int[26];
        for (int i = 0; i < s.length(); i++) last[s.charAt(i) - 'a'] = i;
        List<Integer> out = new ArrayList<>();
        int start = 0, end = 0;
        for (int i = 0; i < s.length(); i++) {
            end = Math.max(end, last[s.charAt(i) - 'a']);   // reach every letter's last copy
            if (i == end) {
                out.add(end - start + 1);
                start = i + 1;
            }
        }
        return out;
    }
}''')

prob(num=678, slug="valid-parenthesis-string", title="Valid Parenthesis String", diff="Medium",
  method="checkValidString",
  ask="A string has '(', ')' and '*', where '*' may be '(', ')' or nothing. Decide whether some choice makes the parentheses valid.",
  cue="Instead of choosing each star, track the range of possible open-bracket counts. '(' raises both ends, ')' lowers both, '*' widens the range by one each way. The string is valid if 0 stays inside the range at the end.",
  brute="Try all 3ᵏ choices for k stars.",
  approach="Keep lo and hi, the fewest and most open brackets possible so far. '(' adds 1 to both; ')' subtracts 1 from both; '*' does lo - 1 and hi + 1. If hi drops below 0, too many ')' arrived: answer false. Clamp lo at 0, since a negative count is never a valid choice. At the end, answer lo == 0.",
  cx="O(n) time, O(1) space.",
  trap="Forgetting to clamp lo. Without it, lo goes negative by counting choices where a star closes a bracket that was never opened, and the final lo == 0 check becomes wrong.",
  py='''class Solution:
    def checkValidString(self, s: str) -> bool:
        lo = hi = 0                    # the range of possible open counts
        for c in s:
            if c == "(":
                lo, hi = lo + 1, hi + 1
            elif c == ")":
                lo, hi = lo - 1, hi - 1
            else:                      # "*": close, open, or nothing
                lo, hi = lo - 1, hi + 1
            if hi < 0:
                return False           # too many ")" whatever the stars are
            lo = max(lo, 0)            # a negative open count is never a real choice
        return lo == 0''',
  java='''class Solution {
    public boolean checkValidString(String s) {
        int lo = 0, hi = 0;            // the range of possible open counts
        for (char c : s.toCharArray()) {
            if (c == '(') { lo++; hi++; }
            else if (c == ')') { lo--; hi--; }
            else { lo--; hi++; }       // '*': close, open, or nothing
            if (hi < 0) return false;  // too many ')' whatever the stars are
            lo = Math.max(lo, 0);      // a negative open count is never a real choice
        }
        return lo == 0;
    }
}''')

prob(num=1899, slug="merge-triplets-to-form-target-triplet", title="Merge Triplets to Form Target Triplet", diff="Medium",
  method="mergeTriplets",
  ask="Merging two triplets replaces one with their element-wise maximum. Decide whether some sequence of merges can produce a target triplet.",
  cue="A triplet with any value above the target can never be used, because a maximum never decreases. Every other triplet is safe to merge in, so merge them all and see whether the target appears.",
  brute="Try every subset of triplets to merge: 2ⁿ.",
  approach="Ignore every triplet with some coordinate larger than the target's. Among the rest, check whether each of the three target values is matched in its coordinate by at least one of them.",
  cx="O(n) time, O(1) space.",
  trap="Requiring one triplet to match the target in all three coordinates. Different triplets can supply different coordinates; merging combines them.",
  py='''class Solution:
    def mergeTriplets(self, triplets: list[list[int]], target: list[int]) -> bool:
        found = [False] * 3
        for t in triplets:
            if all(t[i] <= target[i] for i in range(3)):   # safe to merge in
                for i in range(3):
                    if t[i] == target[i]:
                        found[i] = True
        return all(found)''',
  java='''class Solution {
    public boolean mergeTriplets(int[][] triplets, int[] target) {
        boolean[] found = new boolean[3];
        for (int[] t : triplets) {
            if (t[0] > target[0] || t[1] > target[1] || t[2] > target[2]) continue;   // unusable
            for (int i = 0; i < 3; i++) if (t[i] == target[i]) found[i] = true;
        }
        return found[0] && found[1] && found[2];
    }
}''')

prob(num=406, slug="queue-reconstruction-by-height", title="Queue Reconstruction by Height", diff="Medium",
  method="reconstructQueue",
  ask="Each person is [h, k]: height h, with exactly k people of height at least h in front of them. Rebuild the queue.",
  cue="Place the tallest people first. Anyone shorter, inserted later, is invisible to them, so each tall person's k is exactly their position among those already placed.",
  brute="Try every ordering and check it: n!.",
  approach="Sort by height descending and, for equal heights, k ascending. Insert each person at index k of the output list. Everyone already placed is at least as tall, so that index gives exactly k of them in front, and later (shorter) insertions do not change it.",
  cx="O(n²) time for the insertions into a list, fine at n ≤ 2,000.",
  trap="Sorting equal heights by k descending. Two people of the same height both count each other, so the one with smaller k must be placed first.",
  py='''class Solution:
    def reconstructQueue(self, people: list[list[int]]) -> list[list[int]]:
        people.sort(key=lambda p: (-p[0], p[1]))   # tallest first; smaller k first
        queue = []
        for p in people:
            queue.insert(p[1], p)      # shorter people inserted later are invisible to p
        return queue''',
  java='''import java.util.*;

class Solution {
    public int[][] reconstructQueue(int[][] people) {
        Arrays.sort(people, (a, b) -> a[0] != b[0] ? Integer.compare(b[0], a[0])
                                                   : Integer.compare(a[1], b[1]));   // tallest first
        List<int[]> queue = new ArrayList<>();
        for (int[] p : people) queue.add(p[1], p);   // shorter people later are invisible to p
        return queue.toArray(new int[0][]);
    }
}''', check_args=False)

# ---------------------------------------------------------------- Hard
prob(num=135, slug="candy", title="Candy", diff="Hard",
  method="candy",
  ask="Children in a row have ratings. Each gets at least one candy, and a child rated higher than a neighbour gets more than that neighbour. Find the fewest candies.",
  cue="The two neighbour rules are independent. A left-to-right pass satisfies \"more than the left neighbour\", a right-to-left pass \"more than the right neighbour\", and taking the larger of the two requirements satisfies both with nothing extra.",
  brute="Start everyone at 1 and repeatedly fix any violated pair by raising the higher-rated child, until nothing changes: correct, and O(n²) in the worst case.",
  approach="left[i] = left[i - 1] + 1 if ratings[i] &gt; ratings[i - 1], else 1. right[i] = right[i + 1] + 1 if ratings[i] &gt; ratings[i + 1], else 1. Child i gets max(left[i], right[i]); sum them.",
  cx="O(n) time, O(n) space.",
  trap="Giving equal ratings equal candy. Equal neighbours have no constraint between them, so a child next to an equal-rated one can drop back to 1.",
  py='''class Solution:
    def candy(self, ratings: list[int]) -> int:
        n = len(ratings)
        left, right = [1] * n, [1] * n
        for i in range(1, n):          # more than the left neighbour
            if ratings[i] > ratings[i - 1]:
                left[i] = left[i - 1] + 1
        for i in range(n - 2, -1, -1): # more than the right neighbour
            if ratings[i] > ratings[i + 1]:
                right[i] = right[i + 1] + 1
        return sum(max(a, b) for a, b in zip(left, right))''',
  java='''class Solution {
    public int candy(int[] ratings) {
        int n = ratings.length;
        int[] left = new int[n], right = new int[n];
        java.util.Arrays.fill(left, 1);
        java.util.Arrays.fill(right, 1);
        for (int i = 1; i < n; i++)            // more than the left neighbour
            if (ratings[i] > ratings[i - 1]) left[i] = left[i - 1] + 1;
        for (int i = n - 2; i >= 0; i--)       // more than the right neighbour
            if (ratings[i] > ratings[i + 1]) right[i] = right[i + 1] + 1;
        int total = 0;
        for (int i = 0; i < n; i++) total += Math.max(left[i], right[i]);
        return total;
    }
}''')

prob(num=330, slug="patching-array", title="Patching Array", diff="Hard",
  method="minPatches",
  ask="Given a sorted array, add as few numbers as possible so that every integer from 1 to n is the sum of some subset of the array.",
  cue="If every value in [1, reach) can already be made, then adding a number x ≤ reach extends that to [1, reach + x). When the next array number is too big to extend it, the best possible patch is reach itself, which doubles the range.",
  brute="Try every set of patches of size 1, 2, …: exponential.",
  approach="Keep reach = the smallest sum not yet makeable, starting at 1. While reach ≤ n: if the next array number is at most reach, use it (reach += it) and move on; otherwise patch with reach (reach doubles) and count a patch.",
  cx="O(len(nums) + log n) time, O(1) space: patches double the reach, so there are at most about 31 of them.",
  trap="Overflow in Java. reach can pass 2³¹ right before the loop ends (it doubles from values near n), so keep it in a long.",
  py='''class Solution:
    def minPatches(self, nums: list[int], n: int) -> int:
        reach, i, patches = 1, 0, 0    # every sum in [1, reach) can be made
        while reach <= n:
            if i < len(nums) and nums[i] <= reach:
                reach += nums[i]       # extends the range to [1, reach + nums[i])
                i += 1
            else:
                reach += reach         # patch with reach itself: the range doubles
                patches += 1
        return patches''',
  java='''class Solution {
    public int minPatches(int[] nums, int n) {
        long reach = 1;                // long: doubling can pass 2^31
        int i = 0, patches = 0;        // every sum in [1, reach) can be made
        while (reach <= n) {
            if (i < nums.length && nums[i] <= reach) reach += nums[i++];
            else { reach += reach; patches++; }   // patch with reach: the range doubles
        }
        return patches;
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(23)
def arr(lo, hi, nmin=1, nmax=7): return [R.randint(lo, hi) for _ in range(R.randint(nmin, nmax))]

def brute455(g, s):
    best = 0
    for k in range(min(len(g), len(s)) + 1):
        for kids in combinations(range(len(g)), k):
            for cookies in permutations(range(len(s)), k):
                if all(s[c] >= g[x] for x, c in zip(kids, cookies)): best = k
    return best

def brute860(bills):
    @lru_cache(maxsize=None)
    def go(i, fives, tens):
        if i == len(bills): return True
        b = bills[i]
        if b == 5: return go(i + 1, fives + 1, tens)
        if b == 10: return fives > 0 and go(i + 1, fives - 1, tens + 1)
        return (tens > 0 and fives > 0 and go(i + 1, fives - 1, tens - 1)) or (fives >= 3 and go(i + 1, fives - 3, tens))
    return go(0, 0, 0)

def brute1005(a, k):
    best = None
    for flips in product(range(len(a)), repeat=k):
        b = a[:]
        for i in flips: b[i] = -b[i]
        best = sum(b) if best is None else max(best, sum(b))
    return best

def reachable_bfs(nums):
    dist = {0: 0}; q = [0]
    for x in q:
        for y in range(x + 1, min(len(nums), x + nums[x] + 1)):
            if y not in dist: dist[y] = dist[x] + 1; q.append(y)
    return dist

def gen45():
    while True:
        a = arr(0, 3, 1, 8)
        if len(a) - 1 in reachable_bfs(a): return [a]

def gen134():
    while True:
        n = R.randint(1, 6); g, c = [R.randint(0, 5) for _ in range(n)], [R.randint(0, 5) for _ in range(n)]
        ok = [s for s in range(n) if all(sum(g[(s + j) % n] - c[(s + j) % n] for j in range(t + 1)) >= 0 for t in range(n))]
        if len(ok) <= 1: return [g, c]     # the problem promises a unique answer when one exists
def brute134(g, c):
    n = len(g)
    for s in range(n):
        tank = 0
        for j in range(n):
            tank += g[(s + j) % n] - c[(s + j) % n]
            if tank < 0: break
        else: return s
    return -1

def brute846(hand, k):
    if len(hand) % k: return False
    def go(cards):
        if not cards: return True
        for start in set(cards):   # try every possible group, not only the forced one
            group = list(range(start, start + k))
            rest = list(cards)
            try:
                for v in group: rest.remove(v)
            except ValueError: continue
            if go(sorted(rest)): return True
        return False
    return go(sorted(hand))

def brute763(s):
    best = None
    for mask in range(1 << (len(s) - 1)):
        cuts = [i for i in range(1, len(s)) if mask >> (i - 1) & 1]
        edges = [0, *cuts, len(s)]
        pieces = [s[a:b] for a, b in zip(edges, edges[1:])]
        if all(sum(c in p for p in pieces) == 1 for c in set(s)):
            if best is None or len(pieces) > len(best): best = pieces
    return [len(p) for p in best]

def brute678(s):
    stars = [i for i, c in enumerate(s) if c == "*"]
    for choice in product("()_", repeat=len(stars)):
        t = list(s)
        for i, c in zip(stars, choice): t[i] = c
        t = "".join(t).replace("_", ""); bal = 0
        for c in t:
            bal += 1 if c == "(" else -1
            if bal < 0: break
        else:
            if bal == 0: return True
    return False

def gen1899():
    return [[[R.randint(1, 4) for _ in range(3)] for _ in range(R.randint(1, 6))], [R.randint(1, 4) for _ in range(3)]]
def brute1899(ts, target):
    for k in range(1, len(ts) + 1):
        for c in combinations(ts, k):
            if [max(t[i] for t in c) for i in range(3)] == target: return True
    return False

def gen406():
    heights = [R.randint(1, 5) for _ in range(R.randint(1, 6))]
    people = [[h, sum(1 for g in heights[:i] if g >= h)] for i, h in enumerate(heights)]
    R.shuffle(people)                  # the input is the queue in a scrambled order
    return [people]
def brute406(people):
    for p in permutations(people):
        if all(sum(1 for q in p[:i] if q[0] >= p[i][0]) == p[i][1] for i in range(len(p))): return [list(x) for x in p]

def brute135(r):
    c = [1] * len(r); changed = True
    while changed:
        changed = False
        for i in range(len(r)):
            for j in (i - 1, i + 1):
                if 0 <= j < len(r) and r[i] > r[j] and c[i] <= c[j]: c[i] = c[j] + 1; changed = True
    return sum(c)

def gen330():
    return [sorted(arr(1, 10, 1, 5)), R.randint(1, 30)]
def brute330(nums, n):
    def covers(vals):
        sums = {0}
        for v in vals: sums |= {s + v for s in sums}
        return all(x in sums for x in range(1, n + 1))
    for k in range(0, 8):
        for extra in combinations(range(1, n + 1), k):
            if covers(nums + list(extra)): return k

BRUTE = {
  455:  (lambda: [arr(1, 6, 1, 4), arr(1, 6, 0, 4)], brute455),
  860:  (lambda: [[R.choice([5, 5, 10, 20]) for _ in range(R.randint(1, 10))]], brute860),
  1005: (lambda: [arr(-5, 5, 1, 5), R.randint(1, 4)], brute1005),
  55:   (lambda: [arr(0, 3, 1, 9)], lambda a: len(a) - 1 in reachable_bfs(a)),
  45:   (gen45, lambda a: reachable_bfs(a)[len(a) - 1]),
  134:  (gen134, brute134),
  846:  (lambda: (lambda h: [h, R.randint(1, len(h))])(arr(0, 6, 1, 8)), brute846),
  763:  (lambda: ["".join(R.choice("abcd") for _ in range(R.randint(1, 10)))], brute763),
  678:  (lambda: ["".join(R.choice("()*") for _ in range(R.randint(1, 9)))], brute678),
  1899: (gen1899, brute1899),
  406:  (gen406, brute406),
  135:  (lambda: [arr(0, 4, 1, 9)], brute135),
  330:  (gen330, brute330),
}
