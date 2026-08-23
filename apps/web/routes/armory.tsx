import { ITEM_ART_CATALOG, ITEM_ART_SECTIONS } from "@/lib/item_art.ts";
import type { ItemArtEntry } from "@/lib/item_art.ts";
import {
  ARMORY_ACQUISITION_FALLBACKS,
  ARMORY_RESET_FALLBACKS,
  ARMORY_SHOP_RULE,
  armoryRuleFor,
} from "@/lib/armory_rules.ts";
import BrandMark from "@/components/brand_mark.tsx";
import LocaleSwitcher from "@/components/locale_switcher.tsx";
import PrimaryHeaderNavigation from "@/components/primary_header_navigation.tsx";
import zhTw from "@/locales/zh-TW.json" with { type: "json" };

const ZH_TW_COPY: Readonly<Record<string, string>> = zhTw;

function zhTwCopy(key: string, fallback: string): string {
  return ZH_TW_COPY[key] ?? fallback;
}

const EQUIPMENT_SLOT_ORDER = ["helmet", "jacket", "pants", "gloves", "backpack"] as const;

const LOADOUT_CELLS = [
  {
    slot: "helmet",
    label: "頭盔",
    labelKey: "action.slot.helmet",
    tag: "HELMET",
    href: "#equipment",
    area: "helmet",
  },
  {
    slot: "gloves",
    label: "手套",
    labelKey: "action.slot.gloves",
    tag: "GLOVES",
    href: "#equipment",
    area: "gloves",
  },
  {
    slot: "jacket",
    label: "上身",
    labelKey: "action.slot.jacket",
    tag: "JACKET",
    href: "#equipment",
    area: "jacket",
  },
  {
    slot: "backpack",
    label: "背包",
    labelKey: "action.slot.backpack",
    tag: "PACK",
    href: "#equipment",
    area: "backpack",
  },
  {
    slot: "pants",
    label: "下身",
    labelKey: "action.slot.pants",
    tag: "PANTS",
    href: "#equipment",
    area: "pants",
  },
  {
    slot: "shoes",
    label: "鞋具",
    labelKey: "action.slot.shoes",
    tag: "SHOES",
    href: "#footwear",
    area: "shoes",
  },
] as const;

const CONTACT_WEAPON_OUTLINES = ITEM_ART_CATALOG.filter((entry) =>
  entry.category === "weapon" && entry.outlineIcon !== null
).map((entry) => ({
  kind: entry.kind,
  icon: entry.outlineIcon ?? entry.fieldIcon,
  label: entry.name,
}));

const CONTACT_ARMOR_LEVELS = [
  { level: "light", key: "armory.contact.light", label: "輕裝" },
  { level: "medium", key: "armory.contact.medium", label: "中裝" },
  { level: "heavy", key: "armory.contact.heavy", label: "重裝" },
] as const;

function slotCount(slot: ItemArtEntry["slot"]): number {
  return ITEM_ART_CATALOG.filter((entry) => entry.slot === slot).length;
}

type ArmoryRuleView = ReturnType<typeof armoryRuleFor>;

