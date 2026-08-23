import { BALANCE, sellPriceFor } from "@darkforest/client-data";
import type { ItemKind, WeaponKind } from "@darkforest/protocol";

/**
 * The Armory presents the manually curated public-demo values in client-data.
 * Numeric facts are formatted from that single checked-in snapshot so the UI
 * does not duplicate its own price or equipment tables.
 */
export type ArmoryAcquisition =
  | "starter_guaranteed"
  | "starter_background"
  | "starter_weighted"
  | "search_common"
  | "search_uncommon"
  | "search_rare"
  | "echo_insight";

export type ArmoryReset =
  | "keeps"
  | "ammo_reduced"
  | "durability_reduced"
  | "electronic_to_scrap"
  | "post_reset_only";

export type ArmoryStatKey =
  | "damage"
  | "baseHit"
  | "cooldown"
  | "range"
  | "durability"
  | "armor"
  | "capacity"
  | "healing"
  | "curesInjury"
  | "stamina"
  | "cast"
  | "uses"
  | "signal"
  | "ammo"
  | "repair"
  | "stealth"
  | "noise"
  | "debris"
  | "dark"
  | "toolWear"
  | "immunity"
  | "finale"
  | "staminaRegen"
  | "price";

export interface ArmoryStatChip {
  labelKey: `armory.rule.stat.${ArmoryStatKey}`;
  /** Always present so the rule remains readable before i18n hydration. */
  value: string;
  /** Optional localized replacement for a non-numeric value such as range. */
  valueKey?:
    | "armory.rule.range.sameNode"
    | "armory.rule.range.sameOrAdjacent"
    | "armory.rule.range.adjacentLos";
}

export interface ArmoryRule {
  kind: ItemKind;
  statChips: readonly ArmoryStatChip[];
  effectKey: `armory.item.${ItemKind}.effect`;
  detailKey: `armory.item.${ItemKind}.detail`;
  /** zh-TW SSR fallback; i18n hydration replaces it without exposing raw keys. */
  effect: string;
  /** zh-TW SSR fallback; i18n hydration replaces it without exposing raw keys. */
  detail: string;
  acquisition: readonly ArmoryAcquisition[];
  reset: ArmoryReset;
  /** Public-demo percentage used by the matching Reset copy, when relevant. */
  resetValue?: string;
}

type EquipmentSlot = "helmet" | "jacket" | "pants" | "gloves" | "shoes" | "backpack";
type EquipmentSpec = {
  slot: EquipmentSlot;
  armor: number;
  durability?: number;
  capacityBonus?: number;
};
type WeaponSpec = {
  base: number;
  hitBps: number;
  cooldownMs: number;
  range: "same" | "same_or_adjacent" | "adjacent_los";
  durability?: number;
};

// Curated client-data intentionally preserves literal values. These read-only adapters widen only
// the collection shapes needed for exhaustive ItemKind projections in this presentation.
const PUBLIC_EQUIPMENT_ITEMS = BALANCE.equipment.items as unknown as Partial<
  Record<ItemKind, EquipmentSpec>
>;
const PUBLIC_WEAPONS = BALANCE.weapons as unknown as Record<WeaponKind, WeaponSpec>;

const percentFromBps = (bps: number): string => `${bps / 100}%`;
const signedPercentPointFromBps = (bps: number): string => `${bps >= 0 ? "+" : ""}${bps / 100} pp`;
const seconds = (ms: number): string => `${ms / 1000} s`;

const stat = (key: ArmoryStatKey, value: string): ArmoryStatChip => ({
  labelKey: `armory.rule.stat.${key}`,
  value,
});

const rangeStat = (range: "same" | "same_or_adjacent" | "adjacent_los"): ArmoryStatChip => {
  const values = {
    same: ["同節點", "armory.rule.range.sameNode"],
    same_or_adjacent: ["同節點或相鄰", "armory.rule.range.sameOrAdjacent"],
    adjacent_los: ["相鄰且有視線", "armory.rule.range.adjacentLos"],
  } as const;
  const [value, valueKey] = values[range];
  return { ...stat("range", value), valueKey };
};

