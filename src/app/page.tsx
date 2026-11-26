import { Suspense } from "react";
import {
  getAllProduk,
  getCatalogStats,
  getLembagaSummaries,
  getTabwibTree,
} from "@/lib/catalog";
import { TabwibExplorer } from "@/components/TabwibExplorer";

export default function HomePage() {
  const tree = getTabwibTree();
  const lembagaList = getLembagaSummaries();
  const stats = getCatalogStats();
  const allProduk = getAllProduk();

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-[#52615b]">
          Memuat Khazanah Hukum Islam &amp; Peradilan Agama...
        </div>
      }
    >
      <TabwibExplorer
        tree={tree}
        lembagaList={lembagaList}
        stats={stats}
        allProduk={allProduk}
      />
    </Suspense>
  );
}
