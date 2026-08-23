import { expect, test } from "@playwright/test";
import {
  blockExternalNetwork,
  enterFixture,
  expectNoHorizontalOverflow,
  expectNoRuntimeErrors,
  expectNoStoredCredentials,
  MOCK_ORIGIN,
  monitorRuntimeErrors,
} from "./support.ts";

test("@smoke every declared fixture enters the gameplay field", async ({ page, request }) => {
  const response = await request.get(`${MOCK_ORIGIN}/fixtures`);
  expect(response.ok()).toBeTruthy();
  const fixtures = await response.json() as Array<{ name: string; description: string }>;
  expect(fixtures).toHaveLength(12);
  expect(new Set(fixtures.map((fixture) => fixture.name)).size).toBe(fixtures.length);

  const errors = monitorRuntimeErrors(page);
  await blockExternalNetwork(page, errors);
  for (const fixture of fixtures) {
    await test.step(fixture.name, async () => {
      await enterFixture(page, fixture.name);
      await expect(page.locator("#narrative-mode-view")).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectNoStoredCredentials(page);
    });
  }
  expectNoRuntimeErrors(errors);
});