/**
 * 公開軍械頁的補給站是 player-facing snapshot；它不是第二套規則引擎。
 * `stockLimit` 缺省代表無限供應，與 NodeView.shop.stockLeft 的缺省語意一致。
 */
export const ARMORY_SHOP_RULE = {
  buyCooldownMs: BALANCE.shop.buyCooldownMs,
  sellRatio: percentFromBps(BALANCE.shop.sellRatioBps),
  purchaseNoise: BALANCE.shop.purchaseNoise,
  catalog: BALANCE.shop.catalog.map((entry) => {
    const stockLimit = "stock" in entry ? entry.stock : undefined;
    return {
      kind: entry.kind as ItemKind,
      buyPrice: entry.price,
      sellPrice: sellPriceFor(entry.price),
      ...(stockLimit === undefined ? {} : { stockLimit }),
    };
  }),
} as const;

function acquisitionFor(kind: ItemKind): ArmoryAcquisition[] {
  const sources: ArmoryAcquisition[] = [];
  if (kind === "tool" || kind === "small_backpack") {
    sources.push("starter_guaranteed");
  }
  if (kind === "soft_sole" || kind === "steel_toe") {
    sources.push("starter_background");
  }
  if ((BALANCE.starterItems as readonly ItemKind[]).includes(kind)) {
    sources.push("starter_weighted");
  }
  const table = BALANCE.search.lootTable;
  if ((table.common as readonly ItemKind[]).includes(kind)) sources.push("search_common");
  if ((table.uncommon as readonly ItemKind[]).includes(kind)) sources.push("search_uncommon");
  if ((table.rare as readonly ItemKind[]).includes(kind)) sources.push("search_rare");
  if (kind === "insight_root_sense" || kind === "insight_calamity_echo") {
    sources.push("echo_insight");
  }
  return sources;
}

function resetFor(kind: ItemKind): Pick<ArmoryRule, "reset" | "resetValue"> {
  if (kind === "insight_root_sense" || kind === "insight_calamity_echo") {
    return { reset: "post_reset_only" };
  }
  if (kind === "light_ammo") {
    return { reset: "ammo_reduced", resetValue: percentFromBps(BALANCE.legacy.ammoKeepBps) };
  }
  if (kind === "trap_scanner" || kind === "nvg_helmet") {
    return { reset: "electronic_to_scrap" };
  }
  const weapon = (BALANCE.weapons as Partial<Record<ItemKind, { durability?: number }>>)[kind];
  if (weapon?.durability !== undefined || PUBLIC_EQUIPMENT_ITEMS[kind]?.durability !== undefined) {
    return {
      reset: "durability_reduced",
      resetValue: percentFromBps(BALANCE.legacy.unlockedDurabilityKeepBps),
    };
  }
  return { reset: "keeps" };
}

export const ARMORY_ACQUISITION_FALLBACKS = {
  starter_guaranteed: "固定起手裝備",
  starter_background: "依背景固定配發",
  starter_weighted: "隨機起手包",
  search_common: "搜索：常見",
  search_uncommon: "搜索：少見",
  search_rare: "搜索：稀有",
  echo_insight: "Echo 復歸後選擇",
} as const satisfies Readonly<Record<ArmoryAcquisition, string>>;

export const ARMORY_RESET_FALLBACKS = {
  keeps: "未封存也完整保留",
  ammo_reduced: "未封存時數量衰減",
  durability_reduced: "未封存時耐久震損",
  electronic_to_scrap: "未封存時轉為廢料",
  post_reset_only: "只在爆炸後取得",
} as const satisfies Readonly<Record<ArmoryReset, string>>;

export function armoryResetFallback(rule: Pick<ArmoryRule, "reset" | "resetValue">): string {
  const sealed = "封存進 Legacy 則原樣保留。";
  switch (rule.reset) {
    case "ammo_reduced":
      return `未封存時只保留原數量的 ${rule.resetValue}；${sealed}`;
    case "durability_reduced":
      return `未封存時只保留原耐久的 ${rule.resetValue}（至少 1）；${sealed}`;
    case "electronic_to_scrap":
      return `未封存時損毀並轉成 1 份廢料；${sealed}`;
    case "keeps":
      return "即使未封存進 Legacy，也會完整帶過爆炸。";
    case "post_reset_only":
      return "只由 Echo 復歸選擇取得，不經歷本局的爆炸轉換。";
  }
}

