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

export const darkforestHazard: Fixture = {
  name: "darkforestHazard",
  description: "Closed-zone, environmental hazard, and route-feedback UI states.",
  view: {
    protocolVersion: PROTOCOL_VERSION,
    matchId: DEMO_MATCH_ID,
    stateVersion: 2100,
    phase: "darkforest",
    gameNowMs: gm(27, 0),
    timeScale: 1.0,
    self: {
      playerId: "P01",
      background: "courier",
      status: "active",
      hp: 70,
      stamina: 50,
      signal: 30,
      node: "N3",
      hidden: false,
      oath: "none",
      cooldownsUntilMs: {},
      inventory: [
        { kind: "pistol", count: 1 },
        { kind: "light_ammo", count: 11 },
        { kind: "medkit", count: 1 },
      ],
      equippedWeapon: "pistol",
      legacyPoints: 3,
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
      trait: "fleet",
    },
    visiblePlayers: [],
    nodes: buildNodeViews("darkforest", {
      N4: { open: false, coverSlotsFree: 0, searchesLeft: 0 },
      N5: { open: false, coverSlotsFree: 0, searchesLeft: 0 },
    }),
    map: DARKFOREST_MAP,
    survivalRules: SURVIVAL_RULES,
    progressionRules: progressionRules(),
    injuryRules: injuryRules(),
    professionRules: professionRules(),
    aliveCount: 21,
    echoCount: 0,
  },
  followupDiffs: [
    {
      type: "diff",
      stateVersion: 2101,
      gameNowMs: gm(27, 5),
      events: [{ kind: "player_eliminated", player: "P05", node: "N4", by: "zone" }],
      aliveCount: 20,
    },
    {
      type: "diff",
      stateVersion: 2102,
      gameNowMs: gm(27, 15),
      events: [{ kind: "hazard_triggered", player: "P01", node: "N3", hazard: "slip", damage: 0 }],
      self: { signal: 40, cooldownsUntilMs: { move: gm(27, 18) } },
    },
    {
      type: "diff",
      stateVersion: 2103,
      gameNowMs: gm(27, 25),
      events: [{ kind: "got_lost", player: "P01", intended: "N6", actual: "N2" }],
      self: { node: "N2", signal: 41, cooldownsUntilMs: { move: gm(27, 31) } },
    },
  ],
};
