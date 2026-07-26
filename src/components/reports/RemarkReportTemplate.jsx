import React, { useState } from "react";
import { Printer } from "lucide-react";

const escapeHtml = (value) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));

export default function RemarkReportTemplate({ ar }) {
  const [content, setContent] = useState("");
  const lines = content.split("\n").map((line) => line.trim()).filter(Boolean);
  const printPreview = () => {
    const items = lines.map((line, index) => `<li>${escapeHtml(line)}</li>`).join("");
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`<html><head><title>Remark</title><style>@page{margin:22mm}body{font-family:Georgia,serif;color:#111}.sheet{border-left:4px solid #111;padding:8px 0 18px 36px}.label{display:inline-block;border:3px solid #111;background:#cce9ea;padding:7px 14px;font:bold 28px Arial,sans-serif}ol{margin:24px 0 0;padding-left:38px;font-size:22px;line-height:1.75}li{padding-left:10px}</style></head><body><section class="sheet"><div class="label">Remark</div><ol>${items}</ol></section><script>window.onload=()=>window.print()<\/script></body></html>`);
    win.document.close();
  };

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg font-semibold">{ar ? "قالب الملاحظة" : "Remark template"}</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <label className="mb-2 block text-sm font-medium">{ar ? "اكتب كل ملاحظة في سطر مستقل" : "Write each remark on a separate line"}</label>
          <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={8} className="w-full resize-y rounded-md border p-3 text-sm" placeholder={ar ? "الملاحظة الأولى\nالملاحظة الثانية" : "First remark\nSecond remark"} />
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="border-s-4 border-foreground ps-6 py-2 font-serif text-foreground">
            <span className="inline-block border-[3px] border-foreground bg-cyan-100 px-3 py-1 text-xl font-bold font-body">Remark</span>
            {lines.length ? <ol className="mt-4 list-decimal space-y-2 ps-7 text-lg leading-relaxed">{lines.map((line, index) => <li key={`${index}-${line}`}>{line}</li>)}</ol> : <p className="mt-5 text-sm text-muted-foreground">{ar ? "ستظهر المعاينة هنا" : "Your preview will appear here"}</p>}
          </div>
          <button type="button" onClick={printPreview} disabled={!lines.length} className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"><Printer className="h-4 w-4" />{ar ? "طباعة المعاينة" : "Print preview"}</button>
        </div>
      </div>
    </section>
  );
}