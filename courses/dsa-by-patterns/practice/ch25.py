# Chapter 25 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
# Tree DP: each call returns what its parent needs (often a tuple) and may update an answer on the side.
import random
from itertools import combinations
from practice import TREE, REF, TreeNode, materialize, rand_tree, tree_list

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

def nodes_of(t):
    out, q = [], [t] if t else []
    for n in q:
        out.append(n); q += [c for c in (n.left, n.right) if c]
    return out
def parents(t):
    par = {id(t): None}
    for n in nodes_of(t):
        for c in (n.left, n.right):
            if c: par[id(c)] = n
    return par
def height(t): return 0 if t is None else 1 + max(height(t.left), height(t.right))
T = materialize

# ---------------------------------------------------------------- Easy
prob(num=104, slug="maximum-depth-of-binary-tree", title="Maximum Depth of Binary Tree", diff="Easy",
  method="maxDepth",
  ask="Return the number of nodes on the longest path from the root down to a leaf.",
  cue="The Shape section's simplest tree DP: a node's depth is 1 plus the larger of its children's depths, and each child answers the same question for its own subtree.",
  brute="There is nothing slower that makes sense; every node must be looked at once.",
  approach="Return 0 for an empty tree. Otherwise return 1 + max(depth of left, depth of right).",
  cx="O(n) time, O(h) recursion depth.",
  trap="Recursion depth in Python. A tree of 10⁴ nodes can be one long chain, which recurses 10⁴ deep, past CPython's default limit of 1,000 (Chapter 6). A level-by-level BFS that counts levels gives the same answer with no recursion.",
  py='''class Solution:
    def maxDepth(self, root: Optional[TreeNode]) -> int:
        if not root:
            return 0
        return 1 + max(self.maxDepth(root.left), self.maxDepth(root.right))''',
  java='''class Solution {
    public int maxDepth(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
    }
}''')

prob(num=110, slug="balanced-binary-tree", title="Balanced Binary Tree", diff="Easy",
  method="isBalanced",
  ask="Decide whether every node's two subtrees differ in height by at most 1.",
  cue="The Height, Balance and Diameter section: return the height upward, and signal \"unbalanced\" with a special value (-1) so the parent can stop.",
  brute="At every node, compute both subtree heights from scratch: O(n²) on a chain.",
  approach="A helper returns the subtree's height, or -1 if any node inside it is unbalanced. For a node, get both children's results; if either is -1 or they differ by more than 1, return -1; otherwise return 1 + the larger. The tree is balanced if the root's result is not -1.",
  cx="O(n) time, O(h) depth.",
  trap="Checking balance only at the root. Both of the root's subtrees can have the same height while a node deep inside is badly unbalanced, as in a tree whose two sides are both long chains.",
  py='''class Solution:
    def isBalanced(self, root: Optional[TreeNode]) -> bool:
        def height(node):              # the height, or -1 if unbalanced anywhere below
            if not node:
                return 0
            left, right = height(node.left), height(node.right)
            if left < 0 or right < 0 or abs(left - right) > 1:
                return -1
            return 1 + max(left, right)
        return height(root) >= 0''',
  java='''class Solution {
    public boolean isBalanced(TreeNode root) { return height(root) >= 0; }

    private int height(TreeNode node) {   // the height, or -1 if unbalanced anywhere below
        if (node == null) return 0;
        int left = height(node.left), right = height(node.right);
        if (left < 0 || right < 0 || Math.abs(left - right) > 1) return -1;
        return 1 + Math.max(left, right);
    }
}''')

