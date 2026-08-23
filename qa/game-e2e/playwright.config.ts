import { defineConfig, type Project } from "@playwright/test";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const webRoot = fileURLToPath(new URL("../../apps/web/", import.meta.url));
const baseURL = process.env.DARKFOREST_QA_BASE_URL ?? "http://127.0.0.1:8000";
const requiredOrigin = "http://127.0.0.1:8000";
const useBundledChromium = process.env.CI === "true" ||
  process.env.DARKFOREST_QA_BROWSER === "chromium";
const browserUse = useBundledChromium ? {} : { channel: "chrome" as const };

if (new URL(baseURL).origin !== requiredOrigin) {
  throw new Error(`DARKFOREST_QA_BASE_URL must be ${requiredOrigin}, received: ${baseURL}`);
}

const layoutOnly = /mobile-layout\.spec\.ts/;
const layoutProject = (
  name: string,
  width: number,
  height: number,
  mobile = false,
): Project => ({
  name,
  testMatch: layoutOnly,
  use: {
    ...browserUse,
    viewport: { width, height },
    hasTouch: mobile,
    isMobile: mobile,
  },
});

export default defineConfig({
  testDir: "./tests",
  outputDir: "./output/test-results",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI === "true" ? 1 : 0,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "./output/report", open: "never" }],
  ],
  use: {
    baseURL,
    locale: "zh-TW",
    reducedMotion: "no-preference",
    serviceWorkers: "block",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: "deno task mock",
      cwd: repoRoot,
      url: "http://127.0.0.1:8788/healthz",
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command:
        "deno run --allow-read=. --allow-env=PORT,PUBLIC_SITE_URL,SEO_INDEXABLE,SHOW_DEV_CONTROLS,FEEDBACK_URL,DENO_DEPLOYMENT_ID,GITHUB_SHA,CI_COMMIT_SHA,CI,FRESH_NO_UPDATE_CHECK --allow-net=127.0.0.1:8000,localhost:8000 main.ts",
      cwd: webRoot,
      url: baseURL,
      reuseExistingServer: false,
      timeout: 45_000,
      env: {
        PORT: "8000",
        SHOW_DEV_CONTROLS: "1",
        SEO_INDEXABLE: "false",
        FRESH_NO_UPDATE_CHECK: "true",
      },
    },
  ],
  projects: [
    {
      name: "desktop-1440",
      use: {
        ...browserUse,
        viewport: { width: 1440, height: 900 },
      },
    },
    layoutProject("desktop-1366", 1366, 768),
    layoutProject("portrait-390", 390, 844, true),
    layoutProject("portrait-360", 360, 800, true),
    layoutProject("landscape-844", 844, 390, true),
    layoutProject("landscape-667", 667, 375, true),
  ],
});
