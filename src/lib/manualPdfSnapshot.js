export async function prepareManualPdfNode(source, html2canvas) {
  const width = Math.max(source.getBoundingClientRect().width, 760);
  const clone = source.cloneNode(true);
  Object.assign(clone.style, { display: "block", position: "fixed", top: "0", left: "-12000px", width: `${width}px`, height: "auto", maxHeight: "none", overflow: "visible" });
  clone.querySelectorAll("*").forEach((element) => { element.style.animation = "none"; element.style.transition = "none"; });
  document.body.appendChild(clone);

  const originalShots = [...source.querySelectorAll(".manual-screen-shot")];
  const clonedShots = [...clone.querySelectorAll(".manual-screen-shot")];
  for (let index = 0; index < originalShots.length; index += 1) {
    const canvas = await html2canvas(originalShots[index], { scale: 1.35, useCORS: true, backgroundColor: "#f5efe5", logging: false });
    const image = document.createElement("img");
    image.src = canvas.toDataURL("image/jpeg", 0.94);
    image.alt = "PowerCare section illustration";
    Object.assign(image.style, { display: "block", width: "100%", height: "auto", borderRadius: "16px" });
    clonedShots[index]?.replaceWith(image);
    if (image.decode) await image.decode().catch(() => undefined);
  }

  return { node: clone, cleanup: () => clone.remove() };
}