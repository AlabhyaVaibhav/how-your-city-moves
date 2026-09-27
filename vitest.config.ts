import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["tests/**/*.test.ts"] }, define: { "import.meta.env.DEV": "true" } });
