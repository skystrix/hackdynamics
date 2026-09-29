# Chapter 27 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
# Python's heapq is a min-heap; a max-heap stores negated values. Java's PriorityQueue is a min-heap too.
import random
from collections import Counter
from itertools import combinations, permutations
from practice import Approx

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

def reorganized_ok(r, a):
    s = a[0]
    return r == "" if not possible767(s) else sorted(r) == sorted(s) and all(x != y for x, y in zip(r, r[1:]))
def possible767(s): return max(Counter(s).values()) <= (len(s) + 1) // 2

# ---------------------------------------------------------------- Easy
prob(num=1046, slug="last-stone-weight", title="Last Stone Weight", diff="Easy",
  method="lastStoneWeight",
  ask="Repeatedly smash the two heaviest stones: equal stones vanish, otherwise the difference remains. Return the last stone's weight, or 0.",
  cue="\"Repeatedly take the largest\" is what a max-heap is for: each step removes the top two and may add one back.",
  brute="Sort the stones after every smash: O(n² log n).",
  approach="Put the stones in a max-heap (in Python, a min-heap of negated weights). While two or more remain, pop the two heaviest and push back their difference if it is not zero. Return the remaining stone, or 0.",
  cx="O(n log n) time, O(n) space.",
  trap="Forgetting that Python's heapq is a min-heap. Pushing the weights as they are pops the lightest stones, a different game.",
  py='''import heapq

class Solution:
    def lastStoneWeight(self, stones: list[int]) -> int:
        heap = [-s for s in stones]    # negated: heapq is a min-heap
        heapq.heapify(heap)            # O(n), the Why Build-Heap Is O(n) section
        while len(heap) > 1:
            a, b = -heapq.heappop(heap), -heapq.heappop(heap)
            if a != b:
                heapq.heappush(heap, -(a - b))
        return -heap[0] if heap else 0''',
  java='''import java.util.*;

class Solution {
    public int lastStoneWeight(int[] stones) {
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());   // max-heap
        for (int s : stones) heap.add(s);
        while (heap.size() > 1) {
            int a = heap.poll(), b = heap.poll();
            if (a != b) heap.add(a - b);
        }
        return heap.isEmpty() ? 0 : heap.peek();
    }
}''')

prob(num=703, slug="kth-largest-element-in-a-stream", title="Kth Largest Element in a Stream", diff="Easy", design=True,
  ask="Build a class that, as numbers arrive one at a time, reports the k-th largest number seen so far.",
  cue="The Top-K section: keep only the k largest values in a min-heap. Its smallest element is exactly the k-th largest overall.",
  brute="Keep every number in a sorted list and index it: O(n) per insertion.",
  approach="Keep a min-heap of at most k values. To add a value, push it, and if the heap now holds more than k, pop the smallest. The heap's top is the answer.",
  cx="O(log k) per add, O(k) space.",
  trap="Using a max-heap of everything. Its top is the largest, not the k-th largest, and reaching the k-th means popping k - 1 values every call.",
  py='''import heapq

class KthLargest:
    def __init__(self, k: int, nums: list[int]):
        self.k, self.heap = k, []
        for x in nums:
            self.add(x)

    def add(self, val: int) -> int:
        heapq.heappush(self.heap, val)
        if len(self.heap) > self.k:
            heapq.heappop(self.heap)   # keep only the k largest
        return self.heap[0]            # the smallest of the k largest''',
  java='''import java.util.PriorityQueue;

class KthLargest {
    private final PriorityQueue<Integer> heap = new PriorityQueue<>();   // min-heap of the k largest
    private final int k;

    public KthLargest(int k, int[] nums) {
        this.k = k;
        for (int x : nums) add(x);
    }

    public int add(int val) {
        heap.add(val);
        if (heap.size() > k) heap.poll();   // keep only the k largest
        return heap.peek();            // the smallest of the k largest
    }
}''')

