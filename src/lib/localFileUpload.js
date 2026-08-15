import { base44 } from "@/api/base44Client";
import { isLocalPreviewActive } from "@/lib/localPreview";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

/**
 * Prefer the hosted file store; when it is down (preview / unpublished
 * integrations) keep the receipt/invoice as a data URL so the gate still opens.
 */
export async function uploadFileOrLocal(file) {
  if (!isLocalPreviewActive()) {
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      if (result?.file_url) return { file_url: result.file_url, name: file.name };
    } catch {
      // fall through to a local data URL
    }
  }
  if (file.size > 1.5 * 1024 * 1024) {
    throw new Error("file_too_large_local");
  }
  const file_url = await fileToDataUrl(file);
  if (!file_url) throw new Error("upload_failed");
  return { file_url, name: file.name, local: true };
}
