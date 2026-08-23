// @ts-check
import {
  createEmptyProfileDraft,
  FACTIONS,
  formatSpectatorWarmup,
  formatWinRateBps,
  isLeaderboardResponse,
  isValidDisplayName,
  loadProfileDraft,
  lobbyEntryPresentation,
  normalizeDisplayName,
  normalizeProfileQuote,
  professionArtFromServerResponse,
  professionFromServerResponse,
  PROFESSIONS,
  PROFILE_QUOTE_MAX_CODE_POINTS,
  saveProfileDraft,
  scheduledLobbyPreview,
  validateDisplayName,
  validateProfileQuote,
} from "./lobby_profile.js";
import { t } from "./shell_i18n_test_helper.js";
import zhTW from "../locales/zh-TW.json" with { type: "json" };

/** @param {unknown} value @param {string} message */
function assert(value, message) {
  if (!value) throw new Error(message);
}

Deno.test("註冊 metadata 把 ROOTBOUND／Human 表達成玩家立場而非物種", () => {
  // These objects are frozen at import time and carry keys, never copy — a resolved string
  // would pin the names to whichever locale was active on first import. So assert in two
  // halves: the metadata routes through the catalog, and the catalog holds the approved
  // wording. Pinning the wording here rather than in the module keeps exactly one source.
  assert(
    t(FACTIONS.rootbound.labelKey) === "ROOTBOUND 共同體",
    "ROOTBOUND label resolves through the catalog",
  );
  assert(t(FACTIONS.human.labelKey) === "自由倖存者", "Human label resolves through the catalog");
  assert(
    t(FACTIONS.rootbound.descriptionKey).includes("不代表物種"),
    "ROOTBOUND is a stance, not a species choice",
  );
  assert(
    t(FACTIONS.human.descriptionKey).includes("玩家立場"),
    "Human is a player stance",
  );
  assert(t(PROFESSIONS.courier.labelKey) === "信使", "courier metadata");
  assert(t(PROFESSIONS.scavenger.labelKey) === "拾荒者", "scavenger metadata");
  assert(t(PROFESSIONS.enforcer.labelKey) === "執行者", "enforcer metadata");
  assert(
    Object.values(PROFESSIONS).every((entry) =>
      t(entry.assignmentLabelKey) === "建立角色檔案時隨機指派，之後固定保留"
    ),
    "profession must be presented as assigned once and retained with the profile",
  );

  // No literal copy may come back onto the frozen metadata — that is the regression that
  // would silently re-freeze these names to the import-time locale.
  for (const entry of [...Object.values(FACTIONS), ...Object.values(PROFESSIONS)]) {
    for (const [field, value] of Object.entries(entry)) {
      assert(
        field === "id" || field.endsWith("Key"),
        `${entry.id}.${field} must be a catalog key, not resolved copy: ${String(value)}`,
      );
    }
  }

  assert(zhTW["lobby.profile.rootbound"] === "ROOTBOUND 共同體", "approved ROOTBOUND label");
  assert(zhTW["lobby.profile.human"] === "自由倖存者", "approved Human label");
  assert(
    zhTW["lobby.profile.randomRole"] === "建立角色檔案時隨機指派，之後固定保留",
    "approved assignment copy",
  );
});

Deno.test("大廳 Play 與觀戰各自呈現狀態，入席只由 lobby 階段宣告", () => {
  const spectator = lobbyEntryPresentation("spectator-connecting");
  assert(spectator.join[0] === "lobby.join.kicker", "spectating must not rewrite Play");
  assert(
    spectator.spectate[0] === "lobby.spectate.connecting",
    "spectator control owns spectator progress",
  );
  const registering = lobbyEntryPresentation("registering");
  assert(registering.join[0] === "lobby.join.registering", "profile request is registering");
  assert(registering.spectate[0] === "lobby.spectate", "Play must not rewrite spectate");
  assert(
    lobbyEntryPresentation("connecting").join[0] !== "lobby.join.seated",
    "opening a socket is not a confirmed seat",
  );
  assert(
    lobbyEntryPresentation("seated").join[0] === "lobby.join.seated",
    "only an explicit seated stage may claim a seat",
  );
  assert(
    lobbyEntryPresentation("seated").spectate[0] === "lobby.spectate.whileWaiting",
    "a seated player gets an explicit opt-in waiting-time spectator action",
  );
});

