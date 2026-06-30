# Portfolio Vicente Woinilowicz — fullstack

Portfolio personal con **panel de administración** para editar proyectos, textos
y subir capturas sin tocar código. Mismo diseño del sitio original, ahora
data-driven sobre SQLite y desplegable en Netlify.

## Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Netlify Blobs** como almacenamiento persistente: el contenido (proyectos +
  textos) se guarda como un documento JSON, y las imágenes en un store aparte
- Fallback automático a datos de ejemplo si el backend no está disponible
- Deploy en **Netlify** con `@netlify/plugin-nextjs` (sin dependencias nativas)

## Desarrollo local

```bash
npm install
npm run dev      # http://localhost:3000
```

- Sitio público: `/`
- Panel de admin: `/admin` (te pide contraseña)
- En local el contenido se guarda en `portfolio-data.json` y las imágenes en
  `public/images/` (ambos ignorados por git). En producción todo va a Netlify Blobs.

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
5. Deploy. Tanto el contenido que edites como las imágenes que subas se guardan en
   **Netlify Blobs** (no en el repo). Las ediciones son **persistentes** y se
   comparten entre instancias; el sitio lee el documento en cada request, así que
   los cambios se ven al instante. El seed solo se usa la primera vez (o si el
   documento se borra).

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
│  ├─ db.ts                 # contenido en Netlify Blobs/JSON + seed + CRUD
│  ├─ auth.ts               # sesión por cookie
│  └─ images.ts             # guardar/borrar imágenes
└─ middleware.ts            # protege /admin
```
