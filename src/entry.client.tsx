import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { getBrandingConfig, applyBrandingTheme } from "./config/branding";

// Apply branding theme on load
const branding = getBrandingConfig();
applyBrandingTheme(branding);

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
