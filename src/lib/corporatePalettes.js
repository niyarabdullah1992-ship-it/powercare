// Corporate colour palettes selectable from the header. Values live in src/index.css
// under [data-palette="..."]; this module only holds the picker metadata.
export const PALETTE_KEY = "powercare_palette";

export const CORPORATE_PALETTES = [
  { id: "nirovera", nameAr: "نيروفيرا (الافتراضي)", nameEn: "NiroVera (default)", swatches: ["#0F1E3C", "#12703F", "#F5F6F8"] },
  { id: "sap", nameAr: "أزرق مؤسسي", nameEn: "Corporate Blue", swatches: ["#0052CC", "#00875A", "#FFFFFF"] },
  { id: "graphite", nameAr: "جرافيت وذهبي", nameEn: "Graphite & Gold", swatches: ["#23272F", "#B8862B", "#F7F7F5"] },
  { id: "teal", nameAr: "أزرق بترولي", nameEn: "Deep Teal", swatches: ["#0B3C49", "#0E8388", "#F2F7F7"] },
];

export function getPalette() {
  return localStorage.getItem(PALETTE_KEY) || "nirovera";
}

export function applyPalette(id) {
  document.documentElement.setAttribute("data-palette", id);
  localStorage.setItem(PALETTE_KEY, id);
}