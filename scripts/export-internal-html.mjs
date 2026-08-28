/**
 * Export standalone rendered HTML of the internal platform.
 *
 * The platform is a React SPA, so its HTML is produced at runtime. This script
 * drives the running dev server with headless Chrome, opens the offline preview
 * workspace (which seeds a demo company), visits each internal route, then
 * serialises the fully-rendered DOM into a self-contained .html file: same-origin
 * stylesheets are inlined, <img> assets are embedded as data URLs, and the
 * bootstrap <script> tags are removed so the file renders as a static snapshot.
 *
 * Requirements (dev-only, not a project dependency):
 *   npm install puppeteer-core --no-save
 * Usage:
 *   node scripts/export-internal-html.mjs [baseUrl] [outDir]
 */
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] || "http://localhost:5173";
const OUT_DIR = process.argv[3] || "/opt/cursor/artifacts";

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/opt/google/chrome/chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!executablePath) {
  console.error("No Chrome/Chromium executable found.");
  process.exit(1);
}

const ROUTES = [
  { path: "/app", name: "command-center" },
  { path: "/app/attendance", name: "attendance" },
  { path: "/app/tasks", name: "operations" },
  { path: "/app/work-proof", name: "work-proof" },
  { path: "/app/signing", name: "signing" },
  { path: "/app/payroll", name: "payroll" },
  { path: "/app/hr", name: "human-resources" },
  { path: "/app/safety", name: "safety" },
];

/** Runs in the page: inline CSS + images, strip scripts, return standalone HTML. */
async function serialiseStandalone() {
  document.querySelectorAll("script").forEach((s) => s.remove());

  let css = "";
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) css += `${rule.cssText}\n`;
    } catch {
      /* cross-origin sheet (e.g. Google Fonts) — leave its <link> in place */
    }
  }
  document.querySelectorAll("style").forEach((n) => n.remove());
  document.querySelectorAll('link[rel="stylesheet"]').forEach((n) => {
    if (!/fonts\.(googleapis|gstatic)\.com/.test(n.href)) n.remove();
  });
  const styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  await Promise.all(
    Array.from(document.querySelectorAll("img")).map(async (img) => {
      try {
        const res = await fetch(img.src);
        const blob = await res.blob();
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        img.setAttribute("src", dataUrl);
        img.removeAttribute("srcset");
      } catch {
        /* keep original src */
      }
    }),
  );

  return `<!doctype html>\n${document.documentElement.outerHTML}`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });

  // Seed the offline demo workspace, then wait until it lands inside /app.
  await page.goto(`${BASE}/preview`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => location.pathname.startsWith("/app"), { timeout: 60000 });
  await page.waitForSelector('[data-nv="sidebar"], .powercare-shell', { timeout: 60000 });

  const written = [];
  for (const route of ROUTES) {
    await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector(".powercare-interior-page", { timeout: 60000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1200)); // let lazy chunks + charts settle
    const html = await page.evaluate(serialiseStandalone);
    const file = `${OUT_DIR}/internal-${route.name}.html`;
    await writeFile(file, html, "utf8");
    written.push({ file, kb: Math.round(html.length / 1024) });
    console.log(`✓ ${route.path} → ${file} (${Math.round(html.length / 1024)} KB)`);
  }

  await browser.close();
  console.log(`\nDone. ${written.length} files written to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
