const RECEIPT_KEY = "receipt_images_v1";
const MAX_ENTRIES = 20;
const MAX_WIDTH = 800;
const JPEG_QUALITY = 0.7;

function resizeImageDataUrl(dataUrl, maxWidth) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width <= maxWidth) {
        resolve(dataUrl);
        return;
      }
      const scale = maxWidth / img.width;
      const canvas = document.createElement("canvas");
      canvas.width = maxWidth;
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function readReceiptImages() {
  try {
    const raw = localStorage.getItem(RECEIPT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveReceiptImage({ filename, dataUrl }) {
  const resized = await resizeImageDataUrl(dataUrl, MAX_WIDTH);
  const entry = {
    id: `receipt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    filename,
    dataUrl: resized,
    savedAt: new Date().toISOString(),
  };
  const current = readReceiptImages();
  const updated = [entry, ...current].slice(0, MAX_ENTRIES);
  localStorage.setItem(RECEIPT_KEY, JSON.stringify(updated));
  return entry;
}

export function deleteReceiptImage(id) {
  const current = readReceiptImages();
  const updated = current.filter((r) => r.id !== id);
  localStorage.setItem(RECEIPT_KEY, JSON.stringify(updated));
}

export function clearReceiptImages() {
  localStorage.removeItem(RECEIPT_KEY);
}
