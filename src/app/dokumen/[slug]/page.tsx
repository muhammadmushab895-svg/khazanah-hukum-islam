import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  ChevronRight,
  ExternalLink,
  FileText,
  Tag,
} from "lucide-react";
import {
  getDokumenPdfById,
  getProdukByDokumenPdfId,
  getProdukBySlugOrId,
  getRelatedProduk,
  getTabwibBreadcrumb,
  getTabwibNode,
} from "@/lib/catalog";
import { OnlinePdfViewer } from "@/components/OnlinePdfViewer";
import { LiveArticleReader } from "@/components/LiveArticleReader";
import { ProdukCard } from "@/components/ProdukCard";

export default async function DokumenDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getProdukBySlugOrId(slug);
  if (!item) notFound();

  const breadcrumb = getTabwibBreadcrumb(item.tabwib_id);
  const pdfDoc = item.pdf ? getDokumenPdfById(item.pdf.dokumen_pdf_id) : undefined;
  const indexedEntries = pdfDoc
    ? getProdukByDokumenPdfId(pdfDoc.id).map((entry) => ({
        ...entry,
        tabwib_nama: getTabwibNode(entry.tabwib_id)?.judul || entry.tabwib_id,
      }))
    : [];
  const related = getRelatedProduk(item, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-[#52615b]">
        <Link
          href="/"
          className="inline-flex items-center gap-1 font-semibold text-[#0f3d2e] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Beranda
        </Link>
        {breadcrumb.map((node) => (
          <span key={node.id} className="inline-flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-[#a7a293]" />
            <Link
              href={`/?tabwib=${encodeURIComponent(node.id)}`}
              className="hover:text-[#0f3d2e] hover:underline"
            >
              {node.judul}
            </Link>
          </span>
        ))}
      </nav>

      {/* Header Metadata Card */}
      <section className="rounded-3xl border border-[#e4e0d5] bg-white p-6 shadow-2xs sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#0f3d2e] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            {item.jenis}
          </span>
          {item.nomor_dokumen && (
            <span className="rounded-full bg-[#fbf4e4] px-3 py-1 text-xs font-bold text-[#8f651d] ring-1 ring-[#b4842e]/30">
              {item.nomor_dokumen}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f4f1e8] px-3 py-1 text-xs font-semibold text-[#31423b]">
            <Calendar className="h-3.5 w-3.5 text-[#b4842e]" />
            Tahun {item.tahun}
          </span>
        </div>

        <h1 className="mt-3 text-xl font-extrabold leading-snug text-[#17231e] sm:text-2xl">
          {item.judul}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-[#42524c]">
          {item.ringkasan}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#efece3] pt-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/?lembaga=${encodeURIComponent(item.lembaga_id)}`}
              className="inline-flex items-center gap-1.5 font-bold text-[#0f3d2e] hover:underline"
            >
              <Building2 className="h-4 w-4 text-[#b4842e]" />
              {item.lembaga_nama}
            </Link>
            {pdfDoc && (
              <Link
                href={`/pdf/${pdfDoc.id}?page=${item.pdf?.halaman_mulai || 1}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#eaf3ef] px-2.5 py-1 font-bold text-[#0f3d2e] hover:bg-[#d5e8df]"
              >
                <FileText className="h-3.5 w-3.5" />
                Mode Layar Penuh PDF ({item.pdf?.label_halaman || `Hal. ${item.pdf?.halaman_mulai || 1}`})
              </Link>
            )}
          </div>

          {(pdfDoc?.url_sumber || item.artikel?.url) && (
            <a
              href={item.artikel?.url || pdfDoc?.url_sumber}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#0f3d2e] hover:underline"
            >
              Buka Sumber Resmi
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {item.tag.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-[#8f651d]" />
            {item.tag.map((t) => (
              <Link
                key={t}
                href={`/?q=${encodeURIComponent(t)}`}
                className="rounded-lg bg-[#faf8f4] px-2.5 py-0.5 text-[11px] font-medium text-[#52615b] ring-1 ring-[#e4e0d5] hover:bg-[#eaf3ef] hover:text-[#0f3d2e]"
              >
                {t}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Primary In-App Viewer (PDF and/or Live Article Reader) */}
      <div className="mt-6 space-y-6">
        {pdfDoc && (
          <OnlinePdfViewer
            doc={pdfDoc}
            initialPage={item.pdf?.halaman_mulai || 1}
            highlightTitle={item.judul}
            indexedEntries={indexedEntries}
            activeEntryId={item.id}
          />
        )}

        {item.artikel && (
          <LiveArticleReader
            itemId={item.id}
            sourceUrl={item.artikel.url}
            sourceName={item.artikel.sumber_nama}
          />
        )}
      </div>

      {/* Related Legal Entries */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-extrabold text-[#0f3d2e]">
            Dokumen &amp; Putusan Terkait
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <ProdukCard
                key={r.id}
                item={r}
                babTitle={getTabwibNode(r.tabwib_id)?.judul}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
