// Generated from browser/tactical_arena.js by scripts/emit_client.ts. Do not edit.
// @ts-check
/**
 * Tactical Arena — a deliberately isolated, dependency-free 2.5D renderer.
 *
 * It only consumes a projection supplied by the HUD.  It does not know about
 * sockets, rules, timers, or action dispatch.  Animation is cosmetic: a model
 * update is visible immediately and no animation ever completes a game action.
 */

const TAU = Math.PI * 2;
const ROOT_GOLD = [0.77, 0.56, 0.18, 1];
const CYAN = [0.12, 0.94, 0.88, 1];
const AMBER = [1, 0.61, 0.16, 1];
const RED = [1, 0.24, 0.24, 1];
const RESET_CINEMATIC_START_MS = 450_000;
const RESET_CINEMATIC_END_MS = 462_000;
/**
 * The public demo keeps the world-transition projection visible until this fixture timestamp so
 * the interface can explain that reconstruction is still in progress after the short cinematic.
 */
const RESET_END_MS = 510_000;
const CONTACT_ANCHORS = Object.freeze([
  // Keep contacts inside the central stage. Cardinal exits own the outer
  // gutters, and the top centre is deliberately left open for the up exit.
  { x: 0.34, y: 0.40 },
  { x: 0.66, y: 0.40 },
  { x: 0.28, y: 0.48 },
  { x: 0.39, y: 0.48 },
  { x: 0.50, y: 0.48 },
  { x: 0.61, y: 0.48 },
  { x: 0.72, y: 0.48 },
  { x: 0.25, y: 0.55 },
  { x: 0.35, y: 0.55 },
  { x: 0.45, y: 0.55 },
  { x: 0.55, y: 0.55 },
  { x: 0.65, y: 0.55 },
  { x: 0.75, y: 0.55 },
  { x: 0.27, y: 0.61 },
  { x: 0.36, y: 0.61 },
  { x: 0.42, y: 0.61 },
  { x: 0.58, y: 0.61 },
  { x: 0.64, y: 0.61 },
  { x: 0.73, y: 0.61 },
  { x: 0.31, y: 0.66 },
  { x: 0.39, y: 0.66 },
  { x: 0.61, y: 0.66 },
  { x: 0.69, y: 0.66 },
]);

/** @typedef {{ ref?: string, playerId?: string, identified?: boolean, node?: string, status?: string, equippedWeapon?: { kind?: string } | null, armorSilhouette?: string | null, level?: number }} ArenaVisiblePlayer */
/** @typedef {{ ref?: string, playerId?: string, node?: string, hp?: number, signal?: number, stamina?: number, status?: string, hidden?: boolean, equippedWeapon?: { kind?: string } | null, armor?: { value?: number } | null }} ArenaSelf */
/** @typedef {{ phase?: string, node?: { id?: string, name?: string, displayName?: string } | null, tags?: string[], self?: ArenaSelf | null, visiblePlayers?: ArenaVisiblePlayer[], coverSlots?: number, coverSlotsFree?: number, hazards?: string[] }} TacticalArenaModel */
/** @typedef {"tool" | "pistol" | "rifle" | "cleaver" | "stool" | "golf_club"} TacticalWeaponKind */
/** @typedef {"one-hand-chop" | "overhead-bash" | "wide-swing" | "compact-shot" | "shoulder-shot"} TacticalAttackSemantic */
/** @typedef {{ weapon: TacticalWeaponKind, motion: "melee" | "ranged", semantic: TacticalAttackSemantic }} TacticalWeaponAttackProfile */
/** @typedef {"industrial-chop" | "blade-slash" | "overhead-crush" | "wide-sweep" | "projectile"} TacticalImpactTrail */
/** @typedef {{ contactProgress: number, hurtDurationMs: number, trail: TacticalImpactTrail, sweepRadians: number, trailRadius: number, trailThickness: number }} TacticalWeaponImpactProfile */
/**
 * @typedef {{
 *   kind?:
 *     | "attack"
 *     | "hurt"
 *     | "hide"
 *     | "search"
 *     | "move"
 *     | "hazard"
 *     | "downed"
 *     | "echo"
 *     | "pickup"
 *     | "recover"
 *     | "spotted"
 *     | "blockade"
 *     | "reset"
 *     | "level"
 *     | "ritual",
 *   sourceRef?: string,
 *   targetRef?: string,
 *   hit?: boolean,
 *   motion?: "melee" | "ranged",
 *   weapon?: TacticalWeaponKind,
 *   weaponIcon?: string,
 *   style?: "rush" | "sneak" | "lost",
 *   step?: "depart" | "arrive",
 *   variant?: string,
 *   success?: boolean,
 *   durationMs?: number,
 *   deadlineMs?: number,
 * }} TacticalArenaFeedback
 */
/** @typedef {{ id?: string, nameMegaCity?: string, nameDarkforest?: string }} ArenaMapNode */
/** @typedef {{ id?: string, from?: string, to?: string, phase?: "both" | "megacity" | "darkforest", trait?: "tunnel" | "root" }} ArenaMapEdge */
/** @typedef {{ id?: string, open?: boolean }} ArenaNodeView */
/** @typedef {"up" | "right" | "down" | "left"} ArenaExitDirection */

const ARENA_EXIT_DIRECTIONS = /** @type {const} */ (["up", "right", "down", "left"]);
const TACTICAL_FEEDBACK_MIN_DURATION_MS = 80;
const TACTICAL_FEEDBACK_MAX_DURATION_MS = 8_000;
const TACTICAL_ATTACK_MAX_DISPLACEMENT_PX = 96;

/** @type {Readonly<Record<TacticalWeaponKind, Readonly<TacticalWeaponAttackProfile>>>} */
const TACTICAL_WEAPON_ATTACK_PROFILES = Object.freeze({
  tool: Object.freeze({ weapon: "tool", motion: "melee", semantic: "one-hand-chop" }),
  cleaver: Object.freeze({ weapon: "cleaver", motion: "melee", semantic: "one-hand-chop" }),
  stool: Object.freeze({ weapon: "stool", motion: "melee", semantic: "overhead-bash" }),
  golf_club: Object.freeze({ weapon: "golf_club", motion: "melee", semantic: "wide-swing" }),
  pistol: Object.freeze({ weapon: "pistol", motion: "ranged", semantic: "compact-shot" }),
  rifle: Object.freeze({ weapon: "rifle", motion: "ranged", semantic: "shoulder-shot" }),
});

/**
 * Contact timing follows the authored weapon pose, not the gameplay cooldown.
 * The cooldown may be several seconds; only the short visible action is passed
 * to this renderer.  These ratios are shared by DOM reactions and the Canvas /
 * WebGL effect layer so the victim cannot flinch before the weapon arrives.
 *
 * @type {Readonly<Record<TacticalWeaponKind, Readonly<TacticalWeaponImpactProfile>>>}
 */
const TACTICAL_WEAPON_IMPACT_PROFILES = Object.freeze({
  tool: Object.freeze({
    contactProgress: 0.46,
    hurtDurationMs: 280,
    trail: "industrial-chop",
    sweepRadians: 1.42,
    trailRadius: 29,
    trailThickness: 4.4,
  }),
  cleaver: Object.freeze({
    contactProgress: 0.38,
    hurtDurationMs: 240,
    trail: "blade-slash",
    sweepRadians: 1.62,
    trailRadius: 32,
    trailThickness: 2.4,
  }),
  stool: Object.freeze({
    contactProgress: 0.55,
    hurtDurationMs: 340,
    trail: "overhead-crush",
    sweepRadians: 1.08,
    trailRadius: 38,
    trailThickness: 7.2,
  }),
  golf_club: Object.freeze({
    contactProgress: 0.52,
    hurtDurationMs: 300,
    trail: "wide-sweep",
    sweepRadians: 2.34,
    trailRadius: 43,
    trailThickness: 3.2,
  }),
  pistol: Object.freeze({
    contactProgress: 0.704,
    hurtDurationMs: 250,
    trail: "projectile",
    sweepRadians: 0,
    trailRadius: 0,
    trailThickness: 0,
  }),
  rifle: Object.freeze({
    contactProgress: 0.68,
    hurtDurationMs: 300,
    trail: "projectile",
    sweepRadians: 0,
    trailRadius: 0,
    trailThickness: 0,
  }),
});

/**
 * Server-clock projection for the six-beat Reset film. A reconnect can lack
 * historical events, so the frozen 07:30 checkpoint is the fallback anchor.
 * Animation remains presentational and never advances game state.
 *
 * @param {{ phase?: string, gameNowMs?: number, startedAtMs?: number, completed?: boolean }} input
 */
export function projectResetCinematicTiming(input = {}) {
  const gameNowMs = Math.max(0, Number(input.gameNowMs ?? 0) || 0);
  const startedAtMs = Number.isFinite(input.startedAtMs)
    ? Number(input.startedAtMs)
    : RESET_CINEMATIC_START_MS;
  const inReset = input.phase === "reset" && input.completed !== true;
  return {
    show: inReset && gameNowMs < RESET_CINEMATIC_END_MS,
    /** 影片已播完但世界還沒切換:必須接手顯示進度,不能讓面板整個消失。 */
    rebuilding: inReset && gameNowMs >= RESET_CINEMATIC_END_MS,
    /** 倒數目標(遊戲毫秒);client 交給 [data-deadline-seconds] 的既有 tick 驅動。 */
    endsAtMs: RESET_END_MS,
    elapsedMs: Math.max(0, gameNowMs - startedAtMs),
  };
}

/** @param {unknown} value @returns {string} */
function text(value) {
  return typeof value === "string" ? value : "";
}

/**
 * Keep attack staging tied to the exact public weapon instead of flattening
 * every strike into one generic melee/ranged pose.
 *
 * @param {unknown} weapon
 * @returns {Readonly<TacticalWeaponAttackProfile> | null}
 */
export function tacticalWeaponAttackProfile(weapon) {
  const kind = text(weapon);
  if (!Object.hasOwn(TACTICAL_WEAPON_ATTACK_PROFILES, kind)) return null;
  return TACTICAL_WEAPON_ATTACK_PROFILES[/** @type {TacticalWeaponKind} */ (kind)];
}

/**
 * Return the single authored contact point used by the attacker pose, trail,
 * projectile and victim reaction. Unknown weapons fail to a conservative
 * family default without inventing a gameplay weapon.
 *
 * @param {TacticalArenaFeedback | undefined} feedback
 * @param {number} [durationMs]
 */
export function tacticalAttackImpactTiming(feedback = undefined, durationMs = undefined) {
  const attack = tacticalWeaponAttackProfile(feedback?.weapon);
  const profile = attack === null
    ? feedback?.motion === "melee"
      ? TACTICAL_WEAPON_IMPACT_PROFILES.tool
      : TACTICAL_WEAPON_IMPACT_PROFILES.pistol
    : TACTICAL_WEAPON_IMPACT_PROFILES[attack.weapon];
  const resolvedDuration = Number.isFinite(durationMs)
    ? clamp(
      Number(durationMs),
      TACTICAL_FEEDBACK_MIN_DURATION_MS,
      TACTICAL_FEEDBACK_MAX_DURATION_MS,
    )
    : tacticalFeedbackPresentation(feedback).durationMs;
  return {
    ...profile,
    impactAtMs: Math.round(resolvedDuration * profile.contactProgress),
    targetReactionAtMs: feedback?.hit === true
      ? Math.round(resolvedDuration * profile.contactProgress)
      : null,
  };
}

/**
 * Pure phase projection for tests and both render backends. `impactPulse` is
 * zero until contact and then grows over the remainder of the authored action.
 *
 * @param {TacticalArenaFeedback | undefined} feedback
 * @param {number} progress
 */
