import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    globalSetup: ["test/javascript/setup.ts"],
  },
})
