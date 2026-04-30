import { getEntry, type CollectionEntry } from "astro:content";

export type DocsEntry = CollectionEntry<"tokenuseDocs">;

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
  {
    id: "development/tools/claude-code",
    entryId: "development/tools/claude-code",
    href: "/docs/development/tools/claude-code/",
    title: "Claude Code",
    navLabel: "Claude Code",
    eyebrow: "Tool parser",
    description: "Claude Code session paths, JSONL record shape, token mapping, and tool extraction.",
    level: 1,
  },
  {
    id: "development/tools/codex",
    entryId: "development/tools/codex",
    href: "/docs/development/tools/codex/",
    title: "Codex",
    navLabel: "Codex",
    eyebrow: "Tool parser",
    description: "Codex rollout validation, token-count deltas, rate-limit snapshots, and project detection.",
    level: 1,
  },
  {
    id: "development/tools/cursor",
    entryId: "development/tools/cursor",
    href: "/docs/development/tools/cursor/",
    title: "Cursor",
    navLabel: "Cursor",
    eyebrow: "Tool parser",
    description: "Cursor SQLite discovery, bubble and Agent KV parsing, estimation, and known limitations.",
    level: 1,
  },
  {
    id: "development/tools/copilot",
    entryId: "development/tools/copilot",
    href: "/docs/development/tools/copilot/",
    title: "GitHub Copilot",
    navLabel: "GitHub Copilot",
    eyebrow: "Tool parser",
    description: "Copilot CLI and VS Code transcript ingestion, model inference, and tool normalization.",
    level: 1,
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
  "development/tools/claude-code",
  "development/tools/codex",
  "development/tools/cursor",
  "development/tools/copilot",
];

function pagesFor(ids: string[]): DocsPageMeta[] {
  return ids.map((id) => getDocsPageById(id));
}

export const docsNavGroups: DocsNavGroup[] = [
  { label: "Guides", items: pagesFor(guideIds) },
  { label: "Development", items: pagesFor(developmentIds) },
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