export function tacticalAttackVisualPhase(feedback, progress) {
  const timing = tacticalAttackImpactTiming(feedback);
  const normalized = clamp(Number(progress) || 0, 0, 1);
  const impactPulse = normalized <= timing.contactProgress ? 0 : clamp(
    (normalized - timing.contactProgress) / Math.max(0.001, 1 - timing.contactProgress),
    0,
    1,
  );
  return {
    phase: normalized < timing.contactProgress
      ? "windup"
      : normalized < Math.min(1, timing.contactProgress + 0.12)
      ? "contact"
      : "recover",
    impactPulse,
    ...timing,
  };
}

/** @param {TacticalArenaFeedback | undefined} feedback */
function tacticalAttackMotion(feedback) {
  return tacticalWeaponAttackProfile(feedback?.weapon)?.motion ??
    (feedback?.motion === "melee" ? "melee" : "ranged");
}

/**
 * Resolve a bounded, target-relative cosmetic lunge vector. Normalized arena
 * anchors remain presentation data; this helper never feeds a gameplay range
 * or hit calculation back into the model.
 *
 * @param {{ x?: number, y?: number } | null | undefined} source
 * @param {{ x?: number, y?: number } | null | undefined} target
 * @param {{ width?: number, height?: number, maxDisplacementPx?: number }} [options]
 * @returns {{ xPx: number, yPx: number, distancePx: number, facing: -1 | 1, bound: boolean }}
 */
export function tacticalAttackTrajectory(source, target, options = {}) {
  const sourceBound = typeof source?.x === "number" && Number.isFinite(source.x) &&
    typeof source?.y === "number" && Number.isFinite(source.y);
  const targetBound = typeof target?.x === "number" && Number.isFinite(target.x) &&
    typeof target?.y === "number" && Number.isFinite(target.y);
  if (!sourceBound || !targetBound) {
    return { xPx: 0, yPx: 0, distancePx: 0, facing: 1, bound: false };
  }
  const width = typeof options.width === "number" && Number.isFinite(options.width)
    ? clamp(options.width, 1, 4_096)
    : 1;
  const height = typeof options.height === "number" && Number.isFinite(options.height)
    ? clamp(options.height, 1, 4_096)
    : 1;
  const maxDisplacementPx = typeof options.maxDisplacementPx === "number" &&
      Number.isFinite(options.maxDisplacementPx)
    ? clamp(options.maxDisplacementPx, 0, TACTICAL_ATTACK_MAX_DISPLACEMENT_PX)
    : 72;
  const deltaX = (clamp(target.x ?? 0, 0, 1) - clamp(source.x ?? 0, 0, 1)) * width;
  const deltaY = (clamp(target.y ?? 0, 0, 1) - clamp(source.y ?? 0, 0, 1)) * height;
  const rawDistance = Math.hypot(deltaX, deltaY);
  const scale = rawDistance > maxDisplacementPx && rawDistance > 0
    ? maxDisplacementPx / rawDistance
    : 1;
  const xPx = deltaX * scale;
  const yPx = deltaY * scale;
  return {
    xPx,
    yPx,
    distancePx: Math.hypot(xPx, yPx),
    facing: deltaX < 0 ? -1 : 1,
    bound: true,
  };
}

