import * as cheerio from "cheerio";
import type { ProdukHukum } from "@/types/catalog";

export interface LiveArticlePayload {
  ok: boolean;
  item_id: string;
  title: string;
  source_name: string;
  source_url: string;
  published_date?: string;
  author?: string;
  content_html: string;
  fetched_at: string;
  error?: string;
}

const CACHE_TTL_MS = 30 * 60 * 1000;
const articleCache = new Map<string, { payload: LiveArticlePayload; expiresAt: number }>();

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function cleanFragmentHtml(rawHtml: string, baseOrigin: string): string {
  // Strip MS Word conditional comments & raw style blocks before loading
  const preCleaned = rawHtml
    .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "");

  const $ = cheerio.load(`<div id="__root">${preCleaned}</div>`);
  const root = $("#__root");

  root
    .find(
      "script, style, iframe, noscript, form, input, button, nav, header, footer, .share, .sharedaddy, .addtoany_share_save_container, .jp-relatedposts, .related-posts, .post-navigation, .pager, .pagination, .article-info, .icons, .tags, .author-box, .wp-block-buttons"
    )
    .remove();

  // Remove inline event handlers & ugly Word styles
  root.find("*").each((_, el) => {
    const node = $(el);
    const tag = el.type === "tag" ? el.tagName.toLowerCase() : "";
    const attrs = el.type === "tag" ? Object.keys(el.attribs || {}) : [];
    for (const attr of attrs) {
      if (
        attr.startsWith("on") ||
        attr === "style" ||
        attr === "class" ||
        attr === "id" ||
        attr === "width" ||
        attr === "height" ||
        attr.startsWith("data-")
      ) {
        node.removeAttr(attr);
      }
    }
    if (tag === "a") {
      const href = node.attr("href");
      if (href && href.startsWith("/")) {
        node.attr("href", `${baseOrigin}${href}`);
      }
      node.attr("target", "_blank");
      node.attr("rel", "noopener noreferrer");
    }
    if (tag === "img") {
      const src = node.attr("src");
      if (!src || src.startsWith("data:")) {
        node.remove();
      } else if (src.startsWith("/")) {
        node.attr("src", `${baseOrigin}${src}`);
      }
    }
  });

  // Remove empty paragraphs
  root.find("p, div, span").each((_, el) => {
    const node = $(el);
    if (!node.text().trim() && node.find("img, table").length === 0) {
      node.remove();
    }
  });

  return root.html()?.trim() || "";
}

export async function fetchLiveLegalArticle(
  item: ProdukHukum
): Promise<LiveArticlePayload> {
  const url = item.artikel?.url;
  const sourceName = item.artikel?.sumber_nama || item.lembaga_nama;

  if (!url) {
    return {
      ok: false,
      item_id: item.id,
      title: item.judul,
      source_name: sourceName,
      source_url: "",
      content_html: "",
      fetched_at: new Date().toISOString(),
      error: "Dokumen ini tidak memiliki tautan naskah web langsung (tersedia dalam format PDF resmi).",
    };
  }

  const cached = articleCache.get(item.id);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.payload;
  }

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.toLowerCase();

    let title = item.judul;
    let author: string | undefined;
    let publishedDate: string | undefined;
    let contentRaw = "";

    if (host.includes("ms-aceh.go.id")) {
      const slugMatch = parsedUrl.pathname.replace(/^\/+|\/+$/g, "").split("/").pop();
      if (slugMatch) {
        try {
          const wpRes = await fetch(
            `https://ms-aceh.go.id/wp-json/wp/v2/posts?slug=${encodeURIComponent(slugMatch)}`,
            { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(14000) }
          );
          if (wpRes.ok) {
            const wpJson = (await wpRes.json()) as Array<{
              title?: { rendered?: string };
              date?: string;
              content?: { rendered?: string };
            }>;
            if (Array.isArray(wpJson) && wpJson[0]?.content?.rendered) {
              if (wpJson[0].title?.rendered) {
                title = cheerio.load(wpJson[0].title.rendered).text().trim() || title;
              }
              publishedDate = wpJson[0].date?.slice(0, 10);
              author = "Mahkamah Syar'iyah Aceh";
              contentRaw = wpJson[0].content.rendered;
            }
          }
        } catch {
          // fallback to HTML parsing below
        }
      }
    }

    if (!contentRaw) {
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(18000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      if (host.includes("kepaniteraan.mahkamahagung.go.id")) {
        const h1 =
          $("h1[itemprop='headline'], .article-title, h1, h2.item-title")
            .first()
            .text()
            .trim();
        if (h1 && h1.length > 8) title = h1;
        author = $("[itemprop='author'] span, .createdby span").first().text().trim() || "Kepaniteraan Mahkamah Agung RI";
        publishedDate = $("time[itemprop='datePublished']").first().text().trim() || undefined;
        const body =
          $("[itemprop='articleBody'], section.article-content, .item-page .article-content, .com-content-article__body")
            .first();
        contentRaw = body.html() || "";
      } else if (host.includes("badilag.mahkamahagung.go.id")) {
        const h1 = $("h1, .article-title, .item-title").first().text().trim();
        if (h1 && h1.length > 8) title = h1;
        author = $(".createdby, .article-author").first().text().trim() || "Ditjen Badilag Mahkamah Agung RI";
        publishedDate = $("time, .published").first().text().trim() || undefined;
        const body = $(
          "[itemprop='articleBody'], .article-content, .item-page, article .entry-content, main article"
        ).first();
        contentRaw = body.html() || "";
      } else if (host.includes("ms-aceh.go.id")) {
        const h1 = $("h1.entry-title, h1.post-title, h1").first().text().trim();
        if (h1 && h1.length > 8) title = h1;
        author = "Mahkamah Syar'iyah Aceh";
        const body = $(".entry, .entry-content, article .post-content, main article").first();
        contentRaw = body.html() || "";
      } else {
        const h1 = $("h1").first().text().trim();
        if (h1 && h1.length > 8) title = h1;
        const body = $("article, main, .entry-content, .content").first();
        contentRaw = body.html() || "";
      }
    }

    const cleaned = cleanFragmentHtml(contentRaw, parsedUrl.origin);
    if (!cleaned || cleaned.replace(/<[^>]+>/g, "").trim().length < 60) {
      throw new Error("Konten artikel tidak dapat diekstrak secara lengkap.");
    }

    const payload: LiveArticlePayload = {
      ok: true,
      item_id: item.id,
      title,
      source_name: sourceName,
      source_url: url,
      published_date: publishedDate,
      author,
      content_html: cleaned,
      fetched_at: new Date().toISOString(),
    };

    if (articleCache.size > 150) {
      const firstKey = articleCache.keys().next().value;
      if (firstKey) articleCache.delete(firstKey);
    }
    articleCache.set(item.id, { payload, expiresAt: Date.now() + CACHE_TTL_MS });
    return payload;
  } catch (err) {
    return {
      ok: false,
      item_id: item.id,
      title: item.judul,
      source_name: sourceName,
      source_url: url,
      content_html: "",
      fetched_at: new Date().toISOString(),
      error:
        err instanceof Error
          ? `Portal sumber sedang lambat atau tidak merespons (${err.message}).`
          : "Gagal mengambil naskah langsung dari portal sumber.",
    };
  }
}
