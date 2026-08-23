// @ts-check

export const SUPPORTED_LOCALES = /** @type {const} */ (
  ["zh-TW", "zh-CN", "ja", "ko", "en", "vi"]
);
const DEFAULT_LOCALE = "zh-TW";
const STORAGE_KEY = "darkforest-locale-v1";
const COOKIE_KEY = "df_locale";

const COMPACT_LOCALE_LABELS = /** @type {const} */ ({
  "zh-TW": "繁",
  "zh-CN": "简",
  ja: "日",
  ko: "한",
  en: "EN",
  vi: "VI",
});

/** @typedef {typeof SUPPORTED_LOCALES[number]} Locale */
/** @typedef {Record<string, string>} Catalog */

/** @type {Locale} */
let activeLocale = DEFAULT_LOCALE;
/** @type {Catalog} */
let baseCatalog = {};
/** @type {Catalog} */
let activeCatalog = {};
/** @type {Map<Locale, Catalog>} */
const catalogCache = new Map();
// In-match narrative/situation copy (narrative_log.js/narrative_mode.js) lives in its own
// locales/match.<locale>.json catalog so the shell catalog above stays small and
// stable; it follows the identical active → fallback → key degradation chain.
/** @type {Catalog} */
let matchBaseCatalog = {};
/** @type {Catalog} */
let matchActiveCatalog = {};
/** @type {Map<Locale, Catalog>} */
const matchCatalogCache = new Map();
/** @type {MutationObserver | null} */
let observer = null;
let storageListenerBound = false;
let localeRequestSequence = 0;

/** @param {unknown} value @returns {Locale} */
export function normalizeLocale(value) {
  if (typeof value !== "string") return DEFAULT_LOCALE;
  const normalized = value.replaceAll("_", "-").trim().toLowerCase();
  if (
    normalized === "zh-tw" || normalized.startsWith("zh-hant") || normalized === "zh-hk" ||
    normalized === "zh-mo"
  ) return "zh-TW";
  if (normalized === "zh-cn" || normalized.startsWith("zh-hans") || normalized === "zh-sg") {
    return "zh-CN";
  }
  if (normalized === "ja" || normalized.startsWith("ja-")) return "ja";
  if (normalized === "ko" || normalized.startsWith("ko-")) return "ko";
  if (normalized === "en" || normalized.startsWith("en-")) return "en";
  if (normalized === "vi" || normalized.startsWith("vi-")) return "vi";
  return DEFAULT_LOCALE;
}

/**
 * `GlobalChatLocale` and `ArboraLocale` are still five-language protocol unions. Keep Vietnamese
 * UI sessions connected until the protocol owner adds `vi`; this is an explicit compatibility
 * bridge, not locale detection or a player-facing translation fallback.
 * @param {unknown} locale
 * @returns {"zh-TW" | "zh-CN" | "ja" | "ko" | "en"}
 */
export function protocolLocaleForUi(locale) {
  const normalized = normalizeLocale(locale);
  return normalized === "vi" ? "en" : normalized;
}

/** @param {string} template @param {Record<string, string | number>=} params */
export function interpolate(template, params = {}) {
  return template.replace(
    /\{([A-Za-z0-9_]+)\}/g,
    (match, key) => Object.hasOwn(params, key) ? String(params[key]) : match,
  );
}

/** @param {Catalog} catalog @param {string} key @param {Record<string, string | number>=} params @param {Catalog=} fallback */
export function translateCatalog(catalog, key, params = {}, fallback = {}) {
  return interpolate(catalog[key] ?? fallback[key] ?? key, params);
}

/** @returns {Locale} */
export function getLocale() {
  return activeLocale;
}

/** @param {unknown} locale */
export function compactLocaleLabel(locale) {
  return COMPACT_LOCALE_LABELS[normalizeLocale(locale)];
}

/** @param {string} key @param {Record<string, string | number>=} params */
export function t(key, params = {}) {
  if (Object.hasOwn(matchActiveCatalog, key) || Object.hasOwn(matchBaseCatalog, key)) {
    return translateCatalog(matchActiveCatalog, key, params, matchBaseCatalog);
  }
  return translateCatalog(activeCatalog, key, params, baseCatalog);
}

