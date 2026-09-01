/* ==========================================================================
   theme.js — shared light/dark theme controller for all HackDynamics pages.
   Loaded in <head> so the attribute lands before first paint (no flash).
   Default: light (Notion-style paper). Persisted in localStorage under "hd-theme".
   Any element with class "theme-toggle" flips the theme when clicked.
   ========================================================================== */
(function () {
  "use strict";
  var KEY = "hd-theme";
  var theme;

  try { theme = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
  if (theme !== "dark" && theme !== "light") theme = "light";

  function apply() {
    document.documentElement.setAttribute("data-theme", theme);
    // Toggle buttons show the mode you'd switch TO.
    var btns = document.querySelectorAll(".theme-toggle");
    for (var i = 0; i < btns.length; i++) {
      btns[i].textContent = theme === "light" ? "☾" : "☀";
      btns[i].setAttribute("aria-label",
        theme === "light" ? "Switch to dark mode" : "Switch to light mode");
    }
  }

  window.hdToggleTheme = function () {
    theme = theme === "light" ? "dark" : "light";
    try { localStorage.setItem(KEY, theme); } catch (e) {}
    apply();
  };

  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest(".theme-toggle")) window.hdToggleTheme();
  });

  apply(); // attribute now — buttons don't exist yet, that's fine
  document.addEventListener("DOMContentLoaded", apply); // sync button glyphs
})();
