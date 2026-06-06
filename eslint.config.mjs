import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["client/src/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-unreachable": "warn",
      "no-duplicate-imports": "warn",
      eqeqeq: "warn",
    },
  },
];
