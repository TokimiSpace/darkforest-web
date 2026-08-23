import { expect, type Page } from "@playwright/test";

export const WEB_ORIGIN = "http://127.0.0.1:8000";
export const MOCK_ORIGIN = "http://127.0.0.1:8788";

const ALLOWED_HTTP_ORIGINS = new Set([
  WEB_ORIGIN,
  MOCK_ORIGIN,
]);
const ALLOWED_SOCKET_ORIGINS = new Set(["ws://127.0.0.1:8788"]);
const APPROVED_ART_PREFIXES = [
  "/art/brand/",
  "/art/icons/",
  "/art/placeholders/",
  "/art/reset/",
] as const;

export type RuntimeErrors = {
  pageErrors: string[];
  consoleErrors: string[];
  externalRequests: string[];
  externalSockets: string[];
  disallowedAssets: string[];
};

function isOpaqueBrowserUrl(raw: string): boolean {
  return raw.startsWith("data:") || raw.startsWith("blob:") || raw.startsWith("about:");
}

function disallowedAsset(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (!url.pathname.startsWith("/art/")) return null;
    return APPROVED_ART_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
      ? null
      : url.pathname;
  } catch {
    return null;
  }
}

function isAllowedHttpUrl(raw: string): boolean {
  if (isOpaqueBrowserUrl(raw)) return true;
  try {
    const url = new URL(raw);
    return (url.protocol === "http:" || url.protocol === "https:") &&
      ALLOWED_HTTP_ORIGINS.has(url.origin);
  } catch {
    return false;
  }
}

function isAllowedSocketUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return ALLOWED_SOCKET_ORIGINS.has(url.origin) && url.pathname === "/ws";
  } catch {
    return false;
  }
}

export function monitorRuntimeErrors(page: Page): RuntimeErrors {
  const errors: RuntimeErrors = {
    pageErrors: [],
    consoleErrors: [],
    externalRequests: [],
    externalSockets: [],
    disallowedAssets: [],
  };
  page.on("pageerror", (error) => errors.pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    const source = message.location().url;
    errors.consoleErrors.push(source === "" ? text : `${source}: ${text}`);
  });
  page.on("websocket", (socket) => {
    if (!isAllowedSocketUrl(socket.url())) errors.externalSockets.push(socket.url());
  });
  return errors;
}

export async function blockExternalNetwork(page: Page, errors: RuntimeErrors): Promise<void> {
  await page.route("**/*", async (route) => {
    const raw = route.request().url();
    const blockedAsset = disallowedAsset(raw);
    if (blockedAsset !== null) {
      errors.disallowedAssets.push(raw);
      await route.abort("blockedbyclient");
      return;
    }
    if (isAllowedHttpUrl(raw)) {
      await route.continue();
      return;
    }
    errors.externalRequests.push(raw);
    await route.abort("blockedbyclient");
  });
}

export async function waitForLobbyRuntime(page: Page): Promise<void> {
  await expect(page.locator("body")).toHaveAttribute("data-public-demo", "local-fixtures");
  await expect(page.locator("#motion-toggle")).toHaveAttribute("title", /.+/);
}

export async function joinFixture(page: Page, fixture: string): Promise<void> {
  await waitForLobbyRuntime(page);
  await page.locator("#profile-display-name").fill("QA Local");

  const advanced = page.locator("details[data-development-controls]");
  await expect(advanced).toHaveCount(1);
  if (await advanced.getAttribute("open") === null) {
    await advanced.locator(":scope > summary").click();
  }
  await page.locator("#fixture-name").fill(fixture);
  await expect(page.locator("#join-button")).toBeEnabled();
  await page.locator("#join-button").click();

  await expect(page.locator("#match-view")).toBeVisible();
  await expect(page.locator("#lobby-view")).toBeHidden();
  await expect(page.locator("#narrative-mode-view")).toBeVisible();
  await expect(page.locator("#narrative-statusbar")).not.toBeEmpty();
}

export async function enterFixture(page: Page, fixture: string): Promise<void> {
  await page.goto(`/?fixture=${encodeURIComponent(fixture)}`, {
    waitUntil: "domcontentloaded",
  });
  await joinFixture(page, fixture);
}

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const layout = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(layout.documentWidth, JSON.stringify(layout)).toBeLessThanOrEqual(layout.viewport + 1);
  expect(layout.bodyWidth, JSON.stringify(layout)).toBeLessThanOrEqual(layout.viewport + 1);
}

export async function expectNoStoredCredentials(page: Page): Promise<void> {
  const sensitiveKeys = await page.evaluate(() =>
    Object.keys(localStorage).filter((key) => /(?:auth|credential|session|token)/i.test(key))
  );
  expect(sensitiveKeys, "sensitive values must not be persisted by the public demo").toEqual([]);
}

export function expectNoRuntimeErrors(errors: RuntimeErrors): void {
  expect(errors.pageErrors, "uncaught page errors").toEqual([]);
  expect(errors.consoleErrors, "browser console errors").toEqual([]);
  expect(errors.externalRequests, "non-demo network requests").toEqual([]);
  expect(errors.externalSockets, "non-demo WebSockets").toEqual([]);
  expect(errors.disallowedAssets, "disallowed asset requests").toEqual([]);
}
