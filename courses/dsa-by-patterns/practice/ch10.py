# Chapter 10 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
import random
from fractions import Fraction

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

# ---------------------------------------------------------------- Easy
prob(num=20, slug="valid-parentheses", title="Valid Parentheses", diff="Easy",
  method="isValid",
  ask="Decide whether a string of the brackets ( ) [ ] { } is properly matched and nested.",
  cue="The most recently opened bracket must be the first one closed. \"Last in, first out\" is the definition of a stack.",
  brute="Repeatedly delete every adjacent pair \"()\", \"[]\" or \"{}\" until nothing changes, then check the string is empty. Correct, but each round is O(n) and there can be n/2 rounds: O(n²).",
  approach="Scan left to right. Push every opening bracket. On a closing bracket, the top of the stack must be its matching opener: pop it if so, fail if not (or if the stack is empty). At the end the stack must be empty.",
  cx="O(n) time, O(n) space for the stack.",
  trap="Two endings people forget: a closing bracket arriving when the stack is empty (\")(\"), and openers left over at the end (\"((\"). Both are invalid.",
  py='''class Solution:
    def isValid(self, s: str) -> bool:
        match = {")": "(", "]": "[", "}": "{"}
        stack = []
        for c in s:
            if c in match:
                if not stack or stack.pop() != match[c]:
                    return False
            else:
                stack.append(c)
        return not stack               # leftover openers mean invalid''',
  java='''import java.util.ArrayDeque;

class Solution {
    public boolean isValid(String s) {
        ArrayDeque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') stack.push(c);
            else {
                if (stack.isEmpty()) return false;
                char open = stack.pop();
                if ((c == ')' && open != '(') || (c == ']' && open != '[') || (c == '}' && open != '{'))
                    return false;
            }
        }
        return stack.isEmpty();        // leftover openers mean invalid
    }
}''')

prob(num=232, slug="implement-queue-using-stacks", title="Implement Queue using Stacks", diff="Easy", design=True,
  ask="Build a first-in, first-out queue (push, pop, peek, empty) using only stacks.",
  cue="The min-queue in the Carrying the Minimum Alongside section is built from two stacks. A plain queue is the same construction without the minimum.",
  brute="Keep one stack and, on every pop, move everything to a second stack to reach the bottom, then move it all back: O(n) per pop.",
  approach="Push onto an in stack. To pop or peek, take from an out stack; if out is empty, first pour all of in into out, which reverses the order so the oldest element is on top. Each element is moved from in to out once in its life, so the pouring is paid for in advance, as Chapter 4's accounting argument puts it.",
  cx="O(1) amortized per operation, O(n) worst case for a single pop that triggers a pour. O(n) space.",
  trap="Pouring in into out when out is not empty. That buries older elements under newer ones and breaks the order. Pour only when out is empty.",
  py='''class MyQueue:
    def __init__(self):
        self.inbox, self.outbox = [], []

    def push(self, x: int) -> None:
        self.inbox.append(x)

    def pop(self) -> int:
        self.peek()                    # makes sure the oldest is on top of outbox
        return self.outbox.pop()

    def peek(self) -> int:
        if not self.outbox:            # pour only when outbox is empty
            while self.inbox:
                self.outbox.append(self.inbox.pop())
        return self.outbox[-1]

    def empty(self) -> bool:
        return not self.inbox and not self.outbox''',
  java='''import java.util.ArrayDeque;

class MyQueue {
    private final ArrayDeque<Integer> in = new ArrayDeque<>(), out = new ArrayDeque<>();

    public MyQueue() {}

    public void push(int x) { in.push(x); }

    public int pop() {
        peek();                        // makes sure the oldest is on top of out
        return out.pop();
    }

    public int peek() {
        if (out.isEmpty())             // pour only when out is empty
            while (!in.isEmpty()) out.push(in.pop());
        return out.peek();
    }

    public boolean empty() { return in.isEmpty() && out.isEmpty(); }
}''')

prob(num=496, slug="next-greater-element-i", title="Next Greater Element I", diff="Easy",
  method="nextGreaterElement",
  ask="For each value in a small list, find it in a larger list of distinct values and report the first bigger value to its right there (-1 if none).",
  cue="\"The first bigger value to the right\" is the first of the Monotonic Stack section's four questions.",
  brute="For each query, find it in nums2 and scan right for something bigger: O(len(nums1) × len(nums2)).",
  approach="Walk nums2 once with a stack of values still waiting for a bigger value; the stack stays decreasing from bottom to top. When a new value x arrives, everything on the stack smaller than x has found its answer, which is x: pop them and record it. Then push x. Afterwards, answer each query from the recorded map.",
  cx="O(len(nums1) + len(nums2)) time: each value is pushed and popped at most once. O(len(nums2)) space.",
  trap="Scanning right from each query instead of using the stack, which is the brute force in disguise. The point of the stack is that an element popped once is never looked at again.",
  py='''class Solution:
    def nextGreaterElement(self, nums1: list[int], nums2: list[int]) -> list[int]:
        greater = {}                   # value -> next greater value in nums2
        stack = []                     # values still waiting; decreasing bottom to top
        for x in nums2:
            while stack and stack[-1] < x:
                greater[stack.pop()] = x
            stack.append(x)
        return [greater.get(x, -1) for x in nums1]''',
  java='''import java.util.*;

class Solution {
    public int[] nextGreaterElement(int[] nums1, int[] nums2) {
        HashMap<Integer, Integer> greater = new HashMap<>();   // value -> next greater
        ArrayDeque<Integer> stack = new ArrayDeque<>();        // decreasing bottom to top
        for (int x : nums2) {
            while (!stack.isEmpty() && stack.peek() < x) greater.put(stack.pop(), x);
            stack.push(x);
        }
        int[] out = new int[nums1.length];
        for (int i = 0; i < nums1.length; i++) out[i] = greater.getOrDefault(nums1[i], -1);
        return out;
    }
}''')

