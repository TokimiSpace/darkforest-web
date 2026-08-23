import { PROTOCOL_VERSION } from "@darkforest/protocol";
import type { Fixture } from "../types.ts";
import { gm } from "../lib/time.ts";
import { DARKFOREST_MAP } from "../lib/topology.ts";
import { buildNodeViews } from "../lib/nodes.ts";
import { DEMO_MATCH_ID } from "../lib/constants.ts";
import { SURVIVAL_RULES } from "../lib/survival.ts";
import { progressionRules } from "../lib/progression.ts";
import { injuryRules } from "../lib/injury.ts";
import { professionRules } from "../lib/profession.ts";
import { shopView } from "../lib/shop.ts";

export const shopVisit: Fixture = {
  name: "shopVisit",
  description: "Local shop projection with buy, sell, and sold-out UI states.",
  view: {
    protocolVersion: PROTOCOL_VERSION,
    matchId: DEMO_MATCH_ID,
    stateVersion: 520,
    phase: "megacity",
    gameNowMs: gm(10, 0),
    timeScale: 1.0,
    self: {
      playerId: "P01",
      background: "courier",
      status: "active",
      hp: 84,
      stamina: 70,
      signal: 15,
      node: "N2",
      hidden: false,
      oath: "none",
      cooldownsUntilMs: {},
      inventory: [
        { kind: "tool", count: 1, durability: 30 },
        { kind: "scrap", count: 2 },
        { kind: "light_ammo", count: 4 },
        { kind: "pistol", count: 1, durability: 18 },
      ],
      equippedWeapon: "pistol",
      legacyPoints: 1,
      equipment: {
        shoes: { kind: "soft_sole", count: 1 },
        backpack: { kind: "small_backpack", count: 1 },
      },
      capacity: { used: 4, total: 12 },
      armor: 0,
      onceAbilityUsed: false,
      attunedNodes: [],
      supplyTrace: false,
      echoMemory: 0,
      xp: 24,
      level: 2,
      injuries: [],
      credits: 68,
      profession: "courier",
      trait: "artisan",
    },
    visiblePlayers: [],
    nodes: buildNodeViews("megacity", {
      N2: { shop: shopView() },
    }),
    map: DARKFOREST_MAP,
    survivalRules: SURVIVAL_RULES,
    progressionRules: progressionRules(105),
    injuryRules: injuryRules(),
    professionRules: professionRules(),
    aliveCount: 22,
    echoCount: 2,
  },
  followupDiffs: [
    {
      type: "diff",
      stateVersion: 521,
      gameNowMs: gm(10, 1),
      events: [
        { kind: "shop_traded", player: "P01", side: "buy", item: "medkit", price: 60 },
        { kind: "noise", node: "N2", loudness: 5 },
      ],
      self: {
        credits: 8,
        inventory: [
          { kind: "tool", count: 1, durability: 30 },
          { kind: "scrap", count: 2 },
          { kind: "light_ammo", count: 4 },
          { kind: "pistol", count: 1, durability: 18 },
          { kind: "medkit", count: 1 },
        ],
        capacity: { used: 5, total: 12 },
        cooldownsUntilMs: { shop_buy: gm(10, 1) + 2000, shop_sell: gm(10, 1) + 2000 },
      },
    },
    {
      type: "diff",
      stateVersion: 522,
      gameNowMs: gm(10, 2),
      events: [
        { kind: "shop_traded", player: "P01", side: "sell", item: "scrap", price: 6 },
      ],
      self: {
        credits: 14,
        inventory: [
          { kind: "tool", count: 1, durability: 30 },
          { kind: "scrap", count: 1 },
          { kind: "light_ammo", count: 4 },
          { kind: "pistol", count: 1, durability: 18 },
          { kind: "medkit", count: 1 },
        ],
        capacity: { used: 4, total: 12 },
        cooldownsUntilMs: { shop_buy: gm(10, 2) + 2000, shop_sell: gm(10, 2) + 2000 },
      },
    },
    {
      type: "diff",
      stateVersion: 523,
      gameNowMs: gm(10, 4),
      events: [],
      nodes: buildNodeViews("megacity", {
        N2: { shop: shopView({ stab_jacket: 0, composite_chest: 0, nvg_helmet: 0 }) },
      }),
    },
  ],
};
