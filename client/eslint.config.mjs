import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
// Turns off ESLint formatting rules that would fight Prettier (must come last).
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  // Correctness rules promoted to errors so the pre-commit hook actually blocks
  // real mistakes (Next's defaults ship most of these as warnings, which don't
  // fail lint). Prefix an intentionally-unused binding with `_` to allow it.
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "no-const-assign": "error",
      "no-debugger": "error",
      "no-var": "error",
      "prefer-const": "error",
      // Pragmatic escape hatch used deliberately in a few low-level spots
      // (httpClient, generic helpers); matches the API's config. Advisory only.
      "@typescript-eslint/no-explicit-any": "warn",

      // React Compiler advisories (from eslint-config-next): they flag common,
      // working patterns this codebase relies on (setState in a data-fetch
      // effect, the `keyRef.current = key` idiom, Date.now() seeds, RHF watch()).
      // Keep them as warnings — informative, but they must not block commits.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/incompatible-library": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