# ---------------------------------------------------------------- Medium
prob(num=155, slug="min-stack", title="Min Stack", diff="Medium", design=True,
  ask="Build a stack that supports push, pop, top, and getMin (the smallest value currently in the stack), each in constant time.",
  cue="The Carrying the Minimum Alongside section: store, next to each value, the minimum of everything at or below it.",
  brute="Scan the whole stack on every getMin: O(n) per call.",
  approach="Push pairs (value, minimum so far). The minimum so far is min(value, the minimum stored in the pair below). Popping a pair automatically restores the previous minimum, because it was stored in the pair underneath.",
  cx="O(1) per operation. O(n) space.",
  trap="Keeping a single min variable. After you pop the minimum, you have no way to know what the next smallest is without a scan. Storing the minimum per level is what makes pop free.",
  py='''class MinStack:
    def __init__(self):
        self.stack = []                # (value, minimum of this level and below)

    def push(self, value: int) -> None:
        low = min(value, self.stack[-1][1]) if self.stack else value
        self.stack.append((value, low))

    def pop(self) -> None:
        self.stack.pop()

    def top(self) -> int:
        return self.stack[-1][0]

    def getMin(self) -> int:
        return self.stack[-1][1]''',
  java='''import java.util.ArrayDeque;

class MinStack {
    private final ArrayDeque<int[]> stack = new ArrayDeque<>();   // {value, min at or below}

    public MinStack() {}

    public void push(int value) {
        int low = stack.isEmpty() ? value : Math.min(value, stack.peek()[1]);
        stack.push(new int[]{value, low});
    }

    public void pop() { stack.pop(); }

    public int top() { return stack.peek()[0]; }

    public int getMin() { return stack.peek()[1]; }
}''')

prob(num=150, slug="evaluate-reverse-polish-notation", title="Evaluate Reverse Polish Notation", diff="Medium",
  method="evalRPN",
  ask="Evaluate an arithmetic expression written in postfix order (operands first, then the operator), given as a list of tokens.",
  cue="Postfix is what the Parsing Expressions section's shunting-yard algorithm produces, and a stack evaluates it: each operator applies to the two most recent values.",
  brute="Repeatedly find the first operator, replace it and its two operands with the result, and rebuild the list: O(n²).",
  approach="Scan the tokens. A number is pushed. An operator pops the right operand, then the left operand, and pushes the result. At the end the stack holds exactly one value, the answer.",
  cx="O(n) time, O(n) space.",
  trap="Two, both about subtraction and division. Pop order: the first pop is the right operand, so 5 3 - is 5 - 3, not 3 - 5. And division must round toward zero: -7 / 2 is -3. Java's / already does that; Python's // rounds down to -4, so use int(a / b).",
  py='''class Solution:
    def evalRPN(self, tokens: list[str]) -> int:
        stack = []
        for t in tokens:
            if t in ("+", "-", "*", "/"):
                b = stack.pop()        # right operand comes off first
                a = stack.pop()
                if t == "+":
                    stack.append(a + b)
                elif t == "-":
                    stack.append(a - b)
                elif t == "*":
                    stack.append(a * b)
                else:
                    stack.append(int(a / b))   # round toward zero, not down
            else:
                stack.append(int(t))
        return stack[0]''',
  java='''import java.util.ArrayDeque;

class Solution {
    public int evalRPN(String[] tokens) {
        ArrayDeque<Integer> stack = new ArrayDeque<>();
        for (String t : tokens) {
            switch (t) {
                case "+", "-", "*", "/" -> {
                    int b = stack.pop(), a = stack.pop();   // right operand comes off first
                    stack.push(switch (t) {
                        case "+" -> a + b;
                        case "-" -> a - b;
                        case "*" -> a * b;
                        default -> a / b;   // Java already rounds toward zero
                    });
                }
                default -> stack.push(Integer.parseInt(t));
            }
        }
        return stack.pop();
    }
}''')

