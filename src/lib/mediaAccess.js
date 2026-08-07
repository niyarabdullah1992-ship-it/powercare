// Shared helpers for microphone/camera access.
// Inside an embedded preview iframe the browser blocks getUserMedia entirely —
// detecting that lets the UI guide the user to open the app in its own tab.

export const isEmbedded = () => {
  try { return window.self !== window.top; } catch { return true; }
};

export const openStandalone = () => {
  window.open(window.location.href, "_blank", "noopener");
};

// Returns a stream, or throws an Error with .code in:
// "unsupported" | "embedded" | "permission" | "device" | "failed"
export async function getMediaStream(constraints) {
  if (!navigator.mediaDevices?.getUserMedia) {
    const err = new Error("unsupported"); err.code = isEmbedded() ? "embedded" : "unsupported"; throw err;
  }
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    const err = new Error(error?.name || "failed");
    if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
      err.code = isEmbedded() ? "embedded" : "permission";
    } else if (error?.name === "NotFoundError" || error?.name === "OverconstrainedError") {
      err.code = "device";
    } else {
      err.code = "failed";
    }
    throw err;
  }
}

export const mediaErrorText = (code, ar) => {
  const texts = {
    embedded: ar
      ? "المتصفح يمنع الميكروفون/الكاميرا داخل نافذة المعاينة. افتح التطبيق في نافذة مستقلة ثم اسمح بالأذونات."
      : "The browser blocks mic/camera inside the preview window. Open the app in a standalone tab and allow permissions.",
    permission: ar
      ? "تم رفض إذن الميكروفون/الكاميرا. اسمح بالوصول من إعدادات الموقع في المتصفح ثم أعد المحاولة."
      : "Microphone/camera permission was denied. Allow access in the browser's site settings and try again.",
    device: ar
      ? "لم يتم العثور على ميكروفون أو كاميرا على هذا الجهاز."
      : "No microphone or camera was found on this device.",
    unsupported: ar
      ? "هذا المتصفح لا يدعم التسجيل. جرّب Chrome أو Safari حديثًا."
      : "This browser doesn't support recording. Try a recent Chrome or Safari.",
    failed: ar
      ? "تعذر بدء التسجيل. أعد المحاولة."
      : "Could not start recording. Please try again.",
    connection: ar
      ? "تعذر الاتصال بالمكالمة. أعد المحاولة."
      : "Could not connect the call. Please try again.",
  };
  return texts[code] || texts.failed;
};