Deno.test("加入前班表預覽固定指向下一個整點／半點並揭露集合階段", () => {
  const beforeAssembly = scheduledLobbyPreview(Date.UTC(2026, 7, 4, 12, 20, 0));
  assert(
    beforeAssembly.departureAtMs === Date.UTC(2026, 7, 4, 12, 30, 0) &&
      beforeAssembly.assemblyAtMs === Date.UTC(2026, 7, 4, 12, 25, 0),
    "the public schedule must resolve the next half-hour and its five-minute assembly",
  );
  assert(beforeAssembly.stage === "not_gathering", "ten minutes out is not gathering yet");

  const gathering = scheduledLobbyPreview(Date.UTC(2026, 7, 4, 12, 27, 0));
  assert(gathering.stage === "gathering", "the last five minutes are gathering");

  const imminent = scheduledLobbyPreview(Date.UTC(2026, 7, 4, 12, 29, 30));
  assert(imminent.stage === "imminent", "the final minute is imminent");

  const exactBoundary = scheduledLobbyPreview(Date.UTC(2026, 7, 4, 12, 30, 0));
  assert(
    exactBoundary.departureAtMs === Date.UTC(2026, 7, 4, 13, 0, 0),
    "an already-departing shift must not be advertised as joinable",
  );
});

Deno.test("名字正規化使用 NFC、合併 Unicode 空白並以 code point 計數", () => {
  assert(normalizeDisplayName("  Me\u0301ga　City  ") === "Méga City", "NFC and spacing");
  const sixteenEmoji = "🌲".repeat(16);
  const valid = validateDisplayName(sixteenEmoji);
  assert(valid.ok && valid.codePoints === 16, "16 non-BMP code points should pass");
  const tooLong = validateDisplayName(`${sixteenEmoji}🌲`);
  assert(!tooLong.ok && tooLong.error === "TOO_LONG", "17 code points should fail");
});

Deno.test("名字必須 2–16 code points 且不得含控制字元", () => {
  assert(validateDisplayName("A").error === "TOO_SHORT", "one point is too short");
  assert(validateDisplayName("AB").ok, "two points pass");
  assert(validateDisplayName("A\nB").error === "CONTROL_CHARACTER", "newline rejected");
  assert(validateDisplayName("A\u007fB").error === "CONTROL_CHARACTER", "DEL rejected");
  // 與 server 的 CONTROL_CHARACTER_PATTERN 對齊:格式字元(Cf)與代理對(Cs)同樣不可進名字。
  // 只擋 Cc 會讓 ZWJ 名稱在前端過關、卻在 server 被退,玩家拿不到具體理由。
  assert(
    validateDisplayName("A\u200dB").error === "CONTROL_CHARACTER",
    "U+200D ZWJ rejected client-side, matching the server",
  );
  assert(
    validateDisplayName("A\ufeffB").error === "CONTROL_CHARACTER",
    "U+FEFF rejected client-side, matching the server",
  );
  assert(validateDisplayName("倖存者").ok, "ordinary CJK name still passes");
  assert(!isValidDisplayName(123), "non-string rejected");
});

