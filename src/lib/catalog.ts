import tabwibData from "@/data/tabwib.json";
import lembagaData from "@/data/lembaga.json";
import dokumenPdfData from "@/data/dokumen-pdf.json";

import p01 from "@/data/produk/01-khi-keluarga.json";
import p02 from "@/data/produk/02-waris-wakaf-zakat.json";
import p03 from "@/data/produk/03-khes-akad.json";
import p04 from "@/data/produk/04-fatwa-dsn-perbankan.json";
import p05 from "@/data/produk/05-pasar-modal-ojk-bi.json";
import p06 from "@/data/produk/06-rumusan-yurisprudensi.json";
import p07 from "@/data/produk/07-putusan-acara-pa.json";
import p08 from "@/data/produk/08-halal-haji-aceh.json";

import type {
  CatalogStats,
  DokumenPdf,
  JenisProdukHukum,
  LembagaHukum,
  ProdukHukum,
  TabwibNode,
  TabwibTreeNode,
} from "@/types/catalog";

const ALL_TABWIB = tabwibData as TabwibNode[];
const ALL_LEMBAGA = lembagaData as LembagaHukum[];
const ALL_DOKUMEN_PDF = dokumenPdfData as DokumenPdf[];
const ALL_PRODUK: ProdukHukum[] = [
  ...(p01 as ProdukHukum[]),
  ...(p02 as ProdukHukum[]),
  ...(p03 as ProdukHukum[]),
  ...(p04 as ProdukHukum[]),
  ...(p05 as ProdukHukum[]),
  ...(p06 as ProdukHukum[]),
  ...(p07 as ProdukHukum[]),
  ...(p08 as ProdukHukum[]),
];

const PRODUK_BY_ID = new Map<string, ProdukHukum>(
  ALL_PRODUK.map((item) => [item.id, item])
);
const PRODUK_BY_SLUG = new Map<string, ProdukHukum>(
  ALL_PRODUK.map((item) => [item.slug, item])
);
const PDF_BY_ID = new Map<string, DokumenPdf>(
  ALL_DOKUMEN_PDF.map((doc) => [doc.id, doc])
);
const TABWIB_BY_ID = new Map<string, TabwibNode>(
  ALL_TABWIB.map((node) => [node.id, node])
);
const LEMBAGA_BY_ID = new Map<string, LembagaHukum>(
  ALL_LEMBAGA.map((l) => [l.id, l])
);

export function getAllProduk(): ProdukHukum[] {
  return ALL_PRODUK;
}

export function getProdukBySlugOrId(key: string): ProdukHukum | undefined {
  return PRODUK_BY_SLUG.get(key) || PRODUK_BY_ID.get(key);
}

export function getAllDokumenPdf(): DokumenPdf[] {
  return ALL_DOKUMEN_PDF;
}

export function getDokumenPdfById(id: string): DokumenPdf | undefined {
  return PDF_BY_ID.get(id);
}

export function getAllLembaga(): LembagaHukum[] {
  return ALL_LEMBAGA;
}

export function getLembagaById(id: string): LembagaHukum | undefined {
  return LEMBAGA_BY_ID.get(id);
}

export function getTabwibNode(id: string): TabwibNode | undefined {
  return TABWIB_BY_ID.get(id);
}

export function getTabwibBreadcrumb(tabwibId: string): TabwibNode[] {
  const node = TABWIB_BY_ID.get(tabwibId);
  if (!node) return [];
  if (node.parent_id) {
    const parent = TABWIB_BY_ID.get(node.parent_id);
    return parent ? [parent, node] : [node];
  }
  return [node];
}

export function getTabwibTree(): TabwibTreeNode[] {
  const counts = new Map<string, number>();
  for (const item of ALL_PRODUK) {
    counts.set(item.tabwib_id, (counts.get(item.tabwib_id) || 0) + 1);
    const bab = TABWIB_BY_ID.get(item.tabwib_id);
    if (bab?.parent_id) {
      counts.set(bab.parent_id, (counts.get(bab.parent_id) || 0) + 1);
    }
  }

  const roots = ALL_TABWIB.filter((n) => n.level === 1).sort(
    (a, b) => a.urutan - b.urutan
  );
  return roots.map((root) => {
    const children = ALL_TABWIB.filter((n) => n.parent_id === root.id)
      .sort((a, b) => a.urutan - b.urutan)
      .map((child) => ({
        ...child,
        jumlah_produk: counts.get(child.id) || 0,
        children: [],
      }));
    return {
      ...root,
      jumlah_produk: counts.get(root.id) || 0,
      children,
    };
  });
}

