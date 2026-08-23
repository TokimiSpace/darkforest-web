// Generated from browser/narrative_mode.js by scripts/emit_client.ts. Do not edit.
// @ts-check
import { t } from "./i18n.js";

/** @typedef {import("@darkforest/protocol").ActionPayload} ActionPayload */
/** @typedef {import("@darkforest/protocol").MatchEvent} MatchEvent */
/** @typedef {import("@darkforest/protocol").PlayerView} PlayerView */
/** @typedef {import("@darkforest/protocol").VisiblePlayer} VisiblePlayer */

/**
 * @typedef {"terminal" | "forced" | "confirm" | "encounter" | "contextual" | "idle"} ForegroundSurfaceKind
 */

/**
 * Callers own the eligibility rules. This projector deliberately knows nothing about DOM nodes,
 * protocol fields, or how a surface is rendered.
 *
 * @typedef {object} ForegroundSurfaceEligibility
 * @property {boolean=} terminal
 * @property {boolean=} forced
 * @property {boolean=} confirm
 * @property {boolean=} encounter Encounter and explicit target selection share this priority tier.
 * @property {boolean=} contextual
 */

/**
 * @typedef {object} ForegroundSurfaceProjection
 * @property {ForegroundSurfaceKind} kind
 * @property {boolean} lowerActionsAvailable
 */

const FOREGROUND_SURFACE_PRIORITY = /** @type {const} */ (
  ["terminal", "forced", "confirm", "encounter", "contextual"]
);

/**
 * Select the only surface allowed to own the primary action area.
 *
 * @param {ForegroundSurfaceEligibility=} eligibility
 * @returns {ForegroundSurfaceProjection}
 */
export function projectForegroundSurface(eligibility = {}) {
  const kind = FOREGROUND_SURFACE_PRIORITY.find((candidate) => eligibility[candidate] === true) ??
    "idle";
  return { kind, lowerActionsAvailable: kind === "idle" };
}

/**
 * @typedef {object} NarrativeOption
 * @property {string} key
 * @property {"S1" | "S2" | "S3" | "S4"} slot
 * @property {string} label
 * @property {string} note
 * @property {"payload" | "preview" | "move-contact" | "distance" | "avoid-hazard" | "mark-edge" | "open" | "rescue" | "cache"} kind
 * @property {ActionPayload=} payload
 * @property {string=} targetRef
 * @property {import("@darkforest/protocol").NodeId=} node
 */

/**
 * @typedef {object} NarrativeSituation
 * @property {"contact" | "player" | "noise" | "hazard" | "blockade" | "trace" | "cache" | "downed-self" | "rescue" | "echo" | "legacy" | "insight" | "finale" | "none"} kind
 * @property {VisiblePlayer=} player
 * @property {MatchEvent=} event
 */

// label 走 catalog;getter 讓 client.js 每次讀取都跟隨當下 locale,
// Object.entries／`in`／keyof 用法與原本的字面物件完全一致。
export const COMMANDER_INTENT_COPY = {
  get survive() {
    return t("situation.intent.survive");
  },
  get scavenge() {
    return t("situation.intent.scavenge");
  },
  get conceal() {
    return t("situation.intent.conceal");
  },
  get travel() {
    return t("situation.intent.travel");
  },
  get echo_intel() {
    return t("situation.intent.echo_intel");
  },
  get hold() {
    return t("situation.intent.hold");
  },
};

export const ENGAGEMENT_POLICY_COPY = {
  get avoid() {
    return {
      label: t("situation.policy.avoid.label"),
      detail: t("situation.policy.avoid.detail"),
    };
  },
  get retaliate() {
    return {
      label: t("situation.policy.retaliate.label"),
      detail: t("situation.policy.retaliate.detail"),
    };
  },
  get hunt() {
    return {
      label: t("situation.policy.hunt.label"),
      detail: t("situation.policy.hunt.detail"),
    };
  },
};

const QUICK_USE_ITEM_KINDS = new Set([
  "bandage",
  "medkit",
  "healthy_food",
  "spoiled_food",
  "trap_scanner",
  "insight_root_sense",
  "insight_calamity_echo",
  "scrap",
]);

const MELEE_DURABILITY_WEAPONS = new Set([
  "tool",
  "cleaver",
  "stool",
  "golf_club",
]);
const RANGED_AMMO_WEAPONS = new Set(["pistol", "rifle"]);
const WEAPON_KINDS = new Set([...MELEE_DURABILITY_WEAPONS, ...RANGED_AMMO_WEAPONS]);
const INJURY_PARTS = /** @type {const} */ (["leg", "arm"]);

/**
 * Session storage is untrusted and can outlive multiple fixture runs in one tab. Keep only a
 * small, ordered set of plausible match identifiers so the Echo first-use guide is truly once
 * per match without turning local state into an unbounded log.
 *
 * @param {unknown} value
 * @param {number=} limit
 */
export function normalizeEchoJitHistory(value, limit = 24) {
  if (!Array.isArray(value)) return [];
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 24;
  /** @type {string[]} */
  const normalized = [];
  for (const candidate of value) {
    if (typeof candidate !== "string") continue;
    const matchId = candidate.trim();
    if (matchId === "" || matchId.length > 128) continue;
    const previous = normalized.indexOf(matchId);
    if (previous >= 0) normalized.splice(previous, 1);
    normalized.push(matchId);
  }
  return normalized.slice(-safeLimit);
}

/** @param {unknown} history @param {unknown} matchId */
export function echoJitIsFirstUse(history, matchId) {
  if (typeof matchId !== "string" || matchId.trim() === "" || matchId.length > 128) return false;
  return !normalizeEchoJitHistory(history).includes(matchId.trim());
}

/** @param {unknown} history @param {unknown} matchId @param {number=} limit */
export function rememberEchoJitMatch(history, matchId, limit = 24) {
  const normalized = normalizeEchoJitHistory(history, limit);
  if (typeof matchId !== "string" || matchId.trim() === "" || matchId.length > 128) {
    return normalized;
  }
  return normalizeEchoJitHistory([...normalized, matchId.trim()], limit);
}

/** @param {unknown} kind @returns {kind is import("@darkforest/protocol").WeaponKind} */
export function isWeaponKind(kind) {
  return typeof kind === "string" && WEAPON_KINDS.has(kind);
}

