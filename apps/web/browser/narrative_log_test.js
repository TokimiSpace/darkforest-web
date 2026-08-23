// @ts-check
import { finalAllDead, finalCovenant, openingMegaCity } from "@darkforest/fixtures";
import {
  appendNarrativeEntries,
  arenaSceneUrl,
  cachePriorityState,
  deriveNarrative,
  ECHO_TWO_INSIGHT_TARGET,
  edgeFlavorLine,
  equipmentNarrativeLine,
  eventsToNarrative,
  eventToNarrative,
  formatNarrativeTimestamp,
  itemUseNarrativeLine,
  localizedPlaceName,
  narrativeEntryMatchesFilter,
  narrativeNodeName,
  narrativeTagAdjectives,
  openingLoadoutNarrative,
  personalCombatNarrativeEntries,
  PLACE_NAME_I18N_KEYS,
  projectAuthoritativeEnding,
  rejectedActionReceiptLine,
  rejectionNarrativeLine,
} from "./narrative_log.js";
import { activateMatchLocale, MATCH_CATALOGS, t } from "./match_i18n_test_helper.js";

/** @template T @param {T} actual @param {T} expected @param {string} label */
function assertEquals(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}\nexpected: ${expected}\nactual:   ${actual}`);
}

/** @returns {import("@darkforest/protocol").PlayerView} */
function cloneView() {
  return structuredClone(openingMegaCity.view);
}

/** @param {import("@darkforest/protocol").PlayerView} view @param {number} atGameMs */
function context(view = cloneView(), atGameMs = 1_062_000) {
  return { view, atGameMs, idPrefix: "test" };
}

/** @param {import("@darkforest/protocol").MatchEvent} event @param {import("@darkforest/protocol").PlayerView} view */
function text(event, view = cloneView()) {
  return eventToNarrative(event, context(view), 0)?.text ?? null;
}

Deno.test("26 個 canonical 地點在六語都有顯示名，未知新地點安全回退", () => {
  /** @type {Record<string, string[]>} */
  const expectedSamples = {
    "zh-TW": ["水務站", "黑水沼澤", "議會尖塔", "風暴棲臺"],
    "zh-CN": ["水务站", "黑水沼泽", "议会尖塔", "风暴栖台"],
    ja: ["水道施設", "黒水湿地", "議会尖塔", "嵐の止まり木"],
    ko: ["상수도 시설", "검은물 습지", "의회 첨탑", "폭풍 둥지"],
    en: ["Waterworks", "Blackwater Marsh", "Council Spire", "Stormperch"],
    vi: ["Trạm Cấp Nước", "Đầm Lầy Nước Đen", "Tháp Hội Đồng", "Đài Canh Bão"],
  };
  assertEquals(Object.keys(PLACE_NAME_I18N_KEYS).length, 26, "public place-pair coverage");
  try {
    for (const locale of Object.keys(MATCH_CATALOGS)) {
      activateMatchLocale(/** @type {keyof typeof MATCH_CATALOGS} */ (locale));
      for (const [canonical, key] of Object.entries(PLACE_NAME_I18N_KEYS)) {
        const localized = localizedPlaceName(canonical);
        assertEquals(localized === key, false, `${locale}.${key} must not leak a raw key`);
        if (locale !== "en") {
          assertEquals(localized === canonical, false, `${locale}.${canonical} must be localized`);
        }
      }
      assertEquals(
        JSON.stringify([
          localizedPlaceName("Waterworks"),
          localizedPlaceName("Blackwater Marsh"),
          localizedPlaceName("Council Spire"),
          localizedPlaceName("Stormperch"),
        ]),
        JSON.stringify(expectedSamples[locale]),
        `${locale} representative names`,
      );
    }
    assertEquals(localizedPlaceName("Future Glasshouse"), "Future Glasshouse", "future fallback");
  } finally {
    activateMatchLocale("zh-TW");
  }
});

Deno.test("節點顯示會隨世界階段翻譯，但場景素材仍使用 canonical 身分", () => {
  const megacity = cloneView();
  const waterworks = megacity.map.nodes.find((node) => node.nameMegaCity === "Waterworks");
  if (waterworks === undefined) throw new Error("fixture must contain Waterworks");
  try {
    activateMatchLocale("ja");
    megacity.phase = "megacity";
    assertEquals(narrativeNodeName(megacity, waterworks.id), "水道施設", "before display name");
    assertEquals(
      arenaSceneUrl(megacity, waterworks),
      "/art/placeholders/scene.svg",
      "localized copy cannot break before art",
    );
    megacity.phase = "darkforest";
    assertEquals(narrativeNodeName(megacity, waterworks.id), "黒水湿地", "after display name");
    assertEquals(
      arenaSceneUrl(megacity, waterworks),
      "/art/placeholders/scene.svg",
      "localized copy cannot break after art",
    );
  } finally {
    activateMatchLocale("zh-TW");
  }
});

Deno.test("公開敘事拒絕理由逐字固定", () => {
  const codes = [
    "COOLDOWN_ACTIVE",
    "NOT_ADJACENT",
    "RANGE_LOS",
    "BLOCKED_EDGE",
    "STYLE_NOT_ALLOWED",
    "NO_STAMINA",
    "NO_RECOVERY_NEEDED",
    "NO_AMMO",
    "NO_DURABILITY",
    "NO_COVER_SLOT",
    "NO_SEARCHES_LEFT",
    "SPAWN_GRACE",
    "TARGET_HIDDEN",
    "INVALID_TARGET",
    "CAPACITY_FULL",
    "NOT_EQUIPPABLE",
    "CACHE_PRIORITY",
    "NO_CACHE",
    "WRONG_STATUS",
    "WRONG_PHASE",
    "STALE_VERSION",
    "NO_ECHO_TRACE",
    "FINALE_LOCKED",
    "FINALE_CONTESTED",
    "RITUAL_REQUIREMENTS",
    "OFFER_EXPIRED",
  ];
  codes.forEach((code) => {
    assertEquals(
      rejectionNarrativeLine(code),
      t(`narrative.rejection.${code.toLowerCase()}`),
      code,
    );
  });
  assertEquals(
    rejectionNarrativeLine("NOT_EQUIPPABLE", { shoe: true }),
    t("narrative.rejection.not_equippable_shoe"),
    "鞋槽",
  );
  assertEquals(
    rejectionNarrativeLine("SOME_TECHNICAL_FAILURE"),
    t("narrative.rejection.fallback"),
    "技術性 fallback",
  );
  assertEquals(
    rejectionNarrativeLine("NO_CREDITS"),
    t("shop.error.noCredits"),
    "現金不足",
  );
  assertEquals(
    rejectionNarrativeLine("NO_STOCK"),
    t("shop.error.noStock"),
    "特色貨售罄",
  );
});

Deno.test("拒絕回條在六語都同時保留嘗試動作與伺服器理由", () => {
  for (const locale of Object.keys(MATCH_CATALOGS)) {
    activateMatchLocale(/** @type {keyof typeof MATCH_CATALOGS} */ (locale));
    const action = t("action.name.attack", { target: "P07" });
    const reason = rejectionNarrativeLine("COOLDOWN_ACTIVE");
    const receipt = rejectedActionReceiptLine(action, reason);
    assertEquals(receipt.includes(action), true, `${locale} receipt action`);
    assertEquals(receipt.includes(reason), true, `${locale} receipt reason`);
    assertEquals(receipt.includes("action.receipt.rejected"), false, `${locale} translated`);
  }
  activateMatchLocale("zh-TW");
});

Deno.test("終局投影只轉交 authority ending/reason/winners 與本機收到的 self events", () => {
  const covenantDiffs = finalCovenant.followupDiffs ?? [];
  const covenantEnded = covenantDiffs.flatMap((diff) => diff.events).findLast((event) =>
    event.kind === "match_ended"
  );
  if (covenantEnded?.kind !== "match_ended") throw new Error("finalCovenant ending missing");
  const entries = covenantDiffs.flatMap((diff, index) =>
    eventsToNarrative(diff.events, {
      view: finalCovenant.view,
      atGameMs: diff.gameNowMs,
      idPrefix: `covenant-${index}`,
    })
  );
  const projected = projectAuthoritativeEnding(
    covenantEnded,
    finalCovenant.view.self,
    entries,
    2,
  );
  assertEquals(projected.ending, covenantEnded.ending, "ending stays authoritative");
  assertEquals(projected.reason, covenantEnded.reason, "reason stays authoritative");
  assertEquals(
    JSON.stringify(projected.winners),
    JSON.stringify(covenantEnded.winners),
    "winner order and membership stay authoritative",
  );
  assertEquals(projected.selfIsWinner, true, "self result is direct winners[] membership");
  assertEquals(projected.recentJourney.length, 2, "journey obeys its visible-event limit");
  assertEquals(
    projected.recentJourney.every((entry) => entry.kind !== "match_ended"),
    true,
    "ending sentence is not duplicated as a journey milestone",
  );

  const allDeadEnded = (finalAllDead.followupDiffs ?? []).flatMap((diff) => diff.events).findLast(
    (event) => event.kind === "match_ended",
  );
  if (allDeadEnded?.kind !== "match_ended") throw new Error("finalAllDead ending missing");
  const allDead = projectAuthoritativeEnding(
    allDeadEnded,
    { ...finalAllDead.view.self, status: "eliminated" },
    [],
  );
  assertEquals(allDead.ending, "none", "none ending is not converted into a winner");
  assertEquals(allDead.reason, "all_dead", "all_dead reason remains explicit");
  assertEquals(allDead.winners.length, 0, "empty authority winners remain empty");
  assertEquals(allDead.selfIsWinner, false, "empty winners cannot imply a local winner");
  assertEquals(allDead.recentJourney.length, 0, "missing local history stays explicitly empty");
});

Deno.test("Cache 優先提示必須同時符合所有者與尚未到期", () => {
  assertEquals(
    cachePriorityState("P01", 20_001, "P01", 20_000),
    "yours",
    "期限內本人擁有優先權",
  );
  assertEquals(
    cachePriorityState("P01", 20_001, "P02", 20_000),
    "reserved",
    "期限內旁人只看見已保留",
  );
  assertEquals(
    cachePriorityState("P01", 20_000, "P01", 20_000),
    "open",
    "等於截止時刻已經開放",
  );
});

Deno.test("Field Supply 商店成交只進本人敘事，買入自動上身不重複播報", () => {
  const bought = /** @type {const} */ ({
    kind: "shop_traded",
    player: "P01",
    side: "buy",
    item: "stab_jacket",
    price: 28,
  });
  assertEquals(
    text(bought),
    t("narrative.shop.bought", { item: t("item.stab_jacket"), price: 28 }),
    "本人買入",
  );
  assertEquals(
    text({ kind: "shop_traded", player: "P01", side: "sell", item: "scrap", price: 6 }),
    t("narrative.shop.sold", { item: t("item.scrap"), price: 6 }),
    "本人賣出",
  );
  assertEquals(
    text({ kind: "shop_traded", player: "P02", side: "buy", item: "medkit", price: 60 }),
    null,
    "他人交易不可見",
  );

  const lines = eventsToNarrative(
    [
      { kind: "equipped", player: "P01", item: "stab_jacket" },
      bought,
    ],
    context(),
  );
  assertEquals(lines.length, 1, "買入自動上身只留成交句");
  assertEquals(
    lines[0]?.text,
    t("narrative.shop.bought", { item: t("item.stab_jacket"), price: 28 }),
    "成交句優先",
  );
});

Deno.test("現金差值只在搜刮與本人擊倒時產生核准來源句", () => {
  const previous = cloneView();
  previous.self.credits = 0;
  const found = structuredClone(previous);
  found.self.credits = 8;
  assertEquals(
    deriveNarrative(
      previous,
      found,
      [{ kind: "search_result", player: "P01", found: { kind: "bandage", count: 1 } }],
      "credits-found",
    )[0]?.text,
    t("narrative.credits.found", { amount: 8 }),
    "搜刮現金",
  );

  const rewarded = structuredClone(found);
  rewarded.self.credits = 33;
  assertEquals(
    deriveNarrative(
      found,
      rewarded,
      [{ kind: "player_downed", player: "P02", node: "N1", downedUntilMs: 9_000, by: "P01" }],
      "credits-reward",
    )[0]?.text,
    t("narrative.credits.reward", { amount: 25 }),
    "擊倒獎勵",
  );

  const sold = structuredClone(found);
  sold.self.credits = 6;
  assertEquals(
    deriveNarrative(
      previous,
      sold,
      [{ kind: "shop_traded", player: "P01", side: "sell", item: "scrap", price: 6 }],
      "credits-sale",
    ).length,
    0,
    "賣出已由成交事件敘述",
  );

  const unexplained = structuredClone(previous);
  unexplained.self.credits = 15;
  assertEquals(
    deriveNarrative(previous, unexplained, [], "credits-reset").length,
    0,
    "無核准來源句時保持安靜",
  );
});

Deno.test("公開敘事恢復品逐字呈現實際 HP／氣力增量", () => {
  const events = /** @type {import("@darkforest/protocol").MatchEvent[]} */ ([
    {
      kind: "recovery_completed",
      player: "P01",
      item: "bandage",
      hpGained: 18,
      staminaGained: 0,
    },
    {
      kind: "recovery_completed",
      player: "P01",
      item: "medkit",
      hpGained: 31,
      staminaGained: 0,
    },
    {
      kind: "recovery_completed",
      player: "P01",
      item: "healthy_food",
      hpGained: 10,
      staminaGained: 37,
    },
    {
      kind: "recovery_completed",
      player: "P01",
      item: "spoiled_food",
      hpGained: 0,
      staminaGained: 25,
      discomfortUntilMs: 1_082_000,
    },
  ]);
  const lines = eventsToNarrative(events, context()).map((entry) => entry.text);
  assertEquals(lines[0], t("narrative.recovery.bandage", { hpGained: 18 }), "bandage");
  assertEquals(lines[1], t("narrative.recovery.medkit", { hpGained: 31 }), "medkit cap");
  assertEquals(
    lines[2],
    t("narrative.recovery.healthy_food", { hpGained: 10, staminaGained: 37 }),
    "healthy food",
  );
  assertEquals(
    lines[3],
    t("narrative.recovery.spoiled_food", { staminaGained: 25, seconds: 20 }),
    "spoiled food",
  );
});

Deno.test("局內升級敘事只收本人事件，並直接使用 hpGained", () => {
  const view = cloneView();
  const gained =
    /** @type {Extract<import("@darkforest/protocol").MatchEvent, {kind: "level_up"}>} */ ({
      kind: "level_up",
      player: view.self.playerId,
      level: 2,
      maxHp: 105,
      hpGained: 5,
    });
  assertEquals(
    text(gained, view),
    t("narrative.levelUp.line", { level: 2, hp: 5 }),
    "升級文案必須綁 hpGained，不得把 maxHp 當增量",
  );

  assertEquals(
    text({ ...gained, player: "P02" }, view),
    null,
    "他人的 level_up 不得進本人 log",
  );
  assertEquals(
    text({ ...gained, level: view.progressionRules.levelCap }, view),
    t("narrative.levelUp.max", { level: view.progressionRules.levelCap }),
    "封頂使用獨立文案",
  );
});

Deno.test("傷勢事件依來源與部位取核准句，且只收本人事件", () => {
  const view = cloneView();
  const self = view.self.playerId;
  const cases =
    /** @type {Array<{event: import("@darkforest/protocol").MatchEvent, key: string}>} */ ([
      {
        event: { kind: "injury_inflicted", player: self, part: "leg", source: "combat" },
        key: "narrative.injury.combat.leg",
      },
      {
        event: { kind: "injury_inflicted", player: self, part: "arm", source: "combat" },
        key: "narrative.injury.combat.arm",
      },
      {
        event: { kind: "injury_inflicted", player: self, part: "leg", source: "slip" },
        key: "narrative.injury.slip",
      },
      {
        event: { kind: "injury_inflicted", player: self, part: "arm", source: "shock" },
        key: "narrative.injury.shock",
      },
      {
        event: { kind: "injury_cured", player: self, part: "leg" },
        key: "narrative.injuryCured.leg",
      },
      {
        event: { kind: "injury_cured", player: self, part: "arm" },
        key: "narrative.injuryCured.arm",
      },
    ]);

  try {
    for (const locale of /** @type {const} */ (["zh-TW", "zh-CN", "ja", "ko", "en", "vi"])) {
      activateMatchLocale(locale);
      for (const { event, key } of cases) {
        assertEquals(text(event, view), t(key), `${locale} ${key}`);
      }
    }
  } finally {
    activateMatchLocale("zh-TW");
  }

  assertEquals(
    text({ kind: "injury_inflicted", player: "P02", part: "arm", source: "combat" }, view),
    null,
    "他人的負傷事件不得進本人 log",
  );
  assertEquals(
    text({ kind: "injury_cured", player: "P02", part: "leg" }, view),
    null,
    "他人的治癒事件不得進本人 log",
  );
});

Deno.test("公開敘事區分進食中斷、成功完成與腸胃恢復", () => {
  const previous = cloneView();
  previous.gameNowMs = 40_000;
  previous.self.casting = { item: "spoiled_food", completesAtMs: 43_000 };
  const interrupted = structuredClone(previous);
  interrupted.gameNowMs = 41_000;
  delete interrupted.self.casting;
  assertEquals(
    deriveNarrative(previous, interrupted, [], "food-interrupted")[0]?.text,
    t("narrative.casting.food_interrupted"),
    "interrupted food",
  );

  const completed = deriveNarrative(previous, interrupted, [{
    kind: "recovery_completed",
    player: "P01",
    item: "spoiled_food",
    hpGained: 0,
    staminaGained: 25,
    discomfortUntilMs: 63_000,
  }], "food-completed");
  assertEquals(completed.length, 0, "completion event suppresses false interruption");

  const uncomfortable = cloneView();
  uncomfortable.gameNowMs = 42_000;
  uncomfortable.self.discomfortUntilMs = 50_000;
  const recovered = structuredClone(uncomfortable);
  recovered.gameNowMs = 50_000;
  delete recovered.self.discomfortUntilMs;
  assertEquals(
    deriveNarrative(uncomfortable, recovered, [], "food-recovered")[0]?.text,
    t("narrative.discomfort.ended"),
    "discomfort ended",
  );
});

Deno.test("公開敘事八條路線風味逐字固定", () => {
  ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "r1"].forEach((edgeId) => {
    assertEquals(edgeFlavorLine(edgeId), t(`narrative.edge.${edgeId}`), edgeId);
  });
  assertEquals(edgeFlavorLine("missing"), null, "unknown edge has no invented copy");
});

Deno.test("got_lost 對目的地與折返使用核准句式", () => {
  const view = cloneView();
  view.self.node = "N2";
  const normal = eventToNarrative(
    { kind: "got_lost", player: "P01", intended: "N6", actual: "N2" },
    { ...context(view), previousNode: "N1" },
    0,
  );
  assertEquals(
    normal?.text,
    t("narrative.got_lost.detour", {
      intended: localizedPlaceName("Seed Vault"),
      actual: localizedPlaceName("Maintenance Ring"),
    }),
    "detour copy",
  );
  const returned = eventToNarrative(
    { kind: "got_lost", player: "P01", intended: "N6", actual: "N1" },
    { ...context(view), previousNode: "N1" },
    0,
  );
  assertEquals(returned?.text, t("narrative.got_lost.foldback"), "foldback copy");
});

Deno.test("equipped、armor_broken 與開局包句式保持一致", () => {
  assertEquals(
    equipmentNarrativeLine("composite_chest"),
    t("narrative.equip.composite_chest"),
    "equip phrase",
  );
  assertEquals(
    text({ kind: "equipped", player: "P01", item: "stab_jacket" }),
    t("narrative.equip.stab_jacket"),
    "equipped event",
  );
  assertEquals(
    text({ kind: "armor_broken", player: "P01", item: "stab_jacket" }),
    t("narrative.armor_broken.self", { item: t("item.stab_jacket") }),
    "broken event",
  );
  assertEquals(
    openingLoadoutNarrative(cloneView().self.inventory),
    t("narrative.opening_loadout", {
      items: `${t("item.bandage")}${t("narrative.list_separator")}${
        t("item.stack", {
          item: t("item.light_ammo"),
          count: 6,
        })
      }`,
    }),
    "opening loadout",
  );
  assertEquals(
    openingLoadoutNarrative([
      { kind: "tool", count: 1, durability: 36 },
      { kind: "bandage", count: 2 },
    ]),
    t("narrative.opening_loadout", {
      items: `${t("item.bandage")}${t("narrative.list_separator")}${t("item.bandage")}`,
    }),
    "duplicate starter draws",
  );
  assertEquals(
    itemUseNarrativeLine("scrap"),
    t("narrative.item_use.scrap"),
    "廢料修理工具",
  );
  assertEquals(itemUseNarrativeLine("bandage"), null, "非核准物品不自創句式");
});

Deno.test("combat 敘事依你是誰與命中結果分支", () => {
  assertEquals(
    text({
      kind: "combat",
      sourceNode: "N4",
      targetNode: "N4",
      attacker: "P01",
      target: "P02",
      weapon: "pistol",
      hit: true,
      damage: 23,
      targetHpBand: "hurt",
    }),
    t("narrative.combat.self_hit", {
      weapon: t("item.pistol"),
      target: "P02",
      damage: 23,
    }),
    "自己命中",
  );
  assertEquals(
    text({
      kind: "combat",
      sourceNode: "N1",
      targetNode: "N1",
      attacker: "P01",
      target: "P02",
      weapon: "tool",
      hit: false,
      damage: 0,
      targetHpBand: "healthy",
    }),
    t("narrative.combat.self_miss", { weapon: t("item.tool") }),
    "自己未中",
  );
  assertEquals(
    text({
      kind: "combat",
      sourceNode: "N2",
      targetNode: "N1",
      attacker: "P02",
      target: "P01",
      weapon: "rifle",
      hit: true,
      damage: 31,
      targetHpBand: "critical",
    }),
    t("narrative.combat.hit_by", { attacker: "P02", weapon: t("item.rifle"), damage: 31 }),
    "被命中",
  );
  assertEquals(
    text({
      kind: "combat",
      sourceNode: "N1",
      targetNode: "N1",
      attacker: "P02",
      target: "P01",
      weapon: "tool",
      hit: false,
      damage: 0,
      targetHpBand: "healthy",
    }),
    t("narrative.combat.missed_by", { attacker: "P02", weapon: t("item.tool") }),
    "攻擊自己未中",
  );
  assertEquals(
    text({
      kind: "combat",
      sourceNode: "N4",
      targetNode: "N4",
      attacker: "P02",
      target: "P03",
      weapon: "tool",
      hit: true,
      damage: 15,
      targetHpBand: "hurt",
    }),
    t("narrative.combat.witness_exchange", { attacker: "P02", target: "P03" }),
    "旁觀",
  );
});

Deno.test("迷霧投影只讓同節點第三方交火顯示身分，遠距只留下聲音", () => {
  const sameNode = text({
    kind: "combat",
    sourceNode: "N4",
    targetNode: "N4",
    attacker: "P02",
    target: "P03",
    weapon: "pistol",
    hit: true,
    damage: 18,
    targetHpBand: "hurt",
  });
  const distantGun = text({
    kind: "combat",
    sourceNode: "N2",
    targetNode: "N3",
    attacker: "P02",
    target: "P03",
    weapon: "pistol",
    hit: true,
    damage: 18,
    targetHpBand: "hurt",
  });
  const distantTool = text({
    kind: "combat",
    sourceNode: "N2",
    targetNode: "N3",
    attacker: "P02",
    target: "P03",
    weapon: "tool",
    hit: false,
    damage: 0,
    targetHpBand: "healthy",
  });
  assertEquals(
    sameNode,
    t("narrative.combat.witness_exchange", { attacker: "P02", target: "P03" }),
    "同節點保留可見身分",
  );
  assertEquals(
    distantGun,
    t("narrative.noise.gunshot", { direction: localizedPlaceName("Maintenance Ring") }),
    "遠距槍戰匿名化",
  );
  assertEquals(
    distantTool,
    t("narrative.noise.metal", { direction: localizedPlaceName("Maintenance Ring") }),
    "遠距近戰匿名化",
  );

  const spectator = cloneView();
  spectator.self.status = "eliminated";
  assertEquals(
    text({
      kind: "combat",
      sourceNode: "N2",
      targetNode: "N3",
      attacker: "P02",
      target: "P03",
      weapon: "pistol",
      hit: true,
      damage: 18,
      targetHpBand: "hurt",
    }, spectator),
    t("narrative.combat.witness_exchange", { attacker: "P02", target: "P03" }),
    "60 秒延遲觀戰保留上帝視角",
  );
});

Deno.test("遠距倒地結果只是一聲慘叫，不洩露身分、死因或剩餘人數", () => {
  const view = cloneView();
  view.aliveCount = 7;
  const distantEcho = eventToNarrative(
    { kind: "player_echoed", player: "P03", node: "N2", by: "P02" },
    context(view),
    0,
  );
  const distantElimination = eventToNarrative(
    { kind: "player_eliminated", player: "P04", node: "N3", by: "zone" },
    context(view),
    1,
  );
  assertEquals(distantEcho?.text, t("narrative.distant_cry"), "遠距 Echo 匿名化");
  assertEquals(distantEcho?.fatal, false, "遠距慘叫不觸發致命 Banner");
  assertEquals(distantElimination?.text, t("narrative.distant_cry"), "遠距淘汰匿名化");
  assertEquals(distantElimination?.fatal, false, "遠距淘汰不觸發致命 Banner");
});

Deno.test("同批遠距交火、槍聲與致命結果只產生一條迷霧線索", () => {
  const combat = /** @type {import("@darkforest/protocol").MatchEvent} */ ({
    kind: "combat",
    sourceNode: "N2",
    targetNode: "N3",
    attacker: "P02",
    target: "P03",
    weapon: "pistol",
    hit: true,
    damage: 18,
    targetHpBand: "hurt",
  });
  const noise = /** @type {import("@darkforest/protocol").MatchEvent} */ ({
    kind: "noise",
    node: "N2",
    loudness: 20,
  });
  const ordinary = eventsToNarrative([combat, noise], context());
  assertEquals(ordinary.length, 1, "交火與同源 noise 合併");
  assertEquals(
    ordinary[0]?.text,
    t("narrative.noise.gunshot", { direction: localizedPlaceName("Maintenance Ring") }),
    "保留聲音線索",
  );

  const fatal = eventsToNarrative([
    { kind: "player_echoed", player: "P03", node: "N3", by: "P02" },
    combat,
    noise,
  ], context());
  assertEquals(fatal.length, 1, "致命結果蓋過同批交火與 noise");
  assertEquals(fatal[0]?.text, t("narrative.distant_cry"), "只留匿名慘叫");

  const unrelatedDeath = eventsToNarrative([
    { kind: "player_eliminated", player: "P04", node: "N3", by: "zone" },
    combat,
    noise,
  ], context());
  assertEquals(unrelatedDeath.length, 2, "同節點不同玩家的死亡不可吞掉交火聲");
  assertEquals(unrelatedDeath[0]?.text, t("narrative.distant_cry"), "保留獨立死亡線索");
  assertEquals(
    unrelatedDeath[1]?.text,
    t("narrative.noise.gunshot", { direction: localizedPlaceName("Maintenance Ring") }),
    "保留獨立交火線索",
  );
});

Deno.test("固定戰鬥紀錄只保留與本人直接相關的最近八筆", () => {
  const build = (
    /** @type {import("@darkforest/protocol").MatchEvent} */ event,
    /** @type {number} */ index,
  ) => eventToNarrative(event, context(), index);
  const entries = [
    build({
      kind: "combat",
      sourceNode: "N1",
      targetNode: "N1",
      attacker: "P01",
      target: "P02",
      weapon: "tool",
      hit: true,
      damage: 10,
      targetHpBand: "hurt",
    }, 0),
    build({
      kind: "combat",
      sourceNode: "N1",
      targetNode: "N1",
      attacker: "P02",
      target: "P03",
      weapon: "tool",
      hit: true,
      damage: 10,
      targetHpBand: "hurt",
    }, 1),
    build(
      { kind: "player_downed", player: "P03", node: "N1", downedUntilMs: 90_000, by: "P01" },
      2,
    ),
    build({ kind: "armor_broken", player: "P01", item: "stab_jacket" }, 3),
  ].filter((candidate) => candidate !== null);
  const personal = personalCombatNarrativeEntries(entries, "P01");
  assertEquals(personal.length, 3, "排除不涉及本人的目擊交火");
  assertEquals(
    personal.some((candidate) => candidate.event?.kind === "player_downed"),
    true,
    "保留本人造成的倒地",
  );
  assertEquals(
    personal.some((candidate) => candidate.event?.kind === "armor_broken"),
    true,
    "保留本人裂甲",
  );

  const overflow = Array.from({ length: 10 }, (_, index) =>
    build({
      kind: "combat",
      sourceNode: "N1",
      targetNode: "N1",
      attacker: "P01",
      target: "P02",
      weapon: "tool",
      hit: true,
      damage: index + 1,
      targetHpBand: "hurt",
    }, index + 10)).filter((candidate) => candidate !== null);
  const limited = personalCombatNarrativeEntries(
    [...overflow.slice(0, 5), entries[1], ...overflow.slice(5)],
    "P01",
  );
  assertEquals(limited.length, 8, "先排除無關事件，再保留最近八筆");
  assertEquals(limited[0]?.id, "test-12", "截掉最舊兩筆本人事件");
  assertEquals(limited.at(-1)?.id, "test-19", "保留最新本人事件");
});

Deno.test("downed/echoed/eliminated 使用 by 並標記致命級", () => {
  const selfDowned = eventToNarrative(
    { kind: "player_downed", player: "P01", node: "N1", downedUntilMs: 90_000, by: "P02" },
    context(),
    0,
  );
  assertEquals(
    selfDowned?.text,
    t("narrative.downed.self_by", { by: "P02" }),
    "自己倒地",
  );
  assertEquals(selfDowned?.fatal, true, "倒地 fatal");
  assertEquals(
    text({ kind: "player_downed", player: "P03", node: "N4", downedUntilMs: 90_000, by: "P02" }),
    t("narrative.downed.witness_by", { player: "P03", by: "P02" }),
    "他人倒地",
  );
  assertEquals(
    text({ kind: "player_echoed", player: "P01", node: "N1", by: "P02" }),
    t("narrative.echoed.self_by", { by: "P02" }),
    "自己 Echo",
  );
  assertEquals(
    text({ kind: "player_echoed", player: "P03", node: "N4", by: "P02" }),
    t("narrative.echoed.witness", { player: "P03" }),
    "他人 Echo",
  );
  assertEquals(
    text({ kind: "player_eliminated", player: "P01", node: "N1", by: "timeout" }),
    t("narrative.eliminated.self_timeout"),
    "自己 timeout",
  );
  const view = cloneView();
  view.aliveCount = 7;
  assertEquals(
    text({ kind: "player_eliminated", player: "P03", node: "N4", by: "zone" }, view),
    t("narrative.eliminated.broadcast_zone", { player: "P03", aliveCount: 7 }),
    "他人 zone",
  );
});

Deno.test("其餘事件模板保持核准措辭", () => {
  const view = cloneView();
  view.phase = "darkforest";
  view.self.hp = 83;
  /** @type {Array<[import("@darkforest/protocol").MatchEvent, string]>} */
  const cases = [
    [
      { kind: "echo_returned", player: "P01", node: "N1", insights: 2 },
      t("narrative.echo_returned.self", { hp: 83, insights: 2 }),
    ],
    [
      { kind: "echo_returned", player: "P02", node: "N1", insights: 1 },
      t("narrative.echo_returned.broadcast", { player: "P02" }),
    ],
    [
      { kind: "search_result", player: "P01", found: { kind: "bandage", count: 2 } },
      t("narrative.search.found", {
        item: t("item.stack", { item: t("item.bandage"), count: 2 }),
      }),
    ],
    [{ kind: "search_result", player: "P01", found: null }, t("narrative.search.empty")],
    [{ kind: "hide_result", player: "P01", success: true }, t("narrative.hide.success")],
    [{ kind: "hide_result", player: "P01", success: false }, t("narrative.hide.fail")],
    [
      { kind: "player_spotted", player: "P02", node: "N1" },
      t("narrative.spotted", { player: "P02" }),
    ],
    [{
      kind: "hazard_triggered",
      player: "P01",
      node: "N4",
      hazard: "conductive_puddle",
      damage: 8,
    }, t("narrative.hazard.electric_self", { damage: 8 })],
    [{
      kind: "hazard_triggered",
      player: "P02",
      node: "N4",
      hazard: "conductive_puddle",
      damage: 8,
    }, t("narrative.hazard.electric_witness", { player: "P02" })],
    [
      { kind: "hazard_triggered", player: "P01", node: "N3", hazard: "slip", damage: 0 },
      t("narrative.hazard.slip_self"),
    ],
    [
      { kind: "hazard_revealed", node: "N4", hazardId: "h1", hazard: "conductive_puddle" },
      t("narrative.hazard.revealed", { node: localizedPlaceName("Flooded Atrium") }),
    ],
    [
      { kind: "noise", node: "N2", loudness: 20 },
      t("narrative.noise.gunshot", { direction: localizedPlaceName("Field Workshop") }),
    ],
    [
      { kind: "noise", node: "N2", loudness: 15 },
      t("narrative.noise.metal", { direction: localizedPlaceName("Field Workshop") }),
    ],
    [
      { kind: "noise", node: "N2", loudness: 10 },
      t("narrative.noise.nearby", { direction: localizedPlaceName("Field Workshop") }),
    ],
    [
      { kind: "noise", node: "N2", loudness: 5 },
      t("narrative.noise.faint", { direction: localizedPlaceName("Field Workshop") }),
    ],
    [
      { kind: "blockade_preview", node: "N5", closesAtMs: 1_122_000 },
      t("narrative.blockade.preview", {
        node: localizedPlaceName("Buried Passage"),
        countdown: "01:00",
      }),
    ],
    [
      { kind: "blockade_closed", node: "N5" },
      t("narrative.blockade.closed", { node: localizedPlaceName("Buried Passage") }),
    ],
    [
      { kind: "reset_started", atMs: 1_080_000 },
      t("narrative.reset.started"),
    ],
    [
      { kind: "reset_completed", collapsedEdges: ["e3"], openedEdges: ["r1"] },
      t("narrative.reset.completed"),
    ],
    [
      { kind: "oath_changed", player: "P01", oath: "broken" },
      t("narrative.oath.broken"),
    ],
    [{ kind: "oath_changed", player: "P01", oath: "restored" }, t("narrative.oath.restored")],
    [
      { kind: "oath_changed", player: "P02", oath: "oathed" },
      t("narrative.oath.witness", { player: "P02", oath: "oathed" }),
    ],
    [{ kind: "final_reckoning", atMs: 2_400_000 }, t("narrative.final_reckoning")],
    [
      {
        kind: "match_ended",
        winners: ["P01"],
        ending: "solo_survivor",
        reason: "last_standing",
      },
      t("narrative.match_ended.last_standing_self"),
    ],
    [{
      kind: "match_ended",
      winners: ["P02"],
      ending: "solo_survivor",
      reason: "last_standing",
    }, t("narrative.match_ended.last_standing_broadcast", { winner: "P02" })],
    [{
      kind: "match_ended",
      winners: [],
      ending: "none",
      reason: "all_dead",
    }, t("narrative.match_ended.none")],
    [{
      kind: "match_ended",
      winners: ["P01", "P03"],
      ending: "arbora_covenant",
      reason: "finale_coop",
    }, t("narrative.match_ended.finale_coop_self")],
  ];
  cases.forEach(([event, expected], index) => {
    assertEquals(text(event, view), expected, `event case ${index + 1}`);
  });
});

Deno.test("公開敘事雙終局六事件與 Sudden Death 逐字固定", () => {
  /** @type {Array<[import("@darkforest/protocol").MatchEvent, string, "self" | "broadcast"]>} */
  const cases = [
    [
      { kind: "sudden_death_started", atMs: 1_260_000 },
      t("narrative.sudden_death"),
      "self",
    ],
    [
      {
        kind: "finale_offer_started",
        node: "N1",
        mode: "arbora",
        initiator: "P01",
        deadlineMs: 1_080_000,
      },
      t("narrative.finale.offer_self"),
      "self",
    ],
    [
      {
        kind: "finale_offer_started",
        node: "N1",
        mode: "arbora",
        initiator: "P02",
        deadlineMs: 1_080_000,
      },
      t("narrative.finale.offer_broadcast", { initiator: "P02" }),
      "broadcast",
    ],
    [
      { kind: "finale_joined", node: "N1", player: "P01", participants: ["P02", "P01"] },
      t("narrative.finale.joined_self", { count: 2 }),
      "self",
    ],
    [
      { kind: "finale_joined", node: "N1", player: "P03", participants: ["P02", "P03"] },
      t("narrative.finale.joined_other", { player: "P03", count: 2 }),
      "broadcast",
    ],
    [
      {
        kind: "finale_channel_started",
        node: "N1",
        mode: "solo",
        participants: ["P01"],
        deadlineMs: 1_100_000,
      },
      t("narrative.finale.channel_solo_self"),
      "self",
    ],
    [
      {
        kind: "finale_channel_started",
        node: "N1",
        mode: "solo",
        participants: ["P02"],
        deadlineMs: 1_100_000,
      },
      t("narrative.finale.channel_solo_broadcast", { player: "P02" }),
      "broadcast",
    ],
    [
      {
        kind: "finale_channel_started",
        node: "N1",
        mode: "arbora",
        participants: ["P01", "P03"],
        deadlineMs: 1_115_000,
      },
      t("narrative.finale.channel_arbora_self"),
      "self",
    ],
    [
      {
        kind: "finale_channel_started",
        node: "N1",
        mode: "arbora",
        participants: ["P02", "P03"],
        deadlineMs: 1_115_000,
      },
      t("narrative.finale.channel_arbora_broadcast", { players: "P02、P03" }),
      "broadcast",
    ],
    [
      { kind: "finale_claimed", node: "N1", mode: "solo", winners: ["P01"] },
      t("narrative.finale.claimed_self"),
      "self",
    ],
    [
      { kind: "finale_claimed", node: "N1", mode: "solo", winners: ["P02"] },
      t("narrative.finale.claimed_broadcast", { winner: "P02" }),
      "broadcast",
    ],
    [
      {
        kind: "finale_completed",
        node: "N1",
        mode: "solo",
        ending: "solo_survivor",
      },
      t("narrative.finale.completed_solo"),
      "broadcast",
    ],
    [
      {
        kind: "finale_completed",
        node: "N1",
        mode: "arbora",
        ending: "arbora_covenant",
      },
      t("narrative.finale.completed_arbora"),
      "broadcast",
    ],
  ];
  cases.forEach(([event, expected, level], index) => {
    const rendered = eventToNarrative(event, context(), index);
    assertEquals(rendered?.text, expected, `終局事件 ${index + 1} 文案`);
    assertEquals(rendered?.level, level, `終局事件 ${index + 1} 層級`);
  });
});

Deno.test("公開敘事移動途中遭遇六句逐字固定且僅本人可見", () => {
  const rushView = cloneView();
  rushView.visiblePlayers = [{
    ref: "P02",
    identified: true,
    playerId: "P02",
    background: "courier",
    status: "active",
    node: "N2",
    hpBand: "healthy",
    equippedWeapon: "pistol",
    armorSilhouette: "light",
    limping: false,
    oath: "none",
  }, {
    ref: "C-private-contact",
    identified: false,
    status: "active",
    node: "N2",
    equippedWeapon: "rifle",
    armorSilhouette: "medium",
    limping: false,
  }];
  rushView.encounterPrompt = {
    encounterId: "enc-rush",
    from: "N1",
    intendedTo: "N2",
    edgeId: "e1",
    style: "rush",
    deadlineMs: 1_074_000,
    targetRefs: ["P02", "C-private-contact"],
  };
  const rush = eventToNarrative(
    {
      kind: "travel_encounter_started",
      player: "P01",
      encounterId: "enc-rush",
      node: "N2",
      deadlineMs: 1_074_000,
    },
    context(rushView),
    0,
  );
  const silhouette = t("narrative.silhouette.description", {
    weapon: t("narrative.silhouette.weapon_outline", { item: t("item.rifle") }),
    armor: t("armor.medium"),
  });
  assertEquals(
    rush?.text,
    t("narrative.encounter.started_rush", {
      targets: `P02${t("narrative.list_separator")}${silhouette}`,
      seconds: 12,
    }),
    "rush",
  );
  assertEquals(rush?.level, "self", "rush 層級");
  assertEquals(rush?.text.includes("C-private-contact"), false, "不洩漏 contact ref");

  const sneakView = structuredClone(rushView);
  sneakView.encounterPrompt = {
    ...rushView.encounterPrompt,
    encounterId: "enc-sneak",
    style: "sneak",
    targetRefs: ["C-private-contact"],
  };
  assertEquals(
    text({
      kind: "travel_encounter_started",
      player: "P01",
      encounterId: "enc-sneak",
      node: "N2",
      deadlineMs: 1_074_000,
    }, sneakView),
    t("narrative.encounter.started_sneak", { targets: silhouette, seconds: 12 }),
    "sneak",
  );

  /** @type {Array<["continued" | "engaged" | "lost_sight" | "timeout", string]>} */
  const resolvedCases = [
    ["continued", t("narrative.encounter.continued")],
    ["engaged", t("narrative.encounter.engaged")],
    ["lost_sight", t("narrative.encounter.lost_sight")],
    ["timeout", t("narrative.encounter.timeout")],
  ];
  resolvedCases.forEach(([outcome, expected]) => {
    assertEquals(
      text({
        kind: "travel_encounter_resolved",
        player: "P01",
        encounterId: "enc-rush",
        outcome,
      }),
      expected,
      outcome,
    );
  });

  assertEquals(
    text({
      kind: "travel_encounter_started",
      player: "P02",
      encounterId: "enc-rush",
      node: "N2",
      deadlineMs: 1_074_000,
    }, rushView),
    null,
    "他人的 started 不顯示",
  );
  assertEquals(
    text({
      kind: "travel_encounter_resolved",
      player: "P02",
      encounterId: "enc-rush",
      outcome: "engaged",
    }),
    null,
    "他人的 resolved 不顯示",
  );
});

Deno.test("公開敘事 finale_interrupted 八種 reason 與旁觀分支", () => {
  /** @type {Array<[Extract<import("@darkforest/protocol").MatchEvent, {kind: "finale_interrupted"}>, string, "self" | "broadcast"]>} */
  const selfCases = [
    [
      { kind: "finale_interrupted", node: "N1", interruptor: "P02", reason: "damage" },
      t("narrative.finale.interrupted_pain"),
      "self",
    ],
    [
      { kind: "finale_interrupted", node: "N1", interruptor: "P02", reason: "downed" },
      t("narrative.finale.interrupted_pain"),
      "self",
    ],
    [
      { kind: "finale_interrupted", node: "N1", interruptor: "P01", reason: "move" },
      t("narrative.finale.interrupted_withdraw"),
      "self",
    ],
    [
      { kind: "finale_interrupted", node: "N1", interruptor: "P01", reason: "leave" },
      t("narrative.finale.interrupted_withdraw"),
      "self",
    ],
    [
      { kind: "finale_interrupted", node: "N1", interruptor: "P01", reason: "cancelled" },
      t("narrative.finale.interrupted_withdraw"),
      "self",
    ],
  ];
  selfCases.forEach(([event, expected, level], index) => {
    const relatedEvents = event.reason === "damage"
      ? [{
        kind: /** @type {const} */ ("combat"),
        sourceNode: "N2",
        targetNode: "N1",
        attacker: "P02",
        target: "P01",
        weapon: /** @type {const} */ ("pistol"),
        hit: true,
        damage: 10,
        targetHpBand: /** @type {const} */ ("hurt"),
      }, event]
      : event.reason === "downed"
      ? [{
        kind: /** @type {const} */ ("player_downed"),
        player: "P01",
        node: "N1",
        downedUntilMs: 1_100_000,
        by: "P02",
      }, event]
      : [event];
    const rendered = eventsToNarrative(relatedEvents, {
      ...context(),
      previousFinaleParticipants: ["P01"],
    }).at(-1);
    assertEquals(rendered?.text, expected, `中斷自我 ${index + 1} 文案`);
    assertEquals(rendered?.level, level, `中斷自我 ${index + 1} 層級`);
  });

  const outsiderParticipant = eventToNarrative(
    { kind: "finale_interrupted", node: "N1", interruptor: "P04", reason: "outsider" },
    { ...context(), previousFinaleParticipants: ["P01", "P03"] },
    0,
  );
  assertEquals(
    outsiderParticipant?.text,
    t("narrative.finale.interrupted_outsider_self", { interruptor: "P04" }),
    "outsider 參與者",
  );
  assertEquals(outsiderParticipant?.level, "self", "outsider 參與者層級");

  const outsiderWitness = eventToNarrative(
    { kind: "finale_interrupted", node: "N1", interruptor: "P04", reason: "outsider" },
    { ...context(), previousFinaleParticipants: ["P02", "P03"] },
    0,
  );
  assertEquals(
    outsiderWitness?.text,
    t("narrative.finale.interrupted_outsider_broadcast", { interruptor: "P04" }),
    "outsider 旁觀",
  );
  assertEquals(outsiderWitness?.level, "broadcast", "outsider 旁觀層級");

  assertEquals(
    text({ kind: "finale_interrupted", node: "N1", interruptor: "P02", reason: "timeout" }),
    t("narrative.finale.interrupted_timeout"),
    "timeout",
  );
  assertEquals(
    text({ kind: "finale_interrupted", node: "N1", interruptor: "P02", reason: "ritual" }),
    t("narrative.finale.interrupted_ritual"),
    "ritual",
  );

  const attackerIsSelf = eventsToNarrative([
    {
      kind: "combat",
      sourceNode: "N2",
      targetNode: "N1",
      attacker: "P01",
      target: "P02",
      weapon: "pistol",
      hit: true,
      damage: 10,
      targetHpBand: "hurt",
    },
    { kind: "finale_interrupted", node: "N1", interruptor: "P01", reason: "damage" },
  ], { ...context(), previousFinaleParticipants: ["P02"] }).at(-1);
  assertEquals(
    attackerIsSelf?.text,
    t("narrative.finale.interrupted_default"),
    "attacker 不得誤標為受傷參與者",
  );
  assertEquals(attackerIsSelf?.level, "broadcast", "attacker 旁觀層級");

  const environmental = eventsToNarrative([
    {
      kind: "hazard_triggered",
      player: "P01",
      node: "N1",
      hazard: "conductive_puddle",
      damage: 8,
    },
    { kind: "finale_interrupted", node: "N1", interruptor: "P01", reason: "damage" },
  ], { ...context(), previousFinaleParticipants: ["P01"] }).at(-1);
  assertEquals(
    environmental?.text,
    t("narrative.finale.interrupted_pain"),
    "環境傷害當事者",
  );
  assertEquals(environmental?.level, "self", "環境傷害層級");
});

Deno.test("公開敘事 match_ended 依 reason/ending 分句", () => {
  /** @type {Array<[import("@darkforest/protocol").MatchEvent, string, "self" | "broadcast"]>} */
  const cases = [
    [
      {
        kind: "match_ended",
        winners: ["P01"],
        ending: "solo_survivor",
        reason: "last_standing",
      },
      t("narrative.match_ended.last_standing_self"),
      "self",
    ],
    [
      {
        kind: "match_ended",
        winners: ["P02"],
        ending: "solo_survivor",
        reason: "last_standing",
      },
      t("narrative.match_ended.last_standing_broadcast", { winner: "P02" }),
      "broadcast",
    ],
    [
      {
        kind: "match_ended",
        winners: ["P01"],
        ending: "solo_survivor",
        reason: "finale_solo",
      },
      t("narrative.match_ended.finale_solo_self"),
      "self",
    ],
    [
      {
        kind: "match_ended",
        winners: ["P02"],
        ending: "solo_survivor",
        reason: "finale_solo",
      },
      t("narrative.match_ended.finale_solo_broadcast", { winner: "P02" }),
      "broadcast",
    ],
    [
      {
        kind: "match_ended",
        winners: ["P01", "P03"],
        ending: "arbora_covenant",
        reason: "finale_coop",
      },
      t("narrative.match_ended.finale_coop_self"),
      "self",
    ],
    [
      {
        kind: "match_ended",
        winners: ["P02", "P03"],
        ending: "arbora_covenant",
        reason: "finale_coop",
      },
      t("narrative.match_ended.finale_coop_broadcast", { winners: "P02、P03" }),
      "broadcast",
    ],
    [
      {
        kind: "match_ended",
        winners: ["P01"],
        ending: "solo_survivor",
        reason: "sudden_death_tiebreak",
      },
      t("narrative.match_ended.tiebreak_self"),
      "self",
    ],
    [
      {
        kind: "match_ended",
        winners: ["P02"],
        ending: "solo_survivor",
        reason: "sudden_death_tiebreak",
      },
      t("narrative.match_ended.tiebreak_broadcast", { winner: "P02" }),
      "broadcast",
    ],
    [
      {
        kind: "match_ended",
        winners: [],
        ending: "none",
        reason: "all_dead",
      },
      t("narrative.match_ended.none"),
      "broadcast",
    ],
  ];
  cases.forEach(([event, expected, level], index) => {
    const rendered = eventToNarrative(event, context(), index);
    assertEquals(rendered?.text, expected, `match_ended ${index + 1} 文案`);
    assertEquals(rendered?.level, level, `match_ended ${index + 1} 層級`);
  });
});

Deno.test("公開敘事 finale interruptor 出現與消失", () => {
  const previous = cloneView();
  previous.finale = {
    mode: "arbora",
    stage: "channel",
    node: "N1",
    initiator: "P02",
    participants: ["P01", "P02"],
    deadlineMs: 1_100_000,
    supplyTraceReady: true,
    echoMemoryReady: true,
  };
  const interrupted = structuredClone(previous);
  interrupted.finale = {
    ...previous.finale,
    interruptor: "P03",
    interruptCompletesAtMs: 1_068_000,
  };
  assertEquals(
    deriveNarrative(previous, interrupted, [], "interrupt-start").map((entry) => entry.text).join(
      "\n",
    ),
    t("narrative.finale.interruptor_appeared"),
    "interruptor 出現",
  );
  const resumed = structuredClone(previous);
  assertEquals(
    deriveNarrative(interrupted, resumed, [], "interrupt-stop").map((entry) => entry.text).join(
      "\n",
    ),
    t("narrative.finale.interruptor_gone"),
    "interruptor 消失",
  );
  const ended = structuredClone(interrupted);
  ended.finale = undefined;
  assertEquals(
    deriveNarrative(interrupted, ended, [], "interrupt-ended").length,
    0,
    "finale 結束不誤報儀式續行",
  );
});

Deno.test("runtime view.map 名稱與舊 map 名稱皆可用", () => {
  const runtime = cloneView();
  const runtimeNode = runtime.map.nodes.find((node) => node.id === "N1");
  if (runtimeNode === undefined) throw new Error("N1 fixture missing");
  runtimeNode.nameMegaCity = "Rootheart Hollow";
  assertEquals(
    eventToNarrative(
      { kind: "blockade_closed", node: "N1" },
      context(runtime),
      0,
    )?.text,
    t("narrative.blockade.closed", { node: "Rootheart Hollow" }),
    "runtime map node name",
  );
  assertEquals(
    text({ kind: "blockade_closed", node: "N1" }),
    t("narrative.blockade.closed", { node: localizedPlaceName("Red Root") }),
    "legacy map fallback",
  );

  runtime.phase = "ended";
  runtimeNode.nameDarkforest = "The Root Remembers";
  assertEquals(
    eventToNarrative(
      { kind: "blockade_closed", node: "N1" },
      context(runtime),
      0,
    )?.text,
    t("narrative.blockade.closed", { node: "The Root Remembers" }),
    "ended keeps the final Darkforest topology names",
  );
});

Deno.test("公開敘事 echo_attuned 只在 Intel 增加時使用核准句", () => {
  const view = cloneView();
  view.self.disasterIntel = 2;
  assertEquals(
    text({
      kind: "echo_attuned",
      player: "P01",
      node: "N3",
      intelGained: 1,
      firstAttune: true,
      recentCombat: false,
    }, view),
    t("narrative.echo_attuned", { intel: 2, target: ECHO_TWO_INSIGHT_TARGET }),
    "Intel 增加",
  );
  assertEquals(
    text({
      kind: "echo_attuned",
      player: "P01",
      node: "N3",
      intelGained: 0,
      firstAttune: false,
      recentCombat: false,
    }, view),
    null,
    "重複 Attune 不自創句式",
  );
});

Deno.test("cache 從同批倒地事件推得玩家，未知時用模糊措辭", () => {
  const view = cloneView();
  const activeContext = context(view, 10_000);
  const entries = eventsToNarrative([
    { kind: "player_echoed", player: "P07", node: "N1", by: "P03" },
    {
      kind: "cache_dropped",
      cacheId: "cache-owner",
      node: "N1",
      priorityFor: "P01",
      untilMs: 20_000,
      items: [{ kind: "tool", count: 1 }],
    },
  ], activeContext);
  assertEquals(
    entries[1]?.text,
    t("narrative.cache.dropped_priority", { owner: "P07" }),
    "cache owner",
  );
  assertEquals(
    eventToNarrative(
      {
        kind: "cache_dropped",
        cacheId: "cache-immediate-open",
        node: "N1",
        priorityFor: view.self.playerId,
        untilMs: activeContext.atGameMs,
        items: [{ kind: "tool", count: 1 }],
      },
      activeContext,
      0,
      "P07",
    )?.text,
    t("narrative.cache.dropped", { owner: "P07" }),
    "無擊倒者占位所有者不得誤報優先權",
  );
  assertEquals(
    text({
      kind: "cache_dropped",
      cacheId: "cache-unknown",
      node: "N1",
      priorityFor: "P03",
      untilMs: 20_000,
      items: [],
    }),
    t("narrative.cache.dropped", { owner: t("narrative.cache.unknown_owner") }),
    "cache uncertain owner",
  );
});

Deno.test("從 view 差異合成九種環境句子", () => {
  const previous = cloneView();
  previous.gameNowMs = 29_000;
  previous.self.signal = 59;
  previous.self.node = "N1";
  previous.visiblePlayers = [{
    ref: "P02",
    identified: true,
    playerId: "P02",
    background: "courier",
    status: "active",
    node: "N1",
    hpBand: "healthy",
    equippedWeapon: "tool",
    armorSilhouette: "light",
    limping: false,
    oath: "none",
  }];
  Object.assign(previous.self, { casting: { item: "bandage" } });

  const current = cloneView();
  current.gameNowMs = 30_000;
  current.self.node = "N3";
  current.self.signal = 60;
  current.self.hp = previous.self.hp - 8;
  current.self.status = "echo";
  current.visiblePlayers = [{
    ref: "P03",
    identified: true,
    playerId: "P03",
    background: "rootbound",
    status: "active",
    node: "N3",
    hpBand: "healthy",
    equippedWeapon: "tool",
    armorSilhouette: "light",
    limping: false,
    oath: "none",
  }, {
    ref: "P05",
    identified: true,
    playerId: "P05",
    background: "courier",
    status: "active",
    node: "N2",
    hpBand: "healthy",
    equippedWeapon: "tool",
    armorSilhouette: "light",
    limping: false,
    oath: "none",
  }];
  current.legacyPrompt = {
    deadlineMs: 150_000,
    options: [],
    maxSelections: 2,
    suggestedItems: [],
  };

  const texts = deriveNarrative(previous, current, [], "derived").map((entry) => entry.text);
  const expected = [
    t("narrative.arrival.tagged", {
      node: localizedPlaceName("Waterworks"),
      adjectives: `${t("tag.WET")}${t("narrative.list_separator")}${t("tag.MUD")}`,
    }),
    t("narrative.visible.arrived", { player: "P03", background: "ROOTBOUND" }),
    t("narrative.visible.distant", {
      player: "P05",
      node: localizedPlaceName("Maintenance Ring"),
    }),
    t("narrative.left.identified", { player: "P02" }),
    t("narrative.echoed.self_unknown"),
    t("narrative.echo.attune_hint", { target: ECHO_TWO_INSIGHT_TARGET }),
    t("narrative.signal.warning", { signal: 60 }),
    t("narrative.legacy.prompt", { max: 2, seconds: 120 }),
    t("narrative.casting.heal_interrupted"),
    t("narrative.spawn_grace.ended"),
  ];
  assertEquals(texts.join("\n"), expected.join("\n"), "B/C 全句型");
  assertEquals(
    narrativeTagAdjectives(["CRAMPED", "OPEN", "WET"]),
    `${t("tag.CRAMPED")}${t("narrative.list_separator")}${t("tag.OPEN")}`,
    "取前兩標籤",
  );
});

Deno.test("耐久武器只在本人戰鬥損毀時合成 Scrap 去向敘事", () => {
  const previous = cloneView();
  previous.self.inventory = [{ kind: "cleaver", count: 1, durability: 1 }];
  previous.self.equippedWeapon = "cleaver";
  const current = structuredClone(previous);
  current.self.inventory = [{ kind: "scrap", count: 1 }];
  current.self.equippedWeapon = null;
  current.stateVersion += 1;
  const combat = /** @type {import("@darkforest/protocol").MatchEvent} */ ({
    kind: "combat",
    sourceNode: previous.self.node,
    targetNode: previous.self.node,
    attacker: previous.self.playerId,
    target: "P02",
    weapon: "cleaver",
    hit: true,
    damage: 12,
    targetHpBand: "hurt",
  });
  assertEquals(
    deriveNarrative(previous, current, [combat], "weapon-break").map((entry) => entry.text).join(
      "\n",
    ),
    t("narrative.weapon_broken.salvaged", { item: t("item.cleaver") }),
    "戰鬥損毀後拾起 Scrap",
  );

  const dropped = structuredClone(current);
  dropped.self.inventory = [];
  const cache = /** @type {import("@darkforest/protocol").MatchEvent} */ ({
    kind: "cache_dropped",
    cacheId: "weapon-break-scrap",
    node: previous.self.node,
    priorityFor: previous.self.playerId,
    untilMs: previous.gameNowMs + 15_000,
    items: [{ kind: "scrap", count: 1 }],
  });
  assertEquals(
    deriveNarrative(previous, dropped, [combat, cache], "weapon-break-drop")
      .map((entry) => entry.text).join("\n"),
    t("narrative.weapon_broken.dropped", { item: t("item.cleaver") }),
    "滿載時 Scrap 落地",
  );

  assertEquals(
    deriveNarrative(previous, dropped, [], "weapon-drop-only").length,
    0,
    "沒有本人 combat 時不得把丟棄誤報為損毀",
  );
});

Deno.test("公開敘事 Legacy/Insight prompt 依 deadline 顯示限時秒數", () => {
  const previous = cloneView();
  previous.phase = "darkforest";
  previous.gameNowMs = 100_000;
  previous.legacyPrompt = undefined;
  previous.insightPrompt = undefined;
  const current = structuredClone(previous);
  current.legacyPrompt = {
    deadlineMs: 125_001,
    options: [],
    maxSelections: 2,
    suggestedItems: [],
  };
  current.insightPrompt = {
    deadlineMs: 124_001,
    options: ["insight_root_sense", "insight_calamity_echo"],
    maxSelections: 1,
    suggestedItems: ["insight_root_sense"],
  };
  assertEquals(
    deriveNarrative(previous, current, [], "prompt-v19").map((entry) => entry.text).join("\n"),
    [
      t("narrative.legacy.prompt", { max: 2, seconds: 26 }),
      t("narrative.insight.prompt", { max: 1, seconds: 25 }),
    ].join("\n"),
    "prompt 逐字與 ceil 秒數",
  );
});

Deno.test("公開展示人影新增、辨識、降級與離開使用核准句式", () => {
  const base = cloneView();
  base.self.node = "N1";
  base.visiblePlayers = [];

  const contact = cloneView();
  contact.self.node = "N1";
  contact.visiblePlayers = [{
    ref: "C-a1b2c3d4",
    identified: false,
    node: "N2",
    status: "active",
    equippedWeapon: "rifle",
    armorSilhouette: "light",
    limping: false,
  }];
  assertEquals(
    deriveNarrative(base, contact, [], "contact-add").map((entry) => entry.text).join("\n"),
    t("narrative.visible.unidentified", { node: localizedPlaceName("Maintenance Ring") }),
    "人影進入視野",
  );

  const identified = structuredClone(contact);
  identified.visiblePlayers = [{
    ref: "P08",
    identified: true,
    playerId: "P08",
    background: "rootbound",
    oath: "oathed",
    hpBand: "healthy",
    contactRef: "C-a1b2c3d4",
    node: "N2",
    status: "active",
    equippedWeapon: "rifle",
    armorSilhouette: "light",
    limping: false,
  }];
  assertEquals(
    deriveNarrative(contact, identified, [], "contact-upgrade").map((entry) => entry.text).join(
      "\n",
    ),
    t("narrative.contact.recognized", { player: "P08" }),
    "contactRef 對應辨識轉場",
  );
  assertEquals(
    deriveNarrative(identified, contact, [], "contact-downgrade").length,
    0,
    "辨識時限結束不應誤報離開再進入",
  );
  assertEquals(
    deriveNarrative(contact, base, [], "contact-remove").map((entry) => entry.text).join("\n"),
    t("narrative.left.unidentified", { node: localizedPlaceName("Maintenance Ring") }),
    "人影離開視野",
  );
});

Deno.test("跛行只在新見或 false→true 時播一次，辨識轉場不重複", () => {
  const hidden = cloneView();
  hidden.visiblePlayers = [];
  const healthyContact = cloneView();
  healthyContact.visiblePlayers = [{
    ref: "C-limp-test",
    identified: false,
    node: "N2",
    status: "active",
    equippedWeapon: "tool",
    armorSilhouette: "light",
    limping: false,
  }];
  const limpingContact = structuredClone(healthyContact);
  limpingContact.visiblePlayers[0].limping = true;

  const firstSeen = deriveNarrative(hidden, limpingContact, [], "limp-new");
  assertEquals(
    firstSeen.map((entry) => entry.text).join("\n"),
    [
      t("narrative.visible.unidentified", { node: localizedPlaceName("Maintenance Ring") }),
      t("narrative.limping.seen"),
    ].join("\n"),
    "新出現的跛行人影只追加泛稱句",
  );
  assertEquals(firstSeen[1]?.source, "derived", "跛行是 view diff 衍生句");
  assertEquals(firstSeen[1]?.event, undefined, "跛行句不得夾帶私人傷勢事件");
  assertEquals(firstSeen[1]?.text.includes("C-limp-test") ?? false, false, "不得洩漏 contact ref");

  assertEquals(
    deriveNarrative(healthyContact, limpingContact, [], "limp-transition")
      .map((entry) => entry.text).join("\n"),
    t("narrative.limping.seen"),
    "同一人影 false→true 播一次",
  );
  assertEquals(
    deriveNarrative(limpingContact, structuredClone(limpingContact), [], "limp-stable").length,
    0,
    "持續跛行不重播",
  );

  const identified = structuredClone(limpingContact);
  identified.visiblePlayers = [{
    ref: "P08",
    identified: true,
    playerId: "P08",
    background: "rootbound",
    oath: "oathed",
    hpBand: "hurt",
    contactRef: "C-limp-test",
    node: "N2",
    status: "active",
    equippedWeapon: "tool",
    armorSilhouette: "light",
    limping: true,
  }];
  assertEquals(
    deriveNarrative(limpingContact, identified, [], "limp-recognized")
      .map((entry) => entry.text).join("\n"),
    t("narrative.contact.recognized", { player: "P08" }),
    "人影認出真身後不重播既知跛行",
  );
  assertEquals(
    deriveNarrative(identified, limpingContact, [], "limp-masked-again").length,
    0,
    "真身退回人影後不重播既知跛行",
  );
});

Deno.test("公開展示遮罩事件不洩漏 contactRef 並套用誤擊破誓句式", () => {
  const entries = eventsToNarrative([
    {
      kind: "combat",
      sourceNode: "N1",
      targetNode: "N2",
      attacker: "P01",
      target: "C-a1b2c3d4",
      weapon: "rifle",
      hit: true,
      damage: 22,
      targetHpBand: undefined,
    },
    { kind: "oath_changed", player: "P01", oath: "broken" },
  ], context());
  assertEquals(
    entries[0]?.text,
    t("narrative.combat.self_hit", {
      weapon: t("item.rifle"),
      target: t("narrative.fog.figure"),
      damage: 22,
    }),
    "攻擊人影",
  );
  assertEquals(
    entries[1]?.text,
    t("narrative.oath.broken_contact"),
    "誤擊同族",
  );
});

Deno.test("六語迷霧代稱不混入 identified 輸出且不洩漏 contact ref", () => {
  const aliases = new Set(
    Object.values(MATCH_CATALOGS).map((catalog) => catalog["narrative.fog.figure"]),
  );
  try {
    for (const locale of /** @type {const} */ (["zh-TW", "zh-CN", "ja", "ko", "en", "vi"])) {
      activateMatchLocale(locale);
      const identified = text({
        kind: "combat",
        sourceNode: "N1",
        targetNode: "N1",
        attacker: "P01",
        target: "P02",
        weapon: "tool",
        hit: true,
        damage: 9,
        targetHpBand: "hurt",
      });
      const masked = text({
        kind: "combat",
        sourceNode: "N1",
        targetNode: "N2",
        attacker: "P01",
        target: "C-private-contact",
        weapon: "tool",
        hit: true,
        damage: 9,
        targetHpBand: undefined,
      });
      for (const alias of aliases) {
        assertEquals(
          identified?.includes(alias) ?? false,
          false,
          `${locale} identified output must not contain fog alias ${alias}`,
        );
      }
      assertEquals(
        masked?.includes(t("narrative.fog.figure")) ?? false,
        true,
        `${locale} masked output uses its fog alias`,
      );
      assertEquals(
        masked?.includes("C-private-contact") ?? false,
        false,
        `${locale} masked output never exposes contact ref`,
      );
    }
  } finally {
    activateMatchLocale("zh-TW");
  }
});

Deno.test("切換語系保留既有 log 句面，只讓標記與新事件使用新語言", () => {
  activateMatchLocale("zh-TW");
  const before = eventToNarrative(
    {
      kind: "combat",
      sourceNode: "N1",
      targetNode: "N1",
      attacker: "P01",
      target: "P02",
      weapon: "tool",
      hit: false,
      damage: 0,
      targetHpBand: "healthy",
    },
    context(),
    0,
  );
  if (before === null) throw new Error("fixture must produce a narrative entry");
  const originalText = before.text;

  try {
    activateMatchLocale("en");
    const marker = {
      id: "locale:en",
      atGameMs: 1_063_000,
      level: /** @type {const} */ ("self"),
      text: t("narrative.system.locale_changed"),
      fatal: false,
      source: /** @type {const} */ ("derived"),
      kind: /** @type {const} */ ("system"),
    };
    const nextEvent = eventToNarrative(
      {
        kind: "combat",
        sourceNode: "N1",
        targetNode: "N1",
        attacker: "P01",
        target: "P02",
        weapon: "tool",
        hit: false,
        damage: 0,
        targetHpBand: "healthy",
      },
      context(),
      1,
    );
    if (nextEvent === null) throw new Error("fixture must produce a post-switch entry");
    const entries = appendNarrativeEntries([before], [marker, nextEvent]);
    assertEquals(entries[0]?.text, originalText, "historical line remains byte-for-byte stable");
    assertEquals(
      entries[1]?.text,
      t("narrative.system.locale_changed"),
      "switch marker is localized",
    );
    assertEquals(
      entries[2]?.text,
      t("narrative.combat.self_miss", { weapon: t("item.tool") }),
      "new event uses active locale",
    );
  } finally {
    activateMatchLocale("zh-TW");
  }
});

Deno.test("時間戳、noise 5 秒去重與 200 句上限", () => {
  assertEquals(formatNarrativeTimestamp(1_062_999), "17:42", "game clock timestamp");
  /** @param {string} id @param {number} atGameMs @param {string=} dedupeKey @returns {import("./narrative_log.js").NarrativeEntry} */
  const make = (id, atGameMs, dedupeKey) => ({
    id,
    atGameMs,
    level: /** @type {const} */ ("witness"),
    text: id,
    fatal: false,
    source: /** @type {const} */ ("event"),
    ...(dedupeKey === undefined ? {} : { dedupeKey }),
  });
  const deduped = appendNarrativeEntries(
    [make("old", 10_000, "noise:20")],
    [make("new", 14_999, "noise:20")],
  );
  assertEquals(deduped.map((entry) => entry.id).join(","), "new", "5s 內保留最新 noise");
  const retained = appendNarrativeEntries(
    [],
    Array.from({ length: 205 }, (_, index) => make(String(index), index * 1000)),
  );
  assertEquals(retained.length, 200, "limit");
  assertEquals(retained[0]?.id, "5", "保留最後 200 句");
});

Deno.test("appendNarrativeEntries 以同 id 原位更新操作狀態", () => {
  const before = /** @type {import("./narrative_log.js").NarrativeEntry[]} */ ([{
    id: "story-before",
    atGameMs: 1_000,
    level: "witness",
    text: "before",
    fatal: false,
    source: "derived",
  }, {
    id: "action:command-1",
    atGameMs: 2_000,
    level: "self",
    text: "翻找散落的物資",
    fatal: false,
    source: "derived",
    kind: "action",
    status: "pending",
    label: "翻找散落的物資",
  }, {
    id: "story-after",
    atGameMs: 3_000,
    level: "broadcast",
    text: "after",
    fatal: false,
    source: "derived",
  }]);
  const resolved = appendNarrativeEntries(before, [{
    ...before[1],
    status: "resolved",
  }]);
  assertEquals(
    resolved.map((entry) => entry.id).join(","),
    "story-before,action:command-1,story-after",
    "resolved 應原位更新而不移到最後",
  );
  assertEquals(resolved[1]?.status, "resolved", "pending 更新為 resolved");

  const rejected = appendNarrativeEntries(resolved, [{
    ...resolved[1],
    text: "背包已經滿了。",
    status: "rejected",
  }]);
  assertEquals(rejected.length, 3, "連續狀態更新不應增加句數");
  assertEquals(rejected[1]?.status, "rejected", "resolved 可原位更新為 rejected");
  assertEquals(rejected[1]?.text, "背包已經滿了。", "同時更新顯示文字");
});

Deno.test("appendNarrativeEntries 對同一則 chat 重播只保留一行", () => {
  const chat = /** @type {import("./narrative_log.js").NarrativeEntry} */ ({
    id: "chat:P02:message-1",
    atGameMs: 12_000,
    level: "broadcast",
    text: "Waterworks 有人。",
    fatal: false,
    source: "derived",
    kind: "chat",
    status: "resolved",
    speaker: "P02",
    wallTimeMs: 1_752_570_000_000,
  });
  const replayed = appendNarrativeEntries([chat], [{ ...chat }]);
  assertEquals(replayed.length, 1, "chat echo 重播不應增加行數");
  assertEquals(replayed[0]?.id, chat.id, "chat stable id 保留");
  assertEquals(replayed[0]?.speaker, "P02", "chat metadata 保留");
});

Deno.test("appendNarrativeEntries 混合 story/action/chat 仍只保留最後 200 行", () => {
  const mixed = Array.from(
    { length: 205 },
    (_, index) => /** @type {import("./narrative_log.js").NarrativeEntry} */ ({
      id: `${index % 3 === 0 ? "story" : index % 3 === 1 ? "action" : "chat"}:${index}`,
      atGameMs: index * 1_000,
      level: index % 3 === 2 ? "broadcast" : "self",
      text: String(index),
      fatal: false,
      source: "derived",
      kind: index % 3 === 0 ? "story" : index % 3 === 1 ? "action" : "chat",
      ...(index % 3 === 1 ? { status: /** @type {const} */ ("resolved") } : {}),
      ...(index % 3 === 2 ? { speaker: `P${index}` } : {}),
    }),
  );
  const retained = appendNarrativeEntries([], mixed);
  assertEquals(retained.length, 200, "所有種類共用 200 行上限");
  assertEquals(retained[0]?.text, "5", "混合類型仍保留最後 200 行");
  assertEquals(retained.at(-1)?.text, "204", "保留最新一行");
});

Deno.test("與我有關預設層保留戰鬥線索，只折疊低強度環境噪音", () => {
  const base = {
    atGameMs: 1_000,
    fatal: false,
    source: /** @type {const} */ ("derived"),
  };
  const self = { ...base, id: "self", level: /** @type {const} */ ("self"), text: "你受傷了。" };
  const chat = {
    ...base,
    id: "chat",
    level: /** @type {const} */ ("broadcast"),
    text: "快離開。",
    kind: /** @type {const} */ ("chat"),
  };
  const noise = {
    ...base,
    id: "noise",
    level: /** @type {const} */ ("witness"),
    text: "細碎的聲響從某處傳來。",
    event: /** @type {const} */ ({ kind: "noise", node: "N2", loudness: 5 }),
  };
  const gunshot = {
    ...base,
    id: "gunshot",
    level: /** @type {const} */ ("witness"),
    text: "遠方傳來槍聲。",
    event: /** @type {const} */ ({ kind: "noise", node: "N2", loudness: 20 }),
  };
  const witnessedCombat = {
    ...base,
    id: "combat",
    level: /** @type {const} */ ("witness"),
    text: "P02 與 P03 在交火。",
    event: /** @type {const} */ ({
      kind: "combat",
      sourceNode: "N4",
      targetNode: "N4",
      attacker: "P02",
      target: "P03",
      weapon: "tool",
      hit: true,
      damage: 10,
      targetHpBand: "hurt",
    }),
  };
  const blockade = {
    ...base,
    id: "blockade",
    level: /** @type {const} */ ("broadcast"),
    text: "Field Workshop已被封鎖。",
    event: /** @type {const} */ ({ kind: "blockade_closed", node: "N2" }),
  };

  assertEquals(narrativeEntryMatchesFilter(self, "focus"), true, "self stays in focus");
  assertEquals(narrativeEntryMatchesFilter(chat, "focus"), true, "chat stays in focus");
  assertEquals(narrativeEntryMatchesFilter(blockade, "focus"), true, "critical broadcast stays");
  assertEquals(narrativeEntryMatchesFilter(gunshot, "focus"), true, "remote gunshot stays");
  assertEquals(
    narrativeEntryMatchesFilter(witnessedCombat, "focus"),
    true,
    "same-node combat stays",
  );
  assertEquals(narrativeEntryMatchesFilter(noise, "focus"), false, "ambient noise is folded out");
  assertEquals(narrativeEntryMatchesFilter(noise, "all"), true, "archive keeps ambient noise");
  assertEquals(narrativeEntryMatchesFilter(chat, "chat"), true, "chat filter keeps chat");
  assertEquals(narrativeEntryMatchesFilter(self, "chat"), false, "chat filter excludes self story");
});

Deno.test("每個 protocol ErrorCode 都有明確歸屬,不會靜默落到 fallback", async () => {
  // 迴歸測試:NO_ITEM 曾同時不在 REJECTION_CODES、也不在任何語系檔裡,於是每一次
  // 「你身上沒有這個物品」都顯示成通用的 fallback 句。這裡不看內部 Set,直接比對玩家
  // 真正讀到的那一行:只要有 ErrorCode 落回通用句,就指名是哪一個。
  const source = await Deno.readTextFile(
    new URL("../../../packages/protocol/src/mod.ts", import.meta.url),
  );
  const union = source.match(/export type ErrorCode =[\s\S]*?;\n/);
  assertEquals(union !== null, true, "ErrorCode union must be locatable in the protocol source");
  const codes = [...(union ?? [""])[0].matchAll(/\|\s*"([A-Z_]+)"/g)].map((match) => match[1]);
  assertEquals(codes.length >= 17, true, `expected the full union, parsed ${codes.length}`);

  // 傳輸層/交握層的碼:玩家看到的是連線錯誤而非行動被拒,fallback 才是正確表現。
  const transportOnly = new Set(["PROTOCOL_MISMATCH", "AUTH_FAILED", "DUPLICATE_COMMAND"]);
  // 商店兩碼走自己的 shop.error.* 句子,不用 narrative.rejection.* 命名。
  /** @type {Record<string, string>} */
  const dedicated = { NO_CREDITS: "shop.error.noCredits", NO_STOCK: "shop.error.noStock" };
  // 比對 key 是否存在,而不是比對算出來的字串:stale_version 的文案與 fallback 刻意相同
  // (兩者都是「你愣了一下」),用文字比對會誤判成沒有專屬句子。
  const catalog = /** @type {Record<string, string>} */ (MATCH_CATALOGS["zh-TW"]);
  const missing = codes.filter((code) => {
    if (transportOnly.has(code)) return false;
    const key = dedicated[code] ?? `narrative.rejection.${code.toLowerCase()}`;
    return !Object.hasOwn(catalog, key);
  });
  assertEquals(
    missing.join(", "),
    "",
    "these ErrorCodes have no dedicated line and fall back to the generic sentence",
  );
});
