"use strict";

const { config, map } = require("@susisu/eslint-config");
const prettierConfig = require("eslint-config-prettier");
const vitestPlugin = require("eslint-plugin-vitest");
const globals = require("globals");

module.exports = [
  ...map({ files: ["src/**/*.ts"] }, [
    config.tsTypeChecked(),
    {
      languageOptions: {
        sourceType: "module",
        parserOptions: {
          project: "./tsconfig.json",
        },
        globals: {
          ...globals.es2021,
          ...globals.node,
        },
      },
    },
  ]),
  ...map({ files: ["src/**/*.spec.ts", "src/**/__tests__/**/*.ts"] }, [
    {
      plugins: {
        vitest: vitestPlugin,
      },
      languageOptions: {
        globals: {
          ...vitestPlugin.environments.env.globals,
        },
      },
      rules: {
        ...vitestPlugin.configs.recommended.rules,
        "vitest/expect-expect": ["error", { customExpressions: ["expect", "assertType"] }],
      },
    },
  ]),
  ...map({ files: ["*.js"] }, [
    config.js(),
    {
      languageOptions: {
        sourceType: "commonjs",
        globals: {
          ...globals.es2021,
          ...globals.node,
        },
      },
    },
  ]),
  prettierConfig,
];
