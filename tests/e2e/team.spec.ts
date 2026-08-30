import { expect, test } from "@playwright/test";

const localeExpectations = {
  en: { direction: "ltr", heading: "The Minds Behind MazeAI" },
  tr: { direction: "ltr", heading: "MazeAI'ın Arkasındaki Zihinler" },
  ar: { direction: "rtl", heading: "العقول وراء MazeAI" },
  fa: { direction: "rtl", heading: "ذهن‌های پشت MazeAI" }
} as const;

test("renders only the two verified profiles with safe external links", async ({ page }) => {
  await page.goto("/en/about/team");
  const grid = page.getByTestId("team-grid");
  await expect(grid.getByRole("article")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "Mahyar Teymournezhad" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Prof. Dr. Özgür Koray Şahingöz" })).toBeVisible();
  await expect(page.getByText("Founder & CEO", { exact: true })).toBeVisible();
  await expect(page.getByText("Academic Advisor", { exact: true })).toBeVisible();
  await expect(page.getByRole("img")).toHaveCount(2);

  const mahyar = page.getByRole("link", { name: "View Mahyar Teymournezhad on LinkedIn" });
  await expect(mahyar).toHaveAttribute("href", "https://www.linkedin.com/in/mahyarteymournezhad");
  await expect(mahyar).toHaveAttribute("target", "_blank");
  await expect(mahyar).toHaveAttribute("rel", "noopener noreferrer");

  const ozgur = page.getByRole("link", {
    name: "View Prof. Dr. Özgür Koray Şahingöz on LinkedIn"
  });
  await expect(ozgur).toHaveAttribute("href", "https://www.linkedin.com/in/sahingoz");
  await expect(page.locator("main")).not.toContainText(/placeholder|profile slot/i);
});

test("supports every locale and theme combination", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "The full matrix runs once in Chromium");

  for (const [locale, expectation] of Object.entries(localeExpectations)) {
    for (const theme of ["dark", "light"] as const) {
      await page.addInitScript((selectedTheme) => {
        localStorage.setItem("synergymazeai-theme", selectedTheme);
      }, theme);
      await page.goto(`/${locale}/about/team`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("html")).toHaveAttribute("dir", expectation.direction);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(expectation.heading);
      await expect(page.getByTestId("team-grid").getByRole("article")).toHaveCount(2);
    }
  }
});

test("stays overflow-free at every target width and preserves portraits in RTL", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "The viewport matrix runs once in Chromium");
  await page.goto("/ar/about/team");

  for (const width of [375, 430, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    await expect(page.getByTestId("team-grid").getByRole("article").first()).toBeVisible();
  }

  for (const image of await page.getByRole("img").all()) {
    await expect(image).toHaveCSS("transform", "none");
    await expect(image).toHaveJSProperty("complete", true);
  }
});

test("respects reduced motion and survives a live theme switch", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop theme control is tested in Chromium");
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("/en/about/team");
  const card = page.getByTestId("team-grid").getByRole("article").first();
  await expect(card).toHaveCSS("animation-name", "none");
  await page.getByRole("button", { name: "Toggle color theme" }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(card).toBeVisible();
});
