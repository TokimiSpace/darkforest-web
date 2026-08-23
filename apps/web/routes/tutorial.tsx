import BrandMark from "@/components/brand_mark.tsx";
import LocaleSwitcher from "@/components/locale_switcher.tsx";
import PrimaryHeaderNavigation from "@/components/primary_header_navigation.tsx";
import { itemFieldIconUrl } from "@/browser/item_art.js";
import { BALANCE } from "@darkforest/client-data";

function requiredItemIcon(kind: import("@darkforest/protocol").ItemKind): string {
  const icon = itemFieldIconUrl(kind);
  if (icon === null) throw new Error(`Missing tutorial item art: ${kind}`);
  return icon;
}

const LESSONS = [
  ["01", "讀故事", "同一局穿越兩個世界"],
  ["02", "選一件事", "此刻只選一個行動"],
  ["03", "預見再出手", "Preview → 開火"],
  ["04", "穿越爆炸", "Echo 如何移動與翻盤"],
  ["05", "回答根心", "單人生還或共同歸還"],
] as const;

const MANUAL_TOPICS = [
  {
    id: "start",
    number: "01",
    title: "我怎麼進入本機 demo？",
    summary: "選擇展示資料並啟動固定 fixture",
    see:
      "公開大廳提供本機 demo 的角色表單；啟用開發控制後可選固定情境。排隊、席次、定時班次與延遲觀戰都只是產品概念展示。",
    action:
      "輸入顯示名稱、選 ROOTBOUND 或 Human、選擇已提交的 fixture，再啟動本機 demo。這不會建立帳號，也不會配對其他玩家。",
    remember:
      "定時班次與集合只屬產品概念展示。本機 fixture 會立即啟動，不提供排隊、席次或發車時刻表。",
  },
  {
    id: "navigation",
    number: "02",
    title: "打開子畫面後怎麼回主戰場？",
    summary: "Breadcrumb、戰場／Log 分頁與 Esc 返回",
    see:
      "進入角色、環境、行動或 Log 時，畫面會顯示「← 主戰場／目前頁面」；手機底部保留戰場與 Log 切換。",
    action:
      "點「主戰場」或按 Esc 返回，不必把整頁滑回原位。回到戰場後，原本選取的人物與情境仍會保留。",
    remember:
      "子畫面是同一場戰局的細節，不是離開遊戲。看不見場景操作時，先找 breadcrumb，不要重整頁面。",
  },
  {
    id: "survival",
    number: "03",
    title: "HP、氣力與 Signal 各管什麼？",
    summary: "生命、行動預算與被發現風險",
    see: "主戰場上方固定顯示 HP、氣力與 Signal；受傷、趕路、噪音、藏匿與終局收束都會改變它們。",
    action: "HP 低就找治療或健康食物；氣力不足改用潛行；Signal 高就降低噪音、藏匿或離開熱門路線。",
    remember:
      "Signal 不是第二條 HP。終局會逐步抬高最低值，進入 Dead Zone 後無法再靠等待降回安全區。",
  },
  {
    id: "travel",
    number: "04",
    title: "為什麼有些路不能走？",
    summary: "方向箭頭、快慢路線、迷路與封鎖",
    see:
      "可走出口直接標在戰場邊緣；點箭頭後才會出現趕路或潛行。道路可能因 Reset、封鎖或根系特性而改變。",
    action: "先選目的地，再比較時間、噪音與氣力成本。路上遇到人影時，可交戰、觀察或繼續趕路。",
    remember: "箭頭只是在選目的地，不會立刻出發；根系捷徑只能慢行，走岔或折返也會寫進 Log。",
  },
  {
    id: "loot",
    number: "05",
    title: "為什麼搜不到或撿不到物資？",
    summary: "搜尋、地上物資、容量、食物與遺留物",
    see:
      "節點可搜尋時會出現搜尋；地上有 cache 時會在場景顯示可拾取物。背包容量、他人短暫優先權與冷卻都可能擋住拾取。",
    action:
      "先看場景物資與背包容量；滿載時換掉一件或放棄。健康食物回復 HP 與氣力，腐敗食物只救急回氣並帶來不適。",
    remember:
      "搜尋成功不保證一定出裝備；倒下者的遺留物會成為地上 cache，擊倒者只有短暫優先，不是永久私有。",
  },
  {
    id: "combat",
    number: "06",
    title: "看見人影後怎麼交戰？",
    summary: "辨識、勝算 Preview、開火與半自動方針",
    see:
      "未辨識玩家先顯示人影與武器／護甲輪廓，選取只會顯示 Preview。SEMI 另會顯示目前意圖、交戰方針與「下一個安全步驟」。",
    action:
      "手動時先讀 Preview 再按開火。SEMI 時先選意圖並讀下一步；用「取消」撤回排定動作，或按 Esc／操作任何手動控制立刻回到 ASSIST。",
    remember:
      "Preview 是估算，命中仍有隨機性。SEMI 只在可見倒數後送出低風險步驟；警告與不可逆決定留給手動，而且每局都要明確重啟。",
  },
  {
    id: "growth",
    number: "07",
    title: "等級、職業、特性與傷勢有何影響？",
    summary: "本局成長、固定被動、隨機特性與部位負傷",
    see: "角色卡會顯示 Lv、XP、職業、當局特性與手臂／腿部傷勢；已辨識目標才會公開等級。",
    action:
      "搜刮、命中、救援、感應與活過 Reset 都能累積 XP。依本局被動調整打法，受傷時優先治療或改走低風險行動。",
    remember:
      "等級與隨機特性只屬於當局；職業來自角色檔案。腿傷會改變移動，手傷會影響戰鬥，不能只看 HP。",
  },
  {
    id: "shop",
    number: "08",
    title: "Field Supply 商店的買賣按鈕在哪裡？",
    summary: "只有親自抵達 Field Supply 所在節點才會出現",
    see:
      "地圖會標出商店節點；你身在該地時，場景才會投影 Field Supply、現金、目錄、買價、賣價與庫存。",
    action:
      "在商店節點打開場景交易，選品項後先讀確認卡再買賣；現金不足、背包已滿或售罄會直接說明原因。",
    remember:
      "不用等其他玩家離開，也不是任何地點都能遠端購買。交易會製造噪音，買與賣共用短暫冷卻。",
  },
  {
    id: "reset",
    number: "09",
    title: "HP 歸零或成為 Echo 後要做什麼？",
    summary: "Mega City 不出局，封存 Legacy、感應與復歸",
    see: "Mega City 倒下會進入黑白 Echo 視角；Reset 期間會依狀態出現 Legacy 與 Insight 選擇。",
    action:
      "Echo 飄往尚未感應的節點並選「感應此地」累積 Intel；Reset 時封存有價值的裝備，再選復歸 Insight。",
    remember:
      "Echo 不能戰鬥或搜刮，但可以移動與感應；最後飄到哪裡不會改變復歸位置。Darkforest 倒下則進入救援／淘汰流程。全局通訊是獨立頻道。",
  },
  {
    id: "finale",
    number: "10",
    title: "怎麼結束一場？",
    summary: "最後生還、根心雙終局與 Dead Zone",
    see: "後半局封鎖會把人推向 Rootheart；條件成立時會出現獨活、交還記憶、加入或打斷的高優先決策。",
    action:
      "想獨活就守住公開的根心引導；想共同歸還就湊齊不同記憶來源並保護儀式。看到他人引導也可打斷。",
    remember:
      "根心不是自動勝利。對局也可能因最後生還、全滅或到時裁決結束；Dead Zone 會強迫所有人正面回答。",
  },
  {
    id: "communication",
    number: "11",
    title: "Log、戰鬥紀錄與全局通訊差在哪裡？",
    summary: "戰局因果、個人交戰與玩家聊天各自分流",
    see:
      "敘事 Log 保存你能知道的戰局因果；戰鬥紀錄固定顯示與你相關或同地點的交鋒；全局通訊是獨立聊天室。",
    action: "眼前操作留在戰場，結果與線索切到 Log；想和玩家說話就開全局通訊，需要時再按單句翻譯。",
    remember:
      "聊天不會改變戰鬥規則，也不會自動進入敘事 Log。遠方交戰遵循迷霧，只會留下槍聲或慘叫等可知線索。",
  },
] as const;

