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

export const downedRescue: Fixture = {
  name: "downedRescue",
  description: "Downed-player, rescue, and dropped-cache UI states.",
  view: {
    protocolVersion: PROTOCOL_VERSION,
    matchId: DEMO_MATCH_ID,
    stateVersion: 812,
    phase: "megacity",
    gameNowMs: gm(14, 0),
    timeScale: 1.0,
    self: {
      playerId: "P01",
      background: "courier",
      status: "active",
      hp: 100,
      stamina: 100,
      signal: 10,
      node: "N1",
      hidden: false,
      oath: "none",
      cooldownsUntilMs: {},
      inventory: [
        { kind: "tool", count: 1, durability: 34 },
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
      injuries: ["leg"],
      credits: 0,
      profession: "enforcer",
      trait: "medic",
    },
    visiblePlayers: [
      {
        ref: "P07",
        identified: true,
        node: "N1",
        status: "active",
        equippedWeapon: "pistol",
        armorSilhouette: "light",
        limping: true,
        playerId: "P07",
        background: "rootbound",
        oath: "none",
        hpBand: "hurt",
      },
      {
        ref: "P03",
        identified: true,
        node: "N1",
        status: "active",
        equippedWeapon: "pistol",
        armorSilhouette: "light",
        limping: false,
        playerId: "P03",
        background: "rootbound",
        oath: "none",
        hpBand: "healthy",
      },
    ],
    nodes: buildNodeViews("megacity", {
      N5: { open: false, coverSlotsFree: 0, searchesLeft: 0 },
    }),
    map: DARKFOREST_MAP,
    survivalRules: SURVIVAL_RULES,
    progressionRules: progressionRules(),
    injuryRules: injuryRules(),
    professionRules: professionRules(),
    aliveCount: 24,
    echoCount: 2,
  },
  followupDiffs: [
    {
      type: "diff",
      stateVersion: 813,
      gameNowMs: gm(14, 1),
      events: [
        {
          kind: "combat",
          sourceNode: "N1",
          targetNode: "N1",
          attacker: "P03",
          target: "P07",
          weapon: "pistol",
          hit: true,
          damage: 23,
          targetHpBand: "downed",
        },
        { kind: "player_echoed", player: "P07", node: "N1" },
        {
          kind: "cache_dropped",
          cacheId: "cache-demo-1",
          node: "N1",
          priorityFor: "P03",
          untilMs: gm(14, 16),
          items: [{ kind: "light_ammo", count: 6 }],
        },
      ],
      visiblePlayers: [
        {
          ref: "P03",
          identified: true,
          node: "N1",
          status: "active",
          equippedWeapon: "pistol",
          armorSilhouette: "light",
          limping: false,
          playerId: "P03",
          background: "rootbound",
          oath: "none",
          hpBand: "healthy",
        },
      ],
      echoCount: 3,
    },
  ],
};
