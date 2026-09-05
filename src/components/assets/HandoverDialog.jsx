import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import MobileSelect from "@/components/mobile/MobileSelect";
import SignatureCapture from "@/components/assets/SignatureCapture";
import MultiImageUploader from "@/components/inventory/MultiImageUploader";

// Rule 2 — a handover is only recorded when both parties have signed.
export default function HandoverDialog({ asset, employees, stations = [], lang, onClose, onSubmit }) {
  const [toId, setToId] = useState("");
  const [condition, setCondition] = useState("");
  const [images, setImages] = useState([]);
  const [fromSignatureUrl, setFrom] = useState("");
  const [toSignatureUrl, setTo] = useState("");
  const [saving, setSaving] = useState(false);

  // The receiver can be a person or the branch itself (asset stored at the unit).
  const toBranch = String(toId).startsWith("station:");
  const receiverStation = stations.find((s) => `station:${s.id}` === toId);
  const receiver = employees.find((e) => e.id === toId);
  const receiverName = toBranch
    ? `${lang === "ar" ? "عهدة الفرع" : "Branch custody"} — ${receiverStation?.name || ""}`
    : receiver?.name || "";
  const ready = toId && condition.trim() && fromSignatureUrl && toSignatureUrl;

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit({ assetId: asset.id, toId, toName: receiverName, condition, imageUrls: images, fromSignatureUrl, toSignatureUrl });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-[10px] border border-border bg-card p-4 space-y-4 pb-safe">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold">{lang === "ar" ? "نموذج تسليم عهدة" : "Custody handover"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <p className="text-sm font-body text-muted-foreground">
          {asset.name} · {asset.assetCode} — {lang === "ar" ? "المسلِّم" : "From"}: {asset.holderName || "—"}
        </p>

        <MobileSelect
          value={toId} onChange={setToId} searchable
          placeholder={lang === "ar" ? "المستلم" : "Receiver"}
          className="w-full"
          options={[
            ...stations.map((s) => ({ value: `station:${s.id}`, label: `${lang === "ar" ? "عهدة الفرع" : "Branch custody"} — ${s.name}` })),
            ...employees.map((e) => ({ value: e.id, label: e.name })),
          ]}
        />
        {toBranch && (
          <p className="text-xs font-body text-muted-foreground">
            {lang === "ar" ? "الأصل سيُسجَّل باسم الفرع، ويوقّع المستلم نيابة عنه." : "The asset is registered to the branch; the receiver signs on its behalf."}
          </p>
        )}

        <textarea
          value={condition} onChange={(e) => setCondition(e.target.value)} rows={2}
          placeholder={lang === "ar" ? "حالة الأصل عند التسليم" : "Asset condition at handover"}
          className="w-full rounded-md border border-input px-3 py-2 text-sm font-body"
        />

        <MultiImageUploader value={images} onChange={setImages} ar={lang === "ar"} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SignatureCapture label={lang === "ar" ? "توقيع المسلِّم" : "Sender signature"} value={fromSignatureUrl} onChange={setFrom} />
          <SignatureCapture label={lang === "ar" ? "توقيع المستلم" : "Receiver signature"} value={toSignatureUrl} onChange={setTo} />
        </div>

        <button disabled={!ready || saving} onClick={submit} className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-body font-medium text-primary-foreground disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (lang === "ar" ? "توثيق التسليم" : "Record handover")}
        </button>
        {!ready && <p className="text-xs font-body text-muted-foreground text-center">{lang === "ar" ? "التسليم يتطلب توقيع الطرفين وحالة الأصل." : "Both signatures and the condition are required."}</p>}
      </div>
    </div>
  );
}