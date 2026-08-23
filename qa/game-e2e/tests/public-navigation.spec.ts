import { expect, test } from "@playwright/test";
import {
  blockExternalNetwork,
  expectNoHorizontalOverflow,
  expectNoRuntimeErrors,
  monitorRuntimeErrors,
} from "./support.ts";

const LOCALES = ["zh-TW", "zh-CN", "en", "ja", "ko", "vi"] as const;
const PRIMARY_LINKS = [
  "/characters",
  "/world",
  "/tutorial",
  "/armory",
  "/leaderboard",
] as const;
const PUBLIC_ROUTES = ["/", "/about", ...PRIMARY_LINKS] as const;

for (const locale of LOCALES) {
  test(`public header and footer keep their roles in ${locale}`, async ({ page }) => {
    const errors = monitorRuntimeErrors(page);
    await blockExternalNetwork(page, errors);
    await page.addInitScript((selectedLocale) => {
      localStorage.setItem("darkforest-locale-v1", selectedLocale);
    }, locale);

    for (const pathname of PUBLIC_ROUTES) {
      await page.goto(pathname, { waitUntil: "domcontentloaded" });
      await expect(page.locator("#locale-select")).toHaveValue(locale);
      await expectNoHorizontalOverflow(page);

      const primary = page.locator("[data-primary-site-nav]");
      await expect(primary).toHaveCount(1);
      const links = primary.locator("a");
      await expect(links).toHaveCount(PRIMARY_LINKS.length);
      expect(await links.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href"))))
        .toEqual([...PRIMARY_LINKS]);

      for (let index = 0; index < PRIMARY_LINKS.length; index += 1) {
        const link = links.nth(index);
        await expect(link).toBeVisible();
        await expect(link).toBeInViewport();
        const box = await link.boundingBox();
        expect(box?.width ?? 0, `${pathname} ${locale} primary link width`).toBeGreaterThanOrEqual(
          44,
        );
        expect(box?.height ?? 0, `${pathname} ${locale} primary link height`)
          .toBeGreaterThanOrEqual(
            44,
          );
        expect(
          await link.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return document.elementFromPoint(
              rect.left + rect.width / 2,
              rect.top + rect.height / 2,
            )?.closest("a") === element;
          }),
          `${pathname} ${locale} primary link should own its visible center`,
        ).toBe(true);
        await expect(link).not.toHaveAttribute("aria-label", /^nav\./);
        await expect(link).not.toHaveAttribute("title", /^nav\./);
      }

      const currentPrimary = primary.locator('[aria-current="page"]');
      if (PRIMARY_LINKS.includes(pathname as typeof PRIMARY_LINKS[number])) {
        await expect(currentPrimary).toHaveCount(1);
        await expect(currentPrimary).toHaveAttribute("href", pathname);
      } else {
        await expect(currentPrimary).toHaveCount(0);
      }

      const footer = page.locator(pathname === "/" ? "footer.lobby-footer" : "footer.site-credit");
      await expect(footer).toHaveCount(1);
      await expect(footer.locator('a[href="/about"]')).toHaveCount(1);
      for (const href of PRIMARY_LINKS) {
        await expect(footer.locator(`a[href="${href}"]`)).toHaveCount(0);
      }
    }

    expectNoRuntimeErrors(errors);
  });
}
