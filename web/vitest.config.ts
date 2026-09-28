import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // Date strings are shown in the viewer's time zone; tests pin UTC so they don't depend on the machine.
  test: { include: ["src/**/*.test.ts"], env: { TZ: "UTC" } },
});
