import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { logoutAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // El login se muestra sin el shell (pantalla completa). El middleware ya
  // redirige a /admin/login a quien no tenga sesión, así que el shell solo
  // aparece para usuarios autenticados.
  if (!(await isAuthenticated())) {
    return <>{children}</>;
  }

  return (
    <div className="admin-shell">
      <header className="admin-top">
        <div className="admin-top-in">
          <div className="admin-brand">
            <span className="dot" />
            Admin · vicenw.com
          </div>
          <nav className="admin-nav">
            <Link href="/admin">Inicio</Link>
            <Link href="/admin/proyectos">Proyectos</Link>
            <Link href="/admin/textos">Textos</Link>
            <a href="/" target="_blank" rel="noopener">
              Ver sitio ↗
            </a>
            <form action={logoutAction} style={{ display: "inline" }}>
              <button type="submit" className="admin-nav-logout" style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", font: "inherit" }}>
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}
