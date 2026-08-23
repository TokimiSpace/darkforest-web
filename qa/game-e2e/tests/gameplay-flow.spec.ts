import { expect, test } from "@playwright/test";
import {
  blockExternalNetwork,
  enterFixture,
  expectNoRuntimeErrors,
  expectNoStoredCredentials,
  monitorRuntimeErrors,
} from "./support.ts";

test("@smoke combat target runs Preview then Fire without a dead control", async ({ page }) => {
  const errors = monitorRuntimeErrors(page);
  await blockExternalNetwork(page, errors);
  await enterFixture(page, "combatSkirmish");
  await expect(page.locator("#tactical-arena-stage")).toBeVisible();

  const target = page.locator("[data-arena-target]").first();
  await expect(target).toBeVisible();
  await target.click();
  const fire = page.locator("[data-arena-target-fire]");
  await expect(fire).toBeVisible();
  await expect(fire).toHaveAttribute("data-preview-state", "allowed");
  await expect(fire).toBeEnabled();
  await fire.click();
  await expect(page.locator("#tactical-arena-latest")).not.toBeEmpty();
  await expectNoStoredCredentials(page);
  expectNoRuntimeErrors(errors);
});

test("@smoke echo field offers resonance actions but no combat or loot", async ({ page }) => {
  const errors = monitorRuntimeErrors(page);
  await blockExternalNetwork(page, errors);
  await enterFixture(page, "echoMode");
  await expect(page.locator("#tactical-arena-stage")).toBeVisible();

  await expect(page.locator("[data-arena-attune]")).toBeVisible();
  await expect(page.locator("[data-arena-target-fire]")).toHaveCount(0);
  await expect(page.locator("[data-arena-cache-open]")).toHaveCount(0);
  await expect(page.locator("[data-arena-cache-item]")).toHaveCount(0);
  expectNoRuntimeErrors(errors);
});

test("@smoke local fixture shop foregrounds confirmation and restores focus", async ({ page }) => {
  const errors = monitorRuntimeErrors(page);
  await blockExternalNetwork(page, errors);
  await enterFixture(page, "shopVisit");

  const shop = page.locator("[data-arena-shop-open]:visible").first();
  await expect(shop).toBeVisible();
  await shop.click();

  const trade = page.locator('[data-shop-trade="buy"]:not(:disabled)').first();
  await expect(trade).toBeVisible();
  const item = await trade.getAttribute("data-shop-item");
  expect(item).not.toBeNull();
  await trade.click();

  const confirm = page.locator("[data-arena-confirm]");
  const cancel = page.locator("[data-arena-cancel]");
  await expect(confirm).toBeVisible();
  await expect(confirm).toBeInViewport();
  await expect(cancel).toBeVisible();
  await expect(cancel).toBeInViewport();
  await expect(page.locator("#manual-action-drawer")).not.toHaveAttribute("open", "");
  await expect(confirm).toBeFocused();
  for (const control of [confirm, cancel]) {
    const box = await control.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  }

  await page.keyboard.press("Escape");
  await expect(confirm).toHaveCount(0);
  await expect(page.locator("#manual-action-drawer")).toHaveAttribute("open", "");
  const restored = page.locator(
    `[data-shop-trade="buy"][data-shop-item="${item ?? ""}"]`,
  );
  await expect(restored).toBeVisible();
  await expect(restored).toBeFocused();
  expectNoRuntimeErrors(errors);
});

test("@smoke terminal state exposes the ending card but no action gateways", async ({ page }) => {
  const errors = monitorRuntimeErrors(page);
  await blockExternalNetwork(page, errors);
  await enterFixture(page, "finalAllDead");

  await expect(page.locator("#match-view")).toHaveAttribute("data-player-state", "ended", {
    timeout: 8_000,
  });
  await expect(page.locator("#narrative-decision-card")).toBeVisible();
  await expect(page.locator("#mobile-combat-toggle")).toBeHidden();
  await expect(page.locator("#combat-panel")).toBeHidden();
  await expect(page.locator("#manual-action-drawer")).toBeHidden();
  await expect(page.locator("#assist-panel").locator("xpath=..")).toBeHidden();
  await expect(page.locator("[data-arena-target-fire]")).toHaveCount(0);
  expectNoRuntimeErrors(errors);
});
