import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [reactRouter()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: "@/types", replacement: path.resolve(__dirname, "./src/types") },
      { find: "@/lib", replacement: path.resolve(__dirname, "./src/lib") },
      { find: "@/components", replacement: path.resolve(__dirname, "./src/components") },
      { find: "@/hooks", replacement: path.resolve(__dirname, "./src/hooks") },
      { find: "@/config", replacement: path.resolve(__dirname, "./src/config") },
      { find: "@/contexts", replacement: path.resolve(__dirname, "./src/contexts") },
    ],
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      // Suppress noisy sourcemap warnings from third-party deps
      onwarn(warning, defaultHandler) {
        if (warning.code === 'SOURCEMAP_ERROR') return
        defaultHandler(warning)
      },
    },
  },
  // Vite automatically exposes VITE_* environment variables to import.meta.env
  // No need for manual define - just set VITE_POSTGREST_URL in your .env file
});
