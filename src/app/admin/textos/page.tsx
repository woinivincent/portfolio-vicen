import { requireAuth } from "@/lib/auth";
import { getAllConfig } from "@/lib/db";
import { saveTextsAction } from "./actions";

export const dynamic = "force-dynamic";

function parseJSON<T>(s: string | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export default async function TextosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  await requireAuth();
  const c = await getAllConfig();
  const { ok } = await searchParams;

  const chips = parseJSON<string[]>(c["hero.chips"], []);
  const cells = parseJSON<{ title: string; text: string }[]>(c["approach.cells"], []);
  const groups = parseJSON<{ title: string; items: string[] }[]>(c["stack.groups"], []);

  const F = ({
    name,
    label,
    hint,
    textarea,
  }: {
    name: string;
    label: string;
    hint?: string;
    textarea?: boolean;
  }) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {textarea ? (
        <textarea id={name} name={name} defaultValue={c[name] ?? ""} />
      ) : (
        <input id={name} name={name} defaultValue={c[name] ?? ""} />
      )}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );

  return (
    <>
      <h1 className="admin-h1">Textos del sitio</h1>
      <p className="admin-sub">Todo lo que aparece en la página, editable desde acá.</p>
      {ok && <div className="flash flash-ok">Cambios guardados.</div>}

      <form action={saveTextsAction}>
        <input type="hidden" name="cellCount" value={cells.length} />
        <input type="hidden" name="groupCount" value={groups.length} />

        <div className="panel">
          <div className="panel-title">Identidad y SEO</div>
          <div className="panel-desc">Marca de la barra superior y metadatos para buscadores / redes.</div>
          <F name="site.brand" label="Marca (nav)" />
          <F name="site.title" label="Título de la pestaña / SEO" />
          <F name="site.description" label="Descripción SEO" textarea />
        </div>

        <div className="panel">
          <div className="panel-title">Hero (encabezado principal)</div>
          <F name="hero.eyebrow" label="Eyebrow (texto pequeño arriba)" />
          <div className="field-row">
            <F name="hero.titleBefore" label="Título — antes del resaltado" />
            <F name="hero.titleAccent" label="Título — palabra resaltada (azul)" />
          </div>
          <F name="hero.titleAfter" label="Título — después del resaltado" />
          <F name="hero.lede" label="Bajada (lede)" textarea />
          <div className="field">
            <label htmlFor="hero.chips">Chips de tecnologías (una por línea)</label>
            <textarea id="hero.chips" name="hero.chips" defaultValue={chips.join("\n")} />
            <span className="hint">Aparecen como etiquetas debajo de la bajada.</span>
          </div>
          <div className="field-row">
            <F name="hero.ctaPrimary" label="Botón principal (texto)" />
            <F name="hero.ctaSecondaryLabel" label="Botón secundario (texto)" />
          </div>
          <F name="hero.ctaSecondaryUrl" label="Botón secundario (URL)" hint="Dejá vacío para ocultarlo." />
        </div>

        <div className="panel">
          <div className="panel-title">Sección «Enfoque»</div>
          <F name="approach.tag" label="Etiqueta (// cómo trabajo)" />
          <F name="approach.heading" label="Título" />
          <F name="approach.intro" label="Introducción" textarea />
          {cells.map((cell, i) => (
            <div className="field-row" key={i} style={{ borderTop: "1px dashed var(--line)", paddingTop: 14 }}>
              <div className="field">
                <label htmlFor={`cell_${i}_title`}>Bloque {i + 1} — título</label>
                <input id={`cell_${i}_title`} name={`cell_${i}_title`} defaultValue={cell.title} />
              </div>
              <div className="field">
                <label htmlFor={`cell_${i}_text`}>Bloque {i + 1} — texto</label>
                <textarea id={`cell_${i}_text`} name={`cell_${i}_text`} defaultValue={cell.text} />
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-title">Encabezado de «Proyectos»</div>
          <div className="panel-desc">Las tarjetas se gestionan en la sección Proyectos.</div>
          <F name="projects.tag" label="Etiqueta" />
          <F name="projects.heading" label="Título" />
          <F name="projects.intro" label="Introducción" textarea />
        </div>

        <div className="panel">
          <div className="panel-title">Sección «Stack y capacidades»</div>
          <F name="stack.tag" label="Etiqueta" />
          <F name="stack.heading" label="Título" />
          <F name="stack.intro" label="Introducción" textarea />
          {groups.map((g, i) => (
            <div key={i} style={{ borderTop: "1px dashed var(--line)", paddingTop: 14 }}>
              <div className="field">
                <label htmlFor={`group_${i}_title`}>Grupo {i + 1} — título</label>
                <input id={`group_${i}_title`} name={`group_${i}_title`} defaultValue={g.title} />
              </div>
              <div className="field">
                <label htmlFor={`group_${i}_items`}>Grupo {i + 1} — items (uno por línea)</label>
                <textarea
                  id={`group_${i}_items`}
                  name={`group_${i}_items`}
                  defaultValue={g.items.join("\n")}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-title">Contacto</div>
          <F name="contact.tag" label="Etiqueta" />
          <F name="contact.heading" label="Título" />
          <F name="contact.intro" label="Introducción" textarea />
          <div className="field-row">
            <F name="contact.email" label="Email" />
            <F name="contact.whatsapp" label="WhatsApp (solo números, con código país)" hint="Ej: 5492323462300" />
          </div>
          <F name="contact.github" label="GitHub (URL)" />
        </div>

        <div className="panel">
          <div className="panel-title">Pie de página</div>
          <div className="field-row">
            <F name="footer.left" label="Texto izquierdo" />
            <F name="footer.right" label="Texto derecho" />
          </div>
        </div>

        <div className="admin-actions" style={{ position: "sticky", bottom: 0, background: "var(--canvas)", padding: "12px 0" }}>
          <button type="submit" className="btn btn-primary">
            Guardar todos los cambios
          </button>
        </div>
      </form>
    </>
  );
}
