export const dynamic = "force-dynamic";

/** Off-chain metadata for the Test EUR mint (wallets read name, symbol and image here). */
export function GET(req: Request) {
  const origin = new URL(req.url).origin;
  return Response.json({
    name: "Test EUR (devnet)",
    symbol: "tEUR",
    description: "Worthless test token for the Keysfirst devnet prototype.",
    image: `${origin}/icon.png`,
  });
}
