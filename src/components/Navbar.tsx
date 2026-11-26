"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked, Building2, FileText, Scale } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Tabwib & Produk Hukum", icon: BookMarked },
  { href: "/pustaka-pdf", label: "Pustaka PDF", icon: FileText },
  { href: "/lembaga", label: "Lembaga & Otoritas", icon: Building2 },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[#e4e0d5] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f3d2e] to-[#08241b] text-[#e5c07b] shadow-sm ring-1 ring-[#b4842e]/40 transition-transform group-hover:scale-105">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-[#0f3d2e]">
                Khazanah Hukum Islam
              </span>
              <span className="hidden rounded-full bg-[#fbf4e4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8f651d] ring-1 ring-[#b4842e]/30 sm:inline-block">
                KHI · KHES · PA/MA
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#52615b]">
              Kompilasi Hukum, Ekonomi Syariah &amp; Putusan Peradilan Agama RI
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-1.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/" || pathname.startsWith("/dokumen/")
                : pathname.startsWith(href) ||
                  (href === "/pustaka-pdf" && pathname.startsWith("/pdf/"));
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  active
                    ? "bg-[#0f3d2e] text-white shadow-xs"
                    : "text-[#31423b] hover:bg-[#eaf3ef] hover:text-[#0f3d2e]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
