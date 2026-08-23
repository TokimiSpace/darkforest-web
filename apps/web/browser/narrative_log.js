// @ts-check
import { t } from "./i18n.js";

/** @typedef {import("@darkforest/protocol").MatchEvent} MatchEvent */
/** @typedef {import("@darkforest/protocol").NodeId} NodeId */
/** @typedef {import("@darkforest/protocol").PlayerView} PlayerView */
/** @typedef {import("@darkforest/protocol").Tag} Tag */

/** @typedef {"self" | "witness" | "broadcast"} NarrativeLevel */
/** @typedef {"story" | "action" | "chat" | "system"} NarrativeKind */
/** @typedef {"pending" | "ready" | "resolved" | "rejected"} NarrativeStatus */

// PlayerView does not expose this UI threshold; keep public presentation on one frozen constant.
export const ECHO_TWO_INSIGHT_TARGET = 10;
/**
 * @typedef {object} NarrativeEntry
 * @property {string} id
 * @property {number} atGameMs
 * @property {NarrativeLevel} level
 * @property {string} text
 * @property {boolean} fatal
 * @property {"event" | "derived"} source
 * @property {MatchEvent=} event
 * @property {string=} dedupeKey
 * @property {NarrativeKind=} kind
 * @property {NarrativeStatus=} status
 * @property {string=} label
 * @property {string=} speaker
 * @property {number=} wallTimeMs
 */
/**
 * @typedef {object} NarrativeContext
 * @property {PlayerView} view
 * @property {number} atGameMs
 * @property {string} idPrefix
 * @property {string=} legacyItem
 * @property {boolean=} oathBrokenByContact
 * @property {NodeId=} previousNode
 * @property {string[]=} previousFinaleParticipants
 * @property {string[]=} finaleAffectedPlayers
 * @property {boolean=} finaleDamageHasCombat
 * @property {import("@darkforest/protocol").ItemKind[]=} shopBoughtItems
 */

// 局內文案一律走 locales/match.<locale>.json,render 時以 t() 取字。
// 本檔不再保存句面字串,只保存「哪些 key 存在」的集合與模板參數組裝邏輯;
// 未知代碼/id 依原行為回傳 fallback 或 null,不落到 raw key。

const TAG_KINDS = new Set([
  "CRAMPED",
  "COVERED",
  "OPEN",
  "DENSE",
  "DARK",
  "DEBRIS",
  "WET",
  "MUD",
  "POWERED",
]);

const EDGE_FLAVOR_IDS = new Set(["e1", "e2", "e3", "e4", "e5", "e6", "e7", "r1"]);

/**
 * Protocol/topology place names remain stable English identities because art lookup, replay and
 * validation depend on them. Player-facing copy resolves those identities through this table.
 * Legacy six-node fixtures still use Service Tunnel/Buried Passage, so they stay covered too.
 * @type {Readonly<Record<string, string>>}
 */
export const PLACE_NAME_I18N_KEYS = Object.freeze({
  "Red Root": "place.red_root",
  "Arbora Rootheart": "place.arbora_rootheart",
  "Maintenance Ring": "place.maintenance_ring",
  "Field Workshop": "place.field_workshop",
  Waterworks: "place.waterworks",
  "Blackwater Marsh": "place.blackwater_marsh",
  "Luxury Atrium": "place.luxury_atrium",
  "Flooded Atrium": "place.flooded_atrium",
  "Civic Archive": "place.civic_archive",
  "Buried Archive": "place.buried_archive",
  "Council Spire": "place.council_spire",
  "Canopy Spire": "place.canopy_spire",
  "Broadcast Hall": "place.broadcast_hall",
  "Whisper Hall": "place.whisper_hall",
  "Seed Vault": "place.seed_vault",
  "Last Farm": "place.last_farm",
  "Weather Tower": "place.weather_tower",
  Stormperch: "place.stormperch",
  "Freight Well": "place.freight_well",
  "Hollow Well": "place.hollow_well",
  "Border Barracks": "place.border_barracks",
  "Fallen Watch": "place.fallen_watch",
  "Escape Rail": "place.escape_rail",
  "Rust Line": "place.rust_line",
  "Service Tunnel": "place.service_tunnel",
  "Buried Passage": "place.buried_passage",
});

// 耐久歸零不另增 protocol event；只在同一批 self combat + inventory diff 同時成立時
// 合成敘事，避免把丟棄、Reset 或 Legacy 造成的物品消失誤報為損毀。
const BREAKABLE_WEAPON_KINDS = new Set(["tool", "cleaver", "stool", "golf_club"]);

const REJECTION_CODES = new Set([
  "COOLDOWN_ACTIVE",
  "NOT_ADJACENT",
  "RANGE_LOS",
  "BLOCKED_EDGE",
  "STYLE_NOT_ALLOWED",
  "NO_STAMINA",
  "NO_RECOVERY_NEEDED",
  "NO_AMMO",
  "NO_ITEM",
  "NO_DURABILITY",
  "NO_COVER_SLOT",
  "NO_SEARCHES_LEFT",
  "SPAWN_GRACE",
  "TARGET_HIDDEN",
  "INVALID_TARGET",
  "CAPACITY_FULL",
  "NOT_EQUIPPABLE",
  "CACHE_PRIORITY",
  "NO_CACHE",
  "WRONG_STATUS",
  "WRONG_PHASE",
  "STALE_VERSION",
  "NO_ECHO_TRACE",
  "FINALE_LOCKED",
  "FINALE_CONTESTED",
  "RITUAL_REQUIREMENTS",
  "OFFER_EXPIRED",
  "NO_CREDITS",
  "NO_STOCK",
]);

/** Public rejection-message projection. @param {string | undefined} errorCode @param {{shoe?: boolean}=} options */
export function rejectionNarrativeLine(errorCode, options = {}) {
  if (errorCode === "NOT_EQUIPPABLE" && options.shoe === true) {
    return t("narrative.rejection.not_equippable_shoe");
  }
  if (errorCode === "NO_CREDITS") return t("shop.error.noCredits");
  if (errorCode === "NO_STOCK") return t("shop.error.noStock");
  return errorCode !== undefined && REJECTION_CODES.has(errorCode)
    ? t(`narrative.rejection.${errorCode.toLowerCase()}`)
    : t("narrative.rejection.fallback");
}

/**
 * Keep the attempted action in a rejected receipt. A bare reason such as "not yet" is not
 * intelligible once the action drawer moves or collapses on a small screen.
 * @param {string} action
 * @param {string} reason
 */
export function rejectedActionReceiptLine(action, reason) {
  return t("action.receipt.rejected", { action, reason });
}

/**
 * Project the ending card from the authoritative match_ended payload plus the final self
 * snapshot. The recent journey is deliberately limited to self-facing server events already
 * retained by this client; it is not presented as a complete match replay.
 * @param {Extract<MatchEvent, {kind: "match_ended"}>} event
 * @param {PlayerView["self"]} self
 * @param {NarrativeEntry[]} entries
 * @param {number=} limit
 */
