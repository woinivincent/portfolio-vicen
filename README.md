# Portfolio Vicente Woinilowicz — fullstack

Portfolio personal con **panel de administración** para editar proyectos, textos
y subir capturas sin tocar código. Mismo diseño del sitio original, ahora
data-driven sobre SQLite y desplegable en Netlify.

## Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **SQLite** (`better-sqlite3`) con fallback automático a datos de ejemplo
- **Netlify Blobs** para las imágenes en producción
- Deploy en **Netlify** con `@netlify/plugin-nextjs`

## Desarrollo local

```bash
npm install
npm run dev      # http://localhost:3000
```

- Sitio público: `/`
- Panel de admin: `/admin` (te pide contraseña)
- En local la DB es el archivo `portfolio.db` y las imágenes van a `public/images/`.

## Acceso al admin

La contraseña por defecto es `vicen2026`. **Cambiala** en producción definiendo la
variable de entorno `ADMIN_PASSWORD` en Netlify (Site configuration → Environment
variables). El acceso se guarda en una cookie httpOnly por 7 días.

## ¿Qué se puede editar desde `/admin`?

- **Proyectos**: crear, editar, reordenar (flechas), borrar y subir la captura de cada uno.
- **Textos**: hero, sección de enfoque, encabezados, stack/capacidades, contacto y pie.

## Deploy en Netlify

1. Subí el proyecto a un repo de GitHub.
2. En Netlify: **Add new site → Import from Git** y elegí el repo.
3. Netlify detecta `netlify.toml` (build `npm run build`, plugin de Next).
4. En **Environment variables** agregá `ADMIN_PASSWORD` con tu contraseña.
5. Deploy. Las imágenes que subas desde el admin se guardan en **Netlify Blobs**
   (no en el repo) y se sirven vía `/images/<id>.jpg`.

> Nota: la DB SQLite en Netlify vive en `/tmp` (efímera por instancia). El contenido
> editado persiste mientras la instancia está caliente; los datos base siempre están
> garantizados por el seed. Para persistencia permanente multi-instancia, migrar a
> Netlify Blobs/DB o Postgres (ver `src/lib/db.ts`).

## Conectar el dominio vicenw.com

En Netlify: **Domain management → Add a domain → vicenw.com** y seguí el asistente
(apuntar registros A/CNAME en Namecheap, o usar los nameservers de Netlify). El SSL
(Let's Encrypt) se emite solo; activá **Force HTTPS**.

## Estructura

```
src/
├─ app/
│  ├─ page.tsx              # sitio público (lee de la DB)
│  ├─ layout.tsx            # metadata + fuentes
│  ├─ globals.css           # diseño completo
│  ├─ api/img/[...path]/    # sirve imágenes (Blobs/fs)
│  └─ admin/                # panel: login, proyectos, textos
├─ lib/
│  ├─ db.ts                 # SQLite + seed + CRUD
│  ├─ auth.ts               # sesión por cookie
│  └─ images.ts             # guardar/borrar imágenes
└─ middleware.ts            # protege /admin
```
