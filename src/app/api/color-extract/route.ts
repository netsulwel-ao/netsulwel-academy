import { NextRequest, NextResponse } from "next/server";
import { Jimp, intToRGBA } from "jimp";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const imageUrl = req.nextUrl.searchParams.get("url");
  if (!imageUrl) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const image = await Jimp.read(imageUrl);
    image.resize({ w: 50, h: 50 });

    const colorBuckets: Record<string, { r: number; g: number; b: number; count: number }> = {};
    for (let x = 0; x < image.bitmap.width; x++) {
      for (let y = 0; y < image.bitmap.height; y++) {
        const hex = image.getPixelColor(x, y);
        const { r, g, b } = intToRGBA(hex);
        const qr = Math.round(r / 48) * 48;
        const qg = Math.round(g / 48) * 48;
        const qb = Math.round(b / 48) * 48;
        const key = `${qr},${qg},${qb}`;
        if (!colorBuckets[key]) colorBuckets[key] = { r: qr, g: qg, b: qb, count: 0 };
        colorBuckets[key].count++;
      }
    }

    let maxCount = 0;
    let dominant = { r: 100, g: 50, b: 150 };
    for (const key in colorBuckets) {
      if (colorBuckets[key].count > maxCount) {
        maxCount = colorBuckets[key].count;
        dominant = colorBuckets[key];
      }
    }

    const hue = rgbToHue(dominant.r, dominant.g, dominant.b);
    return NextResponse.json({ color: `hsl(${hue}, 50%, 30%)` });
  } catch (err) {
    console.error("Color extraction failed:", err);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
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