prob(num=739, slug="daily-temperatures", title="Daily Temperatures", diff="Medium",
  method="dailyTemperatures",
  ask="For each day, report how many days you wait until a warmer day (0 if none comes).",
  cue="\"Wait for the next bigger value\" is the next-greater-element question again, answered with a distance instead of a value.",
  brute="From each day, scan forward for a warmer one: O(n²) on a cooling trend.",
  approach="Keep a stack of indices of days still waiting for a warmer day, their temperatures decreasing from bottom to top. When a new day is warmer than the day on top, that day's wait is over: pop it and record today's index minus its index. Repeat, then push today.",
  cx="O(n) time: each index is pushed once and popped at most once. O(n) space.",
  trap="Pushing temperatures instead of indices. You need the index to compute how many days passed, and you can always read the temperature back from the index.",
  py='''class Solution:
    def dailyTemperatures(self, temperatures: list[int]) -> list[int]:
        wait = [0] * len(temperatures)
        stack = []                     # indices still waiting for a warmer day
        for i, t in enumerate(temperatures):
            while stack and temperatures[stack[-1]] < t:
                j = stack.pop()
                wait[j] = i - j
            stack.append(i)
        return wait''',
  java='''import java.util.ArrayDeque;

class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int[] wait = new int[temperatures.length];
        ArrayDeque<Integer> stack = new ArrayDeque<>();   // indices still waiting
        for (int i = 0; i < temperatures.length; i++) {
            while (!stack.isEmpty() && temperatures[stack.peek()] < temperatures[i]) {
                int j = stack.pop();
                wait[j] = i - j;
            }
            stack.push(i);
        }
        return wait;
    }
}''')

prob(num=901, slug="online-stock-span", title="Online Stock Span", diff="Medium", design=True,
  ask="Prices arrive one day at a time. For each new price, report how many consecutive days, ending today, had a price no higher than today's.",
  cue="Looking back for the previous strictly greater price is the monotonic stack's \"previous greater\" question, answered online as each price arrives.",
  brute="Store every price and scan backwards on each call: O(n) per call, O(n²) overall on a rising market.",
  approach="Keep a stack of (price, span) with prices strictly decreasing from bottom to top. For a new price, pop every entry with a price at most today's and add its span to today's span (those days are all covered). Push (price, span) and return span.",
  cx="O(1) amortized per call: each price is pushed once and popped at most once. O(n) space.",
  trap="Popping only strictly smaller prices. The span counts days with price at most today's, so equal prices must be popped too, or a run of equal prices reports spans of 1.",
  py='''class StockSpanner:
    def __init__(self):
        self.stack = []                # (price, span); prices strictly decreasing

    def next(self, price: int) -> int:
        span = 1
        while self.stack and self.stack[-1][0] <= price:
            span += self.stack.pop()[1]   # those days are covered by today
        self.stack.append((price, span))
        return span''',
  java='''import java.util.ArrayDeque;

class StockSpanner {
    private final ArrayDeque<int[]> stack = new ArrayDeque<>();   // {price, span}

    public StockSpanner() {}

    public int next(int price) {
        int span = 1;
        while (!stack.isEmpty() && stack.peek()[0] <= price) span += stack.pop()[1];
        stack.push(new int[]{price, span});
        return span;
    }
}''')

prob(num=853, slug="car-fleet", title="Car Fleet", diff="Medium",
  method="carFleet",
  ask="Cars at different starting positions drive toward the same target at their own speeds. A faster car that catches a slower one slows down and travels with it as one fleet. Count the fleets that arrive.",
  cue="Sort by position, closest to the target first. Each car either catches the fleet directly ahead (and merges) or does not (and starts a new fleet). Only the fleet directly ahead matters, which is a stack with at most one relevant entry, or a single variable.",
  brute="Simulate the cars moving in small time steps and merging: slow, and fragile with fractional meeting times.",
  approach="Compute each car's arrival time if nothing blocked it: (target - position) / speed. Process cars from the one closest to the target backwards. A car whose time is at most the fleet ahead's time catches that fleet before the target and merges into it. A car whose time is larger arrives later on its own, so it starts a new fleet and becomes the one the cars behind it are compared against.",
  cx="O(n log n) time for the sort, O(n) space.",
  trap="Processing cars in input order, or from the back of the road. Only the car directly ahead can block you, so you must go from the target backwards. A car that catches up exactly at the target also counts as merged.",
  py='''class Solution:
    def carFleet(self, target: int, position: list[int], speed: list[int]) -> int:
        cars = sorted(zip(position, speed), reverse=True)   # closest to target first
        fleets = 0
        ahead = 0.0                    # arrival time of the fleet directly ahead
        for p, s in cars:
            t = (target - p) / s
            if t > ahead:              # cannot catch the fleet ahead: new fleet
                fleets += 1
                ahead = t
        return fleets''',
  java='''import java.util.Arrays;

class Solution {
    public int carFleet(int target, int[] position, int[] speed) {
        int n = position.length;
        Integer[] order = new Integer[n];
        for (int i = 0; i < n; i++) order[i] = i;
        Arrays.sort(order, (a, b) -> position[b] - position[a]);   // closest to target first
        int fleets = 0;
        double ahead = 0;              // arrival time of the fleet directly ahead
        for (int i : order) {
            double t = (double) (target - position[i]) / speed[i];
            if (t > ahead) {           // cannot catch the fleet ahead: new fleet
                fleets++;
                ahead = t;
            }
        }
        return fleets;
    }
}''')

