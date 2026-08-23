import { runPublicationGuard } from "./publication_guard.ts";
import { verifyAssets } from "./verify_assets.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function encodeHex(bytes: Uint8Array): Promise<string> {
  return crypto.subtle.digest("SHA-256", bytes.buffer as ArrayBuffer).then((digest) =>
    [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("")
  );
}

async function makeFixture(): Promise<{ root: string; asset: string; manifest: string }> {
  const root = await Deno.makeTempDir({ prefix: "darkforest-publication-guard-" });
  const mock = `${root}/packages/fixtures/src/mock_server.ts`;
  const asset = `${root}/apps/web/static/art/demo.webp`;
  const manifest = `${root}/apps/web/static/assets-manifest.json`;
  const allowlist = `${root}/scripts/static_root_allowlist.json`;
  await Deno.mkdir(mock.slice(0, mock.lastIndexOf("/")), { recursive: true });
  await Deno.mkdir(asset.slice(0, asset.lastIndexOf("/")), { recursive: true });
  await Deno.mkdir(allowlist.slice(0, allowlist.lastIndexOf("/")), { recursive: true });
  await Deno.writeTextFile(
    mock,
    'Deno.serve({ hostname: "127.0.0.1", port: 8788 }, () => new Response("ok"));\n',
  );
  const bytes = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x57, 0x45, 0x42, 0x50]);
  await Deno.writeFile(asset, bytes);
  await Deno.writeTextFile(
    manifest,
    JSON.stringify({
      schemaVersion: 1,
      files: [{
        path: "art/demo.webp",
        sha256: await encodeHex(bytes),
        license: "CC-BY-4.0",
        status: "approved",
        source: "project-original",
      }],
    }),
  );
  await Deno.writeTextFile(allowlist, JSON.stringify({ schemaVersion: 1, files: [] }));
  return { root, asset, manifest };
}

Deno.test("publication checks accept a minimal loopback-only public fixture", async () => {
  const fixture = await makeFixture();
  try {
    assert(
      (await runPublicationGuard(fixture.root)).length === 0,
      "expected publication guard to pass",
    );
    assert((await verifyAssets(fixture.root)).length === 0, "expected asset verification to pass");
  } finally {
    await Deno.remove(fixture.root, { recursive: true });
  }
});

Deno.test("publication guard rejects literal external calls and wildcard mock binds", async () => {
  const fixture = await makeFixture();
  try {
    await Deno.mkdir(`${fixture.root}/apps/web/browser`, { recursive: true });
    await Deno.writeTextFile(
      `${fixture.root}/apps/web/browser/client.ts`,
      'const socket = new WebSocket("wss://service.example.invalid/ws");\n',
    );
    await Deno.writeTextFile(
      `${fixture.root}/packages/fixtures/src/mock_server.ts`,
      'Deno.serve({ hostname: "0.0.0.0", port: 8788 }, () => new Response("ok"));\n',
    );
    const findings = await runPublicationGuard(fixture.root);
    assert(
      findings.some((finding) => finding.rule === "external-network-literal"),
      "missing external network finding",
    );
    assert(findings.some((finding) => finding.rule === "mock-boundary"), "missing mock finding");
  } finally {
    await Deno.remove(fixture.root, { recursive: true });
  }
});

Deno.test("publication guard can scan generated Fresh output after build", async () => {
  const fixture = await makeFixture();
  try {
    await Deno.mkdir(`${fixture.root}/apps/web/_fresh/client/art`, { recursive: true });
    await Deno.writeTextFile(
      `${fixture.root}/apps/web/_fresh/client/app.js`,
      'const hiddenSurface = "admin-dashboard";\n',
    );
    await Deno.copyFile(fixture.asset, `${fixture.root}/apps/web/_fresh/client/art/demo.webp`);
    assert(
      !(await runPublicationGuard(fixture.root)).some((finding) => finding.path.includes("_fresh")),
      "source scan should skip generated output",
    );
    const findings = await runPublicationGuard(fixture.root, { includeGenerated: true });
    assert(
      findings.some((finding) =>
        finding.path.includes("_fresh") && finding.rule === "operations-surface-content"
      ),
      "generated-output scan must catch blocked bundled content",
    );
    assert(
      !findings.some((finding) => finding.rule.startsWith("generated-binary-")),
      "an exact copy of a reviewed static binary is accepted",
    );
    await Deno.writeFile(
      `${fixture.root}/apps/web/_fresh/client/art/demo.webp`,
      new Uint8Array([1, 2, 3]),
    );
    assert(
      (await runPublicationGuard(fixture.root, { includeGenerated: true })).some((finding) =>
        finding.rule === "generated-binary-mismatch"
      ),
      "changed generated binary must be rejected",
    );
  } finally {
    await Deno.remove(fixture.root, { recursive: true });
  }
});

Deno.test("publication guard rejects private modules, local paths, and credentials", async () => {
  const fixture = await makeFixture();
  try {
    await Deno.mkdir(`${fixture.root}/packages/core`, { recursive: true });
    await Deno.mkdir(`${fixture.root}/apps/web/lib`, { recursive: true });
    await Deno.writeTextFile(
      `${fixture.root}/packages/core/private.ts`,
      "export const hidden = true;\n",
    );
    const token = ["ghp", "A".repeat(36)].join("_");
    const localPath = ["", "Users", "example-user", "private", "source.ts"].join("/");
    await Deno.writeTextFile(
      `${fixture.root}/apps/web/lib/leak.ts`,
      `const access_token = "${token}";\nconst localSource = "${localPath}";\n`,
    );
    const findings = await runPublicationGuard(fixture.root);
    assert(findings.some((finding) => finding.rule === "private-core"), "missing core finding");
    assert(findings.some((finding) => finding.rule === "github-token"), "missing token finding");
    assert(
      findings.some((finding) => finding.rule === "local-absolute-path"),
      "missing absolute path finding",
    );
  } finally {
    await Deno.remove(fixture.root, { recursive: true });
  }
});

