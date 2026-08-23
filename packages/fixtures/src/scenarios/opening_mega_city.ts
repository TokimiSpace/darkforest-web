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

export const openingMegaCity: Fixture = {
  name: "openingMegaCity",
  description: "Initial player view with spawn grace and visible contacts.",
  view: {
    protocolVersion: PROTOCOL_VERSION,
    matchId: DEMO_MATCH_ID,
    stateVersion: 12,
    phase: "megacity",
    gameNowMs: gm(0, 30),
    timeScale: 1.0,
    self: {
      playerId: "P01",
      background: "courier",
      status: "active",
      hp: 100,
      stamina: 100,
      signal: 0,
      node: "N4",
      hidden: false,
      oath: "none",
      cooldownsUntilMs: {},
      inventory: [
        { kind: "tool", count: 1, durability: 36 },
        { kind: "bandage", count: 1 },
        { kind: "light_ammo", count: 6 },
      ],
      equippedWeapon: "tool",
      legacyPoints: 0,
      equipment: {
        shoes: { kind: "soft_sole", count: 1 },
        backpack: { kind: "small_backpack", count: 1 },
      },
      capacity: { used: 3, total: 12 },
      armor: 0,
      onceAbilityUsed: false,
      attunedNodes: [],
      supplyTrace: false,
      echoMemory: 0,
      xp: 0,
      level: 1,
      injuries: [],
      credits: 0,
      profession: "scavenger",
      trait: "attuned",
    },
    visiblePlayers: [
      {
        ref: "P08",
        identified: true,
        node: "N4",
        status: "active",
        equippedWeapon: "tool",
        armorSilhouette: "light",
        limping: false,
        playerId: "P08",
        background: "rootbound",
        oath: "none",
        hpBand: "healthy",
      },
      {
        ref: "P14",
        identified: true,
        node: "N4",
        status: "active",
        equippedWeapon: "tool",
        armorSilhouette: "light",
        limping: false,
        playerId: "P14",
        background: "courier",
        oath: "none",
        hpBand: "healthy",
      },
      {
        ref: "P19",
        identified: true,
        node: "N4",
        status: "active",
        equippedWeapon: "tool",
        armorSilhouette: "light",
        limping: false,
        playerId: "P19",
        background: "rootbound",
        oath: "none",
        hpBand: "healthy",
      },
    ],
    nodes: buildNodeViews("megacity"),
    map: DARKFOREST_MAP,
    survivalRules: SURVIVAL_RULES,
    progressionRules: progressionRules(),
    injuryRules: injuryRules(),
    professionRules: professionRules(),
    aliveCount: 24,
    echoCount: 0,
  },
  followupDiffs: [
    {
      type: "diff",
      stateVersion: 13,
      gameNowMs: gm(3, 45),
      events: [
        { kind: "search_result", player: "P01", found: { kind: "bandage", count: 1 } },
        { kind: "supply_event", eventId: "SUPPLY_ROUTE_TRACE", player: "P01" },
      ],
      self: {
        node: "N1",
        legacyPoints: 1,
        cooldownsUntilMs: { search: gm(3, 51) },
        inventory: [
          { kind: "tool", count: 1, durability: 36 },
          { kind: "bandage", count: 2 },
          { kind: "light_ammo", count: 6 },
        ],
      },
      visiblePlayers: [],
    },
  ],
};
