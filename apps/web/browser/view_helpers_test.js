// @ts-check
import { openingMegaCity } from "@darkforest/fixtures";
import {
  activeEdges,
  apiOriginFromSocketUrl,
  applyDiff,
  classifyDiffVersion,
  edgeStyle,
  escapeHtml,
  eventPlayerRef,
  formatBpsPercent,
  formatDuration,
  isRecord,
  limpingBadgeMarkup,
  mergeSelfState,
  nextBlockade,
  nodeCacheOffers,
  openingPerkCardMarkup,
  routeNeighbors,
  tacticalArenaExitProjection,
  tacticalContactFigure,
  uiDisclosureMarkup,
  visiblePlayerName,
  waitingDotsMarkup,
} from "./view_helpers.js";
import { activateMatchLocale } from "./match_i18n_test_helper.js";

/** @param {boolean} condition @param {string} message */
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

Deno.test("escapeHtml 中和所有 HTML 注入字元", () => {
  assert(
    escapeHtml(`<img src=x onerror="alert('xss')">`) ===
      "&lt;img src=x onerror=&quot;alert(&#039;xss&#039;)&quot;&gt;",
    "every injection character must be escaped",
  );
  // & 必須先轉換,否則後續替換會產生 double-escape 破口。
  assert(escapeHtml("&lt;") === "&amp;lt;", "ampersand must escape first");
  assert(escapeHtml(42) === "42" && escapeHtml(null) === "null", "non-strings are coerced");
});

Deno.test("戰術場景四方向與更多路線使用目前語系地名", () => {
  const current = structuredClone(openingMegaCity.view);
  try {
    activateMatchLocale("ko");
    const projection = tacticalArenaExitProjection(current);
    const exits = [
      projection.up,
      projection.right,
      projection.down,
      projection.left,
      ...projection.overflow,
    ].filter((exit) => exit !== null);
    assert(exits.length > 0, "fixture must expose at least one route");
    const canonicalNames = new Set(
      current.map.nodes.flatMap((node) => [node.nameMegaCity, node.nameDarkforest]),
    );
    assert(
      exits.every((exit) => !canonicalNames.has(exit.displayName)),
      "route arrows and overflow must not leak canonical English names",
    );
  } finally {
    activateMatchLocale("zh-TW");
  }
});

Deno.test("formatDuration 無條件進位到秒並補零", () => {
  assert(formatDuration(0) === "00:00", "zero");
  assert(formatDuration(1) === "00:01", "sub-second rounds up so 1ms never shows 00:00");
  assert(formatDuration(59_000) === "00:59", "under a minute");
  assert(formatDuration(60_000) === "01:00", "exact minute");
  assert(formatDuration(-5_000) === "00:00", "negative clamps instead of showing -1");
});

Deno.test("formatBpsPercent 只在需要時顯示小數", () => {
  assert(formatBpsPercent(undefined) === "—", "absent value reads as em dash");
  assert(formatBpsPercent(1000) === "10%", "integer percent stays integer");
  assert(formatBpsPercent(1050) === "10.5%", "fractional percent keeps one decimal");
  assert(formatBpsPercent(0) === "0%", "zero is not treated as absent");
});

Deno.test("戰術人物美術遵守迷霧，不從隱藏欄位洩漏身份", () => {
  assert(
    tacticalContactFigure({ identified: false, background: "rootbound" }) ===
      "/art/placeholders/contact.svg",
    "unidentified contact must stay neutral even when a background field is present",
  );
  assert(
    tacticalContactFigure({ identified: true, background: "rootbound" }) ===
      "/art/placeholders/contact.svg",
    "identified ROOTBOUND contact",
  );
  assert(
    tacticalContactFigure({ identified: true, background: "courier" }) ===
      "/art/placeholders/contact.svg",
    "identified free survivor contact",
  );
  assert(
    tacticalContactFigure({ identified: true, background: "unknown" }) ===
      "/art/placeholders/contact.svg",
    "unknown authoritative values fail closed",
  );
});

Deno.test("isRecord 排除 null 與陣列", () => {
  assert(isRecord({}) === true, "plain object");
  assert(isRecord(null) === false, "null is typeof object but not a record");
  assert(isRecord([]) === false, "arrays are not records");
  assert(isRecord("x") === false, "primitives are not records");
});

