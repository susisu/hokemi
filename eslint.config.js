import { config } from "@susisu/eslint-config";
import vitestPlugin from "eslint-plugin-vitest";
import globals from "globals";

export default config({}, [
  {
    plugins: {
      vitest: vitestPlugin,
    },
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.es2021,
        ...globals.node,
      },
    },
  },
  {
    files: ["src/**/*.spec.ts", "src/**/__tests__/**/*.ts"],
    rules: {
      ...vitestPlugin.configs.recommended.rules,
      "vitest/expect-expect": ["error", { assertFunctionNames: ["expect", "assertType"] }],
    },
  },
  {
    files: ["*.js"],
    languageOptions: {
      globals: {
        ...globals.es2021,
        ...globals.node,
      },
    },
  },
]);
