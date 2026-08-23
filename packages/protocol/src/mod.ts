/**
 * Sanitized schema for the standalone public demo.
 * It is intentionally independent from Tokimi's production service contract.
 */
import { isClientMessage, isServerMessage, PUBLIC_DEMO_PROTOCOL_VERSION } from "./runtime.js";
export { isClientMessage, isServerMessage, parseServerMessage } from "./runtime.js";

export const PROTOCOL_VERSION = PUBLIC_DEMO_PROTOCOL_VERSION;

export type NodeId = string;

export type EdgeId = string;
export type PlayerId = string;

export type InjuryPart = "leg" | "arm";

export type Profession = "courier" | "scavenger" | "enforcer";

export type TraitId = "medic" | "artisan" | "attuned" | "tough" | "fleet";
export type CommandId = string;

export type Phase = "megacity" | "reset" | "darkforest" | "ended";
export type PlayerStatus = "active" | "downed" | "echo" | "eliminated";
export type Background = "courier" | "rootbound";
export type OathState = "none" | "oathed" | "broken" | "restored";
export type Tag =
  | "CRAMPED"
  | "COVERED"
  | "OPEN"
  | "DENSE"
  | "DARK"
  | "DEBRIS"
  | "WET"
  | "MUD"
  | "POWERED";

export type WeaponKind = "tool" | "pistol" | "rifle" | "cleaver" | "stool" | "golf_club";

export type MovementStyle = "rush" | "sneak";

export type EquipmentSlot = "helmet" | "jacket" | "pants" | "gloves" | "shoes" | "backpack";

export type ItemKind =
  | "tool"
  | "pistol"
  | "rifle"
  | "cleaver"
  | "stool"
  | "golf_club"
  | "light_ammo"
  | "bandage"
  | "medkit"
  | "healthy_food"
  | "spoiled_food"
  | "scrap"
  | "trap_scanner"
  | "insight_root_sense"
  | "insight_calamity_echo"
  | "cloth_jacket"
  | "stab_jacket"
  | "composite_chest"
  | "work_helmet"
  | "nvg_helmet"
  | "work_pants"
  | "rough_gloves"
  | "labor_gloves"
  | "leather_gloves"
  | "small_backpack"
  | "large_backpack"
  | "soft_sole"
  | "steel_toe";

export interface ItemStack {
  kind: ItemKind;
  count: number;

  durability?: number;
}

export interface MapTopology {
  nodes: Array<{
    id: NodeId;
    nameMegaCity: string;
    nameDarkforest: string;
    tagsMegaCity: Tag[];
    tagsDarkforest: Tag[];
    coverSlots: number;
  }>;
  edges: Array<{
    id: EdgeId;
    from: NodeId;
    to: NodeId;

    noLos: boolean;

    phase: "both" | "megacity" | "darkforest";

    trait?: "tunnel" | "root";
  }>;

  blockadeSchedule: Array<{ previewAtMs: number; closesAtMs: number; node: NodeId }>;
  finalNodes: NodeId[];

  rootheartNodeId: NodeId;

  shopNodeId: NodeId;
}

export interface SelfState {
  playerId: PlayerId;
  background: Background;
  status: PlayerStatus;
  hp: number;

  xp: number;
  level: number;

  injuries: InjuryPart[];

  profession: Profession;
  trait: TraitId;

  credits: number;

  stamina: number;
  signal: number;
  node: NodeId;
  hidden: boolean;
  oath: OathState;

  cooldownsUntilMs: Partial<Record<ActionType, number>>;
  inventory: ItemStack[];
  equippedWeapon: WeaponKind | null;
  legacyPoints: number;

  disasterIntel?: number;

  downedUntilMs?: number;

  casting?: {
    item: "bandage" | "medkit" | "healthy_food" | "spoiled_food";
    completesAtMs: number;
  };

  discomfortUntilMs?: number;

  onceAbilityUsed: boolean;

  equipment: Partial<Record<EquipmentSlot, ItemStack>>;

  capacity: { used: number; total: number };

  armor: number;

  attunedNodes: NodeId[];

  supplyTrace: boolean;

  echoMemory: number;
}