export function projectAuthoritativeEnding(event, self, entries, limit = 3) {
  const recentJourney = entries.filter((candidate) =>
    candidate.source === "event" && candidate.level === "self" &&
    candidate.event !== undefined && candidate.event.kind !== "match_ended"
  ).slice(-Math.max(0, limit)).map((candidate) =>
    Object.freeze({
      atGameMs: candidate.atGameMs,
      kind: candidate.event?.kind ?? "unknown",
      text: candidate.text,
    })
  );
  return Object.freeze({
    ending: event.ending,
    reason: event.reason,
    winners: Object.freeze([...event.winners]),
    selfIsWinner: event.winners.includes(self.playerId),
    status: self.status,
    level: self.level,
    node: self.node,
    recentJourney: Object.freeze(recentJourney),
  });
}

/**
 * Cache ownership only exists while its authoritative deadline is in the future.
 * `priorityFor` can contain the defeated player as a required protocol placeholder for an
 * immediately-open hazard cache, so comparing the owner without the deadline is never valid.
 *
 * @param {string} priorityFor
 * @param {number} untilMs
 * @param {string} playerId
 * @param {number} gameNowMs
 * @returns {"yours" | "reserved" | "open"}
 */
export function cachePriorityState(priorityFor, untilMs, playerId, gameNowMs) {
  if (untilMs <= gameNowMs) return "open";
  return priorityFor === playerId ? "yours" : "reserved";
}

/** Public route-flavor projection. @param {string} edgeId */
export function edgeFlavorLine(edgeId) {
  return EDGE_FLAVOR_IDS.has(edgeId) ? t(`narrative.edge.${edgeId}`) : null;
}

/** @param {number} gameMs */
export function formatNarrativeTimestamp(gameMs) {
  const totalSeconds = Math.max(0, Math.floor(gameMs / 1000));
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${
    String(totalSeconds % 60).padStart(2, "0")
  }`;
}

/** @param {number} gameMs */
function formatCountdown(gameMs) {
  const totalSeconds = Math.max(0, Math.ceil(gameMs / 1000));
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${
    String(totalSeconds % 60).padStart(2, "0")
  }`;
}

/**
 * Resolve one canonical topology/art name for the active player language. Unknown names stay
 * readable instead of leaking a raw translation key when future maps arrive ahead of Web copy.
 * @param {string} canonicalName
 */
export function localizedPlaceName(canonicalName) {
  const key = PLACE_NAME_I18N_KEYS[canonicalName];
  return key === undefined ? canonicalName : t(key);
}

/** @param {PlayerView} view @param {NodeId} node */
export function narrativeNodeName(view, node) {
  const definition = view.map.nodes.find((candidate) => candidate.id === node);
  if (definition === undefined) return node;
  const canonicalName = worldPhase(view.phase) === "darkforest"
    ? definition.nameDarkforest
    : definition.nameMegaCity;
  return localizedPlaceName(canonicalName);
}

/** Reset 沿用 Mega City；ended 在公開展示中使用 Darkforest。 @param {PlayerView["phase"]} phase */
export function worldPhase(phase) {
  return phase === "darkforest" || phase === "ended" ? "darkforest" : "megacity";
}

/**
 * 2.5D arena art is keyed by the semantic place name, never the shuffled runtime
 * node id. Both faces of every public-demo location have their own composition.
 * @type {Record<string, string>}
 */
const ARENA_SCENE_URLS_BY_NAME = {
  "Red Root": "/art/placeholders/scene.svg",
  "Arbora Rootheart": "/art/placeholders/scene.svg",
  "Maintenance Ring": "/art/placeholders/scene.svg",
  "Field Workshop": "/art/placeholders/scene.svg",
  Waterworks: "/art/placeholders/scene.svg",
  "Blackwater Marsh": "/art/placeholders/scene.svg",
  "Luxury Atrium": "/art/placeholders/scene.svg",
  "Flooded Atrium": "/art/placeholders/scene.svg",
  "Civic Archive": "/art/placeholders/scene.svg",
  "Buried Archive": "/art/placeholders/scene.svg",
  "Council Spire": "/art/placeholders/scene.svg",
  "Canopy Spire": "/art/placeholders/scene.svg",
  "Broadcast Hall": "/art/placeholders/scene.svg",
  "Whisper Hall": "/art/placeholders/scene.svg",
  "Seed Vault": "/art/placeholders/scene.svg",
  "Last Farm": "/art/placeholders/scene.svg",
  "Weather Tower": "/art/placeholders/scene.svg",
  Stormperch: "/art/placeholders/scene.svg",
  "Freight Well": "/art/placeholders/scene.svg",
  "Hollow Well": "/art/placeholders/scene.svg",
  "Border Barracks": "/art/placeholders/scene.svg",
  "Fallen Watch": "/art/placeholders/scene.svg",
  "Escape Rail": "/art/placeholders/scene.svg",
  "Rust Line": "/art/placeholders/scene.svg",
};

const ARENA_PHASE_FALLBACK = {
  megacity: "/art/placeholders/scene.svg",
  darkforest: "/art/placeholders/scene.svg",
};

/**
 * Resolve an approved public-demo arena backdrop from a semantic display name.
 * @param {Pick<PlayerView, "phase">} view
 * @param {{displayName?: string, nameMegaCity?: string, nameDarkforest?: string}} definition
 * @returns {string}
 */
export function arenaSceneUrl(view, definition) {
  const phase = worldPhase(view.phase);
  const name = definition.displayName ??
    (phase === "darkforest" ? definition.nameDarkforest : definition.nameMegaCity);
  return (name === undefined ? undefined : ARENA_SCENE_URLS_BY_NAME[name]) ??
    ARENA_PHASE_FALLBACK[phase];
}

/** @param {Tag[]} tags */
export function narrativeTagAdjectives(tags) {
  return tags.slice(0, 2)
    .filter((tag) => TAG_KINDS.has(tag))
    .map((tag) => t(`tag.${tag}`))
    .join(t("narrative.list_separator"));
}

// ---------- Scene resolution: semantic node names are the stable presentation key ----------

/**
 * node name 是地點的穩定語意鍵；public-demo node id 只適合連線內引用，
 * 不可拿來查找展示素材。fixture 內的名稱一律走此表，不需 id 相容層。
 * @type {Record<string, string>}
 */
const SCENE_URLS_BY_NAME = {
  "Red Root": "/art/placeholders/scene.svg",
  "Arbora Rootheart": "/art/placeholders/scene.svg",
  "Maintenance Ring": "/art/placeholders/scene.svg",
  "Field Workshop": "/art/placeholders/scene.svg",
  Waterworks: "/art/placeholders/scene.svg",
  "Blackwater Marsh": "/art/placeholders/scene.svg",
  "Luxury Atrium": "/art/placeholders/scene.svg",
  "Flooded Atrium": "/art/placeholders/scene.svg",
  "Service Tunnel": "/art/placeholders/scene.svg",
  "Buried Passage": "/art/placeholders/scene.svg",
  "Seed Vault": "/art/placeholders/scene.svg",
  "Last Farm": "/art/placeholders/scene.svg",
};

/**
 * Tag-derived fallback, evaluated in order. It affects presentation only and never changes the
 * protocol meaning of a tag or any authoritative state.
 * @type {ReadonlyArray<{match: (tags: Set<Tag>) => boolean, megacity: string, darkforest: string}>}
 */
