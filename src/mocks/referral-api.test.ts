import { describe, expect, it } from "vitest";
import { getIntegratorByReferrer, REFERRERS } from "./referral-api";

describe("mock referral API", () => {
  it("resolves a known code to its integrator", async () => {
    await expect(getIntegratorByReferrer("rn-sample-ref")).resolves.toEqual(REFERRERS["rn-sample-ref"]);
  });

  it("returns null for an unknown code", async () => {
    await expect(getIntegratorByReferrer("nope")).resolves.toBeNull();
  });

  it("simulates backend latency", async () => {
    const start = Date.now();
    await getIntegratorByReferrer("rn-sample-ref");
    expect(Date.now() - start).toBeGreaterThanOrEqual(250);
  });
});