Deno.test("profile draft 可安全往返，且絕不儲存 client 提供的 profession", () => {
  const empty = createEmptyProfileDraft();
  assert(
    empty.displayName === "" && empty.faction === null && empty.victoryQuote === "" &&
      empty.downedQuote === "",
    "empty draft shape",
  );
  const serialized = saveProfileDraft({
    displayName: "  Root　Walker ",
    faction: "rootbound",
    victoryQuote: "  到此　為止。 ",
    downedQuote: "我還會回來。",
    profession: "enforcer",
  });
  if (serialized === null) throw new Error("valid partial draft should serialize");
  assert(!serialized.includes("profession"), "profession must not enter draft storage");
  const restored = loadProfileDraft(serialized);
  assert(restored.displayName === "Root Walker", "normalized name restored");
  assert(restored.faction === "rootbound", "faction restored");
  assert(restored.victoryQuote === "到此 為止。", "victory quote restored");
  assert(restored.downedQuote === "我還會回來。", "downed quote restored");
  assert(!("profession" in restored), "restored draft cannot forge profession");
});

Deno.test("角色標語以 Unicode code point 驗證並安全升級 v1 草稿", () => {
  assert(normalizeProfileQuote("  Me\u0301ga　City  ") === "Méga City", "NFC and spacing");
  const max = "🌲".repeat(PROFILE_QUOTE_MAX_CODE_POINTS);
  assert(validateProfileQuote(max).ok, "48 non-BMP code points pass");
  assert(validateProfileQuote(`${max}🌲`).error === "TOO_LONG", "49 code points fail");
  assert(validateProfileQuote("先倒下\n再站起").error === "CONTROL_CHARACTER", "newline fails");
  assert(
    validateProfileQuote("先倒下\u200b再站起").error === "CONTROL_CHARACTER",
    "format char fails",
  );
  assert(validateProfileQuote(48).error === "TYPE", "non-string fails");
  const legacy = loadProfileDraft(JSON.stringify({
    version: 1,
    displayName: "Old Runner",
    faction: "human",
  }));
  assert(legacy.victoryQuote === "" && legacy.downedQuote === "", "v1 migrates to blank lines");
});

Deno.test("profile draft 容許未填完表單，但拒絕污染與損壞資料", () => {
  const partial = saveProfileDraft({ displayName: "A", faction: null });
  assert(partial !== null, "one-character draft can be resumed before submit");
  assert(loadProfileDraft(partial).displayName === "A", "partial name restored");
  assert(
    saveProfileDraft({ displayName: "A\nB", faction: "rootbound" }) === null,
    "control rejected",
  );
  assert(loadProfileDraft("not json").displayName === "", "malformed JSON resets safely");
  const forged = JSON.stringify({
    version: 1,
    displayName: "Night Runner",
    faction: "unknown",
    profession: "courier",
  });
  const restored = loadProfileDraft(forged);
  assert(restored.faction === null, "unknown faction does not survive");
  assert(!("profession" in restored), "forged profession does not survive");
});

Deno.test("profession 只從伺服器回應白名單讀取", () => {
  assert(
    professionFromServerResponse({ profession: "scavenger" }) === "scavenger",
    "known server profession accepted",
  );
  assert(professionFromServerResponse({ profession: "assassin" }) === null, "unknown rejected");
  assert(professionFromServerResponse("courier") === null, "raw client value rejected");
  assert(professionFromServerResponse(null) === null, "missing response rejected");
});

Deno.test("職業美術只依已驗證 profession 選圖，不從陣營猜測", () => {
  assert(
    professionArtFromServerResponse({ profession: "scavenger", faction: "rootbound" })?.token ===
      "/art/placeholders/scavenger.svg",
    "scavenger must not receive the courier portrait",
  );
  assert(
    professionArtFromServerResponse({ profession: "enforcer", faction: "human" })?.card ===
      "/art/placeholders/enforcer.svg",
    "enforcer card",
  );
  assert(
    professionArtFromServerResponse({ profession: "courier" })?.token ===
      "/art/placeholders/courier.svg",
    "courier token",
  );
  assert(
    professionArtFromServerResponse({ faction: "rootbound" }) === null,
    "faction is not a profession",
  );
  assert(
    professionArtFromServerResponse("scavenger") === null,
    "raw client value must not select art",
  );
});

