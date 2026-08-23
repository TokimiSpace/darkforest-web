// @ts-check
import { primeShellCatalog, t } from "./i18n.js";
import en from "../locales/en.json" with { type: "json" };
import ja from "../locales/ja.json" with { type: "json" };
import ko from "../locales/ko.json" with { type: "json" };
import vi from "../locales/vi.json" with { type: "json" };
import zhCN from "../locales/zh-CN.json" with { type: "json" };
import zhTW from "../locales/zh-TW.json" with { type: "json" };

export const SHELL_CATALOGS = /** @type {const} */ ({
  "zh-TW": zhTW,
  "zh-CN": zhCN,
  ja,
  ko,
  en,
  vi,
});

/** @typedef {keyof typeof SHELL_CATALOGS} ShellLocale */

/** @param {ShellLocale} locale */
export function activateShellLocale(locale) {
  primeShellCatalog(locale, SHELL_CATALOGS[locale], { activate: true });
}

for (const [locale, catalog] of Object.entries(SHELL_CATALOGS)) {
  primeShellCatalog(/** @type {ShellLocale} */ (locale), catalog);
}
activateShellLocale("zh-TW");

export { t };
