// @ts-check
// 純函式視圖輔助:只依賴參數與 import,不觸碰模組狀態、DOM 或計時器,因此可獨立單元測試。
import { t } from "./i18n.js";
import {
  FACTIONS,
  lobbyEntryPresentation,
  PROFESSION_ART,
  PROFESSIONS,
  validateProfileQuote,
} from "./lobby_profile.js";
import {
  itemDisplayName,
  itemStackDisplayName,
  localizedPlaceName,
  narrativeNodeName,
  rejectionNarrativeLine,
  sceneUrl,
  worldPhase,
} from "./narrative_log.js";
import {
  finaleActionAvailability,
  identifiedPlayerLevel,
  isMeleeWeapon,
  matchTraitPresentation,
  previewModifierSourceLabel,
  selfInjuryParts,
  shopTradeUnitCount,
} from "./narrative_mode.js";
import { projectTacticalArenaExits } from "./tactical_arena.js";
import { escapeHtml } from "./html_escape.js";
export { escapeHtml };

/**
 * block 由 client.js 的 tacticalArenaCombatBlock 產生,而那就是 combatActionBlockReason 的回傳值。
 * 用 inline import 指向來源,型別才不依賴一個不在本模組的函式(抽取時原 JSDoc 正是指著它而失效),
 * 同時避免只為型別而建立一個 lint 視為未使用的 value import。
 * @typedef {ReturnType<typeof import("./narrative_mode.js").combatActionBlockReason>} _CombatBlock
 */
/** @typedef {import("@darkforest/protocol").ClientMsg} _ClientMsg */
/** @typedef {import("@darkforest/protocol").ActionPayload} _ActionPayload */
/** @typedef {import("@darkforest/protocol").HelloMsg} _HelloMsg */
/** @typedef {import("@darkforest/protocol").PlayerView} _PlayerView */
/** @typedef {import("@darkforest/protocol").MatchEvent} _MatchEvent */
/** @typedef {import("@darkforest/protocol").PreviewResponseMsg} _PreviewResponseMsg */
/** @typedef {import("@darkforest/protocol").ReplayLog} _ReplayLog */
/** @typedef {import("@darkforest/protocol").ServerMsg} _ServerMsg */
/** @typedef {import("@darkforest/protocol").StateDiffMsg} _StateDiffMsg */
/** @typedef {import("../lib/protocol_state.ts").LobbyMessage} _LobbyMsg */
/** @typedef {{type: "spectator_waiting", matchId: string | null, delayGameMs: number, readyInMs: number | null}} _SpectatorWaitingMsg */
/** @typedef {{profileId: string, displayName: string, faction: "rootbound" | "human", profession: "courier" | "scavenger" | "enforcer", victoryQuote?: string, downedQuote?: string, createdAtMs: number}} _Profile */
/** @typedef {import("../lib/protocol_state.ts").VisiblePlayerScope} _VisiblePlayerScope */
/** @typedef {import("./narrative_log.js").NarrativeEntry} _NarrativeEntry */
/** @typedef {{requestId: string, target: string, node: import("@darkforest/protocol").NodeId, scope: _VisiblePlayerScope, weapon: import("@darkforest/protocol").WeaponKind, requestedStateVersion: number, combatLease: string | null}} _PreviewContext */
/** @typedef {{errorCode?: string, retryAtMs?: number, shoeSlot?: boolean}} _ActionRejection */
/** @typedef {{key: string, params?: Record<string, string | number | {key: string}>} | {rejection: _ActionRejection}} _AssistPause */
/** @typedef {"manual" | "assist" | "semi"} _ControlMode */
/** @typedef {"hold" | "survive" | "scavenge" | "conceal" | "travel" | "echo_intel"} _AssistIntent */
/** @typedef {{key: string, title: string, detail: string, payload?: _ActionPayload, preview?: {target: string, weapon: import("@darkforest/protocol").WeaponKind}, state: "ready" | "waiting" | "manual" | "blocked"}} _AssistDecision */
/** @typedef {import("@darkforest/protocol").ArboraStatusMsg} _ArboraStatusMsg */
/** @typedef {import("@darkforest/protocol").ArboraReplyMsg} _ArboraReplyMsg */
/** @typedef {import("@darkforest/protocol").ArboraRejectMsg} _ArboraRejectMsg */
/** @typedef {_ArboraStatusMsg | _ArboraReplyMsg | _ArboraRejectMsg} _ArboraServerMsg */
/** @typedef {import("@darkforest/protocol").ArboraAskMsg} _ArboraAskMsg */
/** @typedef {"idle" | "registering" | "connecting" | "seated" | "spectator-connecting" | "spectator-waiting"} _LobbyEntryStage */

