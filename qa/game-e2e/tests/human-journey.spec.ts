import { expect, test } from "@playwright/test";
import {
  blockExternalNetwork,
  expectNoRuntimeErrors,
  expectNoStoredCredentials,
  joinFixture,
  monitorRuntimeErrors,
  waitForLobbyRuntime,
} from "./support.ts";

test("@smoke a visitor completes the local lobby-to-action human journey", async ({ page }) => {
  const errors = monitorRuntimeErrors(page);
  await blockExternalNetwork(page, errors);
  await page.goto("/?fixture=combatSkirmish", { waitUntil: "domcontentloaded" });
  await waitForLobbyRuntime(page);
  await expect(page.locator("#lobby-view")).toBeVisible();
  await expect(page.locator("#match-view")).toBeHidden();

  await joinFixture(page, "combatSkirmish");
  await expect(page.locator("#tactical-arena-stage")).toBeVisible();
  const options = page.locator("[data-narrative-option]:visible");
  expect(await options.count()).toBeLessThanOrEqual(3);

  const target = page.locator("[data-arena-target]").first();
  await target.click();
  const action = page.locator("[data-arena-target-fire]");
  await expect(action).toHaveAttribute("data-preview-state", "allowed");
  await action.click();
  await expect(page.locator("#tactical-arena-latest")).not.toBeEmpty();
  await expectNoStoredCredentials(page);
  expectNoRuntimeErrors(errors);
});
