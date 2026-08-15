import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const normalizeRawUrl = (value = "") => value.replace(/([?&])raw=(?=(&|$))/g, "$1raw");

const normalizeRawQuery = {
  name: "normalize-empty-raw-query",
  enforce: "pre",
  resolveId(source, importer, options) {
    const normalized = normalizeRawUrl(source);
    if (normalized === source) return null;
    return this.resolve(normalized, importer, { ...options, skipSelf: true });
  },
  load(id) {
    const [filePath, query = ""] = id.split("?");
    const isRawText = /\.(html|css)$/i.test(filePath) && /(^|&)raw(?:=)?(?:&|$)/.test(query);
    if (!isRawText) return null;
    return `export default ${JSON.stringify(readFileSync(filePath, "utf8"))};`;
  },
  configureServer(server) {
    server.middlewares.use((request, _response, next) => {
      request.url = normalizeRawUrl(request.url);
      next();
    });
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    normalizeRawQuery,
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      // Production site is this Vite app only — do not inject builder/preview chrome.
      hmrNotifier: process.env.NODE_ENV !== "production",
      navigationNotifier: process.env.NODE_ENV !== "production",
      analyticsTracker: false,
      visualEditAgent: false
    }),
    react(),
    {
      name: "omit-legacy-public-dumps",
      apply: "build",
      closeBundle() {
        for (const rel of ["claude-handoff-hr.html", "design"]) {
          rmSync(join("dist", rel), { recursive: true, force: true });
        }
      },
    },
  ],
  optimizeDeps: {
    include: ["qrcode"],
  },
  // Claude Design handoff zips lock files on Windows; watching them crashes Vite (EBUSY).
  server: {
    watch: {
      ignored: ["**/design-handoff-claude/**", "**/.tmp-design-caps/**"],
    },
  },
});