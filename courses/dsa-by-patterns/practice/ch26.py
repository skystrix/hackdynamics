# Chapter 26 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
# Problems that accept any valid tree are checked by property: a valid BST, the right values, balance.
import random
from practice import TREE, REF, TreeNode, materialize, rand_tree, tree_list

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

T = materialize
def inorder(t): return [] if t is None else inorder(t.left) + [t.val] + inorder(t.right)
def height(t): return 0 if t is None else 1 + max(height(t.left), height(t.right))
def balanced(t): return t is None or (abs(height(t.left) - height(t.right)) <= 1 and balanced(t.left) and balanced(t.right))
def is_bst(t):
    v = inorder(t); return all(a < b for a, b in zip(v, v[1:]))
def shape(need_balance=False):       # what the check compares: (valid BST, balanced if required, values)
    return lambda r, a: (is_bst(r), balanced(r) or not need_balance, inorder(r))
def want(vals): return (True, True, sorted(vals))   # the brute force's side, from the original input
def present(t): return [v for v in t.vals if v is not None]

# ---------------------------------------------------------------- Easy
prob(num=700, slug="search-in-a-binary-search-tree", title="Search in a Binary Search Tree", diff="Easy",
  method="searchBST", observe=lambda r, a: tree_list(r),
  ask="Find the node holding a value in a BST and return its subtree, or nothing if the value is absent.",
  cue="The BST invariant turns search into binary search on a tree: at each node, the value is either here, only possible on the left, or only possible on the right.",
  brute="Search the whole tree: O(n).",
  approach="Start at the root. While the node exists and does not hold the value, go left if the value is smaller, right if larger. Return the node (or nothing).",
  cx="O(h) time: O(log n) when balanced, O(n) on a degenerate chain (the BST and How It Degenerates section). O(1) space.",
  trap="Searching both subtrees. That throws away the invariant and turns O(h) into O(n).",
  py='''class Solution:
    def searchBST(self, root: Optional[TreeNode], val: int) -> Optional[TreeNode]:
        node = root
        while node and node.val != val:
            node = node.left if val < node.val else node.right   # one side only
        return node''',
  java='''class Solution {
    public TreeNode searchBST(TreeNode root, int val) {
        TreeNode node = root;
        while (node != null && node.val != val) node = val < node.val ? node.left : node.right;   // one side
        return node;
    }
}''')

prob(num=108, slug="convert-sorted-array-to-binary-search-tree", title="Convert Sorted Array to Binary Search Tree", diff="Easy",
  method="sortedArrayToBST", observe=shape(need_balance=True),
  ask="Build a height-balanced BST from a sorted array (any such tree is accepted).",
  cue="The middle element as the root splits the rest into two halves of equal size (within one), and each half is the same problem.",
  brute="Insert the values one by one in sorted order: a valid BST, but a chain of height n, the degenerate case the chapter opens with.",
  approach="Build(lo, hi) on the half-open range [lo, hi): if it is empty, return nothing; otherwise make the middle element the root, build its left subtree from [lo, mid) and its right from [mid + 1, hi).",
  cx="O(n) time, O(log n) recursion depth.",
  trap="Inserting into a BST one by one, which is what makes balance matter in the first place. Sorted input is the worst case for plain insertion.",
  py='''class Solution:
    def sortedArrayToBST(self, nums: list[int]) -> Optional[TreeNode]:
        def build(lo, hi):             # nums[lo:hi]
            if lo >= hi:
                return None
            mid = (lo + hi) // 2       # the middle: both halves within one of each other
            return TreeNode(nums[mid], build(lo, mid), build(mid + 1, hi))
        return build(0, len(nums))''',
  java='''class Solution {
    public TreeNode sortedArrayToBST(int[] nums) { return build(nums, 0, nums.length); }

    private TreeNode build(int[] nums, int lo, int hi) {   // nums[lo..hi)
        if (lo >= hi) return null;
        int mid = (lo + hi) >>> 1;     // the middle: halves within one of each other
        return new TreeNode(nums[mid], build(nums, lo, mid), build(nums, mid + 1, hi));
    }
}''')

