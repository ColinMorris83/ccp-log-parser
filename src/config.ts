/**
 * Build configuration for the application, containing version information
 * sourced from environment variables defined at build time.
 * The properties of this config are read-only and should not be modified at runtime.
 */
export const buildConfig = {
  version: import.meta.env.VITE_APP_VERSION ?? '',
} as const;
