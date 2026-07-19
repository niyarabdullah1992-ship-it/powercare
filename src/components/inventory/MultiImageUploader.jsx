import React, { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ImageLightbox from "@/components/inventory/ImageLightbox";

export default function MultiImageUploader({ value, onChange, ar }) {
  const inputRef = useRef(null); const [uploading, setUploading] = useState(false); const [error, setError] = useState(""); const [active, setActive] = useState(null);
  const upload = async (event) => {
    const files = Array.from(event.target.files || []); event.target.value = "";
    if (value.length + files.length > 10) return setError(ar ? "الحد الأقصى 10 صور." : "Maximum 10 images.");
    if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) return setError(ar ? "الصيغ المدعومة: JPEG وPNG وWEBP." : "Supported formats: JPEG, PNG and WEBP.");
    setError(""); setUploading(true);
    try { const uploaded = await Promise.all(files.map((file) => base44.integrations.Core.UploadFile({ file }))); onChange([...value, ...uploaded.map((item) => item.file_url)]); }
    catch (err) { setError(err.message || (ar ? "تعذر رفع الصور." : "Images could not be uploaded.")); }
    finally { setUploading(false); }
  };
  return <div className="space-y-3 md:col-span-2 xl:col-span-4">
    <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={upload} className="hidden" />
    <button type="button" disabled={uploading || value.length >= 10} onClick={() => inputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 font-medium text-accent disabled:opacity-50">{uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}{uploading ? (ar ? "جارٍ رفع الصور..." : "Uploading images...") : (ar ? `رفع الصور (${value.length}/10)` : `Upload images (${value.length}/10)`)}</button>
    {!!value.length && <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{value.map((url, index) => <div key={`${url}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"><button type="button" onClick={() => setActive(index)} className="h-full w-full"><img src={url} alt="" className="h-full w-full object-cover" /></button><button type="button" onClick={() => onChange(value.filter((_, i) => i !== index))} className="absolute end-1 top-1 rounded-full bg-card/90 p-1 text-destructive" aria-label={ar ? "حذف الصورة" : "Remove image"}><Trash2 className="h-4 w-4" /></button></div>)}</div>}
    {error && <p className="text-xs text-destructive">{error}</p>}{active !== null && <ImageLightbox images={value} index={active} onIndex={setActive} onClose={() => setActive(null)} ar={ar} />}
  </div>;
}