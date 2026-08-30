import { defineConfig, devices } from "playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: [
    {
      command: "node tests/e2e/fixtures/directus-server.mjs",
      url: "http://127.0.0.1:3201/server/health",
      reuseExistingServer: true,
      timeout: 30_000
    },
    {
      command: "NEXT_PUBLIC_DIRECTUS_URL=http://127.0.0.1:3201 npm run dev -- --port 3100",
      url: "http://127.0.0.1:3100",
      reuseExistingServer: true,
      timeout: 120_000
    }
  ],
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry"
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } }
  ]
});