prob(num=530, slug="minimum-absolute-difference-in-bst", title="Minimum Absolute Difference in BST", diff="Easy",
  method="getMinimumDifference",
  ask="Return the smallest difference between the values of any two nodes in a BST.",
  cue="An inorder walk of a BST lists the values in sorted order, and in a sorted list the closest pair is always adjacent.",
  brute="Compare every pair of nodes: O(n²).",
  approach="Walk the tree in inorder, remembering the previous value. At each node, compare with the previous value and keep the smallest difference.",
  cx="O(n) time, O(h) space.",
  trap="Comparing each node only with its children. The closest value to a node may be far away in the tree, for example the largest value in its left subtree.",
  py='''class Solution:
    def getMinimumDifference(self, root: Optional[TreeNode]) -> int:
        best, prev, stack, node = float("inf"), None, [], root
        while stack or node:           # iterative inorder: values in sorted order
            while node:
                stack.append(node)
                node = node.left
            node = stack.pop()
            if prev is not None:
                best = min(best, node.val - prev)   # neighbours in sorted order
            prev = node.val
            node = node.right
        return best''',
  java='''import java.util.ArrayDeque;

class Solution {
    public int getMinimumDifference(TreeNode root) {
        int best = Integer.MAX_VALUE;
        Integer prev = null;
        ArrayDeque<TreeNode> stack = new ArrayDeque<>();
        TreeNode node = root;
        while (!stack.isEmpty() || node != null) {   // inorder: values in sorted order
            while (node != null) { stack.push(node); node = node.left; }
            node = stack.pop();
            if (prev != null) best = Math.min(best, node.val - prev);   // sorted neighbours
            prev = node.val;
            node = node.right;
        }
        return best;
    }
}''')

# ---------------------------------------------------------------- Medium
prob(num=701, slug="insert-into-a-binary-search-tree", title="Insert into a Binary Search Tree", diff="Medium",
  method="insertIntoBST", observe=shape(),
  ask="Insert a new value into a BST and return the root (any valid BST is accepted).",
  cue="Search for the value; the empty spot where the search falls off the tree is exactly where the value belongs as a new leaf.",
  brute="Rebuild the whole tree from its sorted values plus the new one: O(n).",
  approach="If the tree is empty, the new node is the root. Otherwise walk down as in a search until the next step would be an empty child, and attach the new node there.",
  cx="O(h) time, O(1) space.",
  trap="Returning the new node instead of the root when the tree was not empty. The caller needs the root back; the new node only becomes the root when there was nothing before.",
  py='''class Solution:
    def insertIntoBST(self, root: Optional[TreeNode], val: int) -> Optional[TreeNode]:
        if not root:
            return TreeNode(val)
        node = root
        while True:
            side = "left" if val < node.val else "right"
            nxt = getattr(node, side)
            if not nxt:
                setattr(node, side, TreeNode(val))   # where the search fell off
                return root
            node = nxt''',
  java='''class Solution {
    public TreeNode insertIntoBST(TreeNode root, int val) {
        if (root == null) return new TreeNode(val);
        TreeNode node = root;
        while (true) {
            if (val < node.val) {
                if (node.left == null) { node.left = new TreeNode(val); return root; }   // fell off here
                node = node.left;
            } else {
                if (node.right == null) { node.right = new TreeNode(val); return root; }
                node = node.right;
            }
        }
    }
}''', check_args=False)

