// Generated from browser/echo_oracle.js by scripts/emit_client.ts. Do not edit.
// @ts-check
import { escapeHtml } from "./html_escape.js";

export const ECHO_ORACLE_MAX_CODEPOINTS = 120;
export const ECHO_ORACLE_INITIAL_QUESTIONS = 3;

/** @typedef {(key: string, params?: Record<string, string | number>) => string} Translate */
/**
 * @typedef {object} EchoOracleState
 * @property {number} remainingQuestions
 * @property {number} cooldownUntilGameMs
 * @property {string | null} pendingRequestId
 * @property {string} draft
 */
/** @typedef {import("@darkforest/protocol").ArboraStatusMsg} ArboraStatusMsg */
/** @typedef {import("@darkforest/protocol").ArboraReplyMsg} ArboraReplyMsg */
/** @typedef {import("@darkforest/protocol").ArboraRejectMsg} ArboraRejectMsg */
/** @typedef {ArboraStatusMsg | ArboraReplyMsg | ArboraRejectMsg} ArboraServerMsg */
/** @typedef {"hidden" | "ready" | "cooldown" | "pending" | "exhausted"} OracleAvailability */

/** @returns {EchoOracleState} */
export function createEchoOracleState() {
  return {
    remainingQuestions: ECHO_ORACLE_INITIAL_QUESTIONS,
    cooldownUntilGameMs: 0,
    pendingRequestId: null,
    draft: "",
  };
}

/** @param {unknown} value */
export function oracleCodePointLength(value) {
  return Array.from(String(value ?? "")).length;
}

/**
 * Keep input limits based on Unicode code points rather than UTF-16 units, so an emoji or a
 * non-BMP CJK character is not counted twice by the client.
 * @param {unknown} value
 * @param {number=} limit
 */
export function clipOracleDraft(value, limit = ECHO_ORACLE_MAX_CODEPOINTS) {
  return Array.from(String(value ?? "")).slice(0, Math.max(0, limit)).join("");
}

/** @param {unknown} value @param {number=} limit */
export function normalizeOracleQuestion(value, limit = ECHO_ORACLE_MAX_CODEPOINTS) {
  const raw = String(value ?? "");
  const text = raw.trim();
  const length = oracleCodePointLength(text);
  return {
    text,
    length,
    valid: length > 0 && length <= limit,
    empty: length === 0,
    tooLong: length > limit,
  };
}

/**
 * @param {{status: string, phase: string}} current
 * @param {EchoOracleState} state
 * @param {number} gameNowMs
 * @returns {OracleAvailability}
 */
export function echoOracleAvailability(current, state, gameNowMs) {
  if (current.status !== "echo" || current.phase === "ended") return "hidden";
  if (state.pendingRequestId !== null) return "pending";
  if (state.remainingQuestions <= 0) return "exhausted";
  if (state.cooldownUntilGameMs > gameNowMs) return "cooldown";
  return "ready";
}

/** @param {EchoOracleState} state @param {ArboraServerMsg} message */
export function applyArboraMessage(state, message) {
  if (message.type === "arbora_status") {
    return {
      ...state,
      remainingQuestions: clampRemaining(message.remainingQuestions),
      cooldownUntilGameMs: finiteDeadline(message.cooldownUntilGameMs),
      pendingRequestId: cleanRequestId(message.pendingRequestId),
    };
  }
  if (message.type === "arbora_reply") {
    return {
      ...state,
      remainingQuestions: clampRemaining(message.remainingQuestions),
      cooldownUntilGameMs: finiteDeadline(message.cooldownUntilGameMs),
      pendingRequestId: state.pendingRequestId === message.requestId
        ? null
        : state.pendingRequestId,
    };
  }
  return {
    ...state,
    remainingQuestions: clampRemaining(message.remainingQuestions),
    cooldownUntilGameMs: message.retryAtGameMs === undefined
      ? state.cooldownUntilGameMs
      : finiteDeadline(message.retryAtGameMs),
    pendingRequestId: state.pendingRequestId === message.requestId ? null : state.pendingRequestId,
  };
}

/** @param {EchoOracleState} state @param {string} requestId */
export function beginArboraRequest(state, requestId) {
  return {
    ...state,
    pendingRequestId: requestId,
    draft: "",
  };
}

/**
 * A stable signature prevents unrelated combat/urgent renders from replacing the textarea and
 * stealing the Echo player's cursor. The live cooldown itself is patched separately.
 * @param {{status: string, phase: string}} current
 * @param {EchoOracleState} state
 * @param {string} locale UI locale; the outbound protocol locale is normalized by client.js.
 */
export function echoOracleRenderKey(current, state, locale) {
  return [
    current.status,
    current.phase,
    locale,
    state.remainingQuestions,
    state.cooldownUntilGameMs,
    state.pendingRequestId ?? "",
  ].join(":");
}

/**
 * @param {EchoOracleState} state
 * @param {{status: string, phase: string}} current
 * @param {number} gameNowMs
 * @param {Translate} translate
 */
