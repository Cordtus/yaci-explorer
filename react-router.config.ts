import type { Config } from "@react-router/dev/config";

export default {
  ssr: false,
  appDirectory: "src",
  async routes(defineRoutes) {
    return defineRoutes((route) => {
      route("/", "routes/home.tsx");
      route("/blocks", "routes/blocks.tsx");
      route("/blocks/:id", "routes/blocks.$id.tsx");
      route("/transactions", "routes/transactions.tsx");
      route("/transactions/:hash", "routes/transactions.$hash.tsx");
      route("/analytics", "routes/analytics.tsx");
      route("/addr/:id", "routes/addr.$id.tsx");
    });
  },
} satisfies Config;
