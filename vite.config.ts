/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // GitHub Pages serves the site from /<repo-name>/; the Pages workflow sets BASE_PATH
  base: process.env.BASE_PATH ?? "/",
  plugins: [react()],
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
  },
});
