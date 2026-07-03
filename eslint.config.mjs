import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/node_modules/**",
      "**/coverage/**",
      "facebook-assets/**",
      "facebook-video-frames/**",
      "facebook-video-frames-winrt/**",
      "thumb-check/**",
      "thumb-check-final/**",
      "packages/*/src/*.d.ts",
      "packages/*/src/*.js",
      // Next.js auto-generated files that must use triple-slash references
      "**/next-env.d.ts",
      // Vitest config files are not part of the TS project service
      "**/vitest.config.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          // Allow files not explicitly listed in tsconfig (migrations, vitest configs, etc.)
          allowDefaultProject: [
            "apps/api/migrations/*.ts",
            "apps/api/vitest.config.ts",
            "apps/api/vitest.integration.config.ts",
            "packages/types/src/*.js",
            "packages/types/src/*.d.ts",
            "packages/validation/src/*.js",
            "packages/validation/src/*.d.ts",
            "eslint.config.mjs",
            "lint-staged.config.cjs",
            "commitlint.config.cjs",
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      // Fastify route handlers must be async for the reply/lifecycle system even when
      // they don't explicitly await — disable this rule project-wide.
      "@typescript-eslint/require-await": "off",
      // Allow underscore-prefixed parameters to indicate intentionally unused args
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  eslintConfigPrettier,
);
