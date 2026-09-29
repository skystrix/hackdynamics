# Chapter 7 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
# Every solution uses the same small union-find: union by size plus path halving (a one-pass form of
# path compression). Union by size gives the same O(log n) height bound as the chapter's union by rank.
import random
from itertools import combinations, product
from math import gcd

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

# ---------------------------------------------------------------- Easy
prob(num=1971, slug="find-if-path-exists-in-graph", title="Find if Path Exists in Graph", diff="Easy",
  method="validPath",
  ask="Given an undirected graph as a list of edges, decide whether there is a path between two given nodes.",
  cue="\"Are these two things connected?\" after a batch of \"connect these two\" operations is the question the chapter's opening section poses. Union-find answers it directly.",
  brute="Build an adjacency list and search from the source with BFS or DFS: O(n + m). That is a perfectly good answer here, and Chapter 33 teaches it. Union-find wins when connections keep arriving and the question keeps being asked.",
  approach="Start with every node in its own set. Union the two ends of every edge. The answer is whether find(source) equals find(destination). This is the template the rest of the set reuses: find follows parent links to the root, halving the path as it goes; union attaches the smaller tree's root under the larger one's.",
  cx="O((n + m) α(n)) time, which is effectively linear, and O(n) space.",
  trap="Writing find recursively in Python. Without union by size or rank a chain can be 200,000 nodes deep, and Python's default recursion limit is 1,000. The loop below has no depth limit, and union by size keeps trees shallow anyway.",
  py='''class Solution:
    def validPath(self, n: int, edges: list[list[int]], source: int, destination: int) -> bool:
        parent, size = list(range(n)), [1] * n

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]   # path halving
                x = parent[x]
            return x

        def union(a, b):
            a, b = find(a), find(b)
            if a == b:
                return
            if size[a] < size[b]:
                a, b = b, a
            parent[b] = a              # smaller tree under the larger root
            size[a] += size[b]

        for u, v in edges:
            union(u, v)
        return find(source) == find(destination)''',
  java='''class Solution {
    private int[] parent, size;

    private int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];   // path halving
            x = parent[x];
        }
        return x;
    }

    private void union(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return;
        if (size[a] < size[b]) { int t = a; a = b; b = t; }
        parent[b] = a;                 // smaller tree under the larger root
        size[a] += size[b];
    }

    public boolean validPath(int n, int[][] edges, int source, int destination) {
        parent = new int[n]; size = new int[n];
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
        for (int[] e : edges) union(e[0], e[1]);
        return find(source) == find(destination);
    }
}''')

# ---------------------------------------------------------------- Medium
prob(num=547, slug="number-of-provinces", title="Number of Provinces", diff="Medium",
  method="findCircleNum",
  ask="Cities are connected directly according to an n × n matrix (1 means connected). A province is a group of cities connected directly or indirectly. Count the provinces.",
  cue="Counting groups under \"connected directly or indirectly\" is counting union-find sets. Every successful union merges two groups into one, so the count drops by one.",
  brute="DFS from each unvisited city, marking everything reachable: O(n²) for a matrix, and also fine. (The premium problem \"Number of Connected Components in an Undirected Graph\" is the same question on an edge list.)",
  approach="Start with n groups. For every pair i &lt; j with isConnected[i][j] = 1, union them; each union that actually merges two different roots lowers the group count by one. The final count is the answer.",
  cx="O(n² α(n)) time, since the matrix itself has n² entries. O(n) space.",
  trap="Decrementing the count on every union call. When the two cities already share a root, nothing merges and the count must not change. Have union report whether it merged.",
  py='''class Solution:
    def findCircleNum(self, isConnected: list[list[int]]) -> int:
        n = len(isConnected)
        parent, size = list(range(n)), [1] * n

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        groups = n
        for i in range(n):
            for j in range(i + 1, n):
                if isConnected[i][j]:
                    a, b = find(i), find(j)
                    if a != b:         # only a real merge lowers the count
                        if size[a] < size[b]:
                            a, b = b, a
                        parent[b] = a
                        size[a] += size[b]
                        groups -= 1
        return groups''',
  java='''class Solution {
    private int[] parent, size;

    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }

    public int findCircleNum(int[][] isConnected) {
        int n = isConnected.length, groups = n;
        parent = new int[n]; size = new int[n];
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++) {
                if (isConnected[i][j] == 0) continue;
                int a = find(i), b = find(j);
                if (a == b) continue;  // only a real merge lowers the count
                if (size[a] < size[b]) { int t = a; a = b; b = t; }
                parent[b] = a;
                size[a] += size[b];
                groups--;
            }
        return groups;
    }
}''')