const TAG_FALLBACK_RULES = [
  {
    match: (tags) => tags.has("OPEN") && tags.has("DARK"),
    megacity: "/art/placeholders/scene.svg",
    darkforest: "/art/placeholders/scene.svg",
  },
  {
    match: (tags) => tags.has("OPEN") && (tags.has("POWERED") || tags.has("WET")),
    megacity: "/art/placeholders/scene.svg",
    darkforest: "/art/placeholders/scene.svg",
  },
  {
    match: (tags) => tags.has("COVERED") && tags.has("DENSE"),
    megacity: "/art/placeholders/scene.svg",
    darkforest: "/art/placeholders/scene.svg",
  },
  {
    match: (tags) => tags.has("CRAMPED") || tags.has("DEBRIS"),
    megacity: "/art/placeholders/scene.svg",
    darkforest: "/art/placeholders/scene.svg",
  },
];

/** 上表全不中時的「其他」列(仍是張既有場景圖,不是空值)。 @type {{megacity: string, darkforest: string}} */
const TAG_FALLBACK_DEFAULT = {
  megacity: "/art/placeholders/scene.svg",
  darkforest: "/art/placeholders/scene.svg",
};

/** @param {"megacity" | "darkforest"} phase @param {Tag[]} tags */
function tagFallbackSceneUrl(phase, tags) {
  const tagSet = new Set(tags);
  const rule = TAG_FALLBACK_RULES.find((candidate) => candidate.match(tagSet));
  return (rule ?? TAG_FALLBACK_DEFAULT)[phase];
}

/**
 * 場景解析唯一入口:name-keyed 命中專屬圖;缺專屬圖時依 activeTags 走派生
 * fallback——恆回傳一張既有場景圖,不回傳 null、不落到單張 phase fallback。
 * @param {Pick<PlayerView, "phase">} view
 * @param {Pick<PlayerView["map"]["nodes"][number], "nameMegaCity" | "nameDarkforest">} definition
 * @param {Tag[]} activeTags
 * @returns {string}
 */
export function sceneUrl(view, definition, activeTags) {
  const phase = worldPhase(view.phase);
  const name = phase === "darkforest" ? definition.nameDarkforest : definition.nameMegaCity;
  return SCENE_URLS_BY_NAME[name] ?? tagFallbackSceneUrl(phase, activeTags);
}

// kind→顯示名對照表位於 catalog(key 形如 `item.tool`);
// 此集合只決定哪些 kind 有 catalog 條目,未知 kind 原樣回傳。
const ITEM_KINDS = new Set([
  "tool",
  "pistol",
  "rifle",
  "cleaver",
  "stool",
  "golf_club",
  "light_ammo",
  "bandage",
  "medkit",
  "healthy_food",
  "spoiled_food",
  "scrap",
  "trap_scanner",
  "insight_root_sense",
  "insight_calamity_echo",
  "cloth_jacket",
  "stab_jacket",
  "composite_chest",
  "work_helmet",
  "nvg_helmet",
  "work_pants",
  "rough_gloves",
  "labor_gloves",
  "leather_gloves",
  "small_backpack",
  "large_backpack",
  "soft_sole",
  "steel_toe",
]);

/** @param {import("@darkforest/protocol").ItemKind} kind */
export function itemDisplayName(kind) {
  return ITEM_KINDS.has(kind) ? t(`item.${kind}`) : kind;
}

/** @param {import("@darkforest/protocol").ItemStack} item */
export function itemStackDisplayName(item) {
  const name = itemDisplayName(item.kind);
  return item.count === 1 ? name : t("item.stack", { item: name, count: item.count });
}

/** @param {import("@darkforest/protocol").ItemKind} kind */
export function equipmentSlotForItem(kind) {
  if (kind === "work_helmet" || kind === "nvg_helmet") return "helmet";
  if (["cloth_jacket", "stab_jacket", "composite_chest"].includes(kind)) return "jacket";
  if (kind === "work_pants") return "pants";
  if (["rough_gloves", "labor_gloves", "leather_gloves"].includes(kind)) return "gloves";
  if (kind === "soft_sole" || kind === "steel_toe") return "shoes";
  if (kind === "small_backpack" || kind === "large_backpack") return "backpack";
  return null;
}

/** Public equipment-message projection. @param {import("@darkforest/protocol").ItemKind} kind */
export function equipmentNarrativeLine(kind) {
  switch (kind) {
    case "cloth_jacket":
    case "stab_jacket":
    case "composite_chest":
    case "work_helmet":
    case "nvg_helmet":
    case "work_pants":
      return t(`narrative.equip.${kind}`);
    case "rough_gloves":
    case "labor_gloves":
    case "leather_gloves":
      return t("narrative.equip.gloves");
    case "small_backpack":
    case "large_backpack":
      return t("narrative.equip.backpack");
    case "soft_sole":
    case "steel_toe":
      return t("narrative.equip.shoes", { item: itemDisplayName(kind) });
    default:
      return t("narrative.equip.default", { item: itemDisplayName(kind) });
  }
}

/** Public item-use message projection. @param {import("@darkforest/protocol").ItemKind} item */
export function itemUseNarrativeLine(item) {
  return item === "scrap" ? t("narrative.item_use.scrap") : null;
}

/** @param {import("@darkforest/protocol").ItemStack[]} inventory */
export function openingLoadoutNarrative(inventory) {
  /** @type {string[]} */
  const randomPicks = [];
  for (const item of inventory.filter((candidate) => candidate.kind !== "tool")) {
    const unitCount = item.kind === "light_ammo" ? 6 : 1;
    const draws = Math.max(1, Math.floor(item.count / unitCount));
    for (let index = 0; index < draws && randomPicks.length < 2; index++) {
      randomPicks.push(
        itemStackDisplayName({ ...item, count: unitCount }),
      );
    }
    if (randomPicks.length === 2) break;
  }
  if (randomPicks.length < 2) return null;
  return t("narrative.opening_loadout", {
    items: randomPicks.join(t("narrative.list_separator")),
  });
}

/**
 * @param {NarrativeContext} context
 * @param {number} index
 * @param {NarrativeLevel} level
 * @param {string} text
 * @param {Partial<Pick<NarrativeEntry, "fatal" | "source" | "event" | "dedupeKey">>=} extra
 * @returns {NarrativeEntry}
 */
function entry(context, index, level, text, extra = {}) {
  return {
    id: `${context.idPrefix}-${index}`,
    atGameMs: context.atGameMs,
    level,
    text,
    fatal: extra.fatal ?? false,
    source: extra.source ?? "event",
    ...(extra.event === undefined ? {} : { event: extra.event }),
    ...(extra.dedupeKey === undefined ? {} : { dedupeKey: extra.dedupeKey }),
  };
}

/** @param {string} value */
function isPlayerId(value) {
  return value !== "zone" && value !== "timeout";
}

/** @param {string} value */
export function isContactRef(value) {
  return value.startsWith("C-");
}

/** @param {string} value */
function narrativePlayerName(value) {
  return isContactRef(value) ? t("narrative.fog.figure") : value;
}

const COMBAT_NARRATIVE_EVENT_KINDS = new Set([
  "combat",
  "player_downed",
  "player_echoed",
  "player_eliminated",
  "armor_broken",
]);

/**
 * 固定戰鬥紀錄只投影與本人直接相關的事件。擊倒／Echo／淘汰同時把 `by` 視為關聯，
 * 讓玩家造成的結果不會從自己的戰鬥歷程消失。
 * @param {NarrativeEntry} candidate
 * @param {string} playerId
 */
