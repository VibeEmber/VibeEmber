import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts"],
  format: ["esm"],
  target: "node24",
  platform: "node",
  clean: true,
  sourcemap: true,
  external: ["pg-boss", "qrcode", "sharp", "@vibeember/database", "@vibeember/storage"],
});