prob(num=622, slug="design-circular-queue", title="Design Circular Queue", diff="Medium", design=True,
  ask="Build a fixed-capacity queue in one array: enQueue, deQueue, Front, Rear, isEmpty, isFull, with enQueue and deQueue reporting whether they succeeded and Front and Rear returning -1 when empty.",
  cue="The Circular Buffer section's structure, word for word, including its one ambiguity: when head equals tail, is the queue empty or full?",
  brute="Use a list and remove from the front on deQueue: O(n) per deQueue, because every element shifts.",
  approach="Keep the array, a head index, and a count. The tail position is (head + count) % capacity. enQueue writes there and increments count; deQueue moves head forward by one (mod capacity) and decrements count. Keeping a count is one of the section's two standard fixes for the ambiguity; the other is to leave one slot always empty.",
  cx="O(1) per operation, O(k) space.",
  trap="The Rear index. The last element is at (head + count - 1) % capacity, not at the next free slot. And deciding \"full\" from head == tail alone cannot tell full from empty; the count settles it.",
  py='''class MyCircularQueue:
    def __init__(self, k: int):
        self.buf = [0] * k
        self.head = 0
        self.count = 0                 # the count settles "empty or full?"

    def enQueue(self, value: int) -> bool:
        if self.isFull():
            return False
        self.buf[(self.head + self.count) % len(self.buf)] = value
        self.count += 1
        return True

    def deQueue(self) -> bool:
        if self.isEmpty():
            return False
        self.head = (self.head + 1) % len(self.buf)
        self.count -= 1
        return True

    def Front(self) -> int:
        return -1 if self.isEmpty() else self.buf[self.head]

    def Rear(self) -> int:
        return -1 if self.isEmpty() else self.buf[(self.head + self.count - 1) % len(self.buf)]

    def isEmpty(self) -> bool:
        return self.count == 0

    def isFull(self) -> bool:
        return self.count == len(self.buf)''',
  java='''class MyCircularQueue {
    private final int[] buf;
    private int head = 0, count = 0;   // the count settles "empty or full?"

    public MyCircularQueue(int k) { buf = new int[k]; }

    public boolean enQueue(int value) {
        if (isFull()) return false;
        buf[(head + count) % buf.length] = value;
        count++;
        return true;
    }

    public boolean deQueue() {
        if (isEmpty()) return false;
        head = (head + 1) % buf.length;
        count--;
        return true;
    }

    public int Front() { return isEmpty() ? -1 : buf[head]; }

    public int Rear() { return isEmpty() ? -1 : buf[(head + count - 1) % buf.length]; }

    public boolean isEmpty() { return count == 0; }

    public boolean isFull() { return count == buf.length; }
}''')

prob(num=907, slug="sum-of-subarray-minimums", title="Sum of Subarray Minimums", diff="Medium",
  method="sumSubarrayMins",
  ask="Add up the minimum of every block of consecutive values in an array, and return the total modulo 1,000,000,007.",
  cue="Flip the question: instead of finding each block's minimum, ask for each value how many blocks it is the minimum of. That count comes from the previous smaller and next smaller elements, two of the monotonic stack's four questions.",
  brute="For each start, extend to every end while tracking the running minimum: O(n²), about 450 million steps at n = 30,000.",
  approach="For each index i, let left = how many positions you can extend leftwards while every value is bigger than arr[i], counting i itself, and right = the same to the right. Then arr[i] is the minimum of exactly left × right blocks and contributes arr[i] × left × right. One monotonic-stack pass finds, for every index, both its left and right boundary.",
  cx="O(n) time, O(n) space.",
  trap="Equal values. If both sides stop at a strictly smaller value, a block with two equal minimums is counted twice. Stop at a strictly smaller value on one side and a smaller-or-equal value on the other, so each block's minimum belongs to exactly one index. In Java, use long before taking the remainder.",
  py='''class Solution:
    def sumSubarrayMins(self, arr: list[int]) -> int:
        MOD = 10**9 + 7
        n = len(arr)
        left, right = [0] * n, [0] * n
        stack = []
        for i in range(n):             # left: stop at a strictly smaller value
            while stack and arr[stack[-1]] > arr[i]:
                stack.pop()
            left[i] = i - stack[-1] if stack else i + 1
            stack.append(i)
        stack = []
        for i in range(n - 1, -1, -1): # right: stop at a smaller-or-equal value
            while stack and arr[stack[-1]] >= arr[i]:
                stack.pop()
            right[i] = stack[-1] - i if stack else n - i
            stack.append(i)
        return sum(arr[i] * left[i] * right[i] for i in range(n)) % MOD''',
  java='''import java.util.ArrayDeque;

class Solution {
    public int sumSubarrayMins(int[] arr) {
        final long MOD = 1_000_000_007L;
        int n = arr.length;
        int[] left = new int[n], right = new int[n];
        ArrayDeque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < n; i++) {          // left: stop at a strictly smaller value
            while (!stack.isEmpty() && arr[stack.peek()] > arr[i]) stack.pop();
            left[i] = stack.isEmpty() ? i + 1 : i - stack.peek();
            stack.push(i);
        }
        stack.clear();
        for (int i = n - 1; i >= 0; i--) {     // right: stop at a smaller-or-equal value
            while (!stack.isEmpty() && arr[stack.peek()] >= arr[i]) stack.pop();
            right[i] = stack.isEmpty() ? n - i : stack.peek() - i;
            stack.push(i);
        }
        long total = 0;
        for (int i = 0; i < n; i++) total = (total + (long) arr[i] * left[i] % MOD * right[i]) % MOD;
        return (int) total;
    }
}''')

