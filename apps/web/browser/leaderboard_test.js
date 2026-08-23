import {
  DEFAULT_LEADERBOARD_API_ORIGIN,
  escapeLeaderboardHtml,
  leaderboardApiUrl,
  leaderboardEmptyCopy,
  leaderboardNoteCopy,
  leaderboardRowsMarkup,
  MAX_LEADERBOARD_ENTRIES,
  nextLeaderboardTabIndex,
  normalizeLeaderboardLimit,
  resolveLeaderboardApiOrigin,
} from "./leaderboard.js";
import { t } from "./shell_i18n_test_helper.js";
import zhTW from "../locales/zh-TW.json" with { type: "json" };

/** @param {unknown} value @param {string=} message */
function assert(value, message = "assertion failed") {
  if (!value) throw new Error(message);
}

Deno.test("排行榜 API 固定走本機 8790 且最多索取 50 筆", () => {
  const url = leaderboardApiUrl("practice");
  assert(url.origin === DEFAULT_LEADERBOARD_API_ORIGIN, "local match API origin");
  assert(url.pathname === "/api/v1/leaderboard", "leaderboard endpoint");
  assert(url.searchParams.get("scope") === "practice", "scope query");
  assert(url.searchParams.get("limit") === String(MAX_LEADERBOARD_ENTRIES), "top 50 query");
  assert(normalizeLeaderboardLimit(500) === 50, "limit capped at 50");
  assert(normalizeLeaderboardLimit(0) === 1, "limit never falls below one");
  assert(normalizeLeaderboardLimit(Number.NaN) === 50, "invalid limit uses safe default");
});

Deno.test("排行榜 API 預設同源，且允許顯式整合 endpoint", () => {
  assert(
    resolveLeaderboardApiOrigin({
      protocol: "http:",
      hostname: "localhost",
      origin: "http://localhost:8399",
    }) === "http://localhost:8399",
    "local demo stays on the page origin",
  );
  assert(
    resolveLeaderboardApiOrigin({
      protocol: "https:",
      hostname: "game.example",
      origin: "https://game.example",
    }) === "https://game.example",
    "production uses same origin",
  );
  assert(
    resolveLeaderboardApiOrigin(
      { protocol: "https:", hostname: "game.example", origin: "https://game.example" },
      "https://records.example:9443/path",
    ) === "https://records.example:9443",
    "explicit origin wins",
  );
});

Deno.test("排行榜列逐欄跳脫玩家名稱與擊倒標語且保留可讀戰績", () => {
  const markup = leaderboardRowsMarkup([{
    rank: 1,
    displayName: "<b>夜行</b>",
    faction: "rootbound",
    profession: "scavenger",
    victoryQuote: `<img src=x onerror="alert(1)"> 這局由我收下。`,
    matches: 8,
    wins: 3,
    winRateBps: 3750,
  }]);
  assert(!markup.includes("<b>夜行</b>"), "player markup must not execute");
  assert(markup.includes("&lt;b&gt;夜行&lt;/b&gt;"), "escaped player name remains visible");
  assert(!markup.includes("<img"), "player quote markup must not execute");
  assert(
    markup.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt; 這局由我收下。"),
    "escaped victory quote remains visible in full",
  );
  assert(
    markup.includes(t("lobby.profile.victoryQuote")),
    "victory quote receives a localized accessible label",
  );
  assert(
    markup.includes(`${t("lobby.profile.rootbound.short")} · ${t("lobby.profile.scavenger")}`),
    "faction and profession render through the catalog",
  );
  assert(zhTW["lobby.profile.rootbound.short"] === "ROOTBOUND", "approved ROOTBOUND short label");
  assert(zhTW["lobby.profile.scavenger"] === "拾荒者", "approved scavenger label");
  assert(markup.includes("37.5%"), "win rate rendered");
  assert(
    markup.includes(t("leaderboard.record", { wins: 3, matches: 8 })),
    "record renders through the catalog",
  );
  assert(zhTW["leaderboard.record"] === "{wins} 勝 / {matches} 場", "approved record template");
  assert(escapeLeaderboardHtml(`&<>'\"`) === "&amp;&lt;&gt;&#039;&quot;", "all HTML marks escaped");
});

Deno.test("空白擊倒標語不佔排行榜列空間", () => {
  const markup = leaderboardRowsMarkup([{
    rank: 2,
    displayName: "Silent Walker",
    faction: "human",
    profession: "courier",
    victoryQuote: "",
    matches: 2,
    wins: 1,
    winRateBps: 5000,
  }]);
  assert(!markup.includes("leaderboard-victory-quote"), "blank quote omits the quote row");
});

Deno.test("排行榜文案誠實揭露本機空白資料與未包含的正式服務", () => {
  assert(
    leaderboardNoteCopy("practice", "session/dev") === t("leaderboard.note.practice.session"),
    "development durability note renders through the catalog",
  );
  assert(
    zhTW["leaderboard.note.practice.session"].includes("不會寫入"),
    "fixture actions are not persisted",
  );
  assert(
    leaderboardNoteCopy("ranked", "durable") === t("leaderboard.note.ranked.durable"),
    "ranked eligibility note renders through the catalog",
  );
  assert(
    zhTW["leaderboard.note.ranked.durable"].includes("正式服務"),
    "excluded ranked service is disclosed",
  );
  assert(
    leaderboardEmptyCopy("practice") === t("leaderboard.empty.practice"),
    "practice empty copy renders through the catalog",
  );
  assert(
    zhTW["leaderboard.empty.practice"] === "本機 fixture demo 不會保存試煉紀錄。",
    "truthful practice empty copy",
  );
  assert(
    leaderboardEmptyCopy("ranked") === t("leaderboard.empty.ranked"),
    "ranked empty copy renders through the catalog",
  );
  assert(
    zhTW["leaderboard.empty.ranked"] === "本機 fixture demo 沒有競技服務。",
    "truthful ranked empty copy",
  );
});

Deno.test("排行榜鍵盤分頁支援循環方向鍵與 Home End", () => {
  assert(nextLeaderboardTabIndex(0, 2, "ArrowLeft") === 1, "left wraps");
  assert(nextLeaderboardTabIndex(1, 2, "ArrowRight") === 0, "right wraps");
  assert(nextLeaderboardTabIndex(1, 2, "Home") === 0, "Home selects first");
  assert(nextLeaderboardTabIndex(0, 2, "End") === 1, "End selects last");
  assert(nextLeaderboardTabIndex(1, 2, "Enter") === 1, "other keys do not move");
  assert(nextLeaderboardTabIndex(0, 0, "ArrowRight") === -1, "empty tablist is safe");
});
