"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ExternalLink,
  FileText,
  Filter,
  ListFilter,
  Maximize2,
  Minimize2,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import type { DokumenPdf, JenisProdukHukum, ProdukHukum } from "@/types/catalog";
import { PdfCanvasRenderer } from "./PdfCanvasRenderer";

interface IndexedEntry extends ProdukHukum {
  tabwib_nama: string;
}

interface OnlinePdfViewerProps {
  doc: DokumenPdf;
  initialPage?: number;
  highlightTitle?: string;
  indexedEntries?: IndexedEntry[];
  activeEntryId?: string;
}

const JENIS_LABELS: Record<JenisProdukHukum, string> = {
  kompilasi: "Kompilasi",
  regulasi: "Regulasi",
  fatwa: "Fatwa",
  rumusan: "Rumusan SEMA",
  putusan: "Putusan",
  pedoman: "Pedoman",
};

export function OnlinePdfViewer({
  doc,
  initialPage = 1,
  highlightTitle,
  indexedEntries = [],
  activeEntryId,
}: OnlinePdfViewerProps) {
  const [pageNum, setPageNum] = useState<number>(Math.max(1, initialPage));
  const [pageInput, setPageInput] = useState<string>(
    String(Math.max(1, initialPage))
  );
  const [detectedPages, setDetectedPages] = useState<number | undefined>(
    doc.jumlah_halaman
  );
  const [activeId, setActiveId] = useState<string | undefined>(activeEntryId);
  const [activeLabel, setActiveLabel] = useState<string | undefined>(
    highlightTitle
  );
  const [expanded, setExpanded] = useState(false);
  const [viewerMode, setViewerMode] = useState<"in_app" | "alt_embed" | "gdocs">(
    "in_app"
  );

  // Per-PDF Filter Sidebar
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedBab, setSelectedBab] = useState<string>("all");
  const [selectedJenis, setSelectedJenis] = useState<string>("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const hasMultiIndex = indexedEntries.length > 1;

  const babOptions = useMemo(() => {
    const map = new Map<string, { id: string; nama: string; count: number }>();
    for (const m of indexedEntries) {
      const ex = map.get(m.tabwib_id);
      if (ex) ex.count += 1;
      else map.set(m.tabwib_id, { id: m.tabwib_id, nama: m.tabwib_nama, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
  }, [indexedEntries]);

  const jenisOptions = useMemo(() => {
    const map = new Map<JenisProdukHukum, number>();
    for (const m of indexedEntries) {
      map.set(m.jenis, (map.get(m.jenis) || 0) + 1);
    }
    return Array.from(map.entries());
  }, [indexedEntries]);

  const filteredEntries = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    return indexedEntries.filter((m) => {
      if (selectedBab !== "all" && m.tabwib_id !== selectedBab) return false;
      if (selectedJenis !== "all" && m.jenis !== selectedJenis) return false;
      if (q) {
        const hay =
          `${m.judul} ${m.nomor_dokumen || ""} ${m.ringkasan} ${m.tabwib_nama} ${m.tag.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [indexedEntries, filterQuery, selectedBab, selectedJenis]);

  const jumpToPage = useCallback(
    (targetPage: number, item?: IndexedEntry) => {
      const maxP = detectedPages || 9999;
      const safe = Math.min(maxP, Math.max(1, targetPage));
      setPageNum(safe);
      setPageInput(String(safe));
      if (item) {
        setActiveId(item.id);
        setActiveLabel(item.judul);
      }
    },
    [detectedPages]
  );

  const handleManualJump = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pageInput, 10);
    if (!Number.isNaN(parsed) && parsed >= 1) jumpToPage(parsed);
  };

  const handleTotalPagesLoaded = useCallback((total: number) => {
    setDetectedPages(total);
  }, []);

  const altEmbedLabel = doc.url_viewer_alt?.includes("archive.org")
    ? "Pratinjau Arsip"
    : doc.url_viewer_alt?.includes("drive.google.com")
    ? "Pratinjau Drive"
    : "Pratinjau Alternatif";

  const fallbackIframeSrc = useMemo(() => {
    if (viewerMode === "alt_embed" && doc.url_viewer_alt) {
      if (doc.url_viewer_alt.includes("archive.org/embed/")) {
        const zeroIdx = Math.max(0, pageNum - 1);
        return `${doc.url_viewer_alt}#page/n${zeroIdx}/mode/1up`;
      }
      return doc.url_viewer_alt;
    }
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
      doc.url_pdf
    )}`;
  }, [viewerMode, doc.url_viewer_alt, doc.url_pdf, pageNum]);

  const totalPagesDisplay = detectedPages || doc.jumlah_halaman;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e4e0d5] bg-white shadow-xs">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e0d5] bg-[#f7f5ee] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0f3d2e] text-[#e5c07b]">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#17231e]">{doc.judul}</p>
            <p className="truncate text-[11px] text-[#52615b]">
              {doc.lembaga_nama}
              {totalPagesDisplay ? ` • ${totalPagesDisplay} halaman` : ""}
              {activeLabel ? ` • Fokus: ${activeLabel}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-[#e4e0d5] bg-white p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewerMode("in_app")}
              className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
                viewerMode === "in_app"
                  ? "bg-[#0f3d2e] text-white"
                  : "text-[#31423b] hover:bg-[#f4f1e8]"
              }`}
            >
              Baca Langsung
            </button>
            {doc.url_viewer_alt && (
              <button
                type="button"
                onClick={() => setViewerMode("alt_embed")}
                className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
                  viewerMode === "alt_embed"
                    ? "bg-[#0f3d2e] text-white"
                    : "text-[#31423b] hover:bg-[#f4f1e8]"
                }`}
              >
                {altEmbedLabel}
              </button>
            )}
            <button
              type="button"
              onClick={() => setViewerMode("gdocs")}
              className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
                viewerMode === "gdocs"
                  ? "bg-[#0f3d2e] text-white"
                  : "text-[#31423b] hover:bg-[#f4f1e8]"
              }`}
            >
              Google Viewer
            </button>
          </div>

          {viewerMode === "in_app" && (
            <form
              onSubmit={handleManualJump}
              className="inline-flex items-center gap-1 rounded-lg border border-[#e4e0d5] bg-white px-2 py-1 text-xs"
            >
              <span className="text-[#52615b]">Hal.</span>
              <input
                type="number"
                min={1}
                max={totalPagesDisplay || 9999}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                className="w-12 bg-transparent text-center font-bold text-[#17231e] focus:outline-none"
                aria-label="Nomor halaman PDF"
              />
              <button
                type="submit"
                className="rounded bg-[#eaf3ef] px-2 py-0.5 font-semibold text-[#0f3d2e] hover:bg-[#d5e8df]"
              >
                Lompat
              </button>
            </form>
          )}

          {hasMultiIndex && (
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                sidebarOpen
                  ? "border-[#0f3d2e]/30 bg-[#eaf3ef] text-[#0f3d2e]"
                  : "border-[#e4e0d5] bg-white text-[#31423b] hover:bg-[#f4f1e8]"
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              Daftar Isi ({indexedEntries.length})
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="inline-flex items-center gap-1 rounded-lg border border-[#e4e0d5] bg-white px-2.5 py-1.5 text-xs font-medium text-[#31423b] hover:bg-[#f4f1e8]"
            title={expanded ? "Kecilkan tampilan" : "Perlebar tampilan"}
          >
            {expanded ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>

          <a
            href={doc.url_pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-[#0f3d2e] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#09271d]"
          >
            PDF Asli
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Main Split: Per-PDF Filter Sidebar + PDF Canvas Stage */}
      <div
        className={`grid grid-cols-1 ${
          hasMultiIndex && sidebarOpen ? "lg:grid-cols-12" : ""
        }`}
      >
        {hasMultiIndex && sidebarOpen && (
          <aside className="flex flex-col border-b border-[#e4e0d5] bg-[#faf8f4] lg:col-span-4 lg:border-r lg:border-b-0">
            <div className="border-b border-[#e4e0d5] bg-white p-3.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#17231e]">
                  <Sparkles className="h-3.5 w-3.5 text-[#b4842e]" />
                  Indeks &amp; Filter dalam PDF Ini
                </div>
                <span className="rounded-full bg-[#eaf3ef] px-2 py-0.5 text-[11px] font-bold text-[#0f3d2e]">
                  {filteredEntries.length}/{indexedEntries.length}
                </span>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#74847d]" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Cari pasal, bab, atau SEMA di PDF ini..."
                  className="w-full rounded-lg border border-[#e4e0d5] bg-[#faf8f4] py-1.5 pr-7 pl-8 text-xs text-[#17231e] placeholder:text-[#7c8b84] focus:border-[#0f3d2e] focus:bg-white focus:outline-none"
                />
                {filterQuery && (
                  <button
                    type="button"
                    onClick={() => setFilterQuery("")}
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-[#74847d] hover:text-[#17231e]"
                    aria-label="Hapus pencarian"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {jenisOptions.length > 1 && (
                <div className="mt-2.5 flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedJenis("all")}
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                      selectedJenis === "all"
                        ? "bg-[#0f3d2e] text-white"
                        : "bg-[#f1eee6] text-[#31423b] hover:bg-[#e5e0d4]"
                    }`}
                  >
                    Semua
                  </button>
                  {jenisOptions.map(([jenis, count]) => (
                    <button
                      key={jenis}
                      type="button"
                      onClick={() => setSelectedJenis(jenis)}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                        selectedJenis === jenis
                          ? "bg-[#0f3d2e] text-white"
                          : "bg-[#f1eee6] text-[#31423b] hover:bg-[#e5e0d4]"
                      }`}
                    >
                      {JENIS_LABELS[jenis]} ({count})
                    </button>
                  ))}
                </div>
              )}

              {babOptions.length > 1 && (
                <div className="mt-2.5 flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 shrink-0 text-[#74847d]" />
                  <select
                    value={selectedBab}
                    onChange={(e) => setSelectedBab(e.target.value)}
                    aria-label="Filter berdasarkan Sub-Bab"
                    className="w-full rounded-lg border border-[#e4e0d5] bg-white px-2 py-1.5 text-xs text-[#31423b] focus:border-[#0f3d2e] focus:outline-none"
                  >
                    <option value="all">
                      Semua Bidang ({indexedEntries.length} bagian)
                    </option>
                    {babOptions.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nama} ({b.count})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div
              className={`divide-y divide-[#e4e0d5]/80 overflow-y-auto ${
                expanded ? "max-h-[780px]" : "max-h-[580px]"
              }`}
            >
              {filteredEntries.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#52615b]">
                  Tidak ada bagian yang cocok dengan filter di dokumen ini.
                </div>
              ) : (
                filteredEntries.map((m) => {
                  const targetPage = m.pdf?.halaman_mulai || 1;
                  const isActive =
                    activeId === m.id ||
                    (!activeId &&
                      pageNum === targetPage &&
                      m.id === filteredEntries[0]?.id);
                  return (
                    <div
                      key={m.id}
                      className={`p-3 transition-colors ${
                        isActive
                          ? "border-l-4 border-l-[#0f3d2e] bg-[#eaf3ef]/70"
                          : "hover:bg-white"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => jumpToPage(targetPage, m)}
                        className="w-full text-left focus:outline-none"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`text-xs font-bold leading-snug ${
                              isActive ? "text-[#0f3d2e]" : "text-[#17231e]"
                            }`}
                          >
                            {m.judul}
                          </span>
                          <span
                            className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                              isActive
                                ? "bg-[#0f3d2e] text-white"
                                : "bg-[#fbf4e4] text-[#8f651d]"
                            }`}
                          >
                            Hal. {targetPage}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-[#52615b]">
                          <span className="inline-flex items-center gap-1 truncate">
                            <BookOpen className="h-3 w-3 shrink-0 text-[#b4842e]" />
                            <span className="truncate">{m.tabwib_nama}</span>
                          </span>
                          <Link
                            href={`/dokumen/${m.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 font-semibold text-[#0f3d2e] hover:underline"
                          >
                            Detail
                          </Link>
                        </div>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}

        <div
          className={`relative bg-[#e9e6dc]/60 ${
            hasMultiIndex && sidebarOpen ? "lg:col-span-8" : "col-span-1"
          }`}
        >
          {viewerMode === "in_app" ? (
            <PdfCanvasRenderer
              docId={doc.id}
              originalUrl={doc.url_pdf}
              pageNum={pageNum}
              onPageChange={(p) => jumpToPage(p)}
              onTotalPagesLoaded={handleTotalPagesLoaded}
              onFallbackRequested={() =>
                setViewerMode(doc.url_viewer_alt ? "alt_embed" : "gdocs")
              }
              fallbackLabel={doc.url_viewer_alt ? `Coba ${altEmbedLabel}` : "Coba Google Viewer"}
              expanded={expanded}
            />
          ) : (
            <iframe
              key={`${viewerMode}-${pageNum}`}
              src={fallbackIframeSrc}
              title={`Pratinjau Online: ${doc.judul}`}
              className={`w-full border-0 bg-[#f7f5ee] ${
                expanded ? "h-[82vh] min-h-[680px]" : "h-[74vh] min-h-[580px]"
              }`}
              allow="fullscreen"
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e4e0d5] bg-[#f7f5ee] px-4 py-2 text-[11px] text-[#52615b]">
            <span>
              Halaman aktif: <strong className="text-[#17231e]">{pageNum}</strong>
              {totalPagesDisplay ? ` dari ${totalPagesDisplay}` : ""} • Streaming langsung dari sumber resmi tanpa unduhan permanen ke perangkat.
            </span>
            <a
              href={doc.url_sumber}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#0f3d2e] hover:underline"
            >
              Portal Sumber Resmi
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
