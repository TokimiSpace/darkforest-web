// @ts-check
import { escapeHtml } from "./html_escape.js";
import { escapeLeaderboardHtml } from "./leaderboard.js";
import { escapeHtml as viewHelpersEscapeHtml } from "./view_helpers.js";

/** @param {boolean} condition @param {string} message */
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

Deno.test("escapeHtml 中和五個 HTML 語法字元", () => {
  assert(
    escapeHtml(`<img src=x onerror="alert('xss')">`) ===
      "&lt;img src=x onerror=&quot;alert(&#039;xss&#039;)&quot;&gt;",
    "all five syntax characters must be neutralised",
  );
  // & 必須最先替換,否則後續替換產生的實體會被二次逸出或留下破口。
  assert(escapeHtml("&lt;script&gt;") === "&amp;lt;script&amp;gt;", "ampersand escapes first");
});

Deno.test("所有前端逸出入口共用同一套規則", () => {
  // Escaping is an XSS boundary, so every public presentation entry point shares one rule.
  const hostile = `<a href="x" onclick='y'>&</a>`;
  const expected = escapeHtml(hostile);
  assert(viewHelpersEscapeHtml(hostile) === expected, "view_helpers must not diverge");
  assert(escapeLeaderboardHtml(hostile) === expected, "leaderboard must not diverge");
  assert(escapeHtml(null) === "null", "the shared escaper still stringifies faithfully");
  assert(escapeLeaderboardHtml(0) === "0", "falsy non-nullish values survive");
});
