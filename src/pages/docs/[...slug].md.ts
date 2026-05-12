import type { APIRoute } from "astro";
import { markdownHeaders, renderDocsPageMarkdown } from "../../lib/agent-content";
import { getAllDocsPages, getDocsPageBySlug, slugForDocsPage, type DocsPageMeta } from "../../lib/docs";

export async function getStaticPaths() {
  const all = await getAllDocsPages();
  return all
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
  const page = (props as Props).page ?? await getDocsPageBySlug(params.slug);
  if (!page) return new Response("Not found\n", { status: 404 });

  const markdown = await renderDocsPageMarkdown(page);

  return new Response(markdown, {
    headers: markdownHeaders(markdown, { noindex: true }),
  });
}) satisfies APIRoute;