prob(num=684, slug="redundant-connection", title="Redundant Connection", diff="Medium",
  method="findRedundantConnection",
  ask="A tree on nodes 1 to n had one extra edge added, making a cycle. Return an edge whose removal leaves a tree; if several work, return the one that appears last in the input.",
  cue="Add the edges one at a time. The edge that closes the cycle is the first one whose two ends are already connected, and union-find notices that at the moment of union. (This also answers the premium \"Graph Valid Tree\": a graph is a tree exactly when no union fails and it has n - 1 edges.)",
  brute="For each edge from last to first, remove it and check with a search whether the rest is a tree: O(n²).",
  approach="Process the edges in input order. For each edge (u, v), if find(u) == find(v), u and v were already connected, so this edge closes the cycle: return it. Otherwise union them.",
  cx="O(n α(n)) time, O(n) space.",
  trap="Why the first failing edge is the right one. Every edge on the cycle is removable, and the cycle is only complete once its last edge in input order arrives, so the first edge that fails is exactly the last cycle edge in the input.",
  py='''class Solution:
    def findRedundantConnection(self, edges: list[list[int]]) -> list[int]:
        n = len(edges)
        parent, size = list(range(n + 1)), [1] * (n + 1)   # nodes are 1..n

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        for u, v in edges:
            a, b = find(u), find(v)
            if a == b:                 # already connected: this edge closes the cycle
                return [u, v]
            if size[a] < size[b]:
                a, b = b, a
            parent[b] = a
            size[a] += size[b]
        return []''',
  java='''class Solution {
    private int[] parent, size;

    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }

    public int[] findRedundantConnection(int[][] edges) {
        int n = edges.length;
        parent = new int[n + 1]; size = new int[n + 1];   // nodes are 1..n
        for (int i = 0; i <= n; i++) { parent[i] = i; size[i] = 1; }
        for (int[] e : edges) {
            int a = find(e[0]), b = find(e[1]);
            if (a == b) return e;      // already connected: this edge closes the cycle
            if (size[a] < size[b]) { int t = a; a = b; b = t; }
            parent[b] = a;
            size[a] += size[b];
        }
        return new int[0];
    }
}''')

prob(num=990, slug="satisfiability-of-equality-equations", title="Satisfiability of Equality Equations", diff="Medium",
  method="equationsPossible",
  ask="Given equations like \"a==b\" and \"b!=c\" over single-letter variables, decide whether some assignment of numbers makes all of them true.",
  cue="Equality is transitive, so the == equations sort the letters into groups that must share a value: union-find over 26 letters. A != equation fails exactly when its two letters landed in the same group.",
  brute="Try every assignment of values to the letters used. With k distinct letters that is kᵏ assignments, fine for four letters and hopeless for twenty-six.",
  approach="First pass: union the two letters of every \"==\" equation. Second pass: for every \"!=\" equation, if both letters have the same root, the equations contradict each other; return false. Otherwise return true.",
  cx="O(n α(26)) time, O(1) space for 26 letters.",
  trap="Doing both kinds in one pass in input order. \"a!=c\" might be checked before \"a==b\" and \"b==c\" have joined a and c. All the equalities must go in first. This is the chapter's closing point: union-find cannot un-merge, so it can only answer questions about the unions made so far.",
  py='''class Solution:
    def equationsPossible(self, equations: list[str]) -> bool:
        parent = list(range(26))

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        for e in equations:            # pass one: every equality
            if e[1] == "=":
                parent[find(ord(e[0]) - 97)] = find(ord(e[3]) - 97)
        for e in equations:            # pass two: check the inequalities
            if e[1] == "!" and find(ord(e[0]) - 97) == find(ord(e[3]) - 97):
                return False
        return True''',
  java='''class Solution {
    private final int[] parent = new int[26];

    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }

    public boolean equationsPossible(String[] equations) {
        for (int i = 0; i < 26; i++) parent[i] = i;
        for (String e : equations)     // pass one: every equality
            if (e.charAt(1) == '=') parent[find(e.charAt(0) - 'a')] = find(e.charAt(3) - 'a');
        for (String e : equations)     // pass two: check the inequalities
            if (e.charAt(1) == '!' && find(e.charAt(0) - 'a') == find(e.charAt(3) - 'a')) return false;
        return true;
    }
}''')

