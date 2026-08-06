import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals.js";
import nextTs from "eslint-config-next/typescript.js";

// eslint-config-next@15.1.x still exports legacy "extends" objects, not flat
// config arrays. Spreading them breaks ESLint; Next still completes the build.
const eslintConfig = defineConfig([
  ...(Array.isArray(nextVitals) ? nextVitals : []),
  ...(Array.isArray(nextTs) ? nextTs : []),
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
