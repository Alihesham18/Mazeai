import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileSummary } from "@/components/account/ProfileSummary";
import { profileInitials } from "@/lib/utilities/profile";

const labels = {
  activeAccount: "Active Account",
  accountInformation: "Account Information",
  accountNumber: "Account Number",
  accountNumberPending: "Account number pending"
};

describe("ProfileSummary", () => {
  it("generates initials from authenticated profile data", () => {
    expect(profileInitials("Ali", "Hesham", "ali@example.com")).toBe("AH");
    expect(profileInitials("", "", "ali@example.com")).toBe("A");
  });

  it("displays the permanent account number as non-editable LTR text", () => {
    const { container } = render(
      <ProfileSummary
        profile={{
          id: "user-1",
          email: "ali@example.com",
          firstName: "Ali",
          lastName: "Hesham",
          fullName: "Ali Hesham",
          telephone: "+905525073889",
          status: "active"
        }}
        accountNumber="SMA-2026-000001"
        labels={labels}
      />
    );

    expect(screen.getByText("AH")).toBeInTheDocument();
    expect(screen.getByText("Ali Hesham")).toBeInTheDocument();
    expect(screen.getByText("Active Account")).toBeInTheDocument();
    expect(screen.getByText("SMA-2026-000001")).toHaveAttribute("dir", "ltr");
    expect(container.querySelector("code")).toHaveTextContent("SMA-2026-000001");
    expect(screen.queryByRole("textbox", { name: /Account Number/i })).not.toBeInTheDocument();
  });

  it("does not invent an active status", () => {
    render(
      <ProfileSummary
        profile={{
          id: "user-1",
          email: "ali@example.com",
          firstName: "Ali",
          lastName: "Hesham",
          fullName: "Ali Hesham",
          telephone: "+905525073889",
          status: "suspended"
        }}
        accountNumber={null}
        labels={labels}
      />
    );

    expect(screen.queryByText("Active Account")).not.toBeInTheDocument();
    expect(screen.getByText("Account number pending")).toBeInTheDocument();
  });
});
