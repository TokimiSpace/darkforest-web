import BrandMark from "@/components/brand_mark.tsx";
import LocaleSwitcher from "@/components/locale_switcher.tsx";
import PrimaryHeaderNavigation from "@/components/primary_header_navigation.tsx";
import { SiteFooterNavigation } from "@/components/site_footer.tsx";
import { readEnvironment } from "@/lib/seo.ts";
import { fixtures } from "@darkforest/fixtures";

export function showDevControls(value = readEnvironment("SHOW_DEV_CONTROLS")): boolean {
  return value === "1";
}

export function qaFixtureOptions(): ReadonlyArray<{ name: string; description: string }> {
  return fixtures.map(({ name, description }) => ({ name, description }));
}

function feedbackUrlIsConfigured(value = readEnvironment("FEEDBACK_URL")): boolean {
  const candidate = value?.trim() ?? "";
  if (candidate === "") return false;
  try {
    const url = new URL(candidate);
    return (url.protocol === "http:" || url.protocol === "https:") &&
      url.username === "" && url.password === "";
  } catch {
    return false;
  }
}

interface HomePageProps {
  showDevelopmentControls?: boolean;
}

type DisclosureTone = "help" | "warning";

interface InlineDisclosureProps {
  id: string;
  tone: DisclosureTone;
  label: string;
  labelKey: string;
  title: string;
  titleKey: string;
  body: string;
  bodyKey: string;
  bodyId?: string;
  className?: string;
}

function InlineDisclosure({
  id,
  tone,
  label,
  labelKey,
  title,
  titleKey,
  body,
  bodyKey,
  bodyId,
  className = "",
}: InlineDisclosureProps) {
  const titleId = `${id}-title`;
  return (
    <details
      id={id}
      class={`ui-disclosure ui-disclosure-${tone}${className === "" ? "" : ` ${className}`}`}
    >
      <summary aria-label={label} data-i18n-aria-label={labelKey}>
        <span aria-hidden="true">{tone === "warning" ? "!" : "?"}</span>
      </summary>
      <div class="ui-disclosure-popover" role="note" aria-labelledby={titleId}>
        <strong id={titleId} data-i18n={titleKey}>{title}</strong>
        <p id={bodyId} data-i18n={bodyKey}>{body}</p>
      </div>
    </details>
  );
}

function LobbySeats() {
  return (
    <ol
      id="lobby-seat-grid"
      class="seat-grid"
      aria-label="24 個大廳容量席位"
      data-i18n-aria-label="lobby.seatGridLabel"
      hidden
    >
      {Array.from(
        { length: 24 },
        (_, index) => (
          <li class="seat seat-pending">
            <span>SEAT {String(index + 1).padStart(2, "0")}</span>
            <strong>WAITING</strong>
          </li>
        ),
      )}
    </ol>
  );
}

