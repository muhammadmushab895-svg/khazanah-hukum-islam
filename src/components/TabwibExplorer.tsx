"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  Gavel,
  Scale,
  ScrollText,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type {
  CatalogStats,
  JenisProdukHukum,
  LembagaHukum,
  ProdukHukum,
  TabwibTreeNode,
} from "@/types/catalog";
import { ProdukCard } from "./ProdukCard";

interface LembagaWithCounts extends LembagaHukum {
  jumlah_produk: number;
  jumlah_pdf: number;
}

interface TabwibExplorerProps {
  tree: TabwibTreeNode[];
  lembagaList: LembagaWithCounts[];
  stats: CatalogStats;
  allProduk: ProdukHukum[];
}

const JENIS_OPTIONS: { value: JenisProdukHukum | "semua"; label: string }[] = [
  { value: "semua", label: "Semua Jenis" },
  { value: "kompilasi", label: "Kompilasi (KHI/KHES)" },
  { value: "putusan", label: "Putusan PA/PTA" },
  { value: "rumusan", label: "Rumusan SEMA MA" },
  { value: "fatwa", label: "Fatwa DSN-MUI" },
  { value: "regulasi", label: "Regulasi (UU/PERMA/POJK)" },
  { value: "pedoman", label: "Pedoman & Majalah" },
];

const QUICK_CHIPS = [
  "KHI",
  "KHES",
  "SEMA 2025",
  "Murabahah",
  "Harta Bersama",
  "Wakaf",
  "Wasiat Wajibah",
  "Cerai Gugat",
  "Qanun Jinayat",
  "Sukuk",
];

const PAGE_SIZE = 24;

