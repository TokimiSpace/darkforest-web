// @ts-check
import {
  applyArboraMessage,
  arboraRejectionText,
  arboraReplyNarrativeEntry,
  beginArboraRequest,
  clipOracleDraft,
  createEchoOracleState,
  ECHO_ORACLE_MAX_CODEPOINTS,
  echoOracleAvailability,
  echoOracleMarkup,
  normalizeOracleQuestion,
  oracleCodePointLength,
} from "./echo_oracle.js";
import en from "../locales/match.en.json" with { type: "json" };
import ja from "../locales/match.ja.json" with { type: "json" };
import ko from "../locales/match.ko.json" with { type: "json" };
import vi from "../locales/match.vi.json" with { type: "json" };
import zhCN from "../locales/match.zh-CN.json" with { type: "json" };
import zhTW from "../locales/match.zh-TW.json" with { type: "json" };

/** @param {unknown} condition @param {string} message */
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/** @template T @param {T} actual @param {T} expected @param {string} message */
function assertEquals(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${message}\nexpected: ${JSON.stringify(expected)}\nactual: ${JSON.stringify(actual)}`,
    );
  }
}

/** @param {string} key @param {Record<string, string | number>=} params */
function translate(key, params = {}) {
  return `${key}${
    Object.keys(params).length === 0
      ? ""
      : `:${Object.entries(params).map(([name, value]) => `${name}=${value}`).join(",")}`
  }`;
}

Deno.test("Echo Oracle gating only exposes the private panel to a living Echo", () => {
  const state = createEchoOracleState();
  assertEquals(
    echoOracleAvailability({ status: "echo", phase: "darkforest" }, state, 90_000),
    "ready",
    "Echo can ask during the live match",
  );
  for (const status of ["active", "downed", "eliminated"]) {
    assertEquals(
      echoOracleAvailability({ status, phase: "darkforest" }, state, 90_000),
      "hidden",
      `${status} cannot see the private Oracle panel`,
    );
  }
  assertEquals(
    echoOracleAvailability({ status: "echo", phase: "ended" }, state, 90_000),
    "hidden",
    "ended match hides the panel",
  );
});

Deno.test("Echo Oracle trims questions and counts Unicode code points", () => {
  const normalized = normalizeOracleQuestion("  你好😀  ");
  assertEquals(normalized.text, "你好😀", "leading and trailing whitespace is trimmed");
  assertEquals(normalized.length, 3, "emoji counts as one code point");
  assert(normalized.valid, "trimmed three-code-point question is valid");
  const oversized = "😀".repeat(ECHO_ORACLE_MAX_CODEPOINTS + 1);
  assert(normalizeOracleQuestion(oversized).tooLong, "121 code points are rejected");
  assertEquals(
    oracleCodePointLength(clipOracleDraft(oversized)),
    ECHO_ORACLE_MAX_CODEPOINTS,
    "draft clipping preserves exactly 120 code points",
  );
  assert(normalizeOracleQuestion(" \n\t ").empty, "whitespace-only input is empty");
});

Deno.test("Echo Oracle respects remaining, cooldown, and single pending request", () => {
  const ready = createEchoOracleState();
  const cooldown = applyArboraMessage(ready, {
    type: "arbora_status",
    remainingQuestions: 2,
    cooldownUntilGameMs: 40_000,
  });
  assertEquals(
    echoOracleAvailability({ status: "echo", phase: "darkforest" }, cooldown, 25_000),
    "cooldown",
    "server game-time cooldown blocks send",
  );
  assertEquals(
    echoOracleAvailability({ status: "echo", phase: "darkforest" }, cooldown, 40_000),
    "ready",
    "cooldown ends on server game time",
  );
  const pending = beginArboraRequest(cooldown, "req-1");
  assertEquals(
    echoOracleAvailability({ status: "echo", phase: "darkforest" }, pending, 50_000),
    "pending",
    "one request remains pending even after cooldown",
  );
  const exhausted = applyArboraMessage(pending, {
    type: "arbora_reject",
    requestId: "req-1",
    reason: "LIMIT_REACHED",
    remainingQuestions: 0,
  });
  assertEquals(
    echoOracleAvailability({ status: "echo", phase: "darkforest" }, exhausted, 50_000),
    "exhausted",
    "zero remaining questions is final",
  );
});

Deno.test("Arbora reply log exposes category evidence but never raw Fact IDs", () => {
  const entry = arboraReplyNarrativeEntry(
    {
      type: "arbora_reply",
      requestId: "req-9",
      displayText: "The roots remember distant fighting.",
      hintType: "hotspot",
      citedFactIds: ["combat:node-secret", "self_memory:hidden-path"],
      dataAsOfGameMs: 765_000,
      confidence: "high",
      toneTag: "pomona",
      safetyFlags: [],
      source: "local",
      remainingQuestions: 2,
      cooldownUntilGameMs: 785_000,
    },
    770_000,
    translate,
  );
  const rendered = JSON.stringify(entry);
  assertEquals(entry.id, "arbora-request-req-9", "reply replaces its pending log entry");
  assertEquals(entry.speaker, "arbora.speaker.pomona", "tone chooses the visible speaker");
  assert(rendered.includes("arbora.citation.combat"), "combat category is available to tooltip");
  assert(rendered.includes("arbora.citation.memory"), "memory category is available to tooltip");
  assert(!rendered.includes("node-secret"), "raw combat Fact suffix is hidden");
  assert(!rendered.includes("hidden-path"), "raw memory Fact suffix is hidden");
  assert(rendered.includes("time=12:45"), "data cutoff is formatted as match time");
});

Deno.test("Arbora rejects use the frozen wire reasons without leaking raw codes", () => {
  const expected = {
    NOT_ECHO: "wrong_status",
    EMPTY: "empty",
    TOO_LONG: "too_long",
    RATE_LIMITED: "rate_limit",
    LIMIT_REACHED: "exhausted",
    PENDING: "pending",
    UNAVAILABLE: "unavailable",
  };
  for (const [reason, suffix] of Object.entries(expected)) {
    assertEquals(
      arboraRejectionText(reason, translate),
      `arbora.reject.${suffix}`,
      `${reason} has localized copy`,
    );
  }
});

Deno.test("Echo Oracle markup escapes player-authored text", () => {
  const state = {
    ...createEchoOracleState(),
    draft: '<img src=x onerror="globalThis.pwned=true">',
  };
  const markup = echoOracleMarkup(
    state,
    { status: "echo", phase: "darkforest" },
    10_000,
    translate,
  );
  assert(markup.includes("&lt;img"), "dangerous markup is escaped");
  assert(!markup.includes("<img"), "no player-authored element reaches the DOM");
  assert(!markup.includes('globalThis.pwned=true">'), "attribute payload is not executable");
});

const REQUIRED_KEYS = [
  "arbora.panel.title",
  "arbora.panel.kicker",
  "arbora.panel.remaining",
  "arbora.panel.ai_disclosure",
  "arbora.panel.suggestions",
  "arbora.panel.formLabel",
  "arbora.panel.placeholder",
  "arbora.panel.characters",
  "arbora.panel.submit",
  "arbora.panel.citations",
  "arbora.status.listening",
  "arbora.status.exhausted",
  "arbora.status.invitation",
  "arbora.status.cooldown",
  "arbora.suggestion.hotspot",
  "arbora.suggestion.movement",
  "arbora.suggestion.memory",
  "arbora.speaker.arbora",
  "arbora.speaker.pomona",
  "arbora.speaker.you",
  "arbora.source.stats",
  "arbora.confidence.low",
  "arbora.confidence.medium",
  "arbora.confidence.high",
  "arbora.log.answerMeta",
  "arbora.log.rejected",
  "arbora.log.waiting",
  "arbora.citation.combat",
  "arbora.citation.movement",
  "arbora.citation.memory",
  "arbora.citation.world",
  "arbora.citation.anonymous",
  "arbora.citation.none",
  "arbora.reject.exhausted",
  "arbora.reject.cooldown",
  "arbora.reject.pending",
  "arbora.reject.wrong_status",
  "arbora.reject.empty",
  "arbora.reject.too_long",
  "arbora.reject.rate_limit",
  "arbora.reject.unavailable",
  "arbora.reject.safety",
  "arbora.reject.fallback",
];

Deno.test("Echo Oracle keys have complete zh-TW/zh-CN/ja/ko/en/vi parity", () => {
  for (
    const [locale, catalog] of Object.entries({
      "zh-TW": zhTW,
      "zh-CN": zhCN,
      ja,
      ko,
      en,
      vi,
    })
  ) {
    const messages = /** @type {Record<string, unknown>} */ (catalog);
    for (const key of REQUIRED_KEYS) {
      assert(
        typeof messages[key] === "string" && messages[key].trim() !== "",
        `${locale} is missing ${key}`,
      );
    }
    const disclosure = String(messages["arbora.panel.ai_disclosure"]);
    assert(disclosure.trim() !== "", `${locale} must disclose local fixture behavior`);
    assert(disclosure.toLowerCase().includes("fixture"), `${locale} must describe fixture replies`);
  }
});

Deno.test("Echo Oracle CSS stays inline and has a 390px-safe layout", async () => {
  const css = await Deno.readTextFile(new URL("../static/styles.css", import.meta.url));
  assert(css.includes(".echo-oracle-panel"), "panel selector exists");
  assert(css.includes("@media (max-width: 430px)"), "390px breakpoint exists");
  assert(css.includes(".echo-oracle-suggestions"), "suggestion rail has responsive styles");
  assert(!/\.echo-oracle-panel\s*\{[^}]*position:\s*fixed/s.test(css), "panel is not an overlay");
});
