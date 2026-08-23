import { replaySample } from "@darkforest/fixtures";
import { App, staticFiles } from "fresh";
import assetManifest from "./static/assets-manifest.json" with { type: "json" };
import localeEn from "./locales/en.json" with { type: "json" };
import localeJa from "./locales/ja.json" with { type: "json" };
import localeKo from "./locales/ko.json" with { type: "json" };
import localeVi from "./locales/vi.json" with { type: "json" };
import matchLocaleEn from "./locales/match.en.json" with { type: "json" };
import matchLocaleJa from "./locales/match.ja.json" with { type: "json" };
import matchLocaleKo from "./locales/match.ko.json" with { type: "json" };
import matchLocaleVi from "./locales/match.vi.json" with { type: "json" };
import matchLocaleZhCn from "./locales/match.zh-CN.json" with { type: "json" };
import matchLocaleZhTw from "./locales/match.zh-TW.json" with { type: "json" };
import localeZhCn from "./locales/zh-CN.json" with { type: "json" };
import localeZhTw from "./locales/zh-TW.json" with { type: "json" };
import {
  buildRobots,
  buildSitemap,
  normalizePublicSiteUrl,
  readEnvironment,
  shouldIndexPublicSite,
} from "./lib/seo.ts";
import { publicAssetCacheControl } from "./lib/static_cache.ts";
import AboutPage from "./routes/about.tsx";
import ArmoryPage from "./routes/armory.tsx";
import CharactersPage from "./routes/characters.tsx";
import Document from "./routes/_app.tsx";
import HomePage from "./routes/index.tsx";
import LeaderboardPage from "./routes/leaderboard.tsx";
import TutorialPage from "./routes/tutorial.tsx";
import UiLabPage, { uiLabIsEnabled } from "./routes/ui-lab.tsx";
import WorldPage from "./routes/world.tsx";

export const app = new App();

const shellLocaleBodies = new Map<string, string>([
  ["en", JSON.stringify(localeEn)],
  ["ja", JSON.stringify(localeJa)],
  ["ko", JSON.stringify(localeKo)],
  ["vi", JSON.stringify(localeVi)],
  ["zh-CN", JSON.stringify(localeZhCn)],
  ["zh-TW", JSON.stringify(localeZhTw)],
]);
const matchLocaleBodies = new Map<string, string>([
  ["en", JSON.stringify(matchLocaleEn)],
  ["ja", JSON.stringify(matchLocaleJa)],
  ["ko", JSON.stringify(matchLocaleKo)],
  ["vi", JSON.stringify(matchLocaleVi)],
  ["zh-CN", JSON.stringify(matchLocaleZhCn)],
  ["zh-TW", JSON.stringify(matchLocaleZhTw)],
]);

const SECURITY_HEADERS = {
  "content-security-policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "connect-src 'self' ws://127.0.0.1:8788 ws://localhost:8788",
    "font-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "img-src 'self' data:",
    "media-src 'self'",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
  ].join("; "),
  "cross-origin-opener-policy": "same-origin",
  "permissions-policy": "camera=(), geolocation=(), microphone=(), payment=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
} as const;