/** @param {import("@darkforest/protocol").WeaponKind} kind */
export function isMeleeWeapon(kind) {
  return MELEE_DURABILITY_WEAPONS.has(kind);
}

/** @param {import("@darkforest/protocol").WeaponKind} kind */
export function isDurabilityWeapon(kind) {
  return MELEE_DURABILITY_WEAPONS.has(kind);
}

/**
 * WebSocket payload 仍屬不可信輸入；只讓有限的非負整數進入 UI 或本地護欄。
 * `null` 代表資料不合法，呼叫端應隱藏該 stack 或改用安全的缺省顯示。
 *
 * @param {unknown} value
 * @returns {number | null}
 */
export function normalizeInventoryMetric(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.trunc(value)
    : null;
}

/**
 * SelfState exposes exact injury parts only to the owning player. Normalize their display order
 * once so the dossier, mobile HUD and treatment logic cannot drift or duplicate malformed data.
 *
 * @param {PlayerView["self"]} self
 * @returns {(typeof INJURY_PARTS)[number][]}
 */
export function selfInjuryParts(self) {
  return INJURY_PARTS.filter((part) => self.injuries.includes(part));
}

/** @param {PlayerView["self"]} self */
export function hasTreatableInjury(self) {
  return selfInjuryParts(self).length > 0;
}

/**
 * 趕路顯示成本由 public-demo view、本人腳傷與信使被動共同導出。
 * courierRushCostDelta 是刻意為負的折扣，不能走只接受非負數的 inventory normalizer。
 *
 * @param {PlayerView} view
 */
export function effectiveRushStaminaCost(view) {
  const base = normalizeInventoryMetric(view.survivalRules.rushStaminaCost) ?? 0;
  const injuryDelta = view.self.injuries.includes("leg")
    ? normalizeInventoryMetric(view.injuryRules.legRushCostDelta) ?? 0
    : 0;
  const projectedProfessionDelta = view.professionRules.courierRushCostDelta;
  const professionDelta = view.self.profession === "courier" &&
      typeof projectedProfessionDelta === "number" && Number.isFinite(projectedProfessionDelta)
    ? Math.trunc(projectedProfessionDelta)
    : 0;
  return Math.max(0, base + injuryDelta + professionDelta);
}

/**
 * 本局特性只屬於 self；集中產生卡片、狀態列與 welcome 敘事所需的核准六語文案，
 * 避免三個表面各自拼 key 或把 edge.trait 誤當玩家特性。
 *
 * @param {PlayerView["self"]["trait"]} matchTrait
 */
export function matchTraitPresentation(matchTrait) {
  const label = t(`trait.${matchTrait}.label`);
  return {
    label,
    description: t(`trait.${matchTrait}.desc`),
    intro: t("opening.trait.intro", { trait: label }),
    narrative: t(`narrative.trait.${matchTrait}`),
  };
}

/**
 * Preview modifier 的 source 是一般字串；只翻譯已知 UI 語意，未知來源仍保留 server
 * 提供的辨識字串。profession 使用協定配套的通用「職業被動」標籤。
 *
 * @param {string} source
 */
export function previewModifierSourceLabel(source) {
  if (source === "injury") return t("preview.mod.injury");
  if (source === "profession") return t("preview.mod.profession");
  return source;
}

/**
 * 完整投影(welcome/snapshot)的 maxHp 只代表投影當下；先反推基礎值，後續 diff 才能
 * 只靠 self.level 與 message 內的每級增量導出即時上限。
 *
 * @param {PlayerView} view
 */
export function createProgressionProjection(view) {
  const levelCap = Math.max(1, normalizeInventoryMetric(view.progressionRules.levelCap) ?? 1);
  const level = Math.min(
    levelCap,
    Math.max(1, normalizeInventoryMetric(view.self.level) ?? 1),
  );
  const maxHpPerLevel = Math.max(
    0,
    normalizeInventoryMetric(view.progressionRules.maxHpPerLevel) ?? 0,
  );
  const projectedMaxHp = Math.max(
    1,
    normalizeInventoryMetric(view.progressionRules.maxHp) ?? 1,
  );
  return { baseMaxHp: Math.max(1, projectedMaxHp - (level - 1) * maxHpPerLevel) };
}

/**
 * 將公開展示協議的 progressionRules 正規化成單一 UI 讀值。門檻與增量只讀已驗證的
 * 投影，不在 client 重建平衡表；baseMaxHp 應在 welcome/snapshot 時固定，diff 升級後
 * 再由目前 self.level 導出上限。
 *
 * @param {PlayerView} view
 * @param {{baseMaxHp: number}} projection
 */
export function progressionReadout(view, projection) {
  const levelCap = Math.max(1, normalizeInventoryMetric(view.progressionRules.levelCap) ?? 1);
  const level = Math.min(
    levelCap,
    Math.max(1, normalizeInventoryMetric(view.self.level) ?? 1),
  );
  const xp = normalizeInventoryMetric(view.self.xp) ?? 0;
  const thresholds = view.progressionRules.levelThresholds
    .map(normalizeInventoryMetric)
    .filter((threshold) => threshold !== null)
    .slice(0, Math.max(0, levelCap - 1));
  const previousThreshold = level <= 1 ? 0 : thresholds[level - 2] ?? 0;
  const nextThreshold = level >= levelCap ? null : thresholds[level - 1] ?? null;
  const xpToNext = nextThreshold === null ? null : Math.max(0, nextThreshold - xp);
  const xpPercent = nextThreshold === null
    ? 100
    : nextThreshold <= previousThreshold
    ? 0
    : Math.max(
      0,
      Math.min(100, (xp - previousThreshold) / (nextThreshold - previousThreshold) * 100),
    );
  const maxHpPerLevel = Math.max(
    0,
    normalizeInventoryMetric(view.progressionRules.maxHpPerLevel) ?? 0,
  );
  const normalizedBaseMaxHp = Math.max(
    1,
    normalizeInventoryMetric(projection.baseMaxHp) ?? 1,
  );
  const maxHp = normalizedBaseMaxHp + (level - 1) * maxHpPerLevel;
  const hp = Math.min(maxHp, normalizeInventoryMetric(view.self.hp) ?? 0);
  const hpPercent = Math.max(0, Math.min(100, hp / maxHp * 100));
  return {
    level,
    levelCap,
    xp,
    xpToNext,
    xpPercent,
    maxHp,
    hp,
    hpPercent,
    capped: level >= levelCap,
  };
}

