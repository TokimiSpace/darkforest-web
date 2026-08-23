// @ts-check

/**
 * The public demo intentionally ships no raster motion atlas. Static SVG figures remain the
 * complete presentation fallback, while these helpers preserve the client integration surface.
 */

const MOTION_PACKS = Object.freeze({
  courier: Object.freeze({ id: "courier-placeholder", actions: Object.freeze({}) }),
  scavenger: Object.freeze({ id: "scavenger-placeholder", actions: Object.freeze({}) }),
  enforcer: Object.freeze({ id: "enforcer-placeholder", actions: Object.freeze({}) }),
});

/** @param {unknown} profession */
export function characterMotionPack(profession) {
  return profession === "courier" || profession === "scavenger" || profession === "enforcer"
    ? MOTION_PACKS[profession]
    : null;
}

/** @param {unknown} _profession */
export function characterMotionMarkup(_profession) {
  return "";
}

/** @param {ParentNode} _root @param {{reducedMotion?: boolean}=} _options */
export function hydrateCharacterMotion(_root, _options = {}) {
  // Deliberately empty: no public raster animation pack is bundled.
}

/** @param {ParentNode} root @param {"rush" | "sneak" | "lost" | null} style */
export function syncCharacterTravelMotion(root, style) {
  const self = root.querySelector(".tactical-unit-self");
  if (!(self instanceof HTMLElement)) return;
  self.classList.toggle("is-traveling-rush", style === "rush" || style === "lost");
  self.classList.toggle("is-traveling-sneak", style === "sneak");
}
