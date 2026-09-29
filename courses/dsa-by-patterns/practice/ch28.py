# Chapter 28 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
import random
from itertools import product

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

# ---------------------------------------------------------------- Easy
prob(num=14, slug="longest-common-prefix", title="Longest Common Prefix", diff="Easy",
  method="longestCommonPrefix",
  ask="Return the longest prefix shared by every string in a list.",
  cue="In trie terms, the answer is the path from the root that never branches and never passes the end of a word. For one query you do not need to build the trie: compare the strings column by column.",
  brute="Try every prefix of the first string, longest first, and check it against all the others: O(L² × n).",
  approach="Take the first string as the candidate. For each position i, check that every string is long enough and has the same character there; stop at the first position where one does not.",
  cx="O(total characters) in the worst case, O(1) extra space.",
  trap="Forgetting that a shorter string ends the prefix. If one string is \"ab\" and another \"abc\", the prefix cannot be longer than \"ab\", even though all characters so far match.",
  py='''class Solution:
    def longestCommonPrefix(self, strs: list[str]) -> str:
        first = strs[0]
        for i, c in enumerate(first):
            for s in strs[1:]:
                if i >= len(s) or s[i] != c:   # a shorter string also ends it
                    return first[:i]
        return first''',
  java='''class Solution {
    public String longestCommonPrefix(String[] strs) {
        String first = strs[0];
        for (int i = 0; i < first.length(); i++)
            for (String s : strs)
                if (i >= s.length() || s.charAt(i) != first.charAt(i)) return first.substring(0, i);
        return first;
    }
}''')

# ---------------------------------------------------------------- Medium
prob(num=208, slug="implement-trie-prefix-tree", title="Implement Trie (Prefix Tree)", diff="Medium", design=True,
  ask="Build a trie with insert, search (is this exact word stored?) and startsWith (is any stored word prefixed by this?).",
  cue="The chapter's Structure and Insert, Search, Starts-With sections as code: a tree of nodes with one child per next character, and a flag marking where a word ends.",
  brute="Store the words in a set and scan all of them for startsWith: O(total length) per prefix query.",
  approach="Each node has a map (or 26-slot array) of children and an end flag. insert walks the word, creating missing children, and marks the last node. search and startsWith both walk the string; search also requires the end flag on the last node.",
  cx="O(L) per operation for a string of length L. Space is O(total characters inserted).",
  trap="Returning true from search when the word is only a prefix of a stored word. After inserting \"apple\", search(\"app\") must be false; that is what the end flag is for.",
  py='''class Trie:
    def __init__(self):
        self.root = {}                 # a node is a dict: char -> child, "$" -> end of a word

    def insert(self, word: str) -> None:
        node = self.root
        for c in word:
            node = node.setdefault(c, {})
        node["$"] = True

    def _walk(self, s):
        node = self.root
        for c in s:
            if c not in node:
                return None
            node = node[c]
        return node

    def search(self, word: str) -> bool:
        node = self._walk(word)
        return node is not None and "$" in node   # a prefix alone is not a word

    def startsWith(self, prefix: str) -> bool:
        return self._walk(prefix) is not None''',
  java='''class Trie {
    private static class Node {
        Node[] next = new Node[26];
        boolean end;                   // a word ends here
    }

    private final Node root = new Node();

    public Trie() {}

    public void insert(String word) {
        Node node = root;
        for (char c : word.toCharArray()) {
            if (node.next[c - 'a'] == null) node.next[c - 'a'] = new Node();
            node = node.next[c - 'a'];
        }
        node.end = true;
    }

    private Node walk(String s) {
        Node node = root;
        for (char c : s.toCharArray()) {
            node = node.next[c - 'a'];
            if (node == null) return null;
        }
        return node;
    }

    public boolean search(String word) {
        Node node = walk(word);
        return node != null && node.end;   // a prefix alone is not a word
    }

    public boolean startsWith(String prefix) { return walk(prefix) != null; }
}''')

