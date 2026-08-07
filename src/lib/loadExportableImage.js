export default async function loadExportableImage(source) {
  if (!source) return null;
  let imageSource = source;
  let objectUrl = "";

  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) throw new Error("Couldn't load the signature image.");
    objectUrl = URL.createObjectURL(await response.blob());
    imageSource = objectUrl;
  }

  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Couldn't decode the signature image."));
      image.src = imageSource;
    });
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}