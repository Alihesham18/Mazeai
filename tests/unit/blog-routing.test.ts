import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Blog routing cleanup", () => {
  it("uses one dynamic detail route and has removed obsolete static article routes", () => {
    expect(existsSync(resolve("src/app/[locale]/blog/[slug]/page.tsx"))).toBe(true);
    for (const slug of [
      "responsible-ai-starting-points",
      "from-research-to-prototype",
      "ai-literacy-for-organizations"
    ]) {
      expect(existsSync(resolve(`src/app/[locale]/blog/${slug}/page.tsx`))).toBe(false);
    }
  });
});