/** @param {Date | number} value */
export function formatShortTime(value) {
  return new Intl.DateTimeFormat(activeLocale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}

/** @param {Locale} locale @returns {Promise<Catalog>} */
async function loadCatalog(locale) {
  const cached = catalogCache.get(locale);
  if (cached !== undefined) return cached;
  const response = await fetch(`/locales/${locale}.json`, { cache: "no-cache" });
  if (!response.ok) throw new Error(`LOCALE_${locale}_${response.status}`);
  const value = await response.json();
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`LOCALE_${locale}_INVALID`);
  }
  /** @type {Catalog} */
  const catalog = {};
  for (const [key, text] of Object.entries(value)) {
    if (typeof text === "string" && text !== "") catalog[key] = text;
  }
  catalogCache.set(locale, catalog);
  return catalog;
}

/**
 * `__draft` is a non-string marker and is dropped by the same string-only filter
 * used below, so draft catalogs never need special-casing at lookup time.
 * @param {Locale} locale @returns {Promise<Catalog>}
 */
async function loadMatchCatalog(locale) {
  const cached = matchCatalogCache.get(locale);
  if (cached !== undefined) return cached;
  const response = await fetch(`/locales/match.${locale}.json`, { cache: "no-cache" });
  if (!response.ok) throw new Error(`MATCH_LOCALE_${locale}_${response.status}`);
  const value = await response.json();
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`MATCH_LOCALE_${locale}_INVALID`);
  }
  /** @type {Catalog} */
  const catalog = {};
  for (const [key, text] of Object.entries(value)) {
    if (typeof text === "string" && text !== "") catalog[key] = text;
  }
  matchCatalogCache.set(locale, catalog);
  return catalog;
}

/**
 * Seed the in-match catalog for a locale without a fetch round-trip. Deno tests (no DOM, no
 * server) use it to drive `t` deterministically; it is also safe to call ahead of
 * `initI18n` as a preload, because `setLocale` reads through the same cache.
 * `activate: true` additionally makes the seeded catalog the live match catalog, which is how
 * tests exercise non-default locales (the shell locale state is left untouched).
 * @param {Locale} locale
 * @param {Record<string, unknown>} value
 * @param {{activate?: boolean}=} options
 * @returns {Catalog}
 */
export function primeMatchCatalog(locale, value, options = {}) {
  /** @type {Catalog} */
  const catalog = {};
  for (const [key, text] of Object.entries(value)) {
    if (typeof text === "string" && text !== "") catalog[key] = text;
  }
  matchCatalogCache.set(locale, catalog);
  if (locale === DEFAULT_LOCALE) matchBaseCatalog = catalog;
  if (options.activate === true || locale === activeLocale) matchActiveCatalog = catalog;
  return catalog;
}

/**
 * Shell-catalog twin of `primeMatchCatalog`, with the same contract: seed a locale into the
 * production cache without a fetch so Deno's pure-module tests can drive `t` against the
 * approved copy instead of restating it as literals. `activate: true` also makes the seeded
 * catalog live, which is how tests exercise non-default locales.
 * @param {Locale} locale
 * @param {Record<string, unknown>} value
 * @param {{activate?: boolean}=} options
 * @returns {Catalog}
 */
export function primeShellCatalog(locale, value, options = {}) {
  /** @type {Catalog} */
  const catalog = {};
  for (const [key, text] of Object.entries(value)) {
    if (typeof text === "string" && text !== "") catalog[key] = text;
  }
  catalogCache.set(locale, catalog);
  if (locale === DEFAULT_LOCALE) baseCatalog = catalog;
  if (options.activate === true || locale === activeLocale) activeCatalog = catalog;
  return catalog;
}

function storedLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return normalizeLocale(stored);
  } catch {
    // Storage can be unavailable in privacy modes; fall through to browser language.
  }
  const cookie = document.cookie.split(";").map((part) => part.trim()).find((part) =>
    part.startsWith(`${COOKIE_KEY}=`)
  );
  if (cookie !== undefined) return normalizeLocale(decodeURIComponent(cookie.split("=")[1] ?? ""));
  const preferred = navigator.languages?.[0] ?? navigator.language;
  return normalizeLocale(preferred);
}

