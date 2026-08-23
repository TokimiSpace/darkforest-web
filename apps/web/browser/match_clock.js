// @ts-check
/**
 * 對局時鐘核心。server 每次投影帶來權威的 gameNowMs,兩次投影之間由本地 performance.now()
 * 依 timeScale 外推,讓倒數與冷卻在畫面上連續前進而不需要每幀跟 server 對時。
 *
 * 三個時鐘變數只由 syncClock 寫、只由 estimatedGameNowMs 讀;想知道目前倍速請用
 * currentTimeScale(),不要把變數再匯出去,否則它們就不再只有一個寫入點。
 */
import { finaleEntryAvailable } from "./narrative_mode.js";

/** @typedef {import("@darkforest/protocol").PlayerView} _PlayerView */

let clockGameMs = 0;
let clockRealMs = performance.now();
let clockScale = 1;

/** @param {_PlayerView} current */
export function syncClock(current) {
  clockGameMs = current.gameNowMs;
  clockRealMs = performance.now();
  clockScale = current.timeScale;
}

export function estimatedGameNowMs() {
  return clockGameMs + Math.max(0, performance.now() - clockRealMs) * clockScale;
}

/** 目前對局倍速(供依真實時間排程的動畫換算使用)。 */
export function currentTimeScale() {
  return clockScale;
}

/** @param {_PlayerView} current */
export function finaleEntryAvailableNow(current) {
  return finaleEntryAvailable({ ...current, gameNowMs: estimatedGameNowMs() });
}

/** @param {_PlayerView} current */
export function spawnGraceActive(current) {
  return current.phase === "megacity" && estimatedGameNowMs() < 30_000;
}

/** @param {_PlayerView} current @param {number=} gameNow */
export function cooldownSignature(current, gameNow = estimatedGameNowMs()) {
  return Object.entries(current.self.cooldownsUntilMs)
    .filter(([, until]) => until > gameNow)
    .map(([action]) => action)
    .sort()
    .join("|");
}
