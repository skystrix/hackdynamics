# Chapter 11 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
# Solutions assume LeetCode's own ListNode (val, next) and, for 138, Node (val, next, random).
import random
from practice import LL, CYC, RND

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

def to_list(h):
    out = []
    while h is not None: out.append(h.val); h = h.next
    return out
AS_LIST = lambda r, a: to_list(r)

def node_index(head, target):
    """Position of `target` in a list that may loop; -1 for None."""
    seen, n = set(), head
    while n is not None and id(n) not in seen:
        if n is target: return len(seen)
        seen.add(id(n)); n = n.next
    return -1

# ---------------------------------------------------------------- Easy
prob(num=206, slug="reverse-linked-list", title="Reverse Linked List", diff="Easy",
  method="reverseList", observe=AS_LIST,
  ask="Reverse a singly linked list and return the new head.",
  cue="The In-Place Reversal section, as a whole problem: three pointers, prev, cur and next, walking once.",
  brute="Copy the values into an array, then write them back in reverse order. O(n) time but O(n) extra space, and it rewrites values instead of relinking nodes, which interviewers usually rule out.",
  approach="Walk the list with cur, keeping prev = the already-reversed part. For each node: remember its next, point it back at prev, then move prev and cur one step forward. When cur runs off the end, prev is the new head.",
  cx="O(n) time, O(1) space.",
  trap="Overwriting cur.next before saving it. Once the node points backwards, the rest of the list is unreachable unless you saved the link first.",
  py='''class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        prev, cur = None, head
        while cur:
            nxt = cur.next             # save the rest before breaking the link
            cur.next = prev
            prev, cur = cur, nxt
        return prev''',
  java='''class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null, cur = head;
        while (cur != null) {
            ListNode next = cur.next;  // save the rest before breaking the link
            cur.next = prev;
            prev = cur;
            cur = next;
        }
        return prev;
    }
}''')

prob(num=21, slug="merge-two-sorted-lists", title="Merge Two Sorted Lists", diff="Easy",
  method="mergeTwoLists", observe=AS_LIST,
  ask="Merge two sorted linked lists into one sorted list by relinking their nodes.",
  cue="Building a new list where the first node is not known in advance is the Sentinels section's case: start from a dummy node and return dummy.next.",
  brute="Collect every value, sort, build a new list: O((m + n) log(m + n)) and new nodes.",
  approach="Keep a tail pointer starting at a dummy node. Repeatedly attach the smaller of the two current heads to tail and advance that list. When one list runs out, attach the rest of the other in one step, since it is already sorted.",
  cx="O(m + n) time, O(1) extra space.",
  trap="Special-casing the first node (\"if the result is empty, set head…\"). The dummy node removes that branch entirely, which is why the chapter calls sentinels a way of deleting edge cases.",
  py='''class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = tail = ListNode()      # sentinel: no special case for the first node
        while list1 and list2:
            if list1.val <= list2.val:
                tail.next, list1 = list1, list1.next
            else:
                tail.next, list2 = list2, list2.next
            tail = tail.next
        tail.next = list1 or list2     # the rest is already sorted
        return dummy.next''',
  java='''class Solution {
    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {
        ListNode dummy = new ListNode(), tail = dummy;   // sentinel
        while (list1 != null && list2 != null) {
            if (list1.val <= list2.val) { tail.next = list1; list1 = list1.next; }
            else { tail.next = list2; list2 = list2.next; }
            tail = tail.next;
        }
        tail.next = list1 != null ? list1 : list2;       // the rest is already sorted
        return dummy.next;
    }
}''')