export function echoOracleMarkup(state, current, gameNowMs, translate) {
  const availability = echoOracleAvailability(current, state, gameNowMs);
  if (availability === "hidden") return "";
  const pending = availability === "pending";
  const exhausted = availability === "exhausted";
  const cooldown = availability === "cooldown";
  const blocked = pending || exhausted;
  const remaining = Math.max(0, state.remainingQuestions);
  const status = pending
    ? `<span class="echo-oracle-waiting" aria-hidden="true"><i></i><i></i><i></i></span>${
      escapeHtml(translate("arbora.status.listening"))
    }`
    : exhausted
    ? escapeHtml(translate("arbora.status.exhausted"))
    : cooldown
    ? escapeHtml(translate("arbora.status.cooldown", {
      seconds: Math.max(0, Math.ceil((state.cooldownUntilGameMs - gameNowMs) / 1_000)),
    }))
    : escapeHtml(translate("arbora.status.invitation"));
  const draft = clipOracleDraft(state.draft);
  const draftLength = oracleCodePointLength(draft);
  const validDraft = normalizeOracleQuestion(draft).valid;
  return `
    <header class="echo-oracle-heading">
      <div>
        <p class="eyebrow">${escapeHtml(translate("arbora.panel.kicker"))}</p>
        <h3 id="echo-oracle-heading">${escapeHtml(translate("arbora.panel.title"))}</h3>
      </div>
      <span data-oracle-remaining>${
    escapeHtml(translate("arbora.panel.remaining", { count: remaining }))
  }</span>
    </header>
    <p id="echo-oracle-disclosure" class="echo-oracle-disclosure">${
    escapeHtml(translate("arbora.panel.ai_disclosure"))
  }</p>
    <div class="echo-oracle-suggestions" role="group" aria-label="${
    escapeHtml(translate("arbora.panel.suggestions"))
  }">
      ${
    ["hotspot", "movement", "memory"].map((kind) =>
      `<button type="button" data-oracle-suggestion="${kind}" ${blocked ? "disabled" : ""}>${
        escapeHtml(translate(`arbora.suggestion.${kind}`))
      }</button>`
    ).join("")
  }
    </div>
    <form class="echo-oracle-form" data-oracle-form novalidate>
      <label for="echo-oracle-input" class="sr-only">${
    escapeHtml(translate("arbora.panel.formLabel"))
  }</label>
      <textarea id="echo-oracle-input" name="oracle-question" rows="3"
        aria-describedby="echo-oracle-disclosure echo-oracle-count echo-oracle-status"
        placeholder="${escapeHtml(translate("arbora.panel.placeholder"))}"
        ${blocked ? "disabled" : ""}>${escapeHtml(draft)}</textarea>
      <div class="echo-oracle-form-footer">
        <span id="echo-oracle-count" data-oracle-count>${
    escapeHtml(translate("arbora.panel.characters", {
      count: draftLength,
      max: ECHO_ORACLE_MAX_CODEPOINTS,
    }))
  }</span>
        <button type="submit" data-oracle-submit ${
    availability !== "ready" || !validDraft ? "disabled" : ""
  }>${escapeHtml(translate("arbora.panel.submit"))}</button>
      </div>
    </form>
    <p id="echo-oracle-status" class="echo-oracle-status" role="status" aria-live="polite"
      data-oracle-status data-state="${availability}" data-cooldown-until-game-ms="${state.cooldownUntilGameMs}">${status}</p>
  `;
}

/**
 * Patch only the live state. This deliberately does not replace the textarea, so a normal diff
 * or urgent decision card cannot erase a half-written question or move focus.
 * @param {HTMLElement} root
 * @param {EchoOracleState} state
 * @param {{status: string, phase: string}} current
 * @param {number} gameNowMs
 * @param {Translate} translate
 */
export function patchEchoOraclePanel(root, state, current, gameNowMs, translate) {
  const availability = echoOracleAvailability(current, state, gameNowMs);
  const status = root.querySelector("[data-oracle-status]");
  const submit = root.querySelector("[data-oracle-submit]");
  const input = root.querySelector("#echo-oracle-input");
  const blocked = availability === "pending" || availability === "exhausted";
  if (status instanceof HTMLElement) {
    status.dataset.state = availability;
    if (availability === "cooldown") {
      status.textContent = translate("arbora.status.cooldown", {
        seconds: Math.max(0, Math.ceil((state.cooldownUntilGameMs - gameNowMs) / 1_000)),
      });
    } else if (availability === "ready") {
      status.textContent = translate("arbora.status.invitation");
    } else if (availability === "exhausted") {
      status.textContent = translate("arbora.status.exhausted");
    }
  }
  const validDraft = input instanceof HTMLTextAreaElement
    ? normalizeOracleQuestion(input.value).valid
    : false;
  if (submit instanceof HTMLButtonElement) {
    submit.disabled = availability !== "ready" || !validDraft;
  }
  if (input instanceof HTMLTextAreaElement) input.disabled = blocked;
  root.querySelectorAll("[data-oracle-suggestion]").forEach((button) => {
    if (button instanceof HTMLButtonElement) button.disabled = blocked;
  });
}