export function combatNarrativeEntryInvolvesPlayer(candidate, playerId) {
  const event = candidate.event;
  if (event === undefined || !COMBAT_NARRATIVE_EVENT_KINDS.has(event.kind)) return false;
  switch (event.kind) {
    case "combat":
      return event.attacker === playerId || event.target === playerId;
    case "player_downed":
    case "player_echoed":
    case "player_eliminated":
      return event.player === playerId || event.by === playerId;
    case "armor_broken":
      return event.player === playerId;
    default:
      return false;
  }
}

/** @param {NarrativeEntry[]} entries @param {string} playerId @param {number=} limit */
export function personalCombatNarrativeEntries(entries, playerId, limit = 8) {
  return entries.filter((candidate) => combatNarrativeEntryInvolvesPlayer(candidate, playerId))
    .slice(-Math.max(0, limit));
}

/** @param {MatchEvent & {kind: "combat"}} event */
function combatNoiseLoudness(event) {
  return event.weapon === "pistol" || event.weapon === "rifle" ? 20 : 15;
}

/** @param {MatchEvent & {kind: "combat"}} event @param {PlayerView} view */
function distantCombatLine(event, view) {
  const direction = narrativeNodeName(view, event.sourceNode);
  return combatNoiseLoudness(event) === 20
    ? t("narrative.noise.gunshot", { direction })
    : t("narrative.noise.metal", { direction });
}

/**
 * Public encounter target description. Identified contacts expose only their visible name;
 * 未辨識者只使用投影後的武器／護甲輪廓，絕不回顯 contact ref。
 * @param {import("@darkforest/protocol").VisiblePlayer | undefined} player
 */
function encounterTargetDescription(player) {
  if (player?.identified === true) return player.playerId;
  if (player === undefined) return t("narrative.fog.figure");
  const weapon = player.equippedWeapon === null
    ? t("narrative.silhouette.unarmed")
    : t("narrative.silhouette.weapon_outline", { item: itemDisplayName(player.equippedWeapon) });
  const armor = t(`armor.${player.armorSilhouette}`);
  return t("narrative.silhouette.description", { weapon, armor });
}

/**
 * `cacheOwner` is derived only from events already visible in the same public-demo batch.
 * Ambiguous states use non-identifying copy.
 *
 * @param {MatchEvent} event
 * @param {NarrativeContext} context
 * @param {number} index
 * @param {string=} cacheOwner
 * @returns {NarrativeEntry | null}
 */
