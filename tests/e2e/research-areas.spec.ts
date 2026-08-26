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
      await expect(image).toHaveCSS("object-fit", "cover");
    }

    const heroMedia = page.getByTestId("hero-media");
    const impactMedia = page.getByTestId("impact-media");
    await expect(heroMedia.locator('svg[data-network="hero"]')).toHaveAttribute(
      "viewBox",
      "0 0 1536 511"
    );
    await expect(heroMedia.locator('svg[data-network="hero"]')).toHaveAttribute(
      "preserveAspectRatio",
      "xMidYMid slice"
    );
    await expect(impactMedia.locator('svg[data-network="impact"]')).toHaveAttribute(
      "viewBox",
      "0 0 1536 510"
    );
    await expect(impactMedia.locator('svg[data-network="impact"]')).toHaveAttribute(
      "preserveAspectRatio",
      "xMidYMid slice"
    );
    await expect(heroMedia).toHaveCSS("border-top-width", "0px");
    await expect(impactMedia).toHaveCSS("border-top-width", "0px");

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
    const heroMedia = page.getByTestId("hero-media");
    const impactMedia = page.getByTestId("impact-media");
    const impactCopy = page.locator("#research-impact-heading").locator("..");
    const heroScrim = heroMedia.locator("div").first();
    const impactScrim = impactMedia.locator("div").first();
    const darkPage = await pageRoot.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    const darkCard = await card.evaluate((element) => getComputedStyle(element).backgroundColor);
    const darkHero = await hero.evaluate((element) => getComputedStyle(element).backgroundColor);
    const darkHeroHeading = await heroHeading.evaluate(
      (element) => getComputedStyle(element).color
    );
    const darkHeroMedia = await heroMedia.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    const darkImpactMedia = await impactMedia.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    const darkHeroScrim = await heroScrim.evaluate(
      (element) => getComputedStyle(element).backgroundImage
    );
    const darkImpactScrim = await impactScrim.evaluate(
      (element) => getComputedStyle(element).backgroundImage
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
    const lightHeroMedia = await heroMedia.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    const lightImpactMedia = await impactMedia.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    const lightHeroScrim = await heroScrim.evaluate(
      (element) => getComputedStyle(element).backgroundImage
    );
    const lightImpactScrim = await impactScrim.evaluate(
      (element) => getComputedStyle(element).backgroundImage
    );
    expect(lightPage).not.toBe(darkPage);
    expect(lightCard).not.toBe(darkCard);
    expect(lightHero).not.toBe(darkHero);
    expect(lightHeroHeading).not.toBe(darkHeroHeading);
    expect(lightHeroMedia).toBe(darkHeroMedia);
    expect(lightImpactMedia).toBe(darkImpactMedia);
    expect(lightHeroScrim).not.toBe(darkHeroScrim);
    expect(lightImpactScrim).not.toBe(darkImpactScrim);
    await expect(impactCopy).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
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
    const mediaBounds = await page.getByTestId("hero-media").boundingBox();
    expect(bounds).not.toBeNull();
    expect(mediaBounds).not.toBeNull();
    await page.mouse.move((bounds?.x ?? 0) + (bounds?.width ?? 0) * 0.72, (bounds?.y ?? 0) + 220);
    await expect(hero).toHaveAttribute("data-pointer-active", "true");
    await expect
      .poll(() => hero.evaluate((element) => element.style.getPropertyValue("--parallax-x")))
      .not.toBe("0px");
    const targetNode = hero.locator('[data-network-node][data-featured="true"]').first();
    const coverScale = Math.max((mediaBounds?.width ?? 0) / 1536, (mediaBounds?.height ?? 0) / 511);
    const cropOffsetX = ((mediaBounds?.width ?? 0) - 1536 * coverScale) / 2;
    const cropOffsetY = ((mediaBounds?.height ?? 0) - 511 * coverScale) / 2;
    await page.mouse.move(
      (mediaBounds?.x ?? 0) + cropOffsetX + 1003 * coverScale,
      (mediaBounds?.y ?? 0) + cropOffsetY + 196 * coverScale
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

  test("uses physical LTR and RTL media placement across every locale", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    for (const { locale, direction } of [
      { locale: "en", direction: "ltr" },
      { locale: "tr", direction: "ltr" },
      { locale: "ar", direction: "rtl" },
      { locale: "fa", direction: "rtl" }
    ] as const) {
      await page.goto(`/${locale}/research/areas`);
      await expect(page.locator("html")).toHaveAttribute("dir", direction);

      const heroCopy = await page.getByRole("heading", { level: 1 }).locator("..").boundingBox();
      const impactCopy = await page
        .locator('section[aria-labelledby="research-impact-heading"] h2')
        .locator("..")
        .boundingBox();
      expect(heroCopy).not.toBeNull();
      expect(impactCopy).not.toBeNull();

      if (direction === "ltr") {
        expect(heroCopy!.x + heroCopy!.width / 2).toBeLessThan(640);
        expect(impactCopy!.x + impactCopy!.width / 2).toBeGreaterThan(640);
      } else {
        expect(heroCopy!.x + heroCopy!.width / 2).toBeGreaterThan(640);
        expect(impactCopy!.x + impactCopy!.width / 2).toBeLessThan(640);
      }
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true);
    }

    await page.setViewportSize({ width: 430, height: 900 });
    await page.goto("/ar/research/areas");
    await expect(page.getByRole("link", { name: "استكشف شراكات البحث" })).toHaveAttribute(
      "href",
      "/ar/research/partnerships"
    );
  });
});
