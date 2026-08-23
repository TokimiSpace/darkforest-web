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

export const echoMode: Fixture = {
  name: "echoMode",
  description: "Echo-mode visibility and attunement UI states.",
  view: {
    protocolVersion: PROTOCOL_VERSION,
    matchId: DEMO_MATCH_ID,
    stateVersion: 1005,
    phase: "megacity",
    gameNowMs: gm(16, 0),
    timeScale: 1.0,
    self: {
      playerId: "P01",
      background: "courier",
      status: "echo",
      hp: 0,
      stamina: 0,
      signal: 0,
      node: "N5",
      hidden: false,
      oath: "none",
      cooldownsUntilMs: {},
      inventory: [
        { kind: "tool", count: 1, durability: 28 },
        { kind: "bandage", count: 1 },
      ],
      equippedWeapon: null,
      legacyPoints: 2,
      disasterIntel: 2,
      equipment: {
        shoes: { kind: "soft_sole", count: 1 },
        backpack: { kind: "small_backpack", count: 1 },
      },
      capacity: { used: 2, total: 12 },
      armor: 0,
      onceAbilityUsed: false,
      attunedNodes: [],
      supplyTrace: false,
      echoMemory: 2,
      xp: 0,
      level: 1,
      injuries: [],
      credits: 0,
      profession: "courier",
      trait: "attuned",
    },
    visiblePlayers: [],
    nodes: buildNodeViews("megacity", {
      N5: { open: false, coverSlotsFree: 0, searchesLeft: 0 },
    }),
    map: DARKFOREST_MAP,
    survivalRules: SURVIVAL_RULES,
    progressionRules: progressionRules(),
    injuryRules: injuryRules(),
    professionRules: professionRules(),
    aliveCount: 20,
    echoCount: 4,
  },
  followupDiffs: [
    {
      type: "diff",
      stateVersion: 1006,
      gameNowMs: gm(16, 10),
      events: [{
        kind: "echo_attuned",
        player: "P01",
        node: "N5",
        intelGained: 1,
        firstAttune: true,
        recentCombat: false,
      }],
      self: {
        disasterIntel: 3,
        echoMemory: 3,
        xp: 0,
        level: 1,
        injuries: [],
        cooldownsUntilMs: { echo_attune: gm(16, 20) },
      },
    },
  ],
};
