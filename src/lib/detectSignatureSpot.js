import { base44 } from "@/api/base44Client";

// AI vision: examines the document and locates the blank signature area
// (an empty box/frame, a signature line, or the space next to "Signature" /
// "التوقيع"). Returns { page, x_percent, y_percent } measured from the
// TOP-LEFT of the page, or null when nothing is found / detection fails.
export async function detectSignatureSpot(fileUrl) {
  try {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are analyzing a document that a person needs to sign.
Find the blank area intended for the signature — for example an empty box or frame,
a horizontal signature line, or the empty space directly next to/below a label like
"Signature", "Signed by", "التوقيع", "توقيع الموظف", "اسم وتوقيع".
Return:
- found: true only if you clearly identified such an area
- page: the 1-based page number containing it (1 for single-page/image documents)
- x_percent and y_percent: the position of the CENTER of the blank area, as
  percentages (0-100) of the page width and height, measured from the TOP-LEFT corner.
Prefer the area explicitly meant for the signer over any other blank space.`,
      file_urls: [fileUrl],
      response_json_schema: {
        type: "object",
        properties: {
          found: { type: "boolean" },
          page: { type: "number" },
          x_percent: { type: "number" },
          y_percent: { type: "number" },
        },
        required: ["found"],
      },
    });
    if (res?.found && typeof res.x_percent === "number" && typeof res.y_percent === "number") {
      return { page: Math.max(1, Math.round(res.page || 1)), x: res.x_percent, y: res.y_percent };
    }
    return null;
  } catch {
    return null;
  }
}