export type SelfStateDiff =
  & Omit<
    Partial<SelfState>,
    "disasterIntel" | "downedUntilMs" | "casting" | "discomfortUntilMs"
  >
  & {
    disasterIntel?: SelfState["disasterIntel"] | null;
    downedUntilMs?: SelfState["downedUntilMs"] | null;
    casting?: SelfState["casting"] | null;
    discomfortUntilMs?: SelfState["discomfortUntilMs"] | null;
  };

export interface VisiblePlayer {
  ref: string;
  identified: boolean;
  node: NodeId;

  status: "active" | "downed";

  equippedWeapon: WeaponKind | null;

  armorSilhouette: "light" | "medium" | "heavy";

  limping: boolean;

  playerId?: PlayerId;

  background?: Background;

  oath?: OathState;

  hpBand?: "healthy" | "hurt" | "critical" | "downed";

  level?: number;

  contactRef?: string;
}

export interface NodeView {
  id: NodeId;
  open: boolean;
  activeTags: Tag[];
  coverSlotsFree: number;
  searchesLeft: number;

  knownHazards: Array<{ hazardId: string; kind: "conductive_puddle"; note: string }>;

  caches: Array<
    { cacheId: string; items: ItemStack[]; priorityFor: PlayerId; priorityUntilMs: number }
  >;

  shop?: {
    catalog: Array<{ item: ItemKind; buyPrice: number; sellPrice: number; stockLeft?: number }>;
  };
}

export interface PlayerView {
  protocolVersion: number;
  matchId: string;
  stateVersion: number;
  phase: Phase;

  gameNowMs: number;
  timeScale: number;
  self: SelfState;

  visiblePlayers: VisiblePlayer[];

  nodes: NodeView[];
  map: MapTopology;

  survivalRules: {
    staminaMax: number;
    staminaRegenEveryMs: number;
    staminaRegenAmount: number;
    rushStaminaCost: number;
    healthyFood: { castMs: number; hp: number; stamina: number };
    spoiledFood: { castMs: number; stamina: number; discomfortMs: number };
  };

  progressionRules: {
    levelCap: number;
    levelThresholds: readonly number[];
    maxHpPerLevel: number;
    maxHp: number;
  };

  injuryRules: {
    legRushCostDelta: number;
    legMoveCooldownBps: number;
    legSlipMultiplierBps: number;
    armHitPenaltyBps: number;
  };

  professionRules: {
    courierRushCostDelta: number;
  };
  aliveCount: number;
  echoCount: number;

  legacyPrompt?: {
    deadlineMs: number;
    options: ItemStack[];
    maxSelections: 1 | 2;
    suggestedItems: ItemKind[];
  };

  insightPrompt?: {
    deadlineMs: number;

    options: ItemKind[];
    maxSelections: 1 | 2;
    suggestedItems: ItemKind[];
  };

  finale?: {
    mode: "solo" | "arbora";
    stage: "offer" | "channel" | "survive";
    node: NodeId;
    initiator: PlayerId;
    participants: PlayerId[];
    deadlineMs: number;
    supplyTraceReady: boolean;
    echoMemoryReady: boolean;
    interruptor?: PlayerId;
    interruptCompletesAtMs?: number;
  };

  encounterPrompt?: {
    encounterId: string;
    from: NodeId;
    intendedTo: NodeId;
    edgeId: EdgeId;
    style: MovementStyle;
    deadlineMs: number;
    targetRefs: string[];
  };
}

export type ActionType =
  | "move"
  | "search"
  | "attack"
  | "hide"
  | "use_item"
  | "rescue"
  | "echo_move"
  | "echo_attune"
  | "legacy_select"
  | "once_ability"
  | "equip"
  | "unequip"
  | "drop"
  | "pickup"
  | "insight_select"
  | "finale_commit"
  | "finale_join"
  | "finale_interrupt"
  | "finale_cancel"
  | "encounter_continue"
  | "shop_buy"
  | "shop_sell";

