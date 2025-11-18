import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [reactRouter()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Vite automatically exposes VITE_* environment variables to import.meta.env
  // No need for manual define - just set VITE_POSTGREST_URL in your .env file
});
