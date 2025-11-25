function readEnv(key: "PUBLIC_POSTGREST_URL" | "PUBLIC_CHAIN_REST_ENDPOINT") {
  // `import.meta.env` is injected by bun build when the variable is set; guard to avoid
  // runtime crashes when it's missing in dev.
  const env = (typeof import.meta !== "undefined" && (import.meta as any).env) || {};
  return env[key];
}

export function getPublicPostgrestUrl() {
  return readEnv("PUBLIC_POSTGREST_URL") || "/api";
}

export function getPublicChainRestEndpoint() {
  return readEnv("PUBLIC_CHAIN_REST_ENDPOINT");
}
