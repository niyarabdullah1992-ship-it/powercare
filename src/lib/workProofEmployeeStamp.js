import { base44 } from "@/api/base44Client";
import { buildClientStamp, stampDataUrlToFile } from "@/lib/clientDigitalStamp";

// Builds the internal (employee) approval stamp with the same canonical badge
// used for the client, and uploads it so it can be sealed onto the record.
export async function buildEmployeeStampUrl(name) {
  const { dataUrl } = await buildClientStamp(name);
  const file = await stampDataUrlToFile(dataUrl);
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  return file_url;
}