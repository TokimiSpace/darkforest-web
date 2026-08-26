import { renderToString } from "npm:preact-render-to-string@^6.6.3";
import OfficialIdentityNotice from "@/components/official_identity_notice.tsx";
import Document from "@/routes/_app.tsx";

const ROUTES = [
  "/",
  "/about",
  "/characters",
  "/world",
  "/tutorial",
  "/armory",
  "/leaderboard",
  "/ui-lab",
] as const;
const LOCALES = ["zh-TW", "zh-CN", "ja", "ko", "en", "vi"] as const;
const NOTICE_KEYS = [
  "security.antiFraud.title",
  "security.antiFraud.gmail",
  "security.antiFraud.noPayment",
  "security.antiFraud.verify",
  "security.antiFraud.or",
  "security.antiFraud.verifySuffix",
] as const;

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function RouteStub() {
  return <main id="main-content">Route</main>;
}

Deno.test("all user-facing routes receive one semantic, non-dismissible identity notice", () => {
  for (const pathname of ROUTES) {
    const html = renderToString(
      Document({ Component: RouteStub, url: new URL(`http://localhost${pathname}`) } as never),
    );
    assert(
      (html.match(/class="official-identity-notice"/g) ?? []).length === 1,
      `${pathname} must render exactly one shared identity notice`,
    );
    assert(
      html.includes('role="note"') &&
        html.includes('aria-labelledby="official-identity-notice-title"'),
      `${pathname} must expose the notice as an accessible note`,
    );
    assert(
      html.includes('href="https://tokimi.space/"') &&
        html.includes('href="mailto:ben@tokimi.space"'),
      `${pathname} must use the exact official verification links`,
    );
  }

  const notice = renderToString(<OfficialIdentityNotice />);
  assert(
    !/<(?:button|details|dialog)\b/.test(notice),
    "the notice must not be dismissible or modal",
  );
});

Deno.test("all six shell locales provide the complete anti-fraud warning", async () => {
  for (const locale of LOCALES) {
    const catalog = JSON.parse(
      await Deno.readTextFile(new URL(`../locales/${locale}.json`, import.meta.url)),
    ) as Record<string, unknown>;
    for (const key of NOTICE_KEYS) {
      assert(
        typeof catalog[key] === "string" && catalog[key] !== "",
        `${locale} is missing ${key}`,
      );
    }
    assert(
      String(catalog["security.antiFraud.gmail"]).includes("@gmail.com") &&
        String(catalog["security.antiFraud.gmail"]).includes("Tokimi"),
      `${locale} must identify Gmail impersonation of Tokimi`,
    );
    if (locale === "en") {
      assert(
        catalog["security.antiFraud.gmail"] ===
          "Any @gmail.com address claiming to represent Tokimi is not an official Tokimi contact channel.",
        "English must use the approved identity-verification wording",
      );
    }
  }
});

Deno.test("the notice stays in flow and reserves mobile gameplay space", async () => {
  const styles = await Deno.readTextFile(new URL("../static/styles.css", import.meta.url));
  const noticeStart = styles.indexOf(".official-identity-notice {");
  const appShellStart = styles.indexOf(".app-shell {", noticeStart);
  const baseNoticeStyles = styles.slice(noticeStart, appShellStart);

  assert(noticeStart >= 0 && appShellStart > noticeStart, "identity notice styles are missing");
  assert(
    !/position:\s*(?:fixed|sticky)/.test(baseNoticeStyles) &&
      !/animation(?:-name)?:/.test(baseNoticeStyles),
    "the identity notice must remain in flow and motion-free",
  );
  assert(
    styles.includes("--official-identity-notice-height: 48px") &&
      styles.includes(
        "inset: var(--official-identity-notice-height) 0 calc(44px + env(safe-area-inset-bottom))",
      ) &&
      !/\.official-identity-notice[^{}]*\{[^}]*display:\s*none/s.test(styles),
    "mobile gameplay must reserve visible space for the notice instead of covering or hiding it",
  );
});
