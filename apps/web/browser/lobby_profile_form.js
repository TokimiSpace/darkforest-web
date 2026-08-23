// @ts-check
/**
 * Standalone demo identity form.
 *
 * Only non-sensitive presentation preferences are persisted. The public client deliberately has
 * no profile API, authentication credential, or server session cache; an integrator can provide an
 * authentication adapter in a separate application when connecting to an authoritative server.
 */
import { t } from "./i18n.js";
import {
  isFaction,
  loadProfileDraft,
  professionFromServerResponse,
  PROFESSIONS,
  saveProfileDraft,
  validateDisplayName,
  validateProfileQuote,
} from "./lobby_profile.js";
import { escapeHtml, profileQuote } from "./view_helpers.js";

/** @typedef {{profileId: string, displayName: string, faction: "rootbound" | "human", profession: "courier" | "scavenger" | "enforcer", victoryQuote?: string, downedQuote?: string, createdAtMs: number}} _Profile */
/** @type {_Profile | null} */
let activeLocalProfile = null;

const profileDisplayNameInput = /** @type {HTMLInputElement} */ (
  document.getElementById("profile-display-name")
);
const profileNameField = /** @type {HTMLElement} */ (profileDisplayNameInput.closest("label"));
const profileNameHint = /** @type {HTMLElement} */ (
  document.getElementById("profile-name-hint")
);
const profileVictoryQuoteInput = /** @type {HTMLInputElement} */ (
  document.getElementById("profile-victory-quote")
);
const profileVictoryQuoteField = /** @type {HTMLElement} */ (
  document.getElementById("profile-victory-quote-field")
);
const profileVictoryQuoteHint = /** @type {HTMLElement} */ (
  document.getElementById("profile-victory-quote-hint")
);
const profileDownedQuoteInput = /** @type {HTMLInputElement} */ (
  document.getElementById("profile-downed-quote")
);
const profileDownedQuoteField = /** @type {HTMLElement} */ (
  document.getElementById("profile-downed-quote-field")
);
const profileDownedQuoteHint = /** @type {HTMLElement} */ (
  document.getElementById("profile-downed-quote-hint")
);
const profileFactionInputs = /** @type {NodeListOf<HTMLInputElement>} */ (
  document.querySelectorAll('input[name="profile-faction"]')
);
const profileProfessionCard = /** @type {HTMLElement} */ (
  document.getElementById("profile-profession-card")
);
const profileFormStatus = /** @type {HTMLElement} */ (
  document.getElementById("profile-form-status")
);
const profileCustomizationDetails = /** @type {HTMLDetailsElement} */ (
  document.getElementById("profile-customization-details")
);

const PROFILE_DRAFT_STORAGE_KEY = "darkforest-profile-draft-v1";

/** @returns {"rootbound" | "human" | null} */
export function selectedFaction() {
  const selected = [...profileFactionInputs].find((input) => input.checked)?.value;
  return isFaction(selected) ? selected : null;
}

/**
 * connectedProfile 是 client.js 擁有的連線狀態,改由參數傳入,本模組不再閉包捕捉它。
 * @param {_Profile | null} connectedProfile
 */
export function activeProfileQuotes(connectedProfile) {
  const profile = connectedProfile ?? activeLocalProfile;
  return {
    victoryQuote: profile === undefined || profile === null
      ? validateProfileQuote(profileVictoryQuoteInput.value).quote
      : profileQuote(profile, "victoryQuote"),
    downedQuote: profile === undefined || profile === null
      ? validateProfileQuote(profileDownedQuoteInput.value).quote
      : profileQuote(profile, "downedQuote"),
  };
}

export function saveCurrentProfileDraft() {
  const serialized = saveProfileDraft({
    displayName: profileDisplayNameInput.value,
    faction: selectedFaction(),
    victoryQuote: profileVictoryQuoteInput.value,
    downedQuote: profileDownedQuoteInput.value,
  });
  if (serialized === null) return;
  try {
    localStorage.setItem(PROFILE_DRAFT_STORAGE_KEY, serialized);
  } catch {
    // Draft persistence is optional; registration is still available.
  }
}