prob(num=211, slug="design-add-and-search-words-data-structure", title="Design Add and Search Words Data Structure", diff="Medium", design=True,
  ask="Store words and answer searches where '.' matches any single letter.",
  cue="Implement Trie, where a '.' in the query branches the search into every child: a small backtracking search (Chapter 18) over the trie.",
  brute="Store the words in a list and match each against the pattern: O(n × L) per search.",
  approach="Insert as in Implement Trie. To search, recurse on (node, position): at the end, require the end flag; for a letter, follow that one child; for '.', try every child and succeed if any branch does.",
  cx="O(L) per addWord. A search is O(L) without dots and O(26ᵈ × L) with d dots; the problem allows at most 2.",
  trap="Treating '.' as matching any number of letters. It matches exactly one, so the search must still reach the end of the pattern at a word's end, not partway.",
  py='''class WordDictionary:
    def __init__(self):
        self.root = {}

    def addWord(self, word: str) -> None:
        node = self.root
        for c in word:
            node = node.setdefault(c, {})
        node["$"] = True

    def search(self, word: str) -> bool:
        def go(node, i):
            if i == len(word):
                return "$" in node
            if word[i] == ".":         # any one letter: try every child
                return any(go(child, i + 1) for c, child in node.items() if c != "$")
            return word[i] in node and go(node[word[i]], i + 1)
        return go(self.root, 0)''',
  java='''class WordDictionary {
    private static class Node {
        Node[] next = new Node[26];
        boolean end;
    }

    private final Node root = new Node();

    public WordDictionary() {}

    public void addWord(String word) {
        Node node = root;
        for (char c : word.toCharArray()) {
            if (node.next[c - 'a'] == null) node.next[c - 'a'] = new Node();
            node = node.next[c - 'a'];
        }
        node.end = true;
    }

    public boolean search(String word) { return go(root, word, 0); }

    private boolean go(Node node, String word, int i) {
        if (i == word.length()) return node.end;
        char c = word.charAt(i);
        if (c == '.') {                // any one letter: try every child
            for (Node child : node.next) if (child != null && go(child, word, i + 1)) return true;
            return false;
        }
        Node child = node.next[c - 'a'];
        return child != null && go(child, word, i + 1);
    }
}''')

prob(num=648, slug="replace-words", title="Replace Words", diff="Medium",
  method="replaceWords",
  ask="Given dictionary roots and a sentence, replace every word that starts with a root by the shortest such root.",
  cue="Put the roots in a trie. Walking a word from its first letter, the first end flag you meet is the shortest root that prefixes it.",
  brute="For each word, check every root with startswith: O(words × roots × L).",
  approach="Build a trie of the roots. For each word, walk the trie letter by letter; if you reach a node that ends a root, output the letters so far; if the walk falls off the trie first, keep the word.",
  cx="O(total length of roots + total length of the sentence).",
  trap="Checking roots from a set by trying prefixes of every length: correct, but O(L²) per word, since each prefix is a new string to hash. The trie walk stops at the first root it meets.",
  py='''class Solution:
    def replaceWords(self, dictionary: list[str], sentence: str) -> str:
        root = {}
        for w in dictionary:
            node = root
            for c in w:
                node = node.setdefault(c, {})
            node["$"] = True

        def shortest_root(word):
            node = root
            for i, c in enumerate(word):
                if c not in node:
                    return word        # fell off the trie: no root
                node = node[c]
                if "$" in node:
                    return word[:i + 1]   # the first root reached is the shortest
            return word

        return " ".join(shortest_root(w) for w in sentence.split())''',
  java='''import java.util.*;

class Solution {
    private static class Node { Node[] next = new Node[26]; boolean end; }

    public String replaceWords(List<String> dictionary, String sentence) {
        Node root = new Node();
        for (String w : dictionary) {
            Node node = root;
            for (char c : w.toCharArray()) {
                if (node.next[c - 'a'] == null) node.next[c - 'a'] = new Node();
                node = node.next[c - 'a'];
            }
            node.end = true;
        }
        StringBuilder out = new StringBuilder();
        for (String word : sentence.split(" ")) {
            if (out.length() > 0) out.append(' ');
            Node node = root;
            int cut = word.length();
            for (int i = 0; i < word.length(); i++) {
                node = node.next[word.charAt(i) - 'a'];
                if (node == null) break;               // fell off: no root
                if (node.end) { cut = i + 1; break; }  // the first root reached is the shortest
            }
            out.append(word, 0, cut);
        }
        return out.toString();
    }
}''')