export default function HomePage({
  showDevelopmentControls = showDevControls(),
}: HomePageProps = {}) {
  const showFeedbackCta = feedbackUrlIsConfigured();
  return (
    <main
      id="main-content"
      class="app-shell"
      data-lobby-app
      data-fixture-socket-url="ws://127.0.0.1:8788/ws"
    >
      <header class="brand-bar public-site-header">
        <a
          class="wordmark"
          href="/"
          aria-label="Darkforest Reset Protocol"
          title="Darkforest Reset Protocol"
        >
          <BrandMark />
          <span>
            DARKFOREST
            <small>RESET PROTOCOL · PROTOTYPE</small>
          </span>
        </a>
        <PrimaryHeaderNavigation pathname="/" />
        <div class="public-site-utilities">
          <LocaleSwitcher />
          <div
            id="connection-pill"
            class="connection-pill connection-checking"
            role="status"
            title="正在確認戰局"
            data-i18n-title="lobby.connection.checking"
          >
            <span aria-hidden="true" />
            <b id="connection-label" data-i18n="lobby.connection.checking">正在確認戰局</b>
          </div>
        </div>
      </header>

      <section id="lobby-view" class="lobby-layout" aria-labelledby="join-heading">
        <div
          class="lobby-cinematic"
          data-authoritative="false"
          aria-hidden="true"
        >
          <span class="lobby-cinematic-before" />
          <span class="lobby-cinematic-after" />
          <i class="lobby-cinematic-reset">EXPLOSION RESET</i>
        </div>
        <section class="join-panel">
          <div class="join-copy">
            <div class="lobby-hero-intro">
              <p class="eyebrow" data-i18n="lobby.hero.kicker">爆炸之前</p>
              <h1 id="join-heading">
                <span data-i18n="lobby.hero.title1">在重置之前</span>
                <br />
                <span data-i18n="lobby.hero.title2">踏進戰局。</span>
              </h1>
              <p data-i18n="lobby.hero.body">
                同一局跨越爆炸前後：在 Mega City 倒下會成為 Echo 蒐集情報；即使前半落敗，也能在
                Darkforest 靠 Insight 翻盤。
              </p>
              <a class="lobby-hero-entry" href="#join-form">
                <span class="lobby-hero-entry-shift">
                  <small data-i18n="lobby.shift.next">下一班 · 本地時間</small>
                  <time
                    id="lobby-hero-next-shift"
                    data-i18n="lobby.prejoin.scheduleFallback"
                  >
                    每 :00／:30
                  </time>
                </span>
                <span class="lobby-hero-entry-action">
                  <b data-i18n="lobby.join.kicker">加入下一班</b>
                  <small>
                    <span data-i18n="lobby.shift.countdown">距開局 · 真實時間</span>
                    <em id="lobby-hero-countdown" aria-live="off">--:--</em>
                  </small>
                </span>
                <i aria-hidden="true">↓</i>
              </a>
            </div>
            <button
              id="promo-video-open"
              class="promo-video-trigger"
              type="button"
              hidden
              disabled
            >
              <span class="promo-video-trigger-icon" aria-hidden="true">▶</span>
              <span>
                <small>PUBLIC TRANSMISSION · PROMO FILM</small>
                <b data-i18n="lobby.promo">觀看《Dark Forest: Seed Node》</b>
              </span>
              <i aria-hidden="true">↗</i>
            </button>
            <ol
              class="lobby-phase-track"
              aria-label="一局跨越三個階段"
              data-i18n-aria-label="lobby.phaseLabel"
            >
              <li>
                <span>01</span>
                <b>MEGA CITY</b>
                <small data-i18n="lobby.phase.city">建立優勢</small>
              </li>
              <li class="is-reset">
                <span>02</span>
                <b>RESET</b>
                <small data-i18n="lobby.phase.reset">記憶翻面</small>
              </li>
              <li>
                <span>03</span>
                <b>DARKFOREST</b>
                <small data-i18n="lobby.phase.forest">尋找翻盤</small>
              </li>
            </ol>
            <div
              class="lobby-survivors"
              aria-label="身份職業預覽"
              data-i18n-aria-label="lobby.rolesLabel"
            >
              <span>
                <picture>
                  <source
                    media="(max-width: 700px)"
                    srcSet="/art/placeholders/scavenger.svg"
                  />
                  <img
                    src="/art/placeholders/scavenger.svg"
                    width="768"
                    height="1152"
                    alt="Scavenger 倖存者"
                    data-i18n-alt="lobby.profile.alt.scavenger"
                  />
                </picture>
                <b>SCAVENGER</b>
              </span>
              <span>
                <picture>
                  <source
                    media="(max-width: 700px)"
                    srcSet="/art/placeholders/enforcer.svg"
                  />
                  <img
                    src="/art/placeholders/enforcer.svg"
                    width="768"
                    height="1152"
                    alt="Enforcer 倖存者"
                    data-i18n-alt="lobby.profile.alt.enforcer"
                  />
                </picture>
                <b>ENFORCER</b>
              </span>
              <span>
                <picture>
                  <source
                    media="(max-width: 700px)"
                    srcSet="/art/placeholders/courier.svg"
                  />
                  <img
                    src="/art/placeholders/courier.svg"
                    width="768"
                    height="1152"
                    alt="Courier 倖存者"
                    data-i18n-alt="lobby.profile.alt.courier"
                  />
                </picture>
                <b>COURIER</b>
              </span>
              <InlineDisclosure
                id="lobby-role-disclosure"
                className="lobby-role-disclosure"
                tone="help"
                label="查看職業規則"
                labelKey="lobby.rolesHelpLabel"
                title="職業規則"
                titleKey="lobby.rolesHelpTitle"
                body="三種身份職業都將踏進同一場災變；各有一項固定被動，開局另抽一項本局特性。"
                bodyKey="lobby.rolesNote"
              />
              <a class="lobby-role-archive" href="/characters">
                <span aria-hidden="true">◇</span>
                <b data-i18n="nav.characters">角色介紹</b>
                <i aria-hidden="true">→</i>
              </a>
            </div>
          </div>
          <form id="join-form" class="join-form">
            <div class="lobby-entry-heading">
              <span data-i18n="lobby.profile.kicker">STANDALONE LOCAL DEMO</span>
              <strong data-i18n="lobby.profile.title">開啟固定展示情境</strong>
              <small data-i18n="lobby.profile.body">
                直接載入本機 fixture；不會建立帳號、席位或正式戰績
              </small>
            </div>
            <ol class="lobby-admission-steps" aria-hidden="true" hidden={!showDevelopmentControls}>
              <li>
                <span>01</span>
                <b data-i18n="lobby.profile.name">顯示名稱</b>
              </li>
              <li>
                <span>02</span>
                <b data-i18n="lobby.profile.faction">選擇陣營</b>
              </li>
              <li>
                <span>03</span>
                <b data-i18n="lobby.join.kicker">加入下一班</b>
              </li>
            </ol>
            <section
              id="lobby-prejoin-brief"
              class="lobby-prejoin-brief"
              aria-label="下一班入場資訊"
              data-i18n-aria-label="lobby.prejoin.aria"
              hidden={!showDevelopmentControls}
            >
              <header>
                <span data-i18n="lobby.shift.next">下一班 · 本地時間</span>
                <time id="lobby-prejoin-next-shift" data-i18n="lobby.prejoin.scheduleFallback">
                  每 :00／:30
                </time>
              </header>
              <dl>
                <div>
                  <dt data-i18n="lobby.shift.countdown">距開局 · 真實時間</dt>
                  <dd id="lobby-prejoin-countdown" role="timer" aria-atomic="true">--:--</dd>
                </div>
                <div>
                  <dt data-i18n="lobby.shift.assembly">集合狀態</dt>
                  <dd id="lobby-prejoin-assembly" data-i18n="lobby.prejoin.assembly">
                    開局前 5 分鐘集合
                  </dd>
                </div>
                <div>
                  <dt data-i18n="lobby.prejoin.durationLabel">單局上限</dt>
                  <dd data-i18n="lobby.prejoin.durationValue">約 30 分鐘</dd>
                </div>
                <div>
                  <dt data-i18n="lobby.prejoin.rosterLabel">真人／Bot</dt>
                  <dd data-i18n="lobby.prejoin.rosterValue">最多 24 席 · AI 補空位</dd>
                </div>
              </dl>
              <p data-i18n="lobby.prejoin.note">
                班表以你的本地時間預覽；送出後會改用伺服器席位與權威倒數。
              </p>
            </section>
            <label
              class="profile-name-field"
              data-lobby-step="identity"
              hidden={!showDevelopmentControls}
            >
              <span data-i18n="lobby.profile.name">顯示名稱</span>
              <input
                id="profile-display-name"
                type="text"
                autoComplete="nickname"
                placeholder="2–16 字，例如：夜行者"
                data-i18n-placeholder="lobby.profile.namePlaceholder"
                aria-describedby="profile-name-hint profile-form-status"
                required
              />
              <small id="profile-name-hint" data-i18n="lobby.profile.nameHint">
                這會成為排行榜與終局留下的名字。
              </small>
            </label>
            <fieldset
              class="profile-faction-picker"
              data-lobby-step="faction"
              hidden={!showDevelopmentControls}
            >
              <legend data-i18n="lobby.profile.faction">選擇陣營</legend>
              <label class="faction-choice faction-choice-rootbound">
                <input type="radio" name="profile-faction" value="rootbound" />
                <span aria-hidden="true">◇</span>
                <b data-i18n="lobby.profile.rootbound">ROOTBOUND 共同體</b>
                <small data-i18n="lobby.profile.rootboundDetail">
                  NO ONE LEFT BEHIND · 誓約與盟友牽絆
                </small>
              </label>
              <label class="faction-choice faction-choice-human">
                <input type="radio" name="profile-faction" value="human" checked />
                <span aria-hidden="true">△</span>
                <b data-i18n="lobby.profile.human">自由倖存者</b>
                <small data-i18n="lobby.profile.humanDetail">
                  Human · 不受 ROOTBOUND 誓約約束
                </small>
              </label>
            </fieldset>
            <p id="profile-form-status" class="profile-form-status" role="status" />
            <div class="lobby-entry-actions" data-lobby-step="commit">
              <button
                id="join-live-button"
                class="primary-button join-live-button"
                type="button"
                hidden
              >
                <span>
                  <b data-i18n="lobby.joinLive.kicker">立即接管加入</b>
                  <small id="join-live-detail">接手一名 Bot，直接進入進行中的對局</small>
                </span>
                <i aria-hidden="true">⇥</i>
              </button>
              <button id="join-button" class="primary-button" type="submit">
                <span>
                  <b data-i18n="lobby.join.kicker">加入下一班</b>
                  <small data-i18n="lobby.join.action">連接 127.0.0.1 並載入固定情境</small>
                </span>
                <i aria-hidden="true">→</i>
              </button>
              <button
                id="spectate-button"
                class="spectate-button"
                type="button"
                hidden
                disabled
              >
                <span aria-hidden="true">◉</span>
                <span>
                  <b data-i18n="lobby.spectate">直接觀戰</b>
                  <small data-i18n="lobby.spectateDetail">
                    全域戰術視角 · 固定延遲 60 秒
                  </small>
                </span>
              </button>
            </div>
            <details
              id="profile-customization-details"
              class="lobby-profile-details"
              hidden={!showDevelopmentControls}
            >
              <summary>
                <span aria-hidden="true">＋</span>
                <span>
                  <b data-i18n="lobby.profile.quotes">角色標語（選填）</b>
                  <small data-i18n="lobby.profile.quoteHint">可留空；最多 48 字。</small>
                </span>
                <i aria-hidden="true">⌄</i>
              </summary>
              <fieldset class="profile-quote-fields">
                <legend class="sr-only" data-i18n="lobby.profile.quotes">角色標語（選填）</legend>
                <div class="profile-quote-help-row">
                  <InlineDisclosure
                    id="profile-quote-disclosure"
                    tone="help"
                    label="查看角色標語說明"
                    labelKey="lobby.profile.quotesHelpLabel"
                    title="角色標語說明"
                    titleKey="lobby.profile.quotesHelpTitle"
                    body="最多 48 字；擊倒標語會公開顯示在排行榜，兩種標語也會出現在對應事件，不會擋住操作。"
                    bodyKey="lobby.profile.quotesHint"
                    bodyId="profile-quote-rule"
                  />
                </div>
                <label class="profile-quote-field" id="profile-victory-quote-field">
                  <span data-i18n="lobby.profile.victoryQuote">擊倒標語</span>
                  <input
                    id="profile-victory-quote"
                    type="text"
                    autoComplete="off"
                    maxLength={48}
                    data-i18n-placeholder="lobby.profile.victoryPlaceholder"
                    placeholder="例如：這場交鋒，到此為止。"
                    aria-describedby="profile-victory-quote-hint profile-form-status"
                  />
                  <small
                    id="profile-victory-quote-hint"
                    class="profile-field-feedback sr-only"
                    data-i18n="lobby.profile.quoteHint"
                  >
                    可留空；最多 48 字。
                  </small>
                </label>
                <label class="profile-quote-field" id="profile-downed-quote-field">
                  <span data-i18n="lobby.profile.downedQuote">倒地標語</span>
                  <input
                    id="profile-downed-quote"
                    type="text"
                    autoComplete="off"
                    maxLength={48}
                    data-i18n-placeholder="lobby.profile.downedPlaceholder"
                    placeholder="例如：我還沒輸，只是暫時倒下。"
                    aria-describedby="profile-downed-quote-hint profile-form-status"
                  />
                  <small
                    id="profile-downed-quote-hint"
                    class="profile-field-feedback sr-only"
                    data-i18n="lobby.profile.quoteHint"
                  >
                    可留空；最多 48 字。
                  </small>
                </label>
              </fieldset>
            </details>
            <p class="lobby-entry-helper">
              <span aria-hidden="true">◆</span>
              <span data-i18n="lobby.join.helper">
                只使用本機固定資料 · 不需登入 · 不會配對其他玩家 · 重新整理即可重播
              </span>
            </p>
            <div class="lobby-telemetry-disclosure">
              <InlineDisclosure
                id="lobby-telemetry-disclosure"
                tone="warning"
                label="查看資料使用提醒"
                labelKey="lobby.telemetry.helpLabel"
                title="資料使用提醒"
                titleKey="lobby.telemetry.title"
                body="此公開展示會在瀏覽器保存角色草稿、語言、教學進度、輔助模式與無障礙／音訊偏好；分頁期間另保存有限的提示紀錄。不會送出分析資料或登入憑證。"
                bodyKey="lobby.telemetry.notice"
              />
            </div>
            <section
              id="profile-profession-card"
              class="profile-profession-card"
              aria-live="polite"
              hidden={!showDevelopmentControls}
            >
              <span class="profession-mark" aria-hidden="true">?</span>
              <span>
                <b data-i18n="lobby.profile.professionHiddenTitle">身份職業尚未揭曉</b>
                <small data-i18n="lobby.profile.professionHidden">
                  建立角色檔案時由城市名冊抽出，之後固定保留；職業帶一項固定被動（見教學「職業與特性」）。
                </small>
              </span>
            </section>
            <section
              id="spectator-warmup"
              class="spectator-warmup"
              aria-label="延遲觀戰準備狀態"
              data-i18n-aria-label="lobby.spectateWarmupLabel"
              hidden
            >
              <span aria-hidden="true">◌</span>
              <span>
                <b data-i18n="lobby.spectate.waiting">觀戰訊號緩衝中</b>
                <small id="spectator-warmup-copy" data-i18n="lobby.spectate.warmupCopy">
                  等待延遲影像成熟。
                </small>
              </span>
              <button
                id="spectator-cancel-button"
                type="button"
                data-i18n="lobby.spectate.cancel"
              >
                取消
              </button>
            </section>
            {showDevelopmentControls
              ? (
                <details class="lobby-advanced" data-development-controls>
                  <summary data-i18n="lobby.advanced">進階連線設定</summary>
                  <div class="lobby-advanced-body">
                    <label>
                      <span data-i18n="lobby.fixture">開場情境</span>
                      <input
                        id="fixture-name"
                        value="openingMegaCity"
                        list="fixture-options"
                        required
                      />
                      <datalist id="fixture-options">
                        {qaFixtureOptions().map((fixture) => (
                          <option
                            key={fixture.name}
                            value={fixture.name}
                            label={fixture.description}
                          />
                        ))}
                      </datalist>
                    </label>
                    <p class="protocol-note" data-i18n="lobby.advanced.protocolNote">
                      此控制只切換已清理的本機固定情境。
                    </p>
                  </div>
                </details>
              )
              : null}
          </form>
        </section>

        <section class="seat-panel" aria-labelledby="seat-heading">
          <div class="section-heading">
            <div>
              <p class="eyebrow">LOCAL FIXTURE</p>
              <h2 id="seat-heading" data-i18n="lobby.capacity">本機情境狀態</h2>
            </div>
            <span id="lobby-capacity-badge" class="bot-count">LOCAL FIXTURE</span>
          </div>
          <p id="lobby-section-note" class="section-note" data-i18n="lobby.capacityNote">
            固定情境會立即送出已清理的展示狀態；不會建立線上大廳或保存戰績。
          </p>
          <section id="lobby-server-state" class="lobby-server-state" aria-live="polite" hidden>
            <div class="lobby-server-heading">
              <div>
                <span>UPCOMING MATCH</span>
                <strong id="lobby-match-id">—</strong>
              </div>
              <button id="lobby-leave-button" class="text-button" type="button">
                LEAVE LOBBY
              </button>
            </div>
            <dl class="lobby-readout">
              <div>
                <dt>SEATED</dt>
                <dd>
                  <b id="lobby-seated-count">0</b> / <span id="lobby-capacity-count">24</span>
                </dd>
              </div>
              <div>
                <dt data-i18n="lobby.shift.next">下一班 · 本地時間</dt>
                <dd id="lobby-next-shift">--:--</dd>
              </div>
              <div>
                <dt data-i18n="lobby.shift.countdown">距開局 · 真實時間</dt>
                <dd id="lobby-countdown">--:--</dd>
              </div>
              <div>
                <dt data-i18n="lobby.shift.assembly">集合狀態</dt>
                <dd class="lobby-assembly">
                  <b id="lobby-shift-status">—</b>
                  <small>
                    <span id="lobby-bot-fill-count">24</span>{" "}
                    <span data-i18n="lobby.shift.aiFill">名 AI 開打時補齊</span>
                  </small>
                </dd>
              </div>
            </dl>
          </section>
          <LobbySeats />
        </section>
        {showFeedbackCta
          ? (
            <div class="lobby-feedback-row">
              <a
                id="lobby-feedback-cta"
                class="feedback-cta feedback-cta-lobby"
                data-feedback-cta
                href=""
                target="_blank"
                rel="noopener"
                title="這一週是公開測試,你的一句話都算數。"
                data-i18n-title="feedback.cta.hint"
                hidden
              >
                <span>
                  <b data-i18n="feedback.cta.label">回報問題／加入社群</b>
                  <small data-i18n="feedback.cta.hint">
                    這一週是公開測試,你的一句話都算數。
                  </small>
                </span>
                <i aria-hidden="true">↗</i>
              </a>
            </div>
          )
          : null}
      </section>

      <dialog
        id="promo-video-dialog"
        class="promo-video-dialog"
        aria-labelledby="promo-video-title"
      >
        <div class="promo-video-dialog-shell">
          <header>
            <div>
              <p class="eyebrow">PUBLIC TRANSMISSION</p>
              <h2 id="promo-video-title">Dark Forest: Seed Node</h2>
            </div>
            <button
              id="promo-video-close"
              class="promo-video-close"
              type="button"
              aria-label="關閉宣傳影片"
              data-i18n-aria-label="lobby.promoCloseLabel"
            >
              ×
            </button>
          </header>
          <div
            id="promo-video-frame"
            class="promo-video-frame"
            aria-label="Dark Forest: Seed Node 宣傳影片"
            data-i18n-aria-label="lobby.promo.videoTitle"
          />
          <footer>
            <p data-i18n="lobby.promo.disclaimer">
              影片只會在你按下播放後載入；關閉視窗即停止播放。
            </p>
            <a
              class="promo-video-fallback"
              href="/about"
            >
              <span data-i18n="nav.about">關於專案</span> <span aria-hidden="true">→</span>
            </a>
          </footer>
        </div>
      </dialog>

      <section
        id="match-view"
        class="match-layout"
        aria-label="openingMegaCity 對局 HUD"
        data-i18n-aria-label="lobby.match.viewLabel"
        hidden
      >
        <header id="match-topbar" class="match-topbar" />
        <aside id="next-shift-dock" class="next-shift-dock" aria-live="polite" hidden>
          <span class="next-shift-dock-mark" aria-hidden="true">◇</span>
          <span class="next-shift-dock-copy">
            <small data-i18n="lobby.queueDock.kicker">下一班 · 座位已保留</small>
            <b id="next-shift-dock-countdown">--:--</b>
            <em id="next-shift-dock-seated" data-i18n="lobby.queueDock.seated">已入座 0 / 24</em>
          </span>
          <span class="next-shift-dock-actions">
            <button
              id="next-shift-watch-button"
              type="button"
              data-i18n="lobby.queueDock.watch"
            >
              等待時觀戰
            </button>
            <button
              id="next-shift-stop-watch-button"
              type="button"
              data-i18n="lobby.queueDock.stop"
              hidden
            >
              停止觀戰
            </button>
            <button id="next-shift-leave-button" type="button" data-i18n="lobby.queueDock.leave">
              離開候車
            </button>
          </span>
        </aside>
        <section id="mode-banner" class="mode-banner" hidden />
        <section
          id="narrative-fatal-banner"
          class="narrative-fatal-banner"
          aria-hidden="true"
          hidden
        />
        <aside
          id="player-quote-notice"
          class="player-quote-notice"
          role="status"
          aria-live="polite"
          hidden
        />
        <section
          id="narrative-mode-view"
          class="narrative-mode-view"
          aria-label="敘事模式"
          data-i18n-aria-label="lobby.match.narrativeLabel"
          hidden
        >
          <div
            id="narrative-world-atmosphere"
            class="narrative-world-atmosphere"
            data-authoritative="false"
            aria-hidden="true"
          />
          <header id="narrative-statusbar" class="narrative-statusbar" />
          <nav
            id="tactical-context-breadcrumb"
            class="tactical-context-breadcrumb"
            aria-label="戰術畫面導覽"
            data-i18n-aria-label="arena.breadcrumb.aria"
            hidden
          >
            <button id="tactical-context-back" type="button">
              <span aria-hidden="true">←</span>
              <span data-i18n="arena.switch.toField">返回戰場</span>
            </button>
            <span aria-hidden="true">/</span>
            <strong id="tactical-context-current" aria-current="page" />
            <button
              id="tactical-context-close"
              class="tactical-context-close"
              type="button"
              aria-label="返回戰場"
              data-i18n-aria-label="arena.switch.toField"
            >
              <span aria-hidden="true">×</span>
              <span data-i18n="accessibility.close">關閉</span>
            </button>
          </nav>
          <div class="narrative-mode-layout">
            <aside
              class="narrative-survivor-column"
              aria-label="角色與現場狀態"
              data-i18n-aria-label="lobby.match.survivorColumnLabel"
            >
              <nav
                id="tactical-side-detail-tabs"
                class="tactical-side-detail-tabs"
                aria-label="角色與現場狀態"
                data-i18n-aria-label="lobby.match.survivorColumnLabel"
              >
                <button
                  type="button"
                  data-tactical-side-detail-tab="player"
                  aria-pressed="true"
                  data-i18n="lobby.match.playerDrawerTitle"
                >
                  角色狀態與裝備
                </button>
                <button
                  type="button"
                  data-tactical-side-detail-tab="environment"
                  aria-pressed="false"
                  data-i18n="lobby.match.environmentDrawerTitle"
                >
                  現場與環境
                </button>
              </nav>
              <details
                id="narrative-player-drawer"
                class="narrative-side-drawer narrative-player-drawer"
              >
                <summary>
                  <span aria-hidden="true">◇</span>
                  <span>
                    <b data-i18n="lobby.match.playerDrawerTitle">角色狀態與裝備</b>
                    <small
                      id="narrative-player-summary"
                      data-i18n="lobby.match.playerDrawerSummary"
                    >
                      HP · 護甲 · Signal · 武器 · 容量
                    </small>
                  </span>
                </summary>
                <section
                  id="player-panel"
                  class="player-panel"
                  aria-labelledby="player-heading"
                />
              </details>
              <details
                id="narrative-environment-drawer"
                class="narrative-side-drawer narrative-environment-drawer"
              >
                <summary>
                  <span aria-hidden="true">△</span>
                  <span>
                    <b data-i18n="lobby.match.environmentDrawerTitle">現場與環境</b>
                    <small
                      id="narrative-environment-summary"
                      data-i18n="lobby.match.environmentDrawerSummary"
                    >
                      地形 · 掩體 · 危險 · 地上物資
                    </small>
                  </span>
                </summary>
                <section
                  id="narrative-context-panel"
                  class="narrative-context-panel"
                  aria-labelledby="narrative-context-heading"
                />
              </details>
            </aside>
            <section class="narrative-story-column" aria-labelledby="narrative-log-heading">
              <div class="narrative-mode-heading">
                <div>
                  <p class="eyebrow">LIVE NARRATIVE LOG</p>
                  <h2 id="narrative-log-heading" data-i18n="log.title" tabIndex={-1}>戰局紀錄</h2>
                </div>
                <div class="narrative-log-tools">
                  <button
                    id="narrative-action-toggle"
                    class="narrative-action-toggle"
                    type="button"
                    aria-controls="narrative-action-column"
                    aria-expanded="false"
                    aria-label="現場行動"
                    data-i18n-aria-label="actions.title"
                  >
                    <span aria-hidden="true">⌁</span>
                    <b data-i18n="actions.title">現場行動</b>
                    <i aria-hidden="true">›</i>
                  </button>
                  <div
                    id="tactical-view-switch"
                    class="tactical-view-switch"
                    role="group"
                    aria-label="切換 2.5D 戰場與戰局紀錄"
                    data-i18n-aria-label="arena.switch.aria"
                    hidden
                  >
                    <button
                      type="button"
                      data-arena-surface="field"
                      aria-pressed="true"
                      aria-label="返回戰場"
                      data-i18n-aria-label="arena.switch.toField"
                    >
                      <span aria-hidden="true">←</span>
                      <b data-arena-switch-label="field" data-i18n="arena.switch.toField">
                        返回戰場
                      </b>
                    </button>
                    <button
                      type="button"
                      data-arena-surface="log"
                      aria-pressed="false"
                      aria-label="查看紀錄"
                      data-i18n-aria-label="arena.switch.toLog"
                    >
                      <b data-arena-switch-label="log" data-i18n="arena.switch.toLog">
                        查看紀錄
                      </b>
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                  <div
                    class="narrative-log-filters"
                    role="group"
                    aria-label="戰局紀錄篩選"
                    data-i18n-aria-label="lobby.match.logFiltersLabel"
                  >
                    <button
                      type="button"
                      data-log-filter="all"
                      aria-pressed="false"
                      data-i18n="log.filter.all"
                    >
                      全部
                    </button>
                    <button type="button" data-log-filter="focus" aria-pressed="true">
                      <span data-i18n="log.filter.focus">與我有關</span>
                    </button>
                  </div>
                  <span id="narrative-mode-count">0 / 200</span>
                </div>
              </div>
              <section
                id="tactical-arena-stage"
                class="tactical-arena-stage"
                aria-labelledby="tactical-arena-heading"
                data-authoritative="false"
                hidden
              >
                <div
                  id="tactical-arena-scene"
                  class="tactical-arena-scene"
                  data-authoritative="false"
                >
                  <canvas id="tactical-arena-canvas" aria-hidden="true" />
                  <div
                    id="tactical-arena-tokens"
                    class="tactical-arena-tokens"
                    aria-label="目前可見的人物"
                    data-i18n-aria-label="arena.tokens.aria"
                  />
                  <nav
                    id="tactical-arena-exits"
                    class="tactical-arena-exits"
                    aria-label="可前往的地點"
                    data-i18n-aria-label="hud.routes.title"
                  />
                  <div class="tactical-arena-vignette" aria-hidden="true" />
                  <header class="tactical-arena-heading">
                    <span id="tactical-arena-phase">MEGA CITY</span>
                    <h3 id="tactical-arena-heading" tabIndex={-1}>CURRENT NODE</h3>
                    <small id="tactical-arena-backend" data-i18n="arena.mode.label">
                      戰術現場
                    </small>
                  </header>
                  <details class="tactical-arena-legend">
                    <summary aria-label="戰場位置說明" data-i18n-aria-label="arena.position.notice">
                      <span aria-hidden="true">?</span>
                    </summary>
                    <p data-i18n="arena.position.notice">
                      場內站位只幫助辨識，不代表精確距離；命中仍以勝算預覽為準。
                    </p>
                  </details>
                  <aside
                    id="tactical-arena-self-status"
                    class="tactical-arena-self-status"
                    aria-label="主要狀態"
                    data-i18n-aria-label="hud.vitals.aria"
                    aria-live="polite"
                    aria-atomic="true"
                  />
                  <div
                    id="tactical-arena-tags"
                    class="tactical-arena-tags"
                    aria-label="已知環境"
                    data-i18n-aria-label="arena.environment.aria"
                  />
                </div>
                <div class="tactical-mobile-bottom-stack">
                  <footer class="tactical-arena-feed">
                    <span aria-hidden="true">◈</span>
                    <p id="tactical-arena-latest" aria-live="polite">
                      <span data-i18n="log.title">戰局紀錄</span>
                      <b>你停下來，讀一眼四周。</b>
                    </p>
                    <button
                      id="tactical-arena-log-open"
                      class="tactical-arena-log-open"
                      type="button"
                      aria-controls="narrative-story-grid"
                      aria-label="查看紀錄"
                      data-i18n-aria-label="arena.switch.toLog"
                    >
                      <span data-i18n="arena.switch.toLog">查看紀錄</span>
                      <i aria-hidden="true">›</i>
                    </button>
                    <button
                      id="tactical-arena-action-jump"
                      type="button"
                      aria-controls="narrative-mode-heading"
                    >
                      <small data-i18n="arena.action.jump">去決策</small>
                      <b id="tactical-arena-action-jump-label">此刻，你要——</b>
                    </button>
                  </footer>
                  <div class="tactical-mobile-action-row">
                    <nav
                      id="tactical-arena-interactables"
                      class="tactical-arena-interactables"
                      aria-label="眼前可互動的事物"
                      data-i18n-aria-label="actions.title"
                      hidden
                    />
                    <div
                      id="tactical-arena-actions"
                      class="tactical-arena-actions"
                      role="region"
                      aria-label="現場行動"
                      data-i18n-aria-label="actions.title"
                      aria-live="polite"
                    />
                  </div>
                </div>
              </section>
              <div id="narrative-story-grid" class="narrative-story-grid">
                <section id="narrative-story" class="narrative-story" />
                <aside
                  id="narrative-combat-story"
                  class="narrative-combat-story"
                  aria-labelledby="narrative-combat-story-heading"
                >
                  <div class="narrative-combat-story-heading">
                    <div>
                      <p class="eyebrow">COMBAT · YOUR FIGHT</p>
                      <h3 id="narrative-combat-story-heading" data-i18n="combat.title">
                        我的戰鬥紀錄
                      </h3>
                    </div>
                    <span>0 / 8</span>
                  </div>
                  <p class="empty-state" data-i18n="combat.empty">
                    尚無與你有關的戰鬥。
                  </p>
                </aside>
              </div>
              <p
                id="unified-log-announcer"
                class="sr-only"
                aria-live="polite"
                aria-atomic="true"
              />
            </section>
            <aside
              id="narrative-action-column"
              class="narrative-action-column"
              aria-labelledby="narrative-mode-heading"
              hidden
            >
              <div class="narrative-action-heading">
                <p class="eyebrow">ONE DECISION · ONE BUTTON</p>
                <h2 id="narrative-mode-heading" data-i18n="decision.title" tabIndex={-1}>
                  此刻，你要——
                </h2>
              </div>
              <section
                id="narrative-policy-rail"
                class="narrative-policy-rail"
                aria-label="半自動交戰方針"
                data-i18n-aria-label="lobby.match.policyRailLabel"
                hidden
              />
              <section id="narrative-preview" class="narrative-preview" hidden />
              <section
                id="narrative-decision-card"
                class="narrative-decision-card"
                aria-live="assertive"
                hidden
              />
              <nav
                id="narrative-options"
                class="narrative-options"
                aria-label="接下來的選項"
                data-i18n-aria-label="lobby.match.optionsLabel"
              />
              <section
                id="narrative-commander-menu"
                class="narrative-commander-menu"
                aria-labelledby="commander-menu-heading"
                hidden
              />
              <details id="manual-action-drawer" class="narrative-drawer manual-action-drawer">
                <summary>
                  <span data-i18n="lobby.match.manualDrawerTitle">更多現場行動</span>
                  <small data-i18n="lobby.match.manualDrawerDetail">搜尋、掩蔽、道具</small>
                </summary>
                <section
                  id="command-panel"
                  class="command-panel narrative-field-actions"
                  aria-labelledby="command-heading"
                />
              </details>
              <button
                id="mobile-combat-toggle"
                class="mobile-combat-toggle"
                type="button"
                aria-controls="combat-panel"
                aria-expanded="false"
              >
                <span>
                  <b data-i18n="hud.combat.autoFlow">自動估量 · 一鍵開火</b>
                  <small data-i18n="hud.combat.preview.note">勝算已自動顯示</small>
                </span>
                <i aria-hidden="true" />
              </button>
              <section
                id="combat-panel"
                class="combat-panel narrative-combat-panel"
                aria-labelledby="combat-heading"
              />
              <details class="narrative-drawer">
                <summary data-i18n="lobby.match.assistDrawerTitle">半自動與生存意圖</summary>
                <section
                  id="assist-panel"
                  class="assist-panel"
                  aria-labelledby="assist-heading"
                />
              </details>
            </aside>
          </div>
        </section>
        <div class="match-main">
          <section class="map-panel" aria-labelledby="map-heading">
            <div class="section-heading map-heading">
              <div>
                <p class="eyebrow">PUBLIC TOPOLOGY</p>
                <h2 id="map-heading">MAP / CONNECTING</h2>
              </div>
              <span id="map-location" class="map-location" />
            </div>
            <section
              id="tactical-readout"
              class="tactical-readout"
              aria-label="目前聚焦節點戰術判讀"
              data-i18n-aria-label="lobby.match.tacticalReadoutLabel"
            />
            <div id="map-canvas" class="map-canvas" aria-live="polite" />
          </section>
          <aside
            class="right-rail"
            aria-label="觀戰通訊資訊"
            data-i18n-aria-label="lobby.match.rightRailLabel"
          >
            <section id="event-panel" class="event-panel" aria-labelledby="event-heading" />
          </aside>
        </div>
        <section id="legacy-panel" class="modal-panel legacy-panel" hidden />
        <section id="reset-panel" class="modal-panel reset-panel" hidden />
        <section id="replay-panel" class="replay-panel" hidden />
      </section>

      <aside
        id="accessibility-panel"
        class="accessibility-panel"
        aria-labelledby="accessibility-heading"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        hidden
      >
        <div class="accessibility-heading">
          <div>
            <p class="eyebrow">LOCAL PRESENTATION ONLY</p>
            <h2 id="accessibility-heading" data-i18n="accessibility.title">可及性與畫面安全</h2>
          </div>
          <button
            id="accessibility-close"
            class="text-button"
            type="button"
            data-i18n="accessibility.close"
          >
            關閉
          </button>
        </div>
        <fieldset>
          <legend data-i18n="accessibility.textScale">文字大小</legend>
          <label>
            <input type="radio" name="text-scale" value="100" checked />100%
          </label>
          <label>
            <input type="radio" name="text-scale" value="125" />125%
          </label>
          <label>
            <input type="radio" name="text-scale" value="150" />150%
          </label>
        </fieldset>
        <label>
          <input id="setting-reduced-motion" type="checkbox" />
          <span data-i18n="accessibility.reducedMotion">減少動態</span>
        </label>
        <label>
          <input id="setting-low-violence" type="checkbox" />
          <span data-i18n="accessibility.lowViolence">低暴力呈現</span>
        </label>
        <label>
          <input id="setting-particles" type="checkbox" />
          <span data-i18n="accessibility.particles">關閉粒子</span>
        </label>
        <label>
          <input id="setting-high-contrast" type="checkbox" />
          <span data-i18n="accessibility.highContrast">高對比危險</span>
        </label>
        <label>
          <input id="setting-background-music" type="checkbox" />
          <span data-i18n="accessibility.music">背景音樂</span>
        </label>
        <p
          id="music-status"
          class="accessibility-setting-hint"
          role="status"
          aria-live="polite"
          data-i18n="accessibility.musicHint"
        >
          只影響這台裝置；關閉音樂不會遺漏任何遊戲提示。
        </p>
        <p data-i18n="accessibility.notice">設定只改本機呈現，不會改變時間、命中、狀態或勝負。</p>
        <details id="debug-drawer" class="debug-drawer">
          <summary data-i18n="accessibility.debugTitle">除錯資訊</summary>
          <p data-i18n="accessibility.debugNotice">
            以下為開發用 server／ACK／diff／state 細節，預設不顯示。
          </p>
          <button id="debug-ping" class="text-button" type="button">PING SERVER</button>
          <pre id="debug-output" data-i18n="accessibility.debugEmpty">尚無技術紀錄。</pre>
        </details>
      </aside>

      <footer class="status-strip lobby-footer">
        <span aria-hidden="true">◇</span>
        <p
          id="system-notice"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-i18n="lobby.systemNotice"
        >
          等待加入 Prototype 對局。
        </p>
        <SiteFooterNavigation
          pathname="/"
          className="lobby-footer-nav"
          includeDeveloper
        />
        <button
          id="accessibility-toggle"
          type="button"
          aria-expanded="false"
          aria-label="開啟可及性設定"
          data-i18n-aria-label="accessibility.open"
          data-i18n-title="accessibility.open"
        >
          <svg class="footer-control-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" />
          </svg>
          <span class="footer-control-copy" data-i18n="accessibility.open">可及性設定</span>
        </button>
        <button
          id="motion-toggle"
          type="button"
          aria-pressed="false"
          aria-label="減少動態：關閉"
        >
          <svg class="footer-control-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 8h12M4 12h16M4 16h9M18 6l2 2-2 2" />
          </svg>
          <span id="motion-toggle-label" class="footer-control-copy">減少動態：關閉</span>
        </button>
        <button
          id="music-toggle"
          type="button"
          aria-pressed="false"
          aria-label="背景音樂：關閉"
        >
          <svg
            class="footer-control-icon music-control-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path class="music-control-speaker" d="M4 10v4h4l5 4V6L8 10H4z" />
            <path class="music-control-wave" d="M16 9c1.2 1.5 1.2 4.5 0 6M19 6c3 3.2 3 8.8 0 12" />
            <path class="music-control-muted" d="M16 9l5 6M21 9l-5 6" />
          </svg>
          <span id="music-toggle-label" class="footer-control-copy">背景音樂：關閉</span>
        </button>
      </footer>
    </main>
  );
}
