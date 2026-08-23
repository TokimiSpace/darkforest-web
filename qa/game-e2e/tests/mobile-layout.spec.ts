import { expect, test } from "@playwright/test";
import {
  blockExternalNetwork,
  enterFixture,
  expectNoHorizontalOverflow,
  expectNoRuntimeErrors,
  monitorRuntimeErrors,
} from "./support.ts";

const EXPECTED_VIEWPORTS: Readonly<Record<string, { width: number; height: number }>> = {
  "desktop-1440": { width: 1440, height: 900 },
  "desktop-1366": { width: 1366, height: 768 },
  "portrait-390": { width: 390, height: 844 },
  "portrait-360": { width: 360, height: 800 },
  "landscape-844": { width: 844, height: 390 },
  "landscape-667": { width: 667, height: 375 },
};

test(
  "@smoke every supported viewport keeps local gameplay actions usable",
  async ({ page }, info) => {
    expect(page.viewportSize()).toEqual(EXPECTED_VIEWPORTS[info.project.name]);
    const errors = monitorRuntimeErrors(page);
    await blockExternalNetwork(page, errors);
    await enterFixture(page, "combatSkirmish");

    await expectNoHorizontalOverflow(page);
    const field = page.locator("#tactical-arena-stage");
    await expect(field).toBeInViewport();
    const target = page.locator("[data-arena-target]").first();
    await expect(target).toBeVisible();
    await target.click();
    const fire = page.locator("[data-arena-target-fire]");
    await expect(fire).toBeVisible();
    await expect(fire).toBeInViewport();
    const box = await fire.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(40);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(40);
    expectNoRuntimeErrors(errors);
  },
);
