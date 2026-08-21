import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/Section";
import { TechnicalDetail, TechnicalLabel } from "@/components/ui/TechnicalDetail";

describe("MazeAI design-system foundation", () => {
  it("supports native button loading and disabled states", () => {
    render(
      <Button loading loadingLabel="Saving">
        Save changes
      </Button>
    );

    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("makes unavailable link buttons non-interactive", () => {
    const onClick = vi.fn();
    render(
      <Button href="/research" variant="outline" disabled onClick={onClick}>
        Research
      </Button>
    );

    const link = screen.getByRole("link", { name: "Research", hidden: true });
    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).toHaveAttribute("tabindex", "-1");
    fireEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders reusable card, container, and section-heading variants semantically", () => {
    render(
      <Container size="narrow" data-testid="container">
        <SectionHeading
          eyebrow="Research and innovation"
          title="Building intelligent"
          accent="systems"
          description="Advanced research with practical outcomes."
          compact
        />
        <Card variant="technical" interactive>
          Technical card
        </Card>
      </Container>
    );

    expect(screen.getByTestId("container")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Building intelligent systems" })
    ).toBeInTheDocument();
    expect(screen.getByRole("article")).toHaveTextContent("Technical card");
  });

  it("keeps decorative technical details hidden while labels remain readable", () => {
    render(
      <>
        <TechnicalDetail variant="circuit" data-testid="circuit" />
        <TechnicalLabel index="01">Applied intelligence</TechnicalLabel>
      </>
    );

    expect(screen.getByTestId("circuit")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Applied intelligence")).toBeVisible();
  });
});
