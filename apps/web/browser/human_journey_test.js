// @ts-check
import {
  evaluateHumanJourneyStep,
  humanIntentForOption,
  runHumanJourney,
} from "./human_journey.js";
import {
  assembleNarrativeOptions,
  assistDecisionOption,
  assistDecisionOptions,
  statusLockedNarrativeOptions,
} from "./narrative_mode.js";

/** @param {unknown} value @param {string} message */
function assert(value, message) {
  if (!value) throw new Error(message);
}

Deno.test("人類旅程：Echo 只看見 Attune／移動，不得拾取或救援", () => {
  const options = statusLockedNarrativeOptions("echo") ?? [];
  const frame = evaluateHumanJourneyStep({
    id: "echo",
    status: "echo",
    visibleOptions: options,
    chosenKey: "echo-attune",
  });
  assert(frame.violations.length === 0, frame.violations.join(","));
  assert(frame.chosenIntent === "attune", "Echo should be able to choose Attune");
  assert(!frame.visibleIntents.includes("pickup"), "Echo must not see pickup");
  assert(!frame.visibleIntents.includes("rescue"), "Echo must not see rescue");
});

Deno.test("人類旅程：Echo 拾取／救援回歸會被 headless 護欄抓出", () => {
  const unsafe = evaluateHumanJourneyStep({
    id: "echo-unsafe",
    status: "echo",
    visibleOptions: [{
      key: "cache-on-ground",
      slot: "S2",
      label: "翻找散落的物資",
      note: "不應出現",
      kind: "cache",
    }, {
      key: "rescue-p02",
      slot: "S2",
      label: "救援 P02",
      note: "不應出現",
      kind: "rescue",
    }],
  });
  assert(unsafe.violations.includes("ECHO_PICKUP_VISIBLE"), "pickup regression detected");
  assert(unsafe.violations.includes("ECHO_RESCUE_VISIBLE"), "rescue regression detected");
});

Deno.test("人類旅程：active 看見威脅時 Search 退位並保留交戰回應", () => {
  const search = assistDecisionOption({ state: "ready", payload: { action: "search" } });
  const options = assembleNarrativeOptions(search, [{
    key: "attack-p02",
    slot: "S2",
    label: "準備攻擊 P02",
    note: "先讀取預覽",
    kind: "preview",
  }, {
    key: "distance-p02",
    slot: "S2",
    label: "保持距離",
    note: "不主動交火",
    kind: "distance",
  }], null);
  const frame = evaluateHumanJourneyStep({
    id: "active-threat",
    status: "active",
    visibleThreat: true,
    visibleOptions: options,
    chosenKey: "distance-p02",
  });
  assert(frame.violations.length === 0, frame.violations.join(","));
  assert(frame.chosenIntent === "retreat", "player can deliberately avoid the fight");
  assert(!frame.visibleIntents.includes("search"), "Search must yield to immediate threat");
  assert(
    frame.visibleIntents.some((intent) => intent === "attack" || intent === "retreat"),
    "threat response remains visible",
  );
});

Deno.test("人類旅程：active 有威脅卻只剩 Search 會明確失敗", () => {
  const search = assistDecisionOption({ state: "ready", payload: { action: "search" } });
  if (search === null) throw new Error("search option missing");
  const frame = evaluateHumanJourneyStep({
    id: "search-only",
    status: "active",
    visibleThreat: true,
    visibleOptions: [search],
  });
  assert(frame.violations.includes("THREAT_RESPONSE_MISSING"), "missing response must be detected");
});

