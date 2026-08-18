import prettier from "eslint-config-prettier";
import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  prettier,
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
