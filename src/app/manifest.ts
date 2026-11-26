import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Khazanah Hukum Islam, Ekonomi Syariah & Peradilan Agama",
    short_name: "Khazanah Hukum Islam",
    description:
      "Repositori online Kompilasi Hukum Islam (KHI), KHES, Fatwa DSN-MUI, Regulasi Keuangan Syariah, Rumusan Kamar Agama MA RI & Putusan Peradilan Agama.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f4",
    theme_color: "#0f3d2e",
    lang: "id",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
