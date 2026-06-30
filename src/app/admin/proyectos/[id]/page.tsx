import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getProject } from "@/lib/db";
import {
  saveProjectAction,
  uploadProjectImageAction,
  deleteProjectImageAction,
} from "../actions";
import ConfirmButton from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

const ERR_MSG: Record<string, string> = {
  titulo: "El título es obligatorio.",
  duplicado: "Ya existe un proyecto con ese identificador (slug). Usá otro.",
};

function showError(code: string): string {
  return ERR_MSG[code] ?? decodeURIComponent(code);
}
const OK_MSG: Record<string, string> = {
  img: "Imagen actualizada.",
  imgdel: "Imagen eliminada.",
};

export default async function ProyectoEditor({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const { ok, error } = await searchParams;
  const isNew = id === "nuevo";

  const project = isNew ? undefined : await getProject(id);
  if (!isNew && !project) notFound();

  const statuses: { value: string; label: string }[] = [
    { value: "live", label: "En vivo (verde)" },
    { value: "prod", label: "En producción (azul)" },
    { value: "done", label: "Entregado / Funcional (gris)" },
  ];

  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <Link href="/admin/proyectos" className="btn btn-link btn-sm">
          ← Volver a proyectos
        </Link>
      </div>
      <h1 className="admin-h1">{isNew ? "Nuevo proyecto" : `Editar: ${project!.titulo}`}</h1>
      <p className="admin-sub">
        {isNew
          ? "Completá los datos. Después de crearlo vas a poder subir la captura."
          : "Modificá el contenido de la tarjeta."}
      </p>

      {error && <div className="flash flash-err">{showError(error)}</div>}
      {ok && <div className="flash flash-ok">{OK_MSG[ok] ?? "Listo."}</div>}

      <form action={saveProjectAction} className="panel">
        <input type="hidden" name="mode" value={isNew ? "create" : "edit"} />
        {!isNew && <input type="hidden" name="id" value={project!.id} />}

        {isNew && (
          <div className="field">
            <label htmlFor="id">Identificador (slug)</label>
            <input
              id="id"
              name="id"
              placeholder="ej: mi-proyecto (se usa para la imagen). Si lo dejás vacío se genera del título."
            />
            <span className="hint">Solo minúsculas, números y guiones. No se puede cambiar después.</span>
          </div>
        )}

        <div className="field">
          <label htmlFor="titulo">Título</label>
          <input id="titulo" name="titulo" defaultValue={project?.titulo ?? ""} required />
        </div>

        <div className="field">
          <label htmlFor="role">Subtítulo / rol</label>
          <input
            id="role"
            name="role"
            defaultValue={project?.role ?? ""}
            placeholder="ej: Sitio corporativo · desarrollo + deploy"
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="status">Estado</label>
            <select id="status" name="status" defaultValue={project?.status ?? "done"}>
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="statusLabel">Texto del estado</label>
            <input
              id="statusLabel"
              name="statusLabel"
              defaultValue={project?.statusLabel ?? ""}
              placeholder="ej: En vivo, Entregado, Funcional…"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="problem">El reto</label>
          <textarea id="problem" name="problem" defaultValue={project?.problem ?? ""} />
        </div>

        <div className="field">
          <label htmlFor="features">Lo que construí (una línea por ítem)</label>
          <textarea
            id="features"
            name="features"
            rows={5}
            defaultValue={project?.features.join("\n") ?? ""}
            placeholder={"Área privada de socios…\nPanel de administración…"}
          />
        </div>

        <div className="field">
          <label htmlFor="stack">Stack / tecnologías (una por línea)</label>
          <textarea
            id="stack"
            name="stack"
            rows={4}
            defaultValue={project?.stack.join("\n") ?? ""}
            placeholder={"Next.js\nReact\nTypeScript"}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="linkUrl">Enlace (opcional)</label>
            <input
              id="linkUrl"
              name="linkUrl"
              defaultValue={project?.linkUrl ?? ""}
              placeholder="https://…"
            />
          </div>
          <div className="field">
            <label htmlFor="linkLabel">Texto del enlace</label>
            <input
              id="linkLabel"
              name="linkLabel"
              defaultValue={project?.linkLabel ?? ""}
              placeholder="ej: nasellocables.com"
            />
          </div>
        </div>

        <div className="admin-actions">
          <button type="submit" className="btn btn-primary btn-sm">
            {isNew ? "Crear proyecto" : "Guardar cambios"}
          </button>
          <Link href="/admin/proyectos" className="btn btn-link btn-sm">
            Cancelar
          </Link>
        </div>
      </form>

      {!isNew && project && (
        <div className="panel">
          <div className="panel-title">Captura del proyecto</div>
          <div className="panel-desc">
            Proporción 16:10 (ej. 1280×800 px), formato JPG/PNG/WebP, hasta 10 MB. La imagen se
            alinea al borde superior.
          </div>
          {project.imageVersion > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="img-preview"
              src={`/images/${project.id}.jpg?v=${project.imageVersion}`}
              alt="Captura actual"
            />
          ) : (
            <div className="img-preview" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)", fontSize: ".85rem" }}>
              Sin imagen
            </div>
          )}
          <form
            action={uploadProjectImageAction}
            encType="multipart/form-data"
            style={{ marginTop: 16 }}
          >
            <input type="hidden" name="id" value={project.id} />
            <div className="field">
              <label htmlFor="image">Reemplazar imagen</label>
              <input id="image" name="image" type="file" accept="image/*" required />
            </div>
            <div className="admin-actions">
              <button type="submit" className="btn btn-primary btn-sm">
                Subir captura
              </button>
            </div>
          </form>
          <form action={deleteProjectImageAction} style={{ marginTop: 10 }}>
            <input type="hidden" name="id" value={project.id} />
            <ConfirmButton
              className="btn btn-danger btn-sm"
              message="¿Quitar la captura de este proyecto?"
            >
              Quitar imagen
            </ConfirmButton>
          </form>
        </div>
      )}
    </>
  );
}