prob(num=141, slug="linked-list-cycle", title="Linked List Cycle", diff="Easy",
  method="hasCycle",
  ask="Decide whether a linked list loops back on itself.",
  cue="The Runner section: a fast pointer moving two steps for every one step of a slow pointer must catch it inside a loop, and must fall off the end if there is none.",
  brute="Store every visited node in a set and stop when one repeats: O(n) time but O(n) space.",
  approach="Start slow and fast at the head. Move slow one step and fast two steps each round. If fast reaches the end, there is no loop. If the two ever point at the same node, there is one: inside a loop the gap between them shrinks by one each round, so fast cannot jump over slow.",
  cx="O(n) time, O(1) space.",
  trap="Checking only fast.next before fast.next.next. Test that fast and fast.next both exist before taking two steps, or a list of even length crashes at the end.",
  py='''class Solution:
    def hasCycle(self, head: Optional[ListNode]) -> bool:
        slow = fast = head
        while fast and fast.next:      # both must exist to take two steps
            slow = slow.next
            fast = fast.next.next
            if slow is fast:
                return True
        return False''',
  java='''public class Solution {
    public boolean hasCycle(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {   // both must exist to take two steps
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;
        }
        return false;
    }
}''')

prob(num=876, slug="middle-of-the-linked-list", title="Middle of the Linked List", diff="Easy",
  method="middleNode", observe=AS_LIST,
  ask="Return the middle node of a linked list (the second of the two middle nodes when the length is even).",
  cue="Two pointers at different speeds again: when the fast one reaches the end, the slow one has covered half the distance.",
  brute="Count the nodes in one pass, then walk half that many in a second pass. O(n) and correct; the runner does it in one pass.",
  approach="Move slow one step and fast two steps until fast cannot move two more. Slow is then at the middle. With the loop condition below, an even-length list stops slow at the second middle, which is what this problem asks for.",
  cx="O(n) time, O(1) space.",
  trap="The even-length case. Changing the loop condition to fast.next and fast.next.next stops at the first middle instead. Both versions are useful (Sort List and Reorder List want the first), so know which one you wrote.",
  py='''class Solution:
    def middleNode(self, head: Optional[ListNode]) -> Optional[ListNode]:
        slow = fast = head
        while fast and fast.next:      # stops slow at the second middle
            slow = slow.next
            fast = fast.next.next
        return slow''',
  java='''class Solution {
    public ListNode middleNode(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {   // stops slow at the second middle
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow;
    }
}''')

# ---------------------------------------------------------------- Medium
prob(num=19, slug="remove-nth-node-from-end-of-list", title="Remove Nth Node From End of List", diff="Medium",
  method="removeNthFromEnd", observe=AS_LIST,
  ask="Remove the n-th node counting from the end of a linked list, in one pass.",
  cue="Two pointers a fixed distance apart: when the leading one hits the end, the trailing one is exactly n from the end. And removing a node that might be the head calls for a sentinel.",
  brute="Count the length, then walk to position length - n and unlink: two passes.",
  approach="Put a dummy node in front of the head. Move a lead pointer n + 1 steps from the dummy, then move lead and a trail pointer together until lead falls off the end. Trail now sits right before the node to remove, so set trail.next = trail.next.next.",
  cx="O(length) time, one pass. O(1) space.",
  trap="Removing the head (n equal to the length). Without the dummy node, there is no node before the head to relink, and the code needs a special case. With it, the same line handles everything.",
  py='''class Solution:
    def removeNthFromEnd(self, head: Optional[ListNode], n: int) -> Optional[ListNode]:
        dummy = ListNode(0, head)      # makes "remove the head" an ordinary case
        lead = trail = dummy
        for _ in range(n + 1):
            lead = lead.next
        while lead:
            lead, trail = lead.next, trail.next
        trail.next = trail.next.next   # trail is right before the node to remove
        return dummy.next''',
  java='''class Solution {
    public ListNode removeNthFromEnd(ListNode head, int n) {
        ListNode dummy = new ListNode(0, head);   // "remove the head" becomes ordinary
        ListNode lead = dummy, trail = dummy;
        for (int i = 0; i <= n; i++) lead = lead.next;
        while (lead != null) {
            lead = lead.next;
            trail = trail.next;
        }
        trail.next = trail.next.next;  // trail is right before the node to remove
        return dummy.next;
    }
}''')

