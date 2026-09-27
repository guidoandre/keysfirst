// Creates the "Test EUR (devnet)" Token-2022 mint with on-chain name and symbol.
// Usage (from web/): node scripts/create-test-eur.mjs https://your-app.vercel.app
// Devnet only. The faucet key is stored in web/.keys/faucet.json and never printed.
import fs from "node:fs";
import path from "node:path";
import {
  Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  ExtensionType, LENGTH_SIZE, TOKEN_2022_PROGRAM_ID, TYPE_SIZE,
  createInitializeMetadataPointerInstruction, createInitializeMintInstruction, getMintLen,
} from "@solana/spl-token";
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata";

const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";
const appUrl = process.argv[2]?.replace(/\/$/, "");
if (!appUrl?.startsWith("https://")) {
  console.error("Usage: node scripts/create-test-eur.mjs https://your-app.vercel.app");
  process.exit(1);
}

const keyPath = path.resolve(".keys", "faucet.json");
function loadOrCreateFaucet() {
  if (fs.existsSync(keyPath)) {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(keyPath, "utf8"))));
  }
  const keypair = Keypair.generate();
  fs.mkdirSync(path.dirname(keyPath), { recursive: true });
  fs.writeFileSync(keyPath, JSON.stringify(Array.from(keypair.secretKey)));
  return keypair;
}

function upsertEnv(file, values) {
  const lines = fs.existsSync(file) ? fs.readFileSync(file, "utf8").split(/\r?\n/) : [];
  const kept = lines.filter((line) => line && !Object.keys(values).some((key) => line.startsWith(`${key}=`)));
  const added = Object.entries(values).map(([key, value]) => `${key}=${value}`);
  fs.writeFileSync(file, [...kept, ...added].join("\n") + "\n");
}

const connection = new Connection(RPC_URL, "confirmed");
const faucet = loadOrCreateFaucet();
console.log(`Faucet wallet: ${faucet.publicKey.toBase58()}`);

const balance = await connection.getBalance(faucet.publicKey);
if (balance < LAMPORTS_PER_SOL) {
  console.log(`It holds ${balance / LAMPORTS_PER_SOL} SOL. Send it at least 1 devnet SOL (https://faucet.solana.com), then run this again.`);
  process.exit(1);
}

const mint = Keypair.generate();
const metadata = {
  mint: mint.publicKey,
  name: "Test EUR (devnet)",
  symbol: "tEUR",
  uri: `${appUrl}/test-eur.json`,
  additionalMetadata: [],
};
const mintLen = getMintLen([ExtensionType.MetadataPointer]);
const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

const tx = new Transaction().add(
  SystemProgram.createAccount({
    fromPubkey: faucet.publicKey,
    newAccountPubkey: mint.publicKey,
    space: mintLen,
    lamports,
    programId: TOKEN_2022_PROGRAM_ID,
  }),
  createInitializeMetadataPointerInstruction(mint.publicKey, faucet.publicKey, mint.publicKey, TOKEN_2022_PROGRAM_ID),
  createInitializeMintInstruction(mint.publicKey, 6, faucet.publicKey, null, TOKEN_2022_PROGRAM_ID),
  createInitializeInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    metadata: mint.publicKey,
    updateAuthority: faucet.publicKey,
    mint: mint.publicKey,
    mintAuthority: faucet.publicKey,
    name: metadata.name,
    symbol: metadata.symbol,
    uri: metadata.uri,
  }),
);
const signature = await sendAndConfirmTransaction(connection, tx, [faucet, mint]);

console.log(`Test EUR mint: ${mint.publicKey.toBase58()}`);
console.log(`Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
upsertEnv(path.resolve(".env.local"), {
  NEXT_PUBLIC_MINT: mint.publicKey.toBase58(),
  FAUCET_SECRET_KEY: JSON.stringify(Array.from(faucet.secretKey)),
});
console.log("Saved NEXT_PUBLIC_MINT and FAUCET_SECRET_KEY to web/.env.local (the secret is not printed).");
