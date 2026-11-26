import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  Calendar,
  FileText,
  Gavel,
  Globe,
  Scale,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import type { JenisProdukHukum, ProdukHukum } from "@/types/catalog";

const JENIS_STYLE: Record<
  JenisProdukHukum,
  { label: string; bg: string; text: string; ring: string; icon: typeof Scale }
> = {
  kompilasi: {
    label: "Kompilasi (KHI/KHES)",
    bg: "bg-[#eaf3ef]",
    text: "text-[#0f3d2e]",
    ring: "ring-[#0f3d2e]/20",
    icon: BookOpen,
  },
  regulasi: {
    label: "Regulasi Resmi",
    bg: "bg-slate-100",
    text: "text-slate-800",
    ring: "ring-slate-300/70",
    icon: ShieldCheck,
  },
  fatwa: {
    label: "Fatwa DSN-MUI",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    ring: "ring-emerald-200",
    icon: ScrollText,
  },
  rumusan: {
    label: "Rumusan SEMA / MA",
    bg: "bg-[#fbf4e4]",
    text: "text-[#8f651d]",
    ring: "ring-[#b4842e]/30",
    icon: Scale,
  },
  putusan: {
    label: "Putusan PA / PTA",
    bg: "bg-teal-50",
    text: "text-teal-900",
    ring: "ring-teal-200",
    icon: Gavel,
  },
  pedoman: {
    label: "Pedoman & Kajian",
    bg: "bg-stone-100",
    text: "text-stone-700",
    ring: "ring-stone-300/70",
    icon: FileText,
  },
};

interface ProdukCardProps {
  item: ProdukHukum;
  babTitle?: string;
}

export function ProdukCard({ item, babTitle }: ProdukCardProps) {
  const st = JENIS_STYLE[item.jenis];
  const Icon = st.icon;

  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-[#e4e0d5] bg-white p-4 shadow-2xs transition-all hover:border-[#0f3d2e]/40 hover:shadow-md">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${st.bg} ${st.text} ${st.ring}`}
          >
            <Icon className="h-3 w-3" />
            {st.label}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums text-[#52615b]">
            <Calendar className="h-3 w-3 text-[#b4842e]" />
            {item.tahun}
          </span>
        </div>

        {item.nomor_dokumen && (
          <p className="mt-2 text-[11px] font-bold tracking-wide text-[#8f651d]">
            {item.nomor_dokumen}
          </p>
        )}

        <Link href={`/dokumen/${item.slug}`} className="mt-1 block">
          <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-[#17231e] transition-colors group-hover:text-[#0f3d2e]">
            {item.judul}
          </h3>
        </Link>

        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#52615b]">
          {item.ringkasan}
        </p>
      </div>

      <div className="mt-4 border-t border-[#efece3] pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#52615b]">
          <span className="inline-flex min-w-0 items-center gap-1 truncate font-medium">
            <Building2 className="h-3 w-3 shrink-0 text-[#0f3d2e]" />
            <span className="truncate">{item.lembaga_nama}</span>
          </span>
        </div>

        {babTitle && (
          <p className="mt-1 truncate text-[11px] text-[#74847d]">
            Bidang: {babTitle}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {item.pdf && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#eaf3ef] px-2 py-1 text-[11px] font-bold text-[#0f3d2e]">
                <FileText className="h-3 w-3" />
                {item.pdf.label_halaman || `Hal. ${item.pdf.halaman_mulai}`}
              </span>
            )}
            {item.artikel && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#fbf4e4] px-2 py-1 text-[11px] font-bold text-[#8f651d]">
                <Globe className="h-3 w-3" />
                Teks Langsung
              </span>
            )}
          </div>

          <Link
            href={`/dokumen/${item.slug}`}
            className="inline-flex items-center gap-1 rounded-lg bg-[#0f3d2e] px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-[#09271d]"
          >
            Baca Sekarang
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