prob(num=1319, slug="number-of-operations-to-make-network-connected", title="Number of Operations to Make Network Connected", diff="Medium",
  method="makeConnected",
  ask="n computers are joined by cables. In one operation you can unplug any cable and use it to join two computers. Find the fewest operations that connect every computer, or -1 if it is impossible.",
  cue="Connecting k separate groups takes exactly k - 1 cables. Union-find counts the groups, and every cable whose union fails (both ends already connected) is a spare you can move.",
  brute="Search over which cables to move: exponential, and unnecessary once you see the counting argument.",
  approach="If there are fewer than n - 1 cables, even a perfect arrangement cannot connect n computers: return -1. Otherwise union every cable's two ends while counting groups, and return groups - 1. With at least n - 1 cables there are always enough spares.",
  cx="O((n + m) α(n)) time, O(n) space.",
  trap="Returning the number of spare cables instead of the number of groups minus one. You need one move per missing connection, not per spare cable.",
  py='''class Solution:
    def makeConnected(self, n: int, connections: list[list[int]]) -> int:
        if len(connections) < n - 1:
            return -1                  # not enough cables in total
        parent, size = list(range(n)), [1] * n

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        groups = n
        for u, v in connections:
            a, b = find(u), find(v)
            if a != b:
                if size[a] < size[b]:
                    a, b = b, a
                parent[b] = a
                size[a] += size[b]
                groups -= 1
        return groups - 1''',
  java='''class Solution {
    private int[] parent, size;

    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }

    public int makeConnected(int n, int[][] connections) {
        if (connections.length < n - 1) return -1;   // not enough cables in total
        parent = new int[n]; size = new int[n];
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
        int groups = n;
        for (int[] c : connections) {
            int a = find(c[0]), b = find(c[1]);
            if (a == b) continue;
            if (size[a] < size[b]) { int t = a; a = b; b = t; }
            parent[b] = a;
            size[a] += size[b];
            groups--;
        }
        return groups - 1;
    }
}''')

prob(num=947, slug="most-stones-removed-with-same-row-or-column", title="Most Stones Removed with Same Row or Column", diff="Medium",
  method="removeStones",
  ask="Stones sit at distinct grid points. You may remove a stone if another remaining stone shares its row or column. Find the most stones you can remove.",
  cue="Stones that share a row or column form groups, and within a group you can always remove every stone but one. So the answer is stones minus groups, and counting groups is union-find's job.",
  brute="Try removal orders with backtracking: exponential. Comparing every pair of stones to build the groups is O(n²).",
  approach="Instead of comparing stones with each other, union each stone's row with its column, treating rows and columns as nodes (columns shifted by 10,001 so they cannot collide with rows). Stones in the same group are then connected through shared rows and columns. Count the distinct roots among the rows and columns that were used, and return n minus that count.",
  cx="O(n α(n)) time, O(n) space with a dictionary of the nodes in use.",
  trap="Counting groups over all 20,002 possible row and column nodes. Only nodes that some stone touched belong to a group; count roots over those alone.",
  py='''class Solution:
    def removeStones(self, stones: list[list[int]]) -> int:
        parent = {}

        def find(x):
            parent.setdefault(x, x)
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        for r, c in stones:            # join the stone's row to its column
            parent[find(r)] = find(c + 10001)
        groups = len({find(x) for x in parent})   # only nodes a stone touched
        return len(stones) - groups''',
  java='''import java.util.*;

class Solution {
    private final HashMap<Integer, Integer> parent = new HashMap<>();

    private int find(int x) {
        parent.putIfAbsent(x, x);
        while (parent.get(x) != x) {
            parent.put(x, parent.get(parent.get(x)));
            x = parent.get(x);
        }
        return x;
    }

    public int removeStones(int[][] stones) {
        for (int[] s : stones) parent.put(find(s[0]), find(s[1] + 10001));   // row to column
        Set<Integer> roots = new HashSet<>();
        for (int x : new ArrayList<>(parent.keySet())) roots.add(find(x));    // touched nodes only
        return stones.length - roots.size();
    }
}''')

