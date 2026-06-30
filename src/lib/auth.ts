import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "vicen_admin";
// Cambiá la contraseña con la variable de entorno ADMIN_PASSWORD en Netlify.
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "vicen2026";

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === "1";
}

export async function requireAuth() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function setAdminSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