Deno.test("apiOriginFromSocketUrl 對應 ws→http、wss→https,並拒絕其他 scheme", () => {
  assert(apiOriginFromSocketUrl("ws://127.0.0.1:8790/ws") === "http://127.0.0.1:8790", "ws→http");
  assert(
    apiOriginFromSocketUrl("wss://match.example.invalid/ws") === "https://match.example.invalid",
    "wss→https",
  );
  let threw = false;
  try {
    apiOriginFromSocketUrl("https://match.example.invalid/ws");
  } catch {
    threw = true;
  }
  assert(threw, "non-socket scheme must throw so callers can map it to PROFILE_UNAVAILABLE");
});

/** @returns {any} */
function view() {
  return {
    stateVersion: 1,
    gameNowMs: 1_000,
    phase: "mega_city",
    self: { node: "n1", hp: 100, stamina: 50, disasterIntel: { note: "x" } },
    visiblePlayers: [],
    nodes: [
      { id: "n1", open: true },
      { id: "n2", open: true },
      { id: "n3", open: false },
    ],
    map: {
      edges: [
        { id: "e1", from: "n1", to: "n2", phase: "both" },
        { id: "e2", from: "n1", to: "n3", phase: "both" },
        { id: "e3", from: "n1", to: "n2", phase: "darkforest" },
      ],
      blockadeSchedule: [
        { node: "n5", closesAtMs: 500 },
        { node: "n4", closesAtMs: 2_000 },
      ],
    },
  };
}

Deno.test("activeEdges 依世界階段過濾邊", () => {
  const edges = activeEdges(view());
  assert(edges.length === 2, `mega_city keeps only "both" edges, got ${edges.length}`);
  assert(edges.every((edge) => edge.phase === "both"), "darkforest-only edge must be excluded");
});

Deno.test("routeNeighbors 只回傳仍開放的鄰居", () => {
  const neighbours = routeNeighbors(view(), "n1");
  assert(neighbours.includes("n2"), "open neighbour is reachable");
  assert(!neighbours.includes("n3"), "closed node must not be offered as a route");
});

Deno.test("nextBlockade 取下一個尚未關閉的封鎖", () => {
  const entry = nextBlockade(view());
  assert(entry !== null && entry.node === "n4", "entries already past gameNowMs are skipped");
});

Deno.test("mergeSelfState 以 null 作為刪除訊號", () => {
  const merged = mergeSelfState(view().self, /** @type {any} */ ({ hp: 80, disasterIntel: null }));
  assert(merged.hp === 80, "patched field is applied");
  assert(!("disasterIntel" in merged), "null patch deletes the key rather than storing null");
  assert(merged.stamina === 50, "untouched fields survive the merge");
});

Deno.test("applyDiff 逐節點替換且不動到未提及的節點", () => {
  const next = applyDiff(
    view(),
    // events 在 protocol 中是必填欄位,合法的 diff 一定帶著它(即使為空陣列)。
    /** @type {any} */ ({
      stateVersion: 2,
      gameNowMs: 1_500,
      events: [],
      nodes: [{ id: "n2", open: false }],
    }),
  );
  assert(next.stateVersion === 2 && next.gameNowMs === 1_500, "version and clock advance");
  assert(next.nodes.find((/** @type {any} */ n) => n.id === "n2")?.open === false, "node replaced");
  assert(
    next.nodes.find((/** @type {any} */ n) => n.id === "n1")?.open === true,
    "other nodes untouched",
  );
  assert(next.nodes.length === 3, "diff must not drop unmentioned nodes");
});

Deno.test("classifyDiffVersion 區分 next/stale/gap", () => {
  // 由 lib/protocol_state.ts 移植而來:該處的實作沒有人執行,client.js 跑的是自己的
  // inline 版本。現在兩者合併為這一份,測試終於覆蓋到真正在跑的程式碼。
  assert(classifyDiffVersion(12, 13) === "next", "the immediately following version applies");
  assert(classifyDiffVersion(12, 12) === "stale", "a replayed version is stale");
  assert(classifyDiffVersion(12, 11) === "stale", "an older version is stale");
  assert(classifyDiffVersion(12, 14) === "gap", "a skipped version is a gap and must resync");
});

