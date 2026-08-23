export const VERSIONED_ART_CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";
export const DISCOVERY_ART_CACHE_CONTROL = "public, max-age=3600, stale-while-revalidate=86400";
export const REVALIDATED_SHELL_CACHE_CONTROL = "public, max-age=0, must-revalidate";

const VERSIONED_ART_PREFIXES = [
  "/art/icons/",
  "/art/placeholders/",
] as const;

const DISCOVERY_ART_PATHS = new Set(["/art/brand/darkforest-lockup.svg"]);

const REVALIDATED_ROOT_ASSET_EXTENSIONS = [
  ".css",
  ".ico",
  ".js",
  ".png",
  ".svg",
  ".webmanifest",
] as const;

export function publicAssetCacheControl(pathname: string): string | null {
  if (VERSIONED_ART_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return VERSIONED_ART_CACHE_CONTROL;
  }
  if (DISCOVERY_ART_PATHS.has(pathname)) return DISCOVERY_ART_CACHE_CONTROL;
  const rootFileName = pathname.startsWith("/") ? pathname.slice(1) : "";
  if (
    rootFileName !== "" && !rootFileName.includes("/") &&
    REVALIDATED_ROOT_ASSET_EXTENSIONS.some((extension) => rootFileName.endsWith(extension))
  ) {
    return REVALIDATED_SHELL_CACHE_CONTROL;
  }
  return null;
}

export function applyPublicAssetCacheControl(
  response: Response,
  cacheControl: string | null,
): Response {
  if (cacheControl === null || !response.ok) return response;
  const headers = new Headers(response.headers);
  headers.set("cache-control", cacheControl);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
