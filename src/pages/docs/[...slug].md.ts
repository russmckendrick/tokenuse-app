import type { APIRoute } from "astro";
import { markdownHeaders, renderDocsPageMarkdown } from "../../lib/agent-content";
import { docsPages, getDocsPageBySlug, slugForDocsPage, type DocsPageMeta } from "../../lib/docs";

export function getStaticPaths() {
  return docsPages
    .filter((page) => page.href !== "/docs/")
    .map((page) => ({
      params: { slug: slugForDocsPage(page) },
      props: { page },
    }));
}

interface Props {
  page: DocsPageMeta;
}

export const GET = (async ({ params, props }) => {
  const page = (props as Props).page ?? getDocsPageBySlug(params.slug);
  if (!page) return new Response("Not found\n", { status: 404 });

  const markdown = await renderDocsPageMarkdown(page);

  return new Response(markdown, {
    headers: markdownHeaders(markdown),
  });
}) satisfies APIRoute;
