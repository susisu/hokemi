"use strict";

module.exports = {
  plugins: ["jest", "jest-formatting"],
  overrides: [
    // source files
    {
      files: ["*.ts"],
      extends: ["@susisu/eslint-config/preset/ts", "prettier"],
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        project: "./tsconfig.json",
      },
      env: {
        es6: true,
      },
    },
    // test files
    {
      files: ["src/**/*.spec.ts", "src/**/__tests__/**/*.ts"],
      extends: ["plugin:jest/recommended", "plugin:jest-formatting/recommended"],
      env: {
        "jest/globals": true,
      },
      rules: {
        "jest/expect-expect": [
          "error",
          {
            assertFunctionNames: ["expect", "assertType"],
            additionalTestBlockFunctions: [],
          },
        ],
      },
    },
    // script files
    {
      files: ["*.js"],
      extends: ["@susisu/eslint-config/preset/js", "prettier"],
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "script",
      },
      env: {
        es6: true,
        node: true,
      },
    },
  ],
};