# ---------------------------------------------------------------- Medium
prob(num=973, slug="k-closest-points-to-origin", title="K Closest Points to Origin", diff="Medium",
  method="kClosest", observe=lambda r, a: sorted(map(list, r)),
  ask="Return the k points closest to the origin (in any order).",
  cue="Top-K with the opposite direction: keep the k closest so far in a max-heap keyed by distance, so the farthest of them is on top and is the one to evict. (Chapter 15's quickselect also solves it in O(n) expected time.)",
  brute="Sort all points by distance: O(n log n).",
  approach="Compare squared distances x² + y², which rank points the same way as true distances without a square root. Push each point into a max-heap of size k (negate the distance in Python); when the heap exceeds k, pop the farthest. The heap's contents are the answer.",
  cx="O(n log k) time, O(k) space.",
  trap="Taking square roots. They add floating-point error and cost, and two different integer distances can then compare as equal. Squared distances are exact integers.",
  py='''import heapq

class Solution:
    def kClosest(self, points: list[list[int]], k: int) -> list[list[int]]:
        heap = []                      # (-squared distance, x, y): the farthest on top
        for x, y in points:
            heapq.heappush(heap, (-(x * x + y * y), x, y))   # squared: exact, no sqrt
            if len(heap) > k:
                heapq.heappop(heap)    # evict the farthest
        return [[x, y] for _, x, y in heap]''',
  java='''import java.util.*;

class Solution {
    public int[][] kClosest(int[][] points, int k) {
        PriorityQueue<int[]> heap = new PriorityQueue<>(   // the farthest on top
            (a, b) -> Integer.compare(b[0] * b[0] + b[1] * b[1], a[0] * a[0] + a[1] * a[1]));
        for (int[] p : points) {
            heap.add(p);
            if (heap.size() > k) heap.poll();   // evict the farthest
        }
        return heap.toArray(new int[0][]);
    }
}''', check_args=False, unordered=True)

prob(num=621, slug="task-scheduler", title="Task Scheduler", diff="Medium",
  method="leastInterval",
  ask="Tasks are letters; the same letter must be separated by at least n time slots (idle slots allowed). Find the fewest slots needed to run all tasks.",
  cue="Simulate with a max-heap of remaining counts: in each round of n + 1 slots, run the most frequent distinct tasks first, because the most frequent task is the one that forces idle time.",
  brute="Search over orders: exponential.",
  approach="Count the tasks. In each round, pop up to n + 1 of the most frequent remaining tasks from a max-heap, run each once, and push back those that still have copies. If tasks remain after the round, it cost the full n + 1 slots (idling if needed); the last round costs only the tasks it ran.",
  cx="O(T log 26) time for T tasks, O(26) space. (There is also a closed formula: max(T, (maxCount - 1) × (n + 1) + number of tasks with maxCount).)",
  trap="Running the least frequent tasks first to fill the gaps. That leaves the most frequent task for the end, where each copy needs n idle slots before it.",
  py='''import heapq
from collections import Counter

class Solution:
    def leastInterval(self, tasks: list[str], n: int) -> int:
        heap = [-c for c in Counter(tasks).values()]   # max-heap of remaining counts
        heapq.heapify(heap)
        slots = 0
        while heap:
            ran = []
            for _ in range(n + 1):     # one round: the most frequent distinct tasks first
                if heap:
                    ran.append(heapq.heappop(heap) + 1)   # run one copy (counts are negative)
            for c in ran:
                if c < 0:
                    heapq.heappush(heap, c)
            slots += n + 1 if heap else len(ran)       # the last round needs no idling
        return slots''',
  java='''import java.util.*;

class Solution {
    public int leastInterval(char[] tasks, int n) {
        int[] count = new int[26];
        for (char t : tasks) count[t - 'A']++;
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());   // max-heap
        for (int c : count) if (c > 0) heap.add(c);
        int slots = 0;
        while (!heap.isEmpty()) {
            List<Integer> ran = new ArrayList<>();
            for (int i = 0; i <= n && !heap.isEmpty(); i++) ran.add(heap.poll() - 1);   // one round
            for (int c : ran) if (c > 0) heap.add(c);
            slots += heap.isEmpty() ? ran.size() : n + 1;   // the last round needs no idling
        }
        return slots;
    }
}''')

