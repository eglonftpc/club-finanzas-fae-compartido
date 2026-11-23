/** Safe for client components — only public env. */
export function getProviderName(): string {
  return (
    process.env.NEXT_PUBLIC_MARKET_DATA_PROVIDER ||
    process.env.MARKET_DATA_PROVIDER ||
    "mock"
  ).toLowerCase();
}
