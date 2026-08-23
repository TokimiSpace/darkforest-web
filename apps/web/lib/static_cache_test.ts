import { assertEquals } from "jsr:@std/assert@1";
import {
  applyPublicAssetCacheControl,
  DISCOVERY_ART_CACHE_CONTROL,
  publicAssetCacheControl,
  REVALIDATED_SHELL_CACHE_CONTROL,
  VERSIONED_ART_CACHE_CONTROL,
} from "./static_cache.ts";

Deno.test("only reviewed art families receive public cache policies", () => {
  for (
    const path of [
      "/art/icons/weapons/pistol-v3.svg",
      "/art/placeholders/scene.svg",
    ]
  ) {
    assertEquals(publicAssetCacheControl(path), VERSIONED_ART_CACHE_CONTROL);
  }
  assertEquals(
    publicAssetCacheControl("/art/brand/darkforest-lockup.svg"),
    DISCOVERY_ART_CACHE_CONTROL,
  );
  assertEquals(
    publicAssetCacheControl("/art/brand/darkforest-lockup.svg"),
    DISCOVERY_ART_CACHE_CONTROL,
  );
  for (
    const path of [
      "/art/brand/darkforest-lockup.svg",
    ]
  ) {
    assertEquals(publicAssetCacheControl(path), DISCOVERY_ART_CACHE_CONTROL);
  }
  assertEquals(publicAssetCacheControl("/styles.css"), REVALIDATED_SHELL_CACHE_CONTROL);
  assertEquals(publicAssetCacheControl("/bootstrap.js"), REVALIDATED_SHELL_CACHE_CONTROL);
  assertEquals(publicAssetCacheControl("/favicon-32.png"), REVALIDATED_SHELL_CACHE_CONTROL);
  for (const path of ["/", "/api/v1/leaderboard", "/api/unsafe.js"]) {
    assertEquals(publicAssetCacheControl(path), null);
  }
});

Deno.test("cache middleware rewrites successful static responses without caching errors", async () => {
  const original = new Response("asset", {
    headers: { "cache-control": "no-cache, no-store", "content-type": "image/webp" },
  });
  const cached = applyPublicAssetCacheControl(original, VERSIONED_ART_CACHE_CONTROL);
  assertEquals(cached.headers.get("cache-control"), VERSIONED_ART_CACHE_CONTROL);
  assertEquals(cached.headers.get("content-type"), "image/webp");
  assertEquals(await cached.text(), "asset");

  const missing = new Response("missing", { status: 404 });
  assertEquals(applyPublicAssetCacheControl(missing, VERSIONED_ART_CACHE_CONTROL), missing);
  const html = new Response("page", { headers: { "cache-control": "no-store" } });
  assertEquals(applyPublicAssetCacheControl(html, null), html);
});
