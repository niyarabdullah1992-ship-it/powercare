import React from "react";

export default function CameraWizardFields({ form, set, stations, ar }) {
  return <div className="grid gap-3 sm:grid-cols-2">
    <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={ar ? "اسم الكاميرا" : "Camera name"} className="rounded-md border p-3" />
    <select required value={form.stationId} onChange={(e) => set("stationId", e.target.value)} className="rounded-md border p-3"><option value="">{ar ? "اختر المحطة" : "Select station"}</option>{stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}</select>
    <select value={form.streamType} onChange={(e) => set("streamType", e.target.value)} className="rounded-md border p-3"><option value="hls">HLS</option><option value="player">Web player / iframe</option><option value="mjpeg">MJPEG</option><option value="rtsp">RTSP (gateway required)</option></select>
    <input value={form.deviceAddress} onChange={(e) => set("deviceAddress", e.target.value)} placeholder={ar ? "عنوان الجهاز (اختياري)" : "Device address (optional)"} className="rounded-md border p-3" />
    <input required value={form.streamUrl} onChange={(e) => set("streamUrl", e.target.value)} placeholder={ar ? "رابط البث أو المشغل" : "Stream or player URL"} className="rounded-md border p-3 sm:col-span-2" dir="ltr" />
  </div>;
}