/**
 * 前端最後一道可見性護欄：即使異常 payload 把 level 塞進人影，
 * 未辨識目標仍不得顯示。呼叫端只在非 null 時渲染 badge。
 *
 * @param {VisiblePlayer} player
 * @returns {number | null}
 */
export function identifiedPlayerLevel(player) {
  if (!player.identified) return null;
  const level = normalizeInventoryMetric(player.level);
  return level !== null && level >= 1 ? level : null;
}

/**
 * 將 server inventory 中既有的可用道具分成 3 格快捷列與不會遺失入口的 overflow。
 * 相同 kind 只顯示一次；這個 helper 不改寫原 inventory，也不新增使用規則。
 *
 * @param {import("@darkforest/protocol").ItemStack[]} inventory
 */
export function partitionQuickUseItems(inventory) {
  const hasTool = inventory.some((item) =>
    item.kind === "tool" && (normalizeInventoryMetric(item.count) ?? 0) > 0
  );
  /** @type {Map<import("@darkforest/protocol").ItemKind, import("@darkforest/protocol").ItemStack>} */
  const unique = new Map();
  for (const item of inventory) {
    const count = normalizeInventoryMetric(item.count);
    if (
      count === null || count <= 0 || !QUICK_USE_ITEM_KINDS.has(item.kind) ||
      item.kind === "scrap" && !hasTool
    ) continue;
    const previous = unique.get(item.kind);
    const durability = normalizeInventoryMetric(item.durability);
    const normalized = {
      kind: item.kind,
      count,
      ...(durability === null ? {} : { durability }),
    };
    unique.set(
      item.kind,
      previous === undefined
        ? normalized
        : { ...previous, count: previous.count + normalized.count },
    );
  }
  const usable = [...unique.values()];
  return { quick: usable.slice(0, 3), overflow: usable.slice(3) };
}

/**
 * Field Supply 商店以 loot 單位交易；目前只有輕彈一個交易單位是 6 發，其餘皆為 1 件。
 * 這是公開展示協議的訊息語意，不是 client 另建的價格／平衡表。
 *
 * @param {import("@darkforest/protocol").ItemKind} kind
 */
export function shopTradeUnitCount(kind) {
  return kind === "light_ammo" ? 6 : 1;
}

/**
 * 將到場才可見的 NodeView.shop 投影成純 UI affordance。價格、存量與現金只讀 server view；
 * client 只先擋住確定會被拒絕的「錢不夠／售罄／未持有／共用冷卻」狀態，真正交易仍由
 * server command 裁定。
 *
 * @param {PlayerView} view
 * @param {number} gameNowMs
 */
export function shopCatalogPresentation(view, gameNowMs) {
  const node = view.nodes.find((candidate) => candidate.id === view.self.node);
  const catalog = node?.shop?.catalog ?? [];
  const buyCooldown = normalizeInventoryMetric(view.self.cooldownsUntilMs.shop_buy) ?? 0;
  const sellCooldown = normalizeInventoryMetric(view.self.cooldownsUntilMs.shop_sell) ?? 0;
  const cooldownUntilMs = Math.max(buyCooldown, sellCooldown);
  const active = view.self.status === "active" &&
    (view.phase === "megacity" || view.phase === "darkforest");
  const cooling = cooldownUntilMs > gameNowMs;
  const credits = normalizeInventoryMetric(view.self.credits) ?? 0;
  const inventoryCount = (/** @type {import("@darkforest/protocol").ItemKind} */ kind) =>
    view.self.inventory
      .filter((item) => item.kind === kind)
      .reduce((total, item) => total + (normalizeInventoryMetric(item.count) ?? 0), 0);
  return {
    available: node?.shop !== undefined,
    active,
    cooling,
    cooldownUntilMs,
    credits,
    entries: catalog.map((entry) => {
      const unitCount = shopTradeUnitCount(entry.item);
      const ownedCount = inventoryCount(entry.item);
      const soldOut = entry.stockLeft !== undefined && entry.stockLeft <= 0;
      const affordable = credits >= entry.buyPrice;
      const owned = ownedCount >= unitCount;
      return {
        ...entry,
        unitCount,
        ownedCount,
        soldOut,
        affordable,
        owned,
        canBuy: active && !cooling && !soldOut && affordable,
        canSell: active && !cooling && owned,
      };
    }),
  };
}

/**
 * 只依現有 inventory 判斷武器是否缺少可送 Preview 的基本資源。
 * 傷害、射程與命中仍一律由 server Preview 決定。
 *
 * @param {import("@darkforest/protocol").ItemStack[]} inventory
 * @param {import("@darkforest/protocol").WeaponKind} weapon
 * @returns {"NO_ITEM" | "NO_DURABILITY" | "NO_AMMO" | null}
 */
export function combatWeaponBlockReason(inventory, weapon) {
  const stack = inventory.find((item) =>
    item.kind === weapon && (normalizeInventoryMetric(item.count) ?? 0) > 0
  );
  if (stack === undefined) return "NO_ITEM";
  if (isDurabilityWeapon(weapon)) {
    const durability = normalizeInventoryMetric(stack.durability);
    return durability !== null && durability <= 0 ? "NO_DURABILITY" : null;
  }
  // 公開展示訊息使用第一個 light_ammo stack；這裡維持相同的 UI 語意。
  const ammo = normalizeInventoryMetric(
    inventory.find((item) => item.kind === "light_ammo")?.count,
  ) ?? 0;
  return ammo > 0 ? null : "NO_AMMO";
}

/**
 * 戰鬥操作的本地阻擋優先序。精確規則與數值仍由 server Preview 決定；這裡只避免
 * 玩家點到已知必定失敗的控制項，並讓畫面理由與 resolve 的先後一致。
 *
 * @param {{status: string, pending: boolean, casting: boolean, spawnGrace: boolean, cooling: boolean, resource: "NO_ITEM" | "NO_DURABILITY" | "NO_AMMO" | null}} state
 * @returns {"STATUS" | "PENDING" | "CASTING" | "SPAWN_GRACE" | "COOLDOWN" | "NO_ITEM" | "NO_DURABILITY" | "NO_AMMO" | null}
 */
