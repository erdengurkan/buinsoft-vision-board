// Application version - injected by Vite at build time
// Fallback version updated to 1.4.0.0
export const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string) || "1.4.0.0";

// Force version for development (will be overridden by Vite define in production)
if (import.meta.env.DEV && !import.meta.env.VITE_APP_VERSION) {
  console.log('Using fallback version:', "1.4.0.0");
}
