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

export const finalReckoning: Fixture = {
  name: "finalReckoning",
  description: "Competitive finale and last-active-player UI states.",
  view: {
    protocolVersion: PROTOCOL_VERSION,
    matchId: DEMO_MATCH_ID,
    stateVersion: 2600,
    phase: "darkforest",
    gameNowMs: gm(41, 0),
    timeScale: 1.0,
    self: {
      playerId: "P01",
      background: "courier",
      status: "active",
      hp: 55,
      stamina: 25,
      signal: 40,
      node: "N6",
      hidden: false,
      oath: "none",
      cooldownsUntilMs: {},
      inventory: [
        { kind: "pistol", count: 1 },
        { kind: "light_ammo", count: 5 },
        { kind: "bandage", count: 1 },
      ],
      equippedWeapon: "pistol",
      legacyPoints: 5,
      equipment: {
        shoes: { kind: "soft_sole", count: 1 },
        backpack: { kind: "small_backpack", count: 1 },
      },
      capacity: { used: 3, total: 12 },
      armor: 0,
      onceAbilityUsed: true,
      attunedNodes: [],
      supplyTrace: false,
      echoMemory: 0,
      xp: 112,
      level: 5,
      injuries: [],
      credits: 0,
      profession: "courier",
      trait: "fleet",
    },
    visiblePlayers: [
      {
        ref: "P11",
        identified: true,
        node: "N6",
        status: "active",
        equippedWeapon: "pistol",
        armorSilhouette: "light",
        limping: false,
        playerId: "P11",
        background: "rootbound",
        oath: "none",
        hpBand: "critical",
      },
      {
        ref: "P18",
        identified: true,
        node: "N6",
        status: "active",
        equippedWeapon: "pistol",
        armorSilhouette: "light",
        limping: false,
        playerId: "P18",
        background: "courier",
        oath: "none",
        hpBand: "hurt",
      },
    ],
    nodes: buildNodeViews("darkforest", {
      N4: { open: false, coverSlotsFree: 0, searchesLeft: 0 },
      N5: { open: false, coverSlotsFree: 0, searchesLeft: 0 },
    }),
    map: DARKFOREST_MAP,
    survivalRules: SURVIVAL_RULES,
    progressionRules: progressionRules(120),
    injuryRules: injuryRules(),
    professionRules: professionRules(),
    aliveCount: 3,
    echoCount: 0,
  },
  followupDiffs: [
    {
      type: "diff",
      stateVersion: 2601,
      gameNowMs: gm(41, 5),
      events: [
        {
          kind: "combat",
          sourceNode: "N6",
          targetNode: "N6",
          attacker: "P01",
          target: "P11",
          weapon: "pistol",
          hit: true,
          damage: 24,
          targetHpBand: "downed",
        },
        { kind: "player_downed", player: "P11", node: "N6", downedUntilMs: gm(41, 50) },
      ],
      self: { signal: 60, cooldownsUntilMs: { attack: gm(41, 9) } },
    },
    {
      type: "diff",
      stateVersion: 2602,
      gameNowMs: gm(41, 50),
      events: [{ kind: "player_eliminated", player: "P11", node: "N6", by: "timeout" }],
      aliveCount: 2,
    },
    {
      type: "diff",
      stateVersion: 2603,
      gameNowMs: gm(42, 0),
      events: [
        {
          kind: "combat",
          sourceNode: "N6",
          targetNode: "N6",
          attacker: "P01",
          target: "P18",
          weapon: "pistol",
          hit: true,
          damage: 25,
          targetHpBand: "downed",
        },
        { kind: "player_downed", player: "P18", node: "N6", downedUntilMs: gm(42, 45) },
      ],
      self: { signal: 75, cooldownsUntilMs: { attack: gm(42, 4) } },
    },
    {
      type: "diff",
      stateVersion: 2604,
      gameNowMs: gm(42, 45),
      events: [
        { kind: "player_eliminated", player: "P18", node: "N6", by: "timeout" },
        { kind: "match_ended", winners: ["P01"], ending: "solo_survivor", reason: "last_standing" },
      ],
      aliveCount: 1,
      phase: "ended",
    },
  ],
};