export function combatActionBlockReason(state) {
  if (state.status !== "active") return "STATUS";
  if (state.pending) return "PENDING";
  if (state.casting) return "CASTING";
  if (state.spawnGrace) return "SPAWN_GRACE";
  if (state.cooling) return "COOLDOWN";
  return state.resource;
}

/**
 * 把仍在自衛時限內的 contact/player alias 對回畫面當下可用的 ref。
 * @param {VisiblePlayer[]} visiblePlayers
 * @param {Map<string, number>} recentHostileUntilMs
 * @param {number} gameNowMs
 */
export function visibleRecentHostileRefs(visiblePlayers, recentHostileUntilMs, gameNowMs) {
  return new Set(
    visiblePlayers.filter((player) =>
      [player.ref, player.contactRef].some((ref) =>
        ref !== undefined && (recentHostileUntilMs.get(ref) ?? 0) > gameNowMs
      )
    ).map((player) => player.ref),
  );
}

/**
 * 從玩家目前真正持有且可用的武器挑選一件。武器資料不足時寧可不出手。
 * @param {PlayerView} current
 * @param {VisiblePlayer=} target
 * @returns {import("@darkforest/protocol").WeaponKind | null}
 */
export function engagementWeapon(current, target) {
  const usable = (/** @type {import("@darkforest/protocol").WeaponKind} */ kind) => {
    return combatWeaponBlockReason(current.self.inventory, kind) === null;
  };
  const order = /** @type {Array<import("@darkforest/protocol").WeaponKind | null>} */ ([
    current.self.equippedWeapon,
    "rifle",
    "pistol",
    "cleaver",
    "tool",
    "golf_club",
    "stool",
  ]);
  const inRange = (/** @type {import("@darkforest/protocol").WeaponKind} */ kind) => {
    if (target === undefined) return true;
    const sameNode = target.node === current.self.node;
    if (sameNode) return kind !== "rifle";
    const activePhase = current.phase === "darkforest" ? "darkforest" : "megacity";
    const edge = current.map.edges.find((candidate) =>
      (candidate.from === current.self.node && candidate.to === target.node) ||
      (candidate.to === current.self.node && candidate.from === target.node)
    );
    const adjacent = edge !== undefined &&
      (edge.phase === "both" || edge.phase === activePhase) &&
      current.nodes.find((node) => node.id === current.self.node)?.open === true &&
      current.nodes.find((node) => node.id === target.node)?.open === true;
    if (!adjacent) return false;
    if (isMeleeWeapon(kind)) return false;
    return kind === "pistol" || edge.noLos === false;
  };
  return /** @type {import("@darkforest/protocol").WeaponKind | null} */ (
    order.find((kind) => kind !== null && usable(kind) && inRange(kind)) ?? null
  );
}

/**
 * 交戰方針只讀 client 已可見資訊。未辨識人影永遠不會被半自動選為攻擊目標。
 * @param {PlayerView} current
 * @param {keyof typeof ENGAGEMENT_POLICY_COPY} policy
 * @param {Set<string>} recentHostileRefs
 */
export function engagementTarget(current, policy, recentHostileRefs) {
  if (policy === "avoid" || current.self.status !== "active") return null;
  const oathGood = current.self.oath === "oathed" || current.self.oath === "restored";
  const hpRank = { critical: 0, hurt: 1, healthy: 2, downed: 3 };
  const armorRank = { light: 0, medium: 1, heavy: 2 };
  return [...current.visiblePlayers].filter((player) => {
    if (!player.identified || player.status !== "active") return false;
    if (policy === "retaliate") return recentHostileRefs.has(player.ref);
    return !(
      current.self.background === "rootbound" && oathGood && player.background === "rootbound"
    );
  }).sort((a, b) =>
    Number(b.node === current.self.node) - Number(a.node === current.self.node) ||
    hpRank[a.hpBand ?? "healthy"] - hpRank[b.hpBand ?? "healthy"] ||
    armorRank[a.armorSilhouette] - armorRank[b.armorSilhouette] ||
    a.ref.localeCompare(b.ref)
  )[0] ?? null;
}

/**
 * Preview 仍由 server 算；前端只決定「先看／等結果／依核准結果出手」。
 * @param {PlayerView} current
 * @param {keyof typeof ENGAGEMENT_POLICY_COPY} policy
 * @param {Set<string>} recentHostileRefs
 * @param {import("@darkforest/protocol").PreviewResponseMsg | null} preview
 * @param {{target: string, weapon: import("@darkforest/protocol").WeaponKind, combatLease?: string | null} | null} context
 */
export function engagementPolicyStep(current, policy, recentHostileRefs, preview, context) {
  const target = engagementTarget(current, policy, recentHostileRefs);
  if (target === null) {
    const unknownAttacker = policy === "retaliate" &&
      current.visiblePlayers.some((player) =>
        !player.identified && player.status === "active" && recentHostileRefs.has(player.ref)
      );
    return unknownAttacker
      ? /** @type {const} */ ({
        kind: "blocked",
        reason: t("situation.blocked.unknown_attacker"),
      })
      : /** @type {const} */ ({ kind: "none" });
  }
  const weapon = engagementWeapon(current, target);
  if (weapon === null) {
    return /** @type {const} */ ({ kind: "blocked", reason: t("situation.blocked.no_weapon") });
  }
  if (
    context?.target !== target.ref || context.weapon !== weapon ||
    context?.combatLease !== undefined &&
      context.combatLease !== combatPreviewLease(current, target.ref, weapon)
  ) {
    return /** @type {const} */ ({ kind: "preview", target, weapon });
  }
  if (preview === null) return /** @type {const} */ ({ kind: "waiting", target, weapon });
  if (!preview.allowed) {
    return /** @type {const} */ ({ kind: "blocked", reason: t("situation.blocked.not_allowed") });
  }
  if ((preview.warnings ?? []).some((warning) => warning !== "CROSS_NODE")) {
    return /** @type {const} */ ({ kind: "blocked", reason: t("situation.blocked.unclear_risk") });
  }
  return /** @type {const} */ ({
    kind: "attack",
    target,
    weapon,
    payload: /** @type {ActionPayload} */ ({ action: "attack", target: target.ref, weapon }),
  });
}

/**
 * Resolve only the targets that the encounter prompt currently permits the player to act on.
 * `targetRefs` is already fog-filtered by the server; stale refs are ignored instead of falling
 * back to another visible player.
 * @param {PlayerView} current
 * @returns {VisiblePlayer[]}
 */