Deno.test("publication guard rejects private lineage and internal operations content", async () => {
  const fixture = await makeFixture();
  try {
    await Deno.mkdir(`${fixture.root}/apps/web/browser`, { recursive: true });
    await Deno.writeTextFile(
      `${fixture.root}/apps/web/browser/leak.ts`,
      'const lineage = "source commit abcdef123";\nconst panel = "admin-dashboard";\n',
    );
    const findings = await runPublicationGuard(fixture.root);
    assert(
      findings.some((finding) => finding.rule === "private-source-metadata"),
      "missing private lineage finding",
    );
    assert(
      findings.some((finding) => finding.rule === "operations-surface-content"),
      "missing operations surface finding",
    );
  } finally {
    await Deno.remove(fixture.root, { recursive: true });
  }
});

Deno.test("publication guard rejects nested internal docs, credential configs, archives, and modern GitHub tokens", async () => {
  const fixture = await makeFixture();
  try {
    await Deno.mkdir(`${fixture.root}/docs/archive`, { recursive: true });
    await Deno.writeTextFile(
      `${fixture.root}/docs/archive/internal-context.md`,
      "internal context\n",
    );
    await Deno.writeTextFile(`${fixture.root}/.npmrc`, "//registry.npmjs.org/:_authToken=secret\n");
    await Deno.writeTextFile(`${fixture.root}/private-source.zip`, "not a reviewed archive\n");
    await Deno.writeFile(`${fixture.root}/docs/screenshot.png`, new Uint8Array([1, 2, 3]));
    await Deno.writeTextFile(
      `${fixture.root}/leak.txt`,
      `token=${["github", "pat", "A".repeat(28)].join("_")}\n`,
    );
    const findings = await runPublicationGuard(fixture.root);
    assert(
      findings.some((finding) => finding.rule === "internal-document"),
      "missing nested internal document finding",
    );
    assert(
      findings.some((finding) => finding.rule === "credential-config"),
      "missing credential config finding",
    );
    assert(findings.some((finding) => finding.rule === "archive-file"), "missing archive finding");
    assert(
      findings.some((finding) => finding.rule === "unmanifested-binary-location"),
      "missing out-of-manifest binary finding",
    );
    assert(
      findings.some((finding) => finding.rule === "github-token"),
      "missing modern GitHub token finding",
    );
  } finally {
    await Deno.remove(fixture.root, { recursive: true });
  }
});

Deno.test("publication guard rejects literal external calls and NUL-obscured text", async () => {
  const fixture = await makeFixture();
  try {
    await Deno.mkdir(`${fixture.root}/apps/web/browser`, { recursive: true });
    await Deno.writeTextFile(
      `${fixture.root}/apps/web/browser/network.js`,
      'fetch("https://api.provider.example/data");\n',
    );
    await Deno.writeFile(
      `${fixture.root}/notes.md`,
      new Uint8Array([...new TextEncoder().encode("visible text"), 0, 65]),
    );
    const findings = await runPublicationGuard(fixture.root);
    assert(
      findings.some((finding) => finding.rule === "external-network-literal"),
      "missing external network literal finding",
    );
    assert(
      findings.some((finding) => finding.rule === "unexpected-binary"),
      "missing NUL-obscured text finding",
    );
  } finally {
    await Deno.remove(fixture.root, { recursive: true });
  }
});

Deno.test("publication guard rejects persistent browser bearer sessions", async () => {
  const fixture = await makeFixture();
  try {
    await Deno.mkdir(`${fixture.root}/apps/web/browser`, { recursive: true });
    await Deno.writeTextFile(
      `${fixture.root}/apps/web/browser/profile.js`,
      [
        'const sessionToken = "test-only-placeholder";',
        'localStorage.setItem("profile", JSON.stringify({ sessionToken }));',
        "const headers = { authorization: `Bearer ${sessionToken}` };",
      ].join("\n"),
    );
    const findings = await runPublicationGuard(fixture.root);
    assert(
      findings.some((finding) => finding.rule === "persistent-browser-credential"),
      "missing persistent browser credential finding",
    );
    assert(
      findings.some((finding) => finding.rule === "browser-bearer-auth"),
      "missing bearer auth finding",
    );
  } finally {
    await Deno.remove(fixture.root, { recursive: true });
  }
});

Deno.test("asset verifier rejects changed and unmanifested bytes", async () => {
  const fixture = await makeFixture();
  try {
    await Deno.writeFile(fixture.asset, new Uint8Array([1, 2, 3]));
    await Deno.writeFile(
      `${fixture.root}/apps/web/static/art/unlisted.png`,
      new Uint8Array([4, 5, 6]),
    );
    const findings = await verifyAssets(fixture.root);
    assert(
      findings.some((finding) => finding.rule === "asset-hash-mismatch"),
      "missing hash mismatch finding",
    );
    assert(
      findings.some((finding) => finding.rule === "asset-unmanifested"),
      "missing unmanifested asset finding",
    );
  } finally {
    await Deno.remove(fixture.root, { recursive: true });
  }
});
