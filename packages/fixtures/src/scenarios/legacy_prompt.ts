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

export const legacyPrompt: Fixture = {
  name: "legacyPrompt",
  description: "Timed legacy selection and map-reset UI states.",
  view: {
    protocolVersion: PROTOCOL_VERSION,
    matchId: DEMO_MATCH_ID,
    stateVersion: 1400,
    phase: "reset",
    gameNowMs: gm(18, 30),
    timeScale: 1.0,
    self: {
      playerId: "P01",
      background: "courier",
      status: "active",
      hp: 76,
      stamina: 50,
      signal: 12,
      node: "N2",
      hidden: false,
      oath: "none",
      cooldownsUntilMs: {},
      inventory: [
        { kind: "tool", count: 1, durability: 22 },
        { kind: "light_ammo", count: 24 },
        { kind: "trap_scanner", count: 1, durability: 2 },
        { kind: "medkit", count: 1 },
        { kind: "bandage", count: 1 },
      ],
      equippedWeapon: "tool",
      legacyPoints: 3,
      equipment: {
        shoes: { kind: "soft_sole", count: 1 },
        backpack: { kind: "small_backpack", count: 1 },
      },
      capacity: { used: 5, total: 12 },
      armor: 0,
      onceAbilityUsed: false,
      attunedNodes: [],
      supplyTrace: false,
      echoMemory: 0,
      xp: 0,
      level: 1,
      injuries: [],
      credits: 0,
      profession: "courier",
      trait: "artisan",
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
    aliveCount: 24,
    echoCount: 5,
    legacyPrompt: {
      deadlineMs: gm(19, 30),
      options: [
        { kind: "tool", count: 1, durability: 22 },
        { kind: "light_ammo", count: 24 },
        { kind: "trap_scanner", count: 1, durability: 2 },
        { kind: "medkit", count: 1 },
      ],
      maxSelections: 1,
      suggestedItems: ["trap_scanner"],
    },
  },
  followupDiffs: [
    {
      type: "diff",
      stateVersion: 1401,
      gameNowMs: gm(19, 0),
      events: [{ kind: "legacy_locked", player: "P01" }],
      legacyPrompt: null,
    },
    {
      type: "diff",
      stateVersion: 1402,
      gameNowMs: gm(20, 0),
      events: [{ kind: "reset_completed", collapsedEdges: ["e3"], openedEdges: ["r1"] }],
      phase: "darkforest",
      nodes: buildNodeViews("darkforest", {
        N5: { open: false, coverSlotsFree: 0, searchesLeft: 0 },
      }),
      echoCount: 0,
    },
  ],
};
