import React from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, FileText, ExternalLink } from "lucide-react";

export default function AssistantMessage({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm font-body ${isUser ? "bg-foreground text-background" : "bg-card border border-border"}`} dir="auto">
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1 text-accent">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.text}</p>
        ) : (
          <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5 [&_h3]:mt-2 [&_h3]:mb-1 [&_table]:text-xs">
            <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>
        )}
        {Array.isArray(message.docs) && message.docs.map((doc, i) => (
          <a
            key={i}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2.5 hover:bg-accent/10 transition-colors no-underline"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
              <FileText className="h-[18px] w-[18px]" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground" dir="auto">{doc.title}</span>
            </span>
            <ExternalLink className="h-4 w-4 shrink-0 text-accent" />
          </a>
        ))}
      </div>
    </div>
  );
}