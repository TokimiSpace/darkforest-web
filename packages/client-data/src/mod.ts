/**
 * Curated values rendered by the standalone public demo UI.
 * This package is presentation data, not the production rules engine or balance source.
 */

export const BALANCE = {
  timeline: {
    matchEndMs: 1_350_000,
    resetStartMs: 450_000,
    resetEndMs: 510_000,
    rootheartFinaleAtMs: 1_050_000,
    suddenDeath: { atMs: 1_260_000 },
  },
  shop: {
    buyCooldownMs: 2_000,
    sellRatioBps: 4_000,
    purchaseNoise: 5,
    catalog: [
      { kind: "light_ammo", price: 20 },
      { kind: "bandage", price: 25 },
      { kind: "medkit", price: 60 },
      { kind: "healthy_food", price: 30 },
      { kind: "scrap", price: 15 },
      { kind: "stab_jacket", price: 80, stock: 2 },
      { kind: "composite_chest", price: 150, stock: 1 },
      { kind: "nvg_helmet", price: 150, stock: 1 },
    ],
  },
  starterItems: [
    "bandage",
    "light_ammo",
    "scrap",
    "work_pants",
    "rough_gloves",
    "cloth_jacket",
    "medkit",
  ],
  search: {
    lightAmmoPerFind: 6,
    lootTable: {
      common: [
        "bandage",
        "spoiled_food",
        "stool",
        "cleaver",
        "golf_club",
        "light_ammo",
        "scrap",
        "cloth_jacket",
        "work_pants",
        "rough_gloves",
      ],
      uncommon: [
        "medkit",
        "healthy_food",
        "tool",
        "pistol",
        "stab_jacket",
        "work_helmet",
        "small_backpack",
        "labor_gloves",
      ],
      rare: [
        "rifle",
        "trap_scanner",
        "composite_chest",
        "nvg_helmet",
        "large_backpack",
        "leather_gloves",
      ],
    },
  },
  legacy: { ammoKeepBps: 1_500, unlockedDurabilityKeepBps: 3_000 },
  weapons: {
    tool: { base: 11, hitBps: 8_500, cooldownMs: 3_500, range: "same", durability: 36 },
    pistol: { base: 18, hitBps: 7_600, cooldownMs: 3_500, range: "same_or_adjacent" },
    rifle: { base: 21, hitBps: 7_200, cooldownMs: 4_375, range: "adjacent_los" },
    cleaver: { base: 11, hitBps: 8_200, cooldownMs: 3_250, range: "same", durability: 18 },
    stool: { base: 15, hitBps: 7_000, cooldownMs: 4_250, range: "same", durability: 8 },
    golf_club: { base: 13, hitBps: 7_600, cooldownMs: 3_750, range: "same", durability: 20 },
  },
  equipment: {
    baseCapacity: 8,
    nvgSignalBonus: 10,
    items: {
      cloth_jacket: { slot: "jacket", armor: 3, durability: 9 },
      stab_jacket: { slot: "jacket", armor: 8, durability: 24 },
      composite_chest: { slot: "jacket", armor: 14, durability: 42 },
      work_helmet: { slot: "helmet", armor: 5, durability: 15 },
      nvg_helmet: { slot: "helmet", armor: 3, durability: 15 },
      work_pants: { slot: "pants", armor: 2, durability: 6, capacityBonus: 1 },
      rough_gloves: { slot: "gloves", armor: 1, durability: 6 },
      labor_gloves: { slot: "gloves", armor: 2, durability: 6 },
      leather_gloves: { slot: "gloves", armor: 4, durability: 6 },
      small_backpack: { slot: "backpack", armor: 0, capacityBonus: 4 },
      large_backpack: { slot: "backpack", armor: 0, capacityBonus: 8 },
      soft_sole: { slot: "shoes", armor: 0 },
      steel_toe: { slot: "shoes", armor: 0 },
    },
  },
  actions: { bandageCastMs: 5_000, medkitCastMs: 8_000, foodCastMs: 3_000 },
  items: {
    bandageHeal: 18,
    medkitHeal: 45,
    healthyFoodHp: 10,
    healthyFoodStamina: 50,
    spoiledFoodStamina: 25,
    spoiledFoodDiscomfortMs: 20_000,
    scannerUses: 2,
    scannerSignal: 8,
    calamityEchoImmunityMs: 60_000,
    scrapRepairAmount: 12,
  },
  signal: { decayEveryMs: 10_000, decayPerInsight: 2 },
  finale: { soloChannelInsightReductionMs: 5_000 },
  factionCompatibility: { toolDurabilityDenominator: 4 },
  gear: {
    soft_sole: { stealthBps: 500 },
    steel_toe: { stealthBps: -500, debrisSlipImmune: true },
  },
  movement: {
    rushNoise: 15,
    sneakNoise: 4,
    rushNoiseSoftSole: 10,
    sneakNoiseSoftSole: 2,
  },
  injury: { cure: { bandageCures: 1, medkitCuresAll: true } },
} as const;

export function sellPriceFor(price: number): number {
  return Math.floor((price * BALANCE.shop.sellRatioBps) / 10_000);
}
