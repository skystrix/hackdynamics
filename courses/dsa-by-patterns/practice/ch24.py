# Chapter 24 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
# Solutions assume LeetCode's own TreeNode (val, left, right).
import random
import copy
from practice import TREE, TreeNode, materialize, rand_tree, tree_list

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

AS_TREE = lambda r, a: tree_list(r)

def inorder(t):
    return [] if t is None else inorder(t.left) + [t.val] + inorder(t.right)
def preorder(t):
    return [] if t is None else [t.val] + preorder(t.left) + preorder(t.right)
def postorder(t):
    return [] if t is None else postorder(t.left) + postorder(t.right) + [t.val]
def levels(t):
    out, q = [], [t] if t else []
    while q:
        out.append([n.val for n in q]); q = [c for n in q for c in (n.left, n.right) if c]
    return out
def same(a, b):
    return (a is None and b is None) or (a is not None and b is not None and a.val == b.val and same(a.left, b.left) and same(a.right, b.right))

# ---------------------------------------------------------------- Easy
prob(num=94, slug="binary-tree-inorder-traversal", title="Binary Tree Inorder Traversal", diff="Easy",
  method="inorderTraversal",
  ask="Return a binary tree's values in inorder: left subtree, node, right subtree. The follow-up asks for it without recursion.",
  cue="The Iterative Traversal section: recursion keeps the path from the root on the call stack, so an explicit stack can hold it instead.",
  brute="The recursive version, three lines: correct and O(n), and exactly what the follow-up asks you to replace.",
  approach="Walk left from the current node, pushing every node on the way. When you can go no further left, pop a node: that is the next value in inorder. Record it, then move to its right child and repeat. Stop when the stack is empty and there is no current node.",
  cx="O(n) time, O(h) space for a tree of height h.",
  trap="Recording a node when it is pushed. That is preorder. In inorder a node's value is recorded only when it is popped, after its whole left subtree.",
  py='''class Solution:
    def inorderTraversal(self, root: Optional[TreeNode]) -> list[int]:
        out, stack, node = [], [], root
        while stack or node:
            while node:                # go left, remembering the path
                stack.append(node)
                node = node.left
            node = stack.pop()
            out.append(node.val)       # recorded when popped: left subtree is done
            node = node.right
        return out''',
  java='''import java.util.*;

class Solution {
    public List<Integer> inorderTraversal(TreeNode root) {
        List<Integer> out = new ArrayList<>();
        ArrayDeque<TreeNode> stack = new ArrayDeque<>();
        TreeNode node = root;
        while (!stack.isEmpty() || node != null) {
            while (node != null) { stack.push(node); node = node.left; }   // go left
            node = stack.pop();
            out.add(node.val);         // recorded when popped: left subtree is done
            node = node.right;
        }
        return out;
    }
}''')

prob(num=145, slug="binary-tree-postorder-traversal", title="Binary Tree Postorder Traversal", diff="Easy",
  method="postorderTraversal",
  ask="Return a binary tree's values in postorder (left subtree, right subtree, node), without recursion.",
  cue="Postorder is the hardest of the three to do with a stack, because a node is finished only after both children. The Iterative Traversal section's shortcut: node, right, left is an easy preorder-style walk, and reversing it gives left, right, node.",
  brute="The recursive version, as short as inorder's.",
  approach="Run a preorder with a stack, but push the left child before the right, so the right child is popped first. That records node, right subtree, left subtree. Reverse the list at the end.",
  cx="O(n) time, O(n) space for the output and the stack.",
  trap="Believing the reversed walk is a genuine iterative postorder. It produces the right list, but it never visits a node after its children, so it cannot be used for work that must happen at that moment (freeing children, combining their results). That needs a stack with a \"last visited\" check.",
  py='''class Solution:
    def postorderTraversal(self, root: Optional[TreeNode]) -> list[int]:
        out, stack = [], [root] if root else []
        while stack:
            node = stack.pop()
            out.append(node.val)       # node, then right, then left
            if node.left:
                stack.append(node.left)
            if node.right:
                stack.append(node.right)   # pushed last, popped first
        return out[::-1]               # reversed: left, right, node''',
  java='''import java.util.*;

class Solution {
    public List<Integer> postorderTraversal(TreeNode root) {
        LinkedList<Integer> out = new LinkedList<>();
        ArrayDeque<TreeNode> stack = new ArrayDeque<>();
        if (root != null) stack.push(root);
        while (!stack.isEmpty()) {
            TreeNode node = stack.pop();
            out.addFirst(node.val);    // prepending reverses node, right, left
            if (node.left != null) stack.push(node.left);
            if (node.right != null) stack.push(node.right);   // popped first
        }
        return out;
    }
}''')