export function visibleEncounterTargets(current) {
  const visibleByRef = new Map(current.visiblePlayers.map((player) => [player.ref, player]));
  return (current.encounterPrompt?.targetRefs ?? []).flatMap((ref) => {
    const player = visibleByRef.get(ref);
    return player === undefined ? [] : [player];
  });
}

/**
 * Density rule for T1: a same-node target (or an already identified adjacent target) deserves
 * the full decision card. Only adjacent, unidentified silhouettes stay a lightweight hint.
 * @param {PlayerView} current
 */
export function encounterPresentation(current) {
  const targets = visibleEncounterTargets(current);
  if (current.encounterPrompt === undefined || targets.length === 0) {
    return /** @type {const} */ ({ level: "none", targets });
  }
  const full = targets.some((target) => target.node === current.self.node || target.identified);
  return { level: /** @type {"full" | "light"} */ (full ? "full" : "light"), targets };
}

/** @param {PlayerView} current @param {boolean} semi */
export function encounterBlocksNarrativeOptions(current, semi) {
  return encounterPresentation(current).level !== "none" && !semi;
}

/** @param {VisiblePlayer} player */
export function encounterTargetDescription(player) {
  const limp = player.limping ? ` · ${t("hud.limping")}` : "";
  if (player.identified) return `${player.playerId ?? player.ref}${limp}`;
  const weapon = player.equippedWeapon === null
    ? t("situation.silhouette.unarmed")
    : t("situation.silhouette.weapon_outline", { item: t(`item.${player.equippedWeapon}`) });
  const armor = t(`armor.${player.armorSilhouette}`);
  return `${t("situation.silhouette.description", { weapon, armor })}${limp}`;
}

/** @param {PlayerView} current */
export function encounterPromptLine(current) {
  const targets = visibleEncounterTargets(current).map(encounterTargetDescription).join(
    t("narrative.list_separator"),
  );
  if (current.encounterPrompt?.style === "rush") {
    return t("situation.encounter.prompt_rush", { targets });
  }
  return t("situation.encounter.prompt_sneak", { targets });
}

/**
 * Bind the player's SEMI engagement policy to the encounter target subset. Avoid continues,
 * self-defence observes until a permitted target attacks, and hunt reuses Preview -> attack.
 * @param {PlayerView} current
 * @param {keyof typeof ENGAGEMENT_POLICY_COPY} policy
 * @param {Set<string>} recentHostileRefs
 * @param {import("@darkforest/protocol").PreviewResponseMsg | null} preview
 * @param {{target: string, weapon: import("@darkforest/protocol").WeaponKind, combatLease?: string | null} | null} context
 */
export function encounterPolicyStep(current, policy, recentHostileRefs, preview, context) {
  const prompt = current.encounterPrompt;
  if (prompt === undefined) return /** @type {const} */ ({ kind: "none" });
  if (policy === "avoid") {
    return /** @type {const} */ ({
      kind: "continue",
      payload: /** @type {ActionPayload} */ ({
        action: "encounter_continue",
        encounterId: prompt.encounterId,
      }),
    });
  }
  const targets = visibleEncounterTargets(current);
  if (targets.length === 0) return /** @type {const} */ ({ kind: "observe" });
  const step = engagementPolicyStep(
    { ...current, visiblePlayers: targets },
    policy,
    recentHostileRefs,
    preview,
    context,
  );
  if (step.kind === "none") return /** @type {const} */ ({ kind: "observe" });
  return step;
}

/** @param {PlayerView["self"]["status"]} status */
export function narrativeMomentHeading(status) {
  if (status === "eliminated") return t("situation.heading.eliminated");
  if (status === "echo") return t("situation.heading.echo");
  return t("situation.heading.active");
}

/** @param {string | null} stored @param {boolean} mobile @returns {"narrative"} */
export function resolvePlayViewMode(stored, mobile) {
  // The tactical map is a spectator-only surface. Active players always enter
  // the narrative survival console, even if an older build stored "hud".
  void stored;
  void mobile;
  return "narrative";
}

/**
 * The 2.5D field is the default active-player surface. `arena=0` remains a narrow QA switch for
 * comparing the text-first layout. Spectator presentation retains the tactical map.
 * @param {string} search
 * @param {boolean=} spectator
 */
export function resolveArenaExperiment(search, spectator = false) {
  if (spectator) return false;
  return new URLSearchParams(search).get("arena") !== "0";
}

/**
 * 公開 demo 觀戰圖使用穩定的 4×3 佈局，避免 runtime id 的 shuffle
 * 改變空間可讀性。連線仍依公開 topology edges 繪製。
 * @param {import("@darkforest/protocol").NodeId[]} nodeIds
 */
export function compactTopologyPositions(nodeIds) {
  return Object.fromEntries(nodeIds.map((nodeId, index) => [nodeId, {
    x: 12.5 + (index % 4) * 25,
    y: 16.5 + Math.floor(index / 4) * 33.5,
  }]));
}

/**
 * 非 active 狀態先鎖定主要選項，避免 Echo 誤拾物資、Downed 誤救援。
 * `null` 代表 active 玩家繼續走一般情境排序。
 * 傳入完整 self 時可排除「已調諧目前節點」的無效 Attune；字串形式保留給只需狀態鎖的呼叫者。
 * @param {PlayerView["self"]["status"] | Pick<PlayerView["self"], "status" | "node" | "attunedNodes">} selfOrStatus
 * @returns {NarrativeOption[] | null}
 */
export function statusLockedNarrativeOptions(selfOrStatus) {
  const status = typeof selfOrStatus === "string" ? selfOrStatus : selfOrStatus.status;
  if (status === "echo") {
    const travel = /** @type {NarrativeOption} */ ({
      key: "echo-travel",
      slot: "S2",
      label: t("situation.option.travel.label"),
      note: t("situation.option.travel.note"),
      kind: "open",
    });
    const alreadyAttuned = typeof selfOrStatus !== "string" &&
      selfOrStatus.attunedNodes.includes(selfOrStatus.node);
    if (alreadyAttuned) return [travel];
    return [{
      key: "echo-attune",
      slot: "S2",
      label: t("situation.option.attune.label"),
      note: t("situation.option.attune.note"),
      kind: "payload",
      payload: { action: "echo_attune" },
    }, travel];
  }
  return status === "active" ? null : [];
}

