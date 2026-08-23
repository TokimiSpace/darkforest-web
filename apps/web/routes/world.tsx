import BrandMark from "@/components/brand_mark.tsx";
import LocaleSwitcher from "@/components/locale_switcher.tsx";
import PrimaryHeaderNavigation from "@/components/primary_header_navigation.tsx";
import { WORLD_PLACES, type WorldPlacePair } from "@/lib/world_places.ts";
import type { Tag } from "@darkforest/protocol";

const TAG_FALLBACK: Record<Tag, string> = {
  CRAMPED: "狹窄",
  COVERED: "掩體處處",
  OPEN: "開闊無遮",
  DENSE: "草木深密",
  DARK: "一片漆黑",
  DEBRIS: "瓦礫遍地",
  WET: "積水反光",
  MUD: "泥濘難行",
  POWERED: "電流嗡鳴",
};

const ENVIRONMENT_GROUPS = [
  {
    id: "distance",
    tags: ["CRAMPED", "OPEN"],
    title: "距離決定武器",
    body: "狹窄處讓近身武器容易施展；開闊地給遠程與大幅揮擊更多空間，也讓你更難從視線中消失。",
  },
  {
    id: "concealment",
    tags: ["COVERED", "DENSE", "DARK"],
    title: "看不見不等於沒有人",
    body: "掩體、深密植被與黑暗會改變藏匿與辨識。先看輪廓、Signal 與 Preview，再決定要不要出手。",
  },
  {
    id: "footing",
    tags: ["WET", "MUD", "DEBRIS"],
    title: "地面也在參戰",
    body: "濕地、泥地與碎片會拖慢、滑倒或暴露你。鞋具能改變部分結果，卻不能把危險全部抹掉。",
  },
  {
    id: "energy",
    tags: ["POWERED", "WET"],
    title: "水與電會彼此放大",
    body: "供電設施本身不是陷阱；它與積水共存時才可能形成導電危險。未知從來不等於安全。",
  },
] as const satisfies readonly {
  id: string;
  tags: readonly Tag[];
  title: string;
  body: string;
}[];

function TagChip({ tag }: { tag: Tag }) {
  return (
    <span class={`world-tag is-${tag.toLowerCase()}`}>
      <i aria-hidden="true" />
      <span data-i18n={`tag.${tag}`}>{TAG_FALLBACK[tag]}</span>
    </span>
  );
}

function PlaceFace(
  { place, phase }: { place: WorldPlacePair["before"] | WorldPlacePair["after"]; phase: string },
) {
  return (
    <figure class={`world-place-face is-${phase}`}>
      <img
        src={place.art}
        width="1600"
        height="900"
        loading="lazy"
        decoding="async"
        alt=""
        aria-hidden="true"
        data-authoritative="false"
      />
      <figcaption>
        <span data-i18n={`world.phase.${phase}.short`}>
          {phase === "before" ? "爆炸前" : "爆炸後"}
        </span>
        <b data-i18n={place.nameKey}>{place.name}</b>
      </figcaption>
    </figure>
  );
}

function PlaceCard({ place }: { place: WorldPlacePair }) {
  return (
    <article
      id={`world-place-${place.id}`}
      class="world-place-card"
      data-memory-pair={place.id}
    >
      <div class="world-place-visual" aria-hidden="true">
        <PlaceFace place={place.before} phase="before" />
        <span class="world-place-fracture">RESET</span>
        <PlaceFace place={place.after} phase="after" />
      </div>
      <div class="world-place-copy">
        <header>
          <p data-i18n="world.atlas.memoryPair">MEMORY PAIR · 同一處傷痕</p>
          <h3>
            <span data-i18n={place.before.nameKey}>{place.before.name}</span>
            <i aria-hidden="true">→</i>
            <span data-i18n={place.after.nameKey}>{place.after.name}</span>
          </h3>
          <span class="world-cover-count">
            <span data-i18n="world.atlas.cover">掩體槽</span>
            <b>{place.coverSlots}</b>
          </span>
        </header>
        <div class="world-place-tags">
          <div>
            <span data-i18n="world.phase.before.short">爆炸前</span>
            {place.before.tags.map((tag) => <TagChip key={tag} tag={tag} />)}
          </div>
          <div>
            <span data-i18n="world.phase.after.short">爆炸後</span>
            {place.after.tags.map((tag) => <TagChip key={tag} tag={tag} />)}
          </div>
        </div>
        <div class="world-place-notes">
          <p>
            <strong data-i18n="world.atlas.storyLabel">這裡記得——</strong>
            <span data-i18n={`world.place.${place.id}.story`}>{place.story}</span>
          </p>
          <p>
            <strong data-i18n="world.atlas.tacticLabel">進場先讀——</strong>
            <span data-i18n={`world.place.${place.id}.tactic`}>{place.tactic}</span>
          </p>
        </div>
      </div>
    </article>
  );
}

