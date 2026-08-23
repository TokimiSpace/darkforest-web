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

export const finalCovenant: Fixture = {
  name: "finalCovenant",
  description: "Cooperative finale offer, join, channel, and completion states.",
  view: {
    protocolVersion: PROTOCOL_VERSION,
    matchId: DEMO_MATCH_ID,
    stateVersion: 2700,
    phase: "darkforest",
    gameNowMs: gm(43, 0),
    timeScale: 1.0,
    self: {
      playerId: "P01",
      background: "courier",
      status: "active",
      hp: 62,
      stamina: 40,
      signal: 40,
      node: "N1",
      hidden: false,
      oath: "none",
      cooldownsUntilMs: {},
      inventory: [
        { kind: "pistol", count: 1 },
        { kind: "light_ammo", count: 3 },
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
      supplyTrace: true,
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
        ref: "P18",
        identified: true,
        node: "N1",
        status: "active",
        equippedWeapon: null,
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
      stateVersion: 2701,
      gameNowMs: gm(43, 5),
      events: [
        {
          kind: "finale_offer_started",
          node: "N1",
          mode: "arbora",
          initiator: "P01",
          deadlineMs: gm(43, 25),
        },
      ],
      finale: {
        mode: "arbora",
        stage: "offer",
        node: "N1",
        initiator: "P01",
        participants: ["P01"],
        deadlineMs: gm(43, 25),
        supplyTraceReady: true,
        echoMemoryReady: false,
      },
    },
    {
      type: "diff",
      stateVersion: 2702,
      gameNowMs: gm(43, 12),
      events: [{ kind: "finale_joined", node: "N1", player: "P18", participants: ["P01", "P18"] }],
      finale: {
        mode: "arbora",
        stage: "offer",
        node: "N1",
        initiator: "P01",
        participants: ["P01", "P18"],
        deadlineMs: gm(43, 25),
        supplyTraceReady: true,
        echoMemoryReady: true,
      },
    },
    {
      type: "diff",
      stateVersion: 2703,
      gameNowMs: gm(43, 25),
      events: [
        {
          kind: "finale_channel_started",
          node: "N1",
          mode: "arbora",
          participants: ["P01", "P18"],
          deadlineMs: gm(44, 10),
        },
      ],
      finale: {
        mode: "arbora",
        stage: "channel",
        node: "N1",
        initiator: "P01",
        participants: ["P01", "P18"],
        deadlineMs: gm(44, 10),
        supplyTraceReady: true,
        echoMemoryReady: true,
      },
    },
    {
      type: "diff",
      stateVersion: 2704,
      gameNowMs: gm(44, 10),
      events: [
        { kind: "finale_completed", node: "N1", mode: "arbora", ending: "arbora_covenant" },
        {
          kind: "match_ended",
          winners: ["P01", "P18"],
          ending: "arbora_covenant",
          reason: "finale_coop",
        },
      ],
      phase: "ended",
      finale: null,
    },
  ],
};
