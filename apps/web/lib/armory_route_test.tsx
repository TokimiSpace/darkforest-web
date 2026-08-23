import { renderToString } from "npm:preact-render-to-string@^6.6.3";
import ArmoryPage from "@/routes/armory.tsx";
import { ARMORY_SHOP_RULE } from "./armory_rules.ts";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test("Armory renders every public-demo item with a semantic details panel", () => {
  const html = renderToString(<ArmoryPage />);
  const cards = html.match(/data-item-kind=/g) ?? [];
  assert(cards.length === 28, `expected 28 demo cards, got ${cards.length}`);
  assert(!html.includes("PROTOCOL PENDING"), "demo weapons must not remain concept cards");
  assert(
    (html.match(/class="armory-card-art" src="\/art\/icons\//g) ?? []).length === 28,
    "every demo card must render its code-native public icon",
  );
  assert(
    (html.match(/class="armory-card-art"[^>]*loading="lazy"[^>]*decoding="async"/g) ?? [])
      .length === 28,
    "detail art must stay route-lazy and async-decoded",
  );

  const detailsStart = html.indexOf('<details class="armory-rule-details">');
  const detailsEnd = html.indexOf("</details>", detailsStart);
  const semanticPanel = html.indexOf('<div class="armory-rule-panel"', detailsStart);
  assert(detailsStart >= 0 && detailsEnd > detailsStart, "missing native details control");
  assert(
    semanticPanel > detailsStart && semanticPanel < detailsEnd,
    "the expanded rule panel must be a child of its details element",
  );
  assert(
    html.includes('class="armory-rule-panel armory-rule-hover-panel" aria-hidden="true"'),
    "desktop hover preview must be a separate, assistive-technology-hidden projection",
  );
});

Deno.test("Armory exposes localized labels for rule notes and silhouettes", () => {
  const html = renderToString(<ArmoryPage />);
  assert(
    html.includes('data-i18n-aria-label="armory.rule.noticeLabel"'),
    "rule notice needs a localized accessible name",
  );
  assert(
    html.includes('data-i18n="armory.rule.silhouette"'),
    "silhouette label needs a localized key",
  );
  assert(
    html.includes('data-i18n-aria-label="armory.item.cleaver.silhouette"'),
    "live weapon art needs a localized silhouette description",
  );
  assert(
    html.includes('data-i18n="armory.rule.progression.title"') &&
      html.includes('data-i18n="armory.rule.progression.body"'),
    "the armory must explain in-match progression with the seeded six-locale copy",
  );
  assert(
    html.includes('data-i18n="armory.rule.injury.title"') &&
      html.includes('data-i18n="armory.rule.injury.body"'),
    "the armory must explain limb injuries with the seeded six-locale copy",
  );
  assert(
    html.includes('data-i18n="armory.rule.shop.title"') &&
      html.includes('data-i18n="armory.rule.shop.body"') &&
      html.includes('data-i18n="armory.rule.shop.currency"'),
    "the armory must explain Field Supply shop economy with seeded six-locale copy",
  );
  assert(
    html.includes('data-i18n="armory.rule.stat.curesInjury"'),
    "recovery cards must expose their injury-cure stat",
  );
  assert(
    html.includes("查看目前可取得的武器、護甲、鞋具、食物、醫療與 Echo"),
    "the hero should lead with player-facing equipment intent",
  );
  assert(
    !html.includes("目前戰局契約裡全部武器") && !html.includes("能在 16px 快速辨識"),
    "the hero should not expose internal version or art-production language",
  );
});

Deno.test("Armory renders the complete public-demo supply catalog without a second price table", () => {
  const html = renderToString(<ArmoryPage />);
  const rows = html.match(/data-shop-item=/g) ?? [];
  assert(
    rows.length === ARMORY_SHOP_RULE.catalog.length,
    `expected ${ARMORY_SHOP_RULE.catalog.length} shop rows, got ${rows.length}`,
  );
  for (const entry of ARMORY_SHOP_RULE.catalog) {
    assert(html.includes(`data-shop-item="${entry.kind}"`), `missing ${entry.kind} shop row`);
    assert(html.includes(`¢${entry.buyPrice}`), `missing ${entry.kind} buy price`);
    assert(html.includes(`¢${entry.sellPrice}`), `missing ${entry.kind} sell price`);
  }
  assert(
    html.includes('data-i18n="armory.rule.stat.price"'),
    "catalog price label must remain localized",
  );
});