/** A stable, non-cryptographic seed.  Never use this for rules or randomness. */
/** @param {unknown} value */
export function stableArenaHash(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Reset uses the Mega City topology bucket; ended matches retain Darkforest routes. */
/** @param {unknown} phase */
function arenaWorldPhase(phase) {
  return phase === "darkforest" || phase === "ended" ? "darkforest" : "megacity";
}

/**
 * A semantic key is preferred over the runtime id, which can be shuffled per
 * match. An id is used only when both phase names are absent.
 * @param {ArenaMapNode | undefined} node
 */
function arenaNodeKey(node) {
  const megaCity = text(node?.nameMegaCity);
  const darkforest = text(node?.nameDarkforest);
  return megaCity !== "" || darkforest !== ""
    ? `${megaCity}\u0000${darkforest}`
    : `\u0000${text(node?.id)}`;
}

/**
 * Project server-authoritative adjacent paths onto the field's four exits.
 * This does not derive routes from the scene, token positions, or any other
 * presentational data. `nodes` is the PlayerView NodeView array: an omitted or
 * closed destination stays visible as blocked, never usable. `overflow`
 * preserves every further adjacent edge when a topology degree exceeds four.
 *
 * @param {{
 *   selfNodeId?: string,
 *   map?: { nodes?: ArenaMapNode[], edges?: ArenaMapEdge[] },
 *   nodes?: ArenaNodeView[],
 *   phase?: "megacity" | "reset" | "darkforest" | "ended",
 * }} input
 * @returns {{
 *   up: ArenaFieldExit | null,
 *   right: ArenaFieldExit | null,
 *   down: ArenaFieldExit | null,
 *   left: ArenaFieldExit | null,
 *   overflow: ArenaFieldExit[],
 * }}
 */
export function projectTacticalArenaExits(input = {}) {
  const mapNodes = Array.isArray(input.map?.nodes) ? input.map.nodes : [];
  const mapEdges = Array.isArray(input.map?.edges) ? input.map.edges : [];
  const selfNodeId = text(input.selfNodeId);
  const phase = arenaWorldPhase(input.phase);
  /** @type {Map<string, ArenaMapNode>} */
  const definitions = new Map(
    mapNodes.filter((node) => text(node.id) !== "").map((node) => [text(node.id), node]),
  );
  /** @type {Map<string, ArenaNodeView>} */
  const views = new Map(
    (Array.isArray(input.nodes) ? input.nodes : [])
      .filter((node) => text(node.id) !== "")
      .map((node) => [text(node.id), node]),
  );
  const self = definitions.get(selfNodeId);
  if (self === undefined) return { up: null, right: null, down: null, left: null, overflow: [] };

  const topologyKey = mapEdges
    .map((edge) => {
      const from = arenaNodeKey(definitions.get(text(edge.from)));
      const to = arenaNodeKey(definitions.get(text(edge.to)));
      return `${from < to ? from : to}\u0001${from < to ? to : from}\u0001${
        text(edge.phase)
      }\u0001${text(edge.trait)}`;
    })
    .sort()
    .join("\u0002");
  const rotation = stableArenaHash(`${arenaNodeKey(self)}\u0003${topologyKey}`) %
    ARENA_EXIT_DIRECTIONS.length;
  /** @type {ArenaFieldExitInternal[]} */
  const adjacent = mapEdges.flatMap((edge) => {
    if (edge.phase !== "both" && edge.phase !== phase) return [];
    const from = text(edge.from);
    const to = text(edge.to);
    const nodeId = from === selfNodeId ? to : to === selfNodeId ? from : "";
    const node = definitions.get(nodeId);
    if (nodeId === "" || node === undefined) return [];
    const open = views.get(nodeId)?.open === true;
    return [{
      edgeId: text(edge.id),
      nodeId,
      displayName: phase === "darkforest" ? text(node.nameDarkforest) : text(node.nameMegaCity),
      available: open,
      blocked: !open,
      styles: /** @type {("rush" | "sneak")[]} */ (
        edge.trait === "root" ? ["sneak"] : ["rush", "sneak"]
      ),
      trait: edge.trait === "root" || edge.trait === "tunnel" ? edge.trait : undefined,
      sortKey: `${arenaNodeKey(node)}\u0001${text(edge.trait)}\u0001${text(edge.id)}`,
    }];
  }).sort((left, right) => left.sortKey.localeCompare(right.sortKey));

  /** @type {{ up: ArenaFieldExit | null, right: ArenaFieldExit | null, down: ArenaFieldExit | null, left: ArenaFieldExit | null, overflow: ArenaFieldExit[] }} */
  const result = { up: null, right: null, down: null, left: null, overflow: [] };
  adjacent.forEach((exit, index) => {
    const { sortKey: _sortKey, ...projected } = exit;
    if (index >= ARENA_EXIT_DIRECTIONS.length) {
      result.overflow.push(projected);
      return;
    }
    const direction = ARENA_EXIT_DIRECTIONS[(rotation + index) % ARENA_EXIT_DIRECTIONS.length];
    result[direction] = { ...projected, direction };
  });
  return result;
}

/**
 * @typedef {{
 *   edgeId: string,
 *   nodeId: string,
 *   displayName: string,
 *   available: boolean,
 *   blocked: boolean,
 *   styles: ("rush" | "sneak")[],
 *   trait?: "tunnel" | "root",
 *   direction?: ArenaExitDirection,
 * }} ArenaFieldExit
 */

/** @typedef {ArenaFieldExit & { sortKey: string }} ArenaFieldExitInternal */

/** @param {number} value @param {number} min @param {number} max */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/** @param {string | undefined} phase */
export function arenaPalette(phase) {
  if (phase === "megacity") {
    return {
      sky: [0.03, 0.06, 0.11, 0.07],
      floor: [0.055, 0.115, 0.145, 0.15],
      tile: [0.075, 0.18, 0.2, 0.9],
      fog: [0.08, 0.13, 0.16, 0.82],
      accent: CYAN,
    };
  }
  return {
    sky: [0.018, 0.045, 0.035, 0.08],
    floor: [0.035, 0.115, 0.07, 0.16],
    tile: [0.07, 0.19, 0.105, 0.9],
    fog: [0.07, 0.15, 0.09, 0.82],
    accent: ROOT_GOLD,
  };
}

/**
 * Stable screen-space anchors.  The server owns nodes, not sub-node movement;
 * this is merely a readable arrangement of the authoritative visible set.
 *
 * @param {string} ref
 * @param {number} index
 * @param {boolean} self
 */
export function tacticalTokenAnchor(ref, index = 0, self = false) {
  if (self) return { x: 0.5, y: 0.69, lane: 0 };
  const hash = stableArenaHash(ref);
  const lane = index % CONTACT_ANCHORS.length;
  const anchor = CONTACT_ANCHORS[lane];
  const jitterX = ((hash & 0xff) / 255 - 0.5) * 0.012;
  const jitterY = (((hash >>> 8) & 0xff) / 255 - 0.5) * 0.008;
  return {
    x: clamp(anchor.x + jitterX, 0.24, 0.76),
    y: clamp(anchor.y + jitterY, 0.39, 0.67),
    lane,
  };
}

/** @param {ArenaVisiblePlayer} player @param {number} index */
function visibleToken(player, index) {
  const ref = text(player.ref) || text(player.playerId) || `contact-${index}`;
  const identified = player.identified === true;
  return {
    ref,
    playerId: identified ? text(player.playerId) : "",
    ...tacticalTokenAnchor(ref, index, false),
    kind: identified ? "identified" : "silhouette",
    status: text(player.status) || "active",
    weapon: text(player.equippedWeapon?.kind),
    armor: text(player.armorSilhouette),
    level: identified && typeof player.level === "number" ? player.level : null,
  };
}

/**
 * Pure projection for both the renderer and approved character-token overlay.
 * Positions are normalized to the canvas (0..1); depth controls DOM z-index or
 * token scale but is never a gameplay coordinate.
 *
 * @param {TacticalArenaModel} model
 */
export function projectTacticalArenaModel(model = {}) {
  const safe = /** @type {TacticalArenaModel} */ (model ?? {});
  const self = safe.self ?? {};
  const selfRef = text(self.ref) || text(self.playerId) || "self";
  const phase = safe.phase === "megacity" ? "megacity" : "darkforest";
  const visible = Array.isArray(safe.visiblePlayers)
    ? [...safe.visiblePlayers].sort((left, right) => {
      const leftRef = text(left.ref) || text(left.playerId);
      const rightRef = text(right.ref) || text(right.playerId);
      return leftRef.localeCompare(rightRef);
    })
    : [];
  const projectedSelf = {
    ref: selfRef,
    playerId: text(self.playerId) || selfRef,
    ...tacticalTokenAnchor(selfRef, 0, true),
    scale: 1.12,
    depth: 0.92,
    isSelf: true,
    status: text(self.status) || "active",
    hidden: self.hidden === true,
    hp: clamp(Number(self.hp ?? 0) || 0, 0, 999),
    signal: clamp(Number(self.signal ?? 0) || 0, 0, 100),
    stamina: clamp(Number(self.stamina ?? 0) || 0, 0, 100),
    weapon: text(self.equippedWeapon?.kind),
  };
  const projectedTokens = visible.map(visibleToken).map((token) => ({
    ...token,
    scale: 0.78 + token.y * 0.24,
    depth: token.y,
    isSelf: false,
  }));
  return {
    phase,
    nodeLabel: text(safe.node?.displayName) || text(safe.node?.name) || text(safe.node?.id),
    tags: Array.isArray(safe.tags) ? safe.tags.filter((tag) => typeof tag === "string") : [],
    hazards: Array.isArray(safe.hazards)
      ? safe.hazards.filter((tag) => typeof tag === "string")
      : [],
    coverSlots: Math.max(0, Number(safe.coverSlots ?? safe.coverSlotsFree ?? 0) || 0),
    self: projectedSelf,
    tokens: projectedTokens,
    tokenPositions: [projectedSelf, ...projectedTokens],
  };
}

/** Backwards-compatible semantic name for tests and the renderer. */
export function tacticalArenaSnapshot(model = {}) {
  return projectTacticalArenaModel(model);
}

/** @param {TacticalArenaFeedback | undefined} feedback */
export function tacticalFeedbackPresentation(feedback = undefined) {
  /** @type {{ color: number[], durationMs: number, pulse: string }} */
  let presentation;
  switch (feedback?.kind) {
    case "attack":
      presentation = { color: AMBER, durationMs: 420, pulse: "strike" };
      break;
    case "hurt":
      presentation = { color: RED, durationMs: 460, pulse: "impact" };
      break;
    case "hide":
      presentation = { color: CYAN, durationMs: 520, pulse: "conceal" };
      break;
    case "search":
      presentation = { color: CYAN, durationMs: 520, pulse: "scan" };
      break;
    case "move":
      presentation = { color: AMBER, durationMs: 360, pulse: "trail" };
      break;
    case "hazard":
      presentation = { color: AMBER, durationMs: 620, pulse: "hazard" };
      break;
    case "downed":
      presentation = { color: RED, durationMs: 800, pulse: "downed" };
      break;
    case "echo":
      presentation = { color: ROOT_GOLD, durationMs: 680, pulse: "echo" };
      break;
    case "pickup":
      presentation = { color: CYAN, durationMs: 480, pulse: "acquire" };
      break;
    case "recover":
      presentation = { color: CYAN, durationMs: 620, pulse: "recover" };
      break;
    case "spotted":
      presentation = { color: AMBER, durationMs: 540, pulse: "spotted" };
      break;
    case "blockade":
      presentation = { color: AMBER, durationMs: 900, pulse: "blockade" };
      break;
    case "reset":
      presentation = { color: RED, durationMs: 900, pulse: "reset" };
      break;
    case "level":
      presentation = { color: CYAN, durationMs: 900, pulse: "level" };
      break;
    case "ritual":
      presentation = { color: ROOT_GOLD, durationMs: 1000, pulse: "ritual" };
      break;
    default:
      presentation = { color: CYAN, durationMs: 260, pulse: "none" };
      break;
  }
  const durationMs = typeof feedback?.durationMs === "number" &&
      Number.isFinite(feedback.durationMs)
    ? Math.round(clamp(
      feedback.durationMs,
      TACTICAL_FEEDBACK_MIN_DURATION_MS,
      TACTICAL_FEEDBACK_MAX_DURATION_MS,
    ))
    : presentation.durationMs;
  // The deadline is returned for display/debug coordination only. Playback
  // intentionally uses durationMs and never lets a cosmetic timestamp decide
  // whether an authoritative action has completed.
  return {
    ...presentation,
    durationMs,
    ...(typeof feedback?.deadlineMs === "number" && Number.isFinite(feedback.deadlineMs)
      ? { deadlineMs: feedback.deadlineMs }
      : {}),
  };
}

const TACTICAL_FEEDBACK_LIMIT = 5;

/** @param {TacticalArenaFeedback} cue */
function tacticalFeedbackPriority(cue) {
  if (cue.kind === "reset" || cue.kind === "downed" || cue.kind === "echo") return 5;
  if (cue.kind === "attack" || cue.kind === "hazard" || cue.kind === "blockade") return 4;
  if (cue.kind === "ritual" || cue.kind === "hurt" || cue.kind === "recover") return 3;
  return 2;
}

/**
 * Merge queued and newly-arrived cues without allowing old low-priority juice
 * to starve a fresh combat or terminal event. Playback order remains the
 * protocol order of the surviving cues.
 *
 * @param {TacticalArenaFeedback[]} queued
 * @param {TacticalArenaFeedback[]} incoming
 * @param {number} [limit]
 */
export function mergeTacticalFeedbackQueue(
  queued,
  incoming,
  limit = TACTICAL_FEEDBACK_LIMIT,
) {
  const old = queued.filter((cue) => cue.kind !== undefined);
  const fresh = incoming.filter((cue) => cue.kind !== undefined);
  const combined = [...old, ...fresh];
  if (combined.length <= limit) return combined;
  return combined.map((cue, index) => ({
    cue,
    index,
    fresh: index >= old.length,
    priority: tacticalFeedbackPriority(cue),
  })).sort((left, right) =>
    right.priority - left.priority ||
    Number(right.fresh) - Number(left.fresh) ||
    left.index - right.index
  )
    .slice(0, Math.max(0, limit))
    .sort((left, right) => left.index - right.index)
    .map(({ cue }) => cue);
}

/**
 * Core emits authoritative damage outcomes before its trailing combat receipt.
 * That order is correct for state mutation but would show the victim falling
 * before the swing. Reorder presentation only, and fold combat-caused armour /
 * injury reactions into the attack contact so one hit never flinches twice.
 *
 * @param {TacticalArenaFeedback[]} cues
 * @returns {TacticalArenaFeedback[]}
 */
export function orderTacticalCombatFeedback(cues) {
  /** @type {TacticalArenaFeedback[]} */
  const ordered = [];
  for (const cue of cues) {
    if (cue.kind !== "attack" || cue.targetRef === undefined || cue.targetRef === "") {
      ordered.push(cue);
      continue;
    }
    const firstOutcome = ordered.findIndex((candidate) =>
      candidate.targetRef === cue.targetRef &&
      (candidate.kind === "hurt" || candidate.kind === "downed" || candidate.kind === "echo")
    );
    if (firstOutcome < 0) ordered.push(cue);
    else ordered.splice(firstOutcome, 0, cue);
  }

  const hitTargets = new Set(
    ordered.filter((cue) => cue.kind === "attack" && cue.hit === true)
      .map((cue) => cue.targetRef)
      .filter((target) => target !== undefined && target !== ""),
  );
  const impactKinds = new Map();
  for (const cue of ordered) {
    if (
      cue.kind !== "hurt" || cue.targetRef === undefined || !hitTargets.has(cue.targetRef) ||
      (cue.variant !== "armor" && cue.variant !== "combat")
    ) continue;
    const kinds = impactKinds.get(cue.targetRef) ?? new Set();
    kinds.add(cue.variant === "armor" ? "armor" : "injury");
    impactKinds.set(cue.targetRef, kinds);
  }

  return ordered.flatMap((cue) => {
    if (
      cue.kind === "hurt" && cue.targetRef !== undefined && hitTargets.has(cue.targetRef) &&
      (cue.variant === "armor" || cue.variant === "combat")
    ) return [];
    if (cue.kind !== "attack" || cue.hit !== true || cue.targetRef === undefined) return [cue];
    const kinds = impactKinds.get(cue.targetRef);
    if (kinds === undefined || kinds.size === 0) return [cue];
    return [{
      ...cue,
      variant: kinds.has("armor") && kinds.has("injury")
        ? "armor-injury"
        : kinds.has("armor")
        ? "armor"
        : "injury",
    }];
  });
}

/**
 * Convert public protocol events into a bounded cosmetic sequence. It preserves
 * event order, binds only explicit public actor refs, and never derives rules.
 * A lethal combat diff therefore keeps the strike before downed / Echo instead
 * of allowing the final status event to erase the cause.
 *
 * @param {{
 *   events?: unknown[],
 *   moved?: boolean,
 *   selfRef?: string,
 *   selfNode?: string,
 *   movementStyle?: "rush" | "sneak" | "lost",
 * }} input
 * @returns {TacticalArenaFeedback[]}
 */
export function projectTacticalFeedbackSequence(input = {}) {
  const events = Array.isArray(input.events) ? input.events : [];
  const selfRef = text(input.selfRef);
  const selfNode = text(input.selfNode);
  /** @type {TacticalArenaFeedback[]} */
  const cues = [];
  const gotLost = events.some((event) =>
    event !== null && typeof event === "object" && "kind" in event &&
    event.kind === "got_lost"
  );
  if (input.moved === true && !gotLost) {
    cues.push({
      kind: "move",
      ...(selfRef === "" ? {} : { sourceRef: selfRef }),
      style: input.movementStyle ?? "rush",
      step: "arrive",
    });
  }
  for (const rawEvent of events) {
    if (rawEvent === null || typeof rawEvent !== "object") continue;
    const event = /** @type {Record<string, unknown>} */ (rawEvent);
    const player = text(event.player);
    switch (event.kind) {
      case "combat":
        if (
          selfNode !== "" &&
          text(event.sourceNode) !== selfNode &&
          text(event.targetNode) !== selfNode
        ) break;
        {
          const attackProfile = tacticalWeaponAttackProfile(event.weapon);
          cues.push({
            kind: "attack",
            sourceRef: text(event.attacker),
            targetRef: text(event.target),
            hit: event.hit === true,
            ...(attackProfile === null ? {} : { weapon: attackProfile.weapon }),
            motion: attackProfile?.motion ?? "ranged",
          });
        }
        break;
      case "player_downed":
      case "player_eliminated":
        if (selfNode !== "" && text(event.node) !== selfNode) break;
        cues.push({ kind: "downed", targetRef: player });
        break;
      case "player_echoed":
        if (selfNode !== "" && text(event.node) !== selfNode) break;
        cues.push({ kind: "echo", targetRef: player, variant: "enter" });
        break;
      case "echo_returned":
        if (selfNode !== "" && text(event.node) !== selfNode) break;
        cues.push({ kind: "echo", targetRef: player, variant: "return" });
        break;
      case "search_result":
        cues.push({ kind: "search", sourceRef: player });
        break;
      case "recovery_completed":
        cues.push({
          kind: "recover",
          targetRef: player,
          variant: text(event.item) || "recovery",
        });
        break;
      case "hazard_triggered":
        if (selfNode !== "" && text(event.node) !== selfNode) break;
        cues.push({
          kind: "hazard",
          targetRef: player,
          variant: text(event.hazard) || "unknown",
        });
        break;
      case "hazard_revealed":
        if (selfNode !== "" && text(event.node) !== selfNode) break;
        cues.push({ kind: "hazard", variant: "reveal" });
        break;
      case "hide_result":
        cues.push({
          kind: "hide",
          sourceRef: player,
          success: event.success === true,
          variant: event.success === true ? "success" : "failed",
        });
        break;
      case "player_spotted":
        cues.push({ kind: "spotted", targetRef: player });
        break;
      case "got_lost":
        cues.push({
          kind: "move",
          sourceRef: player,
          style: "lost",
          step: "arrive",
        });
        break;
      case "equipped":
        cues.push({ kind: "pickup", targetRef: player, variant: "equip" });
        break;
      case "armor_broken":
        cues.push({ kind: "hurt", targetRef: player, variant: "armor" });
        break;
      case "injury_inflicted":
        cues.push({
          kind: "hurt",
          targetRef: player,
          variant: text(event.source) || text(event.part),
        });
        break;
      case "injury_cured":
        cues.push({ kind: "recover", targetRef: player, variant: text(event.part) });
        break;
      case "level_up":
        cues.push({ kind: "level", targetRef: player });
        break;
      case "blockade_preview":
        if (selfNode !== "" && text(event.node) === selfNode) {
          cues.push({ kind: "blockade", variant: "preview" });
        }
        break;
      case "blockade_closed":
        if (selfNode !== "" && text(event.node) === selfNode) {
          cues.push({ kind: "blockade", variant: "closed" });
        }
        break;
      case "sudden_death_started":
        cues.push({ kind: "blockade", variant: "sudden-death" });
        break;
      case "reset_started":
        cues.push({ kind: "reset", variant: "started" });
        break;
      case "reset_completed":
        cues.push({ kind: "reset", variant: "completed" });
        break;
      case "finale_offer_started":
      case "finale_joined":
        if (selfNode === "" || text(event.node) === selfNode) {
          cues.push({ kind: "ritual", variant: "offer" });
        }
        break;
      case "finale_channel_started":
        if (selfNode === "" || text(event.node) === selfNode) {
          cues.push({ kind: "ritual", variant: "channel" });
        }
        break;
      case "finale_interrupted":
        if (selfNode === "" || text(event.node) === selfNode) {
          cues.push({ kind: "ritual", variant: "interrupted" });
        }
        break;
      case "finale_claimed":
      case "finale_completed":
        if (selfNode === "" || text(event.node) === selfNode) {
          cues.push({ kind: "ritual", variant: "completed" });
        }
        break;
      default:
        break;
    }
  }
  const causallyOrdered = orderTacticalCombatFeedback(cues);
  const unique = causallyOrdered.filter((cue, index) => {
    /** @param {TacticalArenaFeedback} candidate */
    const fields = (candidate) => [
      candidate.kind,
      candidate.sourceRef,
      candidate.targetRef,
      candidate.variant,
      candidate.style,
      candidate.step,
      candidate.hit,
      candidate.motion,
      candidate.weapon,
      candidate.success,
      candidate.durationMs,
      candidate.deadlineMs,
    ];
    const key = JSON.stringify(fields(cue));
    return causallyOrdered.findIndex((candidate) => JSON.stringify(fields(candidate)) === key) ===
      index;
  });
  if (unique.length <= TACTICAL_FEEDBACK_LIMIT) return unique;
  const selected = unique.map((cue, index) => ({
    cue,
    index,
    priority: tacticalFeedbackPriority(cue),
  })).sort((left, right) => right.priority - left.priority || left.index - right.index)
    .slice(0, TACTICAL_FEEDBACK_LIMIT)
    .sort((left, right) => left.index - right.index);
  return selected.map(({ cue }) => cue);
}

/**
 * Resolve presentation endpoints without guessing an actor. A combat event that
 * reaches the renderer without refs remains atmospheric gunfire; it must not
 * make the self token appear to shoot.
 *
 * @param {ReturnType<typeof tacticalArenaSnapshot>} snapshot
 * @param {TacticalArenaFeedback | undefined} feedback
 */
export function tacticalFeedbackGeometry(snapshot, feedback = undefined) {
  const positions = snapshot.tokenPositions;
  /** @param {{ref: string, playerId: string}} token @param {string} ref */
  const matchesRef = (token, ref) =>
    token.ref === ref || (token.playerId !== "" && token.playerId === ref);
  const source = feedback?.sourceRef === undefined
    ? null
    : positions.find((token) => matchesRef(token, feedback.sourceRef ?? "")) ?? null;
  const target = feedback?.targetRef === undefined
    ? null
    : positions.find((token) => matchesRef(token, feedback.targetRef ?? "")) ?? null;
  return {
    source,
    target,
    characterBound: source !== null || target !== null,
  };
}

/**
 * Explicit Arena fire still follows the authoritative Preview chain. Preview
 * is prepared in the background, so the button can only wait, stay blocked,
 * or confirm an allowed result; it never starts estimation itself.
 *
 * @param {{
 *   blocked: boolean,
 *   commandPending: boolean,
 *   preview: "none" | "pending" | "allowed" | "rejected" | "failed",
 * }} state
 * @returns {"blocked" | "wait" | "retry" | "fire"}
 */
export function tacticalAttackStep(state) {
  if (state.blocked || state.commandPending || state.preview === "rejected") return "blocked";
  if (state.preview === "failed") return "retry";
  if (state.preview === "allowed") return "fire";
  return "wait";
}

/**
 * A character token is selection-only. Attack progression is reachable solely
 * from the explicit Fire control rendered outside the token.
 *
 * @param {{
 *   trigger: "target" | "fire",
 *   blocked: boolean,
 *   commandPending: boolean,
 *   preview: "none" | "pending" | "allowed" | "rejected" | "failed",
 * }} state
 * @returns {"select" | "blocked" | "wait" | "retry" | "fire"}
 */
export function tacticalTargetActionStep(state) {
  if (state.trigger === "target") return "select";
  return tacticalAttackStep(state);
}

/** @param {{enabled: boolean, phase: string, status: string}} state */
export function tacticalArenaFieldAvailable(state) {
  return state.enabled &&
    (state.phase === "megacity" || state.phase === "darkforest") &&
    state.status !== "eliminated";
}

/**
 * The live field owns contact decisions whenever it is actually visible.
 * Log mode and spectators retain the existing narrative-card fallback.
 *
 * @param {{
 *   enabled: boolean,
 *   surface: "field" | "log",
 *   phase: string,
 *   status: string,
 * }} state
 */
export function tacticalArenaOwnsContactDecision(state) {
  return state.surface === "field" && tacticalArenaFieldAvailable(state);
}

/**
 * @param {{
 *   status: string,
 *   hidden: boolean,
 *   coverSlotsFree: number,
 *   commandPending: boolean,
 *   casting: boolean,
 *   cooling: boolean,
 * }} state
 * @returns {"hidden" | "ready" | "unavailable"}
 */
export function tacticalHideStep(state) {
  if (state.hidden) return "hidden";
  return state.status === "active" && state.coverSlotsFree > 0 &&
      !state.commandPending && !state.casting && !state.cooling
    ? "ready"
    : "unavailable";
}

/** @param {number} x @param {number} y @param {number} width @param {number} height */
function clipPoint(x, y, width, height) {
  return [x / width * 2 - 1, 1 - y / height * 2];
}

/** @param {WebGLRenderingContext} gl @param {number} type @param {string} source */
function shader(gl, type, source) {
  const value = gl.createShader(type);
  if (value === null) throw new Error("WebGL shader unavailable");
  gl.shaderSource(value, source);
  gl.compileShader(value);
  if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(value) || "WebGL shader compilation failed");
  }
  return value;
}