prob(num=355, slug="design-twitter", title="Design Twitter", diff="Medium", design=True,
  ask="Build a small Twitter: users post tweets and follow or unfollow others, and getNewsFeed returns the 10 most recent tweet ids from the user and the people they follow.",
  cue="Each user's tweets are already in time order. The news feed is the top 10 of a merge of those sorted lists: Merge k Sorted Lists (Chapter 11) with a heap, stopping after 10.",
  brute="Gather every tweet from everyone followed, sort by time, take 10: O(T log T) per feed for T tweets.",
  approach="Stamp every tweet with a global counter. Store each user's tweets as a list and their followees as a set. For a feed, push the newest tweet of the user and of each followee into a max-heap keyed by time; pop 10 times, each time pushing the next-older tweet from the same user.",
  cx="O(f + 10 log f) per feed for f followees; O(1) for the other calls.",
  trap="Letting a user follow or unfollow themselves change their own feed. Their own tweets must always appear, whatever the follow set says.",
  py='''import heapq
from collections import defaultdict

class Twitter:
    def __init__(self):
        self.time = 0
        self.tweets = defaultdict(list)    # user -> [(time, tweetId)], oldest first
        self.follows = defaultdict(set)

    def postTweet(self, userId: int, tweetId: int) -> None:
        self.time += 1
        self.tweets[userId].append((self.time, tweetId))

    def getNewsFeed(self, userId: int) -> list[int]:
        heap = []
        for u in self.follows[userId] | {userId}:   # always include the user's own tweets
            if self.tweets[u]:
                i = len(self.tweets[u]) - 1
                t, tid = self.tweets[u][i]
                heap.append((-t, tid, u, i))
        heapq.heapify(heap)
        feed = []
        while heap and len(feed) < 10: # merge k sorted lists, newest first
            _, tid, u, i = heapq.heappop(heap)
            feed.append(tid)
            if i > 0:
                t, nxt = self.tweets[u][i - 1]
                heapq.heappush(heap, (-t, nxt, u, i - 1))
        return feed

    def follow(self, followerId: int, followeeId: int) -> None:
        self.follows[followerId].add(followeeId)

    def unfollow(self, followerId: int, followeeId: int) -> None:
        self.follows[followerId].discard(followeeId)''',
  java='''import java.util.*;

class Twitter {
    private int time = 0;
    private final Map<Integer, List<int[]>> tweets = new HashMap<>();   // user -> {time, id}, oldest first
    private final Map<Integer, Set<Integer>> follows = new HashMap<>();

    public Twitter() {}

    public void postTweet(int userId, int tweetId) {
        tweets.computeIfAbsent(userId, u -> new ArrayList<>()).add(new int[]{++time, tweetId});
    }

    public List<Integer> getNewsFeed(int userId) {
        // entries {time, tweetId, user, index}, newest on top
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(b[0], a[0]));
        Set<Integer> users = new HashSet<>(follows.getOrDefault(userId, Set.of()));
        users.add(userId);             // always include the user's own tweets
        for (int u : users) {
            List<int[]> list = tweets.get(u);
            if (list != null && !list.isEmpty()) {
                int i = list.size() - 1;
                heap.add(new int[]{list.get(i)[0], list.get(i)[1], u, i});
            }
        }
        List<Integer> feed = new ArrayList<>();
        while (!heap.isEmpty() && feed.size() < 10) {   // merge k sorted lists
            int[] top = heap.poll();
            feed.add(top[1]);
            if (top[3] > 0) {
                int[] older = tweets.get(top[2]).get(top[3] - 1);
                heap.add(new int[]{older[0], older[1], top[2], top[3] - 1});
            }
        }
        return feed;
    }

    public void follow(int followerId, int followeeId) {
        follows.computeIfAbsent(followerId, u -> new HashSet<>()).add(followeeId);
    }

    public void unfollow(int followerId, int followeeId) {
        Set<Integer> s = follows.get(followerId);
        if (s != null) s.remove(followeeId);
    }
}''')

