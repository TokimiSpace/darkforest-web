// Generated from browser/tutorial.js by scripts/emit_client.ts. Do not edit.
// @ts-check

import { ECHO_TWO_INSIGHT_TARGET } from "./narrative_log.js";
import { t } from "./i18n.js";
import { escapeHtml } from "./html_escape.js";

/** @param {unknown} value */

/** @param {string} key @param {Record<string, string | number>=} params */
function tHtml(key, params) {
  return escapeHtml(t(key, params));
}

/**
 * Builds a `<tag data-i18n="key">resolved text</tag>` fragment. The `data-i18n` attribute lets
 * `browser/i18n.js`'s document-wide localizer (`localizeDocument()` / the MutationObserver in
 * `initI18n()`) re-translate this node on every later locale switch, even though the stage is
 * rebuilt via `innerHTML` rather than individual DOM nodes with lasting references.
 * @param {string} tag @param {string} key @param {Record<string, string | number>=} params
 * @param {string} extraAttrs
 */
function i18nNode(tag, key, params, extraAttrs = "") {
  return `<${tag}${extraAttrs} data-i18n="${key}">${tHtml(key, params)}</${tag}>`;
}

/** @param {string} key */
function i18nAriaLabelAttr(key) {
  return ` data-i18n-aria-label="${key}" aria-label="${tHtml(key)}"`;
}

/**
 * @typedef {{ key: string, params?: Record<string, string | number> }} CopyRef
 * @typedef {{ value: string, labelKey: string, detailKey: string }} LessonChoice
 * @typedef {{
 *   eyebrow: string,
 *   headingKey: string,
 *   introKey: string,
 *   takeawayKey: string,
 *   facts: CopyRef[],
 *   ruleNotes?: Array<{ titleKey: string, bodyKey: string, mark: string }>,
 *   visual: () => string,
 *   promptKey: string,
 *   choices: LessonChoice[],
 *   correct: string,
 *   success: CopyRef,
 * }} Lesson
 */

/**
 * Structural data for the five tutorial lessons. Copy itself is never stored as a literal
 * string here -- every text field is a shell-catalog key under `tutorial.lesson.<n>.*` (or an
 * explicitly reused key from elsewhere), resolved through `t()` at read time so a locale switch
 * re-renders correctly. `eyebrow` and the design labels
 * baked directly into `visual` (MEGA CITY, TARGET, SOLO, solo_survivor, ...) are intentionally
 * left as literal English/identifier chrome -- same convention as the rest of the tutorial page
 * (`routes/tutorial.tsx`'s "TRAINING QUEUE", "0 / 5 COMPLETE") and, for the state-machine names,
 * stable public-demo identifiers.
 * @type {Lesson[]}
 */
