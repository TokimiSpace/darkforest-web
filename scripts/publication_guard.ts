/**
 * Fail closed when private implementation details or unsafe public defaults
 * appear in the curated frontend export.
 *
 * Run from the repository root:
 *   deno run --allow-read=. scripts/publication_guard.ts
 */

export interface Finding {
  rule: string;
  path: string;
  message: string;
  line?: number;
}

const SKIPPED_DIRECTORIES = new Set([
  ".git",
  ".deno",
  "_fresh",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "output",
  "playwright-report",
  "test-results",
  "vendor",
]);

const TEXT_EXTENSIONS = new Set([
  "",
  ".css",
  ".env",
  ".html",
  ".js",
  ".json",
  ".jsonc",
  ".jsx",
  ".lock",
  ".md",
  ".mjs",
  ".svg",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".webmanifest",
  ".xml",
  ".yaml",
  ".yml",
]);

const REVIEWED_BINARY_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".mp3",
  ".ogg",
  ".png",
  ".ttf",
  ".wav",
  ".webp",
  ".woff",
  ".woff2",
]);

const FORBIDDEN_PATHS: Array<{ rule: string; pattern: RegExp; message: string }> = [
  {
    rule: "private-core",
    pattern: /^packages\/core(?:\/|$)/i,
    message: "The private game core is outside the public frontend boundary.",
  },
  {
    rule: "private-server",
    pattern: /^apps\/match-server(?:\/|$)/i,
    message: "The production match server is outside the public frontend boundary.",
  },
  {
    rule: "operations-surface",
    pattern: /(?:^|\/)(?:admin|analytics|funnel)(?:[._/-]|$)/i,
    message: "Administrative, analytics, and funnel surfaces are not public client code.",
  },
  {
    rule: "private-provider",
    pattern:
      /(?:^|\/)(?:provider|translation|session[-_]?integration|chat[-_]?endpoint)(?:[._/-]|$)/i,
    message: "Private provider or session integration must not be exported.",
  },
  {
    rule: "internal-document",
    pattern:
      /(?:^|\/)[^/]*(?:internal|private|handoff|context|as[-_]?built|agent[-_]?notes|authoring)[^/]*\.(?:md|txt)$/i,
    message: "Internal operating and authoring documents must not enter the public repository.",
  },
  {
    rule: "internal-directory",
    pattern:
      /(?:^|\/)(?:\.art-tools|\.art-work|\.claude|\.codegraph|internal|private|handoff|audits?|raw-prompts?)(?:\/|$)/i,
    message: "Private workspaces, audits, and authoring material are excluded.",
  },
  {
    rule: "runtime-data",
    pattern: /(?:^|\/)(?:replays|sim-out)(?:\/|$)|\.(?:db|sqlite|sqlite3)(?:[-.].*)?$/i,
    message: "Runtime, replay, simulation, and database data cannot be published.",
  },
  {
    rule: "environment-file",
    pattern: /(?:^|\/)\.env(?:\..+)?$/i,
    message: "Only redacted *.example environment templates may be committed.",
  },
  {
    rule: "credential-file",
    pattern: /\.(?:key|keystore|mobileprovision|p12|pem|pfx)$/i,
    message: "Credential material cannot be published.",
  },
  {
    rule: "credential-config",
    pattern: /(?:^|\/)(?:\.npmrc|\.pypirc|\.netrc|auth\.json)$/i,
    message: "Package-manager or network credential configuration cannot be published.",
  },
  {
    rule: "archive-file",
    pattern: /\.(?:7z|bz2|dmg|gz|rar|tar|tgz|xz|zip)$/i,
    message:
      "Archives are not accepted in the curated source export; review and add files directly.",
  },
  {
    rule: "raw-prompt",
    pattern: /(?:^|\/)[^/]*\.prompt\.(?:md|txt|json)$/i,
    message: "Raw generation prompts are not part of the public content pack.",
  },
];

