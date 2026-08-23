import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { characterMotionMarkup, characterMotionPack } from "./character_motion.js";

Deno.test("角色動作素材只由本人的權威職業解析", () => {
  assert(characterMotionPack("courier") !== null);
  assert(characterMotionPack("enforcer") !== null);
  assertEquals(characterMotionPack("rootbound"), null);
  assertEquals(characterMotionPack(undefined), null);
  assert(characterMotionPack("scavenger") !== null);
});

Deno.test("公開版三職業保留空白 motion adapter，不攜出 raster atlas", () => {
  for (const profession of ["courier", "scavenger", "enforcer"]) {
    const pack = characterMotionPack(profession);
    if (pack === null) throw new Error(`${profession} pack is required`);
    assertEquals(Object.keys(pack.actions), []);
    assert(pack.id.endsWith("-placeholder"));
  }
});

Deno.test("缺少公開 atlas 時不輸出 motion markup", () => {
  for (const profession of ["courier", "scavenger", "enforcer"]) {
    assertEquals(characterMotionMarkup(profession), "");
  }
  assertEquals(characterMotionMarkup("rootbound"), "");
});

Deno.test("核心動作 cue 都有離散幀、冷卻時軸與靜態降級姿勢", async () => {
  const css = await Deno.readTextFile(
    new URL("../static/styles.css", import.meta.url),
  );
  for (
    const action of [
      "run",
      "sneak",
      "critical",
      "search",
      "pistol",
      "rifle",
      "melee",
      "hurt",
      "downed",
    ]
  ) {
    assertStringIncludes(css, `[data-motion-action="${action}"]`);
  }
  assertStringIncludes(css, "@keyframes tactical-character-six-frames");
  assertStringIncludes(css, "steps(1, end)");
  assertStringIncludes(css, "--tactical-action-duration");
  assertStringIncludes(css, "tactical-target-melee-lunge");
  assertStringIncludes(css, "@keyframes tactical-character-hide-frames");
  assertStringIncludes(css, ".is-concealing");
  assertStringIncludes(css, ".is-revealing");
  assertStringIncludes(css, ".is-concealed");
  assertStringIncludes(css, 'data-motion-action="search"');
  assertStringIncludes(css, ".reduce-motion .tactical-unit.has-character-motion");
  assertStringIncludes(css, "@media (prefers-reduced-motion: reduce)");
});

Deno.test("藏匿、迷霧黑影與目標名稱在動畫外仍保留玩法語意", async () => {
  const css = await Deno.readTextFile(new URL("../static/styles.css", import.meta.url));
  const client = await Deno.readTextFile(new URL("./client.js", import.meta.url));
  assertStringIncludes(css, "@keyframes tactical-cover-rise");
  assertStringIncludes(
    css,
    ".tactical-unit-self:is(.is-concealed, .is-concealing, .is-revealing)::after",
  );
  assertStringIncludes(css, "brightness(0.18)");
  assertStringIncludes(css, ".tactical-unit-contact.is-silhouette > b");
  assertStringIncludes(css, ".tactical-distant-contact-figure");
  assertStringIncludes(
    css,
    ".tactical-arena-distant button.is-silhouette .tactical-distant-contact-figure img",
  );
  assertStringIncludes(css, ".tactical-unit-contact > b");
  assertStringIncludes(css, "font: 900 13px/1.1 ui-monospace, monospace");
  assertStringIncludes(css, ".is-revealing:not(");
  assertStringIncludes(css, ".is-searching,");
  assertStringIncludes(css, ".is-moving-rush,");
  assertStringIncludes(css, ".tactical-unit-self > small");
  assertStringIncludes(client, 'player.identified ? "is-identified" : "is-silhouette"');
  assertStringIncludes(client, 'class="tactical-distant-contact-figure"');
  assertStringIncludes(client, "escapeHtml(contactFigure)");
  assertStringIncludes(client, "visiblePlayerName(player)");
});

