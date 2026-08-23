import type { ItemKind } from "@darkforest/protocol";
import { ITEM_ART_CATALOG, ITEM_ART_SECTIONS, itemArtFor } from "./item_art.ts";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const EXPECTED_ITEM_KINDS = [
  "tool",
  "pistol",
  "rifle",
  "cleaver",
  "stool",
  "golf_club",
  "light_ammo",
  "bandage",
  "medkit",
  "healthy_food",
  "spoiled_food",
  "scrap",
  "trap_scanner",
  "insight_root_sense",
  "insight_calamity_echo",
  "cloth_jacket",
  "stab_jacket",
  "composite_chest",
  "work_helmet",
  "nvg_helmet",
  "work_pants",
  "rough_gloves",
  "labor_gloves",
  "leather_gloves",
  "small_backpack",
  "large_backpack",
  "soft_sole",
  "steel_toe",
] as const satisfies ReadonlyArray<ItemKind>;

Deno.test("軍械圖鑑完整覆蓋 protocol 的 28 種 ItemKind", () => {
  const expected = [...EXPECTED_ITEM_KINDS].sort();
  const actual = ITEM_ART_CATALOG.map((entry) => entry.kind).sort();
  assert(actual.length === 28, `expected 28 entries, got ${actual.length}`);
  assert(JSON.stringify(actual) === JSON.stringify(expected), "catalog kinds differ from contract");
});

Deno.test("每件道具使用唯一 code-native SVG 且分類數量正確", () => {
  const icons = ITEM_ART_CATALOG.map((entry) => entry.fieldIcon);
  assert(new Set(icons).size === icons.length, "every item must have a unique icon path");
  assert(
    icons.every((path) => path.startsWith("/art/icons/") && path.endsWith(".svg")),
    "all entries must use public SVG field art",
  );
  const cards = ITEM_ART_CATALOG.map((entry) => entry.cardArt);
  assert(new Set(cards).size === cards.length, "every item must reserve a unique card-art path");
  assert(
    cards.every((path, index) => path === icons[index]),
    "public cards reuse the same reviewed SVG without a private raster set",
  );

  const expectedCounts = { weapon: 6, equipment: 11, footwear: 2, supply: 9 } as const;
  for (const section of ITEM_ART_SECTIONS) {
    const count = ITEM_ART_CATALOG.filter((entry) => entry.category === section.id).length;
    assert(count === expectedCounts[section.id], `${section.id}: ${count}`);
  }
});

Deno.test("itemArtFor 可回傳遊戲實際消費的圖像資料", () => {
  const art = itemArtFor("steel_toe");
  assert(art.name === "鋼頭鞋", "localized name should remain stable");
  assert(
    art.fieldIcon === "/art/icons/shoes/steel-toe-v3.svg",
    "shoe should use public SVG art",
  );
  assert(art.cardArt === art.fieldIcon, "shoe card should reuse public SVG art");
});

Deno.test("城市武器使用同源 SVG 戰局與迷霧素材", () => {
  for (const kind of ["cleaver", "stool", "golf_club"] as const) {
    const entry = itemArtFor(kind);
    assert(entry.category === "weapon", `${kind} must be a live weapon`);
    assert(entry.fieldIcon.endsWith("-v3.svg"), `${kind} filled art must be public SVG`);
    assert(entry.outlineIcon !== null, `${kind} needs fog art`);
    assert(entry.outlineIcon.startsWith("/art/icons/weapons/"), `${kind} needs public fog art`);
    assert(entry.outlineIcon.endsWith("-outline-v3.svg"), `${kind} needs public fog art`);
  }
});

Deno.test("28 張卡面、28 張 field icon 與 6 張迷霧輪廓皆存在且符合傳輸預算", async () => {
  for (const entry of ITEM_ART_CATALOG) {
    const card = await Deno.stat(new URL(`../static${entry.cardArt}`, import.meta.url));
    const field = await Deno.stat(new URL(`../static${entry.fieldIcon}`, import.meta.url));
    assert(card.isFile && card.size <= 55_000, `${entry.kind} card exceeds 55 KB`);
    assert(field.isFile && field.size <= 12_000, `${entry.kind} field icon exceeds 12 KB`);
    if (entry.category === "weapon") {
      assert(entry.outlineIcon !== null, `${entry.kind} outline missing`);
      const outline = await Deno.stat(
        new URL(`../static${entry.outlineIcon}`, import.meta.url),
      );
      assert(outline.isFile && outline.size <= 8_000, `${entry.kind} outline exceeds 8 KB`);
    }
  }
});