export function eventToNarrative(event, context, index, cacheOwner) {
  const self = context.view.self.playerId;
  const selfNode = context.view.self.node;
  const delayedSpectator = context.view.self.status === "eliminated";
  const eventExtra = { event };
  switch (event.kind) {
    case "combat":
      if (event.attacker === self) {
        return entry(
          context,
          index,
          "self",
          event.hit
            ? t("narrative.combat.self_hit", {
              weapon: itemDisplayName(event.weapon),
              target: narrativePlayerName(event.target),
              damage: event.damage,
            })
            : t("narrative.combat.self_miss", { weapon: itemDisplayName(event.weapon) }),
          eventExtra,
        );
      }
      if (event.target === self) {
        return entry(
          context,
          index,
          "self",
          event.hit
            ? t("narrative.combat.hit_by", {
              attacker: narrativePlayerName(event.attacker),
              weapon: itemDisplayName(event.weapon),
              damage: event.damage,
            })
            : t("narrative.combat.missed_by", {
              attacker: narrativePlayerName(event.attacker),
              weapon: itemDisplayName(event.weapon),
            }),
          eventExtra,
        );
      }
      if (delayedSpectator || event.sourceNode === selfNode || event.targetNode === selfNode) {
        return entry(
          context,
          index,
          "witness",
          t("narrative.combat.witness_exchange", {
            attacker: narrativePlayerName(event.attacker),
            target: narrativePlayerName(event.target),
          }),
          eventExtra,
        );
      }
      return entry(context, index, "witness", distantCombatLine(event, context.view), {
        ...eventExtra,
        dedupeKey: `noise:${combatNoiseLoudness(event)}`,
      });

    case "player_downed":
      if (event.player === self) {
        return entry(
          context,
          index,
          "self",
          event.by === undefined
            ? t("narrative.downed.self_unknown")
            : t("narrative.downed.self_by", { by: narrativePlayerName(event.by) }),
          { ...eventExtra, fatal: true },
        );
      }
      if (!delayedSpectator && event.by !== self && event.node !== selfNode) {
        return entry(context, index, "witness", t("narrative.distant_cry"), {
          ...eventExtra,
          dedupeKey: "combat:distant-cry",
        });
      }
      return entry(
        context,
        index,
        "witness",
        event.by === undefined
          ? t("narrative.downed.witness_unknown", { player: narrativePlayerName(event.player) })
          : t("narrative.downed.witness_by", {
            player: narrativePlayerName(event.player),
            by: narrativePlayerName(event.by),
          }),
        eventExtra,
      );

    case "player_echoed":
      if (event.player === self) {
        return entry(
          context,
          index,
          "self",
          event.by === undefined
            ? t("narrative.echoed.self_unknown")
            : t("narrative.echoed.self_by", { by: narrativePlayerName(event.by) }),
          { ...eventExtra, fatal: true },
        );
      }
      if (!delayedSpectator && event.by !== self && event.node !== selfNode) {
        return entry(context, index, "witness", t("narrative.distant_cry"), {
          ...eventExtra,
          dedupeKey: "combat:distant-cry",
        });
      }
      return entry(
        context,
        index,
        "witness",
        t("narrative.echoed.witness", { player: narrativePlayerName(event.player) }),
        eventExtra,
      );

    case "player_eliminated": {
      if (event.player === self) {
        const cause = isPlayerId(event.by)
          ? t("narrative.eliminated.self_by", { by: narrativePlayerName(event.by) })
          : event.by === "zone"
          ? t("narrative.eliminated.self_zone")
          : t("narrative.eliminated.self_timeout");
        return entry(context, index, "self", cause, {
          ...eventExtra,
          fatal: true,
        });
      }
      if (!delayedSpectator && event.by !== self && event.node !== selfNode) {
        return entry(context, index, "witness", t("narrative.distant_cry"), {
          ...eventExtra,
          dedupeKey: "combat:distant-cry",
        });
      }
      const params = {
        player: narrativePlayerName(event.player),
        aliveCount: context.view.aliveCount,
      };
      return entry(
        context,
        index,
        "broadcast",
        isPlayerId(event.by)
          ? t("narrative.eliminated.broadcast_by", {
            ...params,
            by: narrativePlayerName(event.by),
          })
          : event.by === "zone"
          ? t("narrative.eliminated.broadcast_zone", params)
          : t("narrative.eliminated.broadcast_timeout", params),
        eventExtra,
      );
    }

    case "echo_returned":
      return event.player === self
        ? entry(
          context,
          index,
          "self",
          t("narrative.echo_returned.self", {
            hp: context.view.self.hp,
            insights: event.insights,
          }),
          { ...eventExtra, fatal: true },
        )
        : entry(
          context,
          index,
          "broadcast",
          t("narrative.echo_returned.broadcast", { player: narrativePlayerName(event.player) }),
          { ...eventExtra, fatal: true },
        );

    case "search_result":
      return entry(
        context,
        index,
        "self",
        event.found === null
          ? t("narrative.search.empty")
          : t("narrative.search.found", { item: itemStackDisplayName(event.found) }),
        eventExtra,
      );

    case "recovery_completed": {
      if (event.player !== self) return null;
      const text = event.item === "bandage"
        ? t("narrative.recovery.bandage", { hpGained: event.hpGained })
        : event.item === "medkit"
        ? t("narrative.recovery.medkit", { hpGained: event.hpGained })
        : event.item === "healthy_food"
        ? t("narrative.recovery.healthy_food", {
          hpGained: event.hpGained,
          staminaGained: event.staminaGained,
        })
        : t("narrative.recovery.spoiled_food", {
          staminaGained: event.staminaGained,
          seconds: Math.max(
            0,
            Math.ceil(((event.discomfortUntilMs ?? context.atGameMs) - context.atGameMs) / 1_000),
          ),
        });
      return entry(context, index, "self", text, eventExtra);
    }

    case "level_up":
      if (event.player !== self) return null;
      return entry(
        context,
        index,
        "self",
        event.level >= context.view.progressionRules.levelCap
          ? t("narrative.levelUp.max", { level: event.level })
          : t("narrative.levelUp.line", {
            level: event.level,
            hp: event.hpGained,
          }),
        eventExtra,
      );

    case "injury_inflicted":
      if (event.player !== self) return null;
      return entry(
        context,
        index,
        "self",
        event.source === "combat"
          ? t(`narrative.injury.combat.${event.part}`)
          : t(`narrative.injury.${event.source}`),
        eventExtra,
      );

    case "injury_cured":
      if (event.player !== self) return null;
      return entry(
        context,
        index,
        "self",
        t(`narrative.injuryCured.${event.part}`),
        eventExtra,
      );

    case "got_lost":
      if (event.player !== self) return null;
      return entry(
        context,
        index,
        "self",
        context.previousNode !== undefined && event.actual === context.previousNode
          ? t("narrative.got_lost.foldback")
          : t("narrative.got_lost.detour", {
            intended: narrativeNodeName(context.view, event.intended),
            actual: narrativeNodeName(context.view, event.actual),
          }),
        eventExtra,
      );

    case "equipped":
      if (
        event.player === self && context.shopBoughtItems?.includes(event.item) === true
      ) return null;
      return event.player === self
        ? entry(context, index, "self", equipmentNarrativeLine(event.item), eventExtra)
        : entry(
          context,
          index,
          "witness",
          t("narrative.equipped.witness", {
            player: narrativePlayerName(event.player),
            item: itemDisplayName(event.item),
          }),
          eventExtra,
        );

    case "armor_broken":
      return event.player === self
        ? entry(
          context,
          index,
          "self",
          t("narrative.armor_broken.self", { item: itemDisplayName(event.item) }),
          eventExtra,
        )
        : entry(
          context,
          index,
          "witness",
          t("narrative.armor_broken.witness", {
            player: narrativePlayerName(event.player),
            item: itemDisplayName(event.item),
          }),
          eventExtra,
        );

    case "item_dropped":
      return event.player === self
        ? entry(
          context,
          index,
          "self",
          t("narrative.item_dropped.self", {
            item: itemDisplayName(event.item),
            node: narrativeNodeName(context.view, event.node),
          }),
          eventExtra,
        )
        : entry(
          context,
          index,
          "witness",
          t("narrative.item_dropped.witness", {
            player: narrativePlayerName(event.player),
            item: itemDisplayName(event.item),
          }),
          eventExtra,
        );

    case "hide_result":
      return entry(
        context,
        index,
        "self",
        event.success ? t("narrative.hide.success") : t("narrative.hide.fail"),
        eventExtra,
      );

    case "player_spotted":
      return entry(
        context,
        index,
        "self",
        t("narrative.spotted", { player: narrativePlayerName(event.player) }),
        eventExtra,
      );

    case "hazard_triggered":
      if (event.hazard === "slip") {
        return event.player === self
          ? entry(context, index, "self", t("narrative.hazard.slip_self"), eventExtra)
          : null;
      }
      return event.player === self
        ? entry(
          context,
          index,
          "self",
          t("narrative.hazard.electric_self", { damage: event.damage }),
          eventExtra,
        )
        : entry(
          context,
          index,
          "witness",
          t("narrative.hazard.electric_witness", { player: narrativePlayerName(event.player) }),
          eventExtra,
        );

    case "hazard_revealed":
      return entry(
        context,
        index,
        "witness",
        t("narrative.hazard.revealed", { node: narrativeNodeName(context.view, event.node) }),
        eventExtra,
      );

    case "cache_dropped": {
      const owner = cacheOwner === undefined
        ? t("narrative.cache.unknown_owner")
        : narrativePlayerName(cacheOwner);
      return entry(
        context,
        index,
        "witness",
        cachePriorityState(event.priorityFor, event.untilMs, self, context.atGameMs) === "yours"
          ? t("narrative.cache.dropped_priority", { owner })
          : t("narrative.cache.dropped", { owner }),
        eventExtra,
      );
    }

    case "noise": {
      const direction = narrativeNodeName(context.view, event.node);
      const text = event.loudness === 20
        ? t("narrative.noise.gunshot", { direction })
        : event.loudness === 15
        ? t("narrative.noise.metal", { direction })
        : event.loudness === 10
        ? t("narrative.noise.nearby", { direction })
        : t("narrative.noise.faint", { direction });
      return entry(context, index, "witness", text, {
        ...eventExtra,
        dedupeKey: `noise:${event.loudness}`,
      });
    }

    case "shop_traded":
      if (event.player !== self) return null;
      return entry(
        context,
        index,
        "self",
        t(event.side === "buy" ? "narrative.shop.bought" : "narrative.shop.sold", {
          item: itemDisplayName(event.item),
          price: event.price,
        }),
        eventExtra,
      );

    case "blockade_preview":
      return entry(
        context,
        index,
        "broadcast",
        t("narrative.blockade.preview", {
          node: narrativeNodeName(context.view, event.node),
          countdown: formatCountdown(event.closesAtMs - context.atGameMs),
        }),
        eventExtra,
      );

    case "blockade_closed":
      return entry(
        context,
        index,
        "broadcast",
        t("narrative.blockade.closed", { node: narrativeNodeName(context.view, event.node) }),
        eventExtra,
      );

    case "reset_started":
      return entry(context, index, "self", t("narrative.reset.started"), eventExtra);

    case "reset_completed":
      return entry(context, index, "broadcast", t("narrative.reset.completed"), eventExtra);

    case "legacy_locked":
      return event.player === self
        ? entry(
          context,
          index,
          "self",
          t("narrative.legacy.locked", {
            item: context.legacyItem ?? t("narrative.legacy.unknown_item"),
          }),
          eventExtra,
        )
        : null;

    case "oath_changed":
      if (event.player === self && event.oath === "broken") {
        return entry(
          context,
          index,
          "self",
          context.oathBrokenByContact
            ? t("narrative.oath.broken_contact")
            : t("narrative.oath.broken"),
          eventExtra,
        );
      }
      if (event.player === self && event.oath === "restored") {
        return entry(context, index, "self", t("narrative.oath.restored"), eventExtra);
      }
      return event.player !== self
        ? entry(
          context,
          index,
          "broadcast",
          t("narrative.oath.witness", {
            player: narrativePlayerName(event.player),
            oath: event.oath,
          }),
          eventExtra,
        )
        : null;

    case "final_reckoning":
      return entry(context, index, "broadcast", t("narrative.final_reckoning"), eventExtra);

    case "sudden_death_started":
      return entry(context, index, "self", t("narrative.sudden_death"), eventExtra);

    case "travel_encounter_started": {
      if (event.player !== self) return null;
      const prompt = context.view.encounterPrompt;
      if (prompt === undefined || prompt.encounterId !== event.encounterId) return null;
      const targets = prompt.targetRefs.map((targetRef) => {
        const target = context.view.visiblePlayers.find((player) => player.ref === targetRef);
        return encounterTargetDescription(target);
      }).join(t("narrative.list_separator")) || t("narrative.fog.figure");
      const seconds = Math.max(0, Math.ceil((event.deadlineMs - context.atGameMs) / 1_000));
      return entry(
        context,
        index,
        "self",
        prompt.style === "rush"
          ? t("narrative.encounter.started_rush", { targets, seconds })
          : t("narrative.encounter.started_sneak", { targets, seconds }),
        eventExtra,
      );
    }

    case "travel_encounter_resolved":
      if (event.player !== self) return null;
      return entry(
        context,
        index,
        "self",
        t(`narrative.encounter.${event.outcome}`),
        eventExtra,
      );

    case "echo_attuned":
      return event.player === self && event.intelGained > 0
        ? entry(
          context,
          index,
          "self",
          t("narrative.echo_attuned", {
            intel: context.view.self.disasterIntel ?? 0,
            target: ECHO_TWO_INSIGHT_TARGET,
          }),
          eventExtra,
        )
        : null;

    case "finale_offer_started":
      if (event.mode !== "arbora") return null;
      return event.initiator === self
        ? entry(context, index, "self", t("narrative.finale.offer_self"), eventExtra)
        : entry(
          context,
          index,
          "broadcast",
          t("narrative.finale.offer_broadcast", {
            initiator: narrativePlayerName(event.initiator),
          }),
          eventExtra,
        );

    case "finale_joined":
      return entry(
        context,
        index,
        event.player === self ? "self" : "broadcast",
        event.player === self
          ? t("narrative.finale.joined_self", { count: event.participants.length })
          : t("narrative.finale.joined_other", {
            player: narrativePlayerName(event.player),
            count: event.participants.length,
          }),
        eventExtra,
      );

    case "finale_channel_started": {
      const selfParticipates = event.participants.includes(self);
      if (event.mode === "solo") {
        return selfParticipates
          ? entry(context, index, "self", t("narrative.finale.channel_solo_self"), eventExtra)
          : entry(
            context,
            index,
            "broadcast",
            t("narrative.finale.channel_solo_broadcast", {
              player: narrativePlayerName(event.participants[0] ?? t("narrative.someone")),
            }),
            eventExtra,
          );
      }
      return selfParticipates
        ? entry(context, index, "self", t("narrative.finale.channel_arbora_self"), eventExtra)
        : entry(
          context,
          index,
          "broadcast",
          t("narrative.finale.channel_arbora_broadcast", {
            players: event.participants.map(narrativePlayerName).join(
              t("narrative.list_separator"),
            ),
          }),
          eventExtra,
        );
    }

    case "finale_interrupted": {
      const selfParticipated = context.previousFinaleParticipants?.includes(self) ??
        context.view.finale?.participants.includes(self) ?? false;
      const selfWasAffected = selfParticipated &&
        (context.finaleAffectedPlayers?.includes(self) === true ||
          (context.finaleDamageHasCombat !== true && event.interruptor === self));
      if (event.reason === "outsider") {
        return selfParticipated
          ? entry(
            context,
            index,
            "self",
            t("narrative.finale.interrupted_outsider_self", {
              interruptor: narrativePlayerName(event.interruptor),
            }),
            eventExtra,
          )
          : entry(
            context,
            index,
            "broadcast",
            t("narrative.finale.interrupted_outsider_broadcast", {
              interruptor: narrativePlayerName(event.interruptor),
            }),
            eventExtra,
          );
      }
      if ((event.reason === "damage" || event.reason === "downed") && selfWasAffected) {
        return entry(context, index, "self", t("narrative.finale.interrupted_pain"), eventExtra);
      }
      if (
        (event.reason === "move" || event.reason === "leave" || event.reason === "cancelled") &&
        selfParticipated && event.interruptor === self
      ) {
        return entry(
          context,
          index,
          "self",
          t("narrative.finale.interrupted_withdraw"),
          eventExtra,
        );
      }
      if (event.reason === "timeout") {
        return entry(
          context,
          index,
          "broadcast",
          t("narrative.finale.interrupted_timeout"),
          eventExtra,
        );
      }
      if (event.reason === "ritual") {
        return entry(
          context,
          index,
          "broadcast",
          t("narrative.finale.interrupted_ritual"),
          eventExtra,
        );
      }
      return entry(
        context,
        index,
        "broadcast",
        t("narrative.finale.interrupted_default"),
        eventExtra,
      );
    }

    case "finale_claimed":
      if (event.mode !== "solo") return null;
      return event.winners.includes(self)
        ? entry(context, index, "self", t("narrative.finale.claimed_self"), eventExtra)
        : entry(
          context,
          index,
          "broadcast",
          t("narrative.finale.claimed_broadcast", {
            winner: narrativePlayerName(event.winners[0] ?? t("narrative.someone")),
          }),
          eventExtra,
        );

    case "finale_completed":
      return entry(
        context,
        index,
        "broadcast",
        event.mode === "solo"
          ? t("narrative.finale.completed_solo")
          : t("narrative.finale.completed_arbora"),
        eventExtra,
      );

    case "match_ended": {
      if (event.ending === "none") {
        return entry(context, index, "broadcast", t("narrative.match_ended.none"), eventExtra);
      }
      const selfWins = event.winners.includes(self);
      const winner = narrativePlayerName(event.winners[0] ?? t("narrative.someone"));
      if (event.reason === "last_standing") {
        return selfWins
          ? entry(
            context,
            index,
            "self",
            t("narrative.match_ended.last_standing_self"),
            eventExtra,
          )
          : entry(
            context,
            index,
            "broadcast",
            t("narrative.match_ended.last_standing_broadcast", { winner }),
            eventExtra,
          );
      }
      if (event.reason === "finale_solo") {
        return selfWins
          ? entry(context, index, "self", t("narrative.match_ended.finale_solo_self"), eventExtra)
          : entry(
            context,
            index,
            "broadcast",
            t("narrative.match_ended.finale_solo_broadcast", { winner }),
            eventExtra,
          );
      }
      if (event.reason === "finale_coop") {
        return selfWins
          ? entry(context, index, "self", t("narrative.match_ended.finale_coop_self"), eventExtra)
          : entry(
            context,
            index,
            "broadcast",
            t("narrative.match_ended.finale_coop_broadcast", {
              winners: event.winners.map(narrativePlayerName).join(
                t("narrative.list_separator"),
              ),
            }),
            eventExtra,
          );
      }
      if (event.reason === "sudden_death_tiebreak") {
        return selfWins
          ? entry(context, index, "self", t("narrative.match_ended.tiebreak_self"), eventExtra)
          : entry(
            context,
            index,
            "broadcast",
            t("narrative.match_ended.tiebreak_broadcast", { winner }),
            eventExtra,
          );
      }
      return null;
    }
  }
  return null;
}

