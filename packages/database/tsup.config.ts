import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: !process.argv.includes("--watch"),
  sourcemap: true,
  external: ["@prisma/client", ".prisma/client"],
});
