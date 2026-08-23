// @ts-check
import { primeMatchCatalog, t } from "./i18n.js";
import en from "../locales/match.en.json" with { type: "json" };
import ja from "../locales/match.ja.json" with { type: "json" };
import ko from "../locales/match.ko.json" with { type: "json" };
import vi from "../locales/match.vi.json" with { type: "json" };
import zhCN from "../locales/match.zh-CN.json" with { type: "json" };
import zhTW from "../locales/match.zh-TW.json" with { type: "json" };

export const MATCH_CATALOGS = /** @type {const} */ ({
  "zh-TW": zhTW,
  "zh-CN": zhCN,
  ja,
  ko,
  en,
  vi,
});

/** @typedef {keyof typeof MATCH_CATALOGS} MatchLocale */

/** @param {MatchLocale} locale */
export function activateMatchLocale(locale) {
  primeMatchCatalog(locale, MATCH_CATALOGS[locale], { activate: true });
}

for (const [locale, catalog] of Object.entries(MATCH_CATALOGS)) {
  primeMatchCatalog(/** @type {MatchLocale} */ (locale), catalog);
}
activateMatchLocale("zh-TW");

export { t };
