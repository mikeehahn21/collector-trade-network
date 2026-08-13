import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "apps/api/scripts/**",
      "**/.next/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/next-env.d.ts",
      "apps/mobile/.route-bisect-backup/**",
      "apps/mobile/babel.config.js",
      "apps/mobile/index.js",
      "apps/mobile/metro.config.js",
      "facebook-assets/**",
      "facebook-video-frames/**",
      "facebook-video-frames-winrt/**",
      "thumb-check/**",
      "thumb-check-final/**",
      "packages/*/src/*.d.ts",
      "packages/*/src/*.js",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  // All packages except api: use projectService
  {
    ignores: ["apps/api/**"],
    languageOptions: {
      parserOptions: {
        projectService: {
          // Allow files not explicitly listed in tsconfig (root config files, validation vitest config)
          allowDefaultProject: [
            "packages/validation/vitest.config.ts",
            "eslint.config.mjs",
            "lint-staged.config.cjs",
            "commitlint.config.cjs",
            "apps/mobile/app.config.js",
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // API package: use tsconfig.lint.json which includes migrations and vitest configs
  {
    files: ["apps/api/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./apps/api/tsconfig.lint.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // Root config files and CJS modules: disable type-checked rules that don't apply
  {
    files: ["eslint.config.mjs", "*.cjs"],
    rules: {
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
    },
  },
  {
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
