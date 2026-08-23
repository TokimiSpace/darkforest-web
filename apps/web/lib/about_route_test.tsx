import { renderToString } from "npm:preact-render-to-string@^6.6.3";
import AboutPage from "@/routes/about.tsx";
import en from "@/locales/en.json" with { type: "json" };
import ja from "@/locales/ja.json" with { type: "json" };
import ko from "@/locales/ko.json" with { type: "json" };
import vi from "@/locales/vi.json" with { type: "json" };
import zhCN from "@/locales/zh-CN.json" with { type: "json" };
import zhTW from "@/locales/zh-TW.json" with { type: "json" };

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const CATALOGS = {
  "zh-TW": zhTW,
  "zh-CN": zhCN,
  en,
  ja,
  ko,
  vi,
} as const;

function pageHtml() {
  return renderToString(<AboutPage />);
}

Deno.test("About campaign makes the truthful player promise and one conversion path explicit", () => {
  const html = pageHtml();
  assert(html.includes("about-shell about-campaign"), "missing campaign root");
  assert((html.match(/<h1/g) ?? []).length === 1, "campaign must have one h1");
  assert(html.includes('id="about-title"'), "missing page heading");
  assert(html.includes("爆炸不會重開戰局"), "missing Reset promise");
  assert(html.includes("Mega City"), "must explain the city phase");
  assert(html.includes("Explosion Reset"), "must explain the Reset phase");
  assert(html.includes("Darkforest"), "must explain the forest phase");
  assert(html.includes("Rootheart"), "must explain the endgame location");
  assert(html.includes("Arbora"), "must explain the constrained guide");
  assert(html.includes("本機 Fixture Guide"), "must disclose the local demo guide");
  assert(html.includes("最多 24 席"), "must disclose seat capacity and AI fill");
  assert(html.includes("最多約 30 分鐘"), "must disclose match duration");
  assert(html.includes("整點、半點固定開局"), "must disclose scheduled departures");
  assert(
    (html.match(/href="\/#join-form"/g) ?? []).length === 2,
    "hero and final CTA must share the queue destination",
  );
  assert(
    (html.match(/data-marketing-cta="queue"/g) ?? []).length === 2,
    "both queue links must remain measurable",
  );
  assert(html.includes('href="/tutorial"'), "missing low-risk training CTA");
  assert(!html.includes("<footer"), "shared app shell owns the only real footer");
});

Deno.test("About campaign does not overclaim production behavior or expose implementation jargon", () => {
  const html = pageHtml();
  assert(
    html.includes("若在 Reset 前倒下") && html.includes("符合條件的玩家成為 Echo"),
    "Echo claim must be limited to its eligible window",
  );
  assert(
    html.includes("科技貶值") && html.includes("裝備則在爆炸中重新估價") &&
      !html.includes("優勢清零") && !html.includes("裝備與故事會被保存"),
    "Reset must be a checkpoint and repricing event, not a wipe",
  );
  assert(!html.includes("12 個隨機節點"), "must not randomise semantic place identities");
  assert(!html.includes("倒下必成 Echo"), "must not promise universal Echo conversion");
  assert(!html.includes("24 真人"), "AI-filled capacity must not look like 24 humans");
  assert(
    !html.includes("Deno") && !html.includes("Fresh") && !html.includes("Drizzle") &&
      !html.includes("Turso"),
    "the player promise should not lead with implementation technology",
  );
  assert(!html.includes("Preview → Confirm"), "avoid internal interaction jargon");
});

Deno.test("About campaign credits the responsible systems without blurring authority", () => {
  const html = pageHtml();
  assert(html.includes('class="about-campaign-credits"'), "missing production credits");
  assert(
    html.includes("維護與前端") && html.includes("TokimiSpace contributors"),
    "must identify the public repository maintainers",
  );
  assert(
    html.includes("產品與正式服務") && html.includes("TokimiSpace"),
    "must keep the excluded official service under TokimiSpace",
  );
  assert(
    html.includes("展示提示") && html.includes("本機 Fixture Guide"),
    "must identify the fixture-backed demo guide",
  );
  assert(
    html.includes("不發動作、不改數值、不裁定勝負"),
    "must keep the LLM outside combat and outcome authority",
  );
});

Deno.test("About campaign uses only code-native placeholder art within the route budget", async () => {
  const html = pageHtml();
  const imageTags = html.match(/<img\b[^>]*>/g) ?? [];
  assert(imageTags.length === 3, "campaign should load only three meaningful images");
  for (const image of imageTags) {
    assert(/\bwidth="\d+"/.test(image) && /\bheight="\d+"/.test(image), "image needs dimensions");
    assert(/\balt="[^"]+"/.test(image), "meaningful campaign art needs non-empty alt text");
  }
  assert(
    (html.match(/loading="eager"/g) ?? []).length === 1 &&
      (html.match(/fetchpriority="high"/g) ?? []).length === 1,
    "exactly one hero image should receive eager priority",
  );
  assert(
    (html.match(/loading="lazy"/g) ?? []).length === 2,
    "the two below-fold memory plates should be lazy-loaded",
  );
  const assets = [
    {
      source: "../static/art/placeholders/scene.svg",
      publicPath: "/art/placeholders/scene.svg",
    },
    {
      source: "../static/art/placeholders/scene.svg",
      publicPath: "/art/placeholders/scene.svg",
    },
    {
      source: "../static/art/placeholders/scene.svg",
      publicPath: "/art/placeholders/scene.svg",
    },
  ];
  for (const asset of assets) {
    assert(html.includes(asset.publicPath), `missing ${asset.publicPath}`);
    assert(asset.source.endsWith(".svg"), `${asset.source} must remain code-native SVG`);
  }
  const sizes = await Promise.all(
    assets.map(async ({ source }) => (await Deno.stat(new URL(source, import.meta.url))).size),
  );
  assert(sizes[0] <= 250 * 1024, "hero art must stay at or under 250 KiB");
  assert(
    sizes.reduce((sum, size) => sum + size, 0) <= 650 * 1024,
    "About route art must stay at or under 650 KiB",
  );
  assert(
    !html.includes("/art/scenes/") && !html.includes("darkforest-social-card"),
    "campaign must not reuse promo-derived scenes or social metadata art",
  );
});

Deno.test("Every About campaign copy, alt, and aria key exists in all six locales", () => {
  const html = pageHtml();
  const keys = new Set(
    [...html.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)].map((match) => match[1]),
  );
  assert(keys.size >= 70, "campaign should expose the complete localised narrative");
  for (const [locale, catalog] of Object.entries(CATALOGS)) {
    for (const key of keys) {
      const value = (catalog as Record<string, unknown>)[key];
      assert(
        typeof value === "string" && value.trim().length > 0,
        `${locale} is missing non-empty ${key}`,
      );
    }
  }
});