Deno.test("三職業動作圖集通過封裝、尺寸、透明與路由延遲預算", async () => {
  for (const profession of ["courier", "scavenger", "enforcer"]) {
    const pack = characterMotionPack(profession);
    if (pack === null) throw new Error(`${profession} pack is required`);
    let totalBytes = 0;
    for (const path of new Set(Object.values(pack.actions))) {
      const url = new URL(`../static${path}`, import.meta.url);
      const bytes = await Deno.readFile(url);
      totalBytes += bytes.byteLength;
      assert(bytes.byteLength > 0);
      assert(bytes.byteLength <= 90_000, `${path} exceeds the route-lazy action budget`);
      assertEquals(new TextDecoder().decode(bytes.subarray(0, 4)), "RIFF");
      assertEquals(new TextDecoder().decode(bytes.subarray(8, 12)), "WEBP");
      assertStringIncludes(new TextDecoder().decode(bytes.subarray(12, 64)), "VP8X");
      assert((bytes[20] & 0x10) !== 0, `${path} is missing the VP8X alpha flag`);
      const canvasWidth = bytes[24] + (bytes[25] << 8) + (bytes[26] << 16) + 1;
      const canvasHeight = bytes[27] + (bytes[28] << 8) + (bytes[29] << 16) + 1;
      assertEquals([canvasWidth, canvasHeight], [864, 576]);
    }
    assert(totalBytes <= 520_000, `${profession} motion pack exceeds its route-lazy budget`);
  }
});

Deno.test("權威抵達即使 renderer 尚未建立也會先清除 travel session", async () => {
  const client = await Deno.readTextFile(new URL("./client.js", import.meta.url));
  const start = client.indexOf("function stageTacticalArenaFeedback");
  const end = client.indexOf("tacticalViewSwitch.querySelectorAll", start);
  const body = client.slice(start, end);
  const preserve = body.indexOf("const arrivalStyle = tacticalArenaMovementStyle");
  const clear = body.indexOf("tacticalArenaMovementStyle = null");
  const rendererGuard = body.indexOf("tacticalArenaRenderer === null");
  assert(start >= 0 && end > start);
  assert(preserve >= 0 && clear >= 0 && preserve < clear);
  assert(clear < rendererGuard);
  assertStringIncludes(body, "movementStyle: arrivalStyle");
});

Deno.test("造成攻擊的精確武器在損毀 diff 後仍留到該段動畫結束", async () => {
  const client = await Deno.readTextFile(new URL("./client.js", import.meta.url));
  const arena = await Deno.readTextFile(new URL("./tactical_arena.js", import.meta.url));
  assertStringIncludes(client, "itemFieldIconUrl(cue.weapon)");
  assertStringIncludes(arena, "transientWeaponIcon(source, feedbackData.weaponIcon, remaining)");
  assertStringIncludes(arena, 'image.dataset.feedbackWeaponRestoreSrc = image.getAttribute("src")');
  assertStringIncludes(arena, "image.hidden = image.dataset.feedbackWeaponRestoreHidden");
});

Deno.test("近戰痕跡、接觸回饋與無動態偏好保留一致語意", async () => {
  const css = await Deno.readTextFile(new URL("../static/styles.css", import.meta.url));
  const arena = await Deno.readTextFile(new URL("./tactical_arena.js", import.meta.url));
  for (const weapon of ["tool", "cleaver", "stool", "golf_club"]) {
    assertStringIncludes(css, `[data-attack-weapon="${weapon}"]`);
  }
  for (
    const trail of [
      "tactical-melee-trail-tool",
      "tactical-melee-trail-cleaver",
      "tactical-melee-trail-stool",
      "tactical-melee-trail-golf",
    ]
  ) {
    assertStringIncludes(css, `@keyframes ${trail}`);
  }
  assertStringIncludes(css, "pointer-events: none");
  assertStringIncludes(css, ".particles-off .tactical-unit.is-firing.is-striking-melee::after");
  assertStringIncludes(css, ".reduce-motion .tactical-unit.is-firing::after");
  assertStringIncludes(css, "@media (prefers-reduced-motion: reduce)");
  assertStringIncludes(arena, "feedbackStartedAt + impactTiming.impactAtMs");
  assertStringIncludes(arena, 'transientClass(target, "is-hurt", timing.hurtDurationMs, true)');
  assertStringIncludes(arena, "selfDamageOwnedByAttack");
});
