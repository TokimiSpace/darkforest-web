import { renderToString } from "npm:preact-render-to-string@^6.6.3";
import CharactersPage from "@/routes/characters.tsx";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test("Character archive presents original role art, gameplay identity, and bounded world figures", () => {
  const html = renderToString(<CharactersPage />);
  assert(html.includes('class="characters-shell"'), "missing character archive root");
  assert(html.includes('id="characters-title"'), "missing character archive heading");
  assert(
    (html.match(/class="character-dossier is-/g) ?? []).length === 3,
    "the archive must contain exactly three profession archetypes",
  );
  assert(
    (html.match(/class="character-chronicle"/g) ?? []).length === 3,
    "every profession needs a complete chronicle",
  );
  assert(
    (html.match(/<details class="character-chronicle" open/g) ?? []).length === 3,
    "every profession chronicle should be visible without discovering a disclosure control",
  );
  for (
    const phase of ["BEFORE · MEGA CITY", "CHECKPOINT · EXPLOSION RESET", "AFTER · DARKFOREST"]
  ) {
    assert((html.match(new RegExp(phase, "g")) ?? []).length === 3, `missing ${phase} story phase`);
  }

  for (
    const [role, asset, ability] of [
      ["拾荒者", "/art/placeholders/scavenger.svg", "搜刮成功率 +4%"],
      ["執行者", "/art/placeholders/enforcer.svg", "命中率 +2.5%"],
      ["信使", "/art/placeholders/courier.svg", "趕路消耗 −3 氣力"],
    ] as const
  ) {
    assert(html.includes(role), `missing ${role} dossier`);
    assert(html.includes(asset), `missing original ${role} v3 portrait`);
    assert(html.includes(ability), `missing ${role} fixed ability`);
  }

  assert(html.includes("補給站"), "missing the local-fixture supply interface");
  assert(html.includes("Arbora"), "missing the neutral world-tree figure");
  assert(
    html.includes("/art/placeholders/contact.svg"),
    "missing the public-demo supply placeholder",
  );
  assert(
    html.includes("/art/placeholders/contact.svg"),
    "missing the public-demo Arbora placeholder",
  );
  assert(html.includes("PUBLIC DEMO · LOCAL FIXTURE"), "missing public-demo supply boundary");
  assert(!html.includes("WORLD CANON"), "private lineage leaked");
  assert(html.includes("不掌握攻擊、行動、掉落、數值或勝負權限"), "Arbora boundary missing");
  assert(html.includes("玩家不能成為 NPC"), "player/NPC boundary missing");
  for (const trait of ["醫護", "工匠", "通靈", "硬皮", "輕足"]) {
    assert(html.includes(trait), `missing match trait ${trait}`);
  }

  assert(
    !html.includes(".webp"),
    "public character archive must not reference excluded raster art",
  );
});
