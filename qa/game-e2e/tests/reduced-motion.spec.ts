import { expect, test } from "@playwright/test";
import {
  blockExternalNetwork,
  expectNoRuntimeErrors,
  expectNoStoredCredentials,
  joinFixture,
  monitorRuntimeErrors,
  waitForLobbyRuntime,
} from "./support.ts";

test("reduced-motion preference and local toggle suppress non-essential motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = monitorRuntimeErrors(page);
  await blockExternalNetwork(page, errors);
  await page.goto("/?fixture=combatSkirmish", { waitUntil: "domcontentloaded" });
  await waitForLobbyRuntime(page);

  const mediaDurations = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return [
      style.getPropertyValue("--df-motion-fast").trim(),
      style.getPropertyValue("--df-motion-standard").trim(),
    ];
  });
  expect(mediaDurations).toEqual(["0ms", "0ms"]);

  const toggle = page.locator("#motion-toggle");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("body")).toHaveClass(/\breduce-motion\b/);
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("body")).not.toHaveClass(/\breduce-motion\b/);
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("body")).toHaveClass(/\breduce-motion\b/);

  await joinFixture(page, "combatSkirmish");
  const renderedDuration = await page.locator("#tactical-arena-stage").evaluate((element) =>
    getComputedStyle(element).transitionDuration
  );
  const longestTransitionSeconds = Math.max(
    ...renderedDuration.split(",").map((duration) => Number.parseFloat(duration)),
  );
  expect(longestTransitionSeconds).toBeLessThanOrEqual(0.00001);
  await expectNoStoredCredentials(page);
  expectNoRuntimeErrors(errors);
});