/** @param {WebGLRenderingContext} gl */
function createProgram(gl) {
  const program = gl.createProgram();
  if (program === null) throw new Error("WebGL program unavailable");
  gl.attachShader(
    gl,
    shader(
      gl,
      gl.VERTEX_SHADER,
      `
    attribute vec2 a_position;
    attribute vec4 a_color;
    varying vec4 v_color;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); v_color = a_color; }
  `,
    ),
  );
  gl.attachShader(
    gl,
    shader(
      gl,
      gl.FRAGMENT_SHADER,
      `
    precision mediump float;
    varying vec4 v_color;
    void main() { gl_FragColor = v_color; }
  `,
    ),
  );
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "WebGL program linking failed");
  }
  return program;
}

/** @param {number[]} target @param {number[]} point @param {number[]} color */
function vertex(target, point, color) {
  target.push(point[0], point[1], color[0], color[1], color[2], color[3]);
}

/** @param {number[]} vertices @param {number} x @param {number} y @param {number} w @param {number} h @param {number[]} color @param {number} canvasWidth @param {number} canvasHeight */
function quad(vertices, x, y, w, h, color, canvasWidth, canvasHeight) {
  const a = clipPoint(x, y, canvasWidth, canvasHeight);
  const b = clipPoint(x + w, y, canvasWidth, canvasHeight);
  const c = clipPoint(x + w, y + h, canvasWidth, canvasHeight);
  const d = clipPoint(x, y + h, canvasWidth, canvasHeight);
  vertex(vertices, a, color);
  vertex(vertices, b, color);
  vertex(vertices, c, color);
  vertex(vertices, a, color);
  vertex(vertices, c, color);
  vertex(vertices, d, color);
}

/** @param {number[]} vertices @param {{x:number,y:number}} a @param {{x:number,y:number}} b @param {{x:number,y:number}} c @param {{x:number,y:number}} d @param {number[]} color @param {number} canvasWidth @param {number} canvasHeight */
function perspectiveQuad(vertices, a, b, c, d, color, canvasWidth, canvasHeight) {
  const points = [a, b, c, d].map((point) =>
    clipPoint(point.x, point.y, canvasWidth, canvasHeight)
  );
  vertex(vertices, points[0], color);
  vertex(vertices, points[1], color);
  vertex(vertices, points[2], color);
  vertex(vertices, points[0], color);
  vertex(vertices, points[2], color);
  vertex(vertices, points[3], color);
}

/** @param {number[]} vertices @param {number} fromX @param {number} fromY @param {number} toX @param {number} toY @param {number} thickness @param {number[]} color @param {number} width @param {number} height */
function thickLine(
  vertices,
  fromX,
  fromY,
  toX,
  toY,
  thickness,
  color,
  width,
  height,
) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.max(0.001, Math.hypot(dx, dy));
  const offsetX = -dy / length * thickness * 0.5;
  const offsetY = dx / length * thickness * 0.5;
  perspectiveQuad(
    vertices,
    { x: fromX + offsetX, y: fromY + offsetY },
    { x: fromX - offsetX, y: fromY - offsetY },
    { x: toX - offsetX, y: toY - offsetY },
    { x: toX + offsetX, y: toY + offsetY },
    color,
    width,
    height,
  );
}

/** @param {number[]} vertices @param {number} cx @param {number} cy @param {number} radius @param {number[]} color @param {number} width @param {number} height */
function disc(vertices, cx, cy, radius, color, width, height) {
  const center = clipPoint(cx, cy, width, height);
  for (let index = 0; index < 12; index++) {
    const start = index / 12 * TAU;
    const end = (index + 1) / 12 * TAU;
    vertex(vertices, center, color);
    vertex(
      vertices,
      clipPoint(cx + Math.cos(start) * radius, cy + Math.sin(start) * radius, width, height),
      color,
    );
    vertex(
      vertices,
      clipPoint(cx + Math.cos(end) * radius, cy + Math.sin(end) * radius, width, height),
      color,
    );
  }
}

/** @param {number[]} vertices @param {number} cx @param {number} cy @param {number} radius @param {number[]} color @param {number} width @param {number} height */
function ring(vertices, cx, cy, radius, color, width, height) {
  const inner = radius * 0.78;
  for (let index = 0; index < 12; index++) {
    const start = index / 12 * TAU;
    const end = (index + 1) / 12 * TAU;
    const outerA = clipPoint(
      cx + Math.cos(start) * radius,
      cy + Math.sin(start) * radius,
      width,
      height,
    );
    const outerB = clipPoint(
      cx + Math.cos(end) * radius,
      cy + Math.sin(end) * radius,
      width,
      height,
    );
    const innerA = clipPoint(
      cx + Math.cos(start) * inner,
      cy + Math.sin(start) * inner,
      width,
      height,
    );
    const innerB = clipPoint(cx + Math.cos(end) * inner, cy + Math.sin(end) * inner, width, height);
    vertex(vertices, outerA, color);
    vertex(vertices, outerB, color);
    vertex(vertices, innerB, color);
    vertex(vertices, outerA, color);
    vertex(vertices, innerB, color);
    vertex(vertices, innerA, color);
  }
}

