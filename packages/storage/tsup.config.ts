import { defineConfig } from "tsup";

const watch = process.argv.includes("--watch");

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: !watch,
  clean: !watch,
  sourcemap: true,
  external: ["@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner"],
});
