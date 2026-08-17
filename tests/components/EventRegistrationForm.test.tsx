import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-dom", () => ({
  useFormState: vi.fn(() => [{ status: "idle" }, vi.fn()]),
  useFormStatus: vi.fn(() => ({ pending: false }))
}));
vi.mock("@/lib/events/actions", () => ({
  submitEventRegistrationAction: vi.fn()
}));

import { EventRegistrationForm } from "@/components/events/EventRegistrationForm";

const labels = {
  register: "Register",
  phone: "Phone",
  message: "Message",
  registrationSuccessful: "Registration successful",
  alreadyRegistered: "Already registered",
  registrationClosed: "Registration closed",
  eventFull: "Event full",
  invalidPhone: "Invalid phone",
  registrationFailed: "Registration failed",
  sessionExpired: "Session expired"
};

describe("EventRegistrationForm", () => {
  it("sends unauthenticated users to login with a localized safe return path", () => {
    render(
      <EventRegistrationForm
        labels={labels}
        locale="en"
        registrationOpen
        slug="future-of-ai"
        user={null}
      />
    );

    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute(
      "href",
      "/en/login?next=%2Fen%2Fevents%2Ffuture-of-ai%23registration"
    );
  });

  it("shows the closed state instead of a registration link", () => {
    render(
      <EventRegistrationForm
        labels={labels}
        locale="en"
        registrationOpen={false}
        slug="future-of-ai"
        user={null}
      />
    );

    expect(screen.getByText("Registration closed")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Register" })).not.toBeInTheDocument();
  });
});
