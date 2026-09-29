# Chapter 29 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
# Trees here reach 10^5 nodes, so the Python solutions order the nodes with an explicit stack or queue
# instead of recursing (Chapter 6).
import random
from itertools import combinations
from practice import TREE, materialize, rand_tree

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

# ---------------------------------------------------------------- Medium
prob(num=1519, slug="number-of-nodes-in-the-sub-tree-with-the-same-label", title="Number of Nodes in the Sub-Tree With the Same Label", diff="Medium",
  method="countSubTrees",
  ask="In a tree rooted at node 0, each node has a letter. For every node, count the nodes in its subtree (itself included) with the same letter.",
  cue="Subtree questions: each node's answer is built from its children's. A count of the 26 letters per subtree, merged upward, answers every node at once.",
  brute="For each node, walk its whole subtree: O(n²) on a path.",
  approach="Order the nodes with an explicit DFS from node 0, recording parents. Walk that order backwards (children before parents), giving each node a 26-entry count: its own letter plus its children's counts added in. A node's answer is its count for its own letter.",
  cx="O(26 × n) time and space.",
  trap="Treating the edges as parent-to-child. They are undirected; the direction comes from rooting at node 0, which is what the parent array records.",
  py='''class Solution:
    def countSubTrees(self, n: int, edges: list[list[int]], labels: str) -> list[int]:
        adj = [[] for _ in range(n)]
        for a, b in edges:
            adj[a].append(b)
            adj[b].append(a)
        parent, order, stack = [-1] * n, [], [0]
        seen = [False] * n
        seen[0] = True
        while stack:                   # explicit DFS order: no recursion depth
            v = stack.pop()
            order.append(v)
            for w in adj[v]:
                if not seen[w]:
                    seen[w] = True
                    parent[w] = v
                    stack.append(w)
        count = [[0] * 26 for _ in range(n)]
        ans = [0] * n
        for v in reversed(order):      # children before parents
            count[v][ord(labels[v]) - 97] += 1
            ans[v] = count[v][ord(labels[v]) - 97]
            p = parent[v]
            if p >= 0:
                for c in range(26):
                    count[p][c] += count[v][c]
        return ans''',
  java='''import java.util.*;

class Solution {
    public int[] countSubTrees(int n, int[][] edges, String labels) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
        int[] parent = new int[n], order = new int[n], ans = new int[n];
        boolean[] seen = new boolean[n];
        ArrayDeque<Integer> stack = new ArrayDeque<>();
        stack.push(0); seen[0] = true; parent[0] = -1;
        int k = 0;
        while (!stack.isEmpty()) {     // explicit DFS order
            int v = stack.pop();
            order[k++] = v;
            for (int w : adj.get(v)) if (!seen[w]) { seen[w] = true; parent[w] = v; stack.push(w); }
        }
        int[][] count = new int[n][26];
        for (int i = n - 1; i >= 0; i--) {   // children before parents
            int v = order[i], c = labels.charAt(v) - 'a';
            ans[v] = ++count[v][c];
            if (parent[v] >= 0) for (int x = 0; x < 26; x++) count[parent[v]][x] += count[v][x];
        }
        return ans;
    }
}''')

