import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Treat non-standard `?raw=` requests like Vite's native `?raw` imports.
const rawEqualsCompat = {
  name: 'raw-equals-compat',
  enforce: 'pre',
  transform(code, id) {
    if (!/[?&]raw=$/.test(id)) return null
    return { code: `export default ${JSON.stringify(code)}`, map: null }
  },
}

// https://vite.dev/config/
export default defineConfig({
  assetsInclude: ["**/*.html?raw=", "**/*.css?raw="],
  plugins: [
    rawEqualsCompat,
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ]
});