import { getAllConfig, getProjects } from "@/lib/db";
import ProjectThumb from "@/components/ProjectThumb";

export const dynamic = "force-dynamic";

function parseJSON<T>(s: string | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export default async function Home() {
  const c = await getAllConfig();
  const projects = await getProjects();

  const chips = parseJSON<string[]>(c["hero.chips"], []);
  const cells = parseJSON<{ title: string; text: string }[]>(c["approach.cells"], []);
  const groups = parseJSON<{ title: string; items: string[] }[]>(c["stack.groups"], []);

  const whatsapp = c["contact.whatsapp"]?.replace(/\D/g, "");

  return (
    <>
      <nav className="nav">
        <div className="wrap nav-in">
          <a href="#top" className="brand">
            <span className="dot" />
            {c["site.brand"]}
          </a>
          <div className="nav-links">
            <a href="#enfoque">Enfoque</a>
            <a href="#proyectos">Proyectos</a>
            <a href="#stack">Stack</a>
            <a href="#contacto">Contacto</a>
          </div>
        </div>
      </nav>

      <header className="hero" id="top">
        <div className="wrap">
          <div className="eyebrow">{c["hero.eyebrow"]}</div>
          <h1>
            {c["hero.titleBefore"]} <span className="accent">{c["hero.titleAccent"]}</span>{" "}
            {c["hero.titleAfter"]}
          </h1>
          <p className="lede">{c["hero.lede"]}</p>
          {chips.length > 0 && (
            <div className="stack-row">
              {chips.map((ch, i) => (
                <span className="chip" key={i}>
                  {ch}
                </span>
              ))}
            </div>
          )}
          <div className="cta-row">
            <a href="#proyectos" className="btn btn-primary">
              {c["hero.ctaPrimary"]}
            </a>
            {c["hero.ctaSecondaryUrl"] && (
              <a
                href={c["hero.ctaSecondaryUrl"]}
                target="_blank"
                rel="noopener"
                className="btn btn-ghost"
              >
                {c["hero.ctaSecondaryLabel"]}
              </a>
            )}
          </div>
        </div>
      </header>

      <section className="approach" id="enfoque">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-tag">{c["approach.tag"]}</span>
            <h2>{c["approach.heading"]}</h2>
            <p>{c["approach.intro"]}</p>
          </div>
          <div className="approach-grid">
            {cells.map((cell, i) => (
              <div className="ap-cell" key={i}>
                <div className="ap-num">{String(i + 1).padStart(2, "0")}</div>
                <h3>{cell.title}</h3>
                <p>{cell.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="projects" id="proyectos">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-tag">{c["projects.tag"]}</span>
            <h2>{c["projects.heading"]}</h2>
            <p>{c["projects.intro"]}</p>
          </div>
          <div className="proj-grid">
            {projects.map((p) => (
              <article className="card" key={p.id}>
                <ProjectThumb id={p.id} titulo={p.titulo} />
                <div className="card-body">
                  <div className="card-top">
                    <div>
                      <h3>{p.titulo}</h3>
                      <div className="role">{p.role}</div>
                    </div>
                    <span className={`status ${p.status}`}>{p.statusLabel}</span>
                  </div>
                  {p.problem && (
                    <div className="problem">
                      <span className="lbl">El reto</span>
                      <p>{p.problem}</p>
                    </div>
                  )}
                  {p.features.length > 0 && (
                    <>
                      <span className="feat-lbl">Lo que construí</span>
                      <ul className="feat">
                        {p.features.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {p.stack.length > 0 && (
                    <div className="card-stack">
                      {p.stack.map((t, i) => (
                        <span className="tech" key={i}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {p.linkUrl && (
                    <a href={p.linkUrl} target="_blank" rel="noopener" className="card-link">
                      {p.linkLabel || p.linkUrl} <span className="arrow">↗</span>
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="caps" id="stack">
        <div className="wrap">
          <div className="sec-head">
            <span className="sec-tag">{c["stack.tag"]}</span>
            <h2>{c["stack.heading"]}</h2>
            <p>{c["stack.intro"]}</p>
          </div>
          <div className="caps-grid">
            {groups.map((g, i) => (
              <div className="cap-block" key={i}>
                <h3>{g.title}</h3>
                <div className="cap-list">
                  {g.items.map((it, j) => (
                    <span key={j}>{it}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="contact" id="contacto">
        <div className="wrap">
          <div className="contact-card">
            <span className="sec-tag">{c["contact.tag"]}</span>
            <h2>{c["contact.heading"]}</h2>
            <p>{c["contact.intro"]}</p>
            <div className="links">
              {c["contact.email"] && (
                <a href={`mailto:${c["contact.email"]}`} className="link-pill">
                  ✉ {c["contact.email"]}
                </a>
              )}
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener"
                  className="link-pill"
                >
                  WhatsApp
                </a>
              )}
              {c["contact.github"] && (
                <a href={c["contact.github"]} target="_blank" rel="noopener" className="link-pill">
                  GitHub
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap foot-in">
          <span>{c["footer.left"]}</span>
          <span>{c["footer.right"]}</span>
        </div>
      </footer>
    </>
  );
}
