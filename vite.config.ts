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
  define: {
    'process.env.NEXT_PUBLIC_POSTGREST_URL': JSON.stringify(process.env.NEXT_PUBLIC_POSTGREST_URL || 'http://localhost:3010')
  }
});