prob(num=450, slug="delete-node-in-a-bst", title="Delete Node in a BST", diff="Medium",
  method="deleteNode", observe=shape(),
  ask="Delete the node with a given key from a BST (if present) and return the root (any valid result is accepted).",
  cue="The three cases every BST deletion has. A node with at most one child is replaced by that child. A node with two children takes the value of its inorder successor, the smallest node in its right subtree, which is then deleted from there.",
  brute="Collect the values, drop the key, rebuild a BST: O(n).",
  approach="Recursively find the key. At the node: if it has no left child, return its right child; if no right child, return its left. Otherwise find the leftmost node of its right subtree, copy that value here, and delete that value from the right subtree.",
  cx="O(h) time, O(h) recursion depth.",
  trap="Replacing a two-child node with its right child and hanging the left subtree anywhere. That can put values on the wrong side of an ancestor. The successor is the one value that can take the node's place without breaking the invariant.",
  py='''class Solution:
    def deleteNode(self, root: Optional[TreeNode], key: int) -> Optional[TreeNode]:
        if not root:
            return None
        if key < root.val:
            root.left = self.deleteNode(root.left, key)
        elif key > root.val:
            root.right = self.deleteNode(root.right, key)
        else:
            if not root.left:
                return root.right      # zero or one child: the child takes its place
            if not root.right:
                return root.left
            succ = root.right          # two children: the inorder successor steps in
            while succ.left:
                succ = succ.left
            root.val = succ.val
            root.right = self.deleteNode(root.right, succ.val)
        return root''',
  java='''class Solution {
    public TreeNode deleteNode(TreeNode root, int key) {
        if (root == null) return null;
        if (key < root.val) root.left = deleteNode(root.left, key);
        else if (key > root.val) root.right = deleteNode(root.right, key);
        else {
            if (root.left == null) return root.right;   // zero or one child
            if (root.right == null) return root.left;
            TreeNode succ = root.right;                 // two children: the successor steps in
            while (succ.left != null) succ = succ.left;
            root.val = succ.val;
            root.right = deleteNode(root.right, succ.val);
        }
        return root;
    }
}''', check_args=False)

prob(num=230, slug="kth-smallest-element-in-a-bst", title="Kth Smallest Element in a BST", diff="Medium",
  method="kthSmallest",
  ask="Return the k-th smallest value in a BST (counting from 1).",
  cue="Inorder visits a BST's values in increasing order, so the k-th node popped by an iterative inorder is the answer, and you can stop there.",
  brute="Collect every value, sort, and index: O(n log n).",
  approach="Run the iterative inorder from Binary Tree Inorder Traversal and count the nodes as they are popped. Return the value of the k-th.",
  cx="O(h + k) time, O(h) space.",
  trap="The follow-up, where the tree changes often and many k-th queries arrive. Rescanning is O(h + k) every time; the Ordered-Statistics Containers section stores each node's subtree size so a query walks one path, in O(h).",
  py='''class Solution:
    def kthSmallest(self, root: Optional[TreeNode], k: int) -> int:
        stack, node = [], root
        while True:
            while node:
                stack.append(node)
                node = node.left
            node = stack.pop()
            k -= 1
            if k == 0:
                return node.val        # the k-th value in sorted order: stop here
            node = node.right''',
  java='''import java.util.ArrayDeque;

class Solution {
    public int kthSmallest(TreeNode root, int k) {
        ArrayDeque<TreeNode> stack = new ArrayDeque<>();
        TreeNode node = root;
        while (true) {
            while (node != null) { stack.push(node); node = node.left; }
            node = stack.pop();
            if (--k == 0) return node.val;   // the k-th value in sorted order: stop
            node = node.right;
        }
    }
}''')

