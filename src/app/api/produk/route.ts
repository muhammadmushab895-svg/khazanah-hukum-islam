import { NextRequest, NextResponse } from "next/server";
import { filterProduk } from "@/lib/catalog";
import type { JenisProdukHukum } from "@/types/catalog";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const result = filterProduk({
    q: sp.get("q") || undefined,
    tabwib: sp.get("tabwib") || undefined,
    lembaga: sp.get("lembaga") || undefined,
    jenis: (sp.get("jenis") as JenisProdukHukum | "semua") || undefined,
    mode: (sp.get("mode") as "semua" | "pdf" | "artikel") || undefined,
    sort: (sp.get("sort") as "relevan" | "terbaru" | "terlama" | "judul") || undefined,
    page: sp.get("page") ? Number(sp.get("page")) : 1,
    limit: sp.get("limit") ? Number(sp.get("limit")) : 24,
  });

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