const equipmentSlotFallback = {
  helmet: "頭盔槽",
  jacket: "上衣槽",
  pants: "下身槽",
  gloves: "手套槽",
  shoes: "鞋具槽",
  backpack: "背包槽",
} as const;

function equipmentEffect(kind: ItemKind): string {
  const spec = PUBLIC_EQUIPMENT_ITEMS[kind];
  if (spec === undefined) throw new Error(`Missing equipment balance for ${kind}`);
  const facts = [`裝備在${equipmentSlotFallback[spec.slot]}`];
  if (spec.armor > 0) facts.push(`提供 ${spec.armor} 護甲`);
  if (spec.capacityBonus !== undefined) facts.push(`容量 +${spec.capacityBonus}`);
  if (spec.durability !== undefined) facts.push(`滿耐久 ${spec.durability}`);
  return `${facts.join("，")}。`;
}

const ARMORY_COPY_FALLBACKS = {
  tool: {
    effect: "只能攻擊同節點目標；每次揮擊都會檢查工具耐久。",
    detail: `基礎傷害 ${BALANCE.weapons.tool.base}、基礎命中 ${
      percentFromBps(BALANCE.weapons.tool.hitBps)
    }。耐久歸零會變成 1 份廢料。`,
  },
  pistol: {
    effect: "可攻擊同節點或相鄰目標；每次射擊消耗 1 發輕彈。",
    detail: `基礎傷害 ${BALANCE.weapons.pistol.base}、基礎命中 ${
      percentFromBps(BALANCE.weapons.pistol.hitBps)
    }；環境、掩體與姿態仍會修正命中。`,
  },
  rifle: {
    effect: "只能攻擊有視線的相鄰節點目標；每次射擊消耗 1 發輕彈。",
    detail: `基礎傷害 ${BALANCE.weapons.rifle.base}、基礎命中 ${
      percentFromBps(BALANCE.weapons.rifle.hitBps)
    }；開闊地有利，狹窄與黑暗環境不利。`,
  },
  cleaver: {
    effect: "只能攻擊同節點目標；每次揮擊都會消耗菜刀耐久。",
    detail: `基礎傷害 ${BALANCE.weapons.cleaver.base}、基礎命中 ${
      percentFromBps(BALANCE.weapons.cleaver.hitBps)
    }；狹窄與密集環境有利，開闊地不利。`,
  },
  stool: {
    effect: "只能攻擊同節點目標；每次揮擊都會消耗板凳耐久。",
    detail: `基礎傷害 ${BALANCE.weapons.stool.base}、基礎命中 ${
      percentFromBps(BALANCE.weapons.stool.hitBps)
    }；單擊沉重但冷卻較長，開闊與瓦礫環境較有利。`,
  },
  golf_club: {
    effect: "只能攻擊同節點目標；每次揮擊都會消耗球桿耐久。",
    detail: `基礎傷害 ${BALANCE.weapons.golf_club.base}、基礎命中 ${
      percentFromBps(BALANCE.weapons.golf_club.hitBps)
    }；開闊地能完整揮動，狹窄、密集與濕滑環境不利。`,
  },
  light_ammo: {
    effect: "手槍與步槍每次射擊各消耗 1 發。",
    detail: `每次搜索命中彈藥時取得 ${BALANCE.search.lightAmmoPerFind} 發；整組只占 1 格背包。`,
  },
  bandage: {
    effect: `施放完成後回復最多 ${BALANCE.items.bandageHeal} HP。`,
    detail: `需要 ${seconds(BALANCE.actions.bandageCastMs)}；施放途中受傷會中斷，物品不會被消耗。`,
  },
  medkit: {
    effect: `施放完成後回復最多 ${BALANCE.items.medkitHeal} HP。`,
    detail: `需要 ${seconds(BALANCE.actions.medkitCastMs)}；施放途中受傷會中斷，物品不會被消耗。`,
  },
  healthy_food: {
    effect:
      `施放完成後回復最多 ${BALANCE.items.healthyFoodHp} HP 與 ${BALANCE.items.healthyFoodStamina} 氣力。`,
    detail: `需要 ${seconds(BALANCE.actions.foodCastMs)}；HP 與氣力都不會超過各自上限。`,
  },
  spoiled_food: {
    effect: `施放完成後回復最多 ${BALANCE.items.spoiledFoodStamina} 氣力。`,
    detail: `需要 ${seconds(BALANCE.actions.foodCastMs)}；之後腸胃不適 ${
      seconds(BALANCE.items.spoiledFoodDiscomfortMs)
    }，期間停止自然回氣。`,
  },
  scrap: {
    effect: `消耗 1 份，讓背包內第一件受損工具回復 ${BALANCE.items.scrapRepairAmount} 耐久。`,
    detail: `修理不會超過工具滿耐久 ${BALANCE.weapons.tool.durability}；沒有可修工具時不能使用。`,
  },
  trap_scanner: {
    effect: "揭露自己目前節點的導電水窪危險。",
    detail:
      `共有 ${BALANCE.items.scannerUses} 次使用耐久；每次使用 Signal +${BALANCE.items.scannerSignal}，不會掃描遠方節點。`,
  },
  insight_root_sense: {
    effect: "消耗後揭露所有根系邊兩端節點的導電水窪危險。",
    detail: `鎖定此 Insight 會讓 Signal 每 ${
      seconds(BALANCE.signal.decayEveryMs)
    } 額外下降 ${BALANCE.signal.decayPerInsight}，並讓獨活終局引導縮短 ${
      seconds(BALANCE.finale.soloChannelInsightReductionMs)
    }。`,
  },
  insight_calamity_echo: {
    effect: `消耗後揭露一個已知節點的導電水窪，並免疫該節點危險 ${
      seconds(BALANCE.items.calamityEchoImmunityMs)
    }。`,
    detail: `鎖定此 Insight 會讓 Signal 每 ${
      seconds(BALANCE.signal.decayEveryMs)
    } 額外下降 ${BALANCE.signal.decayPerInsight}，並讓獨活終局引導縮短 ${
      seconds(BALANCE.finale.soloChannelInsightReductionMs)
    }。`,
  },
  cloth_jacket: {
    effect: equipmentEffect("cloth_jacket"),
    detail: "沒有額外特效；有效傷害會讓當下最高護甲裝備失去 1 耐久。",
  },
  stab_jacket: {
    effect: equipmentEffect("stab_jacket"),
    detail: "提供一般護甲減傷，沒有額外的刀械或近戰專屬抗性。",
  },
  composite_chest: {
    effect: equipmentEffect("composite_chest"),
    detail: "現行上衣中護甲與耐久最高；高護甲輪廓也可能被遠方目標辨識。",
  },
  work_helmet: {
    effect: equipmentEffect("work_helmet"),
    detail: "沒有額外特效；以一般護甲公式降低所有有效傷害。",
  },
  nvg_helmet: {
    effect: equipmentEffect("nvg_helmet"),
    detail:
      `裝備時 Signal +${BALANCE.equipment.nvgSignalBonus}；配戴期間，黑暗對手槍與步槍的命中懲罰減半。`,
  },
  work_pants: {
    effect: equipmentEffect("work_pants"),
    detail: "容量加成會與背包疊加；裝備中的褲子本身不占背包格。",
  },
  rough_gloves: {
    effect: equipmentEffect("rough_gloves"),
    detail: "沒有搜索或工具特效，只提供基礎護甲與耐久。",
  },
  labor_gloves: {
    effect: equipmentEffect("labor_gloves"),
    detail:
      `每 ${BALANCE.factionCompatibility.toolDurabilityDenominator} 次工具揮擊有 1 次不消耗耐久；與同盟被動同時生效時可各自觸發。`,
  },
  leather_gloves: {
    effect: equipmentEffect("leather_gloves"),
    detail: "沒有額外特效；現行手套中提供最高護甲。",
  },
  small_backpack: {
    effect: equipmentEffect("small_backpack"),
    detail: `人人固定起手配發；基礎容量 ${BALANCE.equipment.baseCapacity} 加上背包加成後為 ${
      BALANCE.equipment.baseCapacity + (BALANCE.equipment.items.small_backpack?.capacityBonus ?? 0)
    }。`,
  },
  large_backpack: {
    effect: equipmentEffect("large_backpack"),
    detail: "只增加容量，不會額外增加 Signal、移動懲罰或遠方可見度。",
  },
  soft_sole: {
    effect: `躲藏與偵測修正 ${
      signedPercentPointFromBps(BALANCE.gear.soft_sole.stealthBps)
    }；趕路／潛行噪音降為 ${BALANCE.movement.rushNoiseSoftSole}／${BALANCE.movement.sneakNoiseSoftSole}。`,
    detail: "Courier 固定起手鞋；鞋不能脫下，只能用另一雙鞋替換。",
  },
  steel_toe: {
    effect: `躲藏與偵測修正 ${
      signedPercentPointFromBps(BALANCE.gear.steel_toe.stealthBps)
    }；免疫瓦礫地面滑倒。`,
    detail: "同盟背景的固定起手鞋；鞋不能脫下，只能用另一雙鞋替換。",
  },
} as const satisfies Readonly<Record<ItemKind, { effect: string; detail: string }>>;