/**
 * Quick Match 的 Rootheart 入口。只用公開地圖語意與 server game time；
 * server 仍是最終裁決者，未開放時會以 FINALE_LOCKED 拒絕。
 * @param {PlayerView} current
 */
export function finaleEntryAvailable(current) {
  if (
    current.phase !== "darkforest" || current.self.status !== "active" ||
    current.gameNowMs < 1_050_000 || current.finale !== undefined
  ) return false;
  return current.map.rootheartNodeId === current.self.node;
}

/**
 * Public-demo finale actions. Visibility is derived only from the validated PlayerView; a real
 * service would still need to authorize and resolve every action independently.
 * @param {PlayerView} current
 */
export function finaleActionAvailability(current) {
  const finale = current.finale;
  if (finale === undefined) {
    return {
      canCommit: finaleEntryAvailable(current),
      canJoin: false,
      canInterrupt: false,
      canCancel: false,
    };
  }
  const joined = finale.participants.includes(current.self.playerId);
  const atRootheart = current.self.node === finale.node;
  const active = current.self.status === "active";
  return {
    canCommit: false,
    canJoin: finale.mode === "arbora" && finale.stage === "offer" && atRootheart && active &&
      !joined && finale.participants.length < 3,
    canInterrupt: finale.mode === "arbora" && finale.stage === "channel" && atRootheart && active &&
      !joined && finale.interruptor === undefined,
    canCancel: joined && (finale.stage === "offer" || finale.stage === "channel"),
  };
}

/** @param {NonNullable<PlayerView["finale"]>} finale */
export function finaleStageDurationMs(finale) {
  if (finale.stage === "offer") return 20_000;
  if (finale.stage === "survive") return 60_000;
  return finale.mode === "solo" ? 30_000 : 45_000;
}

/** @param {ActionPayload} payload */
function payloadKey(payload) {
  return `${payload.action}:${JSON.stringify(payload)}`;
}

/**
 * Turn an existing Assist decision into the S1 wording required by Narrative Mode.
 * No rule is recomputed here; readiness and payload remain owned by getAssistDecision.
 * @param {{payload?: ActionPayload, state: string}} decision
 * @returns {NarrativeOption | null}
 */
export function assistDecisionOption(decision) {
  if (decision.state !== "ready" || decision.payload === undefined) return null;
  const payload = decision.payload;
  switch (payload.action) {
    case "move":
    case "echo_move":
      return {
        key: payloadKey(payload),
        slot: "S1",
        label: t("situation.option.move.label", { to: payload.to }),
        note: t("situation.option.move.note"),
        kind: "payload",
        payload,
      };
    case "search":
      return {
        key: payloadKey(payload),
        slot: "S1",
        label: t("situation.option.search.label"),
        note: t("situation.option.search.note"),
        kind: "payload",
        payload,
      };
    case "hide":
      return {
        key: payloadKey(payload),
        slot: "S1",
        label: t("situation.option.hide.label"),
        note: t("situation.option.hide.note"),
        kind: "payload",
        payload,
      };
    case "use_item":
      if (payload.item === "healthy_food" || payload.item === "spoiled_food") {
        return {
          key: payloadKey(payload),
          slot: "S1",
          label: payload.item === "healthy_food"
            ? t("situation.option.eat_healthy.label")
            : t("situation.option.eat_spoiled.label"),
          note: t("situation.option.eat.note"),
          kind: "payload",
          payload,
        };
      }
      return {
        key: payloadKey(payload),
        slot: "S1",
        label: t("situation.option.treat.label"),
        note: t("situation.option.treat.note"),
        kind: "payload",
        payload,
      };
    case "echo_attune":
      return {
        key: payloadKey(payload),
        slot: "S1",
        label: t("situation.option.attune.label"),
        note: t("situation.option.attune.note"),
        kind: "payload",
        payload,
      };
    default:
      return null;
  }
}

/**
 * active 移動永遠成對；root 路徑只保留潛行。
 * Echo 沒有噪音/暴露概念,維持單一移動選項。
 * @param {Extract<ActionPayload, {action: "move" | "echo_move"}>} payload
 * @param {string} destinationName
 * @param {"tunnel" | "root" | undefined} trait
 * @param {"S1" | "S2" | "S3"=} slot
 * @returns {NarrativeOption[]}
 */
export function movementStyleOptions(payload, destinationName, trait, slot = "S1") {
  if (payload.action === "echo_move") {
    return [{
      key: payloadKey(payload),
      slot,
      label: t("situation.option.echo_move.label", { destination: destinationName }),
      note: t("situation.option.echo_move.note"),
      kind: "payload",
      payload,
    }];
  }
  const rush = /** @type {NarrativeOption} */ ({
    key: `move-rush-${payload.to}`,
    slot,
    label: t("situation.option.rush.label", { destination: destinationName }),
    note: t("situation.option.rush.note"),
    kind: "payload",
    payload: { action: "move", to: payload.to, style: "rush" },
  });
  const sneak = /** @type {NarrativeOption} */ ({
    key: `move-sneak-${payload.to}`,
    slot,
    label: t("situation.option.sneak.label", { destination: destinationName }),
    note: trait === "root"
      ? t("situation.option.sneak.note_root")
      : t("situation.option.sneak.note_default"),
    kind: "payload",
    payload: { action: "move", to: payload.to, style: "sneak" },
  });
  return trait === "root" ? [sneak] : [rush, sneak];
}

/**
 * @param {{payload?: ActionPayload, state: string}} decision
 * @param {string=} destinationName
 * @param {"tunnel" | "root" | undefined=} trait
 * @returns {NarrativeOption[]}
 */
export function assistDecisionOptions(decision, destinationName, trait) {
  if (decision.state !== "ready" || decision.payload === undefined) return [];
  if (decision.payload.action === "move" || decision.payload.action === "echo_move") {
    return movementStyleOptions(
      decision.payload,
      destinationName ?? decision.payload.to,
      trait,
    );
  }
  const option = assistDecisionOption(decision);
  return option === null ? [] : [option];
}

/**
 * Choose the latest situation without exposing anything outside PlayerView/diff.
 * @param {PlayerView | null} _previous
 * @param {PlayerView} current
 * @param {MatchEvent[]} events
 * @param {Set<string>=} recentHostileRefs
 * @returns {NarrativeSituation}
 */
