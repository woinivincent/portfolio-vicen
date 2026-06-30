"use server";

import { redirect } from "next/navigation";
import { ADMIN_PASSWORD, setAdminSession } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/admin");

  if (password !== ADMIN_PASSWORD) {
    redirect("/admin/login?error=1");
  }

  await setAdminSession();
  redirect(from.startsWith("/admin") ? from : "/admin");
}
