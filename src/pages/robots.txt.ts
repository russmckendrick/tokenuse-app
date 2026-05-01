import type { APIRoute } from "astro";
import { absoluteSiteUrl } from "../lib/seo";

export const GET = (() => {
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${absoluteSiteUrl("/sitemap.xml")}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}) satisfies APIRoute;