prob(num=227, slug="basic-calculator-ii", title="Basic Calculator II", diff="Medium",
  method="calculate",
  ask="Evaluate a string expression with non-negative integers, + - * /, and spaces, respecting that * and / bind tighter than + and -. Division rounds toward zero.",
  cue="Operator precedence is the Parsing Expressions section's subject. With only two levels and no parentheses, a stack of terms is enough: * and / finish immediately, + and - wait on the stack.",
  brute="Convert to postfix with the full shunting-yard algorithm, then evaluate it as in Evaluate Reverse Polish Notation. Correct and O(n), but two passes and more code than the problem needs.",
  approach="Read numbers left to right, remembering the operator before each one. After a + push the number, after a - push its negative, after * or / pop the top, combine it with the number, and push the result. At the end the answer is the sum of the stack: all the multiplication and division was done on the way.",
  cx="O(n) time, O(n) space.",
  trap="Division of a negative term. Because a - pushes a negative number, \"1-7/2\" computes -7 / 2 on the stack, which must be -3 (toward zero). Python's // gives -4 and the answer comes out -3 instead of -2. Use int(a / b) in Python.",
  py='''class Solution:
    def calculate(self, s: str) -> int:
        stack = []
        num, op = 0, "+"               # the operator before the number being read
        for i, c in enumerate(s):
            if c.isdigit():
                num = num * 10 + int(c)
            if c in "+-*/" or i == len(s) - 1:
                if op == "+":
                    stack.append(num)
                elif op == "-":
                    stack.append(-num)
                elif op == "*":
                    stack.append(stack.pop() * num)
                else:
                    stack.append(int(stack.pop() / num))   # toward zero
                num, op = 0, c
        return sum(stack)''',
  java='''import java.util.ArrayDeque;

class Solution {
    public int calculate(String s) {
        ArrayDeque<Integer> stack = new ArrayDeque<>();
        int num = 0;
        char op = '+';                 // the operator before the number being read
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (Character.isDigit(c)) num = num * 10 + (c - '0');
            if ("+-*/".indexOf(c) >= 0 || i == s.length() - 1) {
                switch (op) {
                    case '+' -> stack.push(num);
                    case '-' -> stack.push(-num);
                    case '*' -> stack.push(stack.pop() * num);
                    default -> stack.push(stack.pop() / num);   // Java rounds toward zero
                }
                num = 0;
                op = c;
            }
        }
        int total = 0;
        for (int x : stack) total += x;
        return total;
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=84, slug="largest-rectangle-in-histogram", title="Largest Rectangle in Histogram", diff="Hard",
  method="largestRectangleArea",
  ask="Bars of width 1 stand side by side with the given heights. Find the area of the largest rectangle that fits inside the bars.",
  cue="The chapter gives this problem its own section. The best rectangle using bar i at full height stretches left and right until it meets a shorter bar: previous smaller and next smaller, from one stack.",
  brute="For each pair of left and right ends, the height is the shortest bar between them: O(n²) with a running minimum.",
  approach="Keep a stack of indices with increasing heights. When a bar shorter than the top arrives, the top bar cannot extend any further right. Pop it: its rectangle's right edge is the current index, its left edge is the new top of the stack, and its height is its own. Record the area. A sentinel bar of height 0 at the end flushes everything left on the stack.",
  cx="O(n) time: each index is pushed and popped once. O(n) space.",
  trap="The width when the stack becomes empty after a pop. Then no bar to the left is shorter, so the rectangle reaches all the way to index 0 and the width is i, not i - top - 1.",
  py='''class Solution:
    def largestRectangleArea(self, heights: list[int]) -> int:
        stack = []                     # indices, heights increasing
        best = 0
        for i, h in enumerate(heights + [0]):   # the 0 flushes the stack at the end
            while stack and heights[stack[-1]] > h:
                top = stack.pop()
                width = i - stack[-1] - 1 if stack else i   # empty: reaches index 0
                best = max(best, heights[top] * width)
            stack.append(i)
        return best''',
  java='''import java.util.ArrayDeque;

class Solution {
    public int largestRectangleArea(int[] heights) {
        ArrayDeque<Integer> stack = new ArrayDeque<>();   // indices, heights increasing
        int best = 0, n = heights.length;
        for (int i = 0; i <= n; i++) {
            int h = i == n ? 0 : heights[i];              // the 0 flushes the stack
            while (!stack.isEmpty() && heights[stack.peek()] > h) {
                int top = stack.pop();
                int width = stack.isEmpty() ? i : i - stack.peek() - 1;   // empty: reaches 0
                best = Math.max(best, heights[top] * width);
            }
            stack.push(i);
        }
        return best;
    }
}''')

prob(num=239, slug="sliding-window-maximum", title="Sliding Window Maximum", diff="Hard",
  method="maxSlidingWindow",
  ask="Slide a window of size k across an array and report the maximum of each window position.",
  cue="Chapter 8's fixed window, with a quantity (the maximum) that cannot be updated by subtracting the element that leaves. The Monotonic Deque section exists for exactly this.",
  brute="Take the maximum of each window from scratch: O(n × k). A heap gets O(n log n) but needs lazy deletion.",
  approach="Keep a deque of indices whose values decrease from front to back. For each new index: drop the front if it has slid out of the window; pop from the back every index whose value is at most the new one (they can never be a maximum again while the new one is in the window); push the new index. The front is the current window's maximum.",
  cx="O(n) time: each index enters and leaves the deque once. O(k) space.",
  trap="Storing values instead of indices. You need the index to know when the front has left the window, and with duplicates a value alone cannot tell you which copy left.",
  py='''from collections import deque

class Solution:
    def maxSlidingWindow(self, nums: list[int], k: int) -> list[int]:
        dq = deque()                   # indices; their values decrease front to back
        out = []
        for i, x in enumerate(nums):
            if dq and dq[0] <= i - k:
                dq.popleft()           # the front slid out of the window
            while dq and nums[dq[-1]] <= x:
                dq.pop()               # can never be the maximum again
            dq.append(i)
            if i >= k - 1:
                out.append(nums[dq[0]])
        return out''',
  java='''import java.util.ArrayDeque;

class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        ArrayDeque<Integer> dq = new ArrayDeque<>();   // indices; values decrease front to back
        int[] out = new int[nums.length - k + 1];
        for (int i = 0; i < nums.length; i++) {
            if (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();   // slid out
            while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) dq.pollLast();
            dq.addLast(i);
            if (i >= k - 1) out[i - k + 1] = nums[dq.peekFirst()];
        }
        return out;
    }
}''')

prob(num=862, slug="shortest-subarray-with-sum-at-least-k", title="Shortest Subarray with Sum at Least K", diff="Hard",
  method="shortestSubarray",
  ask="Find the length of the shortest block of consecutive values with sum at least k (-1 if none). Values can be negative.",
  cue="This is Chapter 8's Minimum Size Subarray Sum with negative numbers allowed, the exact case where the sliding window fails. Chapter 9's prefix sums turn it into \"find the closest earlier prefix at most P[j] - k\", and a monotonic deque of prefixes finds it.",
  brute="Every block with a running sum: O(n²).",
  approach="Compute prefix sums P. Scan j from left to right with a deque of earlier indices whose prefix values increase. While P[j] - P[front] ≥ k, the front gives a valid block; record its length and pop it (any later j would only make that block longer). Then pop from the back every index whose prefix is at least P[j] (j is a later start with a smaller or equal prefix, so it is better in every way). Push j.",
  cx="O(n) time, O(n) space.",
  trap="Overflow in Java: prefix sums reach 10¹⁰, beyond int. Use long. And the sliding window from Chapter 8 returns wrong answers here with complete confidence; the chapter's When the Window Does Not Shrink Monotonically section shows why.",
  py='''from collections import deque

