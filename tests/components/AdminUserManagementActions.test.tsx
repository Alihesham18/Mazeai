import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import en from "../../messages/en.json";

const { changeRole, refresh, requestPasswordReset } = vi.hoisted(() => ({
  changeRole: vi.fn(),
  refresh: vi.fn(),
  requestPasswordReset: vi.fn()
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/[locale]/admin/users/[userId]/actions", () => ({
  changeAdminUserRoleAction: changeRole,
  requestAdminUserPasswordResetAction: requestPasswordReset
}));

import { AdminUserPasswordResetAction } from "@/components/admin/AdminUsers/AdminUserPasswordResetAction";
import { AdminUserRoleAction } from "@/components/admin/AdminUsers/AdminUserRoleAction";

const userId = "33333333-3333-4333-8333-333333333333";

function Provider({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={en}>
      {children}
    </NextIntlClientProvider>
  );
}

describe("AdminUserRoleAction", () => {
  beforeEach(() => {
    changeRole.mockReset();
    refresh.mockReset();
  });

  it("shows promotion UI for a Website User and an admin-access warning modal", () => {
    render(
      <Provider>
        <AdminUserRoleAction locale="en" userId={userId} currentRole="websiteUser" />
      </Provider>
    );

    expect(screen.getByRole("heading", { name: "Current Role" })).toBeInTheDocument();
    expect(screen.getByText("Website User")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Change Role" }));
    expect(screen.getByRole("dialog", { name: "Promote to Website Admin?" })).toHaveTextContent(
      "This user will gain access to the MazeAI administrative interface and administrative tools."
    );
    expect(screen.getByRole("button", { name: "Promote User" })).toBeInTheDocument();
  });

  it("shows the demotion confirmation for a Website Admin", () => {
    render(
      <Provider>
        <AdminUserRoleAction locale="en" userId={userId} currentRole="websiteAdmin" />
      </Provider>
    );

    expect(screen.getByText("Website Admin")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Change Role" }));
    expect(screen.getByRole("dialog", { name: "Change to Website User?" })).toHaveTextContent(
      "This user will lose access to the MazeAI administrative interface."
    );
  });

  it("promotes using only a normalized role and refreshes after success", async () => {
    changeRole.mockResolvedValue({ state: "updated", role: "websiteAdmin" });
    render(
      <Provider>
        <AdminUserRoleAction locale="en" userId={userId} currentRole="websiteUser" />
      </Provider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Change Role" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Promote User" })
    );

    await waitFor(() => {
      expect(changeRole).toHaveBeenCalledWith({ locale: "en", userId, role: "websiteAdmin" });
      expect(refresh).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "User promoted to Website Admin successfully."
    );
    expect(JSON.stringify(changeRole.mock.calls)).not.toMatch(/11111111-1111/i);
  });

  it("protects the role dialog while a change is pending", async () => {
    let resolveChange!: (value: { state: "updated"; role: "websiteUser" }) => void;
    changeRole.mockReturnValue(
      new Promise((resolve) => {
        resolveChange = resolve;
      })
    );
    render(
      <Provider>
        <AdminUserRoleAction locale="en" userId={userId} currentRole="websiteAdmin" />
      </Provider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Change Role" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Change Role" }));

    await waitFor(() => {
      expect(within(dialog).getByRole("button", { name: "Updating..." })).toBeDisabled();
      expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled();
    });

    resolveChange({ state: "updated", role: "websiteUser" });
    await screen.findByRole("status");
  });

  it.each([
    ["selfTarget", "You cannot demote your own administrator account."],
    ["lastAdmin", "The last active Website Admin cannot be demoted."],
    ["invalidTransition", "This user's current role cannot be changed with this action."],
    ["unavailable", "The user role could not be updated. Please try again."]
  ])("shows a safe localized %s error", async (state, message) => {
    changeRole.mockResolvedValue({ state });
    render(
      <Provider>
        <AdminUserRoleAction locale="en" userId={userId} currentRole="websiteAdmin" />
      </Provider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Change Role" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Change Role" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("AdminUserPasswordResetAction", () => {
  beforeEach(() => requestPasswordReset.mockReset());

  function renderReset() {
    return render(
      <Provider>
        <AdminUserPasswordResetAction locale="en" userId={userId} email="target@example.com" />
      </Provider>
    );
  }

  it("confirms the server-targeted reset email without sending a client email value", async () => {
    requestPasswordReset.mockResolvedValue({ state: "sent" });
    renderReset();

    expect(screen.getByRole("heading", { name: "Send Password Reset" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Send Reset Link" }));
    expect(screen.getByRole("dialog", { name: "Send password reset?" })).toHaveTextContent(
      "A secure password-reset link will be sent to target@example.com."
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Send Reset Link" })
    );

    await waitFor(() => {
      expect(requestPasswordReset).toHaveBeenCalledWith({ locale: "en", userId });
    });
    expect(requestPasswordReset.mock.calls[0][0]).not.toHaveProperty("email");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Password-reset email requested successfully."
    );
  });

  it("disables reset confirmation controls while the request is pending", async () => {
    let resolveReset!: (value: { state: "sent" }) => void;
    requestPasswordReset.mockReturnValue(
      new Promise((resolve) => {
        resolveReset = resolve;
      })
    );
    renderReset();

    fireEvent.click(screen.getByRole("button", { name: "Send Reset Link" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => {
      expect(within(dialog).getByRole("button", { name: "Sending..." })).toBeDisabled();
      expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled();
    });

    resolveReset({ state: "sent" });
    await screen.findByRole("status");
  });

  it("shows a safe localized reset error without backend details", async () => {
    requestPasswordReset.mockResolvedValue({ state: "unavailable" });
    renderReset();

    fireEvent.click(screen.getByRole("button", { name: "Send Reset Link" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Send Reset Link" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The password-reset email could not be requested. Please try again."
    );
    expect(screen.queryByText(/Directus|reset token|FORBIDDEN/i)).not.toBeInTheDocument();
  });
});
