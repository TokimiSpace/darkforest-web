import BrandMark from "@/components/brand_mark.tsx";
import LocaleSwitcher from "@/components/locale_switcher.tsx";
import PrimaryHeaderNavigation from "@/components/primary_header_navigation.tsx";

const ROLES = [
  {
    id: "scavenger",
    index: "01",
    english: "SCAVENGER",
    title: "拾荒者",
    epithet: "替失物記住名字的人",
    tagline: "在城市丟棄的東西裡，找回仍值得被留下的證據。",
    quote: "不是每件東西都該被帶走；但每件東西都曾屬於誰。",
    art: "/art/placeholders/scavenger.svg",
    token: "/art/placeholders/scavenger.svg",
    alt: "穿著橄欖色不對稱雨披與回收背帶的拾荒者",
    ability: "搜刮成功率 +4%（在機率上限前計入）",
    abilityBody: "你更常把一次搜尋變成實際物資，但不會因此保證稀有掉落。",
    approach: "先看容量、地形與退路，再決定搜刮、換裝或封存 Legacy。",
    affinity: "工匠／通靈",
    risk: "多一次搜索機會，也可能多一次暴露在熱門物資點的時間。",
    stories: [
      {
        phase: "BEFORE · MEGA CITY",
        title: "回收目錄裡最後一頁",
        body:
          "你曾替 Mega City 的市政回收系統登錄無主物。上層只關心重量與殘值，你卻在每個報廢標籤背面記下發現地、原主人留下的記號，以及它最後的去向。當撤離名單開始漏掉人，你的私人目錄反而成了地下城區最可靠的人口記憶。",
      },
      {
        phase: "CHECKPOINT · EXPLOSION RESET",
        title: "保存，不等於佔有",
        body:
          "警報響起時，你帶著目錄折返水務站，想取回一枚仍能證明整個街區存在過的識別片。爆炸熔掉編號，也把保存與佔有分開：你最後封存的不是最昂貴的工具，而是那張已經讀不出名字的標籤。",
      },
      {
        phase: "AFTER · DARKFOREST",
        title: "讓廢墟替消失的人作證",
        body:
          "Darkforest 會讓金屬在根光中重播殘音。你沿著聲音搜刮，把能用的東西送回活人手裡，也追查 Reset 為何發生。每一次成功都逼你做同一個選擇：把物資留給眼前的自己，還是把證據留給可能沒有明天的人。",
      },
    ],
    conflict: "你害怕自己終有一天不再是保存者，只是更會替囤積找理由的人。",
  },
  {
    id: "enforcer",
    index: "02",
    english: "ENFORCER",
    title: "執行者",
    epithet: "替每一次出手承擔後果的人",
    tagline: "秩序崩裂之後，正面承受不再等於服從命令。",
    quote: "準確不是勇敢。知道何時不扣下扳機，才是。",
    art: "/art/placeholders/enforcer.svg",
    token: "/art/placeholders/enforcer.svg",
    alt: "穿著深色重型防護裝與舊紅肩甲的執行者",
    ability: "命中率 +2.5%",
    abilityBody: "職業修正會進入戰鬥 Preview；它提高命中，不會增加武器傷害。",
    approach: "辨識威脅、讀完勝算，再把一次出手變成能承擔的決定。",
    affinity: "硬皮／醫護",
    risk: "更穩定的命中容易讓人過早開戰；人影仍可能是無意交戰的陌生人。",
    stories: [
      {
        phase: "BEFORE · MEGA CITY",
        title: "最後一道封鎖線",
        body:
          "你是危險區的現場執行人，工作是把群眾帶離故障設施，而不是決定誰該被留在門外。城市把紅色肩甲當成命令的象徵；你知道它真正承受的是推擠、碎片，以及每一次來不及說明的選擇。",
      },
      {
        phase: "CHECKPOINT · EXPLOSION RESET",
        title: "命令消失以後",
        body:
          "Explosion Reset 前最後三十秒，指揮頻道先於警報死去。你違反封鎖命令打開閘門，讓最後一批人穿過，卻無法知道他們是否抵達。爆炸吞掉交接紀錄；從那一刻起，你只能替自己的判斷簽名。",
      },
      {
        phase: "AFTER · DARKFOREST",
        title: "保護與支配之間",
        body:
          "Darkforest 沒有完整命令，只有被根系割裂的路與看不清身分的人影。你仍會站在壓力最重的方向，卻開始把觀察當成另一種勇氣。準確出手能保住一條路，也可能讓保護悄悄變成支配。",
      },
    ],
    conflict: "你必須反覆證明：力量可以替別人擋下危險，而不是替別人決定命運。",
  },
  {
    id: "courier",
    index: "03",
    english: "COURIER",
    title: "信使",
    epithet: "把未送達的話帶過斷層的人",
    tagline: "路會消失；只要仍有人等待，方向就不會。",
    quote: "快不是目的。讓某件事還有機會抵達，才是。",
    art: "/art/placeholders/courier.svg",
    token: "/art/placeholders/courier.svg",
    alt: "穿著深藍長風衣與斜向路線背帶的信使",
    ability: "趕路消耗 −3 氣力（25 → 22）",
    abilityBody: "腳傷後的趕路消耗為 27；這是職業折扣，不是 Courier 背景的移動冷卻。",
    approach: "用省下的氣力改線、救人或脫離交戰；快慢兩種移動仍各有噪音代價。",
    affinity: "輕足／通靈",
    risk: "抵達目標與停下救人，常是同一秒鐘裡的兩種背叛。",
    stories: [
      {
        phase: "BEFORE · MEGA CITY",
        title: "未送達的最後一句話",
        body:
          "你在斷線街區間傳遞未經市政網路的訊息。你記路，卻不留下收件人的名單；你確認一句話抵達，卻從不追問它會改變誰。當 Mega City 的通訊被分區封死，人們仍用你的腳步知道彼此活著。",
      },
      {
        phase: "CHECKPOINT · EXPLOSION RESET",
        title: "地圖失效，方向留下",
        body:
          "爆炸前，你帶著一封沒有署名的訊息趕向議會尖塔。衝擊波把熟悉的捷徑翻成斷層，紙圖成了錯誤的承諾。你封存的是辨認風、回音與出口的方式；若成為 Echo，也是在那時第一次看見道路如何被災難重新接起。",
      },
      {
        phase: "AFTER · DARKFOREST",
        title: "抵達不是逃離",
        body:
          "在 Darkforest，根系會替路改名，人影會讓每次會合都帶著風險。你仍傳遞物資、方向與活人的消息，因為抵達從來不只是逃離：它是讓兩個原本會錯過的人，重新擁有選擇。",
      },
    ],
    conflict: "你最怕的不是晚到，而是為了準時抵達，錯過了真正需要你停下的人。",
  },
] as const;

