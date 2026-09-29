# Chapter 6 practice problems: prose + Python + Java per problem, plus BRUTE = {num: (generator, brute force)}.
import random
from practice import Approx

PROBLEMS = []
def prob(**kw): PROBLEMS.append(kw)

# ---------------------------------------------------------------- Easy
prob(num=509, slug="fibonacci-number", title="Fibonacci Number", diff="Easy",
  method="fib",
  ask="Return the n-th Fibonacci number, where F(0) = 0, F(1) = 1, and each later number is the sum of the two before it.",
  cue="The Write the Recurrence First section's first example. The definition is already a recursion; the question is what that recursion costs, and the answer is exponential because it forgets what it has computed.",
  brute="Translate the definition directly: fib(n) = fib(n - 1) + fib(n - 2). It is correct, and it makes about 1.6ⁿ calls, roughly 2.7 million at n = 30 (the problem's limit).",
  approach="Every value depends only on the two before it, so walk upwards from the base cases keeping the last two values. This is the recursion converted to iteration, the move the Converting Recursion to Iteration section describes, and it computes each value once.",
  cx="O(n) time, O(1) space. The naive recursion is O(φⁿ) time with φ ≈ 1.618, and O(n) stack depth.",
  trap="Believing the recursive version is \"O(n) because the stack is n deep\". Depth measures space, not time: the call tree has exponentially many nodes even though no path through it is longer than n.",
  py='''class Solution:
    def fib(self, n: int) -> int:
        a, b = 0, 1                    # F(0), F(1)
        for _ in range(n):
            a, b = b, a + b            # slide the pair one step up
        return a''',
  java='''class Solution {
    public int fib(int n) {
        int a = 0, b = 1;              // F(0), F(1)
        for (int i = 0; i < n; i++) {
            int next = a + b;          // slide the pair one step up
            a = b;
            b = next;
        }
        return a;
    }
}''')

prob(num=1137, slug="n-th-tribonacci-number", title="N-th Tribonacci Number", diff="Easy",
  method="tribonacci",
  ask="Return the n-th Tribonacci number: T(0) = 0, T(1) = 1, T(2) = 1, and each later number is the sum of the three before it.",
  cue="Fibonacci with three terms instead of two. Write the recurrence, notice the naive version branches three ways, and keep the last three values instead.",
  brute="The direct recursion's call count grows like 1.84ⁿ: about 4 billion calls at n = 37.",
  approach="Keep the last three values, starting from T(0), T(1), T(2), and slide them upwards n times.",
  cx="O(n) time, O(1) space.",
  trap="The three base cases. T(1) and T(2) are both 1; a version that handles only n = 0 and n = 1 as base cases computes T(2) = T(1) + T(0) + T(-1) and fails.",
  py='''class Solution:
    def tribonacci(self, n: int) -> int:
        a, b, c = 0, 1, 1              # T(0), T(1), T(2)
        for _ in range(n):
            a, b, c = b, c, a + b + c
        return a''',
  java='''class Solution {
    public int tribonacci(int n) {
        int a = 0, b = 1, c = 1;       // T(0), T(1), T(2)
        for (int i = 0; i < n; i++) {
            int next = a + b + c;
            a = b;
            b = c;
            c = next;
        }
        return a;
    }
}''')

prob(num=231, slug="power-of-two", title="Power of Two", diff="Easy",
  method="isPowerOfTwo",
  ask="Decide whether an integer (possibly negative or zero) is a power of two.",
  cue="A clean induction: 1 is a power of two, and n > 1 is one exactly when n is even and n / 2 is one. The Recursion Is Induction section's shape: base case, then a smaller case of the same question.",
  brute="Compute 1, 2, 4, 8, … up to n and check whether n appears: the same O(log n) work as the recursion.",
  approach="If n is 1, answer true. If n is at most 0 or odd, answer false. Otherwise the answer is the same question for n / 2. Each call halves n, so there are at most 31 calls for a 32-bit integer. (Chapter 40 does it in one instruction with n &amp; (n - 1).)",
  cx="O(log n) time and O(log n) stack depth, at most 31 frames.",
  trap="Zero and negative numbers. Without the n ≤ 0 check, 0 is even, 0 / 2 is 0, and the recursion never reaches its base case.",
  py='''class Solution:
    def isPowerOfTwo(self, n: int) -> bool:
        if n == 1:
            return True                # base case: 2^0
        if n <= 0 or n % 2:
            return False               # zero, negatives and odd numbers are out
        return self.isPowerOfTwo(n // 2)''',
  java='''class Solution {
    public boolean isPowerOfTwo(int n) {
        if (n == 1) return true;                   // base case: 2^0
        if (n <= 0 || n % 2 != 0) return false;    // zero, negatives, odd numbers
        return isPowerOfTwo(n / 2);
    }
}''')

