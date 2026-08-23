import { isClientMsg, isServerMsg, parseServerMessage } from "./mod.ts";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

Deno.test("protocol: arbora_ask accepts all five locales and only validates the basic wire shape", () => {
  for (const locale of ["zh-TW", "zh-CN", "ja", "ko", "en"] as const) {
    assert(
      isClientMsg({ type: "arbora_ask", requestId: `ask-${locale}`, text: "roots?", locale }),
      `${locale} should be accepted`,
    );
  }

  assert(
    isClientMsg({ type: "arbora_ask", requestId: "x", text: "", locale: "en" }),
    "empty text remains a valid wire shape; the server service owns content validation",
  );
  assert(
    isClientMsg({
      type: "arbora_ask",
      requestId: "x".repeat(80),
      text: "🌲".repeat(500),
      locale: "zh-TW",
    }),
    "requestId upper bound is inclusive and text length is not checked by the protocol guard",
  );
});

Deno.test("protocol: arbora_ask rejects malformed ids, text and locale", () => {
  const invalid = [
    { type: "arbora_ask", requestId: "", text: "hello", locale: "en" },
    { type: "arbora_ask", requestId: "x".repeat(81), text: "hello", locale: "en" },
    { type: "arbora_ask", requestId: "ask-1", locale: "en" },
    { type: "arbora_ask", requestId: "ask-1", text: 3, locale: "en" },
    { type: "arbora_ask", requestId: "ask-1", text: "hello", locale: "fr" },
    { type: "arbora_ask", requestId: "ask-1", text: "hello", locale: 1 },
  ];
  invalid.forEach((message, index) => {
    assert(!isClientMsg(message), `malformed arbora message ${index} should be rejected`);
  });
});

Deno.test("protocol: malformed core client messages are rejected before mock use", () => {
  const invalid = [
    { type: "hello" },
    { type: "hello", protocolVersion: 99, matchId: "demo", playerToken: "P01" },
    { type: "command" },
    { type: "command", commandId: "cmd-1", expectedStateVersion: 1, payload: {} },
    { type: "preview", requestId: "req-1" },
    { type: "preview", requestId: "req-1", target: "<img>", weapon: "rifle" },
    { type: "ping", t: Number.NaN },
  ];
  invalid.forEach((message, index) => {
    assert(!isClientMsg(message), `malformed core message ${index} should be rejected`);
  });
});

Deno.test("protocol: all Arbora server side-channel message types are recognized", () => {
  assert(
    isServerMsg({
      type: "arbora_status",
      remainingQuestions: 3,
      cooldownUntilGameMs: 0,
      pendingRequestId: "ask-1",
    }),
    "status message",
  );
  assert(
    isServerMsg({
      type: "arbora_reply",
      requestId: "ask-1",
      displayText: "The roots remember.",
      hintType: "hotspot",
      citedFactIds: ["global.combat.hotspot.1"],
      dataAsOfGameMs: 60_000,
      confidence: "high",
      toneTag: "arbora",
      safetyFlags: [],
      source: "local",
      remainingQuestions: 2,
      cooldownUntilGameMs: 80_000,
    }),
    "reply message",
  );
  assert(
    isServerMsg({
      type: "arbora_reject",
      requestId: "ask-2",
      reason: "RATE_LIMITED",
      remainingQuestions: 2,
      retryAtGameMs: 80_000,
    }),
    "reject message",
  );
  assert(!isServerMsg({ type: "arbora_unknown" }), "unknown Arbora message type");
});

Deno.test("protocol: known discriminators do not bypass required field validation", () => {
  assert(!isServerMsg({ type: "snapshot", view: {} }), "empty snapshot must fail");
  assert(!isServerMsg({ type: "ack", commandId: "cmd-1" }), "ack needs accepted");
  assert(!isServerMsg({ type: "pong", t: Number.POSITIVE_INFINITY }), "non-finite number");
});

Deno.test("protocol: untrusted text is neutralized before browser rendering", () => {
  const parsed = parseServerMessage(JSON.stringify({
    type: "arbora_reply",
    requestId: "ask-1",
    displayText: '<img src=x onerror="alert(1)">',
    hintType: "rule",
    citedFactIds: [],
    dataAsOfGameMs: 1,
    confidence: "low",
    toneTag: "arbora",
    safetyFlags: [],
    source: "local",
    remainingQuestions: 1,
    cooldownUntilGameMs: 2,
  }));
  assert(parsed !== null, "well-shaped message should parse");
  assert(
    parsed.displayText === "‹img src=x onerror=＂alert(1)＂›",
    "HTML syntax must be neutralized at ingress",
  );
});

Deno.test("protocol: oversized and over-deep frames are rejected", () => {
  assert(parseServerMessage("x".repeat(1_000_001)) === null, "oversized frame");
  let nested: unknown = "leaf";
  for (let index = 0; index < 20; index += 1) nested = { next: nested };
  assert(
    parseServerMessage(JSON.stringify({ type: "pong", t: 1, nested })) === null,
    "over-deep frame",
  );
});
