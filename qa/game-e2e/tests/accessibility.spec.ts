import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  blockExternalNetwork,
  enterFixture,
  expectNoRuntimeErrors,
  monitorRuntimeErrors,
} from "./support.ts";

test("lobby and gameplay have no critical axe violations", async ({ page }) => {
  const errors = monitorRuntimeErrors(page);
  await blockExternalNetwork(page, errors);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const lobby = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(lobby.violations.filter((violation) => violation.impact === "critical")).toEqual([]);

  await enterFixture(page, "openingMegaCity");
  const gameplay = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(gameplay.violations.filter((violation) => violation.impact === "critical")).toEqual([]);
  expectNoRuntimeErrors(errors);
});