prob(num=226, slug="invert-binary-tree", title="Invert Binary Tree", diff="Easy",
  method="invertTree", observe=AS_TREE,
  ask="Mirror a binary tree: swap every node's left and right children.",
  cue="Every node does the same small job (swap its two children) and trusts the recursion to handle the subtrees: the Three Depth-First Orders section's shape with the work at the node.",
  brute="There is nothing to brute-force; the only question is doing each node once.",
  approach="If the node is empty, return it. Otherwise invert its left and right subtrees, then swap them, and return the node.",
  cx="O(n) time, O(h) recursion depth.",
  trap="Swapping and then recursing into node.left and node.right as if they had not moved. That works either way here because both get inverted, but in problems that treat the sides differently, the order of swap and recursion matters.",
  py='''class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        if root:
            root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)
        return root''',
  java='''class Solution {
    public TreeNode invertTree(TreeNode root) {
        if (root == null) return null;
        TreeNode left = invertTree(root.left);
        root.left = invertTree(root.right);
        root.right = left;
        return root;
    }
}''')

prob(num=100, slug="same-tree", title="Same Tree", diff="Easy",
  method="isSameTree",
  ask="Decide whether two binary trees have the same shape and the same values.",
  cue="Two trees are equal when their roots match and their left subtrees and right subtrees are equal: a definition that is already a recursion.",
  brute="Compare their inorder listings. That fails: different shapes can share an inorder listing, as [1, 2] and [2, null, 1] do.",
  approach="If both nodes are empty, they are equal. If only one is empty, or their values differ, they are not. Otherwise both pairs of subtrees must be equal.",
  cx="O(min(m, n)) time, O(h) depth.",
  trap="The brute force above: one traversal does not determine a tree, which the Which Traversals Determine the Tree section proves. Compare the structure itself.",
  py='''class Solution:
    def isSameTree(self, p: Optional[TreeNode], q: Optional[TreeNode]) -> bool:
        if not p or not q:
            return p is q              # both empty, or one is not
        return p.val == q.val and self.isSameTree(p.left, q.left) and self.isSameTree(p.right, q.right)''',
  java='''class Solution {
    public boolean isSameTree(TreeNode p, TreeNode q) {
        if (p == null || q == null) return p == q;   // both empty, or one is not
        return p.val == q.val && isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
    }
}''')

prob(num=101, slug="symmetric-tree", title="Symmetric Tree", diff="Easy",
  method="isSymmetric",
  ask="Decide whether a binary tree is a mirror image of itself around its centre.",
  cue="Same Tree with one twist: compare the left subtree with the right subtree mirrored, so a node's left child is compared with the other node's right child.",
  brute="Build the inverted tree and compare it with the original: O(n) extra memory.",
  approach="A helper compares two nodes a and b: both empty is a match, one empty is not, otherwise their values must be equal and a.left must mirror b.right and a.right must mirror b.left. Call it on the root's two children.",
  cx="O(n) time, O(h) depth.",
  trap="Comparing a.left with b.left, which tests whether the two halves are equal, not mirrored.",
  py='''class Solution:
    def isSymmetric(self, root: Optional[TreeNode]) -> bool:
        def mirror(a, b):
            if not a or not b:
                return a is b
            return a.val == b.val and mirror(a.left, b.right) and mirror(a.right, b.left)   # crossed
        return mirror(root.left, root.right)''',
  java='''class Solution {
    public boolean isSymmetric(TreeNode root) {
        return mirror(root.left, root.right);
    }

    private boolean mirror(TreeNode a, TreeNode b) {
        if (a == null || b == null) return a == b;
        return a.val == b.val && mirror(a.left, b.right) && mirror(a.right, b.left);   // crossed
    }
}''')