/** @param {string} action */
export function actionIcon(action) {
  const paths = /** @type {Record<string, string>} */ ({
    move: '<path d="M4 12h14m-5-5 5 5-5 5"/>',
    search: '<circle cx="10" cy="10" r="5"/><path d="m14 14 5 5"/>',
    hide: '<path d="M3 12s3-5 9-5 9 5 9 5-3 5-9 5-9-5-9-5Z"/><path d="M9 12h6"/>',
    preview: '<path d="M3 12s3-5 9-5 9 5 9 5-3 5-9 5-9-5-9-5Z"/><circle cx="12" cy="12" r="2"/>',
    attack: '<path d="m4 19 5-5m2-2 8-8 1 5-8 8m-5-1 3 3"/>',
    rescue: '<path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5Z"/>',
    use: '<path d="M8 3h8v4l3 5-3 9H8l-3-9 3-5Z"/><path d="M8 7h8"/>',
    ability: '<path d="m12 3 2.4 5.4L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.6-.6Z"/>',
    once_ability: '<path d="m12 3 2.4 5.4L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.6-.6Z"/>',
    attune: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16"/>',
    echo_attune: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16"/>',
    cancel: '<path d="m6 6 12 12M18 6 6 18"/>',
    shop_buy: '<path d="M5 7h14l-1 10H7L5 7Z"/><path d="M8 7a4 4 0 0 1 8 0M9 20h.01M16 20h.01"/>',
    shop_sell: '<path d="M5 7h14l-1 10H7L5 7Z"/><path d="M12 4v9m-3-3 3 3 3-3"/>',
  });
  return `<svg class="action-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8">${
    paths[action] ?? paths.ability
  }</svg>`;
}

/** @param {"self" | "hp" | "stamina" | "signal" | "armor" | "hidden"} kind */
export function tacticalStatusIcon(kind) {
  const paths = /** @type {Record<string, string>} */ ({
    self:
      '<circle cx="12" cy="7" r="3"/><path d="M6.5 21v-3.5A5.5 5.5 0 0 1 12 12a5.5 5.5 0 0 1 5.5 5.5V21M9 21v-4m6 4v-4"/>',
    hp:
      '<path d="M12 20S4 15.4 4 9.4A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.4C20 15.4 12 20 12 20Z"/><path d="M8 12h8m-4-4v8"/>',
    stamina: '<path d="m13.5 2-7 11h5L10.5 22l7-12h-5l1-8Z"/>',
    signal:
      '<circle cx="12" cy="12" r="1.8"/><path d="M8.8 8.8a4.5 4.5 0 0 0 0 6.4m6.4-6.4a4.5 4.5 0 0 1 0 6.4M5.7 5.7a9 9 0 0 0 0 12.6m12.6-12.6a9 9 0 0 1 0 12.6"/>',
    armor: '<path d="M12 3 19 6v5c0 4.8-2.8 8-7 10-4.2-2-7-5.2-7-10V6l7-3Z"/>',
    hidden:
      '<path d="M3 12s3.2-5 9-5 9 5 9 5-3.2 5-9 5-9-5-9-5Z"/><path d="m5 4 14 16M10 10a3 3 0 0 0 4 4"/>',
  });
  return `<svg class="tactical-status-icon tactical-status-icon-${kind}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7">${
    paths[kind]
  }</svg>`;
}

/** @param {_PlayerView} current */
export function openingPerkCardMarkup(current) {
  const profession = PROFESSIONS[current.self.profession];
  const trait = matchTraitPresentation(current.self.trait);
  return `<aside id="opening-perk-card" class="opening-perk-card" data-self-profession="${
    escapeHtml(current.self.profession)
  }" data-self-trait="${escapeHtml(current.self.trait)}" aria-labelledby="opening-perk-title">
    <span class="opening-perk-sigil" aria-hidden="true">✦</span>
    <div class="opening-perk-profession"><small>${
    escapeHtml(t(profession.assignmentLabelKey))
  }</small><strong>${escapeHtml(t(profession.labelKey))}</strong><p>${
    escapeHtml(t(profession.descriptionKey))
  }</p></div>
    <div class="opening-perk-trait"><small id="opening-perk-title">${
    escapeHtml(trait.intro)
  }</small><strong>${escapeHtml(trait.label)}</strong><p>${escapeHtml(trait.description)}</p></div>
    <button id="opening-perk-close" type="button" aria-label="${
    escapeHtml(t("accessibility.close"))
  }" title="${escapeHtml(t("accessibility.close"))}">×</button>
  </aside>`;
}