prob(num=1123, slug="lowest-common-ancestor-of-deepest-leaves", title="Lowest Common Ancestor of Deepest Leaves", diff="Medium",
  method="lcaDeepestLeaves", observe=lambda r, a: r.val,
  ask="Return the lowest node whose subtree contains every deepest leaf of a binary tree.",
  cue="Chapter 25's tuple trick applied to LCA: return (height, answer) from each subtree. If both sides are equally tall, the deepest leaves are on both sides and this node is their LCA; otherwise the taller side's answer stands.",
  brute="Find the deepest leaves, then climb from each with parent pointers to their common ancestor: several passes.",
  approach="A helper returns (height, lca) for a subtree. For an empty tree, (0, None). For a node, compare the children's heights: equal means this node is the LCA; otherwise pass up the taller child's lca. The height is 1 + the larger.",
  cx="O(n) time, O(h) depth.",
  trap="Returning the LCA of all leaves. Only the deepest ones count; a shallow leaf on the other side must not pull the answer up to the root.",
  py='''class Solution:
    def lcaDeepestLeaves(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        def go(node):                  # (height, lca of this subtree's deepest leaves)
            if not node:
                return 0, None
            hl, left = go(node.left)
            hr, right = go(node.right)
            if hl == hr:
                return hl + 1, node    # deepest leaves on both sides
            return (hl + 1, left) if hl > hr else (hr + 1, right)
        return go(root)[1]''',
  java='''class Solution {
    private record Result(int height, TreeNode lca) {}   // lca of the subtree's deepest leaves

    public TreeNode lcaDeepestLeaves(TreeNode root) { return go(root).lca(); }

    private Result go(TreeNode node) {
        if (node == null) return new Result(0, null);
        Result l = go(node.left), r = go(node.right);
        if (l.height() == r.height()) return new Result(l.height() + 1, node);   // both sides
        return l.height() > r.height() ? new Result(l.height() + 1, l.lca()) : new Result(r.height() + 1, r.lca());
    }
}''', check_args=False)

