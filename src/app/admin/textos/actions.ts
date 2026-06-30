"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setConfigValues } from "@/lib/db";

// Claves de texto simple: el name del input coincide con la clave de config.
const PLAIN_KEYS = [
  "site.brand",
  "site.title",
  "site.description",
  "hero.eyebrow",
  "hero.titleBefore",
  "hero.titleAccent",
  "hero.titleAfter",
  "hero.lede",
  "hero.ctaPrimary",
  "hero.ctaSecondaryLabel",
  "hero.ctaSecondaryUrl",
  "approach.tag",
  "approach.heading",
  "approach.intro",
  "projects.tag",
  "projects.heading",
  "projects.intro",
  "stack.tag",
  "stack.heading",
  "stack.intro",
  "contact.tag",
  "contact.heading",
  "contact.intro",
  "contact.email",
  "contact.whatsapp",
  "contact.github",
  "footer.left",
  "footer.right",
];

function linesToArray(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function saveTextsAction(formData: FormData) {
  const data: Record<string, string> = {};

  for (const key of PLAIN_KEYS) {
    data[key] = String(formData.get(key) ?? "").trim();
  }

  // hero.chips — una por línea
  data["hero.chips"] = JSON.stringify(linesToArray(String(formData.get("hero.chips") ?? "")));

  // approach.cells — N bloques con título + texto
  const cellCount = Number(formData.get("cellCount") ?? 0);
  const cells: { title: string; text: string }[] = [];
  for (let i = 0; i < cellCount; i++) {
    const title = String(formData.get(`cell_${i}_title`) ?? "").trim();
    const text = String(formData.get(`cell_${i}_text`) ?? "").trim();
    if (title || text) cells.push({ title, text });
  }
  data["approach.cells"] = JSON.stringify(cells);

  // stack.groups — N grupos con título + items (uno por línea)
  const groupCount = Number(formData.get("groupCount") ?? 0);
  const groups: { title: string; items: string[] }[] = [];
  for (let i = 0; i < groupCount; i++) {
    const title = String(formData.get(`group_${i}_title`) ?? "").trim();
    const items = linesToArray(String(formData.get(`group_${i}_items`) ?? ""));
    if (title || items.length) groups.push({ title, items });
  }
  data["stack.groups"] = JSON.stringify(groups);

  try {
    await setConfigValues(data);
  } catch (e) {
    const msg = encodeURIComponent(String(e instanceof Error ? e.message : e).slice(0, 300));
    redirect(`/admin/textos?error=${msg}`);
  }
  revalidatePath("/");
  redirect("/admin/textos?ok=1");
}
