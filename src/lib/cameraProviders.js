export const cameraProviders = [
  { id: "ezviz", name: "EZVIZ", hintAr: "فعّل RTSP من إعدادات الجهاز ثم استخدم بوابة HLS آمنة.", hintEn: "Enable RTSP in device settings, then use a secure HLS gateway." },
  { id: "hikvision", name: "Hikvision", hintAr: "يدعم RTSP وISAPI. استخدم رابط HLS أو Web Player الصادر من NVR.", hintEn: "Supports RTSP and ISAPI. Use the HLS or web-player URL from the NVR." },
  { id: "dahua", name: "Dahua", hintAr: "فعّل ONVIF أو RTSP، ثم حوّل البث إلى HLS عبر NVR أو بوابة محلية.", hintEn: "Enable ONVIF or RTSP, then convert it to HLS through an NVR or local gateway." },
  { id: "onvif", name: "ONVIF", hintAr: "اكتشف الجهاز محليًا ثم استخدم مسار البث الذي يوفره ONVIF عبر بوابة متوافقة.", hintEn: "Discover the device locally, then use its ONVIF stream through a compatible gateway." },
  { id: "eagle_eye", name: "Eagle Eye", hintAr: "الصق رابط المشغل المضمّن أو رابط HLS الصادر من حسابك.", hintEn: "Paste the embed-player or HLS URL issued by your account." },
  { id: "milestone", name: "Milestone", hintAr: "استخدم رابط Mobile Server/Web Client المسموح بتضمينه.", hintEn: "Use an embeddable Mobile Server/Web Client URL." },
  { id: "genetec", name: "Genetec", hintAr: "استخدم رابط Web App أو بوابة بث HTTPS معتمدة.", hintEn: "Use an approved Web App or HTTPS streaming gateway URL." },
  { id: "generic", name: "Generic IP", hintAr: "أدخل رابط HLS أو MJPEG أو Web Player. RTSP الخام لا يعمل في المتصفح.", hintEn: "Enter an HLS, MJPEG, or web-player URL. Raw RTSP cannot play in browsers." },
];

export const cameraTypes = ["player", "hls", "mjpeg", "rtsp"];