Deno.test("leaderboard guard 僅接受可安全呈現且數值一致的 entries", () => {
  const valid = {
    generatedAt: "2026-07-16T00:00:00Z",
    entries: [{
      rank: 1,
      displayName: "Root Walker",
      faction: "human",
      profession: "courier",
      victoryQuote: "這場交鋒，到此為止。",
      matches: 8,
      wins: 3,
      winRateBps: 3750,
    }],
  };
  assert(isLeaderboardResponse(valid), "valid response passes");
  assert(
    isLeaderboardResponse({
      ...valid,
      entries: [{ ...valid.entries[0], victoryQuote: undefined }],
    }),
    "rolling deploy remains compatible with an older server that omits the quote",
  );
  assert(
    !isLeaderboardResponse({ ...valid, entries: [{ ...valid.entries[0], wins: 9 }] }),
    "wins cannot exceed matches",
  );
  assert(
    !isLeaderboardResponse({ ...valid, entries: [{ ...valid.entries[0], winRateBps: 10_001 }] }),
    "basis points bounded",
  );
  assert(
    !isLeaderboardResponse({ ...valid, entries: [{ ...valid.entries[0], profession: "fake" }] }),
    "unknown profession rejected",
  );
  assert(
    !isLeaderboardResponse({
      ...valid,
      entries: [{ ...valid.entries[0], victoryQuote: "🌲".repeat(49) }],
    }),
    "public quote keeps the 48 code point boundary",
  );
  assert(
    !isLeaderboardResponse({
      ...valid,
      entries: [{ ...valid.entries[0], victoryQuote: "不能\n換行" }],
    }),
    "public quote rejects control characters",
  );
  assert(!isLeaderboardResponse({ rows: valid.entries }), "wrong envelope rejected");
});

Deno.test("勝率 basis points 不用浮點猜值", () => {
  assert(formatWinRateBps(0) === "0%", "zero");
  assert(formatWinRateBps(1) === "0.01%", "one basis point");
  assert(formatWinRateBps(1250) === "12.5%", "trailing zero trimmed");
  assert(formatWinRateBps(3751) === "37.51%", "two decimal places retained");
  assert(formatWinRateBps(10_000) === "100%", "hundred percent");
  assert(formatWinRateBps(-1) === "—", "negative rejected");
  assert(formatWinRateBps(12.5) === "—", "non-integer rejected");
});

Deno.test("直接觀戰暖機倒數向上取整且不提早解鎖", () => {
  /** @param {string} minutes @param {string} seconds */
  const countdown = (minutes, seconds) =>
    t("lobby.profile.spectatorWarmup.countdown", { minutes, seconds });
  assert(formatSpectatorWarmup(60_000) === countdown("01", "00"), "one minute");
  assert(formatSpectatorWarmup(59_001) === countdown("01", "00"), "ceil prevents early 00:59");
  assert(formatSpectatorWarmup(59_000) === countdown("00", "59"), "exact second");
  assert(formatSpectatorWarmup(1) === countdown("00", "01"), "last millisecond stays protected");
  assert(formatSpectatorWarmup(0) === t("lobby.profile.spectatorWarmup.ready"), "ready");
  assert(
    formatSpectatorWarmup(Number.NaN) === t("lobby.profile.spectatorWarmup.unknown"),
    "unknown is not guessed",
  );
  assert(
    zhTW["lobby.profile.spectatorWarmup.countdown"] === "觀戰保護 · {minutes}:{seconds}",
    "approved countdown template",
  );
  assert(zhTW["lobby.profile.spectatorWarmup.ready"] === "可以開始觀戰", "approved ready copy");
  assert(
    zhTW["lobby.profile.spectatorWarmup.unknown"] === "觀戰保護 · --:--",
    "approved unknown copy",
  );
});
