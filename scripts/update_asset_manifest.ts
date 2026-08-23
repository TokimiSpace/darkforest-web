/**
 * Refresh SHA-256 values for the explicitly approved public asset registry.
 *
 * This script never discovers or approves new files. Additions require a
 * deliberate registry entry and provenance review before the hash can be
 * generated.
 */

interface ApprovedAsset {
  path: string;
  license: "CC-BY-4.0" | "LicenseRef-TokimiSpace-Brand";
  source: string;
}

const BRAND_ASSETS = [
  "favicon.svg",
  "art/brand/darkforest-lockup.svg",
  "art/brand/darkforest-mark.svg",
  "art/brand/darkforest-mask-icon.svg",
] as const;

const CONTENT_ASSETS = [
  "art/icons/items/bandage-v3.svg",
  "art/icons/items/cloth-jacket-v3.svg",
  "art/icons/items/composite-chest-v3.svg",
  "art/icons/items/healthy-food-v3.svg",
  "art/icons/items/insight-calamity-echo-v3.svg",
  "art/icons/items/insight-root-sense-v3.svg",
  "art/icons/items/labor-gloves-v3.svg",
  "art/icons/items/large-backpack-v3.svg",
  "art/icons/items/leather-gloves-v3.svg",
  "art/icons/items/light-ammo-v3.svg",
  "art/icons/items/medkit-v3.svg",
  "art/icons/items/nvg-helmet-v3.svg",
  "art/icons/items/rough-gloves-v3.svg",
  "art/icons/items/scrap-v3.svg",
  "art/icons/items/small-backpack-v3.svg",
  "art/icons/items/spoiled-food-v3.svg",
  "art/icons/items/stab-jacket-v3.svg",
  "art/icons/items/trap-scanner-v3.svg",
  "art/icons/items/work-helmet-v3.svg",
  "art/icons/items/work-pants-v3.svg",
  "art/icons/shoes/soft-sole-v3.svg",
  "art/icons/shoes/steel-toe-v3.svg",
  "art/icons/tags/covered.svg",
  "art/icons/tags/cramped.svg",
  "art/icons/tags/dark.svg",
  "art/icons/tags/debris.svg",
  "art/icons/tags/dense.svg",
  "art/icons/tags/mud.svg",
  "art/icons/tags/open.svg",
  "art/icons/tags/powered.svg",
  "art/icons/tags/wet.svg",
  "art/icons/weapons/cleaver-outline-v3.svg",
  "art/icons/weapons/cleaver-v3.svg",
  "art/icons/weapons/golf-club-outline-v3.svg",
  "art/icons/weapons/golf-club-v3.svg",
  "art/icons/weapons/pistol-outline-v3.svg",
  "art/icons/weapons/pistol-v3.svg",
  "art/icons/weapons/rifle-outline-v3.svg",
  "art/icons/weapons/rifle-v3.svg",
  "art/icons/weapons/stool-outline-v3.svg",
  "art/icons/weapons/stool-v3.svg",
  "art/icons/weapons/tool-outline-v3.svg",
  "art/icons/weapons/tool-v3.svg",
  "art/placeholders/contact.svg",
  "art/placeholders/courier.svg",
  "art/placeholders/enforcer.svg",
  "art/placeholders/event.svg",
  "art/placeholders/reset.svg",
  "art/placeholders/scavenger.svg",
  "art/placeholders/scene.svg",
  "art/placeholders/social-card.png",
  "art/reset/reset-map-fracture.svg",
  "art/reset/reset-reduced-overlay.svg",
] as const;

const APPROVED_ASSETS: ApprovedAsset[] = [
  ...BRAND_ASSETS.map((path) => ({
    path,
    license: "LicenseRef-TokimiSpace-Brand" as const,
    source: "project-authored brand vector; trademark rights reserved",
  })),
  ...CONTENT_ASSETS.map((path) => ({
    path,
    license: "CC-BY-4.0" as const,
    source: path === "art/placeholders/social-card.png"
      ? "project-authored export from docs/assets/social-card-source.svg"
      : path.startsWith("art/placeholders/")
      ? "project-authored code-native public demo placeholder"
      : "project-authored code-native vector",
  })),
].sort((a, b) => a.path.localeCompare(b.path));

async function sha256(path: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await Deno.readFile(path));
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

if (import.meta.main) {
  const staticRoot = new URL("../apps/web/static/", import.meta.url);
  const files = [];
  for (const asset of APPROVED_ASSETS) {
    files.push({
      ...asset,
      sha256: await sha256(new URL(asset.path, staticRoot).pathname),
      status: "approved",
    });
  }
  const manifest = `${JSON.stringify({ schemaVersion: 1, files }, null, 2)}\n`;
  const output = new URL("assets-manifest.json", staticRoot);
  await Deno.writeTextFile(output, manifest);
  console.log(`updated ${output.pathname} (${files.length} approved assets)`);
}
