import { getCollection, getEntry, type CollectionEntry } from "astro:content";

export type DocsEntry = CollectionEntry<"tokenuseDocs">;

const KNOWN_TOOL_META: Record<string, { navLabel: string; description: string }> = {
  "claude-code": {
    navLabel: "Claude Code",
    description: "Claude Code session paths, JSONL record shape, token mapping, and tool extraction.",
  },
  codex: {
    navLabel: "Codex",
    description: "Codex rollout validation, token-count deltas, rate-limit snapshots, and project detection.",
  },
  cursor: {
    navLabel: "Cursor",
    description: "Cursor SQLite discovery, bubble and Agent KV parsing, estimation, and known limitations.",
  },
  copilot: {
    navLabel: "GitHub Copilot",
    description: "Copilot CLI and VS Code transcript ingestion, model inference, and tool normalization.",
  },
  gemini: {
    navLabel: "Gemini",
    description: "Gemini CLI session discovery, JSON/JSONL chat parsing, token and thought tracking.",
  },
};

function toTitleCase(slug: string): string {
  return slug.replace(/-./g, (m) => " " + m[1].toUpperCase()).replace(/^./, (m) => m.toUpperCase());
}

function extractTitle(body: string | undefined, fallback: string): string {
  const match = body?.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

export interface DocsPageMeta {
  id: string;
  entryId: string;
  href: string;
  title: string;
  navLabel: string;
  eyebrow: string;
  description: string;
  level?: number;
}

export interface DocsNavGroup {
  label: string;
  items: DocsPageMeta[];
}

export const docsPages = [
  {
    id: "overview",
    entryId: "readme",
    href: "/docs/",
    title: "Documentation",
    navLabel: "Overview",
    eyebrow: "Start here",
    description: "The working manual for tokenuse: install it, use it, develop it, and follow project releases.",
  },
  {
    id: "guides/installation",
    entryId: "guides/installation",
    href: "/docs/guides/installation/",
    title: "Installation",
    navLabel: "Installation",
    eyebrow: "Guides",
    description: "Install the TUI and macOS desktop app from Homebrew, or download TUI release binaries.",
  },
  {
    id: "guides/tui-usage",
    entryId: "guides/tui-usage",
    href: "/docs/guides/tui-usage/",
    title: "TUI Usage",
    navLabel: "TUI usage",
    eyebrow: "Guides",
    description: "Navigate the dashboard, filters, keyboard shortcuts, config, session drill-down, Usage page, and export.",
  },
  {
    id: "guides/desktop-usage",
    entryId: "guides/desktop-usage",
    href: "/docs/guides/desktop-usage/",
    title: "Desktop App Usage",
    navLabel: "Desktop app usage",
    eyebrow: "Guides",
    description: "Use the Tauri desktop app for local refresh, filtering, config, session drill-down, and export.",
  },
  {
    id: "development",
    entryId: "development/readme",
    href: "/docs/development/",
    title: "Development",
    navLabel: "Overview",
    eyebrow: "Development",
    description: "Source layout and the maintainer docs to read before changing tokenuse.",
  },
  {
    id: "development/architecture",
    entryId: "development/architecture",
    href: "/docs/development/architecture/",
    title: "Architecture",
    navLabel: "Architecture",
    eyebrow: "Development",
    description: "Follow the local archive, ingestion, aggregation, pricing, export, and frontend data flow.",
  },
  {
    id: "development/local-development",
    entryId: "development/local-development",
    href: "/docs/development/local-development/",
    title: "Local Development",
    navLabel: "Local development",
    eyebrow: "Development",
    description: "Run the TUI, desktop app, checks, generated data refreshes, and no-download builds locally.",
  },
  {
    id: "development/source-control",
    entryId: "development/source-control",
    href: "/docs/development/source-control/",
    title: "Source Control",
    navLabel: "Source control",
    eyebrow: "Development",
    description: "Branch hygiene, generated files, docs boundaries, version bumps, and release-prep notes.",
  },
  {
    id: "development/deployments",
    entryId: "development/deployments",
    href: "/docs/development/deployments/",
    title: "Deployments",
    navLabel: "Deployments",
    eyebrow: "Development",
    description: "Release workflows, binary assets, macOS notarization, and Homebrew tap automation.",
  },
  {
    id: "development/tools",
    entryId: "development/tools/readme",
    href: "/docs/development/tools/",
    title: "Tool Ingestion",
    navLabel: "Tool parsers",
    eyebrow: "Development",
    description: "How tokenuse discovers, validates, parses, deduplicates, and prices local AI tool records.",
  },
] satisfies DocsPageMeta[];

const guideIds = ["overview", "guides/installation", "guides/tui-usage", "guides/desktop-usage"];
const developmentIds = [
  "development",
  "development/architecture",
  "development/local-development",
  "development/source-control",
  "development/deployments",
  "development/tools",
];

function pagesFor(ids: string[]): DocsPageMeta[] {
  return ids.map((id) => getDocsPageById(id));
}

export async function getToolDocsPages(): Promise<DocsPageMeta[]> {
  const entries = await getCollection("tokenuseDocs");
  return entries
    .filter((e) => e.id.startsWith("development/tools/") && e.id !== "development/tools/readme")
    .map((e) => {
      const slug = e.id.replace("development/tools/", "");
      const known = KNOWN_TOOL_META[slug];
      const displayName = known?.navLabel ?? extractTitle(e.body, toTitleCase(slug));
      return {
        id: `development/tools/${slug}`,
        entryId: e.id,
        href: `/docs/development/tools/${slug}/`,
        title: displayName,
        navLabel: displayName,
        eyebrow: "Tool parser",
        description: known?.description ?? `Parser documentation for ${displayName}.`,
        level: 1,
      } satisfies DocsPageMeta;
    });
}

export async function getAllDocsPages(): Promise<DocsPageMeta[]> {
  return [...docsPages, ...(await getToolDocsPages())];
}

export async function getDocsNavGroups(): Promise<DocsNavGroup[]> {
  const toolPages = await getToolDocsPages();
  return [
    { label: "Guides", items: pagesFor(guideIds) },
    { label: "Development", items: [...pagesFor(developmentIds), ...toolPages] },
    {
      label: "Project",
      items: [
        {
          id: "releases",
          entryId: "",
          href: "/releases/",
          title: "Releases",
          navLabel: "Releases",
          eyebrow: "GitHub",
          description: "Release notes are fetched from GitHub releases at build time.",
        },
      ],
    },
  ];
}

export const overviewCardIds = [
  "guides/installation",
  "guides/tui-usage",
  "guides/desktop-usage",
  "development",
  "development/tools",
] as const;

export function getDocsPageById(id: string): DocsPageMeta {
  const page = docsPages.find((item) => item.id === id);
  if (!page) throw new Error(`Unknown docs page id: ${id}`);
  return page;
}

export function getDocsPageBySlug(slug: string | undefined): DocsPageMeta | undefined {
  const href = slug ? `/docs/${slug.replace(/\/?$/, "/")}` : "/docs/";
  return docsPages.find((page) => page.href === href);
}

export function slugForDocsPage(page: DocsPageMeta): string | undefined {
  if (page.href === "/docs/") return undefined;
  return page.href.replace(/^\/docs\//, "").replace(/\/$/, "");
}

export async function getDocsEntry(page: DocsPageMeta): Promise<DocsEntry> {
  const entry = await getEntry("tokenuseDocs", page.entryId);
  if (!entry) {
    throw new Error(
      `Missing generated docs entry "${page.entryId}". Run pnpm run sync:docs and confirm TOKENUSE_SOURCE_DIR points at tokenuse.`
    );
  }

  return entry;
}
