import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Sirve las capturas de cada proyecto. En producción (Netlify) las lee de
// Netlify Blobs; en desarrollo las lee de public/images/. El nombre de archivo
// (sin extensión) es el "slot" = id del proyecto.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filename = segments.join("/");
  const slot = filename.replace(/\.[^.]+$/, ""); // quita la extensión

  if (process.env.NETLIFY) {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("site-images");
    const data = await store.get(slot, { type: "arrayBuffer" });
    if (!data) return new NextResponse(null, { status: 404 });
    return new NextResponse(data, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  // Desarrollo local: leer desde public/images/
  const { readFile } = await import("fs/promises");
  const { join } = await import("path");
  try {
    const data = await readFile(join(process.cwd(), "public", "images", filename));
    return new NextResponse(data, { headers: { "Content-Type": "image/jpeg" } });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
