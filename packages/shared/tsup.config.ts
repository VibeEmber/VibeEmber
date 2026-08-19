import { defineConfig } from "tsup";

const watch = process.argv.includes("--watch");

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  // watch 时跳过 dts：避免重建 .d.ts 与 Nest tsc watch 的竞态（TS7016）
  dts: !watch,
  clean: !watch,
  sourcemap: true,
});
