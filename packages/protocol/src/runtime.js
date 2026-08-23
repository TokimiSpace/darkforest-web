// @ts-check

const MAX_WIRE_BYTES = 1_000_000;
const MAX_DEPTH = 16;
const MAX_VALUES = 20_000;
const MAX_ARRAY_LENGTH = 512;
const MAX_OBJECT_KEYS = 128;
const MAX_STRING_LENGTH = 4_096;

export const PUBLIC_DEMO_PROTOCOL_VERSION = 1;

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$/;
const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const PHASES = new Set(["megacity", "reset", "darkforest", "ended"]);
const STATUSES = new Set(["active", "downed", "echo", "eliminated"]);
const BACKGROUNDS = new Set(["courier", "rootbound"]);
const PROFESSIONS = new Set(["courier", "scavenger", "enforcer"]);
const TRAITS = new Set(["medic", "artisan", "attuned", "tough", "fleet"]);
const OATHS = new Set(["none", "oathed", "broken", "restored"]);
const TAGS = new Set([
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
const WEAPONS = new Set(["tool", "pistol", "rifle", "cleaver", "stool", "golf_club"]);
const ITEMS = new Set([
  ...WEAPONS,
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
const EVENT_KINDS = new Set([
  "combat",
  "player_downed",
  "player_eliminated",
  "player_echoed",
  "search_result",
  "recovery_completed",
  "supply_event",
  "cache_dropped",
  "hazard_triggered",
  "hazard_revealed",
  "hide_result",
  "player_spotted",
  "got_lost",
  "equipped",
  "armor_broken",
  "item_dropped",
  "blockade_preview",
  "blockade_closed",
  "reset_started",
  "reset_completed",
  "echo_returned",
  "legacy_locked",
  "oath_changed",
  "final_reckoning",
  "sudden_death_started",
  "noise",
  "echo_attuned",
  "level_up",
  "injury_inflicted",
  "injury_cured",
  "shop_traded",
  "finale_offer_started",
  "finale_joined",
  "finale_channel_started",
  "finale_interrupted",
  "finale_claimed",
  "finale_completed",
  "travel_encounter_started",
  "travel_encounter_resolved",
  "match_ended",
]);
const MESSAGE_TYPES = new Set([
  "lobby",
  "welcome",
  "ack",
  "diff",
  "snapshot",
  "preview_result",
  "pong",
  "chat_message",
  "chat_reject",
  "spectator_waiting",
  "arbora_status",
  "arbora_reply",
  "arbora_reject",
]);
const ACTIONS = new Set([
  "move",
  "search",
  "attack",
  "hide",
  "use_item",
  "rescue",
  "echo_move",
  "echo_attune",
  "legacy_select",
  "once_ability",
  "equip",
  "unequip",
  "drop",
  "pickup",
  "insight_select",
  "finale_commit",
  "finale_join",
  "finale_interrupt",
  "finale_cancel",
  "encounter_continue",
  "shop_buy",
  "shop_sell",
]);

/**
 * @param {unknown} value
 * @returns {value is Record<string, any>}
 */
function isRecord(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * @param {unknown} value
 * @returns {value is number}
 */
function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 1e12;
}

/**
 * @param {unknown} value
 * @returns {value is number}
 */
function isNonNegativeNumber(value) {
  return isFiniteNumber(value) && value >= 0;
}

/**
 * @param {unknown} value
 * @returns {value is string}
 */
function isIdentifier(value) {
  return typeof value === "string" && IDENTIFIER.test(value);
}

/**
 * @param {unknown} value
 * @param {{values: number}} budget
 * @param {number} depth
 * @returns {boolean}
 */
function isBoundedJson(value, budget, depth = 0) {
  budget.values += 1;
  if (budget.values > MAX_VALUES || depth > MAX_DEPTH) return false;
  if (value === null || typeof value === "boolean") return true;
  if (typeof value === "number") return isFiniteNumber(value);
  if (typeof value === "string") return value.length <= MAX_STRING_LENGTH;
  if (Array.isArray(value)) {
    return value.length <= MAX_ARRAY_LENGTH &&
      value.every((entry) => isBoundedJson(entry, budget, depth + 1));
  }
  if (!isRecord(value)) return false;
  const entries = Object.entries(value);
  return entries.length <= MAX_OBJECT_KEYS &&
    entries.every(([key, entry]) =>
      !BLOCKED_KEYS.has(key) && key.length <= 96 && isBoundedJson(entry, budget, depth + 1)
    );
}

/** @param {unknown} value */
function isItemStack(value) {
  return isRecord(value) && ITEMS.has(value.kind) && isNonNegativeNumber(value.count) &&
    (value.durability === undefined || isNonNegativeNumber(value.durability));
}

/** @param {unknown} value */
function isActionPayload(value) {
  if (!isRecord(value) || !ACTIONS.has(value.action)) return false;
  switch (value.action) {
    case "move":
    case "echo_move":
      return isIdentifier(value.to) &&
        (value.style === undefined || value.style === "rush" || value.style === "sneak");
    case "attack":
      return isIdentifier(value.target) && WEAPONS.has(value.weapon);
    case "use_item":
      return ITEMS.has(value.item) &&
        (value.targetNode === undefined || isIdentifier(value.targetNode));
    case "rescue":
      return isIdentifier(value.target);
    case "legacy_select":
    case "insight_select":
      return Array.isArray(value.items) && value.items.length <= 2 &&
        value.items.every((item) => ITEMS.has(item));
    case "equip":
    case "drop":
    case "shop_buy":
    case "shop_sell":
      return ITEMS.has(value.item);
    case "unequip":
      return new Set(["helmet", "jacket", "pants", "gloves", "shoes", "backpack"]).has(
        value.slot,
      );
    case "pickup":
      return isIdentifier(value.cacheId) && ITEMS.has(value.item);
    case "finale_commit":
      return value.mode === "solo" || value.mode === "arbora";
    case "encounter_continue":
      return isIdentifier(value.encounterId);
    default:
      return true;
  }
}

/** @param {unknown} value */
export function isClientMessage(value) {
  if (!isRecord(value) || typeof value.type !== "string") return false;
  if (!isBoundedJson(value, { values: 0 })) return false;
  switch (value.type) {
    case "hello":
      return value.protocolVersion === PUBLIC_DEMO_PROTOCOL_VERSION &&
        isIdentifier(value.matchId) && isIdentifier(value.playerToken) &&
        (value.lastSeenVersion === undefined || isNonNegativeNumber(value.lastSeenVersion));
    case "command":
      return isIdentifier(value.commandId) && isNonNegativeNumber(value.expectedStateVersion) &&
        isActionPayload(value.payload);
    case "preview":
      return isIdentifier(value.requestId) && isIdentifier(value.target) &&
        WEAPONS.has(value.weapon);
    case "ping":
      return isFiniteNumber(value.t);
    case "chat_send":
      return isIdentifier(value.messageId) && typeof value.text === "string";
    case "arbora_ask":
      return isIdentifier(value.requestId) && typeof value.text === "string" &&
        new Set(["zh-TW", "zh-CN", "ja", "ko", "en"]).has(value.locale);
    default:
      return false;
  }
}

/** @param {unknown} value */
function isVisiblePlayer(value) {
  if (!isRecord(value)) return false;
  if (
    !isIdentifier(value.ref) || typeof value.identified !== "boolean" ||
    !isIdentifier(value.node) || !new Set(["active", "downed"]).has(value.status) ||
    !(value.equippedWeapon === null || WEAPONS.has(value.equippedWeapon)) ||
    !new Set(["light", "medium", "heavy"]).has(value.armorSilhouette) ||
    typeof value.limping !== "boolean"
  ) return false;
  return value.playerId === undefined || isIdentifier(value.playerId);
}

/** @param {unknown} value */
function isNodeView(value) {
  if (!isRecord(value)) return false;
  if (
    !isIdentifier(value.id) || typeof value.open !== "boolean" ||
    !Array.isArray(value.activeTags) || !value.activeTags.every((tag) => TAGS.has(tag)) ||
    !isNonNegativeNumber(value.coverSlotsFree) || !isNonNegativeNumber(value.searchesLeft) ||
    !Array.isArray(value.knownHazards) || !Array.isArray(value.caches)
  ) return false;
  if (
    !value.knownHazards.every((hazard) =>
      isRecord(hazard) && isIdentifier(hazard.hazardId) && hazard.kind === "conductive_puddle" &&
      typeof hazard.note === "string"
    )
  ) return false;
  if (
    !value.caches.every((cache) =>
      isRecord(cache) && isIdentifier(cache.cacheId) && isIdentifier(cache.priorityFor) &&
      isNonNegativeNumber(cache.priorityUntilMs) && Array.isArray(cache.items) &&
      cache.items.every(isItemStack)
    )
  ) return false;
  if (value.shop === undefined) return true;
  return isRecord(value.shop) && Array.isArray(value.shop.catalog) &&
    value.shop.catalog.every((entry) =>
      isRecord(entry) && ITEMS.has(entry.item) && isNonNegativeNumber(entry.buyPrice) &&
      isNonNegativeNumber(entry.sellPrice) &&
      (entry.stockLeft === undefined || isNonNegativeNumber(entry.stockLeft))
    );
}

/** @param {unknown} value */
function isSelfState(value) {
  if (!isRecord(value)) return false;
  return isIdentifier(value.playerId) && BACKGROUNDS.has(value.background) &&
    STATUSES.has(value.status) && isFiniteNumber(value.hp) && isNonNegativeNumber(value.xp) &&
    isNonNegativeNumber(value.level) && Array.isArray(value.injuries) &&
    value.injuries.every((part) => part === "leg" || part === "arm") &&
    PROFESSIONS.has(value.profession) && TRAITS.has(value.trait) &&
    isNonNegativeNumber(value.credits) && isFiniteNumber(value.stamina) &&
    isFiniteNumber(value.signal) && isIdentifier(value.node) && typeof value.hidden === "boolean" &&
    OATHS.has(value.oath) && isRecord(value.cooldownsUntilMs) &&
    Object.values(value.cooldownsUntilMs).every(isNonNegativeNumber) &&
    Array.isArray(value.inventory) && value.inventory.every(isItemStack) &&
    (value.equippedWeapon === null || WEAPONS.has(value.equippedWeapon)) &&
    isNonNegativeNumber(value.legacyPoints) && typeof value.onceAbilityUsed === "boolean" &&
    isRecord(value.equipment) && Object.values(value.equipment).every(isItemStack) &&
    isRecord(value.capacity) && isNonNegativeNumber(value.capacity.used) &&
    isNonNegativeNumber(value.capacity.total) && isNonNegativeNumber(value.armor) &&
    Array.isArray(value.attunedNodes) && value.attunedNodes.every(isIdentifier) &&
    typeof value.supplyTrace === "boolean" && isNonNegativeNumber(value.echoMemory);
}

/** @param {unknown} value */
function isSelfPatch(value) {
  if (!isRecord(value)) return false;
  for (const [key, entry] of Object.entries(value)) {
    switch (key) {
      case "playerId":
      case "node":
        if (!isIdentifier(entry)) return false;
        break;
      case "background":
        if (!BACKGROUNDS.has(entry)) return false;
        break;
      case "status":
        if (!STATUSES.has(entry)) return false;
        break;
      case "profession":
        if (!PROFESSIONS.has(entry)) return false;
        break;
      case "trait":
        if (!TRAITS.has(entry)) return false;
        break;
      case "oath":
        if (!OATHS.has(entry)) return false;
        break;
      case "hp":
      case "stamina":
      case "signal":
        if (!isFiniteNumber(entry)) return false;
        break;
      case "xp":
      case "level":
      case "credits":
      case "legacyPoints":
      case "armor":
      case "echoMemory":
        if (!isNonNegativeNumber(entry)) return false;
        break;
      case "hidden":
      case "onceAbilityUsed":
      case "supplyTrace":
        if (typeof entry !== "boolean") return false;
        break;
      case "injuries":
        if (!Array.isArray(entry) || !entry.every((part) => part === "leg" || part === "arm")) {
          return false;
        }
        break;
      case "attunedNodes":
        if (!Array.isArray(entry) || !entry.every(isIdentifier)) return false;
        break;
      case "inventory":
        if (!Array.isArray(entry) || !entry.every(isItemStack)) return false;
        break;
      case "equippedWeapon":
        if (!(entry === null || WEAPONS.has(entry))) return false;
        break;
      case "cooldownsUntilMs":
        if (!isRecord(entry) || !Object.values(entry).every(isNonNegativeNumber)) return false;
        break;
      case "equipment":
        if (!isRecord(entry) || !Object.values(entry).every(isItemStack)) return false;
        break;
      case "capacity":
        if (
          !isRecord(entry) || !isNonNegativeNumber(entry.used) ||
          !isNonNegativeNumber(entry.total)
        ) return false;
        break;
      case "disasterIntel":
      case "downedUntilMs":
      case "discomfortUntilMs":
        if (!(entry === null || isNonNegativeNumber(entry))) return false;
        break;
      case "casting":
        if (
          entry !== null &&
          (!isRecord(entry) ||
            !new Set(["bandage", "medkit", "healthy_food", "spoiled_food"]).has(entry.item) ||
            !isNonNegativeNumber(entry.completesAtMs))
        ) return false;
        break;
      default:
        return false;
    }
  }
  return true;
}

/** @param {unknown} value */
function isMap(value) {
  if (!isRecord(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) return false;
  if (
    !value.nodes.every((node) =>
      isRecord(node) && isIdentifier(node.id) && typeof node.nameMegaCity === "string" &&
      typeof node.nameDarkforest === "string" && Array.isArray(node.tagsMegaCity) &&
      node.tagsMegaCity.every((tag) => TAGS.has(tag)) && Array.isArray(node.tagsDarkforest) &&
      node.tagsDarkforest.every((tag) => TAGS.has(tag)) && isNonNegativeNumber(node.coverSlots)
    )
  ) return false;
  if (
    !value.edges.every((edge) =>
      isRecord(edge) && isIdentifier(edge.id) && isIdentifier(edge.from) &&
      isIdentifier(edge.to) && typeof edge.noLos === "boolean" &&
      new Set(["both", "megacity", "darkforest"]).has(edge.phase) &&
      (edge.trait === undefined || edge.trait === "tunnel" || edge.trait === "root")
    )
  ) return false;
  const nodeIds = value.nodes.map((node) => node.id);
  const edgeIds = value.edges.map((edge) => edge.id);
  const knownNodes = new Set(nodeIds);
  if (knownNodes.size !== nodeIds.length || new Set(edgeIds).size !== edgeIds.length) return false;
  if (!value.edges.every((edge) => knownNodes.has(edge.from) && knownNodes.has(edge.to))) {
    return false;
  }
  return Array.isArray(value.blockadeSchedule) &&
    value.blockadeSchedule.every((entry) =>
      isRecord(entry) && isNonNegativeNumber(entry.previewAtMs) &&
      isNonNegativeNumber(entry.closesAtMs) && isIdentifier(entry.node) &&
      knownNodes.has(entry.node)
    ) && Array.isArray(value.finalNodes) &&
    value.finalNodes.every((node) => isIdentifier(node) && knownNodes.has(node)) &&
    isIdentifier(value.rootheartNodeId) && knownNodes.has(value.rootheartNodeId) &&
    isIdentifier(value.shopNodeId) && knownNodes.has(value.shopNodeId);
}

/** @param {unknown} value */
function isRuleRecord(value) {
  /**
   * @param {unknown} entry
   * @returns {boolean}
   */
  const isNumericTree = (entry) => {
    if (isFiniteNumber(entry)) return true;
    if (Array.isArray(entry)) return entry.every(isFiniteNumber);
    return isRecord(entry) && Object.values(entry).every(isNumericTree);
  };
  return isRecord(value) && Object.values(value).every(isNumericTree);
}

/** @param {unknown} value */
function isPlayerView(value) {
  if (!isRecord(value)) return false;
  return value.protocolVersion === PUBLIC_DEMO_PROTOCOL_VERSION && isIdentifier(value.matchId) &&
    isNonNegativeNumber(value.stateVersion) && PHASES.has(value.phase) &&
    isNonNegativeNumber(value.gameNowMs) && isNonNegativeNumber(value.timeScale) &&
    isSelfState(value.self) && Array.isArray(value.visiblePlayers) &&
    value.visiblePlayers.every(isVisiblePlayer) && Array.isArray(value.nodes) &&
    value.nodes.every(isNodeView) && isMap(value.map) && isRuleRecord(value.survivalRules) &&
    isRuleRecord(value.progressionRules) && isRuleRecord(value.injuryRules) &&
    isRuleRecord(value.professionRules) && isNonNegativeNumber(value.aliveCount) &&
    isNonNegativeNumber(value.echoCount);
}

/** @param {unknown} value */
function isEvent(value) {
  if (!isRecord(value) || !EVENT_KINDS.has(value.kind)) return false;
  for (const [key, entry] of Object.entries(value)) {
    if (
      /(?:^id$|Id$|^player$|^node$|Node$|^attacker$|^target$|^by$|^initiator$|^interruptor$)/.test(
        key,
      ) && entry !== undefined && entry !== "zone" && entry !== "timeout" &&
      !isIdentifier(entry)
    ) return false;
  }
  return true;
}

/** @param {unknown} value */
function isDiff(value) {
  if (!isRecord(value)) return false;
  if (
    !isNonNegativeNumber(value.stateVersion) || !isNonNegativeNumber(value.gameNowMs) ||
    !Array.isArray(value.events) || !value.events.every(isEvent)
  ) return false;
  if (value.self !== undefined && !isSelfPatch(value.self)) return false;
  if (
    value.visiblePlayers !== undefined &&
    (!Array.isArray(value.visiblePlayers) || !value.visiblePlayers.every(isVisiblePlayer))
  ) return false;
  if (
    value.nodes !== undefined && (!Array.isArray(value.nodes) || !value.nodes.every(isNodeView))
  ) {
    return false;
  }
  return value.phase === undefined || PHASES.has(value.phase);
}

/** @param {unknown} value */
export function isServerMessage(value) {
  if (!isRecord(value) || typeof value.type !== "string" || !MESSAGE_TYPES.has(value.type)) {
    return false;
  }
  if (!isBoundedJson(value, { values: 0 })) return false;
  switch (value.type) {
    case "welcome":
    case "snapshot":
      return isPlayerView(value.view);
    case "diff":
      return isDiff(value);
    case "ack":
      return isIdentifier(value.commandId) && typeof value.accepted === "boolean" &&
        (value.errorCode === undefined || isIdentifier(value.errorCode)) &&
        (value.retryAtMs === undefined || isNonNegativeNumber(value.retryAtMs));
    case "preview_result":
      return isIdentifier(value.requestId) && typeof value.allowed === "boolean" &&
        (value.reason === undefined || isIdentifier(value.reason)) &&
        [
          value.hitChanceBpsMin,
          value.hitChanceBpsMax,
          value.damageMin,
          value.damageMax,
          value.cooldownMs,
          value.signalCost,
        ].every((entry) => entry === undefined || isNonNegativeNumber(entry)) &&
        (value.modifiers === undefined ||
          (Array.isArray(value.modifiers) && value.modifiers.length <= 4 &&
            value.modifiers.every((modifier) =>
              isRecord(modifier) && isIdentifier(modifier.source) &&
              isFiniteNumber(modifier.bps)
            ))) &&
        (value.warnings === undefined ||
          (Array.isArray(value.warnings) && value.warnings.every(isIdentifier)));
    case "pong":
      return isFiniteNumber(value.t);
    case "chat_message":
      return isIdentifier(value.messageId) && isIdentifier(value.player) &&
        typeof value.text === "string" && isNonNegativeNumber(value.sentAtMs);
    case "chat_reject":
      return isIdentifier(value.messageId) && isIdentifier(value.reason);
    case "arbora_status":
      return isNonNegativeNumber(value.remainingQuestions) &&
        isNonNegativeNumber(value.cooldownUntilGameMs) &&
        (value.pendingRequestId === undefined || isIdentifier(value.pendingRequestId));
    case "arbora_reply":
      return isIdentifier(value.requestId) && typeof value.displayText === "string" &&
        isIdentifier(value.hintType) && Array.isArray(value.citedFactIds) &&
        value.citedFactIds.every(isIdentifier) && isNonNegativeNumber(value.dataAsOfGameMs) &&
        isIdentifier(value.confidence) && isIdentifier(value.toneTag) &&
        Array.isArray(value.safetyFlags) && value.safetyFlags.every(isIdentifier) &&
        (value.source === "local" || value.source === "scripted") &&
        isNonNegativeNumber(value.remainingQuestions) &&
        isNonNegativeNumber(value.cooldownUntilGameMs);
    case "arbora_reject":
      return isIdentifier(value.requestId) && isIdentifier(value.reason) &&
        isNonNegativeNumber(value.remainingQuestions) &&
        (value.retryAtGameMs === undefined || isNonNegativeNumber(value.retryAtGameMs));
    case "lobby":
      return isIdentifier(value.matchId) && isNonNegativeNumber(value.seated) &&
        isNonNegativeNumber(value.capacity) && isNonNegativeNumber(value.startsInMs);
    case "spectator_waiting":
      return (value.matchId === null || isIdentifier(value.matchId)) &&
        isNonNegativeNumber(value.delayGameMs) &&
        (value.readyInMs === null || isNonNegativeNumber(value.readyInMs));
    default:
      return false;
  }
}

/** @param {string} value */
function neutralizeHtmlSyntax(value) {
  return value
    .replaceAll("&", "＆")
    .replaceAll("<", "‹")
    .replaceAll(">", "›")
    .replaceAll('"', "＂")
    .replaceAll("'", "＇");
}

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function safeClone(value) {
  if (typeof value === "string") return neutralizeHtmlSyntax(value);
  if (Array.isArray(value)) return value.map(safeClone);
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, safeClone(entry)]));
}

/**
 * Parse, bound, validate, and neutralize an untrusted server frame.
 * @param {unknown} wireData
 * @returns {Record<string, unknown> | null}
 */
export function parseServerMessage(wireData) {
  const source = String(wireData);
  if (new TextEncoder().encode(source).byteLength > MAX_WIRE_BYTES) return null;
  let parsed;
  try {
    parsed = JSON.parse(source);
  } catch {
    return null;
  }
  return isServerMessage(parsed)
    ? /** @type {Record<string, unknown>} */ (safeClone(parsed))
    : null;
}