/** @param {number[]} vertices @param {number} cx @param {number} cy @param {number} radius @param {number} thickness @param {number} startAngle @param {number} endAngle @param {number[]} color @param {number} width @param {number} height */
function arcBand(
  vertices,
  cx,
  cy,
  radius,
  thickness,
  startAngle,
  endAngle,
  color,
  width,
  height,
) {
  const span = Math.abs(endAngle - startAngle);
  const segments = Math.max(3, Math.ceil(span / (Math.PI / 14)));
  const inner = Math.max(1, radius - thickness * 0.5);
  const outer = radius + thickness * 0.5;
  for (let index = 0; index < segments; index++) {
    const from = mix(startAngle, endAngle, index / segments);
    const to = mix(startAngle, endAngle, (index + 1) / segments);
    perspectiveQuad(
      vertices,
      { x: cx + Math.cos(from) * inner, y: cy + Math.sin(from) * inner },
      { x: cx + Math.cos(from) * outer, y: cy + Math.sin(from) * outer },
      { x: cx + Math.cos(to) * outer, y: cy + Math.sin(to) * outer },
      { x: cx + Math.cos(to) * inner, y: cy + Math.sin(to) * inner },
      color,
      width,
      height,
    );
  }
}

/**
 * @typedef {{
 *   feedback?: TacticalArenaFeedback,
 *   feedbackPulse?: number,
 *   hurtPulse?: number,
 *   concealPulse?: number,
 *   lowViolence?: boolean,
 *   particlesOff?: boolean,
 * }} ArenaEffectState
 */

/** @param {number} from @param {number} to @param {number} amount */
function mix(from, to, amount) {
  return from + (to - from) * amount;
}

/** @param {number[]} vertices @param {ReturnType<typeof tacticalArenaSnapshot>} snapshot @param {number} width @param {number} height @param {ArenaEffectState} effect */
function feedbackVertices(vertices, snapshot, width, height, effect) {
  const feedback = effect.feedback;
  const feedbackPulse = clamp(effect.feedbackPulse ?? 0, 0, 1);
  const hurtPulse = clamp(effect.hurtPulse ?? 0, 0, 1);
  const concealPulse = clamp(effect.concealPulse ?? 0, 0, 1);
  if (effect.particlesOff) return;
  if (feedback?.kind === "attack" && feedbackPulse > 0) {
    const attackPhase = tacticalAttackVisualPhase(feedback, feedbackPulse);
    const geometry = tacticalFeedbackGeometry(snapshot, feedback);
    // Ref-less events stay in a neutral mid-field lane: a local effect remains
    // visible without falsely attributing it to the player or a contact.
    const sourceAnchor = geometry.source ?? { x: 0.43, y: 0.54 };
    const targetAnchor = geometry.target ?? { x: 0.58, y: 0.42 };
    const sourceX = sourceAnchor.x * width;
    const sourceY = sourceAnchor.y * height;
    const targetX = targetAnchor.x * width;
    const targetY = targetAnchor.y * height;
    if (tacticalAttackMotion(feedback) === "ranged") {
      const travel = clamp(
        feedbackPulse / Math.max(0.001, attackPhase.contactProgress),
        0.12,
        1,
      );
      const headX = mix(sourceX, targetX, travel);
      const headY = mix(sourceY, targetY, travel);
      const tail = clamp(travel - 0.2, 0, 1);
      const tailX = mix(sourceX, targetX, tail);
      const tailY = mix(sourceY, targetY, tail);
      disc(
        vertices,
        sourceX,
        sourceY,
        4 + (1 - feedbackPulse) * 5,
        [...AMBER.slice(0, 3), effect.lowViolence ? 0.42 : 0.88],
        width,
        height,
      );
      thickLine(
        vertices,
        tailX,
        tailY,
        headX,
        headY,
        effect.lowViolence ? 1.4 : 2.2,
        [...AMBER.slice(0, 3), effect.lowViolence ? 0.32 : 0.78],
        width,
        height,
      );
      disc(
        vertices,
        headX,
        headY,
        feedback?.weapon === "rifle" ? 3.6 : 2.8,
        [1, 0.86, 0.58, effect.lowViolence ? 0.62 : 0.96],
        width,
        height,
      );
    } else {
      const trajectory = tacticalAttackTrajectory(sourceAnchor, targetAnchor, {
        width,
        height,
        maxDisplacementPx: 72,
      });
      const lunge = Math.sin(feedbackPulse * Math.PI);
      const direction = Math.atan2(targetY - sourceY, targetX - sourceX);
      const trailStart = Math.max(0, attackPhase.contactProgress - 0.26);
      const trailEnd = Math.min(1, attackPhase.contactProgress + 0.2);
      const trailProgress = clamp(
        (feedbackPulse - trailStart) / Math.max(0.001, attackPhase.contactProgress - trailStart),
        0,
        1,
      );
      const trailFade = 1 - clamp(
        (feedbackPulse - attackPhase.contactProgress) /
          Math.max(0.001, trailEnd - attackPhase.contactProgress),
        0,
        1,
      );
      disc(
        vertices,
        sourceX + trajectory.xPx * lunge,
        sourceY + trajectory.yPx * lunge - lunge * 5,
        5 + lunge * 3,
        [...AMBER.slice(0, 3), effect.lowViolence ? 0.42 : 0.82],
        width,
        height,
      );
      if (feedbackPulse >= trailStart && feedbackPulse <= trailEnd && trailFade > 0) {
        const arcCenterX = sourceX + trajectory.xPx * Math.min(0.72, lunge * 0.72);
        const arcCenterY = sourceY + trajectory.yPx * Math.min(0.72, lunge * 0.72) - 7;
        const halfSweep = attackPhase.sweepRadians * 0.5;
        const authoredStart = direction - halfSweep;
        const authoredEnd = authoredStart +
          attackPhase.sweepRadians * Math.max(0.18, trailProgress);
        const trailAlpha = (effect.lowViolence ? 0.46 : 0.9) * trailFade;
        arcBand(
          vertices,
          arcCenterX,
          arcCenterY,
          attackPhase.trailRadius,
          attackPhase.trailThickness,
          authoredStart,
          authoredEnd,
          [1, 0.82, 0.48, trailAlpha],
          width,
          height,
        );
        if (attackPhase.trail === "wide-sweep") {
          arcBand(
            vertices,
            arcCenterX,
            arcCenterY,
            attackPhase.trailRadius - 8,
            Math.max(1.2, attackPhase.trailThickness * 0.46),
            authoredStart + 0.12,
            authoredEnd - 0.08,
            [...AMBER.slice(0, 3), trailAlpha * 0.52],
            width,
            height,
          );
        }
      }
    }
    if (
      feedback.hit === true && geometry.target !== null && attackPhase.impactPulse > 0
    ) {
      ring(
        vertices,
        targetX,
        targetY,
        7 + attackPhase.impactPulse * 11,
        effect.lowViolence
          ? [...CYAN.slice(0, 3), 0.55 * (1 - attackPhase.impactPulse * 0.35)]
          : [...RED.slice(0, 3), 0.78 * (1 - attackPhase.impactPulse * 0.35)],
        width,
        height,
      );
    }
  }
  if (feedback !== undefined && feedbackPulse > 0 && feedback.kind !== "attack") {
    const geometry = tacticalFeedbackGeometry(snapshot, feedback);
    // Global events without a visible actor remain atmospheric. Anchoring them
    // to self would falsely imply that the local player was downed, echoed, or
    // struck by a newly revealed hazard.
    const anchor = geometry.target ?? geometry.source ?? { x: 0.5, y: 0.5 };
    const anchorX = anchor.x * width;
    const anchorY = anchor.y * height;
    const presentation = tacticalFeedbackPresentation(feedback);
    const cueColor = presentation.color;
    if (feedback.kind === "search") {
      ring(
        vertices,
        anchorX,
        anchorY,
        10 + feedbackPulse * 30,
        [...CYAN.slice(0, 3), 0.58 * (1 - feedbackPulse * 0.45)],
        width,
        height,
      );
      thickLine(
        vertices,
        anchorX - 25,
        anchorY + 13 - feedbackPulse * 28,
        anchorX + 25,
        anchorY + 13 - feedbackPulse * 28,
        1.3,
        [...CYAN.slice(0, 3), 0.5],
        width,
        height,
      );
    } else if (feedback.kind === "move") {
      // The protocol exposes destination nodes, not an in-scene vector. A
      // centred settle ring communicates travel without inventing left/right.
      ring(
        vertices,
        anchorX,
        anchorY,
        (feedback.style === "sneak" ? 9 : 12) + feedbackPulse * 12,
        [...cueColor.slice(0, 3), 0.5 * (1 - feedbackPulse * 0.35)],
        width,
        height,
      );
    } else if (feedback.kind === "hazard") {
      const hazardColor = feedback.variant === "conductive_puddle"
        ? CYAN
        : effect.lowViolence
        ? CYAN
        : AMBER;
      ring(
        vertices,
        anchorX,
        anchorY,
        13 + feedbackPulse * 18,
        [...hazardColor.slice(0, 3), 0.66],
        width,
        height,
      );
      if (feedback.variant === "conductive_puddle" || feedback.variant === "shock") {
        thickLine(
          vertices,
          anchorX - 24,
          anchorY + 10,
          anchorX + 5,
          anchorY - 24,
          1.5,
          [...CYAN.slice(0, 3), 0.68],
          width,
          height,
        );
        thickLine(
          vertices,
          anchorX - 2,
          anchorY - 19,
          anchorX + 24,
          anchorY + 12,
          1.2,
          [...CYAN.slice(0, 3), 0.52],
          width,
          height,
        );
      } else {
        thickLine(
          vertices,
          anchorX - 27,
          anchorY + 15,
          anchorX + 28,
          anchorY + 15,
          1.8,
          [...AMBER.slice(0, 3), 0.62],
          width,
          height,
        );
      }
    } else if (
      feedback.kind === "hurt" || feedback.kind === "downed" || feedback.kind === "spotted" ||
      feedback.kind === "pickup" || feedback.kind === "recover" ||
      feedback.kind === "level" || feedback.kind === "echo"
    ) {
      const radius = feedback.kind === "level"
        ? 18 + feedbackPulse * 38
        : feedback.kind === "echo"
        ? 15 + feedbackPulse * 30
        : 12 + feedbackPulse * 20;
      const semanticColor = feedback.kind === "hurt" || feedback.kind === "downed"
        ? effect.lowViolence ? CYAN : RED
        : feedback.kind === "spotted"
        ? AMBER
        : feedback.kind === "echo"
        ? ROOT_GOLD
        : cueColor;
      ring(
        vertices,
        anchorX,
        anchorY,
        radius,
        [...semanticColor.slice(0, 3), 0.65 * (1 - feedbackPulse * 0.35)],
        width,
        height,
      );
      if (feedback.kind === "echo" || feedback.kind === "level") {
        ring(
          vertices,
          anchorX,
          anchorY,
          Math.max(5, radius * 0.58),
          [...semanticColor.slice(0, 3), 0.38],
          width,
          height,
        );
      }
    } else if (feedback.kind === "blockade" || feedback.kind === "reset") {
      const edgeColor = feedback.kind === "reset" ? effect.lowViolence ? CYAN : RED : AMBER;
      const alpha = 0.08 + Math.sin(feedbackPulse * Math.PI) * 0.18;
      quad(vertices, 0, 0, width, 5, [...edgeColor.slice(0, 3), alpha], width, height);
      quad(vertices, 0, height - 5, width, 5, [...edgeColor.slice(0, 3), alpha], width, height);
      quad(vertices, 0, 0, 5, height, [...edgeColor.slice(0, 3), alpha], width, height);
      quad(vertices, width - 5, 0, 5, height, [...edgeColor.slice(0, 3), alpha], width, height);
    } else if (feedback.kind === "ritual") {
      ring(
        vertices,
        anchorX,
        anchorY,
        22 + feedbackPulse * 54,
        [...ROOT_GOLD.slice(0, 3), 0.52],
        width,
        height,
      );
      ring(
        vertices,
        anchorX,
        anchorY,
        10 + feedbackPulse * 28,
        [...CYAN.slice(0, 3), 0.32],
        width,
        height,
      );
    }
  }
  if (hurtPulse > 0) {
    const selfX = snapshot.self.x * width;
    const selfY = snapshot.self.y * height;
    const impactColor = effect.lowViolence ? [...CYAN.slice(0, 3), 0.5] : [...RED.slice(0, 3), 0.7];
    ring(vertices, selfX, selfY, 17 + hurtPulse * 15, impactColor, width, height);
  }
  if (concealPulse > 0) {
    const selfX = snapshot.self.x * width;
    const selfY = snapshot.self.y * height;
    const sweepY = selfY + mix(24, -30, concealPulse);
    thickLine(
      vertices,
      selfX - 28,
      sweepY,
      selfX + 28,
      sweepY,
      1.4,
      [...CYAN.slice(0, 3), 0.5],
      width,
      height,
    );
  }
}

