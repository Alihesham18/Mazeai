import { expect, test } from "@playwright/test";

test("localized homepages render with expected direction", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { name: "Synergy Maze AI" })).toBeVisible();
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

  const initialTransform = await imageLayer.evaluate(
    (element) => getComputedStyle(element).transform
  );
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
    const mobileNavigation = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(mobileNavigation).toBeVisible();
    await expect(
      mobileNavigation.getByRole("link", { name: "Services", exact: true })
    ).toHaveAttribute("href", "/en/services");
  } else {
    const mainNavigation = page.getByRole("navigation", { name: "Main navigation" });
    await expect(
      mainNavigation.getByRole("link", { name: "Services", exact: true })
    ).toHaveAttribute("href", "/en/services");
  }
});

test("service cards open their dedicated detail pages", async ({ page }) => {
  await page.goto("/en/services");
  await expect(page.getByRole("heading", { name: "Services", level: 1 })).toBeVisible();

  const developmentLink = page.getByRole("link", { name: /Web Development/ });
  await expect(developmentLink).toBeVisible();
  await developmentLink.click();
  await expect(page).toHaveURL(/\/en\/services\/web-development$/);
  await expect(page.getByRole("heading", { name: "Web Development", level: 1 })).toBeVisible();

  await page.goto("/en/services");
  const designLink = page.getByRole("link", { name: /Web Design/ });
  await expect(designLink).toBeVisible();
  await designLink.click();
  await expect(page).toHaveURL(/\/en\/services\/web-design$/);
  await expect(page.getByRole("heading", { name: "Web Design", level: 1 })).toBeVisible();
});

test("school cards link to the official websites", async ({ page }) => {
  await page.goto("/en");

  const schools = page.getByTestId("schools-section");
  await expect(schools.getByRole("heading", { name: "Schools" })).toBeVisible();

  const expectedSchools = [
    ["Doğa Koleji", "https://www.dogakoleji.k12.tr/"],
    ["Mektebim Koleji", "https://www.mektebim.k12.tr/"],
    ["Uğur Okulları", "https://ugurokullari.k12.tr/"]
  ] as const;

  for (const [name, href] of expectedSchools) {
    const schoolLink = schools.getByRole("link", { name: new RegExp(name) });
    await expect(schoolLink).toHaveAttribute("href", href);
    await expect(schoolLink).toHaveAttribute("target", "_blank");
    await expect(schoolLink).toHaveAttribute("rel", "noopener noreferrer");
  }
});
