import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  async rewrites() {
    // Si /images/foo.jpg no existe como archivo estático en el CDN, la petición
    // llega al servidor y este rewrite la deriva al API route, que sirve la imagen
    // desde Netlify Blobs (producción) o del filesystem local (desarrollo).
    return [{ source: "/images/:path*", destination: "/api/img/:path*" }];
  },
};

export default nextConfig;
