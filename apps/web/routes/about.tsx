import BrandMark from "@/components/brand_mark.tsx";
import LocaleSwitcher from "@/components/locale_switcher.tsx";
import PrimaryHeaderNavigation from "@/components/primary_header_navigation.tsx";

const FACTS = [
  "noDownload",
  "duration",
  "schedule",
  "capacity",
] as const;

const PHASES = ["megacity", "reset", "darkforest"] as const;
const GAMEPLAY_ACTIONS = ["route", "observe", "fight", "semi"] as const;
const INNOVATIONS = ["01", "02", "03"] as const;
const TRUST_SYSTEMS = ["01", "02", "03"] as const;

const CREDITS = [
  {
    role: "about.credits.ui.role",
    name: "about.credits.ui.name",
    body: "about.credits.ui.body",
    roleFallback: "維護與前端",
    nameFallback: "TokimiSpace contributors",
    bodyFallback: "由 TokimiSpace 貢獻者維護、審查並承擔發布責任；開發過程使用了 AI 輔助工具。",
  },
  {
    role: "about.credits.game.role",
    name: "about.credits.game.name",
    body: "about.credits.game.body",
    roleFallback: "產品與正式服務",
    nameFallback: "TokimiSpace",
    bodyFallback: "TokimiSpace 維護產品方向與未包含在此 repo 的正式服務。",
  },
  {
    role: "about.credits.llm.role",
    name: "about.credits.llm.name",
    body: "about.credits.llm.body",
    roleFallback: "展示提示",
    nameFallback: "本機 Fixture Guide",
    bodyFallback: "以固定 fixture 回應展示 Echo 與 Arbora 介面；不連接外部服務。",
  },
] as const;

function MarketingCta(
  { className = "", compact = false }: {
    className?: string;
    compact?: boolean;
  },
) {
  return (
    <a
      class={`about-campaign-cta about-campaign-cta-primary ${className}`}
      href="/#join-form"
      data-marketing-cta="queue"
    >
      <span data-i18n="about.hero.play">查看下一班戰局</span>
      <span aria-hidden="true">→</span>
      {!compact && (
        <small data-i18n="about.hero.playHint">
          提早五分鐘入座，也可以先觀戰
        </small>
      )}
    </a>
  );
}

