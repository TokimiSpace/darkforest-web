// @ts-check
import {
  appendNarrativeEntries,
  arenaSceneUrl,
  cachePriorityState,
  deriveNarrative,
  ECHO_TWO_INSIGHT_TARGET,
  edgeFlavorLine,
  equipmentSlotForItem,
  eventsToNarrative,
  formatNarrativeTimestamp,
  isContactRef,
  itemDisplayName,
  itemStackDisplayName,
  itemUseNarrativeLine,
  narrativeEntryMatchesFilter,
  narrativeNodeName,
  openingLoadoutNarrative,
  personalCombatNarrativeEntries,
  projectAuthoritativeEnding,
  rejectedActionReceiptLine,
  rejectionNarrativeLine,
  sceneUrl,
  worldPhase,
} from "./narrative_log.js";
import {
  assembleNarrativeOptions,
  assistDecisionOptions,
  automaticCombatPreviewLease,
  combatActionBlockReason,
  combatPreviewLease,
  combatWeaponBlockReason,
  COMMANDER_INTENT_COPY,
  commanderEntryFits,
  compactTopologyPositions,
  createProgressionProjection,
  diffRequiresFullRender,
  echoJitIsFirstUse,
  effectiveRushStaminaCost,
  encounterBlocksNarrativeOptions,
  encounterPolicyStep,
  encounterPresentation,
  encounterPromptLine,
  encounterTargetDescription,
  ENGAGEMENT_POLICY_COPY,
  engagementPolicyStep,
  engagementWeapon,
  expiredCombatCooldownWake,
  familiarEdgesFromDiff,
  finaleActionAvailability,
  finaleStageDurationMs,
  hasTreatableInjury,
  identifiedPlayerLevel,
  isDurabilityWeapon,
  isMeleeWeapon,
  isPassiveStaminaChange,
  isWeaponKind,
  matchTraitPresentation,
  movementStyleOptions,
  narrativeMomentHeading,
  nextNarrativeAdjective,
  normalizeEchoJitHistory,
  normalizeInventoryMetric,
  partitionQuickUseItems,
  progressionReadout,
  projectForegroundSurface,
  rememberEchoJitMatch,
  resolveArenaExperiment,
  resolvePlayViewMode,
  selectNarrativeSituation,
  selfInjuryParts,
  shopCatalogPresentation,
  shouldInvalidatePreviewForVersion,
  spectatorBroadcastEntries,
  statusLockedNarrativeOptions,
  visibleRecentHostileRefs,
} from "./narrative_mode.js";
import {
  createTacticalArena,
  projectResetCinematicTiming,
  projectTacticalArenaModel,
  projectTacticalFeedbackSequence,
  tacticalArenaFieldAvailable,
  tacticalArenaOwnsContactDecision,
  tacticalHideStep,
  tacticalTargetActionStep,
} from "./tactical_arena.js";
import { getLocale, protocolLocaleForUi, t } from "./i18n.js";
import { createAmbientMusicController } from "./ambient_music.js";
import { itemFieldIconUrl, weaponOutlineIconUrl } from "./item_art.js";
import {
  characterMotionMarkup,
  hydrateCharacterMotion,
  syncCharacterTravelMotion,
} from "./character_motion.js";
import { parseServerMessage } from "./protocol_runtime.js";
import { actionAnimationState, healthAnimationCue } from "./action_animation_state.js";
import {
  FACTIONS,
  formatSpectatorWarmup,
  PROFESSION_ART,
  PROFESSIONS,
  scheduledLobbyPreview,
} from "./lobby_profile.js";
import {
  buildFixtureSocketUrl,
  fixtureHealthReportsReady,
  localInstantStartEnabled,
  resolveFixtureSocketUrl,
} from "./match_connection.js";
import {
  applyArboraMessage,
  arboraRejectNarrativeEntry,
  arboraReplyNarrativeEntry,
  arboraWaitingNarrativeEntry,
  beginArboraRequest,
  clipOracleDraft,
  createEchoOracleState,
  ECHO_ORACLE_MAX_CODEPOINTS,
  echoOracleAvailability,
  echoOracleMarkup,
  echoOracleRenderKey,
  normalizeOracleQuestion,
  oracleCodePointLength,
  patchEchoOraclePanel,
} from "./echo_oracle.js";
import {
  activeProfileQuotes,
  bindProfileFormListeners,
  restoreProfileForm,
  setProfileFieldsDisabled,
  syncProfileDraftPresentation,
} from "./lobby_profile_form.js";
import {
  cooldownSignature,
  currentTimeScale,
  estimatedGameNowMs,
  finaleEntryAvailableNow,
  spawnGraceActive,
  syncClock,
} from "./match_clock.js";
import {
  actionIcon,
  actionLogText,
  activeEdges,
  applyDiff,
  armorSilhouetteLabel,
  atmosphereUrl,
  classifyDiffVersion,
  countdownSentence,
  edgeForMove,
  edgeStyle,
  escapeHtml,
  eventImage,
  eventNode,
  eventPlayerRef,
  finaleRequiresInput,
  formatBpsPercent,
  formatDuration,
  isRecord,
  joinButtonMarkup,
  limpingBadgeMarkup,
  narrativeEntryMetaMarkup,
  nextBlockade,
  nodeCacheOffers,
  openingPerkCardMarkup,
  phaseLabel,
  previewMarkup,
  previewWarningLine,
  resolveFeedbackUrl,
  routeNeighbors,
  runtimeFormControl,
  sceneBackground,
  selfInjurySummary,
  selfShoes,
  spectateButtonMarkup,
  tacticalArenaCombatBlockText,
  tacticalArenaExitProjection,
  tacticalArenaModel,
  tacticalArenaTargetDetail,
  tacticalArenaTargetInEncounter,
  tacticalContactFigure,
  tacticalProfessionFigure,
  tacticalStatusIcon,
  uiDisclosureMarkup,
  visiblePlayerName,
  waitingDotsMarkup,
} from "./view_helpers.js";

/** @typedef {import("@darkforest/protocol").ClientMsg} _ClientMsg */
/** @typedef {import("@darkforest/protocol").ActionPayload} _ActionPayload */
/** @typedef {import("@darkforest/protocol").PlayerView} _PlayerView */
/** @typedef {import("@darkforest/protocol").MatchEvent} _MatchEvent */
/** @typedef {import("@darkforest/protocol").PreviewResponseMsg} _PreviewResponseMsg */
/** @typedef {import("@darkforest/protocol").ReplayLog} _ReplayLog */
/** @typedef {import("@darkforest/protocol").ServerMsg} _ServerMsg */
/** @typedef {import("@darkforest/protocol").StateDiffMsg} _StateDiffMsg */
/** @typedef {import("../lib/protocol_state.ts").LobbyMessage} _LobbyMsg */
/** @typedef {{type: "spectator_waiting", matchId: string | null, delayGameMs: number, readyInMs: number | null}} _SpectatorWaitingMsg */
/** @typedef {{profileId: string, displayName: string, faction: "rootbound" | "human", profession: "courier" | "scavenger" | "enforcer", victoryQuote?: string, downedQuote?: string, createdAtMs: number}} _Profile */
/** @typedef {import("../lib/protocol_state.ts").VisiblePlayerScope} _VisiblePlayerScope */
/** @typedef {import("./narrative_log.js").NarrativeEntry} _NarrativeEntry */
/** @typedef {ReturnType<typeof assembleNarrativeOptions>[number]} _NarrativeOption */
/** @typedef {ReturnType<typeof selectNarrativeSituation>} _NarrativeSituation */
/** @typedef {{requestId: string, target: string, node: import("@darkforest/protocol").NodeId, scope: _VisiblePlayerScope, weapon: import("@darkforest/protocol").WeaponKind, requestedStateVersion: number, combatLease: string | null}} _PreviewContext */
/** @typedef {{errorCode?: string, retryAtMs?: number, shoeSlot?: boolean}} _ActionRejection */
/** @typedef {{key: string, params?: Record<string, string | number | {key: string}>} | {rejection: _ActionRejection}} _AssistPause */
/** @typedef {"manual" | "assist" | "semi"} _ControlMode */
/** @typedef {"hold" | "survive" | "scavenge" | "conceal" | "travel" | "echo_intel"} _AssistIntent */
/** @typedef {{key: string, title: string, detail: string, payload?: _ActionPayload, preview?: {target: string, weapon: import("@darkforest/protocol").WeaponKind}, state: "ready" | "waiting" | "manual" | "blocked"}} _AssistDecision */
/** @typedef {import("@darkforest/protocol").ArboraStatusMsg} _ArboraStatusMsg */
/** @typedef {import("@darkforest/protocol").ArboraReplyMsg} _ArboraReplyMsg */
/** @typedef {import("@darkforest/protocol").ArboraRejectMsg} _ArboraRejectMsg */
/** @typedef {_ArboraStatusMsg | _ArboraReplyMsg | _ArboraRejectMsg} _ArboraServerMsg */
/** @typedef {import("@darkforest/protocol").ArboraAskMsg} _ArboraAskMsg */
/** @type {Record<string, {x: number, y: number}>} */
const NODE_POSITIONS = {
  N1: { x: 50, y: 17 },
  N2: { x: 76, y: 34 },
  N3: { x: 78, y: 70 },
  N4: { x: 50, y: 84 },
  N5: { x: 22, y: 67 },
  N6: { x: 22, y: 31 },
};
const ENVIRONMENT_TAGS = /** @type {const} */ ([
  "CRAMPED",
  "COVERED",
  "OPEN",
  "DENSE",
  "DARK",
  "DEBRIS",
  "WET",
  "MUD",
  "POWERED",
]);

/**
 * Tag copy resolves through `t()` at property-read time (same accessor pattern as
 * `ENGAGEMENT_POLICY_COPY` in narrative_mode.js) so a locale switch re-renders without
 * rebuilding this map. `tag.<TAG>` is the canonical label wording for the whole app.
 */
const TAG_INFO = Object.fromEntries(ENVIRONMENT_TAGS.map((tag) => [tag, {
  get label() {
    return t(`tag.${tag}`);
  },
  get summary() {
    return t(`tag.summary.${tag}`);
  },
}]));

/** @param {unknown} kind @param {string=} className */
function fieldItemIconMarkup(kind, className = "field-item-icon") {
  const icon = itemFieldIconUrl(kind);
  return icon === null
    ? `<span class="${escapeHtml(className)} field-item-icon-fallback" aria-hidden="true">?</span>`
    : `<img class="${escapeHtml(className)}" src="${escapeHtml(icon)}" alt="" aria-hidden="true">`;
}

/** @param {_PlayerView} current */
function equippedWeaponReadout(current) {
  const kind = typeof current.self.equippedWeapon === "string" &&
      isWeaponKind(current.self.equippedWeapon)
    ? current.self.equippedWeapon
    : null;
  const stack = current.self.inventory.find((item) => item.kind === kind);
  const lightAmmoCount = normalizeInventoryMetric(
    current.self.inventory.find((item) => item.kind === "light_ammo")?.count,
  ) ?? 0;
  const durability = normalizeInventoryMetric(stack?.durability);
  return {
    kind,
    icon: itemFieldIconUrl(kind),
    name: kind === null ? t("situation.silhouette.unarmed") : itemDisplayName(kind),
    resource: kind === null
      ? t("hud.weapon.none")
      : isDurabilityWeapon(kind)
      ? durability === null
        ? t("hud.weapon.durabilityUnknown")
        : t("hud.weapon.durability", { value: durability })
      : t("hud.weapon.lightAmmo", { count: lightAmmoCount }),
  };
}

/** @param {_PlayerView} current */
function survivalReadout(current) {
  const max = Math.max(1, normalizeInventoryMetric(current.survivalRules.staminaMax) ?? 100);
  const stamina = Math.min(max, normalizeInventoryMetric(current.self.stamina) ?? 0);
  const rushCost = effectiveRushStaminaCost(current);
  const discomfortUntilMs = normalizeInventoryMetric(current.self.discomfortUntilMs);
  return {
    max,
    stamina,
    rushCost,
    canRush: stamina >= rushCost,
    discomfortUntilMs,
    discomfort: discomfortUntilMs !== null && discomfortUntilMs > estimatedGameNowMs(),
  };
}

/** @param {_PlayerView} current @param {"narrative-desktop" | "narrative-mobile" | "hud"} surface */
function traitChipMarkup(current, surface) {
  const copy = matchTraitPresentation(current.self.trait);
  const expanded = traitPopoverSurface === surface;
  const family = surface.startsWith("narrative") ? "narrative" : "hud";
  return `<details class="match-trait-chip match-trait-chip-${family} match-trait-chip-${surface}" data-trait-chip="${surface}" data-self-trait="${
    escapeHtml(current.self.trait)
  }" ${expanded ? "open" : ""}>
    <summary aria-label="${
    escapeHtml(`${t("hud.trait.label")}: ${copy.label}. ${copy.description}`)
  }"><i aria-hidden="true">✦</i><span>${escapeHtml(t("hud.trait.label"))}</span><b>${
    escapeHtml(copy.label)
  }</b></summary>
    <p><strong>${escapeHtml(copy.label)}</strong><span>${escapeHtml(copy.description)}</span></p>
  </details>`;
}

/** @param {ParentNode} root */
function bindTraitChipInteractions(root) {
  root.querySelectorAll("[data-trait-chip]").forEach((element) => {
    if (!(element instanceof HTMLDetailsElement)) return;
    element.addEventListener("toggle", () => {
      const rawSurface = element.dataset.traitChip;
      const surface = rawSurface === "hud" || rawSurface === "narrative-mobile"
        ? rawSurface
        : "narrative-desktop";
      if (element.open) {
        traitPopoverSurface = surface;
        document.querySelectorAll("[data-trait-chip]").forEach((candidate) => {
          if (candidate !== element && candidate instanceof HTMLDetailsElement) {
            candidate.open = false;
          }
        });
      } else if (traitPopoverSurface === surface) {
        traitPopoverSurface = null;
      }
    });
  });
}

/** @param {_PlayerView} current @param {_ActionPayload} payload */
function movementResourceCopy(current, payload) {
  if (payload.action !== "move") return "";
  const survival = survivalReadout(current);
  if (payload.style === "sneak") return t("hud.movement.sneak");
  return survival.canRush
    ? t("hud.movement.rush", { cost: survival.rushCost })
    : t("hud.movement.rushBlocked", { cost: survival.rushCost, stamina: survival.stamina });
}

const joinForm = /** @type {HTMLFormElement} */ (document.getElementById("join-form"));
const lobbyApp = /** @type {HTMLElement} */ (document.querySelector("[data-lobby-app]"));
const wsUrlInput = /** @type {HTMLInputElement} */ (
  document.getElementById("ws-url") ??
    runtimeFormControl(lobbyApp.dataset.fixtureSocketUrl ?? "")
);
const modeSelect = /** @type {HTMLSelectElement} */ (
  document.getElementById("transport-mode") ?? runtimeFormControl("mock")
);
const localInstantStart = localInstantStartEnabled(
  globalThis.location.href,
  document.querySelector("[data-development-controls]") !== null,
);
const runtimeFixtureSocketUrl = resolveFixtureSocketUrl(globalThis.location.href);
wsUrlInput.value = runtimeFixtureSocketUrl;
modeSelect.value = "mock";
const fixtureInput = /** @type {HTMLInputElement} */ (
  document.getElementById("fixture-name") ?? runtimeFormControl("openingMegaCity")
);
const joinButton = /** @type {HTMLButtonElement} */ (document.getElementById("join-button"));
const joinLiveButton = /** @type {HTMLButtonElement} */ (
  document.getElementById("join-live-button")
);
const joinLiveDetail = /** @type {HTMLElement} */ (document.getElementById("join-live-detail"));
const spectateButton = /** @type {HTMLButtonElement} */ (
  document.getElementById("spectate-button")
);
const spectatorWarmup = /** @type {HTMLElement} */ (
  document.getElementById("spectator-warmup")
);
const spectatorWarmupCopy = /** @type {HTMLElement} */ (
  document.getElementById("spectator-warmup-copy")
);
const spectatorCancelButton = /** @type {HTMLButtonElement} */ (
  document.getElementById("spectator-cancel-button")
);
const promoVideoOpen = /** @type {HTMLButtonElement} */ (
  document.getElementById("promo-video-open")
);
const promoVideoDialog = /** @type {HTMLDialogElement} */ (
  document.getElementById("promo-video-dialog")
);
const promoVideoClose = /** @type {HTMLButtonElement} */ (
  document.getElementById("promo-video-close")
);
const promoVideoFrame = /** @type {HTMLElement} */ (
  document.getElementById("promo-video-frame")
);
const lobbyView = /** @type {HTMLElement} */ (document.getElementById("lobby-view"));
const lobbyCapacityBadge = /** @type {HTMLElement} */ (
  document.getElementById("lobby-capacity-badge")
);
const lobbySectionNote = /** @type {HTMLElement} */ (
  document.getElementById("lobby-section-note")
);
const lobbyPrejoinBrief = /** @type {HTMLElement} */ (
  document.getElementById("lobby-prejoin-brief")
);
const lobbyHeroNextShift = /** @type {HTMLTimeElement} */ (
  document.getElementById("lobby-hero-next-shift")
);
const lobbyHeroCountdown = /** @type {HTMLElement} */ (
  document.getElementById("lobby-hero-countdown")
);
const lobbyPrejoinNextShift = /** @type {HTMLTimeElement} */ (
  document.getElementById("lobby-prejoin-next-shift")
);
const lobbyPrejoinCountdown = /** @type {HTMLElement} */ (
  document.getElementById("lobby-prejoin-countdown")
);
const lobbyPrejoinAssembly = /** @type {HTMLElement} */ (
  document.getElementById("lobby-prejoin-assembly")
);
const lobbyServerState = /** @type {HTMLElement} */ (
  document.getElementById("lobby-server-state")
);
const lobbyMatchId = /** @type {HTMLElement} */ (document.getElementById("lobby-match-id"));
const lobbySeatedCount = /** @type {HTMLElement} */ (
  document.getElementById("lobby-seated-count")
);
const lobbyCapacityCount = /** @type {HTMLElement} */ (
  document.getElementById("lobby-capacity-count")
);
const lobbyCountdown = /** @type {HTMLElement} */ (document.getElementById("lobby-countdown"));
const lobbyNextShift = /** @type {HTMLElement} */ (document.getElementById("lobby-next-shift"));
const lobbyShiftStatus = /** @type {HTMLElement} */ (
  document.getElementById("lobby-shift-status")
);
const lobbyBotFillCount = /** @type {HTMLElement} */ (
  document.getElementById("lobby-bot-fill-count")
);
const lobbySeatGrid = /** @type {HTMLOListElement} */ (
  document.getElementById("lobby-seat-grid")
);
const lobbyLeaveButton = /** @type {HTMLButtonElement} */ (
  document.getElementById("lobby-leave-button")
);
const nextShiftDock = /** @type {HTMLElement} */ (document.getElementById("next-shift-dock"));
const nextShiftDockCountdown = /** @type {HTMLElement} */ (
  document.getElementById("next-shift-dock-countdown")
);
const nextShiftDockSeated = /** @type {HTMLElement} */ (
  document.getElementById("next-shift-dock-seated")
);
const nextShiftWatchButton = /** @type {HTMLButtonElement} */ (
  document.getElementById("next-shift-watch-button")
);
const nextShiftStopWatchButton = /** @type {HTMLButtonElement} */ (
  document.getElementById("next-shift-stop-watch-button")
);
const nextShiftLeaveButton = /** @type {HTMLButtonElement} */ (
  document.getElementById("next-shift-leave-button")
);
const matchView = /** @type {HTMLElement} */ (document.getElementById("match-view"));
const topbar = /** @type {HTMLElement} */ (document.getElementById("match-topbar"));
const mapHeading = /** @type {HTMLElement} */ (document.getElementById("map-heading"));
const mapCanvas = /** @type {HTMLElement} */ (document.getElementById("map-canvas"));
const mapLocation = /** @type {HTMLElement} */ (document.getElementById("map-location"));
const tacticalReadout = /** @type {HTMLElement} */ (
  document.getElementById("tactical-readout")
);
const playerPanel = /** @type {HTMLElement} */ (document.getElementById("player-panel"));
const assistPanel = /** @type {HTMLElement} */ (document.getElementById("assist-panel"));
const commandPanel = /** @type {HTMLElement} */ (document.getElementById("command-panel"));
const manualActionDrawer = /** @type {HTMLDetailsElement} */ (
  document.getElementById("manual-action-drawer")
);
const eventPanel = /** @type {HTMLElement} */ (document.getElementById("event-panel"));
const combatPanel = /** @type {HTMLElement} */ (document.getElementById("combat-panel"));
const modeBanner = /** @type {HTMLElement} */ (document.getElementById("mode-banner"));
const fatalNarrativeBanner = /** @type {HTMLElement} */ (
  document.getElementById("narrative-fatal-banner")
);
const playerQuoteNotice = /** @type {HTMLElement} */ (
  document.getElementById("player-quote-notice")
);
const narrativeModeView = /** @type {HTMLElement} */ (
  document.getElementById("narrative-mode-view")
);
const narrativeWorldAtmosphere = /** @type {HTMLElement} */ (
  document.getElementById("narrative-world-atmosphere")
);
const narrativeStatusbar = /** @type {HTMLElement} */ (
  document.getElementById("narrative-statusbar")
);
const narrativeContextPanel = /** @type {HTMLElement} */ (
  document.getElementById("narrative-context-panel")
);
const narrativeStory = /** @type {HTMLElement} */ (document.getElementById("narrative-story"));
const narrativeStoryGrid = /** @type {HTMLElement} */ (
  document.getElementById("narrative-story-grid")
);
const tacticalArenaStage = /** @type {HTMLElement} */ (
  document.getElementById("tactical-arena-stage")
);
const tacticalArenaScene = /** @type {HTMLElement} */ (
  document.getElementById("tactical-arena-scene")
);
const tacticalArenaCanvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById("tactical-arena-canvas")
);
const tacticalArenaTokens = /** @type {HTMLElement} */ (
  document.getElementById("tactical-arena-tokens")
);
const tacticalArenaExits = /** @type {HTMLElement} */ (
  document.getElementById("tactical-arena-exits")
);
const tacticalArenaInteractables = /** @type {HTMLElement} */ (
  document.getElementById("tactical-arena-interactables")
);
const tacticalArenaPhase = /** @type {HTMLElement} */ (
  document.getElementById("tactical-arena-phase")
);
const tacticalArenaHeading = /** @type {HTMLElement} */ (
  document.getElementById("tactical-arena-heading")
);
const tacticalArenaBackend = /** @type {HTMLElement} */ (
  document.getElementById("tactical-arena-backend")
);
const tacticalArenaSelfStatus = /** @type {HTMLElement} */ (
  document.getElementById("tactical-arena-self-status")
);
const tacticalArenaTags = /** @type {HTMLElement} */ (
  document.getElementById("tactical-arena-tags")
);
const tacticalArenaActions = /** @type {HTMLElement} */ (
  document.getElementById("tactical-arena-actions")
);
const tacticalArenaLatest = /** @type {HTMLElement} */ (
  document.getElementById("tactical-arena-latest")
);
const tacticalArenaLogOpen = /** @type {HTMLButtonElement} */ (
  document.getElementById("tactical-arena-log-open")
);
const tacticalArenaActionJump = /** @type {HTMLButtonElement} */ (
  document.getElementById("tactical-arena-action-jump")
);
const tacticalArenaActionJumpLabel = /** @type {HTMLElement} */ (
  document.getElementById("tactical-arena-action-jump-label")
);
const narrativeActionColumn = /** @type {HTMLElement} */ (
  document.getElementById("narrative-action-column")
);
const narrativePlayerDrawer = /** @type {HTMLDetailsElement} */ (
  document.getElementById("narrative-player-drawer")
);
const narrativeEnvironmentDrawer = /** @type {HTMLDetailsElement} */ (
  document.getElementById("narrative-environment-drawer")
);
const tacticalSideDetailTabs = /** @type {HTMLElement} */ (
  document.getElementById("tactical-side-detail-tabs")
);
const tacticalContextBreadcrumb = /** @type {HTMLElement} */ (
  document.getElementById("tactical-context-breadcrumb")
);
const tacticalContextBack = /** @type {HTMLButtonElement} */ (
  document.getElementById("tactical-context-back")
);
const tacticalContextClose = /** @type {HTMLButtonElement} */ (
  document.getElementById("tactical-context-close")
);
const tacticalContextCurrent = /** @type {HTMLElement} */ (
  document.getElementById("tactical-context-current")
);
const narrativeActionToggle = /** @type {HTMLButtonElement} */ (
  document.getElementById("narrative-action-toggle")
);
const tacticalViewSwitch = /** @type {HTMLElement} */ (
  document.getElementById("tactical-view-switch")
);
const narrativeCombatStory = /** @type {HTMLElement} */ (
  document.getElementById("narrative-combat-story")
);
const unifiedLogAnnouncer = /** @type {HTMLElement} */ (
  document.getElementById("unified-log-announcer")
);
const narrativeModeCount = /** @type {HTMLElement} */ (
  document.getElementById("narrative-mode-count")
);
const narrativeModeHeading = /** @type {HTMLElement} */ (
  document.getElementById("narrative-mode-heading")
);
const narrativePolicyRail = /** @type {HTMLElement} */ (
  document.getElementById("narrative-policy-rail")
);
const narrativePreview = /** @type {HTMLElement} */ (
  document.getElementById("narrative-preview")
);
const narrativeDecisionCard = /** @type {HTMLElement} */ (
  document.getElementById("narrative-decision-card")
);
const narrativeOptions = /** @type {HTMLElement} */ (
  document.getElementById("narrative-options")
);
const echoOraclePanel = document.createElement("section");
echoOraclePanel.id = "echo-oracle-panel";
echoOraclePanel.className = "echo-oracle-panel";
echoOraclePanel.setAttribute("aria-labelledby", "echo-oracle-heading");
echoOraclePanel.hidden = true;
narrativeOptions.insertAdjacentElement("afterend", echoOraclePanel);
const narrativeCommanderMenu = /** @type {HTMLElement} */ (
  document.getElementById("narrative-commander-menu")
);
const mobileCombatToggle = /** @type {HTMLButtonElement} */ (
  document.getElementById("mobile-combat-toggle")
);
const assistDrawer = /** @type {HTMLDetailsElement | null} */ (
  assistPanel.closest("details")
);
const legacyPanel = /** @type {HTMLElement} */ (document.getElementById("legacy-panel"));
const resetPanel = /** @type {HTMLElement} */ (document.getElementById("reset-panel"));
const replayPanel = /** @type {HTMLElement} */ (document.getElementById("replay-panel"));
const connectionPill = /** @type {HTMLElement} */ (document.getElementById("connection-pill"));
const connectionLabel = /** @type {HTMLElement} */ (document.getElementById("connection-label"));
const systemNotice = /** @type {HTMLElement} */ (document.getElementById("system-notice"));
const motionToggle = /** @type {HTMLButtonElement} */ (document.getElementById("motion-toggle"));
const motionToggleLabel = /** @type {HTMLElement} */ (
  document.getElementById("motion-toggle-label")
);
const musicToggle = /** @type {HTMLButtonElement} */ (document.getElementById("music-toggle"));
const musicToggleLabel = /** @type {HTMLElement} */ (
  document.getElementById("music-toggle-label")
);
const musicStatus = /** @type {HTMLElement} */ (document.getElementById("music-status"));
const accessibilityToggle = /** @type {HTMLButtonElement} */ (
  document.getElementById("accessibility-toggle")
);
const accessibilityPanel = /** @type {HTMLElement} */ (
  document.getElementById("accessibility-panel")
);
const accessibilityClose = /** @type {HTMLButtonElement} */ (
  document.getElementById("accessibility-close")
);
const debugOutput = /** @type {HTMLElement} */ (document.getElementById("debug-output"));
const debugPing = /** @type {HTMLButtonElement} */ (document.getElementById("debug-ping"));
const ambientMusic = createAmbientMusicController();

const feedbackUrl = resolveFeedbackUrl(document.body.dataset.feedbackUrl);

const lobbyFeedbackCta = document.getElementById("lobby-feedback-cta");
if (lobbyFeedbackCta instanceof HTMLAnchorElement && feedbackUrl !== "") {
  lobbyFeedbackCta.href = feedbackUrl;
  lobbyFeedbackCta.hidden = false;
} else {
  lobbyFeedbackCta?.remove();
}

/** @param {string} className */
function feedbackCtaMarkup(className) {
  if (feedbackUrl === "") return "";
  return `<a class="feedback-cta ${className}" data-feedback-cta href="${
    escapeHtml(feedbackUrl)
  }" target="_blank" rel="noopener" title="${
    escapeHtml(t("feedback.cta.hint"))
  }" data-i18n-title="feedback.cta.hint"><span><b data-i18n="feedback.cta.label">${
    escapeHtml(t("feedback.cta.label"))
  }</b><small data-i18n="feedback.cta.hint">${
    escapeHtml(t("feedback.cta.hint"))
  }</small></span><i aria-hidden="true">↗</i></a>`;
}
const requestedFixture = new URLSearchParams(globalThis.location.search).get("fixture");
const arenaExperimentRequested = resolveArenaExperiment(globalThis.location.search);
const mobileTacticalCockpitQuery = globalThis.matchMedia(
  "(max-width: 700px), (orientation: landscape) and (max-height: 500px) and (max-width: 1024px)",
);
if (requestedFixture !== null && /^[A-Za-z][A-Za-z0-9]+$/.test(requestedFixture)) {
  fixtureInput.value = requestedFixture;
}
/** @type {WebSocket | null} */
let socket = null;
/** @type {WebSocket | null} 候車專用；它不得直接覆寫目前觀戰的 view。 */
let queueSocket = null;
/** @type {_LobbyMsg | null} */
let queueMessage = null;
let queueMessageReceivedAtRealMs = performance.now();
/** @type {_PlayerView | null} */
let view = null;
/** 完整投影建立的 HP 基礎錨點；diff 升級只改 level，不改這個值。 @type {{baseMaxHp: number} | null} */
let progressionProjection = null;
const ECHO_JIT_HISTORY_KEY = "darkforest-echo-jit-v1";
/** @type {string[]} */
let echoJitSeenMatches = loadEchoJitHistory();
/** The guide is inline and optional; this state never affects an action or wire message. */
let echoJitOpen = false;
/** @type {string | null} */
let echoJitMatchId = null;

/** @param {_PlayerView} current */
function currentProgressionReadout(current) {
  progressionProjection ??= createProgressionProjection(current);
  return progressionReadout(current, progressionProjection);
}
/** Redacted diagnostic summaries only; never retain private Arbora prose or raw citations. @type {unknown[]} */
let recentMessages = [];
/** @type {string[]} */
let debugEntries = [];
/** @type {_MatchEvent[]} */
let matchEvents = [];
/** @type {_PreviewResponseMsg | null} */
let lastPreview = null;
/** @type {_PreviewContext | null} */
let lastPreviewContext = null;
let autoCombatPreview = false;
/** Field-local selection. Character tokens never turn this selection into an attack. @type {string | null} */
let tacticalArenaTargetRef = null;
/** The current encounter intentionally collapsed back to general field actions. @type {string | null} */
let tacticalArenaDismissedEncounterId = null;
/** Pointer/focus-only intent. It never requests Preview or sends a command. @type {string | null} */
let tacticalArenaAimTargetRef = null;
/** The exact combat lease the player explicitly chose not to act on. */
/** @type {string | null} */
let dismissedCombatPreviewLease = null;
/** Attack cooldown deadline already used to wake the automatic Preview. */
/** @type {number | null} */
let combatCooldownWakeDeadline = null;
/** Arena Preview microtasks are deduplicated by their authoritative combat lease. */
/** @type {string | null} */
let tacticalArenaPreviewScheduledLease = null;
/** Only a transport timeout, never an explicit Hold, makes one same-lease retry eligible. */
/** @type {string | null} */
let tacticalArenaPreviewRetryEligibleLease = null;
/** A timed-out Arena Preview may retry once for the same combat lease. */
/** @type {string | null} */
let tacticalArenaPreviewRetriedLease = null;
/** @type {_ReplayLog | null} */
let replayLog = null;
/** @type {_LobbyMsg | null} */
let lobbyMessage = null;
let lobbyMessageReceivedAtRealMs = performance.now();
let prejoinShiftSignature = "";
let liveJoinSignature = "";
let activeFixture = "openingMegaCity";
/** @type {"play" | "spectator"} */
let connectionIntent = "play";
/** @type {_Profile | null} */
let connectedProfile = null;
/** @type {{remainingMs: number | null, receivedAtRealMs: number} | null} */
let spectatorWarmupState = null;
let connectionStatusKey = "lobby.connection.checking";
/** @type {"checking" | "ready" | "unavailable"} */
let matchServiceAvailability = "checking";
/** @type {"service" | "session"} */
let connectionSurface = "service";
let matchHealthRequestSequence = 0;
let connectionStarting = false;
/** @type {_NarrativeEntry[]} */
let narrativeEntries = [];
let narrativeLocale = getLocale();
let narrativeLocaleChangeSequence = 0;
let echoOracleState = createEchoOracleState();
let echoOracleRenderedKey = "";
/** @type {string | null} */
let expandedNarrativeId = null;
let narrativeHoverPaused = false;
let fatalBannerTimer = 0;
let playerQuoteNoticeTimer = 0;
/** @type {string | null} */
/** @type {string | null} */
let lastLegacySelection = null;
/** @type {import("@darkforest/protocol").NodeId | null} */
let focusedNodeId = null;
/** @type {import("@darkforest/protocol").Tag | null} */
let focusedTag = null;
let signalPulseUntilRealMs = 0;
let levelPulseUntilRealMs = 0;
let creditsPulseUntilRealMs = 0;
let creditsPulseAmount = 0;
/** @type {string | null} */
let combatTargetRef = null;
/** @type {import("@darkforest/protocol").WeaponKind | null} */
let combatWeaponKind = null;
/** @type {boolean | null} */
let lastRenderedSpawnGrace = null;
/** @type {boolean | null} */
let lastRenderedFinaleEntry = null;
/** @type {string | null} */
let lastRenderedCooldownSignature = null;
/** @type {string | null} */
let lastRenderedCachePrioritySignature = null;
/** @type {Map<string, _ActionPayload>} */
const pendingCommandActions = new Map();
/** @type {Map<string, {expectedStateVersion: number, sentAtRealMs: number, accepted: boolean, resyncRequested: boolean}>} */
const pendingCommandMeta = new Map();
function clearResyncPending() {
  for (const meta of pendingCommandMeta.values()) meta.resyncRequested = false;
}
/** @type {{action: import("@darkforest/protocol").ActionType, accepted: boolean, errorCode?: string, retryAtMs?: number, shoeSlot?: boolean} | null} */
let lastActionFeedback = null;
/** @type {import("@darkforest/protocol").ActionType | null} */
let rejectedActionToRefocus = null;
/** @type {Array<{target: string, sourceNode: import("@darkforest/protocol").NodeId, targetNode: import("@darkforest/protocol").NodeId, hit: boolean, damage: number}>} */
let combatVisualEffects = [];
let combatVisualTimer = 0;
/** @type {import("@darkforest/protocol").NodeId | null} */
let logFocusedNodeId = null;
/** @type {string | null} */
let logFocusedPlayerRef = null;
/** @type {Array<{contactRef: string, playerId: string, node: import("@darkforest/protocol").NodeId}>} */
let recognitionTransitions = [];
let recognitionTransitionTimer = 0;
/** @type {string | null} */
let lockedLegacyItem = null;
let resetSummaryDismissed = false;
/** @type {_ControlMode} */
let controlMode = "assist";
/** @type {_AssistIntent} */
let assistIntent = "survive";
/** @type {"avoid" | "retaliate" | "hunt"} */
let engagementPolicy = "avoid";
/** @type {import("@darkforest/protocol").NodeId | null} */
let assistDestination = null;
/**
 * The assist pause line is stored as *data* — a catalog key plus params, or the raw rejection
 * feedback record — and only resolved through `t()` at render time. It used to hold the
 * already-resolved sentence, which froze it in whatever locale was active when the pause
 * happened, so switching language mid-match left the reason in the old language forever.
 * A param may itself be `{key}`, which is resolved through `t()` too; that keeps nested copy
 * (the engagement-policy name) translatable instead of baking a resolved label into the record.
 * @type {_AssistPause}
 */
let assistPausedReason = { key: "semi.paused.assist" };
/** @type {{signature: string, payload: _ActionPayload, endsAtRealMs: number} | null} */
let assistCountdown = null;
/** @type {number | null} */
let assistBusyStateVersion = null;
/** @type {Set<string>} */
const assistCommandIds = new Set();
/** @type {Map<string, number>} */
const recentHostileUntilMs = new Map();
/** @type {"hud" | "narrative"} */
let playViewMode = "narrative";
/** @type {"field" | "log"} */
let tacticalArenaSurface = "field";
let narrativeActionExpanded = false;
let narrativeActionAutoOpened = false;
/** @type {string | null} */
let lastForcedNarrativeActionSignature = null;
/** @type {HTMLElement | null} */
let tacticalSurfaceReturnElement = null;
/** @type {ReturnType<typeof createTacticalArena> | null} */
let tacticalArenaRenderer = null;
let tacticalArenaFeedbackSignature = "";
let tacticalArenaSelfStatusSignature = "";
let tacticalArenaInteractablesSignature = "";
/** @type {string | null} */
let tacticalSideDetailReturnSelector = null;
/** @type {"rush" | "sneak" | "lost" | null} */
let tacticalArenaMovementStyle = null;
let playViewInitialized = false;
let narrativeCommanderActive = false;
let narrativeCommanderMenuOpen = false;
let narrativeRouteMenuOpen = false;
let narrativeStoryHoverPaused = false;
let narrativeStoryFollowing = true;
let narrativeStoryUnreadCount = 0;
let narrativeStoryRenderSignature = "";
let narrativeStoryDomSignature = "";
let narrativeCombatStoryDomSignature = "";
let narrativeCombatStoryFollowing = true;
let narrativeCombatStoryHoverPaused = false;
let openingPerkCardVisible = false;
/** @type {"narrative-desktop" | "narrative-mobile" | "hud" | null} */
let traitPopoverSurface = null;
/** @type {"all" | "focus"} */
let narrativeLogFilter = "focus";
/** @type {_NarrativeSituation} */
let narrativeSituation = { kind: "none" };
/** @type {{title: string, context: string, payload: _ActionPayload, confirmLabel: string} | null} */
let narrativePendingDecision = null;
/** @type {{selector: string, reopenActionDrawer: boolean} | null} */
let narrativePendingDecisionOrigin = null;
/** @type {Map<string, {selector: string, reopenActionDrawer: boolean}>} */
const pendingDecisionCommandOrigins = new Map();
/** @type {{selector: string, reopenActionDrawer: boolean} | null} */
let rejectedDecisionOrigin = null;
let narrativeResetDecisionPending = false;
/** @type {"buy" | "sell"} */
let shopTradeSide = "buy";
let supplyShopLineIndex = 0;
let supplyShopLineChangedAtRealMs = performance.now();
/** @type {import("@darkforest/protocol").NodeId | null} */
let shopAutoOpenedNode = null;
/**
 * 戰術場工具選單「已為這個商店節點自動展開過」的節點 id。Field Supply 商店是限地點的機會,而工具選單
 * 在桌機與手機都是收合的(桌機規則見 styles.css 的 min-width:1051px 區塊),收合時的標題只寫
 * 「現場行動 · N」,玩家站在維修環廊上也完全看不出這裡能交易——實測回報就是「找不到商店按鈕」。
 * 只在抵達當下強制展開一次;玩家之後自行收起就不再打擾。
 */
/** @type {import("@darkforest/protocol").NodeId | null} */
let arenaToolsShopOpenedNode = null;
/** @type {Set<import("@darkforest/protocol").NodeId>} */
const narrativeAvoidNodes = new Set();
/** @type {Set<string>} */
const narrativeMarkedEdges = new Set();
/** @type {Set<string>} */
const narrativeFamiliarEdges = new Set();
/** @type {Map<import("@darkforest/protocol").NodeId, Set<string>>} */
const narrativeUsedAdjectives = new Map();
let narrativeIdleFromGameMs = 0;
/** @type {{to: import("@darkforest/protocol").NodeId, title: string, context: string} | null} */
let narrativeMovementChoice = null;
/** @type {string | null} */
let narrativeEncounterTargetRef = null;
/** @type {string | null} */
let narrativeObservedEncounterId = null;
/** @type {Map<string, {edgeId: string, destinationName: string, style: import("@darkforest/protocol").MovementStyle, startedAtGameMs: number, revealAtGameMs: number, revealAtRealMs: number, accepted: boolean}>} */
const pendingMovementNarratives = new Map();
/** @type {Extract<_MatchEvent, {kind: "cache_dropped"}> | null} */
let narrativeCacheOffer = null;
let narrativeCacheDecisionOpen = false;
/** @type {import("@darkforest/protocol").ItemKind | null} */
let narrativeCacheWanted = null;
/** @type {Set<import("@darkforest/protocol").ItemKind>} */
const narrativeLegacyDraft = new Set();
let narrativeLegacyDeadline = -1;
/** @type {Set<import("@darkforest/protocol").ItemKind>} */
const narrativeInsightDraft = new Set();
let narrativeInsightDeadline = -1;
/** @type {{cacheId: string, item: import("@darkforest/protocol").ItemKind, droppedItem: import("@darkforest/protocol").ItemKind, dropCommandId: string} | null} */
let pendingCapacitySwap = null;
/** @type {Map<string, import("@darkforest/protocol").ItemKind>} */
const pendingPickupNarratives = new Map();
/** Cosmetic ring baselines keyed by the server-authoritative deadline. */
const cooldownVisualStartByDeadline = new Map();
let previewTimeoutTimer = 0;
/** @type {import("@darkforest/protocol").EquipmentSlot | null} */
let armorBreakingSlot = null;
/** @type {Set<string>} */
const armorBreakingPlayers = new Set();
let armorBreakTimer = 0;
let scheduledMatchRender = 0;
const PROMO_VIDEO_EMBED_URL = "";

mobileCombatToggle.addEventListener("click", () => {
  const expanded = !combatPanel.classList.contains("is-mobile-expanded");
  combatPanel.classList.toggle("is-mobile-expanded", expanded);
  mobileCombatToggle.setAttribute("aria-expanded", String(expanded));
});

function syncTacticalContextBreadcrumb() {
  let currentKey = null;
  if (view !== null && tacticalSessionActive(view)) {
    if (matchView.classList.contains("tactical-side-detail-open")) {
      currentKey = narrativeEnvironmentDrawer.open
        ? "lobby.match.environmentDrawerTitle"
        : "lobby.match.playerDrawerTitle";
    } else if (tacticalArenaSurface === "log") {
      currentKey = "log.title";
    } else if (narrativeMovementChoice !== null) {
      currentKey = "hud.routes.title";
    } else if (narrativeCacheDecisionOpen) {
      currentKey = "inventory.cache.title";
    } else if (narrativePendingDecision !== null) {
      currentKey = "decision.title";
    } else if (
      tacticalArenaInteractables.querySelector(".tactical-mobile-tools[open]") !== null
    ) {
      currentKey = "actions.title";
    } else if (narrativeActionExpanded) {
      currentKey = "actions.title";
    }
  }
  const visible = currentKey !== null;
  tacticalContextBreadcrumb.hidden = !visible;
  document.documentElement.classList.toggle("has-tactical-breadcrumb", visible);
  const forcedWithoutField = view !== null &&
    forcedNarrativeActionSignature(view) !== null &&
    !tacticalArenaCanShowField(view);
  tacticalContextBack.disabled = forcedWithoutField;
  tacticalContextBack.setAttribute("aria-disabled", String(forcedWithoutField));
  tacticalContextBack.title = forcedWithoutField ? t("arena.action.jump") : "";
  tacticalContextClose.disabled = forcedWithoutField;
  tacticalContextClose.setAttribute("aria-disabled", String(forcedWithoutField));
  tacticalContextClose.title = forcedWithoutField ? t("arena.action.jump") : "";
  if (currentKey !== null) tacticalContextCurrent.textContent = t(currentKey);
}

function returnToTacticalField() {
  if (view === null) return;
  if (narrativePendingDecision !== null) {
    cancelNarrativePendingDecision(view);
    return;
  }
  if (
    forcedNarrativeActionSignature(view) !== null &&
    !tacticalArenaCanShowField(view)
  ) {
    const decision = narrativeActionColumn.querySelector(
      "#narrative-decision-card button:not(:disabled), #narrative-decision-card input:not(:disabled)",
    );
    const destination = decision instanceof HTMLElement ? decision : narrativeModeHeading;
    destination.focus({ preventScroll: true });
    return;
  }
  closeTacticalSideDetail();
  narrativeMovementChoice = null;
  narrativePendingDecisionOrigin = null;
  narrativeResetDecisionPending = false;
  narrativeCacheDecisionOpen = false;
  narrativeCacheOffer = null;
  narrativeCacheWanted = null;
  const mobileTools = tacticalArenaInteractables.querySelector(".tactical-mobile-tools");
  if (mobileTools instanceof HTMLDetailsElement) mobileTools.open = false;
  tacticalArenaStage.classList.remove("has-tools-menu");
  tacticalArenaSurface = "field";
  const returnElement = tacticalSurfaceReturnElement;
  tacticalSurfaceReturnElement = null;
  narrativeActionAutoOpened = false;
  manualActionDrawer.open = false;
  combatPanel.classList.remove("is-mobile-expanded");
  mobileCombatToggle.setAttribute("aria-expanded", "false");
  setNarrativeActionExpanded(false);
  renderNarrativeMode(view);
  focusAfterTacticalRender(() => {
    if (
      returnElement !== null && returnElement.isConnected &&
      returnElement.getClientRects().length > 0
    ) return returnElement;
    return tacticalArenaHeading;
  });
}

/** @param {boolean} expanded */
function setNarrativeActionExpanded(expanded) {
  narrativeActionExpanded = expanded;
  narrativeActionColumn.hidden = !expanded;
  narrativeActionToggle.setAttribute("aria-expanded", String(expanded));
  matchView.classList.toggle("narrative-action-collapsed", !expanded);
  syncTacticalSurfaceSwitchLabels();
  syncTacticalContextBreadcrumb();
  if (expanded) {
    queueMicrotask(() => narrativeActionColumn.scrollIntoView({ block: "start" }));
  }
  if (!expanded && narrativeActionColumn.contains(document.activeElement)) {
    const destination = view !== null && tacticalArenaFieldOwnsContacts(view)
      ? tacticalArenaHeading
      : narrativeActionToggle;
    destination.focus({ preventScroll: true });
  }
}

/** @param {boolean=} restoreFocus */
function closeTacticalSideDetail(restoreFocus = false) {
  const wasOpen = matchView.classList.contains("tactical-side-detail-open");
  matchView.classList.remove("tactical-side-detail-open");
  document.documentElement.classList.remove("has-tactical-side-detail");
  tacticalArenaStage.inert = false;
  narrativeActionColumn.inert = false;
  const storyColumn = narrativeStory.closest(".narrative-story-column");
  if (storyColumn instanceof HTMLElement) storyColumn.inert = false;
  narrativePlayerDrawer.open = false;
  narrativeEnvironmentDrawer.open = false;
  syncTacticalSurfaceSwitchLabels();
  syncTacticalContextBreadcrumb();
  if (restoreFocus && wasOpen) {
    queueMicrotask(() => {
      const returnTarget = tacticalSideDetailReturnSelector === null
        ? null
        : document.querySelector(tacticalSideDetailReturnSelector);
      const destination = returnTarget instanceof HTMLElement &&
          !returnTarget.hasAttribute("disabled")
        ? returnTarget
        : tacticalArenaHeading;
      destination.focus({ preventScroll: true });
    });
  }
}

/**
 * @param {HTMLDetailsElement} drawer
 * @param {string=} returnSelector
 */
function openTacticalSideDetail(drawer, returnSelector = "[data-arena-details-open]") {
  narrativeActionAutoOpened = false;
  setNarrativeActionExpanded(false);
  tacticalSideDetailReturnSelector = returnSelector;
  const other = drawer === narrativePlayerDrawer
    ? narrativeEnvironmentDrawer
    : narrativePlayerDrawer;
  drawer.open = true;
  other.open = false;
  matchView.classList.add("tactical-side-detail-open");
  document.documentElement.classList.add("has-tactical-side-detail");
  tacticalArenaStage.inert = true;
  narrativeActionColumn.inert = true;
  const storyColumn = narrativeStory.closest(".narrative-story-column");
  if (storyColumn instanceof HTMLElement) storyColumn.inert = true;
  tacticalSideDetailTabs.querySelectorAll("[data-tactical-side-detail-tab]").forEach(
    (element) => {
      if (!(element instanceof HTMLButtonElement)) return;
      const ownsPlayer = element.dataset.tacticalSideDetailTab === "player";
      element.setAttribute(
        "aria-pressed",
        String(
          ownsPlayer ? drawer === narrativePlayerDrawer : drawer === narrativeEnvironmentDrawer,
        ),
      );
    },
  );
  syncTacticalSurfaceSwitchLabels();
  syncTacticalContextBreadcrumb();
  queueMicrotask(() => {
    const firstControl = drawer.querySelector(
      "button:not(:disabled), summary, [tabindex='0']",
    );
    if (firstControl instanceof HTMLElement) {
      firstControl.focus({ preventScroll: true });
      drawer.scrollIntoView({
        behavior: accessibilitySettings.reducedMotion ? "auto" : "smooth",
        block: "nearest",
      });
    }
  });
}

/**
 * Main-field gateways only reveal the established command surface. They never
 * send an action, duplicate shop state, or bypass Preview → Confirm.
 * @param {_PlayerView} current
 * @param {string} focusSelector
 */
function openTacticalActionDrawer(current, focusSelector) {
  if (!gameplayForeground(current).lowerActionsAvailable) {
    tacticalArenaActionFeedback(t("hud.lock.notYet"));
    renderNarrativeMode(current);
    return;
  }
  if (document.activeElement instanceof HTMLElement) {
    tacticalSurfaceReturnElement = document.activeElement;
  }
  closeTacticalSideDetail();
  narrativeActionAutoOpened = false;
  manualActionDrawer.open = true;
  renderCommands(current);
  setNarrativeActionExpanded(true);
  queueMicrotask(() => {
    manualActionDrawer.scrollIntoView({
      behavior: accessibilitySettings.reducedMotion ? "auto" : "smooth",
      block: "start",
    });
    const target = commandPanel.querySelector(focusSelector) ??
      manualActionDrawer.querySelector("summary");
    if (target instanceof HTMLElement) target.focus({ preventScroll: true });
  });
}

function openTacticalPolicyDrawer() {
  if (view !== null && !gameplayForeground(view).lowerActionsAvailable) {
    tacticalArenaActionFeedback(t("hud.lock.notYet"));
    return;
  }
  narrativeActionAutoOpened = false;
  setNarrativeActionExpanded(true);
  queueMicrotask(() => {
    const policy = narrativePolicyRail.querySelector(
      "[data-engagement-policy][aria-pressed='true']",
    );
    const destination = policy instanceof HTMLButtonElement ? policy : narrativeModeHeading;
    destination.focus({ preventScroll: true });
  });
}

tacticalContextBack.addEventListener("click", returnToTacticalField);
tacticalContextClose.addEventListener("click", returnToTacticalField);

for (const drawer of [narrativePlayerDrawer, narrativeEnvironmentDrawer]) {
  drawer.addEventListener("toggle", () => {
    if (!narrativePlayerDrawer.open && !narrativeEnvironmentDrawer.open) {
      const shouldRestoreFocus = drawer.contains(document.activeElement);
      closeTacticalSideDetail(shouldRestoreFocus);
    }
  });
  drawer.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    closeTacticalSideDetail(true);
  });
}

tacticalSideDetailTabs.querySelectorAll("[data-tactical-side-detail-tab]").forEach(
  (element) => {
    element.addEventListener("click", () => {
      if (!(element instanceof HTMLButtonElement)) return;
      openTacticalSideDetail(
        element.dataset.tacticalSideDetailTab === "environment"
          ? narrativeEnvironmentDrawer
          : narrativePlayerDrawer,
      );
    });
  },
);
tacticalSideDetailTabs.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  event.preventDefault();
  closeTacticalSideDetail(true);
});

/** @param {_PlayerView} current */
function tacticalArenaFieldOwnsContacts(current) {
  return tacticalArenaOwnsContactDecision({
    enabled: arenaExperimentRequested,
    surface: tacticalArenaSurface,
    phase: current.phase,
    status: current.self.status,
  });
}

/**
 * Rendering replaces large pieces of the cockpit. Waiting for the next painted frame makes focus
 * restoration deterministic instead of focusing a node that the same render immediately removes.
 * @param {() => HTMLElement | null} resolveTarget
 */
function focusAfterTacticalRender(resolveTarget) {
  globalThis.requestAnimationFrame(() => {
    globalThis.requestAnimationFrame(() => {
      const target = resolveTarget();
      if (target === null || !target.isConnected || target.closest("[inert]") !== null) return;
      target.focus({ preventScroll: true });
    });
  });
}

/**
 * Resolve the current Preview as an explicit hold. This keeps the action receipt, field target,
 * and network timeout in one lifecycle instead of leaving a stale "preparing attack" line behind.
 * @param {string | null=} targetRef
 */
function holdCombatPreview(targetRef = null) {
  if (lastPreviewContext === null) return false;
  if (targetRef !== null && lastPreviewContext.target !== targetRef) return false;
  dismissedCombatPreviewLease = lastPreviewContext.combatLease;
  tacticalArenaPreviewRetryEligibleLease = null;
  tacticalArenaPreviewRetriedLease = null;
  updatePreviewLog(lastPreviewContext.requestId, {
    status: "resolved",
    label: t("action.status.held"),
  });
  globalThis.clearTimeout(previewTimeoutTimer);
  lastPreview = null;
  lastPreviewContext = null;
  autoCombatPreview = false;
  return true;
}

/** @param {_PlayerView} current @param {boolean=} dismissEncounter */
function clearTacticalTarget(current, dismissEncounter = false) {
  const targetRef = tacticalArenaTargetRef;
  if (dismissEncounter) {
    tacticalArenaDismissedEncounterId = current.encounterPrompt?.encounterId ?? null;
  }
  if (targetRef !== null) holdCombatPreview(targetRef);
  if (tacticalArenaAimTargetRef === targetRef) tacticalArenaAimTargetRef = null;
  if (combatTargetRef === targetRef) combatTargetRef = null;
  tacticalArenaTargetRef = null;
  tacticalArenaPreviewScheduledLease = null;
  tacticalArenaPreviewRetryEligibleLease = null;
  tacticalArenaPreviewRetriedLease = null;
}

/**
 * Encounter targets are temporary recommendations, not durable manual selections. When the
 * prompt resolves or is replaced, clear only a target that belonged to that prompt; a player who
 * manually selected some other visible contact keeps that choice.
 * @param {import("@darkforest/protocol").PlayerView["encounterPrompt"]} prompt
 */
function clearEncounterOwnedTacticalSelection(prompt) {
  const targetRef = tacticalArenaTargetRef;
  if (prompt === undefined || targetRef === null || !prompt.targetRefs.includes(targetRef)) {
    return false;
  }
  tacticalArenaTargetRef = null;
  if (tacticalArenaAimTargetRef === targetRef) tacticalArenaAimTargetRef = null;
  if (combatTargetRef === targetRef) combatTargetRef = null;
  if (lastPreviewContext?.target === targetRef) {
    updatePreviewLog(lastPreviewContext.requestId, {
      status: "resolved",
      label: t("action.status.target_left"),
    });
    globalThis.clearTimeout(previewTimeoutTimer);
    lastPreview = null;
    lastPreviewContext = null;
    autoCombatPreview = false;
  }
  dismissedCombatPreviewLease = null;
  tacticalArenaPreviewScheduledLease = null;
  tacticalArenaPreviewRetryEligibleLease = null;
  tacticalArenaPreviewRetriedLease = null;
  return true;
}

/** Drop local lower-priority choices when an authoritative terminal/forced state takes over. */
function clearLowerPriorityInteractionState() {
  holdCombatPreview();
  closeTacticalSideDetail();
  tacticalSurfaceReturnElement = null;
  tacticalArenaTargetRef = null;
  tacticalArenaAimTargetRef = null;
  combatTargetRef = null;
  narrativePendingDecision = null;
  narrativePendingDecisionOrigin = null;
  narrativeResetDecisionPending = false;
  narrativeMovementChoice = null;
  narrativeRouteMenuOpen = false;
  narrativeCacheDecisionOpen = false;
  narrativeCacheOffer = null;
  narrativeCacheWanted = null;
  narrativeCommanderMenuOpen = false;
  dismissedCombatPreviewLease = null;
  tacticalArenaPreviewScheduledLease = null;
  tacticalArenaPreviewRetryEligibleLease = null;
  tacticalArenaPreviewRetriedLease = null;
  manualActionDrawer.open = false;
  combatPanel.classList.remove("is-mobile-expanded");
  mobileCombatToggle.setAttribute("aria-expanded", "false");
}

/** @param {_PlayerView} current */
function tacticalArenaCanShowField(current) {
  return tacticalArenaFieldAvailable({
    enabled: arenaExperimentRequested,
    phase: current.phase,
    status: current.self.status,
  });
}

/**
 * The same field tab doubles as an explicit "back" control whenever a detail
 * sheet or the command tray covers the scene. This avoids relying on players
 * knowing which hidden drawer they opened.
 */
function syncTacticalSurfaceSwitchLabels() {
  if (view === null) return;
  const fieldVisible = tacticalArenaFieldOwnsContacts(view);
  const fieldIsPrimary = fieldVisible && !narrativeActionExpanded &&
    !matchView.classList.contains("tactical-side-detail-open");
  document.querySelectorAll("[data-arena-surface]").forEach((element) => {
    if (!(element instanceof HTMLButtonElement)) return;
    const surface = element.dataset.arenaSurface;
    const key = surface === "field"
      ? fieldIsPrimary ? "arena.switch.field" : "arena.switch.toField"
      : fieldVisible
      ? "arena.switch.toLog"
      : "arena.switch.log";
    const label = element.querySelector("[data-arena-switch-label]");
    if (label instanceof HTMLElement) label.textContent = t(key);
    element.setAttribute("aria-label", t(key));
  });
}

/** @param {_PlayerView} current */
function tacticalSessionActive(current) {
  const activePhase = current.phase === "megacity" || current.phase === "darkforest";
  return arenaExperimentRequested && (activePhase || current.phase === "reset") &&
    current.self.status !== "eliminated";
}

/**
 * Project the one surface allowed to own primary actions. Reset is included as a forced visual
 * state even when no Legacy/Insight prompt exists; its existing cinematic remains the sole owner
 * and the generic action tray must stay closed.
 * @param {_PlayerView} current
 */
function gameplayForeground(current) {
  return projectForegroundSurface({
    terminal: current.phase === "ended" || current.self.status === "eliminated",
    forced: current.phase === "reset" || current.legacyPrompt !== undefined ||
      current.insightPrompt !== undefined || finaleRequiresInput(current) ||
      (finaleEntryAvailableNow(current) && current.encounterPrompt === undefined) ||
      current.self.status === "downed",
    confirm: narrativePendingDecision !== null,
    encounter: current.encounterPrompt !== undefined ||
      tacticalArenaTargetRef !== null &&
        current.visiblePlayers.some((player) => player.ref === tacticalArenaTargetRef) ||
      lastPreviewContext !== null,
    contextual: narrativeMovementChoice !== null || narrativeRouteMenuOpen ||
      narrativeCacheDecisionOpen || current.self.casting !== undefined ||
      pendingCommandActions.size > 0,
  });
}

/** Encounters stay in the field; only decisions not yet represented there may summon the tray. */
/** @param {_PlayerView} current */
function forcedNarrativeActionSignature(current) {
  if (current.legacyPrompt !== undefined) return `legacy:${current.legacyPrompt.deadlineMs}`;
  if (current.insightPrompt !== undefined) return `insight:${current.insightPrompt.deadlineMs}`;
  if (finaleRequiresInput(current)) {
    return `finale:${current.finale?.mode}:${current.finale?.stage}:${current.finale?.deadlineMs}`;
  }
  if (finaleEntryAvailableNow(current) && current.encounterPrompt === undefined) {
    return `finale-entry:${current.self.node}`;
  }
  if (current.self.status === "downed") return `downed:${current.self.downedUntilMs ?? 0}`;
  if (current.phase === "ended") return "ended";
  return null;
}

/** @param {_PlayerView} current */
function syncNarrativeActionDisclosure(current) {
  const signature = forcedNarrativeActionSignature(current);
  const foreground = gameplayForeground(current);
  if (
    signature === null &&
    (foreground.kind === "terminal" || foreground.kind === "forced")
  ) {
    closeTacticalSideDetail();
    tacticalSurfaceReturnElement = null;
    narrativeActionAutoOpened = false;
    setNarrativeActionExpanded(false);
    lastForcedNarrativeActionSignature = null;
    return;
  }
  if (signature !== null && signature !== lastForcedNarrativeActionSignature) {
    narrativeActionAutoOpened = true;
    closeTacticalSideDetail();
    setNarrativeActionExpanded(true);
    queueMicrotask(() => {
      const decision = narrativeActionColumn.querySelector(
        "#narrative-decision-card button:not(:disabled), #narrative-decision-card input:not(:disabled)",
      );
      const destination = decision instanceof HTMLElement ? decision : narrativeModeHeading;
      // A forced choice may begin below the fold on a short landscape phone. Let native focus
      // reveal the first legal control inside the action column instead of focusing it invisibly.
      destination.focus();
    });
  } else if (
    signature === null && lastForcedNarrativeActionSignature !== null &&
    narrativeActionAutoOpened && tacticalArenaFieldOwnsContacts(current)
  ) {
    narrativeActionAutoOpened = false;
    setNarrativeActionExpanded(false);
  }
  lastForcedNarrativeActionSignature = signature;
}

narrativeActionToggle.addEventListener("click", () => {
  narrativeActionAutoOpened = false;
  setNarrativeActionExpanded(!narrativeActionExpanded);
  if (narrativeActionExpanded) {
    queueMicrotask(() => narrativeModeHeading.focus({ preventScroll: true }));
  }
});
setNarrativeActionExpanded(false);

function mountPromoVideo() {
  if (PROMO_VIDEO_EMBED_URL === "") return;
  if (promoVideoFrame.querySelector("iframe") !== null) return;
  const iframe = document.createElement("iframe");
  iframe.src = PROMO_VIDEO_EMBED_URL;
  iframe.title = t("lobby.promo.videoTitle");
  iframe.allow = "autoplay; encrypted-media; picture-in-picture; web-share";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.allowFullscreen = true;
  promoVideoFrame.replaceChildren(iframe);
}

function unmountPromoVideo() {
  promoVideoFrame.replaceChildren();
}

const EQUIPMENT_SLOT_GLYPHS = /** @type {const} */ ({
  helmet: "◒",
  jacket: "▱",
  pants: "⋔",
  gloves: "◇",
  shoes: "⌁",
  backpack: "▣",
});

/** Slot labels are read lazily so a locale switch needs no rebuild; glyphs are locale-free. */
const EQUIPMENT_SLOT_UI = Object.fromEntries(
  Object.entries(EQUIPMENT_SLOT_GLYPHS).map(([slot, glyph]) => [slot, {
    glyph,
    get label() {
      return t(`action.slot.${slot}`);
    },
  }]),
);

/** NodeView.caches 是持續真值；fixture 只推事件時保留事件作相容 fallback。 @param {_PlayerView} current */
function visibleCacheOffers(current) {
  const fromNode = nodeCacheOffers(current);
  if (fromNode.length > 0) return fromNode;
  return narrativeCacheOffer !== null && narrativeCacheOffer.node === current.self.node
    ? [narrativeCacheOffer]
    : [];
}

/**
 * Cache priority can expire without a diff. A compact signature lets the 250 ms timer wake the
 * relevant narrative surfaces exactly once at that boundary instead of repainting every tick.
 * @param {_PlayerView} current
 * @param {number} gameNowMs
 */
function cachePrioritySignature(current, gameNowMs) {
  return visibleCacheOffers(current).map((cache) =>
    `${cache.cacheId}:${
      cachePriorityState(
        cache.priorityFor,
        cache.untilMs,
        current.self.playerId,
        gameNowMs,
      )
    }`
  ).sort().join("|");
}

/** @param {import("@darkforest/protocol").ActionType} action @param {_PlayerView} current */
function actionCooldownMarkup(action, current) {
  const deadline = current.self.cooldownsUntilMs[action];
  if (deadline === undefined || deadline <= estimatedGameNowMs()) return "";
  return `<span class="inline-cooldown" aria-label="${
    escapeHtml(t("hud.cooldown.aria"))
  }"><em data-deadline-ms="${deadline}"></em><i class="cooldown-ring" aria-hidden="true"></i></span>`;
}

/** @param {_MatchEvent[]} events */
function stageCombatVisualEffects(events) {
  const effects = events.filter((event) => event.kind === "combat").map((event) =>
    event.kind === "combat"
      ? {
        target: event.target,
        sourceNode: event.sourceNode,
        targetNode: event.targetNode,
        hit: event.hit,
        damage: event.damage,
      }
      : null
  ).filter((effect) => effect !== null);
  if (effects.length === 0) return;
  combatVisualEffects = effects;
  globalThis.clearTimeout(combatVisualTimer);
  combatVisualTimer = globalThis.setTimeout(() => {
    combatVisualEffects = [];
    if (view !== null) {
      const spectator = view.self.status === "eliminated";
      renderMap(view, spectator);
      if (!spectator) renderPlayer(view);
    }
  }, 1_400);
}

/** @param {_MatchEvent[]} events @param {_PlayerView} current */
function stageArmorBreakEffects(events, current) {
  const broken = events.filter((event) => event.kind === "armor_broken");
  if (broken.length === 0) return;
  broken.forEach((event) => {
    if (event.kind !== "armor_broken") return;
    armorBreakingPlayers.add(event.player);
    if (event.player === current.self.playerId) {
      armorBreakingSlot = equipmentSlotForItem(event.item);
    }
  });
  globalThis.clearTimeout(armorBreakTimer);
  armorBreakTimer = globalThis.setTimeout(() => {
    armorBreakingSlot = null;
    armorBreakingPlayers.clear();
    if (view !== null) {
      const spectator = view.self.status === "eliminated";
      renderMap(view, spectator);
      if (!spectator) renderPlayer(view);
    }
  }, 1_400);
}

/** @param {_PlayerView} previous @param {_PlayerView} current */
function stageRecognitionTransitions(previous, current) {
  const recognized = current.visiblePlayers.flatMap((player) => {
    if (
      !player.identified || player.playerId === undefined || player.contactRef === undefined ||
      !previous.visiblePlayers.some((candidate) =>
        !candidate.identified && candidate.ref === player.contactRef
      )
    ) return [];
    return [{ contactRef: player.contactRef, playerId: player.playerId, node: player.node }];
  });
  if (recognized.length === 0) return;
  recognitionTransitions = recognized;
  const selectedRecognition = recognized.find((entry) => entry.contactRef === combatTargetRef);
  if (selectedRecognition !== undefined) {
    combatTargetRef = selectedRecognition.playerId;
    lastPreview = null;
    lastPreviewContext = null;
  }
  globalThis.clearTimeout(recognitionTransitionTimer);
  recognitionTransitionTimer = globalThis.setTimeout(() => {
    recognitionTransitions = [];
    if (view !== null) {
      const spectator = view.self.status === "eliminated";
      renderMap(view, spectator);
      if (!spectator) renderCombat(view);
    }
  }, 1_600);
}

/**
 * The pill keeps its catalog key rather than the resolved string so a locale switch can
 * re-resolve it — the lobby has no full re-render to fall back on.
 * @param {"idle" | "checking" | "ready" | "connecting" | "connected" | "disconnected" | "error"} status
 * @param {string} labelKey
 */
function setConnection(status, labelKey) {
  connectionStatusKey = labelKey;
  connectionPill.className = `connection-pill connection-${status}`;
  connectionPill.dataset.i18nTitle = labelKey;
  connectionPill.title = t(labelKey);
  connectionLabel.textContent = t(labelKey);
}

function renderIdleConnectionStatus() {
  if (
    connectionSurface !== "service" || connectionStarting || socket !== null ||
    queueSocket !== null
  ) return;
  if (matchServiceAvailability === "ready") {
    setConnection("ready", "lobby.connection.ready");
    return;
  }
  if (matchServiceAvailability === "unavailable") {
    setConnection("error", "lobby.connection.unavailable");
    return;
  }
  setConnection("checking", "lobby.connection.checking");
}

/**
 * Check the passive HTTP endpoint rather than opening a WebSocket: merely viewing the lobby must
 * not reserve a player seat or create a spectator session.
 */
async function refreshMatchServiceAvailability() {
  const requestSequence = ++matchHealthRequestSequence;
  matchServiceAvailability = "checking";
  renderIdleConnectionStatus();
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 4_000);
  /** @type {"ready" | "unavailable"} */
  let nextAvailability = "unavailable";
  try {
    const response = await fetch("/api/v1/match-health", {
      cache: "no-store",
      credentials: "omit",
      signal: controller.signal,
    });
    const payload = response.ok ? await response.json() : null;
    nextAvailability = fixtureHealthReportsReady(response.ok, payload) ? "ready" : "unavailable";
  } catch {
    // Timeout, network, and CORS failures share the same small player-facing unavailable state.
  } finally {
    globalThis.clearTimeout(timeout);
    if (requestSequence === matchHealthRequestSequence) {
      matchServiceAvailability = nextAvailability;
      renderIdleConnectionStatus();
    }
  }
}

/** @param {string} message */
function announce(message) {
  systemNotice.textContent = message;
}

function renderDebugOutput() {
  const snapshot = {
    socketReadyState: socket?.readyState ?? null,
    activeFixture,
    stateVersion: view?.stateVersion ?? null,
    gameNowMs: view?.gameNowMs ?? null,
    lastActionFeedback,
  };
  debugOutput.textContent = `${debugEntries.join("\n")}\n\nCURRENT\n${
    JSON.stringify(snapshot, null, 2)
  }`.trim();
}

/** 技術訊息只寫入設定內預設關閉的除錯抽屜。 @param {string} message */
function recordDebug(message) {
  const stamp = new Date().toISOString().slice(11, 23);
  const bounded = message.length > 2_000 ? `${message.slice(0, 2_000)}…[truncated]` : message;
  debugEntries = [...debugEntries, `[${stamp}] ${bounded}`].slice(-80);
  renderDebugOutput();
}

/** @param {_NarrativeEntry} entry */
function triggerFatalNarrativeBanner(entry) {
  globalThis.clearTimeout(fatalBannerTimer);
  fatalNarrativeBanner.hidden = false;
  fatalNarrativeBanner.className =
    `narrative-fatal-banner narrative-critical-notice narrative-level-${entry.level}`;
  fatalNarrativeBanner.innerHTML =
    `<span class="critical-notice-mark" aria-hidden="true">!</span><span><time>[${
      formatNarrativeTimestamp(entry.atGameMs)
    }]</time><strong>${escapeHtml(entry.text)}</strong></span>`;
  fatalBannerTimer = globalThis.setTimeout(() => {
    fatalNarrativeBanner.hidden = true;
    fatalNarrativeBanner.textContent = "";
  }, 5_200);
}

/** @param {{kind: "victory" | "downed", text: string}} notice */
function triggerPlayerQuoteNotice(notice) {
  globalThis.clearTimeout(playerQuoteNoticeTimer);
  playerQuoteNotice.hidden = false;
  playerQuoteNotice.dataset.kind = notice.kind;
  playerQuoteNotice.replaceChildren();
  const label = document.createElement("small");
  label.textContent = notice.kind === "victory"
    ? t("lobby.profile.victoryQuote")
    : t("lobby.profile.downedQuote");
  const quote = document.createElement("strong");
  quote.textContent = notice.text;
  playerQuoteNotice.append(label, quote);
  playerQuoteNoticeTimer = globalThis.setTimeout(() => {
    playerQuoteNotice.hidden = true;
    playerQuoteNotice.textContent = "";
    delete playerQuoteNotice.dataset.kind;
  }, 3_200);
}

/**
 * 玩家標語是本機 presentation，不能進 canonical Log 或旁觀者廣播。
 * 自己倒地（含 Echo）優先，避免同一批擊倒與倒地相撞時誤把勝利句蓋過危機訊息。
 * @param {_MatchEvent[]} events
 * @param {string} selfPlayerId
 * @returns {{kind: "victory" | "downed", text: string} | null}
 */
function playerQuoteNoticeFromEvents(events, selfPlayerId) {
  const quotes = activeProfileQuotes(connectedProfile);
  const selfTerminal = events.find((event) =>
    (event.kind === "player_downed" || event.kind === "player_echoed") &&
    event.player === selfPlayerId && event.by !== undefined
  );
  if (selfTerminal !== undefined && quotes.downedQuote !== "") {
    return { kind: "downed", text: quotes.downedQuote };
  }
  const terminalBySelf = events.find((event) =>
    (event.kind === "player_downed" || event.kind === "player_echoed") &&
    event.player !== selfPlayerId && event.by === selfPlayerId
  );
  return terminalBySelf === undefined || quotes.victoryQuote === ""
    ? null
    : { kind: "victory", text: quotes.victoryQuote };
}

/** @param {_NarrativeEntry[]} incoming */
function appendNarrative(incoming) {
  narrativeEntries = appendNarrativeEntries(narrativeEntries, incoming);
  const fatal = incoming.findLast((entry) => entry.fatal);
  if (fatal !== undefined) triggerFatalNarrativeBanner(fatal);
  const announced = fatal ?? incoming.at(-1);
  if (announced !== undefined) {
    unifiedLogAnnouncer.setAttribute(
      "aria-live",
      announced.fatal || announced.status === "rejected" ? "assertive" : "polite",
    );
    unifiedLogAnnouncer.textContent = t("hud.announcer.line", {
      speaker: announced.speaker ?? announced.label ?? t("hud.announcer.speaker"),
      text: announced.text,
    });
  }
}

/** @param {_PlayerView} current */
function renderEchoOraclePanel(current) {
  const presentation = { status: current.self.status, phase: current.phase };
  const availability = echoOracleAvailability(
    presentation,
    echoOracleState,
    estimatedGameNowMs(),
  );
  const renderKey = echoOracleRenderKey(presentation, echoOracleState, getLocale());
  echoOraclePanel.hidden = availability === "hidden";
  if (availability === "hidden") {
    echoOracleRenderedKey = renderKey;
    return;
  }
  if (renderKey !== echoOracleRenderedKey) {
    echoOraclePanel.innerHTML = echoOracleMarkup(
      echoOracleState,
      presentation,
      estimatedGameNowMs(),
      t,
    );
    echoOracleRenderedKey = renderKey;
  }
  patchEchoOraclePanel(
    echoOraclePanel,
    echoOracleState,
    presentation,
    estimatedGameNowMs(),
    t,
  );
}

function syncEchoOracleDraftControls() {
  const input = echoOraclePanel.querySelector("#echo-oracle-input");
  if (!(input instanceof HTMLTextAreaElement)) return;
  const clipped = clipOracleDraft(input.value);
  if (clipped !== input.value) input.value = clipped;
  echoOracleState.draft = clipped;
  const count = echoOraclePanel.querySelector("[data-oracle-count]");
  if (count instanceof HTMLElement) {
    count.textContent = t("arbora.panel.characters", {
      count: oracleCodePointLength(clipped),
      max: ECHO_ORACLE_MAX_CODEPOINTS,
    });
  }
  if (view !== null) {
    patchEchoOraclePanel(
      echoOraclePanel,
      echoOracleState,
      { status: view.self.status, phase: view.phase },
      estimatedGameNowMs(),
      t,
    );
  }
}

/** @param {import("@darkforest/protocol").ArboraRejectReason} reason @param {string} requestId */
function appendLocalArboraRejection(reason, requestId) {
  appendNarrative([
    arboraRejectNarrativeEntry(
      {
        type: "arbora_reject",
        requestId,
        reason,
        remainingQuestions: echoOracleState.remainingQuestions,
      },
      estimatedGameNowMs(),
      t,
    ),
  ]);
  if (view !== null) renderNarrativeStory(view);
}

function submitEchoOracleQuestion() {
  if (view === null) return;
  const presentation = { status: view.self.status, phase: view.phase };
  if (
    echoOracleAvailability(presentation, echoOracleState, estimatedGameNowMs()) !== "ready"
  ) return;
  const input = echoOraclePanel.querySelector("#echo-oracle-input");
  if (!(input instanceof HTMLTextAreaElement)) return;
  const question = normalizeOracleQuestion(input.value);
  const requestId = crypto.randomUUID();
  if (!question.valid) {
    input.setAttribute("aria-invalid", "true");
    appendLocalArboraRejection(question.empty ? "EMPTY" : "TOO_LONG", requestId);
    announce(question.empty ? t("arbora.reject.empty") : t("arbora.reject.too_long"));
    return;
  }
  input.removeAttribute("aria-invalid");
  const message = /** @type {_ArboraAskMsg} */ ({
    type: "arbora_ask",
    requestId,
    text: question.text,
    locale: protocolLocaleForUi(getLocale()),
  });
  if (!send(message)) {
    appendLocalArboraRejection("UNAVAILABLE", requestId);
    return;
  }
  echoOracleState = beginArboraRequest(echoOracleState, requestId);
  appendNarrative([
    arboraWaitingNarrativeEntry(requestId, question.text, estimatedGameNowMs(), t),
  ]);
  renderEchoOraclePanel(view);
  renderNarrativeStory(view);
}

echoOraclePanel.addEventListener("input", (event) => {
  if (event.target instanceof HTMLTextAreaElement && event.target.id === "echo-oracle-input") {
    syncEchoOracleDraftControls();
  }
});
echoOraclePanel.addEventListener("click", (event) => {
  const button = event.target instanceof Element
    ? event.target.closest("[data-oracle-suggestion]")
    : null;
  if (!(button instanceof HTMLButtonElement) || button.disabled) return;
  const suggestion = button.dataset.oracleSuggestion;
  if (!(["hotspot", "movement", "memory"].includes(suggestion ?? ""))) return;
  const input = echoOraclePanel.querySelector("#echo-oracle-input");
  if (!(input instanceof HTMLTextAreaElement)) return;
  input.value = t(`arbora.suggestion.${suggestion}`);
  syncEchoOracleDraftControls();
  input.focus({ preventScroll: true });
});
echoOraclePanel.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-oracle-form]")) {
    return;
  }
  event.preventDefault();
  submitEchoOracleQuestion();
});

/** @typedef {"idle" | "connecting" | "seated" | "spectator-connecting" | "spectator-waiting"} _LobbyEntryStage */

/** @param {boolean} locked @param {_LobbyEntryStage=} stage */
function setJoinControlsLocked(locked, stage = locked ? "connecting" : "idle") {
  wsUrlInput.disabled = locked;
  modeSelect.disabled = locked;
  fixtureInput.disabled = locked;
  setProfileFieldsDisabled(locked);
  spectateButton.disabled = true;
  joinButton.disabled = locked;
  joinLiveButton.disabled = locked;
  // 下一次 renderLiveJoinOption 必須重新判斷可見性,不能被上一輪的 signature 擋掉。
  liveJoinSignature = "";
  joinButton.innerHTML = joinButtonMarkup(stage);
  spectateButton.innerHTML = spectateButtonMarkup(stage);
}

/** @param {number} seated @param {number} capacity */
function renderLobbySeats(seated, capacity) {
  const safeCapacity = Math.max(0, Math.min(24, Math.floor(capacity)));
  const safeSeated = Math.max(0, Math.min(safeCapacity, Math.floor(seated)));
  lobbySeatGrid.innerHTML = Array.from({ length: 24 }, (_, index) => {
    const inCapacity = index < safeCapacity;
    const filled = index < safeSeated;
    const seatKey = filled
      ? "lobby.seat.filled"
      : inCapacity
      ? "lobby.seat.waiting"
      : "lobby.seat.outOfCapacity";
    return `<li class="seat ${filled ? "seat-filled" : "seat-pending"}" aria-label="${
      escapeHtml(t(seatKey, { index: index + 1 }))
    }">
      <span>SEAT ${String(index + 1).padStart(2, "0")}</span>
      <strong>${filled ? "SEATED" : inCapacity ? "WAITING" : "N/A"}</strong>
    </li>`;
  }).join("");
  lobbySeatGrid.hidden = false;
}

function updatePrejoinShiftPreview() {
  if (localInstantStart) {
    lobbyPrejoinBrief.hidden = true;
    return;
  }
  const nowMs = Date.now();
  const preview = scheduledLobbyPreview(nowMs);
  const signature = `${getLocale()}|${Math.ceil(preview.remainingMs / 1000)}|${preview.stage}`;
  if (signature === prejoinShiftSignature) return;
  prejoinShiftSignature = signature;
  const localTime = new Intl.DateTimeFormat(getLocale(), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const departureLabel = localTime.format(preview.departureAtMs);
  const departureDateTime = new Date(preview.departureAtMs).toISOString();
  const remainingLabel = formatDuration(preview.remainingMs);
  lobbyHeroNextShift.textContent = departureLabel;
  lobbyHeroNextShift.dateTime = departureDateTime;
  lobbyHeroCountdown.textContent = remainingLabel;
  lobbyHeroCountdown.dataset.stage = preview.stage;
  lobbyPrejoinNextShift.textContent = departureLabel;
  lobbyPrejoinNextShift.dateTime = departureDateTime;
  lobbyPrejoinCountdown.textContent = remainingLabel;
  lobbyPrejoinCountdown.dataset.expired = "false";
  lobbyPrejoinAssembly.textContent = t(`lobby.prejoin.status.${preview.stage}`, {
    time: localTime.format(preview.assemblyAtMs),
  });
  lobbyPrejoinAssembly.dataset.stage = preview.stage;
}

function renderLiveJoinOption() {
  const signature = `${getLocale()}|local-fixtures-only`;
  if (signature === liveJoinSignature) return;
  liveJoinSignature = signature;
  joinLiveButton.hidden = true;
  joinLiveButton.disabled = true;
  joinLiveDetail.textContent = "";
}

function updateLobbyTimer() {
  if (lobbyMessage === null) return;
  const elapsed = Math.max(0, performance.now() - lobbyMessageReceivedAtRealMs);
  const remaining = Math.max(0, lobbyMessage.startsInMs - elapsed);
  lobbyCountdown.textContent = formatDuration(remaining);
  lobbyCountdown.dataset.expired = remaining <= 0 ? "true" : "false";
  const stage = remaining <= 60_000
    ? "imminent"
    : remaining <= 5 * 60_000
    ? "gathering"
    : "not_gathering";
  const localTime = new Intl.DateTimeFormat(getLocale(), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const departureAt = Date.now() + remaining;
  lobbyNextShift.textContent = localTime.format(departureAt);
  lobbyShiftStatus.textContent = t(`lobby.shift.status.${stage}`, {
    time: localTime.format(departureAt - 5 * 60_000),
  });
  lobbyShiftStatus.dataset.stage = stage;
}

function queueRemainingMs() {
  if (queueMessage === null) return 0;
  return Math.max(0, queueMessage.startsInMs - (performance.now() - queueMessageReceivedAtRealMs));
}

/** 候車資料只更新小卡；觀戰的 view 仍由主 socket 獨占。 */
function renderQueueDock() {
  const reserved = queueSocket !== null && queueMessage !== null;
  nextShiftDock.hidden = !reserved;
  if (!reserved || queueMessage === null) return;
  nextShiftDockCountdown.textContent = formatDuration(queueRemainingMs());
  nextShiftDockSeated.textContent = t("lobby.queueDock.seated", {
    seated: queueMessage.seated,
    capacity: queueMessage.capacity,
  });
  const watching = socket !== null && socket !== queueSocket;
  nextShiftWatchButton.hidden = watching;
  nextShiftStopWatchButton.hidden = !watching;
}

/** 在延遲觀戰尚未開畫面前，仍可在大廳讀到已保留席位的權威資料。 */
function renderQueueLobbyStatus() {
  if (queueMessage === null) return;
  lobbyMessage = queueMessage;
  lobbyMessageReceivedAtRealMs = queueMessageReceivedAtRealMs;
  lobbyServerState.hidden = false;
  lobbyMatchId.textContent = queueMessage.matchId;
  lobbySeatedCount.textContent = String(queueMessage.seated);
  lobbyCapacityCount.textContent = String(queueMessage.capacity);
  lobbyBotFillCount.textContent = String(Math.max(0, queueMessage.capacity - queueMessage.seated));
  lobbyCapacityBadge.textContent = `SEATED ${queueMessage.seated} / ${queueMessage.capacity}`;
  renderLobbySeats(queueMessage.seated, queueMessage.capacity);
  updateLobbyTimer();
}

function updateSpectatorWarmupTimer() {
  if (spectatorWarmupState === null) return;
  if (spectatorWarmupState.remainingMs === null) {
    spectatorWarmupCopy.textContent = t("spectate.warmup.pending");
    return;
  }
  const remaining = Math.max(
    0,
    spectatorWarmupState.remainingMs -
      (performance.now() - spectatorWarmupState.receivedAtRealMs),
  );
  spectatorWarmupCopy.textContent = remaining > 0
    ? `${formatSpectatorWarmup(remaining)} · ${t("lobby.spectate.waitingDetail")}`
    : t("spectate.warmup.ready");
}

/** @param {_SpectatorWaitingMsg} message */
function renderSpectatorWaiting(message) {
  view = null;
  progressionProjection = null;
  lobbyMessage = null;
  matchView.hidden = true;
  lobbyView.hidden = false;
  lobbyServerState.hidden = queueMessage === null;
  lobbySeatGrid.hidden = queueMessage === null;
  spectatorWarmup.hidden = false;
  spectatorWarmupState = {
    remainingMs: message.readyInMs,
    receivedAtRealMs: performance.now(),
  };
  lobbyCapacityBadge.textContent = "OBSERVER · 60S DELAY";
  lobbySectionNote.textContent = message.matchId === null
    ? t("spectate.entry.idle")
    : t("spectate.entry.connecting", { matchId: message.matchId });
  setJoinControlsLocked(true, "spectator-waiting");
  if (queueMessage !== null) renderQueueLobbyStatus();
  renderQueueDock();
  updateSpectatorWarmupTimer();
}

/** @param {_LobbyMsg} message */
function renderLobbyMessage(message) {
  lobbyMessage = message;
  spectatorWarmupState = null;
  spectatorWarmup.hidden = true;
  lobbyMessageReceivedAtRealMs = performance.now();
  view = null;
  progressionProjection = null;
  matchView.hidden = true;
  lobbyView.hidden = false;
  lobbyServerState.hidden = false;
  lobbyMatchId.textContent = message.matchId;
  lobbySeatedCount.textContent = String(message.seated);
  lobbyCapacityCount.textContent = String(message.capacity);
  lobbyBotFillCount.textContent = String(Math.max(0, message.capacity - message.seated));
  lobbyCapacityBadge.textContent = `SEATED ${message.seated} / ${message.capacity}`;
  lobbySectionNote.textContent = t("lobby.shift.liveNote");
  renderLobbySeats(message.seated, message.capacity);
  setJoinControlsLocked(true, "seated");
  updateLobbyTimer();
  renderQueueDock();
}

function resetLobbyPresentation() {
  lobbyMessage = null;
  spectatorWarmupState = null;
  spectatorWarmup.hidden = true;
  lobbyServerState.hidden = true;
  lobbyCapacityBadge.textContent = "LOCAL FIXTURE";
  lobbySectionNote.textContent = t("lobby.shift.idleNote");
  lobbySeatGrid.hidden = true;
  setJoinControlsLocked(false, "idle");
  renderQueueDock();
}

function loadEchoJitHistory() {
  try {
    return normalizeEchoJitHistory(
      JSON.parse(globalThis.sessionStorage.getItem(ECHO_JIT_HISTORY_KEY) ?? "[]"),
    );
  } catch {
    // Storage can be unavailable in private contexts; the bounded in-memory history still works.
    return [];
  }
}

function saveEchoJitHistory() {
  try {
    globalThis.sessionStorage.setItem(ECHO_JIT_HISTORY_KEY, JSON.stringify(echoJitSeenMatches));
  } catch {
    // The guide remains once-per-match for the lifetime of this page without persistent storage.
  }
}

function loadAssistPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem("darkforest-assist-v1") ?? "{}");
    const intents = new Set(["hold", "survive", "scavenge", "conceal", "travel", "echo_intel"]);
    if (typeof stored.intent === "string" && intents.has(stored.intent)) {
      assistIntent = /** @type {_AssistIntent} */ (stored.intent);
    }
    if (["avoid", "retaliate", "hunt"].includes(stored.engagementPolicy)) {
      engagementPolicy = /** @type {typeof engagementPolicy} */ (stored.engagementPolicy);
    }
    if (typeof stored.destination === "string" && stored.destination.trim() !== "") {
      assistDestination = /** @type {import("@darkforest/protocol").NodeId} */ (stored.destination);
    }
  } catch {
    // Local preference is optional. SEMI is intentionally never restored across reloads.
  }
}

function saveAssistPreferences() {
  try {
    localStorage.setItem(
      "darkforest-assist-v1",
      JSON.stringify({
        intent: assistIntent,
        engagementPolicy,
        destination: assistDestination,
      }),
    );
  } catch {
    // Private browsing can reject storage; the current session still works.
  }
}

/** @param {_PlayerView} current @param {import("@darkforest/protocol").NodeId} nodeId @param {number=} horizonMs */
function nodeClosesSoon(current, nodeId, horizonMs = 60_000) {
  const gameNow = estimatedGameNowMs();
  return current.map.blockadeSchedule.some((entry) =>
    entry.node === nodeId && entry.closesAtMs > gameNow && entry.closesAtMs <= gameNow + horizonMs
  );
}

/** @param {_PlayerView} current @param {import("@darkforest/protocol").NodeId} target @param {boolean=} echo */
function firstRouteStep(current, target, echo = false) {
  const start = current.self.node;
  if (start === target) return null;
  /** @type {Array<{node: import("@darkforest/protocol").NodeId, first: import("@darkforest/protocol").NodeId | null}>} */
  const queue = [{ node: start, first: null }];
  const seen = new Set([start]);
  while (queue.length > 0) {
    const entry = queue.shift();
    if (entry === undefined) break;
    for (const neighbor of routeNeighbors(current, entry.node, echo)) {
      if (!echo && narrativeAvoidNodes.has(neighbor)) continue;
      if (seen.has(neighbor)) continue;
      const first = entry.first ?? neighbor;
      if (neighbor === target) return first;
      seen.add(neighbor);
      queue.push({ node: neighbor, first });
    }
  }
  return null;
}

/** @param {_PlayerView} current @param {import("@darkforest/protocol").ActionType} action */
function assistActionReady(current, action) {
  const deadline = current.self.cooldownsUntilMs[action];
  return deadline === undefined || deadline <= estimatedGameNowMs();
}

/** @param {_PlayerView} current @param {_ActionPayload} payload @param {string} title @param {string} detail */
function readyAssistDecision(current, payload, title, detail) {
  const safePayload = payload.action === "move" && payload.style === undefined
    ? /** @type {_ActionPayload} */ ({ ...payload, style: "sneak" })
    : payload;
  if (!assistActionReady(current, safePayload.action)) {
    const deadline = current.self.cooldownsUntilMs[safePayload.action] ?? estimatedGameNowMs();
    return /** @type {_AssistDecision} */ ({
      key: `cooldown-${safePayload.action}-${deadline}`,
      title: t("semi.cooldown.title", { title }),
      detail: t("semi.cooldown.detail", {
        remaining: formatDuration(deadline - estimatedGameNowMs()),
      }),
      state: "waiting",
    });
  }
  return /** @type {_AssistDecision} */ ({
    key: `${safePayload.action}-${JSON.stringify(safePayload)}`,
    title,
    detail,
    payload: safePayload,
    state: "ready",
  });
}

/** @param {_PlayerView} current */
function activeRecentHostileRefs(current) {
  const gameNow = estimatedGameNowMs();
  for (const [ref, expiresAtMs] of recentHostileUntilMs) {
    if (expiresAtMs <= gameNow) recentHostileUntilMs.delete(ref);
  }
  return visibleRecentHostileRefs(current.visiblePlayers, recentHostileUntilMs, gameNow);
}

/** @param {_PlayerView} current @param {_PlayerView["nodes"][number]} currentNode */
function avoidThreatDecision(current, currentNode) {
  const threat = current.visiblePlayers.find((player) => player.status === "active");
  if (engagementPolicy !== "avoid" || threat === undefined) return null;
  if (current.self.hidden) {
    return /** @type {_AssistDecision} */ ({
      key: "avoid-hidden",
      title: t("semi.avoid.hidden.title"),
      detail: t("semi.avoid.hidden.detail"),
      state: "waiting",
    });
  }
  if (currentNode.coverSlotsFree > 0) {
    return readyAssistDecision(
      current,
      { action: "hide" },
      t("action.name.hide"),
      t("semi.avoid.hide.detail"),
    );
  }
  const exit = routeNeighbors(current, current.self.node).map((id) =>
    current.nodes.find((node) => node.id === id)
  ).find((node) =>
    node !== undefined && node.open && node.knownHazards.length === 0 &&
    !nodeClosesSoon(current, node.id) &&
    !current.visiblePlayers.some((player) => player.node === node.id)
  );
  if (exit !== undefined) {
    return readyAssistDecision(
      current,
      { action: "move", to: exit.id, style: "sneak" },
      t("semi.avoid.sneak.title", { node: narrativeNodeName(current, exit.id) }),
      t("semi.avoid.sneak.detail"),
    );
  }
  return /** @type {_AssistDecision} */ ({
    key: "avoid-no-exit",
    title: t("semi.avoid.noExit.title"),
    detail: t("semi.avoid.noExit.detail"),
    state: "manual",
  });
}

/** @param {_PlayerView} current @returns {_AssistDecision} */
function getAssistDecision(current) {
  const finale = current.finale;
  if (
    finale !== undefined && finaleRequiresInput(current) && current.insightPrompt === undefined &&
    current.legacyPrompt === undefined
  ) {
    return /** @type {_AssistDecision} */ ({
      key: `finale-${finale.mode}-${finale.stage}`,
      title: t("semi.finale.title"),
      detail: t("semi.finale.detail"),
      state: "manual",
    });
  }
  if (current.insightPrompt !== undefined) {
    return /** @type {_AssistDecision} */ ({
      key: "insight-manual",
      title: t("semi.insight.title"),
      detail: t("semi.insight.detail"),
      state: "manual",
    });
  }
  if (current.legacyPrompt !== undefined) {
    return /** @type {_AssistDecision} */ ({
      key: "legacy-manual",
      title: t("semi.legacy.title"),
      detail: t("semi.legacy.detail"),
      state: "manual",
    });
  }
  if ((current.phase === "reset" && current.self.status !== "echo") || current.phase === "ended") {
    return /** @type {_AssistDecision} */ ({
      key: `phase-${current.phase}`,
      title: current.phase === "reset" ? t("semi.phase.reset.title") : t("semi.phase.ended.title"),
      detail: t("semi.phase.detail"),
      state: "blocked",
    });
  }
  if (current.self.status === "downed" || current.self.status === "eliminated") {
    return /** @type {_AssistDecision} */ ({
      key: `status-${current.self.status}`,
      title: current.self.status === "downed"
        ? t("semi.status.downed.title")
        : t("semi.status.eliminated.title"),
      detail: t("semi.status.detail"),
      state: "blocked",
    });
  }
  if (current.self.casting !== undefined) {
    return /** @type {_AssistDecision} */ ({
      key: `casting-${current.self.casting.completesAtMs}`,
      title: t(
        current.self.casting.item === "healthy_food" || current.self.casting.item === "spoiled_food"
          ? "semi.casting.eat.title"
          : "semi.casting.treat.title",
        { item: itemDisplayName(current.self.casting.item) },
      ),
      detail: t("semi.casting.detail"),
      state: "waiting",
    });
  }
  if (pendingCommandActions.size > 0) {
    return /** @type {_AssistDecision} */ ({
      key: "pending-command",
      title: "",
      detail: "",
      state: "waiting",
    });
  }
  if (assistBusyStateVersion === current.stateVersion) {
    return /** @type {_AssistDecision} */ ({
      key: `waiting-diff-${current.stateVersion}`,
      title: "",
      detail: "",
      state: "waiting",
    });
  }

  if (current.encounterPrompt !== undefined) {
    const step = encounterPolicyStep(
      current,
      engagementPolicy,
      activeRecentHostileRefs(current),
      lastPreview,
      lastPreviewContext,
    );
    if (step.kind === "continue") {
      return readyAssistDecision(
        current,
        step.payload,
        t("action.name.encounter_continue"),
        encounterPromptLine(current),
      );
    }
    if (step.kind === "observe" || step.kind === "none") {
      return /** @type {_AssistDecision} */ ({
        key: `encounter-observe-${current.encounterPrompt.encounterId}`,
        title: t("semi.encounter.observe.title"),
        detail: t("semi.encounter.observe.detail"),
        state: "waiting",
      });
    }
    if (step.kind === "preview") {
      if (!assistActionReady(current, "attack")) {
        const deadline = current.self.cooldownsUntilMs.attack ?? estimatedGameNowMs();
        return {
          key: `encounter-cooldown-${deadline}`,
          title: t("semi.breath.title"),
          detail: t("semi.breath.detail", {
            remaining: formatDuration(deadline - estimatedGameNowMs()),
          }),
          state: "waiting",
        };
      }
      return {
        key:
          `encounter-preview-${current.encounterPrompt.encounterId}-${step.target.ref}-${step.weapon}`,
        title: t("semi.engage.title"),
        detail: encounterPromptLine(current),
        preview: { target: step.target.ref, weapon: step.weapon },
        state: "ready",
      };
    }
    if (step.kind === "waiting") {
      return {
        key: `encounter-preview-wait-${current.encounterPrompt.encounterId}-${step.target.ref}`,
        title: t("semi.engage.title"),
        detail: encounterPromptLine(current),
        state: "waiting",
      };
    }
    if (step.kind === "blocked") {
      return {
        key: `encounter-blocked-${current.encounterPrompt.encounterId}`,
        title: t("semi.engage.blocked.title"),
        detail: step.reason,
        state: "manual",
      };
    }
    return readyAssistDecision(
      current,
      step.payload,
      t("semi.engage.title"),
      encounterPromptLine(current),
    );
  }

  if (finaleEntryAvailableNow(current)) {
    return /** @type {_AssistDecision} */ ({
      key: "finale-entry-manual",
      title: t("semi.finaleEntry.title"),
      detail: t("semi.finaleEntry.detail"),
      state: "manual",
    });
  }

  if (current.self.status === "echo") {
    if (assistIntent === "travel" && assistDestination !== null) {
      const step = firstRouteStep(current, assistDestination, true);
      if (step === null) {
        return {
          key: "echo-arrived",
          title: t("semi.echo.arrived.title"),
          detail: t("semi.echo.arrived.detail"),
          state: "waiting",
        };
      }
      return readyAssistDecision(
        current,
        { action: "echo_move", to: step },
        t("semi.echo.move.title", { node: narrativeNodeName(current, step) }),
        t("semi.echo.move.detail"),
      );
    }
    if (assistIntent === "echo_intel") {
      return readyAssistDecision(
        current,
        { action: "echo_attune" },
        t("situation.option.attune.label"),
        t("semi.echo.attune.detail", {
          intel: current.self.disasterIntel ?? 0,
          target: ECHO_TWO_INSIGHT_TARGET,
        }),
      );
    }
    return {
      key: "echo-needs-intent",
      title: t("semi.echo.needsIntent.title"),
      detail: t("semi.echo.needsIntent.detail"),
      state: "manual",
    };
  }

  const currentNode = current.nodes.find((node) => node.id === current.self.node);
  if (currentNode === undefined) {
    return {
      key: "missing-node",
      title: t("semi.missingNode.title"),
      detail: t("semi.missingNode.detail"),
      state: "blocked",
    };
  }

  if (nodeClosesSoon(current, current.self.node)) {
    const escapeNode = routeNeighbors(current, current.self.node).map((id) =>
      current.nodes.find((node) => node.id === id)
    ).find((node) =>
      node !== undefined && node.knownHazards.length === 0 && !nodeClosesSoon(current, node.id)
    );
    if (escapeNode !== undefined) {
      return readyAssistDecision(
        current,
        { action: "move", to: escapeNode.id },
        t("semi.blockade.escape.title", { node: narrativeNodeName(current, escapeNode.id) }),
        t("semi.blockade.escape.detail"),
      );
    }
    return {
      key: "no-safe-exit",
      title: t("semi.blockade.noExit.title"),
      detail: t("semi.blockade.noExit.detail"),
      state: "manual",
    };
  }

  const avoidDecision = avoidThreatDecision(current, currentNode);
  if (avoidDecision !== null) return avoidDecision;

  if (!spawnGraceActive(current) && engagementPolicy !== "avoid") {
    const combatStep = engagementPolicyStep(
      current,
      engagementPolicy,
      activeRecentHostileRefs(current),
      lastPreview,
      lastPreviewContext,
    );
    if (combatStep.kind === "preview") {
      if (!assistActionReady(current, "attack")) {
        const deadline = current.self.cooldownsUntilMs.attack ?? estimatedGameNowMs();
        return {
          key: `combat-policy-cooldown-${deadline}`,
          title: t("semi.breath.title"),
          detail: t("semi.breath.detail", {
            remaining: formatDuration(deadline - estimatedGameNowMs()),
          }),
          state: "waiting",
        };
      }
      return {
        key: `combat-preview-${combatStep.target.ref}-${combatStep.weapon}`,
        title: t("semi.combat.preview.title", { target: visiblePlayerName(combatStep.target) }),
        detail: t("semi.combat.preview.detail", {
          policy: ENGAGEMENT_POLICY_COPY[engagementPolicy].label,
        }),
        preview: { target: combatStep.target.ref, weapon: combatStep.weapon },
        state: "ready",
      };
    }
    if (combatStep.kind === "waiting") {
      return {
        key: `combat-preview-wait-${combatStep.target.ref}-${combatStep.weapon}`,
        title: t("semi.combat.waiting.title"),
        detail: t("semi.combat.waiting.detail"),
        state: "waiting",
      };
    }
    if (combatStep.kind === "blocked") {
      return {
        key: `combat-policy-blocked-${engagementPolicy}`,
        title: t("semi.engage.blocked.title"),
        detail: combatStep.reason,
        state: "manual",
      };
    }
    if (combatStep.kind === "attack") {
      return readyAssistDecision(
        current,
        combatStep.payload,
        t("semi.combat.attack.title", { target: visiblePlayerName(combatStep.target) }),
        t("semi.combat.attack.detail"),
      );
    }
  }

  if (assistIntent === "hold") {
    return {
      key: "hold",
      title: t("semi.hold.title"),
      detail: t("semi.hold.detail"),
      state: "waiting",
    };
  }

  if (assistIntent === "travel") {
    if (assistDestination === null || assistDestination === current.self.node) {
      return {
        key: "travel-arrived",
        title: t("semi.travel.arrived.title"),
        detail: t("semi.travel.arrived.detail"),
        state: "manual",
      };
    }
    const step = firstRouteStep(current, assistDestination);
    const nextNode = step === null ? undefined : current.nodes.find((node) => node.id === step);
    if (step === null || nextNode === undefined) {
      return {
        key: "travel-no-route",
        title: t("semi.travel.noRoute.title"),
        detail: t("semi.travel.noRoute.detail"),
        state: "blocked",
      };
    }
    if (nextNode.knownHazards.length > 0 || nodeClosesSoon(current, step)) {
      return {
        key: `travel-risk-${step}`,
        title: t("semi.travel.risk.title", { node: narrativeNodeName(current, step) }),
        detail: t("semi.travel.risk.detail"),
        state: "manual",
      };
    }
    return readyAssistDecision(
      current,
      { action: "move", to: step },
      t("semi.travel.move.title", { node: narrativeNodeName(current, step) }),
      t("semi.travel.move.detail", {
        destination: narrativeNodeName(current, assistDestination),
      }),
    );
  }

  if (assistIntent === "survive") {
    const injuries = selfInjuryParts(current.self);
    if (current.self.hp <= currentProgressionReadout(current).maxHp * 0.4 || injuries.length > 0) {
      const bandage = current.self.inventory.find((item) =>
        item.count > 0 && item.kind === "bandage"
      );
      const medkit = current.self.inventory.find((item) =>
        item.count > 0 && item.kind === "medkit"
      );
      const healing = injuries.length > 1 || current.self.hp <=
          currentProgressionReadout(current).maxHp * 0.4
        ? medkit ?? bandage
        : bandage ?? medkit;
      if (healing !== undefined) {
        return readyAssistDecision(
          current,
          { action: "use_item", item: healing.kind, targetNode: current.self.node },
          t("semi.survive.use.title", { item: healing.kind.toUpperCase() }),
          t("semi.survive.use.detail", { hp: current.self.hp }),
        );
      }
    }
    if (current.self.signal >= 60 && !current.self.hidden && currentNode.coverSlotsFree > 0) {
      return readyAssistDecision(
        current,
        { action: "hide" },
        t("semi.survive.hide.title"),
        t("semi.survive.hide.detail", { signal: current.self.signal }),
      );
    }
    return {
      key: "survive-stable",
      title: t("semi.survive.stable.title"),
      detail: t("semi.survive.stable.detail"),
      state: "waiting",
    };
  }

  if (assistIntent === "scavenge") {
    if (currentNode.searchesLeft > 0) {
      return readyAssistDecision(
        current,
        { action: "search" },
        t("semi.scavenge.search.title", {
          node: narrativeNodeName(current, current.self.node),
        }),
        t("semi.scavenge.search.detail", { count: currentNode.searchesLeft }),
      );
    }
    const target = [...current.nodes].filter((node) =>
      node.open && node.searchesLeft > 0 && node.knownHazards.length === 0 &&
      !nodeClosesSoon(current, node.id)
    ).sort((a, b) =>
      b.searchesLeft - a.searchesLeft
    )[0];
    if (target === undefined) {
      return {
        key: "no-search-node",
        title: t("semi.scavenge.noNode.title"),
        detail: t("semi.scavenge.noNode.detail"),
        state: "manual",
      };
    }
    const step = firstRouteStep(current, target.id);
    if (step === null) {
      return {
        key: "no-search-route",
        title: t("semi.scavenge.noRoute.title"),
        detail: t("semi.scavenge.noRoute.detail"),
        state: "blocked",
      };
    }
    const nextNode = current.nodes.find((node) => node.id === step);
    if (nextNode?.knownHazards.length) {
      return {
        key: `search-risk-${step}`,
        title: t("semi.scavenge.risk.title", { node: narrativeNodeName(current, step) }),
        detail: t("semi.scavenge.risk.detail"),
        state: "manual",
      };
    }
    return readyAssistDecision(
      current,
      { action: "move", to: step },
      t("semi.scavenge.move.title", { node: narrativeNodeName(current, step) }),
      t("semi.scavenge.move.detail", {
        node: narrativeNodeName(current, target.id),
        count: target.searchesLeft,
      }),
    );
  }

  if (assistIntent === "conceal") {
    if (current.self.hidden) {
      return {
        key: "already-hidden",
        title: t("semi.conceal.hidden.title"),
        detail: t("semi.conceal.hidden.detail"),
        state: "waiting",
      };
    }
    if (currentNode.coverSlotsFree > 0) {
      return readyAssistDecision(
        current,
        { action: "hide" },
        t("semi.conceal.hide.title"),
        t("semi.conceal.hide.detail"),
      );
    }
    const coverNode = routeNeighbors(current, current.self.node).map((id) =>
      current.nodes.find((node) => node.id === id)
    ).find((node) =>
      node !== undefined && node.coverSlotsFree > 0 && node.knownHazards.length === 0 &&
      !nodeClosesSoon(current, node.id)
    );
    if (coverNode === undefined) {
      return {
        key: "no-cover",
        title: t("semi.conceal.noCover.title"),
        detail: t("semi.conceal.noCover.detail"),
        state: "manual",
      };
    }
    return readyAssistDecision(
      current,
      { action: "move", to: coverNode.id },
      t("semi.conceal.move.title", { node: narrativeNodeName(current, coverNode.id) }),
      t("semi.conceal.move.detail", { count: coverNode.coverSlotsFree }),
    );
  }

  return {
    key: "echo-intel-active",
    title: t("semi.echo.activeOnly.title"),
    detail: t("semi.echo.activeOnly.detail"),
    state: "manual",
  };
}

function loadPlayViewPreference() {
  return resolvePlayViewMode(
    null,
    globalThis.matchMedia?.("(max-width: 700px)").matches ?? false,
  );
}

/** @param {string} text */
function appendNarrativeModeLine(text) {
  if (view === null) return;
  appendNarrative([{
    id: `narrative-mode-${crypto.randomUUID()}`,
    atGameMs: estimatedGameNowMs(),
    level: "self",
    text,
    fatal: false,
    source: "derived",
  }]);
}

function takeNarrativeControl() {
  if (!narrativeCommanderActive && controlMode !== "semi") return;
  narrativeCommanderActive = false;
  narrativeCommanderMenuOpen = false;
  controlMode = "manual";
  assistCountdown = null;
  autoCombatPreview = false;
  assistPausedReason = { key: "semi.paused.takeControl" };
  appendNarrativeModeLine(t("narrative.client.take_control"));
}

/** @param {_PlayerView} current @returns {_NarrativeOption[]} */
function narrativeS2Options(current) {
  const situation = narrativeSituation;
  /** @type {_NarrativeOption[]} */
  const options = [];
  const lockedOptions = statusLockedNarrativeOptions(current.self);
  if (lockedOptions !== null) return lockedOptions;
  const visibleDowned = current.visiblePlayers.find((player) =>
    player.identified && player.status === "downed" && player.node === current.self.node &&
    player.playerId !== undefined
  );
  if (visibleDowned?.playerId !== undefined) {
    return [{
      key: `rescue-visible-${visibleDowned.playerId}`,
      slot: "S2",
      label: t("action.name.rescue", { target: visibleDowned.playerId }),
      note: t("hud.option.reconfirm"),
      kind: "rescue",
      targetRef: visibleDowned.playerId,
      node: visibleDowned.node,
    }];
  }
  const visibleCaches = visibleCacheOffers(current);
  const visibleItemCount = visibleCaches.reduce((sum, cache) => sum + cache.items.length, 0);
  const gameNowMs = estimatedGameNowMs();
  if (
    visibleItemCount > 0 && situation.kind !== "contact" && situation.kind !== "player" &&
    situation.kind !== "rescue"
  ) {
    return /** @type {_NarrativeOption[]} */ ([{
      key: `cache-${current.self.node}-${visibleCaches.map((cache) => cache.cacheId).join("-")}`,
      slot: "S2",
      label: t("hud.option.cache.label"),
      note: visibleCaches.some((cache) =>
          cachePriorityState(
            cache.priorityFor,
            cache.untilMs,
            current.self.playerId,
            gameNowMs,
          ) === "yours"
        )
        ? t("hud.option.cache.priority", { count: visibleItemCount })
        : t("hud.option.cache.note", { count: visibleItemCount }),
      kind: "cache",
      node: current.self.node,
    }]);
  }
  if ((situation.kind === "contact" || situation.kind === "player") && situation.player) {
    // Defense in depth: a stale situation must never expose an attack-shaped choice during grace.
    if (spawnGraceActive(current)) return [];
    const player = situation.player;
    if (!player.identified) {
      options.push({
        key: `preview-${player.ref}`,
        slot: "S2",
        label: t("hud.option.watch.label"),
        note: t("hud.option.watch.note"),
        kind: "preview",
        targetRef: player.ref,
        node: player.node,
      });
      options.push({
        key: `approach-${player.ref}`,
        slot: "S2",
        label: t("hud.option.approach.label"),
        note: t("hud.option.approach.note"),
        kind: "move-contact",
        targetRef: player.ref,
        node: player.node,
      });
    } else {
      options.push({
        key: `attack-${player.ref}`,
        slot: "S2",
        label: t("narrative.client.preview_prepare", {
          target: player.playerId ?? player.ref,
        }),
        note: t("hud.option.attack.note"),
        kind: "preview",
        targetRef: player.ref,
        node: player.node,
      });
      options.push({
        key: `distance-${player.ref}`,
        slot: "S2",
        label: t("hud.option.distance.label"),
        note: t("hud.option.distance.note"),
        kind: "distance",
        targetRef: player.ref,
        node: player.node,
      });
    }
    return options;
  }
  if (situation.kind === "noise" && situation.event?.kind === "noise") {
    const event = situation.event;
    options.push({
      key: `noise-${assistIntent}-${event.node}`,
      slot: "S2",
      label: t(assistIntent === "survive" ? "hud.option.noise.away" : "hud.option.noise.toward"),
      note: t("hud.option.noise.note", { node: narrativeNodeName(current, event.node) }),
      kind: "move-contact",
      node: event.node,
    });
  } else if (situation.kind === "hazard" && situation.event?.kind === "hazard_revealed") {
    options.push({
      key: `avoid-${situation.event.node}`,
      slot: "S2",
      label: t("narrative.client.mark_hazard"),
      note: t("hud.option.avoid.note"),
      kind: "avoid-hazard",
      node: situation.event.node,
    });
  } else if (
    situation.kind === "blockade" && situation.event?.kind === "blockade_preview"
  ) {
    const exit = routeNeighbors(current, current.self.node).map((id) =>
      current.nodes.find((node) => node.id === id)
    ).find((node) =>
      node !== undefined && node.knownHazards.length === 0 && !nodeClosesSoon(current, node.id)
    );
    if (exit !== undefined) {
      options.push({
        key: `evacuate-${exit.id}`,
        slot: "S2",
        label: t("hud.option.evacuate.label", { node: narrativeNodeName(current, exit.id) }),
        note: t("hud.option.evacuate.note"),
        kind: "move-contact",
        node: exit.id,
      });
    }
  } else if (situation.kind === "trace") {
    const collapseEdges = current.map.edges.filter((edge) => edge.phase === "megacity");
    options.push({
      key: `mark-${collapseEdges.map((edge) => edge.id).join("-")}`,
      slot: "S2",
      label: t("hud.option.markEdge.label"),
      note: collapseEdges.length === 0
        ? t("hud.option.markEdge.empty")
        : t("hud.option.markEdge.note", {
          edges: collapseEdges.map((edge) =>
            `${narrativeNodeName(current, edge.from)}↔${narrativeNodeName(current, edge.to)}`
          ).join(t("narrative.list_separator")),
        }),
      kind: "mark-edge",
    });
  } else if (situation.kind === "rescue" && situation.event?.kind === "player_downed") {
    options.push({
      key: `rescue-${situation.event.player}`,
      slot: "S2",
      label: t("action.name.rescue", { target: situation.event.player }),
      note: t("hud.option.reconfirm"),
      kind: "rescue",
      targetRef: situation.event.player,
      node: situation.event.node,
    });
  }
  return options;
}

/** @param {_PlayerView} current */
function narrativeS3Option(current) {
  if (current.self.status !== "active" && current.self.status !== "echo") return null;
  const node = current.nodes.find((candidate) => candidate.id === current.self.node);
  if (node === undefined) return null;
  if (
    current.self.status === "active" && node.searchesLeft > 0 &&
    assistActionReady(current, "search")
  ) {
    return /** @type {_NarrativeOption} */ ({
      key: "s3-search",
      slot: "S3",
      label: t("situation.option.search.label"),
      note: t("situation.option.search.note"),
      kind: "payload",
      payload: { action: "search" },
    });
  }
  if (
    current.self.status === "active" && node.coverSlotsFree > 0 && !current.self.hidden &&
    assistActionReady(current, "hide")
  ) {
    return /** @type {_NarrativeOption} */ ({
      key: "s3-hide",
      slot: "S3",
      label: t("situation.option.hide.label"),
      note: t("situation.option.hide.note"),
      kind: "payload",
      payload: { action: "hide" },
    });
  }
  return /** @type {_NarrativeOption} */ ({
    key: "s3-map",
    slot: "S3",
    label: t("hud.option.routes.label"),
    note: t("hud.option.routes.note"),
    kind: "open",
  });
}

/** @param {_PlayerView} current @param {_ActionPayload} payload */
function narrativePayloadNeedsDecision(current, payload) {
  if (
    [
      "attack",
      "rescue",
      "legacy_select",
      "insight_select",
      "once_ability",
      "shop_buy",
      "shop_sell",
    ].includes(payload.action)
  ) return true;
  if (payload.action !== "move") return false;
  const destination = current.nodes.find((node) => node.id === payload.to);
  return destination?.knownHazards.length !== 0 || nodeClosesSoon(current, payload.to);
}

function focusVisiblePendingDecision() {
  focusAfterTacticalRender(() => {
    const target = [
      tacticalArenaActions.querySelector("[data-arena-confirm]"),
      document.getElementById("narrative-confirm-decision"),
    ].find((candidate) =>
      candidate instanceof HTMLButtonElement && candidate.getClientRects().length > 0
    );
    if (!(target instanceof HTMLButtonElement)) return null;
    target.scrollIntoView({
      behavior: accessibilitySettings.reducedMotion ? "auto" : "smooth",
      block: "center",
    });
    return target;
  });
}

/** @param {_ActionPayload | undefined} payload */
function defaultPendingDecisionOrigin(payload) {
  if (payload?.action !== "shop_buy" && payload?.action !== "shop_sell") return null;
  return {
    selector: `[data-shop-trade="${
      payload.action === "shop_buy" ? "buy" : "sell"
    }"][data-shop-item="${payload.item}"]`,
    reopenActionDrawer: true,
  };
}

/** @returns {{selector: string, reopenActionDrawer: boolean} | null} */
function activePendingDecisionOrigin() {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return null;
  let selector = active.id === "" ? null : `#${CSS.escape(active.id)}`;
  if (selector === null) {
    for (
      const key of [
        "narrativeOption",
        "arenaExit",
        "action",
        "shopTrade",
        "arenaGateway",
      ]
    ) {
      const value = active.dataset[key];
      if (value === undefined) continue;
      const attribute = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      selector = `[data-${attribute}="${CSS.escape(value)}"]`;
      break;
    }
  }
  if (selector === null) return null;
  return { selector, reopenActionDrawer: manualActionDrawer.contains(active) };
}

/** Revalidate a local confirmation against the newest public view before it can be sent. */
/** @param {_PlayerView} current @param {{payload: _ActionPayload}} decision */
function pendingDecisionStillValid(current, decision) {
  const payload = decision.payload;
  if (payload.action === "legacy_select") {
    return current.legacyPrompt !== undefined &&
      payload.items.every((item) =>
        current.legacyPrompt?.options.some((option) => option.kind === item)
      );
  }
  if (payload.action === "insight_select") {
    return current.insightPrompt !== undefined &&
      payload.items.every((item) => current.insightPrompt?.options.includes(item));
  }
  if (current.self.status !== "active" || current.phase === "reset" || current.phase === "ended") {
    return false;
  }
  if (payload.action === "move") {
    return routeNeighbors(current, current.self.node).includes(payload.to);
  }
  if (payload.action === "attack") {
    return current.visiblePlayers.some((player) =>
      player.ref === payload.target || player.contactRef === payload.target
    );
  }
  if (payload.action === "rescue") {
    return current.visiblePlayers.some((player) =>
      player.playerId === payload.target && player.node === current.self.node &&
      player.status === "downed"
    );
  }
  if (payload.action === "once_ability") return !current.self.onceAbilityUsed;
  if (payload.action === "shop_buy" || payload.action === "shop_sell") {
    const entry = shopCatalogPresentation(current, estimatedGameNowMs()).entries.find(
      (candidate) => candidate.item === payload.item,
    );
    return payload.action === "shop_buy" ? entry?.canBuy === true : entry?.canSell === true;
  }
  return true;
}

/**
 * @param {_PlayerView} current
 * @param {boolean=} restoreOrigin
 */
function cancelNarrativePendingDecision(current, restoreOrigin = true) {
  const origin = narrativePendingDecisionOrigin ??
    defaultPendingDecisionOrigin(narrativePendingDecision?.payload);
  narrativePendingDecision = null;
  narrativePendingDecisionOrigin = null;
  narrativeResetDecisionPending = false;
  renderNarrativeMode(current);
  if (restoreOrigin && origin?.reopenActionDrawer) {
    openTacticalActionDrawer(current, origin.selector);
  } else if (restoreOrigin && origin !== null) {
    focusAfterTacticalRender(() => {
      const target = document.querySelector(origin.selector);
      return target instanceof HTMLElement ? target : tacticalArenaHeading;
    });
  }
}

/**
 * @param {_PlayerView} current
 * @param {{title: string, context: string, payload: _ActionPayload, confirmLabel: string}} decision
 */
function confirmNarrativePendingDecision(current, decision) {
  if (narrativePendingDecision !== decision) return;
  const authoritative = view ?? current;
  if (!pendingDecisionStillValid(authoritative, decision)) {
    cancelNarrativePendingDecision(authoritative, false);
    appendNarrativeModeLine(rejectionNarrativeLine("STALE_VERSION"));
    renderNarrativeMode(authoritative);
    focusAfterTacticalRender(() => tacticalArenaHeading);
    return;
  }
  const origin = narrativePendingDecisionOrigin ?? defaultPendingDecisionOrigin(decision.payload);
  narrativePendingDecision = null;
  narrativePendingDecisionOrigin = null;
  narrativeResetDecisionPending = false;
  const commandId = sendAction(decision.payload);
  if (commandId !== null && origin !== null) {
    pendingDecisionCommandOrigins.set(commandId, origin);
  }
  renderNarrativeMode(current);
}

/**
 * @param {_PlayerView} current
 * @param {_ActionPayload} payload
 * @param {string} title
 * @param {string} context
 * @param {{selector: string, reopenActionDrawer: boolean} | null=} origin
 */
function executeNarrativePayload(current, payload, title, context, origin = null) {
  if (narrativeCommanderActive) takeNarrativeControl();
  if (
    payload.action === "move" && payload.style === "rush" &&
    !survivalReadout(current).canRush
  ) {
    appendNarrativeModeLine(rejectionNarrativeLine("NO_STAMINA"));
    narrativeMovementChoice = { to: payload.to, title, context };
    renderNarrativeMode(current);
    return;
  }
  if (narrativeResetDecisionPending || narrativePayloadNeedsDecision(current, payload)) {
    narrativePendingDecision = {
      title: narrativeResetDecisionPending ? t("reset.decision.title") : title,
      context: narrativeResetDecisionPending ? t("reset.decision.detail") : context,
      payload,
      confirmLabel: t(
        payload.action === "rescue"
          ? "confirm.rescue"
          : payload.action === "once_ability"
          ? "confirm.use"
          : payload.action === "move"
          ? "confirm.move"
          : payload.action === "shop_buy"
          ? "shop.buy"
          : payload.action === "shop_sell"
          ? "shop.sell"
          : "confirm.action",
      ),
    };
    narrativePendingDecisionOrigin = origin ?? defaultPendingDecisionOrigin(payload) ??
      activePendingDecisionOrigin();
    if (narrativePendingDecisionOrigin?.reopenActionDrawer && tacticalArenaCanShowField(current)) {
      manualActionDrawer.open = false;
      narrativeActionAutoOpened = false;
      tacticalArenaSurface = "field";
      setNarrativeActionExpanded(false);
    }
    renderNarrativeMode(current);
    focusVisiblePendingDecision();
    return;
  }
  sendAction(payload);
}

/** @param {_PlayerView} current @param {import("@darkforest/protocol").NodeId} to @param {string} title @param {string} context */
function openNarrativeMovementChoice(current, to, title, context) {
  if (current.self.status === "echo") {
    executeNarrativePayload(current, { action: "echo_move", to }, title, context);
    return;
  }
  narrativeMovementChoice = { to, title, context };
  narrativeRouteMenuOpen = false;
  renderNarrativeMode(current);
}

/** @param {_PlayerView} current @param {_NarrativeOption} option */
function executeNarrativeOption(current, option) {
  if (narrativeCommanderActive) takeNarrativeControl();
  switch (option.kind) {
    case "payload":
      if (option.payload !== undefined) {
        executeNarrativePayload(current, option.payload, option.label, option.note);
      }
      break;
    case "preview": {
      if (option.targetRef === undefined) break;
      const target = current.visiblePlayers.find((player) => player.ref === option.targetRef);
      if (target === undefined) break;
      const weapon = engagementWeapon(current, target);
      if (weapon === null) break;
      requestCombatPreview(current, target, weapon);
      break;
    }
    case "move-contact": {
      if (option.node === undefined) break;
      let step = firstRouteStep(current, option.node, current.self.status === "echo");
      if (assistIntent === "survive" && narrativeSituation.kind === "noise") {
        step = routeNeighbors(current, current.self.node).find((nodeId) =>
          nodeId !== option.node &&
          current.nodes.find((node) => node.id === nodeId)?.knownHazards.length === 0
        ) ?? null;
      }
      if (step === null) {
        openNarrativeRouteMenu();
        break;
      }
      openNarrativeMovementChoice(current, step, option.label, option.note);
      break;
    }
    case "distance": {
      const node = current.nodes.find((candidate) => candidate.id === current.self.node);
      if (node !== undefined && node.coverSlotsFree > 0 && !current.self.hidden) {
        executeNarrativePayload(
          current,
          { action: "hide" },
          t("hud.option.distance.label"),
          t("confirm.hide.context"),
        );
      } else openNarrativeRouteMenu();
      break;
    }
    case "avoid-hazard":
      if (option.node !== undefined) narrativeAvoidNodes.add(option.node);
      narrativeSituation = { kind: "none" };
      appendNarrative([{
        id: `local:${option.key}`,
        atGameMs: estimatedGameNowMs(),
        level: "self",
        text: t("narrative.client.mark_hazard"),
        fatal: false,
        source: "derived",
        kind: "action",
        status: "resolved",
        label: t("action.status.marked"),
      }]);
      renderNarrativeMode(current);
      break;
    case "mark-edge":
      current.map.edges.filter((edge) => edge.phase === "megacity").forEach((edge) =>
        narrativeMarkedEdges.add(edge.id)
      );
      narrativeSituation = { kind: "none" };
      appendNarrativeModeLine(t("narrative.client.mark_edge"));
      renderNarrativeMode(current);
      break;
    case "rescue":
      if (option.targetRef !== undefined) {
        executeNarrativePayload(
          current,
          { action: "rescue", target: option.targetRef },
          t("action.name.rescue", { target: option.targetRef }),
          t("confirm.rescue.context"),
        );
      }
      break;
    case "cache":
      narrativeCacheOffer = visibleCacheOffers(current)[0] ?? null;
      narrativeCacheWanted = null;
      narrativeCacheDecisionOpen = true;
      narrativeRouteMenuOpen = false;
      renderNarrativeMode(current);
      break;
    case "open":
      openNarrativeRouteMenu();
      break;
  }
}

function openNarrativeRouteMenu() {
  if (narrativeCommanderActive) takeNarrativeControl();
  narrativeRouteMenuOpen = true;
  narrativeCommanderMenuOpen = false;
  if (view !== null) renderNarrativeMode(view);
}

function closeNarrativeRouteMenu() {
  narrativeRouteMenuOpen = false;
  if (view !== null) renderNarrativeMode(view);
}

/**
 * Resolve a stored pause record into player copy. Called at render time, never at pause time,
 * so the line follows the active locale. `rejection` records go through `rejectionNotice()`,
 * which keeps their live countdown accurate on every re-render.
 * @param {_AssistPause} pause
 */
function assistPauseText(pause) {
  if ("rejection" in pause) return rejectionNotice(pause.rejection);
  const params = Object.fromEntries(
    Object.entries(pause.params ?? {}).map((
      [name, value],
    ) => [name, isRecord(value) ? t(String(value.key)) : value]),
  );
  return t(pause.key, params);
}

/** @param {_AssistPause} reason @param {boolean=} renderNow */
function pauseSemi(reason, renderNow = true) {
  if (controlMode !== "semi") return;
  controlMode = "assist";
  narrativeCommanderActive = false;
  assistCountdown = null;
  autoCombatPreview = false;
  assistPausedReason = reason;
  if (renderNow && view !== null) {
    renderAssist(view);
    renderTopbar(view);
    if (playViewMode === "narrative") renderNarrativeMode(view);
  }
}

/** @param {_PlayerView} current */
function tickAssist(current) {
  if (
    playViewMode === "narrative" && narrativeCommanderActive &&
    narrativeDecisionIsActive(current) && !(autoCombatPreview && lastPreviewContext !== null)
  ) {
    if (assistCountdown !== null) {
      assistCountdown = null;
      renderNarrativeMode(current);
    }
    return;
  }
  if (controlMode !== "semi" || document.hidden || socket?.readyState !== WebSocket.OPEN) {
    if (assistCountdown !== null) {
      assistCountdown = null;
      renderAssist(current);
      if (playViewMode === "narrative") renderNarrativeMode(current);
    }
    return;
  }
  const decision = getAssistDecision(current);
  if (
    autoCombatPreview &&
    ["finale-", "legacy-", "insight-", "phase-", "status-"].some((prefix) =>
      decision.key.startsWith(prefix)
    )
  ) {
    lastPreview = null;
    lastPreviewContext = null;
    autoCombatPreview = false;
    dismissedCombatPreviewLease = null;
  }
  if (decision.preview !== undefined && decision.state === "ready") {
    const target = current.visiblePlayers.find((player) => player.ref === decision.preview?.target);
    if (target !== undefined) {
      assistCountdown = null;
      assistPausedReason = { key: "semi.paused.previewing" };
      requestCombatPreview(current, target, decision.preview.weapon, true);
    }
    return;
  }
  if (decision.payload === undefined || decision.state !== "ready") {
    if (assistCountdown !== null) {
      assistCountdown = null;
      renderAssist(current);
      if (playViewMode === "narrative") renderNarrativeMode(current);
    }
    return;
  }
  const signature = `${current.stateVersion}:${decision.key}`;
  if (assistCountdown === null || assistCountdown.signature !== signature) {
    const delayMs = decision.payload.action === "attack" ? 1_500 : 3_000;
    assistCountdown = {
      signature,
      payload: decision.payload,
      endsAtRealMs: performance.now() + delayMs,
    };
    assistPausedReason = {
      key: decision.payload.action === "attack"
        ? "semi.paused.armed.attack"
        : "semi.paused.armed.action",
    };
    renderAssist(current);
    if (playViewMode === "narrative") renderNarrativeMode(current);
    return;
  }
  if (performance.now() < assistCountdown.endsAtRealMs) return;
  const payload = assistCountdown.payload;
  assistCountdown = null;
  if (
    narrativeCommanderActive && payload.action !== "move" && payload.action !== "echo_move"
  ) {
    appendNarrativeModeLine(t("narrative.client.action_summary", {
      title: decision.title,
      detail: decision.detail,
    }));
  }
  if (payload.action === "attack") {
    lastPreview = null;
    lastPreviewContext = null;
    autoCombatPreview = false;
  }
  sendAction(payload, "auto");
  renderAssist(current);
  if (playViewMode === "narrative") renderNarrativeMode(current);
}

function updateTimers() {
  const gameNow = estimatedGameNowMs();
  if (openingPerkCardVisible && gameNow >= 30_000) {
    dismissOpeningPerkCard(true);
  }
  document.querySelectorAll("[data-deadline-ms]").forEach((element) => {
    if (!(element instanceof HTMLElement)) return;
    const deadline = Number(element.dataset.deadlineMs);
    if (!Number.isFinite(deadline)) return;
    element.textContent = formatDuration(deadline - gameNow);
    element.dataset.expired = deadline <= gameNow ? "true" : "false";
  });
  document.querySelectorAll(".cooldown-ring").forEach((element) => {
    if (!(element instanceof HTMLElement)) return;
    const deadlineElement = element.parentElement?.querySelector("[data-deadline-ms]");
    if (!(deadlineElement instanceof HTMLElement)) return;
    const deadline = Number(deadlineElement.dataset.deadlineMs);
    if (!Number.isFinite(deadline)) return;
    const start = cooldownVisualStartByDeadline.get(deadline) ?? gameNow;
    cooldownVisualStartByDeadline.set(deadline, start);
    const duration = Math.max(1, deadline - start);
    const progress = deadline <= gameNow
      ? 100
      : Math.max(0, Math.min(100, (gameNow - start) / duration * 100));
    element.style.setProperty("--cooldown-progress", `${progress}%`);
  });
  for (const deadline of cooldownVisualStartByDeadline.keys()) {
    if (deadline <= gameNow) cooldownVisualStartByDeadline.delete(deadline);
  }
  document.querySelectorAll("[data-real-deadline-ms]").forEach((element) => {
    if (!(element instanceof HTMLElement)) return;
    const deadline = Number(element.dataset.realDeadlineMs);
    if (!Number.isFinite(deadline)) return;
    element.textContent = `${Math.max(0, (deadline - performance.now()) / 1000).toFixed(1)}s`;
  });
  document.querySelectorAll("progress[data-progress-deadline-ms]").forEach((element) => {
    if (!(element instanceof HTMLProgressElement)) return;
    const deadline = Number(element.dataset.progressDeadlineMs);
    const duration = Number(element.dataset.progressDurationMs);
    if (!Number.isFinite(deadline) || !Number.isFinite(duration) || duration <= 0) return;
    const elapsed = duration - Math.max(0, deadline - gameNow);
    element.value = Math.max(0, Math.min(100, (elapsed / duration) * 100));
    element.setAttribute("aria-valuetext", `${Math.round(element.value)}%`);
  });
  const attackDeadline = view?.self.cooldownsUntilMs.attack;
  const expiredCooldown = expiredCombatCooldownWake(
    attackDeadline,
    gameNow,
    combatCooldownWakeDeadline,
  );
  if (view !== null && view.self.status === "active" && expiredCooldown !== null) {
    combatCooldownWakeDeadline = expiredCooldown;
    renderCombat(view);
    renderTacticalArena(view);
  }
  document.querySelectorAll("[data-deadline-seconds]").forEach((element) => {
    if (!(element instanceof HTMLElement)) return;
    const deadline = Number(element.dataset.deadlineSeconds);
    if (!Number.isFinite(deadline)) return;
    element.textContent = String(Math.max(0, Math.ceil((deadline - gameNow) / 1000)));
  });
  document.querySelectorAll("[data-game-clock]").forEach((element) => {
    element.textContent = formatDuration(gameNow);
  });
  updatePrejoinShiftPreview();
  renderLiveJoinOption();
  updateLobbyTimer();
  updateSpectatorWarmupTimer();
  renderQueueDock();
  if (view !== null) {
    updateSupplyShopLine(view);
    if (!echoOraclePanel.hidden) renderEchoOraclePanel(view);
    for (const [commandId, meta] of pendingCommandMeta) {
      if (meta.resyncRequested || performance.now() - meta.sentAtRealMs < 5_000) continue;
      meta.resyncRequested = true;
      updateActionLog(commandId, {
        status: "ready",
        label: t("action.status.reconfirming"),
      });
      renderNarrativeStory(view);
      renderNarrativeOptions(view);
    }
    for (const [commandId, movement] of pendingMovementNarratives) {
      if (
        !movement.accepted ||
        (gameNow < movement.revealAtGameMs && performance.now() < movement.revealAtRealMs)
      ) continue;
      const flavor = view.map.nodes.length === 6 ? edgeFlavorLine(movement.edgeId) : null;
      if (flavor !== null) {
        appendNarrative([{
          id: `move-edge-${commandId}`,
          atGameMs: movement.revealAtGameMs,
          level: "self",
          text: flavor,
          fatal: false,
          source: "derived",
        }]);
      }
      pendingMovementNarratives.delete(commandId);
      if (playViewMode === "narrative") renderNarrativeStory(view);
    }
    const graceActive = spawnGraceActive(view);
    if (lastRenderedSpawnGrace !== null && graceActive !== lastRenderedSpawnGrace) {
      lastRenderedSpawnGrace = graceActive;
      if (!graceActive) {
        const text = t("narrative.spawn_grace.ended");
        if (!narrativeEntries.some((entry) => entry.text === text)) {
          appendNarrative([{
            id: "spawn-grace-ended-timer",
            atGameMs: 30_000,
            level: "broadcast",
            text,
            fatal: false,
            source: "derived",
          }]);
        }
      }
      queueMicrotask(() => {
        if (view === null) return;
        renderTopbar(view);
        renderModeBanner(view);
        renderCombat(view);
        renderMessages(view);
        renderNarrativeMode(view);
      });
    }
    const finaleEntry = finaleEntryAvailableNow(view);
    if (lastRenderedFinaleEntry !== null && finaleEntry !== lastRenderedFinaleEntry) {
      lastRenderedFinaleEntry = finaleEntry;
      queueMicrotask(() => {
        if (view !== null) renderNarrativeMode(view);
      });
    } else if (lastRenderedFinaleEntry === null) {
      lastRenderedFinaleEntry = finaleEntry;
    }
    const nextCooldownSignature = cooldownSignature(view, gameNow);
    if (
      lastRenderedCooldownSignature !== null &&
      nextCooldownSignature !== lastRenderedCooldownSignature
    ) {
      lastRenderedCooldownSignature = nextCooldownSignature;
      queueMicrotask(() => {
        if (view === null) return;
        renderTacticalReadout(view);
        renderCommands(view);
        renderCombat(view);
        renderNarrativeMode(view);
      });
    } else if (lastRenderedCooldownSignature === null) {
      lastRenderedCooldownSignature = nextCooldownSignature;
    }
    const nextCachePrioritySignature = cachePrioritySignature(view, gameNow);
    if (
      lastRenderedCachePrioritySignature !== null &&
      nextCachePrioritySignature !== lastRenderedCachePrioritySignature
    ) {
      lastRenderedCachePrioritySignature = nextCachePrioritySignature;
      queueMicrotask(() => {
        if (view === null) return;
        renderNarrativeContext(view);
        renderNarrativeDecisionCard(view);
        renderNarrativeOptions(view);
        renderTacticalArenaInteractables(view);
        renderTacticalArenaActions(view);
      });
    } else if (lastRenderedCachePrioritySignature === null) {
      lastRenderedCachePrioritySignature = nextCachePrioritySignature;
    }
    if (
      playViewMode === "narrative" && gameNow - narrativeIdleFromGameMs >= 15_000 &&
      nextCooldownSignature === "" && !narrativeDecisionIsActive(view)
    ) {
      const node = view.nodes.find((candidate) => candidate.id === view?.self.node);
      const used = narrativeUsedAdjectives.get(view.self.node) ?? new Set();
      const phrase = node === undefined ? null : nextNarrativeAdjective(node.activeTags, used);
      if (phrase !== null) {
        used.add(phrase);
        narrativeUsedAdjectives.set(view.self.node, used);
        appendNarrativeModeLine(t("narrative.client.ambient_sentence", { phrase }));
        renderNarrativeStory(view);
      }
      narrativeIdleFromGameMs = gameNow;
    }
    tickAssist(view);
  }
}

/** @param {_PlayerView} current */
function renderTopbar(current) {
  const blockade = nextBlockade(current);
  const spawnGrace = spawnGraceActive(current);
  const progression = currentProgressionReadout(current);
  lastRenderedSpawnGrace = spawnGrace;
  topbar.innerHTML = `
    <div><span>PHASE</span><strong>${escapeHtml(phaseLabel(current.phase))}</strong></div>
    <div><span>GAME CLOCK</span><strong data-game-clock>${
    formatDuration(current.gameNowMs)
  }</strong></div>
    <div><span>IN PLAY / ECHO</span><strong>${current.aliveCount} / ${current.echoCount}</strong></div>
    <div><span>YOUR STATUS</span><strong>${
    escapeHtml(current.self.status.toUpperCase())
  } <em class="topbar-level-chip">${
    escapeHtml(t("hud.level.badge", { level: progression.level }))
  }</em></strong></div>
    <div><span>NEXT BLOCKADE</span><strong>${
    blockade === null
      ? "—"
      : `${
        escapeHtml(narrativeNodeName(current, blockade.node))
      } · <b class="countdown" data-deadline-ms="${blockade.closesAtMs}"></b>`
  }</strong></div>
    <div class="topbar-control topbar-control-${controlMode}"><span>CONTROL</span><strong>${
    { manual: "MANUAL", assist: "ASSIST", semi: "SEMI · ARMED" }[controlMode]
  }</strong></div>
    ${
    spawnGrace
      ? `<div class="topbar-grace"><span>SPAWN GRACE · SHIELD</span><strong>${
        escapeHtml(t("hud.grace.shield"))
      } · <b data-deadline-ms="30000"></b></strong></div>`
      : ""
  }
    ${traitChipMarkup(current, "hud")}
    <a class="topbar-tutorial" href="/tutorial">? ${escapeHtml(t("hud.topbar.tutorial"))}</a>
    <button id="disconnect-button" class="text-button" type="button">${
    escapeHtml(t("hud.topbar.disconnect"))
  }</button>
  `;
  bindTraitChipInteractions(topbar);
  document.getElementById("disconnect-button")?.addEventListener("click", disconnect);
  updateTimers();
}

/** @param {_PlayerView} current */
function renderTacticalReadout(current) {
  const nodeId = focusedNodeId ?? current.self.node;
  const definition = current.map.nodes.find((candidate) => candidate.id === nodeId);
  const node = current.nodes.find((candidate) => candidate.id === nodeId);
  if (definition === undefined || node === undefined) {
    tacticalReadout.textContent = "";
    return;
  }
  const name = narrativeNodeName(current, definition.id);
  const edge = edgeForMove(current, nodeId);
  const isCurrent = nodeId === current.self.node;
  const isShop = current.map.shopNodeId === nodeId;
  const moveDeadline = current.self.cooldownsUntilMs.move;
  const moveCooling = moveDeadline !== undefined && moveDeadline > estimatedGameNowMs();
  const canMove = !isCurrent && node.open &&
    (current.self.status === "echo" || edge !== undefined) && !moveCooling;
  const survival = survivalReadout(current);
  const shoes = selfShoes(current.self);
  const tacticalMovementOptions = edge === undefined
    ? []
    : movementStyleOptions({ action: "move", to: nodeId }, name, edge.trait);
  const primaryMovementIndex = tacticalMovementOptions.findIndex((option) =>
    option.payload?.action !== "move" || option.payload.style !== "rush" || survival.canRush
  );
  const movementButtons = isCurrent
    ? ""
    : current.self.status === "echo"
    ? `<button id="confirm-move-button" data-echo-move type="button" ${canMove ? "" : "disabled"}>${
      actionIcon("move")
    }<span>${escapeHtml(t("semi.echo.move.title", { node: name }))}</span><small>${
      escapeHtml(t("hud.tactical.echoMove.note"))
    }</small></button>`
    : edge === undefined
    ? `<button id="confirm-move-button" type="button" disabled>${actionIcon("move")}<span>${
      escapeHtml(t("hud.tactical.unreachable.label"))
    }</span><small>${escapeHtml(t("hud.tactical.unreachable.note"))}</small></button>`
    : `<div class="tactical-movement-actions">${
      tacticalMovementOptions.map((option, index) => {
        const payload = option.payload;
        const resourceReady = payload?.action !== "move" || payload.style !== "rush" ||
          survival.canRush;
        return `<button ${
          index === primaryMovementIndex ? 'id="confirm-move-button"' : ""
        } type="button" data-move-style="${payload?.action === "move" ? payload.style : ""}" ${
          canMove && resourceReady ? "" : "disabled"
        }>${actionIcon("move")}<span>${escapeHtml(option.label)}</span><small>${
          moveCooling
            ? `${escapeHtml(t("hud.cooldown.aria"))} · <b data-deadline-ms="${moveDeadline}"></b>`
            : !node.open
            ? escapeHtml(t("hud.tactical.nodeBlocked"))
            : payload?.action === "move"
            ? `${escapeHtml(movementResourceCopy(current, payload))} · ${escapeHtml(option.note)}`
            : escapeHtml(option.note)
        }</small></button>`;
      }).join("")
    }</div>`;
  tacticalReadout.innerHTML = `
    <div class="tactical-title">
      <span>${isCurrent ? "CURRENT NODE" : "FOCUSED DESTINATION"}${
    isShop ? ` · ¤ ${escapeHtml(t(isCurrent ? "hud.shop.here" : "map.shop.marker"))}` : ""
  }</span>
      <strong>${escapeHtml(nodeId)} · ${escapeHtml(name)}</strong>
    </div>
    <div class="tactical-cell">
      <span>${escapeHtml(t("hud.tactical.environment"))}</span>
      <div class="tactical-tags">${
    node.activeTags.map((tag) => {
      const info = TAG_INFO[tag];
      return `<button type="button" data-tactical-tag="${tag}" aria-pressed="${
        focusedTag === tag
      }" title="${
        escapeHtml(info.summary)
      }"><img src="/art/icons/tags/${tag.toLowerCase()}.svg" alt=""><b>${
        escapeHtml(info.label)
      }</b></button>`;
    }).join("")
  }</div>
      ${
    focusedTag !== null && node.activeTags.includes(focusedTag)
      ? `<small>${escapeHtml(TAG_INFO[focusedTag].summary)}</small>`
      : uiDisclosureMarkup(
        "help",
        t("hud.tactical.tagHelp.label"),
        t("hud.tactical.tagHelp.title"),
        t("hud.tactical.tagHelp.body"),
      )
  }
    </div>
    <div class="tactical-cell">
      <span>${escapeHtml(t("hud.label.cover"))}</span><strong>${
    escapeHtml(t("hud.tactical.cover.value", {
      free: node.coverSlotsFree,
      total: definition.coverSlots,
    }))
  }</strong>
      <small>${
    escapeHtml(t(node.coverSlotsFree > 0 ? "hud.tactical.cover.free" : "hud.tactical.cover.full"))
  }</small>
    </div>
    <div class="tactical-cell ${node.knownHazards.length > 0 ? "tactical-danger" : ""}">
      <span>${escapeHtml(t("hud.label.hazard"))}</span><strong>${
    node.knownHazards.length === 0
      ? escapeHtml(t("hud.tactical.hazard.none"))
      : node.knownHazards.map((hazard) => escapeHtml(hazard.kind)).join(" · ")
  }</strong><small>${
    node.knownHazards.length === 0
      ? escapeHtml(t("hud.tactical.hazard.unknownIsNotSafe"))
      : node.knownHazards.map((hazard) => escapeHtml(hazard.note)).join(" · ")
  }</small>
    </div>
    <div class="tactical-cell tactical-route">
      <span>${escapeHtml(t("hud.tactical.route"))}</span><strong>${
    escapeHtml(t(
      isCurrent
        ? "hud.tactical.route.here"
        : current.self.status === "echo" && edge === undefined
        ? "hud.tactical.route.echo"
        : edge === undefined
        ? "hud.tactical.route.none"
        : edge.trait === "root"
        ? "hud.tactical.route.root"
        : edge.trait === "tunnel"
        ? "hud.tactical.route.tunnel"
        : edge.noLos
        ? "hud.tactical.route.noLos"
        : "hud.tactical.route.direct",
    ))
  }</strong><small>${escapeHtml(shoes?.toUpperCase() ?? "SHOES UNKNOWN")} · ${
    node.open ? "OPEN" : "BLOCKED"
  }</small>
      ${movementButtons}
      ${actionFeedbackMarkup(["move", "echo_move"])}
    </div>`;
  tacticalReadout.querySelectorAll("[data-tactical-tag]").forEach((element) => {
    element.addEventListener("click", () => {
      if (!(element instanceof HTMLButtonElement)) return;
      const tag = /** @type {import("@darkforest/protocol").Tag | undefined} */ (
        element.dataset.tacticalTag
      );
      if (tag === undefined) return;
      focusedTag = focusedTag === tag ? null : tag;
      renderMap(current);
    });
  });
  tacticalReadout.querySelector("[data-echo-move]")?.addEventListener("click", () => {
    const payload = /** @type {_ActionPayload} */ ({ action: "echo_move", to: nodeId });
    if (playViewMode === "narrative") {
      executeNarrativePayload(
        current,
        payload,
        t("action.name.echo_move", { node: name }),
        t("confirm.map.context"),
      );
    } else sendAction(payload);
  });
  tacticalReadout.querySelectorAll("[data-move-style]").forEach((element) => {
    element.addEventListener("click", () => {
      if (!(element instanceof HTMLButtonElement)) return;
      const style = element.dataset.moveStyle;
      if (style !== "rush" && style !== "sneak") return;
      const payload = /** @type {_ActionPayload} */ ({ action: "move", to: nodeId, style });
      if (playViewMode === "narrative") {
        executeNarrativePayload(
          current,
          payload,
          t(style === "rush" ? "situation.option.rush.label" : "situation.option.sneak.label", {
            destination: name,
          }),
          t(
            style === "rush" ? "situation.option.rush.note" : "situation.option.sneak.note_default",
          ),
        );
      } else sendAction(payload);
    });
  });
  updateTimers();
}

/** @param {_PlayerView} current @param {boolean=} spectator */
function renderMap(current, spectator = false) {
  if (focusedNodeId === null || !current.nodes.some((node) => node.id === focusedNodeId)) {
    focusedNodeId = current.self.node;
  }
  mapHeading.textContent = spectator
    ? narrativeMomentHeading("eliminated")
    : `${current.map.nodes.length}-NODE / ${phaseLabel(current.phase)}`;
  mapLocation.textContent = spectator
    ? t("spectate.location")
    : t("hud.location.you", { node: narrativeNodeName(current, current.self.node) });
  const edges = activeEdges(current);
  const blockadeWarnings = new Set(
    spectator
      ? current.map.blockadeSchedule.filter((entry) =>
        entry.previewAtMs <= current.gameNowMs && entry.closesAtMs > current.gameNowMs
      ).map((entry) => entry.node)
      : matchEvents.filter((event) => event.kind === "blockade_preview").map((event) =>
        event.kind === "blockade_preview" ? event.node : current.self.node
      ).filter((nodeId) => current.nodes.find((node) => node.id === nodeId)?.open === true),
  );
  const latestCombatEffect = spectator ? undefined : combatVisualEffects.at(-1);
  const compactTopology = current.map.nodes.length > 6;
  const suddenDeath = worldPhase(current.phase) === "darkforest" && current.gameNowMs >= 1_260_000;
  mapCanvas.classList.toggle("map-canvas-compact", compactTopology);
  mapCanvas.classList.toggle("map-canvas-sudden-death", suddenDeath);
  const mapPositions = compactTopology
    ? compactTopologyPositions(current.map.nodes.map((node) => node.id))
    : Object.fromEntries(current.map.nodes.map((node, index, nodes) => {
      const fixed = NODE_POSITIONS[node.id];
      if (fixed !== undefined) return [node.id, fixed];
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(1, nodes.length);
      return [node.id, { x: 50 + Math.cos(angle) * 34, y: 50 + Math.sin(angle) * 34 }];
    }));
  const edgeMarkup = edges.map((edge) => {
    const isFocusedRoute = !spectator && focusedNodeId !== current.self.node &&
      ((edge.from === current.self.node && edge.to === focusedNodeId) ||
        (edge.to === current.self.node && edge.from === focusedNodeId));
    const isBlockadeRoute = blockadeWarnings.has(edge.from) || blockadeWarnings.has(edge.to);
    const isClosedRoute = current.nodes.find((node) => node.id === edge.from)?.open === false ||
      current.nodes.find((node) => node.id === edge.to)?.open === false;
    const isCombatDirection = latestCombatEffect !== undefined &&
      ((edge.from === latestCombatEffect.sourceNode && edge.to === latestCombatEffect.targetNode) ||
        (edge.to === latestCombatEffect.sourceNode && edge.from === latestCombatEffect.targetNode));
    return `
    <div class="map-edge${edge.noLos ? " map-edge-no-los" : ""}${
      edge.trait === "root" ? " map-edge-root" : ""
    }${isFocusedRoute ? " map-edge-focused" : ""}${
      isBlockadeRoute ? " map-edge-blockade-warning" : ""
    }${isClosedRoute ? " map-edge-closed" : ""}${
      isCombatDirection ? " map-edge-combat-direction" : ""
    }${narrativeMarkedEdges.has(edge.id) ? " map-edge-narrative-marked" : ""}" style="${
      edgeStyle(edge.from, edge.to, mapPositions)
    }" aria-hidden="true"></div>
    `;
  }).join("");
  const nodeMarkup = current.map.nodes.map((definition) => {
    const node = current.nodes.find((candidate) => candidate.id === definition.id);
    if (node === undefined) return "";
    const position = mapPositions[node.id] ?? { x: 50, y: 50 };
    const isCurrent = !spectator && current.self.node === node.id;
    const isFocused = focusedNodeId === node.id;
    const isBlockadeWarning = blockadeWarnings.has(node.id);
    const isCombatSource = latestCombatEffect?.sourceNode === node.id;
    const isCombatTarget = latestCombatEffect?.targetNode === node.id;
    const isRootheart = current.map.rootheartNodeId === node.id;
    const isShop = current.map.shopNodeId === node.id;
    const isFinalNode = current.map.finalNodes.includes(node.id);
    const name = narrativeNodeName(current, definition.id);
    const visibleHere = current.visiblePlayers.filter((player) => player.node === node.id);
    const coverSlots = Array.from(
      { length: definition.coverSlots },
      (_, index) =>
        `<span class="cover-slot ${
          index < node.coverSlotsFree ? "cover-free" : "cover-occupied"
        }" title="${
          escapeHtml(t(index < node.coverSlotsFree ? "map.cover.free" : "map.cover.occupied"))
        }">${index < node.coverSlotsFree ? "◇" : "◆"}</span>`,
    ).join("");
    const hazards = node.knownHazards.length === 0
      ? `<span class="hazard-none">${escapeHtml(t("map.hazard.none"))}</span>`
      : node.knownHazards.map((hazard) =>
        `<span class="hazard-known"><b aria-hidden="true">⚡</b>${escapeHtml(hazard.kind)} · ${
          escapeHtml(hazard.note)
        }</span>`
      ).join("");
    const groundItems = node.caches.flatMap((cache) => cache.items);
    const groundLoot = groundItems.length === 0
      ? ""
      : `<div class="node-cache-row" aria-label="${escapeHtml(t("hud.label.groundLoot"))}"><b>${
        escapeHtml(t("hud.label.groundLoot"))
      }</b><span class="node-cache-items">${
        groundItems.map((item) =>
          `<span class="node-cache-item">${
            fieldItemIconMarkup(item.kind, "node-cache-item-icon")
          }<span>${escapeHtml(itemStackDisplayName(item))}</span></span>`
        ).join("")
      }</span><small>${
        escapeHtml(t("hud.groundLoot.summary", {
          caches: node.caches.length,
          items: groundItems.length,
        }))
      }</small></div>`;
    const playerTokens = visibleHere.map((player) => {
      const scope = spectator
        ? "spectator"
        : player.node === current.self.node
        ? "same-node"
        : "adjacent-los";
      const scopeLabel = spectator
        ? "60S DELAY"
        : scope === "same-node"
        ? "SAME NODE"
        : "ADJACENT LOS";
      const identity = visiblePlayerName(player);
      const displayIdentity = player.identified ? identity : `${identity} ${player.ref}`;
      const hp = player.identified ? player.hpBand ?? "UNKNOWN" : "HP HIDDEN";
      const visibleLevel = identifiedPlayerLevel(player);
      const levelLabel = visibleLevel === null
        ? null
        : t("hud.level.badge", { level: visibleLevel });
      const tokenClass = player.identified
        ? `token-${player.background ?? "unknown"}`
        : "token-contact";
      const combatEffect = combatVisualEffects.find((effect) => effect.target === player.ref);
      const latestPlayerTerminalEvent = spectator
        ? undefined
        : matchEvents.findLast((event) =>
          (event.kind === "player_downed" || event.kind === "player_eliminated" ||
            event.kind === "player_echoed") && event.player === player.ref
        );
      const effectiveStatus = latestPlayerTerminalEvent?.kind === "player_downed"
        ? "downed"
        : player.status;
      const recognition = spectator
        ? undefined
        : recognitionTransitions.find((entry) => entry.playerId === player.ref);
      const contactWeaponOutline = !player.identified
        ? weaponOutlineIconUrl(player.equippedWeapon)
        : null;
      return `<button type="button" class="map-player map-player-${scope} ${
        escapeHtml(tokenClass)
      } token-status-${effectiveStatus} armor-silhouette-${player.armorSilhouette}${
        combatEffect === undefined ? "" : combatEffect.hit ? " token-hit" : " token-miss"
      }${logFocusedPlayerRef === player.ref ? " token-log-focus" : ""}${
        recognition === undefined ? "" : " token-recognized"
      }${armorBreakingPlayers.has(player.ref) ? " token-armor-breaking" : ""}${
        player.limping ? " token-limping" : ""
      }" data-visibility="${scope}" ${
        spectator ? "disabled" : `data-combat-target="${escapeHtml(player.ref)}"`
      } aria-pressed="${combatTargetRef === player.ref}" title="${
        escapeHtml(
          `${identity} · ${player.ref} · ${player.node} · ${scopeLabel} · ${hp}${
            levelLabel === null ? "" : ` · ${levelLabel}`
          } · ${armorSilhouetteLabel(player.armorSilhouette)} · ${
            player.equippedWeapon ?? "unarmed"
          }${player.limping ? ` · ${t("hud.limping")}` : ""}`,
        )
      }">${
        contactWeaponOutline === null
          ? ""
          : `<img class="contact-weapon-outline" src="${escapeHtml(contactWeaponOutline)}" alt="">`
      }<span class="armor-silhouette-mark" aria-label="${
        escapeHtml(t("map.armor.aria", {
          silhouette: armorSilhouetteLabel(player.armorSilhouette),
        }))
      }"><i></i><i></i><i></i><b>${
        escapeHtml(armorSilhouetteLabel(player.armorSilhouette))
      }</b></span>${escapeHtml(displayIdentity)} · ${escapeHtml(hp)}${
        levelLabel === null
          ? ""
          : ` · <strong class="map-player-level">${escapeHtml(levelLabel)}</strong>`
      } · ${scopeLabel}${limpingBadgeMarkup(player.limping)}${
        recognition === undefined
          ? ""
          : `<span class="recognition-label" aria-hidden="true">${
            escapeHtml(recognition.contactRef)
          } → ${escapeHtml(recognition.playerId)}</span>`
      }${
        combatEffect === undefined
          ? ""
          : `<span class="combat-float ${
            combatEffect.hit ? "combat-float-hit" : "combat-float-miss"
          }" aria-hidden="true"><b class="violence-full">${
            combatEffect.hit ? `−${combatEffect.damage}` : "MISS"
          }</b><b class="violence-low">${combatEffect.hit ? "HIT" : "MISS"}</b></span>`
      }</button>`;
    }).join("");
    const canMove = !spectator && (current.self.status === "echo" || node.open);
    const roleBadges = `${isRootheart ? "<strong>ROOTHEART</strong>" : ""}${
      isShop
        ? `<strong class="node-shop-marker" title="${
          escapeHtml(t("map.shop.marker"))
        }" aria-label="${escapeHtml(t("map.shop.marker"))}">¤</strong>`
        : ""
    }${isFinalNode && !isRootheart ? "<em>FINAL</em>" : ""}${
      isCurrent ? "<strong>YOU</strong>" : ""
    }`;
    const nodeClassName = `map-node${compactTopology ? " map-node-compact" : ""}${
      isCurrent ? " map-node-current" : ""
    }${node.open ? "" : " map-node-closed"}${isFocused ? " map-node-focused" : ""}${
      focusedTag !== null && node.activeTags.includes(focusedTag) ? " map-node-tag-match" : ""
    }${logFocusedNodeId === node.id ? " map-node-log-focus" : ""}${
      isBlockadeWarning ? " map-node-blockade-warning" : ""
    }${isCombatSource ? " map-node-combat-source" : ""}${
      isCombatTarget ? " map-node-combat-target" : ""
    }${isRootheart ? " map-node-rootheart" : ""}${isShop ? " map-node-shop" : ""}${
      isFinalNode ? " map-node-final" : ""
    }`;
    if (compactTopology) {
      const compactPlayers = visibleHere.map((player) => {
        const visibleLevel = identifiedPlayerLevel(player);
        const levelLabel = visibleLevel === null
          ? null
          : t("hud.level.badge", { level: visibleLevel });
        return (
          `<span class="map-player-chip ${player.identified ? "is-identified" : "is-contact"}${
            player.limping ? " is-limping" : ""
          }" title="${
            escapeHtml(
              `${visiblePlayerName(player)} · ${player.ref} · ${player.status}${
                levelLabel === null ? "" : ` · ${levelLabel}`
              }${player.limping ? ` · ${t("hud.limping")}` : ""}`,
            )
          }">${escapeHtml(player.identified ? visiblePlayerName(player) : player.ref)}${
            levelLabel === null ? "" : ` <b>${escapeHtml(levelLabel)}</b>`
          }${limpingBadgeMarkup(player.limping, true)}</span>`
        );
      }).join("");
      return `
        <article class="${nodeClassName}" data-node-card="${node.id}" data-node-role="${
        isRootheart ? "rootheart" : isFinalNode ? "final" : "standard"
      }" tabindex="-1" style="left:${position.x}%;top:${position.y}%" aria-label="${
        escapeHtml(t("map.node.aria", {
          name,
          state: t(node.open ? "map.node.open" : "map.node.blocked"),
        }))
      }">
          <div class="node-title-row"><span>${
        escapeHtml(node.id)
      }</span><span class="node-role-badges">${roleBadges}</span></div>
          <h3>${escapeHtml(name)}</h3>
          <p class="node-compact-tags">${
        node.activeTags.slice(0, 2).map((tag) => escapeHtml(TAG_INFO[tag].label)).join(" · ")
      }</p>
          <div class="node-compact-meta"><span>${
        node.open ? "OPEN" : "BLOCKED"
      }</span><span>△${node.knownHazards.length}</span><span>${
        escapeHtml(t("map.node.items", { count: groundItems.length }))
      }</span></div>
          ${compactPlayers === "" ? "" : `<div class="map-player-chips">${compactPlayers}</div>`}
          ${
        isBlockadeWarning
          ? `<div class="node-blockade-countdown">${
            escapeHtml(t("map.node.blockade"))
          } · <b data-deadline-ms="${
            current.map.blockadeSchedule.find((entry) => entry.node === node.id)?.closesAtMs ??
              current.gameNowMs
          }"></b></div>`
          : ""
      }
        </article>`;
    }
    return `
      <article class="${nodeClassName}" data-node-card="${node.id}" data-node-role="${
      isRootheart ? "rootheart" : isFinalNode ? "final" : "standard"
    }" tabindex="-1" style="left:${position.x}%;top:${position.y}%" aria-label="${
      escapeHtml(node.id)
    } ${
      escapeHtml(t("map.node.aria", {
        name,
        state: t(node.open ? "map.node.open" : "map.node.blocked"),
      }))
    }">
        <div class="node-title-row"><span>${
      escapeHtml(node.id)
    }</span><span class="node-role-badges">${roleBadges}</span></div>
        <div class="node-scene" style="background-image:${
      escapeHtml(sceneBackground(current, definition, node.activeTags))
    }" aria-label="${escapeHtml(t("map.node.scene.aria", { name }))}"></div>
        <h3>${escapeHtml(name)}</h3>
        <p class="tag-row">${
      node.activeTags.map((tag) =>
        `<button type="button" class="tag-pill" data-node-tag="${
          escapeHtml(tag)
        }" data-node-id="${node.id}" title="${
          escapeHtml(TAG_INFO[tag].summary)
        }"><img src="/art/icons/tags/${tag.toLowerCase()}.svg" alt=""><span>${
          escapeHtml(TAG_INFO[tag].label)
        }</span></button>`
      ).join("")
    }</p>
        <div class="cover-row" aria-label="${
      escapeHtml(t("map.coverRow.aria", {
        free: node.coverSlotsFree,
        total: definition.coverSlots,
      }))
    }">${coverSlots}</div>
        <div class="hazard-row">${hazards}</div>
        ${groundLoot}
        ${
      isBlockadeWarning
        ? `<div class="node-blockade-countdown">${
          escapeHtml(t("map.node.blockadeApproaching"))
        } · <b data-deadline-ms="${
          current.map.blockadeSchedule.find((entry) => entry.node === node.id)?.closesAtMs ??
            current.gameNowMs
        }"></b></div>`
        : ""
    }
        ${playerTokens === "" ? "" : `<div class="node-players">${playerTokens}</div>`}
        <dl>
          <div><dt>${escapeHtml(t("hud.label.searches"))}</dt><dd>${node.searchesLeft}</dd></div>
          <div><dt>${escapeHtml(t("hud.label.cover"))}</dt><dd>${node.coverSlotsFree}</dd></div>
          ${
      visibleHere.length > 0
        ? `<div><dt>${
          escapeHtml(t("map.node.visiblePlayers"))
        }</dt><dd>${visibleHere.length}</dd></div>`
        : ""
    }
        </dl>
        ${
      spectator
        ? ""
        : isCurrent
        ? '<span class="node-current-label">CURRENT NODE</span>'
        : `<button class="node-move-button" type="button" data-focus-node="${node.id}" aria-pressed="${isFocused}" ${
          canMove ? "" : "disabled"
        }>${actionIcon("move")}<span>${isFocused ? "FOCUSED" : "FOCUS ROUTE"}</span></button>`
    }
      </article>
    `;
  }).join("");
  mapCanvas.innerHTML = `<div class="map-grid" aria-hidden="true"></div>${edgeMarkup}${nodeMarkup}`;
  mapCanvas.querySelectorAll("[data-focus-node]").forEach((element) => {
    element.addEventListener("click", () => {
      if (!(element instanceof HTMLButtonElement) || view === null) return;
      const to = /** @type {import("@darkforest/protocol").NodeId | undefined} */ (
        element.dataset.focusNode
      );
      if (to === undefined) return;
      focusedNodeId = to;
      focusedTag = null;
      renderMap(current, spectator);
    });
  });
  mapCanvas.querySelectorAll("[data-node-tag]").forEach((element) => {
    element.addEventListener("click", () => {
      if (!(element instanceof HTMLButtonElement) || view === null) return;
      const nodeId = /** @type {import("@darkforest/protocol").NodeId | undefined} */ (
        element.dataset.nodeId
      );
      const tag = /** @type {import("@darkforest/protocol").Tag | undefined} */ (
        element.dataset.nodeTag
      );
      if (nodeId === undefined || tag === undefined) return;
      focusedNodeId = nodeId;
      focusedTag = tag;
      renderMap(current, spectator);
    });
  });
  mapCanvas.querySelectorAll("[data-combat-target]").forEach((element) => {
    element.addEventListener("click", () => {
      if (!(element instanceof HTMLButtonElement) || view === null) return;
      const targetRef = element.dataset.combatTarget;
      if (targetRef === undefined) return;
      const target = view.visiblePlayers.find((player) => player.ref === targetRef);
      if (target === undefined) return;
      combatTargetRef = targetRef;
      focusedNodeId = target.node;
      lastPreview = null;
      lastPreviewContext = null;
      autoCombatPreview = false;
      dismissedCombatPreviewLease = null;
      globalThis.clearTimeout(previewTimeoutTimer);
      renderMap(view);
      renderCombat(view);
      announce(t("hud.announce.targetSelected", { target: visiblePlayerName(target) }));
    });
  });
  if (spectator) {
    tacticalReadout.innerHTML =
      `<div class="spectator-readout"><span>DELAYED INTELLIGENCE</span><strong>${
        escapeHtml(t("spectate.readout.title"))
      }</strong><small>${escapeHtml(t("spectate.readout.detail"))}</small>${
        uiDisclosureMarkup(
          "warning",
          t("spectate.limits.label"),
          t("spectate.limits.title"),
          t("spectate.limits.body"),
        )
      }</div>`;
  } else renderTacticalReadout(current);
}

/** @param {_PlayerView} current */
function renderPlayer(current) {
  const weaponReadout = equippedWeaponReadout(current);
  const equippedWeapon = weaponReadout.kind;
  const weaponName = weaponReadout.name;
  const weaponResource = weaponReadout.resource;
  const progression = currentProgressionReadout(current);
  const { hp, hpPercent, maxHp } = progression;
  const armor = Math.min(45, normalizeInventoryMetric(current.self.armor) ?? 0);
  const signal = Math.min(100, normalizeInventoryMetric(current.self.signal) ?? 0);
  const survival = survivalReadout(current);
  const staminaPercent = Math.max(0, Math.min(100, survival.stamina / survival.max * 100));
  const hpState = hpPercent <= 33 ? "critical" : hpPercent <= 66 ? "wounded" : "healthy";
  const legacyPoints = normalizeInventoryMetric(current.self.legacyPoints) ?? 0;
  const disasterIntel = normalizeInventoryMetric(current.self.disasterIntel);
  const capacityUsed = normalizeInventoryMetric(current.self.capacity.used) ?? 0;
  const capacityTotal = Math.max(1, normalizeInventoryMetric(current.self.capacity.total) ?? 1);
  const armorPercent = Math.max(0, Math.min(100, armor / 45 * 100));
  const signalPercent = signal;
  const signalHigh = signal >= 60;
  const signalPulse = performance.now() < signalPulseUntilRealMs;
  const levelPulse = performance.now() < levelPulseUntilRealMs;
  const shoes = selfShoes(current.self);
  const injuries = selfInjuryParts(current.self);
  const injurySummary = selfInjurySummary(current.self);
  const injuryChips = injuries.length === 0
    ? `<span class="self-injury-none"><i aria-hidden="true">✓</i>${
      escapeHtml(t("hud.injury.none"))
    }</span>`
    : injuries.map((part) =>
      `<span class="self-injury-chip injury-${part}" title="${
        escapeHtml(t(`hud.injury.${part}.detail`))
      }"><i aria-hidden="true">${part === "leg" ? "⌁" : "◇"}</i><b>${
        escapeHtml(t(`hud.injury.${part}`))
      }</b><small>${escapeHtml(t(`hud.injury.${part}.detail`))}</small></span>`
    ).join("");
  const injuryMarkers = injuries.map((part) =>
    `<i class="silhouette-injury-marker injury-${part}" aria-hidden="true"></i>`
  ).join("");
  const playerActionUnlocked = current.self.status === "active" &&
    pendingCommandActions.size === 0 && current.self.casting === undefined;
  const equipReady = playerActionUnlocked && assistActionReady(current, "equip");
  const unequipReady = playerActionUnlocked && assistActionReady(current, "unequip");
  /** @param {"equip" | "unequip"} action */
  const equipmentLockCopy = (action) =>
    current.self.status !== "active"
      ? t("inventory.lock.status")
      : pendingCommandActions.size > 0
      ? t("hud.lock.pending")
      : current.self.casting !== undefined
      ? t(
        current.self.casting.item === "healthy_food" ||
          current.self.casting.item === "spoiled_food"
          ? "hud.lock.eating"
          : "hud.lock.treating",
      )
      : !assistActionReady(current, action)
      ? t("hud.lock.notYet")
      : "";
  const backpackWasOpen = playerPanel.querySelector(".loadout-inventory")?.hasAttribute("open") ??
    false;
  const focusedEquipItem = document.activeElement instanceof HTMLElement
    ? document.activeElement.dataset.equipItem
    : undefined;
  const focusedUnequipSlot = document.activeElement instanceof HTMLElement
    ? document.activeElement.dataset.unequipSlot
    : undefined;
  const selfCombatEffect = combatVisualEffects.find((effect) =>
    effect.target === current.self.playerId
  );
  const profession = PROFESSIONS[current.self.profession];
  const professionArt = PROFESSION_ART[current.self.profession];
  const portraitUrl = professionArt.token;
  const bodyArtUrl = professionArt.card;
  const silhouettePath = current.self.background === "rootbound"
    ? "M19 91 16 65l9-15-4-18 10-20 13-6 13 12 11 8 2 21-9 15-2 29H46l-3-27-7 29Z"
    : "M29 92 26 58l7-15-2-16 7-15 11-6 10 8 4 17-5 15 3 46H47l-4-36-4 36Z";
  const dossierName = connectedProfile?.displayName ?? current.self.playerId;
  const dossierIdentity = connectedProfile === null
    ? `${current.self.background.toUpperCase()} · ${t(profession.labelKey)}`
    : `${t(FACTIONS[connectedProfile.faction].shortLabelKey)} · ${
      t(profession.labelKey)
    } · ${current.self.playerId}`;
  const characterRoleLabel = t(profession.labelKey);
  const activeWeaponIcon = weaponReadout.icon;
  const equipmentMarkup = Object.entries(EQUIPMENT_SLOT_UI).map(([rawSlot, ui]) => {
    const slot = /** @type {import("@darkforest/protocol").EquipmentSlot} */ (rawSlot);
    const item = current.self.equipment[slot];
    const itemKind = typeof item?.kind === "string" ? item.kind : null;
    const itemName = itemKind === null
      ? t("inventory.slot.unknownItem")
      : itemDisplayName(itemKind);
    const itemDurability = normalizeInventoryMetric(item?.durability);
    const itemIcon = itemFieldIconUrl(itemKind);
    const cannotRemove = slot === "shoes";
    const classes = `equipment-slot equipment-slot-${slot}${
      armorBreakingSlot === slot ? " equipment-slot-breaking" : ""
    }${item === undefined ? " equipment-slot-empty" : ""}`;
    const content = `<span class="equipment-slot-glyph" aria-hidden="true">${
      itemIcon === null ? ui.glyph : `<img src="${itemIcon}" alt="">`
    }</span>
      <span class="equipment-slot-copy"><b>${escapeHtml(ui.label)}</b><strong>${
      item === undefined ? escapeHtml(t("inventory.slot.empty")) : escapeHtml(itemName)
    }</strong><small>${
      item === undefined
        ? escapeHtml(t("inventory.slot.notEquipped"))
        : itemDurability === null
        ? escapeHtml(t(cannotRemove ? "inventory.slot.fixed" : "inventory.slot.removable"))
        : escapeHtml(t("hud.weapon.durability", { value: itemDurability }))
    }</small></span>`;
    if (item === undefined || cannotRemove) {
      return `<div class="${classes}" aria-label="${
        escapeHtml(t("inventory.slot.aria", {
          slot: ui.label,
          item: item === undefined ? t("inventory.slot.emptyShort") : itemName,
        }))
      }">${content}</div>`;
    }
    return `<button type="button" class="${classes} equipment-slot-action" data-unequip-slot="${slot}" ${
      unequipReady ? "" : "disabled"
    } aria-label="${escapeHtml(t("inventory.unequip.aria", { item: itemName }))}">${content}<em>${
      escapeHtml(unequipReady ? t("inventory.unequip.action") : equipmentLockCopy("unequip"))
    }</em>${actionCooldownMarkup("unequip", current)}</button>`;
  }).join("");
  const playerSummary = document.getElementById("narrative-player-summary");
  if (playerSummary !== null) {
    const summary = t("hud.player.summary", {
      hp,
      stamina: survival.stamina,
      armor,
      signal,
      weapon: equippedWeapon?.toUpperCase() ?? t("situation.silhouette.unarmed"),
      used: capacityUsed,
      total: capacityTotal,
    });
    playerSummary.textContent = injuries.length === 0 ? summary : `${summary} · ${injurySummary}`;
  }
  const inventoryMarkup = current.self.inventory.map((item) => {
    const itemKind = typeof item.kind === "string" ? item.kind : "unknown_item";
    const itemName = itemDisplayName(
      /** @type {import("@darkforest/protocol").ItemKind} */ (itemKind),
    );
    const itemCount = normalizeInventoryMetric(item.count) ?? 0;
    const itemDurability = normalizeInventoryMetric(item.durability);
    const icon = itemFieldIconUrl(itemKind);
    const slot = equipmentSlotForItem(
      /** @type {import("@darkforest/protocol").ItemKind} */ (itemKind),
    );
    const previous = slot === null ? undefined : current.self.equipment[slot];
    const equipLabel = slot === null
      ? ""
      : previous === undefined
      ? t("inventory.equip.action", { item: itemName })
      : t("inventory.equip.swap", {
        item: itemName,
        previous: itemDisplayName(previous.kind),
      });
    return `<li title="${escapeHtml(itemName)} × ${
      escapeHtml(itemCount)
    }"><div class="inventory-item-main">${
      icon === null
        ? `<span class="loadout-fallback" aria-hidden="true">${
          escapeHtml(itemKind.slice(0, 2).toUpperCase())
        }</span>`
        : `<img src="${icon}" alt="">`
    }<b>${escapeHtml(itemName)}</b><small>×${escapeHtml(itemCount)}${
      itemDurability === null
        ? ""
        : ` · ${escapeHtml(t("hud.weapon.durability", { value: itemDurability }))}`
    }</small></div>${
      slot === null
        ? ""
        : `<button type="button" class="inventory-equip-button" data-equip-item="${
          escapeHtml(itemKind)
        }" ${equipReady ? "" : "disabled"} aria-label="${
          escapeHtml(t("inventory.equip.aria", {
            action: equipLabel,
            state: equipReady ? t("inventory.equip.ready") : equipmentLockCopy("equip"),
          }))
        }"><span>${escapeHtml(equipReady ? equipLabel : equipmentLockCopy("equip"))}</span>${
          actionCooldownMarkup("equip", current)
        }</button>`
    }</li>`;
  }).join("");
  playerPanel.innerHTML = `
    <article class="survivor-dossier survivor-status-${escapeHtml(current.self.status)}">
      <header class="survivor-dossier-header">
        <span class="survivor-portrait survivor-portrait-${escapeHtml(current.self.background)}">${
    portraitUrl === null
      ? '<b class="survivor-portrait-unknown" aria-hidden="true">?</b>'
      : `<img src="${escapeHtml(portraitUrl)}" alt="">`
  }<i aria-hidden="true"></i></span>
        <div class="survivor-profile"><p class="eyebrow">SURVIVOR DOSSIER</p><h2 id="player-heading">${
    escapeHtml(dossierName)
  }</h2><p><span>${escapeHtml(dossierIdentity)}</span><b>${
    escapeHtml(current.self.status.toUpperCase())
  }</b></p></div>
      </header>
      <section class="survivor-vitals" aria-label="${escapeHtml(t("hud.vitals.aria"))}">
        <div class="vital-card vital-hp is-${hpState}"><span>${
    escapeHtml(t("hud.vitals.hp"))
  }</span><strong>${hp}<small>/${maxHp}</small></strong><div role="progressbar" aria-label="${
    escapeHtml(t("hud.vitals.hp.aria", { state: t(`hud.vitals.hp.${hpState}`) }))
  }" aria-valuemin="0" aria-valuemax="${maxHp}" aria-valuenow="${hp}"><i style="width:${hpPercent}%"></i></div><em>${
    escapeHtml(t(`hud.vitals.hp.${hpState}`))
  }</em></div>
        <div class="vital-card vital-stamina ${survival.canRush ? "" : "is-low"} ${
    survival.discomfort ? "is-discomfort" : ""
  }" data-stamina-card="dossier"><span>${
    escapeHtml(t("hud.vitals.stamina"))
  }</span><strong><span data-stamina-value>${survival.stamina}</span><small>/${survival.max}</small></strong><div data-stamina-progress role="progressbar" aria-label="${
    escapeHtml(t("hud.vitals.stamina.aria", { cost: survival.rushCost }))
  }" aria-valuemin="0" aria-valuemax="${survival.max}" aria-valuenow="${survival.stamina}"><i data-stamina-fill style="width:${staminaPercent}%"></i><b style="left:${
    Math.min(100, survival.rushCost / survival.max * 100)
  }%">${survival.rushCost}</b></div><em data-stamina-status>${
    survival.discomfort && survival.discomfortUntilMs !== null
      ? `${
        escapeHtml(t("hud.vitals.discomfort"))
      } · <u data-deadline-ms="${survival.discomfortUntilMs}"></u>`
      : survival.canRush
      ? escapeHtml(t("hud.vitals.rushesLeft", {
        count: Math.floor(survival.stamina / Math.max(1, survival.rushCost)),
      }))
      : escapeHtml(t("hud.vitals.sneakOnly"))
  }</em></div>
        <div class="vital-card vital-armor"><span>${
    escapeHtml(t("hud.vitals.armor"))
  }</span><strong>${armor}<small>/45</small></strong><div role="progressbar" aria-label="${
    escapeHtml(t("hud.vitals.armor.aria"))
  }" aria-valuemin="0" aria-valuemax="45" aria-valuenow="${armor}"><i style="width:${armorPercent}%"></i></div></div>
        <div class="vital-card vital-signal ${signalHigh ? "is-exposed" : ""} ${
    signalPulse ? "signal-pulse" : ""
  }"><span>SIGNAL</span><strong>${signal}<small>/100</small></strong><div role="progressbar" aria-label="${
    escapeHtml(t("hud.vitals.signal.aria"))
  }" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${signal}"><i style="width:${signalPercent}%"></i><b style="left:60%">60</b></div><em>${
    escapeHtml(
      signalHigh
        ? t("hud.vitals.signal.exposed")
        : t("hud.vitals.signal.toExposure", { value: 60 - signal }),
    )
  }</em></div>
      </section>
      <section class="survivor-progression ${
    levelPulse ? "level-up-pulse" : ""
  }" data-level="${progression.level}">
        <header><span>${escapeHtml(t("hud.xp.label"))} ${progression.xp}</span><strong>${
    escapeHtml(t("hud.level.badge", { level: progression.level }))
  }</strong></header>
        <div role="progressbar" aria-label="${
    escapeHtml(t("hud.xp.label"))
  }" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${
    Math.round(progression.xpPercent)
  }"><i style="width:${progression.xpPercent}%"></i></div>
        <p>${
    escapeHtml(
      progression.capped
        ? t("hud.level.max")
        : t("hud.xp.toNext", { xp: progression.xpToNext ?? 0 }),
    )
  }</p>
      </section>
      <dl class="dossier-meta">
        <div><dt>${escapeHtml(t("hud.label.oath"))}</dt><dd>${
    escapeHtml(current.self.oath.toUpperCase())
  }</dd></div>
        <div><dt>Legacy</dt><dd>${legacyPoints}</dd></div>
        <div><dt>Intel</dt><dd>${disasterIntel ?? "—"}</dd></div>
        <div class="dossier-credits"><dt>${
    escapeHtml(t("hud.credits.label"))
  }</dt><dd>¢${current.self.credits}</dd></div>
      </dl>
      <section class="survivor-kit" aria-label="${escapeHtml(t("hud.kit.aria"))}">
        <div class="survivor-body-card ${
    injuries.length === 0 ? "" : "has-injury"
  }"><span>BODY STATUS</span><div class="player-silhouette silhouette-${
    escapeHtml(current.self.background)
  } silhouette-${escapeHtml(current.self.status)} ${signalHigh ? "silhouette-signal-high" : ""} ${
    bodyArtUrl === null ? "" : "has-character-art"
  }" style="--hp:${hpPercent}%" role="img" aria-label="${
    escapeHtml(t("hud.body.aria", {
      role: characterRoleLabel,
      status: current.self.status,
      hp,
    }))
  }">
        ${
    bodyArtUrl === null
      ? `<svg viewBox="0 0 84 100" aria-hidden="true">
          <defs><linearGradient id="hp-fill" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="currentColor"/><stop offset="1" stop-color="var(--paper)"/></linearGradient><clipPath id="hp-clip"><rect x="0" y="${
        100 - hpPercent
      }" width="84" height="${hpPercent}"/></clipPath></defs>
          <path class="silhouette-shell" d="${silhouettePath}"/>
          <path class="silhouette-hp" clip-path="url(#hp-clip)" d="${silhouettePath}"/>
        </svg>`
      : `<img class="character-body-art" src="${escapeHtml(bodyArtUrl)}" alt="">`
  }
        <span class="silhouette-status">${escapeHtml(current.self.status.toUpperCase())}</span>
        <span class="silhouette-oath" title="Oath ${escapeHtml(current.self.oath)}">${
    current.self.oath === "broken" ? "◇!" : current.self.oath === "oathed" ? "◇" : "—"
  }</span>
        <span class="silhouette-signal-rings" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="silhouette-injury-markers" aria-hidden="true">${injuryMarkers}</span>
        ${
    selfCombatEffect === undefined
      ? ""
      : `<span class="combat-float player-combat-float ${
        selfCombatEffect.hit ? "combat-float-hit" : "combat-float-miss"
      }" aria-hidden="true"><b class="violence-full">${
        selfCombatEffect.hit ? `−${selfCombatEffect.damage}` : "MISS"
      }</b><b class="violence-low">${selfCombatEffect.hit ? "HIT" : "MISS"}</b></span>`
  }
      </div><div class="self-injury-status" aria-label="${
    escapeHtml(injurySummary)
  }">${injuryChips}</div></div>
        <div class="active-weapon-card active-weapon-${
    escapeHtml(equippedWeapon ?? "empty")
  }" aria-label="${
    escapeHtml(t("hud.inHand.aria", { weapon: weaponName, resource: weaponResource }))
  }"><span>IN HAND</span>${
    equippedWeapon === null
      ? '<span class="loadout-fallback" aria-hidden="true">∅</span>'
      : activeWeaponIcon === null
      ? '<span class="loadout-fallback" aria-hidden="true">?</span>'
      : `<img src="${escapeHtml(activeWeaponIcon)}" alt="">`
  }<strong>${escapeHtml(weaponName)}</strong><small>${escapeHtml(weaponResource)}</small><em>${
    escapeHtml(t("action.slot.shoes"))
  } · ${
    shoes === null ? escapeHtml(t("hud.shoes.none")) : escapeHtml(itemDisplayName(shoes))
  }</em></div>
      </section>
      <section class="equipment-section"><header><span>LOADOUT · 6 SLOTS</span><strong>${
    escapeHtml(t("inventory.loadout.title"))
  }</strong></header><div class="equipment-slots" aria-label="${
    escapeHtml(t("inventory.loadout.aria"))
  }">${equipmentMarkup}</div></section>
      <details class="loadout-inventory ${capacityUsed >= capacityTotal ? "is-full" : ""}" ${
    backpackWasOpen ? "open" : ""
  }>
        <summary><span><b>${escapeHtml(t("action.slot.backpack"))}</b><small>${
    escapeHtml(t("inventory.capacity", {
      used: capacityUsed,
      total: capacityTotal,
      kinds: current.self.inventory.length,
    }))
  }</small></span><i aria-hidden="true"><b style="width:${
    Math.min(100, capacityUsed / capacityTotal * 100)
  }%"></b></i></summary>
        <ul>${
    inventoryMarkup ||
    `<li class="inventory-empty">${escapeHtml(t("inventory.empty"))}</li>`
  }</ul>
      </details>
    </article>
    ${actionFeedbackMarkup(["equip", "unequip", "pickup", "drop"])}
  `;
  playerPanel.querySelectorAll("[data-equip-item]").forEach((element) => {
    element.addEventListener("click", () => {
      if (!(element instanceof HTMLButtonElement) || element.dataset.equipItem === undefined) {
        return;
      }
      sendAction({
        action: "equip",
        item: /** @type {import("@darkforest/protocol").ItemKind} */ (element.dataset.equipItem),
      });
    });
  });
  playerPanel.querySelectorAll("[data-unequip-slot]").forEach((element) => {
    element.addEventListener("click", () => {
      if (!(element instanceof HTMLButtonElement) || element.dataset.unequipSlot === undefined) {
        return;
      }
      sendAction({
        action: "unequip",
        slot: /** @type {import("@darkforest/protocol").EquipmentSlot} */ (element.dataset
          .unequipSlot),
      });
    });
  });
  if (focusedEquipItem !== undefined || focusedUnequipSlot !== undefined) {
    queueMicrotask(() => {
      const selector = focusedEquipItem !== undefined
        ? `[data-equip-item="${CSS.escape(focusedEquipItem)}"]`
        : `[data-unequip-slot="${CSS.escape(focusedUnequipSlot ?? "")}"]`;
      const element = playerPanel.querySelector(selector);
      if (element instanceof HTMLButtonElement && !element.disabled) element.focus();
    });
  }
  updateTimers();
}

/** @param {_PlayerView} current */
function renderAssist(current) {
  if (!current.map.nodes.some((node) => node.id === assistDestination)) {
    assistDestination = current.self.node;
  }
  const decision = getAssistDecision(current);
  const intentOptions = /** @type {Array<[_AssistIntent, string, string]>} */ (
    ["survive", "scavenge", "conceal", "travel", "echo_intel", "hold"].map((intent) => [
      intent,
      t(`semi.intent.${intent}.label`),
      t(`semi.intent.${intent}.detail`),
    ])
  );
  const selectedIntent = intentOptions.find((entry) => entry[0] === assistIntent);
  const semiUnavailable = current.legacyPrompt !== undefined ||
    current.insightPrompt !== undefined || current.finale !== undefined ||
    current.phase === "reset" ||
    current.phase === "ended" || current.self.status === "downed" ||
    current.self.status === "eliminated";
  const destinationOptions = current.map.nodes.map((definition) => {
    const name = narrativeNodeName(current, definition.id);
    return `<option value="${definition.id}" ${
      assistDestination === definition.id ? "selected" : ""
    }>${escapeHtml(name)} · ${definition.id}</option>`;
  }).join("");
  const countdownMatches = assistCountdown !== null && decision.payload !== undefined &&
    assistCountdown.signature === `${current.stateVersion}:${decision.key}`;
  const actionSettling = decision.key === "pending-command" ||
    decision.key.startsWith("waiting-diff-");
  matchView.classList.toggle("control-semi", controlMode === "semi");
  assistPanel.innerHTML = `
    <div class="section-heading assist-heading">
      <div><p class="eyebrow">TACTICAL ASSIST · LOCAL</p><h2 id="assist-heading">${
    escapeHtml(t("semi.controlMode.heading"))
  }</h2></div>
      <span class="assist-live assist-live-${controlMode}"><i aria-hidden="true"></i>${
    controlMode === "semi" ? "SEMI ARMED" : controlMode.toUpperCase()
  }</span>
    </div>
    <div class="control-mode-switch" role="group" aria-label="${
    escapeHtml(t("semi.controlMode.heading"))
  }">
      ${
    [["manual", "MANUAL"], ["assist", "ASSIST"], ["semi", "SEMI"]]
      .map(([mode, label]) =>
        `<button type="button" data-control-mode="${mode}" aria-pressed="${controlMode === mode}" ${
          mode === "semi" && semiUnavailable ? "disabled" : ""
        }><b>${label}</b><small>${
          escapeHtml(t(`semi.controlMode.${mode}.detail`))
        }</small></button>`
      ).join("")
  }
    </div>
    <div class="engagement-policy-block">
      <span>${escapeHtml(t("semi.policy.prompt"))}</span>
      <div class="control-mode-switch engagement-policy-switch" role="group" aria-label="${
    escapeHtml(t("situation.policy.heading"))
  }">
        ${
    Object.entries(ENGAGEMENT_POLICY_COPY).map(([policy, copy]) =>
      `<button type="button" data-engagement-policy="${policy}" aria-pressed="${
        engagementPolicy === policy
      }"><b>${escapeHtml(copy.label)}</b><small>${escapeHtml(copy.detail)}</small></button>`
    ).join("")
  }
      </div>
    </div>
    <label class="assist-intent-select"><span>${
    escapeHtml(t("semi.intent.heading"))
  }</span><select id="assist-intent">
      ${
    intentOptions.map(([intent, label, detail]) =>
      `<option value="${intent}" ${
        assistIntent === intent ? "selected" : ""
      }>${label} · ${detail}</option>`
    ).join("")
  }
    </select></label>
    ${
    assistIntent === "travel"
      ? `<label class="assist-destination"><span>${
        escapeHtml(t("semi.destination.heading"))
      }</span><select id="assist-destination"><option value="">${
        escapeHtml(t("semi.destination.placeholder"))
      }</option>${destinationOptions}</select></label>`
      : ""
  }
    <article class="assist-decision assist-state-${decision.state}">
      <div class="assist-decision-icon" aria-hidden="true">${
    decision.state === "ready" ? "▷" : decision.state === "manual" ? "◇!" : "Ⅱ"
  }</div>
      ${
    actionSettling
      ? `<div class="assist-settling">${waitingDotsMarkup()}</div>`
      : `<div><span>NEXT SAFE ACTION</span><strong>${escapeHtml(decision.title)}</strong><p>${
        escapeHtml(decision.detail)
      }</p></div>`
  }
      ${
    countdownMatches && assistCountdown !== null
      ? `<div class="assist-countdown"><span>AUTO IN</span><b data-real-deadline-ms="${assistCountdown.endsAtRealMs}">3.0s</b></div>`
      : ""
  }
    </article>
    <div class="assist-actions">
      ${
    controlMode === "assist" && (decision.payload !== undefined || decision.preview !== undefined)
      ? `<button id="assist-execute" type="button">${
        escapeHtml(t(decision.preview === undefined ? "semi.execute" : "hud.combat.preview"))
      } <span aria-hidden="true">→</span></button>`
      : ""
  }
      ${
    controlMode === "semi" && countdownMatches
      ? `<button id="assist-cancel" type="button">${escapeHtml(t("semi.cancelStep"))}</button>`
      : ""
  }
      ${
    controlMode === "semi"
      ? '<button id="assist-take-control" class="take-control" type="button">TAKE CONTROL · ESC</button>'
      : ""
  }
    </div>
    <p class="assist-reason" role="status">${escapeHtml(assistPauseText(assistPausedReason))}</p>
    <ul class="assist-guardrails" aria-label="${escapeHtml(t("semi.guardrails.aria"))}">
      <li><b>ONE</b><span>${escapeHtml(t("semi.guardrails.one"))}</span></li>
      <li><b>HOLD</b><span>${escapeHtml(t("semi.guardrails.hold"))}</span></li>
      <li><b>POLICY</b><span>${escapeHtml(t("semi.guardrails.policy"))}</span></li>
    </ul>
    <details class="assist-explain"><summary>${escapeHtml(t("semi.explain.summary"))}</summary><p>${
    escapeHtml(t("semi.explain.body", {
      intent: selectedIntent?.[2] ?? t("semi.explain.noIntent"),
      policy: ENGAGEMENT_POLICY_COPY[engagementPolicy].label,
    }))
  }</p></details>`;

  assistPanel.querySelectorAll("[data-control-mode]").forEach((element) => {
    element.addEventListener("click", () => {
      if (!(element instanceof HTMLButtonElement)) return;
      const nextMode = /** @type {_ControlMode} */ (element.dataset.controlMode);
      if (nextMode === "semi" && semiUnavailable) return;
      controlMode = nextMode;
      assistCountdown = null;
      assistPausedReason = { key: `semi.paused.mode.${nextMode}` };
      renderAssist(current);
      renderTopbar(current);
      renderNarrativeStatusbar(current);
      renderTacticalArenaActions(current);
    });
  });
  assistPanel.querySelectorAll("[data-engagement-policy]").forEach((element) => {
    element.addEventListener("click", () => {
      if (!(element instanceof HTMLButtonElement)) return;
      const policy = element.dataset.engagementPolicy;
      if (policy !== "avoid" && policy !== "retaliate" && policy !== "hunt") return;
      engagementPolicy = policy;
      assistCountdown = null;
      lastPreview = null;
      lastPreviewContext = null;
      assistPausedReason = {
        key: "semi.paused.policyChanged",
        params: { policy: { key: `situation.policy.${policy}.label` } },
      };
      saveAssistPreferences();
      renderAssist(current);
      renderTacticalArenaActions(current);
    });
  });
  document.getElementById("assist-intent")?.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLSelectElement)) return;
    assistIntent = /** @type {_AssistIntent} */ (event.target.value);
    if (assistIntent === "travel" && assistDestination === null) {
      assistDestination = current.self.node;
    }
    assistCountdown = null;
    assistPausedReason = { key: "semi.paused.intentChanged" };
    saveAssistPreferences();
    renderAssist(current);
    renderTacticalArenaActions(current);
  });
  document.getElementById("assist-destination")?.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLSelectElement)) return;
    assistDestination = event.target.value === ""
      ? null
      : /** @type {import("@darkforest/protocol").NodeId} */ (event.target.value);
    assistCountdown = null;
    assistPausedReason = { key: "semi.paused.destinationChanged" };
    saveAssistPreferences();
    renderAssist(current);
    renderTacticalArenaActions(current);
  });
  document.getElementById("assist-execute")?.addEventListener("click", () => {
    if (decision.preview !== undefined) {
      const target = current.visiblePlayers.find((player) =>
        player.ref === decision.preview?.target
      );
      if (target === undefined) return;
      requestCombatPreview(current, target, decision.preview.weapon);
      assistPausedReason = { key: "semi.paused.previewRequested" };
    } else if (decision.payload !== undefined) {
      sendAction(decision.payload, "assist");
      assistPausedReason = { key: "semi.paused.confirmed" };
    } else return;
    renderAssist(current);
  });
  document.getElementById("assist-cancel")?.addEventListener("click", () => {
    pauseSemi({ key: "semi.paused.cancelled" });
  });
  document.getElementById("assist-take-control")?.addEventListener("click", () => {
    controlMode = "manual";
    assistCountdown = null;
    assistPausedReason = { key: "semi.paused.takeControl" };
    renderAssist(current);
    renderTopbar(current);
    renderNarrativeStatusbar(current);
    renderTacticalArenaActions(current);
  });
  updateTimers();
}

/** @param {string} commandId @param {Partial<_NarrativeEntry>} patch */
function updateActionLog(commandId, patch) {
  const id = `action:${commandId}`;
  const existing = narrativeEntries.find((entry) => entry.id === id);
  if (existing === undefined) return;
  appendNarrative([{ ...existing, ...patch, id }]);
}

/** @param {string} requestId @param {Partial<_NarrativeEntry>} patch */
function updatePreviewLog(requestId, patch) {
  const id = `preview:${requestId}`;
  const existing = narrativeEntries.find((entry) => entry.id === id);
  if (existing === undefined) return;
  appendNarrative([{ ...existing, ...patch, id }]);
}

/** @param {string} commandId */
function clearPendingCommand(commandId) {
  pendingCommandActions.delete(commandId);
  pendingCommandMeta.delete(commandId);
  pendingDecisionCommandOrigins.delete(commandId);
  assistCommandIds.delete(commandId);
}

/** @param {number} stateVersion */
function settleAcceptedCommands(stateVersion) {
  for (const [commandId, meta] of pendingCommandMeta) {
    if (!meta.accepted || stateVersion <= meta.expectedStateVersion) continue;
    updateActionLog(commandId, { status: "resolved", label: t("action.status.resolved") });
    clearPendingCommand(commandId);
  }
}

/** @param {number} snapshotVersion */
function clearPendingCommandsAfterSnapshot(snapshotVersion) {
  for (const [commandId, meta] of pendingCommandMeta) {
    if (meta.accepted && snapshotVersion > meta.expectedStateVersion) {
      updateActionLog(commandId, { status: "resolved", label: t("action.status.resolved") });
    } else {
      updateActionLog(commandId, {
        status: "rejected",
        label: t("action.status.reselecting"),
        text: rejectionNarrativeLine("STALE_VERSION"),
      });
    }
  }
  pendingCommandActions.clear();
  pendingCommandMeta.clear();
  pendingDecisionCommandOrigins.clear();
  assistCommandIds.clear();
  pendingMovementNarratives.clear();
  tacticalArenaMovementStyle = null;
  syncCharacterTravelMotion(tacticalArenaTokens, null);
  pendingPickupNarratives.clear();
  cooldownVisualStartByDeadline.clear();
}

/** @param {_ActionPayload} payload @param {"manual" | "assist" | "auto"=} source */
function sendAction(payload, source = "manual") {
  if (view === null) return null;
  if (socket?.readyState !== WebSocket.OPEN) {
    appendNarrative([{
      id: `system:closed-${crypto.randomUUID()}`,
      atGameMs: estimatedGameNowMs(),
      level: "self",
      text: t("narrative.client.connection_unavailable"),
      fatal: false,
      source: "derived",
      kind: "system",
      status: "rejected",
      label: t("action.status.rejected"),
    }]);
    renderNarrativeStory(view);
    return null;
  }
  if (pendingCommandActions.size > 0) {
    renderNarrativeMode(view);
    return null;
  }
  if (source === "manual") {
    pauseSemi({ key: "semi.paused.manualInput" }, false);
  }
  const commandId = crypto.randomUUID();
  const actionText = actionLogText(view, payload);
  pendingCommandActions.set(commandId, payload);
  pendingCommandMeta.set(commandId, {
    expectedStateVersion: view.stateVersion,
    sentAtRealMs: performance.now(),
    accepted: false,
    resyncRequested: false,
  });
  appendNarrative([{
    id: `action:${commandId}`,
    atGameMs: estimatedGameNowMs(),
    level: "self",
    text: actionText,
    fatal: false,
    source: "derived",
    kind: "action",
    status: "pending",
    label: t("action.status.pending"),
  }]);
  if (payload.action === "move") {
    const edge = edgeForMove(view, payload.to);
    if (edge !== undefined) {
      const startedAtGameMs = estimatedGameNowMs();
      pendingMovementNarratives.set(commandId, {
        edgeId: edge.id,
        destinationName: narrativeNodeName(view, payload.to),
        style: payload.style ?? "rush",
        startedAtGameMs,
        revealAtGameMs: startedAtGameMs + 500,
        revealAtRealMs: performance.now() + Math.max(40, 500 / Math.max(1, currentTimeScale())),
        accepted: false,
      });
    }
  }
  if (source === "auto") {
    assistCommandIds.add(commandId);
    assistBusyStateVersion = view.stateVersion;
    assistPausedReason = { key: "semi.paused.stepTaken" };
  }
  lastActionFeedback = null;
  const sent = send({
    type: "command",
    commandId,
    expectedStateVersion: view.stateVersion,
    payload,
  });
  if (!sent) {
    updateActionLog(commandId, {
      status: "rejected",
      label: t("action.status.rejected"),
      text: t("narrative.client.connection_unavailable"),
    });
    clearPendingCommand(commandId);
    scheduleMatchRender();
    return null;
  }
  scheduleMatchRender();
  return commandId;
}

/** @param {import("@darkforest/protocol").ActionType | import("@darkforest/protocol").ActionType[]} actions */
function actionFeedbackMarkup(actions) {
  const acceptedActions = Array.isArray(actions) ? actions : [actions];
  if (
    lastActionFeedback === null || lastActionFeedback.accepted ||
    !acceptedActions.includes(lastActionFeedback.action)
  ) return "";
  const code = lastActionFeedback.errorCode;
  const line = rejectionNarrativeLine(code, { shoe: lastActionFeedback.shoeSlot === true });
  const body = code === "CACHE_PRIORITY"
    ? countdownSentence(
      "hud.feedback.cachePriority",
      `<em data-deadline-seconds="${lastActionFeedback.retryAtMs ?? estimatedGameNowMs()}">0</em>`,
    )
    : code === "SPAWN_GRACE"
    ? countdownSentence("hud.feedback.spawnGrace", '<em data-deadline-ms="30000"></em>')
    : escapeHtml(line);
  const cooldown = code === "COOLDOWN_ACTIVE" && lastActionFeedback.retryAtMs !== undefined
    ? `<small aria-label="${
      escapeHtml(t("hud.cooldown.countdownAria"))
    }"><em data-deadline-ms="${lastActionFeedback.retryAtMs}"></em></small>`
    : "";
  return `<p class="action-feedback" role="alert"><span>${body}</span>${cooldown}</p>`;
}

/** @param {{errorCode?: string, retryAtMs?: number, shoeSlot?: boolean}} feedback */
function rejectionNotice(feedback) {
  const line = rejectionNarrativeLine(feedback.errorCode, { shoe: feedback.shoeSlot === true });
  if (feedback.errorCode === "SPAWN_GRACE") {
    return line.replace("{mm:ss}", formatDuration(30_000 - estimatedGameNowMs()));
  }
  if (feedback.errorCode !== "CACHE_PRIORITY") return line;
  const seconds = Math.max(
    0,
    Math.ceil(((feedback.retryAtMs ?? estimatedGameNowMs()) - estimatedGameNowMs()) / 1000),
  );
  return line.replace("{n}", String(seconds));
}

/** @param {_PlayerView} current */
function supplyShopLineKey(current) {
  return worldPhase(current.phase) === "darkforest"
    ? "shop.supply.reset"
    : `shop.supply.line${supplyShopLineIndex % 4 + 1}`;
}

/** @param {_PlayerView} current */
function updateSupplyShopLine(current) {
  const line = commandPanel.querySelector("[data-supply-shop-line]");
  if (!(line instanceof HTMLElement)) return;
  if (
    worldPhase(current.phase) !== "darkforest" &&
    performance.now() - supplyShopLineChangedAtRealMs >= 6_000
  ) {
    supplyShopLineIndex = (supplyShopLineIndex + 1) % 4;
    supplyShopLineChangedAtRealMs = performance.now();
  }
  line.textContent = t(supplyShopLineKey(current));
}

/** @param {_PlayerView} current @param {boolean} commandLocked */
function shopPanelMarkup(current, commandLocked) {
  const shop = shopCatalogPresentation(current, estimatedGameNowMs());
  if (!shop.available) return "";
  const side = shopTradeSide;
  const list = shop.entries.map((entry) => {
    const itemName = itemStackDisplayName({ kind: entry.item, count: entry.unitCount });
    const icon = itemFieldIconUrl(entry.item);
    const cooling = shop.cooling;
    const allowed = side === "buy" ? entry.canBuy : entry.canSell;
    const disabled = commandLocked || !allowed;
    const state = commandLocked
      ? t("hud.lock.pending")
      : cooling
      ? t("hud.cooldown.aria")
      : side === "buy" && entry.soldOut
      ? t("shop.stock.out")
      : side === "buy" && !entry.affordable
      ? t("shop.error.noCredits")
      : side === "sell" && !entry.owned
      ? t("shop.price.sell", { price: entry.sellPrice })
      : t(side === "buy" ? "shop.price.buy" : "shop.price.sell", {
        price: side === "buy" ? entry.buyPrice : entry.sellPrice,
      });
    const stock = entry.stockLeft === undefined
      ? "∞"
      : entry.stockLeft <= 0
      ? t("shop.stock.out")
      : t("shop.stock.left", { count: entry.stockLeft });
    return `<li class="supply-shop-item ${disabled ? "is-disabled" : ""}" data-shop-stock="${
      entry.stockLeft === undefined ? "unlimited" : entry.stockLeft <= 0 ? "out" : "limited"
    }">
      <button type="button" data-shop-trade="${side}" data-shop-item="${escapeHtml(entry.item)}" ${
      disabled ? "disabled" : ""
    } aria-label="${escapeHtml(`${itemName} · ${state}`)}">
        <span class="supply-shop-item-icon">${
      icon === null
        ? `<b aria-hidden="true">${escapeHtml(entry.item.slice(0, 2).toUpperCase())}</b>`
        : `<img src="${escapeHtml(icon)}" alt="">`
    }</span>
        <span class="supply-shop-item-copy"><b>${escapeHtml(itemName)}</b><small>${
      escapeHtml(
        side === "buy"
          ? `${t("shop.price.buy", { price: entry.buyPrice })} · ${stock}`
          : `${t("shop.price.sell", { price: entry.sellPrice })} · ×${entry.ownedCount}`,
      )
    }</small></span>
        <em>${
      cooling && !commandLocked
        ? `<span>${escapeHtml(state)}</span><i data-deadline-ms="${shop.cooldownUntilMs}"></i>`
        : escapeHtml(state)
    }</em>
      </button>
    </li>`;
  }).join("");
  return `<section class="supply-shop-panel" aria-labelledby="supply-shop-title">
    <header class="supply-shop-header">
      <span class="supply-shop-avatar" aria-hidden="true"><b>FIELD SUPPLY</b><i>LOCAL</i></span>
      <div><p class="eyebrow">${escapeHtml(t("hud.shop.here"))}</p><h3 id="supply-shop-title">${
    escapeHtml(t("shop.title"))
  }</h3><p data-supply-shop-line>${escapeHtml(t(supplyShopLineKey(current)))}</p></div>
      <strong class="supply-shop-balance"><small>${
    escapeHtml(t("hud.credits.label"))
  }</small>¢${shop.credits}</strong>
    </header>
    <div class="supply-shop-tabs" role="tablist" aria-label="${escapeHtml(t("shop.title"))}">
      <button type="button" role="tab" data-shop-side="buy" aria-selected="${side === "buy"}">${
    escapeHtml(t("shop.buy"))
  }</button>
      <button type="button" role="tab" data-shop-side="sell" aria-selected="${side === "sell"}">${
    escapeHtml(t("shop.sell"))
  }</button>
    </div>
    <ul class="supply-shop-catalog" data-shop-mode="${side}">${list}</ul>
    ${actionFeedbackMarkup(["shop_buy", "shop_sell"])}
  </section>`;
}

/** @param {_PlayerView} current */
function bindShopPanel(current) {
  commandPanel.querySelectorAll("[data-shop-side]").forEach((element) => {
    element.addEventListener("click", () => {
      if (!(element instanceof HTMLButtonElement)) return;
      const side = element.dataset.shopSide;
      if (side !== "buy" && side !== "sell") return;
      shopTradeSide = side;
      renderCommands(current);
    });
  });
  commandPanel.querySelectorAll("[data-shop-trade]").forEach((element) => {
    element.addEventListener("click", () => {
      if (
        !(element instanceof HTMLButtonElement) || element.disabled ||
        narrativePendingDecision !== null
      ) return;
      const side = element.dataset.shopTrade;
      const item = element.dataset.shopItem;
      const presentation = shopCatalogPresentation(current, estimatedGameNowMs());
      const entry = presentation.entries.find((candidate) => candidate.item === item);
      if (
        (side !== "buy" && side !== "sell") || entry === undefined ||
        (side === "buy" ? !entry.canBuy : !entry.canSell)
      ) return;
      const payload = /** @type {_ActionPayload} */ ({
        action: side === "buy" ? "shop_buy" : "shop_sell",
        item: entry.item,
      });
      const unitName = itemStackDisplayName({ kind: entry.item, count: entry.unitCount });
      executeNarrativePayload(
        current,
        payload,
        t(side === "buy" ? "shop.confirm.buy" : "shop.confirm.sell", {
          item: unitName,
          price: side === "buy" ? entry.buyPrice : entry.sellPrice,
        }),
        t(supplyShopLineKey(current)),
        {
          selector: `[data-shop-trade="${side}"][data-shop-item="${entry.item}"]`,
          reopenActionDrawer: true,
        },
      );
    });
  });
}

/** @param {_PlayerView} current */
function renderCommands(current) {
  const isActive = current.self.status === "active";
  const isEcho = current.self.status === "echo";
  const currentNode = current.nodes.find((node) => node.id === current.self.node);
  const commandLocked = pendingCommandActions.size > 0 || current.self.casting !== undefined;
  const itemRail = isActive
    ? partitionQuickUseItems(current.self.inventory)
    : { quick: [], overflow: [] };
  const groundCaches = visibleCacheOffers(current);
  const groundItemCount = groundCaches.reduce((total, cache) => total + cache.items.length, 0);
  const useItemDeadline = current.self.cooldownsUntilMs.use_item;
  const useItemCooling = useItemDeadline !== undefined && useItemDeadline > estimatedGameNowMs();
  const rescueDeadline = current.self.cooldownsUntilMs.rescue;
  const rescueCooling = rescueDeadline !== undefined && rescueDeadline > estimatedGameNowMs();
  const survival = survivalReadout(current);
  if (currentNode?.shop !== undefined) {
    if (shopAutoOpenedNode !== current.self.node) {
      manualActionDrawer.open = true;
      shopAutoOpenedNode = current.self.node;
    }
  } else shopAutoOpenedNode = null;
  const { maxHp } = currentProgressionReadout(current);
  const treatableInjury = hasTreatableInjury(current.self);
  const downedTargets = isActive
    ? [
      ...new Set(
        [
          ...current.visiblePlayers.filter((player) =>
            player.identified && player.status === "downed" && player.node === current.self.node &&
            player.playerId !== undefined
          ).map((player) => player.playerId ?? ""),
          ...matchEvents
            .filter((event) => event.kind === "player_downed" && event.node === current.self.node)
            .map((event) => event.kind === "player_downed" ? event.player : ""),
        ].filter((target) => target !== "" && !isContactRef(target)),
      ),
    ]
    : [];
  const cooldowns = Object.entries(current.self.cooldownsUntilMs).map(([action, until]) => `
    <li><span>${escapeHtml(action)}</span><em data-deadline-ms="${until}"></em></li>
  `).join("");
  /** @param {import("@darkforest/protocol").ActionType} action @param {string} label @param {string} detail @param {string=} attributes */
  const actionButton = (action, label, detail, attributes = "") => {
    const deadline = current.self.cooldownsUntilMs[action];
    const cooling = deadline !== undefined && deadline > estimatedGameNowMs();
    return `<button class="action-button action-${action}" type="button" data-action="${action}" ${
      cooling || commandLocked ? "disabled" : ""
    } ${attributes}>${actionIcon(action)}<span><b>${label}</b><small>${
      commandLocked ? escapeHtml(t("hud.lock.pending")) : cooling
        ? countdownSentence(
          "hud.cooldown.remaining",
          `<em class="action-cooldown" data-deadline-ms="${deadline}"></em>`,
        )
        : detail
    }</small></span>${cooling ? '<i class="cooldown-ring" aria-hidden="true"></i>' : ""}</button>`;
  };
  /** @param {import("@darkforest/protocol").ItemStack} item */
  const useItemButton = (item) => {
    const icon = itemFieldIconUrl(item.kind);
    const name = itemDisplayName(item.kind);
    const itemCount = normalizeInventoryMetric(item.count) ?? 0;
    const durability = normalizeInventoryMetric(item.durability);
    const depleted = item.kind === "trap_scanner" && durability === 0;
    const healthyFood = current.survivalRules.healthyFood;
    const spoiledFood = current.survivalRules.spoiledFood;
    const foodPreview = item.kind === "healthy_food"
      ? t("hud.food.healthyPreview", {
        hp: current.self.hp,
        hpAfter: Math.min(maxHp, current.self.hp + healthyFood.hp),
        stamina: survival.stamina,
        staminaAfter: Math.min(survival.max, survival.stamina + healthyFood.stamina),
        seconds: Math.ceil(healthyFood.castMs / 1_000),
      })
      : item.kind === "spoiled_food"
      ? t("hud.food.spoiledPreview", {
        stamina: survival.stamina,
        staminaAfter: Math.min(survival.max, survival.stamina + spoiledFood.stamina),
        seconds: Math.ceil(spoiledFood.discomfortMs / 1_000),
      })
      : null;
    const noRecoveryNeeded = item.kind === "bandage" || item.kind === "medkit"
      ? current.self.hp >= maxHp && !treatableInjury
      : item.kind === "healthy_food"
      ? current.self.hp >= maxHp && survival.stamina >= survival.max
      : item.kind === "spoiled_food"
      ? survival.stamina >= survival.max
      : false;
    const state = commandLocked
      ? t("hud.item.inProgress")
      : useItemCooling
      ? t("hud.cooldown.aria")
      : depleted
      ? t("hud.item.depleted")
      : noRecoveryNeeded
      ? t("hud.item.notNeeded")
      : (item.kind === "bandage" || item.kind === "medkit") && treatableInjury
      ? selfInjurySummary(current.self)
      : foodPreview !== null
      ? foodPreview
      : item.kind === "scrap"
      ? t("hud.item.repair")
      : item.kind === "insight_calamity_echo"
      ? t("hud.item.useHere")
      : t("hud.item.usable");
    const disabled = commandLocked || useItemCooling || depleted || noRecoveryNeeded;
    return `<button class="quick-item-button" type="button" data-action="use_item" data-item="${
      escapeHtml(item.kind)
    }" ${disabled ? "disabled" : ""} aria-label="${
      escapeHtml(t("hud.item.aria", { item: name, count: itemCount, state }))
    }">${
      icon === null ? actionIcon("use") : `<img class="action-icon" src="${icon}" alt="">`
    }<span><b>${escapeHtml(name)}</b><small>×${escapeHtml(itemCount)} · ${
      escapeHtml(state)
    }</small></span>${actionCooldownMarkup("use_item", current)}</button>`;
  };
  commandPanel.innerHTML = `
    ${shopPanelMarkup(current, commandLocked)}
    <div class="section-heading"><div><p class="eyebrow">FIELD ACTIONS</p><h2 id="command-heading">${
    escapeHtml(t("actions.title"))
  }</h2></div><span class="action-legend">${escapeHtml(t("hud.actions.legend"))}</span></div>
    <div class="command-buttons action-bar">
      ${
    isActive
      ? `
        ${
        groundItemCount > 0
          ? `<button class="action-button action-field-cache" type="button" data-field-cache ${
            commandLocked ? "disabled" : ""
          }>${actionIcon("search")}<span><b>${
            escapeHtml(t("hud.groundLoot.count", { count: groundItemCount }))
          }</b><small>${
            escapeHtml(commandLocked ? t("hud.lock.pending") : t("hud.groundLoot.action"))
          }</small></span></button>`
          : ""
      }
        ${
        (currentNode?.searchesLeft ?? 0) > 0
          ? actionButton(
            "search",
            "SEARCH",
            escapeHtml(t("hud.action.searchesLeft", { count: currentNode?.searchesLeft ?? 0 })),
          )
          : ""
      }
        ${
        (currentNode?.coverSlotsFree ?? 0) > 0 && !current.self.hidden
          ? actionButton(
            "hide",
            "HIDE",
            escapeHtml(t("hud.action.coverLeft", { count: currentNode?.coverSlotsFree ?? 0 })),
          )
          : ""
      }
        ${
        current.self.onceAbilityUsed
          ? ""
          : actionButton("once_ability", "ABILITY", escapeHtml(t("hud.action.oncePerMatch")))
      }
      `
      : ""
  }
      ${
    isEcho
      ? actionButton(
        "echo_attune",
        escapeHtml(t("situation.option.attune.label")),
        escapeHtml(t("situation.option.attune.note")),
      )
      : ""
  }
      ${
    downedTargets.map((target) => {
      const downedEvent = matchEvents.findLast((event) =>
        event.kind === "player_downed" && event.player === target
      );
      return `<button class="action-button action-rescue" type="button" data-action="rescue" data-target="${
        escapeHtml(target)
      }" ${commandLocked || rescueCooling ? "disabled" : ""}>${
        actionIcon("rescue")
      }<span><b>RESCUE ${escapeHtml(target)}</b><small>${
        commandLocked ? escapeHtml(t("hud.lock.pending")) : rescueCooling
          ? countdownSentence(
            "hud.rescue.cooldown",
            `<em class="action-cooldown" data-deadline-ms="${rescueDeadline}"></em>`,
          )
          : downedEvent?.kind === "player_downed"
          ? countdownSentence(
            "hud.rescue.window",
            `<em data-deadline-ms="${downedEvent.downedUntilMs}"></em>`,
          )
          : escapeHtml(t("hud.rescue.windowDefault"))
      }</small></span>${
        rescueCooling ? '<i class="cooldown-ring" aria-hidden="true"></i>' : ""
      }</button>`;
    }).join("")
  }
    </div>
    <section class="quick-item-section" aria-labelledby="quick-item-heading">
      <header><div><span>QUICK ITEMS</span><h3 id="quick-item-heading">${
    escapeHtml(t("hud.quickItems.title"))
  }</h3></div><small>${itemRail.quick.length} / 3</small></header>
      <div class="quick-item-rail">${
    itemRail.quick.map(useItemButton).join("") ||
    `<p class="quick-item-empty">${
      escapeHtml(t(isActive ? "hud.quickItems.empty" : "hud.quickItems.locked"))
    }</p>`
  }</div>
      ${
    itemRail.overflow.length === 0
      ? ""
      : `<details class="quick-item-overflow"><summary>${
        escapeHtml(t("hud.quickItems.overflow"))
      } <span>${itemRail.overflow.length}</span></summary><div>${
        itemRail.overflow.map(useItemButton).join("")
      }</div></details>`
  }
    </section>
    ${
    actionFeedbackMarkup([
      "search",
      "hide",
      "once_ability",
      "echo_attune",
      "rescue",
      "use_item",
    ])
  }
    <div class="cooldown-panel">
      <h3>${escapeHtml(t("hud.cooldown.title"))}</h3>
      ${
    cooldowns === ""
      ? `<p class="empty-state">${escapeHtml(t("hud.cooldown.empty"))}</p>`
      : `<ul>${cooldowns}</ul>`
  }
    </div>
  `;
  commandPanel.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("click", () => {
      if (!(element instanceof HTMLButtonElement)) return;
      switch (element.dataset.action) {
        case "search":
          sendAction({ action: "search" });
          break;
        case "hide":
          sendAction({ action: "hide" });
          break;
        case "once_ability":
          if (playViewMode === "narrative") {
            narrativeRouteMenuOpen = false;
            executeNarrativePayload(
              current,
              { action: "once_ability" },
              t("action.name.once_ability"),
              t("confirm.onceAbility.context"),
            );
          } else sendAction({ action: "once_ability" });
          break;
        case "echo_attune":
          sendAction({ action: "echo_attune" });
          break;
        case "rescue":
          if (element.dataset.target !== undefined) {
            if (playViewMode === "narrative") {
              narrativeRouteMenuOpen = false;
              executeNarrativePayload(
                current,
                { action: "rescue", target: element.dataset.target },
                t("action.name.rescue", { target: element.dataset.target }),
                t("confirm.rescue.context"),
              );
            } else sendAction({ action: "rescue", target: element.dataset.target });
          }
          break;
        case "use_item":
          if (element.dataset.item !== undefined) {
            sendAction({
              action: "use_item",
              item: /** @type {import("@darkforest/protocol").ItemKind} */ (element.dataset.item),
              targetNode: current.self.node,
            });
          }
          break;
      }
    });
  });
  commandPanel.querySelector("[data-field-cache]")?.addEventListener("click", () => {
    const offers = visibleCacheOffers(current);
    if (offers.length === 0) return;
    narrativeCacheOffer = offers[0];
    narrativeCacheDecisionOpen = true;
    renderNarrativeMode(current);
  });
  bindShopPanel(current);
  updateTimers();
}

/** Passive stamina ticks update food affordances in place so the fixed action panel keeps focus. @param {_PlayerView} current */
function patchFoodRecoveryButtons(current) {
  const survival = survivalReadout(current);
  const { maxHp } = currentProgressionReadout(current);
  const commandLocked = pendingCommandActions.size > 0 || current.self.casting !== undefined;
  const useItemDeadline = current.self.cooldownsUntilMs.use_item;
  const useItemCooling = useItemDeadline !== undefined && useItemDeadline > estimatedGameNowMs();
  for (const kind of /** @type {const} */ (["healthy_food", "spoiled_food"])) {
    const button = commandPanel.querySelector(`[data-action="use_item"][data-item="${kind}"]`);
    const item = current.self.inventory.find((candidate) => candidate.kind === kind);
    if (!(button instanceof HTMLButtonElement) || item === undefined) continue;
    const noRecoveryNeeded = kind === "healthy_food"
      ? current.self.hp >= maxHp && survival.stamina >= survival.max
      : survival.stamina >= survival.max;
    const preview = kind === "healthy_food"
      ? t("hud.food.healthyPreview", {
        hp: current.self.hp,
        hpAfter: Math.min(maxHp, current.self.hp + current.survivalRules.healthyFood.hp),
        stamina: survival.stamina,
        staminaAfter: Math.min(
          survival.max,
          survival.stamina + current.survivalRules.healthyFood.stamina,
        ),
        seconds: Math.ceil(current.survivalRules.healthyFood.castMs / 1_000),
      })
      : t("hud.food.spoiledPreview", {
        stamina: survival.stamina,
        staminaAfter: Math.min(
          survival.max,
          survival.stamina + current.survivalRules.spoiledFood.stamina,
        ),
        seconds: Math.ceil(current.survivalRules.spoiledFood.discomfortMs / 1_000),
      });
    const state = commandLocked
      ? t("hud.item.inProgress")
      : useItemCooling
      ? t("hud.cooldown.aria")
      : noRecoveryNeeded
      ? t("hud.item.notNeeded")
      : preview;
    button.disabled = commandLocked || useItemCooling || noRecoveryNeeded;
    const count = normalizeInventoryMetric(item.count) ?? 0;
    const small = button.querySelector("small");
    if (small instanceof HTMLElement) small.textContent = `×${count} · ${state}`;
    button.setAttribute(
      "aria-label",
      t("hud.item.aria", { item: itemDisplayName(kind), count, state }),
    );
  }
}

/** @param {_PlayerView} current @param {import("@darkforest/protocol").VisiblePlayer} target @param {import("@darkforest/protocol").WeaponKind} weapon @param {boolean=} automatic @returns {boolean} */
function requestCombatPreview(current, target, weapon, automatic = false) {
  const foreground = gameplayForeground(current);
  if (
    foreground.kind === "terminal" || foreground.kind === "forced" ||
    foreground.kind === "confirm"
  ) return false;
  const attackDeadline = current.self.cooldownsUntilMs.attack;
  const blocked = combatActionBlockReason({
    status: current.self.status,
    pending: pendingCommandActions.size > 0,
    casting: current.self.casting !== undefined,
    spawnGrace: spawnGraceActive(current),
    cooling: attackDeadline !== undefined && attackDeadline > estimatedGameNowMs(),
    resource: combatWeaponBlockReason(current.self.inventory, weapon),
  });
  if (blocked !== null) return false;
  if (!automatic) {
    dismissedCombatPreviewLease = null;
    tacticalArenaPreviewRetryEligibleLease = null;
    tacticalArenaPreviewRetriedLease = null;
  }
  if (tacticalArenaFieldOwnsContacts(current)) tacticalArenaTargetRef = target.ref;
  combatTargetRef = target.ref;
  combatWeaponKind = weapon;
  const requestId = crypto.randomUUID();
  if (!send({ type: "preview", requestId, target: target.ref, weapon })) {
    appendNarrative([{
      id: `preview:${requestId}`,
      atGameMs: estimatedGameNowMs(),
      level: "self",
      text: t("narrative.client.preview_prepare", { target: visiblePlayerName(target) }),
      fatal: false,
      source: "derived",
      kind: "action",
      status: "rejected",
      label: t("action.status.rejected"),
    }]);
    renderNarrativeStory(current);
    return false;
  }
  lastPreview = null;
  lastPreviewContext = {
    requestId,
    target: target.ref,
    node: target.node,
    scope: target.node === current.self.node ? "same-node" : "adjacent-los",
    weapon,
    requestedStateVersion: current.stateVersion,
    combatLease: combatPreviewLease(current, target.ref, weapon),
  };
  autoCombatPreview = automatic;
  appendNarrative([{
    id: `preview:${requestId}`,
    atGameMs: estimatedGameNowMs(),
    level: "self",
    text: t("narrative.client.preview_prepare", { target: visiblePlayerName(target) }),
    fatal: false,
    source: "derived",
    kind: "action",
    status: "pending",
    label: t("action.status.preview_pending"),
  }]);
  globalThis.clearTimeout(previewTimeoutTimer);
  previewTimeoutTimer = globalThis.setTimeout(() => {
    if (lastPreviewContext?.requestId !== requestId || lastPreview !== null) return;
    dismissedCombatPreviewLease = lastPreviewContext.combatLease;
    tacticalArenaPreviewRetryEligibleLease = lastPreviewContext.combatLease;
    updatePreviewLog(requestId, {
      status: "rejected",
      label: t("action.status.reselecting"),
      text: rejectionNarrativeLine("STALE_VERSION"),
    });
    lastPreviewContext = null;
    autoCombatPreview = false;
    if (view !== null) renderMatch();
  }, 5_000);
  announce(t("hud.announce.previewing"));
  if (playViewMode === "narrative") renderNarrativeMode(current);
  return true;
}

/** @param {_PlayerView} current */
function automaticCombatPreviewSuppressed(current) {
  return controlMode === "semi" || narrativeCommanderActive || current.phase === "reset" ||
    current.phase === "ended" || current.legacyPrompt !== undefined ||
    current.insightPrompt !== undefined || finaleRequiresInput(current);
}

/**
 * Pre-warm the authoritative Preview after the selected target or weapon becomes actionable.
 * The microtask keeps network work outside renderCombat and rechecks the lease before sending,
 * so repeated renders and heartbeat diffs cannot produce duplicate requests.
 *
 * @param {_PlayerView} current
 * @param {import("@darkforest/protocol").VisiblePlayer} target
 * @param {import("@darkforest/protocol").WeaponKind} weapon
 */
function scheduleAutomaticCombatPreview(current, target, weapon) {
  if (tacticalArenaFieldOwnsContacts(current)) return;
  if (automaticCombatPreviewSuppressed(current)) return;
  const scheduledLease = automaticCombatPreviewLease(
    current,
    target.ref,
    weapon,
    lastPreviewContext,
    dismissedCombatPreviewLease,
  );
  if (scheduledLease === null) return;
  queueMicrotask(() => {
    if (view !== current || automaticCombatPreviewSuppressed(current)) return;
    if (combatTargetRef !== target.ref || combatWeaponKind !== weapon) return;
    const visibleTarget = current.visiblePlayers.find((player) => player.ref === target.ref);
    if (visibleTarget === undefined) return;
    const currentLease = automaticCombatPreviewLease(
      current,
      visibleTarget.ref,
      weapon,
      lastPreviewContext,
      dismissedCombatPreviewLease,
    );
    if (currentLease !== scheduledLease) return;
    if (lastPreviewContext !== null) {
      updatePreviewLog(lastPreviewContext.requestId, {
        status: "resolved",
        label: t("action.status.reselecting"),
      });
      globalThis.clearTimeout(previewTimeoutTimer);
      lastPreview = null;
      lastPreviewContext = null;
    }
    if (!requestCombatPreview(current, visibleTarget, weapon, true)) {
      dismissedCombatPreviewLease = scheduledLease;
    }
    renderCombat(current);
  });
}

/** @param {_PlayerView} current */
function renderCombat(current) {
  if (current.phase === "ended") {
    combatPanel.hidden = true;
    combatPanel.innerHTML = "";
    combatTargetRef = null;
    combatWeaponKind = null;
    lastPreview = null;
    lastPreviewContext = null;
    return;
  }
  if (!gameplayForeground(current).lowerActionsAvailable) {
    combatPanel.hidden = true;
    return;
  }
  combatPanel.hidden = false;
  const weapons = current.self.inventory.filter((item, index, inventory) =>
    isWeaponKind(item.kind) &&
    inventory.findIndex((candidate) => candidate.kind === item.kind) === index
  );
  const targets = [...current.visiblePlayers].sort((a, b) => {
    const aAdjacent = a.node === current.self.node ? 0 : 1;
    const bAdjacent = b.node === current.self.node ? 0 : 1;
    return aAdjacent - bAdjacent || a.node.localeCompare(b.node) ||
      a.ref.localeCompare(b.ref);
  });
  if (combatTargetRef === null || !targets.some((target) => target.ref === combatTargetRef)) {
    combatTargetRef = targets[0]?.ref ?? null;
  }
  const selectedTarget = targets.find((target) => target.ref === combatTargetRef);
  const preferredWeapon = combatWeaponKind ?? lastPreviewContext?.weapon ??
    current.self.equippedWeapon ?? weapons[0]?.kind;
  const selectedWeapon = /** @type {import("@darkforest/protocol").WeaponKind | undefined} */ (
    weapons.some((weapon) => weapon.kind === preferredWeapon) ? preferredWeapon : weapons[0]?.kind
  );
  combatWeaponKind = selectedWeapon ?? null;
  /** @param {"NO_ITEM" | "NO_DURABILITY" | "NO_AMMO" | null} reason */
  const weaponBlockCopy = (reason) => {
    if (reason === "NO_ITEM") return t("combat.block.no_item");
    if (reason === "NO_DURABILITY") {
      return t("combat.block.no_durability", {
        item: selectedWeapon === undefined
          ? t("combat.block.weapon")
          : itemDisplayName(selectedWeapon),
      });
    }
    if (reason === "NO_AMMO") return t("combat.block.no_ammo");
    return "";
  };
  const selectedWeaponBlock = selectedWeapon === undefined
    ? "NO_ITEM"
    : combatWeaponBlockReason(current.self.inventory, selectedWeapon);
  const selectedCombatLease = selectedTarget === undefined || selectedWeapon === undefined
    ? null
    : combatPreviewLease(current, selectedTarget.ref, selectedWeapon);
  const previewDismissed = selectedCombatLease !== null &&
    dismissedCombatPreviewLease === selectedCombatLease;
  const previewValid = lastPreview !== null && lastPreview.allowed &&
    lastPreviewContext?.target === combatTargetRef &&
    lastPreviewContext.weapon === selectedWeapon &&
    lastPreviewContext.combatLease === selectedCombatLease;
  const attackDeadline = current.self.cooldownsUntilMs.attack;
  const attackCooling = attackDeadline !== undefined && attackDeadline > estimatedGameNowMs();
  const spawnGrace = spawnGraceActive(current);
  const combatBlock = combatActionBlockReason({
    status: current.self.status,
    pending: pendingCommandActions.size > 0,
    casting: current.self.casting !== undefined,
    spawnGrace,
    cooling: attackCooling,
    resource: selectedWeaponBlock,
  });
  /** @param {ReturnType<typeof combatActionBlockReason>} reason */
  const combatBlockCopy = (reason) => {
    if (reason === "STATUS") return t("hud.combat.block.status");
    if (reason === "PENDING") return t("hud.lock.pending");
    if (reason === "CASTING") {
      return t(
        current.self.casting?.item === "healthy_food" ||
          current.self.casting?.item === "spoiled_food"
          ? "hud.lock.eating"
          : "hud.lock.treating",
      );
    }
    if (reason === "SPAWN_GRACE") return t("hud.combat.block.spawnGrace");
    if (reason === "COOLDOWN") return t("hud.lock.notYet");
    return weaponBlockCopy(reason);
  };
  const combatStep = combatBlock === "PENDING"
    ? t("hud.combat.step.pending")
    : combatBlock === "CASTING"
    ? t("hud.combat.step.casting")
    : combatBlock === "SPAWN_GRACE"
    ? t("hud.combat.step.grace")
    : combatBlock === "COOLDOWN"
    ? t("hud.combat.step.cooldown")
    : selectedWeaponBlock !== null
    ? t("hud.combat.step.resource")
    : previewValid
    ? t("hud.combat.step.ready")
    : previewDismissed
    ? t("hud.combat.step.held")
    : t("hud.combat.step.assessing");
  combatPanel.innerHTML = `
    <div class="section-heading"><div><p class="eyebrow">${
    escapeHtml(t("hud.combat.autoFlow"))
  }</p><h2 id="combat-heading">${
    escapeHtml(t("combatDecision.title"))
  }</h2></div><span class="combat-step">${combatStep}</span></div>
    ${
    current.self.status !== "active"
      ? `<p class="empty-state">${
        escapeHtml(t("hud.combat.empty.status", { status: current.self.status }))
      }</p>`
      : weapons.length === 0
      ? `<p class="empty-state">${escapeHtml(t("hud.combat.empty.weapon"))}</p>`
      : targets.length === 0
      ? `<p class="empty-state">${escapeHtml(t("hud.combat.empty.target"))}</p>`
      : `
        <div class="combat-controls">
          <label><span>${
        escapeHtml(t("hud.combat.targetLabel"))
      }</span><select id="combat-target">${
        targets.map((player) => {
          const scope = player.node === current.self.node
            ? t("hud.combat.scope.sameNode")
            : t("hud.combat.scope.adjacentLos");
          const identity = visiblePlayerName(player);
          const displayIdentity = player.identified ? identity : `${identity} · ${player.ref}`;
          const visibleLevel = identifiedPlayerLevel(player);
          const levelDetail = visibleLevel === null
            ? ""
            : ` · ${t("hud.level.badge", { level: visibleLevel })}`;
          const detail = player.identified
            ? `${player.hpBand ?? t("hud.combat.unknownHp")}${levelDetail} · ${
              armorSilhouetteLabel(player.armorSilhouette)
            }`
            : `${
              t("hud.combat.target.outline", {
                weapon: player.equippedWeapon === null
                  ? t("situation.silhouette.unarmed")
                  : itemDisplayName(player.equippedWeapon),
              })
            } · ${armorSilhouetteLabel(player.armorSilhouette)} · ${
              t("hud.combat.identityHidden")
            }`;
          const gaitDetail = player.limping ? ` · ${t("hud.limping")}` : "";
          return `<option value="${escapeHtml(player.ref)}" ${
            player.ref === combatTargetRef ? "selected" : ""
          }>${escapeHtml(displayIdentity)} · ${
            escapeHtml(narrativeNodeName(current, player.node))
          } · ${scope} · ${escapeHtml(`${detail}${gaitDetail}`)}</option>`;
        }).join("")
      }</select></label>
          <label><span>${
        escapeHtml(t("hud.combat.weaponLabel"))
      }</span><select id="combat-weapon">${
        weapons.map((weapon) => {
          const block = combatWeaponBlockReason(
            current.self.inventory,
            /** @type {import("@darkforest/protocol").WeaponKind} */ (weapon.kind),
          );
          return `<option value="${escapeHtml(weapon.kind)}" ${
            weapon.kind === selectedWeapon ? "selected" : ""
          }>${escapeHtml(itemDisplayName(weapon.kind))}${
            block === null ? "" : ` · ${escapeHtml(weaponBlockCopy(block))}`
          }</option>`;
        }).join("")
      }</select></label>
          <div class="combat-buttons">
            <button id="attack-button" class="combat-attack-button" type="button" ${
        combatBlock !== null || !previewValid ? "disabled" : ""
      }>${actionIcon("attack")}<span>${escapeHtml(t("preview.card.fire"))}<small>${
        combatBlock === "COOLDOWN"
          ? `${
            escapeHtml(t("hud.combat.step.cooldown"))
          } · <b data-deadline-ms="${attackDeadline}"></b>`
          : combatBlock !== null
          ? escapeHtml(combatBlockCopy(combatBlock))
          : previewValid
          ? escapeHtml(t("hud.combat.confirm.ready"))
          : previewDismissed
          ? escapeHtml(t("action.status.held"))
          : escapeHtml(t("hud.combat.confirm.needPreview"))
      }</small></span></button>
            <button id="preview-button" class="combat-preview-button" type="button" ${
        combatBlock !== null || (lastPreviewContext !== null && lastPreview === null)
          ? "disabled"
          : ""
      }>${actionIcon("preview")}<span>${escapeHtml(t("hud.combat.preview"))}<small>${
        escapeHtml(t("hud.combat.preview.note"))
      }</small></span></button>
          </div>
        </div>
        <p class="combat-lock" role="status" ${combatBlock === null ? "hidden" : ""}>△ ${
        escapeHtml(combatBlockCopy(combatBlock))
      }${
        selectedWeaponBlock !== null &&
          (combatBlock === "NO_ITEM" || combatBlock === "NO_DURABILITY" ||
            combatBlock === "NO_AMMO")
          ? ` · ${escapeHtml(t("hud.combat.block.swapWeapon"))}`
          : ""
      }</p>
      `
  }
    ${actionFeedbackMarkup("attack")}
    <div id="preview-output" aria-live="polite">${
    lastPreviewContext === null
      ? ""
      : lastPreview === null
      ? `<p class="preview-pending">${waitingDotsMarkup(t("hud.waiting.preview"))}</p>`
      : previewMarkup(lastPreview, lastPreviewContext)
  }</div>
  `;

  const targetSelect = document.getElementById("combat-target");
  const weaponSelect = document.getElementById("combat-weapon");
  if (
    !(targetSelect instanceof HTMLSelectElement) || !(weaponSelect instanceof HTMLSelectElement)
  ) return;
  document.getElementById("preview-button")?.addEventListener("click", () => {
    const selectedTarget = current.visiblePlayers.find((player) =>
      player.ref === targetSelect.value
    );
    if (selectedTarget === undefined) return;
    const weapon = /** @type {import("@darkforest/protocol").WeaponKind} */ (weaponSelect.value);
    if (combatWeaponBlockReason(current.self.inventory, weapon) !== null) return;
    dismissedCombatPreviewLease = null;
    const requested = requestCombatPreview(
      current,
      selectedTarget,
      weapon,
      true,
    );
    if (!requested) {
      dismissedCombatPreviewLease = combatPreviewLease(current, selectedTarget.ref, weapon);
      renderCombat(current);
      return;
    }
    const output = document.getElementById("preview-output");
    if (output !== null) {
      output.innerHTML = `<p class="preview-pending">${
        waitingDotsMarkup(t("hud.waiting.preview"))
      }</p>`;
    }
  });
  for (const select of [targetSelect, weaponSelect]) {
    select.addEventListener("change", () => {
      if (select === targetSelect) combatTargetRef = targetSelect.value;
      if (select === weaponSelect) {
        combatWeaponKind = /** @type {import("@darkforest/protocol").WeaponKind} */ (
          weaponSelect.value
        );
      }
      lastPreview = null;
      lastPreviewContext = null;
      autoCombatPreview = false;
      dismissedCombatPreviewLease = null;
      globalThis.clearTimeout(previewTimeoutTimer);
      renderCombat(current);
    });
  }
  document.getElementById("attack-button")?.addEventListener("click", () => {
    const weapon = /** @type {import("@darkforest/protocol").WeaponKind} */ (weaponSelect.value);
    if (
      !previewValid || gameplayForeground(current).kind !== "encounter" ||
      combatActionBlockReason({
          status: current.self.status,
          pending: pendingCommandActions.size > 0,
          casting: current.self.casting !== undefined,
          spawnGrace: spawnGraceActive(current),
          cooling: attackDeadline !== undefined && attackDeadline > estimatedGameNowMs(),
          resource: combatWeaponBlockReason(current.self.inventory, weapon),
        }) !== null
    ) return;
    const commandId = sendAction({
      action: "attack",
      target: targetSelect.value,
      weapon,
    });
    if (commandId === null) return;
    lastPreview = null;
    lastPreviewContext = null;
    autoCombatPreview = false;
    dismissedCombatPreviewLease = null;
    announce(t("hud.announce.attacked"));
    renderCombat(current);
  });
  if (selectedTarget !== undefined && selectedWeapon !== undefined && combatBlock === null) {
    scheduleAutomaticCombatPreview(current, selectedTarget, selectedWeapon);
  }
}

/** @param {_PlayerView} current */
function narrativePreviewIsInterrupting(current) {
  void current;
  return lastPreviewContext !== null;
}

/** @param {_PlayerView} current */
function narrativeDecisionIsActive(current) {
  return gameplayForeground(current).kind !== "idle" ||
    encounterBlocksNarrativeOptions(current, controlMode === "semi");
}

/** @param {_PlayerView} current */
function renderNarrativeContext(current) {
  const node = current.nodes.find((candidate) => candidate.id === current.self.node);
  const definition = current.map.nodes.find((candidate) => candidate.id === current.self.node);
  if (node === undefined || definition === undefined) {
    narrativeContextPanel.innerHTML = `<p class="empty-state">${
      escapeHtml(t("hud.context.empty"))
    }</p>`;
    return;
  }
  const name = narrativeNodeName(current, node.id);
  const phase = worldPhase(current.phase);
  const worldArt = atmosphereUrl(current, definition, node.activeTags);
  const sceneArt = sceneUrl(current, definition, node.activeTags);
  narrativeModeView.dataset.phase = phase;
  narrativeWorldAtmosphere.dataset.phase = phase;
  narrativeWorldAtmosphere.style.backgroundImage =
    `linear-gradient(90deg,rgba(5,8,10,.96) 0%,rgba(5,8,10,.6) 48%,rgba(5,8,10,.9) 100%),url('${worldArt}')`;
  const environmentDrawer = document.querySelector(".narrative-environment-drawer");
  if (environmentDrawer instanceof HTMLElement) {
    environmentDrawer.style.setProperty("--scene-art", `url('${sceneArt}')`);
  }
  const visibleHere = current.visiblePlayers.filter((player) => player.node === node.id);
  const visibleAdjacent = current.visiblePlayers.filter((player) => player.node !== node.id);
  const currentBlockade = current.map.blockadeSchedule.find((entry) =>
    entry.node === node.id && entry.closesAtMs > estimatedGameNowMs()
  );
  const groundItemCount = node.caches.reduce((sum, cache) => sum + cache.items.length, 0);
  const environmentSummary = document.getElementById("narrative-environment-summary");
  if (environmentSummary !== null) {
    environmentSummary.textContent = t("hud.context.environmentSummary", {
      node: name,
      targets: visibleHere.length + visibleAdjacent.length,
      hazards: node.knownHazards.length,
      items: groundItemCount,
    });
  }
  const gameNowMs = estimatedGameNowMs();
  const groundLoot = node.caches.length === 0
    ? ""
    : `<section class="narrative-ground-loot" aria-label="${escapeHtml(t("hud.label.groundLoot"))}">
      <header><b>${escapeHtml(t("hud.label.groundLoot"))}</b><span>${
      escapeHtml(
        t("hud.groundLoot.summary", { caches: node.caches.length, items: groundItemCount }),
      )
    }</span></header>
      <ul>${
      node.caches.map((cache) => {
        const priority = t(
          `hud.cache.priority.${
            cachePriorityState(
              cache.priorityFor,
              cache.priorityUntilMs,
              current.self.playerId,
              gameNowMs,
            )
          }`,
        );
        return `<li><span>${
          cache.items.map(itemStackDisplayName).map(escapeHtml).join(t("narrative.list_separator"))
        }</span><small>${escapeHtml(priority)}</small></li>`;
      }).join("")
    }</ul>
    </section>`;
  narrativeContextPanel.innerHTML = `
    <div class="narrative-context-scene" style="background-image:${
    escapeHtml(sceneBackground(current, definition, node.activeTags))
  }">
      <span>${escapeHtml(node.id)} · ${escapeHtml(phaseLabel(current.phase))}</span>
      <h2 id="narrative-context-heading">${escapeHtml(name)}</h2>
      <p>${escapeHtml(t(current.self.hidden ? "hud.context.hidden" : "hud.context.exposed"))}</p>${
    current.map.shopNodeId === node.id
      ? `<strong class="narrative-shop-here">¤ ${escapeHtml(t("hud.shop.here"))}</strong>`
      : ""
  }
    </div>
    <div class="narrative-context-tags" aria-label="${escapeHtml(t("hud.context.tags.aria"))}">${
    node.activeTags.map((tag) =>
      `<span title="${
        escapeHtml(TAG_INFO[tag].summary)
      }"><img src="/art/icons/tags/${tag.toLowerCase()}.svg" alt=""><b>${
        escapeHtml(TAG_INFO[tag].label)
      }</b></span>`
    ).join("")
  }</div>
    <dl class="narrative-context-stats">
      <div><dt>${escapeHtml(t("hud.context.searchable"))}</dt><dd>${node.searchesLeft}</dd></div>
      <div><dt>${
    escapeHtml(t("map.cover.free"))
  }</dt><dd>${node.coverSlotsFree}/${definition.coverSlots}</dd></div>
      <div><dt>${escapeHtml(t("hud.context.targetsHere"))}</dt><dd>${visibleHere.length}</dd></div>
      <div><dt>${
    escapeHtml(t("hud.context.adjacentContacts"))
  }</dt><dd>${visibleAdjacent.length}</dd></div>
    </dl>
    ${groundLoot}
    <div class="narrative-context-alerts">
      ${
    node.knownHazards.length === 0
      ? `<p><b>◇ ${escapeHtml(t("hud.hazard.undisclosed"))}</b><span>${
        escapeHtml(t("hud.tactical.hazard.unknownIsNotSafe"))
      }</span></p>`
      : node.knownHazards.map((hazard) =>
        `<p class="is-danger"><b>△ ${escapeHtml(hazard.kind)}</b><span>${
          escapeHtml(hazard.note)
        }</span></p>`
      ).join("")
  }
      ${
    currentBlockade === undefined
      ? ""
      : `<p class="is-warning"><b>${
        escapeHtml(t("map.node.blockadeApproaching"))
      }</b><span data-deadline-ms="${currentBlockade.closesAtMs}"></span></p>`
  }
    </div>`;
}

/**
 * Mobile keeps the latest authoritative self-facing result beside the controls. The full Log
 * remains the historical record, but it must not be the only place where a player can tell
 * whether the button they just pressed settled.
 * @returns {_NarrativeEntry | null}
 */
function latestMobileActionReceipt() {
  const latestAction = narrativeEntries.findLast((entry) =>
    entry.level === "self" && entry.kind === "action"
  );
  const latestSelfEvent = narrativeEntries.findLast((entry) =>
    entry.level === "self" && entry.source === "event" &&
    (latestAction === undefined || entry.atGameMs >= latestAction.atGameMs)
  );
  if (
    latestSelfEvent !== undefined &&
    (latestAction === undefined ||
      narrativeEntries.lastIndexOf(latestSelfEvent) > narrativeEntries.lastIndexOf(latestAction))
  ) return latestSelfEvent;
  if (
    latestAction?.status === "pending" || latestAction?.status === "ready" ||
    latestAction?.status === "rejected"
  ) {
    return latestAction;
  }
  return latestSelfEvent ?? latestAction ??
    narrativeEntries.findLast((entry) => entry.level === "self") ?? null;
}

/** @returns {string} */
function mobileActionReceiptMarkup() {
  const entry = latestMobileActionReceipt();
  if (entry === null) return "";
  const tone = entry.fatal
    ? "danger"
    : entry.status === "rejected"
    ? "rejected"
    : entry.status === "pending" || entry.status === "ready"
    ? "pending"
    : "resolved";
  const label = entry.label ?? t(
    entry.kind === "action" ? "hud.log.meta.action" : "hud.log.meta.status",
  );
  return `<div class="narrative-action-receipt" data-receipt-tone="${tone}" aria-label="${
    escapeHtml(t("hud.log.meta.status"))
  }"><span><i aria-hidden="true"></i>${escapeHtml(label)}</span><strong>${
    escapeHtml(entry.text)
  }</strong><time>[${formatNarrativeTimestamp(entry.atGameMs)}]</time></div>`;
}

/** @param {boolean=} restoreFocus */
function dismissOpeningPerkCard(restoreFocus = false) {
  openingPerkCardVisible = false;
  const card = document.getElementById("opening-perk-card");
  const hadFocus = card?.contains(document.activeElement) ?? false;
  card?.remove();
  if (restoreFocus && hadFocus) {
    queueMicrotask(() => tacticalArenaHeading.focus({ preventScroll: true }));
  }
}

/** @param {_PlayerView} current */
function renderNarrativeStatusbar(current) {
  const blockade = nextBlockade(current);
  const blockadeUrgent = blockade !== null && blockade.node === current.self.node &&
    blockade.closesAtMs - current.gameNowMs <= 60_000;
  const survival = survivalReadout(current);
  const progression = currentProgressionReadout(current);
  const injuries = selfInjuryParts(current.self);
  const levelPulse = performance.now() < levelPulseUntilRealMs;
  const creditsPulse = performance.now() < creditsPulseUntilRealMs && creditsPulseAmount > 0;
  const semiActive = narrativeCommanderActive || controlMode === "semi";
  const echoActive = current.self.status === "echo";
  const mode = echoActive
    ? t("hud.statusbar.mode.echo")
    : semiActive
    ? t("hud.statusbar.mode.commander", {
      policy: ENGAGEMENT_POLICY_COPY[engagementPolicy].label,
    })
    : t("hud.statusbar.mode.manual");
  const resourcesMarkup = `<em class="narrative-level-chip ${levelPulse ? "level-up-pulse" : ""}">${
    escapeHtml(t("hud.level.badge", { level: progression.level }))
  }</em><em class="narrative-credits-chip ${creditsPulse ? "credits-pulse" : ""}" title="${
    escapeHtml(t("hud.credits.label"))
  }">¢${current.self.credits}${
    creditsPulse
      ? `<i class="credits-float" aria-label="+${creditsPulseAmount}">+${creditsPulseAmount}</i>`
      : ""
  }</em>`;
  narrativeStatusbar.classList.toggle("has-urgent-blockade", blockadeUrgent);
  narrativeStatusbar.innerHTML = `
    <div class="narrative-location"><span aria-hidden="true">${
    worldPhase(current.phase) === "darkforest" ? "♧" : "◇"
  }</span><b>${
    escapeHtml(`${phaseLabel(current.phase)} · ${narrativeNodeName(current, current.self.node)}`)
  }</b><span class="narrative-location-resources narrative-location-resources-mobile">${resourcesMarkup}</span>${
    traitChipMarkup(current, "narrative-mobile")
  }<small class="narrative-mobile-mode">${escapeHtml(mode)}</small>${
    injuries.length === 0
      ? ""
      : `<small class="narrative-mobile-injury" role="status"><i aria-hidden="true">!</i><b>${
        escapeHtml(selfInjurySummary(current.self))
      }</b></small>`
  }</div>
    <div class="narrative-time"><span>TIME</span><b data-game-clock>${
    formatDuration(current.gameNowMs)
  }</b></div>
    <div class="narrative-hp"><span>HP</span><b>${progression.hp}/${progression.maxHp}</b><i aria-hidden="true"><em style="width:${progression.hpPercent}%"></em></i></div>
    <div class="narrative-stamina ${survival.canRush ? "" : "is-low"} ${
    survival.discomfort ? "is-discomfort" : ""
  }" data-stamina-card="statusbar"><span>${
    escapeHtml(t("hud.label.stamina"))
  }</span><b data-stamina-value>${survival.stamina}</b><i aria-hidden="true"><em data-stamina-fill style="width:${
    Math.max(0, Math.min(100, survival.stamina / survival.max * 100))
  }%"></em><u style="left:${Math.min(100, survival.rushCost / survival.max * 100)}%"></u></i>${
    survival.discomfort && survival.discomfortUntilMs !== null
      ? `<small data-stamina-status title="${escapeHtml(t("hud.stamina.discomfortTitle"))}">${
        escapeHtml(t("hud.stamina.discomfortShort"))
      } · <em data-deadline-ms="${survival.discomfortUntilMs}"></em></small>`
      : ""
  }</div>
    <div class="narrative-signal"><span>SIGNAL</span><b>${current.self.signal}</b><i aria-hidden="true"><em style="width:${
    Math.max(0, Math.min(100, current.self.signal))
  }%"></em><u style="left:60%"></u></i></div>
    <div class="narrative-next-blockade ${
    blockadeUrgent ? "is-urgent" : ""
  }"><span>NEXT BLOCKADE</span><b>${
    blockade === null
      ? "—"
      : `${
        escapeHtml(narrativeNodeName(current, blockade.node))
      } · <em data-deadline-ms="${blockade.closesAtMs}"></em>`
  }</b></div>
    <div class="narrative-population"><span>ALIVE / ECHO</span><b>${current.aliveCount} / ${current.echoCount}</b></div>
    <div class="narrative-mode-cluster"><span class="narrative-mode-pill ${
    semiActive && !echoActive ? "is-commander" : ""
  } ${echoActive ? "is-echo" : ""}">${
    escapeHtml(mode)
  }</span><span class="narrative-location-resources narrative-location-resources-desktop">${resourcesMarkup}</span>${
    traitChipMarkup(current, "narrative-desktop")
  }</div>${mobileActionReceiptMarkup()}`;
  bindTraitChipInteractions(narrativeStatusbar);
  const cardSignature = JSON.stringify([
    getLocale(),
    current.self.profession,
    current.self.trait,
  ]);
  let openingCard = document.getElementById("opening-perk-card");
  if (!openingPerkCardVisible) {
    openingCard?.remove();
  } else if (openingCard?.dataset.renderSignature !== cardSignature) {
    openingCard?.remove();
    narrativeStatusbar.insertAdjacentHTML("afterend", openingPerkCardMarkup(current));
    openingCard = document.getElementById("opening-perk-card");
    if (openingCard !== null) openingCard.dataset.renderSignature = cardSignature;
    openingCard?.querySelector("#opening-perk-close")?.addEventListener("click", () => {
      dismissOpeningPerkCard(true);
      if (view !== null) renderNarrativeStatusbar(view);
    });
  }
}

/** Passive regen updates the two visible stamina meters without rebuilding drawers or controls. @param {_PlayerView} current */
function patchSurvivalReadouts(current) {
  const survival = survivalReadout(current);
  const percent = Math.max(0, Math.min(100, survival.stamina / survival.max * 100));
  document.querySelectorAll("[data-stamina-card]").forEach((element) => {
    if (!(element instanceof HTMLElement)) return;
    element.classList.toggle("is-low", !survival.canRush);
    element.classList.toggle("is-discomfort", survival.discomfort);
    const value = element.querySelector("[data-stamina-value]");
    if (value instanceof HTMLElement) value.textContent = String(survival.stamina);
    const fill = element.querySelector("[data-stamina-fill]");
    if (fill instanceof HTMLElement) fill.style.width = `${percent}%`;
    const progress = element.querySelector("[data-stamina-progress]");
    if (progress instanceof HTMLElement) {
      progress.setAttribute("aria-valuenow", String(survival.stamina));
    }
    if (element.dataset.staminaCard !== "dossier") return;
    const status = element.querySelector("[data-stamina-status]");
    if (!(status instanceof HTMLElement)) return;
    status.textContent = survival.canRush
      ? t("hud.vitals.rushesLeft", {
        count: Math.floor(survival.stamina / Math.max(1, survival.rushCost)),
      })
      : t("hud.vitals.sneakOnly");
  });
}

function renderNarrativeCombatStory() {
  const entries = view === null
    ? []
    : personalCombatNarrativeEntries(narrativeEntries, view.self.playerId);
  const signature = JSON.stringify(entries.map((entry) => [
    entry.id,
    entry.atGameMs,
    entry.level,
    entry.text,
    entry.event?.kind,
  ]));
  if (signature === narrativeCombatStoryDomSignature) return;
  const previousList = narrativeCombatStory.querySelector(".narrative-combat-story-list");
  const previousScrollTop = previousList instanceof HTMLElement ? previousList.scrollTop : 0;
  if (previousList instanceof HTMLElement && !narrativeCombatStoryHoverPaused) {
    const distance = previousList.scrollHeight - previousList.scrollTop - previousList.clientHeight;
    narrativeCombatStoryFollowing = distance <= 28;
  }
  narrativeCombatStoryDomSignature = signature;
  narrativeCombatStory.innerHTML = `
    <div class="narrative-combat-story-heading">
      <div><p class="eyebrow">COMBAT · YOUR FIGHT</p><h3 id="narrative-combat-story-heading">${
    escapeHtml(t("combat.title"))
  }</h3></div>
      <span>${entries.length} / 8</span>
    </div>
    ${
    entries.length === 0
      ? `<p class="empty-state">${escapeHtml(t("combat.empty"))}</p>`
      : `<ol class="narrative-combat-story-list" aria-label="${
        escapeHtml(t("hud.combat.story.aria"))
      }">${
        entries.map((entry) =>
          `<li class="narrative-combat-story-entry narrative-level-${entry.level}" data-combat-kind="${
            escapeHtml(entry.event?.kind ?? "combat")
          }"><time>[${formatNarrativeTimestamp(entry.atGameMs)}]</time><span>${
            escapeHtml(entry.text)
          }</span></li>`
        ).join("")
      }</ol>`
  }`;
  const list = narrativeCombatStory.querySelector(".narrative-combat-story-list");
  if (list instanceof HTMLElement) {
    if (narrativeCombatStoryFollowing && !narrativeCombatStoryHoverPaused) {
      queueMicrotask(() => list.scrollTo({ top: list.scrollHeight }));
    } else list.scrollTop = previousScrollTop;
    list.addEventListener("scroll", () => {
      const distance = list.scrollHeight - list.scrollTop - list.clientHeight;
      narrativeCombatStoryFollowing = distance <= 28;
    });
  }
}

function narrativeStoryScrollOwner() {
  if (
    mobileTacticalCockpitQuery.matches &&
    view !== null && tacticalSessionActive(view)
  ) {
    return narrativeStoryGrid;
  }
  const viewport = narrativeStory.querySelector(".narrative-story-viewport");
  return viewport instanceof HTMLElement ? viewport : null;
}

/** @param {_PlayerView} current */
function renderNarrativeStory(current) {
  const oldViewport = narrativeStoryScrollOwner();
  const oldScrollTop = oldViewport?.scrollTop ?? 0;
  const displayedEntries = narrativeEntries.filter((entry) =>
    narrativeEntryMatchesFilter(entry, narrativeLogFilter)
  );
  const latest = displayedEntries.at(-1);
  const signature = latest === undefined
    ? ""
    : `${latest.id}:${latest.status ?? "story"}:${latest.text}`;
  if (
    narrativeStoryRenderSignature !== "" && signature !== narrativeStoryRenderSignature &&
    (!narrativeStoryFollowing || narrativeStoryHoverPaused)
  ) narrativeStoryUnreadCount += 1;
  narrativeStoryRenderSignature = signature;
  narrativeModeCount.textContent = `${displayedEntries.length} / ${narrativeEntries.length}`;
  // 這個簽章每 250ms 由 updateTimers 算一次。先前是 JSON.stringify 一個 200×10 的巢狀陣列
  // ——每次都要配置中介陣列再做一次字串轉義。改成直接串接同一組欄位:比對語意完全不變
  // (仍然是逐筆逐欄),但沒有中介結構與轉義成本。
  // 刻意不改用 revision 計數器:漏掉任何一個變更點都會讓敘事記錄靜止,那比這裡的成本糟得多。
  let entrySignature = "";
  for (const entry of displayedEntries) {
    entrySignature += `${entry.id}\u0001${entry.atGameMs}\u0001${entry.level}\u0001${entry.kind}` +
      `\u0001${entry.status}\u0001${entry.label}\u0001${entry.speaker}\u0001${entry.text}` +
      `\u0001${entry.fatal}\u0001${entry.event?.kind}\u0002`;
  }
  const domSignature = `${narrativeLogFilter}:${narrativeStoryUnreadCount}:${entrySignature}`;
  renderNarrativeCombatStory();
  if (domSignature === narrativeStoryDomSignature) return;
  narrativeStoryDomSignature = domSignature;
  narrativeStory.innerHTML = displayedEntries.length === 0
    ? `<p class="empty-state">${escapeHtml(t("hud.log.empty"))}</p>`
    : `<div class="narrative-story-viewport" role="log"><ol>${
      displayedEntries.map((entry) =>
        `<li class="narrative-story-line narrative-level-${entry.level}${
          entry.fatal ? " narrative-entry-fatal" : ""
        }${entry.event?.kind === "got_lost" ? " narrative-entry-lost" : ""}${
          entry.event?.kind === "armor_broken" ? " narrative-entry-armor-broken" : ""
        } narrative-kind-${entry.kind ?? "story"}${
          entry.status === undefined ? "" : ` narrative-status-${entry.status}`
        }" data-log-kind="${entry.kind ?? "story"}">
        <time>[${formatNarrativeTimestamp(entry.atGameMs)}]</time>
        <div class="narrative-story-content">${
          narrativeEntryMetaMarkup(entry)
        }<span class="narrative-log-text">${escapeHtml(entry.text)}</span></div>
      </li>`
      ).join("")
    }</ol></div><button id="narrative-return-latest" class="narrative-return-latest" type="button" ${
      narrativeStoryUnreadCount === 0 ? "hidden" : ""
    }>${escapeHtml(t("hud.log.returnLatest", { count: narrativeStoryUnreadCount }))}</button>`;
  const viewport = narrativeStoryScrollOwner();
  if (viewport instanceof HTMLElement) {
    if (!narrativeStoryFollowing || narrativeStoryHoverPaused) viewport.scrollTop = oldScrollTop;
    else {
      narrativeStoryUnreadCount = 0;
      queueMicrotask(() => viewport.scrollTo({ top: viewport.scrollHeight }));
    }
    viewport.onscroll = () => {
      const distance = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      narrativeStoryFollowing = distance <= 28;
      if (!narrativeStoryFollowing) return;
      narrativeStoryUnreadCount = 0;
      const button = document.getElementById("narrative-return-latest");
      if (button instanceof HTMLButtonElement) button.hidden = true;
    };
  }
  document.getElementById("narrative-return-latest")?.addEventListener("click", () => {
    const currentViewport = narrativeStoryScrollOwner();
    if (!(currentViewport instanceof HTMLElement)) return;
    narrativeStoryFollowing = true;
    narrativeStoryUnreadCount = 0;
    currentViewport.scrollTo({ top: currentViewport.scrollHeight });
    const button = document.getElementById("narrative-return-latest");
    if (button instanceof HTMLButtonElement) button.hidden = true;
  });
  void current;
}

/** @param {_PlayerView} current */
function renderNarrativePreview(current) {
  const foreground = gameplayForeground(current);
  if (
    tacticalArenaFieldOwnsContacts(current) ||
    foreground.kind === "terminal" || foreground.kind === "forced" ||
    foreground.kind === "confirm"
  ) {
    narrativePreview.hidden = true;
    narrativePreview.textContent = "";
    return;
  }
  if (lastPreviewContext === null) {
    narrativePreview.hidden = true;
    narrativePreview.textContent = "";
    return;
  }
  const target = current.visiblePlayers.find((player) => player.ref === lastPreviewContext?.target);
  const unidentified = target?.identified === false;
  const targetLevel = target === undefined ? null : identifiedPlayerLevel(target);
  const pending = lastPreview === null;
  const attackReady = current.self.status === "active" &&
    foreground.kind === "encounter" && assistActionReady(current, "attack") &&
    !spawnGraceActive(current);
  const previewBody = lastPreview === null
    ? `<p class="preview-pending">${waitingDotsMarkup(t("hud.waiting.preview"))}</p>`
    : previewMarkup(lastPreview, lastPreviewContext);
  narrativePreview.hidden = false;
  narrativePreview.classList.toggle(
    "is-decision",
    lastPreview !== null && (unidentified || (lastPreview.warnings?.length ?? 0) > 0),
  );
  narrativePreview.innerHTML = `
    <div class="narrative-card-heading"><span>${escapeHtml(t("preview.card.eyebrow"))}</span><h3>${
    escapeHtml(
      unidentified ? t("preview.card.title.unidentified") : t("preview.card.title.target", {
        target: target?.playerId ?? lastPreviewContext.target,
      }),
    )
  }</h3>${
    targetLevel === null
      ? ""
      : `<b class="preview-target-level">${
        escapeHtml(t("hud.level.badge", { level: targetLevel }))
      }</b>`
  }${target === undefined ? "" : limpingBadgeMarkup(target.limping)}</div>
    ${previewBody}
    ${
    unidentified
      ? `<p class="narrative-oath-warning" role="alert">${
        escapeHtml(t("preview.card.oathWarning"))
      }</p>`
      : ""
  }
    <div class="narrative-card-actions">
      ${
    pending
      ? ""
      : `<button id="narrative-fire" class="danger-button" data-narrative-card-choice type="button" ${
        lastPreview?.allowed && attackReady ? "" : "disabled"
      }>${escapeHtml(t("preview.card.fire"))}</button>`
  }
      <button id="narrative-hold-fire" data-narrative-card-choice type="button">${
    escapeHtml(t("hud.card.cancel"))
  }</button>
    </div>`;
  document.getElementById("narrative-hold-fire")?.addEventListener("click", () => {
    holdCombatPreview();
    if (narrativeCommanderActive || controlMode === "semi") {
      takeNarrativeControl();
    }
    renderCombat(current);
    renderNarrativeMode(current);
  });
  document.getElementById("narrative-fire")?.addEventListener("click", () => {
    if (
      lastPreview === null || !lastPreview.allowed || lastPreviewContext === null || !attackReady
    ) return;
    const context = lastPreviewContext;
    const commandId = sendAction({
      action: "attack",
      target: context.target,
      weapon: context.weapon,
    });
    if (commandId === null) return;
    updatePreviewLog(context.requestId, {
      status: "resolved",
      label: t("action.status.confirmed"),
    });
    globalThis.clearTimeout(previewTimeoutTimer);
    lastPreview = null;
    lastPreviewContext = null;
    autoCombatPreview = false;
    dismissedCombatPreviewLease = null;
    renderCombat(current);
    renderNarrativeMode(current);
  });
}

/** @param {ReturnType<typeof encounterPresentation>} presentation */
function selectedEncounterTarget(presentation) {
  const selected =
    presentation.targets.find((target) =>
      target.ref === narrativeEncounterTargetRef ||
      target.contactRef === narrativeEncounterTargetRef
    ) ??
      presentation.targets[0];
  narrativeEncounterTargetRef = selected?.ref ?? null;
  return selected;
}

/**
 * The same three-key encounter control is used by the full card and the adjacent-LOS strip.
 * Multi-target encounters use an explicit picker; no target is silently substituted on click.
 * @param {_PlayerView} current
 * @param {ReturnType<typeof encounterPresentation>} presentation
 */
function encounterControlsMarkup(current, presentation) {
  const selected = selectedEncounterTarget(presentation);
  const prompt = current.encounterPrompt;
  if (prompt === undefined || selected === undefined) return "";
  const weapon = engagementWeapon(current, selected);
  const attackReady = weapon !== null && assistActionReady(current, "attack") &&
    !spawnGraceActive(current);
  const blockedReason = weapon === null
    ? t("situation.blocked.no_weapon")
    : spawnGraceActive(current)
    ? t("encounter.reason.spawnGrace")
    : null;
  const attackReason = blockedReason ??
    (!assistActionReady(current, "attack")
      ? t("hud.lock.notYet")
      : t("encounter.reason.previewFirst"));
  const engageAria = blockedReason === null
    ? t("encounter.engage.label")
    : t("encounter.engage.aria.blocked", { reason: blockedReason });
  const continuePending = [...pendingCommandActions.values()].some((payload) =>
    payload.action === "encounter_continue"
  );
  return `<label class="encounter-target-picker"><span>${
    escapeHtml(t("encounter.target.label"))
  }</span><select data-encounter-target aria-label="${escapeHtml(t("encounter.target.aria"))}">${
    presentation.targets.map((target, index) => {
      const targetLevel = identifiedPlayerLevel(target);
      const description = `${encounterTargetDescription(target)}${
        targetLevel === null ? "" : ` · ${t("hud.level.badge", { level: targetLevel })}`
      }`;
      return `<option value="${escapeHtml(target.ref)}" ${
        target.ref === selected.ref ? "selected" : ""
      }>${
        escapeHtml(
          t("encounter.target.option", {
            index: index + 1,
            description,
            node: narrativeNodeName(current, target.node),
          }),
        )
      }</option>`;
    }).join("")
  }</select></label>
    <div class="encounter-actions" role="group" aria-label="${
    escapeHtml(t("encounter.actions.aria"))
  }">
      <button type="button" class="danger-button" data-narrative-card-choice data-encounter-action="engage" aria-label="${
    escapeHtml(engageAria)
  }" ${attackReady ? "" : "disabled"}><span>${
    escapeHtml(t("encounter.engage.label"))
  }</span><small>${escapeHtml(attackReason)}</small></button>
      <button type="button" data-narrative-card-choice data-encounter-action="observe" aria-pressed="${
    narrativeObservedEncounterId === prompt.encounterId
  }" ${narrativeObservedEncounterId === prompt.encounterId ? "disabled" : ""}>${
    escapeHtml(
      narrativeObservedEncounterId === prompt.encounterId
        ? t("action.status.observing")
        : t("encounter.observe.label"),
    )
  }</button>
      <button type="button" data-narrative-card-choice data-encounter-action="continue" ${
    continuePending ? "disabled" : ""
  }><span>${escapeHtml(t("action.name.encounter_continue"))}</span>${
    continuePending ? `<small>${escapeHtml(t("action.status.pending"))}</small>` : ""
  }</button>
    </div>${actionFeedbackMarkup("encounter_continue")}`;
}

/** Observe is an encounter-local acknowledgement; it intentionally sends no protocol action. */
/** @param {_PlayerView} current */
function observeCurrentEncounter(current) {
  const prompt = current.encounterPrompt;
  if (prompt === undefined || narrativeObservedEncounterId === prompt.encounterId) return false;
  narrativeObservedEncounterId = prompt.encounterId;
  appendNarrative([{
    id: `observe:${prompt.encounterId}`,
    atGameMs: estimatedGameNowMs(),
    level: "self",
    text: encounterPromptLine(current),
    fatal: false,
    source: "derived",
    kind: "action",
    status: "ready",
    label: t("action.status.observing"),
  }]);
  renderNarrativeStory(current);
  return true;
}

/**
 * @param {HTMLElement} root
 * @param {_PlayerView} current
 * @param {ReturnType<typeof encounterPresentation>} presentation
 */
function bindEncounterControls(root, current, presentation) {
  const prompt = current.encounterPrompt;
  if (prompt === undefined) return;
  root.querySelector("[data-encounter-target]")?.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLSelectElement)) return;
    narrativeEncounterTargetRef = event.target.value;
  });
  root.querySelector('[data-encounter-action="engage"]')?.addEventListener("click", () => {
    const target = selectedEncounterTarget(presentation);
    const weapon = target === undefined ? null : engagementWeapon(current, target);
    if (target === undefined || weapon === null || !assistActionReady(current, "attack")) return;
    requestCombatPreview(current, target, weapon);
  });
  const observeButton = root.querySelector('[data-encounter-action="observe"]');
  observeButton?.addEventListener("click", () => {
    if (!observeCurrentEncounter(current)) return;
    observeButton.setAttribute("aria-pressed", "true");
    if (observeButton instanceof HTMLButtonElement) {
      observeButton.disabled = true;
      observeButton.textContent = t("action.status.observing");
    }
  });
  root.querySelector('[data-encounter-action="continue"]')?.addEventListener("click", () => {
    sendAction({ action: "encounter_continue", encounterId: prompt.encounterId });
  });
}

/** @param {_PlayerView} current */
function renderNarrativeConfirmationCard(current) {
  if (narrativePendingDecision === null) return false;
  const decision = narrativePendingDecision;
  narrativeDecisionCard.hidden = false;
  narrativeDecisionCard.innerHTML = `
    <div class="narrative-card-heading"><span>DECISION REQUIRED</span><h3>${
    escapeHtml(decision.title)
  }</h3></div>
    <p>${escapeHtml(decision.context)}</p>
    <div class="narrative-card-actions"><button id="narrative-confirm-decision" class="primary-button" data-narrative-card-choice type="button">${
    escapeHtml(decision.confirmLabel)
  }</button><button id="narrative-cancel-decision" data-narrative-card-choice type="button">${
    escapeHtml(t("hud.card.cancel"))
  }</button></div>`;
  document.getElementById("narrative-confirm-decision")?.addEventListener("click", () => {
    confirmNarrativePendingDecision(current, decision);
  });
  document.getElementById("narrative-cancel-decision")?.addEventListener("click", () => {
    cancelNarrativePendingDecision(current);
  });
  return true;
}

/** Casting/receipt is secondary to every authoritative prompt and explicit confirmation. */
/** @param {_PlayerView} current */
function renderNarrativeBusyCard(current) {
  if (current.self.casting !== undefined) {
    const eating = current.self.casting.item === "healthy_food" ||
      current.self.casting.item === "spoiled_food";
    narrativeDecisionCard.hidden = false;
    narrativeDecisionCard.innerHTML = `<div class="narrative-card-heading"><span>${
      escapeHtml(t(eating ? "hud.casting.eating" : "hud.casting.treating"))
    }</span><h3>${escapeHtml(itemDisplayName(current.self.casting.item))}</h3></div><p>${
      waitingDotsMarkup(t(eating ? "hud.casting.eating.aria" : "hud.casting.treating.aria"))
    } <b data-deadline-ms="${current.self.casting.completesAtMs}"></b></p>`;
    return true;
  }
  if (pendingCommandActions.size === 0) return false;
  const pending = pendingCommandActions.values().next().value;
  narrativeDecisionCard.hidden = false;
  narrativeDecisionCard.innerHTML = `<div class="narrative-card-heading"><span>${
    escapeHtml(t("action.status.pending"))
  }</span><h3>${
    escapeHtml(pending === undefined ? t("hud.pending.settling") : actionLogText(current, pending))
  }</h3></div><p>${waitingDotsMarkup(t("hud.waiting.result"))}</p>`;
  return true;
}

/** @param {_PlayerView} current */
function renderNarrativeDecisionCard(current) {
  if (current.phase === "ended") {
    const ended = matchEvents.findLast((event) => event.kind === "match_ended");
    if (ended?.kind === "match_ended") {
      const ending = projectAuthoritativeEnding(ended, current.self, narrativeEntries);
      const resultLine = eventsToNarrative([ended], {
        view: current,
        atGameMs: current.gameNowMs,
        idPrefix: "ending-card",
      })[0]?.text ?? "";
      const endingLabel = t(`endgame.ending.${ending.ending}`);
      const reasonLabel = t(`endgame.reason.${ending.reason}`);
      const outcomeLabel = ending.winners.length === 0
        ? t("endgame.journey.outcome.noWinner")
        : ending.selfIsWinner
        ? t("endgame.journey.outcome.winner")
        : t("endgame.journey.outcome.notWinner");
      const winners = ending.winners.length === 0
        ? `<strong>${escapeHtml(t("endgame.winners.none"))}</strong>`
        : `<strong>${ending.winners.map(escapeHtml).join(" · ")}</strong>`;
      const journey = ending.recentJourney.length === 0
        ? `<p class="finale-journey-empty">${escapeHtml(t("endgame.journey.recentEmpty"))}</p>`
        : `<ol class="finale-journey-list">${
          ending.recentJourney.map((entry) =>
            `<li><time>[${formatNarrativeTimestamp(entry.atGameMs)}]</time><span>${
              escapeHtml(entry.text)
            }</span></li>`
          ).join("")
        }</ol>`;
      const nextLabel = activeFixture === "live"
        ? t("endgame.next.queue")
        : t("endgame.next.fixture");
      const nextHint = activeFixture === "live"
        ? t("endgame.next.queueHint")
        : t("endgame.next.fixtureHint");
      narrativeDecisionCard.hidden = false;
      narrativeDecisionCard.innerHTML = `
        <article class="finale-ending finale-ending-${ending.ending}" aria-labelledby="ending-card-title">
          <div class="narrative-card-heading">
            <span>ENDING · ${escapeHtml(ending.ending)}</span>
            <h3 id="ending-card-title">${escapeHtml(endingLabel)}</h3>
            <p>${escapeHtml(resultLine)}</p>
          </div>
          <dl class="finale-authority">
            <div><dt>${escapeHtml(t("endgame.reason.label"))}</dt><dd><strong>${
        escapeHtml(reasonLabel)
      }</strong><code>${escapeHtml(ending.reason)}</code></dd></div>
            <div><dt>${escapeHtml(t("endgame.winners.label"))}</dt><dd>${winners}</dd></div>
          </dl>
          <section class="finale-journey" aria-labelledby="ending-journey-title">
            <header><span>${
        escapeHtml(t("endgame.journey.kicker"))
      }</span><h4 id="ending-journey-title">${escapeHtml(t("endgame.journey.title"))}</h4><p>${
        escapeHtml(t("endgame.journey.note"))
      }</p></header>
            <dl class="finale-journey-snapshot">
              <div><dt>${escapeHtml(t("endgame.journey.outcomeLabel"))}</dt><dd>${
        escapeHtml(outcomeLabel)
      }</dd></div>
              <div><dt>${escapeHtml(t("endgame.journey.statusLabel"))}</dt><dd>${
        escapeHtml(t(`endgame.journey.status.${ending.status}`))
      }</dd></div>
              <div><dt>${
        escapeHtml(t("endgame.journey.levelLabel"))
      }</dt><dd>Lv${ending.level}</dd></div>
              <div><dt>${escapeHtml(t("endgame.journey.nodeLabel"))}</dt><dd>${
        escapeHtml(narrativeNodeName(current, ending.node))
      }</dd></div>
            </dl>
            <h5>${escapeHtml(t("endgame.journey.recentLabel"))}</h5>${journey}
          </section>
          <div class="finale-next-actions">
            <button type="button" class="primary-button" data-ending-next><span><b>${
        escapeHtml(nextLabel)
      }</b><small>${escapeHtml(nextHint)}</small></span><i aria-hidden="true">→</i></button>
            <button type="button" data-ending-lobby><span><b>${
        escapeHtml(t("endgame.next.lobby"))
      }</b><small>${escapeHtml(t("endgame.next.lobbyHint"))}</small></span></button>
          </div>
          ${feedbackCtaMarkup("feedback-cta-endgame")}
        </article>`;
      narrativeDecisionCard.querySelector("[data-ending-next]")?.addEventListener("click", () => {
        void beginLobbyConnection("play");
      });
      narrativeDecisionCard.querySelector("[data-ending-lobby]")?.addEventListener(
        "click",
        disconnect,
      );
      return;
    }
  }
  if (current.self.status === "downed") {
    narrativeDecisionCard.hidden = false;
    narrativeDecisionCard.innerHTML = `<div class="narrative-card-heading"><span>DOWNED</span><h3>${
      escapeHtml(t("hud.downed.title"))
    }</h3></div>
      <p>${
      countdownSentence(
        "hud.downed.hold",
        `<b data-deadline-ms="${current.self.downedUntilMs ?? current.gameNowMs}"></b>`,
      )
    }</p>`;
    return;
  }
  if (
    current.finale !== undefined && finaleRequiresInput(current) &&
    current.legacyPrompt === undefined && current.insightPrompt === undefined
  ) {
    const finale = current.finale;
    const availability = finaleActionAvailability(current);
    const durationMs = finaleStageDurationMs(finale);
    const modeTitle = t(
      finale.mode === "arbora" ? "endgame.finale.mode.arbora" : "endgame.finale.mode.solo",
    );
    const stageCopy = finale.stage === "offer"
      ? t("endgame.finale.stageCopy.offer")
      : finale.stage === "channel"
      ? modeTitle
      : t("endgame.finale.stageCopy.claimed");
    const stageLabel = t(
      finale.stage === "offer"
        ? "endgame.finale.stage.offer"
        : finale.stage === "channel"
        ? "endgame.finale.stage.channel"
        : "endgame.finale.stage.claimed",
    );
    narrativeDecisionCard.hidden = false;
    narrativeDecisionCard.innerHTML = `
      <div class="narrative-card-heading"><span>ROOTHEART · ${escapeHtml(stageLabel)}</span><h3>${
      escapeHtml(modeTitle)
    }</h3></div>
      <p>${escapeHtml(stageCopy)}</p>
      <time>${
      countdownSentence(
        "hud.time.remaining",
        `<b data-deadline-ms="${finale.deadlineMs}"></b>`,
      )
    }</time>
      <progress class="finale-progress" max="100" value="0" data-progress-deadline-ms="${finale.deadlineMs}" data-progress-duration-ms="${durationMs}" aria-label="${
      escapeHtml(t("endgame.finale.progress.aria", { mode: modeTitle }))
    }"></progress>
      <dl class="finale-readiness">
        <div><dt>${
      escapeHtml(t("endgame.finale.participants"))
    }</dt><dd>${finale.participants.length}/3 · ${
      finale.participants.map(escapeHtml).join(t("narrative.list_separator")) ||
      escapeHtml(t("endgame.finale.participants.none"))
    }</dd></div>
        <div><dt>${escapeHtml(t("endgame.finale.supplyTrace"))}</dt><dd>${
      escapeHtml(
        t(finale.supplyTraceReady ? "endgame.finale.brought" : "endgame.finale.missing"),
      )
    }</dd></div>
        <div><dt>${escapeHtml(t("endgame.finale.echoMemory"))}</dt><dd>${
      escapeHtml(
        t(finale.echoMemoryReady ? "endgame.finale.brought" : "endgame.finale.missing"),
      )
    }</dd></div>
      </dl>
      <div class="narrative-card-actions">
        ${
      availability.canJoin
        ? `<button id="narrative-finale-join" class="primary-button" type="button"><b>${
          escapeHtml(t("action.name.finale_join"))
        }</b><small>${escapeHtml(t("endgame.finale.join.note"))}</small></button>`
        : ""
    }
        ${
      availability.canInterrupt
        ? `<button id="narrative-finale-interrupt" class="danger-button" type="button"><b>${
          escapeHtml(t("action.name.finale_interrupt"))
        }</b><small>${escapeHtml(t("endgame.finale.interrupt.note"))}</small></button>`
        : ""
    }
        ${
      availability.canCancel
        ? `<button id="narrative-finale-cancel" type="button"><b>${
          escapeHtml(t("action.name.finale_cancel"))
        }</b><small>${escapeHtml(t("endgame.finale.cancel.note"))}</small></button>`
        : ""
    }
      </div>
      ${
      finale.interruptor === undefined
        ? ""
        : `<p class="action-feedback" role="alert">${
          escapeHtml(t("endgame.finale.interruptor.line", { player: finale.interruptor }))
        }<em data-deadline-ms="${
          finale.interruptCompletesAtMs ?? finale.deadlineMs
        }"></em><progress class="finale-progress finale-interrupt-progress" max="100" value="0" data-progress-deadline-ms="${
          finale.interruptCompletesAtMs ?? finale.deadlineMs
        }" data-progress-duration-ms="6000" aria-label="${
          escapeHtml(t("endgame.finale.interrupt.progress.aria"))
        }"></progress></p>`
    }
      ${
      actionFeedbackMarkup([
        "finale_commit",
        "finale_join",
        "finale_interrupt",
        "finale_cancel",
      ])
    }`;
    document.getElementById("narrative-finale-join")?.addEventListener("click", () => {
      sendAction({ action: "finale_join" });
    });
    document.getElementById("narrative-finale-interrupt")?.addEventListener("click", () => {
      sendAction({ action: "finale_interrupt" });
    });
    document.getElementById("narrative-finale-cancel")?.addEventListener("click", () => {
      sendAction({ action: "finale_cancel" });
    });
    updateTimers();
    return;
  }
  if (
    finaleEntryAvailableNow(current) && current.legacyPrompt === undefined &&
    current.insightPrompt === undefined && current.encounterPrompt === undefined
  ) {
    narrativeDecisionCard.hidden = false;
    narrativeDecisionCard.innerHTML = `
      <div class="narrative-card-heading"><span>ROOTHEART · FINAL CHOICE</span><h3>${
      escapeHtml(t("endgame.entry.title"))
    }</h3></div>
      <p>${escapeHtml(t("endgame.entry.detail"))}</p>
      <div class="finale-readiness">
        <span class="${current.self.supplyTrace ? "is-ready" : ""}">${
      escapeHtml(
        t("endgame.entry.supplyTrace", {
          state: t(current.self.supplyTrace ? "endgame.entry.acquired" : "endgame.entry.missing"),
        }),
      )
    }</span>
        <span class="${current.self.echoMemory >= 3 ? "is-ready" : ""}">${
      escapeHtml(t("endgame.entry.echoMemory", { count: current.self.echoMemory }))
    }</span>
      </div>
      <div class="narrative-card-actions">
        <button id="narrative-finale-solo" class="danger-button" type="button"><b>${
      escapeHtml(t("action.name.finale_commit_solo"))
    }</b><small>${escapeHtml(t("endgame.entry.solo.note"))}</small></button>
        <button id="narrative-finale-arbora" class="primary-button" type="button"><b>${
      escapeHtml(t("action.name.finale_commit_arbora"))
    }</b><small>${escapeHtml(t("endgame.entry.arbora.note"))}</small></button>
      </div>
      ${actionFeedbackMarkup("finale_commit")}`;
    document.getElementById("narrative-finale-solo")?.addEventListener("click", () => {
      sendAction({ action: "finale_commit", mode: "solo" });
    });
    document.getElementById("narrative-finale-arbora")?.addEventListener("click", () => {
      sendAction({ action: "finale_commit", mode: "arbora" });
    });
    return;
  }
  if (current.insightPrompt !== undefined) {
    const prompt = current.insightPrompt;
    if (narrativeInsightDeadline !== prompt.deadlineMs) {
      narrativeInsightDeadline = prompt.deadlineMs;
      narrativeInsightDraft.clear();
      prompt.suggestedItems.forEach((item) => narrativeInsightDraft.add(item));
    }
    const recommendation =
      prompt.suggestedItems.map(itemDisplayName).join(t("narrative.list_separator")) ||
      t("endgame.insight.noneRecommended");
    narrativeDecisionCard.hidden = false;
    narrativeDecisionCard.innerHTML = `
      <div class="narrative-card-heading"><span>ECHO RETURN · ${prompt.maxSelections} SLOT</span><h3>${
      escapeHtml(t("endgame.insight.title"))
    }</h3></div>
      <p>${
      escapeHtml(
        t("endgame.insight.detail", {
          intel: current.self.echoMemory,
          max: prompt.maxSelections,
        }),
      )
    }</p>
      <time>${
      countdownSentence("hud.time.remaining", `<b data-deadline-ms="${prompt.deadlineMs}"></b>`)
    }</time>
      <button id="narrative-insight-recommended" class="primary-button prompt-recommended" type="button"><span class="prompt-item-icons">${
      prompt.suggestedItems.map((kind) => fieldItemIconMarkup(kind, "prompt-item-icon")).join("")
    }</span><span class="prompt-recommended-copy"><b>${
      escapeHtml(t("endgame.insight.recommended"))
    }</b><small>${escapeHtml(recommendation)}</small></span></button>
      <details class="prompt-customizer"><summary>${
      escapeHtml(t("hud.prompt.customize"))
    }</summary><div class="prompt-choice-list">${
      prompt.options.map((kind) =>
        `<label><input type="checkbox" data-insight-choice="${escapeHtml(kind)}" ${
          narrativeInsightDraft.has(kind) ? "checked" : ""
        }>${fieldItemIconMarkup(kind, "prompt-item-icon")}<span>${
          escapeHtml(itemDisplayName(kind))
        }</span></label>`
      ).join("")
    }</div><button id="narrative-insight-confirm" type="button">${
      escapeHtml(t("endgame.insight.confirm"))
    }</button></details>
      ${actionFeedbackMarkup("insight_select")}`;
    narrativeDecisionCard.querySelectorAll("[data-insight-choice]").forEach((element) => {
      element.addEventListener("change", () => {
        if (!(element instanceof HTMLInputElement) || element.dataset.insightChoice === undefined) {
          return;
        }
        const item = /** @type {import("@darkforest/protocol").ItemKind} */ (
          element.dataset.insightChoice
        );
        if (element.checked && narrativeInsightDraft.size >= prompt.maxSelections) {
          element.checked = false;
          announce(t("endgame.insight.limit", { max: prompt.maxSelections }));
        } else if (element.checked) narrativeInsightDraft.add(item);
        else narrativeInsightDraft.delete(item);
      });
    });
    document.getElementById("narrative-insight-recommended")?.addEventListener("click", () => {
      sendAction({ action: "insight_select", items: [...prompt.suggestedItems] });
    });
    document.getElementById("narrative-insight-confirm")?.addEventListener("click", () => {
      sendAction({ action: "insight_select", items: [...narrativeInsightDraft] });
    });
    updateTimers();
    return;
  }
  if (current.legacyPrompt !== undefined) {
    const prompt = current.legacyPrompt;
    if (narrativeLegacyDeadline !== prompt.deadlineMs) {
      narrativeLegacyDeadline = prompt.deadlineMs;
      narrativeLegacyDraft.clear();
      prompt.suggestedItems.forEach((item) => narrativeLegacyDraft.add(item));
    }
    const recommendation =
      prompt.suggestedItems.map(itemDisplayName).join(t("narrative.list_separator")) ||
      t("reset.legacy.noneRecommended");
    narrativeDecisionCard.hidden = false;
    narrativeDecisionCard.innerHTML = `
      <div class="narrative-card-heading"><span>EXPLOSION CHECKPOINT · ${prompt.maxSelections} SLOT</span><h3>${
      escapeHtml(t("reset.legacy.title"))
    }</h3></div>
      <p>${escapeHtml(t("reset.legacy.detail", { max: prompt.maxSelections }))}</p>
      <time>${
      countdownSentence("hud.time.remaining", `<b data-deadline-ms="${prompt.deadlineMs}"></b>`)
    }</time>
      <button id="narrative-legacy-recommended" class="primary-button prompt-recommended" type="button"><span class="prompt-item-icons">${
      prompt.suggestedItems.map((kind) => fieldItemIconMarkup(kind, "prompt-item-icon")).join("")
    }</span><span class="prompt-recommended-copy"><b>${
      escapeHtml(t("reset.legacy.recommended"))
    }</b><small>${escapeHtml(recommendation)}</small></span></button>
      <details class="prompt-customizer"><summary>${
      escapeHtml(t("hud.prompt.customize"))
    }</summary><div class="prompt-choice-list">${
      prompt.options.map((item) => {
        const count = normalizeInventoryMetric(item.count) ?? 0;
        const durability = normalizeInventoryMetric(item.durability);
        return (
          `<label><input type="checkbox" data-legacy-choice="${escapeHtml(item.kind)}" ${
            narrativeLegacyDraft.has(item.kind) ? "checked" : ""
          }>${fieldItemIconMarkup(item.kind, "prompt-item-icon")}<span><b>${
            escapeHtml(itemDisplayName(item.kind))
          }</b><small>×${escapeHtml(count)}${
            durability === null
              ? ""
              : ` · ${escapeHtml(t("hud.weapon.durability", { value: durability }))}`
          }</small></span></label>`
        );
      }).join("")
    }</div><button id="narrative-legacy-confirm" type="button">${
      escapeHtml(t("reset.legacy.confirm"))
    }</button></details>
      ${actionFeedbackMarkup("legacy_select")}`;
    narrativeDecisionCard.querySelectorAll("[data-legacy-choice]").forEach((element) => {
      element.addEventListener("change", () => {
        if (!(element instanceof HTMLInputElement) || element.dataset.legacyChoice === undefined) {
          return;
        }
        const item = /** @type {import("@darkforest/protocol").ItemKind} */ (
          element.dataset.legacyChoice
        );
        if (element.checked && narrativeLegacyDraft.size >= prompt.maxSelections) {
          element.checked = false;
          announce(t("reset.legacy.limit", { max: prompt.maxSelections }));
        } else if (element.checked) narrativeLegacyDraft.add(item);
        else narrativeLegacyDraft.delete(item);
      });
    });
    const commitLegacy = (/** @type {import("@darkforest/protocol").ItemKind[]} */ items) => {
      lastLegacySelection = items.map(itemDisplayName).join(t("narrative.list_separator")) ||
        t("narrative.legacy.unknown_item");
      sendAction({ action: "legacy_select", items });
    };
    document.getElementById("narrative-legacy-recommended")?.addEventListener("click", () => {
      commitLegacy([...prompt.suggestedItems]);
    });
    document.getElementById("narrative-legacy-confirm")?.addEventListener("click", () => {
      commitLegacy([...narrativeLegacyDraft]);
    });
    updateTimers();
    return;
  }
  if (renderNarrativeConfirmationCard(current)) return;
  if (renderNarrativeBusyCard(current)) return;
  const encounter = encounterPresentation(current);
  if (
    !tacticalArenaFieldOwnsContacts(current) &&
    encounter.level === "full" && current.encounterPrompt !== undefined &&
    controlMode !== "semi" && lastPreviewContext === null && !narrativeCacheDecisionOpen
  ) {
    const prompt = current.encounterPrompt;
    narrativeDecisionCard.hidden = false;
    narrativeDecisionCard.innerHTML = `
      <div class="narrative-card-heading"><span>${
      escapeHtml(
        t("encounter.card.eyebrow", {
          style: t(prompt.style === "rush" ? "encounter.style.rush" : "encounter.style.sneak"),
        }),
      )
    }</span><h3>${escapeHtml(encounterPromptLine(current))}</h3></div>
      <time>${
      countdownSentence(
        "encounter.card.deadline",
        `<b data-deadline-ms="${prompt.deadlineMs}"></b>`,
      )
    }</time>
      ${encounterControlsMarkup(current, encounter)}`;
    bindEncounterControls(narrativeDecisionCard, current, encounter);
    updateTimers();
    return;
  }
  if (
    !tacticalArenaFieldOwnsContacts(current) &&
    encounter.level === "light" && controlMode !== "semi" && lastPreviewContext === null &&
    !narrativeCacheDecisionOpen
  ) {
    narrativeDecisionCard.hidden = true;
    narrativeDecisionCard.textContent = "";
    return;
  }
  if (narrativeCacheDecisionOpen) {
    const offers = visibleCacheOffers(current);
    const offer = offers.find((cache) => cache.cacheId === narrativeCacheOffer?.cacheId) ??
      offers[0];
    if (offer === undefined) {
      narrativeCacheDecisionOpen = false;
      narrativeCacheOffer = null;
      narrativeCacheWanted = null;
      renderNarrativeDecisionCard(current);
      return;
    }
    narrativeCacheOffer = offer;
    const cacheId = offer.cacheId;
    const wanted = offer.items.find((item) => item.kind === narrativeCacheWanted) ?? offer.items[0];
    const pickupReady = assistActionReady(current, "pickup");
    if (wanted === undefined || offer.node !== current.self.node) {
      narrativeCacheDecisionOpen = false;
      narrativeCacheOffer = null;
      narrativeCacheWanted = null;
      renderNarrativeDecisionCard(current);
      return;
    }
    narrativeCacheWanted = wanted.kind;
    const merges = current.self.inventory.some((item) => item.kind === wanted.kind);
    const wouldUse = current.self.capacity.used + (merges ? 0 : 1);
    const full = wouldUse > current.self.capacity.total;
    narrativeDecisionCard.hidden = false;
    narrativeDecisionCard.innerHTML = `
      <div class="narrative-card-heading"><span>SCAVENGE · LOCAL CACHE</span><h3>${
      escapeHtml(t(full ? "inventory.cache.full.title" : "inventory.cache.title"))
    }</h3></div>
      ${
      offers.length > 1
        ? `<div class="narrative-cache-selector" aria-label="${
          escapeHtml(t("inventory.cache.piles.aria"))
        }">${
          offers.map((cache, index) =>
            `<button type="button" data-cache-select="${escapeHtml(cache.cacheId)}" aria-pressed="${
              cache.cacheId === cacheId
            }"><span class="cache-item-icons">${
              cache.items.slice(0, 3).map((item) =>
                fieldItemIconMarkup(item.kind, "cache-item-icon")
              ).join("")
            }</span><span class="cache-choice-copy"><b>${
              escapeHtml(t("inventory.cache.pile", { index: index + 1 }))
            }</b><small>${
              cache.items.map(itemStackDisplayName).map(escapeHtml).join(
                t("narrative.list_separator"),
              )
            }</small></span></button>`
          ).join("")
        }</div>`
        : ""
    }
      <p>${
      escapeHtml(
        t("inventory.cache.spotted", { item: itemStackDisplayName(wanted) }),
      )
    }</p>
      ${
      full && offer.items.length > 1
        ? `<div class="narrative-cache-selector" aria-label="${
          escapeHtml(t("inventory.cache.pick.aria"))
        }">${
          offer.items.map((item) =>
            `<button type="button" data-cache-wanted="${escapeHtml(item.kind)}" aria-pressed="${
              item.kind === wanted.kind
            }">${
              fieldItemIconMarkup(item.kind, "cache-item-icon")
            }<span class="cache-choice-copy"><b>${
              escapeHtml(itemStackDisplayName(item))
            }</b><small>${escapeHtml(t("inventory.cache.pickInstead"))}</small></span></button>`
          ).join("")
        }</div>`
        : ""
    }
      <div class="narrative-cache-actions">${
      full
        ? current.self.inventory.map((item) =>
          `<button type="button" data-narrative-card-choice data-cache-drop="${
            escapeHtml(item.kind)
          }" ${!pickupReady ? "disabled" : ""}><span class="cache-swap-icons">${
            fieldItemIconMarkup(item.kind, "cache-item-icon")
          }<i aria-hidden="true">→</i>${
            fieldItemIconMarkup(wanted.kind, "cache-item-icon")
          }</span><span class="cache-choice-copy"><b>${
            escapeHtml(t("inventory.cache.drop", { item: itemDisplayName(item.kind) }))
          }</b><small>${
            escapeHtml(t("inventory.cache.take", { item: itemDisplayName(wanted.kind) }))
          }</small></span>${actionCooldownMarkup("pickup", current)}</button>`
        ).join("")
        : offer.items.map((item) =>
          `<button type="button" data-narrative-card-choice data-cache-pickup="${
            escapeHtml(item.kind)
          }" ${!pickupReady ? "disabled" : ""}>${
            fieldItemIconMarkup(item.kind, "cache-item-icon")
          }<span class="cache-choice-copy"><b>${
            escapeHtml(t("inventory.cache.take", { item: itemStackDisplayName(item) }))
          }</b><small>${
            escapeHtml(
              t(
                cachePriorityState(
                    offer.priorityFor,
                    offer.untilMs,
                    current.self.playerId,
                    estimatedGameNowMs(),
                  ) === "yours"
                  ? "inventory.cache.priorityPickup"
                  : "inventory.cache.tryPickup",
              ),
            )
          }</small></span>${actionCooldownMarkup("pickup", current)}</button>`
        ).join("")
    }</div>
      ${actionFeedbackMarkup(["pickup", "drop"])}
      <button id="narrative-abandon-cache" type="button">${
      escapeHtml(t("inventory.cache.abandon"))
    }</button>`;
    narrativeDecisionCard.querySelectorAll("[data-cache-select]").forEach((element) => {
      element.addEventListener("click", () => {
        if (!(element instanceof HTMLButtonElement) || element.dataset.cacheSelect === undefined) {
          return;
        }
        narrativeCacheOffer = offers.find((cache) =>
          cache.cacheId === element.dataset.cacheSelect
        ) ?? offer;
        narrativeCacheWanted = null;
        renderNarrativeMode(current);
      });
    });
    narrativeDecisionCard.querySelectorAll("[data-cache-wanted]").forEach((element) => {
      element.addEventListener("click", () => {
        if (!(element instanceof HTMLButtonElement) || element.dataset.cacheWanted === undefined) {
          return;
        }
        narrativeCacheWanted = /** @type {import("@darkforest/protocol").ItemKind} */ (element
          .dataset.cacheWanted);
        renderNarrativeMode(current);
      });
    });
    narrativeDecisionCard.querySelectorAll("[data-cache-pickup]").forEach((element) => {
      element.addEventListener("click", () => {
        if (
          !(element instanceof HTMLButtonElement) || element.dataset.cachePickup === undefined
        ) return;
        const item = /** @type {import("@darkforest/protocol").ItemKind} */ (element.dataset
          .cachePickup);
        const commandId = sendAction({ action: "pickup", cacheId, item });
        if (commandId !== null) pendingPickupNarratives.set(commandId, item);
        narrativeCacheDecisionOpen = false;
        renderNarrativeMode(current);
      });
    });
    narrativeDecisionCard.querySelectorAll("[data-cache-drop]").forEach((element) => {
      element.addEventListener("click", () => {
        if (
          !(element instanceof HTMLButtonElement) || element.dataset.cacheDrop === undefined
        ) return;
        const droppedItem = /** @type {import("@darkforest/protocol").ItemKind} */ (element.dataset
          .cacheDrop);
        const dropCommandId = sendAction({ action: "drop", item: droppedItem });
        if (dropCommandId === null) return;
        pendingCapacitySwap = { cacheId, item: wanted.kind, droppedItem, dropCommandId };
        narrativeCacheDecisionOpen = false;
        renderNarrativeMode(current);
      });
    });
    document.getElementById("narrative-abandon-cache")?.addEventListener("click", () => {
      narrativeCacheDecisionOpen = false;
      narrativeCacheWanted = null;
      renderNarrativeMode(current);
    });
    updateTimers();
    return;
  }
  if (narrativeRouteMenuOpen) {
    const echo = current.self.status === "echo";
    const routeIds = routeNeighbors(current, current.self.node, echo);
    const action = echo ? "echo_move" : "move";
    const routeReady = assistActionReady(current, action);
    narrativeDecisionCard.hidden = false;
    narrativeDecisionCard.innerHTML = `
      <div class="narrative-card-heading"><span>ROUTE CHOICE · LOCAL KNOWLEDGE</span><h3>${
      escapeHtml(t("hud.routes.title"))
    }</h3></div>
      <p>${escapeHtml(t("hud.routes.detail"))}</p>
      <div class="narrative-route-list">${
      routeIds.map((nodeId) => {
        const node = current.nodes.find((candidate) => candidate.id === nodeId);
        const edge = edgeForMove(current, nodeId);
        const familiar = edge !== undefined && narrativeFamiliarEdges.has(edge.id);
        const trait = t(
          edge?.trait === "root"
            ? "hud.routes.trait.root"
            : edge?.trait === "tunnel"
            ? "hud.routes.trait.tunnel"
            : "hud.routes.trait.open",
        );
        const danger = node?.knownHazards.map((hazard) => hazard.note).join(" · ") ||
          t("hud.hazard.undisclosed");
        return `<button type="button" data-narrative-card-choice data-narrative-route="${
          escapeHtml(nodeId)
        }" ${routeReady ? "" : "disabled"}><span><b>${
          escapeHtml(narrativeNodeName(current, nodeId))
        }</b><small>${escapeHtml(nodeId)} · ${
          escapeHtml(node?.activeTags.join(" · ") || t("hud.routes.noTags"))
        }</small></span><em>${escapeHtml(trait)}${
          familiar
            ? ` · <strong class="familiar-route">${escapeHtml(t("hud.routes.familiar"))}</strong>`
            : ""
        }</em><i>${escapeHtml(danger)}</i></button>`;
      }).join("")
    }</div>
      ${
      routeReady ? "" : `<p class="action-feedback" role="status">${
        countdownSentence(
          "hud.routes.cooldown",
          `<em data-deadline-ms="${
            current.self.cooldownsUntilMs[action] ?? current.gameNowMs
          }"></em>`,
        )
      }</p>`
    }
      <button id="narrative-close-routes" type="button">${
      escapeHtml(t("hud.routes.back"))
    }</button>`;
    narrativeDecisionCard.querySelectorAll("[data-narrative-route]").forEach((element) => {
      element.addEventListener("click", () => {
        if (
          !(element instanceof HTMLButtonElement) || element.dataset.narrativeRoute === undefined
        ) {
          return;
        }
        const nodeId = /** @type {import("@darkforest/protocol").NodeId} */ (
          element.dataset.narrativeRoute
        );
        openNarrativeMovementChoice(
          current,
          nodeId,
          t("hud.routes.goTo", { node: narrativeNodeName(current, nodeId) }),
          t("hud.routes.chosen"),
        );
      });
    });
    document.getElementById("narrative-close-routes")?.addEventListener(
      "click",
      closeNarrativeRouteMenu,
    );
    updateTimers();
    return;
  }
  if (narrativeMovementChoice !== null) {
    const choice = narrativeMovementChoice;
    const edge = edgeForMove(current, choice.to);
    const destination = narrativeNodeName(current, choice.to);
    const options = movementStyleOptions(
      { action: "move", to: choice.to },
      destination,
      edge?.trait,
      "S2",
    );
    narrativeDecisionCard.hidden = false;
    narrativeDecisionCard.innerHTML = `
      <div class="narrative-card-heading"><span>CHOOSE YOUR APPROACH</span><h3>${
      escapeHtml(choice.title)
    }</h3></div>
      <p>${escapeHtml(choice.context)}</p>${
      edge !== undefined && narrativeFamiliarEdges.has(edge.id)
        ? `<p class="narrative-familiar-note">${escapeHtml(t("hud.movement.familiarNote"))}</p>`
        : ""
    }${
      edge?.trait === "tunnel"
        ? `<p class="narrative-edge-rule">${escapeHtml(t("hud.movement.rule.tunnel"))}</p>`
        : edge?.trait === "root"
        ? `<p class="narrative-edge-rule">${escapeHtml(t("hud.movement.rule.root"))}</p>`
        : ""
    }
      <div class="narrative-card-actions narrative-movement-actions">${
      options.map((option) => {
        const payload = option.payload;
        const resourceReady = payload?.action !== "move" || payload.style !== "rush" ||
          survivalReadout(current).canRush;
        return `<button type="button" data-narrative-card-choice data-movement-choice="${
          escapeHtml(option.key)
        }" ${resourceReady ? "" : "disabled"}><b>${escapeHtml(option.label)}</b><small>${
          payload?.action === "move"
            ? `${escapeHtml(movementResourceCopy(current, payload))} · ${escapeHtml(option.note)}`
            : escapeHtml(option.note)
        }</small></button>`;
      }).join("")
    }</div><button id="narrative-cancel-movement" type="button">${
      escapeHtml(t("hud.movement.cancel"))
    }</button>`;
    narrativeDecisionCard.querySelectorAll("[data-movement-choice]").forEach((element) => {
      element.addEventListener("click", () => {
        if (!(element instanceof HTMLButtonElement)) return;
        const selected = options.find((option) => option.key === element.dataset.movementChoice);
        if (selected?.payload === undefined) return;
        if (
          selected.payload.action === "move" && selected.payload.style === "rush" &&
          !survivalReadout(current).canRush
        ) return;
        narrativeMovementChoice = null;
        executeNarrativePayload(current, selected.payload, selected.label, selected.note);
      });
    });
    document.getElementById("narrative-cancel-movement")?.addEventListener("click", () => {
      narrativeMovementChoice = null;
      renderNarrativeMode(current);
    });
    return;
  }
  narrativeDecisionCard.hidden = true;
  narrativeDecisionCard.textContent = "";
}

/** @param {_PlayerView} current @param {_NarrativeOption} option */
function narrativeMovementTraitNote(current, option) {
  if (option.payload?.action !== "move") return "";
  const edge = edgeForMove(current, option.payload.to);
  const trait = option.payload.style === "sneak"
    ? edge?.trait === "tunnel"
      ? t("hud.movement.trait.tunnel")
      : edge?.trait === "root"
      ? t("hud.movement.trait.root")
      : ""
    : "";
  const familiar = edge !== undefined && narrativeFamiliarEdges.has(edge.id)
    ? t("hud.routes.familiar")
    : "";
  const note = [trait, familiar].filter(Boolean).join(" · ");
  return note === "" ? "" : `<em class="narrative-edge-trait">${escapeHtml(note)}</em>`;
}

/** @param {_PlayerView} current */
function narrativePolicySelectionLocked(current) {
  return current.self.status !== "active" || current.legacyPrompt !== undefined ||
    current.insightPrompt !== undefined || finaleRequiresInput(current) ||
    pendingCommandActions.size > 0 || current.self.casting !== undefined ||
    current.phase === "reset" || current.phase === "ended" ||
    (finaleEntryAvailableNow(current) && current.encounterPrompt === undefined) ||
    narrativePendingDecision !== null || narrativeMovementChoice !== null ||
    narrativeRouteMenuOpen || narrativeCacheDecisionOpen ||
    narrativePreviewIsInterrupting(current);
}

/** @param {_PlayerView} current */
function renderNarrativePolicyRail(current) {
  if (current.self.status !== "active" || current.phase === "reset" || current.phase === "ended") {
    narrativePolicyRail.hidden = true;
    narrativePolicyRail.textContent = "";
    return;
  }
  const locked = narrativePolicySelectionLocked(current);
  const armed = narrativeCommanderActive || controlMode === "semi";
  const policyIcons = { avoid: "◐", retaliate: "◇", hunt: "!" };
  narrativePolicyRail.hidden = false;
  narrativePolicyRail.classList.toggle("is-armed", armed);
  narrativePolicyRail.classList.toggle("is-locked", locked);
  narrativePolicyRail.innerHTML = `<header>
      <div><span>${escapeHtml(t("situation.policy.heading"))}</span><b>${
    escapeHtml(ENGAGEMENT_POLICY_COPY[engagementPolicy].label)
  }</b><small>${
    escapeHtml(
      t(armed ? "situation.policy.active_hint" : "situation.policy.activate_hint"),
    )
  }</small></div>
      <span class="narrative-policy-actions">
      ${
    armed
      ? `<button type="button" id="narrative-policy-manual">${
        escapeHtml(
          t("situation.policy.manual"),
        )
      }</button>`
      : ""
  }<button type="button" id="narrative-policy-configure" ${locked ? "disabled" : ""}>${
    escapeHtml(t("hud.commander.entry.label"))
  }</button></span>
    </header>
    <div class="narrative-policy-options" role="group" aria-label="${
    escapeHtml(
      t("situation.policy.heading"),
    )
  }">${
    Object.entries(ENGAGEMENT_POLICY_COPY).map(([policy, copy]) =>
      `<button type="button" data-narrative-policy="${policy}" data-policy-tone="${policy}" aria-pressed="${
        engagementPolicy === policy
      }" ${locked ? "disabled" : ""} title="${escapeHtml(copy.detail)}"><i aria-hidden="true">${
        policyIcons[/** @type {keyof typeof policyIcons} */ (policy)]
      }</i><span><b>${escapeHtml(copy.label)}</b><small>${
        escapeHtml(
          t(`situation.policy.${policy}.short`),
        )
      }</small></span></button>`
    ).join("")
  }</div>
    <div class="narrative-policy-help">${
    uiDisclosureMarkup(
      "help",
      t("situation.policy.guardrail_label"),
      t("situation.policy.guardrail_title"),
      t("situation.policy.guardrail"),
    )
  }</div>`;

  narrativePolicyRail.querySelectorAll("[data-narrative-policy]").forEach((element) => {
    element.addEventListener("click", () => {
      if (!(element instanceof HTMLButtonElement) || locked) return;
      const policy = element.dataset.narrativePolicy;
      if (policy !== "avoid" && policy !== "retaliate" && policy !== "hunt") return;
      const alreadyArmed = (narrativeCommanderActive || controlMode === "semi") &&
        engagementPolicy === policy;
      engagementPolicy = policy;
      controlMode = "semi";
      narrativeCommanderActive = true;
      narrativeCommanderMenuOpen = false;
      assistCountdown = null;
      autoCombatPreview = false;
      lastPreview = null;
      lastPreviewContext = null;
      assistPausedReason = {
        key: "semi.paused.policyChanged",
        params: { policy: { key: `situation.policy.${policy}.label` } },
      };
      saveAssistPreferences();
      if (!alreadyArmed) {
        appendNarrativeModeLine(t("narrative.client.policy_summary", {
          policy: ENGAGEMENT_POLICY_COPY[policy].label,
        }));
      }
      renderMatch();
      queueMicrotask(() => {
        const control = narrativePolicyRail.querySelector(
          `[data-narrative-policy="${policy}"]`,
        );
        if (control instanceof HTMLElement) control.focus();
      });
    });
  });
  document.getElementById("narrative-policy-manual")?.addEventListener("click", () => {
    takeNarrativeControl();
    renderMatch();
    queueMicrotask(() => {
      const control = narrativePolicyRail.querySelector(
        `[data-narrative-policy="${engagementPolicy}"]`,
      );
      if (control instanceof HTMLElement) control.focus();
    });
  });
  document.getElementById("narrative-policy-configure")?.addEventListener("click", () => {
    if (locked) return;
    narrativeCommanderMenuOpen = true;
    renderNarrativeMode(current);
    queueMicrotask(() => document.getElementById("commander-menu-heading")?.focus());
  });
}

/** @param {_PlayerView} current */
function renderNarrativeOptions(current) {
  const foreground = gameplayForeground(current);
  const fieldOwnsContacts = tacticalArenaFieldOwnsContacts(current);
  if (
    foreground.kind !== "idle" && foreground.kind !== "encounter" ||
    foreground.kind === "encounter" &&
      (fieldOwnsContacts || lastPreviewContext !== null)
  ) {
    narrativeOptions.innerHTML = "";
    return;
  }
  const decision = getAssistDecision(current);
  const encounter = encounterPresentation(current);
  const movementEdge = decision.payload?.action === "move"
    ? edgeForMove(current, decision.payload.to)
    : undefined;
  const destinationName = decision.payload?.action === "move" ||
      decision.payload?.action === "echo_move"
    ? narrativeNodeName(current, decision.payload.to)
    : undefined;
  const statusLockedOptions = statusLockedNarrativeOptions(current.self);
  const suggestedOptions = assistDecisionOptions(
    decision,
    destinationName,
    movementEdge?.trait,
  );
  const fieldSafeSuggestedOptions = fieldOwnsContacts &&
      (decision.preview !== undefined || decision.payload?.action === "attack" ||
        current.encounterPrompt !== undefined)
    ? []
    : suggestedOptions;
  const fieldSafeSituationOptions = fieldOwnsContacts
    ? narrativeS2Options(current).filter((option) =>
      option.kind !== "preview" && option.kind !== "distance" &&
      !(option.kind === "move-contact" && option.targetRef !== undefined)
    )
    : narrativeS2Options(current);
  const generated = statusLockedOptions ?? assembleNarrativeOptions(
    fieldSafeSuggestedOptions,
    fieldSafeSituationOptions,
    narrativeS3Option(current),
  );
  const blocked = narrativeDecisionIsActive(current);
  const encounterHasPriority = encounter.level !== "none" &&
    current.legacyPrompt === undefined && current.insightPrompt === undefined &&
    !finaleRequiresInput(current);
  if (controlMode === "semi" && !narrativeCommanderActive && encounterHasPriority) {
    narrativeOptions.innerHTML = `<article class="narrative-commander-running">
      <span>SEMI · ${escapeHtml(ENGAGEMENT_POLICY_COPY[engagementPolicy].label)}</span>
      <strong>${escapeHtml(decision.title)}</strong>
      <p>${escapeHtml(decision.detail)}</p>
      <button id="narrative-take-control" type="button">${
      escapeHtml(t("semi.takeControl"))
    }</button>
    </article>`;
    document.getElementById("narrative-take-control")?.addEventListener("click", () => {
      takeNarrativeControl();
      renderNarrativeMode(current);
    });
    return;
  }
  if (narrativeCommanderActive) {
    const countdownMatches = assistCountdown !== null && decision.payload !== undefined &&
      assistCountdown.signature === `${current.stateVersion}:${decision.key}`;
    narrativeOptions.innerHTML = `<article class="narrative-commander-running">
      <span>${escapeHtml(t("hud.commander.eyebrow"))}</span><strong>${
      escapeHtml(
        t("narrative.client.commander_summary", {
          intention: COMMANDER_INTENT_COPY[assistIntent],
          policy: ENGAGEMENT_POLICY_COPY[engagementPolicy].label,
        }),
      )
    }</strong>
      <p>${escapeHtml(decision.title)} · ${escapeHtml(decision.detail)}</p>
      ${
      countdownMatches && assistCountdown !== null
        ? `<div><b data-real-deadline-ms="${assistCountdown.endsAtRealMs}"></b><button id="narrative-wait" type="button">${
          escapeHtml(t("semi.wait"))
        }</button></div>`
        : ""
    }
      <button id="narrative-take-control" type="button">${
      escapeHtml(t("semi.takeControl"))
    }</button>
    </article>`;
    document.getElementById("narrative-wait")?.addEventListener("click", () => {
      takeNarrativeControl();
      renderNarrativeMode(current);
    });
    document.getElementById("narrative-take-control")?.addEventListener("click", () => {
      takeNarrativeControl();
      renderNarrativeMode(current);
    });
    return;
  }
  if (narrativeCommanderMenuOpen) {
    narrativeOptions.innerHTML = "";
    return;
  }
  const encounterStrip = !fieldOwnsContacts && encounter.level === "light" &&
      current.encounterPrompt !== undefined && encounterHasPriority &&
      controlMode !== "semi" && lastPreviewContext === null
    ? `<aside class="narrative-encounter-strip" aria-label="${escapeHtml(t("encounter.label"))}">
      <div><span>${escapeHtml(t("encounter.label"))}</span><strong>${
      escapeHtml(encounterPromptLine(current))
    }</strong></div>
      <time data-deadline-ms="${current.encounterPrompt.deadlineMs}"></time>
      ${encounterControlsMarkup(current, encounter)}
    </aside>`
    : "";
  const finaleStrip = current.finale !== undefined && !finaleRequiresInput(current)
    ? `<aside class="narrative-finale-strip" aria-label="${escapeHtml(t("endgame.strip.aria"))}">
      <div><span>${escapeHtml(t("endgame.strip.label"))}</span><strong>${
      escapeHtml(
        t(
          current.finale.mode === "arbora"
            ? "endgame.finale.mode.arbora"
            : "endgame.finale.mode.solo",
        ),
      )
    } · ${
      escapeHtml(
        t(
          current.finale.stage === "offer"
            ? "endgame.finale.stage.offer"
            : current.finale.stage === "channel"
            ? "endgame.finale.stage.channel"
            : "endgame.finale.stage.claimed",
        ),
      )
    }</strong></div><time data-deadline-ms="${current.finale.deadlineMs}"></time>
    </aside>`
    : "";
  const commanderHotkey = String(generated.length + 1);
  narrativeOptions.innerHTML = `
    ${finaleStrip}
    ${encounterStrip}
    <div class="narrative-option-grid" ${blocked ? "hidden" : ""}>${
    generated.map((option, index) => {
      const payloadAction = option.payload?.action;
      const movementBlocked = option.payload?.action === "move" &&
        option.payload.style === "rush" && !survivalReadout(current).canRush;
      const optionNote = option.payload?.action === "move"
        ? `${movementResourceCopy(current, option.payload)} · ${option.note}`
        : option.note;
      const iconAction = option.key.startsWith("attack-")
        ? "attack"
        : payloadAction === "echo_move"
        ? "move"
        : payloadAction === "echo_attune"
        ? "attune"
        : payloadAction === "use_item"
        ? "use"
        : payloadAction === "pickup" || payloadAction === "drop"
        ? "search"
        : payloadAction ?? (option.kind === "preview"
          ? "preview"
          : option.kind === "rescue"
          ? "rescue"
          : option.kind === "open" || option.kind === "move-contact"
          ? "move"
          : option.kind === "distance"
          ? "hide"
          : "ability");
      const tone = iconAction === "attack"
        ? "danger"
        : iconAction === "move"
        ? "route"
        : iconAction === "rescue" || iconAction === "use"
        ? "support"
        : iconAction === "hide"
        ? "stealth"
        : "tactical";
      return `<button type="button" data-narrative-option="${
        escapeHtml(option.key)
      }" data-narrative-slot="${option.slot}" data-option-action="${
        escapeHtml(iconAction)
      }" data-option-priority="${
        index === 0 ? "primary" : "secondary"
      }" data-option-tone="${tone}" ${movementBlocked ? "disabled" : ""}><kbd>${
        index + 1
      }</kbd><i class="narrative-option-icon">${actionIcon(iconAction)}</i><span><b>${
        escapeHtml(option.label)
      }</b><small>${escapeHtml(optionNote)}</small>${
        narrativeMovementTraitNote(current, option)
      }</span></button>`;
    }).join("")
  }</div>
    ${
    blocked || current.self.status !== "active" || !commanderEntryFits(generated)
      ? ""
      : `<button id="open-commander-menu" class="narrative-commander-entry" type="button" data-hotkey="${commanderHotkey}"><kbd>${commanderHotkey}</kbd><i class="narrative-option-icon">${
        actionIcon("ability")
      }</i><span><b>${escapeHtml(t("hud.commander.entry.label"))}</b><small>${
        escapeHtml(t("hud.commander.entry.note"))
      }</small></span></button>`
  }`;
  narrativeOptions.querySelectorAll("[data-narrative-option]").forEach((element) => {
    element.addEventListener("click", () => {
      if (!(element instanceof HTMLButtonElement)) return;
      const option = generated.find((candidate) =>
        candidate.key === element.dataset.narrativeOption
      );
      if (option !== undefined) executeNarrativeOption(current, option);
    });
  });
  if (encounterStrip !== "") bindEncounterControls(narrativeOptions, current, encounter);
  document.getElementById("open-commander-menu")?.addEventListener("click", () => {
    narrativeCommanderMenuOpen = true;
    renderNarrativeMode(current);
    queueMicrotask(() => document.getElementById("commander-menu-heading")?.focus());
  });
}

/** @param {_PlayerView} current */
function renderNarrativeCommanderMenu(current) {
  const activeControl = document.activeElement instanceof HTMLElement &&
      narrativeCommanderMenu.contains(document.activeElement)
    ? document.activeElement
    : null;
  const restoreFocusSelector = activeControl?.dataset.commanderPolicy !== undefined
    ? `[data-commander-policy="${activeControl.dataset.commanderPolicy}"]`
    : activeControl?.dataset.commanderIntent !== undefined
    ? `[data-commander-intent="${activeControl.dataset.commanderIntent}"]`
    : activeControl !== null && activeControl.id !== ""
    ? `#${activeControl.id}`
    : null;
  if (!narrativeCommanderMenuOpen || narrativeDecisionIsActive(current)) {
    narrativeCommanderMenu.hidden = true;
    narrativeCommanderMenu.textContent = "";
    return;
  }
  const destinationOptions = current.map.nodes.map((definition) =>
    `<option value="${definition.id}" ${assistDestination === definition.id ? "selected" : ""}>${
      escapeHtml(narrativeNodeName(current, definition.id))
    } · ${definition.id}</option>`
  ).join("");
  const travelDestinationReady = assistIntent !== "travel" ||
    (assistDestination !== null && assistDestination !== current.self.node);
  narrativeCommanderMenu.hidden = false;
  narrativeCommanderMenu.innerHTML =
    `<div class="narrative-card-heading"><span>COMMANDER PROFILE</span><h3 id="commander-menu-heading" tabindex="-1">${
      escapeHtml(t("hud.commander.menu.title"))
    }</h3></div>
    <fieldset class="commander-policy"><legend>${
      escapeHtml(t("hud.commander.menu.policyLegend"))
    }</legend><div class="control-mode-switch engagement-policy-switch">${
      Object.entries(ENGAGEMENT_POLICY_COPY).map(([policy, copy]) =>
        `<button type="button" data-commander-policy="${policy}" aria-pressed="${
          engagementPolicy === policy
        }"><b>${escapeHtml(copy.label)}</b><small>${escapeHtml(copy.detail)}</small></button>`
      ).join("")
    }</div><p>${escapeHtml(t("hud.commander.menu.guardrail"))}</p></fieldset>
    <p class="commander-section-label">${escapeHtml(t("hud.commander.menu.intentLabel"))}</p>
    <div class="commander-intents">${
      Object.entries(COMMANDER_INTENT_COPY).map(([intent, label]) =>
        `<button type="button" data-commander-intent="${intent}" aria-pressed="${
          assistIntent === intent
        }"><b>${escapeHtml(label)}</b><small>${
          escapeHtml(
            t(
              intent === "travel"
                ? "hud.commander.intent.travel"
                : intent === "hold"
                ? "hud.commander.intent.hold"
                : "hud.commander.intent.default",
            ),
          )
        }</small></button>`
      ).join("")
    }</div>
    ${
      assistIntent === "travel"
        ? `<label><span>${
          escapeHtml(t("hud.commander.menu.destinationLabel"))
        }</span><select id="commander-destination"><option value="">${
          escapeHtml(t("semi.destination.placeholder"))
        }</option>${destinationOptions}</select></label>`
        : ""
    }
    ${
      travelDestinationReady
        ? ""
        : `<p class="commander-destination-warning" role="status">${
          escapeHtml(t("hud.commander.menu.destinationWarning"))
        }</p>`
    }
    <button id="activate-commander" class="primary-button" type="button" ${
      travelDestinationReady ? "" : "disabled"
    }>${escapeHtml(t("hud.commander.menu.activate"))} <span aria-hidden="true">→</span></button>
    <button id="close-commander-menu" type="button">${
      escapeHtml(t("hud.commander.menu.back"))
    }</button>`;
  narrativeCommanderMenu.querySelectorAll("[data-commander-policy]").forEach((element) => {
    element.addEventListener("click", () => {
      if (!(element instanceof HTMLButtonElement)) return;
      const policy = element.dataset.commanderPolicy;
      if (policy !== "avoid" && policy !== "retaliate" && policy !== "hunt") return;
      engagementPolicy = policy;
      lastPreview = null;
      lastPreviewContext = null;
      saveAssistPreferences();
      renderNarrativeCommanderMenu(current);
      queueMicrotask(() => {
        const control = narrativeCommanderMenu.querySelector(
          `[data-commander-policy="${policy}"]`,
        );
        if (control instanceof HTMLElement) control.focus();
      });
    });
  });
  narrativeCommanderMenu.querySelectorAll("[data-commander-intent]").forEach((element) => {
    element.addEventListener("click", () => {
      if (!(element instanceof HTMLButtonElement)) return;
      const intent = element.dataset.commanderIntent;
      if (intent === undefined || !(intent in COMMANDER_INTENT_COPY)) return;
      assistIntent = /** @type {_AssistIntent} */ (intent);
      saveAssistPreferences();
      renderNarrativeCommanderMenu(current);
      queueMicrotask(() => {
        const control = narrativeCommanderMenu.querySelector(
          `[data-commander-intent="${intent}"]`,
        );
        if (control instanceof HTMLElement) control.focus();
      });
    });
  });
  document.getElementById("activate-commander")?.addEventListener("click", () => {
    narrativeCommanderActive = true;
    narrativeCommanderMenuOpen = false;
    controlMode = "semi";
    assistCountdown = null;
    assistPausedReason = {
      key: "semi.paused.commander",
      params: { policy: { key: `situation.policy.${engagementPolicy}.label` } },
    };
    saveAssistPreferences();
    const intention = assistIntent === "travel" && assistDestination !== null
      ? t("narrative.client.travel_intention", {
        node: narrativeNodeName(current, assistDestination),
      })
      : COMMANDER_INTENT_COPY[assistIntent];
    appendNarrativeModeLine(
      t("narrative.client.commander_summary", {
        intention,
        policy: ENGAGEMENT_POLICY_COPY[engagementPolicy].label,
      }),
    );
    renderMatch();
    queueMicrotask(() => document.getElementById("narrative-take-control")?.focus());
  });
  document.getElementById("commander-destination")?.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLSelectElement)) return;
    assistDestination = event.target.value === ""
      ? null
      : /** @type {import("@darkforest/protocol").NodeId} */ (event.target.value);
    saveAssistPreferences();
    renderNarrativeCommanderMenu(current);
    queueMicrotask(() => document.getElementById("commander-destination")?.focus());
  });
  document.getElementById("close-commander-menu")?.addEventListener("click", () => {
    narrativeCommanderMenuOpen = false;
    renderNarrativeMode(current);
    queueMicrotask(() => document.getElementById("open-commander-menu")?.focus());
  });
  if (restoreFocusSelector !== null) {
    queueMicrotask(() => {
      const control = narrativeCommanderMenu.querySelector(restoreFocusSelector);
      if (control instanceof HTMLElement) control.focus();
    });
  }
}

/** Never infer another player's private profession from their public background. */

/** @param {_PlayerView} current */
function renderTacticalArenaSelfStatus(current) {
  const progression = currentProgressionReadout(current);
  const survival = survivalReadout(current);
  const weapon = equippedWeaponReadout(current);
  const hpPercent = Math.max(0, Math.min(100, progression.hpPercent));
  const staminaPercent = Math.max(0, Math.min(100, survival.stamina / survival.max * 100));
  const signal = Math.max(0, Math.min(100, current.self.signal));
  const armor = Math.max(0, current.self.armor);
  const hpState = hpPercent <= 33 ? "critical" : hpPercent <= 66 ? "wounded" : "healthy";
  const signature = JSON.stringify([
    getLocale(),
    progression.hp,
    progression.maxHp,
    progression.level,
    progression.xp,
    progression.xpPercent,
    progression.capped,
    survival.stamina,
    survival.max,
    survival.rushCost,
    survival.discomfort,
    survival.discomfortUntilMs,
    signal,
    armor,
    current.self.hidden,
    weapon.kind,
    weapon.resource,
  ]);
  if (signature === tacticalArenaSelfStatusSignature) return;
  const openStatusIds = new Set(
    [...tacticalArenaSelfStatus.querySelectorAll("details[data-arena-status][open]")]
      .map((element) => element.getAttribute("data-arena-status"))
      .filter((value) => value !== null),
  );
  const activeStatus = document.activeElement instanceof Element &&
      tacticalArenaSelfStatus.contains(document.activeElement)
    ? document.activeElement.closest("details[data-arena-status]")?.getAttribute(
      "data-arena-status",
    ) ?? null
    : null;
  /** @param {string} id */
  const opened = (id) => openStatusIds.has(id) ? " open" : "";
  const hpLabel = t("hud.vitals.hp.aria", { state: t(`hud.vitals.hp.${hpState}`) });
  const staminaLabel = t("hud.vitals.stamina.aria", { cost: survival.rushCost });
  const signalLabel = `${t("hud.vitals.signal.aria")} · ${
    signal >= 60
      ? t("hud.vitals.signal.exposed")
      : t("hud.vitals.signal.toExposure", { value: 60 - signal })
  }`;
  const levelLabel = t("hud.level.badge", { level: progression.level });
  const levelDetail = progression.capped
    ? `${t("hud.xp.label")} ${progression.xp} · ${t("hud.level.max")}`
    : `${t("hud.xp.label")} ${progression.xp} · ${
      t("hud.xp.toNext", { xp: progression.xpToNext ?? 0 })
    }`;
  const staminaDetail = survival.canRush
    ? t("hud.vitals.rushesLeft", {
      count: Math.floor(survival.stamina / Math.max(1, survival.rushCost)),
    })
    : t("hud.vitals.sneakOnly");
  const armorLabel = `${t("hud.vitals.armor.aria")} · ${armor}`;
  const weaponLabel = `${t("hud.combat.weaponLabel")} · ${weapon.name} · ${weapon.resource}`;
  /**
   * @param {{
   *   id: "hp" | "stamina" | "signal",
   *   icon: "hp" | "stamina" | "signal",
   *   title: string,
   *   label: string,
   *   detail?: string,
   *   value: string,
   *   progressValue: number,
   *   progressMax: number,
   *   progressPercent: number
   * }} entry
   */
  const vitalMarkup = (entry) =>
    `<details class="tactical-status-detail tactical-self-vital tactical-self-${entry.id}" data-arena-status="${entry.id}"${
      opened(entry.id)
    }>
      <summary aria-label="${escapeHtml(`${entry.label} · ${entry.value}`)}" title="${
      escapeHtml(entry.label)
    }">
        <span class="tactical-status-mark">${tacticalStatusIcon(entry.icon)}</span>
        <strong>${escapeHtml(entry.value)}</strong>
        <i role="progressbar" aria-label="${
      escapeHtml(entry.label)
    }" aria-valuemin="0" aria-valuemax="${entry.progressMax}" aria-valuenow="${entry.progressValue}"><u style="width:${entry.progressPercent}%"></u></i>
      </summary>
      <span class="tactical-status-tooltip" role="note"><b>${escapeHtml(entry.title)}</b><span>${
      escapeHtml(`${entry.label} · ${entry.value}${entry.detail ? ` · ${entry.detail}` : ""}`)
    }</span></span>
    </details>`;
  tacticalArenaSelfStatusSignature = signature;
  tacticalArenaSelfStatus.classList.toggle("is-critical", hpState === "critical");
  tacticalArenaSelfStatus.classList.toggle("is-exposed", signal >= 60);
  tacticalArenaSelfStatus.innerHTML = `
    <header>
      <span class="tactical-self-identity">${tacticalStatusIcon("self")}<b>${
    escapeHtml(t("chat.you"))
  }</b></span>
      <details class="tactical-status-detail tactical-self-level" data-arena-status="level"${
    opened("level")
  }>
        <summary aria-label="${escapeHtml(`${levelLabel} · ${levelDetail}`)}" title="${
    escapeHtml(levelDetail)
  }">
          <span><strong>${
    escapeHtml(levelLabel)
  }</strong><i aria-hidden="true"><u style="width:${progression.xpPercent}%"></u></i></span>
        </summary>
        <span class="tactical-status-tooltip" role="note"><b>${escapeHtml(levelLabel)}</b><span>${
    escapeHtml(`${levelDetail} · HP ${progression.hp}/${progression.maxHp}`)
  }</span></span>
      </details>
      <span class="tactical-self-defense">
        <details class="tactical-status-detail tactical-self-armor" data-arena-status="armor"${
    opened("armor")
  }>
          <summary aria-label="${escapeHtml(armorLabel)}" title="${escapeHtml(armorLabel)}">${
    tacticalStatusIcon("armor")
  }<strong>${armor}</strong></summary>
          <span class="tactical-status-tooltip" role="note"><b>${
    escapeHtml(t("hud.vitals.armor"))
  }</b><span>${escapeHtml(armorLabel)}</span></span>
        </details>
        ${
    current.self.hidden
      ? `<details class="tactical-status-detail tactical-self-hidden" data-arena-status="hidden"${
        opened("hidden")
      }>
          <summary aria-label="${escapeHtml(t("hud.context.hidden"))}" title="${
        escapeHtml(t("hud.context.hidden"))
      }">${tacticalStatusIcon("hidden")}</summary>
          <span class="tactical-status-tooltip" role="note"><b>${
        escapeHtml(t("hud.context.hidden"))
      }</b></span>
        </details>`
      : ""
  }
      </span>
    </header>
    <details class="tactical-status-detail tactical-self-weapon" data-arena-status="weapon"${
    opened("weapon")
  }>
      <summary aria-label="${escapeHtml(weaponLabel)}" title="${escapeHtml(weaponLabel)}">
        <span class="tactical-status-mark" aria-hidden="true">${
    weapon.icon === null
      ? "∅"
      : `<img src="${escapeHtml(weapon.icon)}" alt="" width="36" height="36">`
  }</span>
        <span class="tactical-self-weapon-copy"><strong>${escapeHtml(weapon.name)}</strong><em>${
    escapeHtml(weapon.resource)
  }</em></span>
      </summary>
      <span class="tactical-status-tooltip" role="note"><b>${
    escapeHtml(t("hud.combat.weaponLabel"))
  }</b><span>${escapeHtml(`${weapon.name} · ${weapon.resource}`)}</span></span>
    </details>
    <div class="tactical-self-vitals">
      ${
    vitalMarkup({
      id: "hp",
      icon: "hp",
      title: t("hud.vitals.hp"),
      label: hpLabel,
      detail: levelLabel,
      value: `${progression.hp}/${progression.maxHp}`,
      progressValue: progression.hp,
      progressMax: progression.maxHp,
      progressPercent: hpPercent,
    })
  }
      ${
    vitalMarkup({
      id: "stamina",
      icon: "stamina",
      title: t("hud.vitals.stamina"),
      label: staminaLabel,
      detail: staminaDetail,
      value: `${survival.stamina}/${survival.max}`,
      progressValue: survival.stamina,
      progressMax: survival.max,
      progressPercent: staminaPercent,
    })
  }
      ${
    vitalMarkup({
      id: "signal",
      icon: "signal",
      title: "SIGNAL",
      label: signalLabel,
      value: `${signal}`,
      progressValue: signal,
      progressMax: 100,
      progressPercent: signal,
    })
  }
    </div>`;
  if (activeStatus !== null) {
    queueMicrotask(() => {
      const summary = tacticalArenaSelfStatus.querySelector(
        `details[data-arena-status="${CSS.escape(activeStatus)}"] > summary`,
      );
      if (summary instanceof HTMLElement) summary.focus({ preventScroll: true });
    });
  }
}

function ensureTacticalArenaRenderer() {
  if (tacticalArenaRenderer !== null) return tacticalArenaRenderer;
  tacticalArenaRenderer = createTacticalArena(tacticalArenaCanvas, {
    reducedMotion: accessibilitySettings.reducedMotion ||
      (globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false),
    onBackend: (backend) => {
      tacticalArenaBackend.textContent = t("arena.mode.label");
      tacticalArenaBackend.dataset.backend = backend;
    },
  });
  return tacticalArenaRenderer;
}

function resetTacticalArenaRenderer() {
  tacticalArenaRenderer?.destroy();
  tacticalArenaRenderer = null;
  tacticalArenaFeedbackSignature = "";
  tacticalArenaSelfStatusSignature = "";
  tacticalArenaInteractablesSignature = "";
}

/** @param {_PlayerView} current @param {import("@darkforest/protocol").WeaponKind | null} weapon */
function tacticalArenaCombatBlock(current, weapon) {
  const attackDeadline = current.self.cooldownsUntilMs.attack;
  return combatActionBlockReason({
    status: current.self.status,
    pending: pendingCommandActions.size > 0,
    casting: current.self.casting !== undefined,
    spawnGrace: spawnGraceActive(current),
    cooling: attackDeadline !== undefined && attackDeadline > estimatedGameNowMs(),
    resource: weapon === null ? "NO_ITEM" : combatWeaponBlockReason(current.self.inventory, weapon),
  });
}

/** @param {string} line */
function tacticalArenaActionFeedback(line) {
  tacticalArenaLatest.textContent = line;
  announce(line);
}

/** @param {_PlayerView} current @param {import("@darkforest/protocol").VisiblePlayer} target @param {import("@darkforest/protocol").WeaponKind} weapon @returns {"none" | "pending" | "allowed" | "rejected" | "failed"} */
function tacticalArenaPreviewState(current, target, weapon) {
  const lease = combatPreviewLease(current, target.ref, weapon);
  const matches = lease !== null && lastPreviewContext?.target === target.ref &&
    lastPreviewContext.weapon === weapon && lastPreviewContext.combatLease === lease;
  if (!matches) {
    const retryExhaustedOrHeld = lease !== null && dismissedCombatPreviewLease === lease &&
      (tacticalArenaPreviewRetryEligibleLease !== lease ||
        tacticalArenaPreviewRetriedLease === lease);
    return retryExhaustedOrHeld ? "failed" : "none";
  }
  if (lastPreview === null) return "pending";
  return lastPreview.allowed ? "allowed" : "rejected";
}

/** @param {_PlayerView} current @param {import("@darkforest/protocol").VisiblePlayer} target @param {import("@darkforest/protocol").WeaponKind} weapon */
function requestTacticalArenaPreview(current, target, weapon) {
  const lease = combatPreviewLease(current, target.ref, weapon);
  if (lease === null) return false;
  if (
    lastPreviewContext?.target === target.ref && lastPreviewContext.weapon === weapon &&
    lastPreviewContext.combatLease === lease
  ) return true;
  if (lastPreviewContext !== null) {
    updatePreviewLog(lastPreviewContext.requestId, {
      status: "resolved",
      label: t("action.status.reselecting"),
    });
    globalThis.clearTimeout(previewTimeoutTimer);
    lastPreview = null;
    lastPreviewContext = null;
    autoCombatPreview = false;
  }
  return requestCombatPreview(current, target, weapon, true);
}

/**
 * The field prepares its authoritative Preview as soon as a target becomes selected. Rendering
 * never sends network work directly: one lease-keyed microtask rechecks all combat facts first.
 * A timeout is retried once, while an explicit Hold remains respected through the dismissed lease.
 * @param {_PlayerView} current
 * @param {import("@darkforest/protocol").VisiblePlayer} target
 * @param {import("@darkforest/protocol").WeaponKind} weapon
 */
function scheduleTacticalArenaPreview(current, target, weapon) {
  if (tacticalArenaCombatBlock(current, weapon) !== null) return;
  const lease = combatPreviewLease(current, target.ref, weapon);
  if (lease === null) return;
  if (
    lastPreviewContext?.target === target.ref && lastPreviewContext.weapon === weapon &&
    lastPreviewContext.combatLease === lease
  ) return;
  const dismissed = dismissedCombatPreviewLease === lease;
  if (
    dismissed &&
    (tacticalArenaPreviewRetryEligibleLease !== lease ||
      tacticalArenaPreviewRetriedLease === lease)
  ) return;
  if (tacticalArenaPreviewScheduledLease === lease) return;
  tacticalArenaPreviewScheduledLease = lease;
  queueMicrotask(() => {
    if (tacticalArenaPreviewScheduledLease === lease) {
      tacticalArenaPreviewScheduledLease = null;
    }
    if (view !== current || tacticalArenaTargetRef !== target.ref) return;
    const visibleTarget = current.visiblePlayers.find((player) => player.ref === target.ref);
    if (visibleTarget === undefined || tacticalArenaCombatBlock(current, weapon) !== null) return;
    const liveLease = combatPreviewLease(current, visibleTarget.ref, weapon);
    if (liveLease !== lease) return;
    if (
      lastPreviewContext?.target === visibleTarget.ref &&
      lastPreviewContext.weapon === weapon &&
      lastPreviewContext.combatLease === lease
    ) return;
    if (dismissedCombatPreviewLease === lease) {
      if (
        tacticalArenaPreviewRetryEligibleLease !== lease ||
        tacticalArenaPreviewRetriedLease === lease
      ) return;
      tacticalArenaPreviewRetriedLease = lease;
      tacticalArenaPreviewRetryEligibleLease = null;
      dismissedCombatPreviewLease = null;
    }
    if (!requestTacticalArenaPreview(current, visibleTarget, weapon)) {
      dismissedCombatPreviewLease = lease;
      tacticalArenaPreviewRetryEligibleLease = null;
      renderTacticalArena(current);
    }
  });
}

/** @param {_PlayerView} current @param {import("@darkforest/protocol").VisiblePlayer} target @param {import("@darkforest/protocol").WeaponKind} weapon */
function fireTacticalArenaAttack(current, target, weapon) {
  const context = lastPreviewContext;
  const lease = combatPreviewLease(current, target.ref, weapon);
  const block = tacticalArenaCombatBlock(current, weapon);
  if (
    gameplayForeground(current).kind !== "encounter" || context === null ||
    lastPreview?.allowed !== true || lease === null ||
    context.target !== target.ref || context.weapon !== weapon ||
    context.combatLease !== lease || block !== null
  ) {
    tacticalArenaActionFeedback(
      block === null
        ? rejectionNarrativeLine("STALE_VERSION")
        : tacticalArenaCombatBlockText(current, block),
    );
    return false;
  }
  const commandId = sendAction({ action: "attack", target: target.ref, weapon });
  if (commandId === null) {
    tacticalArenaActionFeedback(t("narrative.client.connection_unavailable"));
    return false;
  }
  updatePreviewLog(context.requestId, {
    status: "resolved",
    label: t("action.status.confirmed"),
  });
  globalThis.clearTimeout(previewTimeoutTimer);
  lastPreview = null;
  lastPreviewContext = null;
  autoCombatPreview = false;
  dismissedCombatPreviewLease = null;
  tacticalArenaPreviewRetryEligibleLease = null;
  tacticalArenaPreviewRetriedLease = null;
  announce(t("hud.announce.attacked"));
  return true;
}

/** @param {_PlayerView} current @param {import("@darkforest/protocol").VisiblePlayer} target */
function activateTacticalArenaTarget(current, target) {
  if (gameplayForeground(current).kind !== "encounter") return;
  tacticalArenaTargetRef = target.ref;
  combatTargetRef = target.ref;
  focusedNodeId = target.node;
  const weapon = engagementWeapon(current, target);
  const block = tacticalArenaCombatBlock(current, weapon);
  const preview = weapon === null ? "none" : tacticalArenaPreviewState(current, target, weapon);
  const step = tacticalTargetActionStep({
    trigger: "fire",
    blocked: block !== null,
    commandPending: pendingCommandActions.size > 0,
    preview,
  });
  if (step === "blocked" || weapon === null) {
    const line = preview === "rejected" && lastPreview?.reason !== undefined
      ? rejectionNarrativeLine(lastPreview.reason)
      : tacticalArenaCombatBlockText(current, block ?? "NO_ITEM");
    renderTacticalArena(current);
    tacticalArenaActionFeedback(line);
    return;
  }
  if (step === "retry") {
    dismissedCombatPreviewLease = null;
    tacticalArenaPreviewRetryEligibleLease = null;
    tacticalArenaPreviewRetriedLease = null;
    scheduleTacticalArenaPreview(current, target, weapon);
    renderTacticalArena(current);
    tacticalArenaActionFeedback(t("hud.announce.previewing"));
    return;
  }
  if (step === "fire") {
    fireTacticalArenaAttack(current, target, weapon);
    return;
  }
  tacticalArenaActionFeedback(t("hud.announce.previewing"));
}

/** @param {_PlayerView} current @param {import("@darkforest/protocol").VisiblePlayer} target */
function selectTacticalArenaTarget(current, target) {
  const foreground = gameplayForeground(current);
  if (foreground.kind !== "idle" && foreground.kind !== "encounter") return;
  const selectionStep = tacticalTargetActionStep({
    trigger: "target",
    blocked: false,
    commandPending: false,
    preview: "none",
  });
  if (selectionStep !== "select") return;
  tacticalArenaTargetRef = target.ref;
  combatTargetRef = target.ref;
  focusedNodeId = target.node;
  dismissedCombatPreviewLease = null;
  tacticalArenaPreviewRetryEligibleLease = null;
  tacticalArenaPreviewRetriedLease = null;
  const weapon = engagementWeapon(current, target);
  if (
    weapon !== null && tacticalArenaCombatBlock(current, weapon) === null &&
    tacticalArenaPreviewState(current, target, weapon) === "none"
  ) {
    scheduleTacticalArenaPreview(current, target, weapon);
  }
  renderTacticalArena(current);
  tacticalArenaActionFeedback(
    t("hud.announce.targetSelected", { target: visiblePlayerName(target) }),
  );
}

/** @param {_PlayerView} current */
function tacticalArenaAttackCooldownMarkup(current) {
  const deadline = current.self.cooldownsUntilMs.attack;
  if (deadline === undefined || deadline <= estimatedGameNowMs()) return "";
  return `<span class="tactical-action-cooldown" aria-label="${
    escapeHtml(t("hud.cooldown.countdownAria"))
  }"><em data-deadline-ms="${deadline}"></em><i class="cooldown-ring" aria-hidden="true"></i></span>`;
}

/** @param {_PlayerView} current */
function tacticalArenaAimTarget(current) {
  const ref = tacticalArenaAimTargetRef ?? tacticalArenaTargetRef;
  if (ref === null) return null;
  const target = current.visiblePlayers.find((player) => player.ref === ref) ?? null;
  if (target !== null) return target;
  if (tacticalArenaAimTargetRef === ref) tacticalArenaAimTargetRef = null;
  if (tacticalArenaTargetRef === ref) tacticalArenaTargetRef = null;
  return null;
}

/**
 * Pointer/focus only. This never selects, requests Preview, or sends an action.
 * @param {_PlayerView} current
 */
function applyTacticalArenaAimPresentation(current) {
  tacticalArenaTokens.querySelectorAll(
    ".is-aimed-at,.is-aiming-melee,.is-aiming-ranged,.is-aim-blocked",
  ).forEach((element) =>
    element.classList.remove(
      "is-aimed-at",
      "is-aiming-melee",
      "is-aiming-ranged",
      "is-aim-blocked",
    )
  );
  const selfElement = tacticalArenaTokens.querySelector(".tactical-unit-self");
  if (!(selfElement instanceof HTMLElement)) return;
  const heldWeapon = equippedWeaponReadout(current);
  const weaponImage = selfElement.querySelector("[data-arena-unit-weapon]");
  const restoreHeldWeapon = () => {
    if (!(weaponImage instanceof HTMLImageElement)) return;
    if (heldWeapon.icon === null) {
      weaponImage.hidden = true;
      weaponImage.removeAttribute("src");
      return;
    }
    weaponImage.src = heldWeapon.icon;
    weaponImage.hidden = false;
  };
  const target = tacticalArenaAimTarget(current);
  if (target === null) {
    delete selfElement.dataset.actionWeapon;
    restoreHeldWeapon();
    return;
  }
  const targetElement = [...tacticalArenaTokens.querySelectorAll("[data-arena-target]")].find(
    (element) => element instanceof HTMLElement && element.dataset.arenaTarget === target.ref,
  );
  const weapon = engagementWeapon(current, target);
  if (weapon === null) {
    selfElement.classList.add("is-aim-blocked");
    targetElement?.classList.add("is-aim-blocked");
    delete selfElement.dataset.actionWeapon;
    restoreHeldWeapon();
    return;
  }
  const motion = isMeleeWeapon(weapon) ? "melee" : "ranged";
  selfElement.classList.add(`is-aiming-${motion}`);
  selfElement.dataset.actionWeapon = weapon;
  targetElement?.classList.add("is-aimed-at", `is-aiming-${motion}`);
  const actionWeaponIcon = itemFieldIconUrl(weapon);
  if (weaponImage instanceof HTMLImageElement && actionWeaponIcon !== null) {
    weaponImage.src = actionWeaponIcon;
    weaponImage.hidden = false;
  }
}

/** @param {_PlayerView} current @param {string | null} targetRef */
function setTacticalArenaAimTarget(current, targetRef) {
  tacticalArenaAimTargetRef = targetRef;
  applyTacticalArenaAimPresentation(current);
}

/** @param {_PlayerView} current @param {ReturnType<typeof projectTacticalArenaModel>} projection */
function tacticalArenaTokenMarkup(current, projection) {
  const selfFigure = tacticalProfessionFigure(current.self.profession);
  const selfMotion = characterMotionMarkup(current.self.profession);
  const selfProgression = currentProgressionReadout(current);
  const selfHealth = healthAnimationCue(current.self, { maxHp: selfProgression.maxHp });
  const heldWeapon = equippedWeaponReadout(current);
  const aimedTarget = tacticalArenaAimTarget(current);
  const aimedWeapon = aimedTarget === null ? null : engagementWeapon(current, aimedTarget);
  const actionWeapon = aimedWeapon ?? heldWeapon.kind;
  const actionWeaponIcon = itemFieldIconUrl(actionWeapon);
  const selfAimClass = aimedTarget === null
    ? ""
    : aimedWeapon === null
    ? " is-aim-blocked"
    : isMeleeWeapon(aimedWeapon)
    ? " is-aiming-melee"
    : " is-aiming-ranged";
  const sameNodePlayers = new Map(
    current.visiblePlayers.filter((player) => player.node === current.self.node).map((player) => [
      player.ref,
      player,
    ]),
  );
  const units = projection.tokenPositions.map((position) => {
    const style = `left:${(position.x * 100).toFixed(2)}%;top:${
      (position.y * 100).toFixed(2)
    }%;--arena-scale:${position.scale.toFixed(3)};z-index:${Math.round(position.depth * 100) + 20}`;
    if (position.isSelf) {
      return `<div class="tactical-unit tactical-unit-self health-pose-${selfHealth.pose} token-status-${
        escapeHtml(current.self.status)
      }${selfAimClass}" data-held-weapon="${
        escapeHtml(heldWeapon.kind ?? "none")
      }" data-action-weapon="${escapeHtml(aimedWeapon ?? "")}" style="${style}" aria-label="${
        escapeHtml(
          `${
            t("chat.you")
          } · HP ${current.self.hp}/${selfProgression.maxHp} · Signal ${current.self.signal} · ${
            t("hud.combat.weaponLabel")
          } ${heldWeapon.name}`,
        )
      }">
        <span class="tactical-unit-aura" aria-hidden="true"></span>
        <span class="tactical-unit-base" aria-hidden="true"></span>
        ${
        selfFigure === null
          ? '<span class="tactical-unit-silhouette" aria-hidden="true"></span>'
          : `<img class="tactical-unit-figure" src="${selfFigure}" alt="" width="768" height="1152">`
      }
        ${selfMotion}
        <span class="tactical-unit-weapon" aria-hidden="true"><img data-arena-unit-weapon ${
        actionWeaponIcon === null ? "hidden" : `src="${escapeHtml(actionWeaponIcon)}"`
      } alt="" width="34" height="34"></span>
        <b>${escapeHtml(t("chat.you"))}</b>
        <small>${
        escapeHtml(heldWeapon.name)
      } · HP ${current.self.hp}/${selfProgression.maxHp}</small>
      </div>`;
    }
    const player = sameNodePlayers.get(position.ref);
    if (player === undefined) return "";
    const contactFigure = tacticalContactFigure(player);
    const name = visiblePlayerName(player);
    const level = identifiedPlayerLevel(player);
    const weapon = engagementWeapon(current, player);
    const weaponMotion = weapon === null ? "blocked" : isMeleeWeapon(weapon) ? "melee" : "ranged";
    // engagementWeapon 回的是**你**要拿來打這個目標的武器,不是他手上的。它已經畫在你自己的
    // 單位上(applyTacticalArenaAimPresentation),不能再畫到敵人身上——雙方常常同時拿 tool／
    // stool(唯一的 common 級武器),兩顆一模一樣的圖示並排只會被讀成重複或誤讀成對方的武器。
    // 這個徽章唯一獨有的資訊是「近戰／遠程／打不到」,交給下面的字符表示即可。
    const contactHeldWeapon = player.equippedWeapon;
    const contactHeldWeaponIcon = itemFieldIconUrl(contactHeldWeapon);
    const contactHealthPose = !player.identified || player.hpBand === undefined
      ? "unknown"
      : player.hpBand === "critical" || player.hpBand === "downed"
      ? "critical"
      : player.hpBand === "hurt"
      ? "wounded"
      : "healthy";
    const previewState = weapon === null
      ? "none"
      : tacticalArenaPreviewState(current, player, weapon);
    return `<button class="tactical-unit tactical-unit-contact ${
      player.identified ? "is-identified" : "is-silhouette"
    } armor-silhouette-${player.armorSilhouette}${
      tacticalArenaTargetRef === player.ref ? " is-targeted" : ""
    }${
      aimedTarget?.ref === player.ref ? " is-aimed-at" : ""
    } can-engage-${weaponMotion} health-pose-${contactHealthPose} token-status-${player.status}" type="button" data-arena-target="${
      escapeHtml(player.ref)
    }" data-arena-weapon="${
      escapeHtml(weapon ?? "")
    }" data-arena-weapon-motion="${weaponMotion}" style="${style}" aria-pressed="${
      tacticalArenaTargetRef === player.ref
    }" aria-busy="${previewState === "pending"}" title="${
      escapeHtml(
        `${t("hud.combat.targetLabel")} · ${name} · ${tacticalArenaTargetDetail(current, player)}`,
      )
    }" aria-label="${
      escapeHtml(
        `${t("hud.combat.targetLabel")} · ${name} · ${t("hud.combat.scope.sameNode")} · ${
          t("encounter.observe.label")
        } · ${armorSilhouetteLabel(player.armorSilhouette)} · ${t("hud.combat.weaponLabel")} ${
          contactHeldWeapon === null
            ? t("situation.silhouette.unarmed")
            : itemDisplayName(contactHeldWeapon)
        }${level === null ? "" : ` · ${t("hud.level.badge", { level })}`}`,
      )
    }">
      <span class="tactical-unit-aura" aria-hidden="true"></span>
      <span class="tactical-unit-base" aria-hidden="true"></span>
      <img class="tactical-unit-figure tactical-unit-opponent-figure" src="${contactFigure}" alt="" width="384" height="576">
      <span class="tactical-unit-weapon tactical-unit-contact-weapon" aria-hidden="true"><img ${
      contactHeldWeaponIcon === null ? "hidden" : `src="${escapeHtml(contactHeldWeaponIcon)}"`
    } alt="" width="34" height="34"></span>
      <span class="tactical-target-intent tactical-target-intent-${weaponMotion}" aria-hidden="true"><i>${
      weapon === null ? "×" : weaponMotion === "melee" ? "╱" : "⌖"
    }</i></span>
      <em class="tactical-unit-selection" aria-hidden="true">${
      escapeHtml(t("hud.combat.targetLabel"))
    }</em>
      <b>${escapeHtml(name)}</b>
      <small>${escapeHtml(armorSilhouetteLabel(player.armorSilhouette))}${
      player.equippedWeapon === null
        ? ""
        : ` · ${escapeHtml(itemDisplayName(player.equippedWeapon))}`
    }</small>
    </button>`;
  });
  const adjacent = current.visiblePlayers.filter((player) => player.node !== current.self.node);
  if (adjacent.length > 0) {
    units.push(
      `<details class="tactical-arena-distant"><summary>${
        escapeHtml(t("hud.context.adjacentContacts"))
      } · ${adjacent.length}</summary><div aria-label="${
        escapeHtml(t("hud.context.adjacentContacts"))
      }">${
        adjacent.map((player) => {
          const weapon = engagementWeapon(current, player);
          const contactFigure = tacticalContactFigure(player);
          const previewState = weapon === null
            ? "none"
            : tacticalArenaPreviewState(current, player, weapon);
          const targetClass = `${player.identified ? "is-identified" : "is-silhouette"}${
            tacticalArenaTargetRef === player.ref ? " is-targeted" : ""
          }`;
          return `<button type="button" data-arena-target="${
            escapeHtml(player.ref)
          }" class="${targetClass}" aria-pressed="${
            tacticalArenaTargetRef === player.ref
          }" aria-busy="${previewState === "pending"}" title="${
            escapeHtml(tacticalArenaTargetDetail(current, player))
          }" aria-label="${
            escapeHtml(
              `${t("hud.combat.targetLabel")} · ${visiblePlayerName(player)} · ${
                t("hud.combat.scope.adjacentLos")
              } · ${t("encounter.observe.label")}`,
            )
          }"><i class="tactical-distant-contact-figure" aria-hidden="true"><img src="${
            escapeHtml(contactFigure)
          }" alt="" width="36" height="48"></i><b>${
            escapeHtml(visiblePlayerName(player))
          }</b><small>${escapeHtml(t("hud.combat.scope.adjacentLos"))}</small></button>`;
        }).join("")
      }</div></details>`,
    );
  }
  return units.join("");
}

function bindTacticalArenaTargets() {
  const hoverCapable = globalThis.matchMedia?.("(hover: hover) and (pointer: fine)").matches ??
    false;
  tacticalArenaTokens.querySelectorAll("[data-arena-target]").forEach((element) => {
    if (!(element instanceof HTMLButtonElement)) return;
    const currentTarget = () => {
      if (view === null) return null;
      const targetRef = element.dataset.arenaTarget;
      if (targetRef === undefined) return null;
      return view.visiblePlayers.find((player) => player.ref === targetRef) ?? null;
    };
    element.addEventListener("click", () => {
      const target = currentTarget();
      if (target === null || view === null) return;
      element.focus({ preventScroll: true });
      selectTacticalArenaTarget(view, target);
    });
    if (hoverCapable) {
      element.addEventListener("pointerenter", () => {
        const target = currentTarget();
        if (target === null || view === null) return;
        setTacticalArenaAimTarget(view, target.ref);
      });
      element.addEventListener("pointerleave", () => {
        if (view === null || document.activeElement === element) return;
        setTacticalArenaAimTarget(view, null);
      });
    }
    element.addEventListener("focus", () => {
      const target = currentTarget();
      if (target === null || view === null) return;
      setTacticalArenaAimTarget(view, target.ref);
    });
    element.addEventListener("blur", () => {
      if (view === null || (hoverCapable && element.matches(":hover"))) return;
      setTacticalArenaAimTarget(view, null);
    });
  });
}

const TACTICAL_ARENA_DIRECTIONS = /** @type {const} */ ({
  up: "↑",
  right: "→",
  down: "↓",
  left: "←",
});

/** @param {ReturnType<typeof tacticalArenaExitProjection>["up"]} exit */
function tacticalArenaExitDetail(exit) {
  if (exit === null) return "";
  const trait = t(
    exit.trait === "root"
      ? "hud.routes.trait.root"
      : exit.trait === "tunnel"
      ? "hud.routes.trait.tunnel"
      : "hud.routes.trait.open",
  );
  const familiar = narrativeFamiliarEdges.has(exit.edgeId) ? t("hud.routes.familiar") : "";
  return [trait, familiar].filter(Boolean).join(" · ");
}

/** @param {_PlayerView} current */
function renderTacticalArenaExits(current) {
  const projection = tacticalArenaExitProjection(current);
  const focusedDirection = document.activeElement instanceof HTMLButtonElement &&
      tacticalArenaExits.contains(document.activeElement)
    ? document.activeElement.dataset.arenaDirection
    : undefined;
  const action = current.self.status === "echo" ? "echo_move" : "move";
  const locked = (current.self.status !== "active" && current.self.status !== "echo") ||
    pendingCommandActions.size > 0 || current.self.casting !== undefined ||
    !assistActionReady(current, action) || !gameplayForeground(current).lowerActionsAvailable;
  const directions = /** @type {const} */ (["up", "right", "down", "left"]);
  const directionalMarkup = directions.map((direction) => {
    const exit = projection[direction];
    if (exit === null) return "";
    const disabled = locked || !exit.available;
    const detail = !exit.available
      ? t("hud.tactical.nodeBlocked")
      : !assistActionReady(current, action)
      ? t("hud.lock.notYet")
      : tacticalArenaExitDetail(exit);
    const label = `${t("hud.routes.goTo", { node: exit.displayName })} · ${detail}`;
    return `<button type="button" class="tactical-arena-exit tactical-arena-exit-${direction}" data-arena-direction="${direction}" data-arena-exit="${
      escapeHtml(exit.nodeId)
    }" ${disabled ? "disabled" : ""} aria-label="${escapeHtml(label)}" title="${
      escapeHtml(label)
    }"><i aria-hidden="true">${TACTICAL_ARENA_DIRECTIONS[direction]}</i><span><b>${
      escapeHtml(exit.displayName)
    }</b><small>${escapeHtml(detail)}</small></span></button>`;
  }).join("");
  const overflowMarkup = projection.overflow.length === 0
    ? ""
    : `<details class="tactical-arena-exit-overflow"><summary>${
      escapeHtml(t("hud.option.routes.label"))
    } · +${projection.overflow.length}</summary><div>${
      projection.overflow.map((exit) =>
        `<button type="button" data-arena-exit="${escapeHtml(exit.nodeId)}" ${
          locked || !exit.available ? "disabled" : ""
        }><b>${escapeHtml(exit.displayName)}</b><small>${
          escapeHtml(
            exit.available ? tacticalArenaExitDetail(exit) : t("hud.tactical.nodeBlocked"),
          )
        }</small></button>`
      ).join("")
    }</div></details>`;
  tacticalArenaExits.innerHTML = directionalMarkup + overflowMarkup;
  tacticalArenaExits.querySelectorAll("[data-arena-exit]").forEach((element) => {
    element.addEventListener("click", () => {
      if (!(element instanceof HTMLButtonElement) || element.dataset.arenaExit === undefined) {
        return;
      }
      if (view === null) return;
      const nodeId = /** @type {import("@darkforest/protocol").NodeId} */ (
        element.dataset.arenaExit
      );
      const liveProjection = tacticalArenaExitProjection(view);
      const liveExit = [
        liveProjection.up,
        liveProjection.right,
        liveProjection.down,
        liveProjection.left,
        ...liveProjection.overflow,
      ].find((candidate) => candidate?.nodeId === nodeId);
      if (
        liveExit === undefined || liveExit === null || !liveExit.available ||
        pendingCommandActions.size > 0 || view.self.casting !== undefined ||
        !gameplayForeground(view).lowerActionsAvailable
      ) {
        tacticalArenaActionFeedback(
          liveExit?.available === false ? t("hud.tactical.nodeBlocked") : t("hud.lock.notYet"),
        );
        return;
      }
      if (narrativeCommanderActive || controlMode === "semi") takeNarrativeControl();
      openNarrativeMovementChoice(
        view,
        nodeId,
        t("hud.routes.goTo", { node: narrativeNodeName(view, nodeId) }),
        t("hud.routes.chosen"),
      );
      queueMicrotask(() => {
        const first = tacticalArenaActions.querySelector("button:not(:disabled)");
        if (first instanceof HTMLButtonElement) first.focus({ preventScroll: true });
      });
    });
  });
  if (focusedDirection !== undefined) {
    const focused = tacticalArenaExits.querySelector(
      `[data-arena-direction="${focusedDirection}"]`,
    );
    if (focused instanceof HTMLButtonElement) focused.focus({ preventScroll: true });
  }
}

/** @param {_PlayerView} current */
function renderTacticalArenaMovementChoice(current) {
  const choice = narrativeMovementChoice;
  if (choice === null) return false;
  if (current.self.status !== "active") {
    narrativeMovementChoice = null;
    return false;
  }
  const edge = edgeForMove(current, choice.to);
  const destination = narrativeNodeName(current, choice.to);
  const options = movementStyleOptions(
    { action: "move", to: choice.to },
    destination,
    edge?.trait,
    "S2",
  );
  tacticalArenaActions.innerHTML = `<section class="tactical-field-panel" aria-label="${
    escapeHtml(choice.title)
  }"><header><span>${escapeHtml(t("hud.routes.title"))}</span><b>${
    escapeHtml(destination)
  }</b></header><div class="tactical-field-choice-grid">${
    options.map((option) => {
      const payload = option.payload;
      const resourceReady = payload?.action !== "move" || payload.style !== "rush" ||
        survivalReadout(current).canRush;
      return `<button type="button" data-arena-movement="${escapeHtml(option.key)}" ${
        resourceReady ? "" : "disabled"
      }><i aria-hidden="true">${
        payload?.action === "move" && payload.style === "rush" ? "»" : "⌁"
      }</i><span><b>${escapeHtml(option.label)}</b><small>${
        payload?.action === "move"
          ? `${escapeHtml(movementResourceCopy(current, payload))} · ${escapeHtml(option.note)}`
          : escapeHtml(option.note)
      }</small></span></button>`;
    }).join("")
  }</div><button type="button" class="tactical-field-cancel" data-arena-movement-cancel>${
    escapeHtml(t("hud.movement.cancel"))
  }</button></section>`;
  tacticalArenaActions.querySelectorAll("[data-arena-movement]").forEach((element) => {
    element.addEventListener("click", () => {
      if (!(element instanceof HTMLButtonElement) || view === null) return;
      const liveChoice = narrativeMovementChoice;
      if (liveChoice === null || liveChoice.to !== choice.to) return;
      const liveEdge = edgeForMove(view, liveChoice.to);
      const liveOptions = movementStyleOptions(
        { action: "move", to: liveChoice.to },
        narrativeNodeName(view, liveChoice.to),
        liveEdge?.trait,
        "S2",
      );
      const selected = liveOptions.find((option) => option.key === element.dataset.arenaMovement);
      if (selected?.payload === undefined) return;
      if (
        selected.payload.action === "move" && selected.payload.style === "rush" &&
        !survivalReadout(view).canRush
      ) {
        tacticalArenaActionFeedback(rejectionNarrativeLine("NO_STAMINA"));
        return;
      }
      narrativeMovementChoice = null;
      executeNarrativePayload(view, selected.payload, selected.label, selected.note);
    });
  });
  tacticalArenaActions.querySelector("[data-arena-movement-cancel]")?.addEventListener(
    "click",
    () => {
      if (view === null) return;
      narrativeMovementChoice = null;
      renderNarrativeMode(view);
      queueMicrotask(() => {
        const exit = tacticalArenaExits.querySelector(
          `[data-arena-exit="${CSS.escape(choice.to)}"]`,
        );
        if (exit instanceof HTMLButtonElement) exit.focus({ preventScroll: true });
      });
    },
  );
  return true;
}

function renderTacticalArenaPendingDecision() {
  const decision = narrativePendingDecision;
  if (decision === null) return false;
  tacticalArenaActions.innerHTML =
    `<section class="tactical-field-panel is-confirming"><header><span>${
      escapeHtml(t("decision.title"))
    }</span><b>${escapeHtml(decision.title)}</b></header><p>${
      escapeHtml(decision.context)
    }</p><div class="tactical-field-choice-grid"><button type="button" class="is-primary" data-arena-confirm><b>${
      escapeHtml(decision.confirmLabel)
    }</b></button><button type="button" data-arena-cancel><b>${
      escapeHtml(t("hud.card.cancel"))
    }</b></button></div></section>`;
  tacticalArenaActions.querySelector("[data-arena-confirm]")?.addEventListener("click", () => {
    if (view === null || narrativePendingDecision !== decision) return;
    confirmNarrativePendingDecision(view, decision);
  });
  tacticalArenaActions.querySelector("[data-arena-cancel]")?.addEventListener("click", () => {
    if (view === null) return;
    cancelNarrativePendingDecision(view);
  });
  return true;
}

/** @param {_PlayerView} current */
function renderTacticalArenaCacheChoice(current) {
  if (!narrativeCacheDecisionOpen) return false;
  if (current.self.status !== "active") {
    narrativeCacheDecisionOpen = false;
    narrativeCacheOffer = null;
    narrativeCacheWanted = null;
    return false;
  }
  const offers = visibleCacheOffers(current);
  const offer = offers.find((candidate) => candidate.cacheId === narrativeCacheOffer?.cacheId) ??
    offers[0];
  if (offer === undefined) {
    narrativeCacheDecisionOpen = false;
    narrativeCacheOffer = null;
    narrativeCacheWanted = null;
    return false;
  }
  narrativeCacheOffer = offer;
  const wanted = offer.items.find((item) => item.kind === narrativeCacheWanted) ?? offer.items[0];
  if (wanted === undefined) return false;
  narrativeCacheWanted = wanted.kind;
  const merges = current.self.inventory.some((item) => item.kind === wanted.kind);
  const full = current.self.capacity.used + (merges ? 0 : 1) > current.self.capacity.total;
  const ready = assistActionReady(current, "pickup") && pendingCommandActions.size === 0 &&
    current.self.casting === undefined;
  const itemButtons = offers.flatMap((candidate, pileIndex) =>
    candidate.items.map((item) => {
      const selected = candidate.cacheId === offer.cacheId && item.kind === wanted.kind;
      return `<button type="button" data-arena-cache="${
        escapeHtml(candidate.cacheId)
      }" data-arena-cache-item="${escapeHtml(item.kind)}" aria-pressed="${selected}" ${
        full || ready ? "" : "disabled"
      }><i class="tactical-field-item-icon" aria-hidden="true">${
        fieldItemIconMarkup(item.kind, "cache-item-icon")
      }</i><span><b>${escapeHtml(itemStackDisplayName(item))}</b><small>${
        escapeHtml(
          t("inventory.cache.pile", { index: pileIndex + 1 }),
        )
      }</small></span></button>`;
    })
  ).join("");
  const swapButtons = full
    ? `<p>${escapeHtml(t("inventory.cache.full.title"))}</p><div class="tactical-field-swap-grid">${
      current.self.inventory.map((item) =>
        `<button type="button" data-arena-cache-drop="${escapeHtml(item.kind)}" ${
          ready ? "" : "disabled"
        }><span class="cache-swap-icons">${
          fieldItemIconMarkup(item.kind, "cache-item-icon")
        }<i aria-hidden="true">→</i>${
          fieldItemIconMarkup(wanted.kind, "cache-item-icon")
        }</span><span class="cache-choice-copy"><b>${
          escapeHtml(t("inventory.cache.drop", { item: itemDisplayName(item.kind) }))
        }</b><small>${
          escapeHtml(t("inventory.cache.take", { item: itemDisplayName(wanted.kind) }))
        }</small></span></button>`
      ).join("")
    }</div>`
    : "";
  tacticalArenaActions.innerHTML =
    `<section class="tactical-field-panel tactical-field-cache"><header><span>${
      escapeHtml(t("hud.label.groundLoot"))
    }</span><b>${
      escapeHtml(t("inventory.cache.title"))
    }</b></header><div class="tactical-field-loot-grid">${itemButtons}</div>${swapButtons}<button type="button" class="tactical-field-cancel" data-arena-cache-cancel>${
      escapeHtml(t("inventory.cache.abandon"))
    }</button></section>`;
  tacticalArenaActions.querySelectorAll("[data-arena-cache-item]").forEach((element) => {
    element.addEventListener("click", () => {
      if (
        !(element instanceof HTMLButtonElement) || view === null ||
        element.dataset.arenaCache === undefined || element.dataset.arenaCacheItem === undefined
      ) return;
      const cache = visibleCacheOffers(view).find((candidate) =>
        candidate.cacheId === element.dataset.arenaCache
      );
      const item = cache?.items.find((candidate) =>
        candidate.kind === element.dataset.arenaCacheItem
      );
      if (cache === undefined || item === undefined) return;
      narrativeCacheOffer = cache;
      narrativeCacheWanted = item.kind;
      const liveMerges = view.self.inventory.some((candidate) => candidate.kind === item.kind);
      const liveFull = view.self.capacity.used + (liveMerges ? 0 : 1) > view.self.capacity.total;
      if (liveFull) {
        renderTacticalArenaActions(view);
        return;
      }
      if (
        !assistActionReady(view, "pickup") || pendingCommandActions.size > 0 ||
        view.self.casting !== undefined
      ) {
        tacticalArenaActionFeedback(t("hud.lock.notYet"));
        return;
      }
      const commandId = sendAction({ action: "pickup", cacheId: cache.cacheId, item: item.kind });
      if (commandId !== null) pendingPickupNarratives.set(commandId, item.kind);
      narrativeCacheDecisionOpen = false;
      renderNarrativeMode(view);
    });
  });
  tacticalArenaActions.querySelectorAll("[data-arena-cache-drop]").forEach((element) => {
    element.addEventListener("click", () => {
      if (
        !(element instanceof HTMLButtonElement) || view === null ||
        element.dataset.arenaCacheDrop === undefined
      ) return;
      const droppedItem = /** @type {import("@darkforest/protocol").ItemKind} */ (
        element.dataset.arenaCacheDrop
      );
      const dropCommandId = sendAction({ action: "drop", item: droppedItem });
      if (dropCommandId === null) return;
      pendingCapacitySwap = {
        cacheId: offer.cacheId,
        item: wanted.kind,
        droppedItem,
        dropCommandId,
      };
      narrativeCacheDecisionOpen = false;
      renderNarrativeMode(view);
    });
  });
  tacticalArenaActions.querySelector("[data-arena-cache-cancel]")?.addEventListener(
    "click",
    () => {
      if (view === null) return;
      narrativeCacheDecisionOpen = false;
      narrativeCacheOffer = null;
      narrativeCacheWanted = null;
      renderNarrativeMode(view);
      queueMicrotask(() => {
        const trigger = tacticalArenaInteractables.querySelector("[data-arena-cache-open]");
        if (trigger instanceof HTMLButtonElement) trigger.focus({ preventScroll: true });
        else tacticalArenaHeading.focus({ preventScroll: true });
      });
    },
  );
  return true;
}

/** @param {_PlayerView} current */
function tacticalArenaSelectedTarget(current) {
  if (tacticalArenaTargetRef !== null) {
    const selected = current.visiblePlayers.find((player) =>
      player.ref === tacticalArenaTargetRef
    ) ?? null;
    if (selected !== null) return selected;
    tacticalArenaTargetRef = null;
  }
  const prompt = current.encounterPrompt;
  if (prompt === undefined) tacticalArenaDismissedEncounterId = null;
  const promptRefs = prompt?.targetRefs ?? [];
  if (promptRefs.length !== 1) return null;
  if (prompt?.encounterId === tacticalArenaDismissedEncounterId) return null;
  const encountered =
    current.visiblePlayers.find((player) => tacticalArenaTargetInEncounter(current, player)) ??
      null;
  if (encountered !== null) tacticalArenaTargetRef = encountered.ref;
  return encountered;
}

/** @param {_PlayerView} current @param {import("@darkforest/protocol").VisiblePlayer} target */
function tacticalArenaTargetControlsMarkup(current, target) {
  const weapon = engagementWeapon(current, target);
  const weaponIcon = itemFieldIconUrl(weapon);
  const weaponLabel = weapon === null ? t("situation.silhouette.unarmed") : itemDisplayName(weapon);
  const block = tacticalArenaCombatBlock(current, weapon);
  const previewState = weapon === null
    ? "none"
    : tacticalArenaPreviewState(current, target, weapon);
  const matchingPreview = previewState === "allowed" && lastPreview?.allowed === true &&
      lastPreviewContext?.target === target.ref
    ? lastPreview
    : null;
  const previewWarnings = (matchingPreview?.warnings ?? []).map(previewWarningLine);
  const compactOdds = matchingPreview === null
    ? null
    : `${formatBpsPercent(matchingPreview.hitChanceBpsMin)}–${
      formatBpsPercent(matchingPreview.hitChanceBpsMax)
    } · ${matchingPreview.damageMin ?? "—"}–${matchingPreview.damageMax ?? "—"}`;
  const fireDetail = block !== null || weapon === null
    ? tacticalArenaCombatBlockText(current, block ?? "NO_ITEM")
    : previewState === "none" || previewState === "pending"
    ? t("hud.announce.previewing")
    : previewState === "failed"
    ? t("action.status.reselecting")
    : previewState === "rejected"
    ? rejectionNarrativeLine(lastPreview?.reason)
    : matchingPreview !== null
    ? `${t("preview.hitChance")} ${formatBpsPercent(matchingPreview.hitChanceBpsMin)}–${
      formatBpsPercent(matchingPreview.hitChanceBpsMax)
    } · ${t("preview.damage")} ${matchingPreview.damageMin ?? "—"}–${
      matchingPreview.damageMax ?? "—"
    }${previewWarnings.length === 0 ? "" : ` · ⚠ ${previewWarnings.join(" · ")}`}`
    : t("hud.combat.preview.note");
  const promptTarget = tacticalArenaTargetInEncounter(current, target);
  const observing = promptTarget &&
    narrativeObservedEncounterId === current.encounterPrompt?.encounterId;
  const fireDisabled = block !== null || weapon === null ||
    (previewState === "allowed" ? matchingPreview === null : previewState !== "failed");
  const fireLabel = previewState === "failed"
    ? t("action.status.reselecting")
    : t("preview.card.fire");
  const attackCooldown = tacticalArenaAttackCooldownMarkup(current);
  return `<div class="tactical-target-dock" role="group" aria-label="${
    escapeHtml(`${t("hud.combat.targetLabel")} · ${visiblePlayerName(target)}`)
  }">
    <div class="tactical-target-summary"><span>${
    escapeHtml(t("hud.combat.targetLabel"))
  }</span><b>${escapeHtml(visiblePlayerName(target))}</b><small>${
    escapeHtml(tacticalArenaTargetDetail(current, target))
  }</small>${
    compactOdds === null ? "" : `<em class="tactical-target-odds" aria-label="${
      escapeHtml(
        `${t("preview.hitChance")} ${compactOdds.split(" · ")[0]} · ${t("preview.damage")} ${
          compactOdds.split(" · ")[1]
        }`,
      )
    }">${escapeHtml(compactOdds)}</em>`
  }</div>
    <button type="button" data-arena-target-observe aria-pressed="${observing}" title="${
    escapeHtml(tacticalArenaTargetDetail(current, target))
  }">
      <i aria-hidden="true">${actionIcon("preview")}</i><span><b>${
    escapeHtml(observing ? t("action.status.observing") : t("encounter.observe.label"))
  }</b><small>${escapeHtml(tacticalArenaTargetDetail(current, target))}</small></span>
    </button>
    <button type="button" class="tactical-target-fire danger-button tactical-target-fire-${
    weapon === null ? "blocked" : isMeleeWeapon(weapon) ? "melee" : "ranged"
  }${previewWarnings.length === 0 ? "" : " has-warning"}" data-arena-target-fire title="${
    escapeHtml(fireDetail)
  }" data-preview-state="${previewState}" aria-busy="${
    previewState === "none" || previewState === "pending"
  }" ${fireDisabled ? "disabled" : ""}>
      <span class="tactical-target-fire-icon"><i aria-hidden="true">${
    weaponIcon === null
      ? "⌖"
      : `<img src="${escapeHtml(weaponIcon)}" alt="" width="24" height="24">`
  }</i>${attackCooldown}</span><span><b>${
    escapeHtml(fireLabel)
  }<span class="tactical-target-weapon-label"> · ${escapeHtml(weaponLabel)}</span></b><small>${
    escapeHtml(fireDetail)
  }</small></span>
    </button>
    <button type="button" class="tactical-target-clear" data-arena-target-clear aria-label="${
    escapeHtml(`${t("hud.card.cancel")} · ${t("actions.title")}`)
  }" title="${
    escapeHtml(`${t("hud.card.cancel")} · ${t("actions.title")}`)
  }"><i aria-hidden="true">${actionIcon("cancel")}</i><span><b>${
    escapeHtml(t("hud.card.cancel"))
  }</b></span></button>
  </div>`;
}

/** @param {_PlayerView} current */
function openTacticalArenaCache(current) {
  const offers = visibleCacheOffers(current);
  if (offers.length === 0) return;
  narrativeCacheOffer = offers[0];
  narrativeCacheWanted = offers[0].items[0]?.kind ?? null;
  narrativeCacheDecisionOpen = true;
  renderNarrativeMode(current);
  queueMicrotask(() => {
    const first = tacticalArenaActions.querySelector("[data-arena-cache-item]");
    if (first instanceof HTMLButtonElement) first.focus({ preventScroll: true });
  });
}

/**
 * The field exposes every contextual gateway that would otherwise be hidden in
 * a drawer. Gateways reveal existing detail/decision surfaces; none send an
 * authoritative action themselves.
 * @param {_PlayerView} current
 */
function renderTacticalArenaInteractables(current) {
  const node = current.nodes.find((candidate) => candidate.id === current.self.node);
  if (
    node === undefined || gameplayForeground(current).kind !== "idle" ||
    narrativeMovementChoice !== null ||
    narrativePendingDecision !== null || narrativeCacheDecisionOpen
  ) {
    tacticalArenaInteractables.hidden = true;
    tacticalArenaInteractables.replaceChildren();
    tacticalArenaInteractablesSignature = "";
    tacticalArenaStage.classList.remove("has-arena-interactables");
    return;
  }
  const commandLocked = pendingCommandActions.size > 0 || current.self.casting !== undefined;
  const active = current.self.status === "active";
  const cacheCount = visibleCacheOffers(current).reduce(
    (total, cache) => total + cache.items.length,
    0,
  );
  const itemRail = active
    ? partitionQuickUseItems(current.self.inventory)
    : { quick: [], overflow: [] };
  const quickItemCount = itemRail.quick.length + itemRail.overflow.length;
  const weapon = equippedWeaponReadout(current);
  const shopStatus = !active
    ? t("hud.lock.notYet")
    : commandLocked
    ? t("hud.lock.pending")
    : t("shop.credits.balance", { credits: current.self.credits });
  const cacheStatus = commandLocked
    ? t("hud.lock.pending")
    : t("hud.groundLoot.count", { count: cacheCount });
  const quickStatus = commandLocked
    ? t("hud.lock.pending")
    : `${quickItemCount} · ${t("hud.item.usable")}`;
  const detailsLabel = `${t("inventory.loadout.title")} · ${t("hud.tactical.environment")}`;
  const detailsStatus = `${weapon.name} · ${t("hud.vitals.armor")} ${current.self.armor}`;
  const fieldMode = controlMode === "semi"
    ? "SEMI"
    : controlMode === "assist"
    ? "ASSIST"
    : "MANUAL";
  const fieldPolicy = ENGAGEMENT_POLICY_COPY[engagementPolicy];
  const fieldIntent = `${t("semi.intent.heading")} · ${COMMANDER_INTENT_COPY[assistIntent]}`;
  const policyStatus = `${fieldMode} · ${fieldPolicy.label}`;
  const signature = JSON.stringify([
    getLocale(),
    current.self.node,
    current.self.status,
    current.self.credits,
    current.self.armor,
    current.self.capacity.used,
    current.self.capacity.total,
    commandLocked,
    node.shop?.catalog.length ?? 0,
    cacheCount,
    quickItemCount,
    weapon.kind,
    weapon.resource,
    node.searchesLeft,
    node.coverSlotsFree,
    node.knownHazards.length,
    current.visiblePlayers.length,
    controlMode,
    engagementPolicy,
    assistIntent,
  ]);
  if (signature === tacticalArenaInteractablesSignature) return;
  const focusedGateway = document.activeElement instanceof HTMLButtonElement &&
      tacticalArenaInteractables.contains(document.activeElement)
    ? document.activeElement.dataset.arenaGateway ?? null
    : null;
  const mobileToolsSummaryFocused = document.activeElement instanceof HTMLElement &&
    tacticalArenaInteractables.contains(document.activeElement) &&
    document.activeElement.matches(".tactical-mobile-tools > summary");
  const mobileToolsWasOpen =
    tacticalArenaInteractables.querySelector(".tactical-mobile-tools")?.hasAttribute("open") ??
      false;
  const buttons = [
    `<button type="button" data-arena-gateway="policy" data-arena-policy-open aria-label="${
      escapeHtml(`${t("semi.controlMode.heading")} · ${policyStatus} · ${fieldIntent}`)
    }" title="${escapeHtml(fieldPolicy.detail)}"><i aria-hidden="true">${
      actionIcon("preview")
    }</i><span><b>${escapeHtml(t("semi.controlMode.heading"))}</b><small>${
      escapeHtml(`${policyStatus} · ${fieldIntent}`)
    }</small></span></button>`,
    node.shop === undefined
      ? ""
      : `<button type="button" class="is-contextual is-shop" data-arena-gateway="shop" data-arena-shop-open aria-label="${
        escapeHtml(`${t("shop.title")} · ${shopStatus}`)
      }" title="${escapeHtml(shopStatus)}" ${
        active && !commandLocked ? "" : "disabled"
      }><i aria-hidden="true">¤</i><span><b>${escapeHtml(t("shop.title"))}</b><small>${
        escapeHtml(shopStatus)
      }</small></span></button>`,
    active && cacheCount > 0
      ? `<button type="button" class="is-contextual" data-arena-gateway="cache" data-arena-cache-open aria-label="${
        escapeHtml(`${t("hud.label.groundLoot")} · ${cacheStatus}`)
      }" title="${escapeHtml(cacheStatus)}" ${
        commandLocked ? "disabled" : ""
      }><i aria-hidden="true">${actionIcon("search")}</i><span><b>${
        escapeHtml(t("hud.label.groundLoot"))
      }</b><small>${escapeHtml(cacheStatus)}</small></span></button>`
      : "",
    active && quickItemCount > 0
      ? `<button type="button" data-arena-gateway="utility" data-arena-utility-open aria-label="${
        escapeHtml(`${t("hud.quickItems.title")} · ${quickStatus}`)
      }" title="${escapeHtml(quickStatus)}" ${
        commandLocked ? "disabled" : ""
      }><i aria-hidden="true">${actionIcon("use")}</i><span><b>${
        escapeHtml(t("hud.quickItems.title"))
      }</b><small>${escapeHtml(quickStatus)}</small></span></button>`
      : "",
    `<button type="button" data-arena-gateway="details" data-arena-details-open aria-label="${
      escapeHtml(`${detailsLabel} · ${detailsStatus}`)
    }" title="${escapeHtml(detailsStatus)}"><i aria-hidden="true">${
      actionIcon("equip")
    }</i><span><b>${escapeHtml(detailsLabel)}</b><small>${
      escapeHtml(detailsStatus)
    }</small></span></button>`,
  ].filter((entry) => entry !== "");
  tacticalArenaInteractablesSignature = signature;
  // Field Supply 商店只在你站在商店節點時存在,而工具選單預設收合、標題只寫「現場行動 · N」——玩家
  // 站在維修環廊上完全看不出這裡能交易。抵達時強制展開一次,並讓收合標題直接說是商店。
  const shopHere = node.shop !== undefined;
  if (!shopHere) arenaToolsShopOpenedNode = null;
  const autoOpenForShop = shopHere && arenaToolsShopOpenedNode !== current.self.node;
  if (autoOpenForShop) arenaToolsShopOpenedNode = current.self.node;
  const toolsOpen = mobileToolsWasOpen || autoOpenForShop;
  const toolsTitle = shopHere ? t("shop.title") : t("actions.title");
  tacticalArenaInteractables.innerHTML = buttons.length === 0
    ? ""
    : `<details class="tactical-mobile-tools"${
      toolsOpen ? " open" : ""
    }><summary aria-expanded="${toolsOpen}" aria-label="${
      escapeHtml(`${toolsTitle} · ${shopHere ? shopStatus : policyStatus}`)
    }"><i data-tools-toggle-icon aria-hidden="true">${toolsOpen ? "×" : "＋"}</i><span><b>${
      escapeHtml(toolsTitle)
    }</b><small>${buttons.length}</small></span><em class="tactical-tools-policy">${
      escapeHtml(policyStatus)
    }</em></summary><div class="tactical-mobile-tools-menu">${buttons.join("")}</div></details>`;
  tacticalArenaInteractables.hidden = buttons.length === 0;
  tacticalArenaStage.classList.toggle("has-arena-interactables", buttons.length > 0);
  const mobileTools = tacticalArenaInteractables.querySelector(".tactical-mobile-tools");
  const syncMobileToolsState = () => {
    const expanded = mobileTools instanceof HTMLDetailsElement && mobileTools.open;
    const summary = mobileTools?.querySelector("summary");
    if (summary instanceof HTMLElement) summary.setAttribute("aria-expanded", String(expanded));
    if (expanded && summary instanceof HTMLElement) tacticalSurfaceReturnElement = summary;
    const icon = mobileTools?.querySelector("[data-tools-toggle-icon]");
    if (icon instanceof HTMLElement) icon.textContent = expanded ? "×" : "＋";
    tacticalArenaStage.classList.toggle("has-tools-menu", expanded);
    syncTacticalContextBreadcrumb();
  };
  const closeMobileTools = () => {
    if (mobileTools instanceof HTMLDetailsElement) mobileTools.open = false;
    syncMobileToolsState();
  };
  mobileTools?.addEventListener("toggle", syncMobileToolsState);
  syncMobileToolsState();
  tacticalArenaInteractables.querySelector("[data-arena-policy-open]")?.addEventListener(
    "click",
    () => {
      closeMobileTools();
      openTacticalPolicyDrawer();
    },
  );
  tacticalArenaInteractables.querySelector("[data-arena-shop-open]")?.addEventListener(
    "click",
    () => {
      if (view === null) return;
      closeMobileTools();
      openTacticalActionDrawer(view, "[data-shop-trade]:not(:disabled)");
    },
  );
  tacticalArenaInteractables.querySelector("[data-arena-cache-open]")?.addEventListener(
    "click",
    () => {
      closeMobileTools();
      if (view !== null) openTacticalArenaCache(view);
    },
  );
  tacticalArenaInteractables.querySelector("[data-arena-utility-open]")?.addEventListener(
    "click",
    () => {
      if (view === null) return;
      closeMobileTools();
      openTacticalActionDrawer(view, ".quick-item-button:not(:disabled), .quick-item-button");
    },
  );
  tacticalArenaInteractables.querySelector("[data-arena-details-open]")?.addEventListener(
    "click",
    () => {
      closeMobileTools();
      openTacticalSideDetail(narrativePlayerDrawer);
    },
  );
  mobileTools?.addEventListener("keydown", (event) => {
    if (
      !(event instanceof KeyboardEvent) || event.key !== "Escape" ||
      !(mobileTools instanceof HTMLDetailsElement)
    ) return;
    event.preventDefault();
    mobileTools.open = false;
    const summary = mobileTools.querySelector("summary");
    if (summary instanceof HTMLElement) summary.focus({ preventScroll: true });
  });
  if (focusedGateway !== null) {
    queueMicrotask(() => {
      const restored = tacticalArenaInteractables.querySelector(
        `[data-arena-gateway="${focusedGateway}"]`,
      );
      if (restored instanceof HTMLButtonElement) restored.focus({ preventScroll: true });
    });
  } else if (mobileToolsSummaryFocused) {
    queueMicrotask(() => {
      const summary = tacticalArenaInteractables.querySelector(
        ".tactical-mobile-tools > summary",
      );
      if (summary instanceof HTMLElement) summary.focus({ preventScroll: true });
    });
  }
}

/** @param {_PlayerView} current */
function renderTacticalArenaActions(current) {
  tacticalArenaStage.classList.remove(
    "has-arena-target",
    "has-forced-decision",
    "has-context-decision",
  );
  const foreground = gameplayForeground(current);
  if (foreground.kind === "terminal" || foreground.kind === "forced") {
    const mobileTools = tacticalArenaInteractables.querySelector(".tactical-mobile-tools");
    if (mobileTools instanceof HTMLDetailsElement) mobileTools.open = false;
    const forcedAction = forcedNarrativeActionSignature(current);
    tacticalArenaStage.classList.toggle("has-forced-decision", forcedAction !== null);
    tacticalArenaActions.innerHTML = forcedAction === null
      ? ""
      : `<div class="tactical-field-dock tactical-forced-dock" role="group" aria-label="${
        escapeHtml(t("actions.title"))
      }"><button type="button" data-arena-forced-open><i aria-hidden="true">${
        actionIcon("confirm")
      }</i><span><b>${escapeHtml(t("arena.action.jump"))}</b><small>${
        escapeHtml(narrativeModeHeading.textContent ?? t("actions.title"))
      }</small></span></button></div>`;
    tacticalArenaScene.classList.toggle("has-field-panel", forcedAction !== null);
    tacticalArenaStage.classList.toggle("has-arena-controls", forcedAction !== null);
    tacticalArenaActions.querySelector("[data-arena-forced-open]")?.addEventListener(
      "click",
      () => {
        narrativeActionAutoOpened = true;
        setNarrativeActionExpanded(true);
        focusAfterTacticalRender(() => {
          const decision = narrativeActionColumn.querySelector(
            "#narrative-decision-card button:not(:disabled), #narrative-decision-card input:not(:disabled)",
          );
          return decision instanceof HTMLElement ? decision : narrativeModeHeading;
        });
      },
    );
    return;
  }
  const panelOpen = renderTacticalArenaPendingDecision() ||
    renderTacticalArenaMovementChoice(current) ||
    renderTacticalArenaCacheChoice(current);
  tacticalArenaScene.classList.toggle("has-field-panel", panelOpen);
  tacticalArenaStage.classList.toggle("has-arena-controls", panelOpen);
  tacticalArenaStage.classList.toggle("has-context-decision", panelOpen);
  if (panelOpen) return;
  if (foreground.kind === "contextual") {
    const pending = pendingCommandActions.values().next().value;
    const busyLabel = narrativeRouteMenuOpen
      ? t("hud.routes.title")
      : current.self.casting !== undefined
      ? t(
        current.self.casting.item === "healthy_food" ||
          current.self.casting.item === "spoiled_food"
          ? "hud.casting.eating"
          : "hud.casting.treating",
      )
      : pending === undefined
      ? t("hud.pending.settling")
      : actionLogText(current, pending);
    tacticalArenaActions.innerHTML =
      `<div class="tactical-field-dock tactical-busy-dock" role="status"><span>${
        waitingDotsMarkup(busyLabel)
      }</span></div>`;
    tacticalArenaScene.classList.add("has-field-panel");
    tacticalArenaStage.classList.add("has-arena-controls");
    return;
  }
  const node = current.nodes.find((candidate) => candidate.id === current.self.node);
  const hideState = tacticalHideStep({
    status: current.self.status,
    hidden: current.self.hidden,
    coverSlotsFree: node?.coverSlotsFree ?? 0,
    commandPending: pendingCommandActions.size > 0,
    casting: current.self.casting !== undefined,
    cooling: !assistActionReady(current, "hide"),
  });
  tacticalArenaStage.classList.remove("has-forced-decision");
  const encounter = encounterPresentation(current);
  const prompt = current.encounterPrompt;
  const commandLocked = pendingCommandActions.size > 0 || current.self.casting !== undefined;
  const echoAtAttunedNode = current.self.status === "echo" &&
    current.self.attunedNodes.includes(current.self.node);
  const echoAttuneReady = current.self.status === "echo" && !echoAtAttunedNode &&
    assistActionReady(current, "echo_attune") && !commandLocked;
  const searchReady = current.self.status === "active" && (node?.searchesLeft ?? 0) > 0 &&
    assistActionReady(current, "search") && !commandLocked;
  const hideReady = hideState === "ready";
  const observing = prompt !== undefined && narrativeObservedEncounterId === prompt.encounterId;
  const continuePending = [...pendingCommandActions.values()].some((payload) =>
    payload.action === "encounter_continue"
  );
  const selectedTarget = tacticalArenaSelectedTarget(current);
  if (selectedTarget !== null) {
    const mobileTools = tacticalArenaInteractables.querySelector(".tactical-mobile-tools");
    if (mobileTools instanceof HTMLDetailsElement) mobileTools.open = false;
  }
  if (selectedTarget !== null) {
    const selectedWeapon = engagementWeapon(current, selectedTarget);
    if (
      selectedWeapon !== null &&
      tacticalArenaPreviewState(current, selectedTarget, selectedWeapon) === "none"
    ) {
      scheduleTacticalArenaPreview(current, selectedTarget, selectedWeapon);
    }
  }
  tacticalArenaStage.classList.toggle("has-arena-target", selectedTarget !== null);
  tacticalArenaActions.innerHTML = `${
    selectedTarget === null ? "" : tacticalArenaTargetControlsMarkup(current, selectedTarget)
  }<div class="tactical-field-dock" role="group" aria-label="${escapeHtml(t("actions.title"))}">${
    selectedTarget === null && prompt !== undefined && encounter.level !== "none"
      ? `<button type="button" data-arena-observe aria-pressed="${observing}" ${
        observing ? "disabled" : ""
      } title="${escapeHtml(encounterPromptLine(current))}"><i aria-hidden="true">${
        actionIcon("preview")
      }</i><span><b>${
        escapeHtml(observing ? t("action.status.observing") : t("encounter.observe.label"))
      }</b><small>${escapeHtml(encounterPromptLine(current))}</small></span></button>`
      : ""
  }${
    prompt === undefined &&
      (searchReady || (current.self.status === "active" && (node?.searchesLeft ?? 0) > 0))
      ? `<button type="button" data-arena-search ${searchReady ? "" : "disabled"} title="${
        escapeHtml(t("hud.action.searchesLeft", { count: node?.searchesLeft ?? 0 }))
      }"><i aria-hidden="true">${actionIcon("search")}</i><span><b>${
        escapeHtml(t("action.name.search"))
      }</b><small>${
        escapeHtml(t("hud.action.searchesLeft", { count: node?.searchesLeft ?? 0 }))
      }</small></span>${actionCooldownMarkup("search", current)}</button>`
      : ""
  }${
    prompt !== undefined
      ? ""
      : hideState === "hidden"
      ? `<p class="tactical-arena-hidden-state"><i aria-hidden="true">${
        actionIcon("hide")
      }</i><span>${escapeHtml(t("hud.context.hidden"))}</span></p>`
      : hideReady
      ? `<button type="button" data-arena-hide title="${
        escapeHtml(t("hud.action.coverLeft", { count: node?.coverSlotsFree ?? 0 }))
      }"><i aria-hidden="true">${actionIcon("hide")}</i><span><b>${
        escapeHtml(t("action.name.hide"))
      }</b><small>${
        escapeHtml(t("hud.action.coverLeft", { count: node?.coverSlotsFree ?? 0 }))
      }</small></span></button>`
      : ""
  }${
    current.self.status !== "echo"
      ? ""
      : echoAtAttunedNode
      ? `<p class="tactical-arena-hidden-state tactical-arena-echo-guidance"><i aria-hidden="true">${
        actionIcon("echo_attune")
      }</i><span><b>${escapeHtml(t("semi.echo.needsIntent.title"))}</b><small>${
        escapeHtml(t("semi.echo.needsIntent.detail"))
      }</small></span></p>`
      : `<button type="button" data-arena-attune ${echoAttuneReady ? "" : "disabled"} title="${
        escapeHtml(t("situation.option.attune.note"))
      }"><i aria-hidden="true">${actionIcon("echo_attune")}</i><span><b>${
        escapeHtml(t("situation.option.attune.label"))
      }</b><small>${
        escapeHtml(echoAttuneReady ? t("situation.option.attune.note") : t("hud.lock.notYet"))
      }</small></span>${actionCooldownMarkup("echo_attune", current)}</button>`
  }${
    prompt !== undefined && encounter.level !== "none"
      ? `<button type="button" data-arena-continue ${continuePending ? "disabled" : ""} title="${
        escapeHtml(t("action.name.encounter_continue"))
      }"><i aria-hidden="true">${actionIcon("move")}</i><span><b>${
        escapeHtml(t("action.name.encounter_continue"))
      }</b><small>${
        continuePending ? escapeHtml(t("action.status.pending")) : ""
      }</small></span></button>`
      : ""
  }</div>`;
  tacticalArenaStage.classList.add("has-arena-controls");
  tacticalArenaActions.querySelector("[data-arena-target-observe]")?.addEventListener(
    "click",
    () => {
      if (view === null || tacticalArenaTargetRef === null) return;
      const target = view.visiblePlayers.find((player) => player.ref === tacticalArenaTargetRef);
      if (target === undefined) return;
      if (tacticalArenaTargetInEncounter(view, target)) {
        observeCurrentEncounter(view);
      }
      tacticalArenaActionFeedback(tacticalArenaTargetDetail(view, target));
      renderNarrativeMode(view);
    },
  );
  tacticalArenaActions.querySelector("[data-arena-target-fire]")?.addEventListener("click", () => {
    if (view === null || tacticalArenaTargetRef === null) return;
    const target = view.visiblePlayers.find((player) => player.ref === tacticalArenaTargetRef);
    if (target === undefined) return;
    if (narrativeCommanderActive || controlMode === "semi") takeNarrativeControl();
    activateTacticalArenaTarget(view, target);
  });
  tacticalArenaActions.querySelector("[data-arena-target-clear]")?.addEventListener(
    "click",
    () => {
      if (view === null) return;
      clearTacticalTarget(view, true);
      renderNarrativeMode(view);
      focusAfterTacticalRender(() => {
        const firstFieldAction = tacticalArenaActions.querySelector(
          ".tactical-field-dock button:not(:disabled)",
        );
        return firstFieldAction instanceof HTMLButtonElement
          ? firstFieldAction
          : tacticalArenaHeading;
      });
    },
  );
  tacticalArenaActions.querySelector("[data-arena-observe]")?.addEventListener("click", () => {
    if (view === null || !observeCurrentEncounter(view)) return;
    renderNarrativeMode(view);
  });
  tacticalArenaActions.querySelector("[data-arena-search]")?.addEventListener("click", () => {
    if (view === null || !assistActionReady(view, "search")) return;
    if (narrativeCommanderActive || controlMode === "semi") takeNarrativeControl();
    executeNarrativePayload(
      view,
      { action: "search" },
      t("situation.option.search.label"),
      t("situation.option.search.note"),
    );
  });
  tacticalArenaActions.querySelector("[data-arena-hide]")?.addEventListener("click", () => {
    if (view === null) return;
    const liveNode = view.nodes.find((candidate) => candidate.id === view?.self.node);
    const liveHideState = tacticalHideStep({
      status: view.self.status,
      hidden: view.self.hidden,
      coverSlotsFree: liveNode?.coverSlotsFree ?? 0,
      commandPending: pendingCommandActions.size > 0,
      casting: view.self.casting !== undefined,
      cooling: !assistActionReady(view, "hide"),
    });
    if (liveHideState !== "ready") {
      tacticalArenaActionFeedback(
        liveHideState === "hidden" ? t("hud.context.hidden") : t("hud.lock.notYet"),
      );
      return;
    }
    if (narrativeCommanderActive || controlMode === "semi") takeNarrativeControl();
    sendAction({ action: "hide" });
  });
  tacticalArenaActions.querySelector("[data-arena-attune]")?.addEventListener("click", () => {
    if (
      view === null || view.self.status !== "echo" ||
      view.self.attunedNodes.includes(view.self.node) || !assistActionReady(view, "echo_attune")
    ) return;
    if (narrativeCommanderActive || controlMode === "semi") takeNarrativeControl();
    sendAction({ action: "echo_attune" });
  });
  tacticalArenaActions.querySelector("[data-arena-continue]")?.addEventListener("click", () => {
    if (view?.encounterPrompt === undefined) return;
    sendAction({
      action: "encounter_continue",
      encounterId: view.encounterPrompt.encounterId,
    });
  });
}

/** @param {_PlayerView} current */
function renderTacticalArena(current) {
  const activePhase = current.phase === "megacity" || current.phase === "darkforest";
  const enabled = arenaExperimentRequested && activePhase &&
    current.self.status !== "eliminated";
  document.documentElement.classList.toggle(
    "has-tactical-session",
    tacticalSessionActive(current),
  );
  if (!enabled && tacticalArenaRenderer !== null) resetTacticalArenaRenderer();
  tacticalViewSwitch.hidden = !enabled;
  const fieldVisible = tacticalArenaFieldOwnsContacts(current);
  tacticalArenaStage.hidden = !fieldVisible;
  const storyGrid = document.getElementById("narrative-story-grid");
  if (storyGrid instanceof HTMLElement) storyGrid.hidden = fieldVisible;
  matchView.classList.toggle("tactical-arena-active", fieldVisible);
  document.documentElement.classList.toggle("has-tactical-arena", fieldVisible);
  if (!fieldVisible) {
    tacticalArenaStage.classList.remove(
      "has-arena-controls",
      "has-arena-target",
      "has-forced-decision",
      "has-context-decision",
    );
    tacticalArenaInteractables.hidden = true;
    tacticalArenaInteractablesSignature = "";
    tacticalArenaStage.classList.remove("has-arena-interactables");
    closeTacticalSideDetail();
  }
  document.querySelectorAll("[data-arena-surface]").forEach((element) => {
    if (!(element instanceof HTMLButtonElement)) return;
    element.setAttribute(
      "aria-pressed",
      String(element.dataset.arenaSurface === tacticalArenaSurface),
    );
  });
  syncTacticalSurfaceSwitchLabels();
  const logHeading = document.getElementById("narrative-log-heading");
  if (logHeading instanceof HTMLElement) {
    logHeading.textContent = fieldVisible ? t("arena.title") : t("log.title");
  }
  if (!fieldVisible) return;

  tacticalArenaSelectedTarget(current);
  const model = tacticalArenaModel(current);
  const projection = projectTacticalArenaModel(model);
  const phase = worldPhase(current.phase);
  tacticalArenaScene.dataset.phase = phase;
  // The tactical model carries a localized display label. Art remains keyed by the canonical
  // English topology identity, so a language switch can never break the scene lookup.
  const arenaDefinition = current.map.nodes.find((node) => node.id === current.self.node);
  const arenaUrl = arenaSceneUrl(current, arenaDefinition ?? {});
  if (tacticalArenaScene.dataset.arenaSceneUrl !== arenaUrl) {
    tacticalArenaScene.style.backgroundImage =
      `linear-gradient(180deg,rgba(5,8,10,.03),rgba(5,8,10,.28)),url('${arenaUrl}')`;
    tacticalArenaScene.dataset.arenaSceneUrl = arenaUrl;
  }
  tacticalArenaPhase.textContent = phaseLabel(current.phase);
  tacticalArenaHeading.textContent = narrativeNodeName(current, current.self.node);
  renderTacticalArenaSelfStatus(current);
  const focusedTargetRef = document.activeElement instanceof HTMLButtonElement &&
      tacticalArenaTokens.contains(document.activeElement)
    ? document.activeElement.dataset.arenaTarget
    : undefined;
  tacticalArenaTokens.innerHTML = tacticalArenaTokenMarkup(current, projection);
  hydrateCharacterMotion(tacticalArenaTokens, {
    reducedMotion: accessibilitySettings.reducedMotion,
  });
  syncCharacterTravelMotion(tacticalArenaTokens, tacticalArenaMovementStyle);
  bindTacticalArenaTargets();
  applyTacticalArenaAimPresentation(current);
  renderTacticalArenaExits(current);
  renderTacticalArenaInteractables(current);
  renderTacticalArenaActions(current);
  if (
    narrativeMovementChoice !== null || narrativePendingDecision !== null ||
    narrativeCacheDecisionOpen
  ) {
    narrativeDecisionCard.hidden = true;
  }

  const node = current.nodes.find((candidate) => candidate.id === current.self.node);
  const tags = node?.activeTags ?? [];
  const hazards = node?.knownHazards ?? [];
  const visibleTags = hazards.length === 0 ? tags.slice(0, 1) : [];
  // Arrival can immediately open an encounter decision, which correctly keeps the interactive
  // shop gateway out of the foreground. Keep a non-interactive location marker visible so the
  // player still knows that trading is available underfoot after the encounter is resolved.
  const shopChip = node?.shop === undefined
    ? ""
    : `<span class="tactical-arena-shop"><i aria-hidden="true">¤</i><b>${
      escapeHtml(t("hud.shop.here"))
    }</b></span>`;
  tacticalArenaTags.innerHTML = shopChip + visibleTags.map((tag) => {
    const knownTagArt = Object.hasOwn(TAG_INFO, tag);
    return `<span>${
      knownTagArt
        ? `<img src="/art/icons/tags/${tag.toLowerCase()}.svg" alt="">`
        : '<i aria-hidden="true">△</i>'
    }<b>${escapeHtml(knownTagArt ? TAG_INFO[tag].label : t(`tag.${tag}`))}</b></span>`;
  }).join("") +
    `<span class="tactical-arena-cover"><i aria-hidden="true">◇</i><b>${
      escapeHtml(t("hud.tactical.cover.value", {
        free: node?.coverSlotsFree ?? 0,
        total: current.map.nodes.find((definition) => definition.id === current.self.node)
          ?.coverSlots ?? 0,
      }))
    }</b></span>` +
    (hazards.length === 0
      ? ""
      : `<span class="tactical-arena-hazard"><i aria-hidden="true">△</i><b>${
        escapeHtml(
          hazards.map((hazard) =>
            hazard.kind === "conductive_puddle"
              ? t("arena.hazard.conductivePuddle")
              : t("arena.hazard.unknown")
          ).join(" · "),
        )
      }</b></span>`);
  const receipt = latestMobileActionReceipt();
  const recentFieldEntries = narrativeEntries.slice(-4).reverse();
  const latestEntry = receipt ?? recentFieldEntries[0];
  const previousEntry = recentFieldEntries.find((entry) =>
    entry !== latestEntry && entry.text !== latestEntry?.text
  );
  const latestText = latestEntry?.text ?? t("arena.latest.idle");
  const previousText = previousEntry?.text ?? "";
  const latestLabel = receipt?.label ??
    t(receipt?.kind === "action" ? "hud.log.meta.action" : "log.title");
  const receiptTone = receipt?.fatal
    ? "danger"
    : receipt?.status === "rejected"
    ? "rejected"
    : receipt?.status === "pending" || receipt?.status === "ready"
    ? "pending"
    : "resolved";
  const fieldLogSignature =
    `${getLocale()}\u0000${latestLabel}\u0000${latestText}\u0000${previousText}\u0000${receiptTone}`;
  if (tacticalArenaLatest.dataset.renderSignature !== fieldLogSignature) {
    tacticalArenaLatest.dataset.renderSignature = fieldLogSignature;
    tacticalArenaLatest.dataset.receiptTone = receiptTone;
    tacticalArenaLatest.innerHTML = `<span>${escapeHtml(latestLabel)}</span><b>${
      escapeHtml(latestText)
    }</b>${previousText === "" ? "" : `<small>${escapeHtml(previousText)}</small>`}`;
  }
  ensureTacticalArenaRenderer().update(model);
  if (focusedTargetRef !== undefined) {
    const focusedTarget = [...tacticalArenaTokens.querySelectorAll("[data-arena-target]")].find(
      (element) =>
        element instanceof HTMLButtonElement &&
        element.dataset.arenaTarget === focusedTargetRef,
    );
    if (focusedTarget instanceof HTMLButtonElement) focusedTarget.focus({ preventScroll: true });
  }
}

/**
 * Scale the visible action phase from the authoritative cooldown without
 * stretching a muzzle flash or impact across the whole recovery window. The
 * deadline stays attached for cooldown UI/debug coordination; neither value is
 * allowed to advance match state.
 *
 * @param {ReturnType<typeof projectTacticalFeedbackSequence>} sequence
 * @param {_PlayerView} current
 */
function tacticalFeedbackWithCooldownTiming(sequence, current) {
  const nowMs = estimatedGameNowMs();
  const maxHp = currentProgressionReadout(current).maxHp;
  return sequence.map((cue) => {
    const weaponIcon = cue.kind === "attack" ? itemFieldIconUrl(cue.weapon) : null;
    const visualCue = weaponIcon === null ? cue : { ...cue, weaponIcon };
    if (cue.sourceRef !== current.self.playerId) return visualCue;
    const action = cue.kind === "attack" ? "attack" : cue.kind === "search" ? "search" : null;
    if (action === null) return visualCue;
    const state = actionAnimationState(current.self, action, nowMs, {
      maxHp,
      reducedMotion: accessibilitySettings.reducedMotion,
      duration: { minMs: 180, maxMs: 8_000 },
    });
    if (state.cooldownUntilMs === null) return visualCue;
    const durationMs = state.durationMs <= 0
      ? undefined
      : action === "attack"
      ? Math.round(Math.max(520, Math.min(1_200, state.durationMs * 0.28)))
      : Math.round(Math.max(900, Math.min(2_000, state.durationMs * 0.32)));
    return {
      ...visualCue,
      ...(durationMs === undefined ? {} : { durationMs }),
      deadlineMs: state.cooldownUntilMs,
    };
  });
}

/** @param {_MatchEvent[]} events @param {boolean} moved @param {number} stateVersion */
function stageTacticalArenaFeedback(events, moved, stateVersion) {
  const arrivalStyle = tacticalArenaMovementStyle ?? "rush";
  if (moved || events.some((event) => event.kind === "got_lost")) {
    tacticalArenaMovementStyle = null;
    syncCharacterTravelMotion(tacticalArenaTokens, null);
  }
  if (!arenaExperimentRequested || tacticalArenaRenderer === null) return;
  const projected = projectTacticalFeedbackSequence({
    events,
    moved,
    selfRef: view?.self.playerId ?? "",
    selfNode: view?.self.node ?? "",
    movementStyle: arrivalStyle,
  });
  const sequence = view === null ? projected : tacticalFeedbackWithCooldownTiming(projected, view);
  if (sequence.length === 0) return;
  const signature = `${stateVersion}:${
    sequence.map((cue) =>
      `${cue.kind}:${cue.sourceRef ?? ""}:${cue.targetRef ?? ""}:${cue.variant ?? ""}:${
        cue.style ?? ""
      }`
    ).join("|")
  }`;
  if (signature === tacticalArenaFeedbackSignature) return;
  tacticalArenaFeedbackSignature = signature;
  tacticalArenaRenderer.playFeedbackSequence(sequence);
}

tacticalViewSwitch.querySelectorAll("[data-arena-surface]").forEach((element) => {
  element.addEventListener("click", () => {
    if (!(element instanceof HTMLButtonElement) || view === null) return;
    const surface = element.dataset.arenaSurface;
    if (surface !== "field" && surface !== "log") return;
    if (surface === "field") {
      returnToTacticalField();
      return;
    }
    closeTacticalSideDetail();
    tacticalSurfaceReturnElement = tacticalArenaLogOpen;
    tacticalArenaSurface = surface;
    const forced = forcedNarrativeActionSignature(view) !== null;
    narrativeActionAutoOpened = forced;
    setNarrativeActionExpanded(forced);
    renderNarrativeMode(view);
    if (surface === "log" && narrativeStoryFollowing && !narrativeStoryHoverPaused) {
      queueMicrotask(() => {
        const viewport = narrativeStoryScrollOwner();
        viewport?.scrollTo({ top: viewport.scrollHeight });
      });
    }
  });
});

tacticalArenaLogOpen.addEventListener("click", () => {
  if (view === null) return;
  closeTacticalSideDetail();
  tacticalSurfaceReturnElement = tacticalArenaLogOpen;
  tacticalArenaSurface = "log";
  narrativeActionAutoOpened = false;
  setNarrativeActionExpanded(false);
  renderNarrativeMode(view);
  focusAfterTacticalRender(() => {
    const viewport = narrativeStoryScrollOwner();
    if (narrativeStoryFollowing && !narrativeStoryHoverPaused) {
      viewport?.scrollTo({ top: viewport.scrollHeight });
    }
    const heading = document.getElementById("narrative-log-heading");
    return heading instanceof HTMLElement ? heading : narrativeModeHeading;
  });
});

mobileTacticalCockpitQuery.addEventListener("change", (event) => {
  if (
    !event.matches || view === null || tacticalArenaSurface !== "log"
  ) {
    return;
  }
  const forced = forcedNarrativeActionSignature(view) !== null;
  narrativeActionAutoOpened = forced;
  setNarrativeActionExpanded(forced);
});

tacticalArenaActionJump.addEventListener("click", () => {
  if (view === null) return;
  closeTacticalSideDetail();
  tacticalArenaSurface = "field";
  narrativeActionAutoOpened = false;
  setNarrativeActionExpanded(true);
  renderNarrativeMode(view);
  const target = [
    ...narrativeDecisionCard.querySelectorAll("button:not(:disabled)"),
    ...narrativePreview.querySelectorAll("button:not(:disabled)"),
    ...narrativeOptions.querySelectorAll("[data-narrative-option]:not(:disabled)"),
  ].find((element) => element instanceof HTMLButtonElement);
  const destination = target instanceof HTMLButtonElement ? target : narrativeModeHeading;
  destination.scrollIntoView({
    behavior: accessibilitySettings.reducedMotion ? "auto" : "smooth",
    block: "center",
  });
  destination.focus({ preventScroll: true });
});

function syncTacticalArenaActionJump() {
  const target = [
    ...narrativeDecisionCard.querySelectorAll("button:not(:disabled)"),
    ...narrativePreview.querySelectorAll("button:not(:disabled)"),
    ...narrativeOptions.querySelectorAll("[data-narrative-option]:not(:disabled)"),
  ].find((element) => element instanceof HTMLButtonElement);
  const label = target?.querySelector("b")?.textContent?.trim() ||
    target?.textContent?.trim() || narrativeModeHeading.textContent?.trim() ||
    t("arena.action.jump");
  tacticalArenaActionJumpLabel.textContent = label;
}

/** @param {_PlayerView} current */
function renderNarrativeMode(current) {
  const spectator = current.self.status === "eliminated" && current.phase !== "ended";
  const foreground = gameplayForeground(current);
  if (
    (foreground.kind === "terminal" || foreground.kind === "forced") &&
    matchView.classList.contains("tactical-side-detail-open")
  ) {
    closeTacticalSideDetail();
    tacticalSurfaceReturnElement = null;
  }
  narrativeModeHeading.textContent = current.phase === "ended"
    ? t("endgame.heading.ended")
    : narrativeMomentHeading(current.self.status);
  const active = playViewMode === "narrative" && !spectator;
  narrativeModeView.hidden = !active;
  matchView.classList.toggle("narrative-active", active);
  matchView.classList.toggle("spectator-active", spectator);
  document.documentElement.classList.toggle(
    "has-tactical-session",
    active && tacticalSessionActive(current),
  );
  if (!active) {
    matchView.dataset.foregroundSurface = foreground.kind;
    document.documentElement.classList.remove("has-tactical-arena");
    tacticalContextBreadcrumb.hidden = true;
    document.documentElement.classList.remove("has-tactical-breadcrumb");
    return;
  }
  matchView.dataset.foregroundSurface = foreground.kind;
  const lowerActionsHidden = !foreground.lowerActionsAvailable;
  manualActionDrawer.hidden = lowerActionsHidden;
  mobileCombatToggle.hidden = lowerActionsHidden;
  combatPanel.hidden = lowerActionsHidden;
  if (assistDrawer !== null) assistDrawer.hidden = lowerActionsHidden;
  narrativeActionToggle.hidden = foreground.kind === "terminal" ||
    foreground.kind === "forced" || foreground.kind === "confirm";
  narrativePolicyRail.inert = lowerActionsHidden;
  if (lowerActionsHidden) {
    manualActionDrawer.open = false;
    combatPanel.classList.remove("is-mobile-expanded");
    mobileCombatToggle.setAttribute("aria-expanded", "false");
  }
  lastRenderedFinaleEntry = finaleEntryAvailableNow(current);
  renderNarrativeStatusbar(current);
  renderNarrativeContext(current);
  renderNarrativeStory(current);
  renderNarrativePolicyRail(current);
  renderNarrativePreview(current);
  renderNarrativeDecisionCard(current);
  renderNarrativeOptions(current);
  syncTacticalArenaActionJump();
  renderEchoOraclePanel(current);
  renderNarrativeCommanderMenu(current);
  renderTacticalArena(current);
  syncNarrativeActionDisclosure(current);
  syncTacticalContextBreadcrumb();
  updateTimers();
}

narrativeStory.addEventListener("mouseenter", () => {
  narrativeStoryHoverPaused = true;
});
narrativeStory.addEventListener("mouseleave", () => {
  narrativeStoryHoverPaused = false;
  const viewport = narrativeStoryScrollOwner();
  if (viewport instanceof HTMLElement && narrativeStoryFollowing) {
    viewport.scrollTo({ top: viewport.scrollHeight });
  }
});
narrativeStory.addEventListener("focusin", () => {
  narrativeStoryHoverPaused = true;
});
narrativeStory.addEventListener("focusout", () => {
  narrativeStoryHoverPaused = false;
});
narrativeCombatStory.addEventListener("mouseenter", () => {
  narrativeCombatStoryHoverPaused = true;
});
narrativeCombatStory.addEventListener("mouseleave", () => {
  narrativeCombatStoryHoverPaused = false;
  const list = narrativeCombatStory.querySelector(".narrative-combat-story-list");
  if (list instanceof HTMLElement && narrativeCombatStoryFollowing) {
    list.scrollTo({ top: list.scrollHeight });
  }
});
narrativeCombatStory.addEventListener("focusin", () => {
  narrativeCombatStoryHoverPaused = true;
});
narrativeCombatStory.addEventListener("focusout", () => {
  narrativeCombatStoryHoverPaused = false;
});
document.querySelectorAll("[data-log-filter]").forEach((element) => {
  element.addEventListener("click", () => {
    if (!(element instanceof HTMLButtonElement) || view === null) return;
    const filter = element.dataset.logFilter;
    if (filter !== "all" && filter !== "focus") return;
    narrativeLogFilter = filter;
    narrativeStoryFollowing = true;
    narrativeStoryUnreadCount = 0;
    narrativeStoryRenderSignature = "";
    narrativeStoryDomSignature = "";
    document.querySelectorAll("[data-log-filter]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button === element));
    });
    renderNarrativeStory(view);
  });
});

/** @param {_PlayerView} current @param {boolean=} spectator */
function renderMessages(current, spectator = false) {
  const entries = spectator ? spectatorBroadcastEntries(narrativeEntries) : narrativeEntries;
  const previousViewport = document.getElementById("narrative-log-viewport");
  const pausedScrollTop = previousViewport instanceof HTMLElement ? previousViewport.scrollTop : 0;
  eventPanel.innerHTML = `
    <div class="section-heading narrative-heading">
      <div><p class="eyebrow">${
    spectator ? "GLOBAL BROADCAST · 60S DELAY" : "SECOND-PERSON FEED"
  }</p><h2 id="event-heading">${
    escapeHtml(t(spectator ? "hud.log.title.spectator" : "hud.log.title.player"))
  }</h2></div>
      <span>${entries.length} / 200</span>
    </div>
    ${
    entries.length === 0
      ? `<p class="empty-state">${
        escapeHtml(t(spectator ? "spectate.log.empty" : "hud.log.empty"))
      }</p>`
      : `<div id="narrative-log-viewport" class="narrative-log-viewport" role="log" aria-live="polite">
        <ol class="narrative-log-list">${
        entries.map((entry) => {
          const event = entry.event;
          const isExpanded = expandedNarrativeId === entry.id;
          const line = `<time>[${formatNarrativeTimestamp(entry.atGameMs)}]</time>
            <span class="narrative-level-label">${
            escapeHtml(t(`hud.log.level.${entry.level}`))
          }</span>
            <span class="narrative-copy">${escapeHtml(entry.text)}</span>
            ${event === undefined ? "" : `<b aria-hidden="true">${isExpanded ? "−" : "＋"}</b>`}`;
          if (event === undefined) {
            return `<li class="narrative-entry narrative-level-${entry.level}">
              <div class="narrative-line">${line}</div>
            </li>`;
          }
          const image = eventImage(event);
          const rescue = event.kind === "player_downed" && !isContactRef(event.player) &&
              event.node === current.self.node &&
              current.self.status === "active"
            ? `<button type="button" data-rescue="${escapeHtml(event.player)}">RESCUE ${
              escapeHtml(event.player)
            } · <span data-deadline-ms="${event.downedUntilMs}"></span></button>`
            : "";
          const detail = !isExpanded ? "" : `<article class="event-card narrative-detail">
                ${
            image === null
              ? ""
              : `<img src="/art/placeholders/event.svg" alt="" width="160" height="90" loading="lazy">`
          }
                <div><strong>${escapeHtml(t("hud.log.eventDetail"))}</strong><p>${
            escapeHtml(entry.text)
          }</p>${rescue}</div>
              </article>`;
          return `<li class="narrative-entry narrative-level-${entry.level}${
            entry.fatal ? " narrative-entry-fatal" : ""
          }${event.kind === "got_lost" ? " narrative-entry-lost" : ""}${
            event.kind === "armor_broken" ? " narrative-entry-armor-broken" : ""
          }">
            <button class="narrative-line narrative-line-button" type="button" data-log-toggle="${
            escapeHtml(entry.id)
          }" aria-expanded="${isExpanded}">${line}</button>
            ${detail}
          </li>`;
        }).join("")
      }</ol></div>`
  }
  `;
  eventPanel.querySelectorAll("[data-log-toggle]").forEach((element) => {
    element.addEventListener("click", () => {
      if (!(element instanceof HTMLButtonElement) || element.dataset.logToggle === undefined) {
        return;
      }
      expandedNarrativeId = expandedNarrativeId === element.dataset.logToggle
        ? null
        : element.dataset.logToggle;
      const selectedEntry = entries.find((entry) => entry.id === element.dataset.logToggle);
      if (selectedEntry?.event !== undefined) {
        const nodeId = eventNode(selectedEntry.event);
        logFocusedNodeId = nodeId;
        logFocusedPlayerRef = eventPlayerRef(selectedEntry.event, current);
        if (nodeId !== null) focusedNodeId = nodeId;
        renderMap(current, spectator);
        if (nodeId !== null) {
          queueMicrotask(() => {
            const nodeCard = mapCanvas.querySelector(`[data-node-card="${nodeId}"]`);
            if (nodeCard instanceof HTMLElement) nodeCard.focus({ preventScroll: true });
          });
        }
      }
      renderMessages(current, spectator);
    });
  });
  eventPanel.querySelectorAll("[data-rescue]").forEach((element) => {
    element.addEventListener("click", () => {
      if (element instanceof HTMLButtonElement && element.dataset.rescue !== undefined) {
        if (playViewMode === "narrative") {
          narrativeRouteMenuOpen = false;
          executeNarrativePayload(
            current,
            { action: "rescue", target: element.dataset.rescue },
            t("action.name.rescue", { target: element.dataset.rescue }),
            t("confirm.rescue.context"),
          );
        } else sendAction({ action: "rescue", target: element.dataset.rescue });
      }
    });
  });
  const viewport = document.getElementById("narrative-log-viewport");
  if (viewport instanceof HTMLElement) {
    if (narrativeHoverPaused) viewport.scrollTop = pausedScrollTop;
    else queueMicrotask(() => viewport.scrollTo({ top: viewport.scrollHeight }));
  }
  updateTimers();
}

eventPanel.addEventListener("mouseenter", () => {
  narrativeHoverPaused = true;
});
eventPanel.addEventListener("mouseleave", () => {
  narrativeHoverPaused = false;
  const viewport = document.getElementById("narrative-log-viewport");
  if (viewport instanceof HTMLElement) viewport.scrollTo({ top: viewport.scrollHeight });
});

/** @param {_PlayerView} current */
function renderEchoModeBanner(current) {
  if (echoJitIsFirstUse(echoJitSeenMatches, current.matchId)) {
    echoJitSeenMatches = rememberEchoJitMatch(echoJitSeenMatches, current.matchId);
    saveEchoJitHistory();
    echoJitOpen = true;
    announce(t("hud.banner.echo.jit.announcement"));
  }

  if (modeBanner.querySelector("[data-echo-purpose]") === null) {
    modeBanner.innerHTML = `
      <div class="echo-banner-heading" data-echo-purpose>
        <strong><i aria-hidden="true">◈</i> <span data-echo-title></span></strong>
        <button class="echo-guide-toggle" type="button" data-echo-guide-toggle
          aria-controls="echo-first-use-guide" aria-expanded="false">
          <span data-echo-guide-label></span><i aria-hidden="true">?</i>
        </button>
      </div>
      <p class="echo-banner-detail" data-echo-detail></p>
      <ul class="echo-purpose-grid" data-echo-purpose-grid>
        <li data-echo-rule="allowed"><b></b><span></span></li>
        <li data-echo-rule="blocked"><b></b><span></span></li>
        <li data-echo-rule="loop"><b></b><span></span></li>
      </ul>
      <p class="echo-audio-note"><i aria-hidden="true">◌</i><span data-echo-audio></span></p>
      <section id="echo-first-use-guide" class="echo-first-use-jit" role="region"
        aria-labelledby="echo-first-use-title" tabindex="-1" hidden>
        <div>
          <p class="eyebrow">ECHO // JIT</p>
          <h2 id="echo-first-use-title" data-echo-jit-title></h2>
        </div>
        <div class="echo-first-use-copy">
          <p data-echo-jit-body-one></p>
          <p data-echo-jit-body-two></p>
        </div>
        <button class="echo-jit-dismiss" type="button" data-echo-jit-dismiss>
          <span data-echo-jit-dismiss-label></span><i aria-hidden="true">×</i>
        </button>
      </section>`;
    modeBanner.querySelector("[data-echo-guide-toggle]")?.addEventListener("click", () => {
      echoJitOpen = !echoJitOpen;
      if (view !== null && view.self.status === "echo") renderEchoModeBanner(view);
    });
    modeBanner.querySelector("[data-echo-jit-dismiss]")?.addEventListener("click", () => {
      closeEchoJit(true);
    });
  }

  /** @param {string} selector @param {string} key @param {Record<string, string | number>} params */
  const text = (selector, key, params = {}) => {
    const element = modeBanner.querySelector(selector);
    if (element !== null) element.textContent = t(key, params);
  };
  text("[data-echo-title]", "hud.banner.echo.title");
  text("[data-echo-detail]", "hud.banner.echo.detail", {
    intel: current.self.disasterIntel ?? 0,
    target: ECHO_TWO_INSIGHT_TARGET,
  });
  text('[data-echo-rule="allowed"] b', "hud.banner.echo.allowed.label");
  text('[data-echo-rule="allowed"] span', "hud.banner.echo.allowed.body");
  text('[data-echo-rule="blocked"] b', "hud.banner.echo.blocked.label");
  text('[data-echo-rule="blocked"] span', "hud.banner.echo.blocked.body");
  text('[data-echo-rule="loop"] b', "hud.banner.echo.loop.label");
  text('[data-echo-rule="loop"] span', "hud.banner.echo.loop.body");
  text("[data-echo-audio]", "hud.banner.echo.audio");
  text(
    "[data-echo-guide-label]",
    echoJitOpen ? "hud.banner.echo.guide.close" : "hud.banner.echo.guide.open",
  );
  text("[data-echo-jit-title]", "hud.banner.echo.jit.title");
  text("[data-echo-jit-body-one]", "hud.banner.echo.jit.body1");
  text("[data-echo-jit-body-two]", "hud.banner.echo.jit.body2");
  text("[data-echo-jit-dismiss-label]", "hud.banner.echo.jit.dismiss");

  const purpose = modeBanner.querySelector("[data-echo-purpose-grid]");
  purpose?.setAttribute("aria-label", t("hud.banner.echo.purposeAria"));
  const guideToggle = modeBanner.querySelector("[data-echo-guide-toggle]");
  guideToggle?.setAttribute("aria-expanded", String(echoJitOpen));
  modeBanner.dataset.echoGuideOpen = String(echoJitOpen);
  const guide = modeBanner.querySelector("#echo-first-use-guide");
  if (guide instanceof HTMLElement) guide.hidden = !echoJitOpen;
}

function closeEchoJit(restoreFocus = false) {
  if (!echoJitOpen) return;
  echoJitOpen = false;
  if (view !== null && view.self.status === "echo") renderEchoModeBanner(view);
  if (restoreFocus) {
    queueMicrotask(() => {
      const toggle = modeBanner.querySelector("[data-echo-guide-toggle]");
      if (toggle instanceof HTMLButtonElement) toggle.focus();
    });
  }
}

/** @param {_PlayerView} current */
function renderModeBanner(current) {
  const echoPresentation = current.self.status === "echo" && current.phase !== "ended";
  matchView.classList.toggle("echo-ui", echoPresentation);
  matchView.dataset.playerState = current.phase === "ended" ? "ended" : current.self.status;
  if (echoJitMatchId !== current.matchId) {
    echoJitMatchId = current.matchId;
    echoJitOpen = false;
  }
  if (!echoPresentation) echoJitOpen = false;
  if (current.phase === "ended") {
    const ended = matchEvents.findLast((event) => event.kind === "match_ended");
    const endingLine = ended?.kind === "match_ended"
      ? eventsToNarrative([ended], {
        view: current,
        atGameMs: current.gameNowMs,
        idPrefix: "ending-banner",
      })[0]?.text ?? ""
      : "";
    modeBanner.hidden = false;
    modeBanner.className = "mode-banner mode-ended";
    modeBanner.innerHTML = `<strong>MATCH ENDED</strong><span>${escapeHtml(endingLine)}</span>`;
    return;
  }
  if (current.self.status === "echo") {
    modeBanner.hidden = false;
    modeBanner.className = "mode-banner mode-echo";
    renderEchoModeBanner(current);
    return;
  }
  if (current.self.status === "downed") {
    modeBanner.hidden = false;
    modeBanner.className = "mode-banner mode-downed";
    modeBanner.innerHTML = `<strong>DOWNED</strong><span>${
      countdownSentence(
        "hud.banner.downed.detail",
        `<b data-deadline-ms="${current.self.downedUntilMs ?? current.gameNowMs}"></b>`,
      )
    }</span>`;
    updateTimers();
    return;
  }
  if (current.self.status === "eliminated") {
    modeBanner.hidden = false;
    modeBanner.className = "mode-banner mode-spectator";
    modeBanner.innerHTML = `<strong>${escapeHtml(t("spectate.location"))}</strong><span>${
      escapeHtml(t("spectate.readout.detail"))
    }</span>${
      uiDisclosureMarkup(
        "warning",
        t("spectate.limits.label"),
        t("spectate.limits.title"),
        t("spectate.limits.body"),
      )
    }`;
    return;
  }
  if (current.phase === "darkforest" && current.gameNowMs >= 1_260_000) {
    modeBanner.hidden = false;
    modeBanner.className = "mode-banner mode-final";
    modeBanner.innerHTML = `<strong>SUDDEN DEATH</strong><span>${
      escapeHtml(t("narrative.sudden_death"))
    }</span>`;
    return;
  }
  if (spawnGraceActive(current)) {
    modeBanner.hidden = false;
    modeBanner.className = "mode-banner mode-grace";
    modeBanner.innerHTML = `<strong>△ SPAWN GRACE</strong><span>${
      countdownSentence("hud.feedback.spawnGrace", '<b data-deadline-ms="30000"></b>')
    }</span>`;
    updateTimers();
    return;
  }
  modeBanner.hidden = true;
  modeBanner.textContent = "";
}

/** @param {_PlayerView} current */
function renderLegacy(current) {
  if (current.legacyPrompt === undefined || playViewMode === "narrative") {
    legacyPanel.hidden = true;
    legacyPanel.textContent = "";
    return;
  }
  legacyPanel.hidden = false;
  legacyPanel.innerHTML = `
    <div class="modal-card">
      <p class="eyebrow">EXPLOSION CHECKPOINT</p>
      <h2>LOCK ${current.legacyPrompt.maxSelections} LEGACY</h2>
      <p>${
    countdownSentence(
      "hud.time.remaining",
      `<b class="legacy-timer" data-deadline-ms="${current.legacyPrompt.deadlineMs}"></b>`,
    )
  }</p>
      <p class="protocol-note">${escapeHtml(t("reset.legacy.protocolNote"))}</p>
      <div class="legacy-options">${
    current.legacyPrompt.options.map((item) => {
      const count = normalizeInventoryMetric(item.count) ?? 0;
      const durability = normalizeInventoryMetric(item.durability);
      return (
        `<button type="button" data-legacy-item="${escapeHtml(item.kind)}"><strong>${
          escapeHtml(item.kind)
        }</strong><span>count ${escapeHtml(count)}${
          durability === null ? "" : ` · durability ${escapeHtml(durability)}`
        }</span></button>`
      );
    }).join("")
  }</div>
    </div>
  `;
  legacyPanel.querySelectorAll("[data-legacy-item]").forEach((element) => {
    element.addEventListener("click", () => {
      if (!(element instanceof HTMLButtonElement) || element.dataset.legacyItem === undefined) {
        return;
      }
      sendAction({
        action: "legacy_select",
        items: [
          /** @type {import("@darkforest/protocol").ItemKind} */ (
            element.dataset.legacyItem
          ),
        ],
      });
      lastLegacySelection = itemDisplayName(
        /** @type {import("@darkforest/protocol").ItemKind} */ (element.dataset.legacyItem),
      );
    });
  });
  updateTimers();
}

/** @param {_PlayerView} current */
function renderReset(current) {
  const started = matchEvents.findLast((event) => event.kind === "reset_started");
  const startedReset = started?.kind === "reset_started" ? started : null;
  const completed = matchEvents.findLast((event) => event.kind === "reset_completed");
  const completedReset = completed?.kind === "reset_completed" ? completed : null;
  const resetTiming = projectResetCinematicTiming({
    phase: current.phase,
    gameNowMs: current.gameNowMs,
    ...(startedReset === null ? {} : { startedAtMs: startedReset.atMs }),
    completed: completedReset !== null,
  });
  const resetElapsedMs = resetTiming.elapsedMs;
  const showCinematic = resetTiming.show;
  // 六拍影片只蓋住轉場硬鎖窗(12 秒遊戲時間);之後到世界拓撲切換還有 48 秒遊戲時間,
  // 0.75 倍速下約 64 秒真實。先前這段會把整個 reset 面板收掉,玩家只剩一塊凍結的盤面、
  // 所有指令被判 WRONG_PHASE,又沒有任何進度或倒數——看起來就是當掉了。
  const showRebuilding = resetTiming.rebuilding === true;
  const showCompletedSummary = completedReset !== null && !resetSummaryDismissed;
  if (!showCinematic && !showRebuilding && !showCompletedSummary) {
    resetPanel.hidden = true;
    resetPanel.textContent = "";
    return;
  }
  const echoReturns = matchEvents.filter((event) => event.kind === "echo_returned");
  resetPanel.hidden = false;
  resetPanel.innerHTML = `
    <div class="reset-card ${showCompletedSummary ? "reset-card-complete" : ""}">
      ${
    showCinematic
      ? `<div class="reset-normal" style="--reset-elapsed:${-resetElapsedMs}ms" aria-label="${
        escapeHtml(t("reset.cinematic.aria"))
      }">
        <p class="eyebrow">CHECKPOINT · NOT A WIPE</p><h2>EXPLOSION RESET</h2>
        <ol>
          <li style="--reset-beat-at:0ms"><img src="/art/placeholders/reset.svg" alt="${
        escapeHtml(t("reset.beat.1.alt"))
      }"><span>01 · ${escapeHtml(t("reset.beat.1.alt"))}</span></li>
          <li style="--reset-beat-at:2200ms"><img src="/art/placeholders/reset.svg" alt="${
        escapeHtml(t("reset.beat.2.alt"))
      }"><span>02 · LOADOUT UNBOUND</span></li>
          <li style="--reset-beat-at:4400ms"><img src="/art/placeholders/reset.svg" alt="${
        escapeHtml(t("reset.beat.3.alt"))
      }"><span>03 · WHITE HEAT</span></li>
          <li style="--reset-beat-at:6000ms"><img src="/art/reset/reset-map-fracture.svg" alt="${
        escapeHtml(t("reset.beat.4.alt"))
      }"><span>04 · ROUTES FRACTURE</span></li>
          <li style="--reset-beat-at:8200ms"><img src="/art/placeholders/reset.svg" alt="${
        escapeHtml(t("reset.beat.5.alt"))
      }"><span>05 · FOREST REVEAL</span></li>
          <li style="--reset-beat-at:10800ms"><img src="/art/placeholders/reset.svg" alt="${
        escapeHtml(t("reset.beat.6.alt"))
      }"><span>06 · ECHO RETURN</span></li>
        </ol>
      </div>
      <div class="reset-reduced" role="status">
        <img src="/art/reset/reset-reduced-overlay.svg" alt=""><strong>RESET · REDUCED MOTION</strong><span>${
        escapeHtml(t("reset.reducedMotion.detail"))
      }</span>
      </div>`
      : showRebuilding
      ? `<div class="reset-complete-heading reset-rebuilding" role="status"><p class="eyebrow">CHECKPOINT · NOT A WIPE</p><h2>${
        escapeHtml(t("reset.rebuilding.title"))
      }</h2><p>${
        // 用 data-deadline-ms(MM:SS,遊戲時鐘)而非 data-deadline-seconds 的裸秒數:全遊戲的
        // 倒數都以遊戲時間計,0.75 倍速下 48 遊戲秒其實是 64 真實秒。標成「48 秒」會讓正在
        // 懷疑當機的玩家覺得倒數比手錶慢;MM:SS 與封鎖/冷卻同款,不承諾牆鐘秒數。
        countdownSentence(
          "reset.rebuilding.detail",
          `<em data-deadline-ms="${resetTiming.endsAtMs}">--:--</em>`,
        )}</p></div>`
      : `<div class="reset-complete-heading"><p class="eyebrow">DARKFOREST HAS TAKEN ROOT</p><h2>RESET COMPLETE</h2><p>${
        escapeHtml(t("reset.complete.detail"))
      }</p></div>`
  }
      <section class="reset-tactical-summary" aria-label="${escapeHtml(t("reset.summary.aria"))}">
        <div><span>${escapeHtml(t("reset.summary.legacy.label"))}</span><strong>${
    escapeHtml(
      lockedLegacyItem ??
        t(
          current.self.legacyPoints > 0
            ? "reset.summary.legacy.locked"
            : "reset.summary.legacy.none",
        ),
    )
  }</strong><small>${
    escapeHtml(t("reset.summary.legacy.note", { points: current.self.legacyPoints }))
  }</small></div>
        <div><span>${escapeHtml(t("reset.summary.collapsed.label"))}</span><strong>${
    completedReset === null || completedReset.collapsedEdges.length === 0
      ? escapeHtml(t("reset.summary.collapsed.pending"))
      : completedReset.collapsedEdges.map((edge) => escapeHtml(edge)).join(" · ")
  }</strong><small>${escapeHtml(t("reset.summary.collapsed.note"))}</small></div>
        <div><span>${escapeHtml(t("reset.summary.opened.label"))}</span><strong>${
    completedReset === null || completedReset.openedEdges.length === 0
      ? escapeHtml(t("reset.summary.opened.pending"))
      : completedReset.openedEdges.map((edge) => escapeHtml(edge)).join(" · ")
  }</strong><small>${escapeHtml(phaseLabel(current.phase))} topology</small></div>
        <div><span>${escapeHtml(t("reset.summary.echo.label"))}</span><strong>${
    echoReturns.length > 0
      ? echoReturns.map((event) => event.kind === "echo_returned" ? escapeHtml(event.player) : "")
        .join(" · ")
      : escapeHtml(
        completedReset === null
          ? t("reset.summary.echo.pending")
          : t("reset.summary.echo.none", { count: current.echoCount }),
      )
  }</strong><small>${escapeHtml(t("reset.summary.echo.note"))}</small></div>
      </section>
      ${
    showCompletedSummary
      ? '<button id="dismiss-reset-summary" class="primary-button reset-continue" type="button">ENTER DARKFOREST <span aria-hidden="true">→</span></button>'
      : ""
  }
    </div>
  `;
  document.getElementById("dismiss-reset-summary")?.addEventListener("click", () => {
    resetSummaryDismissed = true;
    renderReset(current);
  });
}

function renderReplay() {
  replayPanel.hidden = true;
  replayPanel.textContent = "";
}

async function loadReplay() {
  replayLog = null;
  renderReplay();
  try {
    const response = await fetch("/api/replay-sample", { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Replay API ${response.status}`);
    replayLog = /** @type {_ReplayLog} */ (await response.json());
    recordDebug(`ReplayLog ${replayLog.matchId}\n${JSON.stringify(replayLog, null, 2)}`);
  } catch (error) {
    recordDebug(error instanceof Error ? error.message : "Replay load failed");
  }
}

/**
 * 動作 click handler 返回前不拆掉剛被按下的節點；同一 frame 內多次要求只重繪一次。
 */
function scheduleMatchRender() {
  if (scheduledMatchRender !== 0) return;
  scheduledMatchRender = globalThis.requestAnimationFrame(() => {
    scheduledMatchRender = 0;
    renderMatch();
  });
}

function renderMatch() {
  if (scheduledMatchRender !== 0) {
    globalThis.cancelAnimationFrame(scheduledMatchRender);
    scheduledMatchRender = 0;
  }
  if (view === null) return;
  lobbyView.hidden = true;
  matchView.hidden = false;
  renderQueueDock();
  matchView.setAttribute(
    "aria-label",
    t(view.self.status === "echo" ? "hud.match.aria.echo" : "hud.match.aria", {
      fixture: activeFixture,
    }),
  );
  const spectator = view.self.status === "eliminated" && view.phase !== "ended";
  const terminal = view.phase === "ended";
  mobileCombatToggle.hidden = spectator || terminal;
  manualActionDrawer.hidden = spectator || terminal;
  if (assistDrawer !== null) assistDrawer.hidden = spectator || terminal;
  if (terminal) {
    manualActionDrawer.open = false;
    combatPanel.classList.remove("is-mobile-expanded");
    mobileCombatToggle.setAttribute("aria-expanded", "false");
  }
  // 敘事模式(預設玩法)下 .narrative-active .match-main 是 display:none,而 match-main
  // 裝著地圖面板與事件記錄。先前每次 render 仍會把兩者的 innerHTML 整段重建——包含最多
  // 200 筆的事件清單——只為了餵一棵看不見的子樹。旁觀者用的正是這一組面板,所以只在
  // 「敘事模式且非旁觀」時跳過。
  const narrativeOwnsScreen = playViewMode === "narrative" && !spectator;
  // focusedNodeId 的正規化原本住在 renderMap 裡,但它與畫面無關(戰術面板與鍵盤操作都讀
  // 它),因此提到外面,跳過繪製時仍然要跑。
  if (focusedNodeId === null || !view.nodes.some((node) => node.id === focusedNodeId)) {
    focusedNodeId = view.self.node;
  }
  renderTopbar(view);
  renderModeBanner(view);
  if (!narrativeOwnsScreen) renderMap(view, spectator);
  [playerPanel, assistPanel, commandPanel, combatPanel].forEach((panel) => {
    panel.hidden = spectator || terminal;
  });
  if (!spectator) {
    renderPlayer(view);
    renderAssist(view);
    renderCommands(view);
    renderCombat(view);
  }
  if (!narrativeOwnsScreen) renderMessages(view, spectator);
  if (spectator) {
    legacyPanel.hidden = true;
    resetPanel.hidden = true;
    replayPanel.hidden = true;
  } else {
    renderLegacy(view);
    renderReset(view);
    renderReplay();
  }
  renderNarrativeMode(view);
}

/** @param {_ClientMsg | _ArboraAskMsg} message */
function send(message) {
  const debugMessage = message.type === "arbora_ask"
    ? {
      type: message.type,
      requestId: message.requestId,
      locale: message.locale,
      text: "[private]",
    }
    : message;
  if (socket?.readyState !== WebSocket.OPEN) {
    recordDebug(`SEND BLOCKED ${JSON.stringify(debugMessage)} · WebSocket not open`);
    announce(t("narrative.client.connection_unavailable"));
    return false;
  }
  recordDebug(`SEND ${JSON.stringify(debugMessage)}`);
  socket.send(JSON.stringify(message));
  return true;
}

/** @param {_ServerMsg | _LobbyMsg | _SpectatorWaitingMsg | _ArboraServerMsg} message */
function handleQueueServerMessage(message) {
  if (message.type === "lobby") {
    queueMessage = message;
    queueMessageReceivedAtRealMs = performance.now();
    if (socket === queueSocket) renderLobbyMessage(message);
    else {
      renderQueueDock();
      if (view === null) renderQueueLobbyStatus();
    }
    return;
  }
  if (message.type !== "welcome" && message.type !== "snapshot") {
    recordDebug(`QUEUE ignored ${message.type}`);
    return;
  }
  if (queueSocket === null) return;

  // 原子交接：先讓主 renderer 指向候車線，再關只讀線；其 close handler 不會清空新局。
  const queued = queueSocket;
  const observer = socket !== queued ? socket : null;
  queueSocket = null;
  queueMessage = null;
  socket = queued;
  connectionIntent = "play";
  observer?.close(1000, "next shift handoff");
  renderQueueDock();
  handleServerMessage(message);
}

function leaveQueuedShift() {
  const queued = queueSocket;
  if (queued === null) return;
  const wasPrimary = socket === queued;
  queueSocket = null;
  queueMessage = null;
  queued.close(1000, "left next shift");
  renderQueueDock();
  if (wasPrimary) {
    socket = null;
    view = null;
    progressionProjection = null;
    resetLobbyPresentation();
    connectionSurface = "service";
    void refreshMatchServiceAvailability();
  } else if (view === null) {
    lobbyServerState.hidden = true;
    lobbySeatGrid.hidden = true;
  }
  announce(t("lobby.queue.leftSeat"));
}

function stopQueuedSpectating() {
  if (queueSocket === null || socket === null || socket === queueSocket) {
    disconnect();
    return;
  }
  const observer = socket;
  socket = queueSocket;
  connectionIntent = "play";
  view = null;
  progressionProjection = null;
  observer.close(1000, "stopped spectating");
  if (queueMessage !== null) renderLobbyMessage(queueMessage);
  renderQueueDock();
  announce(t("lobby.spectate.stopped"));
}

function startQueuedSpectating() {
  announce(t("lobby.spectate.unsupportedFixture"));
}

/** @param {_ServerMsg | _LobbyMsg | _SpectatorWaitingMsg | _ArboraServerMsg} message */
function handleServerMessage(message) {
  const debugMessage = message.type === "arbora_reply"
    ? {
      type: message.type,
      requestId: message.requestId,
      hintType: message.hintType,
      citedFactCount: message.citedFactIds.length,
      confidence: message.confidence,
      source: message.source,
      remainingQuestions: message.remainingQuestions,
    }
    : message.type === "arbora_reject"
    ? {
      type: message.type,
      requestId: message.requestId,
      reason: message.reason,
      remainingQuestions: message.remainingQuestions,
    }
    : message;
  recentMessages = [...recentMessages, debugMessage].slice(-8);
  recordDebug(`RECV ${JSON.stringify(debugMessage)}`);
  let shouldFullRender = true;
  let passiveStaminaTick = false;
  let staminaDecisionBoundaryChanged = false;
  if (message.type === "lobby") {
    renderLobbyMessage(message);
    announce(t("lobby.announce.matchStarting", { countdown: formatDuration(message.startsInMs) }));
    return;
  }
  if (message.type === "spectator_waiting") {
    renderSpectatorWaiting(message);
    announce(
      message.readyInMs === null
        ? t("lobby.spectate.waitingNext")
        : t("lobby.spectate.delayProtected", {
          seconds: Math.round(message.delayGameMs / 1_000),
        }),
    );
    return;
  }
  if (message.type === "arbora_status") {
    echoOracleState = applyArboraMessage(echoOracleState, message);
    if (view !== null) renderEchoOraclePanel(view);
    return;
  }
  if (message.type === "arbora_reply") {
    echoOracleState = applyArboraMessage(echoOracleState, message);
    appendNarrative([arboraReplyNarrativeEntry(message, estimatedGameNowMs(), t)]);
    if (view !== null) {
      renderEchoOraclePanel(view);
      renderNarrativeStory(view);
    }
    return;
  }
  if (message.type === "arbora_reject") {
    echoOracleState = applyArboraMessage(echoOracleState, message);
    appendNarrative([arboraRejectNarrativeEntry(message, estimatedGameNowMs(), t)]);
    if (view !== null) {
      renderEchoOraclePanel(view);
      renderNarrativeStory(view);
    }
    return;
  }
  if (message.type === "welcome" || message.type === "snapshot") {
    lobbyMessage = null;
    spectatorWarmupState = null;
    spectatorWarmup.hidden = true;
    const previousEncounterPrompt = view?.encounterPrompt;
    const previousEncounterId = previousEncounterPrompt?.encounterId;
    if (message.type === "snapshot") clearPendingCommandsAfterSnapshot(message.view.stateVersion);
    clearResyncPending();
    progressionProjection = createProgressionProjection(message.view);
    view = message.view;
    globalThis.clearTimeout(previewTimeoutTimer);
    lastPreview = null;
    lastPreviewContext = null;
    autoCombatPreview = false;
    dismissedCombatPreviewLease = null;
    tacticalArenaPreviewScheduledLease = null;
    tacticalArenaPreviewRetryEligibleLease = null;
    tacticalArenaPreviewRetriedLease = null;
    combatCooldownWakeDeadline = null;
    if (
      message.type === "snapshot" ||
      previousEncounterId !== message.view.encounterPrompt?.encounterId
    ) {
      clearEncounterOwnedTacticalSelection(previousEncounterPrompt);
      narrativeEncounterTargetRef = null;
      narrativeObservedEncounterId = null;
    }
    syncClock(message.view);
    if (message.type === "welcome") {
      matchEvents = [];
      narrativeEntries = [];
      echoOracleState = createEchoOracleState();
      echoOracleRenderedKey = "";
      narrativeStoryFollowing = true;
      narrativeStoryUnreadCount = 0;
      narrativeStoryRenderSignature = "";
      narrativeStoryDomSignature = "";
      narrativeCombatStoryDomSignature = "";
      narrativeCombatStoryFollowing = true;
      traitPopoverSurface = null;
      expandedNarrativeId = null;
      lastLegacySelection = null;
      lastPreview = null;
      lastPreviewContext = null;
      focusedNodeId = message.view.self.node;
      focusedTag = null;
      combatTargetRef = null;
      tacticalArenaTargetRef = null;
      tacticalArenaAimTargetRef = null;
      tacticalArenaSelfStatusSignature = "";
      narrativeActionAutoOpened = false;
      lastForcedNarrativeActionSignature = null;
      setNarrativeActionExpanded(false);
      combatWeaponKind = null;
      lastRenderedSpawnGrace = null;
      lastRenderedFinaleEntry = null;
      lastRenderedCooldownSignature = null;
      lastRenderedCachePrioritySignature = null;
      lastActionFeedback = null;
      creditsPulseUntilRealMs = 0;
      creditsPulseAmount = 0;
      shopTradeSide = "buy";
      supplyShopLineIndex = 0;
      supplyShopLineChangedAtRealMs = performance.now();
      shopAutoOpenedNode = null;
      rejectedActionToRefocus = null;
      pendingCommandActions.clear();
      pendingCommandMeta.clear();
      pendingDecisionCommandOrigins.clear();
      rejectedDecisionOrigin = null;
      clearResyncPending();
      recentHostileUntilMs.clear();
      lockedLegacyItem = null;
      narrativeLegacyDraft.clear();
      narrativeLegacyDeadline = -1;
      narrativeInsightDraft.clear();
      narrativeInsightDeadline = -1;
      resetSummaryDismissed = false;
      narrativeSituation = selectNarrativeSituation(null, message.view, []);
      narrativePendingDecision = null;
      narrativePendingDecisionOrigin = null;
      narrativeMovementChoice = null;
      narrativeEncounterTargetRef = null;
      narrativeObservedEncounterId = null;
      narrativeResetDecisionPending = false;
      narrativeRouteMenuOpen = false;
      narrativeCommanderActive = false;
      narrativeCommanderMenuOpen = false;
      narrativeAvoidNodes.clear();
      narrativeMarkedEdges.clear();
      narrativeFamiliarEdges.clear();
      narrativeUsedAdjectives.clear();
      narrativeCacheOffer = null;
      narrativeCacheDecisionOpen = false;
      narrativeCacheWanted = null;
      pendingCapacitySwap = null;
      pendingPickupNarratives.clear();
      armorBreakingSlot = null;
      armorBreakingPlayers.clear();
      globalThis.clearTimeout(armorBreakTimer);
      narrativeIdleFromGameMs = message.view.gameNowMs;
      const inOpeningWindow = message.view.phase === "megacity" &&
        message.view.gameNowMs <= 30_000;
      openingPerkCardVisible = connectionIntent === "play" && inOpeningWindow;
      const openingLine = inOpeningWindow
        ? openingLoadoutNarrative(message.view.self.inventory)
        : null;
      /** @type {_NarrativeEntry[]} */
      const openingEntries = [];
      if (openingLine !== null) {
        openingEntries.push({
          id: `welcome-loadout-${message.view.stateVersion}`,
          atGameMs: message.view.gameNowMs,
          level: "self",
          text: openingLine,
          fatal: false,
          source: "derived",
        });
      }
      if (inOpeningWindow) {
        openingEntries.push({
          id: `welcome-trait-${message.view.stateVersion}`,
          atGameMs: message.view.gameNowMs,
          level: "self",
          text: matchTraitPresentation(message.view.self.trait).narrative,
          fatal: false,
          source: "derived",
        });
      }
      narrativeEntries = openingEntries;
      if (!playViewInitialized) {
        playViewMode = loadPlayViewPreference();
        playViewInitialized = true;
      }
      if (activeFixture === "replaySample") void loadReplay();
    }
    const snapshotCaches = nodeCacheOffers(message.view);
    narrativeCacheOffer = snapshotCaches[0] ?? null;
    if (snapshotCaches.length === 0) {
      narrativeCacheDecisionOpen = false;
      narrativeCacheWanted = null;
    }
    announce(
      message.type === "welcome"
        ? connectionIntent === "spectator"
          ? t("spectate.announce.arrived")
          : t("hud.announce.entered")
        : t("hud.announce.snapshot"),
    );
  } else if (message.type === "diff") {
    if (view === null) return;
    const versionRelation = classifyDiffVersion(view.stateVersion, message.stateVersion);
    if (versionRelation === "stale") {
      recordDebug(
        `STALE DIFF ignored: current=${view.stateVersion} received=${message.stateVersion}`,
      );
      return;
    }
    if (versionRelation === "gap") {
      recordDebug(`DIFF GAP current=${view.stateVersion} received=${message.stateVersion}`);
      announce(t("hud.announce.resync"));
      return;
    }
    clearResyncPending();
    const previousView = view;
    const nextView = applyDiff(view, message);
    const previousForeground = gameplayForeground(previousView);
    const nextForeground = gameplayForeground(nextView);
    const previousForegroundOwner = `${previousForeground.kind}:${
      forcedNarrativeActionSignature(previousView) ?? ""
    }`;
    const nextForegroundOwner = `${nextForeground.kind}:${
      forcedNarrativeActionSignature(nextView) ?? ""
    }`;
    if (
      (nextForeground.kind === "terminal" || nextForeground.kind === "forced") &&
      nextForegroundOwner !== previousForegroundOwner
    ) {
      clearLowerPriorityInteractionState();
    }
    passiveStaminaTick = message.events.length === 0 &&
      isPassiveStaminaChange(previousView.self, nextView.self);
    if (passiveStaminaTick) {
      const before = survivalReadout(previousView);
      const after = survivalReadout(nextView);
      staminaDecisionBoundaryChanged = before.canRush !== after.canRush ||
        (before.stamina >= before.max) !== (after.stamina >= after.max);
    }
    const pendingBeforeSettle = pendingCommandActions.size;
    settleAcceptedCommands(nextView.stateVersion);
    shouldFullRender = (!passiveStaminaTick && diffRequiresFullRender(message)) ||
      pendingCommandActions.size !== pendingBeforeSettle;
    if (previousView.encounterPrompt?.encounterId !== nextView.encounterPrompt?.encounterId) {
      clearEncounterOwnedTacticalSelection(previousView.encounterPrompt);
      narrativeEncounterTargetRef = null;
      narrativeObservedEncounterId = null;
      if (nextView.encounterPrompt !== undefined && controlMode !== "semi") {
        narrativeCommanderMenuOpen = false;
      }
    }
    if (narrativePendingDecision !== null) {
      const pendingAction = narrativePendingDecision.payload.action;
      const pendingShopAction = pendingAction === "shop_buy" || pendingAction === "shop_sell";
      const nextNode = nextView.nodes.find((node) => node.id === nextView.self.node);
      if (
        nextView.phase === "ended" || pendingShopAction && nextNode?.shop === undefined ||
        !pendingDecisionStillValid(nextView, narrativePendingDecision)
      ) {
        narrativePendingDecision = null;
        narrativePendingDecisionOrigin = null;
        narrativeResetDecisionPending = false;
        appendNarrativeModeLine(rejectionNarrativeLine("STALE_VERSION"));
      }
    }
    if (
      lastPreviewContext !== null &&
      shouldInvalidatePreviewForVersion(
        autoCombatPreview,
        nextView,
        lastPreviewContext,
      )
    ) {
      updatePreviewLog(lastPreviewContext.requestId, {
        status: "rejected",
        label: t("action.status.reselecting"),
        text: rejectionNarrativeLine("STALE_VERSION"),
      });
      globalThis.clearTimeout(previewTimeoutTimer);
      lastPreview = null;
      lastPreviewContext = null;
      autoCombatPreview = false;
    } else if (lastPreviewContext !== null) {
      // A manual Preview is an interaction lock: heartbeat and unrelated world diffs must not
      // pull the Confirm button out from under the player. The eventual action still uses the
      // latest view state and the server remains authoritative; target movement is checked below.
      lastPreviewContext.requestedStateVersion = nextView.stateVersion;
    }
    for (const event of message.events) {
      if (event.kind !== "combat" || event.target !== nextView.self.playerId) continue;
      const visibleAttacker = nextView.visiblePlayers.find((player) =>
        player.ref === event.attacker || player.contactRef === event.attacker
      );
      recentHostileUntilMs.set(
        visibleAttacker?.ref ?? event.attacker,
        message.gameNowMs + 30_000,
      );
    }
    narrativeSituation = selectNarrativeSituation(
      previousView,
      nextView,
      message.events,
      activeRecentHostileRefs(nextView),
    );
    familiarEdgesFromDiff(previousView, nextView, message.events).forEach((edgeId) =>
      narrativeFamiliarEdges.add(edgeId)
    );
    const cacheStateChanged = previousView.self.node !== nextView.self.node ||
      message.nodes?.some((node) => node.id === nextView.self.node) === true;
    if (cacheStateChanged) {
      const caches = nodeCacheOffers(nextView);
      narrativeCacheOffer = caches[0] ?? null;
      if (caches.length === 0) {
        narrativeCacheDecisionOpen = false;
        narrativeCacheWanted = null;
      }
    }
    const cacheEvent = message.events.findLast((event) =>
      event.kind === "cache_dropped" && event.node === nextView.self.node
    );
    if (cacheEvent?.kind === "cache_dropped") {
      narrativeCacheOffer = cacheEvent;
      const overloadSearch = message.events.some((event) =>
        event.kind === "search_result" && event.player === nextView.self.playerId &&
        event.found !== null && cacheEvent.items.some((item) => item.kind === event.found?.kind)
      );
      if (overloadSearch) {
        const found = message.events.findLast((event) =>
          event.kind === "search_result" && event.player === nextView.self.playerId &&
          event.found !== null && cacheEvent.items.some((item) => item.kind === event.found?.kind)
        );
        narrativeCacheWanted = found?.kind === "search_result" ? found.found?.kind ?? null : null;
        narrativeCacheDecisionOpen = true;
      }
    }
    if (message.events.length > 0 || previousView.self.node !== nextView.self.node) {
      narrativeIdleFromGameMs = message.gameNowMs;
    }
    assistBusyStateVersion = null;
    stageRecognitionTransitions(previousView, nextView);
    stageCombatVisualEffects(message.events);
    stageArmorBreakEffects(message.events, nextView);
    if (previousView.self.signal < 60 && nextView.self.signal >= 60) {
      signalPulseUntilRealMs = performance.now() + 2_400;
    }
    if (nextView.self.credits > previousView.self.credits) {
      creditsPulseAmount = nextView.self.credits - previousView.self.credits;
      creditsPulseUntilRealMs = performance.now() + 1_800;
    }
    if (
      message.events.some((event) =>
        event.kind === "level_up" && event.player === nextView.self.playerId
      )
    ) {
      levelPulseUntilRealMs = performance.now() + 1_600;
    }
    if (
      previousView.self.node !== nextView.self.node &&
      focusedNodeId === previousView.self.node
    ) {
      focusedNodeId = nextView.self.node;
    }
    const eventNarrative = eventsToNarrative(message.events, {
      view: nextView,
      atGameMs: message.gameNowMs,
      idPrefix: `v${message.stateVersion}-event`,
      previousNode: previousView.self.node,
      previousFinaleParticipants: previousView.finale?.participants,
      ...(lastLegacySelection === null ? {} : { legacyItem: lastLegacySelection }),
    });
    const derivedNarrative = deriveNarrative(
      previousView,
      nextView,
      message.events,
      `v${message.stateVersion}-derived`,
    );
    appendNarrative([...eventNarrative, ...derivedNarrative]);
    if (nextView.self.status !== "eliminated") {
      const quoteNotice = playerQuoteNoticeFromEvents(message.events, nextView.self.playerId);
      if (quoteNotice !== null) triggerPlayerQuoteNotice(quoteNotice);
    }
    if (
      message.events.some((event) =>
        event.kind === "legacy_locked" && event.player === nextView.self.playerId
      )
    ) {
      lockedLegacyItem = lastLegacySelection;
      lastLegacySelection = null;
    }
    if (
      message.events.some((event) =>
        event.kind === "reset_started" || event.kind === "reset_completed"
      )
    ) {
      resetSummaryDismissed = false;
      recentHostileUntilMs.clear();
    }
    if (message.events.some((event) => event.kind === "reset_completed")) {
      narrativeResetDecisionPending = true;
      narrativeCommanderActive = false;
      narrativeCommanderMenuOpen = false;
    }
    view = nextView;
    stageTacticalArenaFeedback(
      message.events,
      previousView.self.node !== nextView.self.node,
      nextView.stateVersion,
    );
    if (
      pendingCapacitySwap !== null &&
      message.events.some((event) =>
        event.kind === "item_dropped" && event.player === nextView.self.playerId &&
        event.item === pendingCapacitySwap?.droppedItem
      )
    ) {
      const swap = pendingCapacitySwap;
      pendingCapacitySwap = null;
      const commandId = sendAction({ action: "pickup", cacheId: swap.cacheId, item: swap.item });
      if (commandId !== null) pendingPickupNarratives.set(commandId, swap.item);
    }
    const majorStateChange = previousView.phase !== nextView.phase ||
      previousView.self.status !== nextView.self.status ||
      (previousView.legacyPrompt === undefined && nextView.legacyPrompt !== undefined) ||
      (previousView.insightPrompt === undefined && nextView.insightPrompt !== undefined) ||
      (previousView.finale === undefined && nextView.finale !== undefined) ||
      message.events.some((event) =>
        event.kind === "reset_started" || event.kind === "reset_completed"
      );
    if (controlMode === "semi" && majorStateChange) {
      const resetChange = message.events.some((event) =>
        event.kind === "reset_started" || event.kind === "reset_completed"
      );
      if (narrativeCommanderActive && !resetChange) {
        assistCountdown = null;
        assistPausedReason = { key: "semi.paused.commanderHeld" };
      } else {
        pauseSemi({ key: "semi.paused.majorChange" });
      }
    }
    if (
      lastPreviewContext !== null &&
      !view.visiblePlayers.some((player) =>
        player.ref === lastPreviewContext?.target && player.node === lastPreviewContext.node
      )
    ) {
      updatePreviewLog(lastPreviewContext.requestId, {
        status: "rejected",
        label: t("action.status.target_left"),
        text: rejectionNarrativeLine("INVALID_TARGET"),
      });
      globalThis.clearTimeout(previewTimeoutTimer);
      lastPreview = null;
      lastPreviewContext = null;
    }
    syncClock(view);
    matchEvents = [...matchEvents, ...message.events].slice(-24);
  } else if (message.type === "ack") {
    const wasAssistCommand = assistCommandIds.has(message.commandId);
    const pendingPayload = pendingCommandActions.get(message.commandId);
    const pendingMeta = pendingCommandMeta.get(message.commandId);
    const commandDecisionOrigin = pendingDecisionCommandOrigins.get(message.commandId) ?? null;
    const action = pendingPayload?.action;
    const pickupItem = pendingPickupNarratives.get(message.commandId);
    pendingPickupNarratives.delete(message.commandId);
    const movement = pendingMovementNarratives.get(message.commandId);
    if (movement !== undefined) {
      if (message.accepted) {
        movement.accepted = true;
        tacticalArenaMovementStyle = movement.style;
        syncCharacterTravelMotion(tacticalArenaTokens, movement.style);
        tacticalArenaRenderer?.playFeedback({
          kind: "move",
          ...(view === null ? {} : { sourceRef: view.self.playerId }),
          style: movement.style,
          step: "depart",
        });
        appendNarrative([{
          id: `move-start-${message.commandId}`,
          atGameMs: movement.startedAtGameMs,
          level: "self",
          text: t(
            movement.style === "rush"
              ? "narrative.client.movement_rush"
              : "narrative.client.movement_sneak",
            { destination: movement.destinationName },
          ),
          fatal: false,
          source: "derived",
        }]);
        narrativeIdleFromGameMs = movement.startedAtGameMs;
        globalThis.setTimeout(
          updateTimers,
          Math.max(0, movement.revealAtRealMs - performance.now()),
        );
      } else {
        tacticalArenaMovementStyle = null;
        syncCharacterTravelMotion(tacticalArenaTokens, null);
        pendingMovementNarratives.delete(message.commandId);
      }
    }
    if (action === undefined && !message.accepted) {
      // 交握失敗(AUTH_FAILED / PROTOCOL_MISMATCH)帶的是 commandId "",對不到任何 pending
      // 指令,於是整段 action 分支被跳過:lastActionFeedback 仍留著上一個動作的拒絕理由,
      // 玩家看到的是一句與此事無關的舊訊息。這兩種失敗恰恰最需要看得懂的說明。
      const handshakeKey = message.errorCode === "AUTH_FAILED"
        ? "lobby.connection.authFailed"
        : message.errorCode === "PROTOCOL_MISMATCH"
        ? "lobby.connection.protocolMismatch"
        : null;
      if (handshakeKey !== null) {
        lastActionFeedback = null;
        recordDebug(`HANDSHAKE REJECTED ${message.errorCode}`);
        announce(t(handshakeKey));
        setConnection("error", handshakeKey);
      }
    }
    if (action !== undefined) {
      lastActionFeedback = {
        action,
        accepted: message.accepted,
        ...(message.errorCode === undefined ? {} : { errorCode: message.errorCode }),
        ...(message.retryAtMs === undefined ? {} : { retryAtMs: message.retryAtMs }),
        ...(
          pendingPayload?.action === "unequip" && pendingPayload.slot === "shoes" ||
            pendingPayload?.action === "equip" &&
              (pendingPayload.item === "soft_sole" || pendingPayload.item === "steel_toe")
            ? { shoeSlot: true }
            : {}
        ),
      };
      rejectedActionToRefocus = message.accepted || commandDecisionOrigin !== null ? null : action;
      if (message.accepted) {
        pendingDecisionCommandOrigins.delete(message.commandId);
        if (pendingMeta !== undefined) pendingMeta.accepted = true;
        updateActionLog(message.commandId, {
          status: "ready",
          label: t("action.status.accepted"),
        });
        if (
          pendingMeta !== undefined && view !== null &&
          view.stateVersion > pendingMeta.expectedStateVersion
        ) {
          settleAcceptedCommands(view.stateVersion);
        }
      } else {
        rejectedDecisionOrigin = commandDecisionOrigin;
        const reason = rejectionNotice(lastActionFeedback);
        const attemptedAction = view === null || pendingPayload === undefined
          ? t("hud.log.meta.action")
          : actionLogText(view, pendingPayload);
        updateActionLog(message.commandId, {
          status: "rejected",
          label: t("action.status.rejected"),
          text: rejectedActionReceiptLine(attemptedAction, reason),
        });
        clearPendingCommand(message.commandId);
      }
    }
    if (pickupItem !== undefined && message.accepted) {
      tacticalArenaRenderer?.playFeedback({
        kind: "pickup",
        ...(view === null ? {} : { sourceRef: view.self.playerId }),
        variant: "pickup",
      });
      appendNarrativeModeLine(t("narrative.client.pickup", {
        item: itemDisplayName(pickupItem),
      }));
      if (view === null || nodeCacheOffers(view).length === 0) narrativeCacheOffer = null;
      narrativeCacheDecisionOpen = false;
      narrativeCacheWanted = null;
    }
    if (pendingPayload?.action === "use_item" && message.accepted) {
      const line = itemUseNarrativeLine(pendingPayload.item);
      if (line !== null) appendNarrativeModeLine(line);
    }
    if (
      pendingCapacitySwap?.dropCommandId === message.commandId && !message.accepted
    ) pendingCapacitySwap = null;
    if (!message.accepted && message.errorCode === "NO_CACHE") {
      narrativeCacheOffer = null;
      narrativeCacheDecisionOpen = false;
      narrativeCacheWanted = null;
      pendingCapacitySwap = null;
    }
    if (
      !message.accepted && message.errorCode === "CAPACITY_FULL" && view !== null &&
      visibleCacheOffers(view).length > 0
    ) {
      narrativeCacheOffer = visibleCacheOffers(view)[0] ?? narrativeCacheOffer;
      narrativeCacheDecisionOpen = true;
    }
    if (wasAssistCommand) {
      if (message.accepted) {
        assistPausedReason = { key: "semi.paused.settled" };
      } else {
        pauseSemi({ rejection: lastActionFeedback ?? {} });
      }
    }
    if (!message.accepted) announce(rejectionNotice(lastActionFeedback ?? {}));
  } else if (message.type === "pong") {
    recordDebug(`PONG t=${message.t}`);
    return;
  } else if (message.type === "preview_result") {
    if (
      lastPreviewContext === null || lastPreviewContext.requestId !== message.requestId
    ) {
      recordDebug(`STALE PREVIEW RESULT ignored · ${message.requestId}`);
      return;
    }
    globalThis.clearTimeout(previewTimeoutTimer);
    lastPreview = message;
    tacticalArenaPreviewRetryEligibleLease = null;
    updatePreviewLog(message.requestId, {
      status: "ready",
      label: message.allowed
        ? t("action.status.preview_ready")
        : t("action.status.preview_blocked"),
    });
    announce(t("hud.announce.previewReady"));
  }
  if (shouldFullRender) renderMatch();
  else {
    if (view !== null && passiveStaminaTick) {
      patchSurvivalReadouts(view);
      patchFoodRecoveryButtons(view);
      if (staminaDecisionBoundaryChanged) {
        renderTacticalReadout(view);
        renderNarrativeDecisionCard(view);
        renderNarrativeOptions(view);
      }
    }
    updateTimers();
  }
  if (message.type === "welcome") {
    queueMicrotask(() => {
      document.scrollingElement?.scrollTo({ top: 0, left: 0, behavior: "auto" });
      matchView.scrollIntoView({ block: "start" });
      (narrativeActionExpanded ? narrativeModeHeading : narrativeActionToggle).focus({
        preventScroll: true,
      });
    });
  }
  if (rejectedDecisionOrigin !== null && view !== null) {
    const origin = rejectedDecisionOrigin;
    rejectedDecisionOrigin = null;
    if (origin.reopenActionDrawer) openTacticalActionDrawer(view, origin.selector);
  }
  if (rejectedActionToRefocus !== null) {
    const action = rejectedActionToRefocus;
    rejectedActionToRefocus = null;
    queueMicrotask(() => {
      const fieldOwnsAction = view !== null && tacticalArenaFieldOwnsContacts(view);
      const selector = action === "attack"
        ? fieldOwnsAction ? "[data-arena-target-fire]" : "#attack-button"
        : action === "move" || action === "echo_move"
        ? "#confirm-move-button"
        : action === "encounter_continue"
        ? fieldOwnsAction ? "[data-arena-continue]" : '[data-encounter-action="continue"]'
        : `[data-action="${action}"]`;
      const target = document.querySelector(selector);
      if (target instanceof HTMLButtonElement) target.focus();
    });
  }
}

function disconnect() {
  connectionStarting = false;
  connectionSurface = "service";
  const primarySocket = socket;
  const queued = queueSocket;
  socket = null;
  queueSocket = null;
  queueMessage = null;
  primarySocket?.close(1000, "user disconnected");
  if (queued !== null && queued !== primarySocket) queued.close(1000, "user disconnected");
  connectionIntent = "play";
  connectedProfile = null;
  view = null;
  progressionProjection = null;
  echoJitOpen = false;
  echoJitMatchId = null;
  recentMessages = [];
  matchEvents = [];
  narrativeEntries = [];
  echoOracleState = createEchoOracleState();
  echoOracleRenderedKey = "";
  echoOraclePanel.hidden = true;
  echoOraclePanel.textContent = "";
  narrativeStoryFollowing = true;
  narrativeStoryUnreadCount = 0;
  narrativeStoryRenderSignature = "";
  narrativeStoryDomSignature = "";
  narrativeCombatStoryDomSignature = "";
  narrativeCombatStoryFollowing = true;
  openingPerkCardVisible = false;
  traitPopoverSurface = null;
  expandedNarrativeId = null;
  lastLegacySelection = null;
  globalThis.clearTimeout(fatalBannerTimer);
  fatalNarrativeBanner.hidden = true;
  fatalNarrativeBanner.textContent = "";
  globalThis.clearTimeout(playerQuoteNoticeTimer);
  playerQuoteNotice.hidden = true;
  playerQuoteNotice.textContent = "";
  delete playerQuoteNotice.dataset.kind;
  lastPreview = null;
  lastPreviewContext = null;
  autoCombatPreview = false;
  dismissedCombatPreviewLease = null;
  tacticalArenaPreviewScheduledLease = null;
  tacticalArenaPreviewRetryEligibleLease = null;
  tacticalArenaPreviewRetriedLease = null;
  combatCooldownWakeDeadline = null;
  globalThis.clearTimeout(previewTimeoutTimer);
  focusedNodeId = null;
  focusedTag = null;
  combatTargetRef = null;
  tacticalArenaTargetRef = null;
  tacticalArenaAimTargetRef = null;
  tacticalArenaSelfStatusSignature = "";
  combatWeaponKind = null;
  lastRenderedSpawnGrace = null;
  lastRenderedFinaleEntry = null;
  lastRenderedCooldownSignature = null;
  lastRenderedCachePrioritySignature = null;
  lastActionFeedback = null;
  rejectedActionToRefocus = null;
  pendingCommandActions.clear();
  pendingCommandMeta.clear();
  clearResyncPending();
  assistCommandIds.clear();
  recentHostileUntilMs.clear();
  assistCountdown = null;
  assistBusyStateVersion = null;
  controlMode = "assist";
  assistPausedReason = { key: "semi.paused.disconnected" };
  combatVisualEffects = [];
  globalThis.clearTimeout(combatVisualTimer);
  logFocusedNodeId = null;
  logFocusedPlayerRef = null;
  recognitionTransitions = [];
  globalThis.clearTimeout(recognitionTransitionTimer);
  lockedLegacyItem = null;
  narrativeLegacyDraft.clear();
  narrativeLegacyDeadline = -1;
  narrativeInsightDraft.clear();
  narrativeInsightDeadline = -1;
  resetSummaryDismissed = false;
  narrativeSituation = { kind: "none" };
  narrativePendingDecision = null;
  narrativePendingDecisionOrigin = null;
  pendingDecisionCommandOrigins.clear();
  rejectedDecisionOrigin = null;
  narrativeMovementChoice = null;
  narrativeEncounterTargetRef = null;
  narrativeObservedEncounterId = null;
  narrativeResetDecisionPending = false;
  narrativeRouteMenuOpen = false;
  narrativeCommanderActive = false;
  narrativeCommanderMenuOpen = false;
  narrativeAvoidNodes.clear();
  narrativeMarkedEdges.clear();
  narrativeFamiliarEdges.clear();
  narrativeUsedAdjectives.clear();
  pendingMovementNarratives.clear();
  tacticalArenaMovementStyle = null;
  cooldownVisualStartByDeadline.clear();
  narrativeCacheOffer = null;
  narrativeCacheDecisionOpen = false;
  narrativeCacheWanted = null;
  pendingCapacitySwap = null;
  pendingPickupNarratives.clear();
  armorBreakingSlot = null;
  armorBreakingPlayers.clear();
  globalThis.clearTimeout(armorBreakTimer);
  closeTacticalSideDetail();
  resetTacticalArenaRenderer();
  tacticalArenaSurface = "field";
  narrativeActionAutoOpened = false;
  lastForcedNarrativeActionSignature = null;
  setNarrativeActionExpanded(false);
  replayLog = null;
  matchView.hidden = true;
  lobbyView.hidden = false;
  resetLobbyPresentation();
  renderQueueDock();
  void refreshMatchServiceAvailability();
  announce(t("lobby.announce.returned"));
}

modeSelect.addEventListener("change", () => {
  modeSelect.value = "mock";
  fixtureInput.disabled = false;
  wsUrlInput.value = runtimeFixtureSocketUrl;
});

bindProfileFormListeners();
promoVideoOpen.addEventListener("click", () => {
  musicResumeAfterPromo = ambientMusic.isPlaying();
  if (musicResumeAfterPromo) ambientMusic.pause();
  mountPromoVideo();
  if (!promoVideoDialog.open) promoVideoDialog.showModal();
});
promoVideoClose.addEventListener("click", () => promoVideoDialog.close());
promoVideoDialog.addEventListener("close", () => {
  unmountPromoVideo();
  if (musicResumeAfterPromo && accessibilitySettings.musicEnabled) {
    musicResumeAfterPromo = false;
    void startAmbientMusic(false);
  }
  promoVideoOpen.focus();
});

lobbyLeaveButton.addEventListener("click", () => {
  if (queueSocket !== null) leaveQueuedShift();
  else disconnect();
});
spectatorCancelButton.addEventListener("click", () => {
  if (queueSocket !== null) stopQueuedSpectating();
  else disconnect();
});
nextShiftWatchButton.addEventListener("click", startQueuedSpectating);
nextShiftStopWatchButton.addEventListener("click", stopQueuedSpectating);
nextShiftLeaveButton.addEventListener("click", leaveQueuedShift);

joinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void beginLobbyConnection("play");
});

joinLiveButton.addEventListener("click", () => {
  void beginLobbyConnection("play");
});

spectateButton.addEventListener("click", () => {
  void beginLobbyConnection("spectator");
});

/** @param {"play" | "spectator"} intent */
function beginLobbyConnection(intent) {
  if (intent === "spectator") {
    announce(t("lobby.spectate.unsupportedFixture"));
    return;
  }
  if (connectionStarting) return;
  connectionStarting = true;
  connectionSurface = "session";
  connectionIntent = "play";
  modeSelect.value = "mock";
  wsUrlInput.value = runtimeFixtureSocketUrl;
  fixtureInput.disabled = false;
  setJoinControlsLocked(true, "connecting");
  connectedProfile = null;
  socket?.close(1000, "new connection requested");
  if (queueSocket !== null && queueSocket !== socket) {
    queueSocket.close(1000, "new connection requested");
  }
  queueSocket = null;
  queueMessage = null;
  view = null;
  progressionProjection = null;
  recentMessages = [];
  matchEvents = [];
  narrativeEntries = [];
  echoOracleState = createEchoOracleState();
  echoOracleRenderedKey = "";
  echoOraclePanel.hidden = true;
  echoOraclePanel.textContent = "";
  narrativeStoryFollowing = true;
  narrativeStoryUnreadCount = 0;
  narrativeStoryRenderSignature = "";
  narrativeStoryDomSignature = "";
  narrativeCombatStoryDomSignature = "";
  narrativeCombatStoryFollowing = true;
  lastPreview = null;
  lastPreviewContext = null;
  autoCombatPreview = false;
  dismissedCombatPreviewLease = null;
  tacticalArenaPreviewScheduledLease = null;
  tacticalArenaPreviewRetryEligibleLease = null;
  tacticalArenaPreviewRetriedLease = null;
  combatCooldownWakeDeadline = null;
  globalThis.clearTimeout(previewTimeoutTimer);
  focusedNodeId = null;
  focusedTag = null;
  combatTargetRef = null;
  tacticalArenaTargetRef = null;
  tacticalArenaAimTargetRef = null;
  tacticalArenaSelfStatusSignature = "";
  combatWeaponKind = null;
  lastRenderedSpawnGrace = null;
  lastRenderedFinaleEntry = null;
  lastRenderedCooldownSignature = null;
  lastRenderedCachePrioritySignature = null;
  lastActionFeedback = null;
  rejectedActionToRefocus = null;
  pendingCommandActions.clear();
  pendingCommandMeta.clear();
  clearResyncPending();
  pendingPickupNarratives.clear();
  assistCommandIds.clear();
  assistCountdown = null;
  assistBusyStateVersion = null;
  controlMode = "assist";
  assistPausedReason = { key: "semi.paused.newMatch" };
  combatVisualEffects = [];
  globalThis.clearTimeout(combatVisualTimer);
  logFocusedNodeId = null;
  logFocusedPlayerRef = null;
  recognitionTransitions = [];
  globalThis.clearTimeout(recognitionTransitionTimer);
  lockedLegacyItem = null;
  narrativeLegacyDraft.clear();
  narrativeLegacyDeadline = -1;
  narrativeInsightDraft.clear();
  narrativeInsightDeadline = -1;
  resetSummaryDismissed = false;
  narrativeSituation = { kind: "none" };
  narrativeEncounterTargetRef = null;
  narrativeObservedEncounterId = null;
  narrativeCacheOffer = null;
  narrativeCacheDecisionOpen = false;
  narrativeCacheWanted = null;
  pendingCapacitySwap = null;
  narrativePendingDecision = null;
  narrativePendingDecisionOrigin = null;
  pendingDecisionCommandOrigins.clear();
  rejectedDecisionOrigin = null;
  narrativeMovementChoice = null;
  narrativeResetDecisionPending = false;
  narrativeRouteMenuOpen = false;
  narrativeCommanderActive = false;
  narrativeCommanderMenuOpen = false;
  narrativeAvoidNodes.clear();
  narrativeMarkedEdges.clear();
  narrativeFamiliarEdges.clear();
  narrativeUsedAdjectives.clear();
  pendingMovementNarratives.clear();
  tacticalArenaMovementStyle = null;
  cooldownVisualStartByDeadline.clear();
  armorBreakingSlot = null;
  armorBreakingPlayers.clear();
  globalThis.clearTimeout(armorBreakTimer);
  lobbyMessage = null;
  setJoinControlsLocked(true, "connecting");
  setConnection("connecting", "lobby.connection.joining");
  announce(t("lobby.announce.opening"));

  activeFixture = fixtureInput.value.trim();
  let url;
  try {
    url = buildFixtureSocketUrl(wsUrlInput.value, fixtureInput.value);
  } catch (error) {
    setConnection("error", "lobby.connection.error");
    recordDebug(error instanceof Error ? error.message : "WebSocket URL invalid");
    announce(t("lobby.announce.badUrl"));
    connectionStarting = false;
    setJoinControlsLocked(false, "idle");
    return;
  }

  let nextSocket;
  try {
    nextSocket = new WebSocket(url);
  } catch {
    connectionStarting = false;
    setConnection("error", "lobby.connection.error");
    setJoinControlsLocked(false, "idle");
    announce(t("lobby.announce.noResponse"));
    return;
  }
  connectionStarting = false;
  socket = nextSocket;
  nextSocket.addEventListener("open", () => {
    setConnection("connected", "lobby.connection.connected");
    recordDebug(`Fixture connected · awaiting ${fixtureInput.value} welcome`);
    announce(t("lobby.announce.mockPending"));
  });
  nextSocket.addEventListener("message", (messageEvent) => {
    const parsed = parseServerMessage(messageEvent.data);
    if (parsed === null) {
      recordDebug("Invalid public-demo protocol message ignored");
      announce(t("lobby.announce.unknownMessage"));
      return;
    }
    const incoming = /** @type {
      _ServerMsg | _LobbyMsg | _SpectatorWaitingMsg | _ArboraServerMsg
    } */
      (parsed);
    if (nextSocket === queueSocket) handleQueueServerMessage(incoming);
    else handleServerMessage(incoming);
  });
  nextSocket.addEventListener("close", (closeEvent) => {
    if (nextSocket === queueSocket) {
      // 走到這裡一定是非預期的斷線:主動離開(leaveQueuedShift)與交接都會先把 queueSocket
      // 設為 null 才關閉,不會落入這個分支。先前這裡只是讓候車艙悄悄消失——玩家正把注意力
      // 放在觀戰畫面上,會一直以為自己還保有下一班的座位。
      queueSocket = null;
      queueMessage = null;
      renderQueueDock();
      recordDebug(`QUEUE SEAT LOST code=${closeEvent.code}`);
      announce(t("lobby.queueDock.lost"));
      if (socket !== nextSocket && view === null) {
        lobbyMessage = null;
        lobbyServerState.hidden = true;
        lobbySeatGrid.hidden = true;
      }
    }
    if (socket !== nextSocket) return;
    socket = null;
    if (view !== null) {
      clearPendingCommandsAfterSnapshot(view.stateVersion);
      globalThis.clearTimeout(previewTimeoutTimer);
      if (lastPreviewContext !== null) {
        updatePreviewLog(lastPreviewContext.requestId, {
          status: "rejected",
          label: t("action.status.reselecting"),
          text: t("narrative.client.connection_closed"),
        });
        lastPreview = null;
        lastPreviewContext = null;
      }
      renderMatch();
    }
    clearResyncPending();
    setConnection("disconnected", "lobby.connection.disconnected");
    if (view === null) resetLobbyPresentation();
    recordDebug(`WebSocket closed · ${closeEvent.code} ${closeEvent.reason}`.trim());
    announce(t("narrative.client.connection_closed"));
  });
  nextSocket.addEventListener("error", () => {
    if (nextSocket === queueSocket && socket !== nextSocket) {
      recordDebug("Queued seat connection error; spectator connection remains active");
      announce(t("lobby.queue.signalLost"));
      return;
    }
    setConnection("error", "lobby.connection.error");
    if (view === null) resetLobbyPresentation();
    recordDebug("WebSocket connection error; verify server is running");
    announce(t("lobby.announce.noResponse"));
  });
}

const defaultAccessibilitySettings = {
  textScale: "100",
  reducedMotion: globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  lowViolence: false,
  particlesOff: false,
  highContrast: false,
  musicEnabled: false,
};
const systemReducedMotionQuery = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)") ??
  null;

function loadAccessibilitySettings() {
  try {
    const stored = localStorage.getItem("darkforest-accessibility-v1");
    if (stored === null) return { ...defaultAccessibilitySettings };
    const parsed = JSON.parse(stored);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ...defaultAccessibilitySettings };
    }
    return {
      ...defaultAccessibilitySettings,
      ...parsed,
      musicEnabled: parsed.musicEnabled === true,
    };
  } catch {
    return { ...defaultAccessibilitySettings };
  }
}

const accessibilitySettings = loadAccessibilitySettings();
let musicUnavailable = false;
let musicUnlockArmed = false;
let musicResumeAfterVisibility = false;
let musicResumeAfterPromo = false;

function saveAccessibilitySettings() {
  try {
    localStorage.setItem("darkforest-accessibility-v1", JSON.stringify(accessibilitySettings));
  } catch {
    // Private browsing can reject storage; presentation still works for this session.
  }
}

function renderFooterControls() {
  const motionLabel = t(
    accessibilitySettings.reducedMotion ? "accessibility.motionOn" : "accessibility.motionOff",
  );
  motionToggleLabel.textContent = motionLabel;
  motionToggle.setAttribute("aria-label", motionLabel);
  motionToggle.title = motionLabel;
  const musicLabel = t(
    musicUnavailable
      ? "accessibility.musicUnavailable"
      : accessibilitySettings.musicEnabled
      ? "accessibility.musicOn"
      : "accessibility.musicOff",
  );
  musicToggleLabel.textContent = musicLabel;
  musicToggle.setAttribute("aria-label", musicLabel);
  musicToggle.title = musicLabel;
  musicStatus.textContent = t(
    musicUnavailable ? "accessibility.musicUnavailable" : "accessibility.musicHint",
  );
}

function applyAccessibilitySettings() {
  document.documentElement.dataset.textScale = accessibilitySettings.textScale;
  document.body.classList.toggle("reduce-motion", accessibilitySettings.reducedMotion);
  document.body.classList.toggle("low-violence", accessibilitySettings.lowViolence);
  document.body.classList.toggle("particles-off", accessibilitySettings.particlesOff);
  document.body.classList.toggle("high-contrast-hazards", accessibilitySettings.highContrast);
  ambientMusic.setEnabled(accessibilitySettings.musicEnabled);
  motionToggle.setAttribute("aria-pressed", String(accessibilitySettings.reducedMotion));
  musicToggle.setAttribute("aria-pressed", String(accessibilitySettings.musicEnabled));
  renderFooterControls();
  const reduced = document.getElementById("setting-reduced-motion");
  const lowViolence = document.getElementById("setting-low-violence");
  const particles = document.getElementById("setting-particles");
  const highContrast = document.getElementById("setting-high-contrast");
  const backgroundMusic = document.getElementById("setting-background-music");
  if (reduced instanceof HTMLInputElement) reduced.checked = accessibilitySettings.reducedMotion;
  if (lowViolence instanceof HTMLInputElement) {
    lowViolence.checked = accessibilitySettings.lowViolence;
  }
  if (particles instanceof HTMLInputElement) particles.checked = accessibilitySettings.particlesOff;
  if (highContrast instanceof HTMLInputElement) {
    highContrast.checked = accessibilitySettings.highContrast;
  }
  if (backgroundMusic instanceof HTMLInputElement) {
    backgroundMusic.checked = accessibilitySettings.musicEnabled;
  }
  document.querySelectorAll('input[name="text-scale"]').forEach((element) => {
    if (element instanceof HTMLInputElement) {
      element.checked = element.value === accessibilitySettings.textScale;
    }
  });
  if (tacticalArenaRenderer !== null) {
    resetTacticalArenaRenderer();
    const currentView = view;
    if (currentView !== null) queueMicrotask(() => renderTacticalArena(currentView));
  }
}

function disarmMusicUnlock() {
  if (!musicUnlockArmed) return;
  musicUnlockArmed = false;
  document.removeEventListener("pointerdown", handleMusicUnlock, true);
  document.removeEventListener("keydown", handleMusicUnlock, true);
}

function armMusicUnlock() {
  if (musicUnlockArmed || !accessibilitySettings.musicEnabled || document.hidden) return;
  musicUnlockArmed = true;
  document.addEventListener("pointerdown", handleMusicUnlock, { capture: true, once: true });
  document.addEventListener("keydown", handleMusicUnlock, { capture: true, once: true });
}

/** @param {boolean} turnOffOnFailure */
async function startAmbientMusic(turnOffOnFailure) {
  if (!accessibilitySettings.musicEnabled || document.hidden) return false;
  const played = await ambientMusic.play();
  if (played) {
    musicUnavailable = false;
    disarmMusicUnlock();
    renderFooterControls();
    return true;
  }
  if (turnOffOnFailure) {
    accessibilitySettings.musicEnabled = false;
    musicUnavailable = true;
    ambientMusic.setEnabled(false);
    applyAccessibilitySettings();
    saveAccessibilitySettings();
    announce(t("accessibility.musicUnavailable"));
  } else {
    armMusicUnlock();
  }
  return false;
}

/** @param {Event} event */
function handleMusicUnlock(event) {
  musicUnlockArmed = false;
  document.removeEventListener("pointerdown", handleMusicUnlock, true);
  document.removeEventListener("keydown", handleMusicUnlock, true);
  if (
    event.target instanceof Element &&
    event.target.closest("#music-toggle, #setting-background-music") !== null
  ) return;
  if (accessibilitySettings.musicEnabled) void startAmbientMusic(true);
}

/** @param {boolean} enabled */
function setMusicPreference(enabled) {
  accessibilitySettings.musicEnabled = enabled;
  musicUnavailable = false;
  applyAccessibilitySettings();
  saveAccessibilitySettings();
  if (enabled) void startAmbientMusic(true);
  else disarmMusicUnlock();
}

systemReducedMotionQuery?.addEventListener("change", () => {
  if (tacticalArenaRenderer === null) return;
  resetTacticalArenaRenderer();
  const currentView = view;
  if (currentView !== null) queueMicrotask(() => renderTacticalArena(currentView));
});

function openAccessibilityPanel() {
  renderDebugOutput();
  accessibilityPanel.hidden = false;
  accessibilityToggle.setAttribute("aria-expanded", "true");
  accessibilityPanel.focus();
}

function closeAccessibilityPanel() {
  accessibilityPanel.hidden = true;
  accessibilityToggle.setAttribute("aria-expanded", "false");
  accessibilityToggle.focus();
}

motionToggle.addEventListener("click", () => {
  accessibilitySettings.reducedMotion = !accessibilitySettings.reducedMotion;
  applyAccessibilitySettings();
  saveAccessibilitySettings();
});
musicToggle.addEventListener("click", () => {
  setMusicPreference(!accessibilitySettings.musicEnabled);
});
accessibilityToggle.addEventListener("click", openAccessibilityPanel);
accessibilityClose.addEventListener("click", closeAccessibilityPanel);
debugPing.addEventListener("click", () => {
  send({ type: "ping", t: Math.round(performance.now()) });
});
accessibilityPanel.addEventListener("change", (event) => {
  if (!(event.target instanceof HTMLInputElement)) return;
  if (event.target.name === "text-scale") accessibilitySettings.textScale = event.target.value;
  if (event.target.id === "setting-reduced-motion") {
    accessibilitySettings.reducedMotion = event.target.checked;
  }
  if (event.target.id === "setting-low-violence") {
    accessibilitySettings.lowViolence = event.target.checked;
  }
  if (event.target.id === "setting-particles") {
    accessibilitySettings.particlesOff = event.target.checked;
  }
  if (event.target.id === "setting-high-contrast") {
    accessibilitySettings.highContrast = event.target.checked;
  }
  if (event.target.id === "setting-background-music") {
    setMusicPreference(event.target.checked);
    return;
  }
  applyAccessibilitySettings();
  saveAccessibilitySettings();
});
document.addEventListener("keydown", (event) => {
  const formControlFocused = document.activeElement instanceof HTMLInputElement ||
    document.activeElement instanceof HTMLSelectElement ||
    document.activeElement instanceof HTMLTextAreaElement;
  if (event.key === "Tab" && matchView.classList.contains("tactical-side-detail-open")) {
    const survivorColumn = narrativePlayerDrawer.closest(".narrative-survivor-column");
    const focusable = survivorColumn === null ? [] : [...survivorColumn.querySelectorAll(
      'button:not([disabled]), summary, input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    )].filter((element) =>
      element instanceof HTMLElement && element.getClientRects().length > 0 &&
      element.closest("[inert]") === null
    );
    const first = focusable[0];
    const last = focusable.at(-1);
    if (first instanceof HTMLElement && last instanceof HTMLElement) {
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }
  const compactEncounterChoices = narrativeOptions.querySelectorAll(
    "[data-encounter-action]",
  );
  const primaryChoiceRoot = !narrativeDecisionCard.hidden
    ? narrativeDecisionCard
    : !narrativePreview.hidden
    ? narrativePreview
    : compactEncounterChoices.length > 0
    ? narrativeOptions
    : null;
  if (
    playViewMode === "narrative" && !formControlFocused && !narrativeModeView.hidden &&
    primaryChoiceRoot !== null &&
    (/^[1-4]$/.test(event.key) || event.key === "Enter")
  ) {
    const focusedChoice = document.activeElement;
    if (
      event.key === "Enter" && focusedChoice instanceof HTMLButtonElement &&
      !focusedChoice.disabled && primaryChoiceRoot.contains(focusedChoice) &&
      focusedChoice.closest("[hidden], [inert]") === null
    ) {
      return;
    }
    const explicitChoices = primaryChoiceRoot.querySelectorAll(
      "[data-narrative-card-choice], [data-encounter-action]",
    );
    const choices = explicitChoices.length > 0
      ? explicitChoices
      : primaryChoiceRoot.querySelectorAll("button:not(:disabled)");
    const index = event.key === "Enter" ? 0 : Number(event.key) - 1;
    const choice = event.key === "Enter"
      ? [...choices].find((element) => element instanceof HTMLButtonElement && !element.disabled)
      : choices[index];
    if (
      choice instanceof HTMLButtonElement && !choice.disabled && choice.closest("[hidden]") === null
    ) {
      event.preventDefault();
      choice.click();
    }
  }
  if (
    playViewMode === "narrative" && !formControlFocused && !narrativeModeView.hidden &&
    narrativeDecisionCard.hidden && narrativePreview.hidden && !event.defaultPrevented &&
    compactEncounterChoices.length === 0
  ) {
    if (/^[1-4]$/.test(event.key)) {
      const index = Number(event.key) - 1;
      const option = narrativeOptions.querySelectorAll("[data-narrative-option]")[index];
      if (
        option instanceof HTMLButtonElement && !option.disabled &&
        option.closest("[hidden]") === null
      ) {
        event.preventDefault();
        option.click();
      } else {
        const commander = document.getElementById("open-commander-menu");
        if (
          commander instanceof HTMLButtonElement && !commander.disabled &&
          commander.dataset.hotkey === event.key
        ) {
          event.preventDefault();
          commander.click();
        }
      }
    } else if (event.key === "Enter") {
      const suggested = narrativeOptions.querySelector('[data-narrative-slot="S1"]');
      if (
        suggested instanceof HTMLButtonElement && !suggested.disabled &&
        suggested.closest("[hidden]") === null
      ) {
        event.preventDefault();
        suggested.click();
      }
    }
  }
  if (event.key === "Tab" && !accessibilityPanel.hidden) {
    const focusable = [...accessibilityPanel.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    )].filter((element) => element instanceof HTMLElement && !element.hidden);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (first instanceof HTMLElement && last instanceof HTMLElement) {
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }
  if (event.key === "Escape" && !accessibilityPanel.hidden) {
    closeAccessibilityPanel();
    return;
  }
  if (event.key === "Escape" && echoJitOpen && view?.self.status === "echo") {
    event.preventDefault();
    closeEchoJit(true);
    return;
  }
  if (event.key === "Escape" && !tacticalContextBreadcrumb.hidden) {
    event.preventDefault();
    returnToTacticalField();
    return;
  }
  if (event.key === "Escape" && playViewMode === "narrative") {
    if (narrativeRouteMenuOpen) {
      closeNarrativeRouteMenu();
      return;
    }
    if (narrativeCommanderMenuOpen) {
      narrativeCommanderMenuOpen = false;
      if (view !== null) renderNarrativeMode(view);
      return;
    }
    if (narrativeCommanderActive) {
      takeNarrativeControl();
      if (view !== null) renderNarrativeMode(view);
      return;
    }
  }
  if (event.key === "Escape" && controlMode === "semi") {
    pauseSemi({ key: "semi.paused.escape" });
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    musicResumeAfterVisibility = ambientMusic.isPlaying();
    ambientMusic.pause();
  } else if (musicResumeAfterVisibility && accessibilitySettings.musicEnabled) {
    musicResumeAfterVisibility = false;
    void startAmbientMusic(false);
  }
  if (document.hidden && controlMode === "semi") {
    pauseSemi({ key: "semi.paused.background" });
  }
});
globalThis.addEventListener("pagehide", () => ambientMusic.pause());
document.addEventListener("darkforest:localechange", () => {
  const nextLocale = getLocale();
  if (nextLocale === narrativeLocale) return;
  narrativeLocale = nextLocale;
  renderFooterControls();
  // The lobby has no periodic re-render, so its live surfaces are refreshed explicitly.
  // Already-emitted Narrative Log lines keep the locale they were written in.
  connectionLabel.textContent = t(connectionStatusKey);
  if (view === null) {
    prejoinShiftSignature = "";
    liveJoinSignature = "";
    updatePrejoinShiftPreview();
    renderLiveJoinOption();
    renderQueueDock();
    if (queueMessage !== null) renderQueueLobbyStatus();
    else if (lobbyMessage !== null) renderLobbyMessage(lobbyMessage);
    updateSpectatorWarmupTimer();
    syncProfileDraftPresentation();
    return;
  }
  narrativeLocaleChangeSequence += 1;
  appendNarrative([{
    id: `locale-change-${narrativeLocaleChangeSequence}`,
    atGameMs: estimatedGameNowMs(),
    level: "self",
    text: t("narrative.system.locale_changed"),
    fatal: false,
    source: "derived",
    kind: "system",
  }]);
  renderMatch();
});

loadAssistPreferences();
restoreProfileForm();
applyAccessibilitySettings();
armMusicUnlock();
updatePrejoinShiftPreview();
void refreshMatchServiceAvailability();
setInterval(updateTimers, 250);
