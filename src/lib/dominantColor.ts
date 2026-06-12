"use client";

export async function extractDominantColor(imageUrl: string): Promise<string> {
  // Try canvas approach first (fast, no server roundtrip)
  try {
    const color = await tryCanvasExtract(imageUrl);
    if (color) return color;
  } catch {
    // canvas failed (likely CORS), fall through to server
  }

  // Fallback: use server-side API route (no CORS restrictions)
  try {
    const res = await fetch(`/api/color-extract?url=${encodeURIComponent(imageUrl)}`);
    if (!res.ok) return "";
    const { color } = await res.json();
    return color || "";
  } catch {
    return "";
  }
}

function tryCanvasExtract(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 50;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(""); return; }
        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size).data;
        const color = extractFromBuffer(imageData);
        resolve(color);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("Image load failed"));
  });
}

function extractFromBuffer(data: Uint8ClampedArray): string {
  const colorBuckets: Record<string, { r: number; g: number; b: number; count: number }> = {};
  for (let i = 0; i < data.length; i += 16) {
    const r = Math.round(data[i] / 48) * 48;
    const g = Math.round(data[i + 1] / 48) * 48;
    const b = Math.round(data[i + 2] / 48) * 48;
    const key = `${r},${g},${b}`;
    if (!colorBuckets[key]) colorBuckets[key] = { r, g, b, count: 0 };
    colorBuckets[key].count++;
  }
  let maxCount = 0;
  let dominant = { r: 100, g: 50, b: 150 };
  for (const key in colorBuckets) {
    if (colorBuckets[key].count > maxCount) {
      maxCount = colorBuckets[key].count;
      dominant = colorBuckets[key];
    }
  }
  return `hsl(${rgbToHue(dominant.r, dominant.g, dominant.b)}, 50%, 30%)`;
}

function rgbToHue(r: number, g: number, b: number): number {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  if (max !== min) {
    const d = max - min;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return Math.round(h);
}
