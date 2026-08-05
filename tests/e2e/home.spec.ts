import { expect, test } from "@playwright/test";

test("localized homepages render with expected direction", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { name: /Building the future/i })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("interactive background remains inert behind navigation", async ({ page }, testInfo) => {
  await page.goto("/en");

  const background = page.getByTestId("interactive-background");
  const imageLayer = page.getByTestId("background-image-layer");
  await expect(background).toHaveCSS("pointer-events", "none");
  await expect(background.locator("canvas")).toHaveCount(1);

  const initialTransform = await imageLayer.evaluate((element) => getComputedStyle(element).transform);
  if (testInfo.project.name === "mobile") {
    await page.evaluate(() => window.scrollTo(0, 500));
  } else {
    await page.mouse.move(900, 260);
  }
  await expect
    .poll(() => imageLayer.evaluate((element) => getComputedStyle(element).transform))
    .not.toBe(initialTransform);

  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  } else {
    await page.getByRole("button", { name: "Services" }).click();
    await expect(page.getByRole("button", { name: "Services" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  }
});
