import "server-only";
import { USE_BLOBS } from "./runtime";

// Guarda una imagen bajo un "slot" (= id del proyecto). En Netlify va a Blobs;
// en local va a public/images/<slot>.jpg. La lectura la hace /api/img.
export async function saveImage(slot: string, file: File): Promise<void> {
  if (!file || file.size === 0) throw new Error("No se seleccionó ningún archivo");
  if (file.size > 10 * 1024 * 1024) throw new Error("La imagen supera el límite de 10 MB");
  if (!file.type.startsWith("image/")) throw new Error("El archivo no es una imagen");

  const bytes = await file.arrayBuffer();

  if (USE_BLOBS) {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("site-images");
    await store.set(slot, bytes, { metadata: { contentType: file.type } });
  } else {
    const { writeFile, mkdir } = await import("fs/promises");
    const { existsSync } = await import("fs");
    const { join } = await import("path");
    const dir = join(process.cwd(), "public", "images");
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    await writeFile(join(dir, `${slot}.jpg`), Buffer.from(bytes));
  }
}

export async function deleteImage(slot: string): Promise<void> {
  if (USE_BLOBS) {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("site-images");
    await store.delete(slot).catch(() => {});
  } else {
    const { unlink } = await import("fs/promises");
    const { join } = await import("path");
    await unlink(join(process.cwd(), "public", "images", `${slot}.jpg`)).catch(() => {});
  }
}