prob(num=1268, slug="search-suggestions-system", title="Search Suggestions System", diff="Medium",
  method="suggestedProducts",
  ask="As each letter of a search word is typed, return up to three products (in lexicographic order) that start with the typed prefix.",
  cue="Autocomplete is the trie's textbook use. Store at each trie node the (at most three) smallest products passing through it, so each keystroke's answer is ready at the node it reaches.",
  brute="For every prefix, filter all products and sort: O(L × n × m log n).",
  approach="Sort the products, then insert them in that order; at each node on a product's path, append it to the node's suggestion list if the list has fewer than three. For the search word, walk the trie; each node's list is that prefix's answer, and once the walk falls off, every later answer is empty.",
  cx="O(total product length + search length) after an O(n log n) sort.",
  trap="Forgetting the prefixes after the walk falls off the trie. The output must still have one (empty) list per typed letter.",
  py='''class Solution:
    def suggestedProducts(self, products: list[str], searchWord: str) -> list[list[str]]:
        root = {}
        for p in sorted(products):     # sorted: each node keeps the first three it sees
            node = root
            for c in p:
                node = node.setdefault(c, {"#": []})
                if len(node["#"]) < 3:
                    node["#"].append(p)
        out, node = [], root
        for c in searchWord:
            node = node.get(c) if node else None
            out.append(node["#"] if node else [])   # fell off: empty from here on
        return out''',
  java='''import java.util.*;

class Solution {
    private static class Node { Node[] next = new Node[26]; List<String> top = new ArrayList<>(); }

    public List<List<String>> suggestedProducts(String[] products, String searchWord) {
        String[] sorted = products.clone();
        Arrays.sort(sorted);           // each node keeps the first three it sees
        Node root = new Node();
        for (String p : sorted) {
            Node node = root;
            for (char c : p.toCharArray()) {
                if (node.next[c - 'a'] == null) node.next[c - 'a'] = new Node();
                node = node.next[c - 'a'];
                if (node.top.size() < 3) node.top.add(p);
            }
        }
        List<List<String>> out = new ArrayList<>();
        Node node = root;
        for (char c : searchWord.toCharArray()) {
            node = node == null ? null : node.next[c - 'a'];
            out.add(node == null ? new ArrayList<>() : node.top);   // fell off: empty from here on
        }
        return out;
    }
}''')