/** @param {string} text @param {"neutral" | "success" | "error"=} tone */
export function setProfileFormStatus(text, tone = "neutral") {
  profileFormStatus.textContent = text;
  profileFormStatus.className = `profile-form-status${tone === "neutral" ? "" : ` is-${tone}`}`;
}

/** @param {_Profile | null} profile */
export function renderProfession(profile) {
  const profession = profile === null ? null : professionFromServerResponse(profile);
  if (profession === null) {
    profileProfessionCard.removeAttribute("data-profession");
    profileProfessionCard.innerHTML =
      `<span class="profession-mark" aria-hidden="true">?</span><span><b>${
        escapeHtml(t("lobby.profile.professionHiddenTitle"))
      }</b><small>${escapeHtml(t("lobby.profile.professionHidden"))}</small></span>`;
    return;
  }
  const metadata = PROFESSIONS[profession];
  const mark = profession === "courier" ? "C" : profession === "scavenger" ? "S" : "E";
  profileProfessionCard.dataset.profession = profession;
  profileProfessionCard.innerHTML =
    `<span class="profession-mark" aria-hidden="true">${mark}</span><span><b>${
      escapeHtml(t(metadata.labelKey))
    } · ${escapeHtml(t(metadata.assignmentLabelKey))}</b><small>${
      escapeHtml(`${t(metadata.descriptionKey)} ${t("lobby.profile.roleRule")}`)
    }</small></span>`;
}

export function restoreProfileForm() {
  let draft = loadProfileDraft(null);
  try {
    draft = loadProfileDraft(localStorage.getItem(PROFILE_DRAFT_STORAGE_KEY));
  } catch {
    // Keep the empty draft.
  }
  const source = draft;
  profileDisplayNameInput.value = source.displayName;
  const faction = source.faction ?? "human";
  profileFactionInputs.forEach((input) => input.checked = input.value === faction);
  profileVictoryQuoteInput.value = draft.victoryQuote;
  profileDownedQuoteInput.value = draft.downedQuote;
  activeLocalProfile = null;
  renderProfession(null);
}

/** @param {boolean} revealError */
export function validateProfileForm(revealError) {
  const validation = validateDisplayName(profileDisplayNameInput.value);
  const victoryQuote = validateProfileQuote(profileVictoryQuoteInput.value);
  const downedQuote = validateProfileQuote(profileDownedQuoteInput.value);
  const faction = selectedFaction();
  const errorText = validation.error === "TOO_SHORT"
    ? t("lobby.profile.nameTooShort")
    : validation.error === "TOO_LONG"
    ? t("lobby.profile.nameTooLong")
    : validation.error === "CONTROL_CHARACTER"
    ? t("lobby.profile.nameControlCharacter")
    : t("lobby.profile.nameInvalid");
  profileNameField.classList.toggle("is-invalid", revealError && !validation.ok);
  profileDisplayNameInput.setAttribute("aria-invalid", String(revealError && !validation.ok));
  profileNameHint.textContent = revealError && !validation.ok
    ? errorText
    : t("lobby.profile.nameHint");
  /**
   * @param {HTMLElement} field
   * @param {HTMLElement} hint
   * @param {ReturnType<typeof validateProfileQuote>} quote
   * @param {"victory" | "downed"} key
   */
  const renderQuoteError = (field, hint, quote, key) => {
    const invalid = !quote.ok;
    field.classList.toggle("is-invalid", revealError && invalid);
    const input = key === "victory" ? profileVictoryQuoteInput : profileDownedQuoteInput;
    input.setAttribute("aria-invalid", String(revealError && invalid));
    hint.textContent = invalid
      ? t(quote.error === "TOO_LONG" ? "lobby.profile.quoteTooLong" : "lobby.profile.quoteInvalid")
      : t("lobby.profile.quoteHint");
  };
  renderQuoteError(profileVictoryQuoteField, profileVictoryQuoteHint, victoryQuote, "victory");
  renderQuoteError(profileDownedQuoteField, profileDownedQuoteHint, downedQuote, "downed");
  if (profileCustomizationDetails && revealError && (!victoryQuote.ok || !downedQuote.ok)) {
    profileCustomizationDetails.open = true;
  }
  if (!validation.ok || !victoryQuote.ok || !downedQuote.ok || faction === null) return null;
  return {
    displayName: validation.displayName,
    faction,
    victoryQuote: victoryQuote.quote,
    downedQuote: downedQuote.quote,
  };
}