/**
 * @param {MatchEvent[]} events
 * @param {NarrativeContext} context
 */
export function eventsToNarrative(events, context) {
  const self = context.view.self.playerId;
  const selfNode = context.view.self.node;
  const delayedSpectator = context.view.self.status === "eliminated";
  const distantTerminalPlayers = new Set(
    events.flatMap((event) =>
      (event.kind === "player_downed" || event.kind === "player_echoed" ||
          event.kind === "player_eliminated") &&
        event.player !== self && event.by !== self && event.node !== selfNode && !delayedSpectator
        ? [event.player]
        : []
    ),
  );
  const distantCombats = events.filter((event) =>
    event.kind === "combat" && event.attacker !== self && event.target !== self &&
    event.sourceNode !== selfNode && event.targetNode !== selfNode && !delayedSpectator
  );
  const distantTerminalCombatNoiseKeys = new Set(
    distantCombats.flatMap((event) =>
      event.kind === "combat" && distantTerminalPlayers.has(event.target)
        ? [`${event.sourceNode}:${combatNoiseLoudness(event)}`]
        : []
    ),
  );
  const distantCombatNoiseKeys = new Set(
    distantCombats.flatMap((event) =>
      event.kind === "combat" && !distantTerminalPlayers.has(event.target)
        ? [`${event.sourceNode}:${combatNoiseLoudness(event)}`]
        : []
    ),
  );
  const finaleAffectedPlayers = events.flatMap((event) => {
    if (event.kind === "combat" && event.hit && event.damage > 0) return [event.target];
    if (event.kind === "player_downed") return [event.player];
    if (event.kind === "hazard_triggered" && event.damage > 0) return [event.player];
    return [];
  });
  const batchContext = {
    ...context,
    finaleAffectedPlayers,
    finaleDamageHasCombat: events.some((event) => event.kind === "combat"),
    oathBrokenByContact: events.some((event) =>
      event.kind === "combat" && event.attacker === context.view.self.playerId &&
      isContactRef(event.target)
    ),
    shopBoughtItems: events.flatMap((event) =>
      event.kind === "shop_traded" && event.player === self && event.side === "buy"
        ? [event.item]
        : []
    ),
  };
  /** @type {Map<NodeId, string>} */
  const cacheOwners = new Map();
  /** @type {NarrativeEntry[]} */
  const result = [];
  let distantCryRendered = false;
  events.forEach((event, index) => {
    if (
      event.kind === "combat" && event.attacker !== self && event.target !== self &&
      event.sourceNode !== selfNode && event.targetNode !== selfNode && !delayedSpectator &&
      distantTerminalPlayers.has(event.target)
    ) return;
    if (
      event.kind === "noise" &&
      (distantTerminalCombatNoiseKeys.has(`${event.node}:${event.loudness}`) ||
        distantCombatNoiseKeys.has(`${event.node}:${event.loudness}`))
    ) return;
    const distantTerminal = (event.kind === "player_downed" || event.kind === "player_echoed" ||
      event.kind === "player_eliminated") &&
      event.player !== self && event.by !== self && event.node !== selfNode && !delayedSpectator;
    if (distantTerminal && distantCryRendered) return;
    if (event.kind === "player_downed" || event.kind === "player_echoed") {
      cacheOwners.set(event.node, event.player);
    }
    const rendered = eventToNarrative(
      event,
      batchContext,
      index,
      event.kind === "cache_dropped" ? cacheOwners.get(event.node) : undefined,
    );
    if (rendered !== null) {
      result.push(rendered);
      if (distantTerminal) distantCryRendered = true;
    }
  });
  return result;
}

