// Generated from browser/lobby_profile.js by scripts/emit_client.ts. Do not edit.
// @ts-check
import { t } from "./i18n.js";

/** @typedef {"rootbound" | "human"} FactionId */
/** @typedef {"courier" | "scavenger" | "enforcer"} ProfessionId */

/**
 * @typedef {object} ProfileDraft
 * @property {string} displayName
 * @property {FactionId | null} faction
 * @property {string} victoryQuote
 * @property {string} downedQuote
 */

/**
 * @typedef {object} LeaderboardEntry
 * @property {number} rank
 * @property {string} displayName
 * @property {FactionId} faction
 * @property {ProfessionId} profession
 * @property {string=} victoryQuote
 * @property {number} matches
 * @property {number} wins
 * @property {number} winRateBps
 */

const PROFILE_DRAFT_VERSION = 2;
export const PROFILE_QUOTE_MAX_CODE_POINTS = 48;
export const LOBBY_SHIFT_INTERVAL_MS = 30 * 60_000;
export const LOBBY_ASSEMBLY_WINDOW_MS = 5 * 60_000;

/**
 * 公開班表固定在每個整點／半點。這只是加入前的本地班表預覽；入席後仍一律以 server
 * `lobby.startsInMs` 為權威倒數。exact boundary 視為已發車，避免向剛開頁的玩家宣稱
 * 還能加入一班已經開始的對局。
 * @param {number} nowMs
 */
export function scheduledLobbyPreview(nowMs) {
  const safeNowMs = Number.isFinite(nowMs) ? Math.max(0, nowMs) : 0;
  const departureAtMs = (Math.floor(safeNowMs / LOBBY_SHIFT_INTERVAL_MS) + 1) *
    LOBBY_SHIFT_INTERVAL_MS;
  const remainingMs = departureAtMs - safeNowMs;
  /** @type {"not_gathering" | "gathering" | "imminent"} */
  const stage = remainingMs <= 60_000
    ? "imminent"
    : remainingMs <= LOBBY_ASSEMBLY_WINDOW_MS
    ? "gathering"
    : "not_gathering";
  return Object.freeze({
    departureAtMs,
    assemblyAtMs: departureAtMs - LOBBY_ASSEMBLY_WINDOW_MS,
    remainingMs,
    stage,
  });
}

/** @typedef {"idle" | "registering" | "connecting" | "seated" | "spectator-connecting" | "spectator-waiting"} LobbyEntryStage */

/**
 * 大廳兩條入口各自擁有狀態；觀戰不得改寫 Play，建立角色也不能提前宣稱已入席。
 * @param {LobbyEntryStage} stage
 */
export function lobbyEntryPresentation(stage) {
  const join = stage === "registering"
    ? ["lobby.join.registering", "lobby.join.registeringDetail", "◇"]
    : stage === "connecting"
    ? ["lobby.join.connecting", "lobby.join.connectingDetail", "◆"]
    : stage === "seated"
    ? ["lobby.join.seated", "lobby.join.seatedDetail", "◆"]
    : ["lobby.join.kicker", "lobby.join.action", "→"];
  const spectate = stage === "spectator-connecting"
    ? ["lobby.spectate.connecting", "lobby.spectate.connectingDetail", "◌"]
    : stage === "spectator-waiting"
    ? ["lobby.spectate.waiting", "lobby.spectate.waitingDetail", "◉"]
    : stage === "seated"
    ? ["lobby.spectate.whileWaiting", "lobby.spectate.whileWaitingDetail", "◉"]
    : ["lobby.spectate", "lobby.spectateDetail", "◉"];
  return Object.freeze({ join: Object.freeze(join), spectate: Object.freeze(spectate) });
}

/**
 * 玩家選擇的是立場／共同體，不是角色物種。
 *
 * These carry catalog keys rather than copy: the object is frozen at import time, so a
 * resolved string here would pin the faction names to whichever locale was active on first
 * import and never follow a language switch. Consumers call `t()` at render time.
 */
export const FACTIONS = Object.freeze({
  rootbound: Object.freeze({
    id: /** @type {const} */ ("rootbound"),
    labelKey: "lobby.profile.rootbound",
    shortLabelKey: "lobby.profile.rootbound.short",
    descriptionKey: "lobby.profile.rootbound.description",
  }),
  human: Object.freeze({
    id: /** @type {const} */ ("human"),
    labelKey: "lobby.profile.human",
    shortLabelKey: "lobby.profile.human",
    descriptionKey: "lobby.profile.human.description",
  }),
});

/**
 * 職業只用於顯示伺服器的隨機指派結果，不是玩家可選欄位。
 *
 * Key-carrying for the same reason as `FACTIONS` above — resolved at render, never at import.
 */
