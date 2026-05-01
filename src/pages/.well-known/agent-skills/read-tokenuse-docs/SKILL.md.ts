import type { APIRoute } from "astro";
import { markdownHeaders, renderReadTokenuseDocsSkill } from "../../../../lib/agent-content";

export const GET = (async () => {
  const markdown = await renderReadTokenuseDocsSkill();

  return new Response(markdown, {
    headers: markdownHeaders(markdown),
  });
}) satisfies APIRoute;