prob(num=310, slug="minimum-height-trees", title="Minimum Height Trees", diff="Medium",
  method="findMinHeightTrees", observe=lambda r, a: sorted(r), check_args=False, unordered=True,
  ask="Return every node that, chosen as the root, gives a tree of minimum height (in any order).",
  cue="The Diameter and Centroid section: the best roots are the centre of the tree's longest path, which is one node or two. Peeling off leaves layer by layer converges on that centre.",
  brute="BFS from every node to measure the height: O(n²), 4 × 10⁸ at n = 2 × 10⁴.",
  approach="Compute degrees. Put all leaves (degree 1) in a queue. Remove them layer by layer, decreasing their neighbours' degrees and enqueuing neighbours that become leaves, until at most two nodes remain. Those are the centres.",
  cx="O(n) time and space.",
  trap="The single-node tree. It has no edges and no leaves of degree 1; its only node is the answer, so handle n = 1 before peeling.",
  py='''class Solution:
    def findMinHeightTrees(self, n: int, edges: list[list[int]]) -> list[int]:
        if n == 1:
            return [0]
        adj = [set() for _ in range(n)]
        for a, b in edges:
            adj[a].add(b)
            adj[b].add(a)
        leaves = [v for v in range(n) if len(adj[v]) == 1]
        remaining = n
        while remaining > 2:           # peel one layer of leaves at a time
            remaining -= len(leaves)
            nxt = []
            for leaf in leaves:
                nb = adj[leaf].pop()
                adj[nb].discard(leaf)
                if len(adj[nb]) == 1:
                    nxt.append(nb)
            leaves = nxt
        return leaves''',
  java='''import java.util.*;

class Solution {
    public List<Integer> findMinHeightTrees(int n, int[][] edges) {
        if (n == 1) return List.of(0);
        List<Set<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new HashSet<>());
        for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
        List<Integer> leaves = new ArrayList<>();
        for (int v = 0; v < n; v++) if (adj.get(v).size() == 1) leaves.add(v);
        int remaining = n;
        while (remaining > 2) {        // peel one layer of leaves at a time
            remaining -= leaves.size();
            List<Integer> next = new ArrayList<>();
            for (int leaf : leaves) {
                int nb = adj.get(leaf).iterator().next();
                adj.get(nb).remove(leaf);
                if (adj.get(nb).size() == 1) next.add(nb);
            }
            leaves = next;
        }
        return leaves;
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=1483, slug="kth-ancestor-of-a-tree-node", title="Kth Ancestor of a Tree Node", diff="Hard", design=True,
  ask="Given each node's parent, answer many queries \"what is the k-th ancestor of this node?\" (-1 if it does not exist).",
  cue="The Problem and Binary Lifting section: store every node's 1st, 2nd, 4th, 8th, … ancestor. Any k is a sum of powers of two, so a query takes one jump per set bit of k.",
  brute="Walk up k parents per query: O(k), up to 5 × 10⁴ per query and 2.5 × 10⁹ over all queries.",
  approach="up[j][v] is v's 2ʲ-th ancestor: up[0] is the parent array, and up[j][v] = up[j - 1][up[j - 1][v]] (two jumps of half the size), or -1 once it runs off the top. For a query, for each bit j set in k, jump v = up[j][v], stopping at -1.",
  cx="O(n log n) to build, O(log k) per query, O(n log n) space.",
  trap="Continuing to jump after reaching -1. Guard every lookup: once an ancestor does not exist, no larger ancestor does either.",
  py='''class TreeAncestor:
    def __init__(self, n: int, parent: list[int]):
        self.up = [parent[:]]          # up[j][v]: the 2^j-th ancestor of v, or -1
        for j in range(1, 17):         # 2^16 > 5 * 10^4
            prev = self.up[-1]
            self.up.append([-1 if prev[v] == -1 else prev[prev[v]] for v in range(n)])

    def getKthAncestor(self, node: int, k: int) -> int:
        j = 0
        while k and node != -1:
            if k & 1:
                node = self.up[j][node]   # one jump per set bit of k
            k >>= 1
            j += 1
        return node''',
  java='''class TreeAncestor {
    private final int[][] up;          // up[j][v]: the 2^j-th ancestor of v, or -1

    public TreeAncestor(int n, int[] parent) {
        up = new int[17][];            // 2^16 > 5 * 10^4
        up[0] = parent.clone();
        for (int j = 1; j < 17; j++) {
            up[j] = new int[n];
            for (int v = 0; v < n; v++) up[j][v] = up[j - 1][v] == -1 ? -1 : up[j - 1][up[j - 1][v]];
        }
    }

    public int getKthAncestor(int node, int k) {
        for (int j = 0; k > 0 && node != -1; j++, k >>= 1)
            if ((k & 1) == 1) node = up[j][node];   // one jump per set bit of k
        return node;
    }
}''')

prob(num=2846, slug="minimum-edge-weight-equilibrium-queries-in-a-tree", title="Minimum Edge Weight Equilibrium Queries in a Tree", diff="Hard",
  method="minOperationsQueries",
  ask="Edges have weights from 1 to 26. For each query (a, b), find the fewest edge weights to change so that every edge on the path from a to b has the same weight.",
  cue="Keep the most common weight on the path and change the rest. Counting weights on a path is prefix counting from the root: count(a) + count(b) - 2 × count(lca), with the LCA from binary lifting.",
  brute="Walk each query's path explicitly and count: O(n) per query, 2 × 10⁸ at the limits.",
  approach="Root the tree at 0 with a BFS, recording depth, parent, and cnt[v][w] = number of edges of weight w on the path from the root to v. Build binary-lifting tables. For a query, find l = lca(a, b); the path has depth[a] + depth[b] - 2 × depth[l] edges, and weight w appears cnt[a][w] + cnt[b][w] - 2 × cnt[l][w] times. The answer is the path length minus the largest such count.",
  cx="O(26 × n + n log n) to build, O(26 + log n) per query.",
  trap="Subtracting the LCA's count once instead of twice. Both a's and b's root paths pass through the LCA's root path, so it must come off twice.",
  py='''from collections import deque

class Solution:
    def minOperationsQueries(self, n: int, edges: list[list[int]], queries: list[list[int]]) -> list[int]:
        adj = [[] for _ in range(n)]
        for a, b, w in edges:
            adj[a].append((b, w))
            adj[b].append((a, w))
        LOG = max(1, n.bit_length())
        up = [[0] * n for _ in range(LOG)]
        depth, cnt = [0] * n, [[0] * 27 for _ in range(n)]
        seen, q = [False] * n, deque([0])
        seen[0] = True
        while q:                       # BFS from the root: parents, depths, weight counts
            v = q.popleft()
            for w, wt in adj[v]:
                if not seen[w]:
                    seen[w] = True
                    up[0][w], depth[w] = v, depth[v] + 1
                    cnt[w] = cnt[v][:]
                    cnt[w][wt] += 1
                    q.append(w)
        for j in range(1, LOG):
            up[j] = [up[j - 1][up[j - 1][v]] for v in range(n)]

        def lca(a, b):
            if depth[a] < depth[b]:
                a, b = b, a
            diff = depth[a] - depth[b]
            for j in range(LOG):       # lift a to b's depth
                if diff >> j & 1:
                    a = up[j][a]
            if a == b:
                return a
            for j in range(LOG - 1, -1, -1):   # lift both while they differ
                if up[j][a] != up[j][b]:
                    a, b = up[j][a], up[j][b]
            return up[0][a]

        out = []
        for a, b in queries:
            l = lca(a, b)
            length = depth[a] + depth[b] - 2 * depth[l]
            most = max(cnt[a][w] + cnt[b][w] - 2 * cnt[l][w] for w in range(1, 27))   # the LCA twice
            out.append(length - most)
        return out''',
  java='''import java.util.*;

class Solution {
    public int[] minOperationsQueries(int n, int[][] edges, int[][] queries) {
        List<List<int[]>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) { adj.get(e[0]).add(new int[]{e[1], e[2]}); adj.get(e[1]).add(new int[]{e[0], e[2]}); }
        int LOG = Math.max(1, 32 - Integer.numberOfLeadingZeros(n));
        int[][] up = new int[LOG][n], cnt = new int[n][27];
        int[] depth = new int[n];
        boolean[] seen = new boolean[n];
        ArrayDeque<Integer> q = new ArrayDeque<>();
        q.add(0); seen[0] = true;
        while (!q.isEmpty()) {         // BFS: parents, depths, weight counts
            int v = q.poll();
            for (int[] e : adj.get(v)) {
                int w = e[0];
                if (seen[w]) continue;
                seen[w] = true;
                up[0][w] = v; depth[w] = depth[v] + 1;
                cnt[w] = cnt[v].clone(); cnt[w][e[1]]++;
                q.add(w);
            }
        }
        for (int j = 1; j < LOG; j++) for (int v = 0; v < n; v++) up[j][v] = up[j - 1][up[j - 1][v]];
        int[] out = new int[queries.length];
        for (int i = 0; i < queries.length; i++) {
            int a = queries[i][0], b = queries[i][1], x = a, y = b;
            if (depth[x] < depth[y]) { int t = x; x = y; y = t; }
            for (int j = 0, diff = depth[x] - depth[y]; j < LOG; j++) if ((diff >> j & 1) == 1) x = up[j][x];   // same depth
            if (x != y) {
                for (int j = LOG - 1; j >= 0; j--) if (up[j][x] != up[j][y]) { x = up[j][x]; y = up[j][y]; }
                x = up[0][x];
            }
            int l = x, most = 0;
            for (int w = 1; w <= 26; w++) most = Math.max(most, cnt[a][w] + cnt[b][w] - 2 * cnt[l][w]);   // LCA twice
            out[i] = depth[a] + depth[b] - 2 * depth[l] - most;
        }
        return out;
    }
}''')

prob(num=2322, slug="minimum-score-after-removals-on-a-tree", title="Minimum Score After Removals on a Tree", diff="Hard",
  method="minimumScore",
  ask="Remove two edges from a tree with node values, splitting it into three parts. A split's score is the largest part-XOR minus the smallest. Find the minimum score.",
  cue="The Euler Tour section: entry and exit times tell you in O(1) whether one node's subtree contains another's. Removing the edges above nodes u and v leaves either nested subtrees or disjoint ones, and subtree XORs give all three parts either way.",
  brute="For each pair of edges, recompute the three parts with a search: O(n³), 10⁹ at n = 1,000.",
  approach="Root at 0. One DFS computes each node's subtree XOR x[v] and its entry/exit times. Every edge is identified by its lower node. For each pair of non-root nodes u, v: if v is inside u's subtree, the parts are x[v], x[u] ^ x[v], and total ^ x[u]; if u is inside v's, symmetric; otherwise x[u], x[v], and total ^ x[u] ^ x[v]. Keep the smallest max - min.",
  cx="O(n²) time for the pairs, 10⁶ at n = 1,000, and O(n) space.",
  trap="Treating nested and disjoint removals the same way. When v is inside u's subtree, u's part is x[u] with v's subtree taken out (x[u] ^ x[v]), not x[u].",
  py='''class Solution:
    def minimumScore(self, nums: list[int], edges: list[list[int]]) -> int:
        n = len(nums)
        adj = [[] for _ in range(n)]
        for a, b in edges:
            adj[a].append(b)
            adj[b].append(a)
        tin, tout, x, parent = [0] * n, [0] * n, nums[:], [-1] * n
        timer, stack, order = 0, [(0, False)], []
        while stack:                   # iterative DFS with entry and exit times
            v, done = stack.pop()
            if done:
                tout[v] = timer
                continue
            tin[v] = timer
            timer += 1
            order.append(v)
            stack.append((v, True))
            for w in adj[v]:
                if w != parent[v]:
                    parent[w] = v
                    stack.append((w, False))
        for v in reversed(order):      # subtree XORs, children first
            if parent[v] >= 0:
                x[parent[v]] ^= x[v]
        inside = lambda a, b: tin[a] <= tin[b] and tout[b] <= tout[a]   # b in a's subtree
        total, best = x[0], float("inf")
        for u in range(1, n):
            for v in range(u + 1, n):
                if inside(u, v):
                    parts = (x[v], x[u] ^ x[v], total ^ x[u])
                elif inside(v, u):
                    parts = (x[u], x[v] ^ x[u], total ^ x[v])
                else:
                    parts = (x[u], x[v], total ^ x[u] ^ x[v])
                best = min(best, max(parts) - min(parts))
        return best''',
  java='''import java.util.*;

