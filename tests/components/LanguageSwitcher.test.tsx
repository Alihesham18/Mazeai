import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import { LanguageSwitcher } from "@/components/navigation/LanguageSwitcher";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/services/ai-consulting"
}));

describe("LanguageSwitcher", () => {
  it("preserves the current path when switching locales", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <LanguageSwitcher locale="en" label="Language" />
      </NextIntlClientProvider>
    );

    expect(screen.getByRole("link", { name: "TR" })).toHaveAttribute(
      "href",
      "/tr/services/ai-consulting"
    );
    expect(screen.getByRole("link", { name: "AR" })).toHaveAttribute(
      "href",
      "/ar/services/ai-consulting"
    );
  });
});