export const LESSONS = [
  {
    eyebrow: "THE SAME NIGHT",
    headingKey: "tutorial.lesson.1.heading",
    introKey: "tutorial.lesson.1.intro",
    takeawayKey: "tutorial.lesson.1.takeaway",
    facts: [
      { key: "tutorial.lesson.1.fact.1" },
      { key: "tutorial.lesson.1.fact.2" },
      { key: "tutorial.lesson.1.fact.3" },
      { key: "tutorial.lesson.1.fact.4" },
    ],
    ruleNotes: [
      {
        titleKey: "tutorial.progression.title",
        bodyKey: "tutorial.progression.body",
        mark: "XP ↑",
      },
      {
        titleKey: "tutorial.perks.title",
        bodyKey: "tutorial.perks.body",
        mark: "✦",
      },
    ],
    visual: () =>
      `<div class="training-timeline"${i18nAriaLabelAttr("tutorial.lesson.1.visual.ariaLabel")}>` +
      `<span style="--at:0%"><b>MEGA CITY</b>${
        i18nNode("small", "tutorial.lesson.1.visual.step1")
      }</span>` +
      `<span class="timeline-reset" style="--at:48%"><b>RESET</b>${
        i18nNode("small", "tutorial.lesson.1.visual.step2")
      }</span>` +
      `<span style="--at:100%"><b>DARKFOREST</b>${
        i18nNode("small", "tutorial.lesson.1.visual.step3")
      }</span></div>`,
    promptKey: "tutorial.lesson.1.prompt",
    choices: [
      {
        value: "new-match",
        labelKey: "tutorial.lesson.1.choice.new-match.label",
        detailKey: "tutorial.lesson.1.choice.new-match.detail",
      },
      {
        value: "checkpoint",
        labelKey: "tutorial.lesson.1.choice.checkpoint.label",
        detailKey: "tutorial.lesson.1.choice.checkpoint.detail",
      },
      {
        value: "cinematic",
        labelKey: "tutorial.lesson.1.choice.cinematic.label",
        detailKey: "tutorial.lesson.1.choice.cinematic.detail",
      },
    ],
    correct: "checkpoint",
    success: { key: "tutorial.lesson.1.success" },
  },
  {
    eyebrow: "ONE MOMENT / ONE CHOICE",
    headingKey: "tutorial.lesson.2.heading",
    introKey: "tutorial.lesson.2.intro",
    takeawayKey: "tutorial.lesson.2.takeaway",
    facts: [
      { key: "tutorial.lesson.2.fact.1" },
      { key: "tutorial.lesson.2.fact.2" },
      { key: "tutorial.lesson.2.fact.3" },
      { key: "tutorial.lesson.2.fact.4" },
    ],
    visual: () =>
      '<div class="training-contact-card">' +
      '<div class="contact-rings" aria-hidden="true"><i></i><i></i><i></i></div>' +
      '<div class="contact-figure" aria-hidden="true">?</div>' +
      `<div><span>ADJACENT LOS</span>${i18nNode("strong", "tutorial.lesson.2.visual.label1")}` +
      `${i18nNode("small", "tutorial.lesson.2.visual.label2")}</div></div>`,
    promptKey: "tutorial.lesson.2.prompt",
    choices: [
      {
        value: "fire",
        labelKey: "tutorial.lesson.2.choice.fire.label",
        detailKey: "tutorial.lesson.2.choice.fire.detail",
      },
      {
        value: "identify",
        labelKey: "tutorial.lesson.2.choice.identify.label",
        detailKey: "tutorial.lesson.2.choice.identify.detail",
      },
      {
        value: "identity",
        labelKey: "tutorial.lesson.2.choice.identity.label",
        detailKey: "tutorial.lesson.2.choice.identity.detail",
      },
    ],
    correct: "identify",
    success: { key: "tutorial.lesson.2.success" },
  },
  {
    eyebrow: "PREVIEW / CONFIRM",
    headingKey: "tutorial.lesson.3.heading",
    introKey: "tutorial.lesson.3.intro",
    takeawayKey: "tutorial.lesson.3.takeaway",
    facts: [
      { key: "tutorial.lesson.3.fact.1" },
      { key: "tutorial.lesson.3.fact.2" },
      { key: "tutorial.lesson.3.fact.3" },
      { key: "tutorial.lesson.3.fact.4" },
    ],
    visual: () =>
      `<div class="training-combat-flow"${
        i18nAriaLabelAttr("tutorial.lesson.3.visual.ariaLabel")
      }>` +
      `<div><span>01</span><b>TARGET</b>${
        i18nNode("small", "tutorial.lesson.3.visual.label1")
      }</div><i>→</i>` +
      `<div><span>02</span><b>PREVIEW</b>${
        i18nNode("small", "tutorial.lesson.3.visual.label2")
      }</div><i>→</i>` +
      `<div><span>03</span><b>FIRE</b>${
        i18nNode("small", "tutorial.lesson.3.visual.label3")
      }</div></div>`,
    promptKey: "tutorial.lesson.3.prompt",
    choices: [
      {
        value: "attack-preview",
        labelKey: "tutorial.lesson.3.choice.attack-preview.label",
        detailKey: "tutorial.lesson.3.choice.attack-preview.detail",
      },
      {
        value: "target-preview-confirm",
        labelKey: "tutorial.lesson.3.choice.target-preview-confirm.label",
        detailKey: "tutorial.lesson.3.choice.target-preview-confirm.detail",
      },
      {
        value: "preview-auto",
        labelKey: "tutorial.lesson.3.choice.preview-auto.label",
        detailKey: "tutorial.lesson.3.choice.preview-auto.detail",
      },
    ],
    correct: "target-preview-confirm",
    success: { key: "tutorial.lesson.3.success" },
  },
  {
    eyebrow: "RESET / LEGACY / ECHO",
    headingKey: "tutorial.lesson.4.heading",
    introKey: "tutorial.lesson.4.intro",
    takeawayKey: "tutorial.lesson.4.takeaway",
    facts: [
      { key: "tutorial.lesson.4.fact.1" },
      { key: "tutorial.lesson.4.fact.2" },
      { key: "tutorial.lesson.4.fact.3", params: { belowTarget: ECHO_TWO_INSIGHT_TARGET - 1 } },
      { key: "tutorial.lesson.4.fact.4", params: { target: ECHO_TWO_INSIGHT_TARGET } },
    ],
    visual: () =>
      `<div class="training-echo-loop"${i18nAriaLabelAttr("tutorial.lesson.4.visual.ariaLabel")}>` +
      `<div><span>01 · FALL</span>${i18nNode("b", "tutorial.lesson.4.visual.step1Title")}${
        i18nNode("small", "tutorial.lesson.4.visual.step1Detail")
      }</div><i>→</i>` +
      `<div><span>02 · DRIFT</span>${i18nNode("b", "tutorial.lesson.4.visual.step2Title")}${
        i18nNode("small", "tutorial.lesson.4.visual.step2Detail")
      }</div><i>→</i>` +
      // "感應此地" (attune) reuses the in-match action label for consistent translation.
      `<div><span>03 · ATTUNE</span>${i18nNode("b", "situation.option.attune.label")}${
        i18nNode("small", "tutorial.lesson.4.visual.step3Detail")
      }</div><i>→</i>` +
      `<div><span>04 · RETURN</span>${i18nNode("b", "tutorial.lesson.4.visual.step4Title")}${
        i18nNode("small", "tutorial.lesson.4.visual.step4Detail")
      }</div>` +
      `<p>${i18nNode("b", "tutorial.lesson.4.visual.returnLabel")}${
        i18nNode("span", "tutorial.lesson.4.visual.returnBody")
      }</p></div>`,
    promptKey: "tutorial.lesson.4.prompt",
    choices: [
      {
        value: "repeat-attune",
        labelKey: "tutorial.lesson.4.choice.repeat-attune.label",
        detailKey: "tutorial.lesson.4.choice.repeat-attune.detail",
      },
      {
        value: "drift-attune",
        labelKey: "tutorial.lesson.4.choice.drift-attune.label",
        detailKey: "tutorial.lesson.4.choice.drift-attune.detail",
      },
      {
        value: "echo-fight",
        labelKey: "tutorial.lesson.4.choice.echo-fight.label",
        detailKey: "tutorial.lesson.4.choice.echo-fight.detail",
      },
    ],
    correct: "drift-attune",
    success: { key: "tutorial.lesson.4.success", params: { target: ECHO_TWO_INSIGHT_TARGET } },
  },
  {
    eyebrow: "ENDING PREVIEW / ROOTHEART",
    headingKey: "tutorial.lesson.5.heading",
    introKey: "tutorial.lesson.5.intro",
    takeawayKey: "tutorial.lesson.5.takeaway",
    facts: [
      { key: "tutorial.lesson.5.fact.1" },
      { key: "tutorial.lesson.5.fact.2" },
      { key: "tutorial.lesson.5.fact.3" },
      { key: "tutorial.lesson.5.fact.4" },
    ],
    visual: () =>
      '<div class="training-state-trio">' +
      '<div class="state-downed"><span>SOLO</span><b>SURVIVOR</b><small>solo_survivor</small></div>' +
      '<div class="state-echo"><span>TOGETHER</span><b>ARBORA</b><small>arbora_covenant</small></div>' +
      `<div class="state-eliminated"><span>UNANSWERED</span><b>NONE</b>${
        i18nNode("small", "tutorial.lesson.5.visual.label1")
      }</div></div>`,
    promptKey: "tutorial.lesson.5.prompt",
    choices: [
      {
        value: "solo-only",
        labelKey: "tutorial.lesson.5.choice.solo-only.label",
        detailKey: "tutorial.lesson.5.choice.solo-only.detail",
      },
      {
        value: "two-endings",
        // Reuse the sidebar's lesson-5 subtitle so both surfaces stay synchronized.
        labelKey: "tutorial.lesson.5.detail",
        detailKey: "tutorial.lesson.5.choice.two-endings.detail",
      },
      {
        value: "become-npc",
        labelKey: "tutorial.lesson.5.choice.become-npc.label",
        detailKey: "tutorial.lesson.5.choice.become-npc.detail",
      },
    ],
    correct: "two-endings",
    success: { key: "tutorial.lesson.5.success" },
  },
];

