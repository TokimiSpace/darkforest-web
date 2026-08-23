/**
 * browser/ 是唯一的原始碼,static/ 是逐字產生的鏡像(只多一行標頭)。static/ 永遠不要手改。
 *
 * 新增一個 browser/ 模組時,以下四處都要登記,缺一不可:
 *   1. 這個 FILES 清單。
 *   2. deno.json 的 tasks.client(--allow-read 加 browser/x.js、--allow-write 加 static/x.js)
 *      與 tasks.client:check(兩者都加)。
 *   3. deno.json 的 tasks.check:deno fmt 與 deno lint 的 static/x.js,以及 deno check 的
 *      browser/x.js。(browser/ 整個目錄有被 fmt/lint 掃到,static/ 是逐檔列舉。)
 *   4. main.ts 裡對應的 `app.get("/x.js", ...)` 路由。
 *
 * 第 4 項最容易漏,而且漏了不會有任何 deno task 失敗:client:check 只比對清單內的檔案。
 * 症狀只在瀏覽器出現——app.js 回 200,它 import 的 /x.js 回 404,而原生 ESM 只要有一個
 * 靜態 import 掛掉,整個模組就不會執行,等於整個對局前端無聲死掉。改完請實際載入頁面確認。
 */
const FILES = [
  { source: "../browser/bootstrap.js", output: "../static/bootstrap.js" },
  { source: "../browser/i18n.js", output: "../static/i18n.js" },
  { source: "../browser/ambient_music.js", output: "../static/ambient_music.js" },
  { source: "../browser/echo_oracle.js", output: "../static/echo_oracle.js" },
  { source: "../browser/tactical_arena.js", output: "../static/tactical_arena.js" },
  { source: "../browser/html_escape.js", output: "../static/html_escape.js" },
  {
    source: "../../../packages/protocol/src/runtime.js",
    output: "../static/protocol_runtime.js",
  },
  { source: "../browser/item_art.js", output: "../static/item_art.js" },
  { source: "../browser/character_motion.js", output: "../static/character_motion.js" },
  {
    source: "../browser/action_animation_state.js",
    output: "../static/action_animation_state.js",
  },
  { source: "../browser/match_clock.js", output: "../static/match_clock.js" },
  { source: "../browser/view_helpers.js", output: "../static/view_helpers.js" },
  { source: "../browser/client.js", output: "../static/app.js" },
  { source: "../browser/lobby_profile.js", output: "../static/lobby_profile.js" },
  { source: "../browser/lobby_profile_form.js", output: "../static/lobby_profile_form.js" },
  { source: "../browser/match_connection.js", output: "../static/match_connection.js" },
  { source: "../browser/narrative_log.js", output: "../static/narrative_log.js" },
  { source: "../browser/narrative_mode.js", output: "../static/narrative_mode.js" },
  { source: "../browser/leaderboard.js", output: "../static/leaderboard.js" },
  { source: "../browser/tutorial.js", output: "../static/tutorial.js" },
] as const;

export function emitBrowserRuntime(source: string, sourceName = "browser/client.js"): string {
  return `// Generated from ${sourceName} by scripts/emit_client.ts. Do not edit.\n${source}`;
}

if (import.meta.main) {
  for (const file of FILES) {
    const sourceUrl = new URL(file.source, import.meta.url);
    const outputUrl = new URL(file.output, import.meta.url);
    const sourceName = file.source.replace("../", "");
    const outputName = file.output.replace("../", "");
    const expected = emitBrowserRuntime(await Deno.readTextFile(sourceUrl), sourceName);
    if (Deno.args.includes("--check")) {
      const actual = await Deno.readTextFile(outputUrl).catch(() => "");
      if (actual !== expected) {
        console.error(`${outputName} is stale; run \`deno task client\``);
        Deno.exit(1);
      }
    } else {
      await Deno.writeTextFile(outputUrl, expected);
      console.log(`generated ${outputName}`);
    }
  }
  if (Deno.args.includes("--check")) console.log("browser client runtimes are in sync");
}