prob(num=143, slug="reorder-list", title="Reorder List", diff="Medium",
  method="reorderList", observe=lambda r, a: to_list(a[0]),
  ask="Rearrange a list L0, L1, …, Ln into L0, Ln, L1, Ln-1, L2, … by relinking nodes in place.",
  cue="Three moves from this chapter in a row: find the middle with the runner, reverse the second half, then merge the two halves by alternating.",
  brute="Copy the nodes into an array and relink them using indices from both ends: O(n) time, O(n) extra space.",
  approach="Find the first middle with slow and fast. Cut the list after it and reverse the second half. Now walk both halves together, taking one node from the front half, then one from the reversed back half, relinking as you go.",
  cx="O(n) time, O(1) space.",
  trap="Forgetting to cut the list at the middle. If the first half's last node still points into the second half, the merge builds a cycle.",
  py='''class Solution:
    def reorderList(self, head: Optional[ListNode]) -> None:
        slow = fast = head
        while fast.next and fast.next.next:   # slow stops at the first middle
            slow, fast = slow.next, fast.next.next
        second, slow.next = slow.next, None   # cut, or the merge makes a cycle
        prev = None
        while second:                  # reverse the second half
            second.next, prev, second = prev, second, second.next
        first, second = head, prev
        while second:                  # alternate: one from each half
            n1, n2 = first.next, second.next
            first.next, second.next = second, n1
            first, second = n1, n2''',
  java='''class Solution {
    public void reorderList(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast.next != null && fast.next.next != null) {   // first middle
            slow = slow.next;
            fast = fast.next.next;
        }
        ListNode second = slow.next;
        slow.next = null;              // cut, or the merge makes a cycle
        ListNode prev = null;
        while (second != null) {       // reverse the second half
            ListNode next = second.next;
            second.next = prev;
            prev = second;
            second = next;
        }
        ListNode first = head;
        second = prev;
        while (second != null) {       // alternate: one from each half
            ListNode n1 = first.next, n2 = second.next;
            first.next = second;
            second.next = n1;
            first = n1;
            second = n2;
        }
    }
}''')

prob(num=142, slug="linked-list-cycle-ii", title="Linked List Cycle II", diff="Medium",
  method="detectCycle",
  observe=lambda r, a: node_index(a[0], r),
  ask="If a linked list has a loop, return the node where the loop begins; otherwise return nothing.",
  cue="The Where They Meet, and Why section: after slow and fast meet, the distance from the head to the loop's start equals the distance from the meeting point to the loop's start, going around.",
  brute="Walk the list storing nodes in a set; the first node seen twice is the start. O(n) space.",
  approach="Run slow and fast until they meet (or fast falls off the end: no loop). Then put one pointer back at the head and move both one step at a time. They meet again exactly at the start of the loop.",
  cx="O(n) time, O(1) space.",
  trap="Returning the first meeting point. Slow and fast meet somewhere inside the loop, not necessarily at its start; the second phase is what finds the start.",
  py='''class Solution:
    def detectCycle(self, head: Optional[ListNode]) -> Optional[ListNode]:
        slow = fast = head
        while fast and fast.next:
            slow, fast = slow.next, fast.next.next
            if slow is fast:           # inside the loop; not necessarily its start
                p = head
                while p is not slow:
                    p, slow = p.next, slow.next
                return p
        return None''',
  java='''public class Solution {
    public ListNode detectCycle(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) {        // inside the loop; not necessarily its start
                ListNode p = head;
                while (p != slow) {
                    p = p.next;
                    slow = slow.next;
                }
                return p;
            }
        }
        return null;
    }
}''')

