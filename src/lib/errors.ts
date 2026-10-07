/** EIP-1193 "User Rejected Request" and the WalletConnect SDK's USER_REJECTED code. */
const USER_REJECTED_CODES = new Set([4001, 5000]);

/**
 * Turns whatever a wallet or the provider threw into a readable message.
 * WalletConnect rejects with plain JSON-RPC error objects (`{ code, message }`), not `Error`s.
 */
export function getErrorMessage(error: unknown): string {
  if (isUserRejection(error)) return "Request rejected in your wallet.";
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (hasMessage(error)) return error.message;
  return "Something went wrong. Please try again.";
}

export function isUserRejection(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code = (error as { code?: unknown }).code;
  if (typeof code === "number" && USER_REJECTED_CODES.has(code)) return true;
  return hasMessage(error) && /user (rejected|denied|cancel)/i.test(error.message);
}

function hasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as { message?: unknown }).message === "string" &&
    (error as { message: string }).message !== ""
  );
}
