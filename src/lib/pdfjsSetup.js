import * as pdfjsLib from "pdfjs-dist";

// Worker is served from a versioned CDN path that matches the installed
// pdfjs-dist exactly, so the module the browser loads is always real JS.
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default pdfjsLib;
export { pdfjsLib };