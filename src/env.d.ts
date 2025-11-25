declare module "*.css" {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly PUBLIC_POSTGREST_URL?: string;
  readonly PUBLIC_CHAIN_REST_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
