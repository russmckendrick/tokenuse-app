import type { APIRoute } from "astro";
import sourceInfo from "../../.generated/tokenuse-docs/source.json";
import { docsPages } from "../lib/docs";
import { getReleases } from "../lib/releases";
import { absoluteSiteUrl } from "../lib/seo";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq: "weekly" | "monthly";
  priority: string;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function dateOnly(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

function renderUrl(entry: SitemapEntry): string {
  const loc = escapeXml(absoluteSiteUrl(entry.path));
  const lastmod = entry.lastmod ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : "";

  return `  <url>
    <loc>${loc}</loc>${lastmod}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
}

export const GET = (async () => {
  const releases = await getReleases();
  const docsLastMod = dateOnly(sourceInfo.generatedAt);
  const entries: SitemapEntry[] = [
    { path: "/", lastmod: docsLastMod, changefreq: "weekly", priority: "1.0" },
    ...docsPages.map((page) => ({
      path: page.href,
      lastmod: docsLastMod,
      changefreq: "monthly" as const,
      priority: page.href === "/docs/" ? "0.8" : "0.7",
    })),
    { path: "/releases/", changefreq: "weekly", priority: "0.7" },
    ...releases.map((release) => ({
      path: `/releases/${release.tag}/`,
      lastmod: dateOnly(release.publishedAt),
      changefreq: "monthly" as const,
      priority: "0.6",
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(renderUrl).join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}) satisfies APIRoute;
