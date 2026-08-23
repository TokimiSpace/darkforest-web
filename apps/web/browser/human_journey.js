// @ts-check
/** @typedef {import("@darkforest/protocol").PlayerStatus} PlayerStatus */
/** @typedef {import("@darkforest/protocol").ActionPayload} ActionPayload */
/**
 * 只描述旅程稽核會讀取的 NarrativeOption 公開形狀，避免測試 helper 反向依賴 UI runtime。
 * @typedef {object} NarrativeOption
 * @property {string} key
 * @property {"S1" | "S2" | "S3" | "S4"} slot
 * @property {string} label
 * @property {string} note
 * @property {"payload" | "preview" | "move-contact" | "distance" | "avoid-hazard" | "mark-edge" | "open" | "rescue" | "cache"} kind
 * @property {ActionPayload=} payload
 */

/**
 * @typedef {"attack" | "observe" | "retreat" | "search" | "pickup" | "rescue" | "move" | "local-routes" | "attune" | "hide" | "use-item" | "other"} HumanIntent
 */
/**
 * @typedef {object} HumanJourneyStep
 * @property {string} id
 * @property {PlayerStatus} status
 * @property {NarrativeOption[]} visibleOptions
 * @property {boolean=} visibleThreat
 * @property {boolean=} closingNode
 * @property {string=} chosenKey
 */
/**
 * @typedef {object} HumanJourneyFrame
 * @property {string} id
 * @property {PlayerStatus} status
 * @property {string[]} visibleKeys
 * @property {HumanIntent[]} visibleIntents
 * @property {HumanIntent | null} chosenIntent
 * @property {string[]} violations
 */

/**
 * 把既有 NarrativeOption 轉成玩家能理解的操作意圖；不重算遊戲規則。
 * @param {NarrativeOption} option
 * @returns {HumanIntent}
 */
export function humanIntentForOption(option) {
  if (option.kind === "cache") return "pickup";
  if (option.kind === "rescue") return "rescue";
  if (option.kind === "distance") return "retreat";
  if (option.kind === "preview") return option.key.startsWith("attack-") ? "attack" : "observe";
  if (option.kind === "open" && option.key === "open-routes") return "local-routes";
  if (option.kind === "move-contact" || option.kind === "avoid-hazard") return "move";
  const action = option.payload?.action;
  if (action === "attack") return "attack";
  if (action === "search") return "search";
  if (action === "pickup") return "pickup";
  if (action === "rescue") return "rescue";
  if (action === "move" || action === "echo_move") return "move";
  if (action === "echo_attune") return "attune";
  if (action === "hide") return "hide";
  if (action === "use_item") return "use-item";
  return "other";
}

/**
 * 單步 headless 驗證：狀態 → 畫面可見選項 → 玩家選擇的操作意圖。
 * @param {HumanJourneyStep} step
 * @returns {HumanJourneyFrame}
 */
export function evaluateHumanJourneyStep(step) {
  const visibleIntents = step.visibleOptions.map(humanIntentForOption);
  const chosen = step.chosenKey === undefined
    ? undefined
    : step.visibleOptions.find((option) => option.key === step.chosenKey);
  /** @type {string[]} */
  const violations = [];

  if (step.visibleOptions.length > 3) violations.push("MAIN_OPTION_LIMIT");
  if (step.chosenKey !== undefined && chosen === undefined) violations.push("CHOSEN_OPTION_HIDDEN");

  if (step.status === "echo") {
    if (visibleIntents.includes("pickup")) violations.push("ECHO_PICKUP_VISIBLE");
    if (visibleIntents.includes("rescue")) violations.push("ECHO_RESCUE_VISIBLE");
  }

  if (
    (step.status === "downed" || step.status === "eliminated") && step.visibleOptions.length > 0
  ) {
    violations.push("INACTIVE_ACTION_VISIBLE");
  }

  if (step.status === "active" && step.visibleThreat === true) {
    const hasThreatResponse = visibleIntents.some((intent) =>
      intent === "attack" || intent === "observe" || intent === "retreat"
    );
    if (!hasThreatResponse) violations.push("THREAT_RESPONSE_MISSING");
  }

  if (
    step.status === "active" && step.closingNode === true &&
    !visibleIntents.some((intent) => intent === "move" || intent === "retreat")
  ) {
    violations.push("BLOCKADE_ESCAPE_MISSING");
  }

  const routeOptions = step.visibleOptions.filter((option) => option.slot === "S4");
  if (
    routeOptions.some((option) => option.kind !== "open" || option.key !== "open-routes")
  ) {
    violations.push("ROUTE_NOT_LOCAL");
  }

  return {
    id: step.id,
    status: step.status,
    visibleKeys: step.visibleOptions.map((option) => option.key),
    visibleIntents,
    chosenIntent: chosen === undefined ? null : humanIntentForOption(chosen),
    violations,
  };
}

/**
 * 執行一段人類操作旅程，保留逐步可見選項與選擇結果供測試斷言。
 * @param {HumanJourneyStep[]} steps
 */
export function runHumanJourney(steps) {
  const frames = steps.map(evaluateHumanJourneyStep);
  return {
    frames,
    chosenIntents: frames.flatMap((frame) =>
      frame.chosenIntent === null ? [] : [frame.chosenIntent]
    ),
    violations: frames.flatMap((frame) =>
      frame.violations.map((violation) => `${frame.id}:${violation}`)
    ),
  };
}