prob(num=767, slug="reorganize-string", title="Reorganize String", diff="Medium",
  method="reorganizeString", observe=reorganized_ok,
  ask="Rearrange a string so that no two neighbours are equal, or return \"\" if that is impossible (any valid answer is accepted).",
  cue="Always place the most frequent remaining letter that differs from the last one placed. A max-heap of counts gives the most frequent letter in O(log 26).",
  brute="Try permutations until one works: factorial.",
  approach="If some letter occurs more than (n + 1) / 2 times, return \"\". Otherwise, repeatedly pop the most frequent letter, append it, and hold it aside for one step so it cannot be used twice in a row; push the previously held letter back if it still has copies.",
  cx="O(n log 26) time, O(26) space.",
  trap="Placing letters greedily in frequency order without holding the last one back. The same letter comes out on top again immediately and lands next to itself.",
  py='''import heapq
from collections import Counter

class Solution:
    def reorganizeString(self, s: str) -> str:
        if max(Counter(s).values()) > (len(s) + 1) // 2:
            return ""                  # the most frequent letter cannot be spread out
        heap = [(-c, ch) for ch, c in Counter(s).items()]
        heapq.heapify(heap)
        out, held = [], None           # held: last letter placed, kept out for one step
        while heap:
            c, ch = heapq.heappop(heap)
            out.append(ch)
            if held:
                heapq.heappush(heap, held)
            held = (c + 1, ch) if c + 1 < 0 else None
        return "".join(out)''',
  java='''import java.util.*;

class Solution {
    public String reorganizeString(String s) {
        int[] count = new int[26];
        int max = 0;
        for (char c : s.toCharArray()) max = Math.max(max, ++count[c - 'a']);
        if (max > (s.length() + 1) / 2) return "";   // cannot be spread out
        PriorityQueue<int[]> heap = new PriorityQueue<>(   // {count, letter}: most frequent first
            (a, b) -> a[0] != b[0] ? Integer.compare(b[0], a[0]) : Integer.compare(a[1], b[1]));
        for (int i = 0; i < 26; i++) if (count[i] > 0) heap.add(new int[]{count[i], i});
        StringBuilder out = new StringBuilder();
        int[] held = null;             // last letter placed, kept out for one step
        while (!heap.isEmpty()) {
            int[] top = heap.poll();
            out.append((char) ('a' + top[1]));
            if (held != null) heap.add(held);
            held = --top[0] > 0 ? top : null;
        }
        return out.toString();
    }
}''')

