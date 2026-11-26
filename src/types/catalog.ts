export type JenisProdukHukum =
  | "kompilasi"
  | "regulasi"
  | "fatwa"
  | "rumusan"
  | "putusan"
  | "pedoman";

export type ModeAkses = "pdf" | "artikel" | "keduanya";

export interface TabwibNode {
  id: string;
  kode: string;
  judul: string;
  deskripsi?: string;
  level: 1 | 2;
  parent_id: string | null;
  urutan: number;
}

export interface TabwibTreeNode extends TabwibNode {
  jumlah_produk: number;
  children: TabwibTreeNode[];
}

export interface LembagaHukum {
  id: string;
  nama: string;
  singkatan: string;
  kategori: string;
  deskripsi: string;
  situs_resmi: string;
  warna_badge: string;
}

export interface DokumenPdf {
  id: string;
  judul: string;
  subjudul: string;
  lembaga_id: string;
  lembaga_nama: string;
  tahun: number;
  jenis: JenisProdukHukum;
  nomor_dokumen?: string;
  jumlah_halaman?: number;
  url_pdf: string;
  url_sumber: string;
  url_viewer_alt?: string;
  keterangan: string;
}

export interface ProdukHukum {
  id: string;
  slug: string;
  judul: string;
  nomor_dokumen?: string;
  ringkasan: string;
  tabwib_id: string;
  lembaga_id: string;
  lembaga_nama: string;
  tahun: number;
  jenis: JenisProdukHukum;
  mode_akses: ModeAkses;
  tag: string[];
  artikel?: {
    url: string;
    sumber_nama: string;
  };
  pdf?: {
    dokumen_pdf_id: string;
    halaman_mulai: number;
    halaman_selesai?: number;
    label_halaman?: string;
  };
}

export interface CatalogStats {
  total_produk: number;
  total_kitab: number;
  total_bab: number;
  total_pdf: number;
  total_lembaga: number;
  total_putusan: number;
  total_fatwa: number;
  total_rumusan: number;
  total_regulasi_kompilasi: number;
  total_artikel: number;
}