# ---------------------------------------------------------------- Medium
prob(num=50, slug="powx-n", title="Pow(x, n)", diff="Medium",
  method="myPow",
  ask="Compute x raised to the power n, where n can be any 32-bit integer, including negative.",
  cue="The Write the Recurrence First section's third example: x^n = (x^(n/2))² for even n. The same function written with that recurrence drops from n multiplications to about log₂ n.",
  brute="Multiply x by itself n times: O(n), and n can be about 2 billion.",
  approach="For a negative n, compute 1 / x^(-n). For n ≥ 0: x^0 = 1; otherwise compute half = x^(n // 2) once, square it, and multiply by one extra x if n is odd. Computing half once rather than twice is what makes it logarithmic.",
  cx="O(log n) time and O(log n) stack depth (about 31 frames).",
  trap="n = -2³¹. In Java, negating it overflows back to -2³¹, because 2³¹ does not fit in an int. Convert n to long before negating. And call the recursion once per level: writing myPow(x, n/2) * myPow(x, n/2) makes two calls per level, which is O(n) again.",
  py='''class Solution:
    def myPow(self, x: float, n: int) -> float:
        if n < 0:
            return 1 / self.myPow(x, -n)
        if n == 0:
            return 1.0
        half = self.myPow(x, n // 2)   # computed once, used twice
        return half * half * (x if n % 2 else 1.0)''',
  java='''class Solution {
    public double myPow(double x, int n) {
        long N = n;                    // -(-2^31) does not fit in an int
        return N < 0 ? 1 / pow(x, -N) : pow(x, N);
    }

    private double pow(double x, long n) {
        if (n == 0) return 1.0;
        double half = pow(x, n / 2);   // computed once, used twice
        return n % 2 == 1 ? half * half * x : half * half;
    }
}''')

prob(num=779, slug="k-th-symbol-in-grammar", title="K-th Symbol in Grammar", diff="Medium",
  method="kthGrammar",
  ask="Row 1 is \"0\". Each next row replaces every 0 with \"01\" and every 1 with \"10\". Return the k-th symbol (counting from 1) of row n.",
  cue="Row n has 2ⁿ⁻¹ symbols, over half a billion at n = 30, so building it is out. But each symbol comes from exactly one parent in the row above: write the recurrence for that parent.",
  brute="Build every row up to n: O(2ⁿ) time and memory.",
  approach="The k-th symbol of row n comes from the parent at position (k + 1) // 2 in row n - 1. If k is odd it is the first child, which copies the parent; if k is even it is the second child, which flips it. Recurse on the parent until row 1, whose only symbol is 0.",
  cx="O(n) time and O(n) stack depth.",
  trap="Off-by-one on the parent position with 1-based k. Positions 1 and 2 share parent 1, positions 3 and 4 share parent 2: the parent is (k + 1) // 2, not k // 2.",
  py='''class Solution:
    def kthGrammar(self, n: int, k: int) -> int:
        if n == 1:
            return 0
        parent = self.kthGrammar(n - 1, (k + 1) // 2)
        return parent if k % 2 == 1 else 1 - parent   # first child copies, second flips''',
  java='''class Solution {
    public int kthGrammar(int n, int k) {
        if (n == 1) return 0;
        int parent = kthGrammar(n - 1, (k + 1) / 2);
        return k % 2 == 1 ? parent : 1 - parent;   // first child copies, second flips
    }
}''')

prob(num=1823, slug="find-the-winner-of-the-circular-game", title="Find the Winner of the Circular Game", diff="Medium",
  method="findTheWinner",
  ask="n friends sit in a circle, numbered 1 to n. Counting starts at friend 1; every k-th friend counted leaves, and counting continues from the next friend. Return the last one left.",
  cue="After one friend leaves, the rest is the same game with n - 1 people, only renumbered. \"Solve the smaller version, then translate its answer\" is recursion, and this is the classic Josephus recurrence.",
  brute="Simulate with a list, removing every k-th person: O(n²) with list deletions, which is fine for n ≤ 500 and a good way to check your recurrence.",
  approach="Number the friends from 0 for the math. With one person the survivor is position 0. With n people, the first to leave is at (k - 1) mod n and counting restarts right after them, so the survivor of the n-person game is (survivor of the (n - 1)-person game + k) mod n. Build it upwards from 1 person to n, and add 1 at the end to return to 1-based numbering.",
  cx="O(n) time, O(1) space in the iterative form below. The recursive form is O(n) stack depth.",
  trap="Mixing 0-based and 1-based numbering. The modular recurrence only works with positions 0 to n - 1; convert once, at the end.",
  py='''class Solution:
    def findTheWinner(self, n: int, k: int) -> int:
        survivor = 0                   # 0-based survivor with 1 person
        for m in range(2, n + 1):      # grow the circle to m people
            survivor = (survivor + k) % m
        return survivor + 1            # back to 1-based numbering''',
  java='''class Solution {
    public int findTheWinner(int n, int k) {
        int survivor = 0;              // 0-based survivor with 1 person
        for (int m = 2; m <= n; m++) survivor = (survivor + k) % m;   // grow to m people
        return survivor + 1;           // back to 1-based numbering
    }
}''')

