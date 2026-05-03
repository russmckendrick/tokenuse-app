import { getAllDocsPages, getDocsEntry, type DocsPageMeta } from "./docs";
import { getReleases, type Release } from "./releases";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL, absoluteSiteUrl } from "./seo";

export const READ_TOKENUSE_DOCS_SKILL_NAME = "read-tokenuse-docs";
export const READ_TOKENUSE_DOCS_SKILL_PATH = "/.well-known/agent-skills/read-tokenuse-docs/SKILL.md";

export function markdownHeaders(markdown: string): HeadersInit {
  return {
    "Content-Type": "text/markdown; charset=utf-8",
    "x-markdown-tokens": String(estimateMarkdownTokens(markdown)),
  };
}

function estimateMarkdownTokens(markdown: string): number {
  const compact = markdown.trim();
  if (!compact) return 0;

  return Math.max(1, Math.ceil(compact.split(/\s+/).length * 1.3));
}

function mdLink(label: string, pathOrUrl: string): string {
  return `[${label}](${absoluteSiteUrl(pathOrUrl)})`;
}

function releaseLabel(release: Release): string {
  const name = release.name.trim();
  if (!name || name.toLowerCase() === release.tag.toLowerCase()) return release.tag;
  if (name.toLowerCase().startsWith(`${release.tag.toLowerCase()} `)) return name;
  if (name.toLowerCase().startsWith(`${release.tag.toLowerCase()} - `)) return name;

  return `${release.tag} - ${name}`;
}

export function markdownTwinForPath(pathname: string): string {
  if (pathname === "/") return "/index.md";
  if (pathname === "/docs/") return "/docs/index.md";
  if (pathname === "/releases/") return "/releases/index.md";

  return `${pathname.replace(/\/$/, "")}.md`;
}

async function renderDocsItem(page: DocsPageMeta): Promise<string> {
  return `- ${mdLink(page.title, page.href)} - ${page.description} Markdown: ${mdLink("markdown", markdownTwinForPath(page.href))}`;
}

function renderReleaseItem(release: Release): string {
  const path = `/releases/${release.tag}/`;
  const date = release.publishedAt ? ` (${release.publishedAt.slice(0, 10)})` : "";
  return `- ${mdLink(releaseLabel(release), path)}${date}. Markdown: ${mdLink("markdown", markdownTwinForPath(path))}`;
}

export async function renderHomeMarkdown(): Promise<string> {
  const releases = await getReleases();
  const latest = releases.find((release) => !release.prerelease) ?? releases[0] ?? null;

  return [
    `# ${SITE_NAME}`,
    "",
    DEFAULT_DESCRIPTION,
    "",
    "## Primary Resources",
    "",
    `- ${mdLink("Documentation", "/docs/")} - Installation, usage, desktop app, and development docs.`,
    `- ${mdLink("Releases", "/releases/")} - Release notes from GitHub releases.`,
    `- ${mdLink("Sitemap", "/sitemap.xml")} - XML sitemap for crawlers and agents.`,
    `- ${mdLink("Agent content index", "/llms.txt")} - Markdown index of agent-readable pages.`,
    `- ${mdLink("Agent skills index", "/.well-known/agent-skills/index.json")} - Machine-readable skill discovery.`,
    "",
    "## Latest Release",
    "",
    latest
      ? `- ${mdLink(releaseLabel(latest), `/releases/${latest.tag}/`)}`
      : "- No releases are currently available.",
    "",
    "## Markdown Access",
    "",
    "Agents can send `Accept: text/markdown` to HTML pages on this site. HTML remains the default for browser requests.",
    "",
  ].join("\n");
}

export async function renderDocsIndexMarkdown(): Promise<string> {
  const items = await Promise.all((await getAllDocsPages()).map(renderDocsItem));

  return [
    "# Token Use Documentation",
    "",
    "Agent-readable index of Token Use documentation pages.",
    "",
    "## Pages",
    "",
    ...items,
    "",
  ].join("\n");
}

