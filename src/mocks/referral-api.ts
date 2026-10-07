/**
 * Mock of the app's partner-program backend.
 *
 * Mimics `GET /referrers/integrator?referrer=<code>`: given a referral code,
 * returns the integrator that should receive the fee, or null if the code is unknown.
 *
 * Edit REFERRERS to add or change codes.
 */

export type Integrator = {
  integratorAddress: string;
  /** Fee in basis points (50 = 0.5%). */
  feeBps: number;
};

export const REFERRERS: Record<string, Integrator> = {
  "rn-sample-ref": {
    integratorAddress: "0x704457b418E9Fb723e1Bc0cB98106a6B8Cf87689",
    feeBps: 50,
  },
};

export const MOCK_LATENCY_MS = 300;

export async function getIntegratorByReferrer(referrer: string): Promise<Integrator | null> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  const integrator = REFERRERS[referrer];
  return integrator ? { ...integrator } : null;
}
