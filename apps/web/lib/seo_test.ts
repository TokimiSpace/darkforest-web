import {
  buildRobots,
  buildSitemap,
  createSeoMetadata,
  normalizePublicSiteUrl,
  PUBLIC_SEO_PATHS,
  shouldIndexPublicSite,
} from "./seo.ts";
import zhTw from "@/locales/zh-TW.json" with { type: "json" };

function assert(condition: unknown, message = "assertion failed"): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals<T>(actual: T, expected: T): void {
  if (!Object.is(actual, expected)) {
    throw new Error(`expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function assertMatch(actual: string, expected: RegExp): void {
  if (!expected.test(actual)) {
    throw new Error(`${JSON.stringify(actual)} did not match ${expected}`);
  }
}

Deno.test("SEO metadata keeps every public page distinct and canonical", () => {
  const origin = "https://darkforest.example";
  const pages = PUBLIC_SEO_PATHS.map((path) => createSeoMetadata(path, origin, true));
  assertEquals(new Set(pages.map(({ title }) => title)).size, pages.length);
  assertEquals(new Set(pages.map(({ description }) => description)).size, pages.length);
  pages.forEach((page) => {
    assertEquals(page.robots.startsWith("index,follow"), true);
    assert(page.canonical?.startsWith(origin));
    assertEquals(page.socialImage, `${origin}/art/placeholders/social-card.png`);
  });
  assertEquals(createSeoMetadata("/tutorial/", origin, true).path, "/tutorial");
  assertEquals(createSeoMetadata("/about", origin, true).path, "/about");
  assertEquals(createSeoMetadata("/characters", origin, true).path, "/characters");
  assertEquals(createSeoMetadata("/characters", origin, true).schemaType, "CollectionPage");
  assertEquals(createSeoMetadata("/world", origin, true).path, "/world");
  assertEquals(createSeoMetadata("/world", origin, true).schemaType, "CollectionPage");
});

Deno.test("default SSR metadata stays aligned with the canonical zh-TW catalog", () => {
  const metadataKeys = [
    ["/", "meta.home.title", "meta.home.description"],
    ["/about", "meta.about.title", "meta.about.description"],
    ["/world", "meta.world.title", "meta.world.description"],
    ["/characters", "meta.characters.title", "meta.characters.description"],
    ["/tutorial", "meta.tutorial.title", "meta.tutorial.description"],
    ["/armory", "meta.armory.title", "meta.armory.description"],
    ["/leaderboard", "meta.leaderboard.title", "meta.leaderboard.description"],
  ] as const;

  for (const [path, titleKey, descriptionKey] of metadataKeys) {
    const metadata = createSeoMetadata(path, "https://darkforest.example", true);
    assertEquals(metadata.title, zhTw[titleKey]);
    assertEquals(metadata.description, zhTw[descriptionKey]);
  }
});

Deno.test("SEO refuses untrusted or non-production origins", () => {
  assertEquals(normalizePublicSiteUrl(undefined), null);
  assertEquals(normalizePublicSiteUrl("http://localhost:8399"), null);
  assertEquals(normalizePublicSiteUrl("https://user:secret@example.com"), null);
  assertEquals(normalizePublicSiteUrl("https://example.com/subpath"), null);
  assertEquals(normalizePublicSiteUrl("https://example.com/"), "https://example.com");
  const local = createSeoMetadata("/", null, true);
  assertEquals(local.canonical, null);
  assertEquals(local.socialImage, null);
  assertEquals(local.robots, "noindex,nofollow,noarchive");
});

Deno.test("canonical deployment indexes only by explicit opt-in", () => {
  const official = "https://game.example";
  assertEquals(shouldIndexPublicSite(official, undefined, `${official}/about`), false);
  assertEquals(shouldIndexPublicSite(official, "true", `${official}/world`), true);
  assertEquals(shouldIndexPublicSite(official, "false", `${official}/`), false);
  assertEquals(
    shouldIndexPublicSite(official, "true", "https://darkforest-web.example.deno.net/"),
    false,
  );
  assertEquals(
    shouldIndexPublicSite("https://game.example", undefined, "https://game.example/"),
    false,
  );
  assertEquals(
    shouldIndexPublicSite("https://game.example", "true", "https://game.example/"),
    true,
  );
  assertEquals(shouldIndexPublicSite(null, "true", official), false);
  assertEquals(shouldIndexPublicSite(official, "true", "not a url"), false);
});

Deno.test("unknown pages remain excluded from indexing", () => {
  const metadata = createSeoMetadata("/not-a-page", "https://darkforest.example", true);
  assertEquals(metadata.canonical, null);
  assertEquals(metadata.robots, "noindex,nofollow,noarchive");
});

Deno.test("robots and sitemap only expose trusted production URLs", () => {
  const origin = "https://darkforest.example";
  const robots = buildRobots(origin, true);
  assertMatch(robots, /Disallow: \/api\//);
  assertMatch(robots, /Sitemap: https:\/\/darkforest\.example\/sitemap\.xml/);
  assertEquals(buildRobots(null, false), "User-agent: *\nDisallow: /\n");

  const sitemap = buildSitemap(origin, true);
  assertEquals((sitemap.match(/<url>/g) ?? []).length, PUBLIC_SEO_PATHS.length);
  assertMatch(sitemap, /https:\/\/darkforest\.example\/characters/);
  assertMatch(sitemap, /https:\/\/darkforest\.example\/world/);
  assertEquals(buildSitemap(null, false).includes("<url>"), false);
});