prob(num=2, slug="add-two-numbers", title="Add Two Numbers", diff="Medium",
  method="addTwoNumbers", observe=AS_LIST,
  ask="Two non-negative numbers are stored as linked lists of digits, least significant digit first. Return their sum in the same form.",
  cue="Schoolbook addition, digit by digit with a carry, building a new list whose first node is not known in advance: a dummy head again.",
  brute="Convert both lists to integers, add, and convert back. It works in Python, whose integers have no size limit, but overflows Java's long for lists longer than about 18 digits, and the lists can hold 100.",
  approach="Walk both lists together. At each step add the two digits (0 for a list that has ended) and the carry; the new digit is sum % 10 and the new carry is sum // 10. Keep going while either list has nodes or the carry is not 0.",
  cx="O(max(m, n)) time, O(1) extra space besides the result.",
  trap="The last carry. 5 + 5 = 10 needs a second node; a loop that stops when both lists end drops it.",
  py='''class Solution:
    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = tail = ListNode()
        carry = 0
        while l1 or l2 or carry:       # the last carry needs its own node
            total = carry + (l1.val if l1 else 0) + (l2.val if l2 else 0)
            carry, digit = divmod(total, 10)
            tail.next = ListNode(digit)
            tail = tail.next
            l1 = l1.next if l1 else None
            l2 = l2.next if l2 else None
        return dummy.next''',
  java='''class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        ListNode dummy = new ListNode(), tail = dummy;
        int carry = 0;
        while (l1 != null || l2 != null || carry != 0) {   // the last carry needs a node
            int total = carry + (l1 != null ? l1.val : 0) + (l2 != null ? l2.val : 0);
            carry = total / 10;
            tail.next = new ListNode(total % 10);
            tail = tail.next;
            if (l1 != null) l1 = l1.next;
            if (l2 != null) l2 = l2.next;
        }
        return dummy.next;
    }
}''')

prob(num=148, slug="sort-list", title="Sort List", diff="Medium",
  method="sortList", observe=AS_LIST,
  ask="Sort a linked list in O(n log n) time.",
  cue="The What Lists Are Actually Good At section: merge sort suits lists, because merging relinks nodes without the scratch array an array merge needs. Split with the runner, merge with Merge Two Sorted Lists.",
  brute="Copy values to an array, sort it, write them back: O(n log n) but O(n) extra space, and it avoids the list entirely.",
  approach="If the list has zero or one node, it is sorted. Otherwise find the first middle with slow and fast, cut the list there, sort each half recursively, and merge the two sorted halves.",
  cx="O(n log n) time. O(log n) space for the recursion. The bottom-up version, which merges runs of length 1, 2, 4, … without recursion, gets O(1) space.",
  trap="Splitting at the second middle. On a two-node list the left half would keep both nodes and the right half would be empty, so the recursion never shrinks. Stop slow at the first middle.",
  py='''class Solution:
    def sortList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        if not head or not head.next:
            return head
        slow, fast = head, head.next   # slow stops at the first middle
        while fast and fast.next:
            slow, fast = slow.next, fast.next.next
        right, slow.next = slow.next, None
        a, b = self.sortList(head), self.sortList(right)
        dummy = tail = ListNode()      # Merge Two Sorted Lists
        while a and b:
            if a.val <= b.val:
                tail.next, a = a, a.next
            else:
                tail.next, b = b, b.next
            tail = tail.next
        tail.next = a or b
        return dummy.next''',
  java='''class Solution {
    public ListNode sortList(ListNode head) {
        if (head == null || head.next == null) return head;
        ListNode slow = head, fast = head.next;   // slow stops at the first middle
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        ListNode right = slow.next;
        slow.next = null;
        ListNode a = sortList(head), b = sortList(right);
        ListNode dummy = new ListNode(), tail = dummy;   // Merge Two Sorted Lists
        while (a != null && b != null) {
            if (a.val <= b.val) { tail.next = a; a = a.next; }
            else { tail.next = b; b = b.next; }
            tail = tail.next;
        }
        tail.next = a != null ? a : b;
        return dummy.next;
    }
}''')

def _obs138(r, a):
    orig, copy_ = [], []
    n = a[0]
    while n is not None: orig.append(n); n = n.next
    n = r
    while n is not None: copy_.append(n); n = n.next
    idx = {id(c): i for i, c in enumerate(copy_)}
    shared = any(c is o for c in copy_ for o in orig)
    return [[c.val, -1 if c.random is None else idx.get(id(c.random), -2)] for c in copy_], shared

