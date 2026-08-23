// Generated from browser/match_connection.js by scripts/emit_client.ts. Do not edit.
// @ts-check

/** @param {string} hostname */
function isLoopbackHostname(hostname) {
  const normalized = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return normalized === "localhost" || normalized.endsWith(".localhost") ||
    normalized === "::1" || normalized.startsWith("127.");
}

/**
 * Development-only presentation controls are available solely on a loopback page.
 * @param {string} pageHref
 * @param {boolean} developmentControlsPresent
 */
export function localInstantStartEnabled(pageHref, developmentControlsPresent) {
  if (!developmentControlsPresent) return false;
  const page = new URL(pageHref);
  return (page.protocol === "http:" || page.protocol === "https:") &&
    isLoopbackHostname(page.hostname);
}

/**
 * The standalone repository connects only to its included loopback fixture server. The function
 * intentionally has no configurable or inferred production endpoint.
 * @param {string} pageHref
 */
export function resolveFixtureSocketUrl(pageHref) {
  const page = new URL(pageHref);
  if (page.protocol !== "http:" && page.protocol !== "https:") {
    throw new TypeError("頁面位址必須使用 http:// 或 https://");
  }
  return "ws://127.0.0.1:8788/ws";
}

/** @param {boolean} responseOk @param {unknown} payload */
export function fixtureHealthReportsReady(responseOk, payload) {
  return responseOk && typeof payload === "object" && payload !== null &&
    !Array.isArray(payload) && "ready" in payload && payload.ready === true &&
    "mode" in payload && payload.mode === "local-fixture";
}

/**
 * Build a URL for one of the sanitized local scenarios. Query parameters supplied by callers are
 * discarded so no unrelated transport convention can enter the public demo.
 * @param {string} input
 * @param {string} fixture
 */
export function buildFixtureSocketUrl(input, fixture) {
  const url = new URL(input);
  if (url.protocol !== "ws:" || !isLoopbackHostname(url.hostname)) {
    throw new TypeError("Fixture WebSocket 必須使用本機 ws:// 位址");
  }
  const scenario = fixture.trim();
  if (scenario === "") throw new TypeError("必須指定 fixture");
  url.username = "";
  url.password = "";
  url.search = "";
  url.hash = "";
  url.searchParams.set("fixture", scenario);
  return url.toString();
}
