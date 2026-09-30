import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Existing copy is preserved during tooling maintenance; keep findings visible.
  {
    files: ["app/app/offer-stack/page.tsx", "app/app/value-bridge/page.tsx"],
    rules: { "react/no-unescaped-entities": "warn" },
  },
  // Preserve the existing localStorage hydration flow; review separately.
  {
    files: ["app/app/situation-analyzer.tsx"],
    rules: { "react-hooks/set-state-in-effect": "warn" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