export type ActionPayload =
  | { action: "move"; to: NodeId; style?: MovementStyle }
  | { action: "search" }
  | { action: "attack"; target: string; weapon: WeaponKind }
  | { action: "hide" }
  | { action: "use_item"; item: ItemKind; targetNode?: NodeId }
  | { action: "rescue"; target: PlayerId }
  | { action: "echo_move"; to: NodeId; style?: MovementStyle }
  | { action: "echo_attune" }
  | { action: "legacy_select"; items: ItemKind[] }
  | { action: "once_ability" }
  | { action: "equip"; item: ItemKind }
  | { action: "unequip"; slot: EquipmentSlot }
  | { action: "drop"; item: ItemKind }
  | { action: "pickup"; cacheId: string; item: ItemKind }
  | { action: "insight_select"; items: ItemKind[] }
  | { action: "finale_commit"; mode: "solo" | "arbora" }
  | { action: "finale_join" }
  | { action: "finale_interrupt" }
  | { action: "finale_cancel" }
  | { action: "shop_buy"; item: ItemKind }
  | { action: "shop_sell"; item: ItemKind }
  | { action: "encounter_continue"; encounterId: string };

export interface HelloMsg {
  type: "hello";
  protocolVersion: number;
  matchId: string;
  playerToken: string;

  lastSeenVersion?: number;
}

export interface CommandMsg {
  type: "command";
  commandId: CommandId;
  expectedStateVersion: number;
  payload: ActionPayload;
}

export interface PreviewRequestMsg {
  type: "preview";
  requestId: string;

  target: string;
  weapon: WeaponKind;
}

export interface PingMsg {
  type: "ping";
  t: number;
}

export interface ChatSendMsg {
  type: "chat_send";

  messageId: string;
  text: string;
}

export type ArboraLocale = "zh-TW" | "zh-CN" | "ja" | "ko" | "en";

export interface ArboraAskMsg {
  type: "arbora_ask";

  requestId: string;
  text: string;
  locale: ArboraLocale;
}

export type ClientMsg =
  | HelloMsg
  | CommandMsg
  | PreviewRequestMsg
  | PingMsg
  | ChatSendMsg
  | ArboraAskMsg;

export interface WelcomeMsg {
  type: "welcome";
  view: PlayerView;
}

export type ErrorCode =
  | "PROTOCOL_MISMATCH"
  | "AUTH_FAILED"
  | "COOLDOWN_ACTIVE"
  | "INVALID_TARGET"
  | "TARGET_HIDDEN"
  | "NOT_ADJACENT"
  | "BLOCKED_EDGE"
  | "NO_AMMO"
  | "NO_DURABILITY"
  | "NO_COVER_SLOT"
  | "NO_SEARCHES_LEFT"
  | "SPAWN_GRACE"
  | "WRONG_STATUS"
  | "WRONG_PHASE"
  | "STALE_VERSION"
  | "DUPLICATE_COMMAND"
  | "NO_ITEM"
  | "NO_STAMINA"
  | "NO_RECOVERY_NEEDED"
  | "RANGE_LOS"
  | "STYLE_NOT_ALLOWED"
  | "CAPACITY_FULL"
  | "NOT_EQUIPPABLE"
  | "CACHE_PRIORITY"
  | "NO_CACHE"
  | "NO_ECHO_TRACE"
  | "FINALE_LOCKED"
  | "FINALE_CONTESTED"
  | "RITUAL_REQUIREMENTS"
  | "OFFER_EXPIRED"
  | "NO_CREDITS"
  | "NO_STOCK";

export interface AckMsg {
  type: "ack";
  commandId: CommandId;
  accepted: boolean;
  errorCode?: ErrorCode;

  retryAtMs?: number;
}

export interface StateDiffMsg {
  type: "diff";
  stateVersion: number;
  gameNowMs: number;
  events: MatchEvent[];

  self?: SelfStateDiff;
  visiblePlayers?: VisiblePlayer[];
  nodes?: NodeView[];
  aliveCount?: number;
  echoCount?: number;
  phase?: Phase;
  legacyPrompt?: PlayerView["legacyPrompt"] | null;

  insightPrompt?: PlayerView["insightPrompt"] | null;

  finale?: PlayerView["finale"] | null;

  encounterPrompt?: PlayerView["encounterPrompt"] | null;
}

export interface SnapshotMsg {
  type: "snapshot";
  view: PlayerView;
}