function TopologyFigure() {
  return (
    <figure
      class="world-topology"
      data-authoritative="false"
      aria-labelledby="world-topology-title world-topology-note"
    >
      <svg viewBox="0 0 720 430" role="img" aria-hidden="true">
        <g class="world-topology-routes">
          <path d="M110 94 226 64 278 154 168 194Z" />
          <path d="M110 94 278 154M226 64 168 194" />
          <path d="M454 66 570 100 548 204 426 176Z" />
          <path d="M454 66 548 204M570 100 426 176" />
          <path d="M212 286 330 238 412 304 300 370Z" />
          <path d="M212 286 412 304M330 238 300 370" />
          <path d="M278 154 426 176M548 204 412 304M212 286 168 194" />
        </g>
        <g class="world-topology-nodes">
          {[
            [110, 94],
            [226, 64],
            [278, 154],
            [168, 194],
            [454, 66],
            [570, 100],
            [548, 204],
            [426, 176],
            [212, 286],
            [330, 238],
            [412, 304],
            [300, 370],
          ].map(([cx, cy], index) => (
            <g key={index} transform={`translate(${cx} ${cy})`}>
              <circle r={index === 0 ? 22 : 16} />
              {index === 0 ? <path d="M-8 2 0-10 8 2 0 12Z" /> : null}
            </g>
          ))}
        </g>
        <path class="world-topology-fracture" d="m364 18-26 72 34 46-31 68 33 50-29 68 25 90" />
      </svg>
      <figcaption>
        <p id="world-topology-title">
          <span data-i18n="world.topology.kicker">GENERATION GRAMMAR</span>
          <strong data-i18n="world.topology.title">記住地點，不要背路線。</strong>
        </p>
        <p id="world-topology-note" data-i18n="world.topology.note">
          這是生成規則示意，不是本局地圖。12 個地點都會出現，但位置、相鄰關係與封鎖順序每局重組。
        </p>
        <dl>
          <div>
            <dt>12</dt>
            <dd data-i18n="world.topology.sites">語意地點</dd>
          </div>
          <div>
            <dt>17</dt>
            <dd data-i18n="world.topology.routes">初始路線</dd>
          </div>
          <div>
            <dt>2 → 2</dt>
            <dd data-i18n="world.topology.reset">崩塌／根系</dd>
          </div>
          <div>
            <dt>4</dt>
            <dd data-i18n="world.topology.final">終局地點</dd>
          </div>
        </dl>
      </figcaption>
    </figure>
  );
}