class Solution:
    def shortestSubarray(self, nums: list[int], k: int) -> int:
        P = [0]
        for x in nums:
            P.append(P[-1] + x)
        dq = deque()                   # indices; prefix values increase front to back
        best = len(nums) + 1
        for j in range(len(P)):
            while dq and P[j] - P[dq[0]] >= k:
                best = min(best, j - dq.popleft())   # later j would only be longer
            while dq and P[dq[-1]] >= P[j]:
                dq.pop()               # j is a later, lower start: strictly better
            dq.append(j)
        return best if best <= len(nums) else -1''',
  java='''import java.util.ArrayDeque;

class Solution {
    public int shortestSubarray(int[] nums, int k) {
        int n = nums.length;
        long[] P = new long[n + 1];    // long: sums reach 10^10
        for (int i = 0; i < n; i++) P[i + 1] = P[i] + nums[i];
        ArrayDeque<Integer> dq = new ArrayDeque<>();   // prefix values increase front to back
        int best = n + 1;
        for (int j = 0; j <= n; j++) {
            while (!dq.isEmpty() && P[j] - P[dq.peekFirst()] >= k) best = Math.min(best, j - dq.pollFirst());
            while (!dq.isEmpty() && P[dq.peekLast()] >= P[j]) dq.pollLast();
            dq.addLast(j);
        }
        return best <= n ? best : -1;
    }
}''')

prob(num=224, slug="basic-calculator", title="Basic Calculator", diff="Hard",
  method="calculate",
  ask="Evaluate a string expression with integers, + and -, parentheses, spaces, and a minus sign that may negate a number or a whole bracket.",
  cue="Parentheses are nesting, and nesting is a stack. With only + and -, each bracket needs to remember two things when it opens: the total so far outside it, and the sign in front of it.",
  brute="Find an innermost bracket, evaluate it, splice the result back in, and repeat: O(n²).",
  approach="Scan once with total (the value of the current bracket so far) and sign (+1 or -1 for the next number). A number is added as sign × number. On \"(\", push total and sign, and start a fresh total. On \")\", finish: total = the pushed total + the pushed sign × this bracket's total. A minus in front of a bracket is handled by the pushed sign.",
  cx="O(n) time, O(n) space for the nesting depth.",
  trap="Multi-digit numbers and unary minus. Read all the digits of a number before using it, and treat a leading \"-\" (at the start or right after \"(\") as \"0 -\": with sign set to -1 and total 0, the same code handles it.",
  py='''class Solution:
    def calculate(self, s: str) -> int:
        stack = []                     # (total outside the bracket, sign in front of it)
        total, sign, num = 0, 1, 0
        for c in s:
            if c.isdigit():
                num = num * 10 + int(c)
            elif c in "+-":
                total += sign * num
                num, sign = 0, (1 if c == "+" else -1)
            elif c == "(":
                stack.append((total, sign))
                total, sign = 0, 1
            elif c == ")":
                total += sign * num
                outer, before = stack.pop()
                total, num = outer + before * total, 0
        return total + sign * num''',
  java='''import java.util.ArrayDeque;