export function getCatalogStats(): CatalogStats {
  const kitabCount = ALL_TABWIB.filter((n) => n.level === 1).length;
  const babCount = ALL_TABWIB.filter((n) => n.level === 2).length;
  return {
    total_produk: ALL_PRODUK.length,
    total_kitab: kitabCount,
    total_bab: babCount,
    total_pdf: ALL_DOKUMEN_PDF.length,
    total_lembaga: ALL_LEMBAGA.length,
    total_putusan: ALL_PRODUK.filter((p) => p.jenis === "putusan").length,
    total_fatwa: ALL_PRODUK.filter((p) => p.jenis === "fatwa").length,
    total_rumusan: ALL_PRODUK.filter((p) => p.jenis === "rumusan").length,
    total_regulasi_kompilasi: ALL_PRODUK.filter(
      (p) => p.jenis === "regulasi" || p.jenis === "kompilasi"
    ).length,
    total_artikel: ALL_PRODUK.filter((p) => Boolean(p.artikel)).length,
  };
}

export function getProdukByDokumenPdfId(docId: string): ProdukHukum[] {
  return ALL_PRODUK.filter((p) => p.pdf?.dokumen_pdf_id === docId).sort(
    (a, b) => (a.pdf?.halaman_mulai || 1) - (b.pdf?.halaman_mulai || 1)
  );
}

export function getLembagaSummaries() {
  const prodCount = new Map<string, number>();
  const pdfCount = new Map<string, number>();
  for (const p of ALL_PRODUK) {
    prodCount.set(p.lembaga_id, (prodCount.get(p.lembaga_id) || 0) + 1);
  }
  for (const d of ALL_DOKUMEN_PDF) {
    pdfCount.set(d.lembaga_id, (pdfCount.get(d.lembaga_id) || 0) + 1);
  }
  return ALL_LEMBAGA.map((l) => ({
    ...l,
    jumlah_produk: prodCount.get(l.id) || 0,
    jumlah_pdf: pdfCount.get(l.id) || 0,
  }));
}

export interface ProdukFilterParams {
  q?: string;
  tabwib?: string;
  lembaga?: string;
  jenis?: JenisProdukHukum | "semua";
  mode?: "semua" | "pdf" | "artikel";
  sort?: "relevan" | "terbaru" | "terlama" | "judul";
  page?: number;
  limit?: number;
}

export function filterProduk(params: ProdukFilterParams) {
  const q = (params.q || "").trim().toLowerCase();
  const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
  const tabwib = (params.tabwib || "").trim();
  const lembaga = (params.lembaga || "").trim();
  const jenis = params.jenis && params.jenis !== "semua" ? params.jenis : null;
  const mode = params.mode && params.mode !== "semua" ? params.mode : null;

  let items = ALL_PRODUK.filter((item) => {
    if (tabwib) {
      if (tabwib.includes(".")) {
        if (item.tabwib_id !== tabwib) return false;
      } else {
        if (!item.tabwib_id.startsWith(`${tabwib}.`)) return false;
      }
    }
    if (lembaga && item.lembaga_id !== lembaga) return false;
    if (jenis && item.jenis !== jenis) return false;
    if (mode === "pdf" && !item.pdf) return false;
    if (mode === "artikel" && !item.artikel) return false;

    if (tokens.length > 0) {
      const hay = [
        item.judul,
        item.nomor_dokumen || "",
        item.ringkasan,
        item.lembaga_nama,
        String(item.tahun),
        ...(item.tag || []),
      ]
        .join(" ")
        .toLowerCase();
      for (const tok of tokens) {
        if (!hay.includes(tok)) return false;
      }
    }
    return true;
  });

  const sort = params.sort || (tokens.length > 0 ? "relevan" : "terbaru");
  if (sort === "terbaru") {
    items = [...items].sort((a, b) => b.tahun - a.tahun || a.judul.localeCompare(b.judul, "id"));
  } else if (sort === "terlama") {
    items = [...items].sort((a, b) => a.tahun - b.tahun || a.judul.localeCompare(b.judul, "id"));
  } else if (sort === "judul") {
    items = [...items].sort((a, b) => a.judul.localeCompare(b.judul, "id"));
  } else if (tokens.length > 0) {
    items = [...items].sort((a, b) => {
      const score = (x: ProdukHukum) => {
        const title = (x.judul + " " + (x.nomor_dokumen || "")).toLowerCase();
        let s = 0;
        if (title.includes(q)) s += 100;
        for (const t of tokens) {
          if (title.includes(t)) s += 20;
        }
        return s;
      };
      return score(b) - score(a) || b.tahun - a.tahun;
    });
  }

  const limit = Math.min(Math.max(params.limit || 24, 1), 100);
  const page = Math.max(params.page || 1, 1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const slice = items.slice((safePage - 1) * limit, safePage * limit);

  return {
    items: slice,
    total,
    page: safePage,
    limit,
    totalPages,
  };
}

export function getRelatedProduk(item: ProdukHukum, count = 6): ProdukHukum[] {
  return ALL_PRODUK.filter(
    (x) =>
      x.id !== item.id &&
      (x.tabwib_id === item.tabwib_id || x.lembaga_id === item.lembaga_id)
  )
    .sort((a, b) => {
      const sameBabA = a.tabwib_id === item.tabwib_id ? 1 : 0;
      const sameBabB = b.tabwib_id === item.tabwib_id ? 1 : 0;
      return sameBabB - sameBabA || b.tahun - a.tahun;
    })
    .slice(0, count);
}