prob(num=235, slug="lowest-common-ancestor-of-a-binary-search-tree", title="Lowest Common Ancestor of a Binary Search Tree", diff="Medium",
  method="lowestCommonAncestor", observe=lambda r, a: r.val,
  ask="Find the lowest common ancestor of two nodes in a BST.",
  cue="Chapter 25's LCA works on any tree, but a BST tells you which side each node is on without searching: walk down from the root until p and q fall on different sides.",
  brute="The general-tree LCA from Chapter 25: O(n), ignoring the ordering.",
  approach="Start at the root. If both values are smaller than the node, go left; if both are larger, go right. Otherwise the paths to p and q split here (or one of them is this node), so this node is the answer.",
  cx="O(h) time, O(1) space.",
  trap="Continuing when the node equals p or q. If one of them is the current node, it is the ancestor of the other, and the split test (not both smaller, not both larger) already stops there.",
  py='''class Solution:
    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':
        node = root
        while True:
            if p.val < node.val and q.val < node.val:
                node = node.left
            elif p.val > node.val and q.val > node.val:
                node = node.right
            else:
                return node            # the paths split here (or one of them is here)''',
  java='''class Solution {
    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        TreeNode node = root;
        while (true) {
            if (p.val < node.val && q.val < node.val) node = node.left;
            else if (p.val > node.val && q.val > node.val) node = node.right;
            else return node;          // the paths split here (or one of them is here)
        }
    }
}''', check_args=False)

prob(num=1382, slug="balance-a-binary-search-tree", title="Balance a Binary Search Tree", diff="Medium",
  method="balanceBST", observe=shape(need_balance=True),
  ask="Return a height-balanced BST with the same values as a given BST (any such tree is accepted).",
  cue="The chapter's balanced trees keep balance with rotations on every update. When you are handed an already-built tree, rebuilding once is simpler: the inorder walk gives the sorted values, and Convert Sorted Array to BST builds a balanced tree from them.",
  brute="Rotate nodes until the tree is balanced, as AVL rebalancing would: correct but fiddly, and O(n log n) or worse to converge.",
  approach="Collect the values with an inorder walk (they come out sorted). Build a new tree from the middle out, as in Convert Sorted Array to BST.",
  cx="O(n) time, O(n) space.",
  trap="Balancing only the root. Picking a good root leaves both subtrees as unbalanced as before; every subtree needs its middle element as its root, which the recursive build provides.",
  py='''class Solution:
    def balanceBST(self, root: TreeNode) -> TreeNode:
        vals, stack, node = [], [], root
        while stack or node:           # inorder: sorted values
            while node:
                stack.append(node)
                node = node.left
            node = stack.pop()
            vals.append(node.val)
            node = node.right

        def build(lo, hi):             # middle-out, as in Convert Sorted Array to BST
            if lo >= hi:
                return None
            mid = (lo + hi) // 2
            return TreeNode(vals[mid], build(lo, mid), build(mid + 1, hi))
        return build(0, len(vals))''',
  java='''import java.util.*;

class Solution {
    private final List<Integer> vals = new ArrayList<>();

    public TreeNode balanceBST(TreeNode root) {
        ArrayDeque<TreeNode> stack = new ArrayDeque<>();
        TreeNode node = root;
        while (!stack.isEmpty() || node != null) {   // inorder: sorted values
            while (node != null) { stack.push(node); node = node.left; }
            node = stack.pop();
            vals.add(node.val);
            node = node.right;
        }
        return build(0, vals.size());
    }

    private TreeNode build(int lo, int hi) {   // middle-out
        if (lo >= hi) return null;
        int mid = (lo + hi) >>> 1;
        return new TreeNode(vals.get(mid), build(lo, mid), build(mid + 1, hi));
    }
}''', check_args=False)

