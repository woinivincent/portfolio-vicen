// Decide qué backend de almacenamiento usar.
//
// En producción (deploy en Netlify) usamos Netlify Blobs, que es persistente y
// escribible. En desarrollo local usamos el filesystem.
//
// IMPORTANTE: NO usar `process.env.NETLIFY` para esto. Esa variable existe durante
// el BUILD pero NO está presente de forma confiable en el RUNTIME de las funciones
// de Next.js en Netlify (AWS Lambda). Si se gatea con ella, en producción se intenta
// escribir en el filesystem de solo-lectura del Lambda y se obtiene:
//   EROFS: read-only file system, open '/var/task/...'
// `NODE_ENV === "production"` sí es confiable tanto en build como en runtime.
export const USE_BLOBS = process.env.NODE_ENV === "production";
