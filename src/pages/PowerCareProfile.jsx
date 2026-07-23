import React, { useRef, useState } from "react";
import ProfilePage from "@/components/profile/ProfilePage";
import ProfileToolbar from "@/components/profile/ProfileToolbar";
import { profilePages } from "@/lib/powerCareProfileContent";
import { downloadProfilePdf } from "@/lib/downloadProfilePdf";

export default function PowerCareProfile() {
  const documentRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const download = async () => {
    setDownloading(true);
    await document.fonts.ready;
    await Promise.all([...documentRef.current.querySelectorAll("img")].map((image) => image.complete ? Promise.resolve() : new Promise((resolve) => { image.onload = resolve; image.onerror = resolve; })));
    await downloadProfilePdf(documentRef.current, (current) => setProgress(current));
    setDownloading(false);
    setProgress(0);
  };
  return <div className="min-h-screen bg-secondary"><ProfileToolbar downloading={downloading} progress={progress} onDownload={download} /><main ref={documentRef} className="flex flex-col items-center gap-8 overflow-x-auto px-4 py-8">{profilePages.map((page) => <ProfilePage key={page.number} page={page} />)}</main></div>;
}