class Solution {
    public int minimumScore(int[] nums, int[][] edges) {
        int n = nums.length;
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
        int[] tin = new int[n], tout = new int[n], x = nums.clone(), parent = new int[n], order = new int[n];
        Arrays.fill(parent, -1);
        int timer = 0, k = 0;
        ArrayDeque<int[]> stack = new ArrayDeque<>();   // {node, done}
        stack.push(new int[]{0, 0});
        while (!stack.isEmpty()) {     // iterative DFS with entry and exit times
            int[] top = stack.pop();
            int v = top[0];
            if (top[1] == 1) { tout[v] = timer; continue; }
            tin[v] = timer++;
            order[k++] = v;
            stack.push(new int[]{v, 1});
            for (int w : adj.get(v)) if (w != parent[v]) { parent[w] = v; stack.push(new int[]{w, 0}); }
        }
        for (int i = n - 1; i > 0; i--) x[parent[order[i]]] ^= x[order[i]];   // subtree XORs
        int total = x[0], best = Integer.MAX_VALUE;
        for (int u = 1; u < n; u++)
            for (int v = u + 1; v < n; v++) {
                int a, b, c;
                if (tin[u] <= tin[v] && tout[v] <= tout[u]) { a = x[v]; b = x[u] ^ x[v]; c = total ^ x[u]; }   // v in u
                else if (tin[v] <= tin[u] && tout[u] <= tout[v]) { a = x[u]; b = x[v] ^ x[u]; c = total ^ x[v]; }
                else { a = x[u]; b = x[v]; c = total ^ x[u] ^ x[v]; }
                best = Math.min(best, Math.max(a, Math.max(b, c)) - Math.min(a, Math.min(b, c)));
            }
        return best;
    }
}''')

prob(num=2246, slug="longest-path-with-different-adjacent-characters", title="Longest Path With Different Adjacent Characters", diff="Hard",
  method="longestPath",
  ask="In a tree given by a parent array, each node has a letter. Find the longest path (counted in nodes) on which no two adjacent nodes share a letter.",
  cue="Chapter 25's Diameter of Binary Tree on a general tree, with a filter: a child's downward chain can extend its parent only if their letters differ. The best path through a node joins its two longest such chains.",
  brute="Try every pair of endpoints and check their path: O(n²) pairs times O(n).",
  approach="Process nodes children-first (the reverse of a BFS order from the root). For each node keep the two longest valid downward chains among its children (children with a different letter). The best path through it is 1 + the two longest; its own chain, passed up to its parent, is 1 + the longest.",
  cx="O(n) time and space.",
  trap="Resetting a node's chain when a child shares its letter, as if the node were unusable. The node still starts a chain of length 1 and can still extend its own parent; only that one child is excluded.",
  py='''from collections import deque

