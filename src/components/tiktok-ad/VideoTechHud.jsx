import React from "react";
import { Image } from "@/components/ui/image";

const STORIES = [
  ["أحمد", "مهندس صيانة طاقة", "الدقة تبدأ من الميدان"],
  ["نورة", "مطورة أنظمة", "ابتكار تقني فائق الدقة"],
  ["يوسف", "مدير مشاريع", "إدارة تصنع أثرًا حقيقيًا"],
  ["فريق العمليات", "تشغيل متكامل", "قرارات أسرع من موقع العمل"],
  ["NiroVera", "منصة إدارة الأعمال", "نبني مستقبلًا مستدامًا"],
];

export default function VideoTechHud({ index, logoUrl }) {
  const [name, role, title] = STORIES[index] || STORIES[0];
  return <div className="ad-story-hud" aria-hidden="true">
    <div className="ad-story-shade" />
    <p className="ad-story-title">{title}</p>
    <div className="ad-story-person"><strong>{name}</strong><span>{role}</span></div>
    <div className="ad-story-brand"><Image src={logoUrl} alt="" className="h-8 w-28" fittingType="fit" /></div>
  </div>;
}