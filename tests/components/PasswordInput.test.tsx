import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import { PasswordInput } from "@/components/forms/PasswordInput";

describe("PasswordInput", () => {
  it("toggles visibility without changing the password value or submitting", () => {
    let submissions = 0;

    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <form onSubmit={() => submissions++}>
          <PasswordInput id="password" name="password" defaultValue="secret-value" />
        </form>
      </NextIntlClientProvider>
    );

    const input = screen.getByDisplayValue("secret-value");
    const toggle = screen.getByRole("button", { name: "Show password" });

    expect(input).toHaveAttribute("type", "password");
    expect(toggle).toHaveAttribute("type", "button");

    fireEvent.click(toggle);
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("secret-value");
    expect(screen.getByRole("button", { name: "Hide password" })).toBe(toggle);

    fireEvent.click(toggle);
    expect(input).toHaveAttribute("type", "password");
    expect(submissions).toBe(0);
  });

  it("keeps multiple password fields independent", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <PasswordInput id="password" aria-label="Password" />
        <PasswordInput id="confirm-password" aria-label="Confirm password" />
      </NextIntlClientProvider>
    );

    const [firstToggle] = screen.getAllByRole("button", { name: "Show password" });
    fireEvent.click(firstToggle);

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute("type", "password");
  });
});