const PRIVATE_PATH_PATTERNS: Array<{ rule: string; pattern: RegExp; message: string }> = [
  {
    rule: "local-absolute-path",
    pattern: /(?:^|[\s"'(=])\/(?:Users|Volumes)\/[A-Za-z0-9._ -]+\//m,
    message: "A macOS user or mounted-volume path was found.",
  },
  {
    rule: "local-absolute-path",
    pattern: /(?:^|[\s"'(=])\/home\/[A-Za-z0-9._-]+\//m,
    message: "A Linux home-directory path was found.",
  },
  {
    rule: "local-absolute-path",
    pattern: /(?:^|[\s"'(=])[A-Za-z]:\\Users\\[^\\\s"']+\\/m,
    message: "A Windows user-directory path was found.",
  },
  {
    rule: "private-key",
    pattern: /-----BEGIN (?:EC |OPENSSH |PGP |RSA )?PRIVATE KEY-----/,
    message: "Private-key material was found.",
  },
  {
    rule: "aws-credential",
    pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
    message: "An AWS access-key identifier was found.",
  },
  {
    rule: "github-token",
    pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,})\b/,
    message: "A GitHub token was found.",
  },
  {
    rule: "slack-credential",
    pattern:
      /\bxox[baprs]-[A-Za-z0-9-]{20,}\b|https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/_-]+/,
    message: "A Slack credential or webhook was found.",
  },
  {
    rule: "provider-credential",
    pattern: /\b(?:sk-(?:live|proj)-[A-Za-z0-9_-]{16,}|AIza[0-9A-Za-z_-]{30,})\b/,
    message: "A provider API credential was found.",
  },
  {
    rule: "jwt-credential",
    pattern: /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/,
    message: "A JSON Web Token was found.",
  },
  {
    rule: "private-source-metadata",
    pattern: new RegExp(
      `\\b(?:${["source", "commit"].join("\\s+")}\\s+[0-9a-f]{7,40}|${
        ["private", "balance"].join("\\s+")
      })\\b`,
      "i",
    ),
    message: "Private source lineage or internal balance-version metadata was found.",
  },
  {
    rule: "private-implementation-reference",
    pattern: /\b(?:private|internal|authoritative)[_-](?:spec|implementation|source|tool)\b/i,
    message: "A private implementation, specification, or source-file reference was found.",
  },
];

const BLOCKED_CONTENT_PATTERNS: Array<{ rule: string; pattern: RegExp; message: string }> = [
  {
    rule: "operations-surface-content",
    pattern:
      /\b(?:internal operations dashboard|admin[-_](?:shell|dashboard|login|toolbar|kpis?|metrics?))\b/i,
    message: "An internal operations surface remains in executable public content.",
  },
  {
    rule: "excluded-branded-content",
    pattern: /\b(?:nft|token-gated)\b/i,
    message: "Excluded third-party-branded content remains in executable public content.",
  },
];

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\//, "");
}

function extension(path: string): string {
  const name = path.slice(path.lastIndexOf("/") + 1);
  if (name.startsWith(".") && name.indexOf(".", 1) < 0) return "";
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot).toLowerCase();
}

function lineAt(text: string, index: number): number {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (text.charCodeAt(cursor) === 10) line += 1;
  }
  return line;
}

function isExampleEnvironment(path: string): boolean {
  const name = path.slice(path.lastIndexOf("/") + 1).toLowerCase();
  return name === ".env.example" || (name.startsWith(".env.") && name.endsWith(".example"));
}

function isExecutableContent(path: string): boolean {
  if (!/^(?:apps|packages)\//.test(path)) return false;
  return new Set([".css", ".html", ".js", ".json", ".jsx", ".mjs", ".ts", ".tsx"]).has(
    extension(path),
  );
}

function looksLikePlaceholder(value: string): boolean {
  const normalized = value.toLowerCase();
  return [
    "example",
    "placeholder",
    "replace",
    "changeme",
    "change-me",
    "dummy",
    "fake",
    "localhost",
    "127.0.0.1",
    "test-only",
  ].some((marker) => normalized.includes(marker));
}

async function collectFiles(
  root: string,
  directory = root,
  findings: Finding[] = [],
  includeGenerated = false,
): Promise<string[]> {
  const files: string[] = [];
  const entries = [...Deno.readDirSync(directory)].sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const absolute = `${directory}/${entry.name}`;
    const relative = normalizePath(absolute.slice(root.length + 1));
    if (entry.isSymlink) {
      findings.push({
        rule: "symlink",
        path: relative,
        message: "Symbolic links are not permitted in the clean public export.",
      });
      continue;
    }
    if (entry.isDirectory) {
      const skipped = SKIPPED_DIRECTORIES.has(entry.name) &&
        !(includeGenerated && entry.name === "_fresh");
      if (!skipped) {
        files.push(...await collectFiles(root, absolute, findings, includeGenerated));
      }
      continue;
    }
    if (entry.isFile) files.push(relative);
  }

  return files;
}

function addRegexFinding(
  findings: Finding[],
  path: string,
  text: string,
  rule: string,
  pattern: RegExp,
  message: string,
): void {
  pattern.lastIndex = 0;
  const match = pattern.exec(text);
  if (!match) return;
  findings.push({ rule, path, line: lineAt(text, match.index), message });
}