prob(num=2316, slug="count-unreachable-pairs-of-nodes-in-an-undirected-graph", title="Count Unreachable Pairs of Nodes in an Undirected Graph", diff="Medium",
  method="countPairs",
  ask="Count the pairs of nodes in an undirected graph that have no path between them.",
  cue="Two nodes are unreachable exactly when they are in different groups. Union by size already tracks every group's size, and the pairs follow from the sizes.",
  brute="For every pair, search for a path: O(n² × (n + m)).",
  approach="Union all edges. Then walk the groups (one per root) in any order, keeping seen = the number of nodes in groups already visited. A group of size s forms s × seen unreachable pairs with those earlier groups. Add it, then add s to seen.",
  cx="O((n + m) α(n)) time, O(n) space.",
  trap="Overflow. With 100,000 nodes the answer can reach about 5 × 10⁹, beyond Java's int, which is why the Java signature returns long. Multiply in long.",
  py='''class Solution:
    def countPairs(self, n: int, edges: list[list[int]]) -> int:
        parent, size = list(range(n)), [1] * n

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        for u, v in edges:
            a, b = find(u), find(v)
            if a != b:
                if size[a] < size[b]:
                    a, b = b, a
                parent[b] = a
                size[a] += size[b]
        pairs = seen = 0
        for x in range(n):
            if find(x) == x:           # one visit per group
                pairs += size[x] * seen
                seen += size[x]
        return pairs''',
  java='''class Solution {
    private int[] parent, size;

    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }

    public long countPairs(int n, int[][] edges) {
        parent = new int[n]; size = new int[n];
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
        for (int[] e : edges) {
            int a = find(e[0]), b = find(e[1]);
            if (a == b) continue;
            if (size[a] < size[b]) { int t = a; a = b; b = t; }
            parent[b] = a;
            size[a] += size[b];
        }
        long pairs = 0, seen = 0;      // long: the answer can pass 2^31
        for (int x = 0; x < n; x++)
            if (find(x) == x) {        // one visit per group
                pairs += size[x] * seen;
                seen += size[x];
            }
        return pairs;
    }
}''')

prob(num=2492, slug="minimum-score-of-a-path-between-two-cities", title="Minimum Score of a Path Between Two Cities", diff="Medium",
  method="minScore",
  ask="Cities 1 to n are joined by roads with distances. A path's score is the shortest road on it, and paths may repeat roads and cities. Find the smallest possible score of a path from city 1 to city n (one is guaranteed to exist).",
  cue="Because a path may wander anywhere and come back, it can use any road in the group that contains city 1. So the answer is the shortest road in that group: a connectivity question, not a shortest-path one.",
  brute="Dijkstra-style searches over paths chase the wrong quantity and are easy to get wrong here.",
  approach="Union the two ends of every road. Then scan the roads again and take the smallest distance among those whose ends are in the same group as city 1.",
  cx="O((n + m) α(n)) time, O(n) space.",
  trap="Reading \"path\" as \"simple path\" and reaching for Dijkstra. Repeats are allowed, so the path can detour to the cheapest road in the group and return.",
  py='''class Solution:
    def minScore(self, n: int, roads: list[list[int]]) -> int:
        parent, size = list(range(n + 1)), [1] * (n + 1)

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        for u, v, _ in roads:
            a, b = find(u), find(v)
            if a != b:
                if size[a] < size[b]:
                    a, b = b, a
                parent[b] = a
                size[a] += size[b]
        root = find(1)
        return min(d for u, v, d in roads if find(u) == root)   # any road in city 1's group''',
  java='''class Solution {
    private int[] parent, size;

    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }

    public int minScore(int n, int[][] roads) {
        parent = new int[n + 1]; size = new int[n + 1];
        for (int i = 0; i <= n; i++) { parent[i] = i; size[i] = 1; }
        for (int[] r : roads) {
            int a = find(r[0]), b = find(r[1]);
            if (a == b) continue;
            if (size[a] < size[b]) { int t = a; a = b; b = t; }
            parent[b] = a;
            size[a] += size[b];
        }
        int root = find(1), best = Integer.MAX_VALUE;
        for (int[] r : roads) if (find(r[0]) == root) best = Math.min(best, r[2]);   // city 1's group
        return best;
    }
}''')

