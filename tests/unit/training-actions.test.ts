import { beforeEach, describe, expect, it, vi } from "vitest";

const { createApplication, getProgram, revalidatePath } = vi.hoisted(() => ({
  createApplication: vi.fn(),
  getProgram: vi.fn(),
  revalidatePath: vi.fn()
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/directus/training", () => ({
  createCurrentUserTrainingApplication: createApplication,
  getPublishedTrainingProgramBySlug: getProgram
}));

import { submitTrainingApplicationAction } from "@/lib/training/actions";

const initialTrainingApplicationState = { status: "idle" } as const;

function form(phone = "+90 552 507 38 89", message = "Interested") {
  const data = new FormData();
  data.set("phone", phone);
  data.set("message", message);
  return data;
}

describe("training application action", () => {
  beforeEach(() => {
    createApplication.mockReset();
    getProgram.mockReset();
    revalidatePath.mockReset();
  });

  it("exports only async server actions at runtime", async () => {
    const actions = await import("@/lib/training/actions");

    expect(Object.keys(actions)).toEqual(["submitTrainingApplicationAction"]);
    expect(actions.submitTrainingApplicationAction.constructor.name).toBe("AsyncFunction");
  });

  it("rejects a closed program before application creation", async () => {
    getProgram.mockResolvedValueOnce({
      ok: true,
      data: { id: "program-1", application_open: false }
    });

    await expect(
      submitTrainingApplicationAction(
        "en",
        "cybersecurity",
        initialTrainingApplicationState,
        form()
      )
    ).resolves.toEqual({ status: "error", message: "applicationClosed" });
    expect(createApplication).not.toHaveBeenCalled();
  });

  it("resolves the slug and submits split phone fields", async () => {
    getProgram.mockResolvedValueOnce({
      ok: true,
      data: { id: "program-1", application_open: true }
    });
    createApplication.mockResolvedValueOnce({ ok: true });

    await expect(
      submitTrainingApplicationAction(
        "en",
        "cybersecurity",
        initialTrainingApplicationState,
        form()
      )
    ).resolves.toEqual({ status: "success", message: "applicationSubmitted" });
    expect(getProgram).toHaveBeenCalledWith("cybersecurity");
    expect(createApplication).toHaveBeenCalledWith({
      programId: "program-1",
      phoneCountryCode: "+90",
      phoneNumber: "5525073889",
      message: "Interested"
    });
  });

  it("reports an existing application without creating another row", async () => {
    getProgram.mockResolvedValueOnce({
      ok: true,
      data: { id: "program-1", application_open: true }
    });
    createApplication.mockResolvedValueOnce({ ok: false, error: "alreadyApplied" });

    await expect(
      submitTrainingApplicationAction(
        "tr",
        "cybersecurity",
        initialTrainingApplicationState,
        form()
      )
    ).resolves.toEqual({ status: "error", message: "alreadyApplied" });
  });
});