prob(num=421, slug="maximum-xor-of-two-numbers-in-an-array", title="Maximum XOR of Two Numbers in an Array", diff="Medium",
  method="findMaximumXOR",
  ask="Find the largest value of nums[i] XOR nums[j].",
  cue="The Bitwise Trie section: store the numbers as 31-bit strings, highest bit first. For a number x, walking the trie and taking the opposite bit whenever possible builds the largest XOR with any stored number, because a higher bit outweighs all lower bits together.",
  brute="Try every pair: O(n²), 2 × 10¹⁰ at n = 2 × 10⁵.",
  approach="Insert every number bit by bit from bit 30 down to bit 0. Then for each number, walk from the root choosing the child with the opposite bit when it exists (that bit of the XOR becomes 1), otherwise the same bit. Keep the best XOR found.",
  cx="O(31 × n) time and O(31 × n) trie nodes.",
  trap="Walking from the lowest bit. Greedily setting low bits first can lose a high bit, and one high bit is worth more than all the lower ones combined; the walk must go from the most significant bit down.",
  py='''class Solution:
    def findMaximumXOR(self, nums: list[int]) -> int:
        root = {}
        for x in nums:                 # highest bit first
            node = root
            for b in range(30, -1, -1):
                node = node.setdefault((x >> b) & 1, {})
        best = 0
        for x in nums:
            node, xor = root, 0
            for b in range(30, -1, -1):
                bit = (x >> b) & 1
                if 1 - bit in node:    # the opposite bit makes this XOR bit 1
                    xor |= 1 << b
                    node = node[1 - bit]
                else:
                    node = node[bit]
            best = max(best, xor)
        return best''',
  java='''class Solution {
    public int findMaximumXOR(int[] nums) {
        int[][] child = new int[31 * nums.length + 1][2];   // trie as arrays: node 0 is the root
        int nodes = 1;
        for (int x : nums) {           // highest bit first
            int node = 0;
            for (int b = 30; b >= 0; b--) {
                int bit = (x >> b) & 1;
                if (child[node][bit] == 0) child[node][bit] = nodes++;
                node = child[node][bit];
            }
        }
        int best = 0;
        for (int x : nums) {
            int node = 0, xor = 0;
            for (int b = 30; b >= 0; b--) {
                int bit = (x >> b) & 1;
                if (child[node][1 - bit] != 0) { xor |= 1 << b; node = child[node][1 - bit]; }   // opposite bit
                else node = child[node][bit];
            }
            best = Math.max(best, xor);
        }
        return best;
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=212, slug="word-search-ii", title="Word Search II", diff="Hard",
  method="findWords", observe=lambda r, a: sorted(r),
  ask="Find every word from a list that can be traced in a letter grid (adjacent cells, each cell used once per word).",
  cue="The Word Search on a Grid section. Running Chapter 18's Word Search once per word repeats the same grid walks up to 3 × 10⁴ times. Put the words in a trie and walk the grid once: the trie tells you at every step whether any word continues this way.",
  brute="Word Search for each word separately: O(words × cells × 3^L).",
  approach="Build a trie, storing each complete word at its end node. Start a DFS from every cell with the trie root. At each cell, move to the trie child for its letter (stop if there is none); if that node holds a word, record it and clear it so it is reported once. Mark the cell used, try the four neighbours, and restore it.",
  cx="O(cells × 4 × 3^(L - 1)) in the worst case for words of length up to L, far less in practice because the trie prunes dead paths.",
  trap="Reporting the same word more than once when it can be traced along several paths. Clearing the word from its trie node the first time it is found fixes it.",
  py='''class Solution:
    def findWords(self, board: list[list[str]], words: list[str]) -> list[str]:
        root = {}
        for w in words:
            node = root
            for c in w:
                node = node.setdefault(c, {})
            node["$"] = w              # the word itself, stored at its end
        R, C, found = len(board), len(board[0]), []

        def go(r, c, parent):
            ch = board[r][c]
            node = parent.get(ch)
            if node is None:
                return                 # no word continues this way
            if "$" in node:
                found.append(node.pop("$"))   # report once
            board[r][c] = "#"          # mark used
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < R and 0 <= nc < C and board[nr][nc] != "#":
                    go(nr, nc, node)
            board[r][c] = ch           # restore

        for r in range(R):
            for c in range(C):
                go(r, c, root)
        return found''',
  java='''import java.util.*;

class Solution {
    private static class Node { Node[] next = new Node[26]; String word; }   // word stored at its end

    private final List<String> found = new ArrayList<>();
    private char[][] board;

    public List<String> findWords(char[][] board, String[] words) {
        this.board = board;
        Node root = new Node();
        for (String w : words) {
            Node node = root;
            for (char c : w.toCharArray()) {
                if (node.next[c - 'a'] == null) node.next[c - 'a'] = new Node();
                node = node.next[c - 'a'];
            }
            node.word = w;
        }
        for (int r = 0; r < board.length; r++)
            for (int c = 0; c < board[0].length; c++) go(r, c, root);
        return found;
    }

    private void go(int r, int c, Node parent) {
        char ch = board[r][c];
        Node node = parent.next[ch - 'a'];
        if (node == null) return;      // no word continues this way
        if (node.word != null) { found.add(node.word); node.word = null; }   // report once
        board[r][c] = '#';             // mark used
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        for (int[] d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[0].length && board[nr][nc] != '#')
                go(nr, nc, node);
        }
        board[r][c] = ch;              // restore
    }
}''')

prob(num=1707, slug="maximum-xor-with-an-element-from-array", title="Maximum XOR With an Element From Array", diff="Hard",
  method="maximizeXor",
  ask="For each query (x, m), find the largest x XOR y over the array's values y that are at most m, or -1 if there are none.",
  cue="Maximum XOR of Two Numbers with a limit on y. Answer the queries offline (Chapter 12's sweep): sort them by m, and insert array values into the bitwise trie in increasing order, so when a query is answered the trie holds exactly the values ≤ m.",
  brute="For each query, scan all values: O(n × q), 10¹⁰ at the limits.",
  approach="Sort the values, and sort the query indices by m. For each query in that order, insert every value ≤ m not yet inserted; if the trie is still empty, the answer is -1; otherwise walk it greedily for x, preferring the opposite bit, as in Maximum XOR of Two Numbers. Write each answer at its query's original position.",
  cx="O((n + q) × 30 + n log n + q log q) time, O(30 × n) trie nodes.",
  trap="Losing the queries' original order after sorting them. Sort indices, not the queries, so each answer goes back to where it was asked.",
  py='''class Solution:
    def maximizeXor(self, nums: list[int], queries: list[list[int]]) -> list[int]:
        nums = sorted(nums)
        root, i = {}, 0
        out = [-1] * len(queries)
        for qi in sorted(range(len(queries)), key=lambda j: queries[j][1]):   # by limit m
            x, m = queries[qi]
            while i < len(nums) and nums[i] <= m:  # the trie holds exactly the values <= m
                node = root
                for b in range(29, -1, -1):
                    node = node.setdefault((nums[i] >> b) & 1, {})
                i += 1
            if not root:
                continue               # no value <= m: the answer stays -1
            node, xor = root, 0
            for b in range(29, -1, -1):
                bit = (x >> b) & 1
                if 1 - bit in node:
                    xor |= 1 << b
                    node = node[1 - bit]
                else:
                    node = node[bit]
            out[qi] = xor
        return out''',
  java='''import java.util.*;