/** @param {ReturnType<typeof tacticalArenaSnapshot>} snapshot @param {number} width @param {number} height @param {ArenaEffectState} [effect] */
export function arenaVertices(snapshot, width, height, effect = {}) {
  // 每個公開展示地點都有自己的 2.5D 底板,canvas 只是特效層:再畫一次通用地板、
  // 掩體、危險環或角色環,會把這些各自不同的地點壓回同一個競技場,並暗示 server
  // 從未提供的地形。這裡只輸出特效頂點。
  /** @type {number[]} */
  const effects = [];
  feedbackVertices(effects, snapshot, width, height, effect);
  return new Float32Array(effects);
}

/**
 * Canvas fallback for the effects-only arena. It intentionally draws no floor,
 * cover, hazard placement, or route geometry over an approved location plate.
 *
 * @param {CanvasRenderingContext2D} context
 * @param {ReturnType<typeof tacticalArenaSnapshot>} snapshot
 * @param {number} width
 * @param {number} height
 * @param {ArenaEffectState} effect
 */
function drawCanvasFeedback(context, snapshot, width, height, effect) {
  if (effect.particlesOff) return;
  const feedback = effect.feedback;
  const progress = clamp(effect.feedbackPulse ?? 0, 0, 1);
  /** @param {number[]} color @param {number} alpha */
  const css = (color, alpha) =>
    `rgba(${color.slice(0, 3).map((item) => Math.round(item * 255)).join(",")},${alpha})`;
  context.save();
  if (feedback?.kind === "attack" && progress > 0) {
    const attackPhase = tacticalAttackVisualPhase(feedback, progress);
    const geometry = tacticalFeedbackGeometry(snapshot, feedback);
    const sourceAnchor = geometry.source ?? { x: 0.43, y: 0.54 };
    const targetAnchor = geometry.target ?? { x: 0.58, y: 0.42 };
    const sourceX = sourceAnchor.x * width;
    const sourceY = sourceAnchor.y * height;
    const targetX = targetAnchor.x * width;
    const targetY = targetAnchor.y * height;
    if (tacticalAttackMotion(feedback) === "ranged") {
      const travel = clamp(
        progress / Math.max(0.001, attackPhase.contactProgress),
        0.12,
        1,
      );
      const tail = clamp(travel - 0.2, 0, 1);
      context.strokeStyle = css(AMBER, effect.lowViolence ? 0.32 : 0.78);
      context.lineWidth = effect.lowViolence ? 1.4 : 2.2;
      context.beginPath();
      context.moveTo(mix(sourceX, targetX, tail), mix(sourceY, targetY, tail));
      context.lineTo(mix(sourceX, targetX, travel), mix(sourceY, targetY, travel));
      context.stroke();
      context.fillStyle = "rgba(255,219,148,0.96)";
      context.beginPath();
      context.arc(
        mix(sourceX, targetX, travel),
        mix(sourceY, targetY, travel),
        feedback?.weapon === "rifle" ? 3.6 : 2.8,
        0,
        TAU,
      );
      context.fill();
    } else {
      const trajectory = tacticalAttackTrajectory(sourceAnchor, targetAnchor, {
        width,
        height,
        maxDisplacementPx: 72,
      });
      const lunge = Math.sin(progress * Math.PI);
      const direction = Math.atan2(targetY - sourceY, targetX - sourceX);
      const trailStart = Math.max(0, attackPhase.contactProgress - 0.26);
      const trailEnd = Math.min(1, attackPhase.contactProgress + 0.2);
      const trailProgress = clamp(
        (progress - trailStart) / Math.max(0.001, attackPhase.contactProgress - trailStart),
        0,
        1,
      );
      const trailFade = 1 - clamp(
        (progress - attackPhase.contactProgress) /
          Math.max(0.001, trailEnd - attackPhase.contactProgress),
        0,
        1,
      );
      context.fillStyle = css(AMBER, effect.lowViolence ? 0.42 : 0.82);
      context.beginPath();
      context.arc(
        sourceX + trajectory.xPx * lunge,
        sourceY + trajectory.yPx * lunge - lunge * 5,
        5 + lunge * 3,
        0,
        TAU,
      );
      context.fill();
      if (progress >= trailStart && progress <= trailEnd && trailFade > 0) {
        const arcCenterX = sourceX + trajectory.xPx * Math.min(0.72, lunge * 0.72);
        const arcCenterY = sourceY + trajectory.yPx * Math.min(0.72, lunge * 0.72) - 7;
        const startAngle = direction - attackPhase.sweepRadians * 0.5;
        const endAngle = startAngle + attackPhase.sweepRadians * Math.max(0.18, trailProgress);
        context.strokeStyle = css(
          [1, 0.82, 0.48, 1],
          (effect.lowViolence ? 0.46 : 0.9) * trailFade,
        );
        context.lineWidth = attackPhase.trailThickness;
        context.lineCap = "round";
        context.beginPath();
        context.arc(
          arcCenterX,
          arcCenterY,
          attackPhase.trailRadius,
          startAngle,
          endAngle,
        );
        context.stroke();
        if (attackPhase.trail === "wide-sweep") {
          context.strokeStyle = css(AMBER, 0.42 * trailFade);
          context.lineWidth = Math.max(1.2, attackPhase.trailThickness * 0.46);
          context.beginPath();
          context.arc(
            arcCenterX,
            arcCenterY,
            attackPhase.trailRadius - 8,
            startAngle + 0.12,
            Math.max(startAngle + 0.13, endAngle - 0.08),
          );
          context.stroke();
        }
      }
    }
    if (
      feedback.hit === true && geometry.target !== null && attackPhase.impactPulse > 0
    ) {
      context.strokeStyle = css(effect.lowViolence ? CYAN : RED, 0.65);
      context.beginPath();
      context.arc(targetX, targetY, 7 + attackPhase.impactPulse * 11, 0, TAU);
      context.stroke();
    }
  } else if (feedback !== undefined && progress > 0) {
    const geometry = tacticalFeedbackGeometry(snapshot, feedback);
    const anchor = geometry.target ?? geometry.source ?? { x: 0.5, y: 0.5 };
    const x = anchor.x * width;
    const y = anchor.y * height;
    const color = feedback.kind === "downed" || feedback.kind === "reset"
      ? effect.lowViolence ? CYAN : RED
      : feedback.kind === "echo" || feedback.kind === "ritual"
      ? ROOT_GOLD
      : feedback.kind === "hazard" && feedback.variant !== "conductive_puddle"
      ? AMBER
      : tacticalFeedbackPresentation(feedback).color;
    context.strokeStyle = css(color, 0.62);
    context.lineWidth = 2;
    if (feedback.kind === "blockade" || feedback.kind === "reset") {
      context.strokeRect(3, 3, Math.max(0, width - 6), Math.max(0, height - 6));
    } else {
      const radius = feedback.kind === "level" || feedback.kind === "ritual"
        ? 18 + progress * 42
        : 11 + progress * 23;
      context.beginPath();
      context.arc(x, y, radius, 0, TAU);
      context.stroke();
      if (feedback.kind === "search") {
        context.beginPath();
        context.moveTo(x - 24, y + 13 - progress * 27);
        context.lineTo(x + 24, y + 13 - progress * 27);
        context.stroke();
      }
      if (feedback.kind === "hazard") {
        context.beginPath();
        context.moveTo(x - 23, y + 12);
        context.lineTo(x + 22, y - 14);
        context.stroke();
      }
    }
  }
  const hurt = clamp(effect.hurtPulse ?? 0, 0, 1);
  if (hurt > 0) {
    context.strokeStyle = css(effect.lowViolence ? CYAN : RED, 0.62);
    context.lineWidth = 2;
    context.beginPath();
    context.arc(snapshot.self.x * width, snapshot.self.y * height, 17 + hurt * 15, 0, TAU);
    context.stroke();
  }
  const conceal = clamp(effect.concealPulse ?? 0, 0, 1);
  if (conceal > 0) {
    const x = snapshot.self.x * width;
    const y = snapshot.self.y * height + mix(24, -30, conceal);
    context.strokeStyle = css(CYAN, 0.5);
    context.beginPath();
    context.moveTo(x - 28, y);
    context.lineTo(x + 28, y);
    context.stroke();
  }
  context.restore();
}

/** @param {CanvasRenderingContext2D} context @param {ReturnType<typeof tacticalArenaSnapshot>} snapshot @param {number} width @param {number} height @param {ArenaEffectState} [effect] */
function drawCanvasFallback(context, snapshot, width, height, effect = {}) {
  // DOM character cues remain authoritative in the fallback path. Keeping
  // this bitmap transparent preserves the unique scene plate without
  // inventing a second static arena when WebGL is unavailable.
  context.clearRect(0, 0, width, height);
  drawCanvasFeedback(context, snapshot, width, height, effect);
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ reducedMotion?: boolean, onBackend?: (backend: "webgl" | "canvas") => void }} [options]
 */
