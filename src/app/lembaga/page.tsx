import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  ExternalLink,
  FileText,
  Scale,
} from "lucide-react";
import { getCatalogStats, getLembagaSummaries } from "@/lib/catalog";

export default function LembagaPage() {
  const lembagaList = getLembagaSummaries();
  const stats = getCatalogStats();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-gradient-to-br from-[#0f3d2e] to-[#08241b] p-6 text-white sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5c07b]/35 bg-[#e5c07b]/15 px-3 py-1 text-xs font-bold text-[#f3d89f]">
          <Scale className="h-3.5 w-3.5" />
          100% Otoritas &amp; Lembaga Resmi Indonesia
        </span>
        <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">
          {lembagaList.length} Pilar Lembaga Hukum Islam, Ekonomi Syariah &amp; Peradilan Agama
        </h1>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-emerald-100/90 sm:text-sm">
          Menghimpun{" "}
          <strong>{stats.total_produk.toLocaleString("id-ID")} produk hukum</strong>{" "}
          dan{" "}
          <strong>{stats.total_pdf.toLocaleString("id-ID")} berkas PDF resmi</strong>{" "}
          langsung dari otoritas perundang-undangan, peradilan, fatwa ekonomi syariah, dan regulator keuangan syariah di Indonesia tanpa buku pribadi non-lembaga.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        {lembagaList.map((l) => (
          <article
            key={l.id}
            className="flex flex-col justify-between rounded-2xl border border-[#e4e0d5] bg-white p-5 shadow-2xs transition-all hover:border-[#0f3d2e]/40 hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
                    style={{ backgroundColor: l.warna_badge }}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8f651d]">
                      {l.kategori}
                    </span>
                    <h2 className="text-base font-extrabold leading-snug text-[#17231e]">
                      {l.nama}
                    </h2>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-[#52615b]">
                {l.deskripsi}
              </p>
            </div>

            <div className="mt-5 border-t border-[#efece3] pt-4">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#eaf3ef] px-2.5 py-1 font-bold text-[#0f3d2e]">
                  <BookOpen className="h-3.5 w-3.5" />
                  {l.jumlah_produk} Produk Hukum
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#fbf4e4] px-2.5 py-1 font-bold text-[#8f651d]">
                  <FileText className="h-3.5 w-3.5" />
                  {l.jumlah_pdf} PDF Resmi
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <a
                  href={l.situs_resmi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#52615b] hover:text-[#0f3d2e] hover:underline"
                >
                  Portal Resmi
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/pustaka-pdf?lembaga=${encodeURIComponent(l.id)}`}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#e4e0d5] px-3 py-1.5 text-xs font-bold text-[#17231e] hover:bg-[#f4f1e8]"
                  >
                    Lihat PDF
                  </Link>
                  <Link
                    href={`/?lembaga=${encodeURIComponent(l.id)}`}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#0f3d2e] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#09271d]"
                  >
                    Telusuri Katalog
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
