// @ts-check
import { t } from "./i18n.js";
import { FACTIONS, formatWinRateBps, isLeaderboardResponse, PROFESSIONS } from "./lobby_profile.js";
import { escapeHtml } from "./html_escape.js";

/** @typedef {"practice" | "ranked"} LeaderboardScope */
/** @typedef {{rank: number, displayName: string, faction: "rootbound" | "human", profession: "courier" | "scavenger" | "enforcer", victoryQuote?: string, matches: number, wins: number, winRateBps: number}} LeaderboardEntry */

export const DEFAULT_LEADERBOARD_API_ORIGIN = "http://127.0.0.1:8000";
export const MAX_LEADERBOARD_ENTRIES = 50;

/**
 * The open-source demo uses the page's same-origin fixture endpoint unless explicitly set.
 * @param {{protocol: string, hostname: string, origin: string}} locationLike
 * @param {string=} explicitOrigin
 */
export function resolveLeaderboardApiOrigin(locationLike, explicitOrigin = "") {
  if (explicitOrigin.trim() !== "") return new URL(explicitOrigin).origin;
  return locationLike.origin;
}

/** @param {unknown} value @returns {value is LeaderboardScope} */
export function isLeaderboardScope(value) {
  return value === "practice" || value === "ranked";
}

/** @param {unknown} value */
export function escapeLeaderboardHtml(value) {
  return escapeHtml(value);
}

/** @param {unknown} value */
export function normalizeLeaderboardLimit(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return MAX_LEADERBOARD_ENTRIES;
  return Math.min(MAX_LEADERBOARD_ENTRIES, Math.max(1, Math.trunc(value)));
}

/**
 * @param {LeaderboardScope} scope
 * @param {string=} apiOrigin
 * @param {number=} limit
 */
export function leaderboardApiUrl(
  scope,
  apiOrigin = DEFAULT_LEADERBOARD_API_ORIGIN,
  limit = MAX_LEADERBOARD_ENTRIES,
) {
  if (!isLeaderboardScope(scope)) throw new TypeError("Unknown leaderboard scope");
  const url = new URL("/api/v1/leaderboard", apiOrigin);
  url.searchParams.set("scope", scope);
  url.searchParams.set("limit", String(normalizeLeaderboardLimit(limit)));
  return url;
}

/**
 * 試煉／競技榜 × 暫存／已封存耐久有四種語意組合，直接用四把獨立 key 取代模板插值——
 * 插值等於在句子中間黏合兩段各自翻譯的片語，語序在不同語言可能整句重排，插值法無法表達。
 * @param {LeaderboardScope} scope @param {unknown} durability
 */
export function leaderboardNoteCopy(scope, durability) {
  const persistence = durability === "session/dev" ? "session" : "durable";
  return t(`leaderboard.note.${scope}.${persistence}`);
}

/** @param {LeaderboardScope} scope */
export function leaderboardEmptyCopy(scope) {
  return t(`leaderboard.empty.${scope}`);
}

/** @param {LeaderboardEntry[]} entries */
export function leaderboardRowsMarkup(entries) {
  return entries.map((entry) => {
    const faction = FACTIONS[entry.faction];
    const profession = PROFESSIONS[entry.profession];
    const victoryQuote = entry.victoryQuote?.trim() ?? "";
    const victoryQuoteMarkup = victoryQuote === ""
      ? ""
      : `<span class="leaderboard-victory-quote" aria-label="${
        escapeLeaderboardHtml(`${t("lobby.profile.victoryQuote")}: ${victoryQuote}`)
      }"><span aria-hidden="true">“</span>${
        escapeLeaderboardHtml(victoryQuote)
      }<span aria-hidden="true">”</span></span>`;
    return `<li class="leaderboard-row"><span class="leaderboard-rank">${
      escapeLeaderboardHtml(entry.rank)
    }</span><span class="leaderboard-player"><b>${
      escapeLeaderboardHtml(entry.displayName)
    }</b><small>${escapeLeaderboardHtml(t(faction.shortLabelKey))} · ${
      escapeLeaderboardHtml(t(profession.labelKey))
    }</small>${victoryQuoteMarkup}</span><span class="leaderboard-score"><b>${
      escapeLeaderboardHtml(formatWinRateBps(entry.winRateBps))
    }</b><small>${
      escapeLeaderboardHtml(t("leaderboard.record", { wins: entry.wins, matches: entry.matches }))
    }</small></span></li>`;
  }).join("");
}

