// Generated from browser/bootstrap.js by scripts/emit_client.ts. Do not edit.
// @ts-check
import { initI18n } from "./i18n.js";

const ACCESSIBILITY_STORAGE_KEY = "darkforest-accessibility-v1";
const VALID_TEXT_SCALES = new Set(["100", "125", "150"]);

/**
 * @param {{getItem: (key: string) => string | null} | null | undefined} storage
 * @returns {"100" | "125" | "150"}
 */
export function storedTextScale(storage) {
  try {
    const parsed = JSON.parse(storage?.getItem(ACCESSIBILITY_STORAGE_KEY) ?? "{}");
    const value = parsed !== null && typeof parsed === "object"
      ? Reflect.get(parsed, "textScale")
      : null;
    return typeof value === "string" && VALID_TEXT_SCALES.has(value)
      ? /** @type {"100" | "125" | "150"} */ (value)
      : "100";
  } catch {
    return "100";
  }
}

/** @param {{dataset: DOMStringMap}} root @param {{getItem: (key: string) => string | null} | null | undefined} storage */
export function applyStoredPresentation(root, storage) {
  root.dataset.textScale = storedTextScale(storage);
}

/** @type {Promise<void> | null} */
let bootstrapPromise = null;

export function bootstrapBrowser() {
  if (bootstrapPromise !== null) return bootstrapPromise;
  bootstrapPromise = (async () => {
    applyStoredPresentation(document.documentElement, globalThis.localStorage);
    try {
      await initI18n();
    } catch (error) {
      console.error("Darkforest locale initialization failed; using server-rendered copy.", error);
    }
    const runtime = document.querySelector("[data-tutorial-app]") !== null
      ? "/tutorial.js"
      : document.querySelector("[data-leaderboard-app]") !== null
      ? "/leaderboard.js"
      : document.querySelector("[data-lobby-app]") !== null
      ? "/app.js"
      : null;
    if (runtime !== null) await import(runtime);
  })();
  return bootstrapPromise;
}

if (typeof document !== "undefined") await bootstrapBrowser();
