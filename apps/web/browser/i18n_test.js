// @ts-check
import {
  compactLocaleLabel,
  interpolate,
  normalizeLocale,
  protocolLocaleForUi,
  SUPPORTED_LOCALES,
  translateCatalog,
} from "./i18n.js";
import en from "../locales/en.json" with { type: "json" };
import ja from "../locales/ja.json" with { type: "json" };
import ko from "../locales/ko.json" with { type: "json" };
import vi from "../locales/vi.json" with { type: "json" };
import zhCN from "../locales/zh-CN.json" with { type: "json" };
import zhTW from "../locales/zh-TW.json" with { type: "json" };
import { activateMatchLocale, MATCH_CATALOGS, t } from "./match_i18n_test_helper.js";

/** @param {unknown} condition @param {string} message */
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/** @param {unknown} actual @param {unknown} expected @param {string} label */
function assertEquals(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}\nexpected: ${String(expected)}\nactual:   ${String(actual)}`);
  }
}

/** @param {string} text */
function placeholders(text) {
  return [...text.matchAll(/\{([A-Za-z0-9_]+)\}/g)]
    .map((match) => match[1])
    .sort();
}

const catalogs = /** @type {Record<string, Record<string, unknown>>} */ ({
  "zh-TW": zhTW,
  "zh-CN": zhCN,
  ja,
  ko,
  en,
  vi,
});

Deno.test("locale JSON sources do not contain duplicate keys", async () => {
  for (const locale of SUPPORTED_LOCALES) {
    for (const prefix of ["", "match."]) {
      const url = new URL(`../locales/${prefix}${locale}.json`, import.meta.url);
      const source = await Deno.readTextFile(url);
      const keys = [...source.matchAll(/^\s*"((?:\\.|[^"\\])*)"\s*:/gm)].map((match) => match[1]);
      const seen = new Set();
      const duplicates = new Set();
      for (const key of keys) {
        if (seen.has(key)) duplicates.add(key);
        seen.add(key);
      }
      assert(
        duplicates.size === 0,
        `${url.pathname} contains duplicate keys: ${[...duplicates].join(", ")}`,
      );
    }
  }
});

Deno.test("手機語言入口以通用圖示搭配目前語系短碼", () => {
  const expected = {
    "zh-TW": "繁",
    "zh-CN": "简",
    ja: "日",
    ko: "한",
    en: "EN",
    vi: "VI",
  };
  for (const locale of SUPPORTED_LOCALES) {
    assertEquals(compactLocaleLabel(locale), expected[locale], locale);
  }
});

Deno.test("i18n 六語 catalog 共用完整 key 與 placeholder 契約", () => {
  assertEquals(
    JSON.stringify(SUPPORTED_LOCALES),
    JSON.stringify(["zh-TW", "zh-CN", "ja", "ko", "en", "vi"]),
    "supported locale order",
  );

  const contentKeys = (/** @type {Record<string, unknown>} */ catalog) =>
    Object.keys(catalog).filter((key) => !key.startsWith("__")).sort();

  const base = catalogs["zh-TW"];
  const baseKeys = contentKeys(base);
  assert(baseKeys.length > 0, "zh-TW catalog must not be empty");
  assert(!Object.hasOwn(base, "__draft"), "zh-TW is the reviewed source and must not be draft");

  for (const locale of SUPPORTED_LOCALES) {
    const catalog = catalogs[locale];
    const keys = contentKeys(catalog);
    assertEquals(
      JSON.stringify(keys),
      JSON.stringify(baseKeys),
      `${locale} keys must exactly match zh-TW`,
    );
    if (locale !== "zh-TW") {
      assert(catalog.__draft === true, `${locale} shell catalog must stay marked as draft`);
    }

    for (const key of baseKeys) {
      const baseValue = base[key];
      const value = catalog[key];
      if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`${locale}.${key} must be a non-empty string`);
      }
      if (typeof baseValue !== "string" || baseValue.trim().length === 0) {
        throw new Error(`zh-TW.${key} must be a non-empty string`);
      }
      assertEquals(
        JSON.stringify(placeholders(value)),
        JSON.stringify(placeholders(baseValue)),
        `${locale}.${key} placeholders must exactly match zh-TW`,
      );
    }
  }
});

Deno.test("catalog 文案一律不含標記，翻譯輸出可安全進入 innerHTML", () => {
  // client.js builds markup with template literals and assigns it via innerHTML, so every
  // t() result is a potential injection sink. The code keeps the tags and interpolates the
  // translated text into them, which is only safe while catalog values stay plain text —
  // a translator (or a bad merge) slipping a tag into a value would inject it directly.
  // Player-supplied values interpolated into the same markup are escaped separately by
  // escapeHtml(); this test guards the other half of that contract.
  const families = [
    ["shell", catalogs],
    ["match", MATCH_CATALOGS],
  ];
  for (const [family, group] of families) {
    for (const locale of SUPPORTED_LOCALES) {
      const catalog = /** @type {Record<string, unknown>} */ (
        /** @type {Record<string, unknown>} */ (group)[locale]
      );
      for (const [key, value] of Object.entries(catalog)) {
        if (typeof value !== "string") continue;
        assert(
          !/[<>]/.test(value),
          `${family}.${locale}.${key} must not contain angle brackets: ${value}`,
        );
        assert(
          !/&[a-zA-Z]+;|&#\d+;/.test(value),
          `${family}.${locale}.${key} must not contain HTML entities: ${value}`,
        );
      }
    }
  }
});

Deno.test("戰局服務健康狀態皆有六語玩家文案", () => {
  const required = [
    "lobby.connection.checking",
    "lobby.connection.ready",
    "lobby.connection.unavailable",
  ];
  for (const locale of SUPPORTED_LOCALES) {
    for (const key of required) {
      assert(
        typeof catalogs[locale][key] === "string" && String(catalogs[locale][key]).trim() !== "",
        `${locale}.${key} must be visible copy rather than a raw key`,
      );
    }
  }
});

Deno.test("局內六語 catalog 共用 key、placeholder、draft 與長度契約", () => {
  const locales = /** @type {const} */ (["zh-TW", "zh-CN", "ja", "ko", "en", "vi"]);
  const contentKeys = (/** @type {Record<string, unknown>} */ catalog) =>
    Object.keys(catalog).filter((key) => !key.startsWith("__")).sort();
  const base = /** @type {Record<string, unknown>} */ (MATCH_CATALOGS["zh-TW"]);
  const baseKeys = contentKeys(base);

  assert(baseKeys.length >= 250, "zh-TW match catalog must contain the complete demo surface");
  assert(!Object.hasOwn(base, "__draft"), "zh-TW is the reviewed source and must not be draft");

  for (const locale of locales) {
    const catalog = /** @type {Record<string, unknown>} */ (MATCH_CATALOGS[locale]);
    assertEquals(
      JSON.stringify(contentKeys(catalog)),
      JSON.stringify(baseKeys),
      `${locale} match keys must exactly match zh-TW`,
    );
    if (locale !== "zh-TW") {
      assert(catalog.__draft === true, `${locale} match catalog must stay marked as draft`);
    }

    const narrativeLimit = locale === "en" || locale === "vi" ? 180 : locale === "ko" ? 120 : 90;
    for (const key of baseKeys) {
      const baseValue = base[key];
      const value = catalog[key];
      assert(
        typeof baseValue === "string" && baseValue.trim() !== "",
        `zh-TW.${key} must be a non-empty string`,
      );
      assert(
        typeof value === "string" && value.trim() !== "",
        `${locale}.${key} must be a non-empty string`,
      );
      assertEquals(
        JSON.stringify(placeholders(/** @type {string} */ (value))),
        JSON.stringify(placeholders(/** @type {string} */ (baseValue))),
        `${locale}.${key} placeholders must exactly match zh-TW`,
      );
      if (key.startsWith("narrative.")) {
        assert(
          [.../** @type {string} */ (value)].length <= narrativeLimit,
          `${locale}.${key} exceeds the ${narrativeLimit}-character narrative limit`,
        );
      }
    }
  }
});

Deno.test("教學將班表與時長標示為本機 fixture 的產品概念", () => {
  const forbiddenProductionClaims = {
    "zh-TW": /正式(?:對局|班次)/,
    "zh-CN": /正式(?:对局|班次)/,
    ja: /正式(?:戦局|便)/,
    ko: /정식 (?:경기|출발)/,
    en: /\bproduction (?:match|departures?)\b/i,
    vi: /\btrận chính thức\b/i,
  };
  const keys = [
    "tutorial.manual.timeline.body",
    "tutorial.manual.start.remember",
  ];

  for (const locale of SUPPORTED_LOCALES) {
    const copy = keys.map((key) => String(catalogs[locale][key])).join(" ");
    assert(copy.includes("fixture"), `${locale} tutorial boundary must identify the fixture`);
    assert(
      !forbiddenProductionClaims[locale].test(copy),
      `${locale} tutorial boundary must not claim production timing or departures`,
    );
  }
});

Deno.test("局內 t 依 active → zh-TW → key 降級且不洩漏 draft metadata", () => {
  activateMatchLocale("en");
  const englishTemplate = MATCH_CATALOGS.en["narrative.combat.self_hit"];
  assertEquals(
    t("narrative.combat.self_hit", { weapon: "tool", target: "P02", damage: 9 }),
    interpolate(englishTemplate, { weapon: "tool", target: "P02", damage: 9 }),
    "active match translation",
  );
  assertEquals(t("__draft"), "__draft", "non-string draft marker is never player-visible");
  assertEquals(t("narrative.missing_key"), "narrative.missing_key", "unknown key degradation");
  activateMatchLocale("zh-TW");
});

Deno.test("normalizeLocale 將常見地區碼收斂到六個支援語系", () => {
  const cases = /** @type {const} */ ([
    ["zh-TW", "zh-TW"],
    [" zh_Hant_HK ", "zh-TW"],
    ["zh-HK", "zh-TW"],
    ["zh-MO", "zh-TW"],
    ["zh-CN", "zh-CN"],
    ["zh_Hans_SG", "zh-CN"],
    ["zh-SG", "zh-CN"],
    ["ja-JP", "ja"],
    ["ko-KR", "ko"],
    ["en-US", "en"],
    ["EN_gb", "en"],
    ["vi-VN", "vi"],
    ["VI", "vi"],
    ["fr-FR", "zh-TW"],
    ["", "zh-TW"],
  ]);

  for (const [input, expected] of cases) {
    assertEquals(normalizeLocale(input), expected, input || "empty locale");
  }
  assertEquals(normalizeLocale(undefined), "zh-TW", "non-string locale");
});

Deno.test("越南文 UI 在 protocol 升級前使用可接受的英文會話 fallback", () => {
  assertEquals(protocolLocaleForUi("vi"), "en", "Vietnamese protocol fallback");
  assertEquals(protocolLocaleForUi("vi-VN"), "en", "Vietnamese regional fallback");
  for (const locale of /** @type {const} */ (["zh-TW", "zh-CN", "ja", "ko", "en"])) {
    assertEquals(protocolLocaleForUi(locale), locale, `${locale} remains unchanged`);
  }
});

Deno.test("interpolate 取代已提供參數並保留未知 placeholder", () => {
  assertEquals(
    interpolate("{name} 在 {node} 找到 {count} 件物資；{name} 尚有 {missing}。", {
      name: "P01",
      node: "Rootheart",
      count: 0,
    }),
    "P01 在 Rootheart 找到 0 件物資；P01 尚有 {missing}。",
    "known and missing params",
  );
  assertEquals(interpolate("沒有參數"), "沒有參數", "plain string");
});

Deno.test("translateCatalog 依 active → fallback → key 順序降級並插值", () => {
  const fallback = {
    "chat.greeting": "你好，{name}",
    "chat.onlyBase": "還有 {count} 則",
  };
  const active = { "chat.greeting": "Hello, {name}" };

  assertEquals(
    translateCatalog(active, "chat.greeting", { name: "P01" }, fallback),
    "Hello, P01",
    "active catalog wins",
  );
  assertEquals(
    translateCatalog(active, "chat.onlyBase", { count: 3 }, fallback),
    "還有 3 則",
    "base catalog fallback",
  );
  assertEquals(
    translateCatalog(active, "chat.unknown", { name: "P01" }, fallback),
    "chat.unknown",
    "missing key fallback",
  );
});