export interface PreviewResponseMsg {
  type: "preview_result";
  requestId: string;
  allowed: boolean;
  reason?: ErrorCode;
  hitChanceBpsMin?: number;
  hitChanceBpsMax?: number;
  damageMin?: number;
  damageMax?: number;
  cooldownMs?: number;
  signalCost?: number;
  modifiers?: Array<{ source: string; bps: number }>;

  warnings?: string[];
}

export interface PongMsg {
  type: "pong";
  t: number;
}

export type ChatRejectReason = "EMPTY" | "TOO_LONG" | "RATE_LIMITED" | "NOT_ALLOWED";

export interface ChatMessageMsg {
  type: "chat_message";
  messageId: string;
  player: PlayerId;
  text: string;

  sentAtMs: number;
}

export interface ChatRejectMsg {
  type: "chat_reject";
  messageId: string;
  reason: ChatRejectReason;
}

export interface ArboraStatusMsg {
  type: "arbora_status";
  remainingQuestions: number;
  cooldownUntilGameMs: number;
  pendingRequestId?: string;
}

export type ArboraHintType =
  | "hotspot"
  | "playstyle"
  | "self_review"
  | "rule"
  | "insufficient";

export type ArboraConfidence = "low" | "medium" | "high";

export interface ArboraReplyMsg {
  type: "arbora_reply";
  requestId: string;
  displayText: string;
  hintType: ArboraHintType;
  citedFactIds: string[];
  dataAsOfGameMs: number;
  confidence: ArboraConfidence;
  toneTag: "arbora" | "pomona";
  safetyFlags: string[];
  source: "local" | "scripted";
  remainingQuestions: number;
  cooldownUntilGameMs: number;
}

export type ArboraRejectReason =
  | "NOT_ECHO"
  | "EMPTY"
  | "TOO_LONG"
  | "RATE_LIMITED"
  | "LIMIT_REACHED"
  | "PENDING"
  | "UNAVAILABLE";

export interface ArboraRejectMsg {
  type: "arbora_reject";
  requestId: string;
  reason: ArboraRejectReason;
  remainingQuestions: number;
  retryAtGameMs?: number;
}

export type ServerMsg =
  | WelcomeMsg
  | AckMsg
  | StateDiffMsg
  | SnapshotMsg
  | PreviewResponseMsg
  | PongMsg
  | ChatMessageMsg
  | ChatRejectMsg
  | ArboraStatusMsg
  | ArboraReplyMsg
  | ArboraRejectMsg;