class Solution {
    public int calculate(String s) {
        ArrayDeque<int[]> stack = new ArrayDeque<>();   // {total outside, sign in front}
        int total = 0, sign = 1, num = 0;
        for (char c : s.toCharArray()) {
            if (Character.isDigit(c)) num = num * 10 + (c - '0');
            else if (c == '+' || c == '-') {
                total += sign * num;
                num = 0;
                sign = c == '+' ? 1 : -1;
            } else if (c == '(') {
                stack.push(new int[]{total, sign});
                total = 0;
                sign = 1;
            } else if (c == ')') {
                total += sign * num;
                int[] outer = stack.pop();
                total = outer[0] + outer[1] * total;
                num = 0;
            }
        }
        return total + sign * num;
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(10)
def arr(lo, hi, nmin=1, nmax=9): return [R.randint(lo, hi) for _ in range(R.randint(nmin, nmax))]

class T(int):   # integer whose / rounds toward zero, for eval-based brute forces
    def __add__(a, b): return T(int(a) + int(b))
    def __sub__(a, b): return T(int(a) - int(b))
    def __mul__(a, b): return T(int(a) * int(b))
    def __neg__(a): return T(-int(a))
    def __truediv__(a, b):
        q = abs(int(a)) // abs(int(b)); return T(q if (a >= 0) == (b > 0) else -q)
def teval(expr):
    import re
    return int(eval(re.sub(r"\d+", lambda m: f"T({m.group()})", expr), {"T": T}))

def gen20():
    if R.random() < 0.5:
        def bal(d):
            if d == 0 or R.random() < 0.3: return ""
            o, c = R.choice(["()", "[]", "{}"]); return o + bal(d - 1) + c + bal(d - 1)
        s = bal(4)
        return [s if s else "()"]
    return ["".join(R.choice("()[]{}") for _ in range(R.randint(1, 8)))]
def brute20(s):
    prev = None
    while prev != s: prev, s = s, s.replace("()", "").replace("[]", "").replace("{}", "")
    return s == ""

def gen232():
    ops, args, size = ["MyQueue"], [[]], 0
    for _ in range(R.randint(1, 12)):
        op = R.choice(["push", "push", "pop", "peek", "empty"]) if size else R.choice(["push", "empty"])
        ops.append(op); args.append([R.randint(1, 9)] if op == "push" else [])
        size += op == "push"; size -= op == "pop"
    return ops, args
def brute232(ops, args):
    q, res = [], [None]
    for op, a in zip(ops[1:], args[1:]):
        if op == "push": q.append(a[0]); res.append(None)
        elif op == "pop": res.append(q.pop(0))
        elif op == "peek": res.append(q[0])
        else: res.append(not q)
    return res

def gen496():
    b = R.sample(range(10), R.randint(1, 9)); return [R.sample(b, R.randint(1, len(b))), b]
def brute496(a, b):
    return [next((y for y in b[b.index(x) + 1:] if y > x), -1) for x in a]

def gen155():
    ops, args, size = ["MinStack"], [[]], 0
    for _ in range(R.randint(1, 12)):
        op = R.choice(["push", "push", "pop", "top", "getMin"]) if size else "push"
        ops.append(op); args.append([R.randint(-5, 5)] if op == "push" else [])
        size += op == "push"; size -= op == "pop"
    return ops, args
def brute155(ops, args):
    st, res = [], [None]
    for op, a in zip(ops[1:], args[1:]):
        if op == "push": st.append(a[0]); res.append(None)
        elif op == "pop": st.pop(); res.append(None)
        elif op == "top": res.append(st[-1])
        else: res.append(min(st))
    return res

def gen150():
    def expr(d):
        if d == 0 or R.random() < 0.3: return [str(R.randint(-9, 9))]
        op = R.choice("+-*/"); l, r = expr(d - 1), expr(d - 1)
        if op == "/" and teval(rpn_to_infix(r)) == 0: op = "+"
        return l + r + [op]
    return [expr(3)]
def rpn_to_infix(toks):
    st = []
    for t in toks:
        if t in "+-*/" and len(t) == 1: b, a = st.pop(), st.pop(); st.append(f"({a}{t}{b})")
        else: st.append(f"({t})")
    return st[0]
def brute150(toks): return teval(rpn_to_infix(toks))

def gen901():
    n = R.randint(1, 10); return ["StockSpanner"] + ["next"] * n, [[]] + [[R.randint(1, 6)] for _ in range(n)]
def brute901(ops, args):
    ps, res = [], [None]
    for a in args[1:]:
        ps.append(a[0]); k = 0
        while k < len(ps) and ps[-1 - k] <= a[0]: k += 1
        res.append(k)
    return res

def gen853():
    target = R.randint(2, 20); n = R.randint(1, 7)
    return [target, R.sample(range(target), min(n, target)), [R.randint(1, 5) for _ in range(min(n, target))]]
def brute853(target, pos, spd):
    t = [Fraction(target - p, s) for p, s in zip(pos, spd)]
    # a car is absorbed if some car ahead of it arrives no earlier (it catches that car by the target)
    return sum(1 for i in range(len(pos)) if not any(pos[j] > pos[i] and t[j] >= t[i] for j in range(len(pos))))

def gen622():
    ops, args = ["MyCircularQueue"], [[R.randint(1, 4)]]
    for _ in range(R.randint(1, 14)):
        op = R.choice(["enQueue", "enQueue", "deQueue", "Front", "Rear", "isEmpty", "isFull"])
        ops.append(op); args.append([R.randint(0, 9)] if op == "enQueue" else [])
    return ops, args
def brute622(ops, args):
    k, q, res = args[0][0], [], [None]
    for op, a in zip(ops[1:], args[1:]):
        if op == "enQueue": res.append(len(q) < k); q.append(a[0]) if len(q) < k else None
        elif op == "deQueue": res.append(bool(q)); q.pop(0) if q else None
        elif op == "Front": res.append(q[0] if q else -1)
        elif op == "Rear": res.append(q[-1] if q else -1)
        elif op == "isEmpty": res.append(not q)
        else: res.append(len(q) == k)
    return res

def gen227():
    parts = [str(R.randint(0, 30))]
    for _ in range(R.randint(0, 5)):
        op = R.choice("+-*/"); parts += [op, str(R.randint(1 if op == "/" else 0, 30))]
    return ["".join(p + " " * R.randint(0, 1) for p in parts)]

def gen224():
    def expr(d, lead_ok=True):
        s = ("-" if lead_ok and R.random() < 0.3 else "") + atom(d)
        for _ in range(R.randint(0, 2)): s += R.choice("+-") + atom(d)
        return s
    def atom(d): return f"({expr(d - 1)})" if d > 0 and R.random() < 0.4 else str(R.randint(0, 30))
    import re   # spaces around operators and brackets only, never inside a number
    return [re.sub(r"[()+-]", lambda m: " " * (R.random() < 0.2) + m.group() + " " * (R.random() < 0.2), expr(3))]

BRUTE = {
  20:  (gen20, brute20),
  232: (gen232, brute232),
  496: (gen496, brute496),
  155: (gen155, brute155),
  150: (gen150, brute150),
  739: (lambda: [arr(30, 40)], lambda t: [next((j - i for j in range(i + 1, len(t)) if t[j] > t[i]), 0) for i in range(len(t))]),
  901: (gen901, brute901),
  853: (gen853, brute853),
  622: (gen622, brute622),
  907: (lambda: [arr(1, 5)], lambda a: sum(min(a[i:j]) for i in range(len(a)) for j in range(i + 1, len(a) + 1)) % (10**9 + 7)),
  227: (gen227, lambda s: teval(s)),
  84:  (lambda: [arr(0, 6)], lambda h: max(min(h[i:j]) * (j - i) for i in range(len(h)) for j in range(i + 1, len(h) + 1))),
  239: (lambda: (lambda a: [a, R.randint(1, len(a))])(arr(-5, 5)), lambda a, k: [max(a[i:i + k]) for i in range(len(a) - k + 1)]),
  862: (lambda: [arr(-5, 8), R.randint(1, 12)],
        lambda a, k: min([j - i for i in range(len(a)) for j in range(i + 1, len(a) + 1) if sum(a[i:j]) >= k] or [-1])),
  224: (gen224, lambda s: eval(s)),
}