app.use(async (ctx) => {
  const response = await ctx.next();
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  if (ctx.req.method === "GET" || ctx.req.method === "HEAD") {
    const cacheControl = publicAssetCacheControl(ctx.url.pathname);
    if (cacheControl !== null && response.ok) headers.set("cache-control", cacheControl);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
app.use(staticFiles());
app.appWrapper(Document);

type StaticFileRoute = Readonly<{
  path: `/${string}`;
  fileName: string;
  contentType: string;
}>;

const ROOT_STATIC_FILE_ROUTES: readonly StaticFileRoute[] = [
  {
    path: "/action_animation_state.js",
    fileName: "action_animation_state.js",
    contentType: "text/javascript; charset=utf-8",
  },
  {
    path: "/ambient_music.js",
    fileName: "ambient_music.js",
    contentType: "text/javascript; charset=utf-8",
  },
  { path: "/app.js", fileName: "app.js", contentType: "text/javascript; charset=utf-8" },
  {
    path: "/bootstrap.js",
    fileName: "bootstrap.js",
    contentType: "text/javascript; charset=utf-8",
  },
  {
    path: "/character_motion.js",
    fileName: "character_motion.js",
    contentType: "text/javascript; charset=utf-8",
  },
  {
    path: "/echo_oracle.js",
    fileName: "echo_oracle.js",
    contentType: "text/javascript; charset=utf-8",
  },
  { path: "/favicon.svg", fileName: "favicon.svg", contentType: "image/svg+xml" },
  {
    path: "/html_escape.js",
    fileName: "html_escape.js",
    contentType: "text/javascript; charset=utf-8",
  },
  { path: "/i18n.js", fileName: "i18n.js", contentType: "text/javascript; charset=utf-8" },
  { path: "/item_art.js", fileName: "item_art.js", contentType: "text/javascript; charset=utf-8" },
  {
    path: "/leaderboard.js",
    fileName: "leaderboard.js",
    contentType: "text/javascript; charset=utf-8",
  },
  {
    path: "/lobby_profile.js",
    fileName: "lobby_profile.js",
    contentType: "text/javascript; charset=utf-8",
  },
  {
    path: "/lobby_profile_form.js",
    fileName: "lobby_profile_form.js",
    contentType: "text/javascript; charset=utf-8",
  },
  {
    path: "/match_clock.js",
    fileName: "match_clock.js",
    contentType: "text/javascript; charset=utf-8",
  },
  {
    path: "/match_connection.js",
    fileName: "match_connection.js",
    contentType: "text/javascript; charset=utf-8",
  },
  {
    path: "/narrative_log.js",
    fileName: "narrative_log.js",
    contentType: "text/javascript; charset=utf-8",
  },
  {
    path: "/narrative_mode.js",
    fileName: "narrative_mode.js",
    contentType: "text/javascript; charset=utf-8",
  },
  {
    path: "/protocol_runtime.js",
    fileName: "protocol_runtime.js",
    contentType: "text/javascript; charset=utf-8",
  },
  {
    path: "/site.webmanifest",
    fileName: "site.webmanifest",
    contentType: "application/manifest+json; charset=utf-8",
  },
  { path: "/styles.css", fileName: "styles.css", contentType: "text/css; charset=utf-8" },
  {
    path: "/tactical_arena.js",
    fileName: "tactical_arena.js",
    contentType: "text/javascript; charset=utf-8",
  },
  { path: "/tutorial.js", fileName: "tutorial.js", contentType: "text/javascript; charset=utf-8" },
  {
    path: "/view_helpers.js",
    fileName: "view_helpers.js",
    contentType: "text/javascript; charset=utf-8",
  },
] as const;

const APPROVED_ART_PATHS = new Set(
  assetManifest.files
    .filter((entry) => entry.status === "approved" && entry.path.startsWith("art/"))
    .map((entry) => entry.path),
);

async function staticResponse(fileName: string, contentType: string): Promise<Response> {
  const candidates = [
    new URL(`./static/${fileName}`, import.meta.url),
    new URL(`../client/${fileName}`, import.meta.url),
  ];
  for (const candidate of candidates) {
    try {
      return new Response(await Deno.readFile(candidate), {
        headers: { "content-type": contentType },
      });
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
  return new Response("not found", { status: 404 });
}

function assetContentType(fileName: string): string {
  if (fileName.endsWith(".svg")) return "image/svg+xml";
  if (fileName.endsWith(".webp")) return "image/webp";
  if (fileName.endsWith(".png")) return "image/png";
  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

function approvedArtResponse(fileName: string): Promise<Response> | Response {
  if (!APPROVED_ART_PATHS.has(fileName)) return new Response("not found", { status: 404 });
  return staticResponse(fileName, assetContentType(fileName)).catch(() =>
    new Response("not found", { status: 404 })
  );
}

// `staticFiles()` serves the production build cache. These explicit, closed routes also make the
// source-mode `deno task dev` server useful without exposing arbitrary files from `static/`.
for (const route of ROOT_STATIC_FILE_ROUTES) {
  app.get(route.path, () => staticResponse(route.fileName, route.contentType));
}

app.get("/art/icons/:kind/:file", (ctx) => {
  const { kind, file } = ctx.params;
  return approvedArtResponse(`art/icons/${kind}/${file}`);
});

app.get("/art/:group/:file", (ctx) => {
  const { group, file } = ctx.params;
  return approvedArtResponse(`art/${group}/${file}`);
});

app.get("/locales/match.:locale.json", (ctx) => {
  const body = matchLocaleBodies.get(ctx.params.locale);
  return body === undefined ? new Response("not found", { status: 404 }) : new Response(body, {
    headers: {
      "cache-control": "no-cache",
      "content-type": "application/json; charset=utf-8",
    },
  });
});

app.get("/locales/:locale.json", (ctx) => {
  const body = shellLocaleBodies.get(ctx.params.locale);
  return body === undefined ? new Response("not found", { status: 404 }) : new Response(body, {
    headers: {
      "cache-control": "no-cache",
      "content-type": "application/json; charset=utf-8",
    },
  });
});

app.get("/robots.txt", (ctx) => {
  const publicSiteUrl = normalizePublicSiteUrl(readEnvironment("PUBLIC_SITE_URL"));
  return new Response(
    buildRobots(
      publicSiteUrl,
      shouldIndexPublicSite(publicSiteUrl, readEnvironment("SEO_INDEXABLE"), ctx.req.url),
    ),
    { headers: { "content-type": "text/plain; charset=utf-8" } },
  );
});

app.get("/sitemap.xml", (ctx) => {
  const publicSiteUrl = normalizePublicSiteUrl(readEnvironment("PUBLIC_SITE_URL"));
  return new Response(
    buildSitemap(
      publicSiteUrl,
      shouldIndexPublicSite(publicSiteUrl, readEnvironment("SEO_INDEXABLE"), ctx.req.url),
    ),
    { headers: { "content-type": "application/xml; charset=utf-8" } },
  );
});

app.get("/api/replay-sample", () => {
  if (replaySample.replay === undefined) {
    return Response.json({ error: "replay fixture unavailable" }, { status: 404 });
  }
  return Response.json(replaySample.replay, { headers: { "cache-control": "no-store" } });
});

app.get("/healthz", () =>
  Response.json(
    { ready: true, mode: "open-source-local-demo" },
    { headers: { "cache-control": "no-store" } },
  ));
app.get("/api/v1/match-health", () =>
  Response.json(
    { ready: true, mode: "local-fixture", endpoint: "ws://127.0.0.1:8788/ws" },
    { headers: { "cache-control": "no-store" } },
  ));
app.get("/api/v1/leaderboard", () =>
  Response.json(
    { entries: [], durability: "session/dev" },
    { headers: { "cache-control": "no-store" } },
  ));

app.get("/", (ctx) => ctx.render(HomePage()));
app.get("/about", (ctx) => ctx.render(AboutPage()));
app.get("/characters", (ctx) => ctx.render(CharactersPage()));
app.get("/armory", (ctx) => ctx.render(ArmoryPage()));
app.get("/leaderboard", (ctx) => ctx.render(LeaderboardPage()));
app.get("/tutorial", (ctx) => ctx.render(TutorialPage()));
app.get("/world", (ctx) => ctx.render(WorldPage()));
app.get(
  "/ui-lab",
  (ctx) => uiLabIsEnabled() ? ctx.render(UiLabPage()) : new Response("Not found", { status: 404 }),
);

if (import.meta.main) {
  await app.listen({ hostname: "127.0.0.1", port: 8000 });
}