const GAME_TIMELINE = [
  { atMs: 0, key: "opening", fallback: "出生保護" },
  { atMs: BALANCE.timeline.resetStartMs, key: "reset", fallback: "Explosion Reset" },
  { atMs: BALANCE.timeline.resetEndMs, key: "forest", fallback: "Darkforest 開始" },
  {
    atMs: BALANCE.timeline.rootheartFinaleAtMs,
    key: "rootheart",
    fallback: "Rootheart 開放",
  },
  {
    atMs: BALANCE.timeline.suddenDeath.atMs,
    key: "deadzone",
    fallback: "Dead Zone",
  },
  { atMs: BALANCE.timeline.matchEndMs, key: "end", fallback: "到時裁決" },
] as const;

function gameClock(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function TutorialPage() {
  return (
    <main id="main-content" class="tutorial-shell" data-tutorial-app>
      <header class="brand-bar tutorial-brand-bar public-site-header">
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
            <small>RESET PROTOCOL · FIELD TRAINING</small>
          </span>
        </a>
        <PrimaryHeaderNavigation pathname="/tutorial" />
        <div class="public-site-utilities">
          <span id="tutorial-progress-label" class="tutorial-progress-label">0 / 5 已完成</span>
          <LocaleSwitcher />
        </div>
      </header>

      <section class="tutorial-hero" aria-labelledby="tutorial-title">
        <div class="tutorial-hero-copy">
          <p class="eyebrow">SURVIVOR FIELD MANUAL · QUICK MATCH</p>
          <h1 id="tutorial-title">
            <span data-i18n="tutorial.hero.title1">活過爆炸。</span>
            <br />
            <span data-i18n="tutorial.hero.title2">讀懂森林。</span>
          </h1>
          <p data-i18n="tutorial.hero.body">
            一局跨越 Mega City、Explosion Reset 與
            Darkforest。跟著五個決定讀完自己的故事，不必先背下整本規則。
          </p>
          <p class="tutorial-progress-label" data-i18n="tutorial.hero.duration">
            五段短訓練 · 約 2 分鐘
          </p>
          <nav
            class="tutorial-mode-switch"
            aria-label="選擇教學方式"
            data-i18n-aria-label="tutorial.manual.modeLabel"
          >
            <a href="#tutorial-training">
              <b data-i18n="tutorial.manual.quick.title">第一次玩 · 2 分鐘訓練</b>
              <small data-i18n="tutorial.manual.quick.detail">
                跟著五個決定，先學會活下來
              </small>
            </a>
            <a href="#field-manual">
              <b data-i18n="tutorial.manual.open.title">正在玩 · 查一個問題</b>
              <small data-i18n="tutorial.manual.open.detail">
                搜尋商店、Echo、Signal 或按鈕卡住
              </small>
            </a>
          </nav>
        </div>
        <div class="tutorial-hero-radar" aria-hidden="true">
          <span class="radar-node radar-node-1" />
          <span class="radar-node radar-node-2" />
          <span class="radar-node radar-node-3" />
          <span class="radar-node radar-node-4" />
          <span class="radar-node radar-node-5" />
          <span class="radar-node radar-node-6" />
          <strong>
            RESET<br />CHECKPOINT
          </strong>
        </div>
      </section>

      <div
        id="tutorial-progress-track"
        class="tutorial-progress-track"
        role="progressbar"
        aria-labelledby="tutorial-progress-label"
        aria-valuemin={0}
        aria-valuemax={LESSONS.length}
        aria-valuenow={0}
      >
        <span id="tutorial-progress-bar" />
      </div>

      <section
        class="tutorial-interface-guide"
        aria-labelledby="tutorial-interface-title"
      >
        <header class="tutorial-interface-heading">
          <div>
            <p class="eyebrow" data-i18n="tutorial.interface.eyebrow">
              GRAPHICAL FIELD · 60 SECOND READ
            </p>
            <h2 id="tutorial-interface-title" data-i18n="tutorial.interface.title">
              先看懂戰場，再做決定
            </h2>
          </div>
          <p data-i18n="tutorial.interface.body">
            活著時不必在長頁面來回捲動。狀態、路線、人物、物資與結果，都集中在同一個戰術駕駛艙。
          </p>
        </header>

        <div class="tutorial-interface-layout">
          <figure
            class="tutorial-interface-figure"
            data-tutorial-ui-map
            role="img"
            aria-label="圖形化戰術畫面：狀態列、移動箭頭、目標選取、場景物資以及戰場與 Log 切換"
            data-i18n-aria-label="tutorial.interface.ariaLabel"
          >
            <div class="tutorial-interface-screen" aria-hidden="true">
              <div class="tutorial-interface-breadcrumb">
                <em>6</em>
                <span aria-hidden="true">←</span>
                <b data-i18n="arena.breadcrumb.field">主戰場</b>
                <i aria-hidden="true">›</i>
                <span data-i18n="tutorial.interface.breadcrumb.current">角色狀態</span>
                <kbd>Esc</kbd>
              </div>
              <div class="tutorial-interface-hud">
                <span class="tutorial-interface-vital tutorial-interface-hp">
                  <i>1</i>
                  <small>HP</small>
                  <b>86</b>
                  <u />
                </span>
                <span class="tutorial-interface-vital tutorial-interface-stamina">
                  <small>STAMINA</small>
                  <b>72</b>
                  <u />
                </span>
                <span class="tutorial-interface-vital tutorial-interface-signal">
                  <small>SIGNAL</small>
                  <b>24</b>
                  <u />
                </span>
                <span class="tutorial-interface-weapon">
                  <img
                    src={requiredItemIcon("cleaver")}
                    width="34"
                    height="34"
                    alt=""
                  />
                  <span>
                    <small data-i18n="hud.combat.weaponLabel">武器</small>
                    <b data-i18n="item.cleaver">菜刀</b>
                  </span>
                </span>
              </div>

              <div class="tutorial-interface-field">
                <span class="tutorial-guide-exit tutorial-guide-exit-up">
                  <i>2</i>
                  <b>↑</b>
                  <small data-i18n="tutorial.interface.routeLabel">前往下一個地點</small>
                </span>
                <span class="tutorial-guide-exit tutorial-guide-exit-left">
                  <b>←</b>
                </span>
                <span class="tutorial-guide-exit tutorial-guide-exit-right">
                  <b>→</b>
                </span>
                <span class="tutorial-guide-exit tutorial-guide-exit-down">
                  <b>↓</b>
                </span>

                <span class="tutorial-guide-self">
                  <img
                    src="/art/placeholders/scavenger.svg"
                    width="128"
                    height="128"
                    alt=""
                  />
                  <b data-i18n="tutorial.interface.you">你</b>
                </span>

                <span class="tutorial-guide-target">
                  <i>3</i>
                  <span class="tutorial-guide-silhouette" />
                  <b>?</b>
                  <small>CONTACT</small>
                </span>

                <span class="tutorial-guide-loot">
                  <i>4</i>
                  <img
                    src={requiredItemIcon("healthy_food")}
                    width="34"
                    height="34"
                    alt=""
                  />
                  <b data-i18n="hud.label.groundLoot">地上物資</b>
                </span>

                <div class="tutorial-guide-target-dock">
                  <span>
                    <small>TARGET SELECTED</small>
                    <b>CONTACT · C-9F20</b>
                  </span>
                  <span class="tutorial-guide-observe" data-i18n="encounter.observe.label">
                    觀察
                  </span>
                  <span class="tutorial-guide-fire" data-i18n="preview.card.fire">開火</span>
                  <span class="tutorial-guide-cancel">×</span>
                </div>
              </div>

              <div class="tutorial-interface-tabs">
                <span class="is-active">
                  <i>5</i>
                  <b data-i18n="arena.switch.field">戰場</b>
                </span>
                <span>
                  <b data-i18n="arena.switch.log">紀錄</b>
                  <em>2</em>
                </span>
              </div>
            </div>
          </figure>

          <ol class="tutorial-interface-callouts">
            <li data-tutorial-callout="status">
              <span>01</span>
              <div>
                <b data-i18n="tutorial.interface.status.title">先看生存條</b>
                <p data-i18n="tutorial.interface.status.body">
                  上方固定顯示 HP、氣力、Signal 與手上武器；危險倒數會留在眼前。
                </p>
              </div>
            </li>
            <li data-tutorial-callout="movement">
              <span>02</span>
              <div>
                <b data-i18n="tutorial.interface.route.title">箭頭先選目的地</b>
                <p data-i18n="tutorial.interface.route.body">
                  點方向箭頭後，再選較快的趕路或較安靜的潛行；箭頭本身不會立刻出發。
                </p>
              </div>
            </li>
            <li data-tutorial-callout="target">
              <span>03</span>
              <div>
                <b data-i18n="tutorial.interface.target.title">點人物只會選取</b>
                <p data-i18n="tutorial.interface.target.body">
                  勝算會自動出現；接著獨立選擇觀察、開火或取消。只有開火是不可逆動作。
                </p>
              </div>
            </li>
            <li data-tutorial-callout="scene">
              <span>04</span>
              <div>
                <b data-i18n="tutorial.interface.scene.title">直接碰場景物件</b>
                <p data-i18n="tutorial.interface.scene.body">
                  物資、掩體與可用行動都在戰場上；圖示與冷卻圈會告訴你何時能再操作。
                </p>
              </div>
            </li>
            <li data-tutorial-callout="log">
              <span>05</span>
              <div>
                <b data-i18n="tutorial.interface.log.title">戰場與 Log 隨手切換</b>
                <p data-i18n="tutorial.interface.log.body">
                  戰場處理眼前選擇，Log 保存你能知道的結果；全局通訊另在獨立聊天室，不必上下捲整頁。
                </p>
              </div>
            </li>
            <li data-tutorial-callout="breadcrumb">
              <span>06</span>
              <div>
                <b data-i18n="tutorial.interface.breadcrumb.title">子畫面永遠有回程</b>
                <p data-i18n="tutorial.interface.breadcrumb.body">
                  角色、環境、行動或 Log 上方都會顯示「← 主戰場／目前頁面」；點主戰場或按 Esc 返回。
                </p>
              </div>
            </li>
          </ol>
        </div>

        <aside class="tutorial-interface-mobile-note">
          <span aria-hidden="true">↕ ↔</span>
          <div>
            <b data-i18n="tutorial.interface.mobile.title">手機直立、橫向都用同一套操作</b>
            <p data-i18n="tutorial.interface.mobile.body">
              直立適合單手看狀態與切
              Log；橫向讓戰場更寬。兩種方向都固定保留主要操作，不需要在頁首與頁尾來回找按鈕。
            </p>
          </div>
        </aside>
      </section>

      <section id="tutorial-training" class="tutorial-layout">
        <aside
          class="tutorial-index"
          aria-label="訓練章節"
          data-i18n-aria-label="tutorial.chaptersLabel"
        >
          <div class="tutorial-index-heading">
            <span>TRAINING QUEUE</span>
            <button id="tutorial-reset-progress" type="button" data-i18n="tutorial.reset">
              重設
            </button>
          </div>
          <ol id="tutorial-lesson-list">
            {LESSONS.map(([number, title, detail], index) => (
              <li data-lesson-item={index}>
                <button
                  type="button"
                  data-open-lesson={index}
                  aria-current={index === 0 ? "step" : undefined}
                >
                  <span>{number}</span>
                  <span>
                    <b data-i18n={`tutorial.lesson.${index + 1}.title`}>{title}</b>
                    <small data-i18n={`tutorial.lesson.${index + 1}.detail`}>{detail}</small>
                  </span>
                  <i aria-hidden="true">○</i>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <section id="tutorial-stage" class="tutorial-stage" />
      </section>

      <section
        id="field-manual"
        class="tutorial-manual"
        aria-labelledby="tutorial-manual-title"
      >
        <header class="tutorial-manual-heading">
          <div>
            <p class="eyebrow" data-i18n="tutorial.manual.eyebrow">
              SURVIVOR MANUAL · 按問題查
            </p>
            <h2 id="tutorial-manual-title" data-i18n="tutorial.manual.title">
              卡在哪裡，就查哪一題
            </h2>
          </div>
          <p data-i18n="tutorial.manual.body">
            原版說明書的目錄與 FAQ 很有用，但你不必先背完整規則。輸入眼前問題，或直接打開一個章節。
          </p>
        </header>

        <div class="tutorial-manual-tools">
          <label for="tutorial-manual-search">
            <span data-i18n="tutorial.manual.searchLabel">搜尋戰地手冊</span>
            <span class="tutorial-manual-search">
              <span aria-hidden="true">⌕</span>
              <input
                id="tutorial-manual-search"
                type="search"
                autocomplete="off"
                placeholder="例如：商店、Echo、Signal、撿不到"
                data-i18n-placeholder="tutorial.manual.searchPlaceholder"
              />
            </span>
          </label>
          <p
            id="tutorial-manual-search-status"
            role="status"
            aria-live="polite"
          >
            顯示 {MANUAL_TOPICS.length} 個主題
          </p>
        </div>

        <nav
          class="tutorial-manual-index"
          aria-label="戰地手冊主題"
          data-i18n-aria-label="tutorial.manual.indexLabel"
        >
          {MANUAL_TOPICS.map((topic) => (
            <a href={`#manual-${topic.id}`}>
              <span>{topic.number}</span>
              <b data-i18n={`tutorial.manual.${topic.id}.title`}>{topic.title}</b>
            </a>
          ))}
        </nav>

        <section class="tutorial-manual-timeline" aria-labelledby="manual-timeline-title">
          <header>
            <div>
              <p class="eyebrow">MATCH CLOCK</p>
              <h3 id="manual-timeline-title" data-i18n="tutorial.manual.timeline.title">
                先記住這六個時間點
              </h3>
            </div>
            <p data-i18n="tutorial.manual.timeline.body">
              產品概念介面預覽約 30 分鐘的戰局時鐘；狀態以 fixture 訊息為準，不靠動畫完成。本機 demo
              不承諾正式時長。
            </p>
          </header>
          <ol>
            {GAME_TIMELINE.map((step) => (
              <li>
                <time>{gameClock(step.atMs)}</time>
                <b data-i18n={`tutorial.manual.timeline.${step.key}`}>{step.fallback}</b>
              </li>
            ))}
          </ol>
        </section>

        <div id="tutorial-manual-list" class="tutorial-manual-list">
          {MANUAL_TOPICS.map((topic, index) => (
            <details
              id={`manual-${topic.id}`}
              class="tutorial-manual-entry"
              data-manual-entry={topic.id}
              open={index === 0}
            >
              <summary>
                <span>{topic.number}</span>
                <span>
                  <b data-i18n={`tutorial.manual.${topic.id}.title`}>{topic.title}</b>
                  <small data-i18n={`tutorial.manual.${topic.id}.summary`}>
                    {topic.summary}
                  </small>
                </span>
                <i aria-hidden="true">+</i>
              </summary>
              <dl>
                <div>
                  <dt data-i18n="tutorial.manual.label.see">你會看到</dt>
                  <dd data-i18n={`tutorial.manual.${topic.id}.see`}>{topic.see}</dd>
                </div>
                <div>
                  <dt data-i18n="tutorial.manual.label.do">現在要做</dt>
                  <dd data-i18n={`tutorial.manual.${topic.id}.do`}>{topic.action}</dd>
                </div>
                <div>
                  <dt data-i18n="tutorial.manual.label.remember">別誤會</dt>
                  <dd data-i18n={`tutorial.manual.${topic.id}.remember`}>
                    {topic.remember}
                  </dd>
                </div>
              </dl>
              {topic.id === "combat" || topic.id === "loot" || topic.id === "growth"
                ? (
                  <a class="tutorial-manual-related" href="/armory">
                    <span data-i18n="tutorial.manual.moreStats">查看軍械圖鑑與即時數值</span>
                    <span aria-hidden="true">→</span>
                  </a>
                )
                : null}
            </details>
          ))}
        </div>

        <div id="tutorial-manual-empty" class="tutorial-manual-empty" hidden>
          <span aria-hidden="true">?</span>
          <p data-i18n="tutorial.manual.searchEmpty">
            找不到完全相符的主題。換用「商店」「Echo」「Signal」「開火」等畫面上看得到的詞。
          </p>
        </div>
      </section>

      <div class="tutorial-footer">
        <p data-i18n="tutorial.footer">
          所有機率、倒數與結果都由戰局裁定；訓練只教你看懂下一個決定。
        </p>
        <a class="primary-button" href="/">
          <span data-i18n="tutorial.back">完成訓練並返回大廳</span>{" "}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </main>
  );
}