/**
 * Public builds intentionally omit the QA connection form from the DOM. These in-memory controls
 * keep the transport code shared with the opt-in development panel without exposing editable
 * endpoints, fixtures, match IDs, or seat tokens to players.
 * @param {string} value
 */
export function runtimeFormControl(value) {
  return {
    value,
    disabled: false,
    addEventListener() {},
  };
}

/** @param {string | undefined} value */
export function resolveFeedbackUrl(value) {
  const candidate = value?.trim() ?? "";
  if (candidate === "") return "";
  try {
    const url = new URL(candidate);
    return (url.protocol === "http:" || url.protocol === "https:") &&
        url.username === "" && url.password === ""
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}

/** @param {unknown} value */

/**
 * 非即時資訊使用同一種漸進揭露：? 是玩法補充，! 是限制／警告。
 * 倒數、危險、錯誤與目前可否行動不得透過此 helper 隱藏。
 * @param {"help" | "warning"} tone
 * @param {string} label
 * @param {string} title
 * @param {string} body
 */
export function uiDisclosureMarkup(tone, label, title, body) {
  const glyph = tone === "warning" ? "!" : "?";
  return `<details class="ui-disclosure ui-disclosure-${tone}">
    <summary aria-label="${escapeHtml(label)}"><span aria-hidden="true">${glyph}</span></summary>
    <div class="ui-disclosure-popover" role="note"><strong>${escapeHtml(title)}</strong><p>${
    escapeHtml(body)
  }</p></div>
  </details>`;
}

/** @param {unknown} value @returns {value is Record<string, unknown>} */
export function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** @param {_Profile | null | undefined} profile @param {"victoryQuote" | "downedQuote"} field */
export function profileQuote(profile, field) {
  const validation = validateProfileQuote(profile?.[field] ?? "");
  return validation.ok ? validation.quote : "";
}

/** @param {string} input */
export function apiOriginFromSocketUrl(input) {
  const socketUrl = new URL(input);
  if (socketUrl.protocol !== "ws:" && socketUrl.protocol !== "wss:") {
    // Internal invariant, never surfaced: every caller maps a throw here to PROFILE_UNAVAILABLE.
    throw new TypeError("INVALID_ENDPOINT_SCHEME");
  }
  socketUrl.protocol = socketUrl.protocol === "wss:" ? "https:" : "http:";
  return socketUrl.origin;
}

/** @param {unknown} error */
export function profileErrorCopy(error) {
  const code = error instanceof Error ? error.message : "PROFILE_UNAVAILABLE";
  if (code === "PROFILE_INVALID") return t("lobby.profile.error.invalid");
  if (code === "DISPLAY_NAME_TAKEN") return t("lobby.profile.error.nameTaken");
  if (code === "INVALID_DISPLAY_NAME") return t("lobby.profile.error.nameRejected");
  // Faction names stay params so they cannot drift from the FACTIONS source of truth.
  if (code === "INVALID_FACTION") {
    return t("lobby.profile.error.faction", {
      rootbound: t(FACTIONS.rootbound.labelKey),
      human: t(FACTIONS.human.labelKey),
    });
  }
  return t("lobby.profile.error.unavailable");
}

/** @param {import("@darkforest/protocol").VisiblePlayer} player */
export function visiblePlayerName(player) {
  return player.identified ? player.playerId ?? player.ref : t("narrative.fog.figure");
}

/** Exact body parts are self-only; never call this with VisiblePlayer. @param {_PlayerView["self"]} self */
export function selfInjurySummary(self) {
  const parts = selfInjuryParts(self);
  return parts.length === 0
    ? t("hud.injury.none")
    : parts.map((part) => t(`hud.injury.${part}`)).join(t("narrative.list_separator"));
}

/** Public opponents expose only a generic gait silhouette, including unidentified contacts. @param {boolean} limping @param {boolean=} compact */
export function limpingBadgeMarkup(limping, compact = false) {
  if (!limping) return "";
  return `<span class="limping-badge${compact ? " is-compact" : ""}" title="${
    escapeHtml(t("hud.limping"))
  }"><i aria-hidden="true">⌁</i>${compact ? "" : escapeHtml(t("hud.limping"))}</span>`;
}

/** @param {_PlayerView["self"]} self */
export function selfShoes(self) {
  const shoes = self.equipment.shoes?.kind;
  return shoes === "soft_sole" || shoes === "steel_toe" ? shoes : null;
}

/** @param {import("@darkforest/protocol").VisiblePlayer["armorSilhouette"]} silhouette */
export function armorSilhouetteLabel(silhouette) {
  return t(`armor.${silhouette}`);
}

/** @param {_PlayerView} current */
export function nodeCacheOffers(current) {
  const node = current.nodes.find((candidate) => candidate.id === current.self.node);
  return (node?.caches ?? []).map((
    cache,
  ) => /** @type {Extract<_MatchEvent, {kind: "cache_dropped"}>} */ ({
    kind: "cache_dropped",
    cacheId: cache.cacheId,
    node: current.self.node,
    priorityFor: cache.priorityFor,
    untilMs: cache.priorityUntilMs,
    items: cache.items,
  }));
}

/** @param {_MatchEvent} event */
export function eventNode(event) {
  switch (event.kind) {
    case "combat":
      return event.targetNode;
    case "player_downed":
    case "player_eliminated":
    case "player_echoed":
    case "cache_dropped":
    case "item_dropped":
    case "hazard_triggered":
    case "hazard_revealed":
    case "player_spotted":
    case "blockade_preview":
    case "blockade_closed":
    case "echo_returned":
    case "noise":
      return event.node;
    case "got_lost":
      return event.actual;
    default:
      return null;
  }
}

/** @param {_MatchEvent} event @param {_PlayerView} current */
export function eventPlayerRef(event, current) {
  const candidates = event.kind === "combat"
    ? [event.target, event.attacker]
    : "player" in event
    ? [event.player]
    : [];
  return candidates.find((candidate) =>
    candidate !== current.self.playerId &&
    current.visiblePlayers.some((player) => player.ref === candidate)
  ) ?? null;
}

/** @param {string=} label */
export function waitingDotsMarkup(label = t("hud.waiting.aria")) {
  return `<span class="waiting-dots" role="status" aria-label="${
    escapeHtml(label)
  }"><i></i><i></i><i></i></span>`;
}

/**
 * Render a sentence that wraps a live countdown element. The catalog value carries a
 * `{countdown}` slot, so the whole sentence stays one translatable string and each locale
 * chooses where the number sits — assembling it from a prefix and a suffix key instead would
 * lock every language into Chinese word order. Only the translated halves are escaped; the
 * markup argument is built from code-controlled deadlines.
 * @param {string} key @param {string} countdownMarkup
 */
export function countdownSentence(key, countdownMarkup) {
  const [before = "", after = ""] = t(key).split("{countdown}");
  return `${escapeHtml(before)}${countdownMarkup}${escapeHtml(after)}`;
}

/** @param {number | undefined} bps */
export function formatBpsPercent(bps) {
  if (bps === undefined) return "—";
  const percent = bps / 100;
  return `${Number.isInteger(percent) ? percent : percent.toFixed(1)}%`;
}

/** @param {_NarrativeEntry} entry */
export function narrativeOracleCitationTitle(entry) {
  const value = /** @type {{oracleCitationTitle?: unknown}} */ (entry).oracleCitationTitle;
  return typeof value === "string" && value !== "" ? value : null;
}

/** @param {_NarrativeEntry} entry */
export function narrativeEntryMetaMarkup(entry) {
  if (entry.kind !== "action" && entry.kind !== "system" && entry.speaker === undefined) {
    return "";
  }
  const speaker = entry.speaker ?? t(
    entry.kind === "action" ? "hud.log.meta.action" : "hud.log.meta.status",
  );
  const citationTitle = narrativeOracleCitationTitle(entry);
  const label = entry.label === undefined
    ? ""
    : `<em${
      citationTitle === null
        ? ""
        : ` tabindex="0" title="${escapeHtml(citationTitle)}" aria-label="${
          escapeHtml(`${entry.label} · ${citationTitle}`)
        }"`
    }>${escapeHtml(entry.label)}</em>`;
  return `<span class="narrative-log-meta"><b>${escapeHtml(speaker)}</b>${label}</span>`;
}

/** @param {_LobbyEntryStage} stage */
export function joinButtonMarkup(stage) {
  const [label, detail, icon] = lobbyEntryPresentation(stage).join;
  return `<span><b data-i18n="${label}">${label}</b><small data-i18n="${detail}">${detail}</small></span><i aria-hidden="true">${icon}</i>`;
}

/** @param {_LobbyEntryStage} stage */
export function spectateButtonMarkup(stage) {
  const [label, detail, icon] = lobbyEntryPresentation(stage).spectate;
  return `<span aria-hidden="true">${icon}</span><span><b data-i18n="${label}">${label}</b><small data-i18n="${detail}">${detail}</small></span>`;
}

/** @param {number} milliseconds */
export function formatDuration(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

/** @param {_PlayerView} current */
export function activeEdges(current) {
  const phase = worldPhase(current.phase);
  return current.map.edges.filter((edge) => edge.phase === "both" || edge.phase === phase);
}

/**
 * @param {_PlayerView} current
 * @param {import("@darkforest/protocol").NodeId} to
 * @returns {_PlayerView["map"]["edges"][number] | undefined}
 */
export function edgeForMove(current, to) {
  const edge = activeEdges(current).find((edge) =>
    (edge.from === current.self.node && edge.to === to) ||
    (edge.to === current.self.node && edge.from === to)
  );
  return edge;
}

/** @param {_PlayerView} current @param {import("@darkforest/protocol").NodeId} nodeId @param {boolean=} echo */
export function routeNeighbors(current, nodeId, echo = false) {
  const ids = activeEdges(current).flatMap((edge) =>
    edge.from === nodeId ? [edge.to] : edge.to === nodeId ? [edge.from] : []
  );
  if (echo) {
    return current.nodes.filter((node) => node.id !== nodeId).map((node) => node.id);
  }
  return ids.filter((id) => current.nodes.find((node) => node.id === id)?.open === true);
}

/** @param {_PlayerView} current */
export function nextBlockade(current) {
  return current.map.blockadeSchedule.find((entry) => entry.closesAtMs > current.gameNowMs) ?? null;
}

/**
 * Thin presentation wrapper around narrative_log.js sceneUrl (name-keyed with tag fallback).
 * @param {_PlayerView} current @param {_PlayerView["map"]["nodes"][number]} definition
 * @param {_PlayerView["nodes"][number]["activeTags"]} activeTags
 */
export function atmosphereUrl(current, definition, activeTags) {
  return sceneUrl(current, definition, activeTags);
}

/** @param {_PlayerView} current @param {_PlayerView["map"]["nodes"][number]} definition
 * @param {_PlayerView["nodes"][number]["activeTags"]} activeTags */
export function sceneBackground(current, definition, activeTags) {
  const url = sceneUrl(current, definition, activeTags);
  return `linear-gradient(180deg,transparent 12%,rgba(7,10,13,.94)),url('${url}')`;
}

/**
 * @param {_PlayerView["self"]} current
 * @param {NonNullable<_StateDiffMsg["self"]>} patch
 * @returns {_PlayerView["self"]}
 */
export function mergeSelfState(current, patch) {
  const next = { ...current, ...patch };
  if (patch.disasterIntel === null) delete next.disasterIntel;
  if (patch.downedUntilMs === null) delete next.downedUntilMs;
  if (patch.casting === null) delete next.casting;
  if (patch.discomfortUntilMs === null) delete next.discomfortUntilMs;
  return /** @type {_PlayerView["self"]} */ (next);
}

/**
 * Classify a public-demo diff as already applied, exactly next, or missing an intermediate update.
 *
 * @param {number} currentVersion @param {number} incomingVersion
 * @returns {"next" | "stale" | "gap"}
 */
export function classifyDiffVersion(currentVersion, incomingVersion) {
  if (incomingVersion <= currentVersion) return "stale";
  if (incomingVersion === currentVersion + 1) return "next";
  return "gap";
}

/** @param {_PlayerView} current @param {_StateDiffMsg} diff @returns {_PlayerView} */
export function applyDiff(current, diff) {
  const replacements = diff.nodes === undefined
    ? null
    : new Map(diff.nodes.map((node) => [node.id, node]));
  const next = {
    ...current,
    stateVersion: diff.stateVersion,
    gameNowMs: diff.gameNowMs,
    self: diff.self === undefined ? current.self : mergeSelfState(current.self, diff.self),
    visiblePlayers: diff.visiblePlayers ?? current.visiblePlayers,
    nodes: replacements === null
      ? current.nodes
      : current.nodes.map((node) => replacements.get(node.id) ?? node),
    aliveCount: diff.aliveCount ?? current.aliveCount,
    echoCount: diff.echoCount ?? current.echoCount,
    phase: diff.phase ?? current.phase,
  };
  if (diff.legacyPrompt === null) delete next.legacyPrompt;
  else if (diff.legacyPrompt !== undefined) next.legacyPrompt = diff.legacyPrompt;
  if (diff.insightPrompt === null) delete next.insightPrompt;
  else if (diff.insightPrompt !== undefined) next.insightPrompt = diff.insightPrompt;
  if (diff.finale === null) delete next.finale;
  else if (diff.finale !== undefined) next.finale = diff.finale;
  if (diff.encounterPrompt === null) delete next.encounterPrompt;
  else if (diff.encounterPrompt !== undefined) next.encounterPrompt = diff.encounterPrompt;
  const confirmedAttunes = diff.events.flatMap((event) =>
    event.kind === "echo_attuned" && event.player === next.self.playerId && event.firstAttune
      ? [event.node]
      : []
  );
  if (confirmedAttunes.length > 0) {
    next.self = {
      ...next.self,
      attunedNodes: [...new Set([...next.self.attunedNodes, ...confirmedAttunes])],
    };
  }
  return next;
}

/** @param {_PlayerView["phase"]} phase */
export function phaseLabel(phase) {
  return {
    megacity: "MEGA CITY",
    reset: "EXPLOSION RESET",
    darkforest: "DARKFOREST",
    ended: "MATCH ENDED",
  }[phase];
}

/** @param {string} from @param {string} to @param {Record<string, {x: number, y: number}>} positions */
export function edgeStyle(from, to, positions) {
  const a = positions[from] ?? { x: 50, y: 50 };
  const b = positions[to] ?? { x: 50, y: 50 };
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return `left:${a.x}%;top:${a.y}%;width:${Math.hypot(dx, dy)}%;transform:rotate(${
    Math.atan2(dy, dx)
  }rad)`;
}

/** @param {_PlayerView} current @param {_ActionPayload} payload */
export function actionLogText(current, payload) {
  switch (payload.action) {
    case "move":
      return t(payload.style === "sneak" ? "action.name.move_sneak" : "action.name.move_rush", {
        node: narrativeNodeName(current, payload.to),
      });
    case "echo_move":
      return t("action.name.echo_move", { node: narrativeNodeName(current, payload.to) });
    case "search":
      return t("action.name.search");
    case "attack":
      return t("action.name.attack", { target: payload.target });
    case "hide":
      return t("action.name.hide");
    case "use_item":
      return t("action.name.use_item", { item: itemDisplayName(payload.item) });
    case "rescue":
      return t("action.name.rescue", { target: payload.target });
    case "echo_attune":
      return t("action.name.echo_attune");
    case "legacy_select":
      return t("action.name.legacy_select", {
        items: payload.items.map(itemDisplayName).join(t("narrative.list_separator")) ||
          t("action.none.legacy"),
      });
    case "once_ability":
      return t("action.name.once_ability");
    case "equip":
      return t("action.name.equip", { item: itemDisplayName(payload.item) });
    case "unequip":
      return t("action.name.unequip", { slot: t(`action.slot.${payload.slot}`) });
    case "drop":
      return t("action.name.drop", { item: itemDisplayName(payload.item) });
    case "pickup":
      return t("action.name.pickup", { item: itemDisplayName(payload.item) });
    case "insight_select":
      return t("action.name.insight_select", {
        items: payload.items.map(itemDisplayName).join(t("narrative.list_separator")) ||
          t("action.none.insight"),
      });
    case "finale_commit":
      return t(
        payload.mode === "solo"
          ? "action.name.finale_commit_solo"
          : "action.name.finale_commit_arbora",
      );
    case "finale_join":
      return t("action.name.finale_join");
    case "finale_interrupt":
      return t("action.name.finale_interrupt");
    case "finale_cancel":
      return t("action.name.finale_cancel");
    case "encounter_continue":
      return t("action.name.encounter_continue");
    case "shop_buy":
      return t("shop.confirm.buy", {
        item: itemStackDisplayName({
          kind: payload.item,
          count: shopTradeUnitCount(payload.item),
        }),
        price: current.nodes.find((node) => node.id === current.self.node)?.shop?.catalog.find(
          (entry) => entry.item === payload.item,
        )?.buyPrice ?? 0,
      });
    case "shop_sell":
      return t("shop.confirm.sell", {
        item: itemStackDisplayName({
          kind: payload.item,
          count: shopTradeUnitCount(payload.item),
        }),
        price: current.nodes.find((node) => node.id === current.self.node)?.shop?.catalog.find(
          (entry) => entry.item === payload.item,
        )?.sellPrice ?? 0,
      });
  }
}

/** @param {_PreviewContext | null} context */
export function previewContextMarkup(context) {
  if (context === null) return "";
  const adjacent = context.scope === "adjacent-los";
  return `<div class="preview-context">
    <strong>TARGET ${escapeHtml(context.target)} · ${escapeHtml(context.node)}</strong>
    <span class="${adjacent ? "preview-range-adjacent" : "preview-range-local"}">${
    adjacent ? "↗ CROSS-NODE · ADJACENT LOS" : "● SAME NODE"
  }</span>
  </div>`;
}

/** @param {string} warning */
export function previewWarningLine(warning) {
  const known = [
    "UNIDENTIFIED_TARGET",
    "ROOTBOUND_OATH_RISK",
    "ROOTBOUND_OATH_FIRST_STRIKE",
    "CROSS_NODE",
  ];
  return t(known.includes(warning) ? `preview.warning.${warning}` : "preview.warning.fallback");
}

/** @param {_PreviewResponseMsg} preview @param {_PreviewContext | null} context */
export function previewMarkup(preview, context) {
  const contextMarkup = previewContextMarkup(context);
  if (!preview.allowed) {
    return `<div class="preview-result preview-blocked">${contextMarkup}<strong>${
      escapeHtml(t("action.status.preview_blocked"))
    }</strong><p>${escapeHtml(rejectionNarrativeLine(preview.reason))}</p></div>`;
  }
  return `
    <div class="preview-result">
      ${contextMarkup}
      <dl>
        <div><dt>${escapeHtml(t("preview.hitChance"))}</dt><dd>${
    formatBpsPercent(preview.hitChanceBpsMin)
  }–${formatBpsPercent(preview.hitChanceBpsMax)}</dd></div>
        <div><dt>${escapeHtml(t("preview.damage"))}</dt><dd>${preview.damageMin ?? "—"}–${
    preview.damageMax ?? "—"
  }</dd></div>
        <div><dt>${escapeHtml(t("preview.nextShot"))}</dt><dd>${
    preview.cooldownMs === undefined
      ? "—"
      : escapeHtml(t("preview.seconds", { value: (preview.cooldownMs / 1000).toFixed(1) }))
  }</dd></div>
        <div><dt>${escapeHtml(t("preview.signalCost"))}</dt><dd>${
    preview.signalCost ?? "—"
  }</dd></div>
      </dl>
      <ul class="modifier-list">${
    (preview.modifiers ?? []).map((modifier) => {
      const source = previewModifierSourceLabel(modifier.source);
      return `<li><span>${escapeHtml(source)}</span><b>${modifier.bps >= 0 ? "+" : ""}${
        formatBpsPercent(modifier.bps)
      }</b></li>`;
    }).join("")
  }</ul>
      ${
    (preview.warnings ?? []).length === 0
      ? ""
      : `<div class="preview-warnings" role="alert">${
        (preview.warnings ?? []).map((warning) =>
          `<span>⚠ ${escapeHtml(previewWarningLine(warning))}</span>`
        ).join("")
      }</div>`
  }
    </div>
  `;
}

/** @param {_MatchEvent} event */
export function eventImage(event) {
  switch (event.kind) {
    case "combat":
      return isMeleeWeapon(event.weapon) ? "combat-close.webp" : "combat-ranged.webp";
    case "player_downed":
      return "downed-rescue.webp";
    case "player_echoed":
    case "echo_returned":
      return "echo-return.webp";
    case "hazard_triggered":
    case "hazard_revealed":
      return event.hazard === "slip" ? "hazard-slip.webp" : "hazard-conductive-puddle.webp";
    case "legacy_locked":
      return "legacy-lock.webp";
    case "blockade_preview":
    case "blockade_closed":
      return "blockade.webp";
    case "final_reckoning":
    case "sudden_death_started":
      return "final-reckoning.webp";
    case "finale_offer_started":
    case "finale_joined":
    case "finale_channel_started":
    case "finale_interrupted":
      return "final-reckoning.webp";
    case "finale_claimed":
    case "finale_completed":
    case "match_ended":
      return "victory-survivor.webp";
    case "search_result":
      return event.found?.kind === "scrap"
        ? "search-maintenance-scrap.webp"
        : "search-seed-cache.webp";
    default:
      return null;
  }
}

/** @param {_PlayerView} current */
export function finaleRequiresInput(current) {
  if (current.finale === undefined) return false;
  const availability = finaleActionAvailability(current);
  return availability.canJoin || availability.canInterrupt || availability.canCancel;
}

/** @param {unknown} profession */
export function tacticalProfessionFigure(profession) {
  if (profession === "courier" || profession === "scavenger" || profession === "enforcer") {
    return PROFESSION_ART[profession].card;
  }
  return null;
}

/**
 * Keep contact art inside the fog-of-war contract. An unidentified contact always
 * receives the neutral figure, even if a malformed object happens to carry a
 * background field. Profession is intentionally never inferred here.
 * @param {{identified?: unknown, background?: unknown} | null | undefined} _player
 */
export function tacticalContactFigure(_player) {
  return "/art/placeholders/contact.svg";
}

/** @param {_PlayerView} current */
export function tacticalArenaModel(current) {
  const definition = current.map.nodes.find((node) => node.id === current.self.node);
  const node = current.nodes.find((candidate) => candidate.id === current.self.node);
  const visibleHere = current.visiblePlayers.filter((player) => player.node === current.self.node);
  return {
    phase: worldPhase(current.phase),
    node: {
      id: current.self.node,
      displayName: narrativeNodeName(current, current.self.node),
    },
    tags: node?.activeTags ?? [],
    coverSlots: definition?.coverSlots ?? 0,
    coverSlotsFree: node?.coverSlotsFree ?? 0,
    hazards: (node?.knownHazards ?? []).map((hazard) => hazard.kind),
    self: {
      ref: current.self.playerId,
      playerId: current.self.playerId,
      node: current.self.node,
      hp: current.self.hp,
      signal: current.self.signal,
      stamina: current.self.stamina,
      status: current.self.status,
      hidden: current.self.hidden,
      equippedWeapon: current.self.equippedWeapon === null
        ? null
        : { kind: current.self.equippedWeapon },
      armor: { value: current.self.armor },
    },
    visiblePlayers: visibleHere.map((player) => ({
      ref: player.ref,
      ...(player.identified && player.playerId !== undefined ? { playerId: player.playerId } : {}),
      identified: player.identified,
      node: player.node,
      status: player.status,
      equippedWeapon: player.equippedWeapon === null ? null : { kind: player.equippedWeapon },
      armorSilhouette: player.armorSilhouette,
      ...(player.identified && player.level !== undefined ? { level: player.level } : {}),
    })),
  };
}

/** @param {_PlayerView} current @param {_CombatBlock} block */
export function tacticalArenaCombatBlockText(current, block) {
  if (block === "PENDING") return t("hud.lock.pending");
  if (block === "CASTING") {
    return t(
      current.self.casting?.item === "healthy_food" ||
        current.self.casting?.item === "spoiled_food"
        ? "hud.lock.eating"
        : "hud.lock.treating",
    );
  }
  if (block === "STATUS") return t("hud.combat.block.status");
  if (block === "SPAWN_GRACE") return t("hud.combat.block.spawnGrace");
  if (block === "COOLDOWN") return t("hud.lock.notYet");
  if (block === null) return "";
  return rejectionNarrativeLine(block);
}

/** @param {_PlayerView} current */
export function tacticalArenaExitProjection(current) {
  const projection = projectTacticalArenaExits({
    selfNodeId: current.self.node,
    map: current.map,
    nodes: current.nodes,
    phase: current.phase,
  });
  /** @param {ReturnType<typeof projectTacticalArenaExits>["up"]} exit */
  const localizedExit = (exit) =>
    exit === null ? null : { ...exit, displayName: localizedPlaceName(exit.displayName) };
  return {
    up: localizedExit(projection.up),
    right: localizedExit(projection.right),
    down: localizedExit(projection.down),
    left: localizedExit(projection.left),
    overflow: projection.overflow.map((exit) => ({
      ...exit,
      displayName: localizedPlaceName(exit.displayName),
    })),
  };
}

/** @param {_PlayerView} current @param {import("@darkforest/protocol").VisiblePlayer} target */
export function tacticalArenaTargetInEncounter(current, target) {
  const refs = current.encounterPrompt?.targetRefs ?? [];
  return refs.includes(target.ref) ||
    (target.contactRef !== undefined && refs.includes(target.contactRef));
}

/** @param {_PlayerView} current @param {import("@darkforest/protocol").VisiblePlayer} target */
export function tacticalArenaTargetDetail(current, target) {
  const scope = target.node === current.self.node
    ? t("hud.combat.scope.sameNode")
    : t("hud.combat.scope.adjacentLos");
  const weapon = target.equippedWeapon === null
    ? t("situation.silhouette.unarmed")
    : itemDisplayName(target.equippedWeapon);
  const level = identifiedPlayerLevel(target);
  return `${scope} · ${armorSilhouetteLabel(target.armorSilhouette)} · ${weapon}${
    level === null ? "" : ` · ${t("hud.level.badge", { level })}`
  }`;
}