Deno.test("edgeStyle 以幾何算出連線位置,未知節點退回中心", () => {
  const positions = { a: { x: 0, y: 0 }, b: { x: 30, y: 40 } };
  const style = edgeStyle("a", "b", positions);
  assert(style.includes("left:0%"), "starts at the from-node");
  assert(style.includes("width:50%"), `3-4-5 triangle gives length 50, got ${style}`);
  // 缺席的節點退回 50/50,長度為 0——不能因為資料不全就丟出例外或畫出亂線。
  const missing = edgeStyle("ghost", "phantom", positions);
  assert(missing.includes("left:50%") && missing.includes("width:0%"), missing);
});

Deno.test("visiblePlayerName 對未辨識人影不洩漏身分", () => {
  const identified = /** @type {any} */ ({ identified: true, playerId: "P02", ref: "C-1234" });
  const fogged = /** @type {any} */ ({ identified: false, playerId: "P03", ref: "C-abcd" });
  assert(visiblePlayerName(identified) === "P02", "identified players show their id");
  const name = visiblePlayerName(fogged);
  assert(!name.includes("P03"), "an unidentified figure must never leak the playerId");
});

Deno.test("nodeCacheOffers 只回報自身所在節點的地上物資", () => {
  const current = /** @type {any} */ ({
    self: { node: "n1" },
    nodes: [
      {
        id: "n1",
        caches: [{
          cacheId: "c1",
          priorityFor: "P01",
          priorityUntilMs: 9,
          items: [{ kind: "scrap", count: 1 }],
        }],
      },
      {
        id: "n2",
        caches: [{
          cacheId: "c2",
          priorityFor: "P02",
          priorityUntilMs: 10,
          items: [{ kind: "bandage", count: 1 }],
        }],
      },
    ],
  });
  const offers = nodeCacheOffers(current);
  assert(offers.length === 1 && offers[0].cacheId === "c1", "only the self node's caches");
  assert(offers[0].node === "n1", "offers are stamped with the self node");
  assert(offers[0].untilMs === 9, "NodeView priorityUntilMs maps to event-shape untilMs");
  assert(offers[0].priorityFor === "P01", "priority owner survives the projection");
  const empty = nodeCacheOffers(/** @type {any} */ ({ self: { node: "n9" }, nodes: [] }));
  assert(empty.length === 0, "a node with no entry yields no offers, not a crash");
});

Deno.test("eventPlayerRef 只回傳看得見、且不是自己的對象", () => {
  const current = /** @type {any} */ ({
    self: { playerId: "P01" },
    visiblePlayers: [{ ref: "P02" }],
  });
  const combat = /** @type {any} */ ({ kind: "combat", attacker: "P02", target: "P01" });
  assert(eventPlayerRef(combat, current) === "P02", "the visible opponent is returned, not self");
  const invisible = /** @type {any} */ ({ kind: "combat", attacker: "P09", target: "P01" });
  assert(eventPlayerRef(invisible, current) === null, "an unseen player must not be surfaced");
  const noPlayer = /** @type {any} */ ({ kind: "phase_changed" });
  assert(eventPlayerRef(noPlayer, current) === null, "events without players yield null");
});

Deno.test("內部呼叫 escapeHtml 的 markup 函式真的跑得起來", () => {
  // 迴歸測試:view_helpers.js 曾以 `export { escapeHtml } from "./html_escape.js"` 再匯出。
  // ES module 的間接再匯出「不會」建立本地繫結,因此模組內 30 處呼叫全部 ReferenceError,
  // 但從模組外呼叫 escapeHtml 仍正常——所以型別檢查、單元測試與瀏覽器冒煙測試全都沒抓到。
  // 這裡直接呼叫會用到該繫結的函式,把它釘住。
  const disclosure = uiDisclosureMarkup("help", "標籤", "標題", "內文");
  assert(disclosure.includes("<details"), "uiDisclosureMarkup must produce markup");
  assert(waitingDotsMarkup().length > 0, "waitingDotsMarkup must produce markup");
  assert(limpingBadgeMarkup(true).length >= 0, "limpingBadgeMarkup must not throw");
  const perk = openingPerkCardMarkup(
    /** @type {any} */ ({ self: { profession: "courier", trait: "steady" } }),
  );
  assert(perk.includes("opening-perk-card"), "openingPerkCardMarkup must produce markup");
});

Deno.test("markup 函式會逸出使用者可控內容", () => {
  const hostile = `<script>alert('x')</script>`;
  const markup = uiDisclosureMarkup("help", hostile, hostile, hostile);
  assert(!markup.includes("<script>"), "a raw script tag must never survive into markup");
  assert(markup.includes("&lt;script&gt;"), "the payload must appear escaped instead");
});
