import { describe, expect, it } from "vitest";
import { getErrorMessage, isUserRejection } from "./errors";

describe("getErrorMessage", () => {
  it("reads the message from a plain JSON-RPC error object", () => {
    expect(getErrorMessage({ code: -32000, message: "insufficient funds" })).toBe("insufficient funds");
  });

  it("reads Error and string errors", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
    expect(getErrorMessage("boom")).toBe("boom");
  });

  it("never returns [object Object]", () => {
    expect(getErrorMessage({})).toBe("Something went wrong. Please try again.");
    expect(getErrorMessage(undefined)).toBe("Something went wrong. Please try again.");
  });

  it("explains a user rejection", () => {
    expect(getErrorMessage({ code: 5000, message: "User rejected." })).toBe("Request rejected in your wallet.");
    expect(getErrorMessage({ code: 4001, message: "User rejected the request." })).toBe(
      "Request rejected in your wallet.",
    );
  });
});

describe("isUserRejection", () => {
  it("detects rejection codes and messages", () => {
    expect(isUserRejection({ code: 4001 })).toBe(true);
    expect(isUserRejection({ code: 5000 })).toBe(true);
    expect(isUserRejection(new Error("User rejected methods."))).toBe(true);
    expect(isUserRejection({ code: -32000, message: "insufficient funds" })).toBe(false);
    expect(isUserRejection("User rejected")).toBe(false);
  });
});