export async function renderDocsPageMarkdown(page: DocsPageMeta): Promise<string> {
  const entry = await getDocsEntry(page);
  const body = (entry.body ?? "").trim();

  return [
    `# ${page.title}`,
    "",
    page.description,
    "",
    `Canonical: ${absoluteSiteUrl(page.href)}`,
    "",
    body.startsWith("#") ? body.replace(/^# .+\n+/, "") : body,
    "",
  ].join("\n");
}

export async function renderReleasesIndexMarkdown(): Promise<string> {
  const releases = await getReleases();

  return [
    "# Token Use Releases",
    "",
    "Release notes for Token Use, pulled from GitHub releases with a checked-in fallback.",
    "",
    "## Releases",
    "",
    ...(releases.length > 0 ? releases.map(renderReleaseItem) : ["- No releases are currently available."]),
    "",
  ].join("\n");
}

export function renderReleaseMarkdown(release: Release): string {
  const published = release.publishedAt ? release.publishedAt.slice(0, 10) : "Unknown publication date";

  return [
    `# ${releaseLabel(release)}`,
    "",
    `Canonical: ${absoluteSiteUrl(`/releases/${release.tag}/`)}`,
    `Published: ${published}`,
    `GitHub: ${release.url}`,
    "",
    release.bodyMarkdown.trim() || "No release notes were published for this release.",
    "",
  ].join("\n");
}

export async function renderLlmsTxt(): Promise<string> {
  const releases = await getReleases();
  const docsItems = await Promise.all((await getAllDocsPages()).map(renderDocsItem));

  return [
    `# ${SITE_NAME}`,
    "",
    `> ${DEFAULT_DESCRIPTION}`,
    "",
    "## Core",
    "",
    `- ${mdLink("Home", "/")} - Product overview. Markdown: ${mdLink("markdown", "/index.md")}`,
    `- ${mdLink("Documentation", "/docs/")} - Full documentation index. Markdown: ${mdLink("markdown", "/docs/index.md")}`,
    `- ${mdLink("Releases", "/releases/")} - Release notes. Markdown: ${mdLink("markdown", "/releases/index.md")}`,
    "",
    "## Documentation",
    "",
    ...docsItems,
    "",
    "## Releases",
    "",
    ...(releases.length > 0 ? releases.slice(0, 20).map(renderReleaseItem) : ["- No releases are currently available."]),
    "",
    "## Agent Discovery",
    "",
    `- ${mdLink("Agent skills index", "/.well-known/agent-skills/index.json")}`,
    `- ${mdLink("Read Token Use docs skill", READ_TOKENUSE_DOCS_SKILL_PATH)}`,
    "",
  ].join("\n");
}

export async function renderReadTokenuseDocsSkill(): Promise<string> {
  return [
    "# Read Token Use Documentation",
    "",
    "Use this skill when you need to discover, read, summarize, cite, or troubleshoot Token Use documentation and releases.",
    "",
    "## Resources",
    "",
    `- Homepage: ${absoluteSiteUrl("/")}`,
    `- Documentation: ${absoluteSiteUrl("/docs/")}`,
    `- Releases: ${absoluteSiteUrl("/releases/")}`,
    `- Agent content index: ${absoluteSiteUrl("/llms.txt")}`,
    `- Sitemap: ${absoluteSiteUrl("/sitemap.xml")}`,
    "",
    "## Markdown Access",
    "",
    "Prefer markdown for agent reads. Send `Accept: text/markdown` to any HTML documentation or release page. The site also publishes direct markdown twins:",
    "",
    "- `/index.md` for the homepage",
    "- `/docs/index.md` for the docs index",
    "- `/docs/<path>.md` for individual docs pages",
    "- `/releases/index.md` for the release index",
    "- `/releases/<tag>.md` for individual release notes",
    "",
    "## Citation Guidance",
    "",
    "Use the canonical HTML URL when citing Token Use pages to humans. Use the markdown twin only while gathering context.",
    "",
    "## Content Usage Signals",
    "",
    "Token Use declares `ai-train=yes, search=yes, ai-input=yes` in robots.txt and response headers for public site content.",
    "",
  ].join("\n");
}

export async function renderAgentSkillsIndex(): Promise<string> {
  const skill = await renderReadTokenuseDocsSkill();
  const digest = await sha256Hex(skill);

  return `${JSON.stringify(
    {
      $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
      skills: [
        {
          name: READ_TOKENUSE_DOCS_SKILL_NAME,
          type: "skill-md",
          description: "How to discover, read, and cite Token Use documentation and release notes.",
          url: `${SITE_URL}${READ_TOKENUSE_DOCS_SKILL_PATH}`,
          digest: `sha256:${digest}`,
        },
      ],
    },
    null,
    2
  )}\n`;
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
