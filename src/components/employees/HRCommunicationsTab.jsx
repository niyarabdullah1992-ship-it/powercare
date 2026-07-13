import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { addHRMessage } from "@/lib/store";
import { Send, Building2, Users } from "lucide-react";
import CommentFiles, { CommentAttachments } from "@/components/tasks/CommentFiles";
import VoiceRecorder from "@/components/tasks/VoiceRecorder";

export default function HRCommunicationsTab({ employee, companyId, currentUser, isSelf, canReply }) {
  const { t } = useI18n();
  const [target, setTarget] = useState("station");
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const messages = employee.hrMessages || [];
  const canSend = isSelf || canReply;

  const send = (e) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return;
    addHRMessage(companyId, employee.id, {
      from: isSelf ? "employee" : "hr",
      target,
      text: text.trim(),
      files,
      senderName: currentUser.name,
    });
    setText("");
    setFiles([]);
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/45 p-5 backdrop-blur-xl">
      <h3 className="font-heading font-semibold">{t("hrCommunications")}</h3>
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
                  <span>{m.target === "hq" ? t("hqHRTarget") : t("stationHRTarget")}</span>
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
          {isSelf && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-body">{t("sendTo")}:</span>
              <button type="button" onClick={() => setTarget("station")} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body border transition ${target === "station" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}>
                <Building2 className="w-3.5 h-3.5" /> {t("stationHRTarget")}
              </button>
              <button type="button" onClick={() => setTarget("hq")} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body border transition ${target === "hq" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}>
                <Users className="w-3.5 h-3.5" /> {t("hqHRTarget")}
              </button>
            </div>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <CommentFiles files={files} setFiles={setFiles} />
            <VoiceRecorder files={files} setFiles={setFiles} />
          </div>
          <div className="flex items-center gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t("typeMessage")} className="flex-1 px-3 py-2 rounded-md border border-input text-sm font-body" />
            <button type="submit" className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-foreground text-background text-sm font-body">
              <Send className="w-4 h-4" /> {t("send")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}