prob(num=543, slug="diameter-of-binary-tree", title="Diameter of Binary Tree", diff="Easy",
  method="diameterOfBinaryTree",
  ask="Return the number of edges on the longest path between any two nodes.",
  cue="The Height, Balance and Diameter section's key move: the function returns the height to its parent, and on the side updates the answer with the best path that bends at this node, left height plus right height.",
  brute="Compute heights from scratch at every node: O(n²).",
  approach="A helper returns the subtree height in nodes. At each node, with children's heights a and b, the longest path through this node has a + b edges; keep the maximum. Return 1 + max(a, b) upward.",
  cx="O(n) time, O(h) depth.",
  trap="Assuming the longest path goes through the root. It may lie entirely inside one subtree, which is why every node is a candidate.",
  py='''class Solution:
    def diameterOfBinaryTree(self, root: Optional[TreeNode]) -> int:
        best = 0

        def height(node):
            nonlocal best
            if not node:
                return 0
            a, b = height(node.left), height(node.right)
            best = max(best, a + b)    # the path that bends here
            return 1 + max(a, b)       # what the parent needs

        height(root)
        return best''',
  java='''class Solution {
    private int best = 0;

    public int diameterOfBinaryTree(TreeNode root) {
        height(root);
        return best;
    }

    private int height(TreeNode node) {
        if (node == null) return 0;
        int a = height(node.left), b = height(node.right);
        best = Math.max(best, a + b);  // the path that bends here
        return 1 + Math.max(a, b);     // what the parent needs
    }
}''')

prob(num=112, slug="path-sum", title="Path Sum", diff="Easy",
  method="hasPathSum",
  ask="Decide whether some root-to-leaf path adds up to a target.",
  cue="Information flows down this time: pass the remaining target to each child. At a leaf, check whether what remains equals the leaf's value.",
  brute="List every root-to-leaf path and sum it: O(n × h).",
  approach="For an empty tree, answer false. Subtract the node's value from the target. At a leaf, answer whether the remainder is 0. Otherwise ask the same of either child.",
  cx="O(n) time, O(h) depth.",
  trap="Stopping at any node, not only at leaves. A path must end at a leaf; with target 1 and tree [1, 2], the root alone sums to 1 but is not a leaf, so the answer is false.",
  py='''class Solution:
    def hasPathSum(self, root: Optional[TreeNode], targetSum: int) -> bool:
        if not root:
            return False
        rest = targetSum - root.val
        if not root.left and not root.right:
            return rest == 0           # only a leaf may end the path
        return self.hasPathSum(root.left, rest) or self.hasPathSum(root.right, rest)''',
  java='''class Solution {
    public boolean hasPathSum(TreeNode root, int targetSum) {
        if (root == null) return false;
        int rest = targetSum - root.val;
        if (root.left == null && root.right == null) return rest == 0;   // only a leaf ends a path
        return hasPathSum(root.left, rest) || hasPathSum(root.right, rest);
    }
}''')

# ---------------------------------------------------------------- Medium
prob(num=236, slug="lowest-common-ancestor-of-a-binary-tree", title="Lowest Common Ancestor of a Binary Tree", diff="Medium",
  method="lowestCommonAncestor", observe=lambda r, a: r.val,
  ask="Given two nodes p and q in a binary tree, return their lowest common ancestor: the deepest node that has both below it (a node counts as below itself).",
  cue="The Lowest Common Ancestor section: each call reports what it found below it (p, q, or their ancestor). The first node where the two searches meet from different sides is the answer.",
  brute="Record p's ancestors in a set, then walk up from q until you reach one of them: O(n) with parent pointers, which the tree does not have, so they must be built first.",
  approach="If the node is empty, p or q, return it. Otherwise search both subtrees. If both return something, p and q are on different sides and this node is their LCA. If only one side returns something, pass it up.",
  cx="O(n) time, O(h) depth.",
  trap="Continuing to search below p after finding it. If q is below p, then p is the answer, and returning p as soon as it is reached handles that case without looking further.",
  py='''class Solution:
    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':
        if root is None or root is p or root is q:
            return root                # found one (or nothing): report it upward
        left = self.lowestCommonAncestor(root.left, p, q)
        right = self.lowestCommonAncestor(root.right, p, q)
        if left and right:
            return root                # p and q are on different sides
        return left or right''',
  java='''class Solution {
    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null || root == p || root == q) return root;   // found one: report it
        TreeNode left = lowestCommonAncestor(root.left, p, q);
        TreeNode right = lowestCommonAncestor(root.right, p, q);
        if (left != null && right != null) return root;            // different sides
        return left != null ? left : right;
    }
}''', check_args=False)