export default function WorldPage() {
  return (
    <main id="main-content" class="world-shell" data-world-page>
      <header class="brand-bar world-brand-bar public-site-header">
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
            <small>RESET PROTOCOL · WORLD ATLAS</small>
          </span>
        </a>
        <PrimaryHeaderNavigation pathname="/world" />
        <div class="public-site-utilities">
          <LocaleSwitcher />
        </div>
      </header>

      <section class="world-hero" aria-labelledby="world-title">
        <div class="world-hero-copy">
          <p class="eyebrow" data-i18n="world.hero.eyebrow">
            WORLD ATLAS · 一座城市的兩次記憶
          </p>
          <h1 id="world-title">
            <span data-i18n="world.hero.title1">地點沒有消失。</span>
            <br />
            <span data-i18n="world.hero.title2">它們只是學會了另一種活法。</span>
          </h1>
          <p data-i18n="world.hero.body">
            每局都有同樣 12 處記憶，卻沒有同一張路線圖。Mega City 的用途、危險與權力關係，會在
            Explosion Reset 之後被 Darkforest 重新解讀。
          </p>
          <div class="world-hero-actions">
            <a class="primary-button" href="#memory-atlas">
              <span data-i18n="world.hero.atlas">翻閱 12 組地點</span>
              <span aria-hidden="true">↓</span>
            </a>
            <a class="header-link" href="/tutorial" data-i18n="world.hero.training">
              先學會怎麼活下來
            </a>
          </div>
        </div>
        <TopologyFigure />
      </section>

      <section class="world-phases" aria-labelledby="world-phases-title">
        <header>
          <p class="eyebrow" data-i18n="world.phases.eyebrow">ONE MATCH · THREE READINGS</p>
          <h2 id="world-phases-title" data-i18n="world.phases.title">
            爆炸不是換地圖，是同一處傷口改變意義。
          </h2>
        </header>
        <ol>
          <li class="is-before">
            <span>01</span>
            <div>
              <p data-i18n="world.phases.before.kicker">BEFORE · MEGA CITY</p>
              <h3 data-i18n="world.phases.before.title">文明仍在假裝運作</h3>
              <p data-i18n="world.phases.before.body">
                電力、物流、廣播與階級替每個空間規定用途；危險通常被乾淨表面和制度藏起來。
              </p>
            </div>
          </li>
          <li class="is-reset">
            <span>02</span>
            <div>
              <p data-i18n="world.phases.reset.kicker">CHECKPOINT · EXPLOSION RESET</p>
              <h3 data-i18n="world.phases.reset.title">留下選擇，改寫價值</h3>
              <p data-i18n="world.phases.reset.body">
                Legacy 與事件痕跡被保留；兩條舊路崩塌、兩條根系路開啟，Echo 帶著情報回到局內。
              </p>
            </div>
          </li>
          <li class="is-after">
            <span>03</span>
            <div>
              <p data-i18n="world.phases.after.kicker">AFTER · DARKFOREST</p>
              <h3 data-i18n="world.phases.after.title">自然接管城市的骨架</h3>
              <p data-i18n="world.phases.after.body">
                管線成為根脈、月台成為樹橋。熟悉的 Landmark 還在，原本熟悉的優勢卻不再可靠。
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section id="memory-atlas" class="world-atlas" aria-labelledby="world-atlas-title">
        <header>
          <div>
            <p class="eyebrow" data-i18n="world.atlas.eyebrow">12 MEMORY PAIRS · 每局全數出現</p>
            <h2 id="world-atlas-title" data-i18n="world.atlas.title">同一地標，兩種生存讀法。</h2>
          </div>
          <p data-i18n="world.atlas.body">
            地名與環境性格固定，位置與鄰接關係不固定。以下是世界檔案，不是本局攻略圖。
          </p>
        </header>
        <div class="world-atlas-grid">
          {WORLD_PLACES.map((place) => <PlaceCard key={place.id} place={place} />)}
        </div>
      </section>

      <section class="world-environment" aria-labelledby="world-environment-title">
        <header>
          <p class="eyebrow" data-i18n="world.environment.eyebrow">READ THE GROUND</p>
          <h2 id="world-environment-title" data-i18n="world.environment.title">
            地區不是背景；它正在計算你。
          </h2>
          <p data-i18n="world.environment.body">
            九種公開標籤會影響武器、藏匿、移動與危險。先讀地面與輪廓，再讀勝算。
          </p>
        </header>
        <ul>
          {ENVIRONMENT_GROUPS.map((group) => (
            <li key={group.id} class={`is-${group.id}`}>
              <div class="world-environment-tags">
                {group.tags.map((tag) => <TagChip key={tag} tag={tag} />)}
              </div>
              <h3 data-i18n={`world.environment.${group.id}.title`}>{group.title}</h3>
              <p data-i18n={`world.environment.${group.id}.body`}>{group.body}</p>
            </li>
          ))}
        </ul>
        <a class="header-link" href="/armory" data-i18n="world.environment.fullRules">
          到軍械圖鑑查看完整地形修正 →
        </a>
      </section>

      <div class="world-footer">
        <div>
          <p class="eyebrow" data-i18n="world.footer.eyebrow">THE MAP WILL NOT WAIT</p>
          <p data-i18n="world.footer.body">記住地點留下的傷痕，進場後再決定走哪一條路。</p>
        </div>
        <div>
          <a class="header-link" href="/characters" data-i18n="world.footer.characters">
            認識走過這些地點的人
          </a>
          <a class="primary-button" href="/" data-i18n="world.footer.play">進入下一班戰局</a>
        </div>
      </div>
    </main>
  );
}