class Solution:
    def longestPath(self, parent: list[int], s: str) -> int:
        n = len(parent)
        children = [[] for _ in range(n)]
        for v in range(1, n):
            children[parent[v]].append(v)
        order, q = [], deque([0])
        while q:                       # BFS order; reversed, children come first
            v = q.popleft()
            order.append(v)
            q.extend(children[v])
        chain, best = [1] * n, 1       # chain[v]: longest valid path going down from v
        for v in reversed(order):
            top1 = top2 = 0            # the two longest usable child chains
            for c in children[v]:
                if s[c] != s[v]:
                    if chain[c] > top1:
                        top1, top2 = chain[c], top1
                    elif chain[c] > top2:
                        top2 = chain[c]
            best = max(best, 1 + top1 + top2)   # the path that bends at v
            chain[v] = 1 + top1
        return best''',
  java='''import java.util.*;

class Solution {
    public int longestPath(int[] parent, String s) {
        int n = parent.length;
        List<List<Integer>> children = new ArrayList<>();
        for (int i = 0; i < n; i++) children.add(new ArrayList<>());
        for (int v = 1; v < n; v++) children.get(parent[v]).add(v);
        int[] order = new int[n], chain = new int[n];   // chain[v]: longest valid path down from v
        int head = 0, tail = 0, best = 1;
        order[tail++] = 0;
        while (head < tail) for (int c : children.get(order[head++])) order[tail++] = c;   // BFS order
        for (int i = n - 1; i >= 0; i--) {   // children first
            int v = order[i], top1 = 0, top2 = 0;
            for (int c : children.get(v)) {
                if (s.charAt(c) == s.charAt(v)) continue;
                if (chain[c] > top1) { top2 = top1; top1 = chain[c]; }
                else if (chain[c] > top2) top2 = chain[c];
            }
            best = Math.max(best, 1 + top1 + top2);   // the path that bends at v
            chain[v] = 1 + top1;
        }
        return best;
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(29)

def rand_tree_edges(n): return [[R.randrange(i), i] for i in range(1, n)]
def adjacency(n, edges):
    adj = [[] for _ in range(n)]
    for e in edges: adj[e[0]].append(e[1]); adj[e[1]].append(e[0])
    return adj
def path(n, edges, a, b):              # the nodes on the tree path from a to b
    adj = adjacency(n, edges); prev = {a: None}; q = [a]
    for x in q:
        for y in adj[x]:
            if y not in prev: prev[y] = x; q.append(y)
    out = [b]
    while out[-1] != a: out.append(prev[out[-1]])
    return out[::-1]

def gen1519():
    n = R.randint(1, 9); e = [x[::-1] if R.random() < 0.5 else x for x in rand_tree_edges(n)]
    return [n, e, "".join(R.choice("ab") for _ in range(n))]
def brute1519(n, edges, labels):
    out = []
    for v in range(n):
        sub = [w for w in range(n) if v in path(n, edges, 0, w)]
        out.append(sum(1 for w in sub if labels[w] == labels[v]))
    return out

def brute1123(t):
    r = materialize(t)
    depth, par, q = {id(r): 0}, {id(r): None}, [r]
    for x in q:
        for c in (x.left, x.right):
            if c: depth[id(c)] = depth[id(x)] + 1; par[id(c)] = x; q.append(c)
    deepest = [x for x in q if depth[id(x)] == max(depth.values())]
    anc = lambda x: [x] + (anc(par[id(x)]) if par[id(x)] else [])
    common = set(map(id, anc(deepest[0])))
    for d in deepest[1:]: common &= set(map(id, anc(d)))
    return max((x for x in q if id(x) in common), key=lambda x: depth[id(x)]).val

def gen310():
    n = R.randint(1, 9); return [n, rand_tree_edges(n)]
def brute310(n, edges):
    adj = adjacency(n, edges)
    def h(s):
        d = {s: 0}; q = [s]
        for x in q:
            for y in adj[x]:
                if y not in d: d[y] = d[x] + 1; q.append(y)
        return max(d.values())
    hs = [h(v) for v in range(n)]
    return sorted(v for v in range(n) if hs[v] == min(hs))

def gen1483():
    n = R.randint(1, 10); par = [-1] + [R.randrange(i) for i in range(1, n)]
    ops, args = ["TreeAncestor"], [[n, par]]
    for _ in range(R.randint(1, 8)):
        ops.append("getKthAncestor"); args.append([R.randrange(n), R.randint(1, n)])
    return ops, args
def brute1483(ops, args):
    par, res = args[0][1], [None]
    for v, k in args[1:]:
        for _ in range(k):
            v = par[v]
            if v == -1: break
        res.append(v)
    return res

def gen2846():
    n = R.randint(1, 9); e = [[a, b, R.randint(1, 4)] for a, b in rand_tree_edges(n)]
    return [n, e, [[R.randrange(n), R.randrange(n)] for _ in range(R.randint(1, 5))]]
def brute2846(n, edges, qs):
    w = {}
    for a, b, x in edges: w[(a, b)] = w[(b, a)] = x
    out = []
    for a, b in qs:
        p = path(n, [e[:2] for e in edges], a, b)
        ws = [w[(x, y)] for x, y in zip(p, p[1:])]
        out.append(len(ws) - max([ws.count(v) for v in set(ws)] or [0]))
    return out

def gen2322():
    n = R.randint(3, 8); return [[R.randint(1, 20) for _ in range(n)], rand_tree_edges(n)]
def brute2322(nums, edges):
    n, best = len(nums), None
    for i, j in combinations(range(len(edges)), 2):
        keep = [e for k, e in enumerate(edges) if k not in (i, j)]
        adj = adjacency(n, keep); seen, parts = set(), []
        for s in range(n):
            if s in seen: continue
            comp, q = 0, [s]; seen.add(s)
            for x in q:
                comp ^= nums[x]
                for y in adj[x]:
                    if y not in seen: seen.add(y); q.append(y)
            parts.append(comp)
        v = max(parts) - min(parts); best = v if best is None else min(best, v)
    return best

def gen2246():
    n = R.randint(1, 10); return [[-1] + [R.randrange(i) for i in range(1, n)], "".join(R.choice("ab") for _ in range(n))]
def brute2246(par, s):
    n = len(par); edges = [[par[v], v] for v in range(1, n)]; best = 1
    for a in range(n):
        for b in range(n):
            p = path(n, edges, a, b)
            if all(s[x] != s[y] for x, y in zip(p, p[1:])): best = max(best, len(p))
    return best

BRUTE = {
  1519: (gen1519, brute1519),
  1123: (lambda: [rand_tree(R, R.randint(1, 10), 0, 30, distinct=True)], brute1123),
  310:  (gen310, brute310),
  1483: (gen1483, brute1483),
  2846: (gen2846, brute2846),
  2322: (gen2322, brute2322),
  2246: (gen2246, brute2246),
}
