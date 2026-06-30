import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getProjects } from "@/lib/db";
import { moveProjectAction, deleteProjectAction } from "./actions";
import ConfirmButton from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

const OK_MSG: Record<string, string> = {
  "1": "Proyecto guardado.",
  del: "Proyecto eliminado.",
};

export default async function ProyectosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAuth();
  const projects = getProjects();
  const { ok, error } = await searchParams;

  return (
    <>
      <h1 className="admin-h1">Proyectos</h1>
      <p className="admin-sub">
        Reordená con las flechas, editá el contenido o subí la captura de cada tarjeta.
      </p>

      {ok && <div className="flash flash-ok">{OK_MSG[ok] ?? "Listo."}</div>}
      {error && <div className="flash flash-err">Ocurrió un error ({error}).</div>}

      <div style={{ marginBottom: 20 }}>
        <Link href="/admin/proyectos/nuevo" className="btn btn-primary btn-sm">
          + Nuevo proyecto
        </Link>
      </div>

      {projects.map((p, i) => (
        <div className="proj-row" key={p.id}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="proj-thumb" src={`/images/${p.id}.jpg`} alt="" />
          <div className="meta">
            <strong>{p.titulo}</strong>
            <span>
              {p.id} · {p.statusLabel}
            </span>
          </div>
          <div className="ord">
            <form action={moveProjectAction}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="dir" value="up" />
              <button className="icon-btn" type="submit" disabled={i === 0} aria-label="Subir">
                ▲
              </button>
            </form>
            <form action={moveProjectAction}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="dir" value="down" />
              <button
                className="icon-btn"
                type="submit"
                disabled={i === projects.length - 1}
                aria-label="Bajar"
              >
                ▼
              </button>
            </form>
          </div>
          <Link href={`/admin/proyectos/${p.id}`} className="btn btn-link btn-sm">
            Editar
          </Link>
          <form action={deleteProjectAction}>
            <input type="hidden" name="id" value={p.id} />
            <ConfirmButton
              className="btn btn-danger btn-sm"
              message={`¿Borrar el proyecto "${p.titulo}"? Esta acción no se puede deshacer.`}
            >
              Borrar
            </ConfirmButton>
          </form>
        </div>
      ))}

      {projects.length === 0 && (
        <div className="panel">Todavía no hay proyectos. Creá el primero.</div>
      )}
    </>
  );
}