prob(num=98, slug="validate-binary-search-tree", title="Validate Binary Search Tree", diff="Medium",
  method="isValidBST",
  ask="Decide whether a binary tree is a valid BST: every value in a node's left subtree is smaller than it, and every value in its right subtree is larger.",
  cue="The Validate a BST section: checking each node against its two children is not enough. Each node must lie inside a range set by all its ancestors, so pass the allowed range down.",
  brute="For every node, scan its whole left and right subtrees: O(n²). Or check that the inorder listing is strictly increasing, which is O(n) and correct.",
  approach="Recurse with (node, low, high), starting with no bounds. A node's value must be strictly between low and high. Its left child gets (low, value) and its right child gets (value, high).",
  cx="O(n) time, O(h) depth.",
  trap="Two. Comparing a node only with its children lets [5, 4, 6, null, null, 3, 7] through, although 3 sits in 5's right subtree. And in Java, using Integer.MIN_VALUE and MAX_VALUE as \"no bound\" fails when a node holds exactly those values, which the constraints allow; use null (or long) for \"no bound\".",
  py='''class Solution:
    def isValidBST(self, root: Optional[TreeNode]) -> bool:
        def ok(node, low, high):       # every value below must lie strictly in (low, high)
            if not node:
                return True
            if (low is not None and node.val <= low) or (high is not None and node.val >= high):
                return False
            return ok(node.left, low, node.val) and ok(node.right, node.val, high)
        return ok(root, None, None)''',
  java='''class Solution {
    public boolean isValidBST(TreeNode root) { return ok(root, null, null); }

    // Integer bounds, null for "none": MIN_VALUE and MAX_VALUE are legal node values
    private boolean ok(TreeNode node, Integer low, Integer high) {
        if (node == null) return true;
        if ((low != null && node.val <= low) || (high != null && node.val >= high)) return false;
        return ok(node.left, low, node.val) && ok(node.right, node.val, high);
    }
}''')

prob(num=1448, slug="count-good-nodes-in-binary-tree", title="Count Good Nodes in Binary Tree", diff="Medium",
  method="goodNodes",
  ask="A node is good if no node on the path from the root to it has a larger value. Count the good nodes.",
  cue="Pass the largest value seen on the way down; a node is good when its value is at least that.",
  brute="For each node, walk its path from the root and take the maximum: O(n × h).",
  approach="Recurse with (node, best so far). Count 1 if node.val ≥ best, then recurse into both children with max(best, node.val).",
  cx="O(n) time, O(h) depth.",
  trap="Using strictly greater. A node equal to the maximum above it is still good, since nothing on the path is larger.",
  py='''class Solution:
    def goodNodes(self, root: TreeNode) -> int:
        def count(node, best):         # best: the largest value above node
            if not node:
                return 0
            good = 1 if node.val >= best else 0   # equal counts as good
            best = max(best, node.val)
            return good + count(node.left, best) + count(node.right, best)
        return count(root, root.val)''',
  java='''class Solution {
    public int goodNodes(TreeNode root) { return count(root, root.val); }

    private int count(TreeNode node, int best) {   // best: the largest value above node
        if (node == null) return 0;
        int good = node.val >= best ? 1 : 0;       // equal counts as good
        best = Math.max(best, node.val);
        return good + count(node.left, best) + count(node.right, best);
    }
}''')