/** @param {Element} root */
function localizeElement(root) {
  const selector =
    "[data-i18n], [data-i18n-placeholder], [data-i18n-aria-label], [data-i18n-title], [data-i18n-short-label], [data-i18n-content], [data-i18n-alt]";
  const elements = root.matches(selector)
    ? [root, ...root.querySelectorAll(selector)]
    : [...root.querySelectorAll(selector)];
  for (const element of elements) {
    const textKey = element.getAttribute("data-i18n");
    if (textKey !== null) element.textContent = t(textKey);
    const attributes = [
      ["data-i18n-placeholder", "placeholder"],
      ["data-i18n-aria-label", "aria-label"],
      ["data-i18n-title", "title"],
      ["data-i18n-short-label", "data-short-label"],
      ["data-i18n-content", "content"],
      ["data-i18n-alt", "alt"],
    ];
    for (const [source, target] of attributes) {
      const key = element.getAttribute(source);
      if (key !== null) element.setAttribute(target, t(key));
    }
  }
}

export function localizeDocument() {
  document.documentElement.lang = {
    "zh-TW": "zh-Hant",
    "zh-CN": "zh-Hans",
    ja: "ja",
    ko: "ko",
    en: "en",
    vi: "vi",
  }[activeLocale];
  document.documentElement.dataset.locale = activeLocale;
  localizeElement(document.documentElement);
  const select = document.getElementById("locale-select");
  if (select instanceof HTMLSelectElement) select.value = activeLocale;
  const compactLabel = document.getElementById("locale-switcher-current");
  if (compactLabel !== null) compactLabel.textContent = compactLocaleLabel(activeLocale);
}

/** @param {unknown} requested @param {{persist?: boolean}=} options */
export async function setLocale(requested, options = {}) {
  const locale = normalizeLocale(requested);
  const requestSequence = ++localeRequestSequence;
  const baseCatalogRequest = loadCatalog(DEFAULT_LOCALE);
  const activeCatalogRequest = locale === DEFAULT_LOCALE ? baseCatalogRequest : loadCatalog(locale);
  const matchBaseCatalogRequest = loadMatchCatalog(DEFAULT_LOCALE);
  const matchActiveCatalogRequest = locale === DEFAULT_LOCALE
    ? matchBaseCatalogRequest
    : loadMatchCatalog(locale);
  const [nextBaseCatalog, nextActiveCatalog, nextMatchBaseCatalog, nextMatchActiveCatalog] =
    await Promise.all([
      baseCatalogRequest,
      activeCatalogRequest,
      matchBaseCatalogRequest,
      matchActiveCatalogRequest,
    ]);
  // A slower earlier selection must never overwrite the language the player chose most recently.
  if (requestSequence !== localeRequestSequence) return activeLocale;
  baseCatalog = nextBaseCatalog;
  activeCatalog = nextActiveCatalog;
  matchBaseCatalog = nextMatchBaseCatalog;
  matchActiveCatalog = nextMatchActiveCatalog;
  activeLocale = locale;
  if (options.persist !== false) {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // The in-memory locale still works when storage is blocked.
    }
    document.cookie = `${COOKIE_KEY}=${
      encodeURIComponent(locale)
    }; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
  localizeDocument();
  document.dispatchEvent(new CustomEvent("darkforest:localechange", { detail: { locale } }));
  return locale;
}

export async function initI18n() {
  await setLocale(storedLocale(), { persist: false }).catch(async () => {
    await setLocale(DEFAULT_LOCALE, { persist: false });
  });
  const selector = document.getElementById("locale-select");
  selector?.addEventListener("change", () => {
    if (selector instanceof HTMLSelectElement) void setLocale(selector.value);
  });
  if (observer === null) {
    observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) localizeElement(node);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (!storageListenerBound) {
    storageListenerBound = true;
    globalThis.addEventListener("storage", (event) => {
      if (event.key !== STORAGE_KEY || event.newValue === null) return;
      void setLocale(event.newValue, { persist: false });
    });
  }
}