function ArmoryRulePanel(
  { rule, hoverPreview = false }: { rule: ArmoryRuleView; hoverPreview?: boolean },
) {
  const effect = zhTwCopy(rule.effectKey, rule.effect);
  const detail = zhTwCopy(rule.detailKey, rule.detail);
  return (
    <div
      class={`armory-rule-panel${hoverPreview ? " armory-rule-hover-panel" : ""}`}
      aria-hidden={hoverPreview ? "true" : undefined}
    >
      <section>
        <h4 data-i18n="armory.rule.section.effect">實際作用</h4>
        <p>
          <strong data-i18n={rule.effectKey}>{effect}</strong>
          <span data-i18n={rule.detailKey}>{detail}</span>
        </p>
      </section>
      <section>
        <h4 data-i18n="armory.rule.section.acquisition">取得方式</h4>
        <ul class="armory-source-list">
          {rule.acquisition.map((source) => (
            <li data-i18n={`armory.acquisition.${source}`}>
              {zhTwCopy(
                `armory.acquisition.${source}`,
                ARMORY_ACQUISITION_FALLBACKS[source],
              )}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h4 data-i18n="armory.rule.section.reset">Reset 後</h4>
        <p class="armory-reset-rule">
          <span data-i18n={`armory.reset.${rule.reset}`}>
            {zhTwCopy(`armory.reset.${rule.reset}`, ARMORY_RESET_FALLBACKS[rule.reset])}
          </span>
          {rule.resetValue === undefined ? null : <b>{rule.resetValue}</b>}
        </p>
      </section>
    </div>
  );
}

function ArmoryCard({ entry, code }: { entry: ItemArtEntry; code: string }) {
  const rule = armoryRuleFor(entry.kind);
  const silhouetteKey = `armory.item.${entry.kind}.silhouette`;
  const effect = zhTwCopy(rule.effectKey, rule.effect);
  return (
    <li class="armory-card" data-accent={entry.accent} data-item-kind={entry.kind}>
      <div
        class="armory-art-stage"
        role="img"
        aria-label={entry.silhouette}
        data-i18n-aria-label={silhouetteKey}
      >
        <span class="armory-art-index" aria-hidden="true">{code}</span>
        <img
          class="armory-card-art"
          src={entry.cardArt}
          width="192"
          height="192"
          loading="lazy"
          decoding="async"
          alt=""
          aria-hidden="true"
        />
        <span class="armory-size-preview">
          <img src={entry.fieldIcon} width="48" height="48" alt="" aria-hidden="true" />
          <img src={entry.fieldIcon} width="24" height="24" alt="" aria-hidden="true" />
          <img src={entry.fieldIcon} width="16" height="16" alt="" aria-hidden="true" />
          <small>FIELD READ 48 · 24 · 16</small>
        </span>
      </div>
      <div class="armory-card-copy">
        <div class="armory-card-meta">
          <span class="armory-slot" data-i18n={`armory.slot.${entry.slot}`}>
            {entry.slotLabel}
          </span>
          <span class="armory-rule-live" data-i18n="armory.rule.status.demo">
            展示數值
          </span>
        </div>
        <h3 data-i18n={`item.${entry.kind}`}>{entry.name}</h3>
        <b>{entry.englishName}</b>
        <p class="armory-card-summary" data-i18n={rule.effectKey}>{effect}</p>
        <ul
          class="armory-stat-chips"
          aria-label="基礎數值"
          data-i18n-aria-label="armory.rule.section.baseStats"
        >
          {rule.statChips.map((chip) => (
            <li>
              <small data-i18n={chip.labelKey}>
                {zhTwCopy(chip.labelKey, chip.labelKey.split(".").at(-1) ?? chip.labelKey)}
              </small>
              <b data-i18n={chip.valueKey}>{chip.value}</b>
            </li>
          ))}
        </ul>
        <small class="armory-silhouette">
          <span data-i18n="armory.rule.silhouette">輪廓</span>：
          <span data-i18n={silhouetteKey}>{entry.silhouette}</span>
        </small>
        <details class="armory-rule-details">
          <summary>
            <span data-i18n="armory.rule.details">戰術詳情</span>
            <small class="armory-rule-guide-pointer" data-i18n="armory.rule.guide.pointer">
              滑鼠停留即可預覽
            </small>
            <small class="armory-rule-guide-touch" data-i18n="armory.rule.guide.touch">
              輕觸「戰術詳情」展開
            </small>
          </summary>
          <ArmoryRulePanel rule={rule} />
        </details>
        <ArmoryRulePanel rule={rule} hoverPreview />
      </div>
    </li>
  );
}

export default function ArmoryPage() {
  return (
    <main id="main-content" class="armory-shell">
      <header class="brand-bar armory-brand-bar public-site-header">
        <a
          class="wordmark"
          href="/"
          aria-label="返回大廳"
          data-i18n-aria-label="common.backLobby"
          title="返回大廳"
          data-i18n-title="common.backLobby"
        >
          <BrandMark />
          <span>
            DARKFOREST
            <small>RESET PROTOCOL · FIELD ARMORY</small>
          </span>
        </a>
        <PrimaryHeaderNavigation pathname="/armory" />
        <div class="public-site-utilities">
          <LocaleSwitcher />
        </div>
      </header>

      <section class="armory-hero" aria-labelledby="armory-title">
        <div>
          <p class="eyebrow">
            SURVIVOR FIELD CATALOG · {ITEM_ART_CATALOG.length} / {ITEM_ART_CATALOG.length}
          </p>
          <h1 id="armory-title">
            <span data-i18n="armory.hero.title1">看清輪廓，</span>
            <br />
            <span data-i18n="armory.hero.title2">再決定要不要伸手。</span>
          </h1>
          <p data-i18n="armory.hero.body">
            查看目前可取得的武器、護甲、鞋具、食物、醫療與 Echo
            道具；比較傷害、命中、耐久、地形效果、取得方式與 Reset 後變化。
          </p>
        </div>
        <figure
          class="armory-loadout"
          aria-label="六槽裝備配置示意"
          data-i18n-aria-label="armory.loadout.label"
        >
          <div class="armory-loadout-grid">
            {LOADOUT_CELLS.map((cell) => (
              <a href={cell.href} style={`grid-area: ${cell.area}`}>
                <small>{cell.tag}</small>
                <b data-i18n={cell.labelKey}>{cell.label}</b>
                <span>{String(slotCount(cell.slot)).padStart(2, "0")}</span>
              </a>
            ))}
          </div>
          <figcaption data-i18n="armory.loadout.caption">
            六槽紙娃娃 · 穿上身的裝備不占背包格
          </figcaption>
        </figure>
      </section>

      <section class="armory-contact" aria-labelledby="armory-contact-title">
        <header>
          <p class="eyebrow">FOG CONTACT READ</p>
          <h2 id="armory-contact-title" data-i18n="armory.contact.title">迷霧接觸判讀</h2>
          <p data-i18n="armory.contact.body">
            未辨識的人影只透露兩件事：手上武器的輪廓，和護甲堆出來的體積。這一排 glyph
            與戰局內同源——值不值得打，先從這裡讀起。
          </p>
        </header>
        <div class="armory-contact-demo">
          <figure>
            <div class="armory-contact-glyphs">
              {CONTACT_WEAPON_OUTLINES.map((weapon) => (
                <img
                  src={weapon.icon}
                  width="64"
                  height="64"
                  role="img"
                  alt=""
                  aria-label={weapon.label}
                  data-i18n-aria-label={`item.${weapon.kind}`}
                />
              ))}
            </div>
            <figcaption data-i18n="armory.contact.weapons">
              武器輪廓：開火之前，重量與射程已經曝光
            </figcaption>
          </figure>
          <figure>
            <div class="armory-contact-armor">
              {CONTACT_ARMOR_LEVELS.map((armor) => (
                <span class={`armor-silhouette-${armor.level}`}>
                  <span class="armor-silhouette-mark" aria-hidden="true">
                    <i></i>
                    <i></i>
                    <i></i>
                  </span>
                  <b data-i18n={armor.key}>{armor.label}</b>
                </span>
              ))}
            </div>
            <figcaption data-i18n="armory.contact.armor">
              護甲體積：輕、中、重裝由護甲總值堆疊而成
            </figcaption>
          </figure>
        </div>
      </section>

      <nav class="armory-index" aria-label="跳到圖鑑分類" data-i18n-aria-label="armory.indexLabel">
        {ITEM_ART_SECTIONS.map((section) => (
          <a href={`#${section.id}`}>
            <span>{section.number}</span>
            <b data-i18n={section.titleKey}>{section.title}</b>
            <small>{section.eyebrow}</small>
          </a>
        ))}
      </nav>

      <aside
        class="armory-rule-notice"
        aria-label="圖鑑數值說明"
        data-i18n-aria-label="armory.rule.noticeLabel"
      >
        <span aria-hidden="true">
          DEMO CATALOG · {ITEM_ART_CATALOG.length} / {ITEM_ART_CATALOG.length}
        </span>
        <p data-i18n="armory.rule.baseNotice">
          圖鑑顯示的是基礎命中率；戰局中的地形、姿態、暴露、掩體與迷霧會再修正結果。
        </p>
        <small data-i18n="armory.rule.hint">
          滑鼠停留、鍵盤聚焦或輕觸，即可查看公開展示數值。
        </small>
      </aside>

      <div class="armory-system-notices">
        <section class="armory-progression-notice" aria-labelledby="armory-progression-title">
          <span aria-hidden="true">XP ↑</span>
          <div>
            <h2 id="armory-progression-title" data-i18n="armory.rule.progression.title">
              局內等級
            </h2>
            <p data-i18n="armory.rule.progression.body">
              搜刮、命中、救援、感應與活過 Reset 都會累積經驗；每級提高 HP
              上限。等級只屬於這一局，結束即歸零。
            </p>
          </div>
        </section>
        <section class="armory-injury-notice" aria-labelledby="armory-injury-title">
          <span aria-hidden="true">LIMB +</span>
          <div>
            <h2 id="armory-injury-title" data-i18n="armory.rule.injury.title">
              部位負傷
            </h2>
            <p data-i18n="armory.rule.injury.body">
              戰鬥、滑倒與觸電可能造成腳傷或手傷：腳傷拖慢移動並更易滑倒，手傷降低命中。繃帶治一處（先腳），醫療包全治；Reset
              會洗去所有負傷。
            </p>
          </div>
        </section>
        <section class="armory-shop-notice" aria-labelledby="armory-shop-title">
          <span aria-hidden="true">Field Supply ¤</span>
          <div>
            <header class="armory-shop-heading">
              <div>
                <h2 id="armory-shop-title" data-i18n="armory.rule.shop.title">
                  Field Supply 商店
                </h2>
                <p data-i18n="armory.rule.shop.body">
                  維修環廊（Reset 後＝野地工坊）常駐商店：用局內現金向 Field Supply
                  買彈藥、繃帶、醫療包與少量護甲，也可把不要的東西賣掉換現金。現金來自搜刮發現與擊倒，只在本局有效。特色貨每局限量，賣完就沒有了。
                </p>
              </div>
              <dl class="armory-shop-economy">
                <div>
                  <dt data-i18n="armory.rule.shop.currency">局內現金</dt>
                  <dd>¢</dd>
                </div>
                <div>
                  <dt data-i18n="shop.sell">賣出</dt>
                  <dd>{ARMORY_SHOP_RULE.sellRatio}</dd>
                </div>
                <div>
                  <dt data-i18n="hud.cooldown.aria">冷卻中</dt>
                  <dd>{ARMORY_SHOP_RULE.buyCooldownMs / 1000} s</dd>
                </div>
                <div>
                  <dt data-i18n="armory.rule.stat.noise">噪音</dt>
                  <dd>+{ARMORY_SHOP_RULE.purchaseNoise}</dd>
                </div>
              </dl>
            </header>
            <ul class="armory-shop-catalog">
              {ARMORY_SHOP_RULE.catalog.map((shopItem) => {
                const art = ITEM_ART_CATALOG.find((entry) => entry.kind === shopItem.kind);
                if (art === undefined) throw new Error(`Missing Armory art for ${shopItem.kind}`);
                return (
                  <li data-shop-item={shopItem.kind}>
                    <img src={art.fieldIcon} width="48" height="48" loading="lazy" alt="" />
                    <span>
                      <b data-i18n={`item.${shopItem.kind}`}>{art.name}</b>
                      <small data-i18n="armory.rule.stat.price">價格</small>
                    </span>
                    <span class="armory-shop-price">
                      <small data-i18n="shop.buy">買入</small>
                      <b>¢{shopItem.buyPrice}</b>
                      <small data-i18n="shop.sell">賣出</small>
                      <b>¢{shopItem.sellPrice}</b>
                    </span>
                    <span class="armory-shop-stock">
                      <small aria-hidden="true">▦</small>
                      <b>{shopItem.stockLimit === undefined ? "∞" : `×${shopItem.stockLimit}`}</b>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>

      <div class="armory-catalog">
        {ITEM_ART_SECTIONS.map((section) => {
          const entries = ITEM_ART_CATALOG.filter((entry) => entry.category === section.id);
          const ordered = section.id === "equipment"
            ? EQUIPMENT_SLOT_ORDER.map((slot) => entries.filter((entry) => entry.slot === slot))
              .filter((group) => group.length > 0)
            : [entries];
          let position = 0;
          return (
            <section
              id={section.id}
              class="armory-category"
              aria-labelledby={`${section.id}-title`}
            >
              <header class="armory-category-heading">
                <span>{section.number}</span>
                <div>
                  <p>{section.eyebrow} · {String(entries.length).padStart(2, "0")}</p>
                  <h2 id={`${section.id}-title`} data-i18n={section.titleKey}>
                    {section.title}
                  </h2>
                  <small data-i18n={section.descriptionKey}>{section.description}</small>
                </div>
              </header>
              {ordered.map((group) => (
                <div class="armory-slot-group">
                  {ordered.length > 1 && (
                    <h3 class="armory-slot-group-title">
                      <span data-i18n={`armory.slot.${group[0].slot}`}>{group[0].slotLabel}</span>
                      <small>{String(group.length).padStart(2, "0")}</small>
                    </h3>
                  )}
                  <ul class="armory-grid">
                    {group.map((entry) => {
                      position += 1;
                      return (
                        <ArmoryCard
                          entry={entry}
                          code={`${section.number}.${String(position).padStart(2, "0")}`}
                        />
                      );
                    })}
                  </ul>
                </div>
              ))}
            </section>
          );
        })}
      </div>

      <div class="armory-footer">
        <p data-i18n="armory.rule.footer">
          卡面數值與數值籤直接取自現行平衡設定；物品當下的耐久、數量與狀態仍以戰局介面為準。
        </p>
        <a class="primary-button" href="/">
          <span data-i18n="armory.footerCta">返回大廳並開始對局</span>{" "}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </main>
  );
}