/** @param {PlayerView} view */
function projectedCasting(view) {
  return view.self.casting;
}

/**
 * Compare only the two validated public-demo views already held by the client.
 * @param {PlayerView} previous
 * @param {PlayerView} current
 * @param {MatchEvent[]} events
 * @param {string} idPrefix
 */
export function deriveNarrative(previous, current, events, idPrefix) {
  const context = { view: current, atGameMs: current.gameNowMs, idPrefix };
  /** @type {NarrativeEntry[]} */
  const result = [];
  let index = 0;
  const add = (/** @type {NarrativeLevel} */ level, /** @type {string} */ text, fatal = false) => {
    result.push(entry(context, index++, level, text, { source: "derived", fatal }));
  };

  const gotLost = events.some((event) =>
    event.kind === "got_lost" && event.player === current.self.playerId
  );
  if (previous.self.node !== current.self.node && !gotLost) {
    const node = current.nodes.find((candidate) => candidate.id === current.self.node);
    const adjectives = narrativeTagAdjectives(node?.activeTags ?? []);
    const nodeName = narrativeNodeName(current, current.self.node);
    add(
      "self",
      adjectives === ""
        ? t("narrative.arrival.plain", { node: nodeName })
        : t("narrative.arrival.tagged", { node: nodeName, adjectives }),
    );
  }

  const previousVisible = new Map(previous.visiblePlayers.map((player) => [player.ref, player]));
  const matchedPrevious = new Set();
  for (const player of current.visiblePlayers) {
    const directPrevious = previousVisible.get(player.ref);
    const previousContact = player.identified && player.contactRef !== undefined
      ? previousVisible.get(player.contactRef)
      : undefined;
    const previousIdentity = !player.identified
      ? previous.visiblePlayers.find((candidate) =>
        candidate.identified && candidate.contactRef === player.ref
      )
      : undefined;
    const previousCounterpart = directPrevious ?? previousContact ?? previousIdentity;

    if (directPrevious !== undefined) {
      matchedPrevious.add(player.ref);
    } else if (previousContact?.identified === false) {
      matchedPrevious.add(player.contactRef);
      add("witness", t("narrative.contact.recognized", { player: player.playerId ?? "" }));
    } else if (previousIdentity !== undefined) {
      matchedPrevious.add(previousIdentity.ref);
    } else {
      add(
        "witness",
        !player.identified
          ? t("narrative.visible.unidentified", { node: narrativeNodeName(current, player.node) })
          : player.node === current.self.node
          ? t("narrative.visible.arrived", {
            player: player.playerId ?? "",
            background: player.background === "rootbound"
              ? "ROOTBOUND"
              : player.background?.toUpperCase() ?? "",
          })
          : t("narrative.visible.distant", {
            player: player.playerId ?? "",
            node: narrativeNodeName(current, player.node),
          }),
      );
    }
    if (player.limping && previousCounterpart?.limping !== true) {
      add("witness", t("narrative.limping.seen"));
    }
  }
  for (const player of previous.visiblePlayers) {
    if (matchedPrevious.has(player.ref)) continue;
    add(
      "witness",
      player.identified
        ? t("narrative.left.identified", { player: player.playerId ?? "" })
        : t("narrative.left.unidentified", { node: narrativeNodeName(current, player.node) }),
    );
  }

  if (previous.self.status !== "echo" && current.self.status === "echo") {
    const hasEchoEvent = events.some((event) =>
      event.kind === "player_echoed" && event.player === current.self.playerId
    );
    if (!hasEchoEvent) {
      add("self", t("narrative.echoed.self_unknown"), true);
    }
    add("self", t("narrative.echo.attune_hint", { target: ECHO_TWO_INSIGHT_TARGET }));
  }

  if (previous.self.signal < 60 && current.self.signal >= 60) {
    add("self", t("narrative.signal.warning", { signal: current.self.signal }));
  }
  if (previous.legacyPrompt === undefined && current.legacyPrompt !== undefined) {
    const remainingSeconds = Math.max(
      0,
      Math.ceil((current.legacyPrompt.deadlineMs - current.gameNowMs) / 1000),
    );
    add(
      "self",
      t("narrative.legacy.prompt", {
        max: current.legacyPrompt.maxSelections,
        seconds: remainingSeconds,
      }),
    );
  }
  if (previous.insightPrompt === undefined && current.insightPrompt !== undefined) {
    const remainingSeconds = Math.max(
      0,
      Math.ceil((current.insightPrompt.deadlineMs - current.gameNowMs) / 1000),
    );
    add(
      "self",
      t("narrative.insight.prompt", {
        max: current.insightPrompt.maxSelections,
        seconds: remainingSeconds,
      }),
    );
  }
  const previousCasting = projectedCasting(previous);
  const recoveryCompleted = events.some((event) =>
    event.kind === "recovery_completed" && event.player === current.self.playerId
  );
  if (
    previousCasting !== undefined && projectedCasting(current) === undefined &&
    !recoveryCompleted
  ) {
    add(
      "self",
      previousCasting.item === "healthy_food" || previousCasting.item === "spoiled_food"
        ? t("narrative.casting.food_interrupted")
        : t("narrative.casting.heal_interrupted"),
    );
  }
  if (
    previous.self.discomfortUntilMs !== undefined &&
    current.self.discomfortUntilMs === undefined &&
    current.gameNowMs >= previous.self.discomfortUntilMs
  ) {
    add("self", t("narrative.discomfort.ended"));
  }
  if (
    previous.phase === "megacity" && current.phase === "megacity" &&
    previous.gameNowMs < 30_000 && current.gameNowMs >= 30_000
  ) {
    add("broadcast", t("narrative.spawn_grace.ended"));
  }
  if (
    previous.finale !== undefined && current.finale !== undefined &&
    previous.finale.interruptor === undefined && current.finale.interruptor !== undefined
  ) {
    add("broadcast", t("narrative.finale.interruptor_appeared"));
  }
  if (
    previous.finale !== undefined && current.finale !== undefined &&
    previous.finale.interruptor !== undefined && current.finale.interruptor === undefined
  ) {
    add("broadcast", t("narrative.finale.interruptor_gone"));
  }

  const creditsGained = current.self.credits - previous.self.credits;
  const shopSale = events.some((event) =>
    event.kind === "shop_traded" && event.player === current.self.playerId && event.side === "sell"
  );
  const fromSearch = events.some((event) =>
    event.kind === "search_result" && event.player === current.self.playerId &&
    event.found !== null
  );
  const fromTakedown = events.some((event) =>
    (event.kind === "player_downed" || event.kind === "player_echoed") &&
    event.by === current.self.playerId
  );
  if (creditsGained > 0 && !shopSale && (fromSearch || fromTakedown)) {
    add(
      "self",
      t(fromSearch ? "narrative.credits.found" : "narrative.credits.reward", {
        amount: creditsGained,
      }),
    );
  }

  const selfCombatWeapons = new Set(
    events.flatMap((event) =>
      event.kind === "combat" && event.attacker === current.self.playerId &&
        BREAKABLE_WEAPON_KINDS.has(event.weapon)
        ? [event.weapon]
        : []
    ),
  );
  const inventoryCount = (
    /** @type {PlayerView} */ candidate,
    /** @type {import("@darkforest/protocol").ItemKind} */ kind,
  ) =>
    candidate.self.inventory
      .filter((item) => item.kind === kind)
      .reduce((total, item) => total + item.count, 0);
  const scrapGained = inventoryCount(current, "scrap") > inventoryCount(previous, "scrap");
  const scrapDropped = events.some((event) =>
    event.kind === "cache_dropped" && event.priorityFor === current.self.playerId &&
    event.items.some((item) => item.kind === "scrap")
  );
  for (const weapon of selfCombatWeapons) {
    if (inventoryCount(current, weapon) >= inventoryCount(previous, weapon)) continue;
    const item = itemDisplayName(weapon);
    add(
      "self",
      scrapGained
        ? t("narrative.weapon_broken.salvaged", { item })
        : scrapDropped
        ? t("narrative.weapon_broken.dropped", { item })
        : t("narrative.weapon_broken.self", { item }),
    );
  }
  return result;
}

