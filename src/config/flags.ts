const params = new URLSearchParams(window.location.search);

/**
 * `?terms=0` (or `false`/`off`) skips the Terms of Use step: the modal shows no checkbox
 * and a wallet launch connects right away. Default: the terms must be accepted first.
 */
export const TERMS_STEP_ENABLED = !["0", "false", "off"].includes(params.get("terms")?.toLowerCase() ?? "");
