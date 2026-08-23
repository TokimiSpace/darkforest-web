// Generated from browser/item_art.js by scripts/emit_client.ts. Do not edit.
// @ts-check

/**
 * Browser- and server-safe item art registry. Keep this module free of DOM and locale access so
 * SSR routes can consume the same paths as the live match client.
 *
 * `fieldIcon` is the compact, gameplay-readable asset. `cardArt` is the reserved high-detail
 * Armory image and may be absent from a deployment until the corresponding art batch lands.
 * `outlineIcon` is deliberately limited to weapons because unidentified contacts expose only a
 * weapon silhouette, never a full inventory item.
 */

/**
 * @typedef {{
 *   fieldIcon: string,
 *   cardArt: string,
 *   outlineIcon: string | null,
 * }} ItemArtPaths
 */

/** @param {string} slug @param {boolean=} outline @param {"items" | "shoes" | "weapons"=} group */
function paths(slug, outline = false, group = "items") {
  const fieldIcon = `/art/icons/${group}/${slug}-v3.svg`;
  return Object.freeze({
    fieldIcon,
    cardArt: fieldIcon,
    outlineIcon: outline ? `/art/icons/${group}/${slug}-outline-v3.svg` : null,
  });
}

/** @type {Readonly<Record<import("@darkforest/protocol").ItemKind, ItemArtPaths>>} */
export const ITEM_ART_PATHS = Object.freeze({
  tool: paths("tool", true, "weapons"),
  pistol: paths("pistol", true, "weapons"),
  rifle: paths("rifle", true, "weapons"),
  cleaver: paths("cleaver", true, "weapons"),
  stool: paths("stool", true, "weapons"),
  golf_club: paths("golf-club", true, "weapons"),
  cloth_jacket: paths("cloth-jacket"),
  stab_jacket: paths("stab-jacket"),
  composite_chest: paths("composite-chest"),
  work_helmet: paths("work-helmet"),
  nvg_helmet: paths("nvg-helmet"),
  work_pants: paths("work-pants"),
  rough_gloves: paths("rough-gloves"),
  labor_gloves: paths("labor-gloves"),
  leather_gloves: paths("leather-gloves"),
  small_backpack: paths("small-backpack"),
  large_backpack: paths("large-backpack"),
  soft_sole: paths("soft-sole", false, "shoes"),
  steel_toe: paths("steel-toe", false, "shoes"),
  light_ammo: paths("light-ammo"),
  bandage: paths("bandage"),
  medkit: paths("medkit"),
  healthy_food: paths("healthy-food"),
  spoiled_food: paths("spoiled-food"),
  scrap: paths("scrap"),
  trap_scanner: paths("trap-scanner"),
  insight_root_sense: paths("insight-root-sense"),
  insight_calamity_echo: paths("insight-calamity-echo"),
});

/** @param {unknown} kind @returns {ItemArtPaths | null} */
export function itemArtPathsFor(kind) {
  if (typeof kind !== "string" || !Object.hasOwn(ITEM_ART_PATHS, kind)) return null;
  return ITEM_ART_PATHS[/** @type {import("@darkforest/protocol").ItemKind} */ (kind)];
}

/** @param {unknown} kind */
export function itemFieldIconUrl(kind) {
  return itemArtPathsFor(kind)?.fieldIcon ?? null;
}

/** @param {unknown} kind */
export function itemCardArtUrl(kind) {
  return itemArtPathsFor(kind)?.cardArt ?? null;
}

/** @param {unknown} kind */
export function weaponOutlineIconUrl(kind) {
  return itemArtPathsFor(kind)?.outlineIcon ?? null;
}
