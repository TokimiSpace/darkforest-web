// @ts-check
import {
  buildFixtureSocketUrl,
  fixtureHealthReportsReady,
  localInstantStartEnabled,
  resolveFixtureSocketUrl,
} from "./match_connection.js";

/** @param {unknown} value @param {string} message */
function assert(value, message) {
  if (!value) throw new Error(message);
}

Deno.test("fixture transport always resolves to the included loopback server", () => {
  assert(
    resolveFixtureSocketUrl("https://demo.example.invalid/") === "ws://127.0.0.1:8788/ws",
    "there is no inferred production endpoint",
  );
  assert(
    resolveFixtureSocketUrl("http://127.0.0.1:8000/") === "ws://127.0.0.1:8788/ws",
    "local pages use the same deterministic fixture endpoint",
  );
});

Deno.test("fixture URL accepts only loopback ws and one sanitized scenario selector", () => {
  assert(
    buildFixtureSocketUrl(
      "ws://127.0.0.1:8788/ws?unrelated=discarded#fragment",
      "openingMegaCity",
    ) === "ws://127.0.0.1:8788/ws?fixture=openingMegaCity",
    "the local scenario is the only retained query parameter",
  );
  for (
    const endpoint of [
      "wss://example.invalid/ws",
      "ws://example.invalid/ws",
      "https://127.0.0.1:8788/ws",
    ]
  ) {
    let rejected = false;
    try {
      buildFixtureSocketUrl(endpoint, "openingMegaCity");
    } catch {
      rejected = true;
    }
    assert(rejected, `${endpoint} must fail closed`);
  }
});

Deno.test("only loopback pages with explicit development controls enable instant presentation", () => {
  assert(localInstantStartEnabled("http://127.0.0.1:8000/", true), "loopback development mode");
  assert(!localInstantStartEnabled("http://127.0.0.1:8000/", false), "controls are explicit");
  assert(
    !localInstantStartEnabled("https://demo.example.invalid/", true),
    "remote pages fail closed",
  );
});

Deno.test("fixture health requires the local-fixture mode marker", () => {
  assert(
    fixtureHealthReportsReady(true, { ready: true, mode: "local-fixture" }),
    "included fixture service is ready",
  );
  assert(!fixtureHealthReportsReady(true, { ready: true }), "ambiguous service is not accepted");
  assert(
    !fixtureHealthReportsReady(true, { ready: true, mode: "other" }),
    "unrelated service is not accepted",
  );
  assert(
    !fixtureHealthReportsReady(false, { ready: true, mode: "local-fixture" }),
    "failed HTTP response",
  );
});
