import { createTypedSignatureWithDate } from "@/lib/typedSignatureImage";
import { makeSignatureStamp } from "@/lib/multiSignStamp";
import { generateVerificationId } from "@/lib/verificationBadge";

// Builds the client's approval stamp using the platform's canonical signature
// badge (fingerprint mark + encrypted verification ID + QR), with the client's
// name rendered as a typed signature.
export async function buildClientStamp(name) {
  const verificationId = generateVerificationId();
  const signature = await createTypedSignatureWithDate(name, new Date().toLocaleDateString("en-GB"), "Arial");
  const dataUrl = await makeSignatureStamp(signature, name, verificationId, "typed", "neo");
  return { dataUrl, verificationId };
}

export async function stampDataUrlToFile(dataUrl) {
  const blob = await fetch(dataUrl).then((r) => r.blob());
  return new File([blob], "client-digital-stamp.png", { type: "image/png" });
}