/** @type {Array<Record<string, string>>} */
export const WRONG_FEEDBACK = [
  {
    "new-match": "tutorial.feedback.1.new-match",
    cinematic: "tutorial.feedback.1.cinematic",
  },
  {
    fire: "tutorial.feedback.2.fire",
    identity: "tutorial.feedback.2.identity",
  },
  {
    "attack-preview": "tutorial.feedback.3.attack-preview",
    "preview-auto": "tutorial.feedback.3.preview-auto",
  },
  {
    "repeat-attune": "tutorial.feedback.4.repeat-attune",
    "echo-fight": "tutorial.feedback.4.echo-fight",
  },
  {
    "solo-only": "tutorial.feedback.5.solo-only",
    "become-npc": "tutorial.feedback.5.become-npc",
  },
];

/**
 * @param {number} lessonIndex
 * @param {string} choice
 * @returns {{kind: "success" | "retry", key: string, params?: Record<string, string | number>} | null}
 */
export function getTutorialFeedback(lessonIndex, choice) {
  const lesson = LESSONS[lessonIndex];
  if (lesson === undefined) return null;
  if (choice === lesson.correct) {
    return { kind: "success", key: lesson.success.key, params: lesson.success.params };
  }
  return {
    kind: "retry",
    key: WRONG_FEEDBACK[lessonIndex]?.[choice] ?? "tutorial.feedback.default",
  };
}

