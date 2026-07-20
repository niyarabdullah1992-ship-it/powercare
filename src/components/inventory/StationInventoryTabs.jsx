import React from "react";
import { Boxes, Inbox, Send, ShoppingCart } from "lucide-react";

export default function StationInventoryTabs({ active, onChange, ar, incomingCount }) {
  const tabs = [["stock", Boxes, ar ? "مخزوني" : "My stock"], ["incoming", Inbox, ar ? "طلبات واردة" : "Incoming requests"], ["outgoing", Send, ar ? "طلبات صادرة" : "Outgoing requests"], ["purchases", ShoppingCart, ar ? "مشترياتي" : "My purchases"]];
  return <div className="flex gap-2 overflow-x-auto no-scrollbar">{tabs.map(([key, Icon, label]) => <button key={key} onClick={() => onChange(key)} className={`relative flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs ${active === key ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card"}`}><Icon className="h-4 w-4" />{label}{key === "incoming" && incomingCount > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[10px] text-white">{incomingCount}</span>}</button>)}</div>;
}