import { Suspense } from "react";
import {
  getAllDokumenPdf,
  getAllLembaga,
  getProdukByDokumenPdfId,
} from "@/lib/catalog";
import { PustakaPdfExplorer } from "@/components/PustakaPdfExplorer";

export default function PustakaPdfPage() {
  const docs = getAllDokumenPdf().map((d) => ({
    ...d,
    jumlah_indeks: getProdukByDokumenPdfId(d.id).length,
  }));
  const lembagaList = getAllLembaga();

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-[#52615b]">
          Memuat Pustaka PDF Resmi...
        </div>
      }
    >
      <PustakaPdfExplorer docs={docs} lembagaList={lembagaList} />
    </Suspense>
  );
}