export default function AboutPage() {
  return (
    <main id="main-content" class="about-shell about-campaign">
      <header class="brand-bar about-brand-bar public-site-header">
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
            <b>DARKFOREST</b>
            <small>RESET PROTOCOL</small>
          </span>
        </a>
        <PrimaryHeaderNavigation pathname="/about" />
        <div class="public-site-utilities">
          <LocaleSwitcher />
        </div>
      </header>

      <section
        class="about-campaign-hero"
        aria-labelledby="about-title"
      >
        <figure class="about-campaign-hero-art">
          <img
            src="/art/placeholders/scene.svg"
            width="1536"
            height="1024"
            alt="同一座城市廣場被 Explosion Reset 斷層分隔，左側為 Mega City，右側為 Darkforest"
            data-i18n-alt="about.hero.artAlt"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <span
            class="about-campaign-scar"
            data-scar-label="RESET"
            aria-hidden="true"
          />
          <figcaption class="about-campaign-art-caption">
            <span data-i18n="about.hero.artCaption">
              原創場景概念：同一座城市跨越 Explosion Reset 的兩段記憶
            </span>
          </figcaption>
        </figure>

        <div class="about-campaign-hero-copy">
          <p
            class="about-campaign-eyebrow"
            data-i18n="about.hero.eyebrow"
          >
            同一局，兩個世界
          </p>
          <h1 id="about-title">
            <span data-i18n="about.hero.title1">爆炸不會重開戰局。</span>
            <span data-i18n="about.hero.title2">它只會重寫誰能活到最後。</span>
          </h1>
          <p class="about-campaign-lede" data-i18n="about.hero.body">
            一場免下載、最多約 30 分鐘的網頁大逃殺。先在 Mega City 求生；若在 Reset 前倒下，你會成為
            Echo 蒐集情報，並在 Darkforest 帶著不同的翻盤路線回歸。
          </p>
          <p
            class="about-campaign-status"
            data-i18n="about.hero.status"
          >
            免下載 · 最多約 30 分鐘 · 整點與半點發車
          </p>
          <div class="about-campaign-actions">
            <MarketingCta />
            <a
              class="about-campaign-cta about-campaign-cta-secondary"
              href="/tutorial"
            >
              <span data-i18n="about.hero.learn">先看兩分鐘教學</span>
            </a>
          </div>
        </div>
      </section>

      <section
        class="about-campaign-facts"
        aria-label="戰局摘要"
        data-i18n-aria-label="about.facts.aria"
      >
        {FACTS.map((fact) => (
          <p key={fact}>
            <span aria-hidden="true" />
            <b data-i18n={`about.facts.${fact}`}>
              {fact === "noDownload"
                ? "瀏覽器直接玩，不用下載"
                : fact === "duration"
                ? "每局最長約 30 分鐘"
                : fact === "schedule"
                ? "整點、半點固定開局"
                : "最多 24 席，空位由 AI 補齊"}
            </b>
          </p>
        ))}
      </section>

      <section
        class="about-campaign-section about-campaign-flow"
        aria-labelledby="about-flow-title"
      >
        <header class="about-campaign-section-heading">
          <p class="about-campaign-eyebrow" data-i18n="about.flow.eyebrow">
            THE RESET LOOP
          </p>
          <h2 id="about-flow-title" data-i18n="about.flow.title">
            你不是重玩第二局，而是活過同一場災難
          </h2>
          <p data-i18n="about.flow.body">
            第一階段的選擇、Legacy
            與故事會留下；裝備則在爆炸中重新估價，科技貶值、路線換牌，讓不同玩家在後半場取得新的籌碼。
          </p>
        </header>

        <ol class="about-campaign-flow-track">
          {PHASES.map((phase, index) => (
            <li
              key={phase}
              class={`about-campaign-phase about-campaign-phase-${phase}`}
            >
              <span class="about-campaign-phase-index" aria-hidden="true">
                0{index + 1}
              </span>
              <p data-i18n={`about.flow.${phase}.kicker`}>
                {phase === "megacity" ? "EXPLORE" : phase === "reset" ? "CHECKPOINT" : "RETURN"}
              </p>
              <h3 data-i18n={`about.flow.${phase}.title`}>
                {phase === "megacity"
                  ? "Mega City：搶先準備"
                  : phase === "reset"
                  ? "Explosion Reset：優勢被改寫"
                  : "Darkforest：帶著另一種勝法回來"}
              </h3>
              <p data-i18n={`about.flow.${phase}.body`}>
                {phase === "megacity"
                  ? "搜刮、移動、交戰；你做過的每件事都會留下痕跡。"
                  : phase === "reset"
                  ? "Legacy 封存選擇，Echo 把災難前的情報變成後半場優勢。"
                  : "地形與路線重組，獨活或與 Arbora 立約，都是可被打斷的終局。"}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section
        class="about-campaign-section about-campaign-memory"
        aria-labelledby="about-memory-title"
      >
        <header class="about-campaign-section-heading about-campaign-section-heading-compact">
          <p
            class="about-campaign-eyebrow"
            data-i18n="about.reset.eyebrow"
          >
            MEMORY CONTINUITY
          </p>
          <h2 id="about-memory-title" data-i18n="about.reset.title">
            同一個地方，不再遵守同一套規則
          </h2>
          <p data-i18n="about.reset.body">
            城市崩壞後，掩體、路線與危險都被重新排列；高科技裝備不再保證勝利，但第一階段的選擇仍會跟著你。
          </p>
        </header>

        <figure class="about-campaign-memory-pair">
          <div>
            <img
              src="/art/placeholders/scene.svg"
              width="1600"
              height="900"
              loading="lazy"
              decoding="async"
              alt="Mega City 的議會尖塔：秩序仍在運作的高層城市節點"
              data-i18n-alt="about.reset.beforeAlt"
            />
            <p>
              <span data-i18n="about.reset.beforeKicker">BEFORE</span>
              <b data-i18n="about.reset.beforeTitle">Mega City · 議會尖塔</b>
            </p>
          </div>
          <span class="about-campaign-memory-seam" aria-hidden="true">
            RESET
          </span>
          <div>
            <img
              src="/art/placeholders/scene.svg"
              width="1600"
              height="900"
              loading="lazy"
              decoding="async"
              alt="Darkforest 的冠層尖塔：被根系、積水與黑暗改寫的同源節點"
              data-i18n-alt="about.reset.afterAlt"
            />
            <p>
              <span data-i18n="about.reset.afterKicker">AFTER</span>
              <b data-i18n="about.reset.afterTitle">Darkforest · 冠層尖塔</b>
            </p>
          </div>
        </figure>
      </section>

      <section
        class="about-campaign-section about-campaign-gameplay"
        aria-labelledby="about-gameplay-title"
      >
        <header class="about-campaign-section-heading">
          <p
            class="about-campaign-eyebrow"
            data-i18n="about.gameplay.eyebrow"
          >
            READ · CHOOSE · SURVIVE
          </p>
          <h2 id="about-gameplay-title" data-i18n="about.gameplay.title">
            少一點找按鈕，多一點做決定
          </h2>
          <p data-i18n="about.gameplay.body">
            角色、出口、掩體與物資都直接出現在戰場。你先看勝算，再選擇出手；SEMI
            方針會代辦低風險步驟，不會替你決定終局。
          </p>
        </header>

        <div class="about-campaign-action-grid">
          {GAMEPLAY_ACTIONS.map((action, index) => (
            <article key={action}>
              <span aria-hidden="true">0{index + 1}</span>
              <h3 data-i18n={`about.gameplay.${action}.title`}>
                {action === "route"
                  ? "選路線"
                  : action === "observe"
                  ? "先觀察"
                  : action === "fight"
                  ? "看勝算再開火"
                  : "交給 SEMI 處理節奏"}
              </h3>
              <p data-i18n={`about.gameplay.${action}.body`}>
                {action === "route"
                  ? "趕路比較快但很吵；摸過去更慢，卻更不容易暴露。"
                  : action === "observe"
                  ? "遠處只會先看見人影；靠近、等待或取得情報，才能認出對方。"
                  : action === "fight"
                  ? "命中、掩體、裝備與環境修正會在出手前先說清楚。"
                  : "避戰、自衛、獵殺三種方針降低操作壓力，關鍵選擇仍由你裁定。"}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        class="about-campaign-section about-campaign-innovations"
        aria-labelledby="about-innovation-title"
      >
        <header class="about-campaign-section-heading">
          <p
            class="about-campaign-eyebrow"
            data-i18n="about.innovation.eyebrow"
          >
            WHY IT FEELS DIFFERENT
          </p>
          <h2
            id="about-innovation-title"
            data-i18n="about.innovation.title"
          >
            不是縮小版射擊遊戲，而是一場會記得你的大逃殺
          </h2>
        </header>
        <div class="about-campaign-innovation-grid">
          {INNOVATIONS.map((item) => (
            <article key={item}>
              <p data-i18n={`about.innovation.${item}.kicker`}>
                {item === "01"
                  ? "FAILURE BECOMES INTEL"
                  : item === "02"
                  ? "ONE MATCH · TWO WORLDS"
                  : "TACTICS WITHOUT APM"}
              </p>
              <h3 data-i18n={`about.innovation.${item}.title`}>
                {item === "01"
                  ? "Reset 前倒下，不等於離場"
                  : item === "02"
                  ? "爆炸改寫優勢，不否定前半場"
                  : "低操作量，也能做高風險判斷"}
              </h3>
              <p data-i18n={`about.innovation.${item}.body`}>
                {item === "01"
                  ? "符合條件的玩家成為 Echo，用蒐集到的情報準備回歸；不是免費復活，也不是只能旁觀。"
                  : item === "02"
                  ? "Legacy 留住選擇，裝備與路線則被重新估價，讓領先者保有彈性、落後者保有翻盤機會。"
                  : "敘事 Log 統一回饋，勝算先顯示，半自動方針處理重複節奏。你只需要裁定真正重要的事。"}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        class="about-campaign-section about-campaign-endings"
        aria-labelledby="about-endings-title"
      >
        <header class="about-campaign-section-heading about-campaign-section-heading-compact">
          <p
            class="about-campaign-eyebrow"
            data-i18n="about.endings.eyebrow"
          >
            TWO WAYS OUT
          </p>
          <h2 id="about-endings-title" data-i18n="about.endings.title">
            活到最後，還是讓世界記住你
          </h2>
          <p data-i18n="about.endings.body">
            Rootheart
            不只問誰活著，也問你願意留下什麼。兩條終局都公開、可爭奪，也可能被其他玩家打斷。
          </p>
        </header>
        <div class="about-campaign-ending-paths">
          <article>
            <p data-i18n="about.endings.solo.kicker">SOLO SURVIVOR</p>
            <h3 data-i18n="about.endings.solo.title">奪取根心</h3>
            <p data-i18n="about.endings.solo.body">
              獨自宣告所有權，然後在全域暴露中撐過最後追殺。
            </p>
          </article>
          <span aria-hidden="true">OR</span>
          <article>
            <p data-i18n="about.endings.covenant.kicker">ARBORA COVENANT</p>
            <h3 data-i18n="about.endings.covenant.title">交還記憶</h3>
            <p data-i18n="about.endings.covenant.body">
              兩到三人帶著 City Trace 與 Echo Memory 接入迴路，共同守住儀式。
            </p>
          </article>
        </div>
      </section>

      <section
        class="about-campaign-section about-campaign-trust"
        aria-labelledby="about-systems-title"
      >
        <header class="about-campaign-section-heading">
          <p
            class="about-campaign-eyebrow"
            data-i18n="about.systems.eyebrow"
          >
            THE RULES STAY IN CHARGE
          </p>
          <h2 id="about-systems-title" data-i18n="about.systems.title">
            有 AI，但勝負不交給 AI
          </h2>
        </header>
        <div class="about-campaign-trust-grid">
          {TRUST_SYSTEMS.map((item) => (
            <article key={item}>
              <h3 data-i18n={`about.systems.${item}.title`}>
                {item === "01"
                  ? "空位由 Bot 補齊"
                  : item === "02"
                  ? "觀戰延遲保護戰局"
                  : "Arbora 只提供情報"}
              </h3>
              <p data-i18n={`about.systems.${item}.body`}>
                {item === "01"
                  ? "戰局最多 24 席；真人不足時由 AI 代理，不會假裝成真人。"
                  : item === "02"
                  ? "淘汰後仍可留下看完整戰術地圖，但資訊會延遲，避免場外通風報信。"
                  : "Echo 可在本機展示中查看 fixture 提示；提示只讀取公開狀態，不發動作、不改數值、不裁定勝負。"}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        class="about-campaign-credits"
        aria-labelledby="about-credits-title"
      >
        <header>
          <p class="about-campaign-eyebrow" data-i18n="about.credits.eyebrow">
            BUILT IN PUBLIC
          </p>
          <h2 id="about-credits-title" data-i18n="about.credits.title">
            一座森林，三種專長
          </h2>
          <p data-i18n="about.credits.body">
            介面、美術、遊戲核心與敘事模型各自負責不同層次；所有戰鬥結果仍由確定性規則結算。
          </p>
        </header>
        <dl>
          {CREDITS.map((credit) => (
            <div key={credit.role}>
              <dt data-i18n={credit.role}>{credit.roleFallback}</dt>
              <dd>
                <b data-i18n={credit.name}>{credit.nameFallback}</b>
                <span data-i18n={credit.body}>{credit.bodyFallback}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        class="about-campaign-final"
        aria-labelledby="about-final-title"
      >
        <p class="about-campaign-eyebrow" data-i18n="about.footer.kicker">
          NEXT DEPARTURE
        </p>
        <h2 id="about-final-title" data-i18n="about.footer.title">
          你會帶著什麼穿過爆炸？
        </h2>
        <p data-i18n="about.footer.body">
          整點與半點固定開局；提早五分鐘入座，也可以先觀戰。
        </p>
        <MarketingCta compact />
      </section>
    </main>
  );
}