const MANUAL_TOPIC_ALIASES = /** @type {const} */ ({
  store: "shop",
  signal: "survival",
  hp: "survival",
  stamina: "survival",
  map: "travel",
  route: "travel",
  cache: "loot",
  remains: "loot",
  inventory: "loot",
  weapon: "combat",
  fire: "combat",
  injury: "growth",
  level: "growth",
  echo: "reset",
  legacy: "reset",
  insight: "reset",
  rootheart: "finale",
  log: "communication",
  chat: "communication",
  breadcrumb: "navigation",
  subview: "navigation",
});

/** @param {unknown} value */
export function normalizeManualSearch(value) {
  return String(value ?? "").normalize("NFKC").trim().toLocaleLowerCase();
}

/** @param {string} text @param {string} query */
export function manualTextMatches(text, query) {
  const normalizedQuery = normalizeManualSearch(query);
  if (normalizedQuery === "") return true;
  const haystack = normalizeManualSearch(text);
  return normalizedQuery.split(/\s+/u).every((token) => haystack.includes(token));
}

/**
 * Resolve stable public deep-link aliases such as `?topic=echo` to the manual section that owns
 * the answer. Unknown values remain unchanged so future sections can be linked without updating
 * this table first.
 * @param {unknown} value
 */
export function resolveManualTopic(value) {
  const topic = normalizeManualSearch(value);
  return MANUAL_TOPIC_ALIASES[/** @type {keyof typeof MANUAL_TOPIC_ALIASES} */ (topic)] ?? topic;
}

