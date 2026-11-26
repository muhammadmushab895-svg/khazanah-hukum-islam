"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Search,
  X,
} from "lucide-react";
import type { DokumenPdf, JenisProdukHukum, LembagaHukum } from "@/types/catalog";

interface PdfWithIndexCount extends DokumenPdf {
  jumlah_indeks: number;
}

interface PustakaPdfExplorerProps {
  docs: PdfWithIndexCount[];
  lembagaList: LembagaHukum[];
}

const JENIS_OPTS: { value: JenisProdukHukum | "semua"; label: string }[] = [
  { value: "semua", label: "Semua PDF" },
  { value: "kompilasi", label: "Kompilasi (KHI/KHES)" },
  { value: "putusan", label: "Putusan PA/PTA" },
  { value: "rumusan", label: "Rumusan SEMA MA" },
  { value: "fatwa", label: "Fatwa DSN-MUI" },
  { value: "regulasi", label: "Regulasi (UU/PERMA/POJK)" },
  { value: "pedoman", label: "Pedoman & Majalah" },
];

const PAGE_SIZE = 24;

export function PustakaPdfExplorer({
  docs,
  lembagaList,
}: PustakaPdfExplorerProps) {
  const sp = useSearchParams();
  const [query, setQuery] = useState(sp.get("q") || "");
  const [selectedLembaga, setSelectedLembaga] = useState(sp.get("lembaga") || "");
  const [selectedJenis, setSelectedJenis] = useState<JenisProdukHukum | "semua">(
    (sp.get("jenis") as JenisProdukHukum | "semua") || "semua"
  );
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
    return docs
      .filter((d) => {
        if (selectedLembaga && d.lembaga_id !== selectedLembaga) return false;
        if (selectedJenis !== "semua" && d.jenis !== selectedJenis) return false;
        if (tokens.length > 0) {
          const hay =
            `${d.judul} ${d.subjudul} ${d.nomor_dokumen || ""} ${d.lembaga_nama} ${d.keterangan} ${d.tahun}`.toLowerCase();
          for (const t of tokens) if (!hay.includes(t)) return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          b.jumlah_indeks - a.jumlah_indeks ||
          b.tahun - a.tahun ||
          a.judul.localeCompare(b.judul, "id")
      );
  }, [docs, query, selectedLembaga, selectedJenis]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const items = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-gradient-to-br from-[#0f3d2e] to-[#08241b] p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5c07b]/35 bg-[#e5c07b]/15 px-3 py-1 text-xs font-bold text-[#f3d89f]">
              <FileText className="h-3.5 w-3.5" />
              Pustaka PDF Resmi Full-Online
            </span>
            <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">
              {docs.length.toLocaleString("id-ID")} Dokumen PDF Resmi Terverifikasi
            </h1>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-emerald-100/90 sm:text-sm">
              Seluruh dokumen — mulai dari naskah utuh KHI, KHES (PERMA 2/2008), Buku Kompilasi Rumusan Kamar MA 2026, koleksi Fatwa DSN-MUI, Putusan PA/PTA/MS, Regulasi OJK/BI/BWI/Kemenag, hingga Qanun Aceh — dibuka langsung di dalam aplikasi via streaming parsial.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-7">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#52615b]" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Cari judul PDF, nomor PERMA/SEMA/POJK, nomor Fatwa DSN-MUI, atau nomor Putusan..."
              className="w-full rounded-xl bg-white py-2.5 pr-9 pl-10 text-sm text-[#17231e] placeholder:text-[#6f7f78] focus:outline-none focus:ring-2 focus:ring-[#e5c07b]"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setPage(1);
                }}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-[#52615b]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="md:col-span-5">
            <select
              value={selectedLembaga}
              onChange={(e) => {
                setSelectedLembaga(e.target.value);
                setPage(1);
              }}
              aria-label="Filter Lembaga PDF"
              className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm font-semibold text-[#17231e] focus:outline-none focus:ring-2 focus:ring-[#e5c07b]"
            >
              <option value="">Semua Lembaga ({lembagaList.length})</option>
              {lembagaList.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.singkatan} — {l.nama}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {JENIS_OPTS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setSelectedJenis(opt.value);
                setPage(1);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedJenis === opt.value
                  ? "bg-[#e5c07b] text-[#09271d]"
                  : "bg-white/10 text-emerald-50 hover:bg-white/20"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs text-[#52615b]">
        <span>
          Menampilkan <strong className="text-[#0f3d2e]">{filtered.length}</strong> dokumen PDF
        </span>
        {(query || selectedLembaga || selectedJenis !== "semua") && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSelectedLembaga("");
              setSelectedJenis("semua");
              setPage(1);
            }}
            className="font-bold text-[#8f651d] hover:underline"
          >
            Reset Filter
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((doc) => (
          <article
            key={doc.id}
            className="flex flex-col justify-between rounded-2xl border border-[#e4e0d5] bg-white p-4 shadow-2xs transition-all hover:border-[#0f3d2e]/40 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="rounded-full bg-[#eaf3ef] px-2.5 py-0.5 font-bold text-[#0f3d2e]">
                  {doc.nomor_dokumen || doc.jenis.toUpperCase()}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-[#52615b]">
                  <Calendar className="h-3 w-3 text-[#b4842e]" />
                  {doc.tahun}
                </span>
              </div>

              <Link href={`/pdf/${doc.id}`} className="mt-2.5 block">
                <h2 className="line-clamp-2 text-sm font-bold leading-snug text-[#17231e] hover:text-[#0f3d2e]">
                  {doc.judul}
                </h2>
              </Link>
              <p className="mt-1.5 line-clamp-2 text-xs text-[#52615b]">
                {doc.subjudul}
              </p>
            </div>

            <div className="mt-4 border-t border-[#efece3] pt-3">
              <div className="flex items-center gap-1.5 text-[11px] text-[#52615b]">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-[#0f3d2e]" />
                <span className="truncate">{doc.lembaga_nama}</span>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                {doc.jumlah_indeks > 1 ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[#fbf4e4] px-2 py-1 text-[11px] font-bold text-[#8f651d]">
                    <BookOpen className="h-3 w-3" />
                    {doc.jumlah_indeks} indeks halaman
                  </span>
                ) : (
                  <span className="text-[11px] text-[#74847d]">
                    {doc.jumlah_halaman ? `${doc.jumlah_halaman} hlm.` : "PDF Resmi"}
                  </span>
                )}

                <div className="flex items-center gap-1.5">
                  <a
                    href={doc.url_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-[#e4e0d5] px-2.5 py-1.5 text-[11px] font-semibold text-[#31423b] hover:bg-[#f4f1e8]"
                    title="Buka PDF asli di tab baru"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <Link
                    href={`/pdf/${doc.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#0f3d2e] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#09271d]"
                  >
                    Baca PDF
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between rounded-2xl border border-[#e4e0d5] bg-white px-4 py-3 text-xs">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="inline-flex items-center gap-1 rounded-xl border border-[#e4e0d5] px-3 py-1.5 font-semibold disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Sebelumnya
          </button>
          <span className="font-semibold tabular-nums text-[#52615b]">
            Halaman <strong className="text-[#0f3d2e]">{safePage}</strong> / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => {
              setPage((p) => Math.min(totalPages, p + 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="inline-flex items-center gap-1 rounded-xl border border-[#e4e0d5] px-3 py-1.5 font-semibold disabled:opacity-40"
          >
            Berikutnya
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
