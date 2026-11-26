import type { Metadata, Viewport } from "next";
import { Amiri, Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { PwaRegister } from "@/components/PwaRegister";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Khazanah Hukum Islam & Peradilan Agama — KHI, KHES, DSN-MUI & Putusan MA/PA",
    template: "%s | Khazanah Hukum Islam & Peradilan Agama",
  },
  description:
    "Repositori digital online Kompilasi Hukum Islam (KHI), Kompilasi Hukum Ekonomi Syariah (KHES), Fatwa DSN-MUI, Regulasi OJK/BI/BWI/Kemenag, Rumusan Pleno Kamar Agama MA RI (2012–2025), dan Putusan Pengadilan Agama / PTA.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-512.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f3d2e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} ${sourceSerif.variable} ${amiri.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-[#faf8f4] text-[#17231e]">
        <PwaRegister />
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="mt-14 border-t border-[#e4e0d5] bg-[#0f3d2e] text-emerald-100/90">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-4 py-8 text-xs sm:flex-row sm:items-center sm:px-6 lg:px-8">
            <div>
              <p className="font-bold text-white">
                Khazanah Hukum Islam, Ekonomi Syariah &amp; Peradilan Agama RI
              </p>
              <p className="mt-1 text-emerald-200/80">
                100% dokumen resmi lembaga · Full-online streaming tanpa menyimpan PDF ke perangkat · Sumber: JDIH BPK RI, Kepaniteraan &amp; Badilag MA RI, PTA/PA, DSN-MUI, BWI &amp; JDIH Aceh.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-emerald-200/90">
              <span className="rounded-full border border-amber-400/35 bg-amber-400/10 px-3 py-1 font-semibold text-amber-200">
                PWA Ringan · 100% Online
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
