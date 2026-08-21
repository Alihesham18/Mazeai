import { fireEvent, render, screen } from "@testing-library/react";
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
        <LanguageSwitcher locale="en" />
      </NextIntlClientProvider>
    );

    const trigger = screen.getByRole("button", { name: "Language" });
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: /English/ })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("menuitem", { name: /Türkçe/ })).toHaveAttribute(
      "href",
      "/tr/services/ai-consulting"
    );
    expect(screen.getByRole("menuitem", { name: /العربية/ })).toHaveAttribute(
      "href",
      "/ar/services/ai-consulting"
    );
  });
});
