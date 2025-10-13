import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("blocks", "routes/blocks.tsx"),
  route("blocks/:id", "routes/blocks.$id.tsx"),
  route("transactions", "routes/transactions.tsx"),
  route("transactions/:hash", "routes/transactions.$hash.tsx"),
  route("analytics", "routes/analytics.tsx"),
] satisfies RouteConfig;