prob(num=1061, slug="lexicographically-smallest-equivalent-string", title="Lexicographically Smallest Equivalent String", diff="Medium",
  method="smallestEquivalentString",
  ask="Two strings of equal length declare s1[i] and s2[i] equivalent for every i, and equivalence is transitive. Rewrite a third string using the smallest letter equivalent to each of its letters.",
  cue="Equivalence classes over 26 letters: union-find again, with one twist. The root of each group should be its smallest letter, so the answer for any letter is its root.",
  brute="Repeatedly spread equivalences until nothing changes (a transitive closure over 26 letters), then pick minimums.",
  approach="For every pair (s1[i], s2[i]), find both roots and attach the larger letter's root under the smaller one. Then every root is the smallest letter in its group, and each letter of baseStr is replaced by find(letter).",
  cx="O((n + len(baseStr)) α(26)) time, O(1) space.",
  trap="Using union by size here. That attaches by group size, so the root is no longer the smallest letter. With only 26 letters, trees stay tiny and the ordering rule is the one that matters.",
  py='''class Solution:
    def smallestEquivalentString(self, s1: str, s2: str, baseStr: str) -> str:
        parent = list(range(26))

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        for a, b in zip(s1, s2):
            ra, rb = find(ord(a) - 97), find(ord(b) - 97)
            parent[max(ra, rb)] = min(ra, rb)   # the smaller letter stays the root
        return "".join(chr(find(ord(c) - 97) + 97) for c in baseStr)''',
  java='''class Solution {
    private final int[] parent = new int[26];

    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }

    public String smallestEquivalentString(String s1, String s2, String baseStr) {
        for (int i = 0; i < 26; i++) parent[i] = i;
        for (int i = 0; i < s1.length(); i++) {
            int a = find(s1.charAt(i) - 'a'), b = find(s2.charAt(i) - 'a');
            parent[Math.max(a, b)] = Math.min(a, b);   // the smaller letter stays the root
        }
        StringBuilder out = new StringBuilder();
        for (char c : baseStr.toCharArray()) out.append((char) ('a' + find(c - 'a')));
        return out.toString();
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=685, slug="redundant-connection-ii", title="Redundant Connection II", diff="Hard",
  method="findRedundantDirectedConnection",
  ask="A rooted tree on nodes 1 to n (every edge points from parent to child) had one extra directed edge added. Return the edge to remove so that a rooted tree remains; if several work, return the last one in the input.",
  cue="Redundant Connection, directed. The extra edge breaks a rooted tree in one of two ways: some node gets two parents, or the edges form a directed cycle (or both). Find the two-parent node first, then let union-find detect the cycle.",
  brute="For each edge from last to first, remove it and check that one node has no parent, every other node has exactly one, and every node is reachable from the root: O(n²).",
  approach="Scan for a node with two incoming edges; call them first and second (in input order). Then run union-find over all edges except second. If no cycle appears, second was the extra edge: return it. If a cycle appears and there was a two-parent node, first is the culprit: return it. If a cycle appears and no node has two parents, return the edge that closed the cycle, as in Redundant Connection.",
  cx="O(n α(n)) time, O(n) space.",
  trap="Treating it as the undirected problem. A cycle check alone misses the case where a node has two parents but there is no directed cycle, and returning the cycle-closing edge can leave a node with two parents.",
  py='''class Solution:
    def findRedundantDirectedConnection(self, edges: list[list[int]]) -> list[int]:
        n = len(edges)
        par = [0] * (n + 1)
        first = second = None
        for u, v in edges:             # does some node have two parents?
            if par[v]:
                first, second = [par[v], v], [u, v]
            else:
                par[v] = u
        parent = list(range(n + 1))

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        for u, v in edges:
            if [u, v] == second:
                continue               # try the tree without the second parent edge
            a, b = find(u), find(v)
            if a == b:                 # a cycle remains
                return first if first else [u, v]
            parent[b] = a
        return second''',
  java='''class Solution {
    private int[] parent;

    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }

    public int[] findRedundantDirectedConnection(int[][] edges) {
        int n = edges.length;
        int[] par = new int[n + 1];
        int[] first = null, second = null;
        for (int[] e : edges) {        // does some node have two parents?
            if (par[e[1]] != 0) { first = new int[]{par[e[1]], e[1]}; second = e; }
            else par[e[1]] = e[0];
        }
        parent = new int[n + 1];
        for (int i = 0; i <= n; i++) parent[i] = i;
        for (int[] e : edges) {
            if (e == second) continue; // try the tree without the second parent edge
            int a = find(e[0]), b = find(e[1]);
            if (a == b) return first != null ? first : e;   // a cycle remains
            parent[b] = a;
        }
        return second;
    }
}''')

prob(num=1579, slug="remove-max-number-of-edges-to-keep-graph-fully-traversable", title="Remove Max Number of Edges to Keep Graph Fully Traversable", diff="Hard",
  method="maxNumEdgesToRemove",
  ask="A graph has edges usable by Alice only (type 1), by Bob only (type 2), or by both (type 3). Remove as many edges as possible while each of them can still reach every node; return -1 if that is impossible from the start.",
  cue="Two union-finds, one per person. A shared edge is worth more than a private one because it serves both, so give the shared edges first pick: a greedy order, then plain union-find bookkeeping.",
  brute="Try every subset of edges to keep, smallest first: O(2ᵐ).",
  approach="Keep one union-find for Alice and one for Bob. Add every type-3 edge to both; keep it if it merged anything in either (with both starting identical, it merges in both or neither). Then add type-1 edges to Alice's and type-2 edges to Bob's, keeping each edge that merges. If either person ends with more than one group, return -1. Otherwise the answer is the number of edges not kept.",
  cx="O(m α(n)) time, O(n) space.",
  trap="Processing edges in input order. A private edge taken early can make a later shared edge look redundant for that person, and then the other person needs an extra private edge. Shared edges first is what makes the greedy optimal.",
  py='''class Solution:
    def maxNumEdgesToRemove(self, n: int, edges: list[list[int]]) -> int:
        def make():
            return list(range(n + 1))

        def find(p, x):
            while p[x] != x:
                p[x] = p[p[x]]
                x = p[x]
            return x

        def union(p, a, b):            # True if it merged two groups
            a, b = find(p, a), find(p, b)
            if a == b:
                return False
            p[b] = a
            return True

        alice, bob = make(), make()
        kept = 0
        groups_a = groups_b = n
        for t, u, v in edges:          # shared edges get first pick
            if t == 3 and union(alice, u, v):
                union(bob, u, v)
                kept += 1
                groups_a -= 1
                groups_b -= 1
        for t, u, v in edges:
            if t == 1 and union(alice, u, v):
                kept += 1
                groups_a -= 1
            elif t == 2 and union(bob, u, v):
                kept += 1
                groups_b -= 1
        if groups_a > 1 or groups_b > 1:
            return -1
        return len(edges) - kept''',
  java='''class Solution {
    private int find(int[] p, int x) {
        while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; }
        return x;
    }

    private boolean union(int[] p, int a, int b) {   // true if it merged two groups
        a = find(p, a); b = find(p, b);
        if (a == b) return false;
        p[b] = a;
        return true;
    }

    public int maxNumEdgesToRemove(int n, int[][] edges) {
        int[] alice = new int[n + 1], bob = new int[n + 1];
        for (int i = 0; i <= n; i++) { alice[i] = i; bob[i] = i; }
        int kept = 0, groupsA = n, groupsB = n;
        for (int[] e : edges)          // shared edges get first pick
            if (e[0] == 3 && union(alice, e[1], e[2])) {
                union(bob, e[1], e[2]);
                kept++; groupsA--; groupsB--;
            }
        for (int[] e : edges) {
            if (e[0] == 1 && union(alice, e[1], e[2])) { kept++; groupsA--; }
            else if (e[0] == 2 && union(bob, e[1], e[2])) { kept++; groupsB--; }
        }
        if (groupsA > 1 || groupsB > 1) return -1;
        return edges.length - kept;
    }
}''')

prob(num=952, slug="largest-component-size-by-common-factor", title="Largest Component Size by Common Factor", diff="Hard",
  method="largestComponentSize",
  ask="Connect two numbers in a list when they share a common factor greater than 1. Return the size of the largest connected group.",
  cue="Comparing every pair of numbers is 2 × 10⁸ gcd calls at 20,000 numbers. Instead, connect each number to its prime factors: two numbers sharing a prime end up in the same group through that prime.",
  brute="Union every pair with gcd greater than 1: O(n² log V), too slow at the limit.",
  approach="Make union-find nodes for the values up to the largest number. Factor each number by trial division up to its square root, and union the number with each prime factor it has. Finally count, for each number in the list, which root it belongs to, and return the largest count.",
  cx="O(n √V α(V)) time for values up to V = 100,000, and O(V) space.",
  trap="Counting group sizes with the union-find's own size array. Those sizes include the prime-factor nodes, which are not numbers from the list. Count only the list's numbers per root.",
  py='''class Solution:
    def largestComponentSize(self, nums: list[int]) -> int:
        parent = list(range(max(nums) + 1))

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        for x in nums:                 # join x to each of its prime factors
            y, f = x, 2
            while f * f <= y:
                if y % f == 0:
                    parent[find(f)] = find(x)
                    while y % f == 0:
                        y //= f
                f += 1
            if y > 1:
                parent[find(y)] = find(x)
        count = {}
        for x in nums:                 # count list numbers only, not factor nodes
            r = find(x)
            count[r] = count.get(r, 0) + 1
        return max(count.values())''',
  java='''import java.util.HashMap;