prob(num=572, slug="subtree-of-another-tree", title="Subtree of Another Tree", diff="Easy",
  method="isSubtree",
  ask="Decide whether one tree contains a node whose whole subtree is identical to a second tree.",
  cue="Visit every node of the big tree and ask Same Tree about it.",
  brute="That is the brute force, and it is the expected answer at these sizes: O(m × n) in the worst case, 2 × 10⁶ at the limits.",
  approach="If the big tree is empty, answer false. If it is the same tree as subRoot, answer true. Otherwise look in its left and right subtrees.",
  cx="O(m × n) time, O(h) depth. Serializing both trees with null markers and running a string search (Chapter 41) gets O(m + n).",
  trap="Checking only whether subRoot's values appear as a connected part. A subtree must include everything below the node, so [1, 2] is not a subtree of [1, 2, 3] rooted at 1 because that node also has a 3.",
  py='''class Solution:
    def isSubtree(self, root: Optional[TreeNode], subRoot: Optional[TreeNode]) -> bool:
        def same(p, q):
            if not p or not q:
                return p is q
            return p.val == q.val and same(p.left, q.left) and same(p.right, q.right)

        if not root:
            return False
        return same(root, subRoot) or self.isSubtree(root.left, subRoot) or self.isSubtree(root.right, subRoot)''',
  java='''class Solution {
    public boolean isSubtree(TreeNode root, TreeNode subRoot) {
        if (root == null) return false;
        return same(root, subRoot) || isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
    }

    private boolean same(TreeNode p, TreeNode q) {
        if (p == null || q == null) return p == q;
        return p.val == q.val && same(p.left, q.left) && same(p.right, q.right);
    }
}''')

# ---------------------------------------------------------------- Medium
prob(num=102, slug="binary-tree-level-order-traversal", title="Binary Tree Level Order Traversal", diff="Medium",
  method="levelOrder",
  ask="Return a tree's values level by level, left to right, as a list of lists.",
  cue="The Level Order section: breadth-first search with a queue. To know where each level ends, process the queue in rounds, one round per level.",
  brute="Compute each node's depth recursively and bucket the values by depth: also O(n), with recursion.",
  approach="Start the queue with the root. While it is not empty, note its current size: that many nodes form this level. Pop exactly that many, record their values, and push their children, which form the next level.",
  cx="O(n) time, O(w) space for the widest level.",
  trap="Popping until the queue is empty in one loop. The children you push join the same loop, and the level boundaries are lost. Freezing the size at the start of each round is what separates levels.",
  py='''from collections import deque

class Solution:
    def levelOrder(self, root: Optional[TreeNode]) -> list[list[int]]:
        out, q = [], deque([root] if root else [])
        while q:
            level = []
            for _ in range(len(q)):    # exactly this level's nodes
                node = q.popleft()
                level.append(node.val)
                if node.left:
                    q.append(node.left)
                if node.right:
                    q.append(node.right)
            out.append(level)
        return out''',
  java='''import java.util.*;

class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> out = new ArrayList<>();
        ArrayDeque<TreeNode> q = new ArrayDeque<>();
        if (root != null) q.add(root);
        while (!q.isEmpty()) {
            List<Integer> level = new ArrayList<>();
            for (int k = q.size(); k > 0; k--) {   // exactly this level's nodes
                TreeNode node = q.poll();
                level.add(node.val);
                if (node.left != null) q.add(node.left);
                if (node.right != null) q.add(node.right);
            }
            out.add(level);
        }
        return out;
    }
}''')

