"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createProject,
  deleteProject,
  getProject,
  moveProject,
  updateProject,
  type ProjectStatus,
} from "@/lib/db";
import { deleteImage, saveImage } from "@/lib/images";

function linesToArray(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

const STATUSES: ProjectStatus[] = ["live", "prod", "done"];

export async function saveProjectAction(formData: FormData) {
  const mode = String(formData.get("mode") ?? "create");
  const rawStatus = String(formData.get("status") ?? "done") as ProjectStatus;
  const status = STATUSES.includes(rawStatus) ? rawStatus : "done";

  const data = {
    titulo: String(formData.get("titulo") ?? "").trim(),
    role: String(formData.get("role") ?? "").trim(),
    status,
    statusLabel: String(formData.get("statusLabel") ?? "").trim() || "Entregado",
    problem: String(formData.get("problem") ?? "").trim(),
    features: linesToArray(String(formData.get("features") ?? "")),
    stack: linesToArray(String(formData.get("stack") ?? "")),
    linkUrl: String(formData.get("linkUrl") ?? "").trim(),
    linkLabel: String(formData.get("linkLabel") ?? "").trim(),
  };

  if (!data.titulo) redirect("/admin/proyectos/nuevo?error=titulo");

  if (mode === "edit") {
    const id = String(formData.get("id") ?? "");
    if (!(await getProject(id))) redirect("/admin/proyectos?error=notfound");
    await updateProject(id, data);
  } else {
    const requested = String(formData.get("id") ?? "").trim();
    const id = slugify(requested || data.titulo) || `proj-${Date.now()}`;
    if (await getProject(id)) redirect(`/admin/proyectos/nuevo?error=duplicado`);
    await createProject({ ...data, id });
  }

  revalidatePath("/");
  revalidatePath("/admin/proyectos");
  redirect("/admin/proyectos?ok=1");
}

export async function uploadProjectImageAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!(await getProject(id))) redirect("/admin/proyectos?error=notfound");
  const file = formData.get("image") as File;
  await saveImage(id, file);
  revalidatePath("/");
  redirect(`/admin/proyectos/${id}?ok=img`);
}

export async function deleteProjectImageAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await deleteImage(id);
  revalidatePath("/");
  redirect(`/admin/proyectos/${id}?ok=imgdel`);
}

export async function deleteProjectAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await deleteProject(id);
  await deleteImage(id);
  revalidatePath("/");
  revalidatePath("/admin/proyectos");
  redirect("/admin/proyectos?ok=del");
}

export async function moveProjectAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const dir = String(formData.get("dir") ?? "up") as "up" | "down";
  await moveProject(id, dir);
  revalidatePath("/");
  redirect("/admin/proyectos");
}
