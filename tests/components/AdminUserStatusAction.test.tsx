import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import en from "../../messages/en.json";

const { changeStatus, refresh } = vi.hoisted(() => ({
  changeStatus: vi.fn(),
  refresh: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh })
}));

vi.mock("@/app/[locale]/admin/users/[userId]/actions", () => ({
  changeAdminUserStatusAction: changeStatus
}));

import { AdminUserStatusAction } from "@/components/admin/AdminUsers/AdminUserStatusAction";
import type { AdminUserStatus } from "@/lib/directus/admin-users";

const userId = "33333333-3333-4333-8333-333333333333";

function renderStatusAction(status: AdminUserStatus | null) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <main data-testid="component-parent">
        <AdminUserStatusAction locale="en" userId={userId} currentStatus={status} />
      </main>
    </NextIntlClientProvider>
  );
}

describe("AdminUserStatusAction", () => {
  beforeEach(() => {
    changeStatus.mockReset();
    refresh.mockReset();
  });

  it("shows the Suspend action and active account copy for an active user", () => {
    renderStatusAction("active");

    expect(screen.getByRole("heading", { name: "Account Status" })).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(
      screen.getByText("This account is active and the user can currently sign in.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Suspend User" })).toBeInTheDocument();
  });

  it("shows the Activate action and suspended account copy for a suspended user", () => {
    renderStatusAction("suspended");

    expect(screen.getByText("Suspended")).toBeInTheDocument();
    expect(
      screen.getByText("This account is suspended and the user cannot currently sign in.")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Activate User" }));
    expect(screen.getByRole("dialog", { name: "Activate this user?" })).toHaveTextContent(
      "This user will regain access to their account and will be able to sign in again."
    );
  });

  it("opens the suspension confirmation in a body portal with accessible copy", () => {
    renderStatusAction("active");

    fireEvent.click(screen.getByRole("button", { name: "Suspend User" }));

    const dialog = screen.getByRole("dialog", { name: "Suspend this user?" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(
      screen.getByText(
        "This user will immediately lose access to their account and will not be able to sign in until an administrator activates the account again."
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId("component-parent")).not.toContainElement(dialog);
    expect(screen.getByRole("button", { name: "Close confirmation" })).toHaveFocus();
  });

  it("closes on Cancel and restores focus to the action button", () => {
    renderStatusAction("active");
    const trigger = screen.getByRole("button", { name: "Suspend User" });

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("keeps keyboard focus inside the confirmation dialog", () => {
    renderStatusAction("active");
    fireEvent.click(screen.getByRole("button", { name: "Suspend User" }));

    const close = screen.getByRole("button", { name: "Close confirmation" });
    const confirm = within(screen.getByRole("dialog")).getByRole("button", {
      name: "Suspend User"
    });
    expect(close).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(confirm).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();
  });

  it("supports Escape and safe overlay-click closing", () => {
    renderStatusAction("active");
    const trigger = screen.getByRole("button", { name: "Suspend User" });

    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog");
    fireEvent.mouseDown(dialog);
    expect(dialog).toBeInTheDocument();
    fireEvent.mouseDown(dialog.parentElement as HTMLElement);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("inherits document-level RTL direction when rendered through the portal", () => {
    document.documentElement.dir = "rtl";
    const view = renderStatusAction("active");

    fireEvent.click(screen.getByRole("button", { name: "Suspend User" }));

    expect(screen.getByRole("dialog").closest('[dir="rtl"]')).toBe(document.documentElement);

    view.unmount();
    document.documentElement.removeAttribute("dir");
  });

  it("submits suspension, reports success, and refreshes the server-rendered state", async () => {
    changeStatus.mockResolvedValue({ state: "updated", status: "suspended" });
    renderStatusAction("active");

    fireEvent.click(screen.getByRole("button", { name: "Suspend User" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Suspend User" })
    );

    await waitFor(() => {
      expect(changeStatus).toHaveBeenCalledWith({
        locale: "en",
        userId,
        status: "suspended"
      });
      expect(refresh).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("status")).toHaveTextContent("User suspended successfully.");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows and protects the loading state while the mutation is pending", async () => {
    changeStatus.mockReturnValue(new Promise(() => undefined));
    renderStatusAction("active");

    fireEvent.click(screen.getByRole("button", { name: "Suspend User" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Suspend User" }));

    await waitFor(() => {
      expect(within(dialog).getByRole("button", { name: "Updating..." })).toBeDisabled();
      expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled();
      expect(within(dialog).getByRole("button", { name: "Close confirmation" })).toBeDisabled();
    });

    fireEvent.keyDown(document, { key: "Escape" });
    expect(dialog).toBeInTheDocument();
  });

  it("reports a localized safe error without exposing backend details", async () => {
    changeStatus.mockRejectedValue(new Error("private Directus response"));
    renderStatusAction("suspended");

    fireEvent.click(screen.getByRole("button", { name: "Activate User" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Activate User" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The user status could not be updated. Please try again."
    );
    expect(screen.queryByText(/private Directus response/i)).not.toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it.each(["invited", "draft", "archived", null] as const)(
    "does not show a status action for unsupported status %s",
    (status) => {
      renderStatusAction(status);

      expect(screen.queryByRole("heading", { name: "Account Status" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /User$/ })).not.toBeInTheDocument();
    }
  );
});