prob(num=199, slug="binary-tree-right-side-view", title="Binary Tree Right Side View", diff="Medium",
  method="rightSideView",
  ask="Standing to the right of a tree, list the values you can see from top to bottom: the rightmost node of each level.",
  cue="Level order, keeping only the last node of each round.",
  brute="Collect all levels as in Level Order Traversal and take each level's last value: the same idea with more memory.",
  approach="Run the level-by-level BFS, pushing each node's right child before its left. Then the first node popped in each round is the rightmost on its level; record its value.",
  cx="O(n) time, O(w) space.",
  trap="Following right children only. A level's rightmost node can sit in the left subtree when the right subtree is shorter, as in [1, 2, 3, 4], where 4 is visible from the right.",
  py='''from collections import deque

class Solution:
    def rightSideView(self, root: Optional[TreeNode]) -> list[int]:
        out, q = [], deque([root] if root else [])
        while q:
            for i in range(len(q)):
                node = q.popleft()
                if i == 0:
                    out.append(node.val)   # the first popped when pushing right child first
                if node.right:
                    q.append(node.right)
                if node.left:
                    q.append(node.left)
        return out''',
  java='''import java.util.*;

class Solution {
    public List<Integer> rightSideView(TreeNode root) {
        List<Integer> out = new ArrayList<>();
        ArrayDeque<TreeNode> q = new ArrayDeque<>();
        if (root != null) q.add(root);
        while (!q.isEmpty()) {
            for (int i = 0, k = q.size(); i < k; i++) {
                TreeNode node = q.poll();
                if (i == 0) out.add(node.val);   // right child pushed first: rightmost comes first
                if (node.right != null) q.add(node.right);
                if (node.left != null) q.add(node.left);
            }
        }
        return out;
    }
}''')

prob(num=103, slug="binary-tree-zigzag-level-order-traversal", title="Binary Tree Zigzag Level Order Traversal", diff="Medium",
  method="zigzagLevelOrder",
  ask="Return the values level by level, alternating left-to-right and right-to-left.",
  cue="Level Order Traversal with the recorded level reversed on every other round. The queue itself does not change direction.",
  brute="Collect all levels and reverse every second one afterwards: the same thing in two passes.",
  approach="Run the level-by-level BFS, collecting each level left to right. Before appending a level, reverse it if its index is odd.",
  cx="O(n) time, O(w) space.",
  trap="Trying to push children in a different order on alternate levels. That scrambles the order of the level after next, because the children of a reversed level come out reversed too. Reverse the recorded list, not the queue.",
  py='''from collections import deque

class Solution:
    def zigzagLevelOrder(self, root: Optional[TreeNode]) -> list[list[int]]:
        out, q = [], deque([root] if root else [])
        while q:
            level = []
            for _ in range(len(q)):
                node = q.popleft()
                level.append(node.val)
                if node.left:
                    q.append(node.left)
                if node.right:
                    q.append(node.right)
            out.append(level[::-1] if len(out) % 2 else level)   # reverse the record, not the queue
        return out''',
  java='''import java.util.*;

class Solution {
    public List<List<Integer>> zigzagLevelOrder(TreeNode root) {
        List<List<Integer>> out = new ArrayList<>();
        ArrayDeque<TreeNode> q = new ArrayDeque<>();
        if (root != null) q.add(root);
        while (!q.isEmpty()) {
            LinkedList<Integer> level = new LinkedList<>();
            boolean reversed = out.size() % 2 == 1;
            for (int k = q.size(); k > 0; k--) {
                TreeNode node = q.poll();
                if (reversed) level.addFirst(node.val); else level.addLast(node.val);   // the record, not the queue
                if (node.left != null) q.add(node.left);
                if (node.right != null) q.add(node.right);
            }
            out.add(level);
        }
        return out;
    }
}''')

prob(num=105, slug="construct-binary-tree-from-preorder-and-inorder-traversal", title="Construct Binary Tree from Preorder and Inorder Traversal", diff="Medium",
  method="buildTree", observe=AS_TREE,
  ask="Rebuild a tree of distinct values from its preorder and inorder listings.",
  cue="The Which Traversals Determine the Tree section. Preorder's first value is the root; finding it in inorder splits inorder into the left subtree (before it) and the right subtree (after it), and their sizes tell you how to split the rest of preorder.",
  brute="Search inorder for the root with a linear scan at every step: O(n²) on a skewed tree, 4.5 million steps at n = 3,000.",
  approach="Map each value to its inorder position. Recurse on an inorder range [lo, hi): the next unused preorder value is this subtree's root; build its left subtree from [lo, root position) and then its right subtree from (root position, hi). A single pointer walks preorder, because preorder lists the root, then the whole left subtree, then the right.",
  cx="O(n) time with the position map, O(n) space.",
  trap="Building the right subtree before the left. The preorder pointer must consume the left subtree's values first, in the order preorder lists them.",
  py='''class Solution:
    def buildTree(self, preorder: list[int], inorder: list[int]) -> Optional[TreeNode]:
        where = {v: i for i, v in enumerate(inorder)}
        nxt = iter(preorder)           # preorder: root, whole left, whole right

        def build(lo, hi):             # the subtree whose inorder is inorder[lo:hi]
            if lo >= hi:
                return None
            root = TreeNode(next(nxt))
            mid = where[root.val]
            root.left = build(lo, mid) # left first: it comes first in preorder
            root.right = build(mid + 1, hi)
            return root

        return build(0, len(inorder))''',
  java='''import java.util.*;

class Solution {
    private final Map<Integer, Integer> where = new HashMap<>();
    private int next = 0;              // preorder: root, whole left, whole right
    private int[] preorder;

    public TreeNode buildTree(int[] preorder, int[] inorder) {
        this.preorder = preorder;
        for (int i = 0; i < inorder.length; i++) where.put(inorder[i], i);
        return build(0, inorder.length);
    }

    private TreeNode build(int lo, int hi) {   // the subtree whose inorder is [lo, hi)
        if (lo >= hi) return null;
        TreeNode root = new TreeNode(preorder[next++]);
        int mid = where.get(root.val);
        root.left = build(lo, mid);    // left first: it comes first in preorder
        root.right = build(mid + 1, hi);
        return root;
    }
}''')

