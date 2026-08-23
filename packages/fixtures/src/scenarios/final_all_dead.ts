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

export const finalAllDead: Fixture = {
  name: "finalAllDead",
  description: "Terminal state where no participant remains active.",
  view: {
    protocolVersion: PROTOCOL_VERSION,
    matchId: DEMO_MATCH_ID,
    stateVersion: 2800,
    phase: "darkforest",
    gameNowMs: gm(25, 56),
    timeScale: 1.0,
    self: {
      playerId: "P01",
      background: "courier",
      status: "active",
      hp: 8,
      stamina: 15,
      signal: 35,
      node: "N4",
      hidden: false,
      oath: "none",
      cooldownsUntilMs: {},
      inventory: [],
      equippedWeapon: null,
      legacyPoints: 3,
      equipment: {
        shoes: { kind: "soft_sole", count: 1 },
        backpack: { kind: "small_backpack", count: 1 },
      },
      capacity: { used: 0, total: 12 },
      armor: 0,
      onceAbilityUsed: true,
      attunedNodes: [],
      supplyTrace: false,
      echoMemory: 0,
      xp: 30,
      level: 2,
      injuries: [],
      credits: 0,
      profession: "scavenger",
      trait: "fleet",
    },
    visiblePlayers: [
      {
        ref: "P22",
        identified: true,
        node: "N4",
        status: "active",
        equippedWeapon: null,
        armorSilhouette: "light",
        limping: true,
        playerId: "P22",
        background: "rootbound",
        oath: "none",
        hpBand: "critical",
      },
    ],
    nodes: buildNodeViews("darkforest", {
      N4: {
        searchesLeft: 1,
        knownHazards: [
          {
            hazardId: "haz-df-n4",
            kind: "conductive_puddle",
            note: "導電積水:踩到或搜尋時可能觸電受傷",
          },
        ],
      },
      N5: { open: false, coverSlotsFree: 0, searchesLeft: 0 },
    }),
    map: DARKFOREST_MAP,
    survivalRules: SURVIVAL_RULES,
    progressionRules: progressionRules(105),
    injuryRules: injuryRules(),
    professionRules: professionRules(),
    aliveCount: 2,
    echoCount: 0,
  },
  followupDiffs: [
    {
      type: "diff",
      stateVersion: 2801,
      gameNowMs: gm(26, 0),
      events: [{ kind: "blockade_closed", node: "N4" }],
      nodes: buildNodeViews("darkforest", {
        N4: { open: false, coverSlotsFree: 0, searchesLeft: 0 },
        N5: { open: false, coverSlotsFree: 0, searchesLeft: 0 },
      }),
    },
    {
      type: "diff",
      stateVersion: 2802,
      gameNowMs: gm(26, 2),
      events: [
        { kind: "player_downed", player: "P01", node: "N4", downedUntilMs: gm(26, 47) },
        { kind: "player_eliminated", player: "P01", node: "N4", by: "zone" },
        { kind: "player_downed", player: "P22", node: "N4", downedUntilMs: gm(26, 47) },
        { kind: "player_eliminated", player: "P22", node: "N4", by: "zone" },
        { kind: "match_ended", winners: [], ending: "none", reason: "all_dead" },
      ],
      self: { status: "eliminated", hp: 0 },
      visiblePlayers: [],
      aliveCount: 0,
      phase: "ended",
    },
  ],
};
