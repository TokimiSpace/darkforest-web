import { assertEquals } from "jsr:@std/assert@1";
import {
  actionAnimationState,
  cooldownKeyForAction,
  cooldownUntilForAction,
  cosmeticCooldownDuration,
  healthAnimationCue,
} from "./action_animation_state.js";

/** @param {number} hp @param {number} maxHp @param {Record<string, number>=} cooldowns */
function playerView(hp, maxHp, cooldowns = {}) {
  return /** @type {any} */ ({
    gameNowMs: 10_000,
    progressionRules: { maxHp },
    self: { hp, cooldownsUntilMs: cooldowns },
  });
}

Deno.test("health cue derives healthy, wounded, and critical poses from authoritative ratios", () => {
  assertEquals(healthAnimationCue(playerView(120, 120)), {
    hp: 120,
    maxHp: 120,
    ratio: 1,
    pose: "healthy",
    keyframeCue: "health-healthy",
  });
  assertEquals(healthAnimationCue(playerView(72, 120)).pose, "wounded");
  assertEquals(healthAnimationCue(playerView(30, 120)).pose, "critical");
});

Deno.test("health cue uses maxHp above 100 instead of assuming a fixed maximum", () => {
  const cue = healthAnimationCue(playerView(70, 200));
  assertEquals(cue.ratio, 0.35);
  assertEquals(cue.pose, "wounded");

  const self = /** @type {any} */ ({ hp: 50, cooldownsUntilMs: {} });
  assertEquals(healthAnimationCue(self, { maxHp: 200 }).pose, "critical");
});

Deno.test("health thresholds are configurable without changing authoritative HP", () => {
  const cue = healthAnimationCue(playerView(60, 100), {
    thresholds: { criticalMaxRatio: 0.2, woundedMaxRatio: 0.5 },
  });
  assertEquals(cue.ratio, 0.6);
  assertEquals(cue.pose, "healthy");
});

Deno.test("cosmetic cooldown duration clamps short and long active deadlines", () => {
  const options = { minMs: 200, maxMs: 900 };
  assertEquals(cosmeticCooldownDuration(10_050, 10_000, options), 200);
  assertEquals(cosmeticCooldownDuration(10_500, 10_000, options), 500);
  assertEquals(cosmeticCooldownDuration(99_000, 10_000, options), 900);
});

Deno.test("expired cooldowns return zero and invalid timing uses a safe fallback", () => {
  assertEquals(cosmeticCooldownDuration(9_999, 10_000), 0);
  assertEquals(cosmeticCooldownDuration(10_000, 10_000), 0);
  assertEquals(cosmeticCooldownDuration(undefined, 10_000), 0);
  assertEquals(cosmeticCooldownDuration(12_000, undefined, { fallbackMs: 75 }), 75);
});

Deno.test("search, attack, and move resolve only their matching authoritative cooldowns", () => {
  const view = playerView(100, 100, {
    search: 10_500,
    attack: 11_000,
    move: 12_000,
    hide: 13_000,
  });
  assertEquals(cooldownKeyForAction("search"), "search");
  assertEquals(cooldownKeyForAction({ action: "attack", target: "P02" }), "attack");
  assertEquals(cooldownKeyForAction({ action: "move", to: "N2" }), "move");
  assertEquals(cooldownUntilForAction(view, "search"), 10_500);
  assertEquals(cooldownUntilForAction(view, { action: "attack" }), 11_000);
  assertEquals(cooldownUntilForAction(view, "move"), 12_000);
  assertEquals(cooldownKeyForAction("hide"), null);
  assertEquals(cooldownUntilForAction(view, "hide"), null);
});

Deno.test("missing fields fail to neutral health and zero-duration animation state", () => {
  const state = actionAnimationState(/** @type {any} */ ({}), "attack", 10_000);
  assertEquals(state, {
    healthRatio: null,
    healthPose: "healthy",
    keyframeCue: "health-healthy",
    maxHp: null,
    cooldownKey: "attack",
    cooldownUntilMs: null,
    durationMs: 0,
  });
  assertEquals(cooldownKeyForAction(undefined), null);
  assertEquals(cooldownUntilForAction(null, "move"), null);
});

Deno.test("reduced motion keeps health pose and keyframe cue but suppresses duration", () => {
  const state = actionAnimationState(
    playerView(20, 120, { attack: 20_000 }),
    { action: "attack" },
    10_000,
    { reducedMotion: true },
  );
  assertEquals(state.healthPose, "critical");
  assertEquals(state.keyframeCue, "health-critical");
  assertEquals(state.cooldownKey, "attack");
  assertEquals(state.cooldownUntilMs, 20_000);
  assertEquals(state.durationMs, 0);
});
