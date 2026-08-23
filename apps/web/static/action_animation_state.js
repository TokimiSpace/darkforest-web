// Generated from browser/action_animation_state.js by scripts/emit_client.ts. Do not edit.
// @ts-check

/**
 * Pure presentation helpers for action animation timing and health poses.
 *
 * Every value in this module is derived from an authoritative PlayerView/SelfState snapshot.
 * The returned duration is cosmetic only: callers must never use it to enable an action, advance
 * gameplay state, or replace the authoritative cooldown deadline.
 */

/** @typedef {import("@darkforest/protocol").PlayerView} _PlayerView */
/** @typedef {import("@darkforest/protocol").SelfState} _SelfState */
/** @typedef {_PlayerView | _SelfState} ActionAnimationSource */
/** @typedef {"healthy" | "wounded" | "critical"} HealthPose */
/** @typedef {"health-healthy" | "health-wounded" | "health-critical"} HealthKeyframeCue */
/** @typedef {"search" | "attack" | "move"} AnimationCooldownKey */

/**
 * @typedef {object} HealthThresholds
 * @property {number=} criticalMaxRatio Inclusive upper bound for the critical pose.
 * @property {number=} woundedMaxRatio Inclusive upper bound for the wounded pose.
 */

/**
 * @typedef {object} CosmeticDurationOptions
 * @property {number=} minMs Minimum duration for an active cooldown.
 * @property {number=} maxMs Maximum duration for an active cooldown.
 * @property {number=} fallbackMs Duration returned for missing/invalid timing data.
 * @property {boolean=} reducedMotion Whether motion should be suppressed.
 */

/**
 * @typedef {object} ActionAnimationOptions
 * @property {number=} maxHp Authoritative maximum HP when `source` is a bare SelfState.
 * @property {HealthThresholds=} thresholds Optional health-band overrides.
 * @property {CosmeticDurationOptions=} duration Optional cosmetic duration limits.
 * @property {boolean=} reducedMotion Whether motion should be suppressed.
 */

export const DEFAULT_HEALTH_THRESHOLDS = Object.freeze({
  criticalMaxRatio: 0.33,
  woundedMaxRatio: 0.66,
});

export const DEFAULT_COSMETIC_DURATION = Object.freeze({
  minMs: 180,
  // Search and careful movement legitimately occupy 6-7 seconds. Keep the
  // complete authoritative window available to callers; each visual phase may
  // still consume only a bounded fraction of it.
  maxMs: 8_000,
  fallbackMs: 0,
});

const HEALTH_KEYFRAME_CUES = Object.freeze({
  healthy: /** @type {HealthKeyframeCue} */ ("health-healthy"),
  wounded: /** @type {HealthKeyframeCue} */ ("health-wounded"),
  critical: /** @type {HealthKeyframeCue} */ ("health-critical"),
});

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** @param {unknown} value @returns {number | null} */
function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** @param {unknown} value @returns {number | null} */
function nonNegativeNumber(value) {
  const number = finiteNumber(value);
  return number !== null && number >= 0 ? number : null;
}

/** @param {unknown} value @returns {number | null} */
function ratioThreshold(value) {
  const number = finiteNumber(value);
  return number !== null && number >= 0 && number <= 1 ? number : null;
}

/** @param {unknown} source @returns {Record<string, unknown> | null} */
function selfFromSource(source) {
  if (!isRecord(source)) return null;
  if ("self" in source) return isRecord(source.self) ? source.self : null;
  return source;
}

/** @param {unknown} source @param {number | undefined} explicitMaxHp */
function maxHpFromSource(source, explicitMaxHp) {
  if (isRecord(source) && isRecord(source.self) && isRecord(source.progressionRules)) {
    const viewMaxHp = finiteNumber(source.progressionRules.maxHp);
    if (viewMaxHp !== null && viewMaxHp > 0) return viewMaxHp;
  }
  const providedMaxHp = finiteNumber(explicitMaxHp);
  return providedMaxHp !== null && providedMaxHp > 0 ? providedMaxHp : null;
}

/** @param {HealthThresholds | undefined} configured */
function normalizedHealthThresholds(configured) {
  const criticalMaxRatio = ratioThreshold(configured?.criticalMaxRatio) ??
    DEFAULT_HEALTH_THRESHOLDS.criticalMaxRatio;
  const woundedMaxRatio = ratioThreshold(configured?.woundedMaxRatio) ??
    DEFAULT_HEALTH_THRESHOLDS.woundedMaxRatio;
  if (criticalMaxRatio > woundedMaxRatio) return DEFAULT_HEALTH_THRESHOLDS;
  return { criticalMaxRatio, woundedMaxRatio };
}