export function selectNarrativeSituation(
  _previous,
  current,
  events,
  recentHostileRefs = new Set(),
) {
  if (current.finale !== undefined) return { kind: "finale" };
  if (current.insightPrompt !== undefined) return { kind: "insight" };
  if (current.legacyPrompt !== undefined) return { kind: "legacy" };
  if (current.self.status === "downed") return { kind: "downed-self" };
  if (current.self.status === "echo") return { kind: "echo" };

  const blockade = events.findLast((event) =>
    event.kind === "blockade_preview" && event.node === current.self.node
  );
  if (blockade !== undefined) return { kind: "blockade", event: blockade };

  const rescue = events.findLast((event) =>
    event.kind === "player_downed" && event.player !== current.self.playerId &&
    event.node === current.self.node
  );
  if (rescue !== undefined) return { kind: "rescue", event: rescue };

  // 看得見不等於敵對：只有本次攻擊者或仍在 30 秒自衛記憶內的玩家能壓過一般選項。
  // 同節點 > 本次攻擊者 > 輕甲 > 相鄰；全部只使用 client 已獲得的迷霧資料。
  const immediateAttackers = new Set(
    events.flatMap((event) =>
      event.kind === "combat" && event.target === current.self.playerId ? [event.attacker] : []
    ),
  );
  const armorRank = { light: 0, medium: 1, heavy: 2 };
  const visibleThreat = current.phase === "megacity" && current.gameNowMs < 30_000
    ? undefined
    : [...current.visiblePlayers].filter((player) =>
      player.status === "active" && [player.ref, player.contactRef].some((ref) =>
        ref !== undefined && (immediateAttackers.has(ref) || recentHostileRefs.has(ref))
      )
    )
      .sort((a, b) =>
        Number(b.node === current.self.node) - Number(a.node === current.self.node) ||
        Number(
            [b.ref, b.contactRef].some((ref) => ref !== undefined && immediateAttackers.has(ref)),
          ) -
          Number(
            [a.ref, a.contactRef].some((ref) => ref !== undefined && immediateAttackers.has(ref)),
          ) ||
        armorRank[a.armorSilhouette] - armorRank[b.armorSilhouette] ||
        a.ref.localeCompare(b.ref)
      )[0];
  if (visibleThreat !== undefined) {
    return {
      kind: visibleThreat.identified ? "player" : "contact",
      player: visibleThreat,
    };
  }

  const cache = events.findLast((event) =>
    event.kind === "cache_dropped" && event.node === current.self.node
  );
  if (cache !== undefined) return { kind: "cache", event: cache };

  const hazard = events.findLast((event) => event.kind === "hazard_revealed");
  if (hazard !== undefined) return { kind: "hazard", event: hazard };

  const noise = events.findLast((event) => event.kind === "noise");
  if (noise !== undefined) return { kind: "noise", event: noise };

  const trace = events.findLast((event) =>
    event.kind === "supply_event" && event.eventId === "SUPPLY_ROUTE_TRACE"
  );
  if (trace !== undefined) return { kind: "trace", event: trace };

  return { kind: "none" };
}

/**
 * A successful move teaches the attempted edge, including a got_lost detour.
 * This mirrors only information already visible to this client; it does not expose
 * server-side traversedEdges.
 * @param {PlayerView} previous
 * @param {PlayerView} current
 * @param {MatchEvent[]} events
 */
export function familiarEdgesFromDiff(previous, current, events) {
  const self = current.self.playerId;
  const lost = events.findLast((event) => event.kind === "got_lost" && event.player === self);
  const attemptedNode = lost?.kind === "got_lost"
    ? lost.intended
    : previous.self.node !== current.self.node
    ? current.self.node
    : null;
  if (attemptedNode === null) return [];
  const edge = current.map.edges.find((candidate) =>
    (candidate.from === previous.self.node && candidate.to === attemptedNode) ||
    (candidate.to === previous.self.node && candidate.from === attemptedNode)
  );
  return edge === undefined ? [] : [edge.id];
}

/**
 * 主界面最多三個真正選項。S4 路線永遠保留；有兩個威脅回應時，
 * 兩者一起保留並讓一般意圖退位。
 * @param {NarrativeOption | NarrativeOption[] | null} s1
 * @param {NarrativeOption[]} s2
 * @param {NarrativeOption | null} s3
 * @returns {NarrativeOption[]}
 */
export function assembleNarrativeOptions(s1, s2, s3) {
  /** @type {NarrativeOption[]} */
  const result = [];
  const pushUnique = (/** @type {NarrativeOption} */ option) => {
    const fingerprint = option.payload === undefined
      ? option.key
      : `${option.kind}:${payloadKey(option.payload)}`;
    if (
      !result.some((candidate) =>
        (candidate.payload === undefined
          ? candidate.key
          : `${candidate.kind}:${payloadKey(candidate.payload)}`) === fingerprint
      )
    ) result.push(option);
  };
  const s1Options = s1 === null ? [] : Array.isArray(s1) ? s1 : [s1];
  // 先填兩個高優先槽，第三槽固定留給局部路線。
  if (s2.length >= 2) {
    s2.slice(0, 2).forEach(pushUnique);
  } else {
    s2.forEach(pushUnique);
    for (const option of s1Options) {
      if (result.length >= 2) break;
      pushUnique(option);
    }
    if (result.length < 2 && s3 !== null) pushUnique(s3);
  }
  const more = /** @type {NarrativeOption} */ ({
    key: "open-routes",
    slot: "S4",
    label: t("situation.option.more.label"),
    note: t("situation.option.more.note"),
    kind: "open",
  });
  return [...result.slice(0, 2), more];
}

/**
 * 指揮官入口雖畫在 option grid 外，仍算一個主要選擇。三槽已滿時隱藏入口，不排擠 S4 或情境回應。
 * @param {NarrativeOption[]} options
 */
export function commanderEntryFits(options) {
  return options.length < 3;
}

/**
 * T1.1 會為 wire 版本連續性送出純 heartbeat diff。這類訊息只推進版本與遊戲時鐘，
 * 不應拆掉玩家正在按的互動 DOM；時間門檻仍由 client 的 updateTimers 處理。
 * @param {import("@darkforest/protocol").StateDiffMsg} diff
 */