prob(num=138, slug="copy-list-with-random-pointer", title="Copy List with Random Pointer", diff="Medium",
  method="copyRandomList", observe=_obs138,
  ask="Each node has a next pointer and a random pointer to any node (or none). Make a deep copy: new nodes only, with the same next and random structure.",
  cue="The deep-copy subsection of What Lists Are Actually Good At. The difficulty is that a random pointer can point forward to a node you have not copied yet, so you need a way to find \"the copy of node X\".",
  brute="For each node, find the position its random pointer targets by walking from the head, then walk the copy to the same position: O(n²).",
  approach="First pass: create a copy of every node and store original → copy in a hash map. Second pass: for each original, set copy.next = map[original.next] and copy.random = map[original.random]. The map answers \"the copy of X\" in O(1).",
  cx="O(n) time, O(n) space for the map. The interleaving trick (insert each copy right after its original, then separate) gets O(1) extra space.",
  trap="Pointing a copy's random at the original node instead of its copy. The result looks right when printed but shares nodes with the input, which is not a deep copy. The check below fails any solution that shares a node.",
  py='''class Solution:
    def copyRandomList(self, head: 'Optional[Node]') -> 'Optional[Node]':
        copy = {None: None}            # original node -> its copy
        n = head
        while n:
            copy[n] = Node(n.val)
            n = n.next
        n = head
        while n:
            copy[n].next = copy[n.next]
            copy[n].random = copy[n.random]
            n = n.next
        return copy[head]''',
  java='''import java.util.HashMap;

class Solution {
    public Node copyRandomList(Node head) {
        HashMap<Node, Node> copy = new HashMap<>();   // original node -> its copy
        for (Node n = head; n != null; n = n.next) copy.put(n, new Node(n.val));
        for (Node n = head; n != null; n = n.next) {
            copy.get(n).next = copy.get(n.next);      // get(null) is null
            copy.get(n).random = copy.get(n.random);
        }
        return copy.get(head);
    }
}''')

prob(num=146, slug="lru-cache", title="LRU Cache", diff="Medium", design=True,
  ask="Build a key-value cache with a fixed capacity. get returns a key's value (or -1) and marks it as recently used; put inserts or updates, and when the cache is over capacity it evicts the least recently used key. Both must run in O(1).",
  cue="The chapter's last section is this problem: a hash map finds the node in O(1), and a doubly linked list moves it to the front or removes the oldest in O(1).",
  brute="Keep keys in a plain list ordered by recency and search it on every access: O(capacity) per call.",
  approach="Keep a doubly linked list with two sentinel nodes, head (most recent side) and tail (oldest side), and a map from key to node. get: look up the node, unlink it, relink it right after head. put: update and move an existing node, or create a new one after head; if the size exceeds capacity, remove the node before tail and delete its key from the map.",
  cx="O(1) per operation, O(capacity) space.",
  trap="Forgetting to delete the evicted key from the map, which leaves a dangling entry that get later returns. The node must store its own key for exactly this reason. (Python's OrderedDict and Java's LinkedHashMap do all of this internally; interviewers usually ask you to build it.)",
  py='''class LRUCache:
    class Node:
        def __init__(self, key=0, val=0):
            self.key, self.val = key, val   # the key is needed to delete on eviction
            self.prev = self.next = None

    def __init__(self, capacity: int):
        self.cap = capacity
        self.map = {}
        self.head, self.tail = self.Node(), self.Node()   # sentinels
        self.head.next, self.tail.prev = self.tail, self.head

    def _unlink(self, n):
        n.prev.next, n.next.prev = n.next, n.prev

    def _push_front(self, n):
        n.prev, n.next = self.head, self.head.next
        self.head.next.prev = n
        self.head.next = n

    def get(self, key: int) -> int:
        if key not in self.map:
            return -1
        n = self.map[key]
        self._unlink(n)
        self._push_front(n)
        return n.val

    def put(self, key: int, value: int) -> None:
        if key in self.map:
            n = self.map[key]
            n.val = value
            self._unlink(n)
        else:
            n = self.Node(key, value)
            self.map[key] = n
        self._push_front(n)
        if len(self.map) > self.cap:
            old = self.tail.prev       # least recently used
            self._unlink(old)
            del self.map[old.key]''',
  java='''import java.util.HashMap;

class LRUCache {
    private static class Node {
        int key, val;                  // the key is needed to delete on eviction
        Node prev, next;
        Node(int key, int val) { this.key = key; this.val = val; }
    }

    private final int cap;
    private final HashMap<Integer, Node> map = new HashMap<>();
    private final Node head = new Node(0, 0), tail = new Node(0, 0);   // sentinels

    public LRUCache(int capacity) {
        cap = capacity;
        head.next = tail;
        tail.prev = head;
    }

    private void unlink(Node n) { n.prev.next = n.next; n.next.prev = n.prev; }

    private void pushFront(Node n) {
        n.prev = head;
        n.next = head.next;
        head.next.prev = n;
        head.next = n;
    }

    public int get(int key) {
        Node n = map.get(key);
        if (n == null) return -1;
        unlink(n);
        pushFront(n);
        return n.val;
    }

    public void put(int key, int value) {
        Node n = map.get(key);
        if (n != null) { n.val = value; unlink(n); }
        else { n = new Node(key, value); map.put(key, n); }
        pushFront(n);
        if (map.size() > cap) {
            Node old = tail.prev;      // least recently used
            unlink(old);
            map.remove(old.key);
        }
    }
}''')

