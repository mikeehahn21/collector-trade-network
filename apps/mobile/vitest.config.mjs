import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));
const normalizePath = (value) => value.replaceAll("\\", "/");

export default defineConfig({
  resolve: {
    alias: {
      "@": normalizePath(`${projectRoot}src`),
      "@ctn/api-contracts": normalizePath(`${workspaceRoot}/packages/api-contracts/src/index.ts`),
      "@ctn/constants": normalizePath(`${workspaceRoot}/packages/constants/src/index.ts`),
      "@ctn/types": normalizePath(`${workspaceRoot}/packages/types/src/index.ts`),
      "@ctn/utils": normalizePath(`${workspaceRoot}/packages/utils/src/index.ts`),
      "@ctn/validation": normalizePath(`${workspaceRoot}/packages/validation/src/index.ts`),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
