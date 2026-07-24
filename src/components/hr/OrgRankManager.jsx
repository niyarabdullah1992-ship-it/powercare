import React from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { ORG_RANK_COLOR_OPTIONS, ORG_RANK_ICON_OPTIONS, getOrgRankVisual } from "@/lib/orgRankVisuals";

export default function OrgRankManager({ ranks, onChange, ar }) {
  const update = (id, patch) => onChange(ranks.map((item) => item.id === id ? { ...item, ...patch } : item));
  const move = (index, step) => {
    const next = [...ranks];
    const target = index + step;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const add = () => {
    const number = ranks.length + 1;
    onChange([...ranks, { id: `rank_${Date.now()}`, labelAr: `درجة ${number}`, labelEn: `Grade ${number}`, icon: ORG_RANK_ICON_OPTIONS[ranks.length % ORG_RANK_ICON_OPTIONS.length], color: ORG_RANK_COLOR_OPTIONS[ranks.length % ORG_RANK_COLOR_OPTIONS.length] }]);
  };
  return <section className="space-y-2 rounded-lg border border-accent/30 bg-muted/30 p-3">
    <div className="flex items-center justify-between"><div><h4 className="text-sm font-semibold">{ar ? "درجات ورموز الشجرة" : "Tree grades and icons"}</h4><p className="text-[10px] text-muted-foreground">{ar ? "الترتيب يحدد الدرجة التلقائية حسب العمق" : "Order controls automatic grades by depth"}</p></div><button type="button" onClick={add} className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-2 text-xs font-semibold text-accent-foreground"><Plus className="h-3.5 w-3.5" />{ar ? "درجة" : "Grade"}</button></div>
    <div className="max-h-52 space-y-2 overflow-auto">{ranks.map((item, index) => {
      const { Icon, badge } = getOrgRankVisual(item);
      return <div key={item.id} className="flex flex-wrap items-center gap-1.5 rounded-md border bg-card p-2"><span className={`flex h-8 w-8 items-center justify-center rounded-full border ${badge}`}><Icon className="h-4 w-4" /></span><input value={ar ? item.labelAr : item.labelEn} onChange={(event) => update(item.id, ar ? { labelAr: event.target.value } : { labelEn: event.target.value })} className="min-w-[120px] flex-1 rounded-md border px-2 py-1.5 text-xs" /><select value={item.icon} onChange={(event) => update(item.id, { icon: event.target.value })} className="w-[90px] rounded-md border px-1 py-1.5 text-[10px]">{ORG_RANK_ICON_OPTIONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}</select><select value={item.color} onChange={(event) => update(item.id, { color: event.target.value })} className="w-[90px] rounded-md border px-1 py-1.5 text-[10px]">{ORG_RANK_COLOR_OPTIONS.map((color) => <option key={color} value={color}>{color}</option>)}</select><span className="flex"><button type="button" onClick={() => move(index, -1)} className="p-1"><ChevronUp className="h-3 w-3" /></button><button type="button" onClick={() => move(index, 1)} className="p-1"><ChevronDown className="h-3 w-3" /></button><button type="button" disabled={ranks.length === 1} onClick={() => onChange(ranks.filter((rank) => rank.id !== item.id))} className="p-1 text-destructive disabled:opacity-30"><Trash2 className="h-3 w-3" /></button></span></div>;
    })}</div>
  </section>;
}