Deno.test("人類旅程：封鎖逼近時撤離必須壓過搜索與交戰方針", () => {
  const escape = assistDecisionOptions(
    { state: "ready", payload: { action: "move", to: "N3", style: "rush" } },
    "Waterworks",
  );
  const safe = evaluateHumanJourneyStep({
    id: "blockade-escape",
    status: "active",
    visibleThreat: true,
    closingNode: true,
    visibleOptions: assembleNarrativeOptions(escape, [{
      key: "distance-threat",
      slot: "S2",
      label: "保持距離",
      note: "撤離同時避開交火",
      kind: "distance",
    }], null),
    chosenKey: escape[0]?.key,
  });
  assert(safe.violations.length === 0, safe.violations.join(","));
  assert(safe.chosenIntent === "move", "blockade escape remains the chosen action");

  const search = assistDecisionOption({ state: "ready", payload: { action: "search" } });
  if (search === null) throw new Error("search option missing");
  const unsafe = evaluateHumanJourneyStep({
    id: "blockade-search-regression",
    status: "active",
    closingNode: true,
    visibleOptions: [search],
  });
  assert(
    unsafe.violations.includes("BLOCKADE_ESCAPE_MISSING"),
    "search-only regression is detected during blockade",
  );
});

Deno.test("人類旅程：主選項最多三個，路線入口只開局部路線", () => {
  const movement = assistDecisionOptions(
    { state: "ready", payload: { action: "move", to: "N2" } },
    "Waterworks",
    "tunnel",
  );
  const options = assembleNarrativeOptions(movement, [], null);
  const frame = evaluateHumanJourneyStep({
    id: "move-local",
    status: "active",
    visibleOptions: options,
    chosenKey: "open-routes",
  });
  assert(frame.violations.length === 0, frame.violations.join(","));
  assert(frame.visibleKeys.length === 3, "two move styles plus one route opener");
  assert(frame.chosenIntent === "local-routes", "route choice opens local route list");
  assert(options.at(-1)?.slot === "S4", "local routes stay in S4");

  const globalMap = evaluateHumanJourneyStep({
    id: "global-map-regression",
    status: "active",
    visibleOptions: [{
      key: "open-map",
      slot: "S4",
      label: "展開全域地圖",
      note: "不應回到存活者主畫面",
      kind: "open",
    }],
  });
  assert(globalMap.violations.includes("ROUTE_NOT_LOCAL"), "global map regression detected");
});

Deno.test("人類旅程：Downed／Eliminated 沒有可操作 action", () => {
  for (const status of /** @type {const} */ (["downed", "eliminated"])) {
    const options = statusLockedNarrativeOptions(status) ?? [];
    const frame = evaluateHumanJourneyStep({
      id: status,
      status,
      visibleOptions: options,
    });
    assert(frame.visibleKeys.length === 0, `${status} should have no visible options`);
    assert(frame.chosenIntent === null, `${status} should not produce intent`);
    assert(frame.violations.length === 0, frame.violations.join(","));
  }
});

Deno.test("人類旅程：序列保留每步可見選項與已選意圖", () => {
  const activeOptions = assembleNarrativeOptions(
    assistDecisionOption({ state: "ready", payload: { action: "search" } }),
    [{
      key: "watch-contact",
      slot: "S2",
      label: "盯住那個人影",
      note: "只取得預覽",
      kind: "preview",
    }],
    null,
  );
  const echoOptions = statusLockedNarrativeOptions("echo") ?? [];
  const journey = runHumanJourney([{
    id: "active",
    status: "active",
    visibleThreat: true,
    visibleOptions: activeOptions,
    chosenKey: "watch-contact",
  }, {
    id: "echo",
    status: "echo",
    visibleOptions: echoOptions,
    chosenKey: "echo-attune",
  }, {
    id: "eliminated",
    status: "eliminated",
    visibleOptions: statusLockedNarrativeOptions("eliminated") ?? [],
  }]);
  assert(journey.violations.length === 0, journey.violations.join(","));
  assert(journey.frames.length === 3, "all state transitions retained");
  assert(journey.chosenIntents.join(",") === "observe,attune", "operation intent sequence");
  const routeOption = activeOptions.at(-1);
  if (routeOption === undefined) throw new Error("S4 route option missing");
  assert(humanIntentForOption(routeOption) === "local-routes", "S4 intent mapping");
});
