import { NextResponse } from "next/server";
import { getCatalogStats, getLembagaSummaries, getTabwibTree } from "@/lib/catalog";

export async function GET() {
  return NextResponse.json(
    {
      tree: getTabwibTree(),
      lembaga: getLembagaSummaries(),
      stats: getCatalogStats(),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    }
  );
}
