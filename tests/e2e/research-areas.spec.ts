import { expect, test } from "@playwright/test";

test.describe("Research Areas redesign", () => {
  test("loads supplied media and remains overflow-free across target widths", async ({
    page
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "Viewport matrix runs once in desktop Chromium"
    );
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.goto("/en/research/areas");
    const images = page.getByRole("img");
    await expect(images).toHaveCount(2);
    for (const image of await images.all()) {
      await expect(image).toHaveJSProperty("complete", true);
      expect(
        await image.evaluate((element: HTMLImageElement) => element.naturalWidth)
      ).toBeGreaterThan(0);
    }

    for (const width of [1440, 1280, 1024, 768, 430, 390, 375]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true);
    }

    expect(consoleErrors).toEqual([]);
  });

  test("uses the accessible accordion on narrow screens", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/research/areas");
    const accordion = page.getByTestId("research-area-accordion");
    await expect(accordion).toBeVisible();
    const first = accordion.getByRole("button", { name: "Machine Learning" });
    const second = accordion.getByRole("button", { name: "Computer Vision" });
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await second.focus();
    await second.press("Enter");
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await expect(second).toHaveAttribute("aria-expanded", "true");
    const hero = page
      .getByRole("heading", { level: 1, name: "Research Areas" })
      .locator("xpath=ancestor::section[1]");
    await expect(hero).not.toHaveAttribute("data-pointer-active", "true");
    await expect(hero.locator("[data-network-node]").first().locator("..")).not.toHaveCSS(
      "animation-name",
      "none"
    );
  });

  test("adapts content surfaces to the existing light theme while image panels stay dark", async ({
    page
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Theme surface comparison runs once");
    await page.addInitScript(() => localStorage.setItem("synergymazeai-theme", "dark"));
    await page.goto("/en/research/areas");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const pageRoot = page.locator("main > div").first();
    const card = page.getByTestId("research-area-grid").locator("article").first();
    const hero = page
      .getByRole("heading", { level: 1, name: "Research Areas" })
      .locator("xpath=ancestor::section[1]");
    const heroHeading = hero.getByRole("heading", { level: 1, name: "Research Areas" });
    const darkPage = await pageRoot.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    const darkCard = await card.evaluate((element) => getComputedStyle(element).backgroundColor);
    const darkHero = await hero.evaluate((element) => getComputedStyle(element).backgroundColor);
    const darkHeroHeading = await heroHeading.evaluate(
      (element) => getComputedStyle(element).color
    );

    await page.getByRole("button", { name: "Toggle color theme" }).first().click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.waitForTimeout(350);
    const lightPage = await pageRoot.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    const lightCard = await card.evaluate((element) => getComputedStyle(element).backgroundColor);
    const lightHero = await hero.evaluate((element) => getComputedStyle(element).backgroundColor);
    const lightHeroHeading = await heroHeading.evaluate(
      (element) => getComputedStyle(element).color
    );
    expect(lightPage).not.toBe(darkPage);
    expect(lightCard).not.toBe(darkCard);
    expect(lightHero).toBe(darkHero);
    expect(lightHeroHeading).toBe(darkHeroHeading);
    expect(lightHeroHeading).toBe("rgb(245, 241, 232)");
  });

  test("keeps pointer illumination local and respects reduced motion", async ({
    page
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "Fine-pointer behavior runs in desktop Chromium"
    );
    await page.goto("/en/research/areas");
    const hero = page
      .getByRole("heading", { level: 1, name: "Research Areas" })
      .locator("xpath=ancestor::section[1]");
    const bounds = await hero.boundingBox();
    expect(bounds).not.toBeNull();
    await page.mouse.move((bounds?.x ?? 0) + (bounds?.width ?? 0) * 0.72, (bounds?.y ?? 0) + 220);
    await expect(hero).toHaveAttribute("data-pointer-active", "true");
    await expect
      .poll(() => hero.evaluate((element) => element.style.getPropertyValue("--parallax-x")))
      .not.toBe("0px");
    const targetNode = hero.locator("[data-network-node]").nth(2);
    await page.mouse.move(
      (bounds?.x ?? 0) + (bounds?.width ?? 0) * 0.676,
      (bounds?.y ?? 0) + (bounds?.height ?? 0) * 0.218
    );
    await expect
      .poll(() =>
        targetNode.evaluate((node) => Number(node.style.getPropertyValue("--node-proximity")))
      )
      .toBeGreaterThan(0.45);
    const influencedNodes = await hero
      .locator("[data-network-node]")
      .evaluateAll(
        (nodes) =>
          nodes.filter(
            (node) =>
              Number((node as SVGCircleElement).style.getPropertyValue("--node-proximity")) > 0.1
          ).length
      );
    expect(influencedNodes).toBeGreaterThan(0);
    expect(influencedNodes).toBeLessThan(14);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    const reducedHero = page
      .getByRole("heading", { level: 1, name: "Research Areas" })
      .locator("xpath=ancestor::section[1]");
    await page.mouse.move(900, 300);
    await expect(reducedHero).not.toHaveAttribute("data-pointer-active", "true");
    const brainLayer = page.getByRole("img", { name: /neural network/i }).locator("..");
    await expect(brainLayer).toHaveCSS("animation-name", "none");
    await expect(reducedHero.locator("[data-network-node]").first()).toHaveCSS("transform", "none");
    await expect(reducedHero.locator("[data-network-node]").first().locator("..")).toHaveCSS(
      "animation-name",
      "none"
    );
  });

  test("preserves RTL composition and localized routes", async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 900 });
    await page.goto("/ar/research/areas");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("link", { name: "استكشف شراكات البحث" })).toHaveAttribute(
      "href",
      "/ar/research/partnerships"
    );
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
  });
});
