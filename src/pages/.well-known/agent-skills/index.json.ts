import type { APIRoute } from "astro";
import { renderAgentSkillsIndex } from "../../../lib/agent-content";

export const GET = (async () => {
  const body = await renderAgentSkillsIndex();

  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}) satisfies APIRoute;