prob(num=1642, slug="furthest-building-you-can-reach", title="Furthest Building You Can Reach", diff="Medium",
  method="furthestBuilding",
  ask="Walking along buildings, each climb up needs either bricks equal to the height difference or one ladder. Return the index of the furthest building you can reach.",
  cue="Ladders should go on the biggest climbs, but you learn which climbs are biggest only as you go. Keep the ladder climbs in a min-heap: when you run out of ladders, the smallest ladder climb is the one to pay for with bricks instead.",
  brute="Try every assignment of ladders to climbs: exponential.",
  approach="Walk the buildings. For each climb, put it on a ladder (push it into the min-heap). If the heap now holds more climbs than ladders, pop the smallest and pay for it with bricks. If bricks go negative, the current building cannot be reached: return the previous index.",
  cx="O(n log L) time for L ladders, O(L) space.",
  trap="Using ladders on the first climbs you meet. A small early climb then wastes a ladder that a large later climb needed; the heap lets you revise that choice.",
  py='''import heapq

class Solution:
    def furthestBuilding(self, heights: list[int], bricks: int, ladders: int) -> int:
        on_ladders = []                # min-heap of the climbs currently given ladders
        for i in range(len(heights) - 1):
            climb = heights[i + 1] - heights[i]
            if climb <= 0:
                continue
            heapq.heappush(on_ladders, climb)
            if len(on_ladders) > ladders:
                bricks -= heapq.heappop(on_ladders)   # the smallest ladder climb takes bricks
                if bricks < 0:
                    return i
        return len(heights) - 1''',
  java='''import java.util.PriorityQueue;

class Solution {
    public int furthestBuilding(int[] heights, int bricks, int ladders) {
        PriorityQueue<Integer> onLadders = new PriorityQueue<>();   // climbs given ladders
        for (int i = 0; i < heights.length - 1; i++) {
            int climb = heights[i + 1] - heights[i];
            if (climb <= 0) continue;
            onLadders.add(climb);
            if (onLadders.size() > ladders) {
                bricks -= onLadders.poll();   // the smallest ladder climb takes bricks
                if (bricks < 0) return i;
            }
        }
        return heights.length - 1;
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=295, slug="find-median-from-data-stream", title="Find Median from Data Stream", diff="Hard", design=True,
  ask="Numbers arrive one at a time; at any moment return the median of all numbers so far.",
  cue="The Two Heaps for a Running Median section: a max-heap for the smaller half and a min-heap for the larger half, kept the same size (or the lower half one bigger). The median sits on their tops.",
  brute="Keep a sorted list and insert each number in place: O(n) per insertion.",
  approach="Add a number to the lower half's max-heap, then move the lower half's largest to the upper half's min-heap, so every lower value stays below every upper value. If the upper half is now bigger, move its smallest back. The median is the lower top when the sizes differ, or the average of both tops.",
  cx="O(log n) per addNum, O(1) per findMedian, O(n) space.",
  trap="Balancing the sizes without keeping the halves ordered. The two heaps must also satisfy \"everything below is at most everything above\"; routing every new number through the lower heap and across to the upper one keeps both properties.",
  py='''import heapq

class MedianFinder:
    def __init__(self):
        self.low, self.high = [], []   # low: max-heap (negated) of the smaller half

    def addNum(self, num: int) -> None:
        heapq.heappush(self.low, -num)
        heapq.heappush(self.high, -heapq.heappop(self.low))   # keeps low <= high
        if len(self.high) > len(self.low):
            heapq.heappush(self.low, -heapq.heappop(self.high))   # keeps the sizes close

    def findMedian(self) -> float:
        if len(self.low) > len(self.high):
            return float(-self.low[0])
        return (-self.low[0] + self.high[0]) / 2''',
  java='''import java.util.*;

class MedianFinder {
    private final PriorityQueue<Integer> low = new PriorityQueue<>(Collections.reverseOrder());   // smaller half
    private final PriorityQueue<Integer> high = new PriorityQueue<>();                           // larger half

    public MedianFinder() {}

    public void addNum(int num) {
        low.add(num);
        high.add(low.poll());          // keeps low <= high
        if (high.size() > low.size()) low.add(high.poll());   // keeps the sizes close
    }

    public double findMedian() {
        if (low.size() > high.size()) return low.peek();
        return (low.peek() + (double) high.peek()) / 2;
    }
}''')

prob(num=502, slug="ipo", title="IPO", diff="Hard",
  method="findMaximizedCapital",
  ask="You start with capital w and may finish at most k projects. A project needs some capital to start and adds its profit to your capital when done. Maximize your final capital.",
  cue="Capital only grows, so projects become affordable in order of their capital requirement and never stop being affordable. Sort by requirement, and keep the affordable projects' profits in a max-heap; always do the most profitable one available.",
  brute="Try every sequence of up to k projects: exponential.",
  approach="Sort projects by required capital. Repeat k times: move every project you can now afford into a max-heap of profits; if the heap is empty, stop; otherwise take the largest profit and add it to w.",
  cx="O(n log n) time, O(n) space.",
  trap="Choosing the cheapest affordable project to unlock more. Profits are what raise capital, so the most profitable affordable project is always at least as good; it unlocks everything the cheaper one would.",
  py='''import heapq

class Solution:
    def findMaximizedCapital(self, k: int, w: int, profits: list[int], capital: list[int]) -> int:
        projects = sorted(zip(capital, profits))   # in the order they become affordable
        heap, i = [], 0                # max-heap (negated) of affordable profits
        for _ in range(k):
            while i < len(projects) and projects[i][0] <= w:
                heapq.heappush(heap, -projects[i][1])
                i += 1
            if not heap:
                break                  # nothing affordable: capital cannot grow
            w -= heapq.heappop(heap)   # take the most profitable
        return w''',
  java='''import java.util.*;

class Solution {
    public int findMaximizedCapital(int k, int w, int[] profits, int[] capital) {
        int n = profits.length;
        Integer[] order = new Integer[n];
        for (int i = 0; i < n; i++) order[i] = i;
        Arrays.sort(order, (a, b) -> Integer.compare(capital[a], capital[b]));   // by requirement
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());   // affordable profits
        int i = 0;
        for (int round = 0; round < k; round++) {
            while (i < n && capital[order[i]] <= w) heap.add(profits[order[i++]]);
            if (heap.isEmpty()) break; // nothing affordable
            w += heap.poll();          // the most profitable
        }
        return w;
    }
}''')

prob(num=630, slug="course-schedule-iii", title="Course Schedule III", diff="Hard",
  method="scheduleCourse",
  ask="Each course has a duration and a last day by which it must be finished. Taking one course at a time from day 1, find the most courses you can complete.",
  cue="Chapter 23's deadline scheduling plus a heap. Take courses in order of deadline; if adding one overruns its deadline, drop the longest course taken so far. That keeps the count and frees the most time.",
  brute="Try every subset and check whether some order fits the deadlines: exponential.",
  approach="Sort by last day. Keep a max-heap of the durations taken and the total time used. For each course, take it (push its duration, add to the total). If the total now exceeds this course's last day, pop the longest duration and subtract it. The heap's size is the answer.",
  cx="O(n log n) time, O(n) space.",
  trap="Skipping a course that does not fit instead of swapping. Removing the longest course taken (which may be the new one) keeps the same count while leaving the most room for the courses still to come.",
  py='''import heapq