export type MatchEvent =
  | {
    kind: "combat";
    sourceNode: NodeId;
    targetNode: NodeId;
    attacker: PlayerId;
    target: PlayerId;
    weapon: WeaponKind;
    hit: boolean;
    damage: number;
    targetHpBand: VisiblePlayer["hpBand"];
  }
  | { kind: "player_downed"; player: PlayerId; node: NodeId; downedUntilMs: number; by?: PlayerId }
  | { kind: "player_eliminated"; player: PlayerId; node: NodeId; by: PlayerId | "zone" | "timeout" }
  | { kind: "player_echoed"; player: PlayerId; node: NodeId; by?: PlayerId }
  | { kind: "search_result"; player: PlayerId; found: ItemStack | null }
  | {
    kind: "recovery_completed";
    player: PlayerId;
    item: "bandage" | "medkit" | "healthy_food" | "spoiled_food";
    hpGained: number;
    staminaGained: number;
    discomfortUntilMs?: number;
  }
  | {
    kind: "supply_event";
    eventId: "SUPPLY_ROUTE_TRACE" | "SUPPLY_TOOL_NOTE";
    player: PlayerId;
  }
  | {
    kind: "cache_dropped";
    cacheId: string;
    node: NodeId;
    priorityFor: PlayerId;
    untilMs: number;
    items: ItemStack[];
  }
  | {
    kind: "hazard_triggered";
    player: PlayerId;
    node: NodeId;
    hazard: "conductive_puddle" | "slip";
    damage: number;
  }
  | { kind: "hazard_revealed"; node: NodeId; hazardId: string; hazard: "conductive_puddle" }
  | { kind: "hide_result"; player: PlayerId; success: boolean }
  | { kind: "player_spotted"; player: PlayerId; node: NodeId }
  | { kind: "got_lost"; player: PlayerId; intended: NodeId; actual: NodeId }
  | { kind: "equipped"; player: PlayerId; item: ItemKind }
  | { kind: "armor_broken"; player: PlayerId; item: ItemKind }
  | { kind: "item_dropped"; cacheId: string; player: PlayerId; node: NodeId; item: ItemKind }
  | { kind: "blockade_preview"; node: NodeId; closesAtMs: number }
  | { kind: "blockade_closed"; node: NodeId }
  | { kind: "reset_started"; atMs: number }
  | { kind: "reset_completed"; collapsedEdges: EdgeId[]; openedEdges: EdgeId[] }
  | { kind: "echo_returned"; player: PlayerId; node: NodeId; insights: number }
  | { kind: "legacy_locked"; player: PlayerId }
  | { kind: "oath_changed"; player: PlayerId; oath: OathState }
  | { kind: "final_reckoning"; atMs: number }
  | { kind: "sudden_death_started"; atMs: number }
  | { kind: "noise"; node: NodeId; loudness: 5 | 10 | 15 | 20 }
  | {
    kind: "echo_attuned";
    player: PlayerId;
    node: NodeId;
    intelGained: number;
    firstAttune: boolean;
    recentCombat: boolean;
  }
  | {
    kind: "level_up";
    player: PlayerId;
    level: number;

    maxHp: number;

    hpGained: number;
  }
  | {
    kind: "injury_inflicted";
    player: PlayerId;
    part: InjuryPart;
    source: "combat" | "slip" | "shock";
  }
  | {
    kind: "injury_cured";
    player: PlayerId;
    part: InjuryPart;
  }
  | {
    kind: "shop_traded";
    player: PlayerId;
    side: "buy" | "sell";
    item: ItemKind;
    price: number;
  }
  | {
    kind: "finale_offer_started";
    node: NodeId;
    mode: "solo" | "arbora";
    initiator: PlayerId;
    deadlineMs: number;
  }
  | { kind: "finale_joined"; node: NodeId; player: PlayerId; participants: PlayerId[] }
  | {
    kind: "finale_channel_started";
    node: NodeId;
    mode: "solo" | "arbora";
    participants: PlayerId[];
    deadlineMs: number;
  }
  | {
    kind: "finale_interrupted";
    node: NodeId;
    interruptor: PlayerId;

    reason:
      | "damage"
      | "move"
      | "downed"
      | "leave"
      | "outsider"
      | "timeout"
      | "cancelled"
      | "ritual";
  }
  | { kind: "finale_claimed"; node: NodeId; mode: "solo" | "arbora"; winners: PlayerId[] }
  | {
    kind: "finale_completed";
    node: NodeId;
    mode: "solo" | "arbora";
    ending: "solo_survivor" | "arbora_covenant" | "none";
  }
  | {
    kind: "travel_encounter_started";
    player: PlayerId;
    encounterId: string;
    node: NodeId;
    deadlineMs: number;
  }
  | {
    kind: "travel_encounter_resolved";
    player: PlayerId;
    encounterId: string;
    outcome: "continued" | "engaged" | "lost_sight" | "timeout";
  }
  | {
    kind: "match_ended";
    winners: PlayerId[];
    ending: "solo_survivor" | "arbora_covenant" | "none";
    reason: "last_standing" | "finale_solo" | "finale_coop" | "sudden_death_tiebreak" | "all_dead";
  };

export interface RandomRollRecord {
  commandId: CommandId | "system";

  stream: "combat" | "loot" | "hazard" | "event" | "map";
  rollIndex: number;
  min: number;
  max: number;
  result: number;
}

export interface ReplayLog {
  protocolVersion: number;
  matchId: string;
  matchSeed: string;
  fixtureSchemaVersion: string;
  timeScale: number;
  commands: Array<
    { atGameMs: number; playerId: PlayerId; commandId: CommandId; payload: ActionPayload }
  >;
  rolls: RandomRollRecord[];
  endGameMs: number;
  finalStateHash: string;
}

export function isClientMsg(x: unknown): x is ClientMsg {
  return isClientMessage(x);
}

export function isServerMsg(x: unknown): x is ServerMsg {
  return isServerMessage(x);
}