/**
 * noise 以遊戲時鐘 5 秒去重，並保留最後 200 句。
 * @param {NarrativeEntry[]} current
 * @param {NarrativeEntry[]} incoming
 * @param {number=} limit
 */
export function appendNarrativeEntries(current, incoming, limit = 200) {
  const next = [...current];
  for (const candidate of incoming) {
    const existingIdIndex = next.findIndex((existing) => existing.id === candidate.id);
    let candidateIndex;
    if (existingIdIndex >= 0) {
      next[existingIdIndex] = candidate;
      candidateIndex = existingIdIndex;
    } else {
      next.push(candidate);
      candidateIndex = next.length - 1;
    }
    if (candidate.dedupeKey !== undefined) {
      const duplicateIndex = next.findIndex((existing, index) =>
        index !== candidateIndex &&
        existing.dedupeKey === candidate.dedupeKey &&
        candidate.atGameMs - existing.atGameMs >= 0 &&
        candidate.atGameMs - existing.atGameMs <= 5_000
      );
      if (duplicateIndex >= 0) next.splice(duplicateIndex, 1);
    }
  }
  return next.slice(-Math.max(0, limit));
}

const FOCUS_EVENT_KINDS = new Set([
  "combat",
  "player_downed",
  "player_echoed",
  "player_eliminated",
  "armor_broken",
  "blockade_preview",
  "blockade_closed",
  "reset_started",
  "reset_completed",
  "final_reckoning",
  "sudden_death_started",
  "finale_offer_started",
  "finale_channel_started",
  "finale_interrupted",
  "finale_claimed",
  "finale_completed",
  "match_ended",
]);

/**
 * 「與我有關」是低噪音閱讀層，不刪除底層 200 句原始紀錄。自我、操作、狀態、聊天與
 * 全局關鍵節點常駐；同地點交火與遠距戰鬥聲響也留在主線，低強度環境噪音才收進「全部」。
 * @param {NarrativeEntry} entry
 * @param {"all" | "focus" | "chat"} filter
 */
export function narrativeEntryMatchesFilter(entry, filter) {
  if (filter === "all") return true;
  if (filter === "chat") return entry.kind === "chat";
  if (entry.event?.kind === "noise") return entry.event.loudness >= 15;
  return entry.level === "self" || entry.kind === "action" || entry.kind === "system" ||
    entry.kind === "chat" ||
    (entry.event !== undefined && FOCUS_EVENT_KINDS.has(entry.event.kind));
}
