import { classifyDiffVersion } from "./view_helpers.js";
import { appendNarrativeEntries } from "./narrative_log.js";

/** @param {unknown} value @param {string=} message */
function assert(value, message = "assertion failed") {
  if (!value) throw new Error(message);
}

/** @param {unknown} actual @param {unknown} expected @param {string=} message */
function assertEquals(actual, expected, message = "values differ") {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${message}\nexpected: ${expectedJson}\nactual:   ${actualJson}`);
  }
}

/**
 * Model-based browser acceptance harness. It mirrors what a human can observe rather than
 * simulating combat rules: one click, an immediate Log row, ACK, then the authoritative diff.
 * Delays and message reordering are explicit so regressions cannot hide behind fast fixtures.
 */
class HumanInteractionHarness {
  /** @param {number} version */
  constructor(version) {
    this.version = version;
    /** @type {{id: string, expectedVersion: number, acknowledged: boolean} | null} */
    this.pending = null;
    /** @type {import("./narrative_log.js").NarrativeEntry[]} */
    this.log = [];
    this.resyncInFlight = false;
    this.helloCount = 0;
  }

  /** @param {string} id @param {string} label */
  click(id, label) {
    if (this.pending !== null) return false;
    this.pending = { id, expectedVersion: this.version, acknowledged: false };
    this.upsert(id, label, "pending", "進行中");
    return true;
  }

  /** @param {string} id @param {boolean} accepted @param {string=} reason */
  ack(id, accepted, reason = "現在做不了這件事。") {
    if (this.pending?.id !== id) return;
    if (!accepted) {
      this.upsert(id, reason, "rejected", "未能完成");
      this.pending = null;
      return;
    }
    this.pending.acknowledged = true;
    const current = this.log.find((entry) => entry.id === `action:${id}`);
    this.upsert(id, current?.text ?? id, "ready", "已受理");
  }

  /** @param {number} incomingVersion */
  diff(incomingVersion) {
    const relation = classifyDiffVersion(this.version, incomingVersion);
    if (relation === "stale") return relation;
    if (relation === "gap") {
      if (!this.resyncInFlight) {
        this.resyncInFlight = true;
        this.helloCount += 1;
      }
      return relation;
    }
    this.version = incomingVersion;
    this.resyncInFlight = false;
    if (
      this.pending?.acknowledged && incomingVersion > this.pending.expectedVersion
    ) {
      const current = this.log.find((entry) => entry.id === `action:${this.pending?.id}`);
      this.upsert(this.pending.id, current?.text ?? this.pending.id, "resolved", "已落定");
      this.pending = null;
    }
    return relation;
  }

  /** @param {number} snapshotVersion */
  snapshot(snapshotVersion) {
    this.version = snapshotVersion;
    this.resyncInFlight = false;
    if (this.pending !== null) {
      const current = this.log.find((entry) => entry.id === `action:${this.pending?.id}`);
      const settled = this.pending.acknowledged && snapshotVersion > this.pending.expectedVersion;
      this.upsert(
        this.pending.id,
        settled ? current?.text ?? this.pending.id : "你愣了一下,重新看清了局勢。",
        settled ? "resolved" : "rejected",
        settled ? "已落定" : "請重新選擇",
      );
      this.pending = null;
    }
  }

  /** @param {string} id @param {string} text @param {"pending" | "ready" | "resolved" | "rejected"} status @param {string} label */
  upsert(id, text, status, label) {
    this.log = appendNarrativeEntries(this.log, [{
      id: `action:${id}`,
      atGameMs: 10_000,
      level: "self",
      text,
      fatal: false,
      source: "derived",
      kind: "action",
      status,
      label,
    }]);
  }
}

Deno.test("human flow: delayed ACK→diff 期間只允許一個指令且 Log 原位更新", () => {
  const human = new HumanInteractionHarness(40);
  assert(human.click("search-1", "搜刮此處"));
  assertEquals(human.click("hide-2", "藏進掩體"), false, "第二次點擊必須被 gate");
  assertEquals(human.log[0]?.status, "pending");
  human.ack("search-1", true);
  assert(human.pending !== null, "ACK accepted 後仍等權威 diff");
  assertEquals(human.log[0]?.status, "ready");
  assertEquals(human.diff(41), "next");
  assertEquals(human.pending, null);
  assertEquals(human.log.length, 1, "三階段使用同一 Log 行");
  assertEquals(human.log[0]?.status, "resolved");
});

Deno.test("human flow: 卡片切換後才收到拒絕也不會遺失回饋", () => {
  const human = new HumanInteractionHarness(12);
  assert(human.click("move-1", "摸過去 Waterworks"));
  human.ack("move-1", false, "那條路已經斷了。");
  assertEquals(human.pending, null, "拒絕後立即恢復可操作");
  assertEquals(human.log.length, 1);
  assertEquals(human.log[0]?.status, "rejected");
  assertEquals(human.log[0]?.text, "那條路已經斷了。");
});

Deno.test("human flow: gap 只送一次 hello，snapshot 後解除等待", () => {
  const human = new HumanInteractionHarness(70);
  human.click("attune-1", "調諧這個節點");
  human.ack("attune-1", true);
  assertEquals(human.diff(73), "gap");
  assertEquals(human.diff(74), "gap");
  assertEquals(human.helloCount, 1, "同步中不可形成 reconnect storm");
  human.snapshot(74);
  assertEquals(human.pending, null);
  assertEquals(human.log[0]?.status, "resolved");
});
