import { PROTOCOL_VERSION } from "@darkforest/protocol";
import type { ActionPayload, PlayerId, RandomRollRecord } from "@darkforest/protocol";
import type { Fixture } from "../types.ts";
import { DARKFOREST_MAP } from "../lib/topology.ts";
import { buildNodeViews } from "../lib/nodes.ts";
import { SURVIVAL_RULES } from "../lib/survival.ts";
import { progressionRules } from "../lib/progression.ts";
import { injuryRules } from "../lib/injury.ts";
import { professionRules } from "../lib/profession.ts";

const COMMANDS: Array<{ playerId: PlayerId; payload: ActionPayload }> = [
  { playerId: "P01", payload: { action: "move", to: "N2" } },
  { playerId: "P01", payload: { action: "search" } },
  { playerId: "P01", payload: { action: "move", to: "N3" } },
  { playerId: "P01", payload: { action: "search" } },
  { playerId: "P01", payload: { action: "attack", target: "P02", weapon: "tool" } },
  { playerId: "P01", payload: { action: "hide" } },
  { playerId: "P01", payload: { action: "use_item", item: "bandage" } },
  { playerId: "P01", payload: { action: "move", to: "N1" } },
  { playerId: "P06", payload: { action: "attack", target: "P03", weapon: "pistol" } },
  { playerId: "P01", payload: { action: "rescue", target: "P04" } },
  { playerId: "P01", payload: { action: "move", to: "N5" } },
  { playerId: "P01", payload: { action: "search" } },
  { playerId: "P01", payload: { action: "use_item", item: "medkit" } },
  { playerId: "P01", payload: { action: "move", to: "N6" } },
  { playerId: "P01", payload: { action: "attack", target: "P02", weapon: "rifle" } },
  { playerId: "P05", payload: { action: "echo_move", to: "N3" } },
  { playerId: "P05", payload: { action: "echo_attune" } },
  { playerId: "P01", payload: { action: "legacy_select", items: ["medkit"] } },
  { playerId: "P01", payload: { action: "once_ability" } },
  { playerId: "P01", payload: { action: "move", to: "N2" } },
];

const commandIds = COMMANDS.map((_, i) => `replay-cmd-${String(i + 1).padStart(2, "0")}`);

const replayCommands = COMMANDS.map((c, i) => ({
  atGameMs: i * 15_000,
  playerId: c.playerId,
  commandId: commandIds[i],
  payload: c.payload,
}));

const ROLL_RANGE: Record<RandomRollRecord["stream"], [number, number]> = {
  combat: [0, 1000],
  loot: [0, 10000],
  hazard: [0, 10000],
  event: [0, 100],
  map: [0, 10000],
};
const STREAMS = Object.keys(ROLL_RANGE) as Array<RandomRollRecord["stream"]>;

function buildRolls(): RandomRollRecord[] {
  const perKeyIndex = new Map<string, number>();
  const rolls: RandomRollRecord[] = [];
  for (let i = 0; i < 40; i++) {
    const stream = STREAMS[i % STREAMS.length];
    const commandId: RandomRollRecord["commandId"] = i % 5 === 4
      ? "system"
      : commandIds[i % commandIds.length];
    const key = `${commandId}:${stream}`;
    const rollIndex = perKeyIndex.get(key) ?? 0;
    perKeyIndex.set(key, rollIndex + 1);
    const [min, max] = ROLL_RANGE[stream];
    const result = min + ((i * 2_654_435_761) % (max - min + 1));
    rolls.push({ commandId, stream, rollIndex, min, max, result });
  }
  return rolls;
}

const finalStateHash = Array.from({ length: 64 }, (_, i) => "0123456789abcdef"[(i * 7 + 3) % 16])
  .join("");

export const replaySample: Fixture = {
  name: "replaySample",
  description: "Deterministic synthetic replay for the public viewer.",
  view: {
    protocolVersion: PROTOCOL_VERSION,
    matchId: "proto-replay-sample-01",
    stateVersion: 1,
    phase: "megacity",
    gameNowMs: 0,
    timeScale: 1.0,
    self: {
      playerId: "P01",
      background: "courier",
      status: "active",
      hp: 100,
      stamina: 100,
      signal: 0,
      node: "N1",
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
      trait: "artisan",
    },
    visiblePlayers: [],
    nodes: buildNodeViews("megacity"),
    map: DARKFOREST_MAP,
    survivalRules: SURVIVAL_RULES,
    progressionRules: progressionRules(),
    injuryRules: injuryRules(),
    professionRules: professionRules(),
    aliveCount: 24,
    echoCount: 0,
  },
  replay: {
    protocolVersion: PROTOCOL_VERSION,
    matchId: "proto-replay-sample-01",
    matchSeed: "df-proto-seed-0001",
    fixtureSchemaVersion: "demo-v1",
    timeScale: 1.0,
    commands: replayCommands,
    rolls: buildRolls(),
    endGameMs: 2_700_000,
    finalStateHash,
  },
};