export function syncProfileDraftPresentation() {
  saveCurrentProfileDraft();
  const validation = validateDisplayName(profileDisplayNameInput.value);
  const faction = selectedFaction();
  const matchingProfile = activeLocalProfile !== null && validation.ok &&
      activeLocalProfile.displayName === validation.displayName &&
      activeLocalProfile.faction === faction
    ? activeLocalProfile
    : null;
  renderProfession(matchingProfile);
  setProfileFormStatus(
    matchingProfile === null ? "" : t("lobby.profile.ready", { name: matchingProfile.displayName }),
    matchingProfile === null ? "neutral" : "success",
  );
}

/**
 * Build an in-memory demo profile. This function intentionally performs no HTTP request and
 * returns no credential. The transport token, when an integrator opts into live mode, remains an
 * explicit runtime input and is never persisted by this module.
 * @returns {_Profile}
 */
export function ensureLocalProfile() {
  const draft = validateProfileForm(true);
  if (draft === null) throw new Error("PROFILE_INVALID");
  profileDisplayNameInput.value = draft.displayName;
  saveCurrentProfileDraft();
  const profession = draft.faction === "rootbound" ? "scavenger" : "courier";
  activeLocalProfile = {
    profileId: "local-demo",
    displayName: draft.displayName,
    faction: draft.faction,
    profession,
    victoryQuote: draft.victoryQuote,
    downedQuote: draft.downedQuote,
    createdAtMs: 0,
  };
  renderProfession(activeLocalProfile);
  setProfileFormStatus(
    t("lobby.profile.assigned", {
      name: activeLocalProfile.displayName,
      profession: t(PROFESSIONS[activeLocalProfile.profession].labelKey),
    }),
    "success",
  );
  return activeLocalProfile;
}

/** 入席流程鎖定/解鎖表單欄位;元素由本模組持有,呼叫端不需要自己抓 DOM。 @param {boolean} locked */
export function setProfileFieldsDisabled(locked) {
  profileDisplayNameInput.disabled = locked;
  profileVictoryQuoteInput.disabled = locked;
  profileDownedQuoteInput.disabled = locked;
  profileFactionInputs.forEach((input) => input.disabled = locked);
}

/** 角色建立失敗時把焦點送回第一個出錯的欄位。 */
export function focusInvalidProfileField() {
  const target = [
    profileDisplayNameInput,
    profileVictoryQuoteInput,
    profileDownedQuoteInput,
  ].find((input) => input.getAttribute("aria-invalid") === "true") ?? profileFactionInputs[0];
  if (
    profileCustomizationDetails &&
    (target === profileVictoryQuoteInput || target === profileDownedQuoteInput)
  ) {
    profileCustomizationDetails.open = true;
  }
  target?.focus();
  target?.scrollIntoView({ block: "center" });
}

/** 綁定表單自身的輸入/失焦/陣營切換行為。 */
export function bindProfileFormListeners() {
  profileDisplayNameInput.addEventListener("input", () => {
    validateProfileForm(false);
    syncProfileDraftPresentation();
  });
  profileDisplayNameInput.addEventListener("blur", () => {
    validateProfileForm(profileDisplayNameInput.value.length > 0);
  });
  profileVictoryQuoteInput.addEventListener("input", () => {
    validateProfileForm(false);
    syncProfileDraftPresentation();
  });
  profileVictoryQuoteInput.addEventListener("blur", () => {
    validateProfileForm(profileVictoryQuoteInput.value.length > 0);
  });
  profileDownedQuoteInput.addEventListener("input", () => {
    validateProfileForm(false);
    syncProfileDraftPresentation();
  });
  profileDownedQuoteInput.addEventListener("blur", () => {
    validateProfileForm(profileDownedQuoteInput.value.length > 0);
  });
  profileFactionInputs.forEach((input) => {
    input.addEventListener("change", () => {
      syncProfileDraftPresentation();
    });
  });
}