export function TabwibExplorer({
  tree,
  lembagaList,
  stats,
  allProduk,
}: TabwibExplorerProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedTabwib, setSelectedTabwib] = useState(
    searchParams.get("tabwib") || ""
  );
  const [selectedLembaga, setSelectedLembaga] = useState(
    searchParams.get("lembaga") || ""
  );
  const [selectedJenis, setSelectedJenis] = useState<JenisProdukHukum | "semua">(
    (searchParams.get("jenis") as JenisProdukHukum | "semua") || "semua"
  );
  const [sortBy, setSortBy] = useState<"terbaru" | "terlama" | "judul" | "relevan">(
    "terbaru"
  );
  const [page, setPage] = useState(1);
  const [openKitabs, setOpenKitabs] = useState<Record<string, boolean>>({
    "01": true,
    "03": true,
    "06": true,
    "07": true,
  });

  useEffect(() => {
    const qParam = searchParams.get("q");
    const tParam = searchParams.get("tabwib");
    const lParam = searchParams.get("lembaga");
    const jParam = searchParams.get("jenis");
    if (qParam !== null) setQuery(qParam);
    if (tParam !== null) setSelectedTabwib(tParam);
    if (lParam !== null) setSelectedLembaga(lParam);
    if (jParam !== null) setSelectedJenis(jParam as JenisProdukHukum | "semua");
  }, [searchParams]);

  const babTitleMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const k of tree) {
      m.set(k.id, k.judul);
      for (const b of k.children) m.set(b.id, b.judul);
    }
    return m;
  }, [tree]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

    let list = allProduk.filter((item) => {
      if (selectedTabwib) {
        if (selectedTabwib.includes(".")) {
          if (item.tabwib_id !== selectedTabwib) return false;
        } else {
          if (!item.tabwib_id.startsWith(`${selectedTabwib}.`)) return false;
        }
      }
      if (selectedLembaga && item.lembaga_id !== selectedLembaga) return false;
      if (selectedJenis !== "semua" && item.jenis !== selectedJenis) return false;

      if (tokens.length > 0) {
        const hay = [
          item.judul,
          item.nomor_dokumen || "",
          item.ringkasan,
          item.lembaga_nama,
          babTitleMap.get(item.tabwib_id) || "",
          String(item.tahun),
          ...item.tag,
        ]
          .join(" ")
          .toLowerCase();
        for (const tok of tokens) {
          if (!hay.includes(tok)) return false;
        }
      }
      return true;
    });

    const effectiveSort = tokens.length > 0 && sortBy === "terbaru" ? "relevan" : sortBy;
    if (effectiveSort === "relevan" && tokens.length > 0) {
      list = [...list].sort((a, b) => {
        const score = (x: ProdukHukum) => {
          const t = `${x.judul} ${x.nomor_dokumen || ""}`.toLowerCase();
          let s = 0;
          if (t.includes(q)) s += 100;
          for (const tok of tokens) if (t.includes(tok)) s += 20;
          return s;
        };
        return score(b) - score(a) || b.tahun - a.tahun;
      });
    } else if (effectiveSort === "terlama") {
      list = [...list].sort((a, b) => a.tahun - b.tahun || a.judul.localeCompare(b.judul, "id"));
    } else if (effectiveSort === "judul") {
      list = [...list].sort((a, b) => a.judul.localeCompare(b.judul, "id"));
    } else {
      list = [...list].sort((a, b) => b.tahun - a.tahun || a.judul.localeCompare(b.judul, "id"));
    }
    return list;
  }, [allProduk, query, selectedTabwib, selectedLembaga, selectedJenis, sortBy, babTitleMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasActiveFilter = Boolean(
    query.trim() || selectedTabwib || selectedLembaga || selectedJenis !== "semua"
  );

  const resetFilters = () => {
    setQuery("");
    setSelectedTabwib("");
    setSelectedLembaga("");
    setSelectedJenis("semua");
    setPage(1);
  };

  return (
    <div>
      {/* Judicial Forest Hero Banner */}
      <section className="relative overflow-hidden border-b border-[#0a291f] bg-gradient-to-br from-[#0f3d2e] via-[#0c3225] to-[#072118] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 25%, #e5c07b 0%, transparent 45%), radial-gradient(circle at 85% 80%, #2d7a5e 0%, transparent 45%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e5c07b]/35 bg-[#e5c07b]/10 px-3 py-1 text-xs font-semibold text-[#f3d89f]">
              <Scale className="h-3.5 w-3.5" />
              <span>Repositori Digital Hukum Islam Positif &amp; Peradilan Agama RI</span>
            </div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
              Khazanah Kompilasi Hukum Islam, Ekonomi Syariah &amp; Putusan Peradilan Agama
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-emerald-100/90 sm:text-base">
              Akses terpadu <strong>KHI (Inpres 1/1991)</strong>, <strong>KHES (PERMA 2/2008)</strong>,{" "}
              <strong>{stats.total_fatwa} Fatwa &amp; Ta&apos;limat DSN-MUI</strong>, regulasi <strong>UU/PP/PERMA/POJK/BWI/Qanun Aceh</strong>,{" "}
              <strong>Rumusan Pleno Kamar Agama MA RI (2012–2025)</strong>, serta salinan resmi{" "}
              <strong>Putusan Pengadilan Agama &amp; PTA</strong> — 100% langsung tampil di aplikasi.
            </p>
          </div>

          {/* Search Input */}
          <div className="mt-6 max-w-3xl">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#52615b]" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari pasal KHI/KHES, nomor SEMA, fatwa DSN-MUI, POJK syariah, atau putusan PA/PTA..."
                className="w-full rounded-2xl border border-white/20 bg-white py-3.5 pr-11 pl-11 text-sm text-[#17231e] shadow-lg placeholder:text-[#6f7f78] focus:border-[#e5c07b] focus:outline-none focus:ring-2 focus:ring-[#e5c07b]/40"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setPage(1);
                  }}
                  className="absolute top-1/2 right-3.5 -translate-y-1/2 rounded-full p-1 text-[#52615b] hover:bg-slate-100"
                  aria-label="Hapus pencarian"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-emerald-200/80">
                Pencarian cepat:
              </span>
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setQuery(chip);
                    setPage(1);
                  }}
                  className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-50 transition-colors hover:border-[#e5c07b]/50 hover:bg-[#e5c07b]/20"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-200">
                <BookOpen className="h-4 w-4 text-[#e5c07b]" />
                <span>Total Produk Hukum</span>
              </div>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-white">
                {stats.total_produk.toLocaleString("id-ID")}
              </p>
              <p className="text-[11px] text-emerald-200/80">
                {stats.total_kitab} bidang · {stats.total_bab} sub-bab
              </p>
            </div>
            <Link
              href="/pustaka-pdf"
              className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xs transition-colors hover:bg-white/15"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-200">
                <FileText className="h-4 w-4 text-[#e5c07b]" />
                <span>Pustaka PDF Resmi</span>
              </div>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-white">
                {stats.total_pdf.toLocaleString("id-ID")}
              </p>
              <p className="text-[11px] text-emerald-200/80">
                Streaming langsung di aplikasi
              </p>
            </Link>
            <button
              type="button"
              onClick={() => {
                setSelectedJenis("putusan");
                setPage(1);
              }}
              className="rounded-2xl border border-white/15 bg-white/10 p-4 text-left backdrop-blur-xs transition-colors hover:bg-white/15"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-200">
                <Gavel className="h-4 w-4 text-[#e5c07b]" />
                <span>Putusan &amp; SEMA MA</span>
              </div>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-white">
                {(stats.total_putusan + stats.total_rumusan).toLocaleString("id-ID")}
              </p>
              <p className="text-[11px] text-emerald-200/80">
                {stats.total_putusan} Putusan · {stats.total_rumusan} Rumusan MA
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedJenis("fatwa");
                setPage(1);
              }}
              className="rounded-2xl border border-white/15 bg-white/10 p-4 text-left backdrop-blur-xs transition-colors hover:bg-white/15"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-200">
                <ScrollText className="h-4 w-4 text-[#e5c07b]" />
                <span>Fatwa DSN-MUI</span>
              </div>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-white">
                {stats.total_fatwa.toLocaleString("id-ID")}
              </p>
              <p className="text-[11px] text-emerald-200/80">
                Fatwa, Ta&apos;limat &amp; Pedoman Resmi
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Tabwib Sidebar */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-20 rounded-2xl border border-[#e4e0d5] bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#efece3] pb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0f3d2e]">
                  <Filter className="h-4 w-4 text-[#b4842e]" />
                  <span>Tabwib Hukum Islam</span>
                </div>
                {selectedTabwib && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTabwib("");
                      setPage(1);
                    }}
                    className="text-xs font-semibold text-[#8f651d] hover:underline"
                  >
                    Semua
                  </button>
                )}
              </div>

              <div className="mt-3 max-h-[68vh] space-y-1.5 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTabwib("");
                    setPage(1);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition-colors ${
                    selectedTabwib === ""
                      ? "bg-[#0f3d2e] text-white"
                      : "text-[#17231e] hover:bg-[#eaf3ef]"
                  }`}
                >
                  <span>Seluruh Bidang (8 Kitab)</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] tabular-nums ${
                      selectedTabwib === ""
                        ? "bg-white/20 text-white"
                        : "bg-[#f1eee6] text-[#52615b]"
                    }`}
                  >
                    {stats.total_produk}
                  </span>
                </button>

                {tree.map((kitab) => {
                  const isOpen = !!openKitabs[kitab.id];
                  const isKitabSelected = selectedTabwib === kitab.id;
                  return (
                    <div
                      key={kitab.id}
                      className="rounded-xl border border-[#efece3] bg-[#faf8f4]/70"
                    >
                      <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTabwib(kitab.id);
                            setOpenKitabs((prev) => ({ ...prev, [kitab.id]: true }));
                            setPage(1);
                          }}
                          className={`flex-1 rounded-lg px-2 py-1 text-left text-xs font-bold leading-snug transition-colors ${
                            isKitabSelected
                              ? "bg-[#0f3d2e] text-white"
                              : "text-[#17231e] hover:text-[#0f3d2e]"
                          }`}
                        >
                          <span className="mr-1.5 opacity-60">{kitab.kode}.</span>
                          {kitab.judul}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenKitabs((prev) => ({
                              ...prev,
                              [kitab.id]: !prev[kitab.id],
                            }))
                          }
                          className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-[10px] font-bold text-[#52615b] hover:bg-white"
                          aria-label={`Buka sub-bab ${kitab.judul}`}
                        >
                          <span className="tabular-nums">{kitab.jumlah_produk}</span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>

                      {isOpen && (
                        <div className="space-y-0.5 border-t border-[#efece3] bg-white px-2 py-1.5 rounded-b-xl">
                          {kitab.children.map((bab) => {
                            const active = selectedTabwib === bab.id;
                            return (
                              <button
                                key={bab.id}
                                type="button"
                                onClick={() => {
                                  setSelectedTabwib(bab.id);
                                  setPage(1);
                                }}
                                className={`flex w-full items-start justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] leading-snug transition-colors ${
                                  active
                                    ? "bg-[#eaf3ef] font-bold text-[#0f3d2e]"
                                    : "text-[#52615b] hover:bg-[#faf8f4] hover:text-[#17231e]"
                                }`}
                              >
                                <span>{bab.judul}</span>
                                <span className="shrink-0 rounded bg-[#f1eee6] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-[#52615b]">
                                  {bab.jumlah_produk}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Right Catalog Results */}
          <div className="lg:col-span-8 xl:col-span-9">
            {/* Filter Controls Bar */}
            <div className="rounded-2xl border border-[#e4e0d5] bg-white p-4 shadow-2xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {JENIS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedJenis(opt.value);
                      setPage(1);
                    }}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                      selectedJenis === opt.value
                        ? "bg-[#0f3d2e] text-white shadow-2xs"
                        : "bg-[#f4f1e8] text-[#31423b] hover:bg-[#eaf3ef] hover:text-[#0f3d2e]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#efece3] pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#e4e0d5] bg-[#faf8f4] px-2.5 py-1.5 text-xs">
                    <Building2 className="h-3.5 w-3.5 text-[#b4842e]" />
                    <select
                      value={selectedLembaga}
                      onChange={(e) => {
                        setSelectedLembaga(e.target.value);
                        setPage(1);
                      }}
                      aria-label="Filter Lembaga Resmi"
                      className="bg-transparent font-semibold text-[#17231e] focus:outline-none"
                    >
                      <option value="">Semua Lembaga ({lembagaList.length})</option>
                      {lembagaList.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.singkatan} ({l.jumlah_produk})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#e4e0d5] bg-[#faf8f4] px-2.5 py-1.5 text-xs">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-[#0f3d2e]" />
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(
                          e.target.value as "terbaru" | "terlama" | "judul" | "relevan"
                        )
                      }
                      aria-label="Urutkan hasil"
                      className="bg-transparent font-semibold text-[#17231e] focus:outline-none"
                    >
                      <option value="terbaru">Terbaru</option>
                      <option value="terlama">Terlama</option>
                      <option value="judul">Abjad A–Z</option>
                      <option value="relevan">Paling Relevan</option>
                    </select>
                  </div>

                  {hasActiveFilter && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-[#fbf4e4] px-2.5 py-1.5 text-xs font-bold text-[#8f651d] hover:bg-amber-100"
                    >
                      <X className="h-3.5 w-3.5" />
                      Reset Filter
                    </button>
                  )}
                </div>

                <p className="text-xs font-medium text-[#52615b]">
                  Menampilkan{" "}
                  <strong className="text-[#0f3d2e]">
                    {filtered.length.toLocaleString("id-ID")}
                  </strong>{" "}
                  produk hukum
                  {selectedTabwib ? ` · ${babTitleMap.get(selectedTabwib)}` : ""}
                </p>
              </div>
            </div>

            {/* Cards Grid */}
            {pageItems.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-[#e4e0d5] bg-white p-12 text-center">
                <Scale className="mx-auto h-10 w-10 text-[#b4842e]/60" />
                <h3 className="mt-3 text-base font-bold text-[#17231e]">
                  Tidak ada dokumen yang cocok
                </h3>
                <p className="mt-1 text-xs text-[#52615b]">
                  Coba ubah kata kunci pencarian atau setel ulang filter bidang dan lembaga.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 rounded-xl bg-[#0f3d2e] px-4 py-2 text-xs font-bold text-white hover:bg-[#09271d]"
                >
                  Tampilkan Semua Produk Hukum
                </button>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                {pageItems.map((item) => (
                  <ProdukCard
                    key={item.id}
                    item={item}
                    babTitle={babTitleMap.get(item.tabwib_id)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e4e0d5] bg-white px-4 py-3 text-xs">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#e4e0d5] px-3 py-1.5 font-semibold text-[#17231e] hover:bg-[#f4f1e8] disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Sebelumnya
                </button>
                <span className="font-semibold tabular-nums text-[#52615b]">
                  Halaman <strong className="text-[#0f3d2e]">{safePage}</strong> dari{" "}
                  {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#e4e0d5] px-3 py-1.5 font-semibold text-[#17231e] hover:bg-[#f4f1e8] disabled:opacity-40"
                >
                  Berikutnya
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