export function diffRequiresFullRender(diff) {
  return diff.events.length > 0 || diff.self !== undefined ||
    diff.visiblePlayers !== undefined || diff.nodes !== undefined ||
    diff.aliveCount !== undefined || diff.echoCount !== undefined ||
    diff.phase !== undefined || diff.legacyPrompt !== undefined ||
    diff.insightPrompt !== undefined || diff.finale !== undefined ||
    diff.encounterPrompt !== undefined;
}

/**
 * 固定 5 秒氣力回復只改 stamina；這種 diff 可用局部數值更新，避免拆掉玩家正在操作的
 * 戰鬥 select、鍵盤焦點或已展開的背包。
 * @param {import("@darkforest/protocol").SelfState} previous
 * @param {import("@darkforest/protocol").SelfState} current
 */
export function isPassiveStaminaChange(previous, current) {
  if (previous.stamina === current.stamina) return false;
  const { stamina: _previousStamina, ...previousRest } = previous;
  const { stamina: _currentStamina, ...currentRest } = current;
  return JSON.stringify(previousRest) === JSON.stringify(currentRest);
}

/**
 * Build the smallest client-side lease for a Combat Preview. The server remains the authority,
 * but an automatic attack must never reuse a preview after a fact that changes its legality or
 * safety has changed. Deliberately exclude game clock, Signal, stamina, unrelated players and
 * narrative events: those arrive frequently and used to reset SEMI's 1.5 second safety window.
 *
 * @param {PlayerView} current
 * @param {string} targetRef
 * @param {import("@darkforest/protocol").WeaponKind} weapon
 * @returns {string | null}
 */
export function combatPreviewLease(current, targetRef, weapon) {
  const target = current.visiblePlayers.find((player) => player.ref === targetRef);
  if (target === undefined) return null;
  const weaponStack = current.self.inventory.find((item) => item.kind === weapon);
  const ammoStack = current.self.inventory.find((item) => item.kind === "light_ammo");
  const selfNode = current.nodes.find((node) => node.id === current.self.node);
  const targetNode = current.nodes.find((node) => node.id === target.node);
  const path = current.self.node === target.node
    ? "same-node"
    : current.map.edges.filter((edge) =>
      (edge.from === current.self.node && edge.to === target.node) ||
      (edge.to === current.self.node && edge.from === target.node)
    ).map((edge) => [edge.id, edge.phase, edge.noLos, edge.trait ?? "standard"]);
  return JSON.stringify({
    phase: current.phase,
    self: {
      background: current.self.background,
      oath: current.self.oath,
      status: current.self.status,
      node: current.self.node,
      injuries: selfInjuryParts(current.self),
      weapon: current.self.equippedWeapon,
      hasNvg: current.self.equipment.helmet?.kind === "nvg_helmet",
      attackCooldown: current.self.cooldownsUntilMs.attack ?? null,
      selectedWeapon: {
        count: weaponStack?.count ?? 0,
        durability: weaponStack?.durability ?? null,
      },
      lightAmmo: isDurabilityWeapon(weapon) ? null : ammoStack?.count ?? 0,
    },
    target: {
      ref: target.ref,
      identified: target.identified,
      node: target.node,
      status: target.status,
      weapon: target.equippedWeapon,
      armor: target.armorSilhouette,
      background: target.background ?? null,
      oath: target.oath ?? null,
    },
    route: {
      selfOpen: selfNode?.open ?? false,
      targetOpen: targetNode?.open ?? false,
      path,
    },
  });
}

/**
 * Decide whether the client should proactively refresh the authoritative combat Preview.
 * Returning the lease (instead of a boolean) lets the caller re-check the exact same combat
 * situation inside a microtask before it sends anything. A player who chose to hold fire is not
 * interrupted again until the target, weapon, route, resources, or another combat fact changes.
 *
 * @param {PlayerView} current
 * @param {string} targetRef
 * @param {import("@darkforest/protocol").WeaponKind} weapon
 * @param {{target: string, weapon: import("@darkforest/protocol").WeaponKind, combatLease?: string | null} | null} context
 * @param {string | null} dismissedLease
 * @returns {string | null}
 */
export function automaticCombatPreviewLease(
  current,
  targetRef,
  weapon,
  context,
  dismissedLease,
) {
  const lease = combatPreviewLease(current, targetRef, weapon);
  if (lease === null || lease === dismissedLease) return null;
  if (
    context !== null && context.target === targetRef && context.weapon === weapon &&
    context.combatLease === lease
  ) return null;
  return lease;
}

/**
 * Return an expired attack cooldown exactly once so the UI can wake its automatic Preview even
 * when the server only sends heartbeat diffs at the deadline.
 *
 * @param {number | undefined} deadline
 * @param {number} gameNowMs
 * @param {number | null} handledDeadline
 * @returns {number | null}
 */
export function expiredCombatCooldownWake(deadline, gameNowMs, handledDeadline) {
  if (deadline === undefined || deadline > gameNowMs || deadline === handledDeadline) return null;
  return deadline;
}

/**
 * Manual Preview→Confirm is a short interaction lock; unrelated diffs must not remove its button.
 * SEMI follows the same rule, but invalidates when the combat lease changes instead of whenever
 * the global wire version advances.
 * @param {boolean} automatic
 * @param {PlayerView} next
 * @param {{target: string, weapon: import("@darkforest/protocol").WeaponKind, combatLease?: string | null}} context
 */
export function shouldInvalidatePreviewForVersion(automatic, next, context) {
  return automatic &&
    context.combatLease !== combatPreviewLease(next, context.target, context.weapon);
}

/**
 * @template {{atGameMs: number, level: string}} T
 * @param {T[]} entries
 * @returns {T[]}
 */
export function spectatorBroadcastEntries(entries) {
  return entries.filter((entry) => entry.level === "broadcast");
}

/**
 * Select catalog-backed wording without inventing an event or sentence.
 * @param {import("@darkforest/protocol").Tag[]} tags
 * @param {Set<string>} used
 */
export function nextNarrativeAdjective(tags, used) {
  const knownTags = new Set([
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
  const phrase = tags
    .filter((tag) => knownTags.has(tag))
    .map((tag) => t(`tag.${tag}`))
    .find((candidate) => !used.has(candidate));
  return phrase ?? null;
}
