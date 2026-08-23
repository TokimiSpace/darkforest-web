/**
 * Verify that every public static asset is allowlisted, rights-approved, and
 * byte-for-byte identical to apps/web/static/assets-manifest.json.
 */

import type { Finding } from "./publication_guard.ts";

interface AssetRecord {
  path: string;
  sha256: string;
  license: string;
  status: string;
  source: string;
}

interface AssetManifest {
  schemaVersion: number;
  files: AssetRecord[];
}

const STATIC_ROOT = "apps/web/static";
const MANIFEST_PATH = `${STATIC_ROOT}/assets-manifest.json`;
const STATIC_ALLOWLIST_PATH = "scripts/static_root_allowlist.json";
const ASSET_PREFIXES = ["art/", "assets/", "audio/", "fonts/", "icons/", "images/", "media/"];
const ASSET_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".json",
  ".mp3",
  ".mp4",
  ".ogg",
  ".png",
  ".svg",
  ".wav",
  ".webm",
  ".webp",
  ".woff",
  ".woff2",
]);

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\//, "");
}

function extension(path: string): string {
  const name = path.slice(path.lastIndexOf("/") + 1);
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot).toLowerCase();
}

function isSafeRelativePath(path: string): boolean {
  if (!path || path.startsWith("/") || path.includes("\\") || path.includes("\0")) return false;
  const parts = path.split("/");
  return parts.every((part) => part.length > 0 && part !== "." && part !== "..");
}

async function sha256(path: string): Promise<string> {
  const bytes = await Deno.readFile(path);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function walkStatic(
  root: string,
  directory = root,
  findings: Finding[] = [],
): Promise<string[]> {
  const files: string[] = [];
  const entries = [...Deno.readDirSync(directory)].sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const absolute = `${directory}/${entry.name}`;
    const relative = normalizePath(absolute.slice(root.length + 1));
    if (entry.isSymlink) {
      findings.push({
        rule: "static-symlink",
        path: `${STATIC_ROOT}/${relative}`,
        message: "Static symbolic links are forbidden.",
      });
      continue;
    }
    if (entry.isDirectory) {
      files.push(...await walkStatic(root, absolute, findings));
    } else if (entry.isFile) {
      files.push(relative);
    }
  }
  return files;
}