prob(num=287, slug="find-the-duplicate-number", title="Find the Duplicate Number", diff="Medium",
  method="findDuplicate",
  ask="An array of n + 1 numbers holds values from 1 to n, so at least one value repeats; exactly one value does. Find it without changing the array and with O(1) extra space.",
  cue="Read each value as a pointer: from index i go to index nums[i]. Two positions holding the same value point to the same place, so the walk from index 0 forms a linked list with a loop, and the loop's entrance is the duplicate. That is Linked List Cycle II without a linked list.",
  brute="Sort a copy, or use a set: both break a rule (changing the array, or O(n) space). Checking every pair is O(n²).",
  approach="Run Floyd's algorithm on the implicit list: slow = nums[slow], fast = nums[nums[fast]] until they meet. Then reset one pointer to 0 and step both one at a time; they meet at the loop's entrance, which is the duplicated value.",
  cx="O(n) time, O(1) space.",
  trap="Starting the walk at index 1 or treating values as 0-based. Index 0 is special because no value points to it (values are 1 to n), which is what guarantees the walk from 0 enters the loop through the duplicate.",
  py='''class Solution:
    def findDuplicate(self, nums: list[int]) -> int:
        slow = fast = 0                # index 0: nothing points here
        while True:
            slow = nums[slow]
            fast = nums[nums[fast]]
            if slow == fast:
                break
        p = 0
        while p != slow:               # same second phase as Linked List Cycle II
            p, slow = nums[p], nums[slow]
        return p''',
  java='''class Solution {
    public int findDuplicate(int[] nums) {
        int slow = 0, fast = 0;        // index 0: nothing points here
        do {
            slow = nums[slow];
            fast = nums[nums[fast]];
        } while (slow != fast);
        int p = 0;
        while (p != slow) {            // same second phase as Linked List Cycle II
            p = nums[p];
            slow = nums[slow];
        }
        return p;
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=25, slug="reverse-nodes-in-k-group", title="Reverse Nodes in k-Group", diff="Hard",
  method="reverseKGroup", observe=AS_LIST,
  ask="Reverse the nodes of a list k at a time; a final group shorter than k stays as it is.",
  cue="In-place reversal applied to one segment at a time, plus careful reconnection. A dummy node before the head gives every group a \"node before it\" to reconnect from.",
  brute="Copy values to an array, reverse each block of k, and write them back: O(n) space and rewrites values.",
  approach="Keep group_prev = the node before the current group (starting at a dummy). Check that k more nodes exist; if not, stop. Reverse those k nodes with the usual three-pointer loop, starting prev at the node after the group, so the group's old first node ends up pointing at the rest of the list. Then link group_prev to the group's new first node, and move group_prev to the group's old first node, which is now its last.",
  cx="O(n) time, O(1) space.",
  trap="Reversing the short final group. Count ahead before reversing, and stop when fewer than k nodes remain.",
  py='''class Solution:
    def reverseKGroup(self, head: Optional[ListNode], k: int) -> Optional[ListNode]:
        dummy = ListNode(0, head)
        group_prev = dummy
        while True:
            kth = group_prev
            for _ in range(k):         # are there k more nodes?
                kth = kth.next
                if not kth:
                    return dummy.next  # short final group stays as it is
            after = kth.next
            prev, cur = after, group_prev.next   # the reversed group points at `after`
            while cur is not after:
                cur.next, prev, cur = prev, cur, cur.next
            first = group_prev.next    # was first, is now last
            group_prev.next = kth
            group_prev = first''',
  java='''class Solution {
    public ListNode reverseKGroup(ListNode head, int k) {
        ListNode dummy = new ListNode(0, head), groupPrev = dummy;
        while (true) {
            ListNode kth = groupPrev;
            for (int i = 0; i < k; i++) {   // are there k more nodes?
                kth = kth.next;
                if (kth == null) return dummy.next;   // short final group stays
            }
            ListNode after = kth.next, prev = after, cur = groupPrev.next;
            while (cur != after) {     // the reversed group points at `after`
                ListNode next = cur.next;
                cur.next = prev;
                prev = cur;
                cur = next;
            }
            ListNode first = groupPrev.next;   // was first, is now last
            groupPrev.next = kth;
            groupPrev = first;
        }
    }
}''')

prob(num=23, slug="merge-k-sorted-lists", title="Merge k Sorted Lists", diff="Hard",
  method="mergeKLists", observe=AS_LIST, check_args=False,   # Java reuses the input array
  ask="Merge k sorted linked lists into one sorted list.",
  cue="Merge Two Sorted Lists is already solved. Merging k lists one after another is slow, because the early nodes get copied past again and again. Merging them in pairs, like merge sort's levels, is not.",
  brute="Merge list 1 into list 2, the result into list 3, and so on: O(k × N) for N nodes in total, because the growing result is walked k times.",
  approach="Merge the lists in pairs: 0 with 1, 2 with 3, and so on, giving k/2 lists; repeat until one remains. Each round walks every node once, and there are about log₂ k rounds.",
  cx="O(N log k) time, O(1) extra space. Chapter 27 solves the same problem with a heap, also O(N log k).",
  trap="The empty cases: k = 0 lists, and lists that are themselves empty. The pairwise loop below returns None for k = 0 and the two-list merge handles empty lists without a branch.",
  py='''class Solution:
    def mergeKLists(self, lists: list[Optional[ListNode]]) -> Optional[ListNode]:
        def merge(a, b):               # Merge Two Sorted Lists
            dummy = tail = ListNode()
            while a and b:
                if a.val <= b.val:
                    tail.next, a = a, a.next
                else:
                    tail.next, b = b, b.next
                tail = tail.next
            tail.next = a or b
            return dummy.next

        if not lists:
            return None
        while len(lists) > 1:          # one round halves the number of lists
            lists = [merge(lists[i], lists[i + 1] if i + 1 < len(lists) else None)
                     for i in range(0, len(lists), 2)]
        return lists[0]''',
  java='''class Solution {
    public ListNode mergeKLists(ListNode[] lists) {
        if (lists.length == 0) return null;
        int n = lists.length;
        while (n > 1) {                // one round halves the number of lists
            for (int i = 0; i < n; i += 2)
                lists[i / 2] = merge(lists[i], i + 1 < n ? lists[i + 1] : null);
            n = (n + 1) / 2;
        }
        return lists[0];
    }

    private ListNode merge(ListNode a, ListNode b) {   // Merge Two Sorted Lists
        ListNode dummy = new ListNode(), tail = dummy;
        while (a != null && b != null) {
            if (a.val <= b.val) { tail.next = a; a = a.next; }
            else { tail.next = b; b = b.next; }
            tail = tail.next;
        }
        tail.next = a != null ? a : b;
        return dummy.next;
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(11)
def vals(lo=-5, hi=5, nmin=0, nmax=8): return [R.randint(lo, hi) for _ in range(R.randint(nmin, nmax))]

def gen_cyc():
    v = vals(nmin=0); pos = R.randint(-1, len(v) - 1) if v else -1
    return [CYC(v, pos)]

def gen19():
    v = vals(nmin=1); return [LL(v), R.randint(1, len(v))]
def gen2():
    a, b = R.randint(0, 10**R.randint(0, 6)), R.randint(0, 10**R.randint(0, 6))
    return [LL(map(int, str(a)[::-1])), LL(map(int, str(b)[::-1]))]
def brute2(a, b):
    num = lambda x: int("".join(map(str, x.vals[::-1])))
    return [int(c) for c in str(num(a) + num(b))[::-1]]

def gen138():
    n = R.randint(0, 7); return [RND([[R.randint(-5, 5), R.randint(-1, n - 1)] for _ in range(n)])]

def gen146():
    ops, args = ["LRUCache"], [[R.randint(1, 3)]]
    for _ in range(R.randint(1, 15)):
        if R.random() < 0.5: ops.append("get"); args.append([R.randint(1, 5)])
        else: ops.append("put"); args.append([R.randint(1, 5), R.randint(0, 9)])
    return ops, args
def brute146(ops, args):
    cap, order, store, res = args[0][0], [], {}, [None]   # order: least recent first
    for op, a in zip(ops[1:], args[1:]):
        if op == "get":
            if a[0] in store: order.remove(a[0]); order.append(a[0]); res.append(store[a[0]])
            else: res.append(-1)
        else:
            if a[0] in store: order.remove(a[0])
            order.append(a[0]); store[a[0]] = a[1]
            if len(order) > cap: del store[order.pop(0)]
            res.append(None)
    return res

def gen287():
    n = R.randint(1, 8); d = R.randint(1, n)
    others = R.sample([x for x in range(1, n + 1) if x != d], R.randint(0, n - 1))
    a = others + [d] * (n + 1 - len(others)); R.shuffle(a); return [a]

def gen23():
    return [[LL(sorted(vals(nmin=0, nmax=5))) for _ in range(R.randint(0, 5))]]

def reorder(v):
    out, i, j = [], 0, len(v) - 1
    while i <= j:
        out.append(v[i])
        if i != j: out.append(v[j])
        i += 1; j -= 1
    return out
def kgroup(v, k):
    out = []
    for i in range(0, len(v), k):
        g = v[i:i + k]; out += g[::-1] if len(g) == k else g
    return out

BRUTE = {
  206: (lambda: [LL(vals())], lambda h: h.vals[::-1]),
  21:  (lambda: [LL(sorted(vals())), LL(sorted(vals()))], lambda a, b: sorted(a.vals + b.vals)),
  141: (gen_cyc, lambda h: h.pos >= 0),
  876: (lambda: [LL(vals(nmin=1))], lambda h: h.vals[len(h.vals) // 2:]),
  19:  (gen19, lambda h, n: h.vals[:len(h.vals) - n] + h.vals[len(h.vals) - n + 1:]),
  143: (lambda: [LL(vals(nmin=1))], lambda h: reorder(h.vals)),
  142: (gen_cyc, lambda h: h.pos),
  2:   (gen2, brute2),
  148: (lambda: [LL(vals())], lambda h: sorted(h.vals)),
  138: (gen138, lambda h: (h.pairs, False)),
  146: (gen146, brute146),
  287: (gen287, lambda a: next(x for x in a if a.count(x) > 1)),
  25:  (lambda: (lambda v: [LL(v), R.randint(1, len(v))])(vals(nmin=1, nmax=10)), lambda h, k: kgroup(h.vals, k)),
  23:  (gen23, lambda ls: sorted(v for l in ls for v in l.vals)),
}
