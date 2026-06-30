import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getProjects } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAuth();
  const projects = getProjects();

  return (
    <>
      <h1 className="admin-h1">Panel de administración</h1>
      <p className="admin-sub">Gestioná el contenido del portfolio sin tocar código.</p>

      <div className="panel">
        <div className="panel-title">Proyectos</div>
        <div className="panel-desc">
          {projects.length} {projects.length === 1 ? "proyecto" : "proyectos"} publicados. Editá,
          reordená, agregá o quitá tarjetas, y subí las capturas.
        </div>
        <Link href="/admin/proyectos" className="btn btn-primary btn-sm">
          Gestionar proyectos
        </Link>
      </div>

      <div className="panel">
        <div className="panel-title">Textos del sitio</div>
        <div className="panel-desc">
          Hero, sección de enfoque, stack, datos de contacto y pie de página.
        </div>
        <Link href="/admin/textos" className="btn btn-primary btn-sm">
          Editar textos
        </Link>
      </div>
    </>
  );
}