function scanGenericAssignments(findings: Finding[], path: string, text: string): void {
  const credentialAssignment =
    /(?:api[_-]?key|client[_-]?secret|access[_-]?token|auth[_-]?token|password|passwd|private[_-]?key)\s*[:=]\s*["']([^"'\s]{12,})["']/gi;
  for (const match of text.matchAll(credentialAssignment)) {
    const value = match[1];
    if (looksLikePlaceholder(value)) continue;
    findings.push({
      rule: "literal-credential",
      path,
      line: lineAt(text, match.index ?? 0),
      message: "A credential-like field contains a non-placeholder literal value.",
    });
  }

  const operationalId =
    /(?:job|project|service|deployment|environment)[_-]?id\s*[:=]\s*["']?([0-9A-Za-z][0-9A-Za-z_-]{7,})["']?/gi;
  for (const match of text.matchAll(operationalId)) {
    const value = match[1];
    if (looksLikePlaceholder(value) || /^\$\{/.test(value)) continue;
    findings.push({
      rule: "operational-id",
      path,
      line: lineAt(text, match.index ?? 0),
      message: "A deployment, service, project, environment, or job identifier was found.",
    });
  }
}

function scanNetworkDefaults(findings: Finding[], path: string, text: string): void {
  if (!isExecutableContent(path) && path !== ".env.example") return;

  if (isExecutableContent(path)) {
    addRegexFinding(
      findings,
      path,
      text,
      "external-network-literal",
      /(?:\bfetch|\bnew\s+(?:WebSocket|EventSource))\s*\(\s*["'`](?:https?|wss?):\/\/(?!(?:127\.0\.0\.1|localhost)(?=[:/]))/i,
      "Executable public-demo code may not call a literal non-loopback network endpoint.",
    );
  }

  if (extension(path) === ".css") {
    addRegexFinding(
      findings,
      path,
      text,
      "remote-css-asset",
      /(?:@import\s+(?:url\()?|url\()\s*["']?https?:\/\//i,
      "Styles must not load remote fonts or assets by default.",
    );
  }
  addRegexFinding(
    findings,
    path,
    text,
    "remote-html-asset",
    /<(?:iframe|img|script|source)\b[^>]*(?:src|srcset)\s*=\s*["']https?:\/\//i,
    "HTML must not load remote scripts, frames, images, or media by default.",
  );
  addRegexFinding(
    findings,
    path,
    text,
    "remote-html-link",
    /<link\b(?=[^>]*\brel\s*=\s*["'](?:preload|stylesheet)["'])[^>]*\bhref\s*=\s*["']https?:\/\//i,
    "HTML must not load remote styles or preload assets by default.",
  );
}

function scanBrowserCredentials(findings: Finding[], path: string, text: string): void {
  if (!/^apps\/web\/browser\/.*\.(?:js|jsx|ts|tsx)$/.test(path)) return;

  addRegexFinding(
    findings,
    path,
    text,
    "persistent-browser-credential",
    /(?:localStorage\.(?:getItem|setItem)\([\s\S]{0,300}\b(?:sessionToken|authToken|profileCredential)\b|\b(?:sessionToken|authToken|profileCredential)\b[\s\S]{0,300}localStorage\.(?:getItem|setItem)\()/i,
    "Browser session credentials must not be persisted in localStorage.",
  );

  addRegexFinding(
    findings,
    path,
    text,
    "browser-bearer-auth",
    /\bauthorization\s*:\s*`?Bearer\s+\$?\{/i,
    "The local-demo client must not contain a production bearer-auth flow.",
  );
}

function scanMockBoundary(root: string, findings: Finding[]): void {
  const mockPath = "packages/fixtures/src/mock_server.ts";
  const absolute = `${root}/${mockPath}`;
  let text: string;
  try {
    text = Deno.readTextFileSync(absolute);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      findings.push({
        rule: "mock-boundary",
        path: mockPath,
        message: "The sanitized local mock server is required for the public demo.",
      });
      return;
    }
    throw error;
  }

  const directLoopback = /hostname\s*:\s*["']127\.0\.0\.1["']/.test(text);
  const loopbackConstant = /const\s+([A-Z0-9_]*HOST[A-Z0-9_]*)\s*=\s*["']127\.0\.0\.1["']/
    .exec(text);
  const usesLoopbackConstant = loopbackConstant !== null &&
    new RegExp(`hostname\\s*:\\s*${loopbackConstant[1]}\\b`).test(text);
  if (!directLoopback && !usesLoopbackConstant) {
    findings.push({
      rule: "mock-boundary",
      path: mockPath,
      message: 'Deno.serve must set hostname explicitly to "127.0.0.1".',
    });
  }
  if (/hostname\s*:\s*["'](?:0\.0\.0\.0|::|\[::\])["']/.test(text)) {
    findings.push({
      rule: "mock-boundary",
      path: mockPath,
      message: "A wildcard mock-server bind address is forbidden.",
    });
  }
  if (/access-control-allow-origin["']?\s*:\s*["']\*["']/i.test(text)) {
    findings.push({
      rule: "mock-cors",
      path: mockPath,
      message: "The local mock server may not use a wildcard CORS origin.",
    });
  }
}

export async function runPublicationGuard(
  rootInput: string,
  options: { includeGenerated?: boolean } = {},
): Promise<Finding[]> {
  const root = normalizePath(await Deno.realPath(rootInput)).replace(/\/$/, "");
  const findings: Finding[] = [];
  const files = await collectFiles(root, root, findings, options.includeGenerated === true);

  for (const path of files) {
    for (const forbidden of FORBIDDEN_PATHS) {
      if (forbidden.rule === "environment-file" && isExampleEnvironment(path)) continue;
      if (forbidden.pattern.test(path)) {
        findings.push({
          rule: forbidden.rule,
          path,
          message: forbidden.message,
        });
      }
    }

    const fileExtension = extension(path);
    if (!TEXT_EXTENSIONS.has(fileExtension) && !isExampleEnvironment(path)) {
      const generatedClientPrefix = "apps/web/_fresh/client/";
      const generatedClientAsset = options.includeGenerated === true &&
        path.startsWith(generatedClientPrefix) && REVIEWED_BINARY_EXTENSIONS.has(fileExtension);
      if (generatedClientAsset) {
        const relativeAsset = path.slice(generatedClientPrefix.length);
        const sourceAsset = `${root}/apps/web/static/${relativeAsset}`;
        try {
          const generatedBytes = Deno.readFileSync(`${root}/${path}`);
          const sourceBytes = Deno.readFileSync(sourceAsset);
          const equal = generatedBytes.length === sourceBytes.length &&
            generatedBytes.every((value, index) => value === sourceBytes[index]);
          if (!equal) {
            findings.push({
              rule: "generated-binary-mismatch",
              path,
              message: "A generated client asset differs from its manifest-reviewed static source.",
            });
          }
        } catch {
          findings.push({
            rule: "generated-binary-source-missing",
            path,
            message: "A generated client asset has no manifest-reviewed static source.",
          });
        }
      } else if (
        REVIEWED_BINARY_EXTENSIONS.has(fileExtension) && !path.startsWith("apps/web/static/")
      ) {
        findings.push({
          rule: "unmanifested-binary-location",
          path,
          message:
            "Creative binaries must live under apps/web/static and enter the asset manifest.",
        });
      } else if (!REVIEWED_BINARY_EXTENSIONS.has(fileExtension)) {
        findings.push({
          rule: "unreviewed-file-type",
          path,
          message: "This file type is not allowlisted for the curated public export.",
        });
      }
      continue;
    }
    const absolute = `${root}/${path}`;
    let text: string;
    try {
      const bytes = Deno.readFileSync(absolute);
      if (bytes.includes(0)) {
        findings.push({
          rule: "unexpected-binary",
          path,
          message: "A declared text file contains NUL bytes and cannot be safely scanned.",
        });
        continue;
      }
      text = new TextDecoder().decode(bytes);
    } catch (error) {
      findings.push({
        rule: "unreadable-file",
        path,
        message: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    for (const check of PRIVATE_PATH_PATTERNS) {
      if (
        (path === "scripts/publication_guard.ts" ||
          path === "scripts/publication_checks_test.ts") &&
        (check.rule === "private-source-metadata" ||
          check.rule === "private-implementation-reference")
      ) continue;
      addRegexFinding(findings, path, text, check.rule, check.pattern, check.message);
    }
    scanGenericAssignments(findings, path, text);
    scanNetworkDefaults(findings, path, text);
    scanBrowserCredentials(findings, path, text);

    if (isExecutableContent(path)) {
      for (const check of BLOCKED_CONTENT_PATTERNS) {
        addRegexFinding(findings, path, text, check.rule, check.pattern, check.message);
      }
    }
  }

  scanMockBoundary(root, findings);
  return findings.sort((a, b) =>
    a.path.localeCompare(b.path) || (a.line ?? 0) - (b.line ?? 0) || a.rule.localeCompare(b.rule)
  );
}

function renderFinding(finding: Finding): string {
  const location = finding.line ? `${finding.path}:${finding.line}` : finding.path;
  return `::error file=${finding.path}${
    finding.line ? `,line=${finding.line}` : ""
  },title=${finding.rule}::${finding.message}\n  ${location}`;
}

if (import.meta.main) {
  const includeGenerated = Deno.args.includes("--include-generated");
  const root = Deno.args.find((value) => !value.startsWith("--")) ??
    new URL("../", import.meta.url).pathname;
  const findings = await runPublicationGuard(root, { includeGenerated });
  if (findings.length > 0) {
    console.error(`Public-boundary verification failed with ${findings.length} finding(s):`);
    for (const finding of findings) console.error(renderFinding(finding));
    Deno.exit(1);
  }
  console.log("Public-boundary verification passed.");
}