prob(num=394, slug="decode-string", title="Decode String", diff="Medium",
  method="decodeString",
  ask="Expand an encoded string where k[text] means text repeated k times, and brackets can nest, as in \"3[a2[c]]\" → \"accaccacc\".",
  cue="Nested brackets are a recursive structure: the inside of a bracket is itself an encoded string. Decode it with a function that calls itself on the inside and returns where it stopped.",
  brute="Repeatedly find an innermost bracket, expand it, and rebuild the string until none remain. Correct, but each round rescans and rebuilds the whole string.",
  approach="A helper decodes from position i until it hits \"]\" or the end, and returns the text plus the position where it stopped. Letters are appended; digits build up a count; \"[\" calls the helper on the inside, then appends that result count times and continues after the matching \"]\".",
  cx="O(output length) time, since every output character is written once per enclosing repetition. Stack depth equals the nesting depth, at most 15 here.",
  trap="Multi-digit counts like \"12[ab]\". Build the number digit by digit (count = count × 10 + digit) and reset it after each bracket.",
  py='''class Solution:
    def decodeString(self, s: str) -> str:
        def decode(i):                 # returns (decoded text, index where it stopped)
            out, count = [], 0
            while i < len(s) and s[i] != "]":
                c = s[i]
                if c.isdigit():
                    count = count * 10 + int(c)
                    i += 1
                elif c == "[":
                    inner, i = decode(i + 1)   # the inside is the same problem
                    out.append(inner * count)
                    count = 0
                    i += 1             # skip the matching "]"
                else:
                    out.append(c)
                    i += 1
            return "".join(out), i

        return decode(0)[0]''',
  java='''class Solution {
    private int i;                     // shared read position

    public String decodeString(String s) {
        i = 0;
        return decode(s);
    }

    private String decode(String s) {
        StringBuilder out = new StringBuilder();
        int count = 0;
        while (i < s.length() && s.charAt(i) != ']') {
            char c = s.charAt(i);
            if (Character.isDigit(c)) {
                count = count * 10 + (c - '0');
                i++;
            } else if (c == '[') {
                i++;
                String inner = decode(s);   // the inside is the same problem
                out.append(inner.repeat(count));
                count = 0;
                i++;                   // skip the matching ']'
            } else {
                out.append(c);
                i++;
            }
        }
        return out.toString();
    }
}''')

# ---------------------------------------------------------------- Hard
prob(num=1106, slug="parsing-a-boolean-expression", title="Parsing A Boolean Expression", diff="Hard",
  method="parseBoolExpr",
  ask="Evaluate a boolean expression built from t, f, !(expr), &amp;(expr,expr,…) and |(expr,expr,…).",
  cue="The grammar is recursive, so the natural solution is recursive. But the expression can be 20,000 characters, and \"!(!(!(…)))\" nests about 6,700 deep, past Python's default limit of 1,000 frames. The Recursion Depth as a Failure Mode section's case, fixed the way Converting Recursion to Iteration describes: an explicit stack.",
  brute="Repeatedly find an innermost operator group, evaluate it, and replace it with t or f: O(n²).",
  approach="Scan left to right with a stack. Push operators and t/f values; skip commas. On \")\", pop values until the operator, and replace the whole group with its result: ! negates its one value, &amp; is true when no value is f, | is true when some value is t. At the end the stack holds the answer.",
  cx="O(n) time: each character is pushed and popped at most once. O(n) space for the stack, which lives on the heap and has no depth limit.",
  trap="Shipping the recursive version in Python and testing it only on shallow inputs. It is correct and fails with RecursionError on deep ones. Raising the limit with sys.setrecursionlimit works until it crashes the interpreter's own C stack; the section explains why that second limit exists.",
  py='''class Solution:
    def parseBoolExpr(self, expression: str) -> bool:
        stack = []                     # an explicit stack: no recursion depth limit
        for c in expression:
            if c == ",":
                continue
            if c != ")":
                stack.append(c)        # operators, "(", "t" and "f"
                continue
            values = []
            while stack[-1] != "(":
                values.append(stack.pop())
            stack.pop()                # the "("
            op = stack.pop()
            if op == "!":
                result = values[0] == "f"
            elif op == "&":
                result = "f" not in values
            else:
                result = "t" in values
            stack.append("t" if result else "f")
        return stack[0] == "t"''',
  java='''import java.util.ArrayDeque;

class Solution {
    public boolean parseBoolExpr(String expression) {
        ArrayDeque<Character> stack = new ArrayDeque<>();   // no recursion depth limit
        for (char c : expression.toCharArray()) {
            if (c == ',') continue;
            if (c != ')') { stack.push(c); continue; }       // operators, '(', 't', 'f'
            boolean seenT = false, seenF = false;
            while (stack.peek() != '(') {
                if (stack.pop() == 't') seenT = true; else seenF = true;
            }
            stack.pop();               // the '('
            char op = stack.pop();
            boolean result = op == '!' ? seenF : op == '&' ? !seenF : seenT;
            stack.push(result ? 't' : 'f');
        }
        return stack.peek() == 't';
    }
}''')