prob(num=106, slug="construct-binary-tree-from-inorder-and-postorder-traversal", title="Construct Binary Tree from Inorder and Postorder Traversal", diff="Medium",
  method="buildTree", observe=AS_TREE,
  ask="Rebuild a tree of distinct values from its inorder and postorder listings.",
  cue="The previous problem mirrored: postorder's last value is the root, and read backwards postorder lists the root, then the whole right subtree, then the left.",
  brute="Linear search for each root in inorder: O(n²).",
  approach="Map values to inorder positions and walk postorder from the end. For an inorder range, the next value from the end is the root; build the right subtree first, then the left, because that is the order backwards postorder produces them.",
  cx="O(n) time, O(n) space.",
  trap="Building the left subtree first, as in the previous problem. Walking postorder backwards meets the right subtree's values before the left's.",
  py='''class Solution:
    def buildTree(self, inorder: list[int], postorder: list[int]) -> Optional[TreeNode]:
        where = {v: i for i, v in enumerate(inorder)}
        nxt = reversed(postorder)      # backwards: root, whole right, whole left

        def build(lo, hi):
            if lo >= hi:
                return None
            root = TreeNode(next(nxt))
            mid = where[root.val]
            root.right = build(mid + 1, hi)   # right first, backwards
            root.left = build(lo, mid)
            return root

        return build(0, len(inorder))''',
  java='''import java.util.*;

class Solution {
    private final Map<Integer, Integer> where = new HashMap<>();
    private int next;                  // walks postorder backwards
    private int[] postorder;

    public TreeNode buildTree(int[] inorder, int[] postorder) {
        this.postorder = postorder;
        next = postorder.length - 1;
        for (int i = 0; i < inorder.length; i++) where.put(inorder[i], i);
        return build(0, inorder.length);
    }

    private TreeNode build(int lo, int hi) {
        if (lo >= hi) return null;
        TreeNode root = new TreeNode(postorder[next--]);
        int mid = where.get(root.val);
        root.right = build(mid + 1, hi);   // right first, backwards
        root.left = build(lo, mid);
        return root;
    }
}''')

prob(num=173, slug="binary-search-tree-iterator", title="Binary Search Tree Iterator", diff="Medium", design=True,
  ask="Build an iterator over a BST's values in increasing order, with next and hasNext, using O(h) memory.",
  cue="The iterative inorder of Binary Tree Inorder Traversal, paused between values. The stack is exactly the state that must survive between calls.",
  brute="Flatten the whole tree into a sorted list in the constructor: O(1) per call but O(n) memory, which the follow-up rules out.",
  approach="Keep a stack of the path of nodes still waiting to be visited. The constructor pushes the root and all its left descendants. next pops the top (the smallest remaining value), then pushes its right child and that child's left descendants. hasNext checks whether the stack is empty.",
  cx="O(1) amortized per next (each node is pushed and popped once over the whole iteration), O(h) memory.",
  trap="Worrying that next is O(h) in the worst case. A single call can push a whole left spine, but across all n calls every node is pushed once: Chapter 4's aggregate argument gives O(1) on average.",
  py='''class BSTIterator:
    def __init__(self, root: Optional[TreeNode]):
        self.stack = []
        self._push_left(root)

    def _push_left(self, node):        # the path to the smallest value below node
        while node:
            self.stack.append(node)
            node = node.left

    def next(self) -> int:
        node = self.stack.pop()
        self._push_left(node.right)
        return node.val

    def hasNext(self) -> bool:
        return bool(self.stack)''',
  java='''import java.util.ArrayDeque;

class BSTIterator {
    private final ArrayDeque<TreeNode> stack = new ArrayDeque<>();

    public BSTIterator(TreeNode root) { pushLeft(root); }

    private void pushLeft(TreeNode node) {   // the path to the smallest value below node
        for (; node != null; node = node.left) stack.push(node);
    }

    public int next() {
        TreeNode node = stack.pop();
        pushLeft(node.right);
        return node.val;
    }

    public boolean hasNext() { return !stack.isEmpty(); }
}''')

