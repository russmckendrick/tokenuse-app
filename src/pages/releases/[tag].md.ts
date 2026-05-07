import type { APIRoute } from "astro";
import { markdownHeaders, renderReleaseMarkdown } from "../../lib/agent-content";
import { getReleases, type Release } from "../../lib/releases";

export async function getStaticPaths() {
  const releases = await getReleases();

  return releases.map((release) => ({
    params: { tag: release.tag },
    props: { release },
  }));
}

interface Props {
  release: Release;
}

export const GET = (({ props }) => {
  const markdown = renderReleaseMarkdown((props as Props).release);

  return new Response(markdown, {
    headers: markdownHeaders(markdown, { noindex: true }),
  });
}) satisfies APIRoute;
