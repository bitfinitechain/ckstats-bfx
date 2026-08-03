import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// This repo had no eslint config at all. The `lint` script was switched from
// `next lint` to bare `eslint` when the deployed app was imported, and the old
// .eslintrc went with it — so `pnpm lint` has been exiting 2 with "couldn't find
// eslint.config.js" ever since, which reads like a broken toolchain rather than
// the clean run it was assumed to be. Mirrors the other three app repos.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/**", // Prisma client output — generated, not authored
  ]),
]);

export default eslintConfig;