export const PROFESSIONS = Object.freeze({
  courier: Object.freeze({
    id: /** @type {const} */ ("courier"),
    labelKey: "lobby.profile.courier",
    descriptionKey: "lobby.profile.courier.description",
    assignmentLabelKey: "lobby.profile.randomRole",
  }),
  scavenger: Object.freeze({
    id: /** @type {const} */ ("scavenger"),
    labelKey: "lobby.profile.scavenger",
    descriptionKey: "lobby.profile.scavenger.description",
    assignmentLabelKey: "lobby.profile.randomRole",
  }),
  enforcer: Object.freeze({
    id: /** @type {const} */ ("enforcer"),
    labelKey: "lobby.profile.enforcer",
    descriptionKey: "lobby.profile.enforcer.description",
    assignmentLabelKey: "lobby.profile.randomRole",
  }),
});

/** V3 profession art is keyed only by a profession returned from the profile service. */
export const PROFESSION_ART = Object.freeze({
  courier: Object.freeze({
    token: "/art/placeholders/courier.svg",
    card: "/art/placeholders/courier.svg",
  }),
  scavenger: Object.freeze({
    token: "/art/placeholders/scavenger.svg",
    card: "/art/placeholders/scavenger.svg",
  }),
  enforcer: Object.freeze({
    token: "/art/placeholders/enforcer.svg",
    card: "/art/placeholders/enforcer.svg",
  }),
});

/** @param {unknown} value @returns {value is FactionId} */
export function isFaction(value) {
  return value === "rootbound" || value === "human";
}

/** @param {unknown} value @returns {value is ProfessionId} */
export function isProfession(value) {
  return value === "courier" || value === "scavenger" || value === "enforcer";
}

/**
 * 不從陣營或 protocol background 猜職業；只接受已具完整回應形狀的 Profile。
 * @param {unknown} response
 */
export function professionArtFromServerResponse(response) {
  const profession = professionFromServerResponse(response);
  return profession === null ? null : Object.freeze({ profession, ...PROFESSION_ART[profession] });
}

/**
 * 名字以 NFC 儲存；只收合併 Unicode 空白，不會吞掉換行等控制字元。
 * @param {unknown} value
 */
export function normalizeDisplayName(value) {
  if (typeof value !== "string") return "";
  return value.normalize("NFC").replace(/\p{Zs}+/gu, " ").trim();
}

/**
 * @typedef {object} DisplayNameValidation
 * @property {boolean} ok
 * @property {string} displayName
 * @property {null | "TYPE" | "CONTROL_CHARACTER" | "TOO_SHORT" | "TOO_LONG"} error
 * @property {number} codePoints
 */

/**
 * Public client validation rejects control, formatting, and surrogate code points consistently.
 * This gives users a specific error before an integrator applies any additional server policy.
 */
const CONTROL_CHARACTER_PATTERN = /[\p{Cc}\p{Cf}\p{Cs}]/u;

/**
 * 顯示名稱限制以 Unicode code point 計數，不以 UTF-16 code unit 計數。
 * @param {unknown} value
 * @returns {DisplayNameValidation}
 */
export function validateDisplayName(value) {
  if (typeof value !== "string") {
    return { ok: false, displayName: "", error: "TYPE", codePoints: 0 };
  }
  const displayName = normalizeDisplayName(value);
  const codePoints = [...displayName].length;
  if (CONTROL_CHARACTER_PATTERN.test(value)) {
    return { ok: false, displayName, error: "CONTROL_CHARACTER", codePoints };
  }
  if (codePoints < 2) {
    return { ok: false, displayName, error: "TOO_SHORT", codePoints };
  }
  if (codePoints > 16) {
    return { ok: false, displayName, error: "TOO_LONG", codePoints };
  }
  return { ok: true, displayName, error: null, codePoints };
}

/**
 * 角色標語與 server 採相同的 NFC／Unicode 空白規則。空字串代表不顯示。
 * @param {unknown} value
 */
export function normalizeProfileQuote(value) {
  if (typeof value !== "string") return "";
  return value.normalize("NFC").replace(/\p{Zs}+/gu, " ").trim();
}

/**
 * @typedef {object} ProfileQuoteValidation
 * @property {boolean} ok
 * @property {string} quote
 * @property {null | "TYPE" | "CONTROL_CHARACTER" | "TOO_LONG"} error
 * @property {number} codePoints
 */

/**
 * @param {unknown} value
 * @returns {ProfileQuoteValidation}
 */
export function validateProfileQuote(value) {
  if (typeof value !== "string") {
    return { ok: false, quote: "", error: "TYPE", codePoints: 0 };
  }
  const quote = normalizeProfileQuote(value);
  const codePoints = [...quote].length;
  if (CONTROL_CHARACTER_PATTERN.test(value)) {
    return { ok: false, quote, error: "CONTROL_CHARACTER", codePoints };
  }
  if (codePoints > PROFILE_QUOTE_MAX_CODE_POINTS) {
    return { ok: false, quote, error: "TOO_LONG", codePoints };
  }
  return { ok: true, quote, error: null, codePoints };
}

/** @param {unknown} value */
export function isValidDisplayName(value) {
  return validateDisplayName(value).ok;
}

/** @returns {ProfileDraft} */
export function createEmptyProfileDraft() {
  return { displayName: "", faction: null, victoryQuote: "", downedQuote: "" };
}

/**
 * 序列化未完成的表單草稿。草稿刻意沒有 profession；職業不得由 client 自填。
 * 空白／單字元名字可以暫存，但控制字元與超過上限的資料不會進入儲存層。
 * @param {unknown} value
 * @returns {string | null}
 */
