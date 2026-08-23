import {
  ITEM_ART_PATHS,
  itemArtPathsFor,
  itemCardArtUrl,
  itemFieldIconUrl,
  weaponOutlineIconUrl,
} from "./item_art.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const EXPECTED_KINDS = [
  "tool",
  "pistol",
  "rifle",
  "cleaver",
  "stool",
  "golf_club",
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
  "light_ammo",
  "bandage",
  "medkit",
  "healthy_food",
  "spoiled_food",
  "scrap",
  "trap_scanner",
  "insight_root_sense",
  "insight_calamity_echo",
];

Deno.test("shared item-art registry covers all 28 live ItemKinds with unique paths", () => {
  const actual = Object.keys(ITEM_ART_PATHS).sort();
  assert(JSON.stringify(actual) === JSON.stringify([...EXPECTED_KINDS].sort()), "kind drift");
  const fields = actual.map(itemFieldIconUrl);
  const cards = actual.map(itemCardArtUrl);
  assert(fields.every((path) => typeof path === "string"), "missing field icon");
  assert(cards.every((path) => typeof path === "string"), "missing card art");
  assert(new Set(fields).size === 28, "field icons must be unique");
  assert(new Set(cards).size === 28, "card art paths must be unique");
});

Deno.test("only the six weapons expose fog-contact outlines", () => {
  const outlined = EXPECTED_KINDS.filter((kind) => weaponOutlineIconUrl(kind) !== null);
  assert(
    outlined.join(",") === "tool,pistol,rifle,cleaver,stool,golf_club",
    `unexpected outlines: ${outlined.join(",")}`,
  );
});

Deno.test("unknown values never become arbitrary asset URLs", () => {
  for (const value of [undefined, null, "unknown_item", "../secrets", 12]) {
    assert(itemArtPathsFor(value) === null, `unsafe registry lookup: ${String(value)}`);
    assert(itemFieldIconUrl(value) === null, `unsafe field lookup: ${String(value)}`);
    assert(itemCardArtUrl(value) === null, `unsafe card lookup: ${String(value)}`);
    assert(weaponOutlineIconUrl(value) === null, `unsafe outline lookup: ${String(value)}`);
  }
});

Deno.test("match client consumes the registry across item decision surfaces", async () => {
  const source = await Deno.readTextFile(new URL("./client.js", import.meta.url));
  assert(!source.includes("ITEM_ICON_NAMES"), "client must not keep a second item allowlist");
  assert(
    !source.includes("/art/icons/weapons/${"),
    "fog outlines must not bypass the shared registry",
  );
  for (
    const marker of [
      'fieldItemIconMarkup(item.kind, "cache-item-icon")',
      'fieldItemIconMarkup(kind, "prompt-item-icon")',
      'fieldItemIconMarkup(wanted.kind, "cache-item-icon")',
      'fieldItemIconMarkup(item.kind, "node-cache-item-icon")',
    ]
  ) {
    assert(source.includes(marker), `missing item-art surface: ${marker}`);
  }
});