# ---------------------------------------------------------------- brute forces and generators
R = random.Random(6)

def brute_fib(n):
    return n if n < 2 else brute_fib(n - 1) + brute_fib(n - 2)
def brute_trib(n):
    return [0, 1, 1][n] if n < 3 else brute_trib(n - 1) + brute_trib(n - 2) + brute_trib(n - 3)

def gen50():
    x = R.choice([R.randint(-12, 12) / 4, round(R.uniform(-3, 3), 3)])
    if x == 0: x = 0.5
    return [x, R.randint(-12, 12)]

def brute779(n, k):
    row = "0"
    for _ in range(n - 1): row = "".join("01" if c == "0" else "10" for c in row)
    return int(row[k - 1])

def brute1823(n, k):
    people, i = list(range(1, n + 1)), 0
    while len(people) > 1:
        i = (i + k - 1) % len(people); people.pop(i)
    return people[0]

def gen394():
    def enc(d):
        parts = []
        for _ in range(R.randint(1, 3)):
            if d > 0 and R.random() < 0.4: parts.append(f"{R.randint(1, 12)}[{enc(d - 1)}]")
            else: parts.append("".join(R.choice("abc") for _ in range(R.randint(1, 2))))
        return "".join(parts)
    return [enc(3)]
def brute394(s):
    import re
    while "[" in s:
        s = re.sub(r"(\d+)\[([a-z]*)\]", lambda m: m.group(2) * int(m.group(1)), s)
    return s

def gen1106():
    def ex(d):
        if d == 0 or R.random() < 0.3: return R.choice("tf")
        op = R.choice("!&|")
        if op == "!": return f"!({ex(d - 1)})"
        return op + "(" + ",".join(ex(d - 1) for _ in range(R.randint(1, 3))) + ")"
    if R.random() < 0.05:              # a deep chain, past Python's default recursion limit
        return ["!(" * 1500 + R.choice("tf") + ")" * 1500]
    return [ex(4)]
def brute1106(e):
    import re
    prev = None
    while prev != e:
        prev = e
        e = re.sub(r"!\(([tf])\)", lambda m: "f" if m.group(1) == "t" else "t", e)
        e = re.sub(r"&\(([tf](?:,[tf])*)\)", lambda m: "f" if "f" in m.group(1) else "t", e)
        e = re.sub(r"\|\(([tf](?:,[tf])*)\)", lambda m: "t" if "t" in m.group(1) else "f", e)
    return e == "t"

BRUTE = {
  509:  (lambda: [R.randint(0, 22)], brute_fib),
  1137: (lambda: [R.randint(0, 18)], brute_trib),
  231:  (lambda: [R.choice([R.randint(-20, 70), 2 ** R.randint(0, 30), -(2 ** R.randint(0, 30)), 2 ** R.randint(0, 30) + 1, 0])],
         lambda n: n > 0 and bin(n).count("1") == 1),
  50:   (gen50, lambda x, n: Approx(x ** n)),
  779:  (lambda: (lambda n: [n, R.randint(1, 2 ** (n - 1))])(R.randint(1, 10)), brute779),
  1823: (lambda: (lambda n: [n, R.randint(1, n)])(R.randint(1, 30)), brute1823),
  394:  (gen394, brute394),
  1106: (gen1106, brute1106),
}