export function saveProfileDraft(value) {
  if (!isRecord(value) || typeof value.displayName !== "string") return null;
  const displayName = normalizeDisplayName(value.displayName);
  if (CONTROL_CHARACTER_PATTERN.test(value.displayName) || [...displayName].length > 16) {
    return null;
  }
  const faction = value.faction === null ? null : isFaction(value.faction) ? value.faction : null;
  const victory = validateProfileQuote(value.victoryQuote ?? "");
  const downed = validateProfileQuote(value.downedQuote ?? "");
  if (!victory.ok || !downed.ok) return null;
  return JSON.stringify({
    version: PROFILE_DRAFT_VERSION,
    displayName,
    faction,
    victoryQuote: victory.quote,
    downedQuote: downed.quote,
  });
}

/**
 * 只解析呼叫端交進來的字串，不直接存取 localStorage 或任何瀏覽器全域。
 * @param {unknown} serialized
 * @returns {ProfileDraft}
 */
export function loadProfileDraft(serialized) {
  if (typeof serialized !== "string" || serialized.length === 0) {
    return createEmptyProfileDraft();
  }
  try {
    const value = JSON.parse(serialized);
    if (
      !isRecord(value) || (value.version !== 1 && value.version !== PROFILE_DRAFT_VERSION) ||
      typeof value.displayName !== "string"
    ) {
      return createEmptyProfileDraft();
    }
    const displayName = normalizeDisplayName(value.displayName);
    if (CONTROL_CHARACTER_PATTERN.test(value.displayName) || [...displayName].length > 16) {
      return createEmptyProfileDraft();
    }
    const victory = validateProfileQuote(value.version === 1 ? "" : value.victoryQuote ?? "");
    const downed = validateProfileQuote(value.version === 1 ? "" : value.downedQuote ?? "");
    if (!victory.ok || !downed.ok) return createEmptyProfileDraft();
    return {
      displayName,
      faction: isFaction(value.faction) ? value.faction : null,
      victoryQuote: victory.quote,
      downedQuote: downed.quote,
    };
  } catch {
    return createEmptyProfileDraft();
  }
}

/**
 * 唯一會把 profession 轉成 UI 值的入口：必須傳入正式 server response 物件。
 * @param {unknown} response
 * @returns {ProfessionId | null}
 */
export function professionFromServerResponse(response) {
  if (!isRecord(response) || !isProfession(response.profession)) return null;
  return response.profession;
}

/** @param {unknown} value @returns {value is LeaderboardEntry} */
export function isLeaderboardEntry(value) {
  if (!isRecord(value)) return false;
  const name = validateDisplayName(value.displayName);
  const victoryQuote = value.victoryQuote === undefined
    ? { ok: true }
    : validateProfileQuote(value.victoryQuote);
  return Number.isInteger(value.rank) && Number(value.rank) >= 1 && name.ok &&
    isFaction(value.faction) && isProfession(value.profession) &&
    victoryQuote.ok &&
    isNonNegativeInteger(value.matches) && isNonNegativeInteger(value.wins) &&
    Number(value.wins) <= Number(value.matches) &&
    Number.isInteger(value.winRateBps) && Number(value.winRateBps) >= 0 &&
    Number(value.winRateBps) <= 10_000;
}

/**
 * 排行榜 API 最小回應形狀；額外的分頁／賽季欄位可存在，但不影響安全渲染。
 * @param {unknown} value
 * @returns {value is {entries: LeaderboardEntry[]}}
 */
export function isLeaderboardResponse(value) {
  return isRecord(value) && Array.isArray(value.entries) &&
    value.entries.every(isLeaderboardEntry);
}

/**
 * basis points: 1 = 0.01%，10_000 = 100%。非法值顯示破折號，不猜資料。
 * @param {unknown} value
 */
export function formatWinRateBps(value) {
  if (!Number.isInteger(value) || Number(value) < 0 || Number(value) > 10_000) return "—";
  const basisPoints = Number(value);
  const whole = Math.floor(basisPoints / 100);
  const fraction = basisPoints % 100;
  if (fraction === 0) return `${whole}%`;
  if (fraction % 10 === 0) return `${whole}.${fraction / 10}%`;
  return `${whole}.${String(fraction).padStart(2, "0")}%`;
}

/**
 * 直接觀戰的防偷看暖機提示；以向上取整避免畫面提早顯示 00:00。
 * @param {unknown} remainingMs
 */
export function formatSpectatorWarmup(remainingMs) {
  if (typeof remainingMs !== "number" || !Number.isFinite(remainingMs)) {
    return t("lobby.profile.spectatorWarmup.unknown");
  }
  if (remainingMs <= 0) return t("lobby.profile.spectatorWarmup.ready");
  const totalSeconds = Math.ceil(remainingMs / 1_000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return t("lobby.profile.spectatorWarmup.countdown", { minutes, seconds });
}

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** @param {unknown} value */
function isNonNegativeInteger(value) {
  return Number.isInteger(value) && Number(value) >= 0;
}
