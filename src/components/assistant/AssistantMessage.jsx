import React from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles } from "lucide-react";

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
      </div>
    </div>
  );
}