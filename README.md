# Khazanah Hukum Islam, Ekonomi Syariah & Peradilan Agama RI

Aplikasi web progresif (PWA) mandiri berbasis **Next.js 15** untuk menelusuri dan membaca langsung secara *full-online* repositori dokumen resmi hukum Islam positif, ekonomi syariah, dan peradilan agama di Indonesia.

## Cakupan 8 Pilar Lembaga Resmi (100% Dokumen Lembaga)

1. **Kompilasi Hukum Islam (KHI) & UU/PP RI** — Naskah utuh KHI (Inpres No. 1/1991, Buku I–III) terindeks per bab dan peraturan perundang-undangan resmi dari JDIH BPK RI.
2. **Kompilasi Hukum Ekonomi Syariah (KHES) & PERMA MA RI** — Naskah lengkap PERMA No. 2/2008 (Buku I–IV, 43 Bab, 796 Pasal) terindeks per bab serta PERMA terkait Ekonomi Syariah, Mediasi, Dispensasi Kawin, dan e-Court.
3. **Rumusan Pleno Kamar Agama (SEMA) & Yurisprudensi MA RI** — Kompilasi Resmi Rumusan Hasil Rapat Pleno Kamar Agama MA RI Tahun 2012–2025 (Cetakan ke-12, 2026), Kaidah Hukum Perdata Agama, dan Laporan Tahunan MA RI.
4. **Putusan Pengadilan Agama, PTA & Publikasi Ditjen Badilag MA RI** — Salinan resmi putusan banding PTA Palangka Raya, putusan PA/Mahkamah Syar'iyah, Buku II Pedoman Peradilan Agama Revisi 2013, Majalah Peradilan Agama, dan kajian hukum hakim PA.
5. **Dewan Syariah Nasional — MUI (DSN-MUI)** — Koleksi Fatwa DSN-MUI terbuka publik (No. 110–169, 2017–2026), Ta'limat (Surat Edaran), dan Pedoman Implementasi.
6. **Otoritas Jasa Keuangan (POJK/SEOJK), Bank Indonesia (PBI) & KNEKS** — Regulasi perbankan syariah, pasar modal syariah, asuransi syariah, serta publikasi resmi Bank Indonesia & KNEKS.
7. **Kementerian Agama RI (PMA), Badan Wakaf Indonesia (BWI), BPJPH & BPKH** — 29 regulasi perwakafan BWI, PMA Pencatatan Nikah & Zakat, regulasi Jaminan Produk Halal (BPJPH), dan Keuangan Haji (BPKH).
8. **Qanun Syariat Islam Aceh & Yurisdiksi Mahkamah Syar'iyah** — Qanun Hukum Jinayat (No. 6/2014 & Perubahan No. 12/2025), Pergub Hukum Acara Jinayat, Qanun LKS (No. 11/2018), Pokok-Pokok Syariat Islam, dan Baitul Mal dari JDIH Aceh.

## Fitur Utama

- **Tabwib Terstruktur:** 8 Kitab / 32 Sub-Bab terindeks penuh dengan pencarian cepat, filter jenis dokumen, dan filter 8 otoritas resmi.
- **Pembaca PDF Langsung di Aplikasi (PDF.js Canvas + Streaming Parsial):** Seluruh berkas PDF dialirkan secara daring melalui `/api/pdf-proxy` tanpa menyimpan berkas PDF besar di perangkat.
- **Indeks & Filter Per-PDF:** Lompat langsung ke halaman pasal KHI, KHES, Buku II Badilag, atau Rumusan SEMA Kamar Agama 2012–2025 dalam satu klik.
- **Live Article Reader:** Ekstraksi bersih artikel hukum & kaidah yurisprudensi resmi dari Kepaniteraan MA RI, Ditjen Badilag MA RI, dan Mahkamah Syar'iyah Aceh.

## Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.