function rule(kind: ItemKind, statChips: readonly ArmoryStatChip[]): ArmoryRule {
  const copy = ARMORY_COPY_FALLBACKS[kind];
  return {
    kind,
    statChips,
    effectKey: `armory.item.${kind}.effect`,
    detailKey: `armory.item.${kind}.detail`,
    effect: copy.effect,
    detail: copy.detail,
    acquisition: acquisitionFor(kind),
    ...resetFor(kind),
  };
}

function weaponRule(kind: WeaponKind): ArmoryRule {
  const weapon = PUBLIC_WEAPONS[kind];
  const chips: ArmoryStatChip[] = [
    stat("damage", `${weapon.base}`),
    stat("baseHit", percentFromBps(weapon.hitBps)),
    stat("cooldown", seconds(weapon.cooldownMs)),
    rangeStat(weapon.range),
  ];
  if (weapon.durability !== undefined) chips.push(stat("durability", `${weapon.durability}`));
  else chips.push(stat("ammo", "1 / SHOT"));
  return rule(kind, chips);
}

function equipmentRule(
  kind: Exclude<
    ItemKind,
    | "tool"
    | "pistol"
    | "rifle"
    | "cleaver"
    | "stool"
    | "golf_club"
    | "light_ammo"
    | "bandage"
    | "medkit"
    | "healthy_food"
    | "spoiled_food"
    | "scrap"
    | "trap_scanner"
    | "insight_root_sense"
    | "insight_calamity_echo"
  >,
  extra: readonly ArmoryStatChip[] = [],
): ArmoryRule {
  const spec = PUBLIC_EQUIPMENT_ITEMS[kind];
  if (spec === undefined) throw new Error(`Missing equipment balance for ${kind}`);
  const chips: ArmoryStatChip[] = [];
  if (spec.armor > 0) chips.push(stat("armor", `${spec.armor}`));
  if (spec.durability !== undefined) chips.push(stat("durability", `${spec.durability}`));
  if (spec.capacityBonus !== undefined) chips.push(stat("capacity", `+${spec.capacityBonus}`));
  chips.push(...extra);
  return rule(kind, chips);
}