/** @param {string[]} factIds @param {Translate} translate */
export function oracleCitationCategories(factIds, translate) {
  const categories = new Set();
  for (const factId of factIds) {
    const normalized = String(factId).toLowerCase();
    const key = /combat|damage|hotspot|shot|fight/.test(normalized)
      ? "combat"
      : /move|travel|rush|sneak|style|route/.test(normalized)
      ? "movement"
      : /self|memory|visit|attun|echo|intel/.test(normalized)
      ? "memory"
      : /map|node|blockade|hazard|environment|world/.test(normalized)
      ? "world"
      : "anonymous";
    categories.add(translate(`arbora.citation.${key}`));
  }
  if (categories.size === 0) categories.add(translate("arbora.citation.none"));
  return [...categories];
}

/** @param {string} confidence @param {Translate} translate */
function confidenceLabel(confidence, translate) {
  const key = ["low", "medium", "high"].includes(confidence) ? confidence : "low";
  return translate(`arbora.confidence.${key}`);
}

/** @param {string} _source @param {Translate} translate */
function sourceLabel(_source, translate) {
  return translate("arbora.source.stats");
}

/**
 * @param {ArboraReplyMsg} message
 * @param {number} atGameMs
 * @param {Translate} translate
 */
export function arboraReplyNarrativeEntry(message, atGameMs, translate) {
  const speaker = message.toneTag === "pomona"
    ? translate("arbora.speaker.pomona")
    : translate("arbora.speaker.arbora");
  const categories = oracleCitationCategories(message.citedFactIds, translate);
  return {
    id: `arbora-request-${message.requestId}`,
    atGameMs,
    level: /** @type {const} */ ("self"),
    text: String(message.displayText ?? "").trim() || translate("arbora.status.unavailable"),
    fatal: false,
    source: /** @type {const} */ ("derived"),
    kind: /** @type {const} */ ("story"),
    status: /** @type {const} */ ("resolved"),
    speaker,
    label: translate("arbora.log.answerMeta", {
      source: sourceLabel(message.source, translate),
      time: formatGameTimestamp(message.dataAsOfGameMs),
      confidence: confidenceLabel(message.confidence, translate),
    }),
    oracleCitationTitle: translate("arbora.panel.citations", {
      categories: categories.join(translate("narrative.list_separator")),
    }),
  };
}

/** @param {string} reason @param {Translate} translate */
export function arboraRejectionText(reason, translate) {
  const normalized = String(reason ?? "").toUpperCase();
  const key = {
    EXHAUSTED: "exhausted",
    NO_QUESTIONS_LEFT: "exhausted",
    LIMIT_REACHED: "exhausted",
    COOLDOWN_ACTIVE: "cooldown",
    REQUEST_PENDING: "pending",
    PENDING: "pending",
    WRONG_STATUS: "wrong_status",
    NOT_ECHO: "wrong_status",
    EMPTY_TEXT: "empty",
    EMPTY: "empty",
    TEXT_TOO_LONG: "too_long",
    TOO_LONG: "too_long",
    RATE_LIMITED: "rate_limit",
    UNAVAILABLE: "unavailable",
    SAFETY: "safety",
    UNSAFE_CONTENT: "safety",
  }[normalized] ?? "fallback";
  return translate(`arbora.reject.${key}`);
}

/**
 * @param {ArboraRejectMsg} message
 * @param {number} atGameMs
 * @param {Translate} translate
 */
export function arboraRejectNarrativeEntry(message, atGameMs, translate) {
  return {
    id: `arbora-request-${message.requestId}`,
    atGameMs,
    level: /** @type {const} */ ("self"),
    text: arboraRejectionText(message.reason, translate),
    fatal: false,
    source: /** @type {const} */ ("derived"),
    kind: /** @type {const} */ ("system"),
    status: /** @type {const} */ ("rejected"),
    speaker: translate("arbora.speaker.arbora"),
    label: translate("arbora.log.rejected"),
  };
}

/**
 * @param {string} requestId
 * @param {string} question
 * @param {number} atGameMs
 * @param {Translate} translate
 */
export function arboraWaitingNarrativeEntry(requestId, question, atGameMs, translate) {
  return {
    id: `arbora-request-${requestId}`,
    atGameMs,
    level: /** @type {const} */ ("self"),
    text: translate("arbora.log.waiting", { question }),
    fatal: false,
    source: /** @type {const} */ ("derived"),
    kind: /** @type {const} */ ("system"),
    status: /** @type {const} */ ("pending"),
    speaker: translate("arbora.speaker.you"),
    label: translate("arbora.status.listening"),
  };
}

/** @param {unknown} value */
function clampRemaining(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(3, Math.floor(number))) : 0;
}

/** @param {unknown} value */
function finiteDeadline(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

/** @param {unknown} value */
function cleanRequestId(value) {
  return typeof value === "string" && value !== "" ? value : null;
}

/** @param {number} gameMs */
function formatGameTimestamp(gameMs) {
  const seconds = Math.max(0, Math.floor(Number.isFinite(gameMs) ? gameMs / 1_000 : 0));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${
    String(seconds % 60).padStart(2, "0")
  }`;
}

/** @param {unknown} value */