export function initializeTutorial() {
  try {
    const presentation = JSON.parse(
      localStorage.getItem("darkforest-accessibility-v1") ?? "{}",
    );
    if (["100", "125", "150"].includes(presentation.textScale)) {
      document.documentElement.dataset.textScale = presentation.textScale;
    }
    document.body.classList.toggle(
      "reduce-motion",
      presentation.reducedMotion === true,
    );
    document.body.classList.toggle(
      "high-contrast-hazards",
      presentation.highContrast === true,
    );
  } catch {
    // Corrupt client preferences must never block the tutorial.
  }

  const stage = /** @type {HTMLElement | null} */ (
    document.getElementById("tutorial-stage")
  );
  const lessonList = /** @type {HTMLElement | null} */ (
    document.getElementById("tutorial-lesson-list")
  );
  const progressBar = /** @type {HTMLElement | null} */ (
    document.getElementById("tutorial-progress-bar")
  );
  const progressTrack = /** @type {HTMLElement | null} */ (
    document.getElementById("tutorial-progress-track")
  );
  const progressLabel = /** @type {HTMLElement | null} */ (
    document.getElementById("tutorial-progress-label")
  );
  if (
    !(stage instanceof HTMLElement) ||
    !(lessonList instanceof HTMLElement) ||
    !(progressBar instanceof HTMLElement) ||
    !(progressTrack instanceof HTMLElement) ||
    !(progressLabel instanceof HTMLElement)
  ) return;
  const tutorialStage = stage;
  const tutorialProgressBar = progressBar;
  const tutorialProgressTrack = progressTrack;
  const tutorialProgressLabel = progressLabel;
  const manualSearch = /** @type {HTMLInputElement | null} */ (
    document.getElementById("tutorial-manual-search")
  );
  const manualSearchStatus = /** @type {HTMLElement | null} */ (
    document.getElementById("tutorial-manual-search-status")
  );
  const manualEmpty = /** @type {HTMLElement | null} */ (
    document.getElementById("tutorial-manual-empty")
  );
  const manualEntries = /** @type {HTMLDetailsElement[]} */ (
    [...document.querySelectorAll("[data-manual-entry]")].filter((entry) =>
      entry instanceof HTMLDetailsElement
    )
  );

  /** @type {Set<number>} */
  let completed = new Set();
  let currentLesson = 0;
  /** @type {{kind: "success" | "retry", key: string, params?: Record<string, string | number>} | null} */
  let feedback = null;

  try {
    const saved = JSON.parse(localStorage.getItem("darkforest-tutorial-v1") ?? "[]");
    if (Array.isArray(saved)) {
      completed = new Set(
        saved.filter((entry) => Number.isInteger(entry) && entry >= 0 && entry < LESSONS.length),
      );
    }
  } catch {
    // Local progress is optional.
  }

  function activeLessons() {
    return LESSONS.map((_, index) => index);
  }

  function saveProgress() {
    try {
      localStorage.setItem("darkforest-tutorial-v1", JSON.stringify([...completed]));
    } catch {
      // Private browsing may reject storage; this session still works.
    }
  }

  function renderProgress() {
    const active = activeLessons();
    const count = active.filter((index) => completed.has(index)).length;
    tutorialProgressLabel.textContent = t("tutorial.progress.count", {
      count,
      total: active.length,
    });
    tutorialProgressTrack.setAttribute("aria-valuenow", String(count));
    tutorialProgressTrack.setAttribute("aria-valuemax", String(active.length));
    tutorialProgressTrack.setAttribute(
      "aria-valuetext",
      t("tutorial.progress.count", { count, total: active.length }),
    );
    tutorialProgressBar.style.width = (active.length === 0 ? 0 : count / active.length * 100) + "%";
    document.querySelectorAll("[data-lesson-item]").forEach((item) => {
      if (!(item instanceof HTMLElement)) return;
      const index = Number(item.dataset.lessonItem);
      item.classList.toggle("is-complete", completed.has(index));
      const button = item.querySelector("button");
      const marker = item.querySelector("i");
      if (button !== null) {
        if (index === currentLesson) button.setAttribute("aria-current", "step");
        else button.removeAttribute("aria-current");
      }
      if (marker !== null) marker.textContent = completed.has(index) ? "◆" : "○";
    });
  }

  function updateManualSearch() {
    if (!(manualSearch instanceof HTMLInputElement)) return;
    const query = manualSearch.value;
    let visibleCount = 0;
    for (const entry of manualEntries) {
      const visible = manualTextMatches(entry.textContent ?? "", query);
      entry.hidden = !visible;
      if (visible) visibleCount += 1;
    }
    if (manualSearchStatus !== null) {
      manualSearchStatus.textContent = visibleCount === 0
        ? t("tutorial.manual.searchEmptyShort")
        : t("tutorial.manual.searchResults", { count: visibleCount });
    }
    if (manualEmpty !== null) manualEmpty.hidden = visibleCount !== 0;
  }

  /** @param {unknown} requested @param {boolean=} shouldScroll */
  function revealManualTopic(requested, shouldScroll = false) {
    const topic = resolveManualTopic(requested);
    const entry = manualEntries.find((candidate) => candidate.dataset.manualEntry === topic);
    if (entry === undefined) return false;
    entry.hidden = false;
    entry.open = true;
    if (shouldScroll) {
      entry.scrollIntoView({
        behavior: document.body.classList.contains("reduce-motion") ||
            globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    }
    return true;
  }

  function nextLessonIndex() {
    return activeLessons()[currentLesson + 1] ?? null;
  }

  function renderLesson() {
    const lesson = LESSONS[currentLesson];
    if (lesson === undefined) return;
    const next = nextLessonIndex();
    const choices = lesson.choices.map(({ value, labelKey, detailKey }) =>
      '<button type="button" data-choice="' + value + '">' +
      '<span aria-hidden="true">◇</span><span>' +
      i18nNode("b", labelKey) +
      i18nNode("small", detailKey) +
      "</span></button>"
    ).join("");
    const feedbackMarkup = feedback === null
      ? ""
      : '<p class="lesson-feedback lesson-feedback-' + feedback.kind +
        '" role="status">' +
        (feedback.kind === "success"
          ? i18nNode("b", "tutorial.ui.passed")
          : i18nNode("b", "tutorial.ui.retry")) +
        i18nNode("span", feedback.key, feedback.params) + "</p>";
    const ruleNotesMarkup = lesson.ruleNotes === undefined
      ? ""
      : '<div class="lesson-rule-notes">' + lesson.ruleNotes.map((note, noteIndex) => {
        const titleId = `lesson-rule-note-title-${currentLesson}-${noteIndex}`;
        return `<aside class="lesson-rule-note" aria-labelledby="${titleId}">` +
          `<span aria-hidden="true">${escapeHtml(note.mark)}</span><div>` +
          i18nNode("h3", note.titleKey, undefined, ` id="${titleId}"`) +
          i18nNode("p", note.bodyKey) + "</div></aside>";
      }).join("") + "</div>";
    const nextAction = next === null
      ? '<a href="/" class="primary-button">' + i18nNode("span", "tutorial.ui.enterLobby") +
        ' <span aria-hidden="true">→</span></a>'
      : '<button type="button" id="tutorial-next" ' +
        (completed.has(currentLesson) ? "" : "disabled") + ">" +
        i18nNode("span", "tutorial.ui.next") + ' <span aria-hidden="true">→</span></button>';

    tutorialStage.innerHTML = '<article class="lesson-card" data-lesson="' + currentLesson + '">' +
      '<header class="lesson-heading"><div><p class="eyebrow">' + lesson.eyebrow +
      "</p>" + i18nNode("h2", lesson.headingKey, undefined, ' tabindex="-1"') + "</div>" +
      '<span class="lesson-number">' + String(currentLesson + 1).padStart(2, "0") +
      " / " + String(LESSONS.length).padStart(2, "0") + "</span></header>" +
      i18nNode("p", lesson.introKey, undefined, ' class="lesson-intro"') +
      '<p class="lesson-takeaway">' + i18nNode("span", "tutorial.ui.takeawayLabel") +
      i18nNode("b", lesson.takeawayKey) + "</p>" +
      '<section class="lesson-visual">' + lesson.visual() + "</section>" +
      '<ul class="lesson-facts">' +
      lesson.facts.map((fact) => i18nNode("li", fact.key, fact.params)).join("") + "</ul>" +
      ruleNotesMarkup +
      '<section class="lesson-challenge" aria-labelledby="challenge-heading">' +
      "<div><span>FIELD CHECK</span>" +
      i18nNode("h3", lesson.promptKey, undefined, ' id="challenge-heading"') +
      '</div><div class="lesson-choices">' + choices + "</div>" +
      feedbackMarkup + "</section>" +
      '<footer class="lesson-actions"><button type="button" id="tutorial-previous" ' +
      (currentLesson <= 0 ? "disabled" : "") + '><span aria-hidden="true">←</span> ' +
      i18nNode("span", "tutorial.ui.prev") + "</button><span>" +
      (completed.has(currentLesson)
        ? "◆ " + i18nNode("span", "tutorial.ui.done")
        : "○ " + i18nNode("span", "tutorial.ui.notRecorded")) +
      "</span>" + nextAction + "</footer></article>";
    renderProgress();
    const heading = tutorialStage.querySelector("h2");
    if (heading instanceof HTMLElement) heading.focus({ preventScroll: true });
  }

  /** @param {number} index */
  function openLesson(index) {
    if (!activeLessons().includes(index)) return;
    currentLesson = index;
    feedback = null;
    renderLesson();
    tutorialStage.scrollIntoView({
      behavior: document.body.classList.contains("reduce-motion") ||
          globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }

  lessonList.addEventListener("click", (event) => {
    const target = event.target instanceof Element
      ? event.target.closest("[data-open-lesson]")
      : null;
    if (!(target instanceof HTMLButtonElement)) return;
    openLesson(Number(target.dataset.openLesson));
  });

  tutorialStage.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("button, a") : null;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.choice !== undefined) {
      const result = getTutorialFeedback(currentLesson, target.dataset.choice);
      if (result?.kind === "success") {
        completed.add(currentLesson);
        saveProgress();
      }
      feedback = result;
      renderLesson();
      return;
    }
    if (target.id === "tutorial-next") {
      const next = nextLessonIndex();
      if (next !== null) openLesson(next);
      return;
    }
    if (target.id === "tutorial-previous") {
      const previous = currentLesson - 1;
      if (previous >= 0) openLesson(previous);
    }
  });

  document.getElementById("tutorial-reset-progress")?.addEventListener("click", () => {
    completed.clear();
    feedback = null;
    saveProgress();
    renderLesson();
  });

  manualSearch?.addEventListener("input", updateManualSearch);
  document.querySelector(".tutorial-manual-index")?.addEventListener("click", (event) => {
    const anchor = event.target instanceof Element
      ? event.target.closest('a[href^="#manual-"]')
      : null;
    if (!(anchor instanceof HTMLAnchorElement)) return;
    if (manualSearch instanceof HTMLInputElement && manualSearch.value !== "") {
      manualSearch.value = "";
      updateManualSearch();
    }
    revealManualTopic(anchor.hash.replace(/^#manual-/, ""));
  });

  globalThis.addEventListener?.("hashchange", () => {
    const hash = globalThis.location?.hash ?? "";
    if (hash.startsWith("#manual-")) revealManualTopic(hash.replace(/^#manual-/, ""));
  });

  document.addEventListener("darkforest:localechange", () => {
    renderLesson();
    renderProgress();
    updateManualSearch();
  });

  renderLesson();
  updateManualSearch();

  const requestedTopic = new URLSearchParams(globalThis.location?.search ?? "").get("topic") ??
    (globalThis.location?.hash?.startsWith("#manual-")
      ? globalThis.location.hash.replace(/^#manual-/, "")
      : "");
  if (requestedTopic !== "") {
    globalThis.requestAnimationFrame?.(() => revealManualTopic(requestedTopic, true));
  }
}

if (typeof document !== "undefined") initializeTutorial();
