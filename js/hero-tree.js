/* ==========================================================================
   hero-tree.js — the live B-tree on the home page, drawn in the site's own
   poster language (flat ink tiles, League Spartan numerals, 4px branches).
   Same algorithm as the Chapter 5 machine: order 4 (at most 3 keys per node),
   a full node is split on the way down, and the tree grows at the root.
   Colours carry meaning: yellow = the key just inserted, green = the path it
   took, red = nodes that split on the way.
   ========================================================================== */
(function () {
  "use strict";
  var svg = document.getElementById("tree");
  if (!svg) return;
  var NS = "http://www.w3.org/2000/svg";
  var MAXK = 3, CW = 60, H = 64, G = 6, SIB = 36, LH = 136, LABEL = 150;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var narrow = matchMedia("(max-width: 600px)");

  var root, nextId, last, used;
  var els = {};          // node id -> <g>
  var edges = {};        // child id -> <path>
  var dots = {};         // child id -> <circle>
  var box = null;        // current viewBox [x, y, w, h]

  svg.innerHTML = "";
  var gEdges = el("g", { "class": "edges" }, svg);
  var gNodes = el("g", { "class": "nodes" }, svg);
  var gLabels = el("g", { "class": "lvl", "aria-hidden": "true" }, svg);

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function Node(leaf) { return { id: nextId++, keys: [], kids: [], leaf: leaf }; }

  /* ---------- the algorithm ---------- */
  function splitChild(p, i, info) {
    var child = p.kids[i], right = Node(child.leaf);
    right.keys = child.keys.splice(2);
    var up = child.keys.pop();
    if (!child.leaf) right.kids = child.kids.splice(2);
    p.keys.splice(i, 0, up);
    p.kids.splice(i + 1, 0, right);
    info.split[child.id] = info.split[right.id] = true;
    info.promoted.push(up);
  }
  function insert(k) {
    var info = { key: k, path: {}, split: {}, promoted: [], grew: false, dup: false };
    if (root.keys.length === MAXK) {
      var nr = Node(false);
      nr.kids.push(root);
      splitChild(nr, 0, info);
      root = nr;
      info.grew = true;
    }
    var n = root;
    for (;;) {
      info.path[n.id] = true;
      if (n.leaf) {
        if (n.keys.indexOf(k) !== -1) { info.dup = true; return info; }
        var at = 0;
        while (at < n.keys.length && n.keys[at] < k) at++;
        n.keys.splice(at, 0, k);
        used[k] = true;
        return info;
      }
      var i = 0;
      while (i < n.keys.length && k >= n.keys[i]) i++;
      if (n.kids[i].keys.length === MAXK) { splitChild(n, i, info); continue; }
      n = n.kids[i];
    }
  }

  /* ---------- layout: subtree widths, then positions ---------- */
  function own(n) { return n.keys.length * CW + (n.keys.length - 1) * G; }
  function width(n) {
    if (n.leaf) return own(n);
    var sum = -SIB;
    n.kids.forEach(function (c) { sum += width(c) + SIB; });
    return Math.max(own(n), sum);
  }
  function place(n, x, y, w, out, parent, slot) {
    var nx = x + w / 2 - own(n) / 2;
    out.push({ n: n, x: nx, y: y, parent: parent, slot: slot });
    if (!n.leaf) {
      var cx = x, me = out[out.length - 1];
      n.kids.forEach(function (c, i) {
        var cw = width(c);
        place(c, cx, y + LH, cw, out, me, i);
        cx += cw + SIB;
      });
    }
    return out;
  }
  // x of the pointer to child i: in the gap between key i-1 and key i.
  function slotX(p, i) {
    if (i === 0) return p.x + 10;
    if (i === p.n.keys.length) return p.x + own(p.n) - 10;
    return p.x + i * (CW + G) - G / 2;
  }

  /* ---------- drawing ---------- */
  function render(info) {
    var w = width(root), list = place(root, 0, 0, w, [], null, 0);
    var depth = 0, seen = {};
    list.forEach(function (p) {
      seen[p.n.id] = true;
      depth = Math.max(depth, p.y / LH);
      var g = els[p.n.id], fresh = !g;
      if (fresh) {
        g = els[p.n.id] = el("g", { "class": "node" }, gNodes);
        var from = p.parent ? [p.parent.x, p.parent.y] : [p.x, p.y - LH];
        g.style.transform = "translate(" + from[0] + "px," + from[1] + "px)";
        g.style.opacity = "0";
        g.getBoundingClientRect(); // commit the start state before moving
      }
      g.style.transform = "translate(" + p.x + "px," + p.y + "px)";
      g.style.opacity = "1";

      var cls = info.split[p.n.id] ? "split" : info.path[p.n.id] ? "path" : "";
      var html = "";
      p.n.keys.forEach(function (k, i) {
        var c = k === info.key && !info.dup ? "new" : cls;
        html += '<g class="tile ' + c + '" transform="translate(' + i * (CW + G) + ',0)">' +
                '<rect width="' + CW + '" height="' + H + '" rx="10"/>' +
                '<text x="' + CW / 2 + '" y="' + (H / 2 + 11) + '">' + k + "</text></g>";
      });
      g.innerHTML = html;

      if (p.parent) {
        var x1 = slotX(p.parent, p.slot), y1 = p.parent.y + H;
        var x2 = p.x + own(p.n) / 2, y2 = p.y;
        var d = "path('M " + x1 + " " + y1 + " L " + x2 + " " + y2 + "')";
        var on = info.path[p.n.id] && info.path[p.parent.n.id] ? "on" : "";
        var e = edges[p.n.id] || (edges[p.n.id] = el("path", {}, gEdges));
        var dot = dots[p.n.id] || (dots[p.n.id] = el("circle", { r: 7 }, gEdges));
        e.setAttribute("class", on);
        dot.setAttribute("class", on);
        e.setAttribute("d", "M " + x1 + " " + y1 + " L " + x2 + " " + y2); // fallback
        e.style.d = d;
        dot.style.transform = "translate(" + x1 + "px," + y1 + "px)";
      }
    });
    // Nodes and edges that are gone (only after a reset).
    Object.keys(els).forEach(function (id) {
      if (!seen[id]) { els[id].remove(); delete els[id]; }
    });
    Object.keys(edges).forEach(function (id) {
      if (!seen[id] || +id === root.id) {
        edges[id].remove(); dots[id].remove(); delete edges[id]; delete dots[id];
      }
    });

    // Level names down the left edge: a small detail for a second look.
    var names = depth === 0 ? ["root and leaf"] :
      ["root"].concat(Array(Math.max(0, depth - 1)).fill("internal"), ["leaves"]);
    gLabels.innerHTML = names.map(function (t, i) {
      return '<text x="-28" y="' + (i * LH + H / 2 + 6) + '">' + t + "</text>";
    }).join("");

    var lab = narrow.matches ? 0 : LABEL;
    gLabels.style.display = lab ? "" : "none";
    frame([-lab - 8, -8, Math.max(w, 260) + lab + 16, depth * LH + H + 16]);
  }

  // Ease the viewBox to its new size so a growing tree doesn't jump.
  function frame(to) {
    if (!box || reduce) { box = to; set(to); return; }
    var from = box.slice(), t0 = performance.now();
    box = to;
    (function step(t) {
      var k = Math.min(1, (t - t0) / 500), e = 1 - Math.pow(1 - k, 3);
      set(from.map(function (v, i) { return v + (to[i] - v) * e; }));
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  function set(b) {
    svg.setAttribute("viewBox", b.join(" "));
    // Never let numerals drop below ~13px on a phone: scroll sideways instead.
    svg.style.minWidth = narrow.matches ? Math.round(b[2] * 0.42) + "px" : "";
  }

  /* ---------- words ---------- */
  var note = document.getElementById("tree-note");
  function say(info) {
    var k = info.key;
    if (info.dup) return k + " is already in the tree. Try another key.";
    if (info.grew) return "The root was full, so " + info.promoted[0] +
      " moved up into a new root. A B-tree grows at the top, never at the leaves.";
    if (info.promoted.length) return k + " went in. On the way down a full node split in two and " +
      info.promoted.join(" and ") + " moved up a level.";
    return k + " went in. It followed the green path to a leaf that had room.";
  }

  function add(k) {
    last = insert(k);
    render(last);
    note.textContent = say(last);
  }
  function reset(keys) {
    root = null; nextId = 1; used = {}; box = null;
    root = Node(true);
    var info = { key: null, path: {}, split: {}, promoted: [] };
    keys.forEach(function (k) { info = insert(k); });
    render(info);
    note.textContent = keys.length ? say(info) : "An empty tree. Type a key from 1 to 99 and press Insert.";
  }
  function randomKey() {
    if (Object.keys(used).length > 80) return null;
    var k;
    do { k = 1 + Math.floor(Math.random() * 99); } while (used[k]);
    return k;
  }

  /* ---------- controls ---------- */
  var form = document.getElementById("tree-form");
  var input = document.getElementById("tree-key");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var k = Number(input.value);
    if (!(k >= 1 && k <= 99 && k % 1 === 0)) { note.textContent = "Type a whole number from 1 to 99."; input.focus(); return; }
    add(k);
    input.value = "";
    input.focus();
  });
  document.getElementById("tree-five").addEventListener("click", function () {
    var info = null;
    for (var i = 0; i < 5; i++) {
      var k = randomKey();
      if (k === null) break;
      info = insert(k);
    }
    if (!info) { note.textContent = "The tree is full of keys. Press Reset to start again."; return; }
    render(info);
    note.textContent = say(info);
  });
  document.getElementById("tree-reset").addEventListener("click", function () { reset([]); });

  // First view: a tree three levels deep on wide screens, two on a phone.
  var seed = [42, 17, 68, 25, 90, 7, 33, 51, 12, 77, 60, 3, 95, 29, 84, 46];
  reset(narrow.matches ? seed.slice(0, 9) : seed);
})();