function validAssetLocation(path: string): boolean {
  if (!isSafeRelativePath(path)) return false;
  if (!ASSET_EXTENSIONS.has(extension(path))) return false;
  if (!path.includes("/")) return true;
  return ASSET_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export async function verifyAssets(rootInput: string): Promise<Finding[]> {
  const root = normalizePath(await Deno.realPath(rootInput)).replace(/\/$/, "");
  const manifestAbsolute = `${root}/${MANIFEST_PATH}`;
  const staticAbsolute = `${root}/${STATIC_ROOT}`;
  const findings: Finding[] = [];

  let manifest: AssetManifest;
  try {
    manifest = JSON.parse(await Deno.readTextFile(manifestAbsolute)) as AssetManifest;
  } catch (error) {
    findings.push({
      rule: "asset-manifest",
      path: MANIFEST_PATH,
      message: `Missing or invalid asset manifest: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
    return findings;
  }

  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.files)) {
    findings.push({
      rule: "asset-manifest-schema",
      path: MANIFEST_PATH,
      message: "Expected schemaVersion 1 and a files array.",
    });
    return findings;
  }

  let rootAllowlist: Set<string>;
  try {
    const parsed = JSON.parse(await Deno.readTextFile(`${root}/${STATIC_ALLOWLIST_PATH}`)) as {
      schemaVersion?: unknown;
      files?: unknown;
    };
    if (
      parsed.schemaVersion !== 1 || !Array.isArray(parsed.files) ||
      !parsed.files.every((path) =>
        typeof path === "string" && path.length > 0 && !path.includes("/") &&
        isSafeRelativePath(path)
      )
    ) {
      throw new Error("expected schemaVersion 1 and a basename-only files array");
    }
    rootAllowlist = new Set(parsed.files as string[]);
    if (rootAllowlist.size !== parsed.files.length) {
      throw new Error("duplicate root static filename");
    }
  } catch (error) {
    findings.push({
      rule: "static-allowlist",
      path: STATIC_ALLOWLIST_PATH,
      message: `Missing or invalid root allowlist: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
    return findings;
  }

  let staticFiles: string[];
  try {
    staticFiles = await walkStatic(staticAbsolute, staticAbsolute, findings);
  } catch (error) {
    findings.push({
      rule: "static-root",
      path: STATIC_ROOT,
      message: `Unable to inspect static root: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
    return findings;
  }

  const diskFiles = new Set(staticFiles.filter((path) => path !== "assets-manifest.json"));
  const manifestFiles = new Map<string, AssetRecord>();

  for (const record of manifest.files) {
    if (!record || typeof record !== "object" || typeof record.path !== "string") {
      findings.push({
        rule: "asset-manifest-record",
        path: MANIFEST_PATH,
        message: "Every files entry must be an object with a path.",
      });
      continue;
    }
    const path = normalizePath(record.path);
    if (!validAssetLocation(path)) {
      findings.push({
        rule: "static-allowlist",
        path: `${STATIC_ROOT}/${path}`,
        message:
          "Asset paths must be safe, use an approved static prefix, and have an approved extension.",
      });
      continue;
    }
    if (manifestFiles.has(path)) {
      findings.push({
        rule: "asset-manifest-duplicate",
        path: `${STATIC_ROOT}/${path}`,
        message: "The asset path appears more than once in the manifest.",
      });
      continue;
    }
    manifestFiles.set(path, record);

    if (record.status !== "approved") {
      findings.push({
        rule: "asset-rights",
        path: `${STATIC_ROOT}/${path}`,
        message: 'Public assets must have status "approved".',
      });
    }
    if (typeof record.license !== "string" || record.license.trim().length === 0) {
      findings.push({
        rule: "asset-license",
        path: `${STATIC_ROOT}/${path}`,
        message: "Every public asset needs an SPDX license identifier or LicenseRef.",
      });
    }
    if (typeof record.source !== "string" || record.source.trim().length === 0) {
      findings.push({
        rule: "asset-source",
        path: `${STATIC_ROOT}/${path}`,
        message: "Every public asset needs a non-empty provenance source.",
      });
    }
    if (typeof record.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(record.sha256)) {
      findings.push({
        rule: "asset-hash-format",
        path: `${STATIC_ROOT}/${path}`,
        message: "sha256 must be a lowercase 64-character hexadecimal digest.",
      });
      continue;
    }
    if (!diskFiles.has(path)) {
      findings.push({
        rule: "asset-missing",
        path: `${STATIC_ROOT}/${path}`,
        message: "The manifest references a file that does not exist.",
      });
      continue;
    }
    const actualHash = await sha256(`${staticAbsolute}/${path}`);
    if (actualHash !== record.sha256) {
      findings.push({
        rule: "asset-hash-mismatch",
        path: `${STATIC_ROOT}/${path}`,
        message: `Expected ${record.sha256}, received ${actualHash}.`,
      });
    }
  }

  for (const path of diskFiles) {
    if (path.endsWith(".map") || path.startsWith(".") || path.includes("/.")) {
      findings.push({
        rule: "static-allowlist",
        path: `${STATIC_ROOT}/${path}`,
        message: "Hidden files and source maps are not allowed in public static output.",
      });
      continue;
    }

    const isAssetDirectory = ASSET_PREFIXES.some((prefix) => path.startsWith(prefix));
    const isRootAsset = !path.includes("/") && ASSET_EXTENSIONS.has(extension(path));
    if (isAssetDirectory || isRootAsset) {
      if (!manifestFiles.has(path)) {
        findings.push({
          rule: "asset-unmanifested",
          path: `${STATIC_ROOT}/${path}`,
          message: "Every static asset must be present in the canonical asset manifest.",
        });
      }
      continue;
    }

    if (path.includes("/") || !rootAllowlist.has(path)) {
      findings.push({
        rule: "static-allowlist",
        path: `${STATIC_ROOT}/${path}`,
        message: "The static file is outside the exact root allowlist and approved asset prefixes.",
      });
    }
  }

  for (const path of rootAllowlist) {
    if (!diskFiles.has(path)) {
      findings.push({
        rule: "static-allowlist-missing",
        path: `${STATIC_ROOT}/${path}`,
        message: "The root static allowlist references a file that does not exist.",
      });
    }
  }

  return findings.sort((a, b) => a.path.localeCompare(b.path) || a.rule.localeCompare(b.rule));
}

if (import.meta.main) {
  const root = Deno.args[0] ?? new URL("../", import.meta.url).pathname;
  const findings = await verifyAssets(root);
  if (findings.length > 0) {
    console.error(`Static-asset verification failed with ${findings.length} finding(s):`);
    for (const finding of findings) {
      console.error(`::error file=${finding.path},title=${finding.rule}::${finding.message}`);
    }
    Deno.exit(1);
  }
  console.log("Static-asset manifest and allowlist verification passed.");
}
