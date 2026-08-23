export const PUBLIC_SEO_PATHS = [
  "/",
  "/about",
  "/world",
  "/characters",
  "/tutorial",
  "/armory",
  "/leaderboard",
] as const;

type PublicSeoPath = typeof PUBLIC_SEO_PATHS[number];
type SchemaPageType = "WebPage" | "CollectionPage";

interface SeoPageDefinition {
  path: PublicSeoPath;
  title: string;
  description: string;
  titleKey: string;
  descriptionKey: string;
  schemaType: SchemaPageType;
  breadcrumb: string;
}

const SOCIAL_IMAGE_PATH = "/art/placeholders/social-card.png";

const PAGE_DEFINITIONS: Record<PublicSeoPath, SeoPageDefinition> = {
  "/": {
    path: "/",
    title: "Darkforest Web｜開源前端與本機情境 Demo",
    description:
      "Darkforest: Reset Protocol 的獨立開源前端工作台，附固定、已清理的本機情境；不含配對、帳號、持久化戰績或正式服務相容性。",
    titleKey: "meta.home.title",
    descriptionKey: "meta.home.description",
    schemaType: "WebPage",
    breadcrumb: "戰局大廳",
  },
  "/about": {
    path: "/about",
    title: "專案概覽｜Darkforest Web 開源前端",
    description:
      "了解 Darkforest Web 公開前端的範圍、固定情境展示、設計概念與未包含的正式遊戲服務。",
    titleKey: "meta.about.title",
    descriptionKey: "meta.about.description",
    schemaType: "WebPage",
    breadcrumb: "關於 Darkforest",
  },
  "/world": {
    path: "/world",
    title: "世界介面預覽｜Darkforest Web",
    description:
      "瀏覽開源前端中的世界與地圖介面快照；內容用於本機 UI 展示，不代表可連線的正式世界服務。",
    titleKey: "meta.world.title",
    descriptionKey: "meta.world.description",
    schemaType: "CollectionPage",
    breadcrumb: "世界地區誌",
  },
  "/characters": {
    path: "/characters",
    title: "角色介面預覽｜Darkforest Web",
    description:
      "瀏覽開源前端中的角色與職業介面快照；資料是公開 demo 的固定展示內容，不會建立玩家帳號。",
    titleKey: "meta.characters.title",
    descriptionKey: "meta.characters.description",
    schemaType: "CollectionPage",
    breadcrumb: "倖存者角色檔案",
  },
  "/tutorial": {
    path: "/tutorial",
    title: "教學介面預覽｜Darkforest Web",
    description: "瀏覽開源前端的教學與手冊介面；互動只作用於固定本機情境，不會加入線上對局。",
    titleKey: "meta.tutorial.title",
    descriptionKey: "meta.tutorial.description",
    schemaType: "WebPage",
    breadcrumb: "生存訓練",
  },
  "/armory": {
    path: "/armory",
    title: "裝備圖鑑介面預覽｜Darkforest Web",
    description:
      "查看公開 demo 內的裝備圖鑑介面與已清理的展示資料；不包含正式平衡資料或內容生產工具。",
    titleKey: "meta.armory.title",
    descriptionKey: "meta.armory.description",
    schemaType: "CollectionPage",
    breadcrumb: "軍械圖鑑",
  },
  "/leaderboard": {
    path: "/leaderboard",
    title: "本機紀錄介面預覽｜Darkforest Web",
    description: "預覽空白的本機紀錄介面；此 repo 不含排名服務，也不保存 fixture demo 的結果。",
    titleKey: "meta.leaderboard.title",
    descriptionKey: "meta.leaderboard.description",
    schemaType: "CollectionPage",
    breadcrumb: "倖存者排行",
  },
};

export interface SeoMetadata extends SeoPageDefinition {
  canonical: string | null;
  socialImage: string | null;
  robots: string;
}

/**
 * The standalone repository has no canonical production domain. Indexing is opt-in and requires
 * an exact request-origin match.
 */
export function shouldIndexPublicSite(
  publicSiteUrl: string | null,
  configuredValue: string | undefined,
  requestUrl: string | URL | undefined,
): boolean {
  if (publicSiteUrl === null || configuredValue?.trim().toLowerCase() === "false") return false;
  try {
    const requestOrigin = requestUrl === undefined ? null : new URL(requestUrl).origin;
    if (requestOrigin !== publicSiteUrl) return false;
  } catch {
    return false;
  }
  return configuredValue?.trim().toLowerCase() === "true";
}

export function readEnvironment(name: string): string | undefined {
  try {
    return Deno.env.get(name);
  } catch {
    return undefined;
  }
}

function normalizedPath(pathname: string): string {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "") || "/";
}

function isPublicSeoPath(pathname: string): pathname is PublicSeoPath {
  return PUBLIC_SEO_PATHS.some((candidate) => candidate === pathname);
}

export function normalizePublicSiteUrl(value: string | undefined): string | null {
  if (value === undefined || value.trim() === "") return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" || url.username !== "" || url.password !== "" ||
      url.search !== "" || url.hash !== "" || (url.pathname !== "/" && url.pathname !== "")
    ) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function absoluteUrl(origin: string, path: string): string {
  return new URL(path, `${origin}/`).href;
}

export function createSeoMetadata(
  pathname: string,
  publicSiteUrl: string | null,
  indexable: boolean,
): SeoMetadata {
  const path = normalizedPath(pathname);
  const known = isPublicSeoPath(path);
  const page = known ? PAGE_DEFINITIONS[path] : PAGE_DEFINITIONS["/"];
  const canIndex = known && indexable && publicSiteUrl !== null;
  const canonical = known && publicSiteUrl !== null ? absoluteUrl(publicSiteUrl, page.path) : null;
  return {
    ...page,
    canonical,
    socialImage: publicSiteUrl === null ? null : absoluteUrl(publicSiteUrl, SOCIAL_IMAGE_PATH),
    robots: canIndex
      ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
      : "noindex,nofollow,noarchive",
  };
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export function buildSitemap(publicSiteUrl: string | null, indexable: boolean): string {
  const urls = publicSiteUrl !== null && indexable
    ? PUBLIC_SEO_PATHS.map((path) =>
      `  <url><loc>${escapeXml(absoluteUrl(publicSiteUrl, path))}</loc></url>`
    ).join("\n")
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${
    urls === "" ? "" : `\n${urls}\n`
  }</urlset>\n`;
}

export function buildRobots(publicSiteUrl: string | null, indexable: boolean): string {
  if (publicSiteUrl === null || !indexable) return "User-agent: *\nDisallow: /\n";
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /ws/",
    `Sitemap: ${absoluteUrl(publicSiteUrl, "/sitemap.xml")}`,
    "",
  ].join("\n");
}
