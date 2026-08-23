import BrandMark from "@/components/brand_mark.tsx";
import LocaleSwitcher from "@/components/locale_switcher.tsx";
import PrimaryHeaderNavigation from "@/components/primary_header_navigation.tsx";

export default function LeaderboardPage() {
  return (
    <main
      id="main-content"
      class="leaderboard-shell"
      data-leaderboard-app
      data-api-origin=""
    >
      <header class="brand-bar leaderboard-brand-bar public-site-header">
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
            <small>RESET PROTOCOL · SURVIVOR RECORDS</small>
          </span>
        </a>
        <PrimaryHeaderNavigation pathname="/leaderboard" />
        <div class="public-site-utilities">
          <LocaleSwitcher />
        </div>
      </header>

      <section class="leaderboard-hero" aria-labelledby="leaderboard-title">
        <div>
          <p class="eyebrow">LOCAL RECORDS UI · EMPTY DATASET</p>
          <h1 id="leaderboard-title">
            <span data-i18n="leaderboard.hero.title1">排行榜介面預覽，</span>
            <br />
            <span data-i18n="leaderboard.hero.title2">不保存正式戰績。</span>
          </h1>
          <p data-i18n="leaderboard.hero.body">
            此獨立版本只回傳空白的本機開發清單；fixture 操作不會寫入玩家紀錄。
          </p>
        </div>
        <dl
          class="leaderboard-legend"
          aria-label="排行榜閱讀方式"
          data-i18n-aria-label="leaderboard.readingLabel"
        >
          <div>
            <dt>RANK</dt>
            <dd data-i18n="leaderboard.legend.rank">名次</dd>
          </div>
          <div>
            <dt>RECORD</dt>
            <dd data-i18n="leaderboard.legend.record">勝場／場次</dd>
          </div>
          <div>
            <dt>SURVIVAL</dt>
            <dd data-i18n="leaderboard.legend.survival">勝率</dd>
          </div>
        </dl>
      </section>

      <section class="leaderboard-board" aria-labelledby="leaderboard-heading">
        <div class="leaderboard-heading">
          <div>
            <p class="eyebrow">INTERFACE PREVIEW</p>
            <h2 id="leaderboard-heading" data-i18n="leaderboard.title">本機紀錄介面預覽</h2>
          </div>
          <div
            class="leaderboard-tabs"
            role="tablist"
            aria-label="排行榜類型"
            data-i18n-aria-label="leaderboard.typeLabel"
          >
            <button
              type="button"
              role="tab"
              id="leaderboard-practice-tab"
              aria-selected="true"
              aria-controls="leaderboard-rows"
              data-leaderboard-scope="practice"
            >
              <span data-i18n="leaderboard.practice">試煉紀錄</span>
            </button>
            <button
              type="button"
              role="tab"
              id="leaderboard-ranked-tab"
              aria-selected="false"
              aria-controls="leaderboard-rows"
              tabIndex={-1}
              data-leaderboard-scope="ranked"
            >
              <span data-i18n="leaderboard.ranked">競技榜</span>
            </button>
          </div>
        </div>
        <p id="leaderboard-note" data-i18n="leaderboard.loading">
          正在翻閱倖存者紀錄……
        </p>
        <ol
          id="leaderboard-rows"
          class="leaderboard-rows"
          role="tabpanel"
          tabIndex={0}
          aria-labelledby="leaderboard-practice-tab"
          aria-live="polite"
          aria-busy="true"
        >
          <li class="leaderboard-empty" data-i18n="leaderboard.loading">
            正在翻閱倖存者紀錄……
          </li>
        </ol>
      </section>

      <div class="leaderboard-footer">
        <p data-i18n="leaderboard.footer">
          此頁只展示紀錄介面；本機 fixture demo 不會持久化任何結果。
        </p>
        <a class="primary-button" href="/">
          <span data-i18n="leaderboard.join">開啟本機 fixture demo</span>{" "}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </main>
  );
}