prob(num=337, slug="house-robber-iii", title="House Robber III", diff="Medium",
  method="rob",
  ask="Houses form a binary tree, and robbing a house and its direct parent is forbidden. Find the most you can take.",
  cue="The Tree DP Proper: Independent Set section. Return a pair upward: the best for this subtree if this node is robbed, and the best if it is not. The parent needs both to decide.",
  brute="Try every set of nodes with no parent-child pair: exponential.",
  approach="For each node, get (rob, skip) from both children. If this node is robbed, its children must be skipped: rob = val + left.skip + right.skip. If it is skipped, each child may be robbed or not: skip = max(left) + max(right). Answer max of the root's pair.",
  cx="O(n) time, O(h) depth.",
  trap="Memoizing a function of the node alone and trying grandchildren explicitly. It works, but it is the tuple idea in disguise and easier to get wrong. Returning both states answers every case in one pass.",
  py='''class Solution:
    def rob(self, root: Optional[TreeNode]) -> int:
        def best(node):                # (robbed, skipped) for this subtree
            if not node:
                return 0, 0
            lr, ls = best(node.left)
            rr, rs = best(node.right)
            robbed = node.val + ls + rs            # children must be skipped
            skipped = max(lr, ls) + max(rr, rs)    # children are free
            return robbed, skipped
        return max(best(root))''',
  java='''class Solution {
    public int rob(TreeNode root) {
        int[] r = best(root);
        return Math.max(r[0], r[1]);
    }

    private int[] best(TreeNode node) {   // {robbed, skipped} for this subtree
        if (node == null) return new int[]{0, 0};
        int[] l = best(node.left), r = best(node.right);
        int robbed = node.val + l[1] + r[1];                           // children skipped
        int skipped = Math.max(l[0], l[1]) + Math.max(r[0], r[1]);     // children free
        return new int[]{robbed, skipped};
    }
}''')

