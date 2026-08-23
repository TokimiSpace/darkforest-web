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

export const rejectionDrill: Fixture = {
  name: "rejectionDrill",
  description: "Accepted and rejected command-receipt UI states.",
  view: {
    protocolVersion: PROTOCOL_VERSION,
    matchId: DEMO_MATCH_ID,
    stateVersion: 2900,
    phase: "darkforest",
    gameNowMs: gm(28, 0),
    timeScale: 1.0,
    self: {
      playerId: "P01",
      background: "courier",
      status: "active",
      hp: 64,
      stamina: 55,
      signal: 30,
      node: "N2",
      hidden: false,
      oath: "none",
      cooldownsUntilMs: { attack: gm(29, 0) },
      inventory: [
        { kind: "pistol", count: 1 },
        { kind: "light_ammo", count: 6 },
      ],
      equippedWeapon: "pistol",
      legacyPoints: 3,
      equipment: {
        shoes: { kind: "soft_sole", count: 1 },
        backpack: { kind: "small_backpack", count: 1 },
      },
      capacity: { used: 2, total: 12 },
      armor: 0,
      onceAbilityUsed: false,
      attunedNodes: [],
      supplyTrace: false,
      echoMemory: 0,
      xp: 50,
      level: 3,
      injuries: [],
      credits: 0,
      profession: "courier",
      trait: "fleet",
    },
    visiblePlayers: [
      {
        ref: "P07",
        identified: true,
        node: "N2",
        status: "active",
        equippedWeapon: "pistol",
        armorSilhouette: "light",
        limping: false,
        playerId: "P07",
        background: "rootbound",
        oath: "none",
        hpBand: "healthy",
      },
    ],
    nodes: buildNodeViews("darkforest", {
      N2: { searchesLeft: 0 },
      N4: { open: false, coverSlotsFree: 0, searchesLeft: 0 },
      N5: { open: false, coverSlotsFree: 0, searchesLeft: 0 },
    }),
    map: DARKFOREST_MAP,
    survivalRules: SURVIVAL_RULES,
    progressionRules: progressionRules(110),
    injuryRules: injuryRules(),
    professionRules: professionRules(),
    aliveCount: 9,
    echoCount: 1,
  },
  commandRejections: {
    attack: { errorCode: "COOLDOWN_ACTIVE", retryAtMs: gm(29, 0) },
    search: { errorCode: "NO_SEARCHES_LEFT" },
    pickup: { errorCode: "NO_CACHE" },
  },
};