prob(num=729, slug="my-calendar-i", title="My Calendar I", diff="Medium", design=True,
  ask="Accept a booking [start, end) only if it overlaps no earlier accepted booking; report whether it was accepted.",
  cue="An ordered container of accepted bookings (the Ordered-Statistics Containers section): a new booking can only clash with its neighbours in start order, the one that starts right before it and the one that starts right after.",
  brute="Compare against every accepted booking: O(n) per call, O(n²) overall.",
  approach="Keep bookings sorted by start. Find where the new start would go. It is accepted if the booking before it ends at or before the new start, and the booking after it starts at or after the new end. Java's TreeMap gives floor and ceiling in O(log n); Python's standard library has no balanced tree, so bisect plus a list insertion (O(n) per insert) is used, which is fine for 1,000 calls.",
  cx="O(log n) per call with a balanced tree (TreeMap); O(n) per insert with Python's list.",
  trap="Checking only the booking that starts right before. A booking starting later but before the new end also clashes, so both neighbours must be checked.",
  py='''from bisect import bisect_right

class MyCalendar:
    def __init__(self):
        self.starts, self.ends = [], []   # accepted bookings, sorted by start

    def book(self, startTime: int, endTime: int) -> bool:
        i = bisect_right(self.starts, startTime)
        if i > 0 and self.ends[i - 1] > startTime:
            return False               # the booking before runs into this one
        if i < len(self.starts) and self.starts[i] < endTime:
            return False               # this one runs into the booking after
        self.starts.insert(i, startTime)
        self.ends.insert(i, endTime)
        return True''',
  java='''import java.util.*;

class MyCalendar {
    private final TreeMap<Integer, Integer> booked = new TreeMap<>();   // start -> end

    public MyCalendar() {}

    public boolean book(int startTime, int endTime) {
        Map.Entry<Integer, Integer> before = booked.floorEntry(startTime);
        if (before != null && before.getValue() > startTime) return false;   // runs into us
        Integer after = booked.ceilingKey(startTime);
        if (after != null && after < endTime) return false;                  // we run into it
        booked.put(startTime, endTime);
        return true;
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=220, slug="contains-duplicate-iii", title="Contains Duplicate III", diff="Hard",
  method="containsNearbyAlmostDuplicate",
  ask="Decide whether two different positions i and j satisfy |i - j| ≤ indexDiff and |nums[i] - nums[j]| ≤ valueDiff.",
  cue="A sliding window of the last indexDiff values, asking \"is any value within valueDiff of x?\". An ordered set answers that with floor and ceiling in O(log k). Buckets of width valueDiff + 1 answer it in O(1): two values in the same bucket are close enough, and a close value can otherwise only be in a neighbouring bucket.",
  brute="Compare each value with the previous indexDiff values: O(n × indexDiff), up to 10¹⁰.",
  approach="Map each value x to bucket x // (valueDiff + 1), keeping at most one value per bucket (two in one bucket would already be an answer). For each x: if its bucket is occupied, or a neighbouring bucket holds a value within valueDiff, answer true. Otherwise store x, and once the window is full, remove the value that fell out of it.",
  cx="O(n) time, O(min(n, indexDiff)) space.",
  trap="Negative values in Java. Integer division rounds toward zero, so -1 / 3 is 0 and lands in the same bucket as 1; use Math.floorDiv. And differences of values up to ±10⁹ overflow int; compare in long.",
  py='''class Solution:
    def containsNearbyAlmostDuplicate(self, nums: list[int], indexDiff: int, valueDiff: int) -> bool:
        width = valueDiff + 1
        buckets = {}                   # bucket id -> the one value in it (within the window)
        for i, x in enumerate(nums):
            b = x // width             # Python's // rounds down, also for negatives
            if b in buckets:
                return True            # same bucket: close enough
            for nb in (b - 1, b + 1):
                if nb in buckets and abs(x - buckets[nb]) <= valueDiff:
                    return True
            buckets[b] = x
            if i >= indexDiff:
                del buckets[nums[i - indexDiff] // width]   # left the window
        return False''',
  java='''import java.util.HashMap;

class Solution {
    public boolean containsNearbyAlmostDuplicate(int[] nums, int indexDiff, int valueDiff) {
        long width = (long) valueDiff + 1;
        HashMap<Long, Long> buckets = new HashMap<>();   // bucket id -> its one value
        for (int i = 0; i < nums.length; i++) {
            long x = nums[i], b = Math.floorDiv(x, width);   // floorDiv: -1 / 3 would be 0
            if (buckets.containsKey(b)) return true;
            Long left = buckets.get(b - 1), right = buckets.get(b + 1);
            if (left != null && x - left <= valueDiff) return true;
            if (right != null && right - x <= valueDiff) return true;
            buckets.put(b, x);
            if (i >= indexDiff) buckets.remove(Math.floorDiv((long) nums[i - indexDiff], width));   // left the window
        }
        return false;
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(26)

def gen700():
    t = rand_tree(R, R.randint(1, 9), 1, 20, bst=True); return [t, R.randint(1, 20)]
def brute700(t, v):
    def find(n):
        if n is None: return None
        return n if n.val == v else find(n.left) or find(n.right)
    return tree_list(find(T(t)))

def gen701():
    t = rand_tree(R, R.randint(0, 8), -20, 20, bst=True)
    have = {v for v in t.vals if v is not None}
    return [t, R.choice([v for v in range(-25, 26) if v not in have])]

def gen235():
    t = rand_tree(R, R.randint(2, 9), -20, 20, bst=True)
    p, q = R.sample([v for v in t.vals if v is not None], 2)
    return [t, REF(p), REF(q)]
def brute235(t, p, q):
    r = T(t)
    def anc(v):
        n, out = r, []
        while n:
            out.append(n.val)
            if n.val == v: return out
            n = n.left if v < n.val else n.right
    a, b = anc(p.val), anc(q.val)
    return [x for x, y in zip(a, b) if x == y][-1]

def gen1382():
    vals = R.sample(range(1, 30), R.randint(1, 10))
    if R.random() < 0.5: vals.sort()   # sorted insertion: a chain
    root = None
    def ins(n, v):
        if n is None: return TreeNode(v)
        if v < n.val: n.left = ins(n.left, v)
        else: n.right = ins(n.right, v)
        return n
    for v in vals: root = ins(root, v)
    return [TREE(tree_list(root))]

def gen729():
    n = R.randint(1, 8); ops, args = ["MyCalendar"] + ["book"] * n, [[]]
    for _ in range(n):
        s = R.randint(0, 20); args.append([s, R.randint(s + 1, 24)])
    return ops, args
def brute729(ops, args):
    booked, res = [], [None]
    for s, e in args[1:]:
        ok = all(e <= a or b <= s for a, b in booked)
        if ok: booked.append((s, e))
        res.append(ok)
    return res

def gen220():
    a = [R.randint(-8, 8) for _ in range(R.randint(2, 9))]
    return [a, R.randint(1, len(a)), R.randint(0, 3)]
def brute220(a, k, t):
    return any(abs(a[i] - a[j]) <= t for i in range(len(a)) for j in range(i + 1, min(len(a), i + k + 1)))

BRUTE = {
  700:  (gen700, brute700),
  108:  (lambda: [sorted(R.sample(range(-20, 21), R.randint(1, 10)))], lambda a: want(a)),
  530:  (lambda: [rand_tree(R, R.randint(2, 9), 0, 40, bst=True)],
         lambda t: (lambda v: min(b - a for a, b in zip(v, v[1:])))(sorted(x for x in t.vals if x is not None))),
  701:  (gen701, lambda t, v: want(present(t) + [v])),
  450:  (lambda: (lambda t: [t, R.choice([v for v in t.vals if v is not None] + [99])])(rand_tree(R, R.randint(1, 9), -20, 20, bst=True))
         if R.random() < 0.9 else [TREE([]), 3], lambda t, k: want([v for v in present(t) if v != k])),
  230:  (lambda: (lambda t: [t, R.randint(1, len([v for v in t.vals if v is not None]))])(rand_tree(R, R.randint(1, 9), 0, 30, bst=True)),
         lambda t, k: sorted(v for v in t.vals if v is not None)[k - 1]),
  235:  (gen235, brute235),
  1382: (gen1382, lambda t: want(present(t))),
  729:  (gen729, brute729),
  220:  (gen220, brute220),
}