const insightPassiveChips = (): ArmoryStatChip[] => [
  stat(
    "signal",
    `-${BALANCE.signal.decayPerInsight} / ${seconds(BALANCE.signal.decayEveryMs)}`,
  ),
  stat("finale", `-${seconds(BALANCE.finale.soloChannelInsightReductionMs)}`),
];

/** Exhaustive ItemKind projection from the curated public-demo values. */
export const ARMORY_RULES = {
  tool: weaponRule("tool"),
  pistol: weaponRule("pistol"),
  rifle: weaponRule("rifle"),
  cleaver: weaponRule("cleaver"),
  stool: weaponRule("stool"),
  golf_club: weaponRule("golf_club"),
  light_ammo: rule("light_ammo", [
    stat("ammo", `+${BALANCE.search.lightAmmoPerFind} / FIND`),
  ]),
  bandage: rule("bandage", [
    stat("healing", `+${BALANCE.items.bandageHeal} HP`),
    stat("curesInjury", `${BALANCE.injury.cure.bandageCures}`),
    stat("cast", seconds(BALANCE.actions.bandageCastMs)),
  ]),
  medkit: rule("medkit", [
    stat("healing", `+${BALANCE.items.medkitHeal} HP`),
    stat("curesInjury", BALANCE.injury.cure.medkitCuresAll ? "ALL" : "0"),
    stat("cast", seconds(BALANCE.actions.medkitCastMs)),
  ]),
  healthy_food: rule("healthy_food", [
    stat("healing", `+${BALANCE.items.healthyFoodHp} HP`),
    stat("stamina", `+${BALANCE.items.healthyFoodStamina}`),
    stat("cast", seconds(BALANCE.actions.foodCastMs)),
  ]),
  spoiled_food: rule("spoiled_food", [
    stat("stamina", `+${BALANCE.items.spoiledFoodStamina}`),
    stat("cast", seconds(BALANCE.actions.foodCastMs)),
    stat("staminaRegen", `0 / ${seconds(BALANCE.items.spoiledFoodDiscomfortMs)}`),
  ]),
  scrap: rule("scrap", [
    stat("repair", `+${BALANCE.items.scrapRepairAmount}`),
    stat("durability", `MAX ${BALANCE.weapons.tool.durability}`),
  ]),
  trap_scanner: rule("trap_scanner", [
    stat("uses", `${BALANCE.items.scannerUses}`),
    stat("signal", `+${BALANCE.items.scannerSignal} / USE`),
  ]),
  insight_root_sense: rule("insight_root_sense", [
    stat("uses", "1"),
    ...insightPassiveChips(),
  ]),
  insight_calamity_echo: rule("insight_calamity_echo", [
    stat("uses", "1"),
    stat("immunity", seconds(BALANCE.items.calamityEchoImmunityMs)),
    ...insightPassiveChips(),
  ]),
  cloth_jacket: equipmentRule("cloth_jacket"),
  stab_jacket: equipmentRule("stab_jacket"),
  composite_chest: equipmentRule("composite_chest"),
  work_helmet: equipmentRule("work_helmet"),
  nvg_helmet: equipmentRule("nvg_helmet", [
    stat("dark", "×0.5"),
    stat("signal", `+${BALANCE.equipment.nvgSignalBonus} / EQUIP`),
  ]),
  work_pants: equipmentRule("work_pants"),
  rough_gloves: equipmentRule("rough_gloves"),
  labor_gloves: equipmentRule("labor_gloves", [
    stat(
      "toolWear",
      `-${percentFromBps(10000 / BALANCE.factionCompatibility.toolDurabilityDenominator)}`,
    ),
  ]),
  leather_gloves: equipmentRule("leather_gloves"),
  small_backpack: equipmentRule("small_backpack"),
  large_backpack: equipmentRule("large_backpack"),
  soft_sole: equipmentRule("soft_sole", [
    stat("stealth", signedPercentPointFromBps(BALANCE.gear.soft_sole.stealthBps)),
    stat(
      "noise",
      `${BALANCE.movement.rushNoise}→${BALANCE.movement.rushNoiseSoftSole} / ${BALANCE.movement.sneakNoise}→${BALANCE.movement.sneakNoiseSoftSole}`,
    ),
  ]),
  steel_toe: equipmentRule("steel_toe", [
    stat("stealth", signedPercentPointFromBps(BALANCE.gear.steel_toe.stealthBps)),
    stat("debris", BALANCE.gear.steel_toe.debrisSlipImmune ? "✓" : "—"),
  ]),
} as const satisfies Readonly<Record<ItemKind, ArmoryRule>>;

export function armoryRuleFor(kind: ItemKind): ArmoryRule {
  return ARMORY_RULES[kind];
}