/**
 * @param {number} currentIndex
 * @param {number} length
 * @param {string} key
 */
export function nextLeaderboardTabIndex(currentIndex, length, key) {
  if (length <= 0) return -1;
  if (key === "Home") return 0;
  if (key === "End") return length - 1;
  if (key === "ArrowRight") return (currentIndex + 1 + length) % length;
  if (key === "ArrowLeft") return (currentIndex - 1 + length) % length;
  return currentIndex;
}

/** @param {ParentNode=} root */
export function initializeLeaderboard(root = document) {
  const app = root.querySelector("[data-leaderboard-app]");
  if (!(app instanceof HTMLElement)) return null;
  const rows = app.querySelector("#leaderboard-rows");
  const note = app.querySelector("#leaderboard-note");
  const tabs = /** @type {NodeListOf<HTMLButtonElement>} */ (
    app.querySelectorAll("[data-leaderboard-scope]")
  );
  if (!(rows instanceof HTMLOListElement) || !(note instanceof HTMLElement) || tabs.length === 0) {
    return null;
  }
  const leaderboardRows = rows;
  const leaderboardNote = note;

  const apiOrigin = resolveLeaderboardApiOrigin(location, app.dataset.apiOrigin);
  let latestRequestId = 0;
  /** @type {LeaderboardScope} */
  let activeScope = "practice";

  /** @param {LeaderboardScope} scope */
  async function load(scope) {
    const requestId = ++latestRequestId;
    activeScope = scope;
    tabs.forEach((tab) => {
      const selected = tab.dataset.leaderboardScope === scope;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) leaderboardRows.setAttribute("aria-labelledby", tab.id);
    });
    leaderboardRows.setAttribute("aria-busy", "true");
    leaderboardRows.innerHTML = `<li class="leaderboard-empty">${t("leaderboard.loading")}</li>`;

    try {
      const response = await fetch(leaderboardApiUrl(scope, apiOrigin), {
        cache: "no-store",
        credentials: "omit",
        signal: AbortSignal.timeout(8_000),
      });
      /** @type {unknown} */
      const body = await response.json();
      if (requestId !== latestRequestId) return;
      if (!response.ok || !isLeaderboardResponse(body)) throw new Error("INVALID_RECORDS");
      const result = /** @type {{entries: LeaderboardEntry[], durability?: unknown}} */ (body);
      leaderboardNote.textContent = leaderboardNoteCopy(scope, result.durability);
      leaderboardRows.innerHTML = result.entries.length === 0
        ? `<li class="leaderboard-empty">${leaderboardEmptyCopy(scope)}</li>`
        : leaderboardRowsMarkup(result.entries);
    } catch {
      if (requestId !== latestRequestId) return;
      leaderboardNote.textContent = t(`leaderboard.note.${scope}.fallback`);
      leaderboardRows.innerHTML = `<li class="leaderboard-empty">${t("leaderboard.error")}</li>`;
    } finally {
      if (requestId === latestRequestId) leaderboardRows.removeAttribute("aria-busy");
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const scope = tab.dataset.leaderboardScope;
      if (isLeaderboardScope(scope)) void load(scope);
    });
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const tabList = [...tabs];
      const currentIndex = Math.max(0, tabList.indexOf(tab));
      const next = tabList[nextLeaderboardTabIndex(currentIndex, tabList.length, event.key)];
      const scope = next?.dataset.leaderboardScope;
      next?.focus();
      if (isLeaderboardScope(scope)) void load(scope);
    });
  });

  void load(activeScope);
  return Object.freeze({ load });
}

if (typeof document !== "undefined") initializeLeaderboard();