class Solution:
    def scheduleCourse(self, courses: list[list[int]]) -> int:
        taken, total = [], 0           # max-heap (negated) of taken durations
        for duration, last in sorted(courses, key=lambda c: c[1]):   # by deadline
            heapq.heappush(taken, -duration)
            total += duration
            if total > last:
                total += heapq.heappop(taken)   # drop the longest course so far
        return len(taken)''',
  java='''import java.util.*;

class Solution {
    public int scheduleCourse(int[][] courses) {
        Arrays.sort(courses, (a, b) -> Integer.compare(a[1], b[1]));   // by deadline
        PriorityQueue<Integer> taken = new PriorityQueue<>(Collections.reverseOrder());
        int total = 0;
        for (int[] c : courses) {
            taken.add(c[0]);
            total += c[0];
            if (total > c[1]) total -= taken.poll();   // drop the longest course so far
        }
        return taken.size();
    }
}''', check_args=False)

prob(num=871, slug="minimum-number-of-refueling-stops", title="Minimum Number of Refueling Stops", diff="Hard",
  method="minRefuelStops",
  ask="A car starts with some fuel and passes gas stations on the way to a target (one unit of fuel per mile). Find the fewest stops that reach the target, or -1.",
  cue="Drive as far as the fuel allows, remembering every station passed. When you run dry, retroactively refuel at the best station you passed, the one with the most fuel: a max-heap of passed stations.",
  brute="Try every subset of stations in order: exponential. A DP over (stations, stops) is O(n²).",
  approach="Walk the stations and then the target in order. Before reaching each point, while the fuel cannot get there, pop the largest fuel amount from the heap of passed stations and add it, counting a stop; if the heap is empty, return -1. On reaching a station, push its fuel.",
  cx="O(n log n) time, O(n) space.",
  trap="Overflow in Java. Fuel amounts reach 10⁹ each, and adding up to 500 of them passes 2³¹; keep the tank in a long.",
  py='''import heapq