const TRAITS = [
  {
    id: "medic",
    label: "醫護",
    effect: "繃帶與醫療包回血 +20%；食物不受加成。",
  },
  {
    id: "artisan",
    label: "工匠",
    effect: "工具每四次揮擊，有一次不消耗耐久。",
  },
  {
    id: "attuned",
    label: "通靈",
    effect: "首次 Attune 情報 +1；Echo 移動冷卻 ×0.75。",
  },
  {
    id: "tough",
    label: "硬皮",
    effect: "生命上限 +10，並以提高後的滿血開局。",
  },
  {
    id: "fleet",
    label: "輕足",
    effect: "移動冷卻 ×0.92；滑倒機率減半。",
  },
] as const;

function RolePortrait(
  { role, priority = false, mobileToken = false }: {
    role: typeof ROLES[number];
    priority?: boolean;
    mobileToken?: boolean;
  },
) {
  return (
    <picture>
      {mobileToken ? <source media="(max-width: 700px)" srcSet={role.token} /> : null}
      <img
        src={role.art}
        width="768"
        height="1152"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        alt={role.alt}
        data-i18n-alt={`characters.role.${role.id}.alt`}
      />
    </picture>
  );
}

export default function CharactersPage() {
  return (
    <main id="main-content" class="characters-shell" data-characters-page>
      <header class="brand-bar characters-brand-bar public-site-header">
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
            <small>RESET PROTOCOL · CHARACTER ARCHIVE</small>
          </span>
        </a>
        <PrimaryHeaderNavigation pathname="/characters" />
        <div class="public-site-utilities">
          <LocaleSwitcher />
        </div>
      </header>

      <section class="characters-hero" aria-labelledby="characters-title">
        <div class="characters-hero-copy">
          <p class="eyebrow" data-i18n="characters.hero.eyebrow">
            SURVIVOR DOSSIERS · 三種活法
          </p>
          <h1 id="characters-title">
            <span data-i18n="characters.hero.title1">不是三個固定英雄。</span>
            <br />
            <span data-i18n="characters.hero.title2">是三種在毀滅裡活下來的方法。</span>
          </h1>
          <p data-i18n="characters.hero.body">
            以下檔案是職業原型與世界觀視角。你的名字、ROOTBOUND／Human
            陣營與標語仍由你決定；每局特性則在開場重新抽取。
          </p>
          <div class="characters-hero-actions">
            <a class="primary-button" href="#character-paths">
              <span data-i18n="characters.hero.explore">翻閱倖存者檔案</span>
              <span aria-hidden="true">↓</span>
            </a>
            <a class="header-link" href="/" data-i18n="characters.hero.create">
              建立你的倖存者
            </a>
          </div>
        </div>
        <div
          class="characters-lineup"
          aria-label="三種倖存者職業"
          data-i18n-aria-label="characters.lineupLabel"
        >
          {ROLES.map((role, index) => (
            <figure class={`characters-lineup-${role.id}`}>
              <RolePortrait role={role} priority={index === 0} mobileToken />
              <figcaption>
                <span>{role.index}</span>
                <b data-i18n={`characters.role.${role.id}.title`}>{role.title}</b>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <nav
        id="character-paths"
        class="characters-path-nav"
        aria-label="選擇職業檔案"
        data-i18n-aria-label="characters.pathNavLabel"
      >
        <span data-i18n="characters.pathNavPrompt">你會怎麼活下去？</span>
        {ROLES.map((role) => (
          <a href={`#role-${role.id}`}>
            <small>{role.index}</small>
            <b data-i18n={`characters.role.${role.id}.title`}>{role.title}</b>
            <span>{role.english}</span>
          </a>
        ))}
      </nav>

      <section
        class="characters-dossiers"
        aria-label="職業原型完整檔案"
        data-i18n-aria-label="characters.dossiersLabel"
      >
        {ROLES.map((role) => (
          <article id={`role-${role.id}`} class={`character-dossier is-${role.id}`}>
            <div class="character-dossier-art">
              <span class="character-dossier-index" aria-hidden="true">{role.index}</span>
              <RolePortrait role={role} />
              <div class="character-dossier-silhouette" aria-hidden="true" />
              <p>{role.english} · PROFESSION ARCHETYPE</p>
            </div>
            <div class="character-dossier-copy">
              <header>
                <p class="eyebrow" data-i18n={`characters.role.${role.id}.epithet`}>
                  {role.epithet}
                </p>
                <h2>
                  <span data-i18n={`characters.role.${role.id}.title`}>{role.title}</span>
                  <small>{role.english}</small>
                </h2>
                <p data-i18n={`characters.role.${role.id}.tagline`}>{role.tagline}</p>
              </header>

              <blockquote>
                <p data-i18n={`characters.role.${role.id}.quote`}>「{role.quote}」</p>
              </blockquote>

              <section class="character-ability" aria-labelledby={`ability-${role.id}`}>
                <div>
                  <span data-i18n="characters.ability.fixed">固定職業被動</span>
                  <h3 id={`ability-${role.id}`} data-i18n={`characters.role.${role.id}.ability`}>
                    {role.ability}
                  </h3>
                  <p data-i18n={`characters.role.${role.id}.abilityBody`}>{role.abilityBody}</p>
                </div>
                <dl>
                  <div>
                    <dt data-i18n="characters.ability.approach">操作思路</dt>
                    <dd data-i18n={`characters.role.${role.id}.approach`}>{role.approach}</dd>
                  </div>
                  <div>
                    <dt data-i18n="characters.ability.affinity">敘事相性</dt>
                    <dd data-i18n={`characters.role.${role.id}.affinity`}>{role.affinity}</dd>
                  </div>
                  <div>
                    <dt data-i18n="characters.ability.risk">代價</dt>
                    <dd data-i18n={`characters.role.${role.id}.risk`}>{role.risk}</dd>
                  </div>
                </dl>
              </section>

              <details class="character-chronicle" open>
                <summary>
                  <span data-i18n="characters.chronicle.title">完整生還紀錄</span>
                  <small data-i18n="characters.chronicle.hint">爆炸前 → Reset → Darkforest</small>
                </summary>
                <div class="character-chronicle-timeline">
                  {role.stories.map((story, storyIndex) => (
                    <section>
                      <span>{story.phase}</span>
                      <h3 data-i18n={`characters.role.${role.id}.story.${storyIndex + 1}.title`}>
                        {story.title}
                      </h3>
                      <p data-i18n={`characters.role.${role.id}.story.${storyIndex + 1}.body`}>
                        {story.body}
                      </p>
                    </section>
                  ))}
                </div>
                <aside>
                  <span data-i18n="characters.chronicle.conflict">內在衝突</span>
                  <p data-i18n={`characters.role.${role.id}.conflict`}>{role.conflict}</p>
                </aside>
              </details>
            </div>
          </article>
        ))}
      </section>

      <section class="characters-traits" aria-labelledby="characters-traits-title">
        <header>
          <p class="eyebrow" data-i18n="characters.traits.eyebrow">MATCH TRAITS · 每局重新抽取</p>
          <h2 id="characters-traits-title" data-i18n="characters.traits.title">
            職業定義方法；特性改寫這一局。
          </h2>
          <p data-i18n="characters.traits.body">
            開場會從五種特性中抽一項。它不會永久累積，也不會向其他玩家公開；檔案中的相性只是玩法建議，不是指定配對。
          </p>
        </header>
        <ol>
          {TRAITS.map((trait, index) => (
            <li>
              <span aria-hidden="true">0{index + 1}</span>
              <div>
                <h3 data-i18n={`characters.trait.${trait.id}.label`}>{trait.label}</h3>
                <p data-i18n={`characters.trait.${trait.id}.effect`}>{trait.effect}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section class="characters-world" aria-labelledby="characters-world-title">
        <header>
          <p class="eyebrow" data-i18n="characters.world.eyebrow">WORLD FIGURES · 非玩家角色</p>
          <h2 id="characters-world-title" data-i18n="characters.world.title">
            他們會回應世界，但不替玩家決定結果。
          </h2>
        </header>
        <div class="characters-world-grid">
          <article class="world-figure is-supply">
            <figure class="world-figure-art">
              <img
                src="/art/placeholders/contact.svg"
                width="1280"
                height="549"
                loading="lazy"
                decoding="async"
                alt="Abstract local supply terminal"
                data-i18n-alt="characters.world.supply.alt"
              />
              <figcaption>PUBLIC DEMO · LOCAL FIXTURE</figcaption>
            </figure>
            <div class="world-figure-copy">
              <p data-i18n="characters.world.supply.location">公開示範 · 野地工坊</p>
              <h3 data-i18n="characters.world.supply.title">補給站</h3>
              <strong data-i18n="characters.world.supply.role">本機示範交易介面</strong>
              <p data-i18n="characters.world.supply.story">
                固定補給站用來示範抵達指定節點後，前端如何呈現買賣、價格與限量庫存。所有資料都來自本機
                fixture，不包含正式服務或未公開 NPC 內容。
              </p>
              <dl>
                <div>
                  <dt data-i18n="characters.world.can">能做</dt>
                  <dd data-i18n="characters.world.supply.can">
                    呈現本機 fixture 的目錄、價格、庫存與買賣狀態。
                  </dd>
                </div>
                <div>
                  <dt data-i18n="characters.world.cannot">不能做</dt>
                  <dd data-i18n="characters.world.supply.cannot">
                    不代表正式遊戲的角色、內容、平衡或服務契約。
                  </dd>
                </div>
              </dl>
            </div>
          </article>

          <article class="world-figure is-arbora">
            <figure class="world-figure-art">
              <img
                src="/art/placeholders/contact.svg"
                width="1280"
                height="549"
                loading="lazy"
                decoding="async"
                alt="Arbora rising above the ruins of Darkforest"
                data-i18n-alt="characters.world.arbora.alt"
              />
              <figcaption>PUBLIC DEMO · WORLD FIGURE</figcaption>
            </figure>
            <div class="world-figure-copy">
              <p>ROOTHEART · MEMORY WITNESS</p>
              <h3>Arbora</h3>
              <strong data-i18n="characters.world.arbora.role">中立世界樹、殘響的見證者</strong>
              <p data-i18n="characters.world.arbora.story">
                Mega City 曾把地下根系的訊號當成基礎設施雜訊；Explosion Reset 之後，人們才用 Arbora
                稱呼那個會保存災難殘響的存在。它不替任何陣營說話，只在 Echo、調諧與 Rootheart
                前，把已經存在的記憶重新排列給你看。
              </p>
              <dl>
                <div>
                  <dt data-i18n="characters.world.can">能做</dt>
                  <dd data-i18n="characters.world.arbora.can">
                    回應 Echo 的主動提問；在 Rootheart 接受 2–3 名合格玩家共同交還記憶。
                  </dd>
                </div>
                <div>
                  <dt data-i18n="characters.world.cannot">不能做</dt>
                  <dd data-i18n="characters.world.arbora.cannot">
                    不掌握攻擊、行動、掉落、數值或勝負權限，也不會替玩家選邊。
                  </dd>
                </div>
              </dl>
            </div>
          </article>
        </div>
      </section>

      <section class="characters-identity" aria-labelledby="characters-identity-title">
        <div>
          <p class="eyebrow" data-i18n="characters.identity.eyebrow">YOUR SURVIVOR · 由你完成</p>
          <h2 id="characters-identity-title" data-i18n="characters.identity.title">
            原型給你方法；名字與誓言由你留下。
          </h2>
          <p data-i18n="characters.identity.body">
            ROOTBOUND 是人的文化誓言，不是動物、善惡陣營或固定隊伍；Human 也不是反派。玩家不能成為
            NPC。選好名字與陣營後，城市會讓你的職業與本局特性真正落進同一場故事。
          </p>
        </div>
        <div class="characters-oaths">
          <blockquote>
            <b>NO ONE LEFT BEHIND.</b>
            <span data-i18n="characters.identity.rootbound">
              同族誓言要求克制，也允許透過救援贖回破裂的關係。
            </span>
          </blockquote>
          <blockquote>
            <b>WE DON'T START FIGHTS. WE FINISH 'EM.</b>
            <span data-i18n="characters.identity.retaliation">
              只有在先遭受攻擊時，反擊才成為這句話的事實。
            </span>
          </blockquote>
        </div>
        <a class="primary-button" href="/">
          <span data-i18n="characters.identity.cta">建立倖存者並等待下一班</span>
          <span aria-hidden="true">→</span>
        </a>
      </section>
    </main>
  );
}
