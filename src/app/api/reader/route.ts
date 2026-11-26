import { NextRequest, NextResponse } from "next/server";
import { getProdukBySlugOrId } from "@/lib/catalog";
import { fetchLiveLegalArticle } from "@/lib/reader";

export const dynamic = "force-dynamic";
export const maxDuration = 25;
export const preferredRegion = "sin1";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Parameter id wajib diisi." },
      { status: 400 }
    );
  }

  const item = getProdukBySlugOrId(id);
  if (!item) {
    return NextResponse.json(
      { ok: false, error: "Dokumen hukum tidak ditemukan di katalog." },
      { status: 404 }
    );
  }

  const result = await fetchLiveLegalArticle(item);
  return NextResponse.json(result, {
    status: result.ok ? 200 : 502,
    headers: {
      "Cache-Control": result.ok
        ? "public, max-age=900, s-maxage=3600, stale-while-revalidate=86400"
        : "no-store",
    },
  });
}
