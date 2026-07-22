import { prepareManualPdfNode } from "@/lib/manualPdfSnapshot";

const pageWidth = 210;
const pageHeight = 297;

function addCanvasPages(pdf, canvas, firstPage) {
  const sliceHeight = Math.floor((canvas.width * pageHeight) / pageWidth);
  for (let offset = 0; offset < canvas.height; offset += sliceHeight) {
    if (!firstPage) pdf.addPage();
    firstPage = false;
    const height = Math.min(sliceHeight, canvas.height - offset);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = height;
    const context = slice.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, slice.width, slice.height);
    context.drawImage(canvas, 0, offset, canvas.width, height, 0, 0, canvas.width, height);
    pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageWidth, (height * pageWidth) / canvas.width, undefined, "FAST");
  }
  return firstPage;
}

export async function downloadManualPdf(root, fileName) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const screenshotImages = [...root.querySelectorAll(".manual-screen-shot img")];
  await Promise.all(screenshotImages.map(async (image) => {
    if (!image.complete) await new Promise((resolve) => { image.addEventListener("load", resolve, { once: true }); image.addEventListener("error", resolve, { once: true }); });
    if (image.decode) await image.decode().catch(() => undefined);
  }));
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const nodes = [root.querySelector("header"), root.querySelector(".manual-toc-export"), ...root.querySelectorAll(".manual-chapter")].filter(Boolean);
  let firstPage = true;
  for (const source of nodes) {
    const { node, cleanup } = await prepareManualPdfNode(source, html2canvas);
    const canvas = await html2canvas(node, { scale: 1.15, useCORS: true, backgroundColor: "#ffffff", logging: false, windowWidth: node.scrollWidth, windowHeight: node.scrollHeight, ignoreElements: (element) => element.classList?.contains("no-print") });
    cleanup();
    firstPage = addCanvasPages(pdf, canvas, firstPage);
  }
  pdf.save(fileName);
}