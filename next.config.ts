import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  // Los Server Actions cortan el body en 1 MB por defecto; las capturas pueden
  // pesar más. Lo subimos para permitir la subida de imágenes desde el admin.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async rewrites() {
    // Si /images/foo.jpg no existe como archivo estático en el CDN, la petición
    // llega al servidor y este rewrite la deriva al API route, que sirve la imagen
    // desde Netlify Blobs (producción) o del filesystem local (desarrollo).
    return [{ source: "/images/:path*", destination: "/api/img/:path*" }];
  },
};

export default nextConfig;