/**
 * Derive the three-state health pose from authoritative HP and max HP.
 * A full PlayerView always wins over `options.maxHp`; a bare SelfState requires that option.
 * Missing/invalid health data fails to a neutral healthy pose with a null ratio.
 *
 * @param {ActionAnimationSource | null | undefined} source
 * @param {{maxHp?: number, thresholds?: HealthThresholds}=} options
 */
export function healthAnimationCue(source, options = {}) {
  const self = selfFromSource(source);
  const hp = finiteNumber(self?.hp);
  const maxHp = maxHpFromSource(source, options.maxHp);
  const ratio = hp === null || maxHp === null ? null : Math.max(0, Math.min(1, hp / maxHp));
  const thresholds = normalizedHealthThresholds(options.thresholds);
  /** @type {HealthPose} */
  let pose = "healthy";
  if (ratio !== null && ratio <= thresholds.criticalMaxRatio) pose = "critical";
  else if (ratio !== null && ratio <= thresholds.woundedMaxRatio) pose = "wounded";
  return {
    hp,
    maxHp,
    ratio,
    pose,
    keyframeCue: HEALTH_KEYFRAME_CUES[pose],
  };
}

/**
 * Resolve the gameplay cooldown key relevant to an animated action.
 * Accepts either an ActionPayload-like object or its action string.
 *
 * @param {unknown} action
 * @returns {AnimationCooldownKey | null}
 */
export function cooldownKeyForAction(action) {
  const name = typeof action === "string"
    ? action
    : isRecord(action) && typeof action.action === "string"
    ? action.action
    : null;
  return name === "search" || name === "attack" || name === "move" ? name : null;
}

/**
 * Read, but never mutate or reinterpret, the authoritative deadline for an animated action.
 *
 * @param {ActionAnimationSource | null | undefined} source
 * @param {unknown} action
 * @returns {number | null}
 */
export function cooldownUntilForAction(source, action) {
  const key = cooldownKeyForAction(action);
  const self = selfFromSource(source);
  if (key === null || !isRecord(self?.cooldownsUntilMs)) return null;
  return finiteNumber(self.cooldownsUntilMs[key]);
}

/**
 * Convert an authoritative deadline into a bounded, cosmetic-only animation duration.
 * Expired deadlines always return zero. Missing/invalid data returns the configured safe fallback.
 *
 * @param {unknown} cooldownUntilMs
 * @param {unknown} gameNowMs
 * @param {CosmeticDurationOptions=} options
 */
export function cosmeticCooldownDuration(cooldownUntilMs, gameNowMs, options = {}) {
  if (options.reducedMotion === true) return 0;
  const minMs = nonNegativeNumber(options.minMs) ?? DEFAULT_COSMETIC_DURATION.minMs;
  const requestedMaxMs = nonNegativeNumber(options.maxMs) ?? DEFAULT_COSMETIC_DURATION.maxMs;
  const maxMs = Math.max(minMs, requestedMaxMs);
  const fallbackMs = Math.min(
    maxMs,
    nonNegativeNumber(options.fallbackMs) ?? DEFAULT_COSMETIC_DURATION.fallbackMs,
  );
  const deadline = finiteNumber(cooldownUntilMs);
  const now = finiteNumber(gameNowMs);
  if (deadline === null || now === null) return fallbackMs;
  const remainingMs = deadline - now;
  if (remainingMs <= 0) return 0;
  return Math.min(maxMs, Math.max(minMs, remainingMs));
}

/** @param {unknown} source @param {unknown} explicitGameNowMs */
function gameNowFromSource(source, explicitGameNowMs) {
  const explicit = finiteNumber(explicitGameNowMs);
  if (explicit !== null) return explicit;
  return isRecord(source) ? finiteNumber(source.gameNowMs) : null;
}

/**
 * Produce the complete presentational state for search/attack/move animation selection.
 * Health cues remain available under reduced motion while the cosmetic duration becomes zero.
 *
 * @param {ActionAnimationSource | null | undefined} source
 * @param {unknown} action
 * @param {unknown} gameNowMs
 * @param {ActionAnimationOptions=} options
 */
export function actionAnimationState(source, action, gameNowMs, options = {}) {
  const health = healthAnimationCue(source, options);
  const cooldownKey = cooldownKeyForAction(action);
  const cooldownUntilMs = cooldownUntilForAction(source, action);
  const durationMs = cosmeticCooldownDuration(
    cooldownUntilMs,
    gameNowFromSource(source, gameNowMs),
    { ...options.duration, reducedMotion: options.reducedMotion === true },
  );
  return {
    healthRatio: health.ratio,
    healthPose: health.pose,
    keyframeCue: health.keyframeCue,
    maxHp: health.maxHp,
    cooldownKey,
    cooldownUntilMs,
    durationMs,
  };
}