# ---------------------------------------------------------------- Hard
prob(num=297, slug="serialize-and-deserialize-binary-tree", title="Serialize and Deserialize Binary Tree", diff="Hard",
  roundtrip=True, observe=AS_TREE,
  ask="Design a Codec that turns a binary tree into a string and back into the same tree.",
  cue="The Serialisation section: one traversal plus explicit markers for missing children does determine the tree, even though a plain traversal does not. Level order with \"null\" markers, the format LeetCode itself uses, round-trips with two queues and no recursion.",
  brute="There is no slower correct way; the question is choosing a format that is unambiguous.",
  approach="serialize: BFS from the root, writing each node's value or \"#\" for a missing child, separated by commas. deserialize: read the first value as the root and put it in a queue; for each node taken from the queue, the next two values are its left and right children (or \"#\"), and every real child joins the queue.",
  cx="O(n) time and space in both directions.",
  trap="Writing a recursive preorder decoder in Python. It is the classic answer and correct, but on a skewed tree of 10⁴ nodes it recurses 10⁴ deep, past CPython's default limit of 1,000 (Chapter 6). The level-order version has no depth limit.",
  py='''from collections import deque

class Codec:
    def serialize(self, root):
        out, q = [], deque([root])
        while q:                       # level order, "#" for a missing child
            node = q.popleft()
            if node:
                out.append(str(node.val))
                q.append(node.left)
                q.append(node.right)
            else:
                out.append("#")
        return ",".join(out)

    def deserialize(self, data):
        vals = data.split(",")
        if vals[0] == "#":
            return None
        root = TreeNode(int(vals[0]))
        q, i = deque([root]), 1
        while q:                       # each node takes the next two values
            node = q.popleft()
            for side in ("left", "right"):
                if vals[i] != "#":
                    child = TreeNode(int(vals[i]))
                    setattr(node, side, child)
                    q.append(child)
                i += 1
        return root''',
  java='''import java.util.*;

public class Codec {
    public String serialize(TreeNode root) {
        StringBuilder out = new StringBuilder();
        ArrayDeque<TreeNode> q = new ArrayDeque<>();
        List<TreeNode> order = new ArrayList<>();
        order.add(root);
        for (int i = 0; i < order.size(); i++) {   // level order, "#" for a missing child
            TreeNode node = order.get(i);
            if (i > 0) out.append(',');
            if (node == null) out.append('#');
            else { out.append(node.val); order.add(node.left); order.add(node.right); }
        }
        return out.toString();
    }

    public TreeNode deserialize(String data) {
        String[] vals = data.split(",");
        if (vals[0].equals("#")) return null;
        TreeNode root = new TreeNode(Integer.parseInt(vals[0]));
        ArrayDeque<TreeNode> q = new ArrayDeque<>();
        q.add(root);
        int i = 1;
        while (!q.isEmpty()) {         // each node takes the next two values
            TreeNode node = q.poll();
            if (!vals[i].equals("#")) { node.left = new TreeNode(Integer.parseInt(vals[i])); q.add(node.left); }
            i++;
            if (!vals[i].equals("#")) { node.right = new TreeNode(Integer.parseInt(vals[i])); q.add(node.right); }
            i++;
        }
        return root;
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(24)
T = lambda t: materialize(t)

def mirror(t):
    if t is None: return None
    t.left, t.right = mirror(t.right), mirror(t.left); return t

def gen101():
    if R.random() < 0.5: return [rand_tree(R, R.randint(1, 7), 0, 2)]
    half = materialize(rand_tree(R, R.randint(0, 4), 0, 2))   # a symmetric tree: a half and its mirror
    return [TREE(tree_list(TreeNode(5, half, mirror(copy.deepcopy(half)))))]

def gen572():
    big = rand_tree(R, R.randint(1, 8), 0, 3)
    if R.random() < 0.5:               # sometimes a real subtree of big
        root = materialize(big); nodes, q = [], [root]
        for n in q:
            nodes.append(n); q += [c for c in (n.left, n.right) if c]
        return [big, TREE(tree_list(R.choice(nodes)))]
    return [big, rand_tree(R, R.randint(1, 3), 0, 3)]
def brute572(big, small):
    b = materialize(big)
    s = materialize(small)
    nodes, q = [], [b]
    for n in q:
        nodes.append(n); q += [c for c in (n.left, n.right) if c]
    return any(same(n, s) for n in nodes)

def gen_build():
    t = rand_tree(R, R.randint(1, 9), -20, 20, distinct=True); r = materialize(t)
    return t, r
def gen105():
    t, r = gen_build(); return [preorder(r), inorder(r)]
def gen106():
    t, r = gen_build(); return [inorder(r), postorder(r)]
def brute_build(order_a, order_b, kind):
    # rebuilt independently, by slicing the lists
    if kind == "pre":
        pre, ino = order_a, order_b
        def b(pre, ino):
            if not pre: return None
            k = ino.index(pre[0]); n = TreeNode(pre[0])
            n.left = b(pre[1:k + 1], ino[:k]); n.right = b(pre[k + 1:], ino[k + 1:]); return n
        return tree_list(b(pre, ino))
    ino, post = order_a, order_b
    def b2(ino, post):
        if not post: return None
        k = ino.index(post[-1]); n = TreeNode(post[-1])
        n.left = b2(ino[:k], post[:k]); n.right = b2(ino[k + 1:], post[k:-1]); return n
    return tree_list(b2(ino, post))

def gen173():
    t = rand_tree(R, R.randint(1, 8), bst=True); n = len([v for v in t.vals if v is not None])
    ops, args = ["BSTIterator"], [[t]]
    left = n
    for _ in range(R.randint(1, 2 * n)):
        if left and R.random() < 0.6: ops.append("next"); left -= 1
        else: ops.append("hasNext")
        args.append([])
    return ops, args
def brute173(ops, args):
    vals, res = inorder(materialize(args[0][0])), [None]
    for op in ops[1:]:
        if op == "next": res.append(vals.pop(0))
        else: res.append(bool(vals))
    return res

BRUTE = {
  94:  (lambda: [rand_tree(R, R.randint(0, 9))], lambda t: inorder(T(t))),
  145: (lambda: [rand_tree(R, R.randint(0, 9))], lambda t: postorder(T(t))),
  226: (lambda: [rand_tree(R, R.randint(0, 9))], lambda t: tree_list(mirror(T(t)))),
  100: (lambda: (lambda a: [a, a if R.random() < 0.4 else rand_tree(R, R.randint(0, 4), 0, 2)])(rand_tree(R, R.randint(0, 4), 0, 2)),
        lambda a, b: same(T(a), T(b))),
  101: (gen101, lambda t: (lambda r: same(r.left, mirror(copy.deepcopy(r.right))))(T(t))),
  572: (gen572, brute572),
  102: (lambda: [rand_tree(R, R.randint(0, 10))], lambda t: levels(T(t))),
  199: (lambda: [rand_tree(R, R.randint(0, 10))], lambda t: [lv[-1] for lv in levels(T(t))]),
  103: (lambda: [rand_tree(R, R.randint(0, 10))], lambda t: [lv[::-1] if i % 2 else lv for i, lv in enumerate(levels(T(t)))]),
  105: (gen105, lambda pre, ino: brute_build(pre, ino, "pre")),
  106: (gen106, lambda ino, post: brute_build(ino, post, "post")),
  173: (gen173, brute173),
  297: (lambda: [rand_tree(R, R.randint(0, 12), -50, 50)], lambda t: t.vals),
}
