export function shortAddress(address: string): string {
  return address.length > 10 ? `${address.slice(0, 4)}…${address.slice(-2)}` : address;
}

export function formatBps(feeBps: number): string {
  return `${feeBps / 100}%`;
}

export function shortHash(hash: string): string {
  return hash.length > 20 ? `${hash.slice(0, 10)}…${hash.slice(-8)}` : hash;
}
