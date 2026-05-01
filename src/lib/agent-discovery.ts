export const CONTENT_SIGNAL = "ai-train=yes, search=yes, ai-input=yes";

interface LinkTarget {
  href: string;
  rel: string;
  type?: string;
  title?: string;
}

export const HOMEPAGE_AGENT_LINKS: LinkTarget[] = [
  {
    href: "/sitemap.xml",
    rel: "sitemap",
    type: "application/xml",
    title: "Token Use sitemap",
  },
  {
    href: "/llms.txt",
    rel: "describedby",
    type: "text/markdown",
    title: "Token Use agent content index",
  },
  {
    href: "/docs/",
    rel: "service-doc",
    type: "text/html",
    title: "Token Use documentation",
  },
  {
    href: "/docs/index.md",
    rel: "service-doc",
    type: "text/markdown",
    title: "Token Use documentation in Markdown",
  },
  {
    href: "/.well-known/agent-skills/index.json",
    rel: "describedby",
    type: "application/json",
    title: "Token Use agent skills index",
  },
];

function quoteHeaderValue(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

export function formatLinkHeader({ href, rel, type, title }: LinkTarget): string {
  const parameters = [`rel="${quoteHeaderValue(rel)}"`];

  if (type) parameters.push(`type="${quoteHeaderValue(type)}"`);
  if (title) parameters.push(`title="${quoteHeaderValue(title)}"`);

  return `<${href}>; ${parameters.join("; ")}`;
}

export function estimateMarkdownTokens(markdown: string): number {
  const compact = markdown.trim();
  if (!compact) return 0;

  return Math.max(1, Math.ceil(compact.split(/\s+/).length * 1.3));
}

export function appendVary(value: string | null, headerName: string): string {
  if (!value) return headerName;

  const headerNames = value.split(",").map((item) => item.trim().toLowerCase());
  if (headerNames.includes(headerName.toLowerCase())) return value;

  return `${value}, ${headerName}`;
}