class Solution:
    def minRefuelStops(self, target: int, startFuel: int, stations: list[list[int]]) -> int:
        passed, fuel, stops = [], startFuel, 0   # max-heap (negated) of fuel at passed stations
        for pos, gas in stations + [[target, 0]]:
            while fuel < pos:          # cannot reach pos: refuel at the best station passed
                if not passed:
                    return -1
                fuel -= heapq.heappop(passed)
                stops += 1
            heapq.heappush(passed, -gas)
        return stops''',
  java='''import java.util.*;

class Solution {
    public int minRefuelStops(int target, int startFuel, int[][] stations) {
        PriorityQueue<Integer> passed = new PriorityQueue<>(Collections.reverseOrder());   // fuel at passed stations
        long fuel = startFuel;         // long: many 10^9 refuels pass 2^31
        int stops = 0;
        for (int i = 0; i <= stations.length; i++) {
            int pos = i < stations.length ? stations[i][0] : target;
            while (fuel < pos) {       // cannot reach pos: refuel at the best station passed
                if (passed.isEmpty()) return -1;
                fuel += passed.poll();
                stops++;
            }
            if (i < stations.length) passed.add(stations[i][1]);
        }
        return stops;
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(27)
def arr(lo, hi, nmin=1, nmax=8): return [R.randint(lo, hi) for _ in range(R.randint(nmin, nmax))]

def brute1046(st):
    st = sorted(st)
    while len(st) > 1:
        a, b = st.pop(), st.pop()
        if a != b: st.append(a - b); st.sort()
    return st[0] if st else 0

def gen703():
    nums = arr(-9, 9, 0, 6); k = R.randint(1, len(nums) + 1); n = R.randint(1, 8)
    return ["KthLargest"] + ["add"] * n, [[k, nums]] + [[R.randint(-9, 9)] for _ in range(n)]
def brute703(ops, args):
    k, seen, res = args[0][0], list(args[0][1]), [None]
    for (v,) in args[1:]:
        seen.append(v); res.append(sorted(seen)[-k])
    return res

def gen973():
    while True:
        pts = [[R.randint(-6, 6), R.randint(-6, 6)] for _ in range(R.randint(1, 8))]
        k = R.randint(1, len(pts)); d = sorted(x * x + y * y for x, y in pts)
        if k == len(pts) or d[k - 1] < d[k]: return [pts, k]   # the answer set is unique
def brute973(pts, k): return sorted(sorted(pts, key=lambda p: p[0] ** 2 + p[1] ** 2)[:k])

def brute621(tasks, n):
    # breadth-first over (remaining counts, cooldowns) states: the true minimum
    from functools import lru_cache
    letters = sorted(set(tasks))
    start = tuple(tasks.count(c) for c in letters)
    @lru_cache(maxsize=None)
    def go(counts, cool):
        if not any(counts): return 0
        best = None
        for i, c in enumerate(counts):
            if c and cool[i] == 0:
                nc = counts[:i] + (c - 1,) + counts[i + 1:]
                ncool = tuple(max(0, x - 1) for x in cool[:i]) + (n,) + tuple(max(0, x - 1) for x in cool[i + 1:])
                v = 1 + go(nc, ncool); best = v if best is None else min(best, v)
        if best is not None: return best   # idling while a task is ready never helps
        return 1 + go(counts, tuple(max(0, x - 1) for x in cool))
    return go(start, tuple(0 for _ in letters))

def gen355():
    ops, args = ["Twitter"], [[]]
    tid = 0
    for _ in range(R.randint(1, 20)):
        op = R.choice(["postTweet", "postTweet", "getNewsFeed", "follow", "unfollow"])
        u = R.randint(1, 3); ops.append(op)
        if op == "postTweet": args.append([u, tid]); tid += 1
        elif op == "getNewsFeed": args.append([u])
        else: args.append([u, R.choice([x for x in (1, 2, 3) if x != u])])
    return ops, args
def brute355(ops, args):
    posts, follows, res = [], {}, [None]
    for op, a in zip(ops[1:], args[1:]):
        if op == "postTweet": posts.append(tuple(a)); res.append(None)
        elif op == "follow": follows.setdefault(a[0], set()).add(a[1]); res.append(None)
        elif op == "unfollow": follows.setdefault(a[0], set()).discard(a[1]); res.append(None)
        else:
            who = follows.get(a[0], set()) | {a[0]}
            res.append([t for u, t in reversed(posts) if u in who][:10])
    return res

def brute1642(h, bricks, ladders):
    best = 0
    climbs = [(i, h[i + 1] - h[i]) for i in range(len(h) - 1) if h[i + 1] > h[i]]
    for i in range(len(h)):
        need = sorted(c for j, c in climbs if j < i)
        if sum(need[:max(0, len(need) - ladders)]) <= bricks: best = i
    return best

def gen295():
    n = R.randint(1, 10); ops, args = ["MedianFinder"], [[]]
    for i in range(n):
        ops.append("addNum"); args.append([R.randint(-9, 9)])
        if R.random() < 0.5: ops.append("findMedian"); args.append([])
    return ops, args
def brute295(ops, args):
    seen, res = [], [None]
    for op, a in zip(ops[1:], args[1:]):
        if op == "addNum": seen.append(a[0]); res.append(None)
        else:
            s = sorted(seen); m = len(s)
            res.append(Approx(s[m // 2] if m % 2 else (s[m // 2 - 1] + s[m // 2]) / 2))
    return res

def gen502():
    n = R.randint(1, 6); return [R.randint(1, 4), R.randint(0, 5), [R.randint(0, 6) for _ in range(n)], [R.randint(0, 10) for _ in range(n)]]
def brute502(k, w, p, c):
    best = w
    def go(w, used, left):
        nonlocal best
        best = max(best, w)
        if left == 0: return
        for i in range(len(p)):
            if i not in used and c[i] <= w: go(w + p[i], used | {i}, left - 1)
    go(w, frozenset(), k); return best

def brute630(courses):
    best = 0
    for k in range(len(courses) + 1):
        for sub in combinations(courses, k):
            t, ok = 0, True
            for d, last in sorted(sub, key=lambda c: c[1]):   # earliest deadline first is optimal for a fixed set
                t += d
                if t > last: ok = False; break
            if ok: best = k
    return best

def gen871():
    target = R.randint(1, 30); pos = sorted(R.sample(range(1, target), min(target - 1, R.randint(0, 5)))) if target > 1 else []
    return [target, R.randint(1, 15), [[p, R.randint(1, 10)] for p in pos]]
def brute871(target, fuel, st):
    for k in range(len(st) + 1):
        for chosen in combinations(range(len(st)), k):
            f, ok = fuel, True
            for pos, gas_i in [(p, i) for i, (p, _) in enumerate(st)] + [(target, -1)]:
                if f < pos: ok = False; break
                if gas_i in chosen: f += st[gas_i][1]
            if ok: return k
    return -1

BRUTE = {
  1046: (lambda: [arr(1, 20, 1, 8)], brute1046),
  703:  (gen703, brute703),
  973:  (gen973, brute973),
  621:  (lambda: [[R.choice("ABC") for _ in range(R.randint(1, 7))], R.randint(0, 3)], brute621),
  355:  (gen355, brute355),
  767:  (lambda: ["".join(R.choice("aabc") for _ in range(R.randint(1, 9)))], lambda s: True),
  1642: (lambda: [arr(1, 10, 1, 9), R.randint(0, 10), R.randint(0, 3)], brute1642),
  295:  (gen295, brute295),
  502:  (gen502, brute502),
  630:  (lambda: [[[R.randint(1, 6), R.randint(1, 15)] for _ in range(R.randint(1, 6))]], brute630),
  871:  (gen871, brute871),
}
