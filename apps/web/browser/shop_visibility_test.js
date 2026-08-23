function assert(condition, message) {
  if (!condition) throw new Error(message);
}

Deno.test("shop nodes always render a non-interactive location marker", async () => {
  const client = await Deno.readTextFile(new URL("./client.js", import.meta.url));
  const anchor = client.indexOf("const visibleTags = hazards.length === 0");
  assert(anchor >= 0, "the tactical tag renderer must remain locatable");
  const source = client.slice(anchor, anchor + 1_600);

  assert(
    source.includes("node?.shop === undefined") && source.includes('t("hud.shop.here")'),
    "the tactical field must identify the shop underfoot with localized copy",
  );
  assert(
    source.includes("tacticalArenaTags.innerHTML = shopChip +"),
    "the shop marker must lead the tag row on collapsed layouts",
  );
  assert(
    /class="tactical-arena-shop"/.test(source) && !/data-arena-gateway/.test(source),
    "the marker must not duplicate the interactive shop gateway",
  );
});
