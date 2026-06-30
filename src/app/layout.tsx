import type { Metadata } from "next";
import { getAllConfig } from "@/lib/db";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const c = getAllConfig();
  const title = c["site.title"] || "Portfolio";
  const description = c["site.description"] || "";
  return {
    title,
    description,
    metadataBase: new URL("https://vicenw.com"),
    openGraph: {
      type: "website",
      url: "https://vicenw.com/",
      title,
      description,
      locale: "es_AR",
      images: [{ url: "/assets/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/assets/og-image.png"],
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/assets/favicon-32.png", type: "image/png", sizes: "32x32" },
      ],
      apple: [{ url: "/assets/favicon-180.png", sizes: "180x180" }],
    },
  };
}

export const viewport = { themeColor: "#155080" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
