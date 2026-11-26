import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, FileText } from "lucide-react";
import {
  getDokumenPdfById,
  getProdukByDokumenPdfId,
  getTabwibNode,
} from "@/lib/catalog";
import { OnlinePdfViewer } from "@/components/OnlinePdfViewer";

export default async function PdfReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const doc = getDokumenPdfById(id);
  if (!doc) notFound();

  const initialPage = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const indexedEntries = getProdukByDokumenPdfId(doc.id).map((entry) => ({
    ...entry,
    tabwib_nama: getTabwibNode(entry.tabwib_id)?.judul || entry.tabwib_id,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#52615b]">
        <div className="flex items-center gap-3">
          <Link
            href="/pustaka-pdf"
            className="inline-flex items-center gap-1 font-semibold text-[#0f3d2e] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Pustaka PDF
          </Link>
          <span>•</span>
          <Link
            href={`/?lembaga=${encodeURIComponent(doc.lembaga_id)}`}
            className="inline-flex items-center gap-1 font-medium text-[#31423b] hover:text-[#0f3d2e] hover:underline"
          >
            <Building2 className="h-3.5 w-3.5 text-[#b4842e]" />
            {doc.lembaga_nama}
          </Link>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf3ef] px-2.5 py-0.5 font-bold text-[#0f3d2e]">
          <FileText className="h-3 w-3" />
          {doc.nomor_dokumen || `Tahun ${doc.tahun}`}
        </span>
      </div>

      <OnlinePdfViewer
        doc={doc}
        initialPage={initialPage}
        indexedEntries={indexedEntries}
      />

      {doc.keterangan && (
        <div className="mt-4 rounded-2xl border border-[#e4e0d5] bg-white p-4 text-xs leading-relaxed text-[#52615b]">
          <strong className="text-[#17231e]">Keterangan Dokumen: </strong>
          {doc.keterangan}
        </div>
      )}
    </div>
  );
}
