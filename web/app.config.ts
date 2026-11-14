import { defineConfig } from "@tanstack/start/config"
import tsConfigPaths from "vite-tsconfig-paths"

const is_tauri = process.env.TAURI_ENV_TARGET_TRIPLE !== undefined
const publicRoutes = { routeFileIgnorePattern: "^_protected(?:\\.tsx)?$" }

const config = is_tauri
  ? defineConfig({
      tsr: publicRoutes,
      vite: {
        envPrefix: ["VITE_", "TAURI_ENV_*"],
        build: {
          target:
            process.env.TAURI_ENV_PLATFORM == "windows"
              ? "chrome105"
              : "safari13",
          minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
          sourcemap: !!process.env.TAURI_ENV_DEBUG,
        },
        plugins: [
          tsConfigPaths({
            projects: ["./tsconfig.json"],
          }),
        ],
      },
      server: {
        preset: "static",
      },
    })
  : defineConfig({
      server: { preset: "node-server" },
      // Retain historical account source without publishing private workspace tools.
      tsr: publicRoutes,
      vite: {
        plugins: [
          tsConfigPaths({
            projects: ["./tsconfig.json"],
          }),
        ],
      },
    })

export default config
