"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface PdfCanvasRendererProps {
  docId: string;
  originalUrl: string;
  pageNum: number;
  onPageChange: (page: number) => void;
  onTotalPagesLoaded?: (total: number) => void;
  onFallbackRequested?: () => void;
  fallbackLabel?: string;
  expanded?: boolean;
}

type PdfDocumentLike = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<{
    getViewport: (opts: { scale: number }) => { width: number; height: number };
    render: (opts: {
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
      canvas?: HTMLCanvasElement;
    }) => { promise: Promise<void>; cancel: () => void };
  }>;
  destroy: () => Promise<void>;
};

const RANGE_CHUNK_SIZE = 131072; // 128 KB edge-cached chunks for faster first page
const DIRECT_FETCH_THRESHOLD = 350_000; // <= 350 KB: single fetch; larger PDFs use edge-cached chunks
const clientMetaCache = new Map<string, { length: number; acceptRanges: boolean }>();

export function PdfCanvasRenderer({
  docId,
  originalUrl,
  pageNum,
  onPageChange,
  onTotalPagesLoaded,
  onFallbackRequested,
  fallbackLabel = "Coba Pratinjau Alternatif",
  expanded = false,
}: PdfCanvasRendererProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<PdfDocumentLike | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  const [docLoading, setDocLoading] = useState(true);
  const [pageRendering, setPageRendering] = useState(false);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [zoomFactor, setZoomFactor] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadInfo, setLoadInfo] = useState<string>("Menghubungkan ke server dokumen resmi...");
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let activeDoc: PdfDocumentLike | null = null;
    const abortControllers = new Set<AbortController>();

    async function loadDocument() {
      setDocLoading(true);
      setErrorMsg(null);
      setLoadInfo("Memeriksa dokumen PDF online...");

      try {
        const metaCtrl = new AbortController();
        abortControllers.add(metaCtrl);

        // Run pdfjs bundle import and metadata probe in parallel (eliminates waterfall)
        const cachedMeta = clientMetaCache.get(docId);
        type MetaRes = {
          ok: boolean;
          length: number;
          acceptRanges: boolean;
          error?: string;
        };
        const metaPromise: Promise<MetaRes> = cachedMeta
          ? Promise.resolve({ ok: true, ...cachedMeta })
          : fetch(`/api/pdf-proxy?doc=${encodeURIComponent(docId)}&meta=1`, {
              signal: metaCtrl.signal,
            }).then(async (res) => {
              if (!res.ok) {
                throw new Error(
                  `Dokumen belum merespons dari sumber resmi (HTTP ${res.status}).`
                );
              }
              return (await res.json()) as MetaRes;
            });
        const [pdfjs, meta] = await Promise.all([
          import("pdfjs-dist/legacy/build/pdf.mjs"),
          metaPromise,
        ]);
        abortControllers.delete(metaCtrl);

        if (!meta.ok) {
          throw new Error(meta.error || "Gagal memuat metadata PDF.");
        }
        clientMetaCache.set(docId, {
          length: meta.length,
          acceptRanges: meta.acceptRanges,
        });
        if (cancelled) return;

        const pdfjsVer = pdfjs.version || "6.5.438";
        // Load worker, cmaps, standard fonts, and wasm from fast global jsDelivr CDN (~118ms in ID vs slow origin)
        const cdnBase = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVer}`;
        pdfjs.GlobalWorkerOptions.workerSrc = `${cdnBase}/build/pdf.worker.min.mjs`;
        const cMapUrl = `${cdnBase}/cmaps/`;
        const standardFontDataUrl = `${cdnBase}/standard_fonts/`;
        const wasmUrl = `${cdnBase}/wasm/`;

        let loadingTask;

        if (meta.length > 0 && meta.length <= DIRECT_FETCH_THRESHOLD) {
          setLoadInfo(
            `Memuat dokumen (${Math.max(1, Math.round(meta.length / 1024))} KB)...`
          );
          const dataCtrl = new AbortController();
          abortControllers.add(dataCtrl);
          const dataRes = await fetch(
            `/api/pdf-proxy?doc=${encodeURIComponent(docId)}`,
            { signal: dataCtrl.signal }
          );
          abortControllers.delete(dataCtrl);
          if (!dataRes.ok) {
            throw new Error(`Gagal memuat berkas PDF (HTTP ${dataRes.status}).`);
          }
          const buf = new Uint8Array(await dataRes.arrayBuffer());
          if (cancelled) return;
          loadingTask = pdfjs.getDocument({
            data: buf,
            cMapUrl,
            cMapPacked: true,
            standardFontDataUrl,
            wasmUrl,
          });
        } else if (meta.length > 0 && meta.acceptRanges) {
          const mb = (meta.length / (1024 * 1024)).toFixed(1);
          setLoadInfo(`Streaming parsial cepat ${mb} MB...`);

          const MAX_SUB_CHUNK = RANGE_CHUNK_SIZE;
          const MAX_CONCURRENT = 4;
          const queue: (() => Promise<void>)[] = [];
          let activeCount = 0;

          const pumpQueue = () => {
            while (!cancelled && activeCount < MAX_CONCURRENT && queue.length > 0) {
              const job = queue.shift();
              if (!job) break;
              activeCount++;
              job().finally(() => {
                activeCount--;
                pumpQueue();
              });
            }
          };

          const enqueue = <T,>(task: () => Promise<T>): Promise<T> =>
            new Promise<T>((resolve, reject) => {
              queue.push(async () => {
                try {
                  resolve(await task());
                } catch (e) {
                  reject(e);
                }
              });
              pumpQueue();
            });

          const fetchSubChunk = (subStart: number, subEnd: number) =>
            enqueue(async () => {
              let lastErr: unknown = null;
              for (let attempt = 0; attempt < 3; attempt++) {
                if (cancelled) throw new Error("Cancelled");
                const ctrl = new AbortController();
                abortControllers.add(ctrl);
                const timer = setTimeout(() => ctrl.abort(), 14000);
                try {
                  // Use Edge-cacheable query params (?s=&e=) so Vercel CDN caches every chunk
                  const res = await fetch(
                    `/api/pdf-proxy?doc=${encodeURIComponent(docId)}&s=${subStart}&e=${subEnd - 1}`,
                    { signal: ctrl.signal }
                  );
                  if (!res.ok && res.status !== 206) {
                    throw new Error(`Chunk HTTP ${res.status}`);
                  }
                  const chunk = new Uint8Array(await res.arrayBuffer());
                  clearTimeout(timer);
                  abortControllers.delete(ctrl);
                  return chunk;
                } catch (err) {
                  clearTimeout(timer);
                  abortControllers.delete(ctrl);
                  lastErr = err;
                }
              }
              throw lastErr || new Error("Range sub-chunk failed");
            });

          class ProxyRangeTransport extends pdfjs.PDFDataRangeTransport {
            constructor(length: number) {
              super(length, null);
            }
            requestDataRange(begin: number, end: number) {
              const safeEnd = Math.min(end, meta.length);
              const totalLen = Math.max(0, safeEnd - begin);
              if (totalLen === 0) return;

              const parts: { offset: number; promise: Promise<Uint8Array> }[] = [];
              for (let pos = begin; pos < safeEnd; pos += MAX_SUB_CHUNK) {
                const subStart = pos;
                const subEnd = Math.min(pos + MAX_SUB_CHUNK, safeEnd);
                parts.push({
                  offset: subStart - begin,
                  promise: fetchSubChunk(subStart, subEnd),
                });
              }

              Promise.all(parts.map((p) => p.promise))
                .then((buffers) => {
                  if (cancelled) return;
                  if (buffers.length === 1) {
                    this.onDataRange(begin, buffers[0]);
                    return;
                  }
                  const assembled = new Uint8Array(totalLen);
                  for (let i = 0; i < buffers.length; i++) {
                    assembled.set(buffers[i], parts[i].offset);
                  }
                  this.onDataRange(begin, assembled);
                })
                .catch(() => {
                  if (!cancelled) this.abort();
                });
            }
          }

          const transport = new ProxyRangeTransport(meta.length);
          loadingTask = pdfjs.getDocument({
            range: transport,
            rangeChunkSize: RANGE_CHUNK_SIZE,
            disableAutoFetch: true,
            disableStream: true,
            cMapUrl,
            cMapPacked: true,
            standardFontDataUrl,
            wasmUrl,
          });
        } else {
          setLoadInfo("Mengalirkan dokumen PDF...");
          const dataCtrl = new AbortController();
          abortControllers.add(dataCtrl);
          const dataRes = await fetch(
            `/api/pdf-proxy?doc=${encodeURIComponent(docId)}`,
            { signal: dataCtrl.signal }
          );
          abortControllers.delete(dataCtrl);
          if (!dataRes.ok) {
            throw new Error(`Gagal memuat PDF (HTTP ${dataRes.status}).`);
          }
          const buf = new Uint8Array(await dataRes.arrayBuffer());
          if (cancelled) return;
          loadingTask = pdfjs.getDocument({
            data: buf,
            cMapUrl,
            cMapPacked: true,
            standardFontDataUrl,
            wasmUrl,
          });
        }

        const pdf = (await loadingTask.promise) as unknown as PdfDocumentLike;
        if (cancelled) {
          await pdf.destroy();
          return;
        }
        activeDoc = pdf;
        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        onTotalPagesLoaded?.(pdf.numPages);
        setDocLoading(false);
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Gagal memuat dokumen PDF dari sumber online."
        );
        setDocLoading(false);
      }
    }

    loadDocument();

    return () => {
      cancelled = true;
      for (const c of abortControllers) {
        try {
          c.abort();
        } catch {
          // ignore
        }
      }
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
      if (activeDoc) activeDoc.destroy().catch(() => {});
      pdfDocRef.current = null;
    };
  }, [docId, reloadNonce, onTotalPagesLoaded]);

  const renderCurrentPage = useCallback(async () => {
    const pdf = pdfDocRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!pdf || !canvas || !container) return;

    const safePage = Math.min(Math.max(1, pageNum), pdf.numPages);
    setPageRendering(true);

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // ignore
      }
    }

    try {
      const page = await pdf.getPage(safePage);
      const baseViewport = page.getViewport({ scale: 1 });
      const availableWidth = Math.max(300, container.clientWidth - 32);
      const fitScale = Math.min(2.2, availableWidth / baseViewport.width);
      const cssScale = fitScale * zoomFactor;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const cssViewport = page.getViewport({ scale: cssScale });
      const renderViewport = page.getViewport({ scale: cssScale * dpr });

      canvas.width = Math.floor(renderViewport.width);
      canvas.height = Math.floor(renderViewport.height);
      canvas.style.width = `${Math.floor(cssViewport.width)}px`;
      canvas.style.height = `${Math.floor(cssViewport.height)}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.direction = "ltr";

      const task = page.render({
        canvasContext: ctx,
        viewport: renderViewport,
        canvas,
      });
      renderTaskRef.current = task;
      await task.promise;

      container.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      if (
        err instanceof Error &&
        (err.name === "RenderingCancelledException" ||
          /cancelled/i.test(err.message))
      ) {
        return;
      }
    } finally {
      setPageRendering(false);
    }
  }, [pageNum, zoomFactor]);

  useEffect(() => {
    if (!docLoading && !errorMsg && totalPages > 0) {
      renderCurrentPage();
    }
  }, [docLoading, errorMsg, totalPages, renderCurrentPage]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!docLoading && !errorMsg && totalPages > 0) {
          renderCurrentPage();
        }
      }, 220);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (timer) clearTimeout(timer);
    };
  }, [docLoading, errorMsg, totalPages, renderCurrentPage]);

  const safePage =
    totalPages > 0 ? Math.min(Math.max(1, pageNum), totalPages) : pageNum;

  return (
    <div className="flex flex-col bg-[#e9e6dc]/75">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e4e0d5] bg-white px-3 py-2 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={docLoading || safePage <= 1}
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            className="inline-flex items-center gap-1 rounded-lg border border-[#e4e0d5] bg-white px-2.5 py-1.5 font-semibold text-[#17231e] hover:bg-[#f4f1e8] disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          <span className="rounded-lg bg-[#eaf3ef] px-3 py-1.5 font-bold tabular-nums text-[#0f3d2e]">
            Hal. {safePage}
            {totalPages > 0 ? ` / ${totalPages}` : ""}
          </span>

          <button
            type="button"
            disabled={docLoading || (totalPages > 0 && safePage >= totalPages)}
            onClick={() =>
              onPageChange(
                totalPages > 0 ? Math.min(totalPages, safePage + 1) : safePage + 1
              )
            }
            className="inline-flex items-center gap-1 rounded-lg border border-[#e4e0d5] bg-white px-2.5 py-1.5 font-semibold text-[#17231e] hover:bg-[#f4f1e8] disabled:opacity-40"
          >
            <span className="hidden sm:inline">Berikutnya</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {pageRendering && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0f3d2e]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Merender...
            </span>
          )}
          <div className="inline-flex items-center rounded-lg border border-[#e4e0d5] bg-white p-0.5">
            <button
              type="button"
              onClick={() =>
                setZoomFactor((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))
              }
              className="rounded px-2 py-1 text-[#31423b] hover:bg-[#f4f1e8]"
              aria-label="Perkecil zoom PDF"
              title="Perkecil"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomFactor(1)}
              className="rounded px-2 py-1 text-[11px] font-semibold tabular-nums text-[#31423b] hover:bg-[#f4f1e8]"
              title="Sesuaikan lebar"
            >
              {Math.round(zoomFactor * 100)}%
            </button>
            <button
              type="button"
              onClick={() =>
                setZoomFactor((z) => Math.min(2.2, Number((z + 0.15).toFixed(2))))
              }
              className="rounded px-2 py-1 text-[#31423b] hover:bg-[#f4f1e8]"
              aria-label="Perbesar zoom PDF"
              title="Perbesar"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`relative flex justify-center overflow-auto p-4 ${
          expanded ? "h-[82vh] min-h-[680px]" : "h-[74vh] min-h-[580px]"
        }`}
      >
        {docLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 self-center rounded-2xl border border-[#e4e0d5] bg-white px-8 py-10 text-center shadow-xs">
            <Loader2 className="h-8 w-8 animate-spin text-[#0f3d2e]" />
            <div>
              <p className="text-sm font-bold text-[#17231e]">
                Menampilkan Dokumen PDF di Dalam Aplikasi
              </p>
              <p className="mt-1 text-xs text-[#52615b]">{loadInfo}</p>
            </div>
          </div>
        ) : errorMsg ? (
          <div className="flex max-w-md flex-col items-center justify-center gap-3 self-center rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-xs">
            <AlertCircle className="h-8 w-8 text-[#b4842e]" />
            <div>
              <p className="text-sm font-bold text-[#17231e]">
                Dokumen PDF Gagal Dimuat Langsung
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#52615b]">
                {errorMsg}
              </p>
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setReloadNonce((n) => n + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f3d2e] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#09271d]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Coba Muat Ulang
              </button>
              {onFallbackRequested && (
                <button
                  type="button"
                  onClick={onFallbackRequested}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e0d5] bg-white px-3.5 py-2 text-xs font-semibold text-[#17231e] hover:bg-[#f4f1e8]"
                >
                  {fallbackLabel}
                </button>
              )}
              <a
                href={originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e0d5] bg-white px-3.5 py-2 text-xs font-semibold text-[#17231e] hover:bg-[#f4f1e8]"
              >
                PDF Asli
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <div className="relative my-auto">
            <canvas
              ref={canvasRef}
              dir="ltr"
              className="mx-auto block rounded-lg bg-white shadow-md ring-1 ring-black/10"
            />
          </div>
        )}
      </div>
    </div>
  );
}