prob(num=437, slug="path-sum-iii", title="Path Sum III", diff="Medium",
  method="pathSum",
  ask="Count the downward paths (starting anywhere, ending anywhere below) whose values add up to a target.",
  cue="Chapter 9's Subarray Sum Equals K on the root-to-node path. Keep a count of the prefix sums on the current path; a path ending here has the target sum when current prefix - target was a prefix above.",
  brute="Start a downward search at every node: O(n × h), O(n²) on a chain.",
  approach="DFS with the running prefix sum and a map of prefix-sum counts for the ancestors on the path, starting with {0: 1}. At each node, add the count of prefix - target, then record the node's prefix, recurse into both children, and remove the record on the way back so other branches do not see it.",
  cx="O(n) time, O(h) space for the map and the recursion.",
  trap="Forgetting to remove the node's prefix after its subtree. The map must describe only the current root-to-node path; a leftover entry pairs a node with a \"prefix\" from a different branch. In Java, sums reach about 10¹² with values up to 10⁹, so use long.",
  py='''class Solution:
    def pathSum(self, root: Optional[TreeNode], targetSum: int) -> int:
        seen = {0: 1}                  # prefix sums on the current path, with counts

        def go(node, prefix):
            if not node:
                return 0
            prefix += node.val
            count = seen.get(prefix - targetSum, 0)
            seen[prefix] = seen.get(prefix, 0) + 1
            count += go(node.left, prefix) + go(node.right, prefix)
            seen[prefix] -= 1          # leaving this node: it is off the path now
            return count

        return go(root, 0)''',
  java='''import java.util.HashMap;

class Solution {
    private final HashMap<Long, Integer> seen = new HashMap<>();   // prefix sums on the path
    private int target;

    public int pathSum(TreeNode root, int targetSum) {
        target = targetSum;
        seen.put(0L, 1);
        return go(root, 0L);
    }

    private int go(TreeNode node, long prefix) {   // long: sums reach 10^12
        if (node == null) return 0;
        prefix += node.val;
        int count = seen.getOrDefault(prefix - target, 0);
        seen.merge(prefix, 1, Integer::sum);
        count += go(node.left, prefix) + go(node.right, prefix);
        seen.merge(prefix, -1, Integer::sum);   // leaving this node: off the path now
        return count;
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=124, slug="binary-tree-maximum-path-sum", title="Binary Tree Maximum Path Sum", diff="Hard",
  method="maxPathSum",
  ask="Find the largest sum of any path in a binary tree. A path follows parent-child links, visits a node at most once, and need not pass through the root. Values can be negative.",
  cue="The Maximum Path Sum section: Diameter's shape with sums. Return upward the best path that goes down from this node along one side; on the side, update the answer with the best path that bends here.",
  brute="Try every pair of endpoints and sum the path between them: O(n²) pairs times O(h).",
  approach="A helper returns the best downward sum starting at the node: its value plus the better child branch, but a branch counts only if it is positive (max(branch, 0)). At the node, the best path bending here is value + max(left, 0) + max(right, 0); keep the maximum over all nodes.",
  cx="O(n) time, O(h) depth.",
  trap="Returning the bending path upward. A parent can extend only a path that goes down one side, never one that uses both children of this node. And start the answer at the smallest possible value, not 0: in an all-negative tree the answer is the largest single node.",
  py='''class Solution:
    def maxPathSum(self, root: Optional[TreeNode]) -> int:
        best = root.val                # not 0: every value may be negative

        def down(node):                # best path going down from node on one side
            nonlocal best
            if not node:
                return 0
            left, right = max(down(node.left), 0), max(down(node.right), 0)   # drop losing branches
            best = max(best, node.val + left + right)   # the path that bends here
            return node.val + max(left, right)          # a parent can extend only one side
        down(root)
        return best''',
  java='''class Solution {
    private int best;

    public int maxPathSum(TreeNode root) {
        best = root.val;               // not 0: every value may be negative
        down(root);
        return best;
    }

    private int down(TreeNode node) {  // best path going down from node on one side
        if (node == null) return 0;
        int left = Math.max(down(node.left), 0), right = Math.max(down(node.right), 0);
        best = Math.max(best, node.val + left + right);   // the path that bends here
        return node.val + Math.max(left, right);          // a parent extends one side only
    }
}''')

prob(num=834, slug="sum-of-distances-in-tree", title="Sum of Distances in Tree", diff="Hard",
  method="sumOfDistancesInTree",
  ask="In a tree of n nodes given as edges, return for every node the sum of its distances to all other nodes.",
  cue="The Rerooting section. One DFS gives the answer for the root plus every subtree's size. Moving the root from a node to its child c brings the size(c) nodes of c's subtree one step closer and the other n - size(c) one step further.",
  brute="BFS from every node: O(n²), 9 × 10⁸ at n = 3 × 10⁴.",
  approach="Root the tree at 0. A post-order pass computes size[v] and the sum of depths below each node, which gives answer[0]. A pre-order pass then sets answer[c] = answer[parent] - size[c] + (n - size[c]) for every child c.",
  cx="O(n) time and space. Both passes below are iterative, so a path-shaped tree of 3 × 10⁴ nodes does not overflow the call stack.",
  trap="Recursing in Python on a tree given as edges. A path-shaped tree makes the DFS 3 × 10⁴ deep. The solution below orders the nodes with an explicit stack and then runs both passes as loops over that order.",
  py='''class Solution:
    def sumOfDistancesInTree(self, n: int, edges: list[list[int]]) -> list[int]:
        adj = [[] for _ in range(n)]
        for a, b in edges:
            adj[a].append(b)
            adj[b].append(a)
        parent, order, stack = [-1] * n, [], [0]
        seen = [False] * n
        seen[0] = True
        while stack:                   # an explicit DFS order: no recursion depth
            v = stack.pop()
            order.append(v)
            for w in adj[v]:
                if not seen[w]:
                    seen[w] = True
                    parent[w] = v
                    stack.append(w)
        size, below = [1] * n, [0] * n # below[v]: sum of depths within v's subtree
        for v in reversed(order):      # children before parents
            p = parent[v]
            if p >= 0:
                size[p] += size[v]
                below[p] += below[v] + size[v]
        ans = [0] * n
        ans[0] = below[0]
        for v in order[1:]:            # parents before children: reroot one edge at a time
            ans[v] = ans[parent[v]] - size[v] + (n - size[v])
        return ans''',
  java='''import java.util.*;

class Solution {
    public int[] sumOfDistancesInTree(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
        int[] parent = new int[n], order = new int[n], size = new int[n], ans = new int[n];
        long[] below = new long[n];    // sum of depths within the subtree
        boolean[] seen = new boolean[n];
        ArrayDeque<Integer> stack = new ArrayDeque<>();
        stack.push(0); seen[0] = true; parent[0] = -1;
        int k = 0;
        while (!stack.isEmpty()) {     // an explicit DFS order: no recursion depth
            int v = stack.pop();
            order[k++] = v;
            for (int w : adj.get(v)) if (!seen[w]) { seen[w] = true; parent[w] = v; stack.push(w); }
        }
        Arrays.fill(size, 1);
        for (int i = n - 1; i > 0; i--) {   // children before parents
            int v = order[i], p = parent[v];
            size[p] += size[v];
            below[p] += below[v] + size[v];
        }
        ans[0] = (int) below[0];
        for (int i = 1; i < n; i++) {  // parents before children: reroot one edge at a time
            int v = order[i];
            ans[v] = ans[parent[v]] - size[v] + (n - size[v]);
        }
        return ans;
    }
}''')

prob(num=968, slug="binary-tree-cameras", title="Binary Tree Cameras", diff="Hard",
  method="minCameraCover",
  ask="A camera on a node watches the node, its parent and its children. Find the fewest cameras that watch every node.",
  cue="A tree DP with three states per node, returned upward: \"has a camera\", \"watched by a child\", \"not watched yet\". Working from the leaves up, a leaf should never hold a camera: its parent watches at least as much.",
  brute="Try every set of camera nodes: 2ⁿ.",
  approach="A helper returns 0 for \"not watched\", 1 for \"watched, no camera\", 2 for \"has a camera\"; an empty child counts as watched. If either child is not watched, put a camera here (count it, return 2). Else if either child has a camera, this node is watched (return 1). Otherwise return 0 and let the parent cover it. At the end, if the root is not watched, add one camera.",
  cx="O(n) time, O(h) depth.",
  trap="Forgetting the root. Nothing above it can cover it, so if it comes back \"not watched\" it needs its own camera.",
  py='''class Solution:
    def minCameraCover(self, root: Optional[TreeNode]) -> int:
        cameras = 0
        NOT_WATCHED, WATCHED, CAMERA = 0, 1, 2

        def state(node):
            nonlocal cameras
            if not node:
                return WATCHED         # an empty child needs nothing
            left, right = state(node.left), state(node.right)
            if left == NOT_WATCHED or right == NOT_WATCHED:
                cameras += 1           # a child needs a camera here
                return CAMERA
            if left == CAMERA or right == CAMERA:
                return WATCHED
            return NOT_WATCHED         # leave it for the parent

        if state(root) == NOT_WATCHED:
            cameras += 1               # nothing above the root can cover it
        return cameras''',
  java='''class Solution {
    private int cameras = 0;
    private static final int NOT_WATCHED = 0, WATCHED = 1, CAMERA = 2;

    public int minCameraCover(TreeNode root) {
        if (state(root) == NOT_WATCHED) cameras++;   // nothing above the root covers it
        return cameras;
    }

    private int state(TreeNode node) {
        if (node == null) return WATCHED;            // an empty child needs nothing
        int left = state(node.left), right = state(node.right);
        if (left == NOT_WATCHED || right == NOT_WATCHED) { cameras++; return CAMERA; }
        if (left == CAMERA || right == CAMERA) return WATCHED;
        return NOT_WATCHED;                          // leave it for the parent
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(25)

def brute110(t):
    return all(abs(height(n.left) - height(n.right)) <= 1 for n in nodes_of(T(t)))

def path_nodes(par, a, b):             # the nodes on the tree path between a and b
    anc = []
    x = a
    while x is not None: anc.append(x); x = par[id(x)]
    ids = {id(x) for x in anc}
    y, tail = b, []
    while id(y) not in ids: tail.append(y); y = par[id(y)]
    return anc[:[id(x) for x in anc].index(id(y)) + 1] + tail[::-1]

def brute543(t):
    r = T(t); ns = nodes_of(r); par = parents(r)
    return max(len(path_nodes(par, a, b)) - 1 for a in ns for b in ns)

def leaf_paths(t, acc=0):
    if t is None: return []
    acc += t.val
    if not t.left and not t.right: return [acc]
    return leaf_paths(t.left, acc) + leaf_paths(t.right, acc)

def gen236():
    t = rand_tree(R, R.randint(2, 9), -20, 20, distinct=True)
    vals = [v for v in t.vals if v is not None]; p, q = R.sample(vals, 2)
    return [t, REF(p), REF(q)]
def brute236(t, p, q):
    r = T(t); par = parents(r); by = {n.val: n for n in nodes_of(r)}
    anc = set(); x = by[p.val]
    while x is not None: anc.add(id(x)); x = par[id(x)]
    y = by[q.val]
    while id(y) not in anc: y = par[id(y)]
    return y.val

def gen98():
    if R.random() < 0.5: return [rand_tree(R, R.randint(1, 9), bst=True)]
    return [rand_tree(R, R.randint(1, 7), -5, 5, distinct=True)]
def brute98(t):
    vals = []
    def ino(n):
        if n: ino(n.left); vals.append(n.val); ino(n.right)
    ino(T(t)); return all(a < b for a, b in zip(vals, vals[1:]))

def brute1448(t):
    r = T(t); par = parents(r)
    def good(n):
        x = par[id(n)]
        while x is not None:
            if x.val > n.val: return False
            x = par[id(x)]
        return True
    return sum(1 for n in nodes_of(r) if good(n))

def brute337(t):
    r = T(t); ns = nodes_of(r); par = parents(r); best = 0
    for mask in range(1 << len(ns)):
        chosen = {id(ns[i]) for i in range(len(ns)) if mask >> i & 1}
        if all(par[i] is None or id(par[i]) not in chosen for i in chosen):
            best = max(best, sum(n.val for n in ns if id(n) in chosen))
    return best

def brute437(t, target):
    r = T(t); par = parents(r); count = 0
    for n in nodes_of(r):              # every downward path ends at n: walk up from n
        s, x = 0, n
        while x is not None:
            s += x.val
            if s == target: count += 1
            x = par[id(x)]
    return count

def brute124(t):
    r = T(t); ns = nodes_of(r); par = parents(r)
    return max(sum(x.val for x in path_nodes(par, a, b)) for a in ns for b in ns)

def gen834():
    n = R.randint(1, 9); return [n, [[R.randrange(i), i] for i in range(1, n)]]
def brute834(n, edges):
    adj = [[] for _ in range(n)]
    for a, b in edges: adj[a].append(b); adj[b].append(a)
    out = []
    for s in range(n):
        dist = {s: 0}; q = [s]
        for x in q:
            for y in adj[x]:
                if y not in dist: dist[y] = dist[x] + 1; q.append(y)
        out.append(sum(dist.values()))
    return out

def brute968(t):
    r = T(t); ns = nodes_of(r); par = parents(r)
    for k in range(len(ns) + 1):
        for cams in combinations(range(len(ns)), k):
            c = {id(ns[i]) for i in cams}
            if all(id(n) in c or (par[id(n)] is not None and id(par[id(n)]) in c)
                   or any(ch is not None and id(ch) in c for ch in (n.left, n.right)) for n in ns):
                return k

BRUTE = {
  104:  (lambda: [rand_tree(R, R.randint(0, 10))], lambda t: height(T(t))),
  110:  (lambda: [rand_tree(R, R.randint(0, 9))], brute110),
  543:  (lambda: [rand_tree(R, R.randint(1, 9))], brute543),
  112:  (lambda: [rand_tree(R, R.randint(0, 8), -3, 3), R.randint(-6, 6)], lambda t, s: s in leaf_paths(T(t))),
  236:  (gen236, brute236),
  98:   (gen98, brute98),
  1448: (lambda: [rand_tree(R, R.randint(1, 10), -4, 4)], brute1448),
  337:  (lambda: [rand_tree(R, R.randint(1, 10), 0, 9)], brute337),
  437:  (lambda: [rand_tree(R, R.randint(0, 9), -3, 3), R.randint(-4, 4)], brute437),
  124:  (lambda: [rand_tree(R, R.randint(1, 9), -9, 9)], brute124),
  834:  (gen834, brute834),
  968:  (lambda: [rand_tree(R, R.randint(1, 10), 0, 0)], brute968),
}