export function createTacticalArena(canvas, options = {}) {
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new TypeError("createTacticalArena requires a canvas");
  }
  const reducedMotion = options.reducedMotion ??
    globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  /** @type {WebGLRenderingContext | null} */
  let gl = null;
  /** @type {CanvasRenderingContext2D | null} */
  let context2d = null;
  /** @type {WebGLProgram | null} */
  let program = null;
  /** @type {WebGLBuffer | null} */
  let buffer = null;
  let attribPosition = -1;
  let attribColor = -1;
  try {
    gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    if (gl !== null) {
      program = createProgram(gl);
      buffer = gl.createBuffer();
      if (buffer === null) throw new Error("WebGL buffer unavailable");
      // Attribute 位置在 link 之後就固定不變;先前每一幀都重新查兩次(getAttribLocation
      // 是同步的 GL 查詢),而這個 render 是 rAF 迴圈。查一次、存起來。
      attribPosition = gl.getAttribLocation(program, "a_position");
      attribColor = gl.getAttribLocation(program, "a_color");
    }
  } catch {
    gl = null;
    program = null;
    buffer = null;
  }
  if (gl === null) context2d = canvas.getContext("2d");
  const backend = gl !== null ? "webgl" : "canvas";
  options.onBackend?.(backend);
  canvas.dataset.tacticalArenaBackend = backend;
  /** @type {ReturnType<typeof tacticalArenaSnapshot>} */
  let snapshot = tacticalArenaSnapshot();
  /** @type {TacticalArenaFeedback} */
  let feedbackData = {};
  let feedback = tacticalFeedbackPresentation();
  let feedbackStartedAt = 0;
  let feedbackEndsAt = 0;
  let feedbackGeneration = 0;
  let impactTimer = 0;
  let impactPhaseTimer = 0;
  let hurtStartedAt = 0;
  let hurtEndsAt = 0;
  let concealStartedAt = 0;
  let concealEndsAt = 0;
  /** @type {TacticalArenaFeedback[]} */
  let feedbackQueue = [];
  let feedbackSequenceTimer = 0;
  let frame = 0;
  let destroyed = false;
  /** @type {Map<HTMLElement, Map<string, number>>} */
  const transientTimers = new Map();
  /** @type {Map<HTMLImageElement, number>} */
  const transientWeaponTimers = new Map();

  /** @returns {HTMLElement | null} */
  const scene = () => canvas.closest(".tactical-arena-scene");

  /** @param {string | undefined} ref */
  const tokenElement = (ref) => {
    if (ref === undefined || ref === "") return null;
    const root = scene();
    if (root === null) return null;
    if (ref === snapshot.self.ref) return root.querySelector(".tactical-unit-self");
    const match = [...root.querySelectorAll(".tactical-unit[data-arena-target]")].find((element) =>
      element instanceof HTMLElement && element.dataset.arenaTarget === ref
    );
    return match ?? null;
  };

  /**
   * @param {Element | null} element
   * @param {string} className
   * @param {number} durationMs
   * @param {boolean} [restart]
   */
  const transientClass = (element, className, durationMs, restart = false) => {
    if (!(element instanceof HTMLElement)) return;
    let timers = transientTimers.get(element);
    if (timers === undefined) {
      timers = new Map();
      transientTimers.set(element, timers);
    }
    const previousTimer = timers.get(className);
    if (previousTimer !== undefined && element.classList.contains(className) && !restart) return;
    if (previousTimer !== undefined) globalThis.clearTimeout(previousTimer);
    element.classList.remove(className);
    // One deliberate layout read restarts a repeated cue. The tracked timer
    // prevents an older attack from removing a newer cue.
    if (!reducedMotion) void element.offsetWidth;
    element.classList.add(className);
    const timer = globalThis.setTimeout(() => {
      if (timers?.get(className) !== timer) return;
      element.classList.remove(className);
      timers?.delete(className);
      if (timers?.size === 0) transientTimers.delete(element);
    }, durationMs);
    timers.set(className, timer);
  };

  /** @param {Element | null} element @param {string} className */
  const clearTransientClass = (element, className) => {
    if (!(element instanceof HTMLElement)) return;
    const timers = transientTimers.get(element);
    const timer = timers?.get(className);
    if (timer !== undefined) globalThis.clearTimeout(timer);
    timers?.delete(className);
    if (timers?.size === 0) transientTimers.delete(element);
    element.classList.remove(className);
  };

  const clearPendingImpact = () => {
    if (impactTimer !== 0) globalThis.clearTimeout(impactTimer);
    if (impactPhaseTimer !== 0) globalThis.clearTimeout(impactPhaseTimer);
    impactTimer = 0;
    impactPhaseTimer = 0;
    const root = scene();
    root?.querySelectorAll(".is-impact-pending").forEach((element) =>
      element.classList.remove("is-impact-pending")
    );
    root?.querySelectorAll("[data-impact-weapon], [data-impact-kind]").forEach((element) => {
      if (!(element instanceof HTMLElement)) return;
      delete element.dataset.impactWeapon;
      delete element.dataset.impactKind;
      element.style.removeProperty("--tactical-impact-duration");
      element.style.removeProperty("--tactical-impact-x");
      element.style.removeProperty("--tactical-impact-return-x");
    });
    if (root instanceof HTMLElement) {
      delete root.dataset.combatPhase;
      delete root.dataset.impactGeneration;
    }
  };

  const clearPriorBodyAction = () => {
    const root = scene();
    if (!(root instanceof HTMLElement)) return;
    const classes = [
      "is-firing",
      "is-firing-ranged",
      "is-striking-melee",
      "is-searching",
      "is-whiffing",
      "is-impact-contact",
    ];
    root.querySelectorAll(".tactical-unit").forEach((element) => {
      for (const className of classes) clearTransientClass(element, className);
    });
    for (const className of ["has-search-sweep", "has-local-whiff", "has-local-melee"]) {
      clearTransientClass(root, className);
    }
  };

  /**
   * Keep the weapon that caused the event visible even when that same strike
   * breaks it and the authoritative diff has already cleared the loadout.
   * The override is cosmetic and restores the current token markup after the
   * cue; it never changes inventory or attack selection.
   *
   * @param {HTMLElement} source
   * @param {string | undefined} iconUrl
   * @param {number} durationMs
   */
  const transientWeaponIcon = (source, iconUrl, durationMs) => {
    if (iconUrl === undefined || iconUrl === "") return;
    const image = source.querySelector(".tactical-unit-weapon img");
    if (!(image instanceof HTMLImageElement)) return;
    const previousTimer = transientWeaponTimers.get(image);
    if (previousTimer !== undefined) globalThis.clearTimeout(previousTimer);
    if (image.dataset.feedbackWeaponOverride !== "true") {
      image.dataset.feedbackWeaponRestoreSrc = image.getAttribute("src") ?? "";
      image.dataset.feedbackWeaponRestoreHidden = String(image.hidden);
    }
    image.dataset.feedbackWeaponOverride = "true";
    image.src = iconUrl;
    image.hidden = false;
    const timer = globalThis.setTimeout(() => {
      if (transientWeaponTimers.get(image) !== timer) return;
      const restoreSrc = image.dataset.feedbackWeaponRestoreSrc ?? "";
      if (restoreSrc === "") image.removeAttribute("src");
      else image.src = restoreSrc;
      image.hidden = image.dataset.feedbackWeaponRestoreHidden === "true";
      delete image.dataset.feedbackWeaponOverride;
      delete image.dataset.feedbackWeaponRestoreSrc;
      delete image.dataset.feedbackWeaponRestoreHidden;
      transientWeaponTimers.delete(image);
    }, durationMs);
    transientWeaponTimers.set(image, timer);
  };

  /** @param {string | undefined} ref @param {ReturnType<typeof tacticalArenaSnapshot>["self"]} self */
  const refMatchesSelf = (ref, self) =>
    ref !== undefined && ref !== "" && (ref === self.ref || ref === self.playerId);

  /** @param {number} generation */
  const resolveAttackImpact = (generation) => {
    if (
      destroyed || generation !== feedbackGeneration || feedbackData.kind !== "attack"
    ) return;
    impactTimer = 0;
    const root = scene();
    if (!(root instanceof HTMLElement)) return;
    const source = tokenElement(feedbackData.sourceRef);
    const target = tokenElement(feedbackData.targetRef);
    root.dataset.combatPhase = "contact";
    root.dataset.impactGeneration = String(generation);
    root.querySelectorAll(".is-impact-pending").forEach((element) =>
      element.classList.remove("is-impact-pending")
    );
    const timing = tacticalAttackImpactTiming(feedbackData, feedback.durationMs);
    if (feedbackData.hit === true && target instanceof HTMLElement) {
      let impactDirection = 1;
      if (source instanceof HTMLElement) {
        const sourceRect = source.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        impactDirection = sourceRect.left <= targetRect.left ? 1 : -1;
        target.dataset.hitFrom = impactDirection > 0 ? "left" : "right";
      }
      const impactDistance = feedbackData.weapon === "golf_club"
        ? 10
        : feedbackData.weapon === "stool"
        ? 3
        : feedbackData.weapon === "cleaver"
        ? 7
        : 6;
      target.dataset.impactWeapon = feedbackData.weapon ?? "unknown";
      target.dataset.impactKind = feedbackData.variant ?? "body";
      target.style.setProperty("--tactical-impact-duration", `${timing.hurtDurationMs}ms`);
      target.style.setProperty(
        "--tactical-impact-x",
        `${impactDirection * impactDistance}px`,
      );
      target.style.setProperty(
        "--tactical-impact-return-x",
        `${impactDirection * impactDistance * -0.38}px`,
      );
      transientClass(target, "is-hurt", timing.hurtDurationMs, true);
      transientClass(target, "is-impact-contact", Math.min(150, timing.hurtDurationMs), true);
      transientClass(source, "is-impact-contact", 96, true);
      transientClass(root, "has-local-impact", 180, true);
      if (target.classList.contains("token-status-downed")) {
        transientClass(target, "is-going-downed", 800, true);
      }
    } else {
      transientClass(source, "is-whiffing", 180, true);
      transientClass(root, "has-local-whiff", 180, true);
    }
    schedule();
    impactPhaseTimer = globalThis.setTimeout(() => {
      if (generation !== feedbackGeneration || destroyed) return;
      impactPhaseTimer = 0;
      root.dataset.combatPhase = "recover";
    }, Math.min(150, Math.max(70, timing.hurtDurationMs * 0.38)));
  };

  /** Apply state and event cues to the approved HTML character tokens. */
  const syncTokenPresentation = (restart = false) => {
    const root = scene();
    const self = root?.querySelector(".tactical-unit-self") ?? null;
    if (self instanceof HTMLElement) self.classList.toggle("is-concealed", snapshot.self.hidden);
    const now = globalThis.performance?.now?.() ?? 0;
    if (now < concealEndsAt) {
      transientClass(
        self,
        snapshot.self.hidden ? "is-concealing" : "is-revealing",
        Math.max(80, concealEndsAt - now),
        restart,
      );
    }
    if (now < hurtEndsAt) {
      transientClass(self, "is-hurt", Math.max(80, hurtEndsAt - now), restart);
    }
    if (now >= feedbackEndsAt) return;
    const remaining = Math.max(80, feedbackEndsAt - now);
    if (feedbackData.kind === "attack") {
      const source = tokenElement(feedbackData.sourceRef);
      const target = tokenElement(feedbackData.targetRef);
      const impactTiming = tacticalAttackImpactTiming(feedbackData, feedback.durationMs);
      const attackProfile = tacticalWeaponAttackProfile(feedbackData.weapon);
      const attackMotion = tacticalAttackMotion(feedbackData);
      const motionClass = attackMotion === "melee" ? "is-striking-melee" : "is-firing-ranged";
      if (source instanceof HTMLElement) {
        const geometry = tacticalFeedbackGeometry(snapshot, feedbackData);
        const bounds = root instanceof HTMLElement
          ? root.getBoundingClientRect()
          : { width: 1, height: 1 };
        const trajectory = tacticalAttackTrajectory(geometry.source, geometry.target, {
          width: bounds.width,
          height: bounds.height,
          maxDisplacementPx: 72,
        });
        source.style.setProperty("--tactical-attack-x", `${trajectory.xPx.toFixed(2)}px`);
        source.style.setProperty("--tactical-attack-y", `${trajectory.yPx.toFixed(2)}px`);
        source.style.setProperty(
          "--tactical-attack-back-x",
          `${(trajectory.xPx * -0.12).toFixed(2)}px`,
        );
        source.style.setProperty(
          "--tactical-attack-back-y",
          `${(trajectory.yPx * -0.12).toFixed(2)}px`,
        );
        source.style.setProperty(
          "--tactical-attack-lunge-x",
          `${(trajectory.xPx * 0.84).toFixed(2)}px`,
        );
        source.style.setProperty(
          "--tactical-attack-lunge-y",
          `${(trajectory.yPx * 0.84).toFixed(2)}px`,
        );
        source.style.setProperty(
          "--tactical-attack-return-x",
          `${(trajectory.xPx * 0.68).toFixed(2)}px`,
        );
        source.style.setProperty(
          "--tactical-attack-return-y",
          `${(trajectory.yPx * 0.68).toFixed(2)}px`,
        );
        source.style.setProperty(
          "--tactical-attack-recoil-x",
          `${(trajectory.xPx * -0.05).toFixed(2)}px`,
        );
        source.style.setProperty(
          "--tactical-attack-recoil-y",
          `${(trajectory.yPx * -0.05).toFixed(2)}px`,
        );
        source.style.setProperty("--tactical-attack-facing", String(trajectory.facing));
        source.style.setProperty("--tactical-attack-duration", `${Math.round(remaining)}ms`);
        source.style.setProperty("--tactical-action-duration", `${Math.round(remaining)}ms`);
        source.dataset.attackFacing = trajectory.facing < 0 ? "left" : "right";
        if (attackProfile !== null) {
          source.dataset.attackWeapon = attackProfile.weapon;
          source.dataset.attackSemantic = attackProfile.semantic;
        } else {
          delete source.dataset.attackWeapon;
          delete source.dataset.attackSemantic;
        }
        transientWeaponIcon(source, feedbackData.weaponIcon, remaining);
        transientClass(source, "is-firing", remaining, restart);
        transientClass(source, motionClass, remaining, restart);
      } else {
        transientClass(
          root,
          attackMotion === "melee" ? "has-local-melee" : "has-local-gunfire",
          remaining,
          restart,
        );
      }
      if (
        feedbackData.hit === true && target instanceof HTMLElement &&
        now < feedbackStartedAt + impactTiming.impactAtMs &&
        target.classList.contains("token-status-downed")
      ) {
        target.classList.add("is-impact-pending");
      }
      return;
    }
    const source = tokenElement(feedbackData.sourceRef);
    const explicitTarget = tokenElement(feedbackData.targetRef);
    const target = feedbackData.targetRef === undefined ? source : explicitTarget;
    if (feedbackData.kind === "search") {
      if (source instanceof HTMLElement) {
        source.style.setProperty("--tactical-action-duration", `${Math.round(remaining)}ms`);
      }
      transientClass(source, "is-searching", remaining, restart);
      transientClass(root, "has-search-sweep", remaining, restart);
    } else if (feedbackData.kind === "move") {
      const style = feedbackData.style === "sneak"
        ? "sneak"
        : feedbackData.style === "lost"
        ? "lost"
        : "rush";
      transientClass(
        source,
        feedbackData.step === "arrive" ? `is-arriving-${style}` : `is-moving-${style}`,
        remaining,
        restart,
      );
      transientClass(root, `has-route-motion-${style}`, remaining, restart);
    } else if (feedbackData.kind === "hazard") {
      const variant = feedbackData.variant === "conductive_puddle" ||
          feedbackData.variant === "shock"
        ? "shock"
        : feedbackData.variant === "slip"
        ? "slip"
        : "reveal";
      transientClass(target, `is-hazard-${variant}`, remaining, restart);
      transientClass(root, `has-hazard-${variant}`, remaining, restart);
    } else if (feedbackData.kind === "hurt") {
      if (target instanceof HTMLElement) {
        target.style.setProperty("--tactical-action-duration", `${Math.round(remaining)}ms`);
      }
      transientClass(target, "is-hurt", remaining, restart);
    } else if (feedbackData.kind === "downed") {
      clearTransientClass(target, "is-hurt");
      if (target instanceof HTMLElement) {
        delete target.dataset.impactWeapon;
        delete target.dataset.impactKind;
        target.classList.remove("is-impact-pending");
      }
      transientClass(target, "is-going-downed", remaining, false);
      if (target === null && feedbackData.targetRef === undefined) {
        transientClass(root, "has-local-downed", remaining, restart);
      }
    } else if (feedbackData.kind === "echo") {
      transientClass(
        target,
        feedbackData.variant === "return" ? "is-echo-returning" : "is-echo-entering",
        remaining,
        restart,
      );
      if (target === null && feedbackData.targetRef === undefined) {
        transientClass(root, "has-local-echo", remaining, restart);
      }
    } else if (feedbackData.kind === "pickup") {
      transientClass(
        target,
        feedbackData.variant === "equip" ? "is-equipping" : "is-picking-up",
        remaining,
        restart,
      );
    } else if (feedbackData.kind === "recover") {
      transientClass(target, "is-recovering", remaining, restart);
    } else if (feedbackData.kind === "spotted") {
      transientClass(target, "is-spotted", remaining, restart);
    } else if (feedbackData.kind === "hide" && feedbackData.success === false) {
      transientClass(source, "is-hide-failed", remaining, restart);
    } else if (feedbackData.kind === "blockade") {
      transientClass(root, "has-blockade-warning", remaining, restart);
    } else if (feedbackData.kind === "reset") {
      transientClass(root, "has-reset-shock", remaining, restart);
    } else if (feedbackData.kind === "level") {
      transientClass(target, "is-leveling", remaining, restart);
    } else if (feedbackData.kind === "ritual") {
      transientClass(root, `has-ritual-${feedbackData.variant ?? "pulse"}`, remaining, restart);
    }
  };

  const render = () => {
    frame = 0;
    if (destroyed) return;
    const bounds = canvas.getBoundingClientRect();
    const dpr = clamp(globalThis.devicePixelRatio || 1, 1, 2);
    const width = Math.max(1, Math.round(bounds.width * dpr));
    const height = Math.max(1, Math.round(bounds.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const now = globalThis.performance?.now?.() ?? 0;
    const particlesOff = document.body.classList.contains("particles-off");
    const feedbackActive = !reducedMotion && !particlesOff && now < feedbackEndsAt;
    const hurtActive = !reducedMotion && !particlesOff && now < hurtEndsAt;
    const concealActive = !reducedMotion && !particlesOff && now < concealEndsAt;
    const active = feedbackActive || hurtActive || concealActive;
    const effect = {
      feedback: feedbackData,
      feedbackPulse: feedbackActive
        ? clamp((now - feedbackStartedAt) / Math.max(1, feedbackEndsAt - feedbackStartedAt), 0, 1)
        : 0,
      hurtPulse: hurtActive
        ? clamp((now - hurtStartedAt) / Math.max(1, hurtEndsAt - hurtStartedAt), 0, 1)
        : 0,
      concealPulse: concealActive
        ? clamp((now - concealStartedAt) / Math.max(1, concealEndsAt - concealStartedAt), 0, 1)
        : 0,
      lowViolence: document.body.classList.contains("low-violence"),
      particlesOff,
    };
    if (gl !== null && program !== null && buffer !== null) {
      const vertices = arenaVertices(snapshot, width, height, effect);
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(attribPosition);
      gl.vertexAttribPointer(attribPosition, 2, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(attribColor);
      gl.vertexAttribPointer(attribColor, 4, gl.FLOAT, false, 24, 8);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 6);
    } else if (context2d !== null) {
      drawCanvasFallback(context2d, snapshot, width, height, effect);
    }
    if (active) frame = globalThis.requestAnimationFrame(render);
  };
  const schedule = () => {
    if (frame === 0 && !destroyed) frame = globalThis.requestAnimationFrame(render);
  };
  const resizeObserver = typeof ResizeObserver === "undefined"
    ? null
    : new ResizeObserver(schedule);
  resizeObserver?.observe(canvas);
  schedule();

  /** @param {TacticalArenaFeedback} nextFeedback */
  const beginFeedback = (nextFeedback) => {
    clearPendingImpact();
    clearPriorBodyAction();
    feedbackGeneration += 1;
    feedbackData = { ...nextFeedback };
    feedback = tacticalFeedbackPresentation(nextFeedback);
    const now = globalThis.performance?.now?.() ?? 0;
    feedbackStartedAt = now;
    feedbackEndsAt = now + feedback.durationMs;
    const root = scene();
    if (root instanceof HTMLElement) {
      root.dataset.feedbackGeneration = String(feedbackGeneration);
      if (feedbackData.kind === "attack") root.dataset.combatPhase = "windup";
    }
    syncTokenPresentation(true);
    if (feedbackData.kind === "attack") {
      const timing = tacticalAttackImpactTiming(feedbackData, feedback.durationMs);
      const generation = feedbackGeneration;
      const delayMs = reducedMotion ? 0 : timing.impactAtMs;
      impactTimer = globalThis.setTimeout(() => resolveAttackImpact(generation), delayMs);
    }
    schedule();
    const advanceAfter = reducedMotion
      ? 90
      : Math.max(180, Math.min(feedback.durationMs, Math.round(feedback.durationMs * 0.72)));
    feedbackSequenceTimer = globalThis.setTimeout(() => {
      feedbackSequenceTimer = 0;
      const queued = feedbackQueue.shift();
      if (queued !== undefined && !destroyed) beginFeedback(queued);
    }, advanceAfter);
  };

  /** @param {TacticalArenaFeedback[]} sequence */
  const enqueueFeedback = (sequence) => {
    const incoming = sequence.filter((cue) => cue.kind !== undefined);
    if (incoming.length === 0 || destroyed) return;
    const urgentIndex = incoming.findIndex((cue) => tacticalFeedbackPriority(cue) >= 4);
    if (
      feedbackSequenceTimer !== 0 && urgentIndex >= 0 &&
      tacticalFeedbackPriority(feedbackData) < 4
    ) {
      globalThis.clearTimeout(feedbackSequenceTimer);
      feedbackSequenceTimer = 0;
      const urgent = incoming[urgentIndex];
      const remainder = incoming.filter((_, index) => index !== urgentIndex);
      feedbackQueue = mergeTacticalFeedbackQueue(
        [],
        [...remainder, ...feedbackQueue],
        TACTICAL_FEEDBACK_LIMIT,
      );
      beginFeedback(urgent);
      return;
    }
    if (feedbackSequenceTimer === 0) {
      const [first, ...rest] = incoming;
      feedbackQueue = mergeTacticalFeedbackQueue(
        [],
        rest,
        TACTICAL_FEEDBACK_LIMIT - 1,
      );
      beginFeedback(first);
      return;
    }
    feedbackQueue = mergeTacticalFeedbackQueue(
      feedbackQueue,
      incoming,
      TACTICAL_FEEDBACK_LIMIT,
    );
  };

  return {
    /** @param {TacticalArenaModel} model */
    update(model) {
      const previous = snapshot;
      const next = tacticalArenaSnapshot(model);
      const sameSelf = previous.self.ref === next.self.ref;
      const now = globalThis.performance?.now?.() ?? 0;
      const selfDamageOwnedByAttack = feedbackData.kind === "attack" &&
        feedbackData.hit === true && now < feedbackEndsAt &&
        refMatchesSelf(feedbackData.targetRef, next.self);
      if (sameSelf && previous.self.hp > next.self.hp && !selfDamageOwnedByAttack) {
        hurtStartedAt = now;
        hurtEndsAt = now + tacticalFeedbackPresentation({ kind: "hurt" }).durationMs;
      }
      if (sameSelf && previous.self.hidden !== next.self.hidden) {
        concealStartedAt = now;
        concealEndsAt = now + tacticalFeedbackPresentation({ kind: "hide" }).durationMs;
      }
      snapshot = next;
      syncTokenPresentation(
        sameSelf &&
          ((previous.self.hp > next.self.hp && !selfDamageOwnedByAttack) ||
            previous.self.hidden !== next.self.hidden),
      );
      schedule();
    },
    /** @param {TacticalArenaFeedback} nextFeedback */
    playFeedback(nextFeedback) {
      enqueueFeedback([nextFeedback]);
    },
    /** @param {TacticalArenaFeedback[]} sequence */
    playFeedbackSequence(sequence) {
      enqueueFeedback(sequence);
    },
    resize: schedule,
    destroy() {
      destroyed = true;
      if (frame !== 0) globalThis.cancelAnimationFrame(frame);
      if (feedbackSequenceTimer !== 0) globalThis.clearTimeout(feedbackSequenceTimer);
      clearPendingImpact();
      feedbackQueue = [];
      for (const [element, timers] of transientTimers) {
        for (const [className, timer] of timers) {
          globalThis.clearTimeout(timer);
          element.classList.remove(className);
        }
      }
      transientTimers.clear();
      for (const timer of transientWeaponTimers.values()) globalThis.clearTimeout(timer);
      transientWeaponTimers.clear();
      resizeObserver?.disconnect();
      if (gl !== null && buffer !== null) gl.deleteBuffer(buffer);
      if (gl !== null && program !== null) gl.deleteProgram(program);
      canvas.dataset.tacticalArenaBackend = "destroyed";
    },
  };
}
