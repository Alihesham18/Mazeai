import { expect, test } from "@playwright/test";

test("localized homepages render with expected direction", async ({ page }) => {
  await page.goto("/en");
  await expect(
    page.getByRole("heading", { name: "Building intelligent solutions for real challenges." })
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("latest completed event popup opens its localized detail page and stays dismissed", async ({
  page
}) => {
  await page.goto("/en");

  const popup = page.getByLabel("Latest from SynergyMazeAI: Synergy Science 2026");
  await expect(popup).toBeVisible({ timeout: 4_000 });
  await expect(popup.getByRole("link", { name: "Synergy Science 2026" })).toHaveAttribute(
    "href",
    "/en/events/synergy-science-2026"
  );

  await popup.getByRole("button", { name: "Close event update" }).click();
  await expect(popup).toHaveCount(0);
  await page.reload();
  await page.waitForTimeout(1_800);
  await expect(popup).toHaveCount(0);
});

test("interior page background remains inert behind navigation", async ({ page }, testInfo) => {
  await page.goto("/en");
  await expect(page.getByTestId("page-background")).toHaveCount(0);

  await page.goto("/en/services");
  const background = page.getByTestId("page-background");
  await expect(background).toHaveCSS("pointer-events", "none");
  await expect(background).toHaveAttribute("aria-hidden", "true");
  await expect(background).toHaveAttribute("data-variant", "services");

  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    const mobileNavigation = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(mobileNavigation).toBeVisible();
    await mobileNavigation.locator("summary").filter({ hasText: "Services" }).click();
    await expect(
      mobileNavigation.getByRole("link", { name: "Services Overview", exact: true })
    ).toHaveAttribute("href", "/en/services");
  } else {
    const mainNavigation = page.getByRole("navigation", { name: "Main navigation" });
    await mainNavigation.getByRole("button", { name: "Services", exact: true }).click();
    await expect(
      mainNavigation.getByRole("link", { name: "Services Overview", exact: true })
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

test("web development projects open complete case studies", async ({ page }) => {
  await page.goto("/en/services/web-development");

  await expect(page.getByRole("heading", { name: "Selected projects" })).toBeVisible();

  const smartVisionLink = page.getByRole("link", { name: /Smart Vision/ });
  await expect(smartVisionLink).toHaveAttribute(
    "href",
    "/en/services/web-development/smart-vision"
  );
  await smartVisionLink.click();
  await expect(page).toHaveURL(/\/en\/services\/web-development\/smart-vision$/);
  await expect(page.getByRole("heading", { name: "Smart Vision", level: 1 })).toBeVisible();
  const smartVisionImage = page.getByRole("img", { name: "Smart Vision project dashboard" });
  await expect(smartVisionImage).toHaveCSS("object-fit", "contain");
  await expect(page.getByRole("heading", { name: "Technology stack" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Project links" })).toBeVisible();

  await page.goto("/en/services/web-development");
  const nlpAssistLink = page.getByRole("link", { name: /NLP Assist/ });
  await expect(nlpAssistLink).toHaveAttribute("href", "/en/services/web-development/nlp-assist");
  await nlpAssistLink.click();
  await expect(page).toHaveURL(/\/en\/services\/web-development\/nlp-assist$/);
  await expect(page.getByRole("heading", { name: "NLP Assist", level: 1 })).toBeVisible();
  await expect(page.getByRole("img", { name: "NLP Assist project dashboard" })).toHaveCSS(
    "object-fit",
    "contain"
  );
  await expect(page.getByRole("heading", { name: "Quality evidence" })).toBeVisible();
});

test("primary content routes do not render placeholder shells", async ({ page }) => {
  test.setTimeout(90_000);

  for (const path of ["/en/case-studies", "/en/blog", "/en/about/mission-vision", "/en/contact"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).not.toContainText("Sample placeholder content");
    await expect(page.locator("main")).not.toContainText("Included in this page shell");
    await expect(page.locator("main").getByRole("heading", { level: 1 })).toBeVisible();
  }
});