class Solution {
    public int[] maximizeXor(int[] nums, int[][] queries) {
        int[] sorted = nums.clone();
        Arrays.sort(sorted);
        int q = queries.length;
        Integer[] order = new Integer[q];
        for (int j = 0; j < q; j++) order[j] = j;
        Arrays.sort(order, (a, b) -> Integer.compare(queries[a][1], queries[b][1]));   // by limit m
        int[][] child = new int[30 * sorted.length + 1][2];
        int nodes = 1, i = 0;
        int[] out = new int[q];
        for (int qi : order) {
            int x = queries[qi][0], m = queries[qi][1];
            while (i < sorted.length && sorted[i] <= m) {   // the trie holds the values <= m
                int node = 0;
                for (int b = 29; b >= 0; b--) {
                    int bit = (sorted[i] >> b) & 1;
                    if (child[node][bit] == 0) child[node][bit] = nodes++;
                    node = child[node][bit];
                }
                i++;
            }
            if (i == 0) { out[qi] = -1; continue; }         // no value <= m
            int node = 0, xor = 0;
            for (int b = 29; b >= 0; b--) {
                int bit = (x >> b) & 1;
                if (child[node][1 - bit] != 0) { xor |= 1 << b; node = child[node][1 - bit]; }
                else node = child[node][bit];
            }
            out[qi] = xor;
        }
        return out;
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(28)
def word(alpha, lo, hi): return "".join(R.choice(alpha) for _ in range(R.randint(lo, hi)))

def gen14():
    base = word("ab", 0, 4)
    strs = [base + word("ab", 0, 3) for _ in range(R.randint(1, 5))]
    return [strs if strs != [""] else ["", "a"]]   # ponytail: [""] alone encodes like [] for Java
def brute14(strs):
    k = 0
    while all(len(s) > k and s[k] == strs[0][k] for s in strs): k += 1
    return strs[0][:k]

def gen_trie(cls, add, query, alpha, dots=False):
    def gen():
        ops, args = [cls], [[]]
        for _ in range(R.randint(1, 14)):
            op = R.choice([add, add, query] + (["startsWith"] if cls == "Trie" else []))
            w = word(alpha, 1, 4)
            if op == query and dots: w = "".join(c if R.random() < 0.7 else "." for c in w)
            ops.append(op); args.append([w])
        return ops, args
    return gen
def brute_trie(ops, args):
    words, res = set(), [None]
    for op, (w,) in zip(ops[1:], args[1:]):
        if op in ("insert", "addWord"): words.add(w); res.append(None)
        elif op == "startsWith": res.append(any(x.startswith(w) for x in words))
        else: res.append(any(len(x) == len(w) and all(p in (".", c) for p, c in zip(w, x)) for x in words))
    return res

def gen648():
    return [list({word("abc", 1, 3) for _ in range(R.randint(1, 4))}), " ".join(word("abc", 1, 5) for _ in range(R.randint(1, 5)))]
def brute648(roots, sentence):
    out = []
    for w in sentence.split():
        cands = [r for r in roots if w.startswith(r)]
        out.append(min(cands, key=len) if cands else w)
    return " ".join(out)

def gen1268():
    return [list({word("abc", 1, 4) for _ in range(R.randint(1, 8))}), word("abc", 1, 4)]
def brute1268(products, s):
    return [sorted(p for p in products if p.startswith(s[:i]))[:3] for i in range(1, len(s) + 1)]

def gen212():
    board = [[R.choice("abc") for _ in range(R.randint(1, 3))]]
    c = len(board[0]); board += [[R.choice("abc") for _ in range(c)] for _ in range(R.randint(0, 2))]
    return [board, list({word("abc", 1, 4) for _ in range(R.randint(1, 6))})]
def brute212(board, words):
    Rr, C = len(board), len(board[0])
    def can(w):
        def go(r, c, i, seen):
            if board[r][c] != w[i]: return False
            if i == len(w) - 1: return True
            return any(go(nr, nc, i + 1, seen | {(nr, nc)}) for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1))
                       if 0 <= nr < Rr and 0 <= nc < C and (nr, nc) not in seen)
        return any(go(r, c, 0, {(r, c)}) for r in range(Rr) for c in range(C))
    return sorted(w for w in words if can(w))

def gen1707():
    nums = [R.randint(0, 40) for _ in range(R.randint(1, 7))]
    return [nums, [[R.randint(0, 40), R.randint(0, 40)] for _ in range(R.randint(1, 6))]]
def brute1707(nums, qs):
    return [max([x ^ y for y in nums if y <= m] or [-1]) for x, m in qs]

BRUTE = {
  14:   (gen14, brute14),
  208:  (gen_trie("Trie", "insert", "search", "ab"), brute_trie),
  211:  (gen_trie("WordDictionary", "addWord", "search", "ab", dots=True), brute_trie),
  648:  (gen648, brute648),
  1268: (gen1268, brute1268),
  421:  (lambda: [[R.choice([R.randint(0, 50), R.randint(0, 2**31 - 1)]) for _ in range(R.randint(1, 8))]],
         lambda a: max(x ^ y for x in a for y in a)),
  212:  (gen212, brute212),
  1707: (gen1707, brute1707),
}
