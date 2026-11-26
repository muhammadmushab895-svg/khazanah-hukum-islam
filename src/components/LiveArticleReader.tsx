"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ExternalLink,
  Globe,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
} from "lucide-react";
import type { LiveArticlePayload } from "@/lib/reader";

interface LiveArticleReaderProps {
  itemId: string;
  sourceUrl: string;
  sourceName: string;
}

export function LiveArticleReader({
  itemId,
  sourceUrl,
  sourceName,
}: LiveArticleReaderProps) {
  const [data, setData] = useState<LiveArticlePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState<number>(16);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reader?id=${encodeURIComponent(itemId)}`);
        const json = (await res.json()) as LiveArticlePayload;
        if (active) setData(json);
      } catch {
        if (active) {
          setData({
            ok: false,
            item_id: itemId,
            title: "",
            source_name: sourceName,
            source_url: sourceUrl,
            content_html: "",
            fetched_at: new Date().toISOString(),
            error: "Koneksi ke portal sumber terganggu.",
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [itemId, sourceName, sourceUrl, nonce]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e4e0d5] bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e4e0d5] bg-[#f7f5ee] px-5 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#0f3d2e]">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-600" />
          <Globe className="h-3.5 w-3.5 text-[#b4842e]" />
          <span>Teks Langsung dari {sourceName}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-[#e4e0d5] bg-white p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(13, s - 1))}
              className="rounded px-2 py-1 text-[#31423b] hover:bg-[#f4f1e8]"
              aria-label="Perkecil huruf"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="px-2 text-[11px] font-semibold tabular-nums text-[#31423b]">
              {fontSize}px
            </span>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(22, s + 1))}
              className="rounded px-2 py-1 text-[#31423b] hover:bg-[#f4f1e8]"
              aria-label="Perbesar huruf"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-[#0f3d2e] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#09271d]"
          >
            Buka Sumber
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-[#0f3d2e]" />
            <p className="text-sm font-semibold text-[#17231e]">
              Mengambil naskah resmi langsung dari {sourceName}...
            </p>
          </div>
        ) : !data?.ok ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-6 text-center">
            <AlertCircle className="h-7 w-7 text-[#b4842e]" />
            <p className="text-sm font-bold text-[#17231e]">
              Naskah Web Belum Dapat Dimuat Langsung
            </p>
            <p className="max-w-md text-xs text-[#52615b]">
              {data?.error || "Portal sumber sedang sibuk atau lambat merespons."}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setNonce((n) => n + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f3d2e] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#09271d]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Muat Ulang
              </button>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e0d5] bg-white px-3.5 py-2 text-xs font-semibold text-[#17231e] hover:bg-[#f4f1e8]"
              >
                Buka Portal Resmi
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <article>
            {(data.author || data.published_date) && (
              <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-[#e4e0d5] pb-3 text-xs text-[#52615b]">
                {data.author && (
                  <span>
                    Sumber/Penulis: <strong className="text-[#17231e]">{data.author}</strong>
                  </span>
                )}
                {data.published_date && <span>• {data.published_date}</span>}
              </div>
            )}
            <div
              className="legal-prose"
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{ __html: data.content_html }}
            />
          </article>
        )}
      </div>
    </div>
  );
}
