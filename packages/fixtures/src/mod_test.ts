import { echoMode, finalAllDead, finalCovenant, fixtures, rejectionDrill } from "./mod.ts";
import { ackForCommand } from "./mock_server.ts";
import { isServerMsg } from "@darkforest/protocol";

function assertTrue(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function isPositiveInteger(n: number): boolean {
  return Number.isInteger(n) && n > 0;
}

Deno.test("每個 fixture 都通過公開 demo 的 runtime message 邊界", () => {
  for (const fixture of fixtures) {
    assertTrue(
      isServerMsg({ type: "welcome", view: fixture.view }),
      `${fixture.name}: welcome 必須通過 runtime validator`,
    );
    for (const [index, diff] of (fixture.followupDiffs ?? []).entries()) {
      assertTrue(
        isServerMsg(diff),
        `${fixture.name}: followupDiffs[${index}] 必須通過 runtime validator`,
      );
    }
  }
});

Deno.test("每個 fixture 的 view.map.finalNodes 為 [N1,N2,N3,N6]", () => {
  for (const f of fixtures) {
    const finalNodes = f.view.map.finalNodes;
    assertTrue(
      JSON.stringify(finalNodes) === JSON.stringify(["N1", "N2", "N3", "N6"]),
      `${f.name}: finalNodes 應為 [N1,N2,N3,N6],實際為 ${JSON.stringify(finalNodes)}`,
    );
  }
});

Deno.test("每個 fixture 的 view.map.blockadeSchedule 恰有兩筆(N5@06:00/08:00、N4@24:00/26:00)", () => {
  for (const f of fixtures) {
    const schedule = f.view.map.blockadeSchedule;
    assertTrue(
      schedule.length === 2,
      `${f.name}: blockadeSchedule 應有 2 筆,實際為 ${schedule.length}`,
    );

    const n5 = schedule.find((s) => s.node === "N5");
    const n4 = schedule.find((s) => s.node === "N4");
    assertTrue(
      n5 !== undefined && n5.previewAtMs === 6 * 60_000 && n5.closesAtMs === 8 * 60_000,
      `${f.name}: N5 blockade 應為 preview 06:00 / close 08:00,實際為 ${JSON.stringify(n5)}`,
    );
    assertTrue(
      n4 !== undefined && n4.previewAtMs === 24 * 60_000 && n4.closesAtMs === 26 * 60_000,
      `${f.name}: N4 blockade 應為 preview 24:00 / close 26:00,實際為 ${JSON.stringify(n4)}`,
    );
  }
});

Deno.test("每個 fixture 的 view.stateVersion 為正整數", () => {
  for (const f of fixtures) {
    assertTrue(
      isPositiveInteger(f.view.stateVersion),
      `${f.name}: stateVersion 應為正整數,實際為 ${f.view.stateVersion}`,
    );
  }
});

Deno.test("每個 fixture 的 followupDiffs.stateVersion 相對 view 嚴格遞增", () => {
  for (const f of fixtures) {
    if (!f.followupDiffs || f.followupDiffs.length === 0) continue;
    let prev = f.view.stateVersion;
    for (const [i, diff] of f.followupDiffs.entries()) {
      assertTrue(
        isPositiveInteger(diff.stateVersion) && diff.stateVersion > prev,
        `${f.name}: followupDiffs[${i}].stateVersion 未嚴格遞增(prev=${prev}, got=${diff.stateVersion})`,
      );
      prev = diff.stateVersion;
    }
  }
});

Deno.test("echoMode fixture 的 self.status 為 echo", () => {
  assertTrue(
    echoMode.view.self.status === "echo",
    `echoMode: self.status 應為 "echo",實際為 "${echoMode.view.self.status}"`,
  );
});

function matchEndedOf(fixtureName: string) {
  const fixture = fixtures.find((f) => f.name === fixtureName);
  assertTrue(fixture !== undefined, `找不到 fixture ${fixtureName}`);
  const lastDiff = fixture!.followupDiffs?.at(-1);
  const ended = lastDiff?.events.find((e) => e.kind === "match_ended");
  assertTrue(
    ended !== undefined && ended.kind === "match_ended",
    `${fixtureName}: 最後一筆 followupDiff 應含 match_ended`,
  );
  assertTrue(
    lastDiff?.phase === "ended",
    `${fixtureName}: match_ended 所在 diff 的 phase 應為 "ended"`,
  );
  if (ended === undefined || ended.kind !== "match_ended") throw new Error("unreachable");
  return ended;
}

Deno.test("三種 authority ending(solo_survivor/arbora_covenant/none)各有一個可走查 fixture", () => {
  const endings = [
    matchEndedOf("finalReckoning").ending,
    matchEndedOf("finalCovenant").ending,
    matchEndedOf("finalAllDead").ending,
  ];
  assertTrue(
    JSON.stringify([...endings].sort()) ===
      JSON.stringify(["arbora_covenant", "none", "solo_survivor"]),
    `三個終局 fixture 應覆蓋三種 ending,實際為 ${JSON.stringify(endings)}`,
  );
});

Deno.test("finalCovenant 使用固定展示順序與 20s/45s 期限", () => {
  const diffs = finalCovenant.followupDiffs ?? [];
  const kinds = diffs.flatMap((d) => d.events.map((e) => e.kind));
  assertTrue(
    JSON.stringify(kinds) === JSON.stringify([
      "finale_offer_started",
      "finale_joined",
      "finale_channel_started",
      "finale_completed",
      "match_ended",
    ]),
    `finalCovenant: 事件順序不符合公開展示情境，實際為 ${JSON.stringify(kinds)}`,
  );
  assertTrue(
    !kinds.includes("finale_claimed"),
    "finalCovenant: 多人結局不得出現單人生還事件 finale_claimed",
  );

  const offer = diffs[0].events[0];
  assertTrue(
    offer.kind === "finale_offer_started" &&
      offer.deadlineMs === diffs[0].gameNowMs + 20_000,
    "finalCovenant: offer 期限應為開始時刻 +20s",
  );
  const channel = diffs[2].events[0];
  assertTrue(
    channel.kind === "finale_channel_started" &&
      channel.deadlineMs === diffs[2].gameNowMs + 45_000,
    "finalCovenant: channel 期限應為開始時刻 +45s",
  );

  const ended = matchEndedOf("finalCovenant");
  assertTrue(
    ended.ending === "arbora_covenant" && ended.reason === "finale_coop",
    `finalCovenant: 應為 arbora_covenant/finale_coop,實際為 ${ended.ending}/${ended.reason}`,
  );
  assertTrue(
    channel.kind === "finale_channel_started" &&
      JSON.stringify(ended.winners) === JSON.stringify(channel.participants),
    "finalCovenant: winners 應恰為 channel participants(P09 存活但不在勝者列)",
  );
  assertTrue(
    diffs.at(-1)?.finale === null,
    "finalCovenant: 結尾 diff 應以 finale:null 清除公開展示欄位",
  );
});

Deno.test("finalAllDead:同 tick 雙 zone 淘汰 → winners=[]、ending=none、reason=all_dead", () => {
  const ended = matchEndedOf("finalAllDead");
  assertTrue(
    ended.winners.length === 0 && ended.ending === "none" && ended.reason === "all_dead",
    `finalAllDead: 應為 winners=[]/none/all_dead,實際為 ${JSON.stringify(ended)}`,
  );

  const lastDiff = finalAllDead.followupDiffs!.at(-1)!;
  assertTrue(
    lastDiff.aliveCount === 0 && lastDiff.phase === "ended",
    "finalAllDead: 終局 diff 應為 aliveCount=0 且 phase=ended",
  );
  assertTrue(
    lastDiff.visiblePlayers !== undefined && lastDiff.visiblePlayers.length === 0,
    "finalAllDead: 淘汰者不得留在 visiblePlayers,終局 diff 應整組清空",
  );
  assertTrue(
    lastDiff.self?.status === "eliminated",
    "finalAllDead: self 應以 status=eliminated 收尾",
  );

  for (const player of ["P01", "P22"]) {
    const downedIndex = lastDiff.events.findIndex(
      (e) => e.kind === "player_downed" && e.player === player,
    );
    const eliminatedIndex = lastDiff.events.findIndex(
      (e) => e.kind === "player_eliminated" && e.player === player,
    );
    assertTrue(
      downedIndex !== -1 && eliminatedIndex === downedIndex + 1,
      `finalAllDead: ${player} 應在同一 diff 內 player_downed 緊接 player_eliminated`,
    );
    const eliminated = lastDiff.events[eliminatedIndex];
    assertTrue(
      eliminated.kind === "player_eliminated" && eliminated.by === "zone",
      `finalAllDead: ${player} 的淘汰 by 應為 "zone"`,
    );
  }
});

Deno.test("commandRejections:宣告的 action 決定性拒絕且不發 diff;未宣告一律 accepted(既有行為不變)", () => {
  const rejected = ackForCommand(rejectionDrill, "cmd-1", "attack");
  assertTrue(
    !rejected.accepted && rejected.errorCode === "COOLDOWN_ACTIVE" &&
      rejected.retryAtMs === rejectionDrill.view.self.cooldownsUntilMs.attack,
    `rejectionDrill: attack 應拒於 COOLDOWN_ACTIVE 且 retryAtMs 等於 view 冷卻時刻,實際為 ${
      JSON.stringify(rejected)
    }`,
  );
  const search = ackForCommand(rejectionDrill, "cmd-2", "search");
  assertTrue(
    !search.accepted && search.errorCode === "NO_SEARCHES_LEFT" && search.retryAtMs === undefined,
    "rejectionDrill: search 應拒於 NO_SEARCHES_LEFT(無 retryAtMs)",
  );
  const move = ackForCommand(rejectionDrill, "cmd-3", "move");
  assertTrue(
    move.accepted,
    "rejectionDrill: 未宣告的 move 仍應 accepted(同一 fixture 可對照 settled receipt)",
  );
  for (const fixture of fixtures) {
    if (fixture.commandRejections !== undefined) continue;
    const ack = ackForCommand(fixture, "cmd-4", "attack");
    assertTrue(
      ack.accepted,
      `${fixture.name}: 未宣告 commandRejections 的 fixture 必須維持既有一律 accepted`,
    );
  }
});

Deno.test("rejectionDrill:每條拒絕規則都由 view 靜態自洽地成立", () => {
  const view = rejectionDrill.view;
  const attackCooldown = view.self.cooldownsUntilMs.attack;
  assertTrue(
    attackCooldown !== undefined && attackCooldown > view.gameNowMs,
    "rejectionDrill: attack 冷卻應在 gameNowMs 之後(拒絕理由要在畫面上站得住)",
  );
  const selfNode = view.nodes.find((n) => n.id === view.self.node);
  assertTrue(
    selfNode !== undefined && selfNode.searchesLeft === 0,
    "rejectionDrill: 所在節點 searchesLeft 應為 0(對應 NO_SEARCHES_LEFT)",
  );
  assertTrue(
    selfNode !== undefined && selfNode.caches.length === 0,
    "rejectionDrill: 所在節點不得有 cache(對應 NO_CACHE)",
  );
  assertTrue(
    view.visiblePlayers.some((p) => p.node === view.self.node && p.status === "active"),
    "rejectionDrill: 同節點應有可點擊的 active 目標供 QA 觸發 attack 拒絕",
  );
});