class Solution {
    private int[] parent;

    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }

    public int largestComponentSize(int[] nums) {
        int max = 0;
        for (int x : nums) max = Math.max(max, x);
        parent = new int[max + 1];
        for (int i = 0; i <= max; i++) parent[i] = i;
        for (int x : nums) {           // join x to each of its prime factors
            int y = x;
            for (int f = 2; f * f <= y; f++)
                if (y % f == 0) {
                    parent[find(f)] = find(x);
                    while (y % f == 0) y /= f;
                }
            if (y > 1) parent[find(y)] = find(x);
        }
        HashMap<Integer, Integer> count = new HashMap<>();   // list numbers only
        int best = 0;
        for (int x : nums) best = Math.max(best, count.merge(find(x), 1, Integer::sum));
        return best;
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(7)

def comps(n, edges, base=0):
    adj = {i: [] for i in range(base, n + base)}
    for e in edges: adj[e[0]].append(e[1]); adj[e[1]].append(e[0])
    seen, out = set(), []
    for s in adj:
        if s in seen: continue
        stack, c = [s], set([s])
        while stack:
            x = stack.pop()
            for y in adj[x]:
                if y not in c: c.add(y); stack.append(y)
        seen |= c; out.append(c)
    return out

def rand_edges(n, m, base=0):
    pairs = [list(p) for p in combinations(range(base, n + base), 2)]
    return [p[::-1] if R.random() < 0.5 else p for p in R.sample(pairs, min(m, len(pairs)))]

def gen1971():
    n = R.randint(1, 8); return [n, rand_edges(n, R.randint(0, 8)), R.randrange(n), R.randrange(n)]

def gen547():
    n = R.randint(1, 7); g = [[int(i == j) for j in range(n)] for i in range(n)]
    for i, j in combinations(range(n), 2):
        if R.random() < 0.25: g[i][j] = g[j][i] = 1
    return [g]

def random_tree(n):   # edges [parent, child] of a random rooted tree on 1..n, root first in the order
    order = list(range(1, n + 1)); R.shuffle(order)
    return [[order[R.randrange(i)], order[i]] for i in range(1, n)]

def gen684():
    n = R.randint(3, 8); t = [e[:] if R.random() < 0.5 else e[::-1] for e in random_tree(n)]
    have = {frozenset(e) for e in t}
    extra = R.choice([list(p) for p in combinations(range(1, n + 1), 2) if frozenset(p) not in have])
    edges = t + [extra]; R.shuffle(edges); return [edges]
def brute684(edges):
    n = len(edges)
    for k in range(n - 1, -1, -1):
        rest = edges[:k] + edges[k + 1:]
        if len(comps(n, rest, base=1)) == 1: return edges[k]

def gen990():
    eqs = []
    for _ in range(R.randint(1, 6)):
        a, b = R.choice("abcd"), R.choice("abcd"); eqs.append(a + R.choice(["==", "!="]) + b)
    return [eqs]
def brute990(eqs):
    letters = sorted({e[0] for e in eqs} | {e[3] for e in eqs})
    for vals in product(range(len(letters)), repeat=len(letters)):
        v = dict(zip(letters, vals))
        if all((v[e[0]] == v[e[3]]) == (e[1] == "=") for e in eqs): return True
    return False

def gen1319():
    n = R.randint(1, 8); return [n, rand_edges(n, R.randint(0, 10))]
def brute1319(n, cs):
    return -1 if len(cs) < n - 1 else len(comps(n, cs)) - 1

def gen947():
    pts = R.sample([(r, c) for r in range(5) for c in range(5)], R.randint(1, 8)); return [[list(p) for p in pts]]
def brute947(st):
    n = len(st); e = [[i, j] for i, j in combinations(range(n), 2) if st[i][0] == st[j][0] or st[i][1] == st[j][1]]
    return n - len(comps(n, e))

def gen2316():
    n = R.randint(1, 8); return [n, rand_edges(n, R.randint(0, 8))]
def brute2316(n, e):
    cs = comps(n, e); where = {x: k for k, c in enumerate(cs) for x in c}
    return sum(1 for i, j in combinations(range(n), 2) if where[i] != where[j])

def gen2492():
    while True:
        n = R.randint(2, 7); rs = [e + [R.randint(1, 20)] for e in rand_edges(n, R.randint(1, 9), base=1)]
        c1 = next(c for c in comps(n, rs, base=1) if 1 in c)
        if n in c1: return [n, rs]
def brute2492(n, rs):
    c1 = next(c for c in comps(n, rs, base=1) if 1 in c)
    return min(d for u, v, d in rs if u in c1)

def gen1061():
    k = R.randint(1, 6); s1 = "".join(R.choice("abcdef") for _ in range(k)); s2 = "".join(R.choice("abcdef") for _ in range(k))
    return [s1, s2, "".join(R.choice("abcdefgh") for _ in range(R.randint(1, 8)))]
def brute1061(s1, s2, base):
    eq = {c: {c} for c in "abcdefghijklmnopqrstuvwxyz"}
    changed = True
    while changed:
        changed = False
        for a, b in zip(s1, s2):
            u = eq[a] | eq[b]
            for x in u:
                if eq[x] != u: eq[x] = u; changed = True
    return "".join(min(eq[c]) for c in base)

def gen685():
    n = R.randint(3, 8); t = random_tree(n); have = {tuple(e) for e in t}
    extra = R.choice([[u, v] for u in range(1, n + 1) for v in range(1, n + 1) if u != v and (u, v) not in have])
    edges = t + [extra]; R.shuffle(edges); return [edges]
def brute685(edges):
    n = len(edges)
    for k in range(n - 1, -1, -1):
        rest = edges[:k] + edges[k + 1:]
        indeg = [0] * (n + 1)
        for u, v in rest: indeg[v] += 1
        roots = [x for x in range(1, n + 1) if indeg[x] == 0]
        if len(roots) != 1 or any(indeg[x] > 1 for x in range(1, n + 1)): continue
        seen, stack = {roots[0]}, [roots[0]]
        while stack:
            x = stack.pop()
            for u, v in rest:
                if u == x and v not in seen: seen.add(v); stack.append(v)
        if len(seen) == n: return edges[k]

def gen1579():
    n = R.randint(1, 5); pairs = list(combinations(range(1, n + 1), 2))
    edges = []
    for p in pairs:
        for t in (1, 2, 3):
            if R.random() < 0.3: edges.append([t, *p])
    R.shuffle(edges); return [n, edges[:9]]
def brute1579(n, edges):
    def ok(sub):
        a = [e[1:] for e in sub if e[0] in (1, 3)]; b = [e[1:] for e in sub if e[0] in (2, 3)]
        return len(comps(n, a, base=1)) == 1 and len(comps(n, b, base=1)) == 1
    if not ok(edges): return -1
    for k in range(len(edges) + 1):
        if any(ok(list(sub)) for sub in combinations(edges, k)): return len(edges) - k

def gen952():
    return [R.sample(range(1, 60), R.randint(1, 8))]
def brute952(a):
    e = [[i, j] for i, j in combinations(range(len(a)), 2) if gcd(a[i], a[j]) > 1]
    return max(len(c) for c in comps(len(a), e))

BRUTE = {
  1971: (gen1971, lambda n, e, s, d: any(s in c and d in c for c in comps(n, e))),
  547:  (gen547, lambda g: len(comps(len(g), [[i, j] for i, j in combinations(range(len(g)), 2) if g[i][j]]))),
  684:  (gen684, brute684),
  990:  (gen990, brute990),
  1319: (gen1319, brute1319),
  947:  (gen947, brute947),
  2316: (gen2316, brute2316),
  2492: (gen2492, brute2492),
  1061: (gen1061, brute1061),
  685:  (gen685, brute685),
  1579: (gen1579, brute1579),
  952:  (gen952, brute952),
}
