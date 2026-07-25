import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { addHRMessage } from "@/lib/store";
import { Send } from "lucide-react";
import CommentFiles, { CommentAttachments } from "@/components/tasks/CommentFiles";
import VoiceRecorder from "@/components/tasks/VoiceRecorder";
import TreeCommunicationTargetPicker from "@/components/employees/TreeCommunicationTargetPicker";
import { treeCommunicationTargets } from "@/lib/orgTree";

export default function HRCommunicationsTab({ employee, companyId, currentUser, isSelf, canReply, data }) {
  const { t, lang } = useI18n();
  const ar = lang === "ar";
  const targets = treeCommunicationTargets(data, employee.id);
  const [targetId, setTargetId] = useState(targets[0]?.id || "");
  const selectedTarget = targets.find((item) => item.id === targetId) || targets[0];
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const messages = employee.hrMessages || [];
  const canSend = isSelf || canReply;

  const send = (e) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return;
    if (isSelf && !selectedTarget) return;
    addHRMessage(companyId, employee.id, {
      from: isSelf ? "employee" : "hr",
      targetId: isSelf ? selectedTarget.id : employee.id,
      targetName: isSelf ? selectedTarget.name : employee.name,
      text: text.trim(),
      files,
      senderName: currentUser.name,
    });
    setText("");
    setFiles([]);
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-5">
      <h3 className="font-heading font-semibold">{ar ? "التواصل الإداري عبر الشجرة" : "Organization tree communications"}</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body">{t("noMessages")}</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.from === "employee" ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[75%] p-2.5 rounded-lg text-sm font-body ${m.from === "employee" ? "bg-muted" : "bg-accent/15"}`}>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                  <span className="font-medium">{m.senderName}</span>
                  <span>·</span>
                  <span>{m.targetName || (m.target === "hq" ? t("hqHRTarget") : t("stationHRTarget"))}</span>
                </div>
                {m.text && <p>{m.text}</p>}
                <CommentAttachments files={m.files} />
              </div>
            </div>
          ))
        )}
      </div>

      {canSend && (
        <form onSubmit={send} className="space-y-2 pt-2 border-t border-border">
          {isSelf && <TreeCommunicationTargetPicker targets={targets} value={selectedTarget?.id || ""} onChange={setTargetId} ar={ar} />}
          <div className="flex flex-wrap items-end gap-2">
            <CommentFiles files={files} setFiles={setFiles} />
            <VoiceRecorder files={files} setFiles={setFiles} />
          </div>
          <div className="flex items-center gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t("typeMessage")} className="flex-1 px-3 py-2 rounded-md border border-input text-sm font-body" />
            <button type="submit" disabled={isSelf && !selectedTarget} className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-foreground text-background text-sm font-body disabled:opacity-40">
              <Send className="w-4 h-4" /> {t("send")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}