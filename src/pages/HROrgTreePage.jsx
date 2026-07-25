import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import HROrgTreeView from "@/components/hr/HROrgTreeView";

export default function HROrgTreePage() {
  const { lang } = useI18n(); const { data, company, currentUser } = useAuth();
  if (!data || !company || !currentUser) return null;
  const ar = lang === "ar"; const Back = ar ? ArrowRight : ArrowLeft;
  return <div className="space-y-5" dir={ar ? "rtl" : "ltr"}><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-heading text-3xl font-semibold">{ar ? "شجرة الموارد البشرية" : "Human Resources tree"}</h1><p className="mt-1 text-sm text-muted-foreground">{ar ? "هيكل HR مستقل للمحطات والمجموعات والأدوار الإدارية" : "An independent HR structure for stations, clusters, and roles"}</p></div><Link to="/app/hr" className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted"><Back className="h-4 w-4" />{ar ? "العودة إلى الموارد البشرية" : "Back to Human Resources"}</Link></div><HROrgTreeView data={data} company={company} currentUser={currentUser} lang={lang